import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";
import test from "node:test";
import axe from "axe-core";
import { JSDOM } from "jsdom";

const execFileAsync = promisify(execFile);
const templateRoot = new URL("../", import.meta.url);
const templatePath = fileURLToPath(templateRoot);

async function fetchApp(pathname = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`https://localhost${pathname}`, init),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the production product and public routes", async () => {
  const response = await fetchApp("/", { headers: { accept: "text/html" } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Panurgic Flow<\/title>/i);
  assert.match(html, /Turn AI-assisted work into evidence you can verify/i);
  assert.match(html, /Start a local project/i);
  assert.match(html, /Device-local history/i);
  assert.match(html, /Capture/);
  assert.match(html, /Review/);
  assert.match(html, /Export/);
  assert.match(html, /Try the sample/i);
  assert.match(html, /Local by default: nothing is uploaded/i);
  assert.doesNotMatch(
    html,
    /OpenAI Build Week|Devpost|Wow factor|Owner action|See why it scores|Official requirement check|Forge judge packet|Judge runbook|judge-ready|product roadmap/i,
  );

  const routes = new Map([
    ["/docs", /A portable evidence workflow/i],
    ["/privacy", /stays on your device/i],
    ["/security", /inspectable trust boundary/i],
    ["/robots.txt", /sitemap/i],
    ["/sitemap.xml", /\/security/i],
  ]);
  for (const [route, expected] of routes) {
    const routeResponse = await fetchApp(route);
    assert.equal(routeResponse.status, 200, route);
    assert.match(await routeResponse.text(), expected, route);
  }
});

test("applies production security headers and keeps the retired API unavailable", async () => {
  const response = await fetchApp("/");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=31536000/);
  const api = await fetchApp("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(api.status, 404);
});

test("server-rendered shell has no serious or critical axe violations", async () => {
  const html = await (await fetchApp("/")).text();
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://localhost/" });
  dom.window.eval(axe.source);
  const report = await dom.window.axe.run(dom.window.document, {
    rules: { "color-contrast": { enabled: false } },
  });
  const severe = report.violations.filter((violation) =>
    violation.impact === "serious" || violation.impact === "critical",
  );
  assert.equal(
    severe.length,
    0,
    severe.map(({ id, impact, help }) => `${id} (${impact}): ${help}`).join("\n"),
  );
});

test("Codex CLI exposes help, version, validation, and secure dry-run behavior", async () => {
  const script = fileURLToPath(new URL("../scripts/panurgic-forge.mjs", import.meta.url));
  const example = fileURLToPath(new URL("../examples/forge-input.json", import.meta.url));
  const help = await execFileAsync(process.execPath, [script, "--help"], { cwd: templatePath });
  assert.match(help.stdout, /--validate/);
  assert.match(help.stdout, /read-only sandbox/i);
  const version = await execFileAsync(process.execPath, [script, "--version"], { cwd: templatePath });
  assert.equal(version.stdout.trim(), "0.2.0");
  const validate = await execFileAsync(process.execPath, [script, "--validate", example], { cwd: templatePath });
  assert.match(validate.stdout, /forge-request V1 for gpt-5\.6-sol/i);
  const dryRun = await execFileAsync(process.execPath, [script, "--dry-run", example], { cwd: templatePath });
  assert.match(dryRun.stdout, /Validated .*forge-input\.json/i);
  await assert.rejects(
    execFileAsync(process.execPath, [script, "--dry-run", example, fileURLToPath(new URL("../../panurgic-escape.json", import.meta.url))], { cwd: templatePath }),
    /Output must be a JSON file inside this workspace/i,
  );
});

test("documents and enforces the local-first signed V1 architecture", async () => {
  const [readme, workspace, contract, storage, forge, worker, privacy, workflow, proof, packageText] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../app/_components/panurgic-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/panurgic-contract.mjs", import.meta.url), "utf8"),
    readFile(new URL("../lib/panurgic-storage.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/panurgic-forge.mjs", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/release-trust.yml", import.meta.url), "utf8"),
    readFile(new URL("../proof/panurgic-flow-release-claims.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const packageJson = JSON.parse(packageText);
  assert.match(readme, /PanurgicPacketV1/i);
  assert.match(readme, /device-local/i);
  assert.match(contract, /panurgic-flow\/evidence-packet/);
  assert.match(contract, /stableStringify/);
  assert.match(contract, /ECDSA-P256-SHA256/);
  assert.match(contract, /createSigningIdentity/);
  assert.match(contract, /signPacket/);
  assert.match(contract, /verificationRunbook/);
  assert.match(contract, /judgeRunbook/); // migration alias only
  assert.match(storage, /MAX_SAVED_PROJECTS = 25/);
  assert.match(storage, /MAX_VERSIONS_PER_PROJECT = 10/);
  assert.match(storage, /indexedDB\.open/);
  assert.match(storage, /signing-identities/);
  assert.match(workspace, /file\.size > MAX_PACKET_BYTES/);
  assert.match(workspace, /verifyPacketIntegrity/);
  assert.match(workspace, /Signature valid/);
  assert.match(workspace, /Sign and download packet/);
  assert.match(workspace, /maxLength=\{MAX_RAW_EVIDENCE_LENGTH\}/);
  for (const artifactLabel of [
    "Implementation summary",
    "Stakeholder walkthrough",
    "Verification runbook",
    "Codex workflow skill",
  ]) {
    assert.match(workspace, new RegExp(artifactLabel, "i"));
  }
  assert.doesNotMatch(workspace, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  assert.doesNotMatch(workspace, /OPENAI_API_KEY|CODEX_API_KEY/);
  assert.match(forge, /model: MODEL/);
  assert.match(forge, /sandboxMode: "read-only"/);
  assert.match(forge, /approvalPolicy: "never"/);
  assert.match(forge, /networkAccessEnabled: false/);
  assert.match(forge, /webSearchMode: "disabled"/);
  assert.match(forge, /ALLOWED_CODEX_ENVIRONMENT/);
  assert.match(forge, /mkdtemp/);
  assert.match(forge, /workingDirectory: isolatedWorkspace/);
  assert.match(forge, /skipGitRepoCheck: true/);
  assert.doesNotMatch(forge, /workingDirectory: workspace/);
  assert.match(forge, /buildBrowserPacket/);
  assert.doesNotMatch(forge, /claimLedger:\s*\[\]/);
  assert.match(worker, /Content-Security-Policy/);
  assert.match(privacy, /no visitor analytics/i);
  assert.match(workflow, /actions\/attest@f7c74d28b9d84cb8768d0b8ca14a4bac6ef463e6/);
  assert.match(workflow, /id-token: write/);
  assert.match(proof, /checksum-not-identity/);
  assert.match(proof, /Cryptography does not prove that supplied evidence is semantically true/);
  assert.equal(packageJson.dependencies["@openai/codex-sdk"], "0.144.5");
  const allDependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  for (const analyticsPackage of ["@sentry/nextjs", "@vercel/analytics", "mixpanel", "posthog-js", "segment"]) {
    assert.equal(allDependencies[analyticsPackage], undefined);
  }
  assert.equal(packageJson.dependencies["drizzle-orm"], undefined);
  await assert.rejects(access(new URL("../app/api/generate/route.ts", import.meta.url)));
  await assert.rejects(access(new URL("../app/chatgpt-auth.ts", import.meta.url)));
  await assert.rejects(access(new URL("../db/schema.ts", import.meta.url)));
});

test("client assets and social card stay within release budgets", async () => {
  const assetRoot = new URL("../dist/client/assets/", import.meta.url);
  const assetNames = await readdir(assetRoot);
  const applicationAssets = assetNames.filter((name) => /\.(?:js|css)$/.test(name));
  let compressedBytes = 0;
  for (const name of applicationAssets) {
    compressedBytes += gzipSync(await readFile(new URL(name, assetRoot))).byteLength;
  }
  assert.ok(compressedBytes < 125_000, `client JS/CSS is ${compressedBytes} gzip bytes`);
  const social = await stat(new URL("../public/og.png", import.meta.url));
  assert.ok(social.size < 350_000, `social card is ${social.size} bytes`);
  const publicFiles = await readdir(new URL("../public/", import.meta.url));
  assert.equal(publicFiles.includes("og-production.png"), false);
  assert.equal(publicFiles.filter((name) => /^og.*\.(png|jpe?g|webp)$/i.test(name)).length, 1);
});
