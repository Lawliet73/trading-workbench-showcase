/* Hierarchical constellation placement for the Knowledge Explorer.
   3D stays the default. Group regions are separated by design; no spring may
   drag two unrelated regions into each other. Filters reflow the visible subset.
   This is a presentation index, not a measurement of conceptual similarity.
   Export pure helper for deterministic Node tests and attach it in the browser. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TWK_CONSTELLATION=api;
})(typeof window==='object'?window:null,function(){
  'use strict';
  const ORDER=['framework','A','B','shared','decisions'];
  const PHI=Math.PI*(3-Math.sqrt(5));
  const KEY=nd=>nd.key||nd.id||'';
  const round=n=>Math.round(n*10)/10;
  // The Framework is the visual hub; Foundations and Research flank it.
  // Evidence sits above and Decisions below. Do not imply that numeric
  // distances measure similarity or that planned components already run.
  const ANCHORS={
    framework:{x:0,y:0,z:0},
    A:{x:-1500,y:120,z:220},
    B:{x:1500,y:120,z:-220},
    shared:{x:0,y:-1450,z:-160},
    decisions:{x:0,y:1450,z:160}
  };
  const anchor=(g,dims)=>{
    const a=ANCHORS[g]||ANCHORS.shared;
    return {x:a.x,y:a.y,z:dims===2?0:a.z};
  };
  function layout(graph,C,options={}){
    const dims=options.dims===2?2:3,chosen=options.visible&&typeof options.visible.has==='function'?options.visible:null;
    const nodes=graph.nodes||[], positions=new Map(),clusters=[];
    const groups=new Map();
    for(const nd of nodes){
      const g=(C.TYPES[nd.type]||{}).group||'shared';
      const group=groups.get(g)||new Map();
      const name=C.clusterOf(nd);
      const list=group.get(name)||[];
      list.push(nd);group.set(name,list);groups.set(g,group);
    }
    for(const g of ORDER){
      const group=groups.get(g);if(!group)continue;
      const main=anchor(g,dims);
      const buckets=[...group].sort((a,b)=>a[0].localeCompare(b[0]));
      // Invisible records are not allowed to consume space in a filtered view.
      const active=buckets.filter(([,items])=>!chosen||items.some(n=>chosen.has(KEY(n))));
      const count=active.length,ring=Math.max(250,Math.min(520,110*Math.sqrt(count)));
      active.forEach(([name,items],ci)=>{
        const ca=ci*PHI,rr=count===1?0:ring*Math.sqrt((ci+0.45)/(count+0.2));
        const cx=main.x+Math.cos(ca)*rr,cy=main.y+Math.sin(ca)*rr;
        const cz=main.z+(dims===2?0:125*Math.sin(ca*1.7));
        const members=items.filter(n=>!chosen||chosen.has(KEY(n))).sort((a,b)=>KEY(a).localeCompare(KEY(b)));
        const countN=members.length;
        clusters.push({name,group:g,x:round(cx),y:round(cy),z:round(cz),size:countN});
        members.forEach((nd,ni)=>{
          // Hierarchical hubs occupy the middle; satellites occupy well-spaced
          // spiral shells. This deliberate spacing is not a force-graph effect.
          const hub=['question','module','family','target','milestone'].includes(nd.type);
          const radius=countN===1?0:hub&&ni===0?0:Math.min(310,47*Math.sqrt(ni+0.5));
          const a=ni*PHI;
          positions.set(KEY(nd),{x:round(cx+radius*Math.cos(a)),y:round(cy+radius*Math.sin(a)),z:round(cz+(dims===2?0:Math.min(165,25*Math.sqrt(ni))*Math.sin(a*1.6))),cluster:name,degree:0});
        });
      });
    }
    // Keep hidden records addressable for search/keyboard focus. Recalculated
    // when revealed, without letting them compress the displayed positions.
    for(const nd of nodes)if(!positions.has(KEY(nd))){
      const g=(C.TYPES[nd.type]||{}).group||'shared',p=anchor(g,dims);
      positions.set(KEY(nd),{x:round(p.x),y:round(p.y),z:round(p.z),cluster:C.clusterOf(nd),degree:0});
    }
    return {positions,clusters};
  }
  function bounds(graph,positions,visible){
    let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity,zmin=Infinity,zmax=-Infinity,n=0;
    for(const nd of graph.nodes){
      if(visible&&!visible.has(KEY(nd)))continue;
      const p=positions.get(KEY(nd));if(!p)continue;
      xmin=Math.min(xmin,p.x);xmax=Math.max(xmax,p.x);
      ymin=Math.min(ymin,p.y);ymax=Math.max(ymax,p.y);
      zmin=Math.min(zmin,p.z);zmax=Math.max(zmax,p.z);n++;
    }
    return n?{x:(xmin+xmax)/2,y:(ymin+ymax)/2,z:(zmin+zmax)/2,span:Math.max(500,xmax-xmin,ymax-ymin,(zmax-zmin)*1.2),count:n}:{x:0,y:0,z:0,span:2800,count:0};
  }
  return {layout,bounds,ORDER};
});
