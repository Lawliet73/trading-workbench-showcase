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

import {assembleContext} from '../assistant-worker/retrieval.mjs';
import {makeMessages,normalizeCitations,citedSources,visibleAnswer} from '../assistant-worker/tutor.mjs';
import {handle} from '../assistant-worker/worker.mjs';
test('architecture context retains the diagram, core statuses and connected components',async()=>{
 const k=await build(root);const packed=assembleContext(k,{question:'How do orders connect the risk gate and reconciliation?',diagram:'B'});
 for(const id of ['view:B','component:risk-gate','component:reconcile','component:pipeline'])assert.ok(packed.sources.some(s=>s.id===id),id);
 assert.ok(new TextEncoder().encode(packed.text).length<=14000);
 assert.match(k.records.find(r=>r.id==='component:risk-gate').text,/Status: Planned/);
 assert.ok(k.records.find(r=>r.id==='component:risk-gate').related.includes('alpaca-exec'));
});
test('semantic passages and reverse relationships survive the public build',async()=>{
 const k=await build(root);assert.equal(k.schemaVersion,2);
 assert.ok(k.records.filter(r=>r.type==='component').every(r=>r.text.includes('Recorded evidence:')&&r.text.includes('Status:')));
 const core=k.records.find(r=>r.id==='component:approval');assert.ok(core.related.includes('risk-gate'));
});
test('generation keeps all bounded conversation turns without treating them as instructions',()=>{
 const history=Array.from({length:8},(_,i)=>({role:i%2?'assistant':'user',content:'turn '+i}));
 const messages=makeMessages({language:'en',question:'And why?',history},'');
 assert.deepEqual(messages.slice(1,-1),history);assert.equal(messages.at(-1).content,'And why?');
 assert.throws(()=>validateChat({question:'x',language:'en',history:[null]}));
 assert.throws(()=>validateChat({question:'x',language:'en',history:Array(10).fill({role:'user',content:'x'})}));
});
test('citation display includes only cited available sources and excludes internal reasoning',()=>{
 const sources=[{title:'A',url:'#tab=about'},{title:'B',url:'#tab=views&v=B'}];
 const answer=normalizeCitations('Example [1, 2]. More 【2†L1-L5】. Invalid [99].',sources);
 assert.equal(answer,'Example [1][2]. More [2]. Invalid .');
 assert.deepEqual(citedSources('Claim [2]',sources).map(s=>s.number),[2]);
 assert.equal(visibleAnswer({response:'<think>internal</think>Visible'}),'Visible');
 assert.equal(visibleAnswer({response:'<think>incomplete'}),'');
});
const req=question=>new Request('https://example.com/api/chat',{method:'POST',headers:{Origin:'https://lawliet73.github.io','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify({question,language:'en'})});
const baseEnv={ENABLED:'true',FREE_PLAN_CONFIRMED:'true',SITE_ORIGIN:'https://lawliet73.github.io'};
const fakeDB=allowed=>({prepare(){return {bind(){return this},async first(){return allowed?{count:1}:null},async run(){return {}}}}});
test('off-topic requests stop before generation; quota stops before any model call',async()=>{
 for(const intent of ['unrelated']){let calls=0;const r=await handle(req('test'),{...baseEnv,DB:fakeDB(true),AI:{async run(){calls++;return {response:JSON.stringify({intent,query:'',project:false})}}}},{waitUntil(){}});assert.equal(r.status,200);assert.equal(calls,1);assert.deepEqual((await r.json()).sources,[]);}
 let called=false;const limited=await handle(req('test'),{...baseEnv,DB:fakeDB(false),AI:{async run(){called=true;}}},{waitUntil(){}});assert.equal(limited.status,429);assert.equal(called,false);
});

test('build-time search index preserves retrieval exactly while avoiding request-time tokenization',async()=>{
 const k=await build(root),raw={...k,index:undefined,records:k.records.map(({search,...r})=>r)};
 for(const b of [{question:'How do risk gate and reconciliation relate?',diagram:'B'},{question:'What does the status mean?',component:'trend-cross'},{question:'Why does block bootstrap help?'},{question:'What about that?',history:[{role:'user',content:'Compare universe membership and clocks'}]}])assert.equal(assembleContext(k,b).text,assembleContext(raw,b).text);
});

test('shared tutor allows explicit internal origins but rejects arbitrary websites',async()=>{
 const env={SITE_ORIGIN:'https://lawliet73.github.io',ADDITIONAL_SITE_ORIGINS:'http://localhost:8807'};
 const {handle}=await import('../assistant-worker/worker.mjs');
 for(const origin of [env.SITE_ORIGIN,'http://localhost:8807']){const r=await handle(new Request('https://worker/api/chat',{method:'OPTIONS',headers:{Origin:origin}}),env);assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);}
 await assert.rejects(handle(new Request('https://worker/api/chat',{method:'OPTIONS',headers:{Origin:'https://unapproved.example'}}),env),/Origin not allowed/);
});
