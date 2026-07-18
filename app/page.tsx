"use client";

import { FormEvent, useMemo, useState } from "react";

type ArtifactResponse = {
  source: string;
  model?: string;
  warning?: string;
  manifest: {
    thesis: string;
    audience: string;
    codexRole: string;
    gptRole: string;
    evidence: string[];
    risks: string[];
    nextMilestones: string[];
  };
  readmeSection: string;
  demoScript: string;
  judgeRunbook: string;
  skillMarkdown: string;
};

type FormState = {
  projectName: string;
  targetTrack: string;
  sourceAgent: string;
  rawEvidence: string;
  audience: string;
  repoSignals: string;
  codexNotes: string;
  workflowPattern: string;
};

type ClaimLedgerEntry = {
  claim: string;
  sourceLabel: string;
  matchedTerms: string[];
  status: "Grounded" | "Review";
};

const SAMPLE_FORM: FormState = {
  projectName: "Panurgic Flow",
  targetTrack: "Developer Tools",
  sourceAgent: "Mixed agents",
  rawEvidence: `COMMIT: Added structured output, evidence export, and responsive product UI.
TEST: Build, malformed-request, compliance, and render checks pass.
CODEX: Implemented the UI and API, debugged the environment, and validated deployment.
DECISION: Keep fallback behavior explicit and every generated claim grounded.
PATTERN: raw evidence -> normalized fields -> build packet -> reusable skill.`,
  audience:
    "Hackathon builders and engineering teams who need a trustworthy story of how AI-assisted software was designed, built, tested, and repeated.",
  repoSignals:
    "Evidence: normalizes pasted evidence from multiple coding agents without an IDE extension or git hook. Export: portable evidence capsule with browser-generated SHA-256 fingerprint. Tests: local build, route fallback, accessibility pass.",
  codexNotes:
    "Generated claim mapping selects the strongest supplied source and flags weak matches for review. Codex implemented the UI/API, debugged setup, and validated deployment.",
  workflowPattern:
    "Pattern: evidence intake -> rubric-aware build manifest -> judge runbook -> README proof -> reusable Codex SKILL.md for future projects.",
};

const LOCAL_SAMPLE: ArtifactResponse = {
  source: "sample",
  model: "local",
  manifest: {
    thesis:
      "Panurgic Flow turns scattered multi-agent work into grounded claims and portable, tamper-evident proof.",
    audience:
      "Builders, reviewers, engineering teams, and hackathon judges who need to understand what changed, why it matters, and how Codex was actually used.",
    codexRole:
      "Codex acts as the implementation partner and evidence source: it helps build the project while the app turns that collaboration into auditable artifacts.",
    gptRole:
      "GPT-5.6 synthesizes repo signals, Codex notes, and workflow patterns into structured documentation and a reusable skill package.",
    evidence: [
      "Normalizes pasted evidence from multiple coding agents without requiring an IDE extension or git hook.",
      "Maps each generated claim to the strongest supplied source and flags weak matches for review.",
      "Exports a portable evidence capsule with a browser-generated SHA-256 fingerprint.",
    ],
    risks: [
      "Generated documentation must stay grounded in real repo evidence.",
      "The demo must show a working export path, not just text generation.",
    ],
    nextMilestones: [
      "Add git log ingestion.",
      "Package generated skill folders as a downloadable zip.",
      "Add side-by-side diff between prior work and hackathon-period work.",
    ],
  },
  readmeSection: `## Built with Codex and GPT-5.6

This project uses Codex as a live build partner and GPT-5.6 as a synthesis layer. Codex helped scaffold the app, debug local setup, shape the API route, and convert the workflow into testable product artifacts.

The core loop is:

1. Capture repo signals, Codex notes, and workflow decisions.
2. Generate a build manifest that explains the product, evidence, risks, and next milestones.
3. Export a judge runbook, demo script, README section, and reusable Codex skill.

The result is Panurgic Flow: not just "AI wrote code," but a clear account of what happened and how another builder can repeat the workflow.`,
  demoScript: `0:00 — Show the problem: hackathon projects need proof, setup docs, and a clear Codex/GPT-5.6 story.
0:25 — Paste multi-agent evidence into Panurgic Flow.
0:55 — Generate the build manifest and show how it maps to judging criteria.
1:25 — Open the judge runbook and README export.
1:55 — Open the generated SKILL.md and explain how the workflow becomes reusable.
2:30 — Close with impact: teams can ship faster without losing provenance or reviewability.`,
  judgeRunbook: `# Judge Runbook

1. Install dependencies with \`pnpm install\`.
2. Add \`OPENAI_API_KEY\` to \`.env.local\` or use the built-in deterministic sample mode.
3. Run \`pnpm dev\`.
4. Open the app, keep the sample evidence, and click Generate.
5. Verify that the app exports:
   - Build Manifest
   - README section
   - Demo script
   - Judge runbook
   - Codex SKILL.md

No private services are required for the fallback path.`,
  skillMarkdown: `---
name: panurgic-flow
description: Use when a builder wants to turn Codex-assisted development evidence into a README section, judge runbook, demo script, and reusable workflow.
---

# Panurgic Flow

Use this skill to document an AI-assisted build with evidence.

## Workflow

1. Gather repo signals: commits, files changed, tests, setup steps, and known limitations.
2. Gather Codex collaboration notes: where Codex accelerated implementation, where the human made product decisions, and how GPT-5.6 was used.
3. Produce a build manifest with audience, thesis, evidence, risks, and next milestones.
4. Export judge-facing instructions and a short demo script.
5. Keep claims grounded in the actual repo state.

## Quality bar

- Prefer concrete evidence over vague AI claims.
- Include setup and test instructions.
- Name the reusable pattern so future Codex sessions can apply it again.`,
};

const artifactLabels: Record<keyof Pick<ArtifactResponse, "readmeSection" | "demoScript" | "judgeRunbook" | "skillMarkdown">, string> = {
  readmeSection: "README proof",
  demoScript: "3-minute demo script",
  judgeRunbook: "Judge runbook",
  skillMarkdown: "Codex SKILL.md",
};

const artifactFileNames: Record<keyof typeof artifactLabels, string> = {
  readmeSection: "README-codex-gpt56-section.md",
  demoScript: "demo-script.md",
  judgeRunbook: "judge-runbook.md",
  skillMarkdown: "SKILL.md",
};

const submissionReadiness = [
  {
    label: "Working project",
    status: "Ready",
    note: "Runnable web app, GPT-5.6 route, deterministic judge path, and downloadable artifacts.",
  },
  {
    label: "Category",
    status: "Locked",
    note: "Developer Tools — agentic workflow provenance and reusable Codex skills.",
  },
  {
    label: "Judge documentation",
    status: "Ready",
    note: "Setup, sample data, supported platforms, test steps, and Codex/GPT-5.6 evidence are in the repo.",
  },
  {
    label: "Submission handoff",
    status: "Owner action",
    note: "Add the public YouTube demo, repository URL, and primary /feedback Session ID before submitting.",
  },
];

const wowFactors = [
  {
    number: "01",
    title: "Hookless multi-agent intake",
    complaint:
      "Observed complaint: capture can break across IDE storage changes and remote workspaces, while workflow hooks can collide with existing git setup.",
    answer:
      "Paste evidence from Codex, Cursor, Claude Code, Copilot, or a mixed session and normalize it locally—no extension or git hook required.",
  },
  {
    number: "02",
    title: "Claim-to-source ledger",
    complaint:
      "Observed complaint: transcript and trace exports can omit tool activity or fail silently, leaving reviewers unsure what supports a claim.",
    answer:
      "Every generated evidence claim is matched to the strongest supplied source; weak matches are visibly flagged for human review.",
  },
  {
    number: "03",
    title: "Tamper-evident evidence capsule",
    complaint:
      "Observed complaint: large trace exports can be slow and provide little completion visibility.",
    answer:
      "Seal the complete packet into portable JSON with a local SHA-256 fingerprint in one click.",
  },
];

const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "from",
  "into",
  "that",
  "this",
  "with",
  "using",
  "each",
  "every",
  "without",
  "your",
  "their",
  "then",
  "than",
]);

function tokenize(value: string) {
  return Array.from(
    new Set(
      (value.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
        (term) => term.length > 2 && !STOP_WORDS.has(term),
      ),
    ),
  );
}

function buildClaimLedger(
  claims: string[],
  form: FormState,
): ClaimLedgerEntry[] {
  const sources = [
    { label: "Repository signals", value: form.repoSignals },
    { label: `${form.sourceAgent} notes`, value: form.codexNotes },
    { label: "Workflow pattern", value: form.workflowPattern },
    { label: "Audience brief", value: form.audience },
  ].map((source) => ({ ...source, terms: new Set(tokenize(source.value)) }));

  return claims.map((claim) => {
    const claimTerms = tokenize(claim);
    const ranked = sources
      .map((source) => ({
        source,
        matches: claimTerms.filter((term) => source.terms.has(term)),
      }))
      .sort((left, right) => right.matches.length - left.matches.length);
    const best = ranked[0];

    return {
      claim,
      sourceLabel: best?.matches.length ? best.source.label : "No direct source match",
      matchedTerms: best?.matches.slice(0, 5) ?? [],
      status: (best?.matches.length ?? 0) >= 2 ? "Grounded" : "Review",
    };
  });
}

export default function Home() {
  const [form, setForm] = useState<FormState>(SAMPLE_FORM);
  const [artifacts, setArtifacts] = useState<ArtifactResponse>(LOCAL_SAMPLE);
  const [activeArtifact, setActiveArtifact] =
    useState<keyof typeof artifactLabels>("readmeSection");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [capsuleHash, setCapsuleHash] = useState("");

  const claimLedger = useMemo(
    () => buildClaimLedger(artifacts.manifest.evidence, form),
    [artifacts.manifest.evidence, form],
  );

  const manifestScore = useMemo(
    () => [
      {
        label: "Implementation",
        value: "Codex-native",
        note: "Shows a working generator, not a static writeup.",
      },
      {
        label: "Design",
        value: "Judge-first",
        note: "Every output maps to a submission burden.",
      },
      {
        label: "Impact",
        value: "Reusable",
        note: "Exports the workflow as a Codex skill.",
      },
      {
        label: "Entropy",
        value: "High",
        note: "The project documents itself and forges its own repeatable process.",
      },
    ],
    [],
  );

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function normalizeEvidence() {
    const groups = {
      repoSignals: [] as string[],
      codexNotes: [] as string[],
      workflowPattern: [] as string[],
    };

    for (const line of form.rawEvidence.split(/\r?\n/)) {
      const match = line
        .trim()
        .match(/^(COMMIT|TEST|CODEX|DECISION|PATTERN):\s*(.+)$/i);
      if (!match) continue;
      const prefix = match[1] ?? "";
      const value = match[2] ?? "";
      if (/^(COMMIT|TEST)$/i.test(prefix)) {
        groups.repoSignals.push(`${prefix.toUpperCase()}: ${value}`);
      }
      if (/^(CODEX|DECISION)$/i.test(prefix)) {
        groups.codexNotes.push(`${prefix.toUpperCase()}: ${value}`);
      }
      if (/^PATTERN$/i.test(prefix)) groups.workflowPattern.push(value);
    }

    const recognized = Object.values(groups).reduce(
      (total, entries) => total + entries.length,
      0,
    );
    if (!recognized) {
      setImportStatus(
        "No recognized lines. Start lines with COMMIT, TEST, CODEX, DECISION, or PATTERN.",
      );
      return;
    }

    setForm((current) => ({
      ...current,
      repoSignals: groups.repoSignals.join("\n") || current.repoSignals,
      codexNotes: groups.codexNotes.join("\n") || current.codexNotes,
      workflowPattern:
        groups.workflowPattern.join("\n") || current.workflowPattern,
    }));
    setImportStatus(
      `Normalized ${recognized} evidence lines from ${form.sourceAgent}.`,
    );
  }

  async function generateArtifacts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setCopied("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as ArtifactResponse;
      setArtifacts(payload);
    } catch {
      setArtifacts({
        ...LOCAL_SAMPLE,
        source: "local-fallback",
        warning:
          "The live generator was unreachable, so the app loaded deterministic sample artifacts.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function copySelected() {
    const text = artifacts[activeArtifact];
    await navigator.clipboard.writeText(text);
    setCopied(artifactLabels[activeArtifact]);
  }

  function downloadSelected() {
    const text = artifacts[activeArtifact];
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = artifactFileNames[activeArtifact];
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function downloadCapsule() {
    const baseCapsule = {
      schemaVersion: "1.0",
      product: "Panurgic Flow",
      createdAt: new Date().toISOString(),
      sourceAgent: form.sourceAgent,
      input: form,
      output: artifacts,
      claimLedger,
    };
    const unsignedJson = JSON.stringify(baseCapsule, null, 2);
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(unsignedJson),
    );
    const fingerprint = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const sealedCapsule = {
      ...baseCapsule,
      fingerprint: { algorithm: "SHA-256", value: fingerprint },
    };
    const blob = new Blob([JSON.stringify(sealedCapsule, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "panurgic-flow-evidence-capsule.json";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCapsuleHash(fingerprint);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#07080d] text-slate-100">
      <section className="hero-shell">
        <div className="orb orb-one" />
        <div className="orb orb-two" />

        <nav className="topbar" aria-label="Product">
          <div className="brand-mark">PF</div>
          <span>Panurgic Flow</span>
          <a href="#generator">Open the forge</a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">OpenAI Build Week · Developer Tools</p>
            <h1>
              Turn AI-assisted coding into proof, a demo, and a reusable Codex
              skill.
            </h1>
            <p className="lede">
              Panurgic Flow turns multi-agent evidence into grounded claims,
              judge-ready artifacts, and a sealed proof capsule. Builders prove
              what happened without installing capture hooks, and teams can
              repeat the workflow after the hackathon.
            </p>

            <div className="hero-actions">
              <a className="primary-action" href="#generator">
                Generate artifacts
              </a>
              <a className="secondary-action" href="#rubric">
                See why it scores
              </a>
            </div>
          </div>

          <div className="terminal-card" aria-label="Product flow preview">
            <div className="terminal-header">
              <span />
              <span />
              <span />
              <p>panurgic-flow.run</p>
            </div>
            <div className="terminal-flow">
              <div>
                <small>01 · Capture</small>
                <strong>Hookless multi-agent evidence</strong>
              </div>
              <div>
                <small>02 · Synthesize</small>
                <strong>GPT-5.6 manifest + claim ledger</strong>
              </div>
              <div>
                <small>03 · Export</small>
                <strong>Artifacts + sealed evidence capsule</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="rubric" className="rubric-grid">
        {manifestScore.map((item) => (
          <article key={item.label} className="score-card">
            <p>{item.label}</p>
            <strong>{item.value}</strong>
            <span>{item.note}</span>
          </article>
        ))}
      </section>

      <section className="wow-shell" aria-labelledby="wow-heading">
        <div className="wow-heading">
          <p className="eyebrow">Complaint-driven differentiation</p>
          <h2 id="wow-heading">
            Three gaps competitors exposed. Three working answers.
          </h2>
        </div>
        <div className="wow-grid">
          {wowFactors.map((factor) => (
            <article key={factor.number}>
              <span>{factor.number}</span>
              <h3>{factor.title}</h3>
              <p>{factor.complaint}</p>
              <strong>{factor.answer}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="readiness-shell" aria-labelledby="readiness-heading">
        <div className="readiness-heading">
          <div>
            <p className="eyebrow">Official requirement check</p>
            <h2 id="readiness-heading">Built for a clean Devpost handoff.</h2>
          </div>
          <p>
            The product and repository cover the technical requirements. The
            final identity, video, repository-sharing, and submission actions
            stay with the entrant.
          </p>
        </div>
        <div className="readiness-grid">
          {submissionReadiness.map((item) => (
            <article key={item.label}>
              <div>
                <p>{item.label}</p>
                <span className={item.status === "Owner action" ? "needs-action" : ""}>
                  {item.status}
                </span>
              </div>
              <strong>{item.note}</strong>
            </article>
          ))}
        </div>
      </section>

      <section id="generator" className="workspace-grid">
        <form className="input-panel" onSubmit={generateArtifacts}>
          <div className="panel-heading">
              <p className="eyebrow">Flow input</p>
            <h2>Feed the build story.</h2>
            <span>
              Keep the sample data for a quick judge path, or replace it with
              evidence from the current repo.
            </span>
          </div>

          <div className="intake-box">
            <div className="intake-heading">
              <div>
                <p className="eyebrow">Wow factor 01</p>
                <h3>Hookless multi-agent intake</h3>
              </div>
              <span>No extension. No git hook.</span>
            </div>
            <label>
              Evidence source
              <select
                value={form.sourceAgent}
                onChange={(event) =>
                  updateField("sourceAgent", event.target.value)
                }
              >
                <option>Mixed agents</option>
                <option>Codex</option>
                <option>Cursor</option>
                <option>Claude Code</option>
                <option>GitHub Copilot</option>
              </select>
            </label>
            <label>
              Raw evidence
              <textarea
                value={form.rawEvidence}
                onChange={(event) =>
                  updateField("rawEvidence", event.target.value)
                }
                rows={8}
              />
            </label>
            <button
              className="normalize-button"
              type="button"
              onClick={normalizeEvidence}
            >
              Normalize evidence
            </button>
            {importStatus ? <p className="status-note">{importStatus}</p> : null}
          </div>

          <label>
            Project name
            <input
              value={form.projectName}
              onChange={(event) => updateField("projectName", event.target.value)}
            />
          </label>

          <label>
            Track
            <select
              value={form.targetTrack}
              onChange={(event) => updateField("targetTrack", event.target.value)}
            >
              <option>Developer Tools</option>
              <option>Work & Productivity</option>
              <option>Education</option>
              <option>Apps for Your Life</option>
            </select>
          </label>

          <label>
            Real audience
            <textarea
              value={form.audience}
              onChange={(event) => updateField("audience", event.target.value)}
              rows={3}
            />
          </label>

          <label>
            Repo signals
            <textarea
              value={form.repoSignals}
              onChange={(event) =>
                updateField("repoSignals", event.target.value)
              }
              rows={5}
            />
          </label>

          <label>
            Codex / GPT-5.6 collaboration notes
            <textarea
              value={form.codexNotes}
              onChange={(event) => updateField("codexNotes", event.target.value)}
              rows={5}
            />
          </label>

          <label>
            Reusable workflow pattern
            <textarea
              value={form.workflowPattern}
              onChange={(event) =>
                updateField("workflowPattern", event.target.value)
              }
              rows={4}
            />
          </label>

          <button className="generate-button" disabled={isGenerating}>
            {isGenerating ? "Generating with GPT-5.6…" : "Generate build packet"}
          </button>
        </form>

        <section className="output-panel" aria-live="polite">
          <div className="panel-heading output-heading">
            <div>
              <p className="eyebrow">Build packet</p>
              <h2>{artifacts.manifest.thesis}</h2>
            </div>
            <span className="source-pill">
              {artifacts.source}
              {artifacts.model ? ` · ${artifacts.model}` : ""}
            </span>
          </div>

          {artifacts.warning ? (
            <p className="warning-note">{artifacts.warning}</p>
          ) : null}

          <div className="manifest-grid">
            <article>
              <p>Audience</p>
              <strong>{artifacts.manifest.audience}</strong>
            </article>
            <article>
              <p>Codex role</p>
              <strong>{artifacts.manifest.codexRole}</strong>
            </article>
            <article>
              <p>GPT-5.6 role</p>
              <strong>{artifacts.manifest.gptRole}</strong>
            </article>
          </div>

          <div className="signal-lists">
            <div>
              <h3>Evidence</h3>
              <ul>
                {artifacts.manifest.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Risks</h3>
              <ul>
                {artifacts.manifest.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Next milestones</h3>
              <ul>
                {artifacts.manifest.nextMilestones.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <section className="ledger-shell" aria-labelledby="ledger-heading">
            <div className="ledger-heading">
              <div>
                <p className="eyebrow">Wow factor 02</p>
                <h3 id="ledger-heading">Claim-to-source ledger</h3>
              </div>
              <span>Deterministic token matching</span>
            </div>
            <div className="ledger-grid">
              {claimLedger.map((entry) => (
                <article key={entry.claim}>
                  <div>
                    <span
                      className={
                        entry.status === "Grounded" ? "grounded" : "review"
                      }
                    >
                      {entry.status}
                    </span>
                    <small>{entry.sourceLabel}</small>
                  </div>
                  <p>{entry.claim}</p>
                  <strong>
                    {entry.matchedTerms.length
                      ? `Matched: ${entry.matchedTerms.join(", ")}`
                      : "No exact supporting terms found—verify before submission."}
                  </strong>
                </article>
              ))}
            </div>
          </section>

          <div className="artifact-tabs" role="tablist" aria-label="Artifacts">
            {(Object.keys(artifactLabels) as Array<keyof typeof artifactLabels>).map(
              (key) => (
                <button
                  key={key}
                  className={activeArtifact === key ? "active" : ""}
                  onClick={() => setActiveArtifact(key)}
                  type="button"
                >
                  {artifactLabels[key]}
                </button>
              ),
            )}
          </div>

          <div className="artifact-actions">
            <button type="button" onClick={copySelected}>
              Copy selected
            </button>
            <button type="button" onClick={downloadSelected}>
              Download .md
            </button>
            <button
              className="capsule-button"
              type="button"
              onClick={downloadCapsule}
            >
              Seal evidence capsule
            </button>
            {copied ? <span>Copied {copied}</span> : null}
          </div>

          {capsuleHash ? (
            <p className="capsule-proof">
              <span>Wow factor 03 · sealed</span>
              SHA-256 {capsuleHash.slice(0, 16)}…{capsuleHash.slice(-12)}
            </p>
          ) : null}

          <pre className="artifact-preview">{artifacts[activeArtifact]}</pre>
        </section>
      </section>
    </main>
  );
}
