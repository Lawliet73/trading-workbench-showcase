export const KNOWLEDGE_URL='https://lawliet73.github.io/trading-workbench-showcase/knowledge.json';
export async function loadKnowledge(fetcher=fetch){
 // One fixed public URL. Never fetch user URLs or follow links to private sources.
 const response=await fetcher(KNOWLEDGE_URL+'?v='+Math.floor(Date.now()/60000),{redirect:'manual',signal:AbortSignal.timeout(12000),cf:{cacheTtl:60,cacheEverything:true}});
 if(!response.ok)throw Error('Website knowledge unavailable');
 const text=await response.text();if(text.length>1500000)throw Error('Knowledge too large');
 const data=JSON.parse(text);if(!Array.isArray(data.records)||data.records.length>1500||typeof data.version!=='string')throw Error('Invalid website knowledge');return data;
}
export function retrieve(data,b){
 const aliases={risiko:'risk',rendite:'return',überanpassung:'overfitting',zufall:'luck',entscheidung:'decision',forschung:'research',strategie:'strategy',kosten:'cost',verlust:'loss',daten:'data',validierung:'validation',beziehungen:'relationships',universum:'universe'};
 const stop=new Set(['the','this','that','what','how','why','explain','and','with','ist','wie','was','der','die','das','und','erkläre','diese','einem']);
 const query=b.question+' '+(b.history||[]).filter(m=>m.role==='user').slice(-1).map(m=>m.content).join(' ');
 const terms=[...new Set((query.toLowerCase().match(/[\p{L}\p{N}]{3,40}/gu)||[]).filter(t=>!stop.has(t)).flatMap(t=>[t,...(aliases[t]?[aliases[t]]:[])]))].slice(0,20);
 return data.records.map(r=>{const title=r.title.toLowerCase(),text=r.text.toLowerCase();let score=terms.reduce((s,t)=>s+(title.includes(t)?8:0)+(text.includes(t)?1:0),0);if(b.component&&r.component===b.component)score+=100;if(b.diagram&&r.diagram===b.diagram)score+=90;return {r,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,7).map(x=>x.r);
}

