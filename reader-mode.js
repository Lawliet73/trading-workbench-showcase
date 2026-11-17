/* Global reader policy. UI disclosure is NOT authorization:
   static publishing must exclude private assets before delivery.
   Only an Access-authenticated owner Worker sets scope='private'. */
(function(){
'use strict';
const config=window.WORKBENCH_ASSISTANT||{},owner=config.scope==='private';
function enabled(){return document.documentElement.dataset.technical==='on'&&owner;}
function set(value){
 document.documentElement.dataset.technical=owner&&value?'on':'off';
 document.querySelectorAll('.twk-tech-toggle').forEach(b=>{b.textContent='Technical details: '+(enabled()?'on':'off');b.setAttribute('aria-pressed',String(enabled()));});
 for(const iframe of document.querySelectorAll('iframe')){try{iframe.contentWindow.postMessage({type:'twk:technical',enabled:enabled()},location.origin);}catch{}}
 document.dispatchEvent(new CustomEvent('twk:technical',{detail:{enabled:enabled()}}));
}
function mount(){
 if(!document.body||document.querySelector('.twk-tech-toggle'))return;
 if(!owner)return;
 // One owner control in the parent page. Embedded graph/diagrams receive
 // explicit same-origin state messages, avoiding duplicate or clipped buttons.
 if(window.self!==window.top)return;
 // Keep owner-only metadata in the graph Options menu rather than widening
 // the mobile toolbar; the main site retains its navigation toggle.
 const target=document.querySelector('#advanced-controls')||document.querySelector('#tabs')||document.querySelector('#bar')||document.querySelector('nav');
 if(!target)return;
 const b=document.createElement('button');b.type='button';b.className='twk-tech-toggle';b.setAttribute('aria-pressed','false');
 b.title='Show internal IDs, provenance, raw records and technical connection lists in this private session only.';
 b.onclick=()=>set(!enabled());target.append(b);
 set(false); // default off on every fresh navigation
}
document.documentElement.dataset.technical='off';
const css=document.createElement('style');
css.textContent=':root:not([data-technical="on"]) .technical-only{display:none!important}'+
':root:not([data-technical="on"]) .kchip code{display:none!important}'+
':root:not([data-technical="on"]) .kcount{display:none!important}'+
'.twk-tech-toggle{font:inherit;font-size:11px;cursor:pointer;color:var(--muted,#aaa);background:var(--panel,#20252a);border:1px solid var(--line,#555);border-radius:5px;padding:7px 9px;margin:7px}'+
'.reader-tiers{display:grid;gap:10px;margin:14px 0;line-height:1.7}'+
'.reader-quick{border-left:3px solid var(--accent,#56b4e9);padding:8px 14px;background:var(--panel,#1b2025)}'+
'.reader-quick h3{font-size:13px;margin:0 0 6px}.reader-quick p{margin:0 0 6px}'+
'.reader-depth{padding:11px;border:1px solid var(--line,#666);border-radius:6px}'+
'.reader-depth summary{cursor:pointer;font-weight:600;color:var(--ink,#fff)}'+
'.reader-depth[open] summary{margin-bottom:12px}.reader-depth h4{margin:12px 0 4px}'+
'.reader-depth p{white-space:pre-line;line-height:1.8}'+
'.reader-source{display:block;margin-top:8px;font-size:10px;color:var(--muted,#aaa)}';
document.head.append(css);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data&&e.data.type==='twk:technical'&&owner)set(Boolean(e.data.enabled));});
window.TWK_READER={owner,enabled,set};
})();
