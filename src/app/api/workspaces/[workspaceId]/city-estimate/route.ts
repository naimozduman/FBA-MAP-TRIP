import { z } from 'zod';
import { api, ApiError } from '@/lib/auth/api';
import { pointSchema, type City } from '@/lib/model';
import { cityEstimate } from '@/lib/routing/city-estimate';
export async function GET(request:Request,{params}:{params:Promise<{workspaceId:string}>}){const {workspaceId}=await params;return api(request,workspaceId,async({client})=>{
 const id=z.uuid().safeParse(new URL(request.url).searchParams.get('city'));if(!id.success)throw new ApiError('Choose a workspace city.',400);
 const [city,settings]=await Promise.all([client.from('cities').select('*').eq('workspace_id',workspaceId).eq('id',id.data).single(),client.from('workspace_settings').select('origin').eq('workspace_id',workspaceId).maybeSingle()]);
 if(city.error||settings.error)throw new ApiError('City/base access could not be verified.',404);
 const parsed=pointSchema.safeParse(settings.data?.origin),origin=parsed.success?parsed.data:null;
 if(!process.env.MAPBOX_DIRECTIONS_TOKEN||!origin?.confirmed)return cityEstimate(origin,city.data as City,undefined);
 const quota=await client.rpc('consume_route_budget',{p_workspace:workspaceId});if(quota.error||!quota.data)throw new ApiError('Route unavailable: workspace hourly quota reached.',429);
 return cityEstimate(origin,city.data as City,process.env.MAPBOX_DIRECTIONS_TOKEN);
});}
