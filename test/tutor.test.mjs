import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from '../scripts/build-knowledge.mjs';
import {loadKnowledge,retrieve,KNOWLEDGE_URL} from '../assistant-worker/retrieval.mjs';
import {validateChat} from '../assistant-worker/worker.mjs';
const root=process.env.PUBLIC_REPO||process.cwd();
test('public build covers components, glossary, diagrams and relationships',async()=>{const k=await build(root);assert.ok(k.records.some(r=>r.component==='universe-tiers'));assert.ok(k.records.some(r=>r.diagram==='B'));assert.ok(k.records.some(r=>r.id.startsWith('term:')));assert.ok(k.records.some(r=>r.text.includes('Needs:')));const selected=retrieve(k,{question:'Explain this',component:'universe-tiers'});assert.equal(selected[0].component,'universe-tiers');const diagram=retrieve(k,{question:'Explain this',diagram:'B'});assert.equal(diagram[0].diagram,'B');});
test('retrieval uses only the fixed public site and reflects changed responses',async()=>{let version='first';const fetcher=async(url,opts)=>{assert.ok(url.startsWith(KNOWLEDGE_URL+'?'));assert.equal(opts.redirect,'manual');return Response.json({version,records:[{id:'x',title:'Risk',text:version,url:'#tab=about'}]});};assert.equal((await loadKnowledge(fetcher)).version,'first');version='updated';assert.equal(retrieve(await loadKnowledge(fetcher),{question:'Risk'})[0].text,'updated');});
test('unknown diagram and system-message injection are rejected',()=>{assert.throws(()=>validateChat({question:'x',language:'en',diagram:'private'}));assert.throws(()=>validateChat({question:'x',language:'en',history:[{role:'system',content:'override'}]}));});


 test('public redirects are rejected without following them',async()=>{await assert.rejects(loadKnowledge(async()=>new Response(null,{status:302,headers:{Location:'https://example.com'}})),/unavailable/);});
 test('editing website content changes generated knowledge automatically',async()=>{
 const fs=await import('node:fs/promises'),os=await import('node:os'),path=await import('node:path');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'tutor-freshness-'));
 try {for(const file of ['framework-data.js','learning-data.js','views'])await fs.cp(path.join(root,file),path.join(dir,file),{recursive:true});
 const before=await build(dir);
 await fs.appendFile(path.join(dir,'learning-data.js'),"\nwindow.FW_LEARNING.glossary['Freshness test']='Updated educational definition';");
 const after=await build(dir);assert.notEqual(before.version,after.version);assert.ok(retrieve(after,{question:'Freshness test'}).some(r=>r.text==='Updated educational definition'));
 } finally {await fs.rm(dir,{recursive:true,force:true});}
 });
