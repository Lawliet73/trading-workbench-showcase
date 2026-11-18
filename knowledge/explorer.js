/* Knowledge explorer: a lightweight canvas view of the derived index.
   Layout: deterministic constellation anchors, a central framework hub,
   adjacent subject clusters and explicit reflow when the visible set changes.
   No force simulation or invented semantic distance. Camera orbits and pans
   smoothly around the chosen target; node positions represent navigation,
   not numerical similarity. Recorded links remain distinct from inferred ones. */
(() => {
  'use strict';
  const C = window.TWK, F = window.FW, qs = new URLSearchParams(location.search);
  const $ = s => document.querySelector(s), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  let G = window.FW_KNOWLEDGE, scope = 'index';
  if (!G) { const g = C.frameworkGraph(F, window.FW_LEARNING); G = C.readerGraph(g, window.TWK_EDUCATION, window.TWK_SHARED_EDUCATION); scope = 'public map only'; }
  const stress = +qs.get('stress') || 0;
  if (stress) { // synthetic graph for performance checks: ?stress=3000
    const nodes = [], edges = [], h = C.hash32;
    for (let i = 0; i < stress; i++) nodes.push({key: 'component:s' + i, type: 'component', id: 's' + i, title: 'Synthetic ' + i, summary: '', pub: 'public', facets: {q: 'Q' + (1 + h('q' + i) % 10)}, axes: {}, src: [{path: 'synthetic', at: ''}]});
    for (let i = 0; i < stress * 3; i++) { const a = h('a' + i) % stress, b = (a + 1 + h('b' + i) % 40) % stress; edges.push({s: 'component:s' + a, t: 'component:s' + b, rel: 'feeds', basis: 'recorded', at: 'synthetic'}); }
    G = {nodes, edges}; scope = 'synthetic stress graph';
  }
  const ix = C.index(G), nodes = G.nodes, n = nodes.length, at = new Map(nodes.map((nd, i) => [nd.key, i]));
  const deg = nodes.map(nd => C.degree(ix, nd.key)), grp = nodes.map(nd => C.TYPES[nd.type].group);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0=performance.now(),CL=window.TWK_CONSTELLATION;
  if(!CL)throw Error('Constellation layout unavailable');
  const lay={3:CL.layout(G,C),2:null},layoutMs=Math.round(performance.now()-t0);
  const HOLLOW = nd => ['milestone', 'log-proposal', 'open-decision', 'gap', 'proposal'].includes(nd.type) || (nd.type === 'target' && nd.axes.impl[0] !== 'exists') || (nd.axes.approval && /awaiting owner|not approved/.test(nd.axes.approval[0]) && nd.type === 'log');
  const hollow = nodes.map(HOLLOW);
  const E = G.edges.map(e => ({a: at.get(e.s), b: at.get(e.t), rel: e.rel, soft: !C.SOURCE_DERIVED[e.basis], e})).filter(e => e.a != null && e.b != null);
  const byEdge = new Map(E.map(e => [e.e, e]));

  /* ---- state --------------------------------------------------------------------------------------- */
  const cv = $('#stage'), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, mode = qs.get('mode') === '2d' ? '2d' : '3d', listOn = qs.get('mode') === 'list';
  const cam = {yaw: 0.5, pitch: -0.22, dist: 2300, tx: 0, ty: 0, tz: 0}, goal = Object.assign({}, cam), flat = {zoom: 0.5, px: 0, py: 0}, flatGoal = Object.assign({}, flat);
  let sel=-1,hover=-1,hl=null,hlMode='near',labels=true,motion=!reduce&&qs.get('motion')==='1',dirty=true,lastFrame=0;
  let relationMode='essential';
  const ESSENTIAL=new Set(['feeds','requires','in-module','classified-as','variant-of','explains','maps-to','corresponds-to','depends-on','answers']);
  const SOURCE_RELATIONS=new Set(['cites','taught-from','from-source','evidence']);
  const hiddenTypes = new Set(), hiddenGroups = new Set(); let showSoft = false, showCites = false;
  let colourBy = qs.get('colour') === 'status' ? 'status' : 'track', sizeBy = ['links', 'priority'].includes(qs.get('size')) ? qs.get('size') : 'role', level = ['standard', 'all'].includes(qs.get('level')) ? qs.get('level') : (stress ? 'all' : 'overview');
  const LEVELS = {overview: new Set(['question', 'module', 'family', 'target', 'entry']), standard: new Set(['question', 'module', 'family', 'target', 'entry', 'component', 'concept', 'variant', 'milestone', 'dispute', 'mquestion', 'claim', 'open-decision', 'view'])};
  let status = []; const ckey = i => colourBy === 'status' ? status[i] : grp[i], colOf = i => colourBy === 'status' ? theme.status[status[i]] : theme.group[grp[i]];
  // Size by structural role (default), by number of links, or by the registry's research-priority label. Connection count is
  // one option, never the definition of importance.
  const ROLE = {question: 30, module: 30, family: 26, target: 20, milestone: 10, entry: 12, component: 8, concept: 6, variant: 6, change: 10};
  const BAND = {'very high': 40, high: 25, 'medium–high': 16, medium: 9, 'low–medium': 4, low: 2, foundational: 20};
  const weight = nodes.map(nd => ({role: (ROLE[nd.type] || 2) * (nd.type === 'concept' && nd.facets.core ? 1.6 : 1), priority: (nd.type === 'entry' || nd.type === 'variant') ? (BAND[nd.facets.band] || BAND[(ix.byKey.get('entry:' + (nd.facets.parent || '')) || {facets: {}}).facets.band] || 4) : 1}));
  const sx = new Float32Array(n), sy = new Float32Array(n), ss = new Float32Array(n), sz = new Float32Array(n), vis = new Uint8Array(n);
  const theme = {}; let sprites = {};
  // Okabe-Ito colours: distinguishable with common colour-vision deficiencies. Track colouring and status colouring are
  // separate modes, so group membership is never confused with implementation, approval or evidence.
  const PAL = {dark: {framework: '#56B4E9', A: '#009E73', B: '#E69F00', shared: '#A6A6A6', decisions: '#CC79A7'}, light: {framework: '#0072B2', A: '#007A5A', B: '#C65A00', shared: '#6E6E6E', decisions: '#A23D84'}};
  const SPAL = {dark: {built: '#009E73', planned: '#56B4E9', proposed: '#CC79A7', candidate: '#E69F00', open: '#D55E00', rejected: '#7F7F7F', other: '#4D4D4D'}, light: {built: '#007A5A', planned: '#0072B2', proposed: '#A23D84', candidate: '#C65A00', open: '#B03A00', rejected: '#8C8C8C', other: '#BDBDBD'}};
  const SLABEL = {built: 'implemented / exists / studied', planned: 'planned / partly studied', proposed: 'proposed, not approved', candidate: 'research candidate, untested', open: 'open decision / not yet studied', rejected: 'rejected, superseded or closed', other: 'no implementation status'};
  const statusOf = nd => { const a = nd.axes || {}, ap = (a.approval || [''])[0], rec = [].concat((a.record || [''])[0]);
    if (nd.type === 'component') return a.impl[0]; if (nd.type === 'target') return a.impl[0] === 'exists' ? 'built' : 'proposed';
    if (nd.type === 'entry' || nd.type === 'variant') return 'candidate'; if (nd.type === 'concept') return !a.edu ? 'other' : /complete/.test(a.edu[0]) ? 'built' : /partial/.test(a.edu[0]) ? 'planned' : 'open';
    if (['milestone', 'log-proposal', 'proposal', 'gap'].includes(nd.type)) return 'proposed'; if (nd.type === 'open-decision' || /awaiting owner/.test(ap)) return 'open';
    if (ap === 'superseded' || rec.includes('closed') || (nd.type === 'lead' && rec[0] === 'rejected')) return 'rejected'; if (rec.includes('IMPLEMENTED')) return 'built'; if (rec.includes('DECIDED')) return 'planned'; return 'other'; };
  status = nodes.map(statusOf);
  function applyTheme(t) {
    if (t) document.documentElement.dataset.theme = t;
    const cs = getComputedStyle(document.documentElement), v = k => cs.getPropertyValue(k).trim();
    Object.assign(theme, {bg: v('--bg'), ink: v('--ink'), muted: v('--muted'), accent: v('--accent'), line: v('--line'), dark: document.documentElement.dataset.theme !== 'light'});
    theme.group = Object.assign({}, PAL[theme.dark ? 'dark' : 'light']); theme.status = Object.assign({}, SPAL[theme.dark ? 'dark' : 'light']);
    sprites = {};
    for (const [g, col] of Object.entries(Object.assign({}, theme.status, theme.group))) { // soft glow per group, used with additive blending on the dark theme only
      const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, col); gr.addColorStop(0.25, col + 'aa'); gr.addColorStop(0.6, col + '22'); gr.addColorStop(1, col + '00'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); sprites[g] = c;
    }
    legend(); dirty = true;
  }
  try { const saved = qs.get('theme') || localStorage.getItem('fwmap-theme'); applyTheme(saved === 'light' || saved === 'dark' ? saved : matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); } catch (e) { applyTheme('dark'); }

  /* ---- visibility, projection ---------------------------------------------------------------------- */
  let around = new Set(); // records revealed around the selection when the detail level hides them
  function fitVisible(){
    const keys=new Set(nodes.filter((nd,i)=>vis[i]).map(nd=>nd.key)),b=CL.bounds(G,lay[3].positions,keys);
    goal.tx=b.x;goal.ty=b.y;goal.tz=b.z;goal.dist=Math.max(1000,Math.min(7900,b.span*(W<760?1.35:1.3)));
    if(lay[2]){const v=CL.bounds(G,lay[2].positions,keys);flatGoal.px=v.x;flatGoal.py=v.y;flatGoal.zoom=Math.min(2.2,Math.min(W||900,H||700)*0.65/v.span);}
  }
  function refreshVisible(reflow=true,refit=true){
    const L=LEVELS[level];for(let i=0;i<n;i++)vis[i]=!hiddenTypes.has(nodes[i].type)&&!hiddenGroups.has(grp[i])&&(!L||L.has(nodes[i].type)||around.has(i))?1:0;
    if(reflow){const keys=new Set(nodes.filter((nd,i)=>vis[i]).map(nd=>nd.key));lay[3]=CL.layout(G,C,{visible:keys});if(lay[2])lay[2]=CL.layout(G,C,{visible:keys,dims:2});if(refit)fitVisible();}
    dirty=true;summary();if(listOn)list();
  }
  const edgeOn=e=>vis[e.a]&&vis[e.b]&&(
    relationMode==='all'?(showSoft||(!e.soft&&e.rel!=='mentions'))&&(showCites||e.rel!=='cites')
    :relationMode==='sources'?SOURCE_RELATIONS.has(e.rel)&&(showSoft||!e.soft)
    :(ESSENTIAL.has(e.rel)&&(showSoft||!e.soft))||(showCites&&e.rel==='cites')
  );
  function resize() { const first=W===0||H===0; dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); if(first)flat.zoom=flatGoal.zoom=Math.min(W,H)/2300; dirty = true; }
  function project() {
    const P = lay[mode === '2d' ? 2 : 3].positions;
    // Stable viewport origin: opening a detail panel must not teleport the graph.
    const ox = W / 2 - (W >= 960 ? 75 : 0), oy = H / 2 + 22;
    if (mode === '2d') { for (let i = 0; i < n; i++) { const p = P.get(nodes[i].key); sx[i] = ox + (p.x - flat.px) * flat.zoom; sy[i] = oy + (p.y - flat.py) * flat.zoom; ss[i] = flat.zoom * 2.1; sz[i] = 0; } return; }
    const cy = Math.cos(cam.yaw), syw = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), f = Math.min(W, H) * 1.15;
    for (let i = 0; i < n; i++) {
      const p = P.get(nodes[i].key), x = p.x - cam.tx, y = p.y - cam.ty, z = p.z - cam.tz;
      const x1 = x * cy + z * syw, z1 = -x * syw + z * cy, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp, zc = z2 + cam.dist;
      if (zc < 60) { ss[i] = 0; continue; }
      const s = f / zc; sx[i] = ox + x1 * s; sy[i] = oy + y1 * s; ss[i] = s; sz[i] = zc;
    }
  }
  const radius=i=>Math.max(2.0,(4+2.25*Math.sqrt(sizeBy==='links'?deg[i]:weight[i][sizeBy]))*ss[i]*(mode==='2d'?1:1.9));

  /* ---- drawing -------------------------------------------------------------------------------------- */
  const CLUSTER_NAME = c => { const [k, v] = c.split(':');
    if (k === 'Q') { const q = ix.byKey.get('question:' + v); return v + (q ? ' · ' + q.title.split(':')[0] : ''); }
    if (k === 'M') { const m = ix.byKey.get('module:' + v); return v + (m ? ' · ' + C.clip(m.title, 26) : ''); }
    if (k === 'F') { const f = ix.byKey.get('family:' + v); return f ? f.title : v; }
    if (k === 'leads') return 'Leads · ' + v; if (k === 'log') return 'Log · ' + ({D: 'decisions', I: 'implementation', F: 'fixes', L: 'limitations', O: 'open checks', R: 'research', M: 'methodology', A: 'audits', V: 'visualisation', T: 'tooling', S: 'spec', Q: 'questions'}[v] || v);
    if (k === 'registry') return 'Registry · ' + v; return c.charAt(0).toUpperCase() + c.slice(1); };
  function draw(now) {
    project();
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=theme.bg;ctx.fillRect(0,0,W,H);
    const regionPts=new Map();
    for(let i=0;i<n;i++)if(vis[i]&&ss[i]){const a=regionPts.get(grp[i])||[];a.push([sx[i],sy[i]]);regionPts.set(grp[i],a);}
    for(const [g,pts]of regionPts){
      const x=pts.reduce((v,p)=>v+p[0],0)/pts.length,y=pts.reduce((v,p)=>v+p[1],0)/pts.length;
      const r=Math.min(230,Math.max(60,...pts.map(p=>Math.hypot(p[0]-x,p[1]-y)+24)));
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=theme.group[g]+'07';ctx.strokeStyle=theme.group[g]+'44';ctx.lineWidth=1.1;ctx.fill();ctx.stroke();
      ctx.font='600 13px '+getComputedStyle(document.body).fontFamily;ctx.textAlign='center';ctx.fillStyle=theme.group[g];ctx.globalAlpha=.94;
      ctx.fillText(C.GROUPS[g].label,x,y-r+17);ctx.globalAlpha=1;ctx.textAlign='left';
    }
    const active=hl!==null,on=i=>!active||hl.has(i);
    // links: two batched paths (source-derived solid, the rest dashed), then highlighted links on top
    for (const softPass of [false, true]) {
      ctx.beginPath();
      for (const e of E) { if (e.soft !== softPass || !edgeOn(e) || !ss[e.a] || !ss[e.b] || (active && on(e.a) && on(e.b))) continue; ctx.moveTo(sx[e.a], sy[e.a]); ctx.lineTo(sx[e.b], sy[e.b]); }
      ctx.setLineDash(softPass ? [3, 4] : []); ctx.lineWidth = 0.7; ctx.strokeStyle = theme.muted; ctx.globalAlpha = active ? 0.05 : softPass ? 0.13 : 0.2; ctx.stroke();
    }
    if (active) for (const softPass of [false, true]) {
      ctx.beginPath();
      for (const e of E) { if (e.soft !== softPass || !edgeOn(e) || !ss[e.a] || !ss[e.b] || !(on(e.a) && on(e.b))) continue; if (hlMode === 'near' && e.a !== sel && e.b !== sel) continue; ctx.moveTo(sx[e.a], sy[e.a]); ctx.lineTo(sx[e.b], sy[e.b]); }
      ctx.setLineDash(softPass ? [3, 4] : []); ctx.lineWidth = 1.2; ctx.strokeStyle = theme.accent; ctx.globalAlpha = 0.8; ctx.stroke();
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    // cluster names, behind the nodes
    const clusterBoxes = [];
    if (labels) {
      const cl = new Map();
      for (let i = 0; i < n; i++) { if (!vis[i] || !ss[i]) continue; const c = lay[3].positions.get(nodes[i].key).cluster, a = cl.get(c) || cl.set(c, [0, 0, 0]).get(c); a[0] += sx[i]; a[1] += sy[i]; a[2]++; }
      ctx.font = '500 10px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center'; ctx.fillStyle = theme.muted; ctx.globalAlpha = active ? 0.25 : 0.7;
      for (const [c, a] of [...cl].sort((x, y) => y[1][2] - x[1][2])) { if (a[2] < 7) continue; const t = CLUSTER_NAME(c).toUpperCase(), w = ctx.measureText(t).width, x = a[0] / a[2], y = a[1] / a[2] - 16 - Math.sqrt(a[2]) * 2.6, box = [x - w / 2 - 4, y - 11, x + w / 2 + 4, y + 4];
        if (y < 62 || clusterBoxes.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue; clusterBoxes.push(box); ctx.fillText(t, x, y); }
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
    // nodes, far to near
    const order = []; for (let i = 0; i < n; i++) if (vis[i] && ss[i] && sx[i] > -40 && sx[i] < W + 40 && sy[i] > -40 && sy[i] < H + 40) order.push(i);
    if (mode !== '2d') order.sort((a, b) => sz[b] - sz[a]);
    if (theme.dark) { ctx.globalCompositeOperation = 'lighter';
      for (const i of order) { const r = radius(i) * 4.2; ctx.globalAlpha = on(i) ? (i === sel || i === hover ? 0.95 : 0.5) : 0.06; ctx.drawImage(sprites[ckey(i)], sx[i] - r, sy[i] - r, r * 2, r * 2); }
      ctx.globalCompositeOperation = 'source-over'; }
    for (const i of order) {
      const r = radius(i), col = colOf(i); ctx.globalAlpha = on(i) ? 1 : 0.14; ctx.beginPath(); ctx.arc(sx[i], sy[i], r, 0, 6.2832);
      if (hollow[i]) { const a = ctx.globalAlpha; ctx.fillStyle = theme.bg; ctx.fill(); ctx.globalAlpha = a * 0.3; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = a; ctx.lineWidth = Math.max(1.2, r * 0.42); ctx.strokeStyle = col; ctx.stroke(); } else { ctx.fillStyle = col; ctx.fill(); }
      if (i === sel || i === hover) { ctx.beginPath(); ctx.arc(sx[i], sy[i], r + 4, 0, 6.2832); ctx.lineWidth = 1.5; ctx.strokeStyle = theme.accent; ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    // labels: the selection, its highlighted set and the largest hubs, placed only where they do not collide
    if (labels) {
      const want = order.slice().sort((a, b) => (b === sel) - (a === sel) || (b === hover) - (a === hover) || (active ? on(b) - on(a) : 0) || deg[b] - deg[a]);
      const boxes = clusterBoxes.slice(); let count = 0; ctx.font = '11px ' + getComputedStyle(document.body).fontFamily;
      for (const i of want) {
        if (count >= (active ? 24 : 14) && i !== sel && i !== hover) break; if (active && !on(i)) continue;
        const nd = nodes[i], txt = (/^(entry|variant|log|logq|lead|dispute|mquestion|claim|milestone|module|open-decision|gap|proposal|log-proposal)$/.test(nd.type) ? nd.id.replace('redesign#', '#') + ' ' : '') + C.clip(nd.title, 28);
        const w = ctx.measureText(txt).width + 8, x = sx[i] + radius(i) + 5, y = sy[i] - 7, box = [x, y, x + w, y + 15];
        if (x + w > W - 4 || y < 58 || boxes.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
        boxes.push(box); count++; ctx.globalAlpha = 0.82; ctx.fillStyle = theme.bg; ctx.fillRect(x - 2, y, w, 15); ctx.globalAlpha = 1; ctx.fillStyle = i === sel ? theme.ink : theme.muted; ctx.fillText(txt, x + 2, y + 11);
      }
    }
    if (stress || qs.get('fps')) { const ms = performance.now() - now; $('#fps').textContent = `${n} nodes · ${E.length} links · layout ${layoutMs} ms · frame ${ms.toFixed(1)} ms`; }
  }
  function tick(now) {
    const elapsed=lastFrame?Math.max(1,Math.min(64,now-lastFrame)):16;
    // Frame-rate independent damping, with responsive drag and no spring overshoot.
    const alpha=reduce?1:1-Math.exp(-elapsed/(dragging?40:95));
    const ease = (o, g, keys) => { let moving = false; for (const k of keys) { const d = g[k] - o[k]; if (Math.abs(d) > 1e-3) { o[k] += d * alpha; moving = true; } else o[k] = g[k]; } return moving; };
    let moving = ease(cam, goal, ['yaw', 'pitch', 'dist', 'tx', 'ty', 'tz']); moving = ease(flat, flatGoal, ['zoom', 'px', 'py']) || moving;
    if (motion && mode === '3d' && !listOn && !dragging) { goal.yaw = cam.yaw = cam.yaw + Math.min(48, now - lastFrame) * 0.00006; moving = true; }
    if ((dirty || moving) && !listOn) { draw(now); dirty = false; }
    lastFrame = now; requestAnimationFrame(tick);
  }

  /* ---- selection and highlighting -------------------------------------------------------------------- */
  function highlight() {
    if (sel < 0) { hl = null; return; }
    const k = nodes[sel].key; let keys;
    if (hlMode === 'up' || hlMode === 'down') keys = [...C.dependencies(ix, k, hlMode === 'up').keys()];
    else keys = C.neighbours(ix, k, {}).filter(x => { const e = byEdge.get(x.edge); return e && edgeOn(e); }).map(x => x.node.key);
    hl = new Set([sel, ...keys.map(x => at.get(x))]);
  }
  function select(i, focus) {
    sel = i; around = new Set(i < 0 ? [] : [i, ...C.neighbours(ix, nodes[i].key, {}).map(x => at.get(x.node.key))]); refreshVisible(true,false); highlight(); detail(); dirty = true;
    // The shared assistant follows the selected graph node, without storing a second graph state.
    window.dispatchEvent(new CustomEvent('twk:record-selected', {detail:{key:i < 0 ? '' : nodes[i].key}}));
    if(i>=0&&focus){const p=lay[mode==='2d'?2:3].positions.get(nodes[i].key);if(mode==='2d'){flatGoal.px=p.x;flatGoal.py=p.y;flatGoal.zoom=Math.max(flatGoal.zoom,Math.min(W,H)/950);}else{goal.tx=p.x;goal.ty=p.y;goal.tz=p.z;goal.dist=Math.max(1000,Math.min(goal.dist,2150));}}
    $('#summary').textContent = i < 0 ? '' : `Selected ${C.TYPES[nodes[i].type].label} ${nodes[i].id}: ${nodes[i].title}. ${hl.size - 1} connected records highlighted.`;
  }
  const plainMd = t => String(t || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`>#]/g, '').replace(/\s+/g, ' ').trim();
  const para = t => (String(t || '').split(/\n\s*\n/).map(x => x.trim()).find(x => x && !/^#/.test(x) && !/^>/.test(x)) || '');
  // A short explanation of what the record is about, from the same derived content as the site. Labelled by its verification.
  function teachText(nd) {
    const CT = window.FW_CONTENT, LN = (window.FW_LEARNING || {}).lessons || {};
    if (!CT) return null;
    if (nd.type === 'concept') { const c = CT.concepts[nd.id]; if (!c) return null; const s0 = c.sections[0];
      return s0 ? {text: plainMd(para(s0.md)), v: c.verification.verification_status} : c.provisional ? {text: c.provisional.plain, v: c.provisional.verification.verification_status} : null; }
    if (nd.type === 'entry') { const comp = C.neighbours(ix, nd.key, {rels: ['maps-to'], dir: 'in'}).map(x => x.node)[0], e = CT.entries[nd.id];
      if (comp && LN[comp.id]) return {text: LN[comp.id], v: 'partially_verified'}; if (e && e.intro) return {text: e.intro.plain, v: 'ai_generated_unverified'};
      const m = e && e.parts.find(p => p.kind === 'mechanism'); return m ? {text: plainMd(m.md), v: 'partially_verified'} : null; }
    if (nd.type === 'variant' || nd.type === 'component') { const comp = nd.type === 'component' ? nd : C.neighbours(ix, nd.key, {rels: ['maps-to'], dir: 'in'}).map(x => x.node)[0]; return comp && LN[comp.id] ? {text: LN[comp.id], v: 'partially_verified'} : null; }
    if (nd.type === 'module') { const m = CT.modules[nd.id]; return m && m.purpose ? {text: m.purpose, v: m.verification.verification_status} : null; }
    if (nd.type === 'family') return {text: nd.summary, v: 'partially_verified'};
    return null;
  }
  const VTXT = {source_verified: 'From the study notes', partially_verified: 'Partly from recorded notes', ai_generated_unverified: 'AI-generated · Source verification pending'};
  function detail() {
    const box = $('#detail'); if (sel < 0) { box.hidden = true; return; }
    const nd = nodes[sel], T = C.TYPES[nd.type], groups = new Map();
    for (const x of C.neighbours(ix, nd.key, {})) { const label = x.dir === 'out' ? C.RELATIONS[x.edge.rel].label : C.RELATIONS[x.edge.rel].inverse; (groups.get(label) || groups.set(label, []).get(label)).push(x); }
    const axes = Object.entries(nd.axes || {}).map(([a, v]) => `<b>${esc(C.AXES[a].label)}:</b> ${esc([].concat(v[0]).join(', '))}${C.SOURCE_DERIVED[v[1]] ? '' : ' <span class="m">(' + esc(v[1]) + ')</span>'}`).join('<br>');
    const up = C.dependencies(ix, nd.key, true).size, down = C.dependencies(ix, nd.key, false).size;
    box.hidden = false;
    box.innerHTML = `<button class="xb" id="dx" type="button" style="float:right" aria-label="Clear selection">✕</button><span class="m">${esc(T.label)} · ${esc(C.GROUPS[T.group].label)}${nd.pub === 'public' ? '' : ' · private'}</span>
      <h2>${esc(nd.title)}</h2>${window.TWK_LEVELS?window.TWK_LEVELS.render(nd):(`<p>${esc(nd.summary||'')}</p>`)}
      ${axes ? `<details class="technical-only"><summary class="m">Statuses</summary><p>${axes}</p></details>` : ''}
      <div class="acts"><button class="xb" data-m="near" aria-pressed="${hlMode === 'near'}">Neighbours</button><button class="xb" data-m="up" aria-pressed="${hlMode === 'up'}" title="Everything this record depends on">Rests on (${up})</button><button class="xb" data-m="down" aria-pressed="${hlMode === 'down'}" title="Everything that depends on this record">Relied on by (${down})</button>
        <button class="xb" id="dc" type="button">Centre</button><button class="xb" id="do" type="button">Read the full explanation</button></div>
      <div class="technical-only">${[...groups].sort((a, b) => a[0].localeCompare(b[0])).map(([label, items]) => `<h3 title="${esc(C.RELATIONS[items[0].edge.rel].text)}">${esc(label)} (${items.length})</h3><p class="m" style="margin:-4px 0 6px">${esc(C.RELATIONS[items[0].edge.rel].text)}</p><div class="nb">${items.slice(0, 12).map(x => `<button type="button" class="${C.SOURCE_DERIVED[x.edge.basis] ? '' : 'soft'}" data-i="${at.get(x.node.key)}" title="${esc(C.BASIS[x.edge.basis].label)}"><code>${esc(x.node.id)}</code> ${esc(C.clip(x.node.title, 30))}</button>`).join('')}${items.length > 12 ? `<span class="m">+${items.length - 12} more in “Open details”</span>` : ''}</div>`).join('') || '<p class="m">No link is recorded for this record.</p>'}
      </div><details class="technical-only"><summary class="m">Identifier and record source</summary><p class="m"><code>${esc(nd.id)}</code></p><p class="m">${nd.src.map(s => esc(s.path) + ' · ' + esc(s.at) + (s.ref ? ' · on ' + esc(s.ref) : '')).join('<br>')}</p></details><p class="m technical-only">Dashed buttons are inferred, derived or proposed links.</p>`;
    $('#dx').onclick = () => select(-1); $('#dc').onclick = () => select(sel, true);
    $('#do').onclick = () => { if (parent !== window) parent.postMessage({type: 'twk:open', key: nd.key, link: nd.link||''}, location.origin); else location.href = '../index.html#' + (nd.type === 'component' ? 'tab=components&c=' + encodeURIComponent(nd.id) : 'tab=graph&k=' + encodeURIComponent(nd.key)); };
    box.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { hlMode = b.dataset.m; highlight(); detail(); dirty = true; });
    box.querySelectorAll('[data-i]').forEach(b => b.onclick = () => select(+b.dataset.i, true));
  }

  /* ---- panels ------------------------------------------------------------------------------------------ */
  function filters() {
    const types = new Map(); for (const nd of nodes) types.set(nd.type, (types.get(nd.type) || 0) + 1);
    const groups = Object.keys(C.GROUPS).filter(g => grp.includes(g));
    $('#filters').innerHTML = `<h3>Tracks</h3>${groups.map(g => `<label><input type="checkbox" data-g="${g}" checked><span class="sw" style="background:${theme.group[g]}"></span>${esc(C.GROUPS[g].label)}<span class="c">${grp.filter(x => x === g).length}</span></label>`).join('')}
      <h3>Record types</h3>${Object.keys(C.TYPES).filter(t => types.has(t)).map(t => `<label><input type="checkbox" data-t="${t}" checked>${esc(C.TYPES[t].plural)}<span class="c">${types.get(t)}</span></label>`).join('')}
      <h3>Links</h3><label><input type="checkbox" id="fsoft">Include inferred links<span class="c">${E.filter(e => e.soft || e.rel === 'mentions').length}</span></label><label><input type="checkbox" id="fcite">Also show citations in Main relationships<span class="c">${E.filter(e => e.rel === 'cites').length}</span></label>
      <p class="m" style="font-size:11px;color:var(--muted);margin:10px 0 0">Visible records reflow inside stable regions. Filters do not delete any record. ${scope === 'index' ? '' : 'Showing the ' + esc(scope) + '.'}</p>`;
    $('#filters').querySelectorAll('[data-g]').forEach(c=>{c.checked=!hiddenGroups.has(c.dataset.g);c.onchange=()=>{c.checked?hiddenGroups.delete(c.dataset.g):hiddenGroups.add(c.dataset.g);$('#sfocus').value='all';refreshVisible();highlight();};});
    $('#filters').querySelectorAll('[data-t]').forEach(c=>{c.checked=!hiddenTypes.has(c.dataset.t);c.onchange=()=>{c.checked?hiddenTypes.delete(c.dataset.t):hiddenTypes.add(c.dataset.t);refreshVisible();highlight();};});
    $('#fsoft').checked=showSoft;$('#fcite').checked=showCites;
    $('#fsoft').onchange = e => { showSoft = e.target.checked; highlight(); dirty = true; }; $('#fcite').onchange = e => { showCites = e.target.checked; highlight(); dirty = true; };
  }
  function legend() {
    if (!theme.group) return;
    const colours = colourBy === 'status' ? Object.keys(SLABEL).filter(k => status.includes(k)).map(k => `<span><i style="background:${theme.status[k]}"></i>${esc(SLABEL[k])}</span>`) : Object.keys(C.GROUPS).filter(g => grp.includes(g)).map(g => `<span><i style="background:${theme.group[g]}"></i>${esc(C.GROUPS[g].label)}</span>`);
    const sz = {role: 'larger dot: structural role (module, family, question, target component)', links: 'larger dot: more links', priority: 'larger dot: higher research priority in the registry (a judgement, not evidence)'}[sizeBy];
    $('#legend').innerHTML = colours.join('') + `<span><i style="background:none;border:2px solid ${theme.muted}"></i>ring: proposal or open decision</span><span><span class="ln"></span>recorded or stated link</span><span><span class="ln d"></span>inferred, derived or proposed</span><span>${esc(sz)}</span><span><b>Position groups related records. Distance is not a measurement.</b></span>` +
      (level !== 'all' ? `<span>Showing ${level === 'overview' ? 'the overview' : 'the main records'}: select a record to reveal what it links to, or choose “Everything”.</span>` : '');
  }

  function summary() { const shown = vis.reduce((a, b) => a + b, 0); cv.setAttribute('aria-label', `Knowledge graph, ${shown} of ${n} records shown. Drag to rotate, scroll to zoom, arrow keys rotate, plus and minus zoom. A list view of the same records is in the toolbar.`); }
  function list() {
    const q = $('#q').value.trim().toLowerCase(), by = new Map();
    for (let i = 0; i < n; i++) if (vis[i] && (!q || (nodes[i].id + ' ' + nodes[i].title).toLowerCase().includes(q))) (by.get(nodes[i].type) || by.set(nodes[i].type, []).get(nodes[i].type)).push(i);
    $('#listview').innerHTML = `<p style="margin:0;color:var(--muted)">The same records as the graph, as text. Filters and the search box apply. Select a record to see its links.</p>` +
      Object.keys(C.TYPES).filter(t => by.has(t)).map(t => `<h3>${esc(C.TYPES[t].plural)} (${by.get(t).length})</h3><ul>${by.get(t).map(i => `<li><button type="button" data-i="${i}"><code>${esc(nodes[i].id)}</code>${esc(C.clip(nodes[i].title, 70))}</button></li>`).join('')}</ul>`).join('');
    $('#listview').querySelectorAll('[data-i]').forEach(b => b.onclick = () => select(+b.dataset.i));
  }
  function setMode(m) {
    listOn = m === 'list'; if (!listOn) mode = m;
    if(mode==='2d'&&!lay[2]){const keys=new Set(nodes.filter((nd,i)=>vis[i]).map(nd=>nd.key));lay[2]=CL.layout(G,C,{visible:keys,dims:2});const b=CL.bounds(G,lay[2].positions,keys);flatGoal.px=b.x;flatGoal.py=b.y;flatGoal.zoom=Math.min(2.2,Math.min(W||900,H||700)*0.65/b.span);}
    $('#b3d').setAttribute('aria-pressed', !listOn && mode === '3d'); $('#b2d').setAttribute('aria-pressed', !listOn && mode === '2d'); $('#blist').setAttribute('aria-pressed', listOn);
    $('#listview').hidden = !listOn; cv.style.visibility = listOn ? 'hidden' : 'visible'; $('#legend').style.display = listOn ? 'none' : ''; if (listOn) list(); dirty = true;
  }
  function reset(){sel=-1;around.clear();hiddenGroups.clear();hiddenTypes.clear();level='overview';$('#slevel').value=level;$('#sfocus').value='all';filters();refreshVisible();highlight();detail();Object.assign(goal,{yaw:0.18,pitch:-0.2});dirty=true;}

  /* ---- input ---------------------------------------------------------------------------------------------- */
  const ptr = new Map(); let dragging = false, moved = 0, gesture = false;
  function pick(x, y) { let best = -1, bd = 1e9; for (let i = 0; i < n; i++) { if (!vis[i] || !ss[i]) continue; const dx = sx[i] - x, dy = sy[i] - y, d = dx * dx + dy * dy, r = Math.max(radius(i) + 5, 9); if (d < r * r && d < bd) { bd = d; best = i; } } return best; }
  function pan(dx,dy){
    if(mode==='2d'){flatGoal.px-=dx/flatGoal.zoom;flatGoal.py-=dy/flatGoal.zoom;return;}
    const k=cam.dist/(Math.min(W,H)*1.15),cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw),cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);
    // Invert the same screen-plane axes used by project(). This keeps panning
    // horizontal/vertical even when the user tilts the constellation.
    goal.tx-=k*(dx*cy+dy*sy*sp);
    goal.ty-=k*dy*cp;
    goal.tz-=k*(dx*sy-dy*cy*sp);
  }
  function pair(){
    if(ptr.size!==2)return null;
    const [[ax,ay],[bx,by]]=[...ptr.values()];
    return {x:(ax+bx)/2,y:(ay+by)/2,d:Math.hypot(bx-ax,by-ay)};
  }

  cv.addEventListener('pointerdown',e=>{
    if(!ptr.size){moved=0;gesture=false;}
    cv.setPointerCapture(e.pointerId);
    ptr.set(e.pointerId,[e.clientX,e.clientY]);
    if(ptr.size>1)gesture=true;
    dragging=true;cv.classList.add('drag');
    if(motion){motion=false;$('#bmotion').setAttribute('aria-pressed','false');}
  });
  cv.addEventListener('pointermove',e=>{
    const bounds=cv.getBoundingClientRect(),x=e.clientX-bounds.left,y=e.clientY-bounds.top;
    if(!ptr.has(e.pointerId)){
      const h=pick(x,y);if(h!==hover){hover=h;cv.classList.toggle('hit',h>=0);cv.title=h>=0?C.TYPES[nodes[h].type].label+': '+nodes[h].title:'';dirty=true;}
      return;
    }
    const before=pair(),previous=ptr.get(e.pointerId);
    const dx=e.clientX-previous[0],dy=e.clientY-previous[1];
    ptr.set(e.pointerId,[e.clientX,e.clientY]);
    moved+=Math.abs(dx)+Math.abs(dy);
    if(ptr.size===2){
      gesture=true;
      const after=pair();
      if(before&&after){
        pan(after.x-before.x,after.y-before.y);
        if(before.d>8&&after.d>8)zoom(before.d/after.d,after.x-bounds.left,after.y-bounds.top);
      }
      dirty=true;return;
    }
    if(mode==='2d'||e.shiftKey||(e.buttons&2)||(e.buttons&4))pan(dx,dy);
    else {goal.yaw+=dx*0.005;goal.pitch=Math.max(-1.35,Math.min(1.35,goal.pitch+dy*0.005));}
    dirty=true;
  });
  const up=e=>{
    const bounds=cv.getBoundingClientRect();
    const tap=ptr.size===1&&!gesture&&moved<6&&e.type==='pointerup'&&e.button===0;
    ptr.delete(e.pointerId);
    if(!ptr.size){dragging=false;cv.classList.remove('drag');}
    if(tap){const i=pick(e.clientX-bounds.left,e.clientY-bounds.top);select(i,i>=0);}
  };
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('dblclick',e=>{
    const bounds=cv.getBoundingClientRect(),i=pick(e.clientX-bounds.left,e.clientY-bounds.top);
    if(i>=0)select(i,true);
  });
  function zoom(k,px,py){
    if(mode==='2d'){
      const old=flatGoal.zoom,next=Math.max(0.12,Math.min(6,old/k));
      if(Number.isFinite(px)&&Number.isFinite(py)){
        const ox=W/2-(W>=960?75:0),oy=H/2+22;
        flatGoal.px+=(px-ox)*(1/old-1/next);
        flatGoal.py+=(py-oy)*(1/old-1/next);
      }
      flatGoal.zoom=next;
    }else{
      const old=goal.dist,next=Math.max(260,Math.min(7900,old*k));
      if(Number.isFinite(px)&&Number.isFinite(py)){
        const ox=W/2-(W>=960?75:0),oy=H/2+22;
        const k=(old-next)/(Math.min(W,H)*1.15),cy=Math.cos(goal.yaw),sy=Math.sin(goal.yaw),cp=Math.cos(goal.pitch),sp=Math.sin(goal.pitch);
        goal.tx+=k*((px-ox)*cy+(py-oy)*sy*sp);
        goal.ty+=k*(py-oy)*cp;
        goal.tz+=k*((px-ox)*sy-(py-oy)*cy*sp);
      }
      goal.dist=next;
    }
    dirty=true;
  }
  cv.addEventListener('wheel',e=>{
    e.preventDefault();
    const bounds=cv.getBoundingClientRect();
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?H:1);
    zoom(Math.exp(Math.max(-900,Math.min(900,delta))*0.0011),e.clientX-bounds.left,e.clientY-bounds.top);
  },{passive:false});
  cv.addEventListener('keydown', e => { const k = e.key, st = 0.12;
    if (k === 'ArrowLeft') mode === '2d' ? flatGoal.px -= 60 / flat.zoom : goal.yaw -= st; else if (k === 'ArrowRight') mode === '2d' ? flatGoal.px += 60 / flat.zoom : goal.yaw += st;
    else if (k === 'ArrowUp') mode === '2d' ? flatGoal.py -= 60 / flat.zoom : goal.pitch = Math.max(-1.45, goal.pitch - st); else if (k === 'ArrowDown') mode === '2d' ? flatGoal.py += 60 / flat.zoom : goal.pitch = Math.min(1.45, goal.pitch + st);
    else if (k === '+' || k === '=') zoom(0.8); else if (k === '-') zoom(1.25); else if (k === 'Escape') select(-1); else if (k === 'Home') reset(); else if (k === 'Enter' && hover >= 0) select(hover, true); else if (k === '/') { $('#q').focus(); } else return;
    e.preventDefault(); dirty = true; });
  const q = $('#q'), hits = $('#hits');
  function selectSearchHit(i){
    // The global search can reveal a record excluded by region or type filters.
    const changedGroup=hiddenGroups.has(grp[i]);
    if(changedGroup)hiddenGroups.clear();
    const changedType=hiddenTypes.delete(nodes[i].type);
    if(changedGroup||changedType){$('#sfocus').value='all';filters();}
    select(i,true);
  }
  q.oninput = () => { const t = q.value.trim().toLowerCase(); if (listOn) list();
    const found = t ? nodes.map((nd, i) => [i, nd.id.toLowerCase() === t ? 0 : nd.id.toLowerCase().startsWith(t) ? 1 : (nd.id + ' ' + nd.title).toLowerCase().includes(t) ? 2 : 9]).filter(x => x[1] < 9).sort((a, b) => a[1] - b[1] || deg[b[0]] - deg[a[0]]).slice(0, 9) : [];
    hits.classList.toggle('on', found.length > 0); hits.innerHTML = found.map(([i]) => `<button type="button" role="option" data-i="${i}"><code>${esc(nodes[i].id)}</code>${esc(C.clip(nodes[i].title, 60))} <span style="color:var(--muted)">· ${esc(C.TYPES[nodes[i].type].label)}</span></button>`).join('');
    hits.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { selectSearchHit(+b.dataset.i); hits.classList.remove('on'); q.value = ''; if (listOn) list(); }); };
  q.onkeydown = e => { if (e.key === 'Enter') { const b = hits.querySelector('[data-i]'); if (b) b.click(); } else if (e.key === 'Escape') { hits.classList.remove('on'); q.blur(); } else if (e.key === 'ArrowDown') { const b = hits.querySelector('[data-i]'); if (b) { b.focus(); e.preventDefault(); } } };
  const sel3 = (id, fn) => { const e = $(id); if (e) e.onchange = () => { fn(e.value); legend(); dirty = true; }; };
  sel3('#slevel',v=>{level=v;refreshVisible();highlight();});sel3('#scolour',v=>{colourBy=v;});sel3('#ssize',v=>{sizeBy=v;});
  sel3('#srel',v=>{relationMode=v;highlight();dirty=true;});
  sel3('#sfocus',v=>{hiddenGroups.clear();if(v!=='all'){for(const g of Object.keys(C.GROUPS))if(g!==v)hiddenGroups.add(g);level=innerWidth<760?'overview':'standard';}else level='overview';
    $('#slevel').value=level;filters();sel=-1;around.clear();highlight();detail();refreshVisible();});
  if ($('#slevel')) { $('#slevel').value = level; $('#scolour').value = colourBy; $('#ssize').value = sizeBy; }
  $('#b3d').onclick = () => setMode('3d'); $('#b2d').onclick = () => setMode('2d'); $('#blist').onclick = () => setMode(listOn ? mode : 'list'); $('#breset').onclick = reset;
  const advanced=$('#advanced-controls'),advancedBtn=$('#badvanced');
  advancedBtn.onclick=()=>{advanced.hidden=!advanced.hidden;advancedBtn.setAttribute('aria-expanded',String(!advanced.hidden));};
  $('#bfilters').onclick = e => { const f = $('#filters'); f.hidden = !f.hidden; e.target.setAttribute('aria-pressed', !f.hidden); dirty = true; };
  $('#blabels').onclick = e => { labels = !labels; e.target.setAttribute('aria-pressed', labels); dirty = true; };
  $('#bmotion').onclick = e => { motion = !motion && !reduce; e.target.setAttribute('aria-pressed', motion); if (reduce) e.target.title = 'Reduced motion is requested by the system, so rotation stays off.'; };
  addEventListener('resize', resize);
  addEventListener('message', e => { const d = e.data || {}; if (d.type === 'twk:theme') { applyTheme(d.theme); filters(); } if (d.type === 'twk:focus' && at.has(d.key)) select(at.get(d.key), true); });

  /* ---- start ------------------------------------------------------------------------------------------------ */
  if (innerWidth < 760 || qs.get('filters') !== '1') { $('#filters').hidden = true; $('#bfilters').setAttribute('aria-pressed', 'false'); } // overview first; filters on request
  $('#bmotion').setAttribute('aria-pressed',motion);
  const help=$('#bhidehelp');if(help)help.onclick=()=>{$('#graphhelp').hidden=true;};
  // Phones begin with one understandable region, not three tiny constellations
  // competing for a 390px-wide canvas. All regions remain one tap away.
  if(innerWidth<760&&!qs.has('focus')&&!qs.has('level')&&!qs.has('region')){
    for(const g of Object.keys(C.GROUPS))if(g!=='framework')hiddenGroups.add(g);
    level='overview';$('#sfocus').value='framework';$('#slevel').value=level;
    const tip=$('#graphhelp');if(tip)tip.firstChild.textContent='Start with Framework. Use Explore to change regions. Drag to orbit, Shift + drag to pan, and pinch to zoom. ';
  }
  resize();refreshVisible();filters();setMode(listOn?'list':mode);
  // Snap to the initial fit to avoid a distracting oversized fly-in as the
  // asynchronous graph scripts finish loading; later moves still ease.
  Object.assign(cam,goal);Object.assign(flat,flatGoal);
  if (qs.get('focus') && at.has(qs.get('focus'))) select(at.get(qs.get('focus')), true);
  window.TWK_EXPLORER = {select: k => select(at.has(k) ? at.get(k) : -1, true), setLevel: v => { level = v; refreshVisible(); legend(); }, visible: () => vis.reduce((a, b) => a + b, 0), state: () => ({n, links: E.length, layoutMs, mode, listOn, sel: sel >= 0 ? nodes[sel].key : null, highlighted: hl ? hl.size : 0, scope}), setMode, screen: k => { const i = at.get(k); return i == null ? null : [sx[i], sy[i]]; }};
  requestAnimationFrame(tick);
  if (parent !== window) parent.postMessage({type: 'twk:ready'}, '*');
})();
