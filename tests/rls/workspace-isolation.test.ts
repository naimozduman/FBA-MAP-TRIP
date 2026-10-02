import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { testDatabase, seedSecurity, asUser, ids } from "../helpers/database";
import { newTrip, newCityVisit } from "@/lib/planning/draft";
describe("real PostgreSQL RLS (synthetic identity claims, not Supabase Auth)",()=>{
  let db:PGlite;
  beforeAll(async()=>{db=await testDatabase();await seedSecurity(db);});
  afterAll(async()=>{if(db)await db.close();});
  it("partners read the same workspace while outsider/second workspace/anonymous are denied",async()=>{
    for(const user of [ids.owner,ids.partner]) await asUser(db,user,async()=>{
      expect((await db.query("select id from cities")).rows).toHaveLength(1);
      expect((await db.query("select id from cities where id=$1",[ids.otherCity])).rows).toHaveLength(0);
    });
    await asUser(db,ids.outsider,async()=>expect((await db.query("select * from cities")).rows).toHaveLength(0));
    await asUser(db,ids.second,async()=>expect((await db.query("select id from cities")).rows).toEqual([{id:ids.otherCity}]));
    await asUser(db,null,async()=>expect(db.query("select * from cities")).rejects.toThrow());
  });
  it("allows operational inserts but rejects cross-tenant references and creator spoofing",async()=>{
    await asUser(db,ids.partner,async()=>{
      const inserted=await db.query("insert into sources(workspace_id,city_id,name,category) values($1,$2,'Synthetic charity','charity') returning id",[ids.ws,ids.city]);
      expect(inserted.rows).toHaveLength(1);
      await expect(db.query("insert into sources(workspace_id,city_id,name,category) values($1,$2,'Attack','charity')",[ids.ws,ids.otherCity])).rejects.toThrow();
      await expect(db.query("insert into sources(workspace_id,city_id,name,category,created_by) values($1,$2,'Spoof','charity',$3)",[ids.ws,ids.city,ids.owner])).rejects.toThrow();
      await expect(db.query("insert into cities(workspace_id,name,state,zone) values($1,'Attack','XX','America/Chicago')",[ids.otherWs])).rejects.toThrow();
    });
  });
  it("denies self-join/self-promotion and partner base changes",async()=>{
    await asUser(db,ids.partner,async()=>{
      await expect(db.query("update workspace_members set role='owner' where user_id=$1",[ids.partner])).rejects.toThrow();
      await expect(db.query("insert into workspace_members values($1,$2,'owner',true)",[ids.otherWs,ids.partner])).rejects.toThrow();
      await expect(db.query("insert into workspace_settings(workspace_id,origin) values($1,'{}')",[ids.ws])).rejects.toThrow();
    });
    await asUser(db,ids.owner,async()=>expect((await db.query("insert into workspace_settings(workspace_id) values($1) returning workspace_id",[ids.ws])).rows).toHaveLength(1));
  });
  it("forbids tenant reassignment even when a member belongs to both tenants",async()=>{
    await db.query("insert into workspace_members values($1,$2,'partner',true)",[ids.otherWs,ids.partner]);
    await asUser(db,ids.partner,async()=>await expect(db.query("update cities set workspace_id=$1 where id=$2",[ids.otherWs,ids.city])).rejects.toThrow());
    await db.query("delete from workspace_members where workspace_id=$1 and user_id=$2",[ids.otherWs,ids.partner]);
  });
  it("saves normalized trips atomically and rejects stale revisions / foreign IDs",async()=>{
    const trip=newTrip([ids.owner,ids.partner],"2026-10-01");
    trip.days[0].visits=[newCityVisit({id:ids.city,name:"Synthetic city A",state:"XX",zone:"America/Chicago",lat:0,lng:0,overview:"Synthetic",provenance:"Test",corridor:"Test"})];
    await asUser(db,ids.owner,async()=>{
      const result=await db.query<{save_trip:{version:number}}>("select save_trip($1,$2,0,$3::jsonb)",[ids.ws,trip.id,JSON.stringify(trip)]);
      expect(result.rows[0].save_trip.version).toBe(1);
      expect((await db.query("select * from city_visits")).rows).toHaveLength(1);
      await expect(db.query("select save_trip($1,$2,0,$3::jsonb)",[ids.ws,trip.id,JSON.stringify(trip)])).rejects.toThrow();
      const invalid=structuredClone(trip);invalid.days[0].visits[0].cityId=ids.otherCity;
      await expect(db.query("select save_trip($1,$2,1,$3::jsonb)",[ids.ws,trip.id,JSON.stringify(invalid)])).rejects.toThrow();
      expect((await db.query("select version from trips")).rows).toEqual([{version:1}]);
    });
    await asUser(db,ids.outsider,async()=>await expect(db.query("select save_trip($1,$2,0,$3::jsonb)",[ids.ws,crypto.randomUUID(),JSON.stringify(trip)])).rejects.toThrow());
  });
  it("revocation takes effect on the next request and denied updates change no rows",async()=>{
    await db.query("update workspace_members set active=false where workspace_id=$1 and user_id=$2",[ids.ws,ids.partner]);
    await asUser(db,ids.partner,async()=>{
      expect((await db.query("select * from source_visits")).rows).toHaveLength(0);
      expect((await db.query("update cities set name='Attack' where id=$1 returning id",[ids.city])).rows).toHaveLength(0);
      await expect(db.query("insert into notes(workspace_id,city_id,body,mutation_key) values($1,$2,'Attack',$3)",[ids.ws,ids.city,crypto.randomUUID()])).rejects.toThrow();
    });
    await db.query("update workspace_members set active=true where workspace_id=$1 and user_id=$2",[ids.ws,ids.partner]);
  });
  it("every public business table has RLS enabled",async()=>{
    const tables=await db.query<{relname:string;relrowsecurity:boolean}>("select relname,relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relkind='r'");
    expect(tables.rows.length).toBeGreaterThan(15);expect(tables.rows.every(t=>t.relrowsecurity)).toBe(true);
  });
});

it('denies nullable creator bypass, unsupported halal claims and direct unchecked saves',async()=>{
 const db=await testDatabase();try{await seedSecurity(db);await asUser(db,ids.partner,async()=>{
  await expect(db.query("insert into sources(workspace_id,city_id,name,category,created_by) values($1,$2,'Synthetic null creator','charity',null)",[ids.ws,ids.city])).rejects.toThrow();
  await expect(db.query("insert into food_places(workspace_id,city_id,name,status,checked_at) values($1,$2,'Synthetic unsupported claim','certified',now())",[ids.ws,ids.city])).rejects.toThrow();
  await expect(db.query("insert into sources(workspace_id,city_id,name,category,is_lead) values($1,$2,'Synthetic unsupported venue','independent',false)",[ids.ws,ids.city])).rejects.toThrow();
  await expect(db.query("select private.save_trip_unchecked($1,$2,0,'{}'::jsonb)",[ids.ws,crypto.randomUUID()])).rejects.toThrow();
 });}finally{await db.close();}
});

it('persists an assigned driver and rejects a driver outside the saved crew',async()=>{
 const db=await testDatabase();try{await seedSecurity(db);const vehicle=crypto.randomUUID();await db.query("insert into public.vehicles(id,workspace_id,name,created_by) values($1,$2,'Synthetic vehicle',$3)",[vehicle,ids.ws,ids.owner]);const trip=newTrip([ids.owner],'2026-10-05');trip.transport.vehicleIds=[vehicle];trip.transport.driverAssignments=[{vehicleId:vehicle,userId:ids.owner}];trip.transport.eligibleDrivers=1;
 await asUser(db,ids.owner,async()=>{await db.query('select public.save_trip($1,$2,0,$3::jsonb)',[ids.ws,trip.id,JSON.stringify(trip)]);expect((await db.query('select user_id from public.trip_driver_assignments')).rows).toEqual([{user_id:ids.owner}]);const invalid=structuredClone(trip);invalid.transport.driverAssignments[0].userId=ids.outsider;await expect(db.query('select public.save_trip($1,$2,1,$3::jsonb)',[ids.ws,trip.id,JSON.stringify(invalid)])).rejects.toThrow();expect((await db.query('select version from public.trips')).rows).toEqual([{version:1}]);});
 }finally{await db.close();}
});
