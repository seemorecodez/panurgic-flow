# Panurgic Flow - Devpost submission draft

> Entrant gate: rewrite the project-description section in your own voice before pasting it into Devpost. Preserve the verified technical facts, but do not submit this AI-assisted draft as-is.

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

- Live demo: https://codex-flight-recorder.seemoreas0-0.chatgpt.site
- Code repository: https://github.com/seemorecodez/panurgic-flow
- Public or Unlisted YouTube demo: **OWNER ACTION — add URL**
- Primary `/feedback` Session ID: **OWNER ACTION — run `/feedback` in the primary build task and add the returned ID**

## Exact Devpost field answers

- **Submitter Type:** Individual
- **Country of Residence:** United States
- **Category:** Developer Tools
- **Repository URL:** https://github.com/seemorecodez/panurgic-flow
- **Project/test URL and judge instructions:** Public demo: https://codex-flight-recorder.seemoreas0-0.chatgpt.site. No login, API key, or model quota is required. Keep the sample evidence, click **Normalize evidence**, click **Forge judge packet locally**, inspect the manifest and claim-to-source ledger, then download an artifact and seal the evidence capsule. The optional direct Codex path is documented in the repository README.
- **Primary `/feedback` Session ID:** **OWNER ACTION — paste the value returned by `/feedback` in the current primary build task. Do not substitute an SDK thread ID.**
- **Developer-tool installation, platforms, and testing:** Requires Node.js 22.13+ and `pnpm`; local development supports Windows, macOS, and Linux, while the hosted product supports current desktop and mobile browsers. Run `pnpm install` and `pnpm dev`. Validate with `pnpm codex:forge:dry`, `pnpm lint`, and `pnpm test`. Judges can use the complete public browser path without rebuilding or signing in. The optional model-assisted path uses an authenticated Codex session and `pnpm codex:forge -- examples/forge-input.json`.
