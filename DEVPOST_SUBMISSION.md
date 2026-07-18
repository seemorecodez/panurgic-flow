# Astro Flow — Devpost submission draft

## Tagline

Turn Codex build evidence into a judge-ready proof packet and a reusable workflow skill.

## Category

Developer Tools

## Project description

Astro Flow is a provenance and workflow-forging tool for AI-assisted development. Builders paste repository signals, Codex collaboration notes, and the repeatable pattern behind a project. GPT-5.6 synthesizes that evidence into a build manifest, README proof section, judge runbook, under-three-minute demo script, and reusable Codex `SKILL.md`.

The problem is simple: AI-assisted projects often ship without a trustworthy account of what changed, what the human decided, what Codex accelerated, and how someone else can test or repeat the work. Astro Flow makes that story concrete and exportable.

The app is a working web product with sample evidence, a GPT-5.6 Responses API route, transparent model/fallback labeling, copy and download interactions, responsive design, and a deterministic judge path when live API access is unavailable.

Codex served as the primary implementation partner across workspace setup, interface and API development, debugging, test creation, compliance review, documentation, and deployment. The human selected the product concept, chose the Developer Tools audience, named Astro Flow, and made the core design decisions around evidence grounding, transparent fallback behavior, and judge usability.

GPT-5.6 is the product's synthesis engine. It converts noisy project evidence into structured, reviewer-facing artifacts and a portable workflow skill. This is a meaningful product function, not decorative text generation.

## Developer-tool testing instructions

Supported platforms: current desktop/mobile browsers; local development on Windows, macOS, or Linux with Node.js 22.13+ and `pnpm`.

Judge path:

1. Open the hosted Astro Flow demo, or install and run the repository with `pnpm install` and `pnpm dev`.
2. Keep the preloaded sample data.
3. Click **Generate build packet**.
4. Verify the build manifest and all four Markdown exports.
5. Copy or download an artifact.

No account is required for the deterministic test path. A personal OpenAI API key enables live GPT-5.6 generation.

## Demo video script — target 2:45

**0:00–0:18 — Problem**  
AI-assisted projects often lose the build story. Judges and teammates see the result, but not what changed, what Codex accelerated, where the human decided, or how the workflow can be repeated.

**0:18–0:36 — Product**  
This is Astro Flow, a Developer Tools project that turns Codex build evidence into a judge-ready proof packet and a reusable workflow skill.

**0:36–1:02 — Input**  
Show the preloaded project, audience, repository signals, Codex and GPT-5.6 notes, and workflow pattern. Explain that every generated claim must stay grounded in this evidence.

**1:02–1:28 — GPT-5.6 generation**  
Click **Generate build packet**. Explain that the server uses the OpenAI Responses API with GPT-5.6 to synthesize the evidence into structured JSON. Show the source/model badge and the manifest.

**1:28–1:55 — Working outputs**  
Open README proof, demo script, judge runbook, and `SKILL.md`. Copy one artifact and download another to prove the product is more than a static writeup.

**1:55–2:22 — Codex workflow**  
Explain that Codex built the UI and API route, debugged the local environment, created tests, performed the rules-compliance pass, and deployed the site. Name the human decisions: the hybrid concept, Astro Flow name, evidence grounding, and transparent fallback.

**2:22–2:45 — Impact and novelty**  
Astro Flow combines provenance with reuse. It helps teams ship quickly without losing accountability, then turns a successful build pattern into a skill the next Codex task can follow.

## Final links to add

- Live demo: add judge-accessible URL
- Code repository: add public URL or properly shared private URL
- Public YouTube demo: add URL
- Primary `/feedback` Session ID: add to the required Devpost field
