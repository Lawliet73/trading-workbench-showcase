import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {tokens} from '../assistant-worker/retrieval.mjs';
export async function build(root){
 const sandbox={window:{}};
 for(const file of ['framework-data.js','learning-data.js'])vm.runInNewContext(await fs.readFile(path.join(root,file),'utf8'),sandbox,{timeout:1000});
 const F=sandbox.window.FW,L=sandbox.window.FW_LEARNING,records=[];
 const byId=new Map(F.components.map(c=>[c.id,c]));
 const status=c=>F.statuses[c.s]?.label||c.s;
 const dependentIds=id=>[...new Set([...(byId.get(id)?.feeds||[]),...F.components.filter(c=>c.deps.includes(id)).map(c=>c.id)])];
 const names=ids=>(ids||[]).map(id=>{const c=byId.get(id);return c?`${c.n} (${status(c)})`:id;}).join('; ')||'None recorded';
 // Complete semantic records: never slice JSON, sentences or status away from the explanation.
 function add(id,title,text,url,meta={}){records.push({id,title,text,url,...meta});}
 add('overview','Framework orientation',`Snapshot: ${F.asOf}. ${F.lifecycles.map(l=>l.label+': '+l.text).join('\n')}\nStatus meanings: ${Object.values(F.statuses).map(s=>s.label+': '+s.hint).join('\n')}\nResearch questions: ${F.questions.map(q=>q.id+' '+q.title+' — '+q.answer).join('\n')}`,'#tab=overview',{type:'overview'});
 for(const c of F.components){
  const meta={type:'component',component:c.id,status:status(c),related:[...new Set([...c.deps,...dependentIds(c.id)])],question:c.q};
  const url='#tab=components&c='+encodeURIComponent(c.id);
  add('component:'+c.id,c.n,`Status: ${status(c)}.\nPurpose: ${c.p}\nRecorded evidence: ${c.evid}\nNeeds: ${names(c.deps)}\nSupplies/supports: ${names(dependentIds(c.id))}\nExplanation: ${L.lessons[c.id]||''}`,url,meta);
  const detail=[...Object.entries(c.deep||{}).map(([key,value])=>`${key}: ${value}`),...(L.depth[c.id]||[])].join('\n');
  if(detail)add('detail:'+c.id,c.n+' — technical explanation',`Status: ${status(c)}. Recorded evidence: ${c.evid}\n${detail}`,url,{...meta,type:'detail'});
 }
 for(const [term,text]of Object.entries(L.glossary))add('term:'+term,term,text,'#tab=about',{type:'glossary'});
 for(const q of F.questions)add('question:'+q.id,q.title,`${q.plain}\nRecorded answer: ${q.answer}`,'#tab=components&q='+q.id,{type:'question',question:q.id});
 for(const [id,text]of Object.entries(L.workflows))add('workflow:'+id,id+' lifecycle',text,'#tab=overview',{type:'workflow'});
 for(const v of F.views){
  const html=await fs.readFile(path.join(root,v.file),'utf8');
  const labels=[...html.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(m=>m[1].replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')).join('; ');
  const guide=L.views[v.id];add('view:'+v.id,v.t,`${v.d}\n${guide[0]}: ${guide[1]}\nRelated components: ${names(guide[2])}\nDiagram labels: ${labels}`,'#tab=views&v='+v.id,{type:'diagram',diagram:v.id,related:guide[2]});
 }
 for(const [key,title]of [['unresolved','Open decision'],['gaps','Recorded gap'],['proposals','Unadopted proposal']])for(const item of F[key]||[])add(key+':'+item.id,title+': '+item.t,Object.entries(item).filter(([k])=>!['id','t','src'].includes(k)).map(([k,v])=>`${k}: ${Array.isArray(v)?v.join('; '):v}`).join('\n'),'#tab=decisions',{type:key,related:item.rel||[]});
 add('references','Educational method references',L.references.map(([t,url])=>`${t}: ${url}`).join('\n'),'#tab=about',{type:'references'});
 const version=createHash('sha256').update(JSON.stringify(records)).digest('hex').slice(0,16),df={};let total=0;
 for(const r of records){const body=tokens(r.text),title=tokens(r.title),freq=Object.create(null);for(const t of body)freq[t]=(freq[t]||0)+1;r.search={title,freq,length:body.length};total+=body.length;for(const t of new Set([...title,...body]))df[t]=(df[t]||0)+1;}
 return {schemaVersion:2,version,records,index:{df,avg:total/records.length}};
}
if(process.argv[1]?.endsWith('build-knowledge.mjs')){const root=process.argv[2]||'.';const data=await build(root);await fs.writeFile(path.join(root,'knowledge.json'),JSON.stringify(data));console.log(`Built ${data.records.length} public passages; version ${data.version}`);}
