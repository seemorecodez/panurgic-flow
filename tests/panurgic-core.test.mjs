import assert from "node:assert/strict";
import test from "node:test";
import {
  isPanurgicPacketV1,
  normalizePacket,
  sealPacket,
  stableStringify,
  verifyPacketIntegrity,
} from "../lib/panurgic-contract.mjs";
import {
  SAMPLE_FORM,
  buildBrowserPacket,
  normalizationPatch,
  parseEvidence,
} from "../lib/panurgic-core.mjs";

test("parses supported evidence prefixes and preserves unrecognized lines", () => {
  const parsed = parseEvidence("COMMIT: abc\nTEST: pass\nCODEX: built\nDECISION: local\nPATTERN: capture\nplain note");
  assert.deepEqual(parsed.repository, ["abc", "pass"]);
  assert.deepEqual(parsed.agent, ["built"]);
  assert.deepEqual(parsed.decisions, ["local"]);
  assert.deepEqual(parsed.patterns, ["capture"]);
  assert.deepEqual(parsed.unrecognized, ["plain note"]);
});

test("normalizes recognized evidence into human context fields", () => {
  const patch = normalizationPatch({
    ...SAMPLE_FORM,
    rawEvidence: "TEST: verification passed\nCODEX: implemented flow\nDECISION: stay local\nPATTERN: capture then review",
  });
  assert.equal(patch.technicalProof, "verification passed");
  assert.equal(patch.codexNotes, "implemented flow");
  assert.equal(patch.goals, "stay local");
  assert.equal(patch.workflow, "capture then review");
});

test("builds deterministic V1 content for fixed identity and time", () => {
  const options = {
    packetId: "packet-fixed",
    createdAt: "2026-07-19T00:00:00.000Z",
    now: "2026-07-19T00:00:00.000Z",
  };
  const first = buildBrowserPacket(SAMPLE_FORM, options);
  const second = buildBrowserPacket(SAMPLE_FORM, options);
  assert.deepEqual(first, second);
  assert.ok(isPanurgicPacketV1(first));
  assert.equal(first.schemaVersion, 1);
  assert.ok(first.artifacts.verificationRunbook.includes("verification runbook"));
  assert.equal("judgeRunbook" in first.artifacts, false);
});

test("canonical JSON is stable across object insertion order", () => {
  assert.equal(stableStringify({ b: 2, a: { d: 4, c: 3 } }), stableStringify({ a: { c: 3, d: 4 }, b: 2 }));
});

test("seals, verifies, and detects a modified packet", async () => {
  const packet = buildBrowserPacket(SAMPLE_FORM, {
    packetId: "packet-integrity",
    createdAt: "2026-07-19T00:00:00.000Z",
    now: "2026-07-19T00:00:00.000Z",
  });
  assert.equal((await verifyPacketIntegrity(packet)).status, "unsigned");
  const sealed = await sealPacket(packet);
  assert.match(sealed.integrity.digest, /^[a-f0-9]{64}$/);
  assert.equal((await verifyPacketIntegrity(sealed)).status, "verified");
  const modified = structuredClone(sealed);
  modified.project.name = "Changed after sealing";
  assert.equal((await verifyPacketIntegrity(modified)).status, "modified");
});

test("migrates legacy artifact names without modifying the source object", () => {
  const legacy = {
    source: "codex-sdk",
    model: "gpt-5.6-sol",
    project: "Legacy packet",
    manifest: {
      thesis: "Legacy evidence packet",
      audience: "Engineering",
      codexRole: "Implemented",
      gptRole: "Synthesized",
      evidence: ["one", "two", "three"],
      risks: ["one", "two"],
      nextMilestones: ["verify", "review", "seal"],
    },
    readmeSection: "summary",
    demoScript: "walkthrough",
    judgeRunbook: "legacy runbook",
    skillMarkdown: "skill",
  };
  const snapshot = structuredClone(legacy);
  const result = normalizePacket(legacy, {
    now: "2026-07-19T00:00:00.000Z",
    packetId: "legacy-fixed",
  });
  assert.equal(result.migrated, true);
  assert.equal(result.packet.artifacts.verificationRunbook, "legacy runbook");
  assert.equal(result.packet.manifest.verificationChecklist[0], "verify");
  assert.deepEqual(legacy, snapshot);
  assert.ok(isPanurgicPacketV1(result.packet));
});

test("rejects malformed legacy input", () => {
  assert.throws(() => normalizePacket(null), /not a Panurgic Flow packet/i);
  assert.throws(() => normalizePacket({ project: "" }), /not a recognized Panurgic Flow packet/i);
});
