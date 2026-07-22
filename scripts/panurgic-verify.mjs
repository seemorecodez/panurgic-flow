#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  MAX_PACKET_BYTES,
  normalizePacket,
  verifyPacketIntegrity,
} from "../lib/panurgic-contract.mjs";
import {
  MAX_CONTINUITY_BYTES,
  isContinuityBundle,
  verifyContinuityBundle,
} from "../lib/panurgic-continuity.mjs";

const VERSION = "0.3.0";
const HELP = `Panurgic Flow independent verifier ${VERSION}

Usage:
  pnpm panurgic:verify -- <file.json> [--json] [--require-signature]

Options:
  --json               Print a machine-readable verification report.
  --require-signature  Fail unless the packet or complete continuity archive has a valid signature.
  --help               Show this help.
  --version            Print the verifier version.

Verification is local and network-free. Exit code 0 means the requested trust policy passed;
exit code 2 means the file is readable but does not satisfy the requested integrity policy;
exit code 1 means the file could not be read or validated.`;

function parseArguments(args) {
  const options = { json: false, requireSignature: false, file: null };
  for (const argument of args) {
    if (argument === "--json") options.json = true;
    else if (argument === "--require-signature") options.requireSignature = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--version" || argument === "-v") options.version = true;
    else if (argument.startsWith("-")) throw new Error(`Unknown option: ${argument}`);
    else if (options.file) throw new Error("Verify one file at a time.");
    else options.file = argument;
  }
  return options;
}

function printReport(report, json) {
  if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }
  const label = report.policyPassed ? "PASS" : "REVIEW";
  process.stdout.write(`${label} ${report.type} ${report.status}\n${report.reason}\n`);
  if (report.entryCount !== undefined) process.stdout.write(`Entries: ${report.entryCount}\n`);
  if (report.attestedEntries !== undefined) process.stdout.write(`Attested entries: ${report.attestedEntries}\n`);
  if (report.signerFingerprint) process.stdout.write(`Signer fingerprint: ${report.signerFingerprint}\n`);
  if (report.headDigest) process.stdout.write(`Continuity head: ${report.headDigest}\n`);
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${HELP}\n`);
    return;
  }
  if (options.version) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }
  if (!options.file) throw new Error("Choose a packet or continuity bundle to verify. Use --help for examples.");
  const file = resolve(options.file);
  const details = await stat(file);
  if (!details.isFile()) throw new Error("The verification target must be a JSON file.");
  if (details.size > MAX_CONTINUITY_BYTES) throw new Error("The verification target exceeds the 4 MB limit.");
  const value = JSON.parse(await readFile(file, "utf8"));
  let report;
  if (isContinuityBundle(value)) {
    const result = await verifyContinuityBundle(value);
    const policyPassed = result.status === "attested" || (
      result.status === "checksum" && !options.requireSignature
    );
    report = { type: "continuity-bundle", ...result, policyPassed };
  } else {
    if (details.size > MAX_PACKET_BYTES) throw new Error("A single packet exceeds the 512 KB limit.");
    const { packet, migrated } = normalizePacket(value);
    const result = await verifyPacketIntegrity(packet);
    const policyPassed = result.status === "attested" || (
      result.status === "checksum" && !options.requireSignature
    );
    report = { type: "evidence-packet", ...result, migrated, policyPassed };
  }
  printReport(report, options.json);
  if (!report.policyPassed) process.exitCode = 2;
}

main().catch((error) => {
  process.stderr.write(`Panurgic verification failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
