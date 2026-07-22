import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";
import {
  MAX_RAW_EVIDENCE_LENGTH,
  createSigningIdentity,
  sha256Hex,
  signPacket,
} from "../lib/panurgic-contract.mjs";
import {
  buildContinuityBundle,
  projectAndVersionsFromContinuityBundle,
  signContinuityBundle,
  verifyContinuityBundle,
} from "../lib/panurgic-continuity.mjs";
import { SAMPLE_FORM, buildBrowserPacket, parseEvidence } from "../lib/panurgic-core.mjs";
import {
  MAX_TRANSCRIPT_BYTES,
  importTranscriptText,
  redactTranscriptText,
} from "../lib/panurgic-transcript.mjs";

const execFileAsync = promisify(execFile);
const fixedTime = "2026-07-21T12:00:00.000Z";

function packetFixture(name, id) {
  return buildBrowserPacket(
    { ...SAMPLE_FORM, projectName: name },
    { packetId: id, createdAt: fixedTime, now: fixedTime },
  );
}

function projectFixture() {
  return {
    id: "project-continuity",
    name: "Continuity project",
    form: { ...SAMPLE_FORM, projectName: "Continuity project" },
    createdAt: fixedTime,
    updatedAt: fixedTime,
  };
}

test("imports Claude Code JSONL with bounded diagnostics and redaction", () => {
  const fakeOpenAiKey = ["sk", "proj", "abcdefghijklmnopqrstuvwxyz123456"].join("-");
  const transcript = [
    JSON.stringify({ sessionId: "session-1", type: "user", message: { role: "user", content: "Ship the release; email me at dev@example.com" } }),
    JSON.stringify({ sessionId: "session-1", type: "assistant", message: { role: "assistant", content: [
      { type: "text", text: `Implemented the local continuity workflow with ${fakeOpenAiKey}` },
      { type: "tool_use", name: "Bash", input: { command: "pnpm test" } },
    ] } }),
    "not-json",
  ].join("\n");
  const imported = importTranscriptText(transcript, { fileName: "session.jsonl" });
  assert.equal(imported.diagnostics.adapter, "claude-code-jsonl");
  assert.equal(imported.diagnostics.confidence, "high");
  assert.equal(imported.diagnostics.parsedEvents, 2);
  assert.equal(imported.diagnostics.skippedLines, 1);
  assert.ok(imported.diagnostics.redactions.some((entry) => entry.kind === "OpenAI API key"));
  assert.ok(imported.diagnostics.redactions.some((entry) => entry.kind === "email address"));
  assert.doesNotMatch(imported.evidenceText, /sk-proj-|dev@example\.com/u);
  const parsed = parseEvidence(imported.evidenceText);
  assert.ok(parsed.agent.length >= 1);
  assert.ok(parsed.repository.some((entry) => /pnpm test/i.test(entry)));
  assert.ok(parsed.decisions.some((entry) => /Ship the release/i.test(entry)));
});

test("detects Codex JSONL and converts tool activity without claiming a commit", () => {
  const transcript = [
    JSON.stringify({ type: "session_meta", payload: { id: "codex-1" } }),
    JSON.stringify({ type: "event_msg", payload: { type: "agent_message", message: "Added continuity verification." } }),
    JSON.stringify({ type: "response_item", payload: { type: "function_call", name: "shell_command", arguments: "pnpm lint" } }),
  ].join("\n");
  const imported = importTranscriptText(transcript, { fileName: "rollout.jsonl" });
  assert.equal(imported.diagnostics.adapter, "codex-jsonl");
  assert.match(imported.evidenceText, /AGENT: Added continuity verification/u);
  assert.match(imported.evidenceText, /TEST: shell_command/u);
  assert.doesNotMatch(imported.evidenceText, /COMMIT:/u);
});

test("redacts credentials and user paths deterministically", () => {
  const fakeOpenAiKey = ["sk", "proj", "abcdefghijklmnopqrstuvwxyz123456"].join("-");
  const environmentName = ["OPENAI", "API", "KEY"].join("_");
  const source = `${environmentName}=${fakeOpenAiKey} C:\\Users\\frank\\repo /home/alice/code`;
  const first = redactTranscriptText(source);
  const second = redactTranscriptText(source);
  assert.deepEqual(first, second);
  assert.doesNotMatch(first.text, /abcdefghijklmnopqrstuvwxyz|frank|alice/u);
  assert.match(first.text, /\[REDACTED\]/u);
  assert.equal(first.redactions.find((entry) => entry.kind === "home path")?.count, 2);
});

test("rejects transcripts beyond the bounded local import limit", () => {
  assert.throws(
    () => importTranscriptText("x".repeat(MAX_TRANSCRIPT_BYTES + 1)),
    /larger than the 4 MB local import limit/i,
  );
});

test("signs and verifies the complete continuity archive", async () => {
  const first = packetFixture("First", "packet-first");
  const identity = await createSigningIdentity();
  const latest = await signPacket(packetFixture("Latest", "packet-latest"), identity);
  const versions = [
    { id: "version-first", projectId: "project-continuity", createdAt: "2026-07-21T12:00:00.000Z", packet: first },
    { id: "version-latest", projectId: "project-continuity", createdAt: "2026-07-21T12:01:00.000Z", packet: latest },
  ];
  const unsigned = await buildContinuityBundle(projectFixture(), versions, { now: fixedTime });
  const bundle = await signContinuityBundle(unsigned, identity);
  const verified = await verifyContinuityBundle(bundle);
  assert.equal(verified.status, "attested");
  assert.equal(verified.entryCount, 2);
  assert.equal(verified.attestedEntries, 1);
  assert.equal(verified.signerFingerprint, identity.fingerprint);
  assert.equal(verified.latestPacketAttested, true);
  assert.match(verified.headDigest, /^[a-f0-9]{64}$/u);
  const restored = projectAndVersionsFromContinuityBundle(bundle);
  assert.equal(restored.versions.length, 2);
  assert.equal(restored.versions[1].packet.packetId, "packet-latest");
});

test("does not confuse a signed latest packet with a signed archive", async () => {
  const identity = await createSigningIdentity();
  const latest = await signPacket(packetFixture("Latest", "packet-latest-only"), identity);
  const bundle = await buildContinuityBundle(projectFixture(), [
    { id: "version-latest", projectId: "project-continuity", createdAt: fixedTime, packet: latest },
  ], { now: fixedTime });
  const verified = await verifyContinuityBundle(bundle);
  assert.equal(verified.status, "checksum");
  assert.equal(verified.latestPacketAttested, true);
  assert.match(verified.reason, /archive chain itself is not signer-attested/i);
});

test("rejects oversized project metadata in continuity archives", async () => {
  const project = projectFixture();
  project.form.rawEvidence = "x".repeat(MAX_RAW_EVIDENCE_LENGTH + 1);
  await assert.rejects(
    buildContinuityBundle(project, []),
    /complete local project record/i,
  );
});

test("rejects duplicate or cross-project continuity versions", async () => {
  const packet = packetFixture("Duplicate", "packet-duplicate");
  const duplicateVersions = [
    { id: "same-version", projectId: "project-continuity", createdAt: fixedTime, packet },
    { id: "same-version", projectId: "project-continuity", createdAt: "2026-07-21T12:01:00.000Z", packet },
  ];
  await assert.rejects(buildContinuityBundle(projectFixture(), duplicateVersions), /not a valid PanurgicPacketV1 record/i);
  await assert.rejects(
    buildContinuityBundle(projectFixture(), [
      { id: "wrong-project", projectId: "another-project", createdAt: fixedTime, packet },
    ]),
    /not a valid PanurgicPacketV1 record/i,
  );
});

test("detects packet, link, order, and bundle tampering", async () => {
  const versions = [
    { id: "version-a", projectId: "project-continuity", createdAt: "2026-07-21T12:00:00.000Z", packet: packetFixture("A", "packet-a") },
    { id: "version-b", projectId: "project-continuity", createdAt: "2026-07-21T12:01:00.000Z", packet: packetFixture("B", "packet-b") },
  ];
  const bundle = await buildContinuityBundle(projectFixture(), versions, { now: fixedTime });

  const changedBundle = structuredClone(bundle);
  changedBundle.project.name = "Changed";
  assert.equal((await verifyContinuityBundle(changedBundle)).status, "modified");

  const changedPacket = structuredClone(bundle);
  changedPacket.entries[0].packet.project.name = "Changed packet";
  const payload = { ...changedPacket };
  delete payload.integrity;
  changedPacket.integrity.digest = await sha256Hex(payload);
  assert.equal((await verifyContinuityBundle(changedPacket)).status, "modified");

  const reordered = structuredClone(bundle);
  reordered.entries.reverse();
  const reorderedPayload = { ...reordered };
  delete reorderedPayload.integrity;
  reordered.integrity.digest = await sha256Hex(reorderedPayload);
  assert.equal((await verifyContinuityBundle(reordered)).status, "modified");

  const identity = await createSigningIdentity();
  const signed = await signContinuityBundle(bundle, identity);
  const rewritten = structuredClone(signed);
  rewritten.project.name = "Rewritten history";
  const rewrittenPayload = { ...rewritten };
  delete rewrittenPayload.integrity;
  delete rewrittenPayload.attestation;
  rewritten.integrity.digest = await sha256Hex(rewrittenPayload);
  assert.equal((await verifyContinuityBundle(rewritten)).status, "modified");
});

test("independent verifier emits JSON and enforces signature policy", async () => {
  const directory = await mkdtemp(join(tmpdir(), "panurgic-verify-"));
  const target = join(directory, "continuity.json");
  const packet = packetFixture("Unsigned", "packet-unsigned");
  const bundle = await buildContinuityBundle(projectFixture(), [
    { id: "version-unsigned", projectId: "project-continuity", createdAt: fixedTime, packet },
  ], { now: fixedTime });
  await writeFile(target, `${JSON.stringify(bundle)}\n`, "utf8");
  const script = fileURLToPath(new URL("../scripts/panurgic-verify.mjs", import.meta.url));
  const report = await execFileAsync(process.execPath, [script, target, "--json"]);
  const parsed = JSON.parse(report.stdout);
  assert.equal(parsed.type, "continuity-bundle");
  assert.equal(parsed.status, "checksum");
  assert.equal(parsed.policyPassed, true);
  await assert.rejects(
    execFileAsync(process.execPath, [script, target, "--require-signature"]),
    (error) => error.code === 2 && /Hash-linked history is intact/i.test(error.stdout),
  );
  const identity = await createSigningIdentity();
  const signed = await signContinuityBundle(bundle, identity);
  await writeFile(target, `${JSON.stringify(signed)}\n`, "utf8");
  const signedReport = await execFileAsync(process.execPath, [script, target, "--require-signature", "--json"]);
  assert.equal(JSON.parse(signedReport.stdout).status, "attested");
  const version = await execFileAsync(process.execPath, [script, "--version"]);
  assert.equal(version.stdout.trim(), "0.3.0");
});

test("continuity benchmark emits bounded machine-readable output", async () => {
  const script = fileURLToPath(new URL("../scripts/benchmark-continuity.mjs", import.meta.url));
  const result = await execFileAsync(process.execPath, [script, "--", "--mode", "hot", "--runs", "1", "--lines", "200", "--json"]);
  const report = JSON.parse(result.stdout);
  assert.equal(report.kind, "panurgic-flow/continuity-benchmark");
  assert.equal(report.modes[0].mode, "hot");
  assert.equal(report.modes[0].runs, 1);
  assert.equal(report.modes[0].transcriptLines, 200);
});
