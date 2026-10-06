import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../../src/lib/fieldwork/types";
import { parseWorkspaceBackup, readWorkspaceRecords, writeWorkspaceRecords } from "../../src/lib/fieldwork/storage";

const record = { id: "preferences", kind: "settings", revision: 1, data: defaultSettings };
const backup = JSON.stringify({ app: "Fieldwork", version: 1, persistence: "unsaved-preview-export", records: [record] });
afterEach(() => vi.unstubAllGlobals());

describe("standalone workspace storage", () => {
  it("accepts existing exports and rejects unsupported versions and inconsistent identities", () => {
    expect(parseWorkspaceBackup(backup)).toEqual([record]);
    expect(() => parseWorkspaceBackup(backup.replace('"version":1', '"version":2'))).toThrow();
    expect(() => parseWorkspaceBackup(JSON.stringify({ app: "Fieldwork", version: 1, records: [{ ...record, id: "wrong" }] }))).toThrow(/inconsistent/);
    expect(() => parseWorkspaceBackup(JSON.stringify({ app: "Fieldwork", version: 1, records: [record, record] }))).toThrow(/duplicate/);
  });
  it("preserves an unreadable stored copy instead of replacing it with empty records", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem: () => "broken JSON", setItem });
    expect(() => readWorkspaceRecords()).toThrow(/preserved/);
    expect(setItem).not.toHaveBeenCalled();
  });
  it("does not publish successful saves when browser storage is full", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });
    vi.stubGlobal("localStorage", { setItem: () => { throw new Error("Quota exceeded"); } });
    expect(() => writeWorkspaceRecords(parseWorkspaceBackup(backup))).toThrow(/could not save/);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });
});
