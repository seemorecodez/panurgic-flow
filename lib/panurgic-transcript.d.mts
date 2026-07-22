export const TRANSCRIPT_IMPORT_KIND: "panurgic-flow/transcript-import";
export const TRANSCRIPT_ADAPTER_VERSION: 1;
export const MAX_TRANSCRIPT_BYTES: number;
export const MAX_TRANSCRIPT_LINES: number;
export const MAX_EXTRACTED_EVIDENCE_LINES: number;

export type RedactionCount = { kind: string; count: number };
export type TranscriptDiagnostics = {
  adapter: string;
  adapterLabel: string;
  confidence: "high" | "medium" | "low";
  sourceBytes: number;
  totalLines: number;
  inspectedLines: number;
  parsedEvents: number;
  extractedLines: number;
  skippedLines: number;
  truncated: boolean;
  redactions: RedactionCount[];
  warnings: string[];
};

export type TranscriptImport = {
  kind: typeof TRANSCRIPT_IMPORT_KIND;
  schemaVersion: 1;
  evidenceText: string;
  suggestedAgentMix: string;
  diagnostics: TranscriptDiagnostics;
};

export function redactTranscriptText(value: string): { text: string; redactions: RedactionCount[] };
export function importTranscriptText(value: string, options?: { fileName?: string }): TranscriptImport;
