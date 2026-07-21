# Panurgic Flow submission claims matrix

This is the internal source of truth for the public submission. A claim may be published only when its implementation, automated evidence, and demonstration evidence agree.

| Public claim | Implementation evidence | Automated evidence | Demonstration evidence | Approved wording |
| --- | --- | --- | --- | --- |
| The hosted workflow needs no account and keeps project evidence in the browser. | `app/_components/panurgic-workspace.tsx`, `app/privacy/page.tsx` | `tests/rendered-html.test.mjs`, `tests/live-smoke.mjs` | 00:16-00:34 | The public workflow runs locally in the browser, requires no account, and does not upload project evidence. |
| Device-local history stores up to 25 projects and ten packet versions per project, with memory fallback. | `lib/panurgic-storage.mjs` | `tests/panurgic-storage.test.mjs` | 00:16-00:34 | Projects and recent packet versions stay in IndexedDB, with a visible session-memory fallback when persistent storage is unavailable. |
| Capture recognizes repository, test, Codex, decision, and workflow evidence while preserving unrecognized lines. | `lib/panurgic-core.mjs` | `tests/panurgic-core.test.mjs` | 00:34-00:57 | Capture previews recognized and unrecognized evidence before generation, so input is not silently discarded. |
| Claims point to supplied evidence and use Grounded or Review states. | `lib/panurgic-core.mjs` | `tests/panurgic-core.test.mjs` | 00:57-01:22 | The claim ledger links each generated claim to its strongest supplied source and leaves uncertain claims marked Review. |
| Export contains exactly four current artifacts. | `lib/panurgic-core.mjs`, `app/_components/panurgic-workspace.tsx` | `tests/panurgic-core.test.mjs`, `tests/rendered-html.test.mjs` | 01:22-01:43 | The packet contains an implementation summary, stakeholder walkthrough, verification runbook, and Codex workflow skill. |
| Sealed packets use deterministic canonical JSON and SHA-256, with Verified, Unsigned, and Modified classifications. | `lib/panurgic-contract.mjs` | `tests/panurgic-core.test.mjs` | 01:43-02:08 | Re-import recomputes the fingerprint and identifies verified, unsigned, or modified packets. |
| The public product exposes no hosted model route, visitor analytics, or runtime credential. | `app/`, `worker/index.ts` | `tests/rendered-html.test.mjs`, `tests/live-smoke.mjs` | 00:16-00:34 | The hosted product has no model-generation endpoint, analytics tracker, or API-key requirement. |
| The optional Codex companion is pinned to `gpt-5.6-sol` with structured output and restrictive execution settings. | `scripts/panurgic-forge.mjs` | `tests/rendered-html.test.mjs`, `pnpm codex:forge:dry` | 02:08-02:31 | The optional local companion uses `gpt-5.6-sol`, a read-only sandbox, denied approvals, and disabled network access and web search. |
| A fresh authenticated Codex forge produces a complete V1 packet. | `scripts/panurgic-forge.mjs`, local ignored output | Authenticated forge plus contract and integrity verification | 02:08-02:31 | Final verification produced three traceable claims, two risks, a three-step verification checklist, and all four current artifacts with source `codex-sdk · gpt-5.6-sol`. |
| Humans remain responsible for evidence quality and final claims. | `README.md`, `lib/panurgic-core.mjs` | `tests/rendered-html.test.mjs` | 02:08-02:31 | Codex accelerated implementation and verification; the human entrant chose the trust boundary, evidence policy, artifact design, and final claims. |

## Publication constraints

- Use `https://www.youtube.com/watch?v=r3e1KMz23B0` as the Devpost video URL; the channel URL is not a video deliverable.
- Do not describe `judgeRunbook`; it is accepted only as a legacy migration alias and is normalized to `verificationRunbook`.
- Do not describe local persistence or capsule verification as future work; both are implemented.
- The fresh authenticated GPT-5.6 generation and contract/integrity checks pass. Keep the browser-import item separate until the generated packet is manually imported into the hosted product.
