# Panurgic Flow - Devpost submission draft

## Tagline

Turn Codex build evidence into a judge-ready proof packet and a reusable workflow skill.

## Category

Developer Tools

## Project description

Panurgic Flow is a provenance and workflow-forging tool for multi-agent development. Builders paste evidence from Codex, Cursor, Claude Code, GitHub Copilot, or mixed sessions. The product turns that evidence into a build manifest, README proof section, judge runbook, under-three-minute demo script, and reusable Codex `SKILL.md`.

The problem is simple: AI-assisted projects often ship without a trustworthy account of what changed, what the human decided, what each agent accelerated, and how someone else can test or repeat the work. Panurgic Flow makes that story concrete, source-linked, and portable.

The app has two intentionally separated execution paths. Its hosted judge path performs evidence normalization, deterministic artifact generation, claim-to-source mapping, and SHA-256 capsule sealing entirely in the browser, so it needs no account, API key, or model quota. Its trusted local companion uses the OpenAI Codex SDK with GPT-5.6, strict structured output, a read-only sandbox, no approvals, and disabled network/web search. Builders export evidence from the site, forge a packet through their authenticated Codex session, then import it for inspection and sealing.

Codex served as the primary implementation partner across workspace setup, interface and SDK development, competitor research, debugging, test creation, compliance review, documentation, and deployment. The human selected the concept and Developer Tools audience, named Panurgic Flow, and made the core product decisions around evidence grounding, the public/trusted security boundary, and judge usability.

GPT-5.6 is the synthesis engine in the Codex companion. It converts noisy project evidence into structured reviewer-facing artifacts and a portable workflow skill. This is a meaningful product function, not decorative text generation.

## Developer-tool testing instructions

Supported platforms: current desktop/mobile browsers; local development on Windows, macOS, or Linux with Node.js 22.13+ and `pnpm`.

Browser judge path:

1. Open the hosted Panurgic Flow demo, or install and run the repository with `pnpm install` and `pnpm dev`.
2. Keep the preloaded sample data.
3. Click **Normalize evidence**, then **Forge judge packet locally**.
4. Verify the build manifest, claim ledger, and all four Markdown exports.
5. Copy or download an artifact, then seal the JSON evidence capsule.

No account or API key is required for this complete path.

Optional GPT-5.6 Codex path:

1. Authenticate Codex with your ChatGPT subscription using `codex login` if needed.
2. Run `pnpm codex:forge -- examples/forge-input.json`.
3. Import `outputs/panurgic-codex-packet.json` into the website.
4. Verify the source badge reads `codex-sdk · gpt-5.6-sol`, inspect its claim ledger, and seal it.

## Demo video script - target 2:45

**0:00-0:18 - Problem**

AI-assisted projects often lose the build story. Judges and teammates see the result, but not what changed, what Codex accelerated, where the human decided, or how the workflow can be repeated.

**0:18-0:36 - Product**

This is Panurgic Flow, a Developer Tools project that turns multi-agent build evidence into grounded claims, a judge-ready proof packet, and a reusable workflow skill.

**0:36-1:00 - Input**

Show the preloaded repository signals, Codex and GPT-5.6 notes, human decision, and workflow pattern. Normalize the prefixed evidence and explain that generated claims must stay grounded in these sources.

**1:00-1:24 - No-key judge path**

Click **Forge judge packet locally**. Show the browser-local source badge, manifest, claim ledger, and export tabs. Explain that this working path has no account, API key, server route, or quota dependency.

**1:24-1:52 - Direct Codex with GPT-5.6**

Download the Codex request. In a terminal, run `pnpm codex:forge -- examples/forge-input.json`, explain that Sol is the GPT-5.6 Power variant, show the read-only structured-output guardrails, and import the resulting packet. Show the `codex-sdk · gpt-5.6-sol` badge.

**1:52-2:18 - Working outputs**

Open README proof, demo script, judge runbook, and `SKILL.md`. Copy one artifact, download another, then seal the JSON evidence capsule and show its SHA-256 fingerprint.

**2:18-2:45 - Codex role and impact**

Explain that Codex built the interface and forge, researched competitor complaints, debugged the environment, created tests, performed the compliance pass, and deployed the site. Name the human decisions: the hybrid concept, Panurgic Flow name, evidence grounding, and trusted/public split. Close on the three complaint-driven differentiators: hookless intake, claim-to-source review, and portable sealed proof.

## Final links to add

- Live demo: add judge-accessible URL
- Code repository: add public URL or properly shared private URL
- Public YouTube demo: add URL
- Primary `/feedback` Session ID: add to the required Devpost field
