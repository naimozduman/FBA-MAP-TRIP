import { api, ApiError, bodyJSON } from "@/lib/auth/api";
import { tripSchema } from "@/lib/model";
import { buildSchedule } from "@/lib/planning/schedule";
import { tripConflicts } from "@/lib/planning/transport";
export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return api(request, workspaceId, async ({ client }) => {
    const parsed = tripSchema.safeParse(await bodyJSON(request));
    if (!parsed.success) throw new ApiError("Invalid trip: " + parsed.error.issues.map(i => i.message).join("; "), 400);
    const current = await client.from("trips").select("draft").eq("workspace_id", workspaceId);
    if (current.error) throw new ApiError("Could not verify resource conflicts.", 503);
    let conflicts: string[];
    try { conflicts = tripConflicts(parsed.data, (current.data || []).map(t => tripSchema.parse(t.draft))); } catch { throw new ApiError("Invalid trip dates/time zone.", 400); }
    const saved = await client.rpc("save_trip", { p_workspace: workspaceId, p_id: parsed.data.id, p_expected_version: parsed.data.version, p_draft: parsed.data });
    if (saved.error) throw new ApiError(saved.error.code === "40001" || saved.error.code === "23505" ? "Save conflict. Reload the current trip before merging your changes." : "Trip save rejected. Verify same-workspace cities, sources, participants and vehicles.", saved.error.code === "40001" || saved.error.code === "23505" ? 409 : 400);
    return { trip: saved.data, conflicts, schedule: buildSchedule(parsed.data, [], conflicts) };
  });
}
