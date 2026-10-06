"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/fieldwork/primitives/dialog";
import {
  cityById,
  corridors,
  routeById,
  sourceTypes,
} from "@/lib/fieldwork/data";
import type { Source, Visit } from "@/lib/fieldwork/types";
import { qualityDimensions } from "@/lib/fieldwork/types";
import { today, newId } from "@/lib/fieldwork/math";
import { visitSchema } from "@/lib/fieldwork/validation";
import { Action, SelectField, TextAreaField, TextField } from "./ui";
import type { Workspace } from "./use-workspace";
import { toast } from "sonner";
export default function VisitDialog({
  open,
  onClose,
  initial,
  routeId,
  cityId,
  source,
  tripId,
  workspace,
}: {
  open: boolean;
  onClose: () => void;
  initial: Visit | null;
  routeId: number;
  cityId: string | null;
  source: Source | null;
  tripId: string | null;
  workspace: Workspace;
}) {
  const [visit, setVisit] = useState<Visit | null>(() => {
      const trip = workspace.trips.find((t) => t.id === tripId);
      const r = trip?.routeId ?? routeId;
      return (
        initial ?? {
          id: newId(),
          routeId: r,
          tripId: tripId ?? null,
          cityId: source?.cityId ?? cityId ?? routeById[r].anchor,
          sourceId: source?.id ?? null,
          sourceName: source?.name ?? "",
          sourceType: source?.type ?? "Thrift store",
          date: today(),
          books: 0,
          scanned: null,
          spend: 0,
          hours: 1,
          contribution: trip?.contribution ?? workspace.settings.contribution,
          competition: null,
          notes: "",
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
  const set = (key: keyof Visit, value: unknown) =>
    setVisit((v) => (v ? { ...v, [key]: value } : v));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visit) return;
    const result = visitSchema.safeParse(visit);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await workspace.save("visit", visit, draftRevision);
      toast.success("Visit saved on this device.");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your visit was not saved.");
    } finally {
      setSaving(false);
    }
  };
  const savedSource = workspace.sources.find((s) => s.id === visit?.sourceId);
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !saving) onClose();
      }}
    >
      <DialogContent className="work-dialog visit-dialog">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit visit" : "Log a sourcing visit"}
          </DialogTitle>
          <DialogDescription>
            Record the books you bought and what you learned. Visits save on this device. Projected revenue, fees and contribution remain estimates.
          </DialogDescription>
        </DialogHeader>
        {visit && (
          <form onSubmit={submit}>
            <div className="dialog-scroll">
              <div className="form-grid">
                <SelectField
                  label="Trip"
                  value={visit.tripId ?? ""}
                  onChange={(e) => {
                    const t = workspace.trips.find(
                      (t) => t.id === e.target.value,
                    );
                    setVisit((v) =>
                      v
                        ? {
                            ...v,
                            tripId: t?.id ?? null,
                            routeId: t?.routeId ?? v.routeId,
                            cityId: t?.stops[0] ?? v.cityId,
                            sourceId: null,
                            sourceName: "",
                          }
                        : v,
                    );
                  }}
                  wide
                >
                  <option value="">Standalone visit</option>
                  {workspace.trips
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} · {t.date}
                      </option>
                    ))}
                </SelectField>
                <SelectField
                  label="Corridor"
                  disabled={!!visit.tripId}
                  value={visit.routeId}
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    setVisit((v) =>
                      v
                        ? {
                            ...v,
                            routeId: r,
                            cityId: routeById[r].anchor,
                            sourceId: null,
                            sourceName: "",
                          }
                        : v,
                    );
                  }}
                >
                  {corridors.map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="City"
                  value={visit.cityId}
                  onChange={(e) => {
                    setVisit((v) =>
                      v
                        ? {
                            ...v,
                            cityId: e.target.value,
                            sourceId: null,
                            sourceName: "",
                          }
                        : v,
                    );
                  }}
                >
                  {Array.from(
                    new Set([
                      ...routeById[visit.routeId].cities,
                      ...(workspace.trips.find((t) => t.id === visit.tripId)
                        ?.stops ?? []),
                      ...(workspace.trips.find((t) => t.id === visit.tripId)
                        ?.returnStops ?? []),
                      visit.cityId,
                      "stl",
                    ]),
                  ).map((id) => (
                    <option value={id} key={id}>
                      {cityById[id].name}, {cityById[id].state}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Saved source"
                  value={visit.sourceId ?? ""}
                  onChange={(e) => {
                    const s = workspace.sources.find(
                      (s) => s.id === e.target.value,
                    );
                    setVisit((v) =>
                      v
                        ? {
                            ...v,
                            sourceId: s?.id ?? null,
                            sourceName: s?.name ?? "",
                            sourceType: s?.type ?? v.sourceType,
                          }
                        : v,
                    );
                  }}
                  wide
                >
                  <option value="">Enter a source below</option>
                  {workspace.sources
                    .filter((s) => s.cityId === visit.cityId)
                    .map((s) => (
                      <option value={s.id} key={s.id}>
                        {s.name}
                      </option>
                    ))}
                </SelectField>
                <TextField
                  label="Source name"
                  required
                  value={visit.sourceName}
                  onChange={(e) => set("sourceName", e.target.value)}
                  maxLength={180}
                />
                <SelectField
                  label="Source type"
                  value={visit.sourceType}
                  onChange={(e) => set("sourceType", e.target.value)}
                >
                  {sourceTypes.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </SelectField>
                {savedSource?.scanPolicy === "Prohibited" && (
                  <p className="scan-restricted wide">
                    This source prohibits ISBN scanning. Follow its rules.
                  </p>
                )}
                <TextField
                  label="Visit date"
                  type="date"
                  required
                  value={visit.date}
                  onChange={(e) => set("date", e.target.value)}
                />
                <TextField
                  label="Hours sourcing"
                  type="number"
                  min={0}
                  max={500}
                  step={0.25}
                  value={visit.hours}
                  onChange={(e) => set("hours", Number(e.target.value))}
                />
                <TextField
                  label="Books bought"
                  required
                  type="number"
                  min={0}
                  max={100000}
                  step={1}
                  value={visit.books}
                  onChange={(e) => set("books", Number(e.target.value))}
                />
                <TextField
                  label="Books scanned (optional)"
                  type="number"
                  min={visit.books}
                  step={1}
                  placeholder="Leave blank if uncounted"
                  value={visit.scanned ?? ""}
                  onChange={(e) =>
                    set(
                      "scanned",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
                <TextField
                  label="Book purchase cost ($)"
                  required
                  type="number"
                  min={0}
                  step={0.01}
                  value={visit.spend}
                  onChange={(e) => set("spend", Number(e.target.value))}
                />
                <TextField
                  label="Expected contribution / book ($)"
                  type="number"
                  step={0.01}
                  value={visit.contribution}
                  onChange={(e) => set("contribution", Number(e.target.value))}
                  hint="After Amazon fees and acquisition cost."
                />
                <SelectField
                  label="Saturation observed after this visit"
                  value={visit.competition ?? ""}
                  onChange={(e) =>
                    set(
                      "competition",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  wide
                >
                  <option value="">Not measured</option>
                  {Array.from({ length: 11 }, (_, i) => (
                    <option value={i} key={i}>
                      {i} / 10 ·{" "}
                      {i < 3
                        ? "Little reseller evidence"
                        : i < 5
                          ? "Some competition"
                          : i < 7
                            ? "Normal reseller presence"
                            : i < 9
                              ? "Picked stock / multiple scanners"
                              : "Severe competition"}
                    </option>
                  ))}
                </SelectField>
                <TextField label="Arrival (source local time)" type="datetime-local" value={visit.arrivalTime ?? ""} onChange={e => set("arrivalTime", e.target.value)} hint="Recorded local time; timezone is unconfirmed. Enter measured sourcing hours separately." />
                <TextField label="Departure (source local time)" type="datetime-local" value={visit.departureTime ?? ""} onChange={e => set("departureTime", e.target.value)} />
                <TextField label="Books rejected" type="number" min={0} step={1} value={visit.booksRejected ?? ""} onChange={e => set("booksRejected", e.target.value === "" ? null : Number(e.target.value))} />
                <TextField label="Rejection reason" value={visit.rejectionReason ?? ""} onChange={e => set("rejectionReason", e.target.value)} maxLength={1000} />
                {([ ["projectedRevenue", "Projected revenue ($)"], ["projectedAmazonFees", "Projected Amazon fees ($)"], ["projectedProfit", "Projected book profit ($)"] ] as const).map(([key, label]) => <TextField key={key} label={label} type="number" step={0.01} value={visit[key] ?? ""} onChange={e => set(key, e.target.value === "" ? null : Number(e.target.value))} hint={key === "projectedProfit" ? "After fees and acquisition; a projection, not realized sales profit." : undefined} />)}
                <TextField label="Scanner competitors observed" type="number" min={0} step={1} value={visit.scannersObserved ?? ""} onChange={e => set("scannersObserved", e.target.value === "" ? null : Number(e.target.value))} hint="Blank means unobserved; zero is a recorded observation." />
                <SelectField label="Stock condition observed" value={visit.stockPicked ?? "unknown"} onChange={e => set("stockPicked", e.target.value)}><option value="unknown">Not observed</option><option value="fresh">Looked fresh</option><option value="picked">Looked recently picked</option></SelectField>
                <TextField label="Restock frequency observed" value={visit.restockFrequency ?? ""} onChange={e => set("restockFrequency", e.target.value)} maxLength={300} />
                <TextField label="Employee / organizer contact" value={visit.organizerContact ?? ""} onChange={e => set("organizerContact", e.target.value)} maxLength={300} />
                <SelectField label="Accepts bulk removal proposals" value={visit.acceptsBulk ?? "unknown"} onChange={e => set("acceptsBulk", e.target.value)}><option value="unknown">Unknown</option><option value="yes">Yes — confirmed at visit</option><option value="no">No — confirmed at visit</option></SelectField>
                <TextField label="Next sale or restock date" type="date" value={visit.nextRestockDate ?? ""} onChange={e => set("nextRestockDate", e.target.value)} />
                <details className="quality-fields wide"><summary>Source quality: raw evidence and optional 0–5 scores</summary><p className="muted">Keep the observations behind each score. No aggregate score or weights are invented. A higher competition score means less competition.</p><div className="form-grid">
                  {qualityDimensions.map(dimension => <div className="quality-dimension" key={dimension}>
                    <TextField label={`${dimension.replaceAll("_", " ")} — raw observation`} value={visit.quality?.[dimension]?.raw ?? ""} maxLength={1000} onChange={e => set("quality", { ...visit.quality, [dimension]: { score: visit.quality?.[dimension]?.score ?? null, raw: e.target.value } })} />
                    <SelectField label={`${dimension.replaceAll("_", " ")} — score`} value={visit.quality?.[dimension]?.score ?? ""} onChange={e => set("quality", { ...visit.quality, [dimension]: { raw: visit.quality?.[dimension]?.raw ?? "", score: e.target.value === "" ? null : Number(e.target.value) } })}><option value="">Not measured</option>{[0,1,2,3,4,5].map(value => <option key={value} value={value}>{value} / 5</option>)}</SelectField>
                  </div>)}
                </div></details>
                <TextAreaField
                  label="Observations & next visit"
                  value={visit.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  maxLength={4000}
                  placeholder="Fresh shelves, competitor count, restock date, loading, organizer contact…"
                />
              </div>
            </div>
            <div className="dialog-bottom">
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <Action
                type="submit"
                disabled={saving || workspace.loading || !!workspace.error}
              >
                <Check size={18} />
                {saving ? "Saving…" : "Save visit"}
              </Action>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
