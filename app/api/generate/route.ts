export const runtime = "nodejs";

type GenerateRequest = {
  projectName?: string;
  targetTrack?: string;
  audience?: string;
  repoSignals?: string;
  codexNotes?: string;
  workflowPattern?: string;
};

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

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6";

export async function POST(request: Request) {
  const input = (await request.json()) as GenerateRequest;

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      fallbackArtifacts(input, "OPENAI_API_KEY is not configured."),
    );
  }

  const prompt = buildPrompt(input);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: prompt,
      }),
    });

    if (!response.ok) {
      return Response.json(
        fallbackArtifacts(
          input,
          `OpenAI generation returned ${response.status}; using deterministic fallback.`,
        ),
      );
    }

    const payload = await response.json();
    const text = extractOutputText(payload);
    const parsed = parseArtifactJson(text);

    if (!parsed) {
      return Response.json(
        fallbackArtifacts(
          input,
          "Model output could not be parsed as the expected artifact JSON.",
        ),
      );
    }

    return Response.json({
      ...parsed,
      source: "openai",
      model: MODEL,
    });
  } catch {
    return Response.json(
      fallbackArtifacts(input, "OpenAI generation failed; using local fallback."),
    );
  }
}

function buildPrompt(input: GenerateRequest) {
  return `You are helping prepare an OpenAI Build Week hackathon submission.

The product is a spicy hybrid: Codex Flight Recorder + Workflow-to-Skill Forge.
It captures evidence from an AI-assisted development session, creates a build manifest, and exports a reusable Codex SKILL.md.

Project name: ${input.projectName || "Codex Flight Recorder + Skill Forge"}
Target track: ${input.targetTrack || "Developer Tools"}
Real audience: ${input.audience || "AI-assisted builders and software teams"}
Repo signals:
${input.repoSignals || "No repo signals provided."}

Codex / GPT-5.6 collaboration notes:
${input.codexNotes || "No Codex notes provided."}

Reusable workflow pattern:
${input.workflowPattern || "No workflow pattern provided."}

Return ONLY valid JSON with this exact shape:
{
  "manifest": {
    "thesis": "one sharp sentence",
    "audience": "specific audience",
    "codexRole": "how Codex materially shaped the build",
    "gptRole": "how GPT-5.6 is used in the product",
    "evidence": ["3 concrete bullets"],
    "risks": ["2 honest risks"],
    "nextMilestones": ["3 near-term improvements"]
  },
  "readmeSection": "markdown section explaining how Codex and GPT-5.6 were used",
  "demoScript": "timestamped 3-minute demo script",
  "judgeRunbook": "markdown runbook for testing the project",
  "skillMarkdown": "complete Codex SKILL.md markdown with yaml frontmatter"
}

Constraints:
- Make it judge-facing, concrete, and grounded in the supplied evidence.
- Do not claim capabilities that are not supported by the input.
- Use the submitter's voice: clear, practical, no generic AI hype.`;
}

function extractOutputText(payload: unknown): string {
  if (
    payload &&
    typeof payload === "object" &&
    "output_text" in payload &&
    typeof payload.output_text === "string"
  ) {
    return payload.output_text;
  }

  if (!payload || typeof payload !== "object" || !("output" in payload)) {
    return "";
  }

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object" || !("content" in item)) {
        return [];
      }

      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) {
        return [];
      }

      return content.map((part) => {
        if (!part || typeof part !== "object") {
          return "";
        }

        if ("text" in part && typeof part.text === "string") {
          return part.text;
        }

        if ("output_text" in part && typeof part.output_text === "string") {
          return part.output_text;
        }

        return "";
      });
    })
    .join("\n")
    .trim();
}

function parseArtifactJson(text: string): Omit<ArtifactResponse, "source" | "model"> | null {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Omit<ArtifactResponse, "source" | "model">;
    if (
      parsed?.manifest?.thesis &&
      parsed.readmeSection &&
      parsed.demoScript &&
      parsed.judgeRunbook &&
      parsed.skillMarkdown
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function fallbackArtifacts(input: GenerateRequest, warning: string): ArtifactResponse {
  const name = input.projectName || "Codex Flight Recorder + Skill Forge";
  const track = input.targetTrack || "Developer Tools";
  const audience =
    input.audience ||
    "hackathon builders and engineering teams using Codex for real development work";
  const workflow =
    input.workflowPattern ||
    "evidence intake -> build manifest -> judge packet -> reusable Codex skill";

  return {
    source: "local-fallback",
    model: "deterministic",
    warning,
    manifest: {
      thesis: `${name} turns Codex-assisted development into a judge-ready proof packet and a reusable workflow skill.`,
      audience,
      codexRole:
        "Codex is treated as both build partner and workflow evidence: its decisions, fixes, and implementation steps become part of the product story.",
      gptRole:
        "GPT-5.6 synthesizes repo signals and human notes into structured artifacts that stay grounded in the build evidence.",
      evidence: [
        `Targets the ${track} track with a working artifact generator.`,
        "Exports documentation that maps directly to OpenAI Build Week submission requirements.",
        `Captures the reusable pattern: ${workflow}.`,
      ],
      risks: [
        "Generated claims need to be checked against actual commits and tests.",
        "The strongest demo depends on showing a real repo, not only sample data.",
      ],
      nextMilestones: [
        "Add automatic git log ingestion.",
        "Generate a zipped skill folder with references and examples.",
        "Add a diff view that separates pre-hackathon work from new Codex-built work.",
      ],
    },
    readmeSection: `## Built with Codex and GPT-5.6

${name} was built as a Codex-native developer tool for the ${track} track.

Codex helped shape the implementation workflow: inspecting the workspace, scaffolding the app, debugging setup issues, building the interface and API route, and converting the process into reusable artifacts.

GPT-5.6 powers the synthesis layer. It takes repo signals, Codex collaboration notes, and a reusable workflow pattern, then produces a build manifest, README proof section, judge runbook, demo script, and Codex SKILL.md.

The key product decision was to make AI-assisted development auditable instead of magical. The app does not merely say "AI helped." It turns evidence into a clear story a judge or teammate can test.`,
    demoScript: `0:00 — Introduce the pain: AI-assisted projects often lose the story of what changed, why it matters, and how to test it.
0:25 — Open ${name} and show the sample repo signals and Codex notes.
0:55 — Generate the flight packet using GPT-5.6 or the deterministic fallback.
1:25 — Walk through the build manifest: audience, Codex role, GPT-5.6 role, evidence, risks, and next milestones.
1:55 — Show the exported README proof and judge runbook.
2:20 — Show the generated SKILL.md and explain how the workflow becomes reusable in future Codex sessions.
2:50 — Close: this is provenance plus repeatability for agentic software work.`,
    judgeRunbook: `# Judge Runbook

## Quick path

1. Install dependencies with \`pnpm install\`.
2. Add \`OPENAI_API_KEY\` to \`.env.local\` for live GPT-5.6 generation, or use the deterministic fallback.
3. Run \`pnpm dev\`.
4. Open the local URL and click **Generate build packet**.

## What to verify

- The app accepts project evidence.
- The API route returns a complete build packet.
- The interface displays manifest evidence, risks, and milestones.
- The export tabs include README proof, demo script, judge runbook, and \`SKILL.md\`.

## Testing note

The fallback path is intentional so judges can test the product even without a live key.`,
    skillMarkdown: `---
name: codex-flight-recorder
description: Use when documenting an AI-assisted Codex build and turning the workflow into reusable project guidance.
---

# Codex Flight Recorder

Use this skill when a project needs a clear record of how Codex and GPT-5.6 contributed to the build.

## Inputs

- Repo signals: commits, changed files, tests, setup notes, and known issues.
- Codex notes: where Codex accelerated work and where the human made product or engineering decisions.
- Workflow pattern: the repeatable sequence future projects should reuse.

## Workflow

1. Capture evidence before polishing the story.
2. Produce a manifest with audience, thesis, Codex role, GPT role, evidence, risks, and milestones.
3. Export judge-facing setup instructions.
4. Export a concise demo script.
5. Generate or update README content.
6. Keep every claim grounded in the repo.

## Quality bar

- Specific beats impressive-sounding.
- A working test path beats a polished claim.
- Honest limitations increase trust.`,
  };
}
