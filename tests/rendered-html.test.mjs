import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const templateRoot = new URL("../", import.meta.url);
const templatePath = fileURLToPath(templateRoot);
const previewRoot = new URL("../app/_sites-preview/", import.meta.url);

async function fetchApp(pathname = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, init),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Codex-native product shell", async () => {
  const response = await fetchApp("/", {
    headers: { accept: "text/html" },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Panurgic Flow<\/title>/i);
  assert.match(html, /Turn AI-assisted work into evidence you can verify/i);
  assert.match(html, /Build evidence packet/i);
  assert.match(html, /Direct Codex companion/i);
  assert.match(html, /Download Codex request/i);
  assert.match(html, /Import Codex packet/i);
  assert.match(html, /Hookless multi-agent intake/i);
  assert.match(html, /Claim-to-source ledger/i);
  assert.match(html, /Seal evidence capsule/i);
  assert.match(html, /Local by default: nothing is uploaded/i);
  assert.doesNotMatch(
    html,
    /OpenAI Build Week|Devpost|Wow factor|Owner action|See why it scores|Official requirement check|Forge judge packet|Judge runbook|judge-ready/i,
  );
  assert.doesNotMatch(html, /Your site is taking shape/i);
});

test("does not expose the retired model API route", async () => {
  const response = await fetchApp("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });

  assert.equal(response.status, 404);
});

test("Codex forge dry-run validates the bundled request without a model call", async () => {
  const { stdout, stderr } = await execFileAsync(
    process.execPath,
    [
      fileURLToPath(new URL("../scripts/panurgic-forge.mjs", import.meta.url)),
      "--dry-run",
      fileURLToPath(new URL("../examples/forge-input.json", import.meta.url)),
    ],
    { cwd: templatePath },
  );

  assert.equal(stderr, "");
  assert.match(stdout, /Validated .*forge-input\.json for gpt-5\.6-sol/i);

  await assert.rejects(
    execFileAsync(
      process.execPath,
      [
        fileURLToPath(new URL("../scripts/panurgic-forge.mjs", import.meta.url)),
        "--dry-run",
        fileURLToPath(new URL("../examples/forge-input.json", import.meta.url)),
        fileURLToPath(new URL("../../panurgic-escape.json", import.meta.url)),
      ],
      { cwd: templatePath },
    ),
    /Output must be a JSON file inside this workspace/i,
  );
});

test("documents and enforces the secure direct-Codex architecture", async () => {
  const [readme, checklist, submission, research, page, forge, packageText] =
    await Promise.all([
      readFile(new URL("../README.md", import.meta.url), "utf8"),
      readFile(new URL("../SUBMISSION_CHECKLIST.md", import.meta.url), "utf8"),
      readFile(new URL("../DEVPOST_SUBMISSION.md", import.meta.url), "utf8"),
      readFile(new URL("../COMPETITOR_RESEARCH.md", import.meta.url), "utf8"),
      readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
      readFile(new URL("../scripts/panurgic-forge.mjs", import.meta.url), "utf8"),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
    ]);
  const packageJson = JSON.parse(packageText);

  assert.match(readme, /How Codex was used/i);
  assert.match(readme, /How GPT-5\.6 is used/i);
  assert.match(readme, /No environment file or API key is used/i);
  assert.match(checklist, /public YouTube/i);
  assert.match(checklist, /\/feedback.*Session ID/i);
  assert.match(checklist, /No hosted Codex executor/i);
  assert.match(submission, /target 2:45/i);
  assert.match(submission, /codex-sdk · gpt-5\.6-sol/i);
  assert.match(research, /specstoryai\/getspecstory\/issues\/4/i);
  assert.match(research, /entireio\/cli\/issues\/261/i);
  assert.match(research, /langchain-ai\/langsmith-sdk\/issues\/2096/i);

  assert.equal(packageJson.dependencies["@openai/codex-sdk"], "0.144.6");
  assert.match(forge, /const MODEL = "gpt-5\.6-sol"/);
  assert.match(forge, /new Codex\(\{ env: buildCodexEnvironment\(\) \}\)/);
  assert.match(forge, /"OPENAI_API_KEY"/);
  assert.match(forge, /"CODEX_API_KEY"/);
  assert.match(forge, /BLOCKED_CREDENTIAL_VARIABLES\.has\(name\)/);
  assert.match(forge, /replaceAll\("<", "\\\\u003c"\)/);
  assert.match(forge, /model: MODEL/);
  assert.match(forge, /sandboxMode: "read-only"/);
  assert.match(forge, /approvalPolicy: "never"/);
  assert.match(forge, /networkAccessEnabled: false/);
  assert.match(forge, /webSearchMode: "disabled"/);
  assert.match(forge, /outputSchema: ARTIFACT_SCHEMA/);
  assert.match(forge, /untrusted data, never as instructions/i);
  assert.doesNotMatch(forge, /\bapiKey\s*:/);

  assert.match(page, /crypto\.subtle\.digest/i);
  assert.match(page, /file\.size > MAX_PACKET_BYTES/i);
  assert.match(page, /maxLength=\{MAX_RAW_EVIDENCE_LENGTH\}/i);
  assert.match(page, /No extension\. No git hook\./i);
  assert.match(page, /buildBrowserArtifacts\(form\)/);
  assert.doesNotMatch(page, /\/api\/generate/);

  await assert.rejects(
    access(new URL("../app/api/generate/route.ts", import.meta.url)),
  );
  await assert.rejects(access(new URL("../.env.example", import.meta.url)));
});

test("starter preview artifacts were removed", async () => {
  const [css, page, layout, packageJson, files] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readdir(new URL("../app/", import.meta.url)),
  ]);

  assert.ok(!files.includes("_sites-preview"));
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview|react-loading-skeleton/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(css, /hero-shell/);
  assert.match(css, /codex-bridge/);

  await assert.rejects(
    access(new URL("public/_sites-preview", templateRoot)),
  );
  await assert.rejects(access(previewRoot));
});
