/* Progressive disclosure on public and CV sites. Same base UI as owner, limited
   reader-safe copy. The publish/build allowlists, not this script, enforce security. */
(()=>{
'use strict';
if(window.WORKBENCH_ASSISTANT?.scope==='private')return;
const qs=s=>document.querySelector(s),el=(tag,cls,text)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;
};
const overview=qs('#tab-overview'),decisions=qs('#tab-decisions'),about=qs('#tab-about');
if(overview){
 const intro=overview.querySelector('.lanes>.note');
 if(intro)intro.textContent='Start with the big picture: information comes in, researchers test ideas, and risk rules determine what may happen next. Select any step to see which parts of the Workbench are connected. Not every proposed step is built yet.';
 const gate=overview.querySelector('.gate');
 if(gate)gate.textContent='A strategy is only considered for trading after its evidence and risks have been reviewed. That decision process is still being developed.';
 const feedback=overview.querySelector('.loop');
 if(feedback)feedback.textContent='Learning loop: information from simulated or future trades can inspire new questions, which must then be tested separately.';
 const last=[...overview.querySelectorAll('.lanes>.card')].at(-1);
 if(last)last.textContent='How to read this overview: an item marked “implemented” has supporting code or records; “planned” or “proposed” describes work that is not operating yet. Select a topic to learn what it means in ordinary language.';
}
if(decisions){
 // Internal ticket and implementation-review lists remain available only on owner level.
 decisions.querySelectorAll(':scope > *:not(.section-heading)').forEach(x=>x.remove());
 const intro=el('p','note','Some questions must be answered before a proposed model could be trusted in practice. These are high-level topics, not promises of completed functionality.');
 decisions.append(intro);
 const topics=[
  ['Which strategy should be considered?','A research system might produce several promising ideas. Before using one, it needs a clearly defined rule for how candidates are compared.','Imagine two strategies give conflicting signals. The project still needs to decide which one has priority, or whether both should be skipped.'],
  ['When should the system refuse to trade?','Even a seemingly promising model must respect constraints such as limited funds, excessive concentration or unavailable market information.','If a model wants to invest €2,000 but its budget is €500, the planned safeguard could block or reduce the request.'],
  ['How should evidence be evaluated?','Backtests can exaggerate results when many ideas are tried. A credible process keeps failures and uses fresh historical periods to check new candidates.','Of 100 strategies tested, one might look excellent by chance. Testing that strategy on untouched years provides stronger evidence.'],
  ['How do research and operations connect?','A model starts as a research hypothesis. It needs independent testing, review and a separate approval before it can become part of a trading workflow.','A successful simulation is not automatically a live-trading instruction.']
 ];
 for(const [title,explanation,example]of topics){
  const card=el('article','card reader-decision');card.append(el('h3','',title),el('p','',explanation));
  const det=el('details','reader-next');det.append(el('summary','','Concrete example'),el('p','',example));card.append(det);decisions.append(card);
 }
}
if(about){
 // Repository is private: a public/shared click must not pretend the URL is accessible.
 for(const a of about.querySelectorAll('a[href*="github.com/Lawliet73/trading-workbench/"]')){
   const span=el('span','reader-private-reference',a.textContent+' (owner record)');
   span.title='The underlying project document is private. This public page is an educational summary, not a public repository browser.';
   a.replaceWith(span);
 }
 const headings=[...about.querySelectorAll('h3')];
 const method=headings.find(x=>x.textContent.trim()==='Method references');
 if(method){
   const next=method.nextElementSibling;
   if(next?.classList.contains('note'))next.textContent='These three links cover specific statistical methods documented in this project. They are not the complete bibliography.';
   const more=el('section','reader-more-sources');
   more.append(el('h3','','Open educational and data references'),
     el('p','note','The following independent public resources explain market mechanics or provide primary data. They are separate from the project’s private implementation evidence.'));
   const ul=el('ul');
   const sources=[
    ['SEC Investor.gov — what stocks are','https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks'],
    ['SEC EDGAR — company reports and disclosures','https://www.sec.gov/edgar/search/'],
    ['Kenneth French Data Library — research factors and portfolio data','https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html'],
    ['Federal Reserve FRED — public economic data','https://fred.stlouisfed.org/']
   ];
   for(const [name,url] of sources){const li=el('li'),a=el('a','',name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);ul.append(li);}
   more.append(ul);about.append(more);
 }
}
const views=qs('#tab-views');
if(views){const p=views.querySelector(':scope > .note');if(p)p.textContent='Choose a diagram to see how the Workbench’s parts relate to each other. Click the highlighted steps for explanations. For a larger view, open the diagram in its own tab.';}
const css=el('style');css.textContent=
'.reader-decision{max-width:1000px;margin:14px 0}.reader-decision h3{margin:0 0 10px;font-size:16px}.reader-decision p{line-height:1.75;font-size:13px}'+
'.reader-private-reference{color:var(--muted);font-style:italic}.reader-more-sources{margin-top:25px;padding:20px;border:1px solid var(--line);border-radius:var(--radius)}'+
'.reader-more-sources h3{font-size:16px}.reader-more-sources li{margin:8px 0}'+
'body:not([data-owner="true"]) #tab-overview .qa:last-child{display:none}'+
'body:not([data-owner="true"]) .publication-notes{display:none}'+
'body:not([data-owner="true"]) #tab-decisions .tag{display:none}';
document.head.append(css);
})();