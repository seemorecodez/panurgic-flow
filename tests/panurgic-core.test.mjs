import assert from "node:assert/strict";
import test from "node:test";
import {
  createSigningIdentity,
  isPanurgicPacketV1,
  normalizePacket,
  sealPacket,
  signPacket,
  signingKeyFingerprint,
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
  assert.deepEqual(Object.keys(first.artifacts), [
    "implementationSummary",
    "stakeholderWalkthrough",
    "verificationRunbook",
    "codexSkill",
  ]);
  assert.ok(first.artifacts.verificationRunbook.includes("verification runbook"));
  assert.equal("judgeRunbook" in first.artifacts, false);
  assert.ok(first.claimLedger.every(({ status }) => status === "grounded"));
  const reviewPacket = buildBrowserPacket(
    {
      ...SAMPLE_FORM,
      projectName: "Sparse evidence",
      rawEvidence: "COMMIT: x",
      technicalProof: "x",
      codexNotes: "x",
      goals: "x",
      workflow: "x",
    },
    options,
  );
  assert.ok(reviewPacket.claimLedger.some(({ status }) => status === "review"));
});

test("canonical JSON is stable across object insertion order", () => {
  assert.equal(stableStringify({ b: 2, a: { d: 4, c: 3 } }), stableStringify({ a: { c: 3, d: 4 }, b: 2 }));
  assert.equal(stableStringify({ ä: 3, a: 2, Z: 1 }), '{"Z":1,"a":2,"ä":3}');
});

test("distinguishes checksums from signatures and detects signed-content modification", async () => {
  const packet = buildBrowserPacket(SAMPLE_FORM, {
    packetId: "packet-integrity",
    createdAt: "2026-07-19T00:00:00.000Z",
    now: "2026-07-19T00:00:00.000Z",
  });
  assert.equal((await verifyPacketIntegrity(packet)).status, "unsigned");
  const sealed = await sealPacket(packet);
  assert.match(sealed.integrity.digest, /^[a-f0-9]{64}$/);
  assert.equal((await verifyPacketIntegrity(sealed)).status, "checksum");

  const identity = await createSigningIdentity();
  assert.equal(identity.privateKey.extractable, false);
  assert.match(identity.fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(await signingKeyFingerprint(identity.publicKeyJwk), identity.fingerprint);
  const signed = await signPacket(packet, identity);
  assert.match(signed.attestation.signature, /^[A-Za-z0-9_-]+$/);
  const verified = await verifyPacketIntegrity(signed);
  assert.equal(verified.status, "attested");
  assert.equal(verified.signerFingerprint, identity.fingerprint);

  const missingChecksum = structuredClone(signed);
  delete missingChecksum.integrity;
  assert.equal((await verifyPacketIntegrity(missingChecksum)).status, "modified");

  const modified = structuredClone(signed);
  modified.project.name = "Changed after sealing";
  const resealed = await sealPacket(modified);
  modified.integrity = resealed.integrity;
  assert.equal((await verifyPacketIntegrity(modified)).status, "modified");

  const differentIdentity = await createSigningIdentity();
  const independentlySigned = await signPacket(
    { ...packet, project: { ...packet.project, name: "Different signer" } },
    differentIdentity,
  );
  assert.equal((await verifyPacketIntegrity(independentlySigned)).status, "attested");
  assert.notEqual(independentlySigned.attestation.keyFingerprint, identity.fingerprint);

  const reviewPacket = buildBrowserPacket(
    {
      ...SAMPLE_FORM,
      rawEvidence: "COMMIT: x",
      technicalProof: "x",
      codexNotes: "x",
      workflow: "x",
    },
    { packetId: "packet-review", createdAt: packet.createdAt, now: packet.updatedAt },
  );
  await assert.rejects(signPacket(reviewPacket, identity), /Resolve every Review claim/i);
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
