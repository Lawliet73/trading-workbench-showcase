import fs from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {createHash} from 'node:crypto';
export async function build(root){
 const sandbox={window:{}};
 for(const file of ['framework-data.js','learning-data.js'])vm.runInNewContext(await fs.readFile(path.join(root,file),'utf8'),sandbox,{timeout:1000});
 const F=sandbox.window.FW,L=sandbox.window.FW_LEARNING,records=[];
 const names=ids=>(ids||[]).map(id=>F.components.find(c=>c.id===id)?.n||id).join('; ');
 function add(id,title,text,url,component='',diagram=''){
  const value=typeof text==='string'?text:JSON.stringify(text);
  for(let i=0;i<value.length;i+=1800)records.push({id:id+':'+i,title,text:value.slice(i,i+1800),url,component,diagram});
 }
 add('overview','Framework overview',{asOf:F.asOf,statuses:F.statuses,lifecycles:F.lifecycles},'#tab=overview');
 for(const c of F.components){const url='#tab=components&c='+encodeURIComponent(c.id);
  add('component:'+c.id,c.n,`Status: ${F.statuses[c.s]?.label||c.s}. ${c.p}\nEvidence: ${c.evid}\nNeeds: ${names(c.deps)}\nSupplies: ${names(c.feeds)}\n${L.lessons[c.id]||''}`,url,c.id);
  if(c.deep||L.depth[c.id])add('detail:'+c.id,c.n+' — technical explanation',{source:c.deep,lesson:L.depth[c.id]},url,c.id);
 }
 for(const [term,text]of Object.entries(L.glossary))add('term:'+term,term,text,'#tab=about');
 for(const q of F.questions)add('question:'+q.id,q.title,q,'#tab=components&q='+q.id);
 for(const [id,text]of Object.entries(L.workflows))add('workflow:'+id,id+' lifecycle',text,'#tab=overview');
 for(const v of F.views){
  const html=await fs.readFile(path.join(root,v.file),'utf8');
  const labels=[...html.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(m=>m[1].replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')).join('; ');
  add('view:'+v.id,v.t,{description:v.d,guide:L.views[v.id],labels},'#tab=views&v='+v.id,'',v.id);
 }
 for(const [key,title]of [['unresolved','Open decision'],['gaps','Recorded gap'],['proposals','Unadopted proposal']])for(const item of F[key]||[])add(key+':'+item.id,title+': '+item.t,item,'#tab=decisions');
 add('references','Educational method references',L.references,'#tab=about');
 return {version:createHash('sha256').update(JSON.stringify(records)).digest('hex').slice(0,16),records};
}
if(process.argv[1]?.endsWith('build-knowledge.mjs')){const root=process.argv[2]||'.';const data=await build(root);await fs.writeFile(path.join(root,'knowledge.json'),JSON.stringify(data));console.log(`Built ${data.records.length} public excerpts; version ${data.version}`);}
