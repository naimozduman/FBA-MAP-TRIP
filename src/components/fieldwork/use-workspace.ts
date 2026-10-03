"use client";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { seedSources } from "@/lib/fieldwork/data";
import { schemas } from "@/lib/fieldwork/validation";
import { defaultSettings, type Kind, type RecordData, type Settings, type Source, type StoredRecord, type Trip, type Visit } from "@/lib/fieldwork/types";

// Public preview only. The recovered Sites endpoint had no tenant authorization.
// Keep every edit in React memory; shared persistence remains the guarded v2 API.
export function useWorkspace() {
  const [records, setRecords] = useState<StoredRecord[]>([]);
  const current = useRef(records);
  const reload = useCallback(async () => undefined, []);
  const save = useCallback(async (kind: Kind, data: RecordData, expectedRevision = 0) => {
    const parsed = schemas[kind].parse(data) as RecordData;
    const previous = current.current.find(record => record.id === parsed.id);
    if ((previous?.revision ?? 0) !== expectedRevision) throw new Error("This preview draft changed. Reopen it before editing.");
    const record: StoredRecord = { id: parsed.id, kind, data: parsed, revision: expectedRevision + 1 };
    current.current = [...current.current.filter(item => item.id !== parsed.id), record];
    setRecords(current.current);
    return record;
  }, []);
  const remove = useCallback(async (id: string) => {
    if (!current.current.some(record => record.id === id)) throw new Error("This entry is not in the preview.");
    current.current = current.current.filter(record => record.id !== id).map(record => {
      if (record.kind !== "visit") return record;
      const visit = record.data as Visit;
      if (visit.tripId !== id && visit.sourceId !== id) return record;
      return { ...record, revision: record.revision + 1, data: { ...visit, tripId: visit.tripId === id ? null : visit.tripId, sourceId: visit.sourceId === id ? null : visit.sourceId } };
    });
    setRecords(current.current);
    toast.success("Removed from this unsaved preview. Visit observations are retained.");
  }, []);
  const trips = records.filter(record => record.kind === "trip").map(record => record.data as Trip);
  const visits = records.filter(record => record.kind === "visit").map(record => record.data as Visit);
  const customSources = records.filter(record => record.kind === "source").map(record => record.data as Source);
  const sources = [...seedSources.filter(source => !customSources.some(item => item.id === source.id)).map(source => ({ ...source, verifiedAt: "", historical: true, inventoryClass: source.type === "Friends bookstore" ? 1 : 2 })), ...customSources];
  const settings = records.find(record => record.kind === "settings")?.data as Settings | undefined;
  return { records, trips, visits, sources, settings: settings ?? defaultSettings, loading: false, error: "", reload, save, remove, preview: true };
}
export type Workspace = ReturnType<typeof useWorkspace>;
