import type { Metadata } from "next";
import { PublicPage } from "../_components/public-page";

export const metadata: Metadata = { title: "Security · Panurgic Flow" };

export default function SecurityPage() {
  return (
    <PublicPage eyebrow="Security" title="A narrow, inspectable trust boundary.">
      <p>The public product performs deterministic processing in the browser. It exposes no model-generation endpoint and never receives an OpenAI API key.</p>
      <h2>Packet safety</h2>
      <ul>
        <li>Individual packets are limited to 512 KB; transcripts and continuity archives are limited to 4 MB.</li>
        <li>Text fields and array counts are bounded before imported content is rendered.</li>
        <li>Transcript adapters are versioned, report skipped input, and apply best-effort local redaction.</li>
        <li>Content checksums use deterministic JSON canonicalization and SHA-256.</li>
        <li>Approved packets are signed with ECDSA P-256 using a non-extractable device key.</li>
        <li>Imports distinguish Signature valid, Checksum matched, Unsigned, and Modified states.</li>
      </ul>
      <h2>Continuity archives</h2>
      <p>Each archive links packet versions by packet digest, previous-entry digest, entry digest, and a final head digest. The archive ECDSA signature covers the project metadata, complete hash chain, final head digest, checksum, public key, and signer fingerprint. Verification rejects changed packet bytes, broken links, reordered entries, unsupported packet contracts, a mismatched checksum, or an invalid archive signature. Checksum-only continuity remains explicitly distinct from signer-attested continuity.</p>
      <h2>What the signature proves</h2>
      <p>A valid packet or archive signature proves that those exact bytes were signed by the private key corresponding to the displayed fingerprint and have not changed since. Establishing a human identity requires comparing that fingerprint through an independent trusted channel. Cryptography does not prove that supplied evidence is true or that every historical event was included.</p>
      <h2>Release provenance</h2>
      <p>The public repository includes a machine-readable release-claims artifact. GitHub Actions runs the locked validation workflow before GitHub OIDC and Sigstore provenance is attached to that exact artifact.</p>
      <h2>Codex companion</h2>
      <p>The local forge treats evidence as untrusted data, uses structured output, disables network and web search, refuses approvals, and runs in a read-only sandbox.</p>
      <h2>Responsible reporting</h2>
      <p>Do not include private project evidence in a public issue. Report reproducible security concerns through the repository with only the minimum redacted information needed to investigate.</p>
    </PublicPage>
  );
}
