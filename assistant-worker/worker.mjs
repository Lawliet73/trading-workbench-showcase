import {loadKnowledge,assembleContext} from './retrieval.mjs';
import {MODEL,MAX_OUTPUT_TOKENS,makeMessages,visibleAnswer,citedSources,planQuestion,normalizeCitations} from './tutor.mjs';
export {MODEL} from './tutor.mjs';
const encoder=new TextEncoder();
const json=(body,status=200,headers={})=>Response.json(body,{status,headers:{'Cache-Control':'no-store',...headers}});
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
async function body(request, limit) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) fail(415,'Expected JSON.');
  const reader=request.body?.getReader(); if(!reader) fail(400,'Missing request.');
  let size=0;const parts=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();fail(413,'Request too large.');}parts.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{fail(400,'Invalid JSON.');}
}
export function validateChat(b) {
  if (!b || typeof b.question!=='string' || !b.question.trim() || b.question.length>1500 || !['en','de'].includes(b.language) || (b.component && !/^[a-zA-Z0-9-]{1,80}$/.test(b.component)) || (b.diagram && !/^[A-E]$/.test(b.diagram))) fail(400,'Invalid question.');
  const history=b.history??[];
  if(!Array.isArray(history)||history.length>8||history.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>4000)) fail(400,'Invalid conversation.');
  if(encoder.encode(JSON.stringify(history)).length>14000) fail(400,'Conversation too long; start a new chat.');
  return {...b,history};
}
export async function reserve(db,key,limit) {
  const row=await db.prepare('INSERT INTO usage(key,count) VALUES (?,1) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count').bind(key,limit).first();
  return !!row;
}
async function digest(text){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function handle(request,env,ctx) {
  const path=new URL(request.url).pathname;
  if(path!=='/api/chat') return json({error:'Not found.'},404);
  const origin=request.headers.get('Origin');
  if(!env.SITE_ORIGIN || origin!==env.SITE_ORIGIN) fail(403,'Origin not allowed.');
  const cors={'Access-Control-Allow-Origin':origin,'Vary':'Origin'};
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{...cors,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type'}});
  if(request.method!=='POST') return json({error:'Method not allowed.'},405,cors);
  try {
    if(env.ENABLED!=='true'||env.FREE_PLAN_CONFIRMED!=='true') fail(503,'Assistant is not enabled yet. The map remains available.');
    const b=validateChat(await body(request,22000));
    const day=new Date().toISOString().slice(0,10);
    const ip=request.headers.get('CF-Connecting-IP');if(!ip) fail(503,'Client identity unavailable.');
    const identity=(await digest(day+':'+ip)).slice(0,32);
    if(!await reserve(env.DB,day+':ip:'+identity,10)||!await reserve(env.DB,day+':global',25)) fail(429,'Daily question limit reached. Try again after 00:00 UTC.');
    ctx?.waitUntil(env.DB.prepare('DELETE FROM usage WHERE key < ?').bind(day).run());
    let plan;
    try {plan=await planQuestion(env.AI,b);}catch{fail(503,'AI service temporarily unavailable. Please try later.');}
    if(plan.intent==='unrelated')return json({answer:b.language==='de'?'Ich helfe dir gern mit dem Forschungsframework und verwandten Finanz-, Statistik- und Programmierfragen. Welches Thema möchtest du verstehen?':'I can help with the research framework and related finance, statistics, and programming. Which topic would you like to explore?',sources:[],scope:'public'},200,cors);
    const knowledge=plan.project?await loadKnowledge():null;
    const {text:context,sources}=knowledge?assembleContext(knowledge,{...b,searchQuery:plan.query}):{text:'',sources:[]};
    const messages=makeMessages(b,context);
    if(encoder.encode(JSON.stringify(messages)).length>32000) fail(400,'Question context too long; start a new chat.');
    let answer;
    try { answer=await env.AI.run(MODEL,{messages,max_tokens:MAX_OUTPUT_TOKENS,temperature:0.3}); }
    catch {fail(503,'AI quota or service temporarily unavailable. Please try later.');}
    const output=normalizeCitations(visibleAnswer(answer),sources);
    if(!output) fail(503,'AI response unavailable. Please try again.');
    return json({answer:output,sources:citedSources(output,sources),scope:'public',knowledgeVersion:knowledge?.version||null,truncated:answer?.choices?.[0]?.finish_reason==='length'},200,cors);
  } catch(e){return json({error:e.status?e.message:'Assistant temporarily unavailable.'},e.status||503,cors);}
}
export default {async fetch(request,env,ctx){try{return await handle(request,env,ctx);}catch(e){return json({error:e.status?e.message:'Service temporarily unavailable.'},e.status||503);}}};
