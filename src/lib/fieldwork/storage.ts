import { z } from "zod";
import { schemas } from "./validation";
import type { RecordData, StoredRecord } from "./types";

export const workspaceStorageKey = "fieldwork.workspace.v1";
const changedEvent = "fieldwork-workspace-changed";
type Snapshot = { records: StoredRecord[]; loading: boolean; error: string };
const serverSnapshot: Snapshot = { records: [], loading: true, error: "" };
let cachedRaw: string | null | undefined;
let snapshot: Snapshot = { records: [], loading: false, error: "" };
const envelopeSchema = z.object({
  app: z.literal("Fieldwork"),
  version: z.literal(1),
  records: z.array(z.object({
    id: z.string(),
    kind: z.enum(["trip", "visit", "source", "settings"]),
    revision: z.number().int().min(1),
    data: z.unknown(),
  }).strict()).max(100000),
});

export function parseWorkspaceBackup(content: string): StoredRecord[] {
  const envelope = envelopeSchema.parse(JSON.parse(content));
  const ids = new Set<string>();
  return envelope.records.map(record => {
    const data = schemas[record.kind].parse(record.data) as RecordData;
    if (record.id !== data.id || ids.has(record.id)) {
      throw new Error("The backup contains inconsistent or duplicate record IDs.");
    }
    ids.add(record.id);
    return { ...record, data };
  });
}

export function readWorkspaceRecords(): StoredRecord[] {
  let saved: string | null;
  try {
    saved = localStorage.getItem(workspaceStorageKey);
  } catch {
    throw new Error("Browser storage is unavailable. Enable storage for this website, then retry.");
  }
  if (saved === null) return [];
  try {
    return parseWorkspaceBackup(saved);
  } catch {
    throw new Error("Saved records could not be read. Your stored copy has been preserved.");
  }
}

export function writeWorkspaceRecords(records: StoredRecord[]) {
  const content = JSON.stringify({ app: "Fieldwork", version: 1, records });
  parseWorkspaceBackup(content);
  try {
    localStorage.setItem(workspaceStorageKey, content);
  } catch {
    throw new Error("The browser could not save this change. Free some website storage and retry. Existing records remain saved.");
  }
  notifyWorkspace();
}

export function getServerWorkspaceSnapshot() { return serverSnapshot; }

export function getWorkspaceSnapshot(): Snapshot {
  try {
    const saved = localStorage.getItem(workspaceStorageKey);
    if (saved !== cachedRaw) {
      cachedRaw = saved;
      try {
        snapshot = { records: saved === null ? [] : parseWorkspaceBackup(saved), loading: false, error: "" };
      } catch {
        snapshot = { records: snapshot.records, loading: false, error: "Saved records could not be read. Your stored copy has been preserved." };
      }
    }
  } catch {
    cachedRaw = undefined;
    const error = "Browser storage is unavailable. Enable storage for this website, then retry.";
    if (snapshot.error !== error) snapshot = { records: snapshot.records, loading: false, error };
  }
  return snapshot;
}

export function notifyWorkspace() {
  window.dispatchEvent(new Event(changedEvent));
}

export function subscribeWorkspace(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === workspaceStorageKey || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changedEvent, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changedEvent, listener);
  };
}
