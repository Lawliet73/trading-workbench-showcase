/* Canonical reader-facing learning tab. Same UX in public/shared;
   owner keeps its deeper private knowledge-backed learning section.
   All prose here is general educational context, not tested project results. */
(()=>{
'use strict';
const scope=window.WORKBENCH_ASSISTANT?.scope||'public';
if(scope==='private')return;
const nav=document.querySelector('#tabs'),main=document.querySelector('main');
if(!nav||!main||document.getElementById('tab-learn'))return;
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n;};
const chapters=[
 ['Getting started','What happens when you buy a share?',
 'A share represents a small ownership interest in a company. An investor places an order, a broker sends it to a market, and a trade happens when a buyer and seller agree on a price.',
 'You want to buy 2 shares at €50 each. If a seller accepts that price, you pay about €100 before fees. If nobody accepts your price, your order can remain unfilled.',
 'Orders, exchanges, trading mechanics'],
 ['Getting started','Why do prices move?',
 'Prices change because buyers and sellers react to new information, expectations and available supply. A company can report strong profits yet its stock can fall when people expected even better results.',
 'A company earns €10 million, up from €8 million. Its stock could still drop if investors had expected €15 million.',
 'Market information, price formation'],
 ['Research basics','What is a trading strategy?',
 'A strategy is a set of rules for deciding when to buy, sell, or do nothing. The goal of research is to test whether those rules are better than a simple comparison after realistic costs.',
 'One rule might buy only when a price rises above its average over the last 50 days. That is a testable idea, not evidence that the rule earns money.',
 'Strategies, signals, decisions'],
 ['Research basics','What does a backtest tell us?',
 'A backtest applies a strategy to historical data to simulate past decisions. It helps find weaknesses but cannot guarantee future performance.',
 'Imagine testing the same buy/sell rule over 2018–2025. The result must include fees and failed trades, not just the best profitable examples.',
 'Backtesting, validation, simulated trading'],
 ['Research basics','Why is old information not always usable?',
 'A historical price or earnings report may be dated earlier than when traders could actually see it. A reliable test asks what information was available at that moment.',
 'A report about March earnings published in May cannot be used in a simulation that places a trade in April.',
 'Information timing, data quality'],
 ['Evaluating ideas','How do we know a strategy is not just lucky?',
 'A convincing-looking result can happen by accident, especially when many versions are tried. Researchers compare a rule with a simple baseline and test it on periods they did not use to choose it.',
 'If you test 100 different signals, one may look excellent by chance. Try the chosen signal on untouched data before treating it as promising.',
 'Statistical testing, overfitting'],
 ['Evaluating ideas','What is momentum?',
 'Momentum describes a tendency for an asset that has recently risen or fallen to keep moving in that direction for some time. It is a hypothesis to investigate, not a guarantee.',
 'A stock rises from €40 to €50. A momentum model asks whether similar price changes were followed by further rises often enough to matter after costs.',
 'Momentum, trend strategies'],
 ['Evaluating ideas','What is an event-driven strategy?',
 'This type of research looks for how markets react to identifiable events, such as company earnings, takeovers or unexpected announcements.',
 'If a company reports an earnings surprise, a model can check whether the price reaction continues over the following days. The project must still test that idea.',
 'Earnings, events, market reactions'],
 ['Managing decisions','What does risk control do?',
 'Risk controls limit what a system is allowed to buy or sell and how much money it may expose. A promising research signal can be rejected by those limits.',
 'A strategy requests a €5,000 purchase, but the planned risk limit permits only €1,000. The request is reduced or refused.',
 'Position sizing, exposure, risk gates'],
 ['Managing decisions','What is the difference between research and real trading?',
 'Research asks whether an idea deserves testing. Real trading adds broker orders, fees, changing liquidity and the possibility that an order will not execute as expected.',
 'A simulation buys 100 shares at €10. In a real market the shares might fill at several prices, or not all at once.',
 'Research, execution, live trading'],
 ['Putting it together','How do these parts connect?',
 'Information enters through market data and company events. Models transform it into possible decisions. Testing checks whether those decisions had merit. Risk controls decide whether a proposed trade is permitted.',
 'Think of a weather forecast: sensors provide observations, a model makes a prediction, earlier predictions are scored, and an operator decides whether to act.',
 'Data → models → tests → decisions'],
 ['Putting it together','What does “planned” mean on this site?',
 'Some elements are already implemented, while others describe a future workflow or an idea under investigation. A diagram can show a planned connection without claiming that it operates today.',
 'A planned broker connection on a diagram is like a proposed new train line on a map: it explains the intended route, not that trains are already running.',
 'Status labels, roadmap']
];
const section=el('section','tab reader-course');section.id='tab-learn';
const head=el('div','section-heading');head.append(el('h2','', 'Learn the ideas from the beginning'),el('p','', 'No finance or programming background needed.'));
const intro=el('p','note','Choose a topic to see a plain explanation, a concrete example and how it relates to the Workbench. More advanced details remain optional.');
const layout=el('div','reader-course-layout'),selector=el('aside','reader-course-nav'),article=el('article','reader-course-body');
selector.setAttribute('aria-label','Learning topics');layout.append(selector,article);
section.append(head,intro,layout);main.append(section);
const tab=el('button','','Learn');tab.type='button';tab.dataset.tab='learn';tab.setAttribute('role','tab');tab.onclick=()=>location.hash='tab=learn';
const after=nav.querySelector('[data-tab=decisions]');if(after)nav.insertBefore(tab,after);else nav.append(tab);
function choose(i){
 const topic=chapters[i];article.replaceChildren();
 article.append(el('p','reader-kicker',topic[0]),el('h3','',topic[1]));
 const explanation=el('div','reader-quick');explanation.append(el('h4','', 'In everyday language'),el('p','',topic[2]));
 const sample=el('div','reader-example');sample.append(el('h4','', 'For example'),el('p','',topic[3]));
 article.append(explanation,sample);
 const linked=el('p','note','Connected subjects: '+topic[4]+'.');
 article.append(linked);
 const more=el('details','reader-next');more.append(el('summary','', 'How does this fit into the Workbench?'));
 const related=el('p','','Each chapter describes the concepts and the purpose of related components. An untested research idea is not an approved or profitable strategy.');
 const c=el('a','','Explore the component library');c.href='#tab=components';
 more.append(related,c);article.append(more);
 selector.querySelectorAll('button').forEach((b,j)=>b.setAttribute('aria-current',String(j===i)));
}
let category='';
chapters.forEach((entry,i)=>{
 if(entry[0]!==category){category=entry[0];selector.append(el('h3','',category));}
 const b=el('button','',entry[1]);b.type='button';b.onclick=()=>choose(i);selector.append(b);
});
choose(0);
if(scope==='shared'){
 const extra=el('section','reader-extended');section.append(extra);
 extra.append(el('h3','','Continue with the extended study library'),
   el('p','note','Approved longer lessons include worked examples and exercises. Expand a preview, or open the complete lesson without leaving the shared-access level.'));
 fetch('shared-education.json',{credentials:'same-origin',cache:'no-store'})
   .then(r=>{if(!r.ok)throw Error('Unavailable');return r.json();})
   .then(data=>{
     if(data.scope!=='shared-education'||!Array.isArray(data.lessons))throw Error('Invalid library');
     for(const lesson of data.lessons){
       const details=el('details','reader-next'),sum=el('summary','',lesson.title);
       details.append(sum);
       const first=lesson.sections?.find(s=>s.markdown?.trim());
       if(first){details.append(el('p','',first.title),el('p','reader-preview',first.markdown.replace(/[#*_\x60]/g,'').slice(0,500)+'…'));}
       const link=el('a','','Read the full lesson and all sections');
       link.href='education.html?lesson='+encodeURIComponent(lesson.slug);
       details.append(link);extra.append(details);
     }
   }).catch(()=>extra.append(el('p','note','The extended lessons are temporarily unavailable. Core learning topics remain accessible here.')));
}
if(location.hash.includes('tab=learn'))window.FW_ROUTE?.();
const css=el('style');
css.textContent='.reader-course-layout{display:grid;grid-template-columns:minmax(190px,260px) minmax(0,1fr);gap:20px;align-items:start}'+
'.reader-course-nav{border:1px solid var(--line);border-radius:var(--radius);padding:16px;background:var(--panel)}'+
'.reader-course-nav h3{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:18px 0 8px}'+
'.reader-course-nav h3:first-child{margin-top:0}.reader-course-nav button{display:block;text-align:left;width:100%;border:1px solid transparent;border-radius:5px;background:transparent;color:var(--ink);padding:9px 10px;cursor:pointer;font-size:12px}'+
'.reader-course-nav button:hover,.reader-course-nav button[aria-current="true"]{border-color:var(--accent);background:var(--hover)}'+
'.reader-course-body{border:1px solid var(--line);background:var(--panel);border-radius:var(--radius);padding:clamp(20px,3vw,34px);line-height:1.8}'+
'.reader-course-body h3{font-size:22px;margin:5px 0 18px}.reader-course-body h4{font-size:13px;margin:0 0 8px}.reader-course-body p{font-size:14px;line-height:1.8}'+
'.reader-kicker{font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:.09em}.reader-example{border-left:3px solid var(--accent);padding:12px 16px;margin:20px 0;background:var(--bg)}'+
'.reader-quick{padding:8px 0}.reader-next{border:1px solid var(--line);border-radius:5px;padding:12px 16px;margin:12px 0}.reader-next summary{cursor:pointer;font-size:13px}'+
'.reader-extended{margin-top:30px;max-width:1000px}.reader-extended>p{max-width:90ch}.reader-extended .reader-preview{white-space:pre-line;line-height:1.75;font-size:13px}'+
'@media(max-width:800px){.reader-course-layout{grid-template-columns:1fr}.reader-course-nav{display:flex;gap:4px;flex-wrap:wrap}.reader-course-nav h3{flex-basis:100%;margin:12px 0 3px}.reader-course-nav button{width:auto;flex:1 1 170px}}';
document.head.append(css);
})();