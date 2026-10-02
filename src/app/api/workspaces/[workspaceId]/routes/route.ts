import { api, ApiError, bodyJSON } from "@/lib/auth/api";
import { tripSchema } from "@/lib/model";
import { calculateRoadRoute } from "@/lib/routing/mapbox";
import { routeRevision } from '@/lib/routing/revision';
import { routeWaypoints } from '@/lib/planning/schedule';
export const maxDuration = 60;
export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return api(request, workspaceId, async ({ client }) => {
    const parsed = tripSchema.safeParse(await bodyJSON(request));
    if (!parsed.success) throw new ApiError("Invalid route itinerary.", 400);
    if (!process.env.MAPBOX_DIRECTIONS_TOKEN) return calculateRoadRoute(parsed.data, undefined);
    try { routeWaypoints(parsed.data); } catch(e) { return {status:'unavailable',revision:routeRevision(parsed.data),legs:[],reason:'Route unavailable: '+(e instanceof Error?e.message:'Choose exact access points.')}; }
    const cityIds=[...new Set(parsed.data.days.flatMap(d=>d.visits.map(v=>v.cityId)))];
    const cities=await client.from('cities').select('id').eq('workspace_id',workspaceId).in('id',cityIds);
    if(cities.error||cities.data?.length!==cityIds.length)throw new ApiError('Route unavailable: city references do not belong to this workspace.',400);
    const quota = await client.rpc("consume_route_budget", { p_workspace: workspaceId });
    if (quota.error || !quota.data) throw new ApiError("Route unavailable: hourly request quota reached.", 429);
    return calculateRoadRoute(parsed.data, process.env.MAPBOX_DIRECTIONS_TOKEN);
  });
}
