import pg from 'pg';
import { z } from 'zod';
// No invitations or passwords: bind only already confirmed Supabase accounts.
const workspace=z.uuid().parse(process.env.FIELDWORK_BOOTSTRAP_WORKSPACE_ID),owner=z.uuid().parse(process.env.FIELDWORK_BOOTSTRAP_OWNER_ID),partner=process.env.FIELDWORK_BOOTSTRAP_PARTNER_ID?z.uuid().parse(process.env.FIELDWORK_BOOTSTRAP_PARTNER_ID):null;
if(process.env.FIELDWORK_BOOTSTRAP_APPROVED_WORKSPACE!==workspace||!process.env.FIELDWORK_DATABASE_URL)throw new Error('Require dedicated database URL and matching approved workspace ID. No accounts are created or contacted.');
if(partner===owner)throw new Error('Separate accounts are required.');
const db=new pg.Client({connectionString:process.env.FIELDWORK_DATABASE_URL});await db.connect();try{await db.query('begin');for(const id of [owner,...(partner?[partner]:[])]){const result=await db.query('select id from auth.users where id=$1 and email_confirmed_at is not null',[id]);if(!result.rowCount)throw new Error('Every selected account must already exist and have confirmed email.');}
 const existing=await db.query('select created_by from public.workspaces where id=$1 for update',[workspace]);if(existing.rows[0]&&existing.rows[0].created_by!==owner)throw new Error('Workspace exists with a different owner; refusing reassignment.');
 await db.query('insert into public.workspaces(id,name,created_by) values($1,$2,$3) on conflict(id) do nothing',[workspace,'Fieldwork',owner]);
 for(const [id,role,name]of[[owner,'owner','Naim'],...(partner?[[partner,'partner','Kerem']]:[])]){await db.query('insert into public.workspace_members(workspace_id,user_id,role,active) values($1,$2,$3,true) on conflict(workspace_id,user_id) do nothing',[workspace,id,role]);await db.query('insert into public.profiles(id,display_name) values($1,$2) on conflict(id) do nothing',[id,name]);}
 await db.query('insert into public.workspace_settings(workspace_id) values($1) on conflict do nothing',[workspace]);await db.query('commit');console.log('Existing verified accounts bound to the dedicated Fieldwork workspace. No invitation sent.');
 }catch(e){await db.query('rollback');throw e;}finally{await db.end();}
