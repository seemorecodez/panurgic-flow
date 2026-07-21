import { access, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const proofPath = resolve(workspace, "proof/panurgic-flow-release-claims.json");
const proof = JSON.parse(await readFile(proofPath, "utf8"));

if (proof.kind !== "panurgic-flow/release-claims" || proof.schemaVersion !== 1) {
  throw new Error("Release claims must use the panurgic-flow/release-claims V1 contract.");
}
if (!Array.isArray(proof.claims) || proof.claims.length < 8) {
  throw new Error("Release proof must contain the complete public claim set.");
}

const identifiers = new Set();
for (const claim of proof.claims) {
  if (typeof claim.id !== "string" || !/^[a-z0-9-]+$/u.test(claim.id)) {
    throw new Error("Every release claim needs a stable lowercase identifier.");
  }
  if (identifiers.has(claim.id)) throw new Error(`Duplicate release claim: ${claim.id}`);
  identifiers.add(claim.id);
  if (typeof claim.statement !== "string" || claim.statement.length < 20) {
    throw new Error(`Release claim ${claim.id} has no substantive statement.`);
  }
  if (!Array.isArray(claim.evidenceFiles) || claim.evidenceFiles.length === 0) {
    throw new Error(`Release claim ${claim.id} has no implementation evidence.`);
  }
  if (!Array.isArray(claim.verification) || claim.verification.length === 0) {
    throw new Error(`Release claim ${claim.id} has no reproducible verification.`);
  }
  for (const file of claim.evidenceFiles) {
    const target = resolve(workspace, file);
    const location = relative(workspace, target);
    if (!location || location.startsWith("..")) {
      throw new Error(`Release claim ${claim.id} references a path outside the repository.`);
    }
    await access(target);
  }
}

if (!Array.isArray(proof.limitations) || proof.limitations.length < 3) {
  throw new Error("Release proof must state the cryptographic and semantic limitations.");
}

console.log(`Validated ${relative(workspace, proofPath)} with ${proof.claims.length} evidence-backed claims.`);
