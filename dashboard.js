/* Presentation only: derive counts from the map, without changing research data. */
(()=>{
  const F=window.FW;if(!F)return;
  const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
  const identity=make('div','workspace-identity','Trading Workbench');identity.append(make('small','','Research / architecture'));document.body.prepend(identity);
  const header=document.querySelector('header');header.insertBefore(make('p','eyebrow','Quantitative research · framework atlas'),header.querySelector('h1'));
  const provenance=make('details','publication-notes');provenance.append(make('summary','','Project context · evidence & limitations'));const subtitle=header.querySelector('#subtitle');subtitle.before(provenance);provenance.append(subtitle);
  const metrics=make('dl','dashboard-summary');metrics.setAttribute('aria-label','Framework snapshot');
  for(const [label,value,note] of [['Mapped components',F.components.length,'Across the research framework'],['Implemented',F.components.filter(c=>c.s==='built').length,'Existence does not imply validation'],['Research candidates',F.components.filter(c=>c.s==='candidate').length,'Ideas awaiting evidence'],['Snapshot',F.asOf,'Dated repository evidence']]){
    const metric=make('div','summary-metric'),valueNode=make('dd','',String(value));valueNode.append(make('small','',note));metric.append(make('dt','',label),valueNode);metrics.append(metric);
  }
  header.append(metrics);
  const sections={overview:['Research overview','Questions, evidence and the path to implementation'],components:['Component library','Explore responsibilities, status and dependencies'],views:['Architecture atlas','Five connected views of the research framework'],decisions:['Decisions & research gaps','Recorded questions, separated from proposals'],about:['Reading the framework','Status meanings, sources and educational context']};
  for(const [id,[title,note]] of Object.entries(sections)){const section=document.querySelector('#tab-'+id),heading=make('div','section-heading');heading.append(make('h2','',title),make('p','',note));section.prepend(heading);}
  document.querySelector('#tabs').setAttribute('aria-label','Research workspace');
  const theme=document.querySelector('#theme');const describeTheme=()=>{const light=document.documentElement.dataset.theme==='light';theme.textContent=light?'Dark theme':'Light theme';theme.setAttribute('aria-label',light?'Switch to dark theme':'Switch to light theme');};describeTheme();new MutationObserver(describeTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();
