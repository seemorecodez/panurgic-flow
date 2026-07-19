import type { ClaimLedgerEntry, NormalizedEvidence, PanurgicPacketV1 } from "./panurgic-contract.mjs";

export type FormState = {
  projectName: string;
  agentMix: string;
  rawEvidence: string;
  goals: string;
  technicalProof: string;
  codexNotes: string;
  workflow: string;
};

export const EMPTY_FORM: Readonly<FormState>;
export const SAMPLE_FORM: Readonly<FormState>;
export function parseEvidence(rawEvidence: string): NormalizedEvidence;
export function normalizationPatch(form: FormState): Partial<FormState>;
export function buildClaimLedger(claims: string[], sources: string[]): ClaimLedgerEntry[];
export function buildBrowserPacket(form: FormState, options?: { now?: string; packetId?: string; createdAt?: string }): PanurgicPacketV1;
export function formFromPacket(packet: PanurgicPacketV1): FormState;
