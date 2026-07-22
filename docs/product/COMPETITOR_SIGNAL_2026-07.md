# Evidence Continuity competitor signal — July 2026

## Research question

What repeated complaints from users and developers should define Panurgic Flow's next production milestone after signed release evidence?

## Repeated complaints

### 1. Session history is fragile and trapped inside one surface

- Cursor users report history disappearing after updates or restarts, sometimes repeatedly, with no supported recovery path. Cursor community guidance says local transcript writes were not atomic in at least one affected version and that no server copy was available for recovery: [history not saving](https://forum.cursor.com/t/chat-history-lost-not-saving/138587), [empty transcript files after restart](https://forum.cursor.com/t/chat-history-gone-after-pc-restart-agent-transcripts-files-emptied-how-to-recover/158251/5).
- Cursor users requested an export because project restarts can strand or erase associated history and storage changes broke community workarounds: [chat history export request](https://forum.cursor.com/t/feature-request-chat-history-export/37173).
- Claude Code users report local transcripts failing to persist because a documented retention setting behaved differently from its schema description: [cleanup setting disables persistence](https://github.com/anthropics/claude-code/issues/23710).
- Claude Code users also describe CLI, desktop, and web histories as separate islands, making manual export impractical for daily use: [CLI/desktop history sync request](https://github.com/anthropics/claude-code/issues/61967).

### 2. Downstream transcript consumers fail silently when schemas drift

- Developers consuming Claude Code JSONL asked for a stable, versioned schema because field changes can silently mis-parse transcripts before anyone notices: [stable transcript schema request](https://github.com/anthropics/claude-code/issues/53516).
- OpenTelemetry's agent conventions are still evolving because existing GenAI telemetry does not completely model tasks, actions, teams, artifacts, or memory. The proposal explicitly describes fragmented custom instrumentation: [agentic semantic conventions](https://github.com/open-telemetry/semantic-conventions/issues/2664).
- Current OpenTelemetry releases continue to include breaking GenAI convention changes, reinforcing the need for adapter versions and explicit diagnostics rather than format assumptions: [semantic-conventions releases](https://github.com/open-telemetry/semantic-conventions/releases).

### 3. Cloud tracing and export paths can be operationally opaque

- LangSmith users report successful application calls with missing traces and little or no error visibility: [traces not captured](https://github.com/langchain-ai/langsmith-sdk/issues/216).
- A LangSmith bulk export of roughly 600 agentic traces remained in `Running` for many hours, leaving the developer unable to tell whether the export was complete and raising concerns about larger archives: [slow bulk export](https://github.com/langchain-ai/langsmith-sdk/issues/2096).
- LangSmith users also reported memory growth while live trace trees retained inputs, outputs, and metadata: [trace memory growth](https://github.com/langchain-ai/langsmith-sdk/issues/2009).
- Langfuse self-hosters asked for project-level retention and automated cleanup because manual deletes are operational work and can be slow on large stores: [data-retention discussion](https://github.com/orgs/langfuse/discussions/2268).

### 4. Verification tools expose cryptography without always explaining the result clearly

- Cosign has an open request for explicit success indicators when certificate-chain and timestamp checks pass: [verification success indicators](https://github.com/sigstore/cosign/issues/4817).
- Large attestation payloads create transparency-log and interoperability tradeoffs: [large payload attestation discussion](https://github.com/sigstore/cosign/issues/3599).
- Offline verification is possible, but it requires carrying the correct bundle and trust material. That makes a self-describing local verifier valuable: [GitHub offline attestation verification](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/verify-attestations-offline).

## Product decision

The next milestone is **Evidence Continuity 0.3**, not another observability dashboard.

It gives users a recovery/export path and gives developers explicit format and integrity diagnostics:

1. Import bounded Codex, Claude Code, generic JSONL, Markdown, or prefixed evidence files locally.
2. Redact common credentials, bearer tokens, email addresses, and home-directory identities before evidence enters the workspace.
3. Report the selected adapter version, confidence, inspected events, extracted evidence, skipped lines, truncation, and redaction counts.
4. Export a portable project archive whose packet versions form a deterministic SHA-256 hash chain signed as one archive with ECDSA P-256.
5. Re-import that archive without overwriting an existing project.
6. Verify packets and continuity archives through a dependency-free, network-free CLI with human and JSON output.
7. Allow policy enforcement with `--require-signature` so checksum continuity is never confused with signer-attested continuity.

## Trust boundary

- Transcript adapters produce **evidence candidates**, not verified facts.
- Redaction is best-effort and must not be described as a complete secret scanner.
- A continuity checksum detects accidental byte and ordering changes, but it can be recomputed and is not signer identity.
- A valid archive signature covers the project metadata, every packet and chain link, the final head digest, and the signer fingerprint.
- A signature proves key control over the archived bytes, not human identity, semantic truth, or that the signer included every historical event.
- No imported transcript or bundle is uploaded by the hosted application.

## Resource boundary

- Transcript and continuity imports are capped at 4 MB.
- Transcript inspection is capped at 20,000 lines and 400 extracted evidence candidates.
- Existing 50,000-character evidence, 512 KB packet, 25-project, and ten-version limits remain.
- The milestone adds no analytics, databases, background sync, watchers, or runtime dependencies.
