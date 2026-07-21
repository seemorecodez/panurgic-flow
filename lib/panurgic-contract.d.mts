export const PACKET_KIND: "panurgic-flow/evidence-packet";
export const PACKET_SCHEMA_VERSION: 1;
export const FORGE_REQUEST_KIND: "panurgic-flow/forge-request";
export const ATTESTATION_KIND: "panurgic-flow/packet-signature";
export const ATTESTATION_ALGORITHM: "ECDSA-P256-SHA256";
export const ATTESTATION_CANONICALIZATION: "panurgic-json-v1";
export const MAX_PACKET_BYTES: number;
export const MAX_PROJECT_NAME_LENGTH: number;
export const MAX_RAW_EVIDENCE_LENGTH: number;
export const MAX_CONTEXT_LENGTH: number;
export const MAX_ARTIFACT_LENGTH: number;
export const MAX_LEDGER_ENTRIES: number;

export type IntegrityStatus = "attested" | "checksum" | "unsigned" | "modified";
export type SigningIdentity = {
  privateKey: CryptoKey;
  publicKeyJwk: { kty: "EC"; crv: "P-256"; x: string; y: string };
  fingerprint: string;
};
export type ProjectInput = {
  name: string;
  agentMix: string;
  goals: string;
  technicalProof: string;
  codexNotes: string;
  workflow: string;
};
export type NormalizedEvidence = {
  repository: string[];
  agent: string[];
  decisions: string[];
  patterns: string[];
  unrecognized: string[];
};
export type ClaimLedgerEntry = {
  claim: string;
  source: string;
  status: "grounded" | "review";
};
export type PanurgicPacketV1 = {
  kind: typeof PACKET_KIND;
  schemaVersion: 1;
  packetId: string;
  createdAt: string;
  updatedAt: string;
  project: ProjectInput;
  source: { type: "browser-local" | "codex-sdk"; model: string | null };
  evidence: { raw: string; parserVersion: 1; normalized: NormalizedEvidence };
  manifest: {
    thesis: string;
    audience: string;
    codexRole: string;
    gptRole: string;
    evidence: [string, string, string];
    risks: [string, string];
    verificationChecklist: [string, string, string];
  };
  artifacts: {
    implementationSummary: string;
    stakeholderWalkthrough: string;
    verificationRunbook: string;
    codexSkill: string;
  };
  claimLedger: ClaimLedgerEntry[];
  integrity?: {
    algorithm: "SHA-256";
    canonicalization: "panurgic-json-v1";
    digest: string;
  };
  attestation?: {
    kind: typeof ATTESTATION_KIND;
    algorithm: typeof ATTESTATION_ALGORITHM;
    canonicalization: typeof ATTESTATION_CANONICALIZATION;
    publicKeyJwk: { kty: "EC"; crv: "P-256"; x: string; y: string };
    keyFingerprint: string;
    signature: string;
  };
};

export function stableStringify(value: unknown): string;
export function sha256Hex(value: unknown): Promise<string>;
export function packetPayload(packet: PanurgicPacketV1): Omit<PanurgicPacketV1, "integrity">;
export function sealPacket(packet: PanurgicPacketV1): Promise<PanurgicPacketV1>;
export function signingKeyFingerprint(publicKeyJwk: JsonWebKey): Promise<string>;
export function createSigningIdentity(): Promise<SigningIdentity>;
export function signPacket(packet: PanurgicPacketV1, identity: SigningIdentity): Promise<PanurgicPacketV1>;
export function verifyPacketIntegrity(packet: unknown): Promise<{ status: IntegrityStatus; reason: string; signerFingerprint?: string }>;
export function isPanurgicPacketV1(value: unknown, options?: { allowIntegrity?: boolean }): value is PanurgicPacketV1;
export function normalizePacket(value: unknown, options?: { now?: string; packetId?: string }): { packet: PanurgicPacketV1; migrated: boolean };
export function validateForgeRequest(value: unknown): Record<string, unknown>;
