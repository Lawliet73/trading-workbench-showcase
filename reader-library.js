/* Canonical reader-facing learning tab. Same UX in public/shared;
   owner keeps its deeper private knowledge-backed learning section.
   All prose here is general educational context, not tested project results. */
(()=>{
'use strict';
const scope=window.WORKBENCH_ASSISTANT?.scope||'public';
// All levels use the same introductory curriculum; permission grants depth.
const nav=document.querySelector('#tabs'),main=document.querySelector('main');
if(!nav||!main||document.getElementById('tab-learn'))return;
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n;};
const chapters=window.TWK_EDUCATION?.chapters||[];
if(!chapters.length)return;
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
const openTopic=()=>{const h=new URLSearchParams(location.hash.slice(1));const n=Number(h.get('topic'));if(h.get('topic')!=null&&Number.isInteger(n)&&n>=0&&n<chapters.length)choose(n);};
choose(0);
addEventListener('hashchange',openTopic);openTopic();
if(scope==='private'){
 const deeper=el('section','reader-extended');
 deeper.append(el('h3','','Continue with the complete curriculum'),el('p','note','Your private research and study records add the full depth, relationships and recorded verification details. The beginning lessons above remain identical.'));
 const link=el('a','','Explore all study modules and their research links');link.href='#tab=tracks';
 deeper.append(link);section.append(deeper);
}
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