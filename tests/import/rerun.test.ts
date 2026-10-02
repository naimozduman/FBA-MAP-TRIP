import { it,expect } from 'vitest';
import { testDatabase,seedSecurity,ids } from '../helpers/database';
import { importManifest,mappedId } from '@/lib/data/legacy-import';
it('reruns imports idempotently, preserves edits, multiple corridor memberships, zero visits and raw orphan records',async()=>{
 const db=await testDatabase();try{await seedSecurity(db);const manifest={format:'fieldwork-legacy/1',system:'synthetic-export',records:[
 {entity:'city',legacyId:'c1',payload:{name:'Synthetic Import City',state:'XX',zone:'America/Chicago'}},
 {entity:'corridor',legacyId:'north',payload:{name:'Synthetic North'}},{entity:'corridor',legacyId:'west',payload:{name:'Synthetic West'}},
 {entity:'corridor_city',legacyId:'north-c1',payload:{cityLegacyId:'c1',corridorLegacyId:'north',position:0}},{entity:'corridor_city',legacyId:'west-c1',payload:{cityLegacyId:'c1',corridorLegacyId:'west',position:1}},
 {entity:'source',legacyId:'s1',payload:{name:'Synthetic lead',cityLegacyId:'c1',category:'library_sale',is_lead:true}},
 {entity:'visit',legacyId:'visit1',payload:{cityLegacyId:'c1',sourceLegacyId:'s1',visited_at:'2026-10-01T15:00:00Z',bought:0,usable:0,notes:'Nothing usable; preserve this negative result.'}},
 {entity:'note',legacyId:'n1',payload:{cityLegacyId:'c1',body:'Legacy note preserved verbatim.'}},
 {entity:'source',legacyId:'orphan',payload:{name:'Unresolved source',cityLegacyId:'missing',category:'estate',is_lead:true}},
 {entity:'place',legacyId:'unknown-meaning',payload:{name:'Preserve me, do not guess that I am a city.'}}
 ]};
 const first=await importManifest(db,manifest,ids.ws,ids.owner);expect(first.newRows).toBe(8);expect(first.quarantinedByEntity).toEqual({source:1,place:1});expect(first.advertised.reconciled).toBe(false);
 const id=mappedId(ids.ws,manifest.system,'city','c1');await db.query('update public.cities set overview=$1 where id=$2',['Later owner edit',id]);
 const second=await importManifest(db,manifest,ids.ws,ids.owner);expect(second.newRows).toBe(0);expect(second.alreadyMapped).toBe(8);
 expect((await db.query<{overview:string}>('select overview from public.cities where id=$1',[id])).rows[0].overview).toBe('Later owner edit');
 expect((await db.query<{count:number}>('select count(*)::int as count from public.corridor_cities')).rows[0].count).toBe(2);
 expect((await db.query<{bought:number;notes:string}>('select bought,notes from public.source_visits')).rows[0]).toEqual({bought:0,notes:'Nothing usable; preserve this negative result.'});
 expect((await db.query<{count:number}>('select count(*)::int as count from public.legacy_snapshots')).rows[0].count).toBe(10);
 expect((await db.query<{count:number}>('select count(*)::int as count from public.import_runs')).rows[0].count).toBe(1);
 }finally{await db.close();}
});
it('quarantines conflicting duplicates rather than picking a fabricated winner',async()=>{const db=await testDatabase();try{await seedSecurity(db);const m={format:'fieldwork-legacy/1',system:'duplicate-fixture',records:[{entity:'city',legacyId:'same',payload:{name:'One',state:'XX',zone:'America/Chicago'}},{entity:'city',legacyId:'same',payload:{name:'Two',state:'XX',zone:'America/Chicago'}}]};const r=await importManifest(db,m,ids.ws,ids.owner);expect(r.duplicateRows).toBe(1);expect(r.newRows).toBe(0);expect(r.quarantinedByEntity.city).toBe(1);expect((await db.query<{n:number}>('select count(*)::int n from public.legacy_snapshots')).rows[0].n).toBe(2);}finally{await db.close();}});
