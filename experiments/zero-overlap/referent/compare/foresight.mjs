// foresight.mjs — the foresight gate for revisions: does the identity event a revision rests on REDUCE SURPRISE in the text it has not seen?
// Defined in the style of khora's identity/novels/competence-core.mjs (round 8): a reader predicts each mention event before it happens; surprise = -log2 of that prediction;
// an identity event changes which symbol a mention is coded as; HINDSIGHT = the surprise it removes at or before the cut, FORESIGHT = the surprise it removes AFTER the cut.
// The reader (declared, khora's constants, not tuned): P(symbol) = pi_new if unseen, else (1 - pi_new) * (0.5 * presence share + 0.5 * frequency), pi_new = (births + 1) / (N + 2),
// presence = counts decayed by gamma^(sentences elapsed), gamma = 1 - 1/window, window 4 (kernel/activation.js gammaFor).
// ADMISSION, the house recipe (PREREG-FORESIGHT.md; THEORY-IDENTITY.md section 18 and its erratum): the null is the foresight of 39 seeded RANDOM merges between other beings of the
// same document over the same cut; its MAX is the false-positive floor (resolution 1/40 = 0.025); a SECOND independent seed must also be beaten (the intersection); an event that beats
// exactly one is a DISSENT, counted and not admitted. ADMIT iff foresight > 0 and foresight > both maxima. Typed gaps (too little later material, too few candidate random merges,
// a cannot-link) admit nothing.
import { makeSame } from "./compare.mjs";
import { identityAt, docRegistry } from "./log.mjs";
const KH = process.env.KHORA_HOME ?? "/Users/mlacy/Documents/khora-cast/khora";
process.env.KHORA_PRIORS_DIR ||= `${process.env.HOME}/Documents/janus/priors`;
const { readDocument } = await import(`${KH}/native/reading.js`);
const { gammaFor } = await import(`${KH}/native/kernel/activation.js`);
export const WINDOW = 4, G = gammaFor(WINDOW), NULLMIN = 30, LATERMIN = 3, DRAWS = 39, SEEDS = Object.freeze([20261119, 20261120]);
const L2 = Math.log2;
export const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : 0; };

/** the mention stream of a document: every mention of every referent the reader built, in text order, with its sentence index; a referent is coded by the spelling actually written */
const STREAMS = new Map();
export async function streamOf(doc) {
  if (STREAMS.has(doc.text)) return STREAMS.get(doc.text);
  const e = await readDocument(doc.text, { language: "eng", lexicon: false, referents: true, castIdentity: true, minCharacters: 0 });
  const spans = new Map((e.referents?.spans ?? []).map((s) => [s.id, s])), events = [];
  for (const r of e.referents?.referents ?? []) {
    const ms = (r.mentions ?? []).map((id) => spans.get(id)).filter(Boolean), tally = new Map();
    for (const m of ms) { const w = doc.text.slice(m.at[0], m.at[1]); tally.set(w, (tally.get(w) ?? 0) + 1); }
    const face = [...tally].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0]?.[0] ?? r.face;     // case kept: the reader's own face may be a lowercased form
    for (const m of ms) events.push({ pos: m.at[0], end: m.at[1], face, ref: r.id });
  }
  events.sort((a, b) => a.pos - b.pos);
  const bounds = [...doc.text.matchAll(/[.!?]["')\]]*\s+/g)].map((m) => m.index + m[0].length);
  for (const ev of events) { let k = 0; while (k < bounds.length && bounds[k] <= ev.pos) k++; ev.t = k; }
  STREAMS.set(doc.text, events); return events;
}
/** the symbol each face is coded as under an identity: faces the identity calls the same share one symbol (union-find, keyed by the smallest face) */
const GRAPHS = new Map();           // the alias graph of a document's faces, built ONCE (the pairwise name relation is the expensive part)
function aliasGraph(F) {
  const key = F.join("\u0001"); if (GRAPHS.has(key)) return GRAPHS.get(key);
  const alias = makeSame({ merges: [], aparts: [] }), edges = [], adj = new Map(F.map((f) => [f, []]));
  for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) if (alias(F[i], F[j])) { edges.push([i, j]); adj.get(F[i]).push(F[j]); adj.get(F[j]).push(F[i]); }
  const g = { edges, alias, adj }; GRAPHS.set(key, g); return g;
}
export function symbolizer(faces, identity) {
  const F = [...new Set(faces)];
  if ((identity.aparts ?? []).length) {           // a cannot-link needs the full relation (a held component): the slow path
    const same = makeSame(identity), parent = new Map(F.map((f) => [f, f])), find = (x) => { while (parent.get(x) !== x) x = parent.get(x); return x; };
    for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) if (same(F[i], F[j])) { const a = find(F[i]), b = find(F[j]); if (a !== b) parent.set(a > b ? a : b, a > b ? b : a); }
    return (f) => find(f);
  }
  const g = aliasGraph(F), idx = new Map(F.map((f, i) => [f, i])), parent = F.map((_, i) => i), find = (x) => { while (parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb); };
  for (const [i, j] of g.edges) union(i, j);
  for (const [x, y] of identity.merges ?? []) { const m = [];            // a merge joins its two names and every face that is an alias of either (as makeSame does)
    F.forEach((f, i) => { if (g.alias(f, x) || g.alias(f, y) || f === x || f === y) m.push(i); }); for (let k = 1; k < m.length; k++) union(m[0], m[k]); }
  return (f) => F[find(idx.get(f))];
}
/** prequential surprise (bits) of each event under a coding of faces into symbols */
export function surpriseBits(events, symOf) {
  const pres = new Map(), n = new Map(); let Ntot = 0, births = 0; const bits = new Float64Array(events.length);
  const live = (s, t) => { const c = pres.get(s); return c ? c.v * G ** (t - c.t) : 0; };
  events.forEach((e, k) => {
    const s = symOf(e.face), t = e.t; let Zp = 0; for (const x of pres.keys()) Zp += live(x, t);
    const piNew = (births + 1) / (Ntot + 2); let P;
    if (!((n.get(s) ?? 0) > 0)) P = piNew; else { const freq = n.get(s) / Ntot, share = Zp > 0 ? live(s, t) / Zp : 0; P = (1 - piNew) * (Zp > 0 ? 0.5 * share + 0.5 * freq : freq); }
    bits[k] = -L2(Math.max(P, 1e-12)); if (!n.has(s)) births++; n.set(s, (n.get(s) ?? 0) + 1); Ntot++; pres.set(s, { v: live(s, t) + 1, t });
  });
  return bits;
}
/** hindsight (at or before the cut) and foresight (after the cut) of moving from identity0 to identity1 */
export function effect(events, cut, id0, id1) {
  const faces = events.map((e) => e.face), b0 = surpriseBits(events, symbolizer(faces, id0)), b1 = surpriseBits(events, symbolizer(faces, id1));
  let hind = 0, fore = 0, later = 0; events.forEach((e, k) => { const d = b0[k] - b1[k]; if (e.pos <= cut) hind += d; else { fore += d; later++; } });
  return { hindsight: hind, foresight: fore, later };
}
/** THE FAST PATH: one merge on top of identity0 scored as a DELTA on a cached baseline, not as a full replay. Exact, by derivation: presence is additive, so the normaliser Zp of every event is unchanged by a merge;
 *  only (a) the events of the merged symbols (their counts and presence add), and (b) the birth term for events after the merged symbols have both appeared, change. Cost O(N x |S|) against O(N x symbols) per replay.
 *  `effect` (the replay) stays as the reference; the tests require the two to agree to 1e-9. */
const BASES = new WeakMap();
export function baseFor(events, id0) {
  const key = JSON.stringify(id0); let m = BASES.get(events); if (!m) BASES.set(events, m = new Map()); if (m.has(key)) return m.get(key);
  const faces = events.map((e) => e.face), sym = symbolizer(faces, id0), pres = new Map(), n = new Map(); let Ntot = 0, births = 0;
  const live = (x, t) => { const c = pres.get(x); return c ? c.v * G ** (t - c.t) : 0; };
  const N = events.length, bits0 = new Float64Array(N), Zp = new Float64Array(N), birthsB = new Int32Array(N), X = new Float64Array(N), seen = new Uint8Array(N), symOf = Array(N), first = new Map();
  events.forEach((e, k) => {
    const s = sym(e.face), t = e.t; symOf[k] = s; let z = 0; for (const x of pres.keys()) z += live(x, t);
    Zp[k] = z; birthsB[k] = births; const piNew = (births + 1) / (Ntot + 2), nOwn = n.get(s) ?? 0; let P;
    if (!(nOwn > 0)) { P = piNew; seen[k] = 0; } else { seen[k] = 1; X[k] = z > 0 ? 0.5 * live(s, t) / z + 0.5 * nOwn / Ntot : nOwn / Ntot; P = (1 - piNew) * X[k]; }
    bits0[k] = -L2(Math.max(P, 1e-12)); if (!n.has(s)) { births++; first.set(s, k); } n.set(s, nOwn + 1); Ntot++; pres.set(s, { v: live(s, t) + 1, t });
  });
  const occ = new Map(); symOf.forEach((u, k) => { let a = occ.get(u); if (!a) occ.set(u, a = []); a.push(k); });
  const b = { sym, symOf, bits0, Zp, birthsB, X, seen, first, N, occ, faces: [...new Set(faces)] }; m.set(key, b); return b;
}
/** the full-walk version, kept as the reference for effectMerge (the same derivation, O(N) per merge) */
export function effectMergeScan(events, cut, id0, pair) {
  const b = baseFor(events, id0), [x, y] = pair, g = (b.g ??= aliasGraph(b.faces)), members = new Set();
  for (const name of [x, y]) {                    // the merged class: the name's own face (if it is one), every face that aliases it; a name absent from the document is scanned
    if (g.adj.has(name)) { members.add(b.sym(name)); for (const f of g.adj.get(name)) members.add(b.sym(f)); }
    else for (const f of b.faces) if (g.alias(f, name)) members.add(b.sym(f));
  }
  if (members.size < 2) return { hindsight: 0, foresight: 0, later: events.filter((e) => e.pos > cut).length };
  const S = [...members], firsts = S.map((u) => b.first.get(u)).filter((v) => v !== undefined).sort((p, q) => p - q), st = new Map(S.map((u) => [u, { v: 0, t: 0, n: 0 }]));
  let hind = 0, fore = 0, later = 0, ptr = 0;
  for (let k = 0; k < b.N; k++) {
    while (ptr < firsts.length && firsts[ptr] < k) ptr++;
    const cntSeen = ptr, t = events[k].t, births = b.birthsB[k] - Math.max(0, cntSeen - 1), piNew = (births + 1) / (k + 2);   // Ntot before event k is k
    let bits1;
    if (members.has(b.symOf[k])) {
      let liveM = 0, nM = 0; for (const u of S) { const c = st.get(u); if (c.n > 0) { liveM += c.v * G ** (t - c.t); nM += c.n; } }
      const P = nM > 0 ? (1 - piNew) * (b.Zp[k] > 0 ? 0.5 * liveM / b.Zp[k] + 0.5 * nM / k : nM / k) : piNew;
      bits1 = -L2(Math.max(P, 1e-12));
      const c = st.get(b.symOf[k]); const own = c.n > 0 ? c.v * G ** (t - c.t) : 0; c.v = own + 1; c.t = t; c.n++;
    } else if (cntSeen >= 2) { const P = b.seen[k] ? (1 - piNew) * b.X[k] : piNew; bits1 = -L2(Math.max(P, 1e-12)); }
    else bits1 = b.bits0[k];
    const d = b.bits0[k] - bits1; if (events[k].pos <= cut) hind += d; else { fore += d; later++; }
  }
  return { hindsight: hind, foresight: fore, later };
}
/** SKIPPING EVENTS (the wormhole): a merge of exactly two names changes (a) the events of those two names, and (b) every later event only through the birth term, which depends on k alone (births-1 once both have appeared).
 *  (b) is a prefix sum over k, built once per baseline; (a) is a walk over the two names' own event lists. Cost O(mentions of the two names + log N), not O(N). Larger alias classes take effectMergeScan. Equal to it to 1e-9 (tested). */
function shiftPrefix(b) {
  if (b.P) return b.P; const P = new Float64Array(b.N + 1);
  for (let k = 0; k < b.N; k++) { const piNew = Math.max(b.birthsB[k] - 1 + 1, 0) / (k + 2), Pr = b.seen[k] ? (1 - piNew) * b.X[k] : piNew; P[k + 1] = P[k] + (b.bits0[k] - -L2(Math.max(Pr, 1e-12))); }
  return (b.P = P);
}
export function effectMerge(events, cut, id0, pair) {
  const b = baseFor(events, id0), [x, y] = pair, g = (b.g ??= aliasGraph(b.faces)), members = new Set();
  for (const name of [x, y]) { if (g.adj.has(name)) { members.add(b.sym(name)); for (const f of g.adj.get(name)) members.add(b.sym(f)); } else for (const f of b.faces) if (g.alias(f, name)) members.add(b.sym(f)); }
  if (members.size !== 2 || [...members].some((u) => !b.first.has(u))) return effectMergeScan(events, cut, id0, pair);
  const N = b.N; let lo = 0, hi = N; while (lo < hi) { const mid = (lo + hi) >> 1; if (events[mid].pos <= cut) lo = mid + 1; else hi = mid; }
  const c = lo, [u, w] = [...members], f0 = Math.min(b.first.get(u), b.first.get(w)), f1 = Math.max(b.first.get(u), b.first.get(w)), P = shiftPrefix(b);
  const span = (a, z) => (z > a ? P[z] - P[a] : 0);                                   // non-member shift over events [a, z), all after f1
  let hind = span(Math.max(f1 + 1, 0), Math.max(f1 + 1, c)), fore = span(Math.max(f1 + 1, c), N);
  const A = b.occ.get(u), B = b.occ.get(w), st = new Map([[u, { v: 0, t: 0, n: 0 }], [w, { v: 0, t: 0, n: 0 }]]);
  let i = 0, j = 0;
  while (i < A.length || j < B.length) {
    const k = j >= B.length || (i < A.length && A[i] < B[j]) ? A[i++] : B[j++], t = events[k].t, cntSeen = (k > f0 ? 1 : 0) + (k > f1 ? 1 : 0);
    const births = b.birthsB[k] - Math.max(0, cntSeen - 1), piNew = (births + 1) / (k + 2);
    let liveM = 0, nM = 0; for (const q of [u, w]) { const s2 = st.get(q); if (s2.n > 0) { liveM += s2.v * G ** (t - s2.t); nM += s2.n; } }
    const Pm = nM > 0 ? (1 - piNew) * (b.Zp[k] > 0 ? 0.5 * liveM / b.Zp[k] + 0.5 * nM / k : nM / k) : piNew, bits1 = -L2(Math.max(Pm, 1e-12));
    const s3 = st.get(b.symOf[k]); const own = s3.n > 0 ? s3.v * G ** (t - s3.t) : 0; s3.v = own + 1; s3.t = t; s3.n++;
    let d = b.bits0[k] - bits1; if (k > f1) d -= P[k + 1] - P[k];                       // this event was inside the prefix sum as a non-member: take that out
    if (k < c) hind += d; else fore += d;
  }
  return { hindsight: hind, foresight: fore, later: N - c };
}
/** THE SHORTCUT, THROUGH PHAROS'S FOLD LAYER (pharos lib/sig.mjs, docs/PROPOSAL-SIG-FOLD.md): the replay `effect` is the REFERENCE, `effectMerge` the derived shortcut. Pharos owns the memo (keyed by position), the probe, the held-out
 *  promotion and the demotion; this file does not keep a private copy. A pharos checkout that is absent is a typed state (SIG.absent), not a silent one: the answers are the replay's, only slower. PHAROS_NO_SIG=1 removes every shortcut: no answer changes. */
export const TOL = 1e-9, SIG = { fold: null, absent: null };
const sig = await import("../../../../organs/kernel-reach.mjs").then((k) => k.kernelImport("pharos", "lib/sig.mjs")).catch((e) => { SIG.absent = e.code ?? String(e.message ?? e); return null; });
const same3 = (a, b) => ["hindsight", "foresight"].every((k) => Math.abs(a[k] - b[k]) <= TOL * Math.max(1, Math.abs(a[k]))) && a.later === b.later;
const EVID = new WeakMap(); let evN = 0; const evId = (events) => EVID.get(events) ?? (EVID.set(events, ++evN), evN);
const pairOf = (id1) => id1.merges[id1.merges.length - 1];
if (sig) SIG.fold = sig.registerFold({
  name: "penelope.foresight.merge", same: same3,
  position: ({ events }) => `events:${evId(events)}:${events.length}`,                 // a stream is read once and never appended to: its position is its identity and length
  reference: ({ events, id1 }, { cut, id0 }) => effect(events, cut, id0, id1),
  shortcut: ({ events }, { cut, id0, pair }) => effectMerge(events, cut, id0, pair),
});
/** the score of identity1 against identity0: the shortcut when id1 is id0 plus ONE merge and no cannot-link, else the replay */
export function effectFast(events, cut, id0, id1) {
  const extra = (id1.merges ?? []).length - (id0.merges ?? []).length;
  if (!SIG.fold || !(extra === 1 && !(id1.aparts ?? []).length && !(id0.aparts ?? []).length)) return effect(events, cut, id0, id1);
  return SIG.fold.run({ events, id1 }, { cut, id0, pair: [...pairOf(id1)].sort() });
}
/** the admission rule on its own: above zero and above BOTH seeds' maxima; exactly one is a dissent */
export function admission(value, maxes) {
  const n = maxes.filter((m) => value > m).length;
  return { admitted: value > 0 && n === maxes.length, dissent: value > 0 && n > 0 && n < maxes.length };
}
/** the candidate random merges for an event: pairs of faces of the document that identity0 does not already join and that are not aliases of the event's own names */
const CANDS = new WeakMap();
export function candidatePairs(faces, id0, touched, events) {
  const key = JSON.stringify(id0); let all;                                      // the pairs identity0 does not already join: derived once per (events, identity0), in a fixed order (the seeded draws index into it)
  const memo = events ? (CANDS.get(events) ?? CANDS.set(events, new Map()).get(events)) : null;
  if (memo?.has(key)) all = memo.get(key); else {
    const F = [...new Set(faces)], same0 = makeSame(id0); all = []; for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) if (!same0(F[i], F[j])) all.push([F[i], F[j]]);
    memo?.set(key, all);
  }
  const alias = makeSame({ merges: [], aparts: [] }), F2 = [...new Set(faces)], bad = new Set(); for (const t of touched) for (const f of F2) if (alias(t, f)) bad.add(f);
  return bad.size ? all.filter(([a, b]) => !bad.has(a) && !bad.has(b)) : all;
}
/** the null for one document: for each seed, DRAWS random merges, their foresight and hindsight (same cut); the max of each is that seed's floor */
export function nullFloors(events, cut, id0, pairs, { seeds = SEEDS, draws = DRAWS } = {}) {
  return seeds.map((seed) => {
    const rng = mulberry(seed), fore = [], hind = [];
    for (let k = 0; k < draws; k++) { const [a, b] = pairs[Math.floor(rng() * pairs.length)]; const e = effectFast(events, cut, id0, { merges: [...id0.merges, [a, b]], aparts: id0.aparts }); fore.push(e.foresight); hind.push(e.hindsight); }
    return { fore, hind, foreMax: Math.max(...fore), hindMax: Math.max(...hind) };
  });
}
/** decide ONE merge on ONE document stream: the unit used by the evaluation and (summed over documents) by the log gate */
export function decideEvent(events, cut, touched, id0, id1, opts = {}) {
  const real = effectFast(events, cut, id0, id1), pairs = candidatePairs(events.map((e) => e.face), id0, touched, events);
  if (real.later < LATERMIN) return { gap: "no_foresight_material", detail: `${real.later} later mentions, at least ${LATERMIN} needed`, ...real };
  if (pairs.length < NULLMIN) return { gap: "underpowered_null", detail: `${pairs.length} candidate random merges, at least ${NULLMIN} needed`, ...real };
  const floors = nullFloors(events, cut, id0, pairs, opts), f = admission(real.foresight, floors.map((x) => x.foreMax)), h = admission(real.hindsight, floors.map((x) => x.hindMax));
  const pooled = floors.flatMap((x) => x.fore);
  return { ...real, foreFloors: floors.map((x) => x.foreMax), hindFloors: floors.map((x) => x.hindMax), admitted: f.admitted, dissent: f.dissent, hindAdmitted: h.admitted, rank: pooled.filter((x) => x <= real.foresight).length / pooled.length, nullPairs: pairs.length };
}
/** the gate for a revision: foresight on the documents of its two statements, summed, against the null summed over the same draws; returns { bits, nullMean } where nullMean is the HIGHER of the two seeds' maxima */
export function makeForesight(log, eventIndex, docs, { seeds = SEEDS, draws = DRAWS } = {}) {
  const ev = log.entries[eventIndex], id0 = identityAt(log, eventIndex), id1 = identityAt(log, eventIndex + 1), reg = docRegistry(docs);
  return async (rev) => {
    if (ev.kind !== "merge") return { bits: 0, nullMean: 0, gap: "foresight_defined_for_merge_only", detail: "a cannot-link has no foresight measure yet" };
    const verdict = log.entries.find((e) => e.id === rev.body.of), parts = [];
    for (const side of ["A", "B"]) { const w = verdict.body.witnesses[side], d = reg.get(w.doc); if (d && !parts.some((p) => p.d === d)) parts.push({ d, w }); }
    if (!parts.length) return { bits: 0, nullMean: 0, gap: "document_not_found" };
    let bits = 0, later = 0, used = 0; const perSeed = seeds.map(() => Array(draws).fill(0)), skipped = [];
    for (const { d, w } of parts) {                                              // a document with too little material is skipped for the real score AND the null alike
      const events = await streamOf(d), cut = Buffer.from(d.text, "utf8").subarray(0, w.b1).toString("utf8").length;
      const real = effectFast(events, cut, id0, id1), pairs = candidatePairs(events.map((e) => e.face), id0, ev.body.touched ?? [], events);
      if (real.later < LATERMIN) { skipped.push(`${d.id}: ${real.later} later mentions, at least ${LATERMIN} needed`); continue; }
      if (pairs.length < NULLMIN) { skipped.push(`${d.id}: ${pairs.length} candidate random merges, at least ${NULLMIN} needed`); continue; }
      bits += real.foresight; later += real.later; used++;
      nullFloors(events, cut, id0, pairs, { seeds, draws }).forEach((fl, s) => fl.fore.forEach((v, k) => { perSeed[s][k] += v; }));
    }
    if (!used) return { bits: 0, nullMean: 0, gap: "no_foresight_material", detail: skipped.join("; ") };
    const maxes = perSeed.map((a) => Math.max(...a)), a = admission(bits, maxes), pooled = perSeed.flat();
    return { bits, nullMean: Math.max(...maxes), floors: maxes, dissent: a.dissent, rank: pooled.filter((x) => x <= bits).length / pooled.length, later, draws: draws * seeds.length, documents: used, skipped };
  };
}
