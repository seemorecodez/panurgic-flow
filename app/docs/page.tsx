import type { Metadata } from "next";
import { PublicPage } from "../_components/public-page";

export const metadata: Metadata = { title: "Documentation · Panurgic Flow" };

export default function DocsPage() {
  return (
    <PublicPage eyebrow="Documentation" title="A portable evidence workflow.">
      <p>Panurgic Flow captures development records, maps generated claims to supplied sources, and exports a versioned packet that another person can inspect and verify.</p>
      <h2>Browser workflow</h2>
      <ol>
        <li>Create a local project or load the sample.</li>
        <li>Paste prefixed evidence, or import a bounded Codex, Claude Code, generic JSONL, Markdown, or text transcript.</li>
        <li>Review the adapter confidence, extracted evidence, skipped lines, and best-effort redaction report.</li>
        <li>Review recognized and unrecognized lines, then build the packet.</li>
        <li>Inspect the claim ledger and resolve anything marked Review.</li>
        <li>Sign and download the V1 packet. Re-import it to verify the ECDSA signature and signer fingerprint.</li>
      </ol>
      <h2>Evidence continuity</h2>
      <p>Export continuity creates a portable project archive with packet versions linked in chronological order by deterministic SHA-256 digests, then signs the complete archive with the device ECDSA P-256 key. Import verifies the checksum, every packet and chain link, the final head digest, and the archive signature before restoring it as a separate local project. Unsigned checksum-only archives remain explicitly labeled.</p>
      <p>For network-free verification, run <code>pnpm panurgic:verify -- file.json</code>. Add <code>--require-signature</code> for release policy enforcement or <code>--json</code> for automation.</p>
      <h2>Trusted Codex companion</h2>
      <p>Download a forge request and run <code>pnpm codex:forge -- request.json</code> inside an authenticated Codex environment. The companion is pinned to GPT-5.6, uses a read-only sandbox, disables network access, and returns structured V1 output for import.</p>
      <h2>Packet contract</h2>
      <p>Every current packet uses <code>kind: panurgic-flow/evidence-packet</code> and <code>schemaVersion: 1</code>. Legacy unversioned packets remain importable and are normalized in memory without modifying the original file.</p>
      <p>Continuity archives use <code>kind: panurgic-flow/continuity-bundle</code> and <code>schemaVersion: 1</code>. Transcript adapters and continuity archives do not change the packet schema.</p>
    </PublicPage>
  );
}
