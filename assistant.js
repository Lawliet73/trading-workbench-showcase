/* Shared map companion. No secrets or retrieved corpus live in this file. */
(()=>{
  const config=window.WORKBENCH_ASSISTANT||{};
  const el=(tag,attrs={},text='')=>{const n=document.createElement(tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);n.textContent=text;return n;};
  const launcher=el('button',{class:'ai-launch',type:'button','aria-expanded':'false','aria-controls':'ai-panel'},'Ask the research assistant');
  const panel=el('section',{id:'ai-panel',class:'ai-panel',role:'dialog','aria-label':'Research assistant',hidden:''});
  const top=el('div',{class:'ai-top'}),heading=el('strong',{},'Research companion');
  const language=el('select',{'aria-label':'Answer language'});
  for(const [value,label]of [['en','English'],['de','Deutsch']]){const o=el('option',{value},label);language.append(o);}
  language.value=navigator.language.startsWith('de')?'de':'en';
  const close=el('button',{type:'button','aria-label':'Close assistant'},'×');top.append(heading,language,close);
  const context=el('p',{class:'ai-context'}),suggestions=el('div',{class:'ai-suggestions'});
  const messages=el('div',{class:'ai-messages',role:'log','aria-live':'polite','aria-relevant':'additions'});
  const status=el('p',{class:'ai-status',role:'status'});
  const form=el('form'),label=el('label',{for:'ai-question'},'Your question / Deine Frage');
  const input=el('textarea',{id:'ai-question',rows:'3',maxlength:'1500',required:'',placeholder:'How does this work?'});
  const send=el('button',{type:'submit'},'Ask / Fragen'),clear=el('button',{type:'button'},'New conversation');
  const controls=el('div',{class:'ai-controls'});controls.append(send,clear);form.append(label,input,controls);
  const note=el('p',{class:'ai-note'},'AI explanations can be wrong. Check the sources. Questions are sent to Cloudflare; this chat stays in memory only.');
  panel.append(top,context,suggestions,messages,status,form,note);document.body.append(launcher,panel);
  let history=[],controller,previousFocus;let component='',diagram='';
  function refresh(){const route=new URLSearchParams(location.hash.slice(1));diagram=route.get('tab')==='views'?(route.get('v')||'A'):'';component=new URLSearchParams(location.hash.slice(1)).get('c')||'';const c=window.FW?.components.find(c=>c.id===component);const view=window.FW?.views.find(v=>v.id===diagram);context.textContent=c?'Selected: '+c.n:view?'Diagram: '+view.t:'Explore the research framework';suggestions.replaceChildren();
    for(const prompt of language.value==='de'?['Erkläre das mit einem Zahlenbeispiel.','Was ist implementiert, und was ist noch eine Hypothese?']:['Explain this with a numerical example.','What is implemented, and what remains a hypothesis?']){const b=el('button',{type:'button'},prompt);b.onclick=()=>{input.value=prompt;input.focus();};suggestions.append(b);}
    const drawer=document.querySelector('#drawer');if(c&&drawer&&!drawer.querySelector('.ai-explain')){const b=el('button',{type:'button',class:'ai-explain'},'Explain this · AI');b.onclick=()=>{open();input.value=language.value==='de'?'Erkläre diese Komponente und ihre Beziehungen.':'Explain this component and its relationships.';};drawer.querySelector('h2')?.after(b);}
  }
  function open(){previousFocus=document.activeElement;panel.hidden=false;launcher.setAttribute('aria-expanded','true');refresh();input.focus();if(!config.endpoint)status.textContent='Cloud assistant is awaiting setup. You can still explore every component and lesson.';}
  function hide(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');previousFocus?.focus();}
  launcher.onclick=()=>panel.hidden?open():hide();close.onclick=hide;
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();hide();}});
  language.onchange=refresh;addEventListener('hashchange',()=>queueMicrotask(refresh));
  // The existing drawer is rerendered on component navigation; no coupling to its internal functions.
  const drawer=document.querySelector('#drawer');if(drawer)new MutationObserver(refresh).observe(drawer,{childList:true});
  clear.onclick=()=>{controller?.abort();history=[];messages.replaceChildren();status.textContent='';input.focus();};
  function bubble(role,text){const n=el('div',{class:'ai-message ai-'+role});n.append(el('strong',{},role==='user'?'You':'Assistant'),el('div',{class:'ai-text'},text));messages.append(n);n.scrollIntoView({block:'nearest'});return n;}
  form.onsubmit=async e=>{e.preventDefault();if(send.disabled)return;refresh();if(!config.endpoint){status.textContent='Cloud assistant is awaiting setup.';return;}const question=input.value.trim();if(!question)return;
    const localController=new AbortController();controller=localController;const timer=setTimeout(()=>localController.abort(),45000);
    const requestHistory=history.slice(-4);bubble('user',question);input.value='';send.disabled=true;status.textContent=language.value==='de'?'Quellen werden geprüft …':'Checking sources …';
    try{const r=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:config.private?'same-origin':'omit',signal:localController.signal,body:JSON.stringify({question,history:requestHistory,component,diagram,language:language.value})});
      let data;try{data=await r.json();}catch{throw Error('Assistant unavailable. Check your connection or sign in to the private site.');}if(!r.ok)throw Error(data.error||'Assistant unavailable.');if(controller!==localController||localController.signal.aborted)return;
      const n=bubble('assistant',data.answer);const refs=el('div',{class:'ai-sources'});
      for(const s of data.sources||[]){const text=`[${s.number}] ${s.title}`;if(typeof s.url==='string'&&(s.url.startsWith('#tab=')||s.url.startsWith('https://'))){const a=el('a',{href:s.url},text);if(s.url.startsWith('https://')){a.target='_blank';a.rel='noopener noreferrer';}refs.append(a);}else refs.append(el('span',{},text));}
      n.append(refs);history=[...requestHistory,{role:'user',content:question},{role:'assistant',content:data.answer.slice(0,2000)}];status.textContent='';
    }catch(error){if(controller===localController)status.textContent=error.name==='AbortError'?'Request stopped. Please try again.':error.message;}
    finally{clearTimeout(timer);if(controller===localController){send.disabled=false;controller=null;}}
  };const viewGuide=document.querySelector('#viewguide');if(viewGuide){const b=el('button',{type:'button',class:'ai-explain'},'Explain diagram · AI');b.onclick=()=>{open();input.value=language.value==='de'?'Erkläre dieses Diagramm und seine Beziehungen.':'Explain this diagram and its relationships.';};viewGuide.before(b);}refresh();
})();
