import {
  MAX_CONTEXT_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
  MAX_RAW_EVIDENCE_LENGTH,
  isPanurgicPacketV1,
  sha256Hex,
  signingKeyFingerprint,
  stableStringify,
  verifyPacketIntegrity,
} from "./panurgic-contract.mjs";

export const CONTINUITY_BUNDLE_KIND = "panurgic-flow/continuity-bundle";
export const CONTINUITY_SCHEMA_VERSION = 1;
export const CONTINUITY_ATTESTATION_KIND = "panurgic-flow/continuity-signature";
export const CONTINUITY_ATTESTATION_ALGORITHM = "ECDSA-P256-SHA256";
export const MAX_CONTINUITY_BYTES = 4 * 1024 * 1024;
export const MAX_CONTINUITY_ENTRIES = 10;

const textEncoder = new TextEncoder();

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function bytesToBase64Url(value) {
  return btoa(String.fromCharCode(...new Uint8Array(value)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function base64UrlToBytes(value) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function boundedString(value, maximum, allowEmpty = false) {
  return typeof value === "string" && value.length <= maximum && (allowEmpty || value.trim().length > 0);
}

function continuityPayload(bundle) {
  const payload = { ...bundle };
  delete payload.integrity;
  delete payload.attestation;
  return payload;
}

function signaturePayload(bundle, attestation) {
  const sealedBundle = { ...bundle };
  delete sealedBundle.attestation;
  return {
    bundle: sealedBundle,
    attestation: {
      kind: CONTINUITY_ATTESTATION_KIND,
      algorithm: CONTINUITY_ATTESTATION_ALGORITHM,
      canonicalization: "panurgic-json-v1",
      publicKeyJwk: {
        kty: attestation.publicKeyJwk.kty,
        crv: attestation.publicKeyJwk.crv,
        x: attestation.publicKeyJwk.x,
        y: attestation.publicKeyJwk.y,
      },
      keyFingerprint: attestation.keyFingerprint,
    },
  };
}

function entryPayload(entry) {
  return {
    sequence: entry.sequence,
    versionId: entry.versionId,
    capturedAt: entry.capturedAt,
    packetDigest: entry.packetDigest,
    previousEntryDigest: entry.previousEntryDigest,
  };
}

function assertProjectRecord(project) {
  const form = isRecord(project?.form) ? project.form : null;
  if (
    !isRecord(project) ||
    !boundedString(project.id, 128) ||
    !boundedString(project.name, MAX_PROJECT_NAME_LENGTH) ||
    !form ||
    !boundedString(form.projectName, MAX_PROJECT_NAME_LENGTH, true) ||
    !boundedString(form.agentMix, MAX_CONTEXT_LENGTH, true) ||
    !boundedString(form.rawEvidence, MAX_RAW_EVIDENCE_LENGTH, true) ||
    !["goals", "technicalProof", "codexNotes", "workflow"]
      .every((key) => boundedString(form[key], MAX_CONTEXT_LENGTH, true)) ||
    !boundedString(project.createdAt, 64) ||
    !boundedString(project.updatedAt, 64)
  ) {
    throw new Error("A complete local project record is required for continuity export.");
  }
}

function isContinuityAttestation(value) {
  return (
    isRecord(value) &&
    value.kind === CONTINUITY_ATTESTATION_KIND &&
    value.algorithm === CONTINUITY_ATTESTATION_ALGORITHM &&
    value.canonicalization === "panurgic-json-v1" &&
    isRecord(value.publicKeyJwk) &&
    value.publicKeyJwk.kty === "EC" &&
    value.publicKeyJwk.crv === "P-256" &&
    /^[A-Za-z0-9_-]{43}$/u.test(String(value.publicKeyJwk.x ?? "")) &&
    /^[A-Za-z0-9_-]{43}$/u.test(String(value.publicKeyJwk.y ?? "")) &&
    /^[a-f0-9]{64}$/u.test(String(value.keyFingerprint ?? "")) &&
    /^[A-Za-z0-9_-]{80,160}$/u.test(String(value.signature ?? ""))
  );
}

export function isContinuityBundle(value) {
  return (
    isRecord(value) &&
    value.kind === CONTINUITY_BUNDLE_KIND &&
    value.schemaVersion === CONTINUITY_SCHEMA_VERSION &&
    isRecord(value.project) &&
    Array.isArray(value.entries)
  );
}

export async function buildContinuityBundle(project, versions, options = {}) {
  assertProjectRecord(project);
  if (!Array.isArray(versions)) throw new Error("Continuity versions must be an array.");
  if (versions.length > MAX_CONTINUITY_ENTRIES) {
    throw new Error(`Continuity bundles support at most ${MAX_CONTINUITY_ENTRIES} packet versions.`);
  }
  const ordered = [...versions].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const entries = [];
  const versionIds = new Set();
  let previousEntryDigest = null;
  for (const [index, version] of ordered.entries()) {
    if (
      !isRecord(version) ||
      !boundedString(version.id, 128) ||
      version.projectId !== project.id ||
      versionIds.has(version.id) ||
      !boundedString(version.createdAt, 64) ||
      !Number.isFinite(Date.parse(version.createdAt)) ||
      !isPanurgicPacketV1(version.packet, { allowIntegrity: true })
    ) {
      throw new Error(`Packet version ${index + 1} is not a valid PanurgicPacketV1 record.`);
    }
    const packetDigest = await sha256Hex(version.packet);
    const core = {
      sequence: index + 1,
      versionId: version.id,
      capturedAt: version.createdAt,
      packetDigest,
      previousEntryDigest,
    };
    const entryDigest = await sha256Hex(core);
    entries.push({ ...core, entryDigest, packet: version.packet });
    versionIds.add(version.id);
    previousEntryDigest = entryDigest;
  }
  const payload = {
    kind: CONTINUITY_BUNDLE_KIND,
    schemaVersion: CONTINUITY_SCHEMA_VERSION,
    createdAt: options.now ?? new Date().toISOString(),
    project,
    entries,
    headDigest: previousEntryDigest,
  };
  const digest = await sha256Hex(payload);
  const bundle = {
    ...payload,
    integrity: {
      algorithm: "SHA-256",
      canonicalization: "panurgic-json-v1",
      digest,
    },
  };
  if (textEncoder.encode(stableStringify(bundle)).byteLength > MAX_CONTINUITY_BYTES) {
    throw new Error("The continuity bundle exceeds the 4 MB portable archive limit.");
  }
  return bundle;
}

export async function signContinuityBundle(bundle, identity) {
  if (!identity?.privateKey || !identity?.publicKeyJwk) {
    throw new Error("A device signing identity is required.");
  }
  const unsigned = { ...bundle };
  delete unsigned.attestation;
  const verification = await verifyContinuityBundle(unsigned);
  if (verification.status === "modified") throw new Error(verification.reason);
  if (!unsigned.entries.length) throw new Error("Build at least one packet version before signing continuity.");
  const publicKeyJwk = {
    kty: identity.publicKeyJwk.kty,
    crv: identity.publicKeyJwk.crv,
    x: identity.publicKeyJwk.x,
    y: identity.publicKeyJwk.y,
  };
  const keyFingerprint = await signingKeyFingerprint(publicKeyJwk);
  if (identity.fingerprint && identity.fingerprint !== keyFingerprint) {
    throw new Error("The signing identity fingerprint does not match its public key.");
  }
  const attestation = {
    kind: CONTINUITY_ATTESTATION_KIND,
    algorithm: CONTINUITY_ATTESTATION_ALGORITHM,
    canonicalization: "panurgic-json-v1",
    publicKeyJwk,
    keyFingerprint,
  };
  const signature = await globalThis.crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    identity.privateKey,
    textEncoder.encode(stableStringify(signaturePayload(unsigned, attestation))),
  );
  const signed = { ...unsigned, attestation: { ...attestation, signature: bytesToBase64Url(signature) } };
  if (textEncoder.encode(stableStringify(signed)).byteLength > MAX_CONTINUITY_BYTES) {
    throw new Error("The signed continuity bundle exceeds the 4 MB portable archive limit.");
  }
  return signed;
}

export async function verifyContinuityBundle(value) {
  if (!isContinuityBundle(value)) {
    return { status: "modified", reason: "The file is not a Panurgic Flow continuity bundle." };
  }
  if (value.entries.length > MAX_CONTINUITY_ENTRIES) {
    return { status: "modified", reason: "The continuity bundle contains too many entries." };
  }
  if (textEncoder.encode(stableStringify(value)).byteLength > MAX_CONTINUITY_BYTES) {
    return { status: "modified", reason: "The continuity bundle exceeds the 4 MB limit." };
  }
  try {
    assertProjectRecord(value.project);
  } catch (error) {
    return { status: "modified", reason: error.message };
  }
  if (!boundedString(value.createdAt, 64) || !Number.isFinite(Date.parse(value.createdAt))) {
    return { status: "modified", reason: "The continuity archive timestamp is invalid." };
  }
  if (
    !isRecord(value.integrity) ||
    value.integrity.algorithm !== "SHA-256" ||
    value.integrity.canonicalization !== "panurgic-json-v1" ||
    !/^[a-f0-9]{64}$/iu.test(String(value.integrity.digest ?? ""))
  ) {
    return { status: "modified", reason: "The continuity bundle checksum is missing or unsupported." };
  }
  const expectedBundleDigest = await sha256Hex(continuityPayload(value));
  if (expectedBundleDigest !== value.integrity.digest.toLowerCase()) {
    return { status: "modified", reason: "The continuity bundle content does not match its checksum." };
  }
  let previousEntryDigest = null;
  let previousCapturedAt = Number.NEGATIVE_INFINITY;
  const versionIds = new Set();
  const packetStatuses = [];
  for (const [index, entry] of value.entries.entries()) {
    const capturedAt = Date.parse(entry?.capturedAt);
    if (
      !isRecord(entry) ||
      entry.sequence !== index + 1 ||
      !boundedString(entry.versionId, 128) ||
      versionIds.has(entry.versionId) ||
      !boundedString(entry.capturedAt, 64) ||
      !Number.isFinite(capturedAt) ||
      capturedAt < previousCapturedAt ||
      entry.previousEntryDigest !== previousEntryDigest ||
      !/^[a-f0-9]{64}$/iu.test(String(entry.packetDigest ?? "")) ||
      !/^[a-f0-9]{64}$/iu.test(String(entry.entryDigest ?? "")) ||
      !isPanurgicPacketV1(entry.packet, { allowIntegrity: true })
    ) {
      return { status: "modified", reason: `Continuity entry ${index + 1} is malformed or out of order.` };
    }
    const packetDigest = await sha256Hex(entry.packet);
    if (packetDigest !== entry.packetDigest.toLowerCase()) {
      return { status: "modified", reason: `Packet ${index + 1} does not match its continuity digest.` };
    }
    const entryDigest = await sha256Hex(entryPayload(entry));
    if (entryDigest !== entry.entryDigest.toLowerCase()) {
      return { status: "modified", reason: `Continuity link ${index + 1} does not match its digest.` };
    }
    const packetStatus = await verifyPacketIntegrity(entry.packet);
    if (packetStatus.status === "modified") {
      return { status: "modified", reason: `Packet ${index + 1} failed integrity verification: ${packetStatus.reason}` };
    }
    packetStatuses.push(packetStatus);
    versionIds.add(entry.versionId);
    previousCapturedAt = capturedAt;
    previousEntryDigest = entry.entryDigest;
  }
  if (
    value.headDigest !== previousEntryDigest ||
    (value.headDigest !== null && !/^[a-f0-9]{64}$/u.test(String(value.headDigest)))
  ) {
    return { status: "modified", reason: "The continuity head does not match the final chain entry." };
  }
  if (!value.entries.length) {
    return {
      status: "empty",
      reason: "The archive checksum is valid, but it contains no packet versions.",
      entryCount: 0,
      attestedEntries: 0,
      headDigest: null,
    };
  }
  const attestedEntries = packetStatuses.filter((entry) => entry.status === "attested").length;
  const latest = packetStatuses.at(-1);
  if (value.attestation !== undefined) {
    if (!isContinuityAttestation(value.attestation)) {
      return { status: "modified", reason: "The continuity archive signature metadata is invalid." };
    }
    try {
      const keyFingerprint = await signingKeyFingerprint(value.attestation.publicKeyJwk);
      if (keyFingerprint !== value.attestation.keyFingerprint) {
        return { status: "modified", reason: "The continuity signer fingerprint does not match its public key." };
      }
      const publicKey = await globalThis.crypto.subtle.importKey(
        "jwk",
        { ...value.attestation.publicKeyJwk, ext: true, key_ops: ["verify"] },
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["verify"],
      );
      const valid = await globalThis.crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        publicKey,
        base64UrlToBytes(value.attestation.signature),
        textEncoder.encode(stableStringify(signaturePayload(value, value.attestation))),
      );
      if (!valid) return { status: "modified", reason: "The continuity archive signature is invalid." };
      return {
        status: "attested",
        reason: "The ECDSA signature covers the complete checksum-verified hash chain and signer fingerprint.",
        entryCount: value.entries.length,
        attestedEntries,
        headDigest: value.headDigest,
        signerFingerprint: keyFingerprint,
        latestPacketAttested: latest?.status === "attested",
      };
    } catch {
      return { status: "modified", reason: "The continuity archive signature could not be verified." };
    }
  }
  return {
    status: "checksum",
    reason: latest?.status === "attested"
      ? "The hash-linked history is intact and its latest packet is signed, but the archive chain itself is not signer-attested."
      : "The hash-linked history is intact, but the archive chain is not signer-attested.",
    entryCount: value.entries.length,
    attestedEntries,
    headDigest: value.headDigest,
    latestPacketAttested: latest?.status === "attested",
  };
}

export function projectAndVersionsFromContinuityBundle(bundle) {
  if (!isContinuityBundle(bundle)) {
    throw new Error("The selected file is not a Panurgic Flow continuity bundle.");
  }
  return {
    project: bundle.project,
    versions: bundle.entries.map((entry) => ({
      id: entry.versionId,
      projectId: bundle.project.id,
      createdAt: entry.capturedAt,
      packet: entry.packet,
    })),
  };
}
