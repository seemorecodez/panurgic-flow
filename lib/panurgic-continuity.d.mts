import type { FormState } from "./panurgic-core.mjs";
import type { PanurgicPacketV1, SigningIdentity } from "./panurgic-contract.mjs";
import type { ProjectRecord, VersionRecord } from "./panurgic-storage.mjs";

export const CONTINUITY_BUNDLE_KIND: "panurgic-flow/continuity-bundle";
export const CONTINUITY_SCHEMA_VERSION: 1;
export const CONTINUITY_ATTESTATION_KIND: "panurgic-flow/continuity-signature";
export const CONTINUITY_ATTESTATION_ALGORITHM: "ECDSA-P256-SHA256";
export const MAX_CONTINUITY_BYTES: number;
export const MAX_CONTINUITY_ENTRIES: number;

export type ContinuityEntry = {
  sequence: number;
  versionId: string;
  capturedAt: string;
  packetDigest: string;
  previousEntryDigest: string | null;
  entryDigest: string;
  packet: PanurgicPacketV1;
};

export type ContinuityBundleV1 = {
  kind: typeof CONTINUITY_BUNDLE_KIND;
  schemaVersion: 1;
  createdAt: string;
  project: { id: string; name: string; form: FormState; createdAt: string; updatedAt: string };
  entries: ContinuityEntry[];
  headDigest: string | null;
  integrity: { algorithm: "SHA-256"; canonicalization: "panurgic-json-v1"; digest: string };
  attestation?: {
    kind: typeof CONTINUITY_ATTESTATION_KIND;
    algorithm: typeof CONTINUITY_ATTESTATION_ALGORITHM;
    canonicalization: "panurgic-json-v1";
    publicKeyJwk: { kty: "EC"; crv: "P-256"; x: string; y: string };
    keyFingerprint: string;
    signature: string;
  };
};

export type ContinuityStatus = "attested" | "checksum" | "empty" | "modified";
export function isContinuityBundle(value: unknown): value is ContinuityBundleV1;
export function buildContinuityBundle(project: ProjectRecord, versions: VersionRecord[], options?: { now?: string }): Promise<ContinuityBundleV1>;
export function signContinuityBundle(bundle: ContinuityBundleV1, identity: SigningIdentity): Promise<ContinuityBundleV1>;
export function verifyContinuityBundle(value: unknown): Promise<{
  status: ContinuityStatus;
  reason: string;
  entryCount?: number;
  attestedEntries?: number;
  headDigest?: string | null;
  signerFingerprint?: string;
  latestPacketAttested?: boolean;
}>;
export function projectAndVersionsFromContinuityBundle(bundle: ContinuityBundleV1): { project: ProjectRecord; versions: VersionRecord[] };
