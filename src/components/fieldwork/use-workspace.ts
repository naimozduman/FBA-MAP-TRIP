"use client";
import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { seedSources } from "@/lib/fieldwork/data";
import { schemas } from "@/lib/fieldwork/validation";
import { defaultSettings, type Kind, type RecordData, type Settings, type Source, type StoredRecord, type Trip, type Visit } from "@/lib/fieldwork/types";
import { getWorkspaceSnapshot, getServerWorkspaceSnapshot, notifyWorkspace, parseWorkspaceBackup, readWorkspaceRecords, subscribeWorkspace, writeWorkspaceRecords } from "@/lib/fieldwork/storage";

// This standalone workspace never sends personal records to a public API.
export function useWorkspace() {
  const { records, loading, error } = useSyncExternalStore(subscribeWorkspace, getWorkspaceSnapshot, getServerWorkspaceSnapshot);
  const reload = useCallback(async () => { notifyWorkspace(); }, []);
  const save = useCallback(async (kind: Kind, data: RecordData, expectedRevision = 0) => {
    const parsed = schemas[kind].parse(data) as RecordData;
    const latest = readWorkspaceRecords();
    const previous = latest.find(record => record.id === parsed.id);
    if ((previous?.revision ?? 0) !== expectedRevision) {
      notifyWorkspace();
      throw new Error("This entry changed in another tab. Close and reopen it before editing.");
    }
    const record: StoredRecord = { id: parsed.id, kind, data: parsed, revision: expectedRevision + 1 };
    const next = [...latest.filter(item => item.id !== parsed.id), record];
    writeWorkspaceRecords(next);
    return record;
  }, []);
  const remove = useCallback(async (id: string) => {
    const latest = readWorkspaceRecords();
    if (!latest.some(record => record.id === id)) throw new Error("This entry has already been removed.");
    const next = latest.filter(record => record.id !== id).map(record => {
      if (record.kind !== "visit") return record;
      const visit = record.data as Visit;
      if (visit.tripId !== id && visit.sourceId !== id) return record;
      return { ...record, revision: record.revision + 1, data: { ...visit, tripId: visit.tripId === id ? null : visit.tripId, sourceId: visit.sourceId === id ? null : visit.sourceId } };
    });
    writeWorkspaceRecords(next);
    toast.success("Entry removed. Visit observations are retained.");
  }, []);
  const restore = useCallback(async (content: string) => {
    const imported = parseWorkspaceBackup(content);
    const latest = readWorkspaceRecords();
    const importedIds = new Set(imported.map(record => record.id));
    const revisions = new Map(latest.map(record => [record.id, record.revision]));
    const next = [...latest.filter(record => !importedIds.has(record.id)), ...imported.map(record => ({
      ...record, revision: Math.max(record.revision, revisions.get(record.id) ?? 0) + 1,
    }))];
    writeWorkspaceRecords(next);
    return imported.length;
  }, []);
  const trips = records.filter(record => record.kind === "trip").map(record => record.data as Trip);
  const visits = records.filter(record => record.kind === "visit").map(record => record.data as Visit);
  const customSources = records.filter(record => record.kind === "source").map(record => record.data as Source);
  const sources = [...seedSources.filter(source => !customSources.some(item => item.id === source.id)).map(source => ({ ...source, verifiedAt: "", historical: true, inventoryClass: source.type === "Friends bookstore" ? 1 : 2 })), ...customSources];
  const settings = records.find(record => record.kind === "settings")?.data as Settings | undefined;
  return { records, trips, visits, sources, settings: settings ?? defaultSettings, loading, error, reload, save, remove, restore };
}
export type Workspace = ReturnType<typeof useWorkspace>;
