/* Shared map companion. No secrets or retrieved corpus live in this file. */
(()=>{
  // The parent page owns the assistant. Never duplicate an overlay inside
  // embedded graphs or activate a cloud endpoint from a local preview.
  if(window.self!==window.top||/^(localhost|127\.0\.0\.1)$/.test(location.hostname))return;
  const config=window.WORKBENCH_ASSISTANT||{};
  const el=(tag,attrs={},text='')=>{const n=document.createElement(tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);n.textContent=text;return n;};
  const launcher=el('button',{class:'ai-launch',type:'button','aria-expanded':'false','aria-controls':'ai-panel'},'Ask the research assistant');
  const panel=el('section',{id:'ai-panel',class:'ai-panel',role:'dialog','aria-label':'Research assistant',hidden:''});
  const top=el('div',{class:'ai-top'}),heading=el('strong',{},'Research companion');
  const language=el('select',{'aria-label':'Answer language'});
  for(const [value,label]of [['en','English'],['de','Deutsch']]){const o=el('option',{value},label);language.append(o);}
  language.value=navigator.language.startsWith('de')?'de':'en';
  const close=el('button',{type:'button','aria-label':'Close assistant'},'×');top.append(heading,language,close);
  const context=el('div',{class:'ai-context'}),suggestions=el('div',{class:'ai-suggestions'});
  const messages=el('div',{class:'ai-messages',role:'log','aria-live':'polite','aria-relevant':'additions'});
  const status=el('p',{class:'ai-status',role:'status'});
  const form=el('form'),label=el('label',{for:'ai-question'},'Your question / Deine Frage');
  const input=el('textarea',{id:'ai-question',rows:'3',maxlength:'1500',required:'',placeholder:'How does this work?'});
  const send=el('button',{type:'submit'},'Ask / Fragen'),clear=el('button',{type:'button'},'New conversation');
  const controls=el('div',{class:'ai-controls'});controls.append(send,clear);form.append(label,input,controls);
  const note=el('p',{class:'ai-note'},'Ask about concepts, models and how they connect. Examples are illustrative; request sources when you need them.');
  panel.append(top,context,suggestions,messages,status,form,note);document.body.append(launcher,panel);
  let history=[],controller,previousFocus;let component='',diagram='',record='',graphRecord='';
  function refresh(){const route=new URLSearchParams(location.hash.slice(1));diagram=route.get('tab')==='views'?(route.get('v')||'A'):'';component=route.get('c')||'';record=route.get('k')||graphRecord;const c=window.FW?.components.find(c=>c.id===component);const view=window.FW?.views.find(v=>v.id===diagram);const selected=window.FW_KNOWLEDGE?.nodes?.find(n=>n.key===record);context.replaceChildren(document.createTextNode(selected?'Discussing: '+selected.title:c?'Discussing: '+c.n:view?'Diagram: '+view.t:'Ask about models and components'));
     const targetComponent=component||(record.startsWith('component:')?record.slice('component:'.length):'');
     if(targetComponent&&window.FW?.components.some(x=>x.id===targetComponent)){
       const link=el('a',{href:'#tab=components&c='+encodeURIComponent(targetComponent)},'View this component');
       link.onclick=()=>{location.hash='tab=components&c='+encodeURIComponent(targetComponent);};
       context.append(document.createTextNode(' · '),link);
     }
     suggestions.replaceChildren();
    for(const prompt of language.value==='de'?['Erkläre das mit einem Zahlenbeispiel.','Was ist implementiert, und was ist noch eine Hypothese?']:['Explain this with a numerical example.','What is implemented, and what remains a hypothesis?']){const b=el('button',{type:'button'},prompt);b.onclick=()=>{input.value=prompt;input.focus();};suggestions.append(b);}
    const graphPanel=document.querySelector('#detail');if(record&&graphPanel&&!graphPanel.querySelector('.ai-explain')){const btn=el('button',{type:'button',class:'ai-explain'},'Explain selected record · AI');btn.onclick=()=>{open();input.value=language.value==='de'?'Erkläre den ausgewählten Knoten und seine Beziehungen anschaulich.':'Explain the selected graph node and its relationships intuitively.';};graphPanel.append(btn);}
    const drawer=document.querySelector('#drawer');if(c&&drawer&&!drawer.querySelector('.ai-explain')){const b=el('button',{type:'button',class:'ai-explain'},'Explain this · AI');b.onclick=()=>{open();input.value=language.value==='de'?'Erkläre diese Komponente und ihre Beziehungen.':'Explain this component and its relationships.';};drawer.querySelector('h2')?.after(b);}
  }
  function open(){previousFocus=document.activeElement;panel.hidden=false;launcher.setAttribute('aria-expanded','true');refresh();input.focus();if(!config.endpoint)status.textContent='Cloud assistant is awaiting setup. You can still explore every component and lesson.';}
  function hide(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');previousFocus?.focus();}
  launcher.onclick=()=>panel.hidden?open():hide();close.onclick=hide;
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();hide();}});
  language.onchange=refresh;addEventListener('hashchange',()=>queueMicrotask(refresh));
  addEventListener('twk:record-selected',event=>{graphRecord=event.detail?.key||'';refresh();});
  // The diagram lives in an iframe. Its inspected steps can open the SAME
  // persistent conversation in the parent, instead of launching a second bot.
  addEventListener('message',e=>{
    if(e.origin!==location.origin||e.data?.type!=='twk:ask-assistant')return;
    const frames=[...document.querySelectorAll('iframe')];
    if(!frames.some(f=>f.contentWindow===e.source))return;
    const topic=String(e.data.topic||'this step').slice(0,130);
    const summary=String(e.data.summary||'').slice(0,240);
    open();
    input.value=(language.value==='de'?'Erkläre anschaulich, was "'+topic+'" bedeutet und warum es wichtig ist. Nutze ein einfaches Beispiel.':
      'Explain what "'+topic+'" means and why it matters, with one everyday example.')+(summary?' Context: '+summary:'');
    input.focus();
  });
  // The knowledge explorer has its own independent detail panel.
  const graphPanel=document.querySelector('#detail');if(graphPanel)new MutationObserver(refresh).observe(graphPanel,{childList:true});
  // The existing drawer is rerendered on component navigation; no coupling to its internal functions.
  const drawer=document.querySelector('#drawer');if(drawer)new MutationObserver(refresh).observe(drawer,{childList:true});
  // Owner-only knowledge drawer also gets a contextual AI explanation action.
  function bindOwnerDrawer(){
    const kdrawer=document.querySelector('#kdrawer');if(!kdrawer||kdrawer.dataset.aiBound==='1')return;
    kdrawer.dataset.aiBound='1';
    const syncKnowledge=()=>{
      const key=new URLSearchParams(location.hash.slice(1)).get('k');
      if(!key||!kdrawer.classList.contains('on')||kdrawer.querySelector('.ai-explain'))return;
      const button=el('button',{type:'button',class:'ai-explain'},'Explain this record with AI');
      button.onclick=()=>{
        open();
        input.value=language.value==='de'
          ?'Erkläre den ausgewählten Eintrag und seine offenen Fragen von Anfang an, mit einem konkreten Beispiel.'
          :'Explain this selected record and any unresolved questions from the beginning, with one concrete example.';
        input.focus();
      };
      kdrawer.querySelector('h2')?.after(button);
    };
    new MutationObserver(syncKnowledge).observe(kdrawer,{childList:true});
    addEventListener('hashchange',syncKnowledge);
    syncKnowledge();
  }
  document.addEventListener('twk:ui',bindOwnerDrawer);
  bindOwnerDrawer();
  clear.onclick=()=>{controller?.abort();history=[];messages.replaceChildren();status.textContent='';input.focus();};
  function bubble(role,text){const n=el('div',{class:'ai-message ai-'+role});n.append(el('strong',{},role==='user'?'You':'Assistant'),el('div',{class:'ai-text'},text));messages.append(n);n.scrollIntoView({block:'nearest'});return n;}
  form.onsubmit=async e=>{e.preventDefault();if(send.disabled)return;refresh();if(!config.endpoint){status.textContent='Cloud assistant is awaiting setup.';return;}const question=input.value.trim();if(!question)return;
    const localController=new AbortController();controller=localController;const timer=setTimeout(()=>localController.abort(),90000);
    const requestHistory=history.slice(-8);while(new TextEncoder().encode(JSON.stringify(requestHistory)).length>14000)requestHistory.splice(0,2);bubble('user',question);input.value='';send.disabled=true;status.textContent=language.value==='de'?'Antwort wird erstellt …':'Thinking about your question …';
    try{const r=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:config.private?'same-origin':'omit',signal:localController.signal,body:JSON.stringify({question,history:requestHistory,component,diagram,record,language:language.value})});
      let data;try{data=await r.json();}catch{throw Error('Assistant unavailable. Check your connection or sign in to the private site.');}if(!r.ok)throw Error(data.error||'Assistant unavailable.');if(controller!==localController||localController.signal.aborted)return;
      const n=bubble('assistant',data.answer);
      if((data.sources||[]).length){
        const details=el('details',{class:'ai-citation-details'});details.append(el('summary',{},'References for this answer'));
        const refs=el('div',{class:'ai-sources'});
        for(const src of data.sources){
          const name='['+src.number+'] '+src.title;
          if(typeof src.url==='string'&&(src.url.startsWith('#tab=')||src.url.startsWith('https://'))){
            const a=el('a',{href:src.url},name);
            if(src.url.startsWith('https://')){a.target='_blank';a.rel='noopener noreferrer';}
            else a.onclick=()=>{location.hash=src.url.slice(1);};
            refs.append(a);
          }else refs.append(el('span',{},name));
        }
        details.append(refs);n.append(details);
      }
      history=[...requestHistory,{role:'user',content:question},{role:'assistant',content:data.answer.slice(0,4000)}];status.textContent=data.truncated?(language.value==='de'?'Die Antwort hat ihre Längengrenze erreicht. Bitte frage nach einer Fortsetzung.':'The answer reached its length limit. Ask me to continue.'):'';
    }catch(error){if(controller===localController)status.textContent=error.name==='AbortError'?'Request stopped. Please try again.':error.message;}
    finally{clearTimeout(timer);if(controller===localController){send.disabled=false;controller=null;}}
  };const viewGuide=document.querySelector('#viewguide');if(viewGuide){const b=el('button',{type:'button',class:'ai-explain'},'Explain diagram · AI');b.onclick=()=>{open();input.value=language.value==='de'?'Erkläre dieses Diagramm und seine Beziehungen.':'Explain this diagram and its relationships.';};viewGuide.before(b);}refresh();
})();
