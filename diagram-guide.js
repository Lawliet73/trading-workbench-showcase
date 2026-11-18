/* Diagram learning overlay for Archify HTML. Site-owned enhancement, not an
   Archify fork. Runs in standalone diagrams and embedded same-origin iframes.
   Uses accessible manual steps and opt-in motion; technical passport is owner
   opt-in only. Diagram IDs remain the canonical authored source. */
(function(){
'use strict';
const doc=document,svg=doc.querySelector('svg[data-reader-fit]');
if(!svg||doc.getElementById('twk-guide'))return;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pathname=location.pathname,which=pathname.includes('information-flow')?'flow':pathname.includes('research-lifecycle')?'lifecycle':pathname.includes('functional-architecture')?'architecture':'other';
const STEPS={
 flow:[
 {from:'alpaca',to:'versions',title:'1 · Collect price history',quick:'The provider supplies earlier stock prices, grouped into time intervals.',deep:'A “bar” is a summary of a time interval: typically its opening, highest, lowest and closing prices. Daily bars summarize a day; five-minute bars summarize five minutes. The system stores the data with information about when it was available.',expert:'If corrected data arrives later, a version record makes it possible to reproduce the original test rather than silently changing what the past appeared to show.'},
 {from:'versions',to:'backtest',title:'2 · Recreate an earlier decision',quick:'The backtest simulates a trading rule on historical prices.',deep:'Imagine testing whether a rule would have bought a stock last January. The simulation must use only information that a person could have seen at that January decision time. Otherwise it may “predict” an event that was only announced afterward. Versions help distinguish the information available then from later corrections or additions.',expert:'This prevents look-ahead bias. The historical availability clock and original data version are part of the test evidence.'},
 {from:'backtest',to:'validate',title:'3 · Test whether the result is convincing',quick:'A good-looking historical return is not yet evidence of a reliable strategy.',deep:'Suppose 100 versions of a rule were tried and one appeared profitable. Some success could arise merely from repeated guessing. Validation checks how the strategy behaves on separate periods, under different market conditions and after trading costs.',expert:'The project records all trials and includes walk-forward validation and statistical corrections for multiple trials. The stage still must not be labelled “proven profitable”.'},
 {from:'validate',to:'approve',title:'4 · Decide whether a rule may progress',quick:'The proposed approval step separates a research result from permission to use a strategy.',deep:'A test can be completed without any permission to trade. The owner would review the evidence, decide whether the rule should be approved for a later stage, and record that decision. This approval stage is planned, not currently implemented.'},
 {from:'gate',to:'broker',title:'5 · Limit risk before orders',quick:'The planned risk gate checks a proposed trade before it reaches the broker.',deep:'If a rule proposes buying €10,000 of a stock but the remaining risk allowance permits only €2,000, the gate could reduce or reject the trade. A broker order should be based on the permitted amount, not the original request. This is an illustrative design, not live trading.'}
 ],
 lifecycle:[
 {node:'idea',title:'1 · Start with a research question',quick:'A market observation becomes a testable idea, not an approved strategy.',deep:'For example, someone notices that prices sometimes move after a company announces earnings. The first task is to explain why such a pattern might exist and what would count as evidence against it.'},
 {node:'registered',title:'2 · Record the rule before testing',quick:'The proposal records what will be tested and what would count as success.',deep:'Writing down the rule first makes it harder to change the hypothesis after seeing the answer. This step is still proposed for the Workbench.'},
 {node:'explored',title:'3 · Explore the historical evidence',quick:'Try reasonable candidate rules and keep every test result.',deep:'If 20 variations are tried, saving only the best would conceal how many attempts it took to find it. The exploration process records the attempts, including ones that fail.'},
 {node:'confirmed',title:'4 · Check on data not used for searching',quick:'A confirmation test asks whether the idea works beyond the data where it was discovered.',deep:'An exam you have already seen cannot tell you whether you really understand a topic. Similarly, a strategy must be checked on genuinely separate observations, not just the data used to design it.'},
 {node:'forward',title:'5 · Watch new observations arrive',quick:'Forward testing follows incoming market data without rewriting the strategy.',deep:'New prices and announcements arrive after the rule is fixed. Its performance is recorded as it unfolds, rather than choosing the most flattering historical period afterward.'},
 {node:'paper',title:'6 · Paper trade after approval',quick:'Paper trading simulates orders without putting real money at risk.',deep:'The rule must handle delays, rejected orders and partial fills as well as price predictions. The project has not reached this planned approval stage.'}
 ],
 architecture:[
 {from:'alpaca',to:'versions',title:'1 · Keep reproducible market data',quick:'Store incoming price data with records of how and when it was obtained.',deep:'A price correction made tomorrow should not silently change a result calculated today. Keeping data versions supports later reconstruction.'},
 {from:'versions',to:'strategy',title:'2 · Supply data to a strategy',quick:'A strategy reads historical prices as inputs to its rules.',deep:'For example, a trend rule may compare recent prices with an earlier average. The data should come from the period the simulation is evaluating, not from its future.'},
 {from:'strategy',to:'backtest',title:'3 · Simulate decisions',quick:'The backtest estimates how the rule would have behaved on earlier data.',deep:'It turns rules into hypothetical buys and sells and measures the resulting changes. Brokerage costs and information availability can change the outcome.'},
 {from:'backtest',to:'trials',title:'4 · Keep all attempts',quick:'The trial registry records the tests that were run.',deep:'When ten rules were tried and one succeeded, the record must retain the other nine. Otherwise the result can look more convincing than it is.'},
 {from:'ladder',to:'approval',title:'5 · Separate evidence from authorization',quick:'Validation results inform the owner, but do not automatically authorize trading.',deep:'A promising backtest still needs review of its assumptions and limits. The approval component shown here is a plan, not a deployed live-trading control.'}
 ]
};
const STORIES=STEPS[which]||[];
const DETAILS={
 versions:['Price data versions','A stored history of market prices, together with the version used in a particular experiment.','Suppose prices were corrected months later. Reproducing an old analysis requires knowing which values the earlier run used.'],
 backtest:['Backtests','A simulation of a trading rule on historical market information.','A test about January must not use information first published in February; doing so gives the simulated trader impossible advance knowledge.'],
 validate:['Validation','Checks whether an attractive historical result survives tests outside the conditions in which it was discovered.','A rule selected from many guesses needs stronger evidence than one registered in advance.'],
 panel:['Daily panel','A structured table with one row per eligible security and date and the information available then.','A present-day list of surviving companies can make the past look easier than it was. The panel should reconstruct historical eligibility.'],
 gate:['Risk gate','A proposed checkpoint that may reduce or reject a trade.','A €10,000 requested position may need to be reduced if the portfolio’s exposure allowance is only €2,000.'],
 alpaca:['Market price data','Earlier prices and trading activity that models can use as observations.','If a stock closed at €50 yesterday, the model can use that value today, but not tomorrow’s price.'],
 edgar:['Company announcements','Company reports and other dated events that might help explain why a price changed.','A profit report released after the market closes can only influence later decisions, not a trade made that morning.'],
 french:['Market factors','Simple comparisons that help distinguish a strategy’s return from broad market movements.','If an investing rule gained 8% while the whole market gained 7%, the rule may have added much less value than 8% suggests.'],
 trials:['Recorded experiments','Keeps the trading-rule variations that were tried, including poor results.','If 30 rule settings are tested, keeping only the best one would give a misleading picture.'],
 ideas:['Research ideas','A place to describe observations worth investigating, before calling them successful strategies.','An idea that company shares sometimes move slowly after earnings still needs a clearly defined test.'],
 strategy:['Trading rules','Rules that turn information into a possible buy, sell or hold decision.','A rule might buy only after a stock rises above its recent average; this does not establish that it is profitable.'],
 ladder:['Evidence checks','A sequence of increasingly demanding tests that tries to separate genuine effects from lucky results.','A rule that worked over one year is tested on a different period before anyone treats it as reliable.'],
 bench:['Compare against a baseline','Shows whether an idea performs differently from a simple alternative once uncertainty and costs are considered.','A stock strategy earns 6%, but a simple index earns 8% over the same period: the headline profit alone is not enough.'],
 hyp:['Testable predictions','Records what should happen and how we would know whether the prediction was wrong.','Before looking at future earnings days, state how long a possible price reaction should last.'],
 approval:['Human approval','A planned decision point where evidence and risks are reviewed before any idea could progress.','Even a good historical result is not permission to trade automatically.'],
 replay:['Test the real rules without real orders','A proposed check that runs realistic trade decisions through the same risk rules but sends orders to a simulator.','If a strategy requests 100 shares and the risk limit permits only 20, the simulation should obey the same 20-share limit.'],
 scanner:['Find a manageable set of candidates','A planned way to narrow a large market to the securities that meet basic eligibility rules.','Out of 3,000 stocks, a scanner might flag 40 for closer investigation; none is automatically bought.'],
 select:['Choose among possible signals','A planned method for deciding which tested strategy, if any, may be considered today.','Two models disagree on the same stock. The selection rule must define whether to prefer one, combine them or do nothing.'],
 risk:['Risk limits','A proposed checkpoint that can limit the size of a trade or reject it.','A model wants to buy €5,000 of shares but the allowed exposure is €1,000; the order must shrink or be refused.'],
 exec:['Place and record orders','The planned step that turns an approved trade request into actual broker instructions and records what was filled.','An order requests 10 shares; only 6 fill. The recorded position must show 6, not 10.'],
 broker:['Simulated brokerage','A paper-trading environment that responds like a broker without committing actual money.','A practice order buys hypothetical shares; its reported fill still needs checking against realistic trading assumptions.'],
 monitor:['Learn from outcomes','A proposed feedback step that compares what was intended with what actually happened.','If orders consistently fill at worse prices than a test predicted, the next research review should investigate that difference.']
};
const css=document.createElement('style');
css.textContent=':root:not([data-technical="on"]) #focus-chip{display:none!important}'+
':root:not([data-technical="on"]) [data-detail="fine"]{display:none!important}'+
'#twk-guide{position:fixed;z-index:10001;right:12px;bottom:12px;width:min(355px,calc(100vw - 24px));max-height:65vh;overflow:auto;background:var(--panel,#1d2228);color:var(--ink,#eee);border:1px solid var(--line,#566);border-left:3px solid #56B4E9;border-radius:8px;padding:12px;box-shadow:0 4px 26px #0006;font:13px/1.65 system-ui,sans-serif}'+
'#twk-guide[hidden]{display:none!important}#twk-guide h3{margin:0 0 7px;font-size:15px}#twk-guide p{margin:8px 0}'+
'#twk-guide details{border-top:1px solid var(--line,#566);margin-top:8px;padding-top:6px}#twk-guide summary{cursor:pointer;font-weight:600}'+
'#twk-guide button,#twk-show-guide{background:var(--panel,#222);color:var(--ink,#eee);border:1px solid var(--line,#777);border-radius:4px;padding:5px 9px;cursor:pointer;font:inherit}'+
'#twk-guide .twk-controls{display:flex;gap:7px;justify-content:space-between;align-items:center;margin-top:12px}'+
'#twk-show-guide{position:fixed;z-index:10000;right:12px;bottom:12px;border:2px solid #56B4E9;padding:9px 12px}'+
'svg [data-node-id].twk-active{filter:drop-shadow(0 0 6px #56B4E9)}'+
'svg [data-edge-id].twk-active{stroke:#56B4E9!important;stroke-width:3.6px!important;stroke-dasharray:9 5;animation:twk-guide-flow 1.5s linear infinite}'+
'@keyframes twk-guide-flow{to{stroke-dashoffset:-28}}'+
'@media(prefers-reduced-motion:reduce){svg [data-edge-id].twk-active{animation:none!important}}';
document.head.append(css);
const panel=document.createElement('aside');panel.id='twk-guide';panel.hidden=true;panel.setAttribute('role','region');panel.setAttribute('aria-label','Diagram explanation');
panel.innerHTML='<h3 id="twk-step-title">Understand this diagram</h3><p id="twk-step-quick"></p><details id="twk-step-deep"><summary>2 · Explain from the beginning</summary><p id="twk-step-detail"></p></details><details id="twk-step-expert" hidden><summary>3 · Practical insights</summary><p id="twk-step-advanced"></p></details><small id="twk-step-source">Illustrative educational walkthrough; technical data is in the underlying diagram.</small><button type="button" id="twk-ask-ai">Explain this step with AI</button><div class="twk-controls"><button type="button" id="twk-prev">Previous</button><span id="twk-count"></span><button type="button" id="twk-next">Next</button><button type="button" id="twk-play">Play</button><button type="button" id="twk-close">×</button></div>';
document.body.append(panel);
if(window.TWK_READER&&window.TWK_READER.owner){
 const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Technical details: off';
 toggle.title='Reveal the original Archify semantic passport and provenance (owner only)';
 toggle.onclick=()=>{window.TWK_READER.set(!window.TWK_READER.enabled());toggle.textContent='Technical details: '+(window.TWK_READER.enabled()?'on':'off');};
 const controls=panel.querySelector('.twk-controls');controls.before(toggle);
}
const reveal=document.createElement('button');reveal.id='twk-show-guide';reveal.type='button';reveal.textContent='Explain this diagram';document.body.append(reveal);
let step=-1,timer=null;
const all=()=>[...doc.querySelectorAll('svg [data-node-id],svg [data-edge-id]')];
const clear=()=>all().forEach(el=>el.classList.remove('twk-active'));
function stop(){if(timer){clearInterval(timer);timer=null;}doc.getElementById('twk-play').textContent='Play';}
function show(data,index){
 clear();
 for(const node of [data.node,data.from,data.to])if(node){const target=doc.getElementById('node-'+node);if(target)target.classList.add('twk-active');}
 if(data.from&&data.to){const edge=[...doc.querySelectorAll('svg [data-edge-from][data-edge-to]')].find(el=>el.getAttribute('data-edge-from')===data.from&&el.getAttribute('data-edge-to')===data.to);if(edge)edge.classList.add('twk-active');}
 panel.hidden=false;reveal.hidden=true;
 const put=(id,value)=>{doc.getElementById(id).textContent=value||'';};
 put('twk-step-title',data.title||'Understand this step');put('twk-step-quick',data.quick);put('twk-step-detail',data.deep);
 const expert=doc.getElementById('twk-step-expert');expert.hidden=!data.expert;put('twk-step-advanced',data.expert);
 put('twk-count',index<0?'Selected node':String(index+1)+' / '+STORIES.length);
 put('twk-step-source',index<0?'AI-generated educational explanation; verify against project records where applicable.':'Illustrative educational walkthrough; proposals remain proposals.');
 doc.getElementById('twk-prev').disabled=index<=0;doc.getElementById('twk-next').disabled=index<0||index>=STORIES.length-1;
}
function goto(i){if(!STORIES.length)return;step=(i+STORIES.length)%STORIES.length;show(STORIES[step],step);}
doc.getElementById('twk-ask-ai').onclick=()=>{
 const title=doc.getElementById('twk-step-title')?.textContent||'this diagram step';
 const quick=doc.getElementById('twk-step-quick')?.textContent||'';
 const message={type:'twk:ask-assistant',topic:title,summary:quick};
 if(window.parent!==window)window.parent.postMessage(message,location.origin);
 else {
   const back=doc.createElement('a');back.href='../index.html#tab=views';back.textContent='Open the Workbench assistant';
   back.target='_blank';back.rel='noopener';panel.append(back);
 }
};
doc.getElementById('twk-prev').onclick=()=>{stop();goto(step-1);};
doc.getElementById('twk-next').onclick=()=>{stop();goto(step+1);};
doc.getElementById('twk-close').onclick=()=>{stop();clear();panel.hidden=true;reveal.hidden=false;};
doc.getElementById('twk-play').onclick=()=>{
 if(timer){stop();return;}
 if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 if(step<0)goto(0);
 timer=setInterval(()=>goto(step+1),9500);
 doc.getElementById('twk-play').textContent='Pause';
};
reveal.onclick=()=>{stop();if(STORIES.length)goto(0);else{panel.hidden=false;reveal.hidden=true;show({title:'Click any node or arrow',quick:'Select a step in the diagram to learn what it represents and why it matters.',deep:'The same drawing also contains technical provenance and connection data. Those details remain hidden unless enabled from the authenticated owner view.'},-1);}};
doc.addEventListener('click',event=>{
 if(event.target.closest('#twk-guide,#twk-show-guide'))return;
 const n=event.target.closest('[data-node-id]'),edge=event.target.closest('[data-edge-from][data-edge-to]');
 if(!n&&!edge)return;
 stop();
 if(edge){
  const from=edge.getAttribute('data-edge-from'),to=edge.getAttribute('data-edge-to');
  const exact=STORIES.find(d=>d.from===from&&d.to===to);
  const fromNode=doc.getElementById('node-'+from),toNode=doc.getElementById('node-'+to);
  const fromName=fromNode&&fromNode.getAttribute('data-node-label')||from,toName=toNode&&toNode.getAttribute('data-node-label')||to;
  const payload=edge.getAttribute('data-edge-label')||'an unspecified output';
  const fromNote=fromNode&&fromNode.getAttribute('data-node-sublabel')||'',toNote=toNode&&toNode.getAttribute('data-node-sublabel')||'';
  show(exact||{from,to,title:fromName+' → '+toName,quick:'This path carries '+payload+' from '+fromName+' to '+toName+'.',
   deep:'The diagram describes '+fromName+(fromNote?' as '+fromNote:'')+' and '+toName+(toNote?' as '+toNote:'')+'. A verified step-by-step financial example for this particular arrow has not yet been recorded. This is a description of the authored connection, not a claim that it is built.'},exact?STORIES.indexOf(exact):-1);
 }else{
  const id=n.getAttribute('data-node-id'),found=STORIES.find(d=>d.node===id),d=DETAILS[id];
  show(found||(d?{node:id,title:d[0],quick:d[1],deep:d[2]}:{node:id,title:n.getAttribute('data-node-label')||id,quick:n.getAttribute('data-node-sublabel')||'This record has no beginner-level description in the source diagram.',deep:'No verified beginner explanation has been recorded for this particular node yet. Its raw label and relationships remain available in the technical record.'}),found?STORIES.indexOf(found):-1);
 }
},true);
})();
