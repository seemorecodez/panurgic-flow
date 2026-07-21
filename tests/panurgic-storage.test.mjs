import assert from "node:assert/strict";
import test from "node:test";
import { indexedDB as fakeIndexedDB } from "fake-indexeddb";
import { SAMPLE_FORM, buildBrowserPacket } from "../lib/panurgic-core.mjs";

function setIndexedDb(value) {
  if (value === undefined) {
    delete globalThis.indexedDB;
    return;
  }
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value,
    writable: true,
  });
}

function restoreIndexedDb(descriptor) {
  if (descriptor) Object.defineProperty(globalThis, "indexedDB", descriptor);
  else delete globalThis.indexedDB;
}

async function loadFreshStorage(label) {
  const url = new URL(`../lib/panurgic-storage.mjs?${label}-${Date.now()}-${Math.random()}`, import.meta.url);
  return import(url.href);
}

function projectFixture(index) {
  const timestamp = new Date(Date.UTC(2026, 6, 19, 0, index)).toISOString();
  return {
    id: `project-${index}`,
    name: `Project ${index}`,
    form: { ...SAMPLE_FORM, projectName: `Project ${index}` },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

test("memory fallback retains bounded projects and versions", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  setIndexedDb(undefined);
  try {
    const storage = await loadFreshStorage("memory");
    await storage.clearProjects();
    for (let index = 0; index < storage.MAX_SAVED_PROJECTS + 2; index += 1) {
      await storage.saveProject(projectFixture(index));
    }
    const projects = await storage.listProjects();
    assert.equal(projects.mode, "memory");
    assert.equal(projects.projects.length, storage.MAX_SAVED_PROJECTS);
    assert.equal(projects.projects[0].id, `project-${storage.MAX_SAVED_PROJECTS + 1}`);

    const projectId = projects.projects[0].id;
    for (let index = 0; index < storage.MAX_VERSIONS_PER_PROJECT + 2; index += 1) {
      const timestamp = new Date(Date.UTC(2026, 6, 19, 1, index)).toISOString();
      await storage.saveVersion({
        id: `version-${index}`,
        projectId,
        createdAt: timestamp,
        packet: buildBrowserPacket(
          { ...SAMPLE_FORM, projectName: `Version ${index}` },
          { packetId: `packet-${index}`, createdAt: timestamp, now: timestamp },
        ),
      });
    }
    const versions = await storage.listVersions(projectId);
    assert.equal(versions.versions.length, storage.MAX_VERSIONS_PER_PROJECT);
    assert.equal(versions.versions[0].id, `version-${storage.MAX_VERSIONS_PER_PROJECT + 1}`);

    await storage.deleteProject(projectId);
    assert.equal((await storage.listVersions(projectId)).versions.length, 0);
    assert.equal((await storage.listProjects()).projects.some((project) => project.id === projectId), false);
    await storage.clearProjects();
  } finally {
    restoreIndexedDb(original);
  }
});

test("IndexedDB persists, reloads, trims, and deletes projects and versions", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  setIndexedDb(fakeIndexedDB);
  try {
    const storage = await loadFreshStorage("indexeddb");
    await storage.clearProjects();
    for (let index = 0; index < storage.MAX_SAVED_PROJECTS + 2; index += 1) {
      assert.equal((await storage.saveProject(projectFixture(index))).mode, "indexeddb");
    }
    const projects = await storage.listProjects();
    assert.equal(projects.mode, "indexeddb");
    assert.equal(projects.projects.length, storage.MAX_SAVED_PROJECTS);

    const projectId = projects.projects[0].id;
    for (let index = 0; index < storage.MAX_VERSIONS_PER_PROJECT + 2; index += 1) {
      const timestamp = new Date(Date.UTC(2026, 6, 19, 2, index)).toISOString();
      await storage.saveVersion({
        id: `indexed-version-${index}`,
        projectId,
        createdAt: timestamp,
        packet: buildBrowserPacket(
          { ...SAMPLE_FORM, projectName: `Indexed version ${index}` },
          { packetId: `indexed-packet-${index}`, createdAt: timestamp, now: timestamp },
        ),
      });
    }
    assert.equal((await storage.listVersions(projectId)).versions.length, storage.MAX_VERSIONS_PER_PROJECT);

    const reloaded = await loadFreshStorage("indexeddb-reload");
    assert.equal((await reloaded.listProjects()).projects.length, storage.MAX_SAVED_PROJECTS);
    assert.equal((await reloaded.listVersions(projectId)).versions.length, storage.MAX_VERSIONS_PER_PROJECT);
    await reloaded.deleteProject(projectId);
    assert.equal((await reloaded.listVersions(projectId)).versions.length, 0);
    assert.equal((await reloaded.listProjects()).projects.some((project) => project.id === projectId), false);
    await reloaded.clearProjects();
  } finally {
    restoreIndexedDb(original);
  }
});

test("IndexedDB failures fall back to visible session memory behavior", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  setIndexedDb({
    open() {
      const request = {};
      queueMicrotask(() => {
        request.error = new Error("Storage quota unavailable.");
        request.onerror?.();
      });
      return request;
    },
  });
  try {
    const storage = await loadFreshStorage("quota-fallback");
    const project = projectFixture(99);
    assert.equal((await storage.saveProject(project)).mode, "memory");
    const projects = await storage.listProjects();
    assert.equal(projects.mode, "memory");
    assert.equal(projects.projects[0].id, project.id);
    await storage.clearProjects();
  } finally {
    restoreIndexedDb(original);
  }
});
