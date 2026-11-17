/* Trading Workbench knowledge core.
   One model for the derived knowledge graph, shared by the generator (Node, scripts/knowledge/) and the
   browser views (knowledge.js, explorer.js). Classic script on purpose: the map is opened from file:// too.

   The graph is a DERIVED view. Canonical records stay authoritative; nothing here stores a fact of its own.
   Vocabulary of node types, relations and edge bases lives here so that Markdown, dashboard and explorer
   label the same thing the same way. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TWK = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---- vocabulary ------------------------------------------------------------------------------- */
  // group: which region of the map a type belongs to. Track A and Track B follow the two-track design (TTD-2).
  const TYPES = {
    question:        { label: 'Framework question', plural: 'Framework questions', group: 'framework', hue: 'planned' },
    component:       { label: 'Component', plural: 'Components', group: 'framework', hue: 'planned' },
    target:          { label: 'Target component (proposed)', plural: 'Target components (proposed)', group: 'framework', hue: 'proposed' },
    milestone:       { label: 'Roadmap milestone (proposed)', plural: 'Roadmap milestones (proposed)', group: 'framework', hue: 'proposed' },
    view:            { label: 'Diagram', plural: 'Diagrams', group: 'framework', hue: 'rejected' },
    gap:             { label: 'Recorded gap', plural: 'Recorded gaps', group: 'decisions', hue: 'open' },
    proposal:        { label: 'Unadopted proposal', plural: 'Unadopted proposals', group: 'decisions', hue: 'proposed' },
    'open-decision': { label: 'Open decision', plural: 'Open decisions', group: 'decisions', hue: 'open' },
    document:        { label: 'Source document', plural: 'Source documents', group: 'shared', hue: 'rejected' },
    module:          { label: 'Curriculum module', plural: 'Curriculum modules', group: 'A', hue: 'built' },
    concept:         { label: 'Concept', plural: 'Concepts', group: 'A', hue: 'built' },
    source:          { label: 'Study source', plural: 'Study sources', group: 'shared', hue: 'rejected' },
    claim:           { label: 'Claim', plural: 'Claims', group: 'shared', hue: 'candidate' },
    entry:           { label: 'Registry entry', plural: 'Registry entries', group: 'B', hue: 'candidate' },
    variant:         { label: 'Strategy variation', plural: 'Strategy variations', group: 'B', hue: 'candidate' },
    family:          { label: 'Strategy family', plural: 'Strategy families', group: 'B', hue: 'candidate' },
    lead:            { label: 'Research lead', plural: 'Research leads', group: 'B', hue: 'candidate' },
    dispute:         { label: 'Dispute', plural: 'Disputes', group: 'B', hue: 'open' },
    mquestion:       { label: 'Methodology question', plural: 'Methodology questions', group: 'B', hue: 'open' },
    experiment:      { label: 'Experiment', plural: 'Experiments', group: 'B', hue: 'candidate' },
    log:             { label: 'Log entry', plural: 'Log entries', group: 'decisions', hue: 'proposed' },
    logq:            { label: 'Log question', plural: 'Log questions', group: 'decisions', hue: 'open' },
    'log-proposal':  { label: 'Proposed log entry (not written)', plural: 'Proposed log entries (not written)', group: 'decisions', hue: 'proposed' },
    change:          { label: 'OpenSpec change', plural: 'OpenSpec changes', group: 'decisions', hue: 'proposed' }
  };

  const GROUPS = {
    framework: { label: 'Framework', text: 'Architecture components and the ten framework questions.' },
    A:         { label: 'Track A · Foundations', text: 'Curriculum: modules, concepts, prerequisites, study depth.' },
    B:         { label: 'Track B · Edge discovery', text: 'Registry entries, variations, leads, disputes, methodology questions, experiments.' },
    shared:    { label: 'Shared evidence', text: 'Claims, study sources and source documents used by both tracks.' },
    decisions: { label: 'Decisions', text: 'Project log entries, open decisions, gaps, proposals and OpenSpec changes.' }
  };

  // strength: pull of the edge in the layout (0..1). It orders how tightly related things sit; it is not a
  // statistic, and distance on screen is never a measured similarity.
  const RELATIONS = {
    feeds:            { label: 'feeds', inverse: 'needs', strength: 0.55, text: 'Supplies information or capability to.' },
    answers:          { label: 'belongs to', inverse: 'groups', strength: 0.5, text: 'Component is filed under this framework question.' },
    shows:            { label: 'shows', inverse: 'appears in', strength: 0.1, text: 'Diagram guide names this component.' },
    concerns:         { label: 'concerns', inverse: 'is concerned by', strength: 0.3, text: 'Gap, dispute, question or decision is about this record.' },
    addresses:        { label: 'addresses', inverse: 'is addressed by', strength: 0.45, text: 'Proposal responds to this gap.' },
    cites:            { label: 'cites', inverse: 'is cited by', strength: 0.06, text: 'Record names this document as a source.' },
    'in-module':      { label: 'in module', inverse: 'contains', strength: 0.7, text: 'Concept belongs to this curriculum module.' },
    requires:         { label: 'requires', inverse: 'is prerequisite of', strength: 0.8, text: 'Concept needs this concept first.' },
    explains:         { label: 'explains', inverse: 'is explained by', strength: 0.5, text: 'Concept is needed to evaluate this registry entry.' },
    'taught-from':    { label: 'taught from', inverse: 'teaches', strength: 0.15, text: 'Concept is studied from chapters of this source.' },
    evidence:         { label: 'is evidence on', inverse: 'has evidence', strength: 0.6, text: 'Claim bears on this record, in the stated role.' },
    'from-source':    { label: 'taken from', inverse: 'yields claim', strength: 0.2, text: 'Claim is taken from this source or experiment.' },
    'contradicted-by':{ label: 'contradicted by', inverse: 'contradicts', strength: 0.4, text: 'Claim is contradicted by this claim, dispute or question.' },
    'maps-to':        { label: 'maps to', inverse: 'is mapped by', strength: 0.6, text: 'Framework component represents this registry entry or variation.' },
    'classified-as':  { label: 'classified as', inverse: 'classifies', strength: 0.65, text: 'Strategy family of the record.' },
    'variant-of':     { label: 'variant of', inverse: 'has variant', strength: 0.8, text: 'Variation of this registry entry.' },
    suggests:         { label: 'suggests', inverse: 'is suggested by', strength: 0.12, text: 'Module default link (a suggestion in code, not a curated link).' },
    supersedes:       { label: 'supersedes', inverse: 'superseded by', strength: 0.5, text: 'Log entry replaces this entry.' },
    closes:           { label: 'closes', inverse: 'closed by', strength: 0.4, text: 'Log entry closes this limitation or open item.' },
    'merged-into':    { label: 'merged into', inverse: 'absorbed', strength: 0.5, text: 'Record was folded into this record; history kept.' },
    'evidenced-by':   { label: 'evidenced by', inverse: 'is evidence for', strength: 0.3, text: 'Component status cites this log entry.' },
    tests:            { label: 'tests', inverse: 'is tested by', strength: 0.7, text: 'Experiment bears on this registry entry.' },
    blocks:           { label: 'blocks', inverse: 'is blocked by', strength: 0.4, text: 'Open decision must be settled before this can proceed.' },
    delivers:         { label: 'delivers', inverse: 'is delivered by', strength: 0.5, text: 'Roadmap milestone contains work on this target component.' },
    'depends-on':     { label: 'depends on', inverse: 'is needed by', strength: 0.5, text: 'Milestone needs this milestone or owner decision first.' },
    'planned-in':     { label: 'planned in', inverse: 'plans', strength: 0.3, text: 'The review names this milestone as the prerequisite or home of the record.' },
    'bears-on':       { label: 'bears on', inverse: 'is affected by', strength: 0.35, text: 'Proposed log entry would amend, supersede part of, or bear on this entry.' },
    revises:          { label: 'would change', inverse: 'would be changed by', strength: 0.3, text: 'The proposal names this map node as one that would change if it were approved.' },
    'corresponds-to': { label: 'corresponds to', inverse: 'corresponds to', strength: 0.45, text: 'Target component covers the same responsibility as this current map component.' },
    mentions:         { label: 'mentions', inverse: 'is mentioned by', strength: 0.08, text: 'Identifier appears in the text. The kind of relation is not recorded.' }
  };

  // How we know an edge or a classification value exists. Only the first two are source-derived.
  const BASIS = {
    recorded:  { label: 'Recorded', rank: 0, text: 'Stored in a typed field or column of a canonical record.' },
    stated:    { label: 'Stated', rank: 1, text: 'Written as an explicit relation in a heading or structured line of a canonical record.' },
    suggested: { label: 'Suggested', rank: 2, text: 'A default in tooling (for example a module\'s default registry links). Not curated.' },
    mention:   { label: 'Inferred from a mention', rank: 3, text: 'An identifier appears in free text. Inferred; the relation type is unknown.' },
    derived:   { label: 'Derived', rank: 4, text: 'Computed by the index from other records. Never stored in a canonical record.' },
    proposed:  { label: 'Proposed', rank: 5, text: 'From the proposal overlay. Not owner-reviewed, not a canonical value.' }
  };
  const SOURCE_DERIVED = { recorded: true, stated: true };

  // Independent status axes (two-track design TTD-4). No axis is computed from another.
  const AXES = {
    impl:      { label: 'Implementation', text: 'Whether the thing exists in code or documents. Not validation, not approval.' },
    edu:       { label: 'Educational completeness', text: 'How far a concept has been studied (R-015 depth). Says nothing about any strategy.' },
    evidence:  { label: 'Research evidence', text: 'What the literature record says: priority label, claim grade, verification.' },
    empirical: { label: 'Empirical validation', text: 'What the project\'s own tests showed. Derived from experiment records only.' },
    approval:  { label: 'Owner approval', text: 'A decision by the owner, recorded with a project-log id. Never inferred.' },
    record:    { label: 'Record status', text: 'The status the source record gives itself (log tags, lead status, question status).' }
  };

  /* ---- small helpers ---------------------------------------------------------------------------- */
  const key = (type, id) => type + ':' + id;
  const clip = (s, n) => { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s,;:]+\S*$/, '') + '…' : s; };
  const uniq = a => Array.from(new Set(a));
  function hash32(str) { // FNV-1a; deterministic seed source for the layout
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }

  /* ---- framework map -> graph ------------------------------------------------------------------- */
  // Everything this function emits comes from framework-data.js and learning-data.js, the two files that are
  // already the approved public representation. So every node it emits is publication class "public".
  const FW_PATH = 'docs/framework-map/framework-data.js', LEARN_PATH = 'docs/framework-map/learning-data.js';
  function frameworkGraph(F, L) {
    const nodes = [], edges = [], seen = new Set();
    const N = n => { nodes.push(Object.assign({ pub: 'public', track: 'framework' }, n)); return n.key; };
    const E = (s, t, rel, basis, at, extra) => {
      const id = s + '>' + rel + '>' + t;
      if (s === t || seen.has(id)) return; seen.add(id);
      edges.push(Object.assign({ s, t, rel, basis, at: at || FW_PATH }, extra || {}));
    };
    const lifeOf = Object.fromEntries(F.questions.map(q => [q.id, q.life]));
    const lifeLabel = Object.fromEntries(F.lifecycles.map(l => [l.id, l.label]));
    const compIds = new Set(F.components.map(c => c.id));

    for (const q of F.questions) N({
      key: key('question', q.id), type: 'question', id: q.id, title: q.short + ': ' + q.title, summary: clip(q.plain, 260),
      facets: { q: q.id, life: q.life }, axes: { record: [clip(q.answer, 200), 'recorded'] },
      src: [{ path: FW_PATH, at: 'questions[' + q.id + ']' }], link: '#tab=components&q=' + q.id
    });
    for (const [k, s] of Object.entries(F.src || {})) N({
      key: key('document', k), type: 'document', id: k, title: s[0], summary: s[1] ? 'Source reference used by the framework map.' : 'Named source without a link.',
      track: 'shared', facets: { docKind: /^C_/.test(k) ? 'code' : /^PR/.test(k) ? 'pull request' : 'document' }, axes: {},
      src: [{ path: FW_PATH, at: 'src.' + k }], href: s[1] || ''
    });
    for (const c of F.components) {
      const hasDeep = !!(c.deep || (L && L.depth && L.depth[c.id]));
      N({
        key: key('component', c.id), type: 'component', id: c.id, title: c.n, summary: clip(c.p, 260),
        facets: { q: c.q, kind: c.k, life: lifeOf[c.q] || '', depth: hasDeep ? 'technical notes' : 'explanation' },
        axes: { impl: [c.s, 'recorded'] }, evid: clip(c.evid, 240),
        src: [{ path: FW_PATH, at: 'components[' + c.id + ']' }].concat(L && L.lessons && L.lessons[c.id] ? [{ path: LEARN_PATH, at: 'lessons.' + c.id }] : []),
        link: '#tab=components&c=' + encodeURIComponent(c.id)
      });
      E(key('component', c.id), key('question', c.q), 'answers', 'recorded', FW_PATH + '#components[' + c.id + '].q');
      for (const d of c.deps || []) if (compIds.has(d)) E(key('component', d), key('component', c.id), 'feeds', 'recorded', FW_PATH + '#components[' + c.id + '].deps');
      for (const f of c.feeds || []) if (compIds.has(f)) E(key('component', c.id), key('component', f), 'feeds', 'recorded', FW_PATH + '#components[' + c.id + '].feeds');
      for (const s of c.src || []) if (F.src && F.src[s]) E(key('component', c.id), key('document', s), 'cites', 'recorded', FW_PATH + '#components[' + c.id + '].src');
    }
    for (const v of F.views || []) {
      const guide = L && L.views && L.views[v.id];
      N({
        key: key('view', v.id), type: 'view', id: v.id, title: v.t, summary: clip(v.d, 260), facets: { file: v.file },
        axes: {}, src: [{ path: FW_PATH, at: 'views[' + v.id + ']' }], link: '#tab=views&v=' + v.id
      });
      for (const c of (guide && guide[2]) || []) if (compIds.has(c)) E(key('view', v.id), key('component', c), 'shows', 'recorded', LEARN_PATH + '#views.' + v.id);
    }
    const gapIds = new Set((F.gaps || []).map(g => g.id));
    for (const g of F.gaps || []) {
      N({
        key: key('gap', g.id), type: 'gap', id: g.id, title: g.t, summary: clip(g.d, 260), track: 'decisions',
        facets: { gapType: g.type, author: 'map author (not part of the plan)' }, axes: { approval: ['not adopted', 'recorded'] },
        src: [{ path: FW_PATH, at: 'gaps[' + g.id + ']' }], link: '#tab=decisions'
      });
      for (const c of g.rel || []) if (compIds.has(c)) E(key('gap', g.id), key('component', c), 'concerns', 'recorded', FW_PATH + '#gaps[' + g.id + '].rel');
    }
    for (const p of F.proposals || []) {
      N({
        key: key('proposal', p.id), type: 'proposal', id: p.id, title: p.t, summary: clip(p.d, 260), track: 'decisions',
        facets: { author: 'map author (not part of the plan)' }, axes: { approval: ['not adopted', 'recorded'] },
        src: [{ path: FW_PATH, at: 'proposals[' + p.id + ']' }], link: '#tab=decisions'
      });
      for (const g of p.fix || []) if (gapIds.has(g)) E(key('proposal', p.id), key('gap', g), 'addresses', 'recorded', FW_PATH + '#proposals[' + p.id + '].fix');
    }
    for (const u of F.unresolved || []) {
      N({
        key: key('open-decision', u.id), type: 'open-decision', id: u.id, title: u.t, summary: clip(u.why, 260), track: 'decisions',
        facets: {}, axes: { approval: ['awaiting owner', 'recorded'], record: ['open', 'recorded'] },
        src: [{ path: FW_PATH, at: 'unresolved[' + u.id + ']' }], link: '#tab=decisions'
      });
      for (const s of u.src || []) if (F.src && F.src[s]) E(key('open-decision', u.id), key('document', s), 'cites', 'recorded', FW_PATH + '#unresolved[' + u.id + '].src');
      const m = /\bgap (G\d{1,2})\b/.exec(u.why || '');
      if (m && gapIds.has(m[1])) E(key('open-decision', u.id), key('gap', m[1]), 'concerns', 'stated', FW_PATH + '#unresolved[' + u.id + '].why');
    }
    return { nodes, edges, lifeLabel };
  }

  /* ---- graph index and queries ------------------------------------------------------------------ */
  function index(graph) {
    const byKey = new Map(graph.nodes.map(n => [n.key, n]));
    const out = new Map(), inn = new Map();
    for (const n of graph.nodes) { out.set(n.key, []); inn.set(n.key, []); }
    for (const e of graph.edges) {
      if (!byKey.has(e.s) || !byKey.has(e.t)) continue;
      out.get(e.s).push(e); inn.get(e.t).push(e);
    }
    return { byKey, out, inn, nodes: graph.nodes, edges: graph.edges };
  }
  // dir: 'out', 'in' or 'both'. rels: optional array of relation names. bases: optional array of bases.
  function neighbours(ix, k, opts) {
    opts = opts || {};
    const ok = e => (!opts.rels || opts.rels.includes(e.rel)) && (!opts.bases || opts.bases.includes(e.basis));
    const res = [];
    if (opts.dir !== 'in') for (const e of ix.out.get(k) || []) if (ok(e)) res.push({ edge: e, node: ix.byKey.get(e.t), dir: 'out' });
    if (opts.dir !== 'out') for (const e of ix.inn.get(k) || []) if (ok(e)) res.push({ edge: e, node: ix.byKey.get(e.s), dir: 'in' });
    return res;
  }
  // Transitive walk along `rels` in one direction; returns Map(key -> depth). Never crosses 'mentions' unless asked.
  function closure(ix, k, rels, dir, maxDepth) {
    const seen = new Map([[k, 0]]), queue = [k];
    while (queue.length) {
      const cur = queue.shift(), d = seen.get(cur);
      if (maxDepth != null && d >= maxDepth) continue;
      for (const nb of neighbours(ix, cur, { rels, dir })) if (!seen.has(nb.node.key)) { seen.set(nb.node.key, d + 1); queue.push(nb.node.key); }
    }
    seen.delete(k);
    return seen;
  }
  // Direction of "what this depends on" per relation: true when the edge's source depends on its target.
  const DEPENDS_ON_TARGET = { requires: true, 'variant-of': true, 'evidenced-by': true, 'depends-on': true, 'planned-in': true };
  const DEPENDS_ON_SOURCE = { feeds: true, explains: true, evidence: true, blocks: true, tests: true, delivers: true };
  function dependencies(ix, k, upstream) {
    // upstream = everything `k` rests on; downstream = everything that rests on `k`.
    const seen = new Map([[k, 0]]), queue = [k];
    while (queue.length) {
      const cur = queue.shift(), d = seen.get(cur);
      const step = [];
      for (const e of ix.out.get(cur) || []) if (upstream ? DEPENDS_ON_TARGET[e.rel] : DEPENDS_ON_SOURCE[e.rel]) step.push(e.t);
      for (const e of ix.inn.get(cur) || []) if (upstream ? DEPENDS_ON_SOURCE[e.rel] : DEPENDS_ON_TARGET[e.rel]) step.push(e.s);
      for (const n of step) if (!seen.has(n)) { seen.set(n, d + 1); queue.push(n); }
    }
    seen.delete(k);
    return seen;
  }
  function degree(ix, k) { return (ix.out.get(k) || []).length + (ix.inn.get(k) || []).length; }

  // Concepts needed to evaluate a registry entry: the concepts that explain it plus their prerequisite closure
  // (two-track spec "Concepts needed for an entry"). Derived, never stored.
  function conceptsNeeded(ix, entryKey) {
    const direct = neighbours(ix, entryKey, { rels: ['explains'], dir: 'in' }).map(n => n.node.key);
    const all = new Map(direct.map(k => [k, 0]));
    for (const k of direct) for (const [p, d] of closure(ix, k, ['requires'], 'out')) if (!all.has(p) || all.get(p) > d) all.set(p, d);
    return Array.from(all, ([k, depth]) => ({ node: ix.byKey.get(k), depth })).filter(x => x.node)
      .sort((a, b) => a.depth - b.depth || a.node.id.localeCompare(b.node.id));
  }

  /* ---- cluster key and deterministic layout ----------------------------------------------------- */
  // A cluster is the community a node is drawn with. It comes from a recorded attribute of the node, never
  // from the layout itself, so the grouping can be read back from the legend.
  function clusterOf(n) {
    const f = n.facets || {};
    switch (n.type) {
      case 'question': case 'component': return 'Q:' + (f.q || '?');
      case 'target': return 'target architecture';
      case 'milestone': return 'roadmap';
      case 'log-proposal': return 'open decisions';
      case 'view': return 'views';
      case 'document': return 'documents';
      case 'gap': case 'proposal': case 'open-decision': return 'open decisions';
      case 'module': return 'M:' + n.id;
      case 'concept': return 'M:' + (f.module || '?');
      case 'source': return 'sources';
      case 'claim': return 'claims';
      case 'family': return 'F:' + n.id;
      case 'entry': case 'variant': return f.family && f.family.primary ? 'F:' + f.family.primary : 'registry:' + (f.entryKind || 'entry');
      case 'lead': return 'leads:' + (f.domain || 'other');
      case 'dispute': case 'mquestion': return 'methodology';
      case 'experiment': return 'experiments';
      case 'log': case 'logq': return 'log:' + (f.logFamily || 'Q');
      case 'change': return 'changes';
      default: return n.type;
    }
  }
  // Region centres: where each group sits. Track A and Track B face each other across the framework, so every
  // cross-track edge is drawn through the middle and is easy to see. Fixed constants: no trigonometry at run
  // time, so the layout is the same in every engine.
  const REGION = { framework: [0, 0, 0], A: [-1, 0.15, 0.1], B: [1, -0.15, 0.1], shared: [0, 0.2, -0.95], decisions: [0, -0.25, 0.95] };

  function layout(graph, opts) {
    opts = Object.assign({ iterations: 220, scale: 820, dims: 3 }, opts || {});
    const nodes = graph.nodes, n = nodes.length, ix = new Map(nodes.map((nd, i) => [nd.key, i]));
    const pos = new Float64Array(n * 3), vel = new Float64Array(n * 3), deg = new Float64Array(n);
    const unit = h => (h % 20011) / 20011 * 2 - 1; // pseudo-random in [-1,1) from a hash, rational arithmetic only
    // cluster anchors: region centre plus a hashed offset, so a cluster keeps its place when records are added
    const clusters = new Map();
    for (const nd of nodes) {
      const c = clusterOf(nd), g = (TYPES[nd.type] || {}).group || 'shared';
      if (!clusters.has(c)) {
        const h = hash32('cluster|' + c), r = REGION[g] || REGION.shared;
        clusters.set(c, { group: g, x: (r[0] * 0.7 + unit(h) * 0.4) * opts.scale, y: (r[1] * 0.7 + unit(h >>> 7) * 0.4) * opts.scale, z: (r[2] * 0.7 + unit(h >>> 13) * 0.4) * opts.scale, size: 0 });
      }
      clusters.get(c).size++;
    }
    const cl = nodes.map(nd => clusters.get(clusterOf(nd)));
    for (let i = 0; i < n; i++) {
      const h = hash32('node|' + nodes[i].key), spread = 22 + 7 * Math.sqrt(cl[i].size);
      pos[3 * i] = cl[i].x + unit(h) * spread; pos[3 * i + 1] = cl[i].y + unit(h >>> 5) * spread; pos[3 * i + 2] = cl[i].z + unit(h >>> 11) * spread;
    }
    const links = [];
    for (const e of graph.edges) {
      const a = ix.get(e.s), b = ix.get(e.t);
      if (a == null || b == null || a === b) continue;
      const w = (RELATIONS[e.rel] || RELATIONS.mentions).strength * (SOURCE_DERIVED[e.basis] ? 1 : 0.6);
      links.push([a, b, w]); deg[a]++; deg[b]++;
    }
    const repK = 5200, restLen = 62, flat = opts.dims === 2;
    for (let it = 0; it < opts.iterations; it++) {
      const alpha = 1 - it / opts.iterations, step = 0.08 + 0.5 * alpha;
      const fx = new Float64Array(n * 3);
      for (let i = 0; i < n; i++) {
        const xi = pos[3 * i], yi = pos[3 * i + 1], zi = pos[3 * i + 2];
        for (let j = i + 1; j < n; j++) { // repulsion, softened so coincident seeds cannot explode
          let dx = xi - pos[3 * j], dy = yi - pos[3 * j + 1], dz = zi - pos[3 * j + 2];
          const d2 = dx * dx + dy * dy + dz * dz + 36, f = repK * (1 + 0.03 * (deg[i] + deg[j])) / (d2 * Math.sqrt(d2));
          dx *= f; dy *= f; dz *= f;
          fx[3 * i] += dx; fx[3 * i + 1] += dy; fx[3 * i + 2] += dz; fx[3 * j] -= dx; fx[3 * j + 1] -= dy; fx[3 * j + 2] -= dz;
        }
        const c = cl[i], pull = 0.02 + 0.03 / (1 + deg[i]); // isolated nodes stay on their cluster's shell
        fx[3 * i] += (c.x - xi) * pull; fx[3 * i + 1] += (c.y - yi) * pull; fx[3 * i + 2] += (c.z - zi) * pull;
      }
      for (const [a, b, w] of links) { // springs
        const dx = pos[3 * b] - pos[3 * a], dy = pos[3 * b + 1] - pos[3 * a + 1], dz = pos[3 * b + 2] - pos[3 * a + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01, f = w * 0.06 * (d - restLen) / d / Math.sqrt(1 + 0.15 * Math.min(deg[a], deg[b]));
        fx[3 * a] += dx * f; fx[3 * a + 1] += dy * f; fx[3 * a + 2] += dz * f; fx[3 * b] -= dx * f; fx[3 * b + 1] -= dy * f; fx[3 * b + 2] -= dz * f;
      }
      for (let k = 0; k < n * 3; k++) {
        vel[k] = (vel[k] + fx[k] * step) * 0.72;
        const lim = 40 * alpha + 4; if (vel[k] > lim) vel[k] = lim; else if (vel[k] < -lim) vel[k] = -lim;
        pos[k] += vel[k];
      }
      if (flat) for (let i = 0; i < n; i++) { pos[3 * i + 2] = 0; vel[3 * i + 2] = 0; }
    }
    const out = new Map();
    for (let i = 0; i < n; i++) out.set(nodes[i].key, { x: Math.round(pos[3 * i] * 10) / 10, y: Math.round(pos[3 * i + 1] * 10) / 10, z: Math.round(pos[3 * i + 2] * 10) / 10, cluster: clusterOf(nodes[i]), degree: deg[i] });
    const anchors = Array.from(clusters, ([name, c]) => ({ name, group: c.group, x: c.x, y: c.y, z: c.z, size: c.size }));
    return { positions: out, clusters: anchors };
  }

  /* ---- facets used by filters -------------------------------------------------------------------- */
  // Each facet reads one independent attribute. A node without a value reports "unclassified" instead of being
  // dropped (two-track spec, "Unclassified items").
  const UNCLASSIFIED = 'unclassified';
  const FACETS = {
    type:      { label: 'Record type', get: n => [n.type] },
    group:     { label: 'Track', get: n => [(TYPES[n.type] || {}).group || 'shared'] },
    q:         { label: 'Framework question', get: n => n.facets && n.facets.q ? [n.facets.q] : n.facets && n.facets.qDerived && n.facets.qDerived.length ? n.facets.qDerived : null },
    kind:      { label: 'Component type', get: n => n.facets && n.facets.kind ? [n.facets.kind] : null },
    family:    { label: 'Strategy family', get: n => { const f = n.facets && n.facets.family; return f && f.primary ? uniq([f.primary].concat(f.related || [])) : (n.type === 'entry' || n.type === 'variant') ? [UNCLASSIFIED] : n.type === 'family' ? [n.id] : null; } },
    difficulty:{ label: 'Learning difficulty', get: n => n.type === 'concept' ? [(n.facets && n.facets.difficulty) || UNCLASSIFIED] : null },
    module:    { label: 'Curriculum module', get: n => n.facets && n.facets.module ? [n.facets.module] : n.type === 'module' ? [n.id] : null },
    impl:      { label: 'Implementation status', get: n => n.axes && n.axes.impl ? [n.axes.impl[0]] : null },
    edu:       { label: 'Educational status', get: n => n.axes && n.axes.edu ? [n.axes.edu[0]] : null },
    approval:  { label: 'Owner approval', get: n => n.axes && n.axes.approval ? [n.axes.approval[0]] : null },
    empirical: { label: 'Empirical validation', get: n => n.axes && n.axes.empirical ? [n.axes.empirical[0]] : null },
    record:    { label: 'Record status', get: n => n.type !== 'question' && n.axes && n.axes.record ? [].concat(n.axes.record[0]) : null },
    pub:       { label: 'Publication', get: n => [n.pub] }
  };
  function facetValues(nodes, name) {
    const counts = new Map();
    for (const n of nodes) for (const v of FACETS[name].get(n) || []) counts.set(v, (counts.get(v) || 0) + 1);
    return Array.from(counts, ([value, count]) => ({ value, count })).sort((a, b) => (a.value === UNCLASSIFIED) - (b.value === UNCLASSIFIED) || String(a.value).localeCompare(String(b.value), undefined, { numeric: true }));
  }
  // filters: { facetName: [values...] }, text: string. All active facets must match (AND); within a facet, any value (OR).
  function match(n, filters, text) {
    for (const name of Object.keys(filters || {})) {
      const want = filters[name]; if (!want || !want.length) continue;
      const have = FACETS[name] ? FACETS[name].get(n) : null;
      if (!have || !have.some(v => want.includes(v))) return false;
    }
    if (text) {
      const t = text.toLowerCase();
      const hay = (n.id + ' ' + n.title + ' ' + (n.summary || '') + ' ' + ((n.aliases || []).join(' '))).toLowerCase();
      if (!hay.includes(t)) return false;
    }
    return true;
  }

  return { TYPES, GROUPS, RELATIONS, BASIS, SOURCE_DERIVED, AXES, FACETS, UNCLASSIFIED, FW_PATH, LEARN_PATH,
    key, clip, uniq, hash32, frameworkGraph, index, neighbours, closure, dependencies, degree, conceptsNeeded,
    clusterOf, layout, facetValues, match };
});
