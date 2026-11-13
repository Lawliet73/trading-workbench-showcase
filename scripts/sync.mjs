import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
// Git may normalize CRLF on checkout; approvals describe the same text on Windows and Linux.
export const hash = value => createHash('sha256').update(value.replace(/\r\n/g,'\n')).digest('hex');
export async function readAllowed(root,relative) {
  if(typeof relative!=='string'||path.isAbsolute(relative)||relative.split(/[\\/]/).includes('..')) throw Error('Unsafe allowlist path');
  const base=await fs.realpath(root), resolved=await fs.realpath(path.join(base,relative));
  if(!resolved.startsWith(base+path.sep)) throw Error('Source escapes repository');
  return fs.readFile(resolved,'utf8');
}
export async function build(root,manifest) {
  if(!['public','private'].includes(manifest.scope)) throw Error('Invalid scope');
  const documents=[];
  for(const item of manifest.files){
    let content;try{content=await readAllowed(root,item.path);}catch(e){if(e.code==='ENOENT'&&manifest.scope==='private'&&item.optional===true)continue;throw e;}
    // Public entries are reviewed file revisions, not a wildcard permission for future content.
    if(manifest.scope==='public' && hash(content)!==item.sha256) throw Error('Public approval hash mismatch: '+item.path);
    const base={component:'',url:item.url||'',priority:item.priority||0};
    const chunks=[];
    if(item.kind==='map'){
      const sandbox={window:{}};vm.runInNewContext(content,sandbox,{timeout:1000});
      for(const c of sandbox.window.FW.components){
        chunks.push({...base,component:c.id,title:c.n,text:JSON.stringify({status:c.s,purpose:c.p,evidence:c.evid,needs:c.deps,supplies:c.feeds}).slice(0,2500),url:'#tab=components&c='+encodeURIComponent(c.id)});
      }
    }else if(item.kind==='lessons'){
      const sandbox={window:{}};vm.runInNewContext(content,sandbox,{timeout:1000});
      for(const [id,text] of Object.entries(sandbox.window.FW_LEARNING.lessons)) chunks.push({...base,component:id,title:'Explanation: '+id,text:String(text).slice(0,2500),url:'#tab=components&c='+encodeURIComponent(id)});
    }else if(item.kind==='markdown'){
      // Heading-aware, newest-first project log wins ties. Stable source IDs make replacement/deletion safe.
      let title=item.path;
      for(const section of content.split(/(?=^#{1,4} )/m)){
        const heading=section.match(/^#{1,4} (.+)/);if(heading)title=heading[1];
        for(let i=0;i<section.length;i+=2200)chunks.push({...base,title:title.slice(0,300),text:section.slice(i,i+2200)});
      }
    }else throw Error('Unknown source format');
    // Split large records into bounded atomic documents; removed partitions are removed on next sync.
    let part=[],partition=0;
    const flush=()=>{if(part.length){documents.push({scope:manifest.scope,id:item.path+':'+partition++,hash:hash(JSON.stringify(part)),chunks:part});part=[];}};
    for(const chunk of chunks){if(part.length>=80||Buffer.byteLength(JSON.stringify([...part,chunk]),'utf8')>250000)flush();if(Buffer.byteLength(JSON.stringify(chunk),'utf8')>250000)throw Error('Source chunk too large');part.push(chunk);}flush();
  }
  return documents;
}
export async function synchronize(root,manifest,url,token) {
  if(!url.startsWith('https://')||!token||token.length<32) throw Error('HTTPS endpoint and sync secret required');
  const docs=await build(root,manifest); // Validate the entire allowlist before touching the cloud.
  const endpoint=new URL('/sync',url);
  const headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'};
  async function call(method,data){const r=await fetch(endpoint,{method,headers,body:data?JSON.stringify(data):undefined,redirect:'error'});if(!r.ok)throw Error('Sync failed: HTTP '+r.status);return r.json();}
  const remote=await call('GET');if(remote.scope!==manifest.scope)throw Error('Endpoint scope mismatch');
  const existing=new Map(remote.documents.map(d=>[d.id,d.hash]));let changed=0;
  for(const d of docs)if(existing.get(d.id)!==d.hash){await call('POST',d);changed++;}
  const ids=new Set(docs.map(d=>d.id));for(const id of existing.keys())if(!ids.has(id)){await call('POST',{scope:manifest.scope,id,remove:true});changed++;}
  console.log(`${manifest.scope}: ${changed} document updates; ${docs.length} current documents`);
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [root,manifestPath]=process.argv.slice(2);const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
  if(process.env.SYNC_URL) await synchronize(root,manifest,process.env.SYNC_URL,process.env.SYNC_TOKEN);
  else {const docs=await build(root,manifest);console.log(`Validated ${docs.length} documents (${docs.reduce((n,d)=>n+d.chunks.length,0)} chunks). No upload.`);}
}
