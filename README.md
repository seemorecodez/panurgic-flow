# Panurgic Flow

Panurgic Flow turns multi-agent development evidence into grounded claims, a judge-ready build packet, a reusable Codex `SKILL.md`, and a tamper-evident evidence capsule.

OpenAI Build Week category: **Developer Tools**

## What it does

AI-assisted projects often lose the useful story behind the code: what changed, where the human made key decisions, what Codex accelerated, how GPT-5.6 is integrated, and how another person can test the result.

Panurgic Flow captures raw evidence from Codex, Cursor, Claude Code, GitHub Copilot, or mixed-agent sessions, then produces:

- normalized repository, agent, decision, and workflow evidence without an IDE extension or git hook
- a structured build manifest
- a deterministic claim-to-source ledger that flags weakly supported claims
- a README proof section
- an under-three-minute demo script
- a judge runbook
- a reusable Codex skill draft
- a portable JSON evidence capsule with a browser-generated SHA-256 fingerprint

Every artifact can be copied or downloaded, and the complete evidence packet can be sealed as JSON.

## Judge quick path

The form opens with realistic sample data. No account or private service is required to test the interface and export flow.

1. Open Panurgic Flow.
2. Keep the sample mixed-agent evidence or paste your own prefixed lines.
3. Select **Developer Tools**.
4. Click **Normalize evidence**, then **Generate build packet**.
5. Review the manifest and claim-to-source ledger.
6. Open each artifact tab and use **Copy selected** or **Download .md**.
7. Click **Seal evidence capsule** and verify that a fingerprint appears.

If live GPT-5.6 access is unavailable, Panurgic Flow clearly labels and returns a deterministic fallback packet. The fallback exists for judge testability; it is not presented as a GPT-5.6 result.

## Three complaint-driven wow factors

1. **Hookless multi-agent intake.** Paste prefixed evidence from one or several coding agents. A local parser maps `COMMIT`, `TEST`, `CODEX`, `DECISION`, and `PATTERN` lines into structured fields without an IDE extension or git hook.
2. **Claim-to-source ledger.** Every generated evidence claim is matched against the strongest supplied source using deterministic token overlap. The UI labels entries **Grounded** or **Review** instead of inventing a confidence score.
3. **Tamper-evident evidence capsule.** One click exports inputs, generated artifacts, provenance labels, and the claim ledger as portable JSON with a SHA-256 fingerprint computed in the browser.

The product choices are grounded in primary-source competitor complaints documented in [COMPETITOR_RESEARCH.md](COMPETITOR_RESEARCH.md).

## Local installation

Prerequisites:

- Node.js `>=22.13.0`
- `pnpm`

```bash
pnpm install
pnpm dev
```

Open the local URL printed by the development server.

For live GPT-5.6 generation, copy `.env.example` to `.env.local` and set your own `OPENAI_API_KEY`. Never commit that file or share the key.

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6
```

## Supported platforms

- Runtime: Node.js 22.13 or newer
- Development: Windows, macOS, or Linux with `pnpm`
- Product: current desktop and mobile browsers
- Hosted target: OpenAI Sites / Cloudflare Worker-compatible output

## How to test

```bash
pnpm run build
pnpm test
```

The test suite verifies that the product shell server-renders, the Panurgic Flow brand and three wow factors are present, API input handling is safe, and starter artifacts are absent.

## How Codex was used

Codex was the primary implementation partner. In the main build task it:

- inspected and initialized the hackathon workspace
- implemented the UI, server route, export interactions, and deterministic judge path
- debugged Windows, OneDrive, package-manager, and preview issues
- performed the official-rules compliance pass
- added tests, documentation, deployment metadata, and judge-facing evidence
- validated and published the working site

The human chose the high-entropy hybrid concept, selected the product direction, and named it **Panurgic Flow**. Key product decisions kept generation grounded in repository evidence, made the fallback explicit, and preserved a no-key judge path.

## How GPT-5.6 is used

The server route calls the OpenAI Responses API with `gpt-5.6`. It sends project evidence as bounded, untrusted data and requests a structured JSON packet containing the manifest and four exportable artifacts.

GPT-5.6 is the synthesis layer, not decoration: it transforms noisy build evidence into reviewer-facing documentation and a portable workflow skill. Generated claims must remain grounded in the supplied evidence.

The current API smoke test reached OpenAI but returned HTTP 429 with `insufficient_quota`. Panurgic Flow handled that condition with its explicit fallback. Before the final demo, the entrant should add API credits or resolve the project spend limit, then configure the hosted runtime secret so the video can show a successful live GPT-5.6 result.

## Hackathon-period evidence

Panurgic Flow is a new project created during the OpenAI Build Week submission period. The initial repository commit is dated July 18, 2026. There is no pre-hackathon product code to distinguish; the commit history and primary Codex task provide timestamped build evidence.

## Judging criteria

- **Technological Implementation:** a working, non-trivial generator and export workflow built with Codex, with a real GPT-5.6 integration and resilient judge path.
- **Design:** a coherent control-room experience that moves from evidence intake to transparent outputs.
- **Potential Impact:** helps builders, reviewers, and teams preserve provenance and repeat successful AI-assisted workflows.
- **Quality of the Idea:** combines development provenance with workflow-to-skill generation rather than producing another generic project summary.

## Submission requirements

See [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) for the verified Devpost requirements, completed repository work, and entrant-owned steps that must be finished before the deadline.

## Repository structure

```text
app/
  api/generate/route.ts   # GPT-5.6 artifact generation and fallback
  page.tsx                # product UI and export interactions
  globals.css             # visual system and responsive layout
tests/
  rendered-html.test.mjs  # server-render and starter-removal checks
DEVPOST_SUBMISSION.md     # ready-to-edit description and video script
SUBMISSION_CHECKLIST.md   # official requirement handoff
COMPETITOR_RESEARCH.md    # primary-source complaint research and feature mapping
```

## Third-party software and intellectual property

Panurgic Flow uses the open-source packages listed in `package.json` and `pnpm-lock.yaml` under their respective licenses. The project code is released under the MIT License in [LICENSE](LICENSE). No third-party trademarks, copyrighted music, or unlicensed media are included in the repository or planned demo assets.

## Known next steps

- Export a zipped Codex skill folder, not only a single `SKILL.md`.
- Add a diff view for projects that existed before a hackathon period.
- Add local persistence for multiple build packets.
