import { z } from 'zod';
import { api, ApiError, bodyJSON } from '@/lib/auth/api';
const schema=z.object({mutation_key:z.uuid(),city_id:z.uuid(),body:z.string().trim().min(1).max(20000)});
export async function POST(request:Request,{params}:{params:Promise<{workspaceId:string}>}){const {workspaceId}=await params;return api(request,workspaceId,async({client,userId})=>{
 const parsed=schema.safeParse(await bodyJSON(request));if(!parsed.success)throw new ApiError('A note needs a city, text and mutation ID.',400);
 const existing=await client.from('notes').select('id,created_by').eq('workspace_id',workspaceId).eq('mutation_key',parsed.data.mutation_key).maybeSingle();
 if(existing.error)throw new ApiError('Note could not be checked.',503);
 if(existing.data){if(existing.data.created_by!==userId)throw new ApiError('Mutation belongs to another account.',409);return {id:existing.data.id};}
 const saved=await client.from('notes').insert({...parsed.data,workspace_id:workspaceId,created_by:userId}).select('id').single();
 if(saved.error?.code==='23505'){const retry=await client.from('notes').select('id').eq('workspace_id',workspaceId).eq('created_by',userId).eq('mutation_key',parsed.data.mutation_key).maybeSingle();if(retry.data)return retry.data;}
 if(saved.error)throw new ApiError('Note was not saved.',400);return saved.data;
});}
