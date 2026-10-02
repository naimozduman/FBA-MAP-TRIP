import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
export async function testDatabase() {
  const db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;");
  for (const file of (await readdir("supabase/migrations")).filter(f=>f.endsWith(".sql")).sort()) await db.exec(await readFile("supabase/migrations/"+file,"utf8"));
  return db;
}
export const ids = {
  owner:"00000000-0000-4000-8000-000000000001", partner:"00000000-0000-4000-8000-000000000002", outsider:"00000000-0000-4000-8000-000000000003",
  second:"00000000-0000-4000-8000-000000000004", ws:"10000000-0000-4000-8000-000000000001", otherWs:"10000000-0000-4000-8000-000000000002",
  city:"20000000-0000-4000-8000-000000000001", otherCity:"20000000-0000-4000-8000-000000000002"
};
export async function seedSecurity(db:PGlite) {
  for(const id of [ids.owner,ids.partner,ids.outsider,ids.second]) await db.query("insert into auth.users values($1)",[id]);
  await db.query("insert into workspaces(id,name,created_by) values($1,'Synthetic A',$2),($3,'Synthetic B',$4)",[ids.ws,ids.owner,ids.otherWs,ids.second]);
  await db.query("insert into workspace_members values($1,$2,'owner',true),($1,$3,'partner',true),($4,$5,'owner',true)",[ids.ws,ids.owner,ids.partner,ids.otherWs,ids.second]);
  await db.query("insert into cities(id,workspace_id,name,state,zone,created_by) values($1,$2,'Synthetic city A','XX','America/Chicago',$3),($4,$5,'Synthetic city B','XX','America/Chicago',$6)",[ids.city,ids.ws,ids.owner,ids.otherCity,ids.otherWs,ids.second]);
}
export async function asUser<T>(db:PGlite,userId:string|null,action:()=>Promise<T>):Promise<T> {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[userId||""]);
  await db.exec(userId?"set role authenticated":"set role anon");
  try{return await action();}finally{await db.exec("reset role");await db.query("select set_config('request.jwt.claim.sub','',false)");}
}
