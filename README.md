# Codex Flight Recorder / Skill Forge

OpenAI Build Week prototype for the **Developer Tools** track.

This is the spicy hybrid we chose: a flight recorder for Codex-assisted development that also turns the observed workflow into a reusable Codex `SKILL.md`.

The product helps builders turn messy AI-assisted work into a judge-ready packet:

- Build Manifest
- README proof section
- 3-minute demo script
- Judge runbook
- Reusable Codex skill draft

## Why this project exists

AI-assisted projects often ship with a weak story: “we used AI.” Judges, teammates, and future maintainers need something better:

1. What changed?
2. What did Codex actually help with?
3. Where did the human make product and engineering decisions?
4. How can someone run and test the project?
5. Can the workflow be repeated on the next repo?

Codex Flight Recorder answers those questions by capturing repo signals and Codex notes, then using GPT-5.6 to synthesize practical artifacts.

## Quick start

Prerequisites:

- Node.js `>=22.13.0`
- `pnpm`

```bash
pnpm install
pnpm dev
```

Then open the local URL printed by the development server.

## Environment

For live generation:

```bash
OPENAI_API_KEY=...
```

Optional:

```bash
OPENAI_MODEL=gpt-5.6
```

If no key is configured, the app intentionally falls back to deterministic sample artifacts so judges can still test the full UI and export flow.

## Demo path

1. Open the app.
2. Keep the preloaded sample evidence or replace it with current repo details.
3. Click **Generate build packet**.
4. Walk through the manifest cards.
5. Open each export tab:
   - README proof
   - 3-minute demo script
   - Judge runbook
   - Codex `SKILL.md`
6. Use **Copy selected** or **Download .md** to prove the artifact path works.

## How Codex and GPT-5.6 were used

Codex was used as the build partner throughout the project:

- inspected the empty hackathon workspace
- set up the local app scaffold
- created the secure OpenAI API key flow and local `.env.local`
- debugged Windows/OneDrive package-manager and preview-server issues
- built the product UI and `/api/generate` route
- turned the brainstorm into a rubric-aware implementation
- replaced starter docs/tests with hackathon-facing materials

GPT-5.6 is used by the product as the synthesis engine. The API route sends project evidence and asks GPT-5.6 to return structured JSON containing the manifest and exportable artifacts. The deterministic fallback keeps the app testable if live API access is unavailable.

## Submission fit

Track: **Developer Tools**

Judging rubric mapping:

- **Technological Implementation:** working web app with a live OpenAI generation route and deterministic fallback.
- **Design:** one coherent judge-first product experience, not only a prompt wrapper.
- **Potential Impact:** helps AI-assisted teams preserve provenance, improve reviewability, and repeat successful workflows.
- **Quality of the Idea:** combines build provenance with reusable Codex skill generation.

## Repository structure

```text
app/
  api/generate/route.ts   # GPT-5.6 artifact generation + fallback
  page.tsx                # client UI and export interactions
  globals.css             # product visual system
tests/
  rendered-html.test.mjs  # render and starter-removal checks
```

## Validation

```bash
pnpm run build
pnpm test
```

## Known next steps

- Add automatic git log ingestion.
- Export a zipped Codex skill folder, not only a single `SKILL.md`.
- Add a diff view that separates pre-hackathon work from new hackathon-period work.
- Add local persistence for multiple build packets.
