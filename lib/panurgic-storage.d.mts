import type { PanurgicPacketV1 } from "./panurgic-contract.mjs";
import type { FormState } from "./panurgic-core.mjs";

export const MAX_SAVED_PROJECTS: 25;
export const MAX_VERSIONS_PER_PROJECT: 10;
export const AUTOSAVE_DELAY_MS: 750;
export type ProjectRecord = {
  id: string;
  name: string;
  form: FormState;
  createdAt: string;
  updatedAt: string;
};
export type VersionRecord = {
  id: string;
  projectId: string;
  createdAt: string;
  packet: PanurgicPacketV1;
};
export type StorageMode = "indexeddb" | "memory";
export function listProjects(): Promise<{ mode: StorageMode; projects: ProjectRecord[] }>;
export function saveProject(project: ProjectRecord): Promise<{ mode: StorageMode }>;
export function deleteProject(projectId: string): Promise<{ mode: StorageMode }>;
export function clearProjects(): Promise<{ mode: StorageMode }>;
export function saveVersion(version: VersionRecord): Promise<{ mode: StorageMode }>;
export function listVersions(projectId: string): Promise<{ mode: StorageMode; versions: VersionRecord[] }>;
