import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);
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

test("server-renders the product shell", async () => {
  const response = await fetchApp("/", {
    headers: { accept: "text/html" },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Panurgic Flow<\/title>/i);
  assert.match(html, /Turn AI-assisted coding into proof/i);
  assert.match(html, /Generate build packet/i);
  assert.match(html, /README proof/i);
  assert.match(html, /Official requirement check/i);
  assert.match(html, /Hookless multi-agent intake/i);
  assert.match(html, /Claim-to-source ledger/i);
  assert.match(html, /Seal evidence capsule/i);
  assert.doesNotMatch(html, /Your site is taking shape/i);
});

test("rejects malformed generator requests without calling OpenAI", async () => {
  const response = await fetchApp("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Request body must be valid JSON.",
  });
});

test("documents the required judge handoff and secure API shape", async () => {
  const [readme, checklist, submission, research, page, route] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../SUBMISSION_CHECKLIST.md", import.meta.url), "utf8"),
    readFile(new URL("../DEVPOST_SUBMISSION.md", import.meta.url), "utf8"),
    readFile(new URL("../COMPETITOR_RESEARCH.md", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/generate/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(readme, /How Codex was used/i);
  assert.match(readme, /How GPT-5\.6 is used/i);
  assert.match(checklist, /public YouTube/i);
  assert.match(checklist, /\/feedback.*Session ID/i);
  assert.match(submission, /target 2:45/i);
  assert.match(route, /type: "json_schema"/i);
  assert.match(route, /store: false/i);
  assert.match(route, /untrusted data/i);
  assert.match(research, /specstoryai\/getspecstory\/issues\/4/i);
  assert.match(research, /entireio\/cli\/issues\/261/i);
  assert.match(research, /langchain-ai\/langsmith-sdk\/issues\/2096/i);
  assert.match(page, /crypto\.subtle\.digest/i);
  assert.match(page, /No extension\. No git hook\./i);
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

  await assert.rejects(
    access(new URL("public/_sites-preview", templateRoot)),
  );
  await assert.rejects(access(previewRoot));
});
