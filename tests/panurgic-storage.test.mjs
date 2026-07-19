import assert from "node:assert/strict";
import test from "node:test";
import { SAMPLE_FORM, buildBrowserPacket } from "../lib/panurgic-core.mjs";
import {
  MAX_SAVED_PROJECTS,
  MAX_VERSIONS_PER_PROJECT,
  clearProjects,
  deleteProject,
  listProjects,
  listVersions,
  saveProject,
  saveVersion,
} from "../lib/panurgic-storage.mjs";

test("memory fallback retains bounded projects and versions", async () => {
  await clearProjects();
  for (let index = 0; index < MAX_SAVED_PROJECTS + 2; index += 1) {
    const timestamp = new Date(Date.UTC(2026, 6, 19, 0, index)).toISOString();
    await saveProject({
      id: `project-${index}`,
      name: `Project ${index}`,
      form: { ...SAMPLE_FORM, projectName: `Project ${index}` },
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
  const projects = await listProjects();
  assert.equal(projects.mode, "memory");
  assert.equal(projects.projects.length, MAX_SAVED_PROJECTS);
  assert.equal(projects.projects[0].id, `project-${MAX_SAVED_PROJECTS + 1}`);

  const projectId = projects.projects[0].id;
  for (let index = 0; index < MAX_VERSIONS_PER_PROJECT + 2; index += 1) {
    const timestamp = new Date(Date.UTC(2026, 6, 19, 1, index)).toISOString();
    await saveVersion({
      id: `version-${index}`,
      projectId,
      createdAt: timestamp,
      packet: buildBrowserPacket(
        { ...SAMPLE_FORM, projectName: `Version ${index}` },
        { packetId: `packet-${index}`, createdAt: timestamp, now: timestamp },
      ),
    });
  }
  const versions = await listVersions(projectId);
  assert.equal(versions.versions.length, MAX_VERSIONS_PER_PROJECT);
  assert.equal(versions.versions[0].id, `version-${MAX_VERSIONS_PER_PROJECT + 1}`);

  await deleteProject(projectId);
  assert.equal((await listVersions(projectId)).versions.length, 0);
  assert.equal((await listProjects()).projects.some((project) => project.id === projectId), false);
  await clearProjects();
});
