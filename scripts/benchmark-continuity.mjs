#!/usr/bin/env node

import { execFile } from "node:child_process";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { importTranscriptText } from "../lib/panurgic-transcript.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const HELP = `Panurgic Flow continuity benchmark

Usage:
  pnpm benchmark:continuity -- --mode hot|cold|all --runs 3 --lines 5000 [--json]

The benchmark is bounded to 10 runs and 10,000 synthetic transcript lines.
Cold mode starts a fresh Node.js process for every run. Hot mode reuses one process.`;

function parseArguments(args) {
  const options = { mode: "all", runs: 3, lines: 5_000, json: false, worker: false };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--") continue;
    if (argument === "--mode") options.mode = args[++index];
    else if (argument === "--runs") options.runs = Number(args[++index]);
    else if (argument === "--lines") options.lines = Number(args[++index]);
    else if (argument === "--json") options.json = true;
    else if (argument === "--worker") options.worker = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown benchmark option: ${argument}`);
  }
  if (!options.help && !["hot", "cold", "all"].includes(options.mode)) throw new Error("Mode must be hot, cold, or all.");
  if (!Number.isInteger(options.runs) || options.runs < 1 || options.runs > 10) throw new Error("Runs must be an integer from 1 to 10.");
  if (!Number.isInteger(options.lines) || options.lines < 100 || options.lines > 10_000) throw new Error("Lines must be an integer from 100 to 10,000.");
  return options;
}

function syntheticTranscript(lineCount) {
  const values = [];
  for (let index = 0; index < lineCount; index += 1) {
    const role = index % 5 === 0 ? "user" : "assistant";
    const content = index % 7 === 0
      ? [{ type: "tool_use", name: "shell_command", input: { command: "pnpm test" } }]
      : `Continuity benchmark event ${index}`;
    values.push(JSON.stringify({ sessionId: "benchmark", type: role, message: { role, content } }));
  }
  return values.join("\n");
}

function percentile(values, ratio) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * ratio) - 1)];
}

function summarize(mode, measurements, lines) {
  const durations = measurements.map((entry) => entry.durationMs);
  return {
    mode,
    runs: measurements.length,
    transcriptLines: lines,
    durationMs: {
      median: Number(percentile(durations, 0.5).toFixed(3)),
      p95: Number(percentile(durations, 0.95).toFixed(3)),
      maximum: Number(Math.max(...durations).toFixed(3)),
    },
    maximumHeapDeltaBytes: Math.max(...measurements.map((entry) => entry.heapDeltaBytes)),
    extractedLines: measurements.at(-1).extractedLines,
  };
}

function hotMeasurement(transcript) {
  const before = process.memoryUsage().heapUsed;
  const started = performance.now();
  const imported = importTranscriptText(transcript, { fileName: "benchmark.jsonl" });
  return {
    durationMs: performance.now() - started,
    heapDeltaBytes: Math.max(process.memoryUsage().heapUsed - before, 0),
    extractedLines: imported.diagnostics.extractedLines,
  };
}

async function coldMeasurement(lines) {
  const result = await execFileAsync(process.execPath, [scriptPath, "--worker", "--lines", String(lines), "--runs", "1"]);
  return JSON.parse(result.stdout);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) return process.stdout.write(`${HELP}\n`);
  const transcript = syntheticTranscript(options.lines);
  if (options.worker) {
    process.stdout.write(`${JSON.stringify(hotMeasurement(transcript))}\n`);
    return;
  }
  const report = {
    kind: "panurgic-flow/continuity-benchmark",
    schemaVersion: 1,
    node: process.version,
    modes: [],
  };
  if (options.mode === "hot" || options.mode === "all") {
    const measurements = [];
    for (let index = 0; index < options.runs; index += 1) measurements.push(hotMeasurement(transcript));
    report.modes.push(summarize("hot", measurements, options.lines));
  }
  if (options.mode === "cold" || options.mode === "all") {
    const measurements = [];
    for (let index = 0; index < options.runs; index += 1) measurements.push(await coldMeasurement(options.lines));
    report.modes.push(summarize("cold", measurements, options.lines));
  }
  if (options.json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else {
    for (const mode of report.modes) {
      process.stdout.write(`${mode.mode}: median ${mode.durationMs.median} ms, p95 ${mode.durationMs.p95} ms, max heap delta ${mode.maximumHeapDeltaBytes} bytes\n`);
    }
  }
}

main().catch((error) => {
  process.stderr.write(`Continuity benchmark failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
