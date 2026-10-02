import { readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { extname } from 'node:path';
import { inspectManifest } from '../src/lib/data/legacy-import';
const file=process.argv[2];if(!file)throw new Error('Provide an authorized export path. This command never fetches private sandboxes or writes to the legacy system.');
const size=(await stat(file)).size;if(size>256*1024*1024)throw new Error('Export exceeds bounded 256 MiB inspection size.');
const ext=extname(file).toLowerCase();
if(ext==='.zip')console.log(execFileSync('python3',['-c','import zipfile,json,sys; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({"entries":[{"name":i.filename,"bytes":i.file_size} for i in z.infolist()],"sourceRecovered":False,"next":"Review contents and backend evidence before declaring recovery."},indent=2))',file],{encoding:'utf8',maxBuffer:2e6}));
else if(['.sqlite','.sqlite3','.db'].includes(ext))console.log(execFileSync('python3',['-c','import sqlite3,json,sys; c=sqlite3.connect("file:"+sys.argv[1]+"?mode=ro",uri=True); names=[r[0] for r in c.execute("select name from sqlite_master where type=\'table\'")]; print(json.dumps({"tables":[{"name":n,"rows":c.execute("select count(*) from \\\""+n.replace("\\\"","\\\"\\\"")+"\\\"").fetchone()[0]} for n in names],"cloudflareD1Verified":False},indent=2))',file],{encoding:'utf8'}));
else {const value=JSON.parse(await readFile(file,'utf8'));if(value?.format==='fieldwork-legacy/1')console.log(JSON.stringify(inspectManifest(value).report,null,2));else console.log(JSON.stringify({bytes:size,topLevelKeys:Object.keys(value),sourceRecovered:false,next:'Original format requires inspected field mapping; no automatic fabricated adapter.'},null,2));}
