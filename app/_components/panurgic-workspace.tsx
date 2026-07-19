"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FORGE_REQUEST_KIND,
  MAX_CONTEXT_LENGTH,
  MAX_PACKET_BYTES,
  MAX_PROJECT_NAME_LENGTH,
  MAX_RAW_EVIDENCE_LENGTH,
  normalizePacket,
  sealPacket,
  verifyPacketIntegrity,
} from "@/lib/panurgic-contract.mjs";
import type {
  IntegrityStatus,
  PanurgicPacketV1,
} from "@/lib/panurgic-contract.mjs";
import {
  buildBrowserPacket,
  EMPTY_FORM,
  formFromPacket,
  normalizationPatch,
  parseEvidence,
  SAMPLE_FORM,
} from "@/lib/panurgic-core.mjs";
import type { FormState } from "@/lib/panurgic-core.mjs";
import {
  AUTOSAVE_DELAY_MS,
  clearProjects,
  deleteProject,
  listProjects,
  listVersions,
  saveProject,
  saveVersion,
} from "@/lib/panurgic-storage.mjs";
import type {
  ProjectRecord,
  StorageMode,
  VersionRecord,
} from "@/lib/panurgic-storage.mjs";

type Stage = "capture" | "review" | "export";
type LedgerFilter = "all" | "grounded" | "review";
type ArtifactKey = keyof PanurgicPacketV1["artifacts"];

const artifactLabels: Record<ArtifactKey, string> = {
  implementationSummary: "Implementation summary",
  stakeholderWalkthrough: "Stakeholder walkthrough",
  verificationRunbook: "Verification runbook",
  codexSkill: "Codex workflow skill",
};

const artifactFileNames: Record<ArtifactKey, string> = {
  implementationSummary: "implementation-summary.md",
  stakeholderWalkthrough: "stakeholder-walkthrough.md",
  verificationRunbook: "verification-runbook.md",
  codexSkill: "SKILL.md",
};

function newId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random()}`;
}

function downloadFile(fileName: string, value: string, type: string) {
  const blob = new Blob([value], { type });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

function downloadJson(fileName: string, value: unknown) {
  downloadFile(fileName, `${JSON.stringify(value, null, 2)}\n`, "application/json");
}

function hasProjectContent(form: FormState) {
  return Boolean(form.projectName.trim() || form.rawEvidence.trim());
}

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function IntegrityBadge({ status }: { status: IntegrityStatus }) {
  const labels: Record<IntegrityStatus, string> = {
    verified: "Verified fingerprint",
    unsigned: "Unsigned packet",
    modified: "Modified packet",
  };
  return <span className={`integrity-badge ${status}`}>{labels[status]}</span>;
}

export function PanurgicWorkspace() {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [packet, setPacket] = useState<PanurgicPacketV1 | null>(null);
  const [stage, setStage] = useState<Stage>("capture");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<StorageMode | "loading">("loading");
  const [saveStatus, setSaveStatus] = useState("Ready");
  const [statusMessage, setStatusMessage] = useState(
    "Create a project or load the sample to begin.",
  );
  const [integrityStatus, setIntegrityStatus] = useState<IntegrityStatus>("unsigned");
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>("all");
  const [activeArtifact, setActiveArtifact] = useState<ArtifactKey>("implementationSummary");
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const projectCreatedAt = useRef<string | null>(null);

  const parsedEvidence = useMemo(() => parseEvidence(form.rawEvidence), [form.rawEvidence]);
  const recognizedCount =
    parsedEvidence.repository.length +
    parsedEvidence.agent.length +
    parsedEvidence.decisions.length +
    parsedEvidence.patterns.length;
  const filteredLedger = useMemo(
    () =>
      packet?.claimLedger.filter(
        (entry) => ledgerFilter === "all" || entry.status === ledgerFilter,
      ) ?? [],
    [ledgerFilter, packet],
  );

  async function refreshProjects(preferredId?: string | null) {
    const result = await listProjects();
    setStorageMode(result.mode);
    setProjects(result.projects);
    const id = preferredId ?? currentProjectId;
    if (id) {
      const versionResult = await listVersions(id);
      setStorageMode(versionResult.mode);
      setVersions(versionResult.versions);
    } else {
      setVersions([]);
    }
  }

  useEffect(() => {
    let active = true;
    listProjects().then((result) => {
      if (!active) return;
      setStorageMode(result.mode);
      setProjects(result.projects);
      setSaveStatus(result.mode === "indexeddb" ? "Device storage ready" : "Session memory only");
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currentProjectId || !hasProjectContent(form)) return;
    const timer = window.setTimeout(async () => {
      const now = new Date().toISOString();
      const result = await saveProject({
        id: currentProjectId,
        name: form.projectName.trim() || "Untitled project",
        form,
        createdAt: projectCreatedAt.current ?? now,
        updatedAt: now,
      });
      projectCreatedAt.current ??= now;
      setStorageMode(result.mode);
      setSaveStatus(result.mode === "indexeddb" ? "Saved on this device" : "Saved for this session");
      const projectResult = await listProjects();
      const versionResult = await listVersions(currentProjectId);
      setStorageMode(versionResult.mode);
      setProjects(projectResult.projects);
      setVersions(versionResult.versions);
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [currentProjectId, form]);

  function ensureProjectId() {
    if (currentProjectId) return currentProjectId;
    const id = newId("project");
    projectCreatedAt.current = new Date().toISOString();
    setCurrentProjectId(id);
    return id;
  }

  function updateField(field: keyof FormState, value: string) {
    ensureProjectId();
    setForm((current) => ({ ...current, [field]: value }));
    setSaveStatus("Changes pending");
    setErrors((current) => ({ ...current, [field]: "" }));
    setPacket(null);
    setIntegrityStatus("unsigned");
    setConfirmDelete(false);
  }

  function createBlankProject() {
    setCurrentProjectId(null);
    projectCreatedAt.current = null;
    setForm({ ...EMPTY_FORM });
    setPacket(null);
    setVersions([]);
    setStage("capture");
    setErrors({});
    setIntegrityStatus("unsigned");
    setStatusMessage("New local project ready.");
    setConfirmDelete(false);
  }

  function loadSample() {
    const id = newId("project");
    projectCreatedAt.current = new Date().toISOString();
    setCurrentProjectId(id);
    setForm({ ...SAMPLE_FORM });
    setPacket(null);
    setVersions([]);
    setStage("capture");
    setErrors({});
    setIntegrityStatus("unsigned");
    setStatusMessage("Sample loaded. Review the parser preview, then build a packet.");
  }

  async function openProject(project: ProjectRecord) {
    setCurrentProjectId(project.id);
    projectCreatedAt.current = project.createdAt;
    setForm({ ...project.form });
    setPacket(null);
    setStage("capture");
    setErrors({});
    setIntegrityStatus("unsigned");
    setStatusMessage(`${project.name} opened from this device.`);
    const result = await listVersions(project.id);
    setStorageMode(result.mode);
    setVersions(result.versions);
  }

  function duplicateCurrentProject() {
    if (!hasProjectContent(form)) return;
    const id = newId("project");
    projectCreatedAt.current = new Date().toISOString();
    setCurrentProjectId(id);
    setForm((current) => ({
      ...current,
      projectName: `${current.projectName || "Untitled project"} copy`.slice(0, MAX_PROJECT_NAME_LENGTH),
    }));
    setPacket(null);
    setVersions([]);
    setStage("capture");
    setStatusMessage("Project duplicated locally.");
  }

  async function removeCurrentProject() {
    if (!currentProjectId) return;
    const result = await deleteProject(currentProjectId);
    setStorageMode(result.mode);
    createBlankProject();
    await refreshProjects(null);
    setStatusMessage("Project and its saved versions were deleted from this device.");
  }

  async function removeAllProjects() {
    const result = await clearProjects();
    setStorageMode(result.mode);
    setProjects([]);
    setConfirmClear(false);
    createBlankProject();
    setStatusMessage("All Panurgic Flow data was cleared from this device.");
  }

  async function exportCurrentProject() {
    if (!currentProjectId || !hasProjectContent(form)) return;
    const versionResult = await listVersions(currentProjectId);
    const project = projects.find((entry) => entry.id === currentProjectId) ?? {
      id: currentProjectId,
      name: form.projectName || "Untitled project",
      form,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    downloadJson("panurgic-flow-project.json", {
      kind: "panurgic-flow/project-export",
      schemaVersion: 1,
      project,
      versions: versionResult.versions,
    });
    setStatusMessage("Project history exported as JSON.");
  }

  function normalizeCurrentEvidence() {
    if (!form.rawEvidence.trim()) {
      setErrors((current) => ({ ...current, rawEvidence: "Add evidence before normalizing." }));
      return;
    }
    setForm((current) => ({ ...current, ...normalizationPatch(current) }));
    setSaveStatus("Changes pending");
    setStatusMessage(
      `${recognizedCount} evidence line${recognizedCount === 1 ? "" : "s"} mapped; ${parsedEvidence.unrecognized.length} need manual review.`,
    );
  }

  async function buildPacket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.projectName.trim()) nextErrors.projectName = "Name the project.";
    if (!form.rawEvidence.trim()) nextErrors.rawEvidence = "Add at least one evidence line.";
    if (parsedEvidence.unrecognized.length && recognizedCount === 0) {
      nextErrors.rawEvidence = "Use prefixes such as COMMIT, TEST, CODEX, DECISION, or PATTERN.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatusMessage("Resolve the highlighted fields before building a packet.");
      return;
    }
    const projectId = ensureProjectId();
    const nextPacket = buildBrowserPacket(form);
    setPacket(nextPacket);
    setIntegrityStatus("unsigned");
    setStage("review");
    const storageResult = await saveVersion({
      id: newId("version"),
      projectId,
      createdAt: nextPacket.createdAt,
      packet: nextPacket,
    });
    setStorageMode(storageResult.mode);
    await refreshProjects(projectId);
    setStatusMessage("Evidence packet built locally. Review its claims before sealing.");
    window.setTimeout(() => headingRef.current?.focus(), 0);
  }

  function downloadCodexRequest() {
    const projectId = ensureProjectId();
    downloadJson("panurgic-flow-forge-request.json", {
      kind: FORGE_REQUEST_KIND,
      schemaVersion: 1,
      requestedModel: "gpt-5.6-sol",
      projectId,
      evidence: {
        project: {
          name: form.projectName || "Untitled project",
          agentMix: form.agentMix,
          goals: form.goals,
          technicalProof: form.technicalProof,
          codexNotes: form.codexNotes,
          workflow: form.workflow,
        },
        raw: form.rawEvidence,
        parserVersion: 1,
        normalized: parsedEvidence,
      },
    });
    setStatusMessage("Codex request downloaded for trusted local synthesis.");
  }

  async function importPacket(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_PACKET_BYTES) {
      setStatusMessage("That packet is larger than the 512 KB import limit.");
      return;
    }
    try {
      const value = JSON.parse(await file.text());
      const { packet: imported, migrated } = normalizePacket(value);
      const integrity = await verifyPacketIntegrity(imported);
      const projectId = newId("project");
      setCurrentProjectId(projectId);
      projectCreatedAt.current = imported.createdAt;
      setForm(formFromPacket(imported));
      setPacket(imported);
      setIntegrityStatus(integrity.status);
      setStage("review");
      await saveProject({
        id: projectId,
        name: imported.project.name,
        form: formFromPacket(imported),
        createdAt: imported.createdAt,
        updatedAt: new Date().toISOString(),
      });
      await saveVersion({
        id: newId("version"),
        projectId,
        createdAt: new Date().toISOString(),
        packet: imported,
      });
      await refreshProjects(projectId);
      setStatusMessage(
        `${migrated ? "Legacy packet migrated to V1. " : "V1 packet imported. "}${integrity.reason}`,
      );
      window.setTimeout(() => headingRef.current?.focus(), 0);
    } catch (error) {
      setIntegrityStatus("modified");
      setStatusMessage(error instanceof Error ? error.message : "The selected packet is invalid.");
    }
  }

  async function openVersion(version: VersionRecord) {
    setPacket(version.packet);
    setForm(formFromPacket(version.packet));
    const integrity = await verifyPacketIntegrity(version.packet);
    setIntegrityStatus(integrity.status);
    setStage("review");
    setStatusMessage(`Version from ${formatTimestamp(version.createdAt)} restored for review.`);
  }

  async function copyArtifact() {
    if (!packet) return;
    try {
      await navigator.clipboard.writeText(packet.artifacts[activeArtifact]);
      setCopied(true);
      setStatusMessage(`${artifactLabels[activeArtifact]} copied.`);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setStatusMessage("Clipboard access was blocked. Download the artifact instead.");
    }
  }

  function downloadArtifact() {
    if (!packet) return;
    downloadFile(
      artifactFileNames[activeArtifact],
      packet.artifacts[activeArtifact],
      "text/markdown;charset=utf-8",
    );
    setStatusMessage(`${artifactLabels[activeArtifact]} downloaded.`);
  }

  async function sealAndDownload() {
    if (!packet) return;
    try {
      const sealed = await sealPacket(packet);
      const verification = await verifyPacketIntegrity(sealed);
      setPacket(sealed);
      setIntegrityStatus(verification.status);
      downloadJson("panurgic-flow-evidence-packet.json", sealed);
      if (currentProjectId) {
        await saveVersion({
          id: newId("version"),
          projectId: currentProjectId,
          createdAt: new Date().toISOString(),
          packet: sealed,
        });
        await refreshProjects(currentProjectId);
      }
      setStatusMessage("Packet sealed and verified. Keep the fingerprint with the exported file.");
    } catch {
      setStatusMessage("This browser could not seal the packet. Try a current browser.");
    }
  }

  function handleArtifactKeys(event: KeyboardEvent<HTMLButtonElement>, key: ArtifactKey) {
    const keys = Object.keys(artifactLabels) as ArtifactKey[];
    const index = keys.indexOf(key);
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = event.key === "ArrowRight"
      ? keys[(index + 1) % keys.length]
      : keys[(index - 1 + keys.length) % keys.length];
    setActiveArtifact(next);
    document.getElementById(`artifact-tab-${next}`)?.focus();
  }

  return (
    <main>
      <section className="hero-shell">
        <nav className="topbar" aria-label="Primary navigation">
          <Link className="brand" href="/" aria-label="Panurgic Flow home">
            <span aria-hidden="true">PF</span>
            Panurgic Flow
          </Link>
          <div className="nav-links">
            <Link href="/docs">Docs</Link>
            <Link href="/security">Security</Link>
            <a className="nav-cta" href="#workspace">Open workspace</a>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Agentic development provenance</p>
            <h1>Turn AI-assisted work into evidence you can verify.</h1>
            <p className="hero-lede">
              Capture development records, trace generated claims to their sources,
              and export tamper-evident packets without uploading project data.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#workspace">Start a local project</a>
              <button className="secondary-action" type="button" onClick={loadSample}>
                Try the sample
              </button>
            </div>
            <ul className="trust-list" aria-label="Product assurances">
              <li>No account</li>
              <li>No hosted model endpoint</li>
              <li>Device-local history</li>
            </ul>
          </div>

          <div className="terminal-card" aria-label="Panurgic Flow product sequence">
            <div className="terminal-bar"><span /><span /><span /><small>panurgic-flow.run</small></div>
            <div className="flow-step"><small>01 · Capture</small><strong>Normalize multi-agent evidence</strong></div>
            <div className="flow-step"><small>02 · Review</small><strong>Trace claims to supplied sources</strong></div>
            <div className="flow-step"><small>03 · Export</small><strong>Seal and verify portable packets</strong></div>
          </div>
        </div>
      </section>

      <section className="principles" aria-label="Trust model">
        <article><small>Execution</small><strong>Local-first</strong><p>The hosted workflow runs in your browser.</p></article>
        <article><small>Grounding</small><strong>Traceable</strong><p>Claims point back to supplied evidence.</p></article>
        <article><small>Integrity</small><strong>Verifiable</strong><p>SHA-256 exposes changes after sealing.</p></article>
        <article><small>Control</small><strong>Human-reviewed</strong><p>You decide what becomes part of the record.</p></article>
      </section>

      <section id="workspace" className="workspace-shell" aria-label="Evidence workspace">
        <aside className="project-rail">
          <div className="rail-heading">
            <p className="eyebrow">Local projects</p>
            <h2>Recent work</h2>
            <p>{storageMode === "memory" ? "Session memory only" : "Stored on this device"}</p>
          </div>
          {storageMode === "memory" && (
            <div className="storage-warning" role="status">
              Persistent browser storage is unavailable. Keep exports before closing this tab.
            </div>
          )}
          <div className="rail-actions">
            <button type="button" onClick={createBlankProject}>New project</button>
            <button type="button" onClick={loadSample}>Load sample</button>
          </div>
          <div className="project-list" aria-label="Saved projects">
            {projects.length === 0 ? (
              <p className="empty-note">Projects appear here after your first edit.</p>
            ) : projects.map((project) => (
              <button
                type="button"
                key={project.id}
                className={project.id === currentProjectId ? "active" : ""}
                onClick={() => openProject(project)}
              >
                <strong>{project.name}</strong>
                <span>{formatTimestamp(project.updatedAt)}</span>
              </button>
            ))}
          </div>
          {currentProjectId && (
            <div className="project-tools">
              <button type="button" onClick={duplicateCurrentProject}>Duplicate</button>
              <button type="button" onClick={exportCurrentProject}>Export project</button>
              {confirmDelete ? (
                <div className="confirm-row">
                  <button className="danger" type="button" onClick={removeCurrentProject}>Confirm delete</button>
                  <button type="button" onClick={() => setConfirmDelete(false)}>Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)}>Delete project</button>
              )}
            </div>
          )}
          {projects.length > 0 && (
            <div className="clear-local">
              {confirmClear ? (
                <div className="confirm-row">
                  <button className="danger" type="button" onClick={removeAllProjects}>Clear all</button>
                  <button type="button" onClick={() => setConfirmClear(false)}>Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmClear(true)}>Clear local data</button>
              )}
            </div>
          )}
        </aside>

        <div className="workspace-main">
          <div className="workspace-status">
            <span>{saveStatus}</span>
            <p aria-live="polite">{statusMessage}</p>
          </div>
          <nav className="stage-tabs" aria-label="Workspace stages">
            {(["capture", "review", "export"] as Stage[]).map((item, index) => (
              <button
                key={item}
                type="button"
                className={stage === item ? "active" : ""}
                aria-current={stage === item ? "step" : undefined}
                disabled={item !== "capture" && !packet}
                onClick={() => setStage(item)}
              >
                <span>0{index + 1}</span>{item}
              </button>
            ))}
          </nav>

          {stage === "capture" && (
            <form className="capture-layout" onSubmit={buildPacket} noValidate>
              <section className="capture-panel" aria-labelledby="capture-heading">
                <div className="section-heading">
                  <div><p className="eyebrow">Capture</p><h2 id="capture-heading">Build the evidence envelope.</h2></div>
                  <p>Local by default: nothing is uploaded unless you explicitly export it.</p>
                </div>
                <div className="field-grid">
                  <label>
                    Project name
                    <input
                      value={form.projectName}
                      maxLength={MAX_PROJECT_NAME_LENGTH}
                      aria-invalid={Boolean(errors.projectName)}
                      aria-describedby={errors.projectName ? "project-name-error" : undefined}
                      onChange={(event) => updateField("projectName", event.target.value)}
                      placeholder="Name this body of work"
                    />
                    {errors.projectName && <span id="project-name-error" className="field-error">{errors.projectName}</span>}
                  </label>
                  <label>
                    Workflow context
                    <select value={form.agentMix} onChange={(event) => updateField("agentMix", event.target.value)}>
                      <option>Codex</option>
                      <option>Mixed-agent workflow</option>
                      <option>Engineering team</option>
                      <option>Product and research</option>
                    </select>
                  </label>
                </div>
                <label>
                  Raw evidence
                  <textarea
                    className="evidence-input"
                    value={form.rawEvidence}
                    maxLength={MAX_RAW_EVIDENCE_LENGTH}
                    aria-invalid={Boolean(errors.rawEvidence)}
                    aria-describedby={errors.rawEvidence ? "evidence-error evidence-help" : "evidence-help"}
                    onChange={(event) => updateField("rawEvidence", event.target.value)}
                    placeholder="COMMIT: ...&#10;TEST: ...&#10;CODEX: ...&#10;DECISION: ...&#10;PATTERN: ..."
                  />
                  <span id="evidence-help" className="field-help">Prefix lines with COMMIT, TEST, CODEX, DECISION, or PATTERN.</span>
                  {errors.rawEvidence && <span id="evidence-error" className="field-error">{errors.rawEvidence}</span>}
                </label>
                <div className="parser-preview" aria-label="Evidence parser preview">
                  <div><strong>{recognizedCount}</strong><span>recognized</span></div>
                  <div><strong>{parsedEvidence.repository.length}</strong><span>repository</span></div>
                  <div><strong>{parsedEvidence.agent.length}</strong><span>agent</span></div>
                  <div className={parsedEvidence.unrecognized.length ? "needs-review" : ""}>
                    <strong>{parsedEvidence.unrecognized.length}</strong><span>unrecognized</span>
                  </div>
                </div>
                {parsedEvidence.unrecognized.length > 0 && (
                  <details className="unrecognized-lines">
                    <summary>Review unrecognized lines</summary>
                    <ul>{parsedEvidence.unrecognized.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}</ul>
                  </details>
                )}
                <button className="normalize-button" type="button" onClick={normalizeCurrentEvidence}>
                  Normalize recognized evidence
                </button>
              </section>

              <section className="context-panel" aria-labelledby="context-heading">
                <div className="section-heading compact">
                  <div><p className="eyebrow">Context</p><h2 id="context-heading">Add human meaning.</h2></div>
                </div>
                <label>Outcome and decisions<textarea value={form.goals} maxLength={MAX_CONTEXT_LENGTH} onChange={(event) => updateField("goals", event.target.value)} /></label>
                <label>Technical verification<textarea value={form.technicalProof} maxLength={MAX_CONTEXT_LENGTH} onChange={(event) => updateField("technicalProof", event.target.value)} /></label>
                <label>Codex collaboration notes<textarea value={form.codexNotes} maxLength={MAX_CONTEXT_LENGTH} onChange={(event) => updateField("codexNotes", event.target.value)} /></label>
                <label>Reusable workflow pattern<textarea value={form.workflow} maxLength={MAX_CONTEXT_LENGTH} onChange={(event) => updateField("workflow", event.target.value)} /></label>
                <div className="codex-bridge">
                  <div><p className="eyebrow">Optional companion</p><h3>Forge with GPT-5.6 through Codex.</h3></div>
                  <p>Download a bounded request, run it in your authenticated read-only Codex environment, then import the V1 result.</p>
                  <div className="bridge-actions">
                    <button type="button" onClick={downloadCodexRequest}>Download Codex request</button>
                    <button type="button" onClick={() => importInput.current?.click()}>Import packet</button>
                    <input ref={importInput} className="sr-only" type="file" accept="application/json,.json" aria-label="Import Panurgic Flow packet" onChange={importPacket} />
                  </div>
                </div>
                <button className="generate-button" type="submit">Build evidence packet</button>
              </section>
            </form>
          )}

          {stage === "review" && packet && (
            <section className="review-layout" aria-labelledby="review-heading">
              <div className="section-heading">
                <div><p className="eyebrow">Review</p><h2 ref={headingRef} tabIndex={-1} id="review-heading">Inspect every claim before export.</h2></div>
                <IntegrityBadge status={integrityStatus} />
              </div>
              <div className="manifest-grid">
                <article><small>Thesis</small><strong>{packet.manifest.thesis}</strong></article>
                <article><small>Audience</small><strong>{packet.manifest.audience}</strong></article>
                <article><small>Source</small><strong>{packet.source.type}{packet.source.model ? ` · ${packet.source.model}` : ""}</strong></article>
              </div>
              <div className="evidence-lists">
                <article><h3>Evidence</h3><ul>{packet.manifest.evidence.map((entry) => <li key={entry}>{entry}</li>)}</ul></article>
                <article><h3>Risks</h3><ul>{packet.manifest.risks.map((entry) => <li key={entry}>{entry}</li>)}</ul></article>
                <article><h3>Verification checklist</h3><ol>{packet.manifest.verificationChecklist.map((entry) => <li key={entry}>{entry}</li>)}</ol></article>
              </div>
              <div className="ledger-shell">
                <div className="ledger-heading">
                  <div><p className="eyebrow">Grounding</p><h3>Claim-to-source ledger</h3></div>
                  <div className="filter-group" aria-label="Filter claims">
                    {(["all", "grounded", "review"] as LedgerFilter[]).map((filter) => (
                      <button key={filter} type="button" className={ledgerFilter === filter ? "active" : ""} onClick={() => setLedgerFilter(filter)}>{filter}</button>
                    ))}
                  </div>
                </div>
                <div className="ledger-list">
                  {filteredLedger.length ? filteredLedger.map((entry) => (
                    <article key={entry.claim}>
                      <div><strong>{entry.claim}</strong><span className={entry.status}>{entry.status}</span></div>
                      <p>{entry.source}</p>
                    </article>
                  )) : <p className="empty-note">No claims match this filter.</p>}
                </div>
              </div>
              <div className="stage-actions">
                <button type="button" onClick={() => setStage("capture")}>Edit evidence</button>
                <button className="primary-action" type="button" onClick={() => setStage("export")}>Review artifacts</button>
              </div>
            </section>
          )}

          {stage === "export" && packet && (
            <section className="export-layout" aria-labelledby="export-heading">
              <div className="section-heading">
                <div><p className="eyebrow">Export</p><h2 id="export-heading">Share an approved, portable record.</h2></div>
                <IntegrityBadge status={integrityStatus} />
              </div>
              <div className="artifact-tabs" role="tablist" aria-label="Generated artifacts">
                {(Object.keys(artifactLabels) as ArtifactKey[]).map((key) => (
                  <button
                    id={`artifact-tab-${key}`}
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={activeArtifact === key}
                    aria-controls="artifact-panel"
                    tabIndex={activeArtifact === key ? 0 : -1}
                    className={activeArtifact === key ? "active" : ""}
                    onClick={() => setActiveArtifact(key)}
                    onKeyDown={(event) => handleArtifactKeys(event, key)}
                  >
                    {artifactLabels[key]}
                  </button>
                ))}
              </div>
              <div id="artifact-panel" className="artifact-panel" role="tabpanel" aria-labelledby={`artifact-tab-${activeArtifact}`}>
                <div className="artifact-actions">
                  <button type="button" onClick={copyArtifact}>{copied ? "Copied" : "Copy artifact"}</button>
                  <button type="button" onClick={downloadArtifact}>Download .md</button>
                  <button className="seal-button" type="button" onClick={sealAndDownload}>Seal and download packet</button>
                </div>
                {packet.integrity && <p className="fingerprint"><span>SHA-256</span><code>{packet.integrity.digest}</code></p>}
                <pre>{packet.artifacts[activeArtifact]}</pre>
              </div>
              {versions.length > 0 && (
                <div className="version-history">
                  <div><p className="eyebrow">Local history</p><h3>Saved packet versions</h3></div>
                  <div>{versions.map((version) => <button type="button" key={version.id} onClick={() => openVersion(version)}>{formatTimestamp(version.createdAt)}<span>{version.packet.integrity ? "sealed" : "draft"}</span></button>)}</div>
                </div>
              )}
            </section>
          )}
        </div>
      </section>

      <footer>
        <div><strong>Panurgic Flow</strong><span>AI-assisted work. Verifiable evidence. Sealed records.</span></div>
        <nav aria-label="Footer navigation"><Link href="/docs">Docs</Link><Link href="/privacy">Privacy</Link><Link href="/security">Security</Link><a href="https://github.com/seemorecodez/panurgic-flow">GitHub</a></nav>
      </footer>
    </main>
  );
}
