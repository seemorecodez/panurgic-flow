# Panurgic Flow

Panurgic Flow turns AI-assisted development records into grounded claims, reusable workflow artifacts, and tamper-evident evidence packets.

- **Product:** [codex-flight-recorder.seemoreas0-0.chatgpt.site](https://codex-flight-recorder.seemoreas0-0.chatgpt.site)
- **Source:** [seemorecodez/panurgic-flow](https://github.com/seemorecodez/panurgic-flow)
- **License:** MIT

## Product workflow

1. **Capture:** create a device-local project, paste prefixed repository and agent evidence, and preview recognized or unrecognized lines.
2. **Review:** build a deterministic packet, inspect its manifest, and trace generated claims to the strongest supplied sources.
3. **Export:** copy or download artifacts, seal the complete V1 packet with SHA-256, and re-import it to verify that it has not changed.

The hosted product has no account, visitor analytics, API key, or model-generation endpoint. Up to 25 projects and ten recent packet versions per project are stored in IndexedDB on the current device. If persistent browser storage is unavailable, the product falls back to session memory and displays a warning.

## Architecture

Panurgic Flow deliberately separates its public and trusted execution paths:

- **Browser-local product:** evidence parsing, deterministic generation, claim mapping, project history, artifact export, canonical JSON sealing, and verification happen in the browser.
- **Trusted Codex companion:** an optional local CLI uses `@openai/codex-sdk` with `gpt-5.6-sol`. It runs with a read-only sandbox, no approvals, disabled network access, disabled web search, and strict structured output.

The public Cloudflare Worker adds a restrictive content security policy, frame denial, MIME sniffing protection, a no-referrer policy, and a permissions policy. `/api/generate` intentionally does not exist.

## PanurgicPacketV1

Current exports use:

```json
{
  "kind": "panurgic-flow/evidence-packet",
  "schemaVersion": 1
}
```

The full contract contains project context, normalized evidence, provenance, the manifest, four artifacts, the claim ledger, timestamps, and optional integrity metadata. Sealing hashes deterministic canonical JSON with SHA-256. Imports are classified as `verified`, `unsigned`, or `modified` after recomputation.

Legacy unversioned Panurgic Flow packets remain importable. They are normalized to V1 in memory, including migration from `judgeRunbook` to `verificationRunbook`, without changing the original file.

## Installation

Prerequisites:

- Node.js 22.13 or newer
- pnpm 11
- Windows, macOS, or Linux
- an authenticated Codex session only for the optional model-assisted forge

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Use the local URL printed by the development server. No environment file or API key is required.

## Codex forge

Validate the bundled request without starting Codex:

```bash
pnpm codex:forge -- --validate examples/forge-input.json
pnpm codex:forge:dry
```

Run the authenticated forge:

```bash
codex login
pnpm codex:forge -- examples/forge-input.json
```

The default output is `outputs/panurgic-codex-packet.json`. The CLI refuses to overwrite existing output and restricts writes to JSON files inside the workspace. Use `pnpm codex:forge -- --help` for all options.

## Verification

```bash
pnpm lint
pnpm test
```

The suite covers parsing, deterministic generation, V1 validation, legacy migration, canonicalization, integrity verification, bounded project/version storage, secure CLI behavior, public routes, security headers, accessibility structure, bundle size, and removal of the hosted generation route.

After deployment, run the signed-out production smoke test:

```bash
pnpm test:smoke
```

Release budgets are enforced at less than 125 KB gzip for combined client JavaScript/CSS and less than 350 KB for the single social card.

## Privacy and data handling

- No project evidence is uploaded by the hosted application.
- No visitor analytics or advertising trackers are present.
- Browser history is device-local and can be cleared from the product.
- Exports occur only after an explicit user action.
- Diagnostic downloads exclude project evidence and error stacks.

Read the live [privacy](https://codex-flight-recorder.seemoreas0-0.chatgpt.site/privacy), [security](https://codex-flight-recorder.seemoreas0-0.chatgpt.site/security), and [documentation](https://codex-flight-recorder.seemoreas0-0.chatgpt.site/docs) pages for the public product contract.

## Repository guide

```text
app/                         public product, routes, and error boundaries
lib/panurgic-contract.mjs    shared V1 contract, migration, sealing, verification
lib/panurgic-core.mjs        deterministic evidence parser and artifact generator
lib/panurgic-storage.mjs     bounded IndexedDB storage with memory fallback
scripts/panurgic-forge.mjs   secure local Codex companion
tests/                       domain, storage, route, security, and release checks
docs/submission/             time-bound submission documentation and research
```

## License

Copyright (c) 2026 seemorecodez. Released under the [MIT License](LICENSE).
