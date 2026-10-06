"use client";
import { useRef, useState } from "react";
import { Check, Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/fieldwork/primitives/dialog";
import type { Settings } from "@/lib/fieldwork/types";
import { settingsSchema } from "@/lib/fieldwork/validation";
import { Action, TextField } from "./ui";
import type { Workspace } from "./use-workspace";
import { toast } from "sonner";
export default function SettingsDialog({
  open,
  onClose,
  workspace,
}: {
  open: boolean;
  onClose: () => void;
  workspace: Workspace;
}) {
  const [settings, setSettings] = useState<Settings>(workspace.settings),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const backupInput = useRef<HTMLInputElement>(null);
  const [draftRevision] = useState(
    () =>
      workspace.records.find((record) => record.kind === "settings")
        ?.revision ?? 0,
  );
  const set = (k: keyof Settings, v: unknown) =>
    setSettings((s) => ({ ...s, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const checked = settingsSchema.safeParse(settings);
    if (!checked.success) {
      setError(checked.error.issues[0].message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await workspace.save("settings", settings, draftRevision);
      toast.success("Defaults saved on this device");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settings were not saved.");
    } finally {
      setSaving(false);
    }
  };
  const download = (csv = false) => {
    if (workspace.loading || workspace.error) {
      toast.error("Load your records before exporting.");
      return;
    }
    const content = csv
      ? [
          "Date,Source,City,Route,Trip,Books bought,Books scanned,Book cost,Sourcing hours,Projected contribution per book,Observed saturation,Notes,Arrival local,Departure local,Books rejected,Rejection reason,Projected revenue,Projected Amazon fees,Projected book profit,Scanners observed,Stock condition,Restock frequency,Organizer contact,Accepts bulk removal,Next sale/restock,Raw source quality",
          ...workspace.visits.map((v) =>
            [
              v.date,
              v.sourceName,
              v.cityId,
              v.routeId,
              v.tripId ?? "",
              v.books,
              v.scanned ?? "",
              v.spend,
              v.hours,
              v.contribution,
              v.competition ?? "",
              v.notes,
              v.arrivalTime ?? "", v.departureTime ?? "", v.booksRejected ?? "", v.rejectionReason ?? "",
              v.projectedRevenue ?? "", v.projectedAmazonFees ?? "", v.projectedProfit ?? "",
              v.scannersObserved ?? "", v.stockPicked ?? "", v.restockFrequency ?? "", v.organizerContact ?? "",
              v.acceptsBulk ?? "", v.nextRestockDate ?? "", JSON.stringify(v.quality ?? {}),
            ]
              .map(
                (x) =>
                  `"${String(x)
                    .replace(/"/g, '""')
                    .replace(/^[=+@-]/, "'$&")}"`,
              )
              .join(","),
          ),
        ].join("\n")
      : JSON.stringify(
          {
            app: "Fieldwork",
            version: 1,
            persistence: "browser-local",
            exportedAt: new Date().toISOString(),
            records: workspace.records,
          },
          null,
          2,
        );
    const url = URL.createObjectURL(
      new Blob([content], {
        type: csv ? "text/csv;charset=utf-8" : "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = csv ? "fieldwork-visits.csv" : "fieldwork-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };
  const restore = async (file: File | undefined) => {
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Choose a backup smaller than 10 MB.");
      const count = await workspace.restore(await file.text());
      toast.success(`${count} records restored on this device`);
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.name !== "ZodError" && e.name !== "SyntaxError" ? e.message : "Choose a valid Fieldwork JSON backup. Your saved records have not changed.");
    } finally {
      setSaving(false);
      if (backupInput.current) backupInput.current.value = "";
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !saving) onClose();
      }}
    >
      <DialogContent className="work-dialog settings-dialog">
        <DialogHeader>
          <DialogTitle>Your fieldwork defaults</DialogTitle>
          <DialogDescription>
            Editable estimates for your next Explorer trip.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="dialog-scroll">
            <div className="form-grid">
              <TextField
                label="Vehicle"
                required
                value={settings.vehicle}
                onChange={(e) => set("vehicle", e.target.value)}
              />
              <TextField
                label="Traveling with"
                required
                value={settings.people}
                onChange={(e) => set("people", e.target.value)}
              />
              <TextField
                label="Planning fuel economy (MPG)"
                type="number"
                min={1}
                max={200}
                step={0.1}
                value={settings.mpg}
                onChange={(e) => set("mpg", Number(e.target.value))}
              />
              <TextField
                label="Planning gas price ($/gallon)"
                type="number"
                min={0}
                step={0.01}
                value={settings.gasPrice}
                onChange={(e) => set("gasPrice", Number(e.target.value))}
              />
              <TextField
                label="Expected contribution / book ($)"
                wide
                type="number"
                step={0.01}
                value={settings.contribution}
                onChange={(e) => set("contribution", Number(e.target.value))}
                hint="After Amazon fees and purchase cost. This is your buying estimate."
              />
            </div>
            <section className="form-section">
              <h3>Records & exports</h3>
              <p className="muted">
                Trip plans, sources and visit history save in this browser and survive reloads.
                Use a JSON backup to move your records to another device. Clearing website data removes this browser’s copy.
              </p>
              <div className="action-row">
                <Action
                  type="button"
                  variant="outline"
                  onClick={() => download()}
                  disabled={workspace.loading || !!workspace.error}
                >
                  <Download size={16} />
                  Backup JSON
                </Action>
                <Action
                  type="button"
                  variant="outline"
                  onClick={() => download(true)}
                  disabled={workspace.loading || !!workspace.error}
                >
                  <Download size={16} />
                  Visits CSV
                </Action>
                <input
                  ref={backupInput}
                  type="file"
                  accept=".json,application/json"
                  aria-label="Restore Fieldwork backup"
                  className="sr-only"
                  onChange={e => void restore(e.target.files?.[0])}
                />
                <Action
                  type="button"
                  variant="outline"
                  disabled={saving || workspace.loading || !!workspace.error}
                  onClick={() => backupInput.current?.click()}
                >
                  <Upload size={16} />
                  Restore JSON
                </Action>
              </div>
              <p className="muted">Restore merges backup records into this browser. Matching record IDs use the backup version.</p>
            </section>
            <section className="form-section">
              <h3>About the territory</h3>
              <p className="muted">
                Travel times are approximate one-way estimates from St. Louis,
                before traffic or sourcing stops. City points use rounded town
                centers. Lines show corridor sketches and return plans, rather
                than road navigation.
              </p>
              <p className="muted">
                Competition hypotheses come from your supplied research.
                Measured competition appears after three scored visits. Recovered source
                details, prices, hours and sale dates are historical claims. Links
                are leads to check; no current verification is implied.
              </p>
            </section>
          </div>
          <div className="dialog-bottom">
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <Action
              type="submit"
              disabled={saving || workspace.loading || !!workspace.error}
            >
              <Check size={18} />
              {saving ? "Saving…" : "Save defaults"}
            </Action>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
