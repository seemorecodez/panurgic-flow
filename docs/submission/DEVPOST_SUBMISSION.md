# Panurgic Flow - final Devpost submission draft

> Entrant approval gate: read the project-description section, adjust any wording that does not sound like you, and explicitly approve it before it is published to Devpost.

## Tagline

Turn multi-agent coding evidence into grounded claims, sealed proof, and a reusable workflow skill.

## Category

Developer Tools

## Project description

### Inspiration

When I build with AI coding tools, the finished code usually survives, but the evidence behind it does not. Decisions are buried in chat, generated summaries lose their sources, and another person cannot easily tell what was verified. I built Panurgic Flow to preserve that record without forcing developers to install a git hook, upload private project material, or trust a hidden scoring system.

### What I built

Panurgic Flow is a local-first provenance workspace for AI-assisted development. It accepts evidence from Codex or a mixed-agent workflow, previews recognized and unrecognized lines, and turns the supplied record into a versioned evidence packet.

The workflow has three stages. Capture normalizes repository activity, test results, Codex notes, human decisions, and reusable patterns. Review creates a manifest and a claim-to-source ledger where each claim is labeled Grounded or Review. Export produces four artifacts: an implementation summary, stakeholder walkthrough, verification runbook, and Codex workflow skill.

Projects and recent packet versions stay in IndexedDB on the current device. The app falls back to session memory when persistent storage is unavailable. Sealing uses deterministic canonical JSON and SHA-256. When a packet is imported again, Panurgic Flow identifies it as Verified, Unsigned, or Modified.

### Codex and GPT-5.6

Codex was my primary implementation partner for the architecture, interface refactor, deterministic contract, tests, accessibility checks, security hardening, documentation, and deployment preparation. I chose the product problem, Developer Tools audience, Panurgic Flow name, local/public trust boundary, evidence policy, artifact set, and the final claims that can be shared.

The optional trusted companion uses `@openai/codex-sdk` with `gpt-5.6-sol`. It accepts a bounded forge request and returns structured `PanurgicPacketV1` output under a read-only sandbox with approvals denied and network access and web search disabled. The public website does not run the model, expose an API key, or provide a hosted generation endpoint.

During final verification, a fresh authenticated run produced a valid V1 packet with three traceable claims, two risks, a three-step verification checklist, and all four current artifacts. The imported packet identifies its source as `codex-sdk · gpt-5.6-sol`.

### What I learned

The most important boundary is that integrity is not the same as truth. A valid SHA-256 seal proves that a packet has not changed after it was sealed; it cannot prove that the original evidence was accurate. Panurgic Flow keeps the evidence visible, marks weakly supported claims for review, and leaves final approval with the human.

## Developer-tool testing instructions

Supported platforms: current desktop and mobile browsers; local development on Windows, macOS, or Linux with Node.js 22.13+ and pnpm 11.

Public browser workflow:

1. Open the hosted Panurgic Flow demo, or install and run the repository with `pnpm install --frozen-lockfile` and `pnpm dev`.
2. Click **Load sample**, review the parser preview, select **Normalize recognized evidence**, then click **Build evidence packet**.
3. Verify the build manifest, claim ledger, and all four Markdown exports.
4. Copy or download an artifact, then select **Seal and download packet**.
5. Re-import the sealed packet and confirm that its integrity state is **Verified**.

No account or API key is required for this complete path.

Optional GPT-5.6 Codex path:

1. Authenticate Codex with your ChatGPT subscription using `codex login` if needed.
2. Run `pnpm codex:forge -- examples/forge-input.json`.
3. Import `outputs/panurgic-codex-packet.json` into the website.
4. Verify the source badge reads `codex-sdk · gpt-5.6-sol`, inspect its claim ledger, and seal it.

## Demonstration video

- Direct video: https://www.youtube.com/watch?v=r3e1KMz23B0
- Channel: https://www.youtube.com/@Panurgic-Flow
- Runtime: 2:46
- Narration source: `C:\Users\frank\OneDrive\Documents\Panurgic Flow YouTube Package\NARRATION.md`

## Final links

- Live demo: https://codex-flight-recorder.seemoreas0-0.chatgpt.site
- Code repository: https://github.com/seemorecodez/panurgic-flow
- Public YouTube demo: https://www.youtube.com/watch?v=r3e1KMz23B0
- Primary `/feedback` Session ID: **OWNER ACTION - run `/feedback` in the current primary build task and add the returned ID**

## Exact Devpost field answers

- **Field 27945 - Submitter Type:** Individual
- **Field 27946 - Country of Residence:** United States
- **Field 27947 - Category:** Developer Tools
- **Field 27948 - Repository URL:** https://github.com/seemorecodez/panurgic-flow
- **Field 27949 - Project/test URL and instructions:** Public demo: https://codex-flight-recorder.seemoreas0-0.chatgpt.site. No login, API key, or model quota is required. Click **Load sample**, review the parser preview, select **Normalize recognized evidence**, click **Build evidence packet**, inspect the manifest and claim-to-source ledger, review the four artifacts, and seal the V1 packet. Re-import the sealed packet to confirm that its integrity state is **Verified**. The optional Codex companion is documented in the repository README.
- **Field 27950 - Primary `/feedback` Session ID:** **OWNER ACTION - paste the value returned by `/feedback` in the current primary build task. Do not substitute a Codex task ID or SDK thread ID.**
- **Field 27951 - Developer-tool installation, platforms, and testing:** Requires Node.js 22.13+ and pnpm 11. Local development supports Windows, macOS, and Linux; the hosted product supports current desktop and mobile browsers. Run `pnpm install --frozen-lockfile` and `pnpm dev`. Validate with `pnpm codex:forge:dry`, `pnpm lint`, and `pnpm test`. The complete public browser workflow works without rebuilding or signing in. The optional model-assisted path uses an authenticated Codex session and `pnpm codex:forge -- examples/forge-input.json`.
