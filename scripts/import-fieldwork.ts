import { readFile, writeFile } from 'node:fs/promises';
import pg from 'pg';
import { inspectManifest, importManifest } from '../src/lib/data/legacy-import';
const [file,...args]=process.argv.slice(2);
if(!file)throw new Error('Usage: npm run import:legacy -- /authorized/path/normalized.json [--apply] [--report=/private/report.json]. Default is inspection only.');
const input=JSON.parse(await readFile(file,'utf8'));
let report=inspectManifest(input).report;
if(args.includes('--apply')){
 const workspace=process.env.FIELDWORK_IMPORT_WORKSPACE_ID,actor=process.env.FIELDWORK_IMPORT_ACTOR_ID,connection=process.env.FIELDWORK_DATABASE_URL;
 if(!workspace||!actor||!connection||process.env.FIELDWORK_IMPORT_APPROVED_WORKSPACE!==workspace)throw new Error('Set dedicated database URL, verified owner ID, workspace ID, and matching FIELDWORK_IMPORT_APPROVED_WORKSPACE. No import was applied.');
 const db=new pg.Client({connectionString:connection});await db.connect();try{report=await importManifest(db,input,workspace,actor);}finally{await db.end();}
}
const destination=args.find(a=>a.startsWith('--report='))?.slice(9);
if(destination)await writeFile(destination,JSON.stringify(report,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({...report,warnings:report.warnings.map(w=>({...w,legacyId:'[record ID in private report]'}))},null,2));
