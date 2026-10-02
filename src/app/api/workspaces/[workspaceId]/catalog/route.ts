import { z } from "zod";
import { api, ApiError, bodyJSON } from "@/lib/auth/api";
import { categorySchema, pointSchema, openingSchema, zoneSchema } from "@/lib/model";
const link = z.url().refine(v=>v.startsWith("https://"),"HTTPS source required").nullable();
const city = z.object({ kind:z.literal("city"),name:z.string().min(1).max(200),state:z.string().min(2).max(100),zone:zoneSchema,lat:z.number().min(-90).max(90).nullable(),lng:z.number().min(-180).max(180).nullable(),overview:z.string().max(4000),provenance:z.string().max(2000),corridor:z.string().max(200) });
const source = z.object({kind:z.literal("source"),city_id:z.uuid(),name:z.string().min(1).max(200),category:categorySchema,is_lead:z.boolean(),point:pointSchema.nullable(),windows:z.array(openingSchema).max(50).nullable(),evidence_url:link,checked_at:z.iso.datetime({offset:true}).nullable()});
const food = z.object({kind:z.literal("food"),city_id:z.uuid(),name:z.string().min(1).max(200),status:z.enum(["certified","business_stated","community_reported","unverified"]),evidence_url:link,checked_at:z.iso.datetime({offset:true}).nullable(),scope:z.string().max(2000),point:pointSchema.nullable(),windows:z.array(openingSchema).max(50).nullable()});
const vehicle = z.object({kind:z.literal("vehicle"),name:z.string().min(1).max(200),payload_kg:z.number().nonnegative().nullable(),volume_liters:z.number().nonnegative().nullable()});
const event=z.object({kind:z.literal("event"),source_id:z.uuid(),name:z.string().min(1).max(200),windows:z.array(openingSchema).max(50).nullable(),evidence_url:link,checked_at:z.iso.datetime({offset:true}).nullable()});
const schema=z.discriminatedUnion("kind",[city,source,food,vehicle,event]);
export async function POST(request:Request,{params}:{params:Promise<{workspaceId:string}>}) {
  const {workspaceId}=await params;
  return api(request,workspaceId,async({client,userId})=>{
    const parsed=schema.safeParse(await bodyJSON(request));
    if(!parsed.success)throw new ApiError("Catalog fields are invalid.",400);
    const {kind,...fields}=parsed.data;
    if(kind==="food"&&"status" in fields&&fields.status!=="unverified"&&(!fields.evidence_url||!fields.checked_at))throw new ApiError("A halal claim needs its actual source and check date.",400);
    if(kind==="source"&&"is_lead" in fields&&!fields.is_lead&&(!fields.point?.confirmed||!fields.windows?.length||!fields.evidence_url||!fields.checked_at))throw new ApiError("Keep this as an unconfirmed lead until its address, hours and evidence are known.",400);
    const table={city:"cities",source:"sources",food:"food_places",vehicle:"vehicles",event:"source_events"}[kind];
    const result=await client.from(table).insert({...fields,workspace_id:workspaceId,created_by:userId}).select().single();
    if(result.error)throw new ApiError("Catalog record was not saved.",400);
    return {record:result.data};
  });
}
