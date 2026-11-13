export const KNOWLEDGE_URL='https://lawliet73.github.io/trading-workbench-showcase/knowledge.json';
let cachedMinute=-1,cachedKnowledge;
export async function loadKnowledge(fetcher=fetch){
 const minute=Math.floor(Date.now()/60000);
 if(fetcher===fetch&&cachedMinute===minute&&cachedKnowledge)return cachedKnowledge;
 const response=await fetcher(KNOWLEDGE_URL+'?v='+Math.floor(Date.now()/60000),{redirect:'manual',signal:AbortSignal.timeout(12000),cf:{cacheTtl:60,cacheEverything:true}});
 if(!response.ok)throw Error('Website knowledge unavailable');
 const text=await response.text();if(text.length>1500000)throw Error('Knowledge too large');
 const data=JSON.parse(text);
 if(!Array.isArray(data.records)||data.records.length>1500||typeof data.version!=='string'||data.records.some(r=>typeof r.id!=='string'||typeof r.title!=='string'||typeof r.text!=='string'||typeof r.url!=='string'||!r.url.startsWith('#tab=')))throw Error('Invalid website knowledge');
 if(fetcher===fetch){cachedMinute=minute;cachedKnowledge=data;}
 return data;
}
const stop=new Set('the this that what how why explain and with for from into than then does would could should about have has are was were not just only one can its which please more much some when where means mean also using their them they these those a an of to in is it on at as be by or if so do me my you your we our us i der die das den dem des ein eine einen und oder ist sind wie was warum erklare erklaere bitte mit fur von zu im auf sich auch nicht wird wurde diese dieser einem einer noch'.split(' '));
const synonyms={risiko:'risk',rendite:'return',renditen:'returns',uberanpassung:'overfitting',zufall:'luck',forschung:'research',strategie:'strategy',kosten:'cost',daten:'data',validierung:'validation',beziehungen:'relationships',universum:'universe',abhangig:'dependent',zeitlich:'time',erklarung:'explanation'};
export function tokens(text){return (text.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').match(/[\p{L}\p{N}][\p{L}\p{N}_-]{1,50}/gu)||[]).filter(t=>!stop.has(t)).flatMap(t=>synonyms[t]?[t,synonyms[t]]:[t]);}
export function retrieve(data,b){
 const records=data.records,query=tokens(b.searchQuery||b.question),history=tokens((b.history||[]).filter(m=>m.role==='user').slice(-3).map(m=>m.content).join(' '));
 const followup=query.length<5||/\b(this|that|it|they|those|same|next|example|last|diese|das|dann)\b/i.test(b.question);
 const terms=new Map();for(const t of [...new Set(history)].slice(-40))terms.set(t,followup?0.65:0.15);for(const t of [...new Set(query)].slice(0,40))terms.set(t,1);
 const docs=records.map(r=>{if(r.search)return {r,...r.search};const body=tokens(r.text);return {r,title:tokens(r.title),length:body.length,freq:body.reduce((f,t)=>(f[t]=(f[t]||0)+1,f),{})};});
 const avg=data.index?.avg||docs.reduce((n,d)=>n+d.length,0)/Math.max(1,docs.length),df=data.index?.df||{};
 if(!data.index)for(const d of docs)for(const t of new Set([...d.title,...Object.keys(d.freq)]))df[t]=(df[t]||0)+1;
 const weights=[...terms].map(([t,w])=>[t,w*Math.log(1+(docs.length-(df[t]||0)+.5)/((df[t]||0)+.5))]);
 const scores=new Map();
 for(const d of docs){
  let score=0;
  for(const [t,weight]of weights){const f=d.freq[t]||0;score+=weight*((f*2.2)/(f+1.2*(.25+.75*d.length/avg))+(d.title.includes(t)?2.5:0));}
  // Selection supplies context; it does not override explicit questions about other components.
  if(b.component&&d.r.component===b.component){score+=query.length<7?30:12;}
  if(b.diagram&&d.r.diagram===b.diagram)score+=35;
  scores.set(d.r.id,score);
 }
 const ranked=docs.map(d=>d.r).filter(r=>scores.get(r.id)>0).sort((a,b)=>scores.get(b.id)-scores.get(a.id));
 // Include authoritative core/status for detail hits and one-hop neighbors for architectural reasoning.
 const graphQuery=!!b.diagram||/\b(connect|relationship|between|flow|architecture|pipeline|depend|order|relate|together|unterschied|zusammen|bezieh)/i.test(b.question);
 const anchors=ranked.slice(0,5);for(const r of anchors){
  if(r.component){const core=records.find(x=>x.id==='component:'+r.component);if(core)scores.set(core.id,Math.max(scores.get(core.id)||0,scores.get(r.id)+.1));}
  if((graphQuery||r.diagram)&&r.related)for(const id of r.related){const core=records.find(x=>x.id==='component:'+id);if(core)scores.set(core.id,Math.max(scores.get(core.id)||0,scores.get(r.id)*.7));}
 }
 const ordered=records.filter(r=>scores.get(r.id)>0&&r.type!=='overview').sort((a,b)=>scores.get(b.id)-scores.get(a.id));
 const result=[],perComponent=new Map();for(const r of ordered){const n=perComponent.get(r.component)||0;if(r.component&&n>=2)continue;result.push(r);if(r.component)perComponent.set(r.component,n+1);if(result.length===8)break;}
 return result;
}
export function assembleContext(data,b,maxBytes=14000){
 const encoder=new TextEncoder(),sources=[];let text='';
 const add=r=>{if(!r)return;const part=`[${sources.length+1}] ${r.title}\n${r.text}\n\n`;if(encoder.encode(text+part).length>maxBytes)return;text+=part;sources.push(r);};
 // A compact orientation is always present, preventing unsupported claims about overall readiness.
 add(data.records.find(r=>r.id==='overview'));for(const r of retrieve(data,b))add(r);
 return {text,sources};
}
