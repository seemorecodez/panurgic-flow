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

## Two-path architecture

Panurgic Flow deliberately separates the public website from trusted Codex execution:

1. **Browser-local judge path:** deterministic generation, claim mapping, artifact export, and SHA-256 sealing happen in the browser. It needs no account, key, server route, or model quota.
2. **Trusted Codex forge:** a local Node.js companion uses `@openai/codex-sdk`, the builder's authenticated Codex session, and GPT-5.6. It runs read-only, denies approval requests, disables network and web search, and returns strict structured output for import into the website.

This follows the Codex security boundary: programmatic Codex execution stays in a trusted local environment and is never exposed by the public site.

## Judge quick path

The form opens with realistic sample data. No account or private service is required to test the browser workflow.

1. Open Panurgic Flow.
2. Keep the sample mixed-agent evidence or paste your own prefixed lines.
3. Click **Normalize evidence**, then **Forge judge packet locally**.
4. Review the manifest and claim-to-source ledger.
5. Open each artifact tab and use **Copy selected** or **Download .md**.
6. Click **Seal evidence capsule** and verify that a fingerprint appears.

For the optional model-assisted path, use **Download Codex request**, run the local forge, and use **Import Codex packet**.

## Three complaint-driven wow factors

1. **Hookless multi-agent intake.** Paste prefixed evidence from one or several coding agents. A local parser maps `COMMIT`, `TEST`, `CODEX`, `DECISION`, and `PATTERN` lines into structured fields without an IDE extension or git hook.
2. **Claim-to-source ledger.** Every generated evidence claim is matched against the strongest supplied source using deterministic token overlap. The UI labels entries **Grounded** or **Review** instead of inventing a confidence score.
3. **Tamper-evident evidence capsule.** One click exports inputs, generated artifacts, provenance labels, and the claim ledger as portable JSON with a SHA-256 fingerprint computed in the browser.

The product choices are grounded in primary-source competitor complaints documented in [COMPETITOR_RESEARCH.md](COMPETITOR_RESEARCH.md).

## Local installation

Prerequisites:

- Node.js `>=22.13.0`
- `pnpm`
- an authenticated Codex session only for the optional GPT-5.6 forge

```bash
pnpm install
pnpm dev
```

Open the local URL printed by the development server. No environment file or API key is used.

To run the trusted Codex path, sign in through Codex with your ChatGPT subscription if needed, then forge the included example:

```bash
codex login
pnpm codex:forge -- examples/forge-input.json
```

The command writes `outputs/panurgic-codex-packet.json` once and refuses to overwrite an existing packet. Import that file in the website. Pass a second JSON path to select a different output file.

## Supported platforms

- Runtime: Node.js 22.13 or newer
- Development: Windows, macOS, or Linux with `pnpm`
- Product: current desktop and mobile browsers
- Hosted target: OpenAI Sites / Cloudflare Worker-compatible output

## How to test

```bash
pnpm codex:forge:dry
pnpm lint
pnpm test
```

The suite verifies the rendered product, no-key judge flow, direct Codex architecture, secure SDK options, structured-output schema, request validation, and removal of server-side API credentials and routes.

## How Codex was used

Codex was the primary implementation partner. In the main build task it:

- inspected and initialized the hackathon workspace
- implemented the interface, browser-local generator, export interactions, and Codex SDK companion
- debugged Windows, OneDrive, package-manager, and preview issues
- researched competitor complaints and converted them into working product features
- performed the official-rules compliance pass
- added tests, documentation, deployment metadata, and judge-facing evidence
- validated and published the working site

The human chose the high-entropy hybrid concept, selected the product direction, and named it **Panurgic Flow**. Key human decisions kept every claim grounded in supplied evidence, separated public execution from the trusted Codex process, and preserved a no-key judge path.

## How GPT-5.6 is used

The local companion pins Codex to `gpt-5.6-sol`, the GPT-5.6 Power variant recommended for complex work, and supplies the exported evidence as bounded, untrusted data. Codex returns a strict structured packet containing the manifest and four exportable artifacts. The runner disables network and web search, uses a read-only sandbox, and never accepts or reads an OpenAI API key.

GPT-5.6 is the synthesis layer, not decoration: it transforms noisy build evidence into reviewer-facing documentation and a portable workflow skill. Generated claims must remain grounded in the supplied evidence and are still reviewed through the deterministic claim ledger.

OpenAI's Build Week resources distinguish Codex credits from API credits, so this architecture uses Codex directly instead of depending on Responses API quota.

## Hackathon-period evidence

Panurgic Flow is a new project created during the OpenAI Build Week submission period. The initial repository commit is dated July 18, 2026. There is no pre-hackathon product code to distinguish; the commit history and primary Codex task provide timestamped build evidence.

## Judging criteria

- **Technological Implementation:** a working browser generator and export workflow built with Codex, plus a structured GPT-5.6 Codex SDK integration with a resilient judge path.
- **Design:** a coherent control-room experience that moves from evidence intake to transparent outputs.
- **Potential Impact:** helps builders, reviewers, and teams preserve provenance and repeat successful AI-assisted workflows.
- **Quality of the Idea:** combines development provenance with workflow-to-skill generation rather than producing another generic project summary.

## Submission requirements

See [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) for the verified Devpost requirements, completed repository work, and entrant-owned steps that must be finished before the deadline.

## Repository structure

```text
app/
  page.tsx                     # browser-local product and import/export flow
  globals.css                  # visual system and responsive layout
scripts/
  panurgic-forge.mjs           # trusted local Codex SDK + GPT-5.6 companion
examples/
  forge-input.json             # safe sample request
tests/
  rendered-html.test.mjs       # render, architecture, and security checks
DEVPOST_SUBMISSION.md          # ready-to-edit description and video script
SUBMISSION_CHECKLIST.md        # official requirement handoff
COMPETITOR_RESEARCH.md         # primary-source complaint research and feature mapping
```

## Third-party software and intellectual property

Panurgic Flow uses the open-source packages listed in `package.json` and `pnpm-lock.yaml` under their respective licenses. The project code is released under the MIT License in [LICENSE](LICENSE). No third-party trademarks, copyrighted music, or unlicensed media are included in the repository or planned demo assets.

## Known next steps

- Export a zipped Codex skill folder, not only a single `SKILL.md`.
- Add a diff view for projects that existed before a hackathon period.
- Add local persistence for multiple build packets.

## Official references

- [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk)
- [Codex authentication](https://learn.chatgpt.com/docs/auth)
- [Codex models](https://learn.chatgpt.com/docs/models)
- [OpenAI Build Week resources](https://openai.devpost.com/resources)
