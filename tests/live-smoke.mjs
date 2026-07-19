import assert from "node:assert/strict";

const base = process.env.PANURGIC_LIVE_URL ?? "https://codex-flight-recorder.seemoreas0-0.chatgpt.site";
const home = await fetch(base, { redirect: "follow" });
assert.equal(home.status, 200);
const html = await home.text();
assert.match(html, /Turn AI-assisted work into evidence you can verify/i);
assert.match(html, /Start a local project/i);
assert.match(html, /Device-local history/i);
assert.doesNotMatch(html, /OpenAI Build Week|Devpost|Wow factor|Owner action|judge-ready|product roadmap/i);
assert.equal(home.headers.get("x-content-type-options"), "nosniff");
assert.match(home.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/i);

for (const route of ["/docs", "/privacy", "/security", "/robots.txt", "/sitemap.xml"]) {
  const response = await fetch(`${base}${route}`);
  assert.equal(response.status, 200, `${route} should be public`);
}

const retiredApi = await fetch(`${base}/api/generate`, { method: "POST", body: "{}" });
assert.equal(retiredApi.status, 404);
const social = await fetch(`${base}/og.png`);
assert.equal(social.status, 200);
assert.ok(Number(social.headers.get("content-length") ?? 0) < 350_000);
console.log(`Panurgic Flow live smoke passed for ${base}.`);
