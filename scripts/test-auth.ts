/** Real Supabase Auth (GoTrue) + PostgREST + PostgreSQL; isolated synthetic accounts only. */
import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
const project='fieldwork-qa', pgName=project+'-db', authName=project+'-auth', restName=project+'-rest';
const containers=[restName,authName,pgName],createdContainers:string[]=[];let networkCreated=false;
const databasePassword=randomBytes(24).toString('hex'), secret=randomBytes(32).toString('hex'), authPassword=randomBytes(24).toString('hex');
const sign=(role:string)=>{ const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'); const payload=Buffer.from(JSON.stringify({role,iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+86400})).toString('base64url'); return header+'.'+payload+'.'+createHmac('sha256',secret).update(header+'.'+payload).digest('base64url'); };
const anon=sign('anon'), service=sign('service_role'), url='http://127.0.0.1:57321';

const gateway=createServer(async(req,res)=>{try{
 const allowed=['http://127.0.0.1:3000','http://localhost:3000'];if(allowed.includes(req.headers.origin||'')){res.setHeader('Access-Control-Allow-Origin',req.headers.origin!);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers',req.headers['access-control-request-headers']||'apikey,authorization,content-type,x-client-info');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');}if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
const auth=req.url?.startsWith('/auth/v1/');const target='http://127.0.0.1:'+(auth?'57399':'57300')+(auth?req.url!.slice(8):req.url!.slice(8));const chunks:Buffer[]=[];for await(const part of req)chunks.push(Buffer.from(part));const headers={...req.headers} as Record<string,string>;delete headers.host;delete headers.connection;delete headers['content-length'];const response=await fetch(target,{method:req.method,headers,body:['GET','HEAD'].includes(req.method||'GET')?undefined:Buffer.concat(chunks),redirect:'manual'});res.statusCode=response.status;response.headers.forEach((v,k)=>{if(!['transfer-encoding','content-encoding','content-length'].includes(k))res.setHeader(k,v);});res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(502);res.end('Local auth test gateway unavailable');}});
async function waitFor(check:()=>Promise<boolean>,name:string){for(let i=0;i<90;i++){try{if(await check())return;}catch{}await new Promise(r=>setTimeout(r,500));}throw new Error(name+' did not become ready. Private logs contain diagnostics.');}
async function docker(args:string[]){if(args[0]==='logs'){const r=spawnSync('docker',args,{encoding:'utf8',maxBuffer:5e6});return r.stdout+r.stderr;}const value=execFileSync('docker',args,{stdio:['ignore','pipe','pipe'],maxBuffer:5e6}).toString().trim();if(args[0]==='run'&&args.includes('--name'))createdContainers.push(args[args.indexOf('--name')+1]);if(args[0]==='network'&&args[1]==='create')networkCreated=true;return value;}
async function main(){
  await mkdir('private',{recursive:true});
  let prior='';try{prior=await readFile('.env.local','utf8');}catch{}if(prior&&!prior.startsWith('# FIELDWORK_QA_SYNTHETIC_LOCAL_ONLY'))throw new Error('Refusing to replace an existing owner .env.local. Run isolated tests in a separate checkout or preserve configuration first.');
  for(const name of containers) {const exists=await docker(['ps','-a','--filter','name=^/'+name+'$','--format','{{.Names}}']);if(exists)throw new Error('Existing '+name+' belongs to an earlier local test. Stop that exact test stack first.');}
  await docker(['network','create',project]);
  await writeFile('private/qa-db.env','POSTGRES_PASSWORD='+databasePassword+'\n',{mode:0o600});
  await docker(['run','-d','--name',pgName,'--network',project,'--env-file','private/qa-db.env','-p','127.0.0.1:57322:5432','postgres:17-alpine']);
  const db=new pg.Client({connectionString:'postgres://postgres:'+databasePassword+'@127.0.0.1:57322/postgres'});
  await waitFor(async()=>{const c=new pg.Client({connectionString:'postgres://postgres:'+databasePassword+'@127.0.0.1:57322/postgres'});c.on('error',()=>{});try{await c.connect();await c.end();return true;}catch{return false;}},'Postgres');
  db.on('error',()=>{});
  await db.connect();
  await db.query("create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; create role authenticator login password '"+authPassword+"'; grant anon,authenticated,service_role to authenticator; create schema auth; alter role postgres set search_path to auth, public; create schema extensions; create extension pgcrypto with schema extensions; grant usage on schema public to anon,authenticated,service_role;");
  await writeFile('private/qa-auth.env',[['GOTRUE_API_HOST','0.0.0.0'],['GOTRUE_API_PORT','9999'],['API_EXTERNAL_URL',url+'/auth/v1'],['GOTRUE_SITE_URL','http://127.0.0.1:3000'],['GOTRUE_URI_ALLOW_LIST','http://127.0.0.1:3000/auth/callback'],['GOTRUE_DB_DRIVER','postgres'],['GOTRUE_DB_DATABASE_URL','postgres://postgres:'+databasePassword+'@'+pgName+':5432/postgres'],['GOTRUE_DB_NAMESPACE','auth'],['GOTRUE_JWT_SECRET',secret],['GOTRUE_JWT_EXP','3600'],['GOTRUE_JWT_AUD','authenticated'],['GOTRUE_JWT_DEFAULT_GROUP','authenticated'],['GOTRUE_JWT_ADMIN_ROLES','service_role'],['GOTRUE_DISABLE_SIGNUP','true'],['GOTRUE_MAILER_AUTOCONFIRM','false']].map(([k,v])=>k+'='+v).join('\n')+'\n',{mode:0o600});
  await docker(['run','-d','--name',authName,'--network',project,'--env-file','private/qa-auth.env','-p','127.0.0.1:57399:9999','ghcr.io/supabase/gotrue:v2.197.0']);
  await waitFor(async()=> (await fetch('http://127.0.0.1:57399/health')).ok,'Supabase Auth');
  await db.query("create or replace function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$; grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;");
  for(const file of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.query(await readFile('supabase/migrations/'+file,'utf8'));
  await db.query('grant all on all tables in schema public to service_role; grant execute on all functions in schema public to service_role;');
  await writeFile('private/qa-rest.env',['PGRST_DB_URI=postgres://authenticator:'+authPassword+'@'+pgName+':5432/postgres','PGRST_DB_SCHEMAS=public','PGRST_DB_ANON_ROLE=anon','PGRST_JWT_SECRET='+secret,'PGRST_SERVER_PORT=3000'].join('\n')+'\n',{mode:0o600});
  await docker(['run','-d','--name',restName,'--network',project,'--env-file','private/qa-rest.env','-p','127.0.0.1:57300:3000','ghcr.io/supabase/postgrest:v16.4']);
  await waitFor(async()=> (await fetch('http://127.0.0.1:57300/')).ok,'PostgREST');
  await new Promise<void>(resolve=>gateway.listen(57321,'127.0.0.1',resolve));
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const users=[];for(const label of ['owner','partner','outsider','other-owner']){const email=label+'-'+randomUUID()+'@fieldwork.test';const password=randomBytes(18).toString('base64url');const created=await admin.auth.admin.createUser({email,password,email_confirm:true,role:'authenticated'});assert.ifError(created.error);const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});const signed=await client.auth.signInWithPassword({email,password});assert.ifError(signed.error);assert(signed.data.user && signed.data.session);assert.equal((await client.auth.getUser()).data.user?.id,created.data.user!.id);users.push({label,id:created.data.user!.id,email,password,client,token:signed.data.session.access_token});}
  const ws=randomUUID(), other=randomUUID(), city=randomUUID();
  await db.query("insert into public.workspaces(id,name,created_by) values($1,'Synthetic QA Fieldwork',$2),($3,'Synthetic other',$4)",[ws,users[0].id,other,users[3].id]);
  await db.query("insert into public.workspace_members values($1,$2,'owner',true),($1,$3,'partner',true),($4,$5,'owner',true)",[ws,users[0].id,users[1].id,other,users[3].id]);
  for(const user of users)await db.query('insert into public.profiles values($1,$2)',[user.id,'Synthetic '+user.label]);
  await db.query("insert into public.cities(id,workspace_id,name,state,zone,lat,lng,created_by) values($1,$2,'Synthetic QA city','XX','America/Chicago',38.5,-91,$3)",[city,ws,users[0].id]);
  for(const user of users){const read=await user.client.from('cities').select('*').eq('workspace_id',ws);assert.ifError(read.error);assert.equal(read.data.length,user.label==='owner'||user.label==='partner'?1:0);const write=await user.client.from('notes').insert({workspace_id:ws,city_id:city,body:'Synthetic allowed/denied write',mutation_key:randomUUID(),created_by:user.id});assert.equal(Boolean(write.error),!(user.label==='owner'||user.label==='partner'));}
  const guest=createClient(url,anon,{auth:{persistSession:false}});assert((await guest.from('cities').select('*')).error);
  assert((await users[1].client.from('workspace_members').update({role:'owner'}).eq('user_id',users[1].id)).error);
  assert((await users[2].client.rpc('consume_route_budget',{p_workspace:ws})).error);
  const forged=users[2].token.slice(0,-12)+'notavalidjwt';assert((await guest.auth.getUser(forged)).error);
  const publicSignup=await guest.auth.signUp({email:'not-invited-'+randomUUID()+'@fieldwork.test',password:randomBytes(20).toString('hex')});assert(publicSignup.error);
  const env='# FIELDWORK_QA_SYNTHETIC_LOCAL_ONLY\nNEXT_PUBLIC_SUPABASE_URL='+url+'\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='+anon+'\nFIELDWORK_ENVIRONMENT=local\nSUPABASE_ENVIRONMENT=local\nAPP_ORIGIN=http://127.0.0.1:3000\n';
  await writeFile('.env.local',env,{mode:0o600});
  await writeFile('private/qa-users.json',JSON.stringify({url,key:anon,workspaceId:ws,cityId:city,users:users.map(({label,id,email,password})=>({label,id,email,password}))}),{mode:0o600});
  await writeFile('private/auth-report.json',JSON.stringify({date:new Date().toISOString(),environment:'isolated real Supabase GoTrue/PostgREST/Postgres17',allowedMembers:2,deniedAuthenticatedNonmembers:2,anonymousDenied:true,forgedJwtDenied:true,publicSignupDisabled:true},null,2));
  console.log('PASS: real sign-in/getUser; two allowed members; outsider and second-workspace denied reads/writes; anonymous denied; forged JWT denied; partner role escalation denied; public signup disabled.');
  await db.end();
  if(process.env.FIELDWORK_KEEP_TEST_STACK==='1'){
    console.log('Isolated QA gateway retained at http://127.0.0.1:57321. Synthetic account credentials are in ignored private/qa-users.json.');
    await new Promise<void>(resolve=>{const stop=()=>resolve();process.once('SIGINT',stop);process.once('SIGTERM',stop);});
  }
}
try{await main();}catch(e){console.error('Auth integration failed:',e instanceof Error?e.message.replace(/postgres:\/\/\S+/g,'[redacted connection]'):'Unknown failure');for(const name of createdContainers){try{await writeFile('private/'+name+'.log',await docker(['logs',name]),{mode:0o600});}catch{}}process.exitCode=1;}finally{gateway.close();for(const name of createdContainers){try{await docker(['rm','-f',name]);}catch{}}if(networkCreated)try{await docker(['network','rm',project]);}catch{}}
