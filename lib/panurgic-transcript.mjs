import { MAX_RAW_EVIDENCE_LENGTH } from "./panurgic-contract.mjs";

export const TRANSCRIPT_IMPORT_KIND = "panurgic-flow/transcript-import";
export const TRANSCRIPT_ADAPTER_VERSION = 1;
export const MAX_TRANSCRIPT_BYTES = 4 * 1024 * 1024;
export const MAX_TRANSCRIPT_LINES = 20_000;
export const MAX_EXTRACTED_EVIDENCE_LINES = 400;

const textEncoder = new TextEncoder();
const SECRET_PATTERNS = [
  { kind: "OpenAI API key", pattern: /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/gu },
  { kind: "Anthropic API key", pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/gu },
  { kind: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/gu },
  { kind: "bearer token", pattern: /\bBearer\s+[A-Za-z0-9._~+/-]{16,}=*/giu },
  { kind: "JWT", pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/gu },
  {
    kind: "secret environment value",
    pattern: /\b(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|GITHUB_TOKEN|CODEX_API_KEY|AWS_SECRET_ACCESS_KEY|DATABASE_URL)\s*[=:]\s*[^\s"']+/giu,
  },
  { kind: "URL credential", pattern: /\bhttps?:\/\/[^\s/@:]+:[^\s/@]+@/giu },
  { kind: "email address", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu },
];

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function compact(value, maximum = 360) {
  const text = String(value ?? "").replace(/\s+/gu, " ").trim();
  if (!text) return "";
  return text.length > maximum ? `${text.slice(0, maximum - 3)}...` : text;
}

function appendCount(counts, kind, amount = 1) {
  counts[kind] = (counts[kind] ?? 0) + amount;
}

export function redactTranscriptText(value) {
  let text = String(value ?? "");
  const counts = {};
  for (const { kind, pattern } of SECRET_PATTERNS) {
    text = text.replace(pattern, (match) => {
      appendCount(counts, kind);
      if (kind === "URL credential") return match.replace(/\/\/.*@/u, "//[REDACTED]@");
      if (kind === "secret environment value") {
        const separator = match.match(/[=:]/u)?.[0] ?? "=";
        return `${match.split(/[=:]/u, 1)[0]}${separator}[REDACTED]`;
      }
      return `[REDACTED ${kind}]`;
    });
  }
  text = text.replace(/\b[A-Za-z]:\\Users\\[^\\\s]+/gu, (match) => {
    appendCount(counts, "home path");
    return `${match.slice(0, 2)}\\Users\\[USER]`;
  });
  text = text.replace(/\/(?:Users|home)\/[^/\s]+/gu, (match) => {
    appendCount(counts, "home path");
    return match.startsWith("/Users/") ? "/Users/[USER]" : "/home/[USER]";
  });
  return {
    text,
    redactions: Object.entries(counts)
      .map(([kind, count]) => ({ kind, count }))
      .sort((left, right) => left.kind.localeCompare(right.kind)),
  };
}

function contentBlocks(value) {
  if (typeof value === "string") return [{ type: "text", text: value }];
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string") return [{ type: "text", text: entry }];
    const record = asRecord(entry);
    return record ? [record] : [];
  });
}

function commandFromInput(input) {
  const record = asRecord(input);
  if (!record) return compact(input);
  return compact(record.command ?? record.cmd ?? record.input ?? record.path ?? record.file_path ?? "");
}

function evidenceFromTool(name, input) {
  const tool = compact(name, 80) || "unknown tool";
  const detail = commandFromInput(input);
  if (/test|lint|build|check|verify|pytest|vitest|jest|pnpm|npm|cargo/i.test(`${tool} ${detail}`)) {
    return `TEST: ${compact(`${tool}${detail ? ` — ${detail}` : ""}`)}`;
  }
  if (/git\s+commit/i.test(detail)) return `COMMIT: ${compact(detail)}`;
  return `AGENT: ${compact(`Used ${tool}${detail ? ` — ${detail}` : ""}`)}`;
}

function evidenceFromMessage(message, fallbackRole) {
  const record = asRecord(message);
  const role = String(record?.role ?? fallbackRole ?? "").toLowerCase();
  const blocks = contentBlocks(record?.content ?? message);
  const evidence = [];
  for (const block of blocks) {
    if (block.type === "tool_use" || block.type === "tool_call") {
      evidence.push(evidenceFromTool(block.name ?? block.tool_name, block.input ?? block.arguments));
      continue;
    }
    const text = compact(block.text ?? block.content ?? "");
    if (!text) continue;
    if (/user|human/u.test(role)) evidence.push(`CONTEXT: ${text}`);
    else if (/assistant|agent/u.test(role)) evidence.push(`AGENT: ${text}`);
  }
  return evidence;
}

function evidenceFromJsonRecord(record) {
  const value = asRecord(record);
  if (!value) return [];
  const payload = asRecord(value.payload) ?? value;
  const type = String(payload.type ?? value.type ?? "").toLowerCase();
  if (value.message || payload.message) {
    return evidenceFromMessage(value.message ?? payload.message, value.role ?? payload.role ?? type);
  }
  if (/tool_call|tool_use|function_call|command_execution/u.test(type)) {
    return [evidenceFromTool(payload.name ?? payload.tool_name ?? type, payload.arguments ?? payload.input ?? payload.command)];
  }
  if (/tool_result|command_output|function_call_output/u.test(type)) {
    const output = compact(payload.output ?? payload.result ?? payload.content ?? "");
    return output && /pass|success|built|complete|verified|error|fail/i.test(output)
      ? [`TEST: ${output}`]
      : [];
  }
  if (/agent_message|assistant_message|assistant/u.test(type)) {
    const text = compact(payload.message ?? payload.text ?? payload.content ?? "");
    return text ? [`AGENT: ${text}`] : [];
  }
  if (/user_message|human_message|user/u.test(type)) {
    const text = compact(payload.message ?? payload.text ?? payload.content ?? "");
    return text ? [`CONTEXT: ${text}`] : [];
  }
  return [];
}

function detectJsonlFormat(records) {
  if (records.some((record) => record?.sessionId || (
    Array.isArray(record?.message?.content) && record.message.content.some((entry) => entry?.type === "tool_use")
  ))) {
    return { format: "claude-code-jsonl", label: "Claude Code JSONL", confidence: "high" };
  }
  if (records.some((record) => ["session_meta", "event_msg", "response_item", "turn_context"].includes(record?.type))) {
    return { format: "codex-jsonl", label: "Codex JSONL", confidence: "high" };
  }
  return { format: "generic-jsonl", label: "Generic agent JSONL", confidence: "medium" };
}

function detectTextFormat(text, fileName) {
  if (/\.(?:md|markdown)$/iu.test(fileName) || /^#{1,4}\s|^\*\*(?:user|assistant)/imu.test(text)) {
    return { format: "markdown-transcript", label: "Markdown transcript", confidence: "medium" };
  }
  return { format: "prefixed-text", label: "Prefixed evidence text", confidence: "high" };
}

function markdownEvidence(lines) {
  let role = "";
  const evidence = [];
  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s*(user|human|assistant|agent)\b/iu)
      ?? line.match(/^\*\*(user|human|assistant|agent)\*\*\s*:??/iu);
    if (heading) {
      role = heading[1].toLowerCase();
      continue;
    }
    const text = compact(line.replace(/^[-*>]\s*/u, ""));
    if (!text) continue;
    if (/^(?:COMMIT|TEST|CODEX|AGENT|DECISION|CONTEXT|PATTERN):\s+/u.test(text)) evidence.push(text);
    else if (role === "user" || role === "human") evidence.push(`CONTEXT: ${text}`);
    else if (role === "assistant" || role === "agent") evidence.push(`AGENT: ${text}`);
  }
  return evidence;
}

function mergeRedactionCounts(target, redactions) {
  for (const item of redactions) appendCount(target, item.kind, item.count);
}

export function importTranscriptText(value, options = {}) {
  const source = String(value ?? "");
  const bytes = textEncoder.encode(source).byteLength;
  if (!source.trim()) throw new Error("The selected transcript is empty.");
  if (bytes > MAX_TRANSCRIPT_BYTES) {
    throw new Error("The selected transcript is larger than the 4 MB local import limit.");
  }
  const allLines = source.split(/\r?\n/u);
  const lines = allLines.slice(0, MAX_TRANSCRIPT_LINES);
  const warnings = [];
  if (allLines.length > MAX_TRANSCRIPT_LINES) {
    warnings.push(`Only the first ${MAX_TRANSCRIPT_LINES.toLocaleString("en-US")} lines were inspected.`);
  }
  const jsonRecords = [];
  let malformedJsonLines = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (asRecord(parsed)) jsonRecords.push(parsed);
      else malformedJsonLines += 1;
    } catch {
      malformedJsonLines += 1;
    }
  }
  const nonEmptyLines = lines.filter((line) => line.trim()).length;
  const isJsonl = jsonRecords.length > 0 && jsonRecords.length / Math.max(nonEmptyLines, 1) >= 0.6;
  const detected = isJsonl
    ? detectJsonlFormat(jsonRecords)
    : detectTextFormat(source, String(options.fileName ?? ""));
  let candidates = [];
  if (isJsonl) {
    candidates = jsonRecords.flatMap(evidenceFromJsonRecord);
    if (malformedJsonLines) warnings.push(`${malformedJsonLines} non-JSON line${malformedJsonLines === 1 ? " was" : "s were"} skipped.`);
  } else if (detected.format === "markdown-transcript") {
    candidates = markdownEvidence(lines);
  } else {
    candidates = lines
      .map((line) => compact(line, 600))
      .filter((line) => /^(?:COMMIT|TEST|CODEX|AGENT|DECISION|CONTEXT|PATTERN):\s+/u.test(line));
  }

  const redactionCounts = {};
  const unique = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const redacted = redactTranscriptText(candidate);
    mergeRedactionCounts(redactionCounts, redacted.redactions);
    const clean = compact(redacted.text, 600);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    unique.push(clean);
  }
  const bounded = [];
  let characterCount = 0;
  for (const line of unique.slice(0, MAX_EXTRACTED_EVIDENCE_LINES)) {
    const extra = (bounded.length ? 1 : 0) + line.length;
    if (characterCount + extra > MAX_RAW_EVIDENCE_LENGTH) break;
    bounded.push(line);
    characterCount += extra;
  }
  const truncated = unique.length > bounded.length || allLines.length > lines.length;
  if (unique.length > MAX_EXTRACTED_EVIDENCE_LINES) {
    warnings.push(`Evidence candidates were capped at ${MAX_EXTRACTED_EVIDENCE_LINES} lines.`);
  }
  if (!bounded.length) {
    warnings.push("No supported evidence candidates were found; the source file was not added to the project.");
  }
  return {
    kind: TRANSCRIPT_IMPORT_KIND,
    schemaVersion: TRANSCRIPT_ADAPTER_VERSION,
    evidenceText: bounded.join("\n"),
    suggestedAgentMix: detected.format === "prefixed-text" ? "Mixed-agent workflow" : detected.label,
    diagnostics: {
      adapter: detected.format,
      adapterLabel: detected.label,
      confidence: detected.confidence,
      sourceBytes: bytes,
      totalLines: allLines.length,
      inspectedLines: lines.length,
      parsedEvents: isJsonl ? jsonRecords.length : nonEmptyLines,
      extractedLines: bounded.length,
      skippedLines: isJsonl ? malformedJsonLines : Math.max(nonEmptyLines - candidates.length, 0),
      truncated,
      redactions: Object.entries(redactionCounts)
        .map(([kind, count]) => ({ kind, count }))
        .sort((left, right) => left.kind.localeCompare(right.kind)),
      warnings,
    },
  };
}
