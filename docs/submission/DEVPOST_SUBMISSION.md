# Panurgic Flow - final Devpost submission draft

> Entrant approval gate: read the project-description section, adjust any wording that does not sound like you, and explicitly approve it before it is published to Devpost.

## Tagline

Turn multi-agent coding evidence into source-linked claims, signed proof, and a reusable workflow skill.

## Category

Developer Tools

## Project description

### Inspiration

When I build with AI coding tools, the finished code usually survives, but the evidence behind it does not. Decisions are buried in chat, generated summaries lose their sources, and another person cannot easily tell what was verified. I built Panurgic Flow to preserve that record without forcing developers to install a git hook, upload private project material, or trust a hidden scoring system.

### What I built

Panurgic Flow is a local-first provenance workspace for AI-assisted development. It accepts evidence from Codex or a mixed-agent workflow, previews recognized and unrecognized lines, and turns the supplied record into a versioned evidence packet.

The workflow has three stages. Capture normalizes repository activity, test results, Codex notes, human decisions, and reusable patterns. Review creates a manifest and a claim-to-source ledger where each claim is labeled Grounded or Review. Export produces four artifacts: an implementation summary, stakeholder walkthrough, verification runbook, and Codex workflow skill.

Projects and recent packet versions stay in IndexedDB on the current device. The app falls back to session memory when persistent storage is unavailable. A checksum uses deterministic canonical JSON and SHA-256, while approved packets use ECDSA P-256 with a non-extractable device key. Re-import distinguishes Signature valid, Checksum matched, Unsigned, and Modified states instead of presenting a checksum as signer identity.

The repository also publishes a machine-readable release-claims artifact. A locked GitHub Actions workflow runs installation, dry-forge validation, lint, tests, production build, secret scanning, and claim-contract validation before GitHub OIDC and Sigstore provenance is attached to that exact file. Anyone can independently verify the repository, workflow, commit, and artifact digest with GitHub CLI attestation verification.

### Codex and GPT-5.6

Codex was my primary implementation partner for the architecture, interface refactor, deterministic contract, tests, accessibility checks, security hardening, documentation, and deployment preparation. I chose the product problem, Developer Tools audience, Panurgic Flow name, local/public trust boundary, evidence policy, artifact set, and the final claims that can be shared.

The optional trusted companion uses `@openai/codex-sdk` with `gpt-5.6-sol`. It accepts a bounded forge request and returns structured `PanurgicPacketV1` output under a read-only sandbox with approvals denied and network access and web search disabled. Its child environment is reduced through an allowlist and its working directory is an isolated temporary directory. The public website does not run the model, expose an API key, or provide a hosted generation endpoint.

During final verification, a fresh authenticated run produced a valid V1 packet with three traceable claims, two risks, a three-step verification checklist, and all four current artifacts. The imported packet identifies its source as `codex-sdk · gpt-5.6-sol`.

### What I learned

The most important boundary is that cryptographic integrity is not semantic truth. A valid ECDSA signature proves private-key control and unchanged packet bytes. The fingerprint identifies a person only after it is compared through an independent trusted channel, and neither a signature nor a checksum proves that the original evidence was accurate. Panurgic Flow therefore keeps exact sources visible, blocks signing while claims remain in Review, publishes reproducible tests, and states these limitations beside the proof.

## Developer-tool testing instructions

Supported platforms: current desktop and mobile browsers; local development on Windows, macOS, or Linux with Node.js 22.13+ and pnpm 11.

Public browser workflow:

1. Open the hosted Panurgic Flow demo, or install and run the repository with `pnpm install --frozen-lockfile` and `pnpm dev`.
2. Click **Load sample**, review the parser preview, select **Normalize recognized evidence**, then click **Build evidence packet**.
3. Verify the build manifest, claim ledger, and all four Markdown exports.
4. Copy or download an artifact, then select **Sign and download packet**.
5. Re-import the signed packet and confirm that its integrity state is **Signature valid** and that the signer fingerprint is unchanged.

No account or API key is required for this complete path.

Optional GPT-5.6 Codex path:

1. Authenticate Codex with your ChatGPT subscription using `codex login` if needed.
2. Run `pnpm codex:forge -- examples/forge-input.json`.
3. Import `outputs/panurgic-codex-packet.json` into the website.
4. Verify the source badge reads `codex-sdk · gpt-5.6-sol`, inspect its claim ledger, and sign it.

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
- **Field 27949 - Project/test URL and instructions:** Public demo: https://codex-flight-recorder.seemoreas0-0.chatgpt.site. No login, API key, or model quota is required. Click **Load sample**, review the parser preview, select **Normalize recognized evidence**, click **Build evidence packet**, inspect the manifest and claim-to-source ledger, review the four artifacts, and sign the V1 packet. Re-import the signed packet to confirm **Signature valid** and compare the ECDSA signer fingerprint. The optional Codex companion and independently verifiable GitHub release attestation are documented in the repository README.
- **Field 27950 - Primary `/feedback` Session ID:** **OWNER ACTION - paste the value returned by `/feedback` in the current primary build task. Do not substitute a Codex task ID or SDK thread ID.**
- **Field 27951 - Developer-tool installation, platforms, and testing:** Requires Node.js 22.13+ and pnpm 11. Local development supports Windows, macOS, and Linux; the hosted product supports current desktop and mobile browsers. Run `pnpm install --frozen-lockfile` and `pnpm dev`. Validate with `pnpm codex:forge:dry`, `pnpm lint`, `pnpm test`, and `pnpm proof:validate`. Verify the signed release-claims artifact with `gh attestation verify proof/panurgic-flow-release-claims.json --repo seemorecodez/panurgic-flow`. The complete public browser workflow works without rebuilding or signing in. The optional model-assisted path uses an authenticated Codex session and `pnpm codex:forge -- examples/forge-input.json`.
