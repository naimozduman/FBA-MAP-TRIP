"use client";
import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/fieldwork/primitives/dialog";
import {
  cities,
  cityById,
  corridors,
  routeById,
  sourceTypes,
} from "@/lib/fieldwork/data";
import type { Source } from "@/lib/fieldwork/types";
import { sourceSchema } from "@/lib/fieldwork/validation";
import { dayLabel, today, newId } from "@/lib/fieldwork/math";
import { Action, SelectField, TextAreaField, TextField } from "./ui";
import type { Workspace } from "./use-workspace";
import { toast } from "sonner";
import { sourcingBrief, sourceExclusion } from "@/lib/fieldwork/brief";
export default function SourceDialog({
  open,
  onClose,
  initial,
  cityId,
  routeId,
  workspace,
  onLog,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  initial: Source | null;
  cityId: string | null;
  routeId: number;
  workspace: Workspace;
  onLog: (s: Source) => void;
  onDelete: (id: string) => void;
}) {
  const [source, setSource] = useState<Source | null>(() => {
      return (
        initial ?? {
          id: newId(),
          routeId,
          cityId: cityId ?? routeById[routeId].anchor,
          name: "",
          type: "Thrift store",
          address: "",
          hours: "",
          pricing: "",
          contact: "",
          url: "",
          scanPolicy: "Unknown",
          notes: "",
          verifiedAt: "",
          nextDate: "",
          endDate: "",
        }
      );
    }),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const [draftRevision] = useState(
    () =>
      workspace.records.find((record) => record.id === initial?.id)?.revision ??
      0,
  );
  const set = (k: keyof Source, v: unknown) =>
    setSource((s) => (s ? { ...s, [k]: v } : s));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source) return;
    const result = sourceSchema.safeParse(source);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await workspace.save("source", source, draftRevision);
      toast.success("Source kept in this unsaved preview. Reloading clears it.");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The source was not saved.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !saving) onClose();
      }}
    >
      <DialogContent className="work-dialog source-dialog">
        <DialogHeader>
          <DialogTitle>{initial ? initial.name : "Add a source"}</DialogTitle>
          <DialogDescription>
            {initial
              ? `${cityById[initial.cityId].name}, ${cityById[initial.cityId].state}`
              : "Save a place, its rules, and a reason to return."}
          </DialogDescription>
        </DialogHeader>
        {source && (
          <form onSubmit={submit}>
            <div className="dialog-scroll">
              <p className="evidence-note">Unsaved preview — changes clear on reload. {source?.historical ? "Recovered details, prices and sale dates are historical claims and require verification." : "Record evidence before treating this lead as a confirmed source."}</p>
              {source && sourceExclusion(source) && <p className="scan-restricted">{sourceExclusion(source)}. Outlets are a separate source type. An override requires a recorded reason.</p>}
              {initial?.verifiedAt && (
                <div className="source-verified">
                  <span>Details checked {dayLabel(initial.verifiedAt)}</span>
                  {initial.url && (
                    <a
                      href={initial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Source page
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}
              <div className="form-grid">
                <TextField
                  label="Source name"
                  wide
                  required
                  value={source.name}
                  onChange={(e) => set("name", e.target.value)}
                  maxLength={180}
                />
                <SelectField
                  label="Corridor"
                  value={source.routeId}
                  onChange={(e) => set("routeId", Number(e.target.value))}
                >
                  {corridors.map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="City"
                  value={source.cityId}
                  onChange={(e) => set("cityId", e.target.value)}
                >
                  {cities
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}, {c.state}
                      </option>
                    ))}
                </SelectField>
                <SelectField
                  label="Source type"
                  value={source.type}
                  onChange={(e) => set("type", e.target.value)}
                >
                  {sourceTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </SelectField>
                <SelectField
                  label="ISBN scanning"
                  value={source.scanPolicy}
                  onChange={(e) => set("scanPolicy", e.target.value)}
                >
                  <option>Unknown</option>
                  <option>Allowed</option>
                  <option>Prohibited</option>
                </SelectField>
                <TextField
                  label="Address"
                  wide
                  value={source.address}
                  onChange={(e) => set("address", e.target.value)}
                  maxLength={300}
                />
                <TextAreaField
                  label="Hours & sale schedule"
                  value={source.hours}
                  onChange={(e) => set("hours", e.target.value)}
                  maxLength={500}
                  hint="Record the local timezone, CT or ET."
                />
                <TextAreaField
                  label="Pricing & membership"
                  value={source.pricing}
                  onChange={(e) => set("pricing", e.target.value)}
                  maxLength={700}
                />
                <TextField
                  label="Contact"
                  value={source.contact}
                  onChange={(e) => set("contact", e.target.value)}
                  maxLength={200}
                />
                <TextField
                  label="Official website"
                  type="url"
                  value={source.url}
                  onChange={(e) => set("url", e.target.value)}
                  placeholder="https://"
                />
                <TextField
                  label="Next sale date"
                  type="date"
                  value={source.nextDate}
                  onChange={(e) => set("nextDate", e.target.value)}
                />
                <TextField
                  label="Sale end date"
                  type="date"
                  value={source.endDate}
                  min={source.nextDate || undefined}
                  onChange={(e) => set("endDate", e.target.value)}
                />
                <TextField
                  label="Details last checked"
                  type="date"
                  value={source.verifiedAt}
                  onChange={(e) => set("verifiedAt", e.target.value)}
                />
                <div className="form-field">
                  <span>Verify before departure</span>
                  <button
                    type="button"
                    className="text-action"
                    onClick={() => set("verifiedAt", today())}
                  >
                    Mark checked today
                  </button>
                </div>
                <TextAreaField
                  label="Notes & relationship leads"
                  value={source.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  maxLength={4000}
                />
                <SelectField label="Inventory class" value={source.inventoryClass ?? ""} onChange={e => set("inventoryClass", e.target.value === "" ? null : Number(e.target.value))} wide><option value="">Unclassified</option>{sourcingBrief.source_classes.map(item => <option key={item.id} value={item.id}>Class {item.id}: {item.name}</option>)}</SelectField>
                <SelectField label="Revisit cadence" value={source.revisitCadence ?? ""} onChange={e => set("revisitCadence", e.target.value)} wide><option value="">No cadence selected</option>{sourcingBrief.revisit_logic.map(item => <option key={item.condition} value={`${item.condition}: ${item.cadence}`}>{item.condition}: {item.cadence}</option>)}</SelectField>
                <TextAreaField label="Source preference override reason" value={source.exclusionOverrideReason ?? ""} maxLength={500} onChange={e => set("exclusionOverrideReason", e.target.value)} hint="Regular Goodwill retail and Half Price Books stay excluded unless an explicit reason is recorded. Goodwill outlets remain eligible." />
              </div>
            </div>
            <div className="dialog-bottom">
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="action-row">
                {initial && (
                  <Action
                    type="button"
                    variant="outline"
                    onClick={() => onLog(initial)}
                  >
                    Log visit
                  </Action>
                )}
                <Action
                  type="submit"
                  disabled={saving || workspace.loading || !!workspace.error}
                >
                  <Check size={18} />
                  {saving ? "Saving…" : "Keep source in preview"}
                </Action>
                {initial && !initial.id.startsWith("seed-") && (
                  <button
                    type="button"
                    className="text-action danger"
                    onClick={() => onDelete(initial.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
