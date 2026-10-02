import { z } from "zod";
import { api, ApiError, bodyJSON } from "@/lib/auth/api";
const schema = z.object({
  city_id: z.uuid(), source_id: z.uuid().nullable(), trip_id: z.uuid().nullable(),
  visited_at: z.iso.datetime({ offset: true }), bought: z.number().int().nonnegative().nullable(),
  scanned: z.number().int().nonnegative().nullable(), usable: z.number().int().nonnegative().nullable(),
  purchase_cents: z.number().int().nonnegative().nullable(), minutes: z.number().int().nonnegative().nullable(),
  notes: z.string().max(10000), mutation_key: z.uuid()
}).refine(v => v.usable === null || v.bought === null || v.usable <= v.bought, "Usable books cannot exceed books bought.");
export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return api(request, workspaceId, async ({ client, userId }) => {
    const parsed = schema.safeParse(await bodyJSON(request));
    if (!parsed.success) throw new ApiError("Invalid visit result.", 400);
    const existing = await client.from("source_visits").select("*").eq("workspace_id", workspaceId).eq("mutation_key", parsed.data.mutation_key).maybeSingle();
    if (existing.error) throw new ApiError("Could not verify the save retry.", 503);
    if (existing.data) {
      if (existing.data.created_by !== userId) throw new ApiError("Mutation key belongs to another author.", 409);
      return { visit: existing.data };
    }
    const result = await client.from("source_visits").insert({ ...parsed.data, workspace_id: workspaceId, created_by: userId }).select().single();
    if (result.error?.code === "23505") {
      const retry = await client.from("source_visits").select("*").eq("workspace_id", workspaceId).eq("mutation_key", parsed.data.mutation_key).eq("created_by", userId).single();
      if (!retry.error) return { visit: retry.data };
    }
    if (result.error) throw new ApiError("Visit was not saved. Verify source/city relationships.", 400);
    return { visit: result.data };
  });
}
