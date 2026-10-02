import { api, ApiError, bodyJSON } from "@/lib/auth/api";
import { pointSchema } from "@/lib/model";
export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return api(request, workspaceId, async ({ client, role }) => {
    if (role !== "owner") throw new ApiError("Only the workspace owner can change the shared base.", 403);
    const parsed = pointSchema.safeParse(await bodyJSON(request));
    if (!parsed.success) throw new ApiError("Invalid base coordinates/address.", 400);
    const result = await client.from("workspace_settings").upsert({ workspace_id: workspaceId, origin: parsed.data, home_zone: parsed.data.zone }).select().single();
    if (result.error) throw new ApiError("Base was not saved.", 400);
    return { origin: parsed.data };
  });
}
