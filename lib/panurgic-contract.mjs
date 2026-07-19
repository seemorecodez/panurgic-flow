export const PACKET_KIND = "panurgic-flow/evidence-packet";
export const PACKET_SCHEMA_VERSION = 1;
export const FORGE_REQUEST_KIND = "panurgic-flow/forge-request";
export const MAX_PACKET_BYTES = 512 * 1024;
export const MAX_PROJECT_NAME_LENGTH = 120;
export const MAX_RAW_EVIDENCE_LENGTH = 50_000;
export const MAX_CONTEXT_LENGTH = 10_000;
export const MAX_ARTIFACT_LENGTH = 64_000;
export const MAX_LEDGER_ENTRIES = 50;

const ARTIFACT_KEYS = [
  "implementationSummary",
  "stakeholderWalkthrough",
  "verificationRunbook",
  "codexSkill",
];

const textEncoder = new TextEncoder();

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value, maximum, allowEmpty = false) {
  return (
    typeof value === "string" &&
    value.length <= maximum &&
    (allowEmpty || value.trim().length > 0)
  );
}

function boundedStringList(value, maximumItems, maximumLength) {
  return (
    Array.isArray(value) &&
    value.length <= maximumItems &&
    value.every((item) => boundedString(item, maximumLength))
  );
}

export function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const entries = Object.entries(value)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

export async function sha256Hex(value) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("SHA-256 is unavailable in this environment.");
  }
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    textEncoder.encode(typeof value === "string" ? value : stableStringify(value)),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function packetPayload(packet) {
  const payload = { ...packet };
  delete payload.integrity;
  return payload;
}

export async function sealPacket(packet) {
  if (!isPanurgicPacketV1(packet, { allowIntegrity: true })) {
    throw new Error("Only valid Panurgic Flow V1 packets can be sealed.");
  }
  const payload = packetPayload(packet);
  const digest = await sha256Hex(payload);
  return {
    ...payload,
    integrity: {
      algorithm: "SHA-256",
      canonicalization: "panurgic-json-v1",
      digest,
    },
  };
}

export async function verifyPacketIntegrity(packet) {
  if (!isPanurgicPacketV1(packet, { allowIntegrity: true })) {
    return { status: "modified", reason: "The packet does not match the V1 contract." };
  }
  if (!packet.integrity) {
    return { status: "unsigned", reason: "No integrity fingerprint is attached." };
  }
  if (
    packet.integrity.algorithm !== "SHA-256" ||
    packet.integrity.canonicalization !== "panurgic-json-v1" ||
    !/^[a-f0-9]{64}$/i.test(packet.integrity.digest)
  ) {
    return { status: "modified", reason: "The integrity metadata is unsupported or invalid." };
  }
  const expected = await sha256Hex(packetPayload(packet));
  return expected === packet.integrity.digest.toLowerCase()
    ? { status: "verified", reason: "The fingerprint matches this packet." }
    : { status: "modified", reason: "The packet changed after it was sealed." };
}

function isManifest(value) {
  return (
    isRecord(value) &&
    boundedString(value.thesis, MAX_ARTIFACT_LENGTH) &&
    boundedString(value.audience, MAX_CONTEXT_LENGTH) &&
    boundedString(value.codexRole, MAX_ARTIFACT_LENGTH) &&
    boundedString(value.gptRole, MAX_ARTIFACT_LENGTH) &&
    boundedStringList(value.evidence, 3, MAX_ARTIFACT_LENGTH) &&
    value.evidence.length === 3 &&
    boundedStringList(value.risks, 2, MAX_ARTIFACT_LENGTH) &&
    value.risks.length === 2 &&
    boundedStringList(value.verificationChecklist, 3, MAX_ARTIFACT_LENGTH) &&
    value.verificationChecklist.length === 3
  );
}

function isArtifacts(value) {
  return (
    isRecord(value) &&
    ARTIFACT_KEYS.every((key) => boundedString(value[key], MAX_ARTIFACT_LENGTH))
  );
}

function isClaimLedger(value) {
  return (
    Array.isArray(value) &&
    value.length <= MAX_LEDGER_ENTRIES &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        boundedString(entry.claim, MAX_ARTIFACT_LENGTH) &&
        boundedString(entry.source, MAX_ARTIFACT_LENGTH) &&
        (entry.status === "grounded" || entry.status === "review"),
    )
  );
}

function isProject(value) {
  return (
    isRecord(value) &&
    boundedString(value.name, MAX_PROJECT_NAME_LENGTH) &&
    boundedString(value.agentMix, MAX_CONTEXT_LENGTH, true) &&
    boundedString(value.goals, MAX_CONTEXT_LENGTH, true) &&
    boundedString(value.technicalProof, MAX_CONTEXT_LENGTH, true) &&
    boundedString(value.codexNotes, MAX_CONTEXT_LENGTH, true) &&
    boundedString(value.workflow, MAX_CONTEXT_LENGTH, true)
  );
}

function isEvidence(value) {
  return (
    isRecord(value) &&
    boundedString(value.raw, MAX_RAW_EVIDENCE_LENGTH, true) &&
    value.parserVersion === 1 &&
    isRecord(value.normalized) &&
    ["repository", "agent", "decisions", "patterns", "unrecognized"].every(
      (key) => boundedStringList(value.normalized[key], MAX_LEDGER_ENTRIES, MAX_CONTEXT_LENGTH),
    )
  );
}

export function isPanurgicPacketV1(value, options = {}) {
  if (!isRecord(value)) return false;
  const allowIntegrity = options.allowIntegrity !== false;
  const integrityValid =
    value.integrity === undefined ||
    (allowIntegrity &&
      isRecord(value.integrity) &&
      value.integrity.algorithm === "SHA-256" &&
      value.integrity.canonicalization === "panurgic-json-v1" &&
      boundedString(value.integrity.digest, 64));
  return (
    value.kind === PACKET_KIND &&
    value.schemaVersion === PACKET_SCHEMA_VERSION &&
    boundedString(value.packetId, 128) &&
    boundedString(value.createdAt, 64) &&
    boundedString(value.updatedAt, 64) &&
    isProject(value.project) &&
    isRecord(value.source) &&
    (value.source.type === "browser-local" || value.source.type === "codex-sdk") &&
    (value.source.model === null || boundedString(value.source.model, 128)) &&
    isEvidence(value.evidence) &&
    isManifest(value.manifest) &&
    isArtifacts(value.artifacts) &&
    isClaimLedger(value.claimLedger) &&
    integrityValid
  );
}

function legacyArtifacts(value) {
  const source = isRecord(value.artifacts) ? value.artifacts : value;
  return {
    implementationSummary:
      source.implementationSummary ?? source.readmeSection ?? "No implementation summary supplied.",
    stakeholderWalkthrough:
      source.stakeholderWalkthrough ?? source.demoScript ?? "No stakeholder walkthrough supplied.",
    verificationRunbook:
      source.verificationRunbook ?? source.judgeRunbook ?? "No verification runbook supplied.",
    codexSkill: source.codexSkill ?? source.skillMarkdown ?? "No Codex skill supplied.",
  };
}

function legacyManifest(value) {
  const manifest = isRecord(value.manifest)
    ? value.manifest
    : isRecord(value.artifacts?.manifest)
      ? value.artifacts.manifest
      : {};
  const checklist = manifest.verificationChecklist ?? manifest.nextMilestones;
  return {
    thesis: manifest.thesis ?? "Imported Panurgic Flow evidence packet.",
    audience: manifest.audience ?? "Engineering teams",
    codexRole: manifest.codexRole ?? "Codex role was not supplied.",
    gptRole: manifest.gptRole ?? "Model role was not supplied.",
    evidence: Array.isArray(manifest.evidence) && manifest.evidence.length === 3
      ? manifest.evidence
      : ["Imported packet", "Review source evidence", "Confirm generated claims"],
    risks: Array.isArray(manifest.risks) && manifest.risks.length === 2
      ? manifest.risks
      : ["Imported claims require review.", "Source completeness is unknown."],
    verificationChecklist: Array.isArray(checklist) && checklist.length === 3
      ? checklist
      : ["Inspect source evidence.", "Review each claim.", "Seal after approval."],
  };
}

function legacyProject(value) {
  const input = isRecord(value.input) ? value.input : isRecord(value.project) ? value.project : {};
  const name = input.projectName ?? input.name ?? value.project ?? "Imported project";
  return {
    name: String(name).slice(0, MAX_PROJECT_NAME_LENGTH) || "Imported project",
    agentMix: String(input.agentMix ?? "").slice(0, MAX_CONTEXT_LENGTH),
    goals: String(input.goals ?? "").slice(0, MAX_CONTEXT_LENGTH),
    technicalProof: String(input.technicalProof ?? "").slice(0, MAX_CONTEXT_LENGTH),
    codexNotes: String(input.codexNotes ?? "").slice(0, MAX_CONTEXT_LENGTH),
    workflow: String(input.workflow ?? "").slice(0, MAX_CONTEXT_LENGTH),
  };
}

export function normalizePacket(value, options = {}) {
  if (isPanurgicPacketV1(value, { allowIntegrity: true })) {
    return { packet: value, migrated: false };
  }
  if (!isRecord(value)) {
    throw new Error("The selected file is not a Panurgic Flow packet.");
  }
  const recognizableLegacyPacket =
    isRecord(value.manifest) ||
    isRecord(value.artifacts) ||
    value.version === "1.0.0" ||
    ["readmeSection", "demoScript", "judgeRunbook", "skillMarkdown"].some(
      (key) => typeof value[key] === "string",
    );
  if (!recognizableLegacyPacket) {
    throw new Error("The selected JSON is not a recognized Panurgic Flow packet.");
  }
  const project = legacyProject(value);
  const rawEvidence = String(value.input?.rawEvidence ?? value.evidence?.raw ?? "").slice(
    0,
    MAX_RAW_EVIDENCE_LENGTH,
  );
  const normalized = isRecord(value.evidence?.normalized)
    ? value.evidence.normalized
    : { repository: [], agent: [], decisions: [], patterns: [], unrecognized: [] };
  const sourceType = value.source === "codex-sdk" || value.source?.type === "codex-sdk"
    ? "codex-sdk"
    : "browser-local";
  const now = options.now ?? new Date().toISOString();
  const packet = {
    kind: PACKET_KIND,
    schemaVersion: PACKET_SCHEMA_VERSION,
    packetId: options.packetId ?? globalThis.crypto?.randomUUID?.() ?? `legacy-${Date.now()}`,
    createdAt: String(value.generatedAt ?? value.createdAt ?? now).slice(0, 64),
    updatedAt: now,
    project,
    source: {
      type: sourceType,
      model: value.model ?? value.source?.model ?? null,
    },
    evidence: {
      raw: rawEvidence,
      parserVersion: 1,
      normalized: {
        repository: Array.isArray(normalized.repository) ? normalized.repository.slice(0, MAX_LEDGER_ENTRIES) : [],
        agent: Array.isArray(normalized.agent) ? normalized.agent.slice(0, MAX_LEDGER_ENTRIES) : [],
        decisions: Array.isArray(normalized.decisions) ? normalized.decisions.slice(0, MAX_LEDGER_ENTRIES) : [],
        patterns: Array.isArray(normalized.patterns) ? normalized.patterns.slice(0, MAX_LEDGER_ENTRIES) : [],
        unrecognized: Array.isArray(normalized.unrecognized) ? normalized.unrecognized.slice(0, MAX_LEDGER_ENTRIES) : [],
      },
    },
    manifest: legacyManifest(value),
    artifacts: legacyArtifacts(value),
    claimLedger: Array.isArray(value.claimLedger)
      ? value.claimLedger.slice(0, MAX_LEDGER_ENTRIES)
      : [],
  };
  if (!isPanurgicPacketV1(packet, { allowIntegrity: true })) {
    throw new Error("The legacy packet could not be migrated safely.");
  }
  return { packet, migrated: true };
}

export function validateForgeRequest(value) {
  if (!isRecord(value)) throw new Error("Forge request must be a JSON object.");
  if (value.kind && value.kind !== FORGE_REQUEST_KIND) {
    throw new Error("Unsupported forge request kind.");
  }
  if (value.schemaVersion && value.schemaVersion !== PACKET_SCHEMA_VERSION) {
    throw new Error("Unsupported forge request version.");
  }
  if (!isRecord(value.evidence)) {
    throw new Error("Forge request must contain an evidence object.");
  }
  return value;
}
