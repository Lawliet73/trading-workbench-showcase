/* Three levels of explanation for an adult who has finished secondary school
   but has never studied finance. Source wording takes priority. Generated
   examples are labelled and never presented as verified findings. */
(function(){
'use strict';
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plain=s=>String(s||'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[*#_]/g,'').trim();
const clip=(s,n=3000)=>plain(s).slice(0,n);
const first=s=>clip(String(s||'').split(/\n\s*\n/).find(v=>v.trim()&&!/^#/.test(v.trim()))||s,550);
const examples={
'price-store':'Imagine a price provider later corrects an old stock price. Retaining the earlier data version allows the original test to be reproduced.',
'security-master':'A company changes its ticker symbol. A stable security identity prevents its price history from being mistaken for two separate companies.',
'observation-store':'A company announces results at 6 p.m. Its results belong to that calendar date but a trading decision at 10 a.m. could not have used them.',
'panel-builder':'A historical test examines 100 companies. The panel combines those eligible on that date with prices and announcements available at that time, rather than today’s list.',
'research-records':'A hypothesis predicts a price move after an event. The research records keep the original prediction, test plan and negative as well as positive results.',
'exploration-engine':'You test 30 variations of the same trading rule. Every trial must remain visible instead of reporting only the one that looked most profitable.',
'decision-engine':'An approved rule recommends buying a share. The engine determines the intended position; the broker has not executed an order yet.',
'portfolio-ledger':'A purchase of 20 shares changes the account’s cash and holdings. The ledger records these changes and reconciles them with actual fills.',
'sizing-and-risk':'A rule proposes a €10,000 position but the permitted remaining exposure is only €2,000. The risk layer reduces or vetoes it.',
'evaluation':'Suppose a strategy earned 8% while its benchmark earned 7%. Evaluation asks whether that extra 1% is convincing after costs and uncertainty.',
'scanner':'A scanner narrows thousands of shares into a candidate list. Inclusion on that list does not authorize a trade.',
'execution':'An order requests 10 shares but only 6 are filled. Execution must record the six shares actually received.',
'monitoring':'A strategy starts behaving differently from its earlier tests. Monitoring records the change rather than silently rewriting the historical outcome.'
};
function get(nd){
 const id=String(nd&&nd.id||''),type=nd&&nd.type,CT=window.FW_CONTENT||{},LN=(window.FW_LEARNING||{}).lessons||{},DEP=(window.FW_LEARNING||{}).depth||{},f=nd&&nd.facets||{},base=nd&&nd.summary||nd&&nd.title||'';
 const r={quick:first(base)||id,deeper:'',expert:'',example:'',deepSource:'Project record',expertSource:'Project record',exampleAi:false,quickAi:false};
 if(type==='target'){
  r.quick=clip(f.responsibility||base,450);r.deeper=clip([base,f.inputs?'It receives: '+f.inputs+'.':'',f.outputs?'It produces: '+f.outputs+'.':''].filter(Boolean).join('\n\n'));
  r.deepSource='Recorded target-architecture proposal; not approved unless explicitly stated';
  r.example=examples[id]||'';r.exampleAi=Boolean(r.example);
  if(f.records){r.expert='The proposal records: '+f.records+'. These records support later checking and reproducibility.';r.expertSource='Recorded planned outputs, plus AI-generated explanatory sentence';}
 }else if(type==='entry'){
  const e=(CT.entries||{})[id],part=k=>e&&e.parts?e.parts.filter(p=>p.kind===k).map(p=>p.md).join('\n\n'):'';
  if(e&&e.intro){r.quick=first(e.intro.plain||base);r.quickAi=true;r.example=e.intro.example||'';r.exampleAi=true;}
  if(part('mechanism')){r.deeper=clip(part('mechanism'),4000);r.deepSource='Original registry: mechanism (research candidate, untested)';}
  const application=[part('application'),part('testing'),part('limitations')].filter(Boolean).join('\n\n');
  if(application){r.expert=clip(application,3500);r.expertSource='Original registry: application, test and limitations';}
 }else if(type==='concept'){
  const c=(CT.concepts||{})[id],secs=c&&c.sections||[];
  if(secs.length){r.deeper=clip(secs[0].md,4000);r.deepSource='Existing study-note section: '+secs[0].title;}
  else if(c&&c.provisional){r.deeper=clip(c.provisional.plain,2600);r.deepSource='AI-generated — source verification pending';r.example=c.provisional.example||'';r.exampleAi=true;}
  const extra=secs.find(s=>/application|implication|limit|exercise|example/i.test(s.title));
  if(extra){r.expert=clip(extra.md,3000);r.expertSource='Existing study-note section: '+extra.title;}
 }else if(type==='component'){
  if(LN[id]){r.deeper=clip(LN[id],3100);r.deepSource='Existing educational project commentary';}
  if(DEP[id]){r.expert=clip(DEP[id].join('\n\n'),3100);r.expertSource='Existing framework detail';}
 }else if(type==='module'){
  const m=(CT.modules||{})[id];if(m){
   r.quick=m.purpose||r.quick;r.deeper=[m.outcomes&&m.outcomes.length?'What you should learn: '+m.outcomes.join('; '):'',m.applications||''].filter(Boolean).join('\n\n');
   r.deepSource=m.verification&&m.verification.verification_status==='ai_generated_unverified'?'AI-generated — source verification pending':'Existing module overview';
   r.expert=m.research||'';r.expertSource='Recorded module research relevance';
  }
 }else if(['open-decision','gap','proposal','log','logq','log-proposal','milestone'].includes(type)){
  r.quick=first(nd.title+': '+base);
  const graph=window.FW_KNOWLEDGE||{},byKey=new Map((graph.nodes||[]).map(n=>[n.key,n]));
  const related=(graph.edges||[]).filter(e=>(e.s===nd.key||e.t===nd.key)&&['concerns','addresses','depends-on','corresponds-to','closes'].includes(e.rel))
    .slice(0,5).map(e=>byKey.get(e.s===nd.key?e.t:e.s)).filter(Boolean).map(n=>n.title);
  r.deeper=clip([base,related.length?'The recorded decision or issue is connected to: '+related.join('; ')+'.':'',
     f.approvalAsked?'Approval or choice requested: '+f.approvalAsked+'.':'',
     f.reconsider?'Recorded reconsideration condition: '+f.reconsider+'.':''].filter(Boolean).join('\n\n'),3500);
  r.deepSource='Original decision/gap/proposal summary and linked canonical records';
  if(f.implications)r.expert=f.implications;
  else if(f.reconsider)r.expert='Revisit when: '+f.reconsider;
  if(['open-decision','gap','proposal','logq'].includes(type)){
    const name=(nd.title+' '+base).toLowerCase();
    if(/risk|sizing|stop.loss|portfolio limit/.test(name))r.example='Imagine a rule proposes €10,000 of exposure but the portfolio limit allows €2,000. The unanswered policy determines whether the trade is reduced, rejected, or held for approval.';
    else if(/universe|membership|delist/.test(name))r.example='A historical test that uses only companies listed today could miss companies that disappeared years earlier. The membership rule decides which securities were eligible on the historical date.';
    else if(/scanner|strategy selection/.test(name))r.example='A scanner finds 30 candidates today. The unresolved decision is how to choose between them without assuming that every candidate should become a trade.';
    else if(/timestamp|as.of|data availability|clock/.test(name))r.example='Earnings announced at 6 p.m. cannot inform an order placed at 10 a.m. on the same date. A data rule must distinguish the event date from the moment the information became known.';
    else if(/broker|execution|fill/.test(name))r.example='A request for ten shares receives only six. The unresolved execution policy must decide what gets recorded and what happens to the remaining four.';
    r.exampleAi=Boolean(r.example);
  }
 }
 return r;
}
const paras=s=>esc(s).replace(/\n\s*\n/g,'</p><p>').replace(/\n/g,' ');
const stamp=(s,ai)=>'<small class="reader-source">'+esc(s||'Original project record')+(ai?' · AI-generated, not source-verified':'')+'</small>';
function render(nd,opts){
 if(!nd)return'';
 const r=get(nd),open=opts&&opts.openSecond?' open':'';
 const quick='<section class="reader-quick"><h3>1 · Quick reminder</h3><p>'+paras(r.quick)+'</p>'+stamp('Project record',r.quickAi)+'</section>';
 const example=r.example?'<h4>Illustrative example</h4><p>'+paras(r.example)+'</p>'+stamp(r.exampleAi?'Illustrative example':'Recorded example',r.exampleAi):'';
 const deeper='<details class="reader-depth"'+open+'><summary>2 · Explain it from the beginning</summary><p>'+paras(r.deeper||'A deeper explanation has not yet been recorded for this item.')+'</p>'+stamp(r.deeper?r.deepSource:'Missing source-based explanation',!r.deeper||/AI-generated/.test(r.deepSource))+example+'</details>';
 const expert=r.expert?'<details class="reader-depth"><summary>3 · Applying it and deeper insights</summary><p>'+paras(r.expert)+'</p>'+stamp(r.expertSource,/AI-generated/.test(r.expertSource))+'</details>':'';
 return '<section class="reader-tiers" aria-label="Explanation levels">'+quick+deeper+expert+'</section>';
}
window.TWK_LEVELS={get,render};
})();
