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
        <li>Paste evidence using <code>COMMIT:</code>, <code>TEST:</code>, <code>CODEX:</code>, <code>DECISION:</code>, and <code>PATTERN:</code> prefixes.</li>
        <li>Review recognized and unrecognized lines, then build the packet.</li>
        <li>Inspect the claim ledger and resolve anything marked Review.</li>
        <li>Seal and download the V1 packet. Re-import it whenever you need to verify its fingerprint.</li>
      </ol>
      <h2>Trusted Codex companion</h2>
      <p>Download a forge request and run <code>pnpm codex:forge -- request.json</code> inside an authenticated Codex environment. The companion is pinned to GPT-5.6, uses a read-only sandbox, disables network access, and returns structured V1 output for import.</p>
      <h2>Packet contract</h2>
      <p>Every current packet uses <code>kind: panurgic-flow/evidence-packet</code> and <code>schemaVersion: 1</code>. Legacy unversioned packets remain importable and are normalized in memory without modifying the original file.</p>
    </PublicPage>
  );
}
