export const MAX_SAVED_PROJECTS = 25;
export const MAX_VERSIONS_PER_PROJECT = 10;
export const AUTOSAVE_DELAY_MS = 750;

const DATABASE_NAME = "panurgic-flow";
const DATABASE_VERSION = 1;
const PROJECT_STORE = "projects";
const VERSION_STORE = "versions";
const memoryProjects = new Map();
const memoryVersions = new Map();
let databasePromise;

function cloneValue(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
  });
}

function openDatabase() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("IndexedDB is unavailable."));
  }
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(PROJECT_STORE)) {
          const projects = database.createObjectStore(PROJECT_STORE, { keyPath: "id" });
          projects.createIndex("updatedAt", "updatedAt");
        }
        if (!database.objectStoreNames.contains(VERSION_STORE)) {
          const versions = database.createObjectStore(VERSION_STORE, { keyPath: "id" });
          versions.createIndex("projectId", "projectId");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB could not be opened."));
      request.onblocked = () => reject(new Error("IndexedDB upgrade is blocked by another tab."));
    });
  }
  return databasePromise;
}

function sortedProjects(values) {
  return [...values].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function sortedVersions(values) {
  return [...values].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

async function withIndexedDb(operation) {
  const database = await openDatabase();
  return operation(database);
}

function memoryVersionsFor(projectId) {
  return sortedVersions(
    [...memoryVersions.values()].filter((version) => version.projectId === projectId),
  );
}

async function trimIndexedProjects(database) {
  const transaction = database.transaction([PROJECT_STORE, VERSION_STORE], "readwrite");
  const projectStore = transaction.objectStore(PROJECT_STORE);
  const versionStore = transaction.objectStore(VERSION_STORE);
  const projects = sortedProjects(await requestResult(projectStore.getAll()));
  for (const project of projects.slice(MAX_SAVED_PROJECTS)) {
    projectStore.delete(project.id);
    const versions = await requestResult(versionStore.index("projectId").getAll(project.id));
    for (const version of versions) versionStore.delete(version.id);
  }
  await transactionComplete(transaction);
}

export async function listProjects() {
  try {
    const projects = await withIndexedDb(async (database) => {
      const transaction = database.transaction(PROJECT_STORE, "readonly");
      const values = await requestResult(transaction.objectStore(PROJECT_STORE).getAll());
      await transactionComplete(transaction);
      return sortedProjects(values);
    });
    return { mode: "indexeddb", projects };
  } catch {
    return { mode: "memory", projects: sortedProjects(memoryProjects.values()).map(cloneValue) };
  }
}

export async function saveProject(project) {
  memoryProjects.set(project.id, cloneValue(project));
  const memoryOverflow = sortedProjects(memoryProjects.values()).slice(MAX_SAVED_PROJECTS);
  for (const entry of memoryOverflow) {
    memoryProjects.delete(entry.id);
    for (const version of memoryVersionsFor(entry.id)) memoryVersions.delete(version.id);
  }
  try {
    await withIndexedDb(async (database) => {
      const transaction = database.transaction(PROJECT_STORE, "readwrite");
      transaction.objectStore(PROJECT_STORE).put(project);
      await transactionComplete(transaction);
      await trimIndexedProjects(database);
    });
    return { mode: "indexeddb" };
  } catch {
    return { mode: "memory" };
  }
}

export async function deleteProject(projectId) {
  memoryProjects.delete(projectId);
  for (const version of memoryVersionsFor(projectId)) memoryVersions.delete(version.id);
  try {
    await withIndexedDb(async (database) => {
      const transaction = database.transaction([PROJECT_STORE, VERSION_STORE], "readwrite");
      transaction.objectStore(PROJECT_STORE).delete(projectId);
      const versionStore = transaction.objectStore(VERSION_STORE);
      const versions = await requestResult(versionStore.index("projectId").getAll(projectId));
      for (const version of versions) versionStore.delete(version.id);
      await transactionComplete(transaction);
    });
    return { mode: "indexeddb" };
  } catch {
    return { mode: "memory" };
  }
}

export async function clearProjects() {
  memoryProjects.clear();
  memoryVersions.clear();
  try {
    await withIndexedDb(async (database) => {
      const transaction = database.transaction([PROJECT_STORE, VERSION_STORE], "readwrite");
      transaction.objectStore(PROJECT_STORE).clear();
      transaction.objectStore(VERSION_STORE).clear();
      await transactionComplete(transaction);
    });
    return { mode: "indexeddb" };
  } catch {
    return { mode: "memory" };
  }
}

export async function saveVersion(version) {
  memoryVersions.set(version.id, cloneValue(version));
  for (const entry of memoryVersionsFor(version.projectId).slice(MAX_VERSIONS_PER_PROJECT)) {
    memoryVersions.delete(entry.id);
  }
  try {
    await withIndexedDb(async (database) => {
      const transaction = database.transaction(VERSION_STORE, "readwrite");
      const store = transaction.objectStore(VERSION_STORE);
      store.put(version);
      const versions = sortedVersions(await requestResult(store.index("projectId").getAll(version.projectId)));
      for (const entry of versions.slice(MAX_VERSIONS_PER_PROJECT)) store.delete(entry.id);
      await transactionComplete(transaction);
    });
    return { mode: "indexeddb" };
  } catch {
    return { mode: "memory" };
  }
}

export async function listVersions(projectId) {
  try {
    const versions = await withIndexedDb(async (database) => {
      const transaction = database.transaction(VERSION_STORE, "readonly");
      const values = await requestResult(
        transaction.objectStore(VERSION_STORE).index("projectId").getAll(projectId),
      );
      await transactionComplete(transaction);
      return sortedVersions(values);
    });
    return { mode: "indexeddb", versions };
  } catch {
    return { mode: "memory", versions: memoryVersionsFor(projectId).map(cloneValue) };
  }
}
