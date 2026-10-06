"use client";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/fieldwork/primitives/alert-dialog";
import type { Workspace } from "./use-workspace";
import { toast } from "sonner";
export default function RemoveDialog({
  id,
  onClose,
  workspace,
}: {
  id: string | null;
  onClose: () => void;
  workspace: Workspace;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const entry = workspace.records.find((r) => r.id === id);
  return (
    <AlertDialog
      open={!!id}
      onOpenChange={(v) => {
        if (!v && !busy) {
          setError("");
          onClose();
        }
      }}
    >
      <AlertDialogContent className="work-dialog confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Remove this {entry?.kind ?? "entry"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {entry?.kind === "trip"
              ? "The trip will be removed. Its visit observations remain saved as standalone visits."
              : "This entry will be removed from your saved records."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Keep entry</AlertDialogCancel>
          <AlertDialogAction
            className="delete-action"
            disabled={busy}
            onClick={async (e) => {
              e.preventDefault();
              if (!id) return;
              setBusy(true);
              try {
                await workspace.remove(id);
                setError("");
                onClose();
              } catch (e) {
                const msg =
                  e instanceof Error
                    ? e.message
                    : "Unable to remove the entry.";
                setError(msg);
                toast.error(msg);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Removing…" : "Remove entry"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
