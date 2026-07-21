import type { Metadata } from "next";
import { PublicPage } from "../_components/public-page";

export const metadata: Metadata = { title: "Security · Panurgic Flow" };

export default function SecurityPage() {
  return (
    <PublicPage eyebrow="Security" title="A narrow, inspectable trust boundary.">
      <p>The public product performs deterministic processing in the browser. It exposes no model-generation endpoint and never receives an OpenAI API key.</p>
      <h2>Packet safety</h2>
      <ul>
        <li>Imports are limited to 512 KB and validated against the V1 contract.</li>
        <li>Text fields and array counts are bounded before imported content is rendered.</li>
        <li>Content checksums use deterministic JSON canonicalization and SHA-256.</li>
        <li>Approved packets are signed with ECDSA P-256 using a non-extractable device key.</li>
        <li>Imports distinguish Signature valid, Checksum matched, Unsigned, and Modified states.</li>
      </ul>
      <h2>What the signature proves</h2>
      <p>A valid signature proves that the packet bytes were signed by the private key corresponding to the displayed fingerprint and have not changed since. Establishing a human identity requires comparing that fingerprint through an independent trusted channel. Cryptography does not prove that supplied evidence is true.</p>
      <h2>Release provenance</h2>
      <p>The public repository includes a machine-readable release-claims artifact. GitHub Actions runs the locked validation workflow before GitHub OIDC and Sigstore provenance is attached to that exact artifact.</p>
      <h2>Codex companion</h2>
      <p>The local forge treats evidence as untrusted data, uses structured output, disables network and web search, refuses approvals, and runs in a read-only sandbox.</p>
      <h2>Responsible reporting</h2>
      <p>Do not include private project evidence in a public issue. Report reproducible security concerns through the repository with only the minimum redacted information needed to investigate.</p>
    </PublicPage>
  );
}
