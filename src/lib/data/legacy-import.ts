import { createHash } from 'node:crypto';
import { z } from 'zod';
import { zoneSchema, pointSchema, openingSchema, categorySchema, evidenceSchema, tripSchema } from '@/lib/model';
export interface ImportDatabase { query<T = Record<string, unknown>>(sql:string, values?:unknown[]):Promise<{rows:T[]}> }
const recordSchema=z.object({entity:z.string().min(1).max(80),legacyId:z.string().min(1).max(200),payload:z.record(z.string(),z.unknown()),raw:z.unknown().optional()});
export const manifestSchema=z.object({format:z.literal('fieldwork-legacy/1'),system:z.string().min(1).max(100),records:z.array(recordSchema).max(50000),users:z.record(z.string(),z.uuid()).default({})});
export type LegacyManifest=z.infer<typeof manifestSchema>;
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
function canonical(value:unknown):string { if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';return JSON.stringify(value)??'null'; }
export function mappedId(workspace:string,system:string,entity:string,id:string){const b=Buffer.from(hash([workspace,system,entity,id].join('\0')).slice(0,32),'hex');b[6]=(b[6]&15)|80;b[8]=(b[8]&63)|128;const h=b.toString('hex');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}
const text=z.string().min(1).max(200), nullableLink=evidenceSchema.nullable().default(null), checked=z.iso.datetime({offset:true}).nullable().default(null);
const schemas={
 city:z.object({name:text,state:text,zone:zoneSchema,lat:z.number().min(-90).max(90).nullable().default(null),lng:z.number().min(-180).max(180).nullable().default(null),overview:z.string().max(4000).default(''),provenance:z.string().max(2000).default(''),corridor:z.string().max(200).default('')}),
 corridor:z.object({name:text}),
 vehicle:z.object({name:text,payload_kg:z.number().nonnegative().nullable().default(null),volume_liters:z.number().nonnegative().nullable().default(null)}),
 source:z.object({cityLegacyId:text,name:text,category:categorySchema,is_lead:z.boolean(),point:pointSchema.nullable().default(null),windows:z.array(openingSchema).nullable().default(null),evidence_url:nullableLink,checked_at:checked}),
 event:z.object({sourceLegacyId:text,name:text,windows:z.array(openingSchema).nullable().default(null),evidence_url:nullableLink,checked_at:checked}),
 food:z.object({cityLegacyId:text,name:text,status:z.enum(['certified','business_stated','community_reported','unverified']),point:pointSchema.nullable().default(null),windows:z.array(openingSchema).nullable().default(null),evidence_url:nullableLink,checked_at:checked,scope:z.string().max(2000).default('')}),
 corridor_city:z.object({cityLegacyId:text,corridorLegacyId:text,position:z.number().int().nonnegative()}),
 visit:z.object({cityLegacyId:text,sourceLegacyId:text.nullable().default(null),tripLegacyId:text.nullable().default(null),visited_at:z.iso.datetime({offset:true}),bought:z.number().int().nonnegative().nullable().default(null),scanned:z.number().int().nonnegative().nullable().default(null),usable:z.number().int().nonnegative().nullable().default(null),purchase_cents:z.number().int().nonnegative().nullable().default(null),minutes:z.number().int().nonnegative().nullable().default(null),notes:z.string().max(20000).default('')}),
 note:z.object({cityLegacyId:text.nullable().default(null),sourceLegacyId:text.nullable().default(null),tripLegacyId:text.nullable().default(null),body:z.string().min(1).max(20000)})
};
const tables:Record<string,string>={city:'cities',corridor:'corridors',vehicle:'vehicles',source:'sources',event:'source_events',food:'food_places',corridor_city:'corridor_cities',visit:'source_visits',note:'notes'};
export type Reconciliation={mappingVersion:string;exportSha256:string;inputRows:number;uniqueLegacyRecords:number;duplicateRows:number;uniqueIdsByEntity:Record<string,number>;mappedByEntity:Record<string,number>;quarantinedByEntity:Record<string,number>;newRows:number;alreadyMapped:number;warnings:{entity:string;legacyId:string;reason:string}[];advertised:{corridors:15;places:108;reconciled:false};};
export function inspectManifest(input:unknown):{manifest:LegacyManifest;report:Reconciliation}{const manifest=manifestSchema.parse(input),sha=hash(canonical(manifest));const keys=new Set<string>(),counts:Record<string,number>={};for(const r of manifest.records){const key=r.entity+'\0'+r.legacyId;if(!keys.has(key))counts[r.entity]=(counts[r.entity]||0)+1;keys.add(key);}return {manifest,report:{mappingVersion:'fieldwork-legacy/1.0',exportSha256:sha,inputRows:manifest.records.length,uniqueLegacyRecords:keys.size,duplicateRows:manifest.records.length-keys.size,uniqueIdsByEntity:counts,mappedByEntity:{},quarantinedByEntity:{},newRows:0,alreadyMapped:0,warnings:[],advertised:{corridors:15,places:108,reconciled:false}}};}
export async function importManifest(db:ImportDatabase,input:unknown,workspace:string,actor:string):Promise<Reconciliation>{
 const {manifest,report}=inspectManifest(input);z.uuid().parse(workspace);z.uuid().parse(actor);
 const owner=await db.query('select 1 from public.workspace_members where workspace_id=$1 and user_id=$2 and active and role=\'owner\'',[workspace,actor]);if(!owner.rows.length)throw new Error('Import actor must be an existing active owner of this dedicated workspace.');
 const groups=new Map<string,typeof manifest.records>();for(const r of manifest.records){const k=r.entity+'\0'+r.legacyId;groups.set(k,[...(groups.get(k)||[]),r]);}
 const order=['city','corridor','vehicle','source','event','food','corridor_city','trip','visit','note'];
 const records=[...groups.values()].sort((a,b)=>(order.indexOf(a[0].entity)<0?99:order.indexOf(a[0].entity))-(order.indexOf(b[0].entity)<0?99:order.indexOf(b[0].entity)));
 const id=(entity:string,legacyId:unknown)=>legacyId===null?null:mappedId(workspace,manifest.system,entity,String(legacyId));
 const link=async(entity:string,legacyId:unknown)=>{if(legacyId===null)return null;const exists=await db.query<{new_id:string;status:string}>('select new_id,status from public.legacy_records where workspace_id=$1 and legacy_system=$2 and entity_type=$3 and legacy_id=$4',[workspace,manifest.system,entity,String(legacyId)]);if(!exists.rows.length||exists.rows[0].status!=='mapped')throw new Error('Unresolved '+entity+' legacy reference: '+String(legacyId));return exists.rows[0].new_id;};
 await db.query('begin');try{
 await db.query("select set_config('request.jwt.claim.sub',$1,true)",[actor]);
 for(const group of records){const r=group[0],recordId=id(r.entity,r.legacyId),content=hash(canonical(r.payload));let warning:string|null=null,status='mapped';
  for(const original of group)await db.query('insert into public.legacy_snapshots(workspace_id,legacy_system,entity_type,legacy_id,content_sha256,raw) values($1,$2,$3,$4,$5,$6::jsonb) on conflict do nothing',[workspace,manifest.system,r.entity,r.legacyId,hash(canonical(original.payload)),JSON.stringify(original.raw??original)]);
  const existing=await db.query<{content_sha256:string;status:string}>('select content_sha256,status from public.legacy_records where workspace_id=$1 and legacy_system=$2 and entity_type=$3 and legacy_id=$4',[workspace,manifest.system,r.entity,r.legacyId]);
  if(existing.rows[0]?.status==='mapped'){
   report.alreadyMapped++;report.mappedByEntity[r.entity]=(report.mappedByEntity[r.entity]||0)+1;
   if(existing.rows[0].content_sha256!==content||new Set(group.map(x=>hash(canonical(x.payload)))).size>1)report.warnings.push({entity:r.entity,legacyId:r.legacyId,reason:'Changed legacy payload retained as a raw snapshot; existing canonical record preserved.'});
   continue;
  }
  await db.query('savepoint import_record');try{
   if(new Set(group.map(x=>hash(canonical(x.payload)))).size>1)throw new Error('Conflicting duplicate legacy ID; no arbitrary winner selected.');
   if(r.entity==='trip'){
    const payload=structuredClone(r.payload);payload.id=recordId;payload.version=0;
    payload.participants=(payload.participants as string[]).map(p=>{const user=manifest.users[p];if(!user)throw new Error('Unresolved legacy participant; provide explicit verified account mapping.');return user;});
    const days=payload.days as Record<string,unknown>[];
    for(const d of days){d.id=id('trip_day',r.legacyId+':'+String(d.id));d.mealAfterVisitId=d.mealAfterVisitId?id('city_visit',r.legacyId+':'+String(d.mealAfterVisitId)):null;for(const v of d.visits as Record<string,unknown>[]){v.id=id('city_visit',r.legacyId+':'+String(v.id));v.cityId=await link('city',v.cityId);for(const s of v.stops as Record<string,unknown>[]){s.id=id('trip_stop',r.legacyId+':'+String(s.id));s.sourceId=await link('source',s.sourceId??null);s.eventId=await link('event',s.eventId??null);}}}
    const transport=payload.transport as Record<string,unknown>;transport.vehicleIds=await Promise.all((transport.vehicleIds as string[]).map(v=>link('vehicle',v)));
    transport.driverAssignments=((transport.driverAssignments||[]) as {vehicleId:string;userId:string}[]).map(a=>({vehicleId:String(id('vehicle',a.vehicleId)),userId:manifest.users[a.userId]||a.userId}));
    const draft=tripSchema.parse(payload);await db.query('select public.save_trip($1,$2,0,$3::jsonb)',[workspace,recordId,JSON.stringify(draft)]);report.newRows++;
   }else{
    const schema=schemas[r.entity as keyof typeof schemas];if(!schema)throw new Error('Unmapped entity type. Preserve raw data until its meaning is inspected.');
    const data=schema.parse(r.payload) as Record<string,unknown>;
    if('cityLegacyId' in data){data.city_id=await link('city',data.cityLegacyId);delete data.cityLegacyId;}
    if('sourceLegacyId' in data){data.source_id=await link('source',data.sourceLegacyId);delete data.sourceLegacyId;}
    if('tripLegacyId' in data){data.trip_id=await link('trip',data.tripLegacyId);delete data.tripLegacyId;}
    if('corridorLegacyId' in data){data.corridor_id=await link('corridor',data.corridorLegacyId);delete data.corridorLegacyId;}
    if(r.entity==='note'&&[data.city_id,data.source_id,data.trip_id].filter(Boolean).length!==1)throw new Error('A note needs one resolved target.');
    const row={...data,workspace_id:workspace,...(r.entity==='corridor_city'?{}:{id:recordId,created_by:actor}),...(['note','visit'].includes(r.entity)?{mutation_key:id(r.entity+'_mutation',r.legacyId)}:{})};
    const fields=Object.keys(row),values=Object.values(row).map(v=>v&&typeof v==='object'?JSON.stringify(v):v);
    const table=tables[r.entity];const inserted=await db.query('insert into public.'+table+'('+fields.join(',')+') values('+fields.map((_,i)=>'$'+(i+1)).join(',')+') on conflict do nothing returning workspace_id',values);report.newRows+=inserted.rows.length;
    if(!inserted.rows.length&&r.entity!=='corridor_city')throw new Error('Canonical ID collision; record retained without assigning a false mapping.');
   }
   await db.query('release savepoint import_record');
  }catch(e){await db.query('rollback to savepoint import_record');await db.query('release savepoint import_record');status='quarantined';warning=e instanceof z.ZodError?'Invalid/unresolved canonical fields; raw payload preserved.':e instanceof Error?e.message:'Record unavailable';report.warnings.push({entity:r.entity,legacyId:r.legacyId,reason:warning});}
  const counts=status==='mapped'?report.mappedByEntity:report.quarantinedByEntity;counts[r.entity]=(counts[r.entity]||0)+1;
  await db.query('insert into public.legacy_records(workspace_id,legacy_system,entity_type,legacy_id,new_id,raw,status,warning,content_sha256) values($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9) on conflict(workspace_id,legacy_system,entity_type,legacy_id) do update set new_id=excluded.new_id,raw=excluded.raw,status=excluded.status,warning=excluded.warning,content_sha256=excluded.content_sha256',[workspace,manifest.system,r.entity,r.legacyId,status==='mapped'?recordId:null,JSON.stringify(r.raw??r),status,warning,content]);
 }
 await db.query('insert into public.import_runs(workspace_id,export_sha256,mapping_version,report) values($1,$2,$3,$4::jsonb) on conflict(workspace_id,export_sha256,mapping_version) do nothing',[workspace,report.exportSha256,report.mappingVersion,JSON.stringify(report)]);
 await db.query('commit');return report;
 }catch(e){await db.query('rollback');throw e;}
}
