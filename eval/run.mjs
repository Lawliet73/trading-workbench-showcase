// Opt-in, bounded live evaluation. Credentials never enter results or source control.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const [pipeline='baseline',model='@cf/meta/llama-3.1-8b-instruct-fp8-fast',ids='all']=process.argv.slice(2);
const allowed=['@cf/meta/llama-3.1-8b-instruct-fp8-fast','@cf/qwen/qwen3-30b-a3b-fp8','@cf/openai/gpt-oss-120b','@cf/meta/llama-3.3-70b-instruct-fp8-fast'];
if(!['baseline','improved'].includes(pipeline)||!allowed.includes(model))throw Error('Unsupported evaluation configuration');
if(!process.env.WRANGLER_BIN||!process.env.CLOUDFLARE_ACCOUNT_ID)throw Error('Set WRANGLER_BIN and CLOUDFLARE_ACCOUNT_ID');
const root=process.cwd(),out=path.join(root,'eval/results');await fs.mkdir(out,{recursive:true});
const cases=JSON.parse((await fs.readFile('eval/cases.json','utf8')).replace(/^\uFEFF/,''));
const baseline=path.join(out,'baseline');await fs.mkdir(baseline,{recursive:true});
for(const [src,name]of [['assistant-worker/worker.mjs','worker.mjs'],['assistant-worker/retrieval.mjs','retrieval.mjs'],['scripts/build-knowledge.mjs','build.mjs']])await fs.writeFile(path.join(baseline,name),execFileSync('git',['show','8c45f5b:'+src]));
const dir=pipeline==='baseline'?baseline:path.join(root,'assistant-worker');
const builder=await import(pathToFileURL(pipeline==='baseline'?path.join(baseline,'build.mjs'):path.join(root,'scripts/build-knowledge.mjs')));
const knowledge=await builder.build(root);
const codeFiles=pipeline==='baseline'?['worker.mjs','retrieval.mjs']:['worker.mjs','retrieval.mjs','tutor.mjs'];
const code=(await Promise.all(codeFiles.map(f=>fs.readFile(path.join(dir,f))))).map(b=>b.toString()).join('\n');
const signature=createHash('sha256').update(code+knowledge.version+model).digest('hex').slice(0,12);
const nativeFetch=globalThis.fetch;
globalThis.fetch=(url,opts)=>String(url).startsWith('https://lawliet73.github.io/trading-workbench-showcase/knowledge.json')?Promise.resolve(Response.json(knowledge)):nativeFetch(url,opts);
const {handle}=await import(pathToFileURL(path.join(dir,'worker.mjs')));
const credentials=JSON.parse(execFileSync(process.execPath,[process.env.WRANGLER_BIN,'auth','token','--json'],{encoding:'utf8'}));
let calls=0,usage=[],rawMeta=[];
const AI={async run(requested,options){
 if(++calls>24)throw Error('Evaluation call budget exceeded');
 const selected=pipeline==='baseline'||options.max_tokens===180?requested:model;
 const r=await nativeFetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${selected}`,{method:'POST',headers:{Authorization:`Bearer ${credentials.token}`,'Content-Type':'application/json'},body:JSON.stringify(options),signal:AbortSignal.timeout(90000)});
 const data=await r.json();if(!r.ok||!data.success)throw Error('Model API failed: '+r.status+' '+JSON.stringify(data.errors));
 usage.push(data.result?.usage);rawMeta.push({keys:Object.keys(data.result||{}),finish_reason:data.result?.choices?.[0]?.finish_reason});return data.result;
}};
const statement={bind(){return this},async first(){return {count:1}},async run(){return {}}};
for(const c of cases.filter(c=>ids==='all'||ids.split(',').includes(c.id))){
 let history=[];
 for(let turn=0;turn<c.turns.length;turn++){
 const file=path.join(out,`${pipeline}-${model.split('/').at(-1)}-${signature}-${c.id}-${turn}.json`);
 let saved;try{saved=JSON.parse(await fs.readFile(file,'utf8'));}catch{}
 const request={question:c.turns[turn],language:c.language||'en',component:c.component,diagram:c.diagram,history};
 if(saved&&JSON.stringify(saved.request)!==JSON.stringify(request))saved=null;
 if(!saved){usage=[];rawMeta=[];const start=Date.now();const response=await handle(new Request('https://evaluation.invalid/api/chat',{method:'POST',headers:{Origin:'https://lawliet73.github.io','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(request)}),{ENABLED:'true',FREE_PLAN_CONFIRMED:'true',SITE_ORIGIN:'https://lawliet73.github.io',DB:{prepare(){return statement}},AI},{waitUntil(){}});
 saved={pipeline,model,signature,knowledgeVersion:knowledge.version,case:c.id,turn,request,status:response.status,...await response.json(),milliseconds:Date.now()-start,usage,rawMeta};await fs.writeFile(file,JSON.stringify(saved,null,2));}
 console.log(JSON.stringify({case:c.id,turn,status:saved.status,ms:saved.milliseconds,answer:saved.answer?.slice(0,110),signature}));
 if(saved.status!==200)throw Error('Evaluation stopped on a failed case; inspect result before retrying');
 history=[...history,{role:'user',content:request.question},{role:'assistant',content:saved.answer.slice(0,pipeline==='baseline'?2000:4000)}].slice(-6);
 }
}
