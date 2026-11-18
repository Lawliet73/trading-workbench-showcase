/* Canonical knowledge navigation skeleton.
   Owner-only knowledge.js upgrades these same pages in place. The public and
   shared versions never import the private index, registry or source documents. */
(function(){
'use strict';
const nav=document.querySelector('#tabs'),main=document.querySelector('main'),F=window.FW,E=window.TWK_EDUCATION;
if(!nav||!main||!F||!E)return;
const scope=window.WORKBENCH_ASSISTANT?.scope||'public';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const titles=[
 ['tracks','Two tracks','Two research tracks','Learn the foundations and see how research ideas could be investigated.'],
 ['families','Strategies','Strategy families','Different types of research ideas and the assumptions behind them.'],
 ['ideas','Research ideas','Research ideas','Illustrative research questions, not verified trading strategies.'],
 ['sync','What changed','What the site covers','The visible educational release and its limits.']
];
const groupList=[...new Set(E.chapters.map(c=>c[0]))];
const renderers={
 tracks:()=>'<p class="klead">Track A is about understanding markets and testing methods. Track B uses those foundations to explore research questions. Both tracks appear in the 3D Explorer; access permissions determine how much source material you can read.</p>'+
 '<div class="kcols"><div class="card"><h3>Track A · Foundations</h3><p>Begin with the ideas needed to make sense of trading, evidence and risk.</p><div class="krows">'+
 groupList.map(g=>'<div class="krow"><b>'+esc(g)+'</b><p class="why">'+E.chapters.filter(c=>c[0]===g).map(c=>esc(c[1])).join(' · ')+'</p></div>').join('')+
 '</div><a href="#tab=learn">Open the learning library</a></div>'+
 '<div class="card"><h3>Track B · Edge discovery</h3><p>Ask whether a market effect is real, test it against simple alternatives and check its limits. Research ideas remain hypotheses until independently validated.</p><a href="#tab=ideas">Explore the research questions</a></div></div>',
 families:()=>'<p class="klead">Strategy families organize questions by the kind of price movement they investigate. These examples are educational, not project performance claims.</p><div class="kcols">'+
 [['Momentum and trends','Could a price movement continue for a while?','An ETF rises over several months. Does that help predict its next month?'],
  ['Company events','Do prices fully react when new information arrives?','A company reports unexpectedly strong earnings. Does the reaction continue afterward?'],
  ['Value and fundamentals','Do market prices sometimes differ from what company information suggests?','Two businesses have similar earnings but very different valuations.'],
  ['Market mechanics','Can order flow, trading costs or limited liquidity affect outcomes?','A large buy order moves the price because few sellers are available.']].map(x=>
 '<article class="card"><h3>'+esc(x[0])+'</h3><p>'+esc(x[1])+'</p><p class="note">Example: '+esc(x[2])+'</p></article>').join('')+'</div>',
 ideas:()=>'<p class="klead">An idea is a question to test, not a proven signal. These introductory examples show what research means; private strategy records are available only at the appropriate access level.</p><div class="kcols">'+
 [['Earnings reactions','How quickly do markets digest an unexpected company announcement?'],
  ['Trend persistence','Does a recent price trend tell us anything useful about future returns?'],
  ['Trading costs','Would an apparent advantage remain after realistic fees and execution prices?'],
  ['Risk controls','When should a system choose not to trade, even if a model generates a signal?']].map(x=>
 '<article class="card"><h3>'+esc(x[0])+'</h3><p>'+esc(x[1])+'</p><a href="#tab=learn">Learn the basics</a></article>').join('')+'</div>',
 sync:()=>'<p class="klead">All editions use the same navigation and educational framework. What differs is the depth of material that is approved for each audience.</p>'+
 '<div class="card"><h3>Visible learning material</h3><p>All readers can explore introductory concepts and the approved framework. Shared access adds reviewed educational lessons; the authenticated owner has the full research index, outstanding decisions and source details.</p><p>Nothing displayed here is a promise of a validated or running trading system.</p><a href="#tab=learn">Go to the learning library</a></div>'
};
function ensureTab(id,label,title,note){
 let b=nav.querySelector('[data-tab="'+id+'"]'),sec=document.getElementById('tab-'+id);
 if(!b){b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.dataset.tab=id;b.textContent=label;
   b.onclick=()=>location.hash='tab='+id;nav.append(b);}
 if(!sec){sec=document.createElement('section');sec.className='tab';sec.id='tab-'+id;main.append(sec);}
 if(scope!=='private'){
   sec.innerHTML='<div class="section-heading"><h2>'+esc(title)+'</h2><p>'+esc(note)+'</p></div><div class="kbody">'+renderers[id]()+'</div>';
 }
}
let sep=nav.querySelector('.navsep');
if(!sep){sep=document.createElement('div');sep.className='navsep';sep.textContent='Knowledge';nav.append(sep);}
for(const [id,label,title,note] of titles)ensureTab(id,label,title,note);
window.TWK_GRAPH?.mount(document.getElementById('tab-graph'));
// Open a study node in the actual lesson, not a dead private record route.
if(scope!=='private')window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.data?.type!=='twk:open')return;
 const frame=document.querySelector('#tab-graph iframe');
 if(!frame||event.source!==frame.contentWindow)return;
 const link=String(event.data.link||'');
 if(/^#tab=(learn|components|views|ideas|families|tracks)(?:&[a-z]+=[a-zA-Z0-9_-]+)*$/.test(link)){
   location.hash=link;return;
 }
 if(/^education\.html\?lesson=[a-zA-Z0-9_-]+$/.test(link)&&scope==='shared'){
   location.href=link;
 }
});
if(location.hash&&window.FW_ROUTE)window.FW_ROUTE();
})();