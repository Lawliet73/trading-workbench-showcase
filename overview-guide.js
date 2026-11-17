/* Readable guided journey for the main Overview map. Each highlighted Q card
   remains the canonical authored card; nothing here alters the state of a
   strategy or claims that proposed operations already work. */
(function(){
'use strict';
const root=document.getElementById('tab-overview'),wrap=root&&root.querySelector('.lanes'),F=window.FW;
if(!wrap||!F||document.getElementById('twk-overview-guide'))return;
const steps=[
 {q:'Q2',title:'1 · Start with information that existed then',quick:'Historical prices and announcements are inputs to research.',deep:'Imagine a company published earnings at 6 p.m. on Monday. A simulated trade placed at 10 a.m. Monday cannot use those earnings: the information was not available yet. This is why the data layer needs to track both what the information said and when it became knowable.',expert:'A realistic test also needs a reproducible historical data version, because data vendors may later correct or replace old records.'},
 {q:'Q3',title:'2 · Turn an observation into a research idea',quick:'State why a pattern might exist before trying a trading rule.',deep:'For example, maybe investors react slowly to unexpected earnings news. That is a possible explanation, not evidence of an opportunity. A recorded research idea says what price behaviour would support the explanation and what would contradict it.'},
 {q:'Q4',title:'3 · Test the idea and try to disprove it',quick:'A backtest asks what would have happened under a rule in the past.',deep:'The system simulates trades only with information available at each historical moment. If 20 possible rules are tested, recording all 20 is important: one impressive result could happen by chance. A convincing strategy should also survive new periods and realistic costs.',expert:'The Workbench has a research validation ladder, but a completed test does not prove that future results will be profitable.'},
 {q:'Q5',title:'4 · Require an explicit decision',quick:'Good research does not automatically grant permission to trade.',deep:'The owner would consider the recorded evidence and decide whether a specific fixed strategy version is allowed to advance. The approval stage and operational deployment shown here are not fully built.'},
 {q:'Q6',title:'5 · Find potential opportunities',quick:'A planned scanner would identify candidate securities worth looking at.',deep:'Imagine that 3,000 listed shares exist. A scanner might narrow them using basic eligibility rules, but merely appearing on a shortlist does not mean that buying is a good idea. The project has not yet finalized this component.'},
 {q:'Q8',title:'6 · Decide how much risk is acceptable',quick:'The planned risk gate can reduce or reject a requested trade.',deep:'Suppose a rule recommends buying €10,000 of a share. If the portfolio may only take €2,000 of additional exposure, the risk gate should reduce or reject the request. This is an illustrative example of the intended control, not a live feature.',expert:'Risk sizing and portfolio-level constraints are distinct: the first proposes a position, while the second can veto it.'},
 {q:'Q9',title:'7 · Send and reconcile the order',quick:'The broker executes the permitted order, not necessarily the original request.',deep:'An order for 10 shares might fill only 6. The trading system must record the six shares actually bought and reconcile this against the intended order. Paper execution is part of the planned operations phase.'},
 {q:'Q10',title:'8 · Learn from what actually happened',quick:'Keep evidence of outcomes, including mistakes and failures.',deep:'A later analysis compares intended trades with real fills and results. An unexpected outcome becomes a new research question; it must not quietly rewrite the original hypothesis or historical record.'}
];
const container=document.createElement('section');container.id='twk-overview-guide';container.className='card';container.setAttribute('aria-label','Guided research lifecycle');
container.innerHTML='<h3>Follow an idea through the Workbench</h3><p class="note">Illustrative example · Proposed stages are not live. Select steps manually, or play the highlights.</p><strong id="twk-ov-title"></strong><p id="twk-ov-quick"></p><details id="twk-ov-deep"><summary>2 · Explain from the beginning</summary><p id="twk-ov-explanation"></p><small>AI-generated illustrative explanation, not a recorded empirical result.</small></details><details id="twk-ov-expert" hidden><summary>3 · Practical insights</summary><p id="twk-ov-advanced"></p></details><div class="twk-ov-controls"><button id="twk-ov-prev" type="button">Previous</button><span id="twk-ov-count"></span><button id="twk-ov-next" type="button">Next</button><button id="twk-ov-play" type="button">Play</button></div>';
wrap.insertBefore(container,wrap.children[1]||null);
const css=document.createElement('style');css.textContent='#twk-overview-guide{border-left:3px solid var(--accent);padding:16px 20px;margin-bottom:24px}'+
'#twk-overview-guide h3{margin:0 0 7px}#twk-overview-guide strong{display:block;margin:14px 0 6px}'+
'#twk-overview-guide p{line-height:1.8}#twk-overview-guide details{border-top:1px solid var(--line);padding:9px 0;margin:9px 0}'+
'#twk-overview-guide summary{font-weight:600;cursor:pointer}#twk-overview-guide small{color:var(--muted)}'+
'.twk-ov-controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:12px}'+
'.twk-ov-controls button{font:inherit;padding:6px 12px;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:6px;cursor:pointer}'+
'#tab-overview .q.twk-overview-focus{outline:3px solid var(--accent);outline-offset:4px;box-shadow:0 0 18px color-mix(in srgb,var(--accent) 30%,transparent)}'+
'@media(prefers-reduced-motion:reduce){#tab-overview .q.twk-overview-focus{transition:none!important}}';
document.head.append(css);
let step=0,timer=null;
function update(){
 const s=steps[step],set=(id,v)=>{document.getElementById(id).textContent=v||''};
 set('twk-ov-title',s.title);set('twk-ov-quick',s.quick);
 set('twk-ov-explanation',s.deep);set('twk-ov-advanced',s.expert);
 document.getElementById('twk-ov-expert').hidden=!s.expert;
 set('twk-ov-count',(step+1)+' / '+steps.length);
 document.getElementById('twk-ov-prev').disabled=step===0;
 document.getElementById('twk-ov-next').disabled=step===steps.length-1;
 root.querySelectorAll('.q.twk-overview-focus').forEach(x=>x.classList.remove('twk-overview-focus'));
 const active=root.querySelector('.q[data-q="'+s.q+'"]');if(active)active.classList.add('twk-overview-focus');
 if(timer&&active)active.scrollIntoView({behavior:'smooth',block:'center'});
}
function stop(){if(timer)clearInterval(timer);timer=null;document.getElementById('twk-ov-play').textContent='Play';}
document.getElementById('twk-ov-prev').onclick=()=>{stop();step=Math.max(0,step-1);update();};
document.getElementById('twk-ov-next').onclick=()=>{stop();step=Math.min(steps.length-1,step+1);update();};
document.getElementById('twk-ov-play').onclick=()=>{
 if(timer){stop();return;}
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 timer=setInterval(()=>{step=(step+1)%steps.length;update();},9500);
 document.getElementById('twk-ov-play').textContent='Pause';
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
update();
})();
