/* One navigation/graph surface for public, shared and private editions.
   Data depth belongs to the Worker and its approved asset allowlist. */
(function(){
'use strict';
const theme=()=>document.documentElement.dataset.theme==='light'?'light':'dark';
function mount(body){
 if(!body)return null;
 body.innerHTML='<p class="klead"><b>Explore the Workbench.</b> The same interactive map is available at every access level. Follow components, study concepts and their relationships; higher access levels reveal more records, not a different interface. Drag to rotate, scroll to zoom, or switch to the flat and list views. <b>Position is for navigation, not a measured similarity.</b> <a href="knowledge/explorer.html" target="_blank" rel="noopener">Open full screen</a>.</p><iframe id="public-explorer" class="kgraph" title="3D Knowledge Explorer" src="knowledge/explorer.html?embed=1&theme='+theme()+'" loading="lazy"></iframe>';
 const frame=body.querySelector('iframe');
 const sync=()=>{
  if(frame.isConnected&&frame.contentWindow)frame.contentWindow.postMessage({type:'twk:theme',theme:theme()},location.origin);
 };
 frame.addEventListener('load',sync);
 const observer=new MutationObserver(()=>{
  if(!frame.isConnected){observer.disconnect();return;}
  sync();
 });
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 sync();
 return frame;
}
window.TWK_GRAPH=Object.freeze({mount});
})();