// relation-fold.mjs — "fold the holograph and have the relationships be the same."
//
// A reader turns a text into relationship claims {end1, label, end2, addr, frame, at}: the relationship between two ends, with the permanent
// address (span + hash) of the passage it was read from. This organ never reads text; it folds claims.
//
// FOLD under a ground (the frame): each end is replaced by its ANCHOR (an identity established elsewhere: the bed, an area, a birth year),
// so two texts that share no words fold to the same keys. A relationship whose end has no anchor is LOOSE: it is kept, never compared, and
// never counted as agreement or disagreement (a hole, not a vote).
// COMPARE two folds on the relationships they share:
//   ROOT relationships (labels declared role "root": the identity-bearing ones) decide the verdict:
//       same   at least minAgree root relationships agree and none disputes
//       other  a root relationship disputes (a different end2 for the same end1 and label)
//       gap    no root relationship is shared, so nothing can be tested (the caller defaults to Other)
//   LEAF relationships (role "leaf") never decide the verdict: they are counted agree / dispute / one-sided. Same root with disputing leaves is
//   a real, useful answer ("same subject, they disagree about this").
// Every trail row carries the addresses of both sides, so the verdict re-expands to the passages it stands on (the holograph).
//
// THREE GRAINS (Figure, Pattern, Ground), each its own verdict, never collapsed:
//   GROUND   same thing?   the root relationships between anchored ends agree (the verdict above: same / other / gap)
//   FIGURE   same facts?   the particular relationship instances (the leaves): agree / dispute / one-sided
//   PATTERN  same kind?    the SHAPE of the relationships, ignoring which anchors fill it: two folds are the same pattern when their
//                          labelled graphs are isomorphic (numbers and years count only as "a value"). Same pattern with a different ground
//                          is an analogy (same kind of story, different thing); same ground with a different pattern is a contradiction of structure.
//   foldRelations({ claims, anchors, ground }) -> { ground, relations, loose }
//   sameFold(a, b, { roles, minAgree = 1, tol = 0 }) -> { root (= ground), rootTrail, leaves (= figure counts), leafTrail, pattern: { verdict, a, b } }
//   patternOf(fold) -> canonical string of the labelled graph (isomorphic folds give the same string)
//   claim   { end1, label, end2, addr, frame }       anchors: { "surface form": "anchor id" } (numbers and years anchor to themselves)
//   roles   { label: "root" | "leaf" }               (a label not listed is a leaf)
//   inverse [labels]                                   labels whose end2 determines end1 (one maker per bed): two different end1 on the same end2 DISPUTE
//   dmdFoldExact(a, b, { roots, inverse, budget }) -> { structure: same|other|gap, slots, trail, evidence }   sameOrOtherExact(a, b) adds polarity   (GL-DF-01)
//     the percentile rule dmdFold / sameOrOther is kept pinned and is DEFECTIVE: read the note above dmdFold before using it.

const anchorOf = (anchors, end) => (end == null ? null : anchors[end] ?? (typeof end === "number" ? end : null));

export function foldRelations({ claims = [], anchors = {}, ground = null } = {}) {
  const relations = new Map(), loose = [];
  for (const c of claims) {
    if (ground && c.frame && c.frame !== ground) continue; // a claim from another frame is not part of this fold
    const e1 = anchorOf(anchors, c.end1), e2 = anchorOf(anchors, c.end2);
    if (e1 == null || e2 == null) { loose.push(c); continue; }
    const key = `${e1}|${c.label}`;
    if (!relations.has(key)) relations.set(key, { end1: e1, label: c.label, ends: new Map() });
    const r = relations.get(key);
    if (!r.ends.has(e2)) r.ends.set(e2, []);
    r.ends.get(e2).push(c.addr ?? null);
  }
  return { ground, relations, loose };
}

// Canonical form of a fold's labelled graph: entity ends become nodes, values collapse to "#"; the string is the minimum over node orderings
// (graphs of up to 7 entity nodes; larger folds fall back to a degree-sorted form and say so with a "~" prefix).
export function patternOf(fold) {
  const edges = [], nodes = new Set();
  for (const r of fold.relations.values()) for (const e2 of r.ends.keys()) {
    const lit = typeof e2 === "number"; nodes.add(r.end1); if (!lit) nodes.add(e2);
    edges.push([r.end1, r.label, lit ? "#" : e2, lit]);
  }
  const ns = [...nodes];
  const enc = (map) => edges.map(([a, l, b, lit]) => `${map.get(a)}-${l}->${lit ? "#" : map.get(b)}`).sort().join(";");
  if (ns.length > 7) { const deg = new Map(ns.map((n) => [n, 0])); edges.forEach(([a, , b, lit]) => { deg.set(a, deg.get(a) + 1); if (!lit) deg.set(b, deg.get(b) + 1); }); const ord = [...ns].sort((x, y) => deg.get(y) - deg.get(x) || (x < y ? -1 : 1)); return "~" + enc(new Map(ord.map((n, i) => [n, i]))); }
  let best = null;
  const perm = (arr, k = 0) => { if (k === arr.length) { const f = enc(new Map(arr.map((n, i) => [n, i]))); if (best === null || f < best) best = f; return; } for (let i = k; i < arr.length; i++) { [arr[k], arr[i]] = [arr[i], arr[k]]; perm(arr, k + 1); [arr[k], arr[i]] = [arr[i], arr[k]]; } };
  perm(ns); return best ?? "";
}

const near = (x, y, tol) => typeof x === "number" && typeof y === "number" && Math.abs(x - y) / Math.max(Math.abs(x), Math.abs(y), 1e-9) <= tol;

export function sameFold(a, b, { roles = {}, minAgree = 1, tol = 0, inverse = [] } = {}) {
  const rootTrail = [], leafTrail = [], leaves = { agree: 0, dispute: 0, oneSided: 0 };
  const pa = patternOf(a), pb = patternOf(b), pattern = { verdict: pa === "" || pb === "" ? "gap" : pa === pb ? "same" : "other", a: pa, b: pb };
  if (a.ground !== b.ground) return { root: "gap", why: "folds under different grounds are not comparable", rootTrail, leaves, leafTrail, pattern };
  const keys = new Set([...a.relations.keys(), ...b.relations.keys()]);
  let agree = 0, dispute = 0;
  for (const k of keys) {
    const ra = a.relations.get(k), rb = b.relations.get(k), label = (ra ?? rb).label, root = roles[label] === "root";
    if (!ra || !rb) { if (!root) { leaves.oneSided++; leafTrail.push({ key: k, verdict: "one-sided", addr: [...(ra ?? rb).ends.values()].flat() }); } continue; }
    let match = false;
    for (const [e2a] of ra.ends) for (const [e2b] of rb.ends) if (e2a === e2b || near(e2a, e2b, tol)) match = true;
    const row = { key: k, verdict: match ? "agree" : "dispute", a: [...ra.ends.keys()], b: [...rb.ends.keys()], addr: { a: [...ra.ends.values()].flat(), b: [...rb.ends.values()].flat() } };
    if (root) { rootTrail.push(row); match ? agree++ : dispute++; } else { leafTrail.push(row); leaves[match ? "agree" : "dispute"]++; }
  }
  // inverse-functional labels: the same end2 held by a different end1 is a dispute (an impostor claiming the same bed with another builder)
  for (const lab of inverse) {
    const by2 = (f) => { const m = new Map(); for (const r of f.relations.values()) if (r.label === lab) for (const [e2, ad] of r.ends) { if (!m.has(e2)) m.set(e2, { ends1: new Set(), ad: [] }); m.get(e2).ends1.add(r.end1); m.get(e2).ad.push(...ad); } return m; };
    const ma = by2(a), mb = by2(b);
    for (const [e2, x] of ma) { const y = mb.get(e2); if (!y) continue; const same = [...x.ends1].some((e1) => y.ends1.has(e1)); const row = { key: `${lab}|*|${e2}`, verdict: same ? "agree" : "dispute", a: [...x.ends1], b: [...y.ends1], addr: { a: x.ad, b: y.ad } }; if (roles[lab] === "root") { rootTrail.push(row); if (!same) dispute++; } }
  }
  const root = dispute ? "other" : agree >= minAgree ? "same" : "gap";
  return { root, pattern, why: dispute ? "a root relationship disputes" : agree >= minAgree ? `${agree} root relationship(s) agree, none disputes` : "no root relationship is shared: nothing can be tested", rootTrail, leaves, leafTrail };
}

export const KINDS = Object.freeze({
  "relation-fold": { cell: "EVA·Ground", why: "a fold of relationship claims under a ground (frame): ends replaced by anchors, loose claims kept aside, every relation carrying the addresses it was read from" },
  "fold-verdict": { cell: "EVA·Pattern", why: "same / other / gap decided on the ROOT relationships of two folds; leaf relationships counted agree / dispute / one-sided, never deciding" },
});

// KNOWN DEFECT, pinned (GL-DF-01): this percentile cut is saturated (p95 = the largest possible difference), so it says "same" for any pair
// that shares one root edge, and "other" for folds with no root edge. Kept as it was; dmdFoldExact / sameOrOtherExact below replace it.
// DMD-FOLD. Paraphrase is not identity — it is a difference that does NOT make a difference. Two folds are
// equated when their delta on the IDENTITY-BEARING (root) roles stays BELOW the shuffled null: shuffle the
// entities of one fold (the same structure, wrong participants) and re-measure the delta; the 95th percentile
// is the noise floor. A delta under it is a surface difference (dative alternation, active/passive); a delta
// over it is a real difference (who did what changed). The root roles are the ones that decide WHAT HAPPENED —
// kartṛ (agent), karman (patient), sampradāna (recipient), apādāna (source) — and the leaves (locus, time,
// cause, instrument, purpose) are the ones that decide HOW it is said; a leaf delta is below the noise.
export function dmdFold(a, b, { roots = ["kartṛ", "karman", "sampradāna", "apādāna"], trials = 60, seed = 1 } = {}) {
  const rootEdges = (f) => { const s = new Set(); for (const [, r] of (f?.relations ?? new Map())) if (roots.includes(r.label)) for (const e2 of r.ends.keys()) s.add(`${r.end1}|${r.label}|${e2}`); return s; };
  const diff = (sa, sb) => { let d = 0; for (const e of sa) if (!sb.has(e)) d++; for (const e of sb) if (!sa.has(e)) d++; return d; };
  const sa = rootEdges(a), sb = rootEdges(b);
  const actual = diff(sa, sb);
  // the null: shuffle a's entities (the same shape, wrong participants), re-measure the root delta
  const ents = [...new Set([...sa, ...sb].flatMap((e) => e.split("|").filter((_, i) => i === 0 || i === 2)))];
  const rng = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const ds = [];
  for (let t = 0; t < trials; t++) {
    const map = new Map(ents.map((e) => [e, ents[Math.floor(rng() * ents.length)]]));
    const shuffled = new Set([...sa].map((e) => { const [a1, l, a2] = e.split("|"); return `${map.get(a1)}|${l}|${map.get(a2)}`; }));
    ds.push(diff(shuffled, sb));
  }
  ds.sort((x, y) => x - y); const p95 = ds[Math.ceil(0.95 * ds.length) - 1];
  return { actual, null: p95, makesDifference: actual >= p95, roots: sa.size + sb.size };
}

// SAME-OR-OTHER — the significance triad (Interpretation: DEF bound, EVA compare, REC re-zero), and the
// softmax replacement. A paraphrase (and any "attend to this" decision) is not a distribution over
// tokens; it is ONE discrete question: is this the same thing as that, or another thing?
//   DEF the BOUND   = the shuffled null (the noise floor).
//   EVA the COMPARE = the fold delta on the identity roles against that bound (structure: same/other),
//                     AND the polarity (the sign: same/other — negation and modality flip the sign even
//                     when the edges are identical).
//   REC the RE-ZERO = the sign flip is a difference that makes a difference: the meaning re-zeroes.
// `a` and `b` are { fold, polarity }; polarity is { neg: bool, modal: string|null } (read off the parse:
// a "not"/"never" is negation, a modal auxiliary is modality — the EVA sign of the sentence).
export function sameOrOther(a, b, { roots, trials } = {}) {
  const d = dmdFold(a?.fold, b?.fold, { roots, trials });
  const structure = d.makesDifference ? "other" : "same";
  const pa = a?.polarity ?? {}, pb = b?.polarity ?? {};
  const polarity = (!!pa.neg !== !!pb.neg || (pa.modal ?? null) !== (pb.modal ?? null)) ? "other" : "same";
  return { structure, polarity, verdict: (structure === "other" || polarity === "other") ? "other" : "same", delta: d.actual, null: d.null };
}

// DMD-FOLD, EXACT — the measure that replaces dmdFold's percentile cut (GL-DF-01). dmdFold and sameOrOther above stay as they were, pinned:
// a measure that changed is a new row, never the same number under the same name (rule 6), and the finding that forced the change is the
// record. The finding (experiments/dmd-fold/RESULT.md): a shuffled-participants null almost never shares an edge with the other fold, so its
// 95th percentile IS the largest difference possible, and "other" reduces to "the two folds share no root edge at all". An agent/patient
// reversal that keeps the recipient, a five-edge fold with four edges changed, and every random unrelated pair that shared one edge all
// came out "same"; two folds with no root edge (or one identical entity) came out "other", because 0 >= 0 on a null with no spread.
// Trials and seed were not the cause (seeds 1..200 and swapping the pair change nothing): the cut sat on a saturated tail.
//
// This rule has no percentile, no trial count and no seed:
//   SLOT     a root role of an event holds one filler (the kartṛ of "give" is one thing). Two folds that fill the same slot with DISJOINT
//            fillers dispute it: a difference that makes a difference TO who-did-what, by construction, so it needs no null.
//   HOLE     a slot filled on one side only is a silence, not a vote (sameFold's rule): counted, never deciding.
//   AGREE    a root edge both folds carry. It is evidence of sameness only if chance cannot reproduce it somewhere else:
//   NULL     every relabeling of the entities that agrees at least as much as the real pair, enumerated EXACTLY (no draws). Entities
//            move only within their class (participants among participants, events among events); values (numbers) are fixed.
//   PIN      the destroy test, on identities: the agreement counts only if every relabeling that does as well leaves the agreeing edges
//            where they are. A relabeling that does as well while MOVING them says the agreement does not depend on those identities
//            (a coincidence the vocabulary can produce, or a symmetry of the fold): a typed gap, never a yes. `evidence.p` reports where the
//            real pair sits in the null (the fraction of relabelings that do at least as well); no cut is made on it, so there is no level.
//   structure  other (a slot is disputed) | same (agreement, no dispute, pinned) | gap (nothing shared, not pinned, or the null is too big).
//              gap is not a failure: the caller defaults to Other, as for sameFold.
// Still DECLARED, and named so: `roots`/`inverse` (which labels are identity-bearing, and which hold one filler per event end2; default
// the four kāraka roots, giver Pāṇini) and `budget` (how large an exact null this enumerates before it refuses: a compute guard and never a
// verdict dial; over it the answer is the typed gap `null_too_large`, not a sample). Numeric tolerance (sameFold's `tol`) is not offered: a
// tolerance is a hand-set threshold, and equal values are the only agreement this measure knows.
export const KARAKA_ROOTS = Object.freeze(["kartṛ", "karman", "sampradāna", "apādāna"]);
export const NULL_BUDGET = 362880; // 9!: the largest exact null enumerated in well under a second on a laptop; beyond it, typed gap, never a sample

const slotKey = (label, at) => JSON.stringify([label, at]);
const factorial = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };

export function dmdFoldExact(a, b, { roots = KARAKA_ROOTS, inverse = KARAKA_ROOTS, budget = NULL_BUDGET } = {}) {
  const edgesOf = (f) => { const out = []; for (const r of (f?.relations ?? new Map()).values()) if (roots.includes(r.label)) for (const [end2, addr] of r.ends) out.push({ end1: r.end1, label: r.label, end2, addr: addr ?? [] }); return out; };
  const ea = edgesOf(a), eb = edgesOf(b);
  // SLOTS: an inverse-functional label holds one filler (end1) per (label, end2); any other root label holds one filler (end2) per (end1, label)
  const slots = new Map();
  const put = (edges, s) => { for (const e of edges) { const inv = inverse.includes(e.label), at = inv ? e.end2 : e.end1, filler = inv ? e.end1 : e.end2, k = slotKey(e.label, at); if (!slots.has(k)) slots.set(k, { label: e.label, at, a: new Map(), b: new Map() }); slots.get(k)[s].set(filler, e.addr); } };
  put(ea, "a"); put(eb, "b");
  const trail = [], count = { agree: 0, dispute: 0, hole: 0 };
  for (const [key, s] of slots) {
    const common = [...s.a.keys()].filter((f) => s.b.has(f));
    const verdict = !s.a.size || !s.b.size ? "hole" : common.length ? "agree" : "dispute";
    count[verdict]++;
    trail.push({ key, label: s.label, at: s.at, verdict, a: [...s.a.keys()], b: [...s.b.keys()], addr: { a: [...s.a.values()].flat(), b: [...s.b.values()].flat() } });
  }
  const out = (structure, why, extra = {}) => ({ structure, why, slots: count, trail, shared: 0, evidence: null, ...extra });
  if (count.dispute) return out("other", `${count.dispute} root slot(s) filled with a different filler on each side`);

  // number what can move (entities) and what cannot (values); classes are entities that appear in the same positions (end1 / end2)
  const place = new Map(), values = new Set();
  for (const e of [...ea, ...eb]) for (const [x, bit] of [[e.end1, 1], [e.end2, 2]]) { if (typeof x === "number") values.add(x); else place.set(x, (place.get(x) ?? 0) | bit); }
  const ents = [...place.keys()], M = ents.length + values.size, id = new Map([...ents, ...values].map((x, i) => [x, i]));
  const lab = new Map([...new Set([...ea, ...eb].map((e) => e.label))].map((l, i) => [l, i])), L = lab.size;
  const enc = (x, l, y) => (x * L + l) * M + y;
  const tri = (e) => [id.get(e.end1), lab.get(e.label), id.get(e.end2)];
  const sa = ea.map(tri), sbKeys = new Set(eb.map((e) => enc(...tri(e))));
  const S = sa.filter((t) => sbKeys.has(enc(...t))), sKeys = new Set(S.map((t) => enc(...t)));
  if (!S.length) return out("gap", "no root slot is filled with the same filler on both sides: nothing can be tested");

  const byPlace = new Map();
  ents.forEach((e, i) => { const p = place.get(e); if (!byPlace.has(p)) byPlace.set(p, []); byPlace.get(p).push(i); });
  const classes = [...byPlace.values()].filter((c) => c.length > 1), N = classes.reduce((n, c) => n * factorial(c.length), 1);
  if (N > budget) return out("gap", `null_too_large: ${N} relabelings exceed the declared budget of ${budget}; a sample would be a guess, so this refuses`, { shared: S.length, evidence: { nullSize: N, budget } });

  const perm = Array.from({ length: M }, (_, i) => i), swap = (p, q) => { const t = perm[p]; perm[p] = perm[q]; perm[q] = t; };
  let atLeast = 0, movers = 0, witness = null;
  const judge = () => {
    let g = 0; for (const [x, l, y] of sa) if (sbKeys.has(enc(perm[x], l, perm[y]))) g++;
    if (g < S.length) return;                                    // this relabeling agrees less than the real pair: below it
    atLeast++;
    for (const [x, l, y] of S) if (!sKeys.has(enc(perm[x], l, perm[y]))) { movers++; witness ??= ents.flatMap((e, i) => (perm[i] !== i ? [[e, ents[perm[i]]]] : [])); return; }
  };
  const walk = (ci, k) => {
    if (ci === classes.length) return judge();
    const c = classes[ci];
    if (k === c.length) return walk(ci + 1, 0);
    for (let i = k; i < c.length; i++) { swap(c[k], c[i]); walk(ci, k + 1); swap(c[k], c[i]); }
  };
  walk(0, 0);
  const evidence = { nullSize: N, atLeastAsGood: atLeast, movers, p: atLeast / N, witness };
  if (movers) return out("gap", "the agreement does not pin identity: a relabeling that moves the agreeing edges agrees as much (a coincidence this vocabulary can produce, or a symmetry of the fold)", { shared: S.length, evidence });
  return out("same", `${S.length} root edge(s) agree, no slot is disputed, and no relabeling that moves them agrees as much`, { shared: S.length, evidence });
}

// SAME-OR-OTHER, exact: the significance triad of sameOrOther with dmdFoldExact as its EVA. Polarity is unchanged and is a declared POLICY, not
// a measurement: a negation or modality difference is a difference that makes a difference even when every edge is identical (the re-zero).
//   verdict  other  structure other, or polarity other (a sign flip decides even over a gap: different things are not the same thing)
//            gap    structure gap (the caller defaults to Other)
//            same   structure same and polarity same
export function sameOrOtherExact(a, b, opts = {}) {
  const d = dmdFoldExact(a?.fold, b?.fold, opts);
  const pa = a?.polarity ?? {}, pb = b?.polarity ?? {};
  const polarity = (!!pa.neg !== !!pb.neg || (pa.modal ?? null) !== (pb.modal ?? null)) ? "other" : "same";
  const verdict = d.structure === "other" || polarity === "other" ? "other" : d.structure === "gap" ? "gap" : "same";
  return { structure: d.structure, polarity, verdict, why: d.why, slots: d.slots, shared: d.shared, evidence: d.evidence, trail: d.trail };
}

// HOLARCHY. Reality in a fold is not heaps of facts but wholes that are parts of wholes: a relationship either says "x is a part of y" (partOf)
// or "x depends on y" (dependsOn: the one that depends is the whole, the one depended on is the part). The dependency ORDER is the pattern grain
// made exact: it does not care what the holons are called.
//   holarchy(fold, { partOf: ["part_of"], dependsOn: ["rooted_in"] }) -> { nodes, parts: Map whole -> Set(part), wholes: Map part -> Set(whole) }
//   levelOf     0 for a holon with no parts in the record; otherwise 1 + the highest level of its parts (its DEPTH below it)
//   destroy     the set that falls with x: x and every whole above it, transitively, and none of the parts below ("destroy any holon and you destroy all the
//               holons above it and none below": the test that tells higher from lower)
//   extrinsic   how many holons fall with it (value for others);   intrinsic = its level (its own depth)
//   profile     depth (number of levels) and span per level (holons on each level); the usual law is greater depth, less span: violations are returned,
//               because a record that breaks it may hold heaps, not wholes, and its extraction is suspect
//   fingerprint a name-free canonical form: the per-holon pair (level, extrinsic) sorted, so two records with the same dependency order match
//               whatever the holons are called
//   sameHolarchy(a, b, { anchors }) -> { pattern: same|other, aligned: [{ holon, destroyA, destroyB, verdict }], verdict }
//               pattern = equal fingerprints; aligned = for each holon anchored in both, does destroying it take the same wholes with it (mapped through anchors)?
export function holarchy(fold, { partOf = ["part_of"], dependsOn = ["rooted_in"] } = {}) {
  const parts = new Map(), wholes = new Map(), nodes = new Set();
  const add = (whole, part) => { nodes.add(whole); nodes.add(part); if (!parts.has(whole)) parts.set(whole, new Set()); parts.get(whole).add(part); if (!wholes.has(part)) wholes.set(part, new Set()); wholes.get(part).add(whole); };
  for (const r of fold.relations.values()) for (const e2 of r.ends.keys()) {
    if (typeof e2 === "number") continue;
    if (partOf.includes(r.label)) add(e2, r.end1);        // end1 is a part of end2
    else if (dependsOn.includes(r.label)) add(r.end1, e2); // end1 depends on end2: end2 is the part
  }
  return { nodes, parts, wholes };
}
export function levelOf(h) {
  const memo = new Map(), visiting = new Set();
  const lv = (n) => { if (memo.has(n)) return memo.get(n); if (visiting.has(n)) return 0; visiting.add(n); let m = 0; for (const p of h.parts.get(n) ?? []) m = Math.max(m, 1 + lv(p)); visiting.delete(n); memo.set(n, m); return m; };
  return new Map([...h.nodes].map((n) => [n, lv(n)]));
}
export function destroy(h, x) {
  const fallen = new Set([x]), todo = [x];
  while (todo.length) for (const w of h.wholes.get(todo.pop()) ?? []) if (!fallen.has(w)) { fallen.add(w); todo.push(w); }
  return fallen;
}
export function profile(h) {
  const lv = levelOf(h), span = [];
  for (const l of lv.values()) span[l] = (span[l] ?? 0) + 1;
  const spans = Array.from(span, (x) => x ?? 0), violations = [];
  for (let l = 1; l < spans.length; l++) if (spans[l] > spans[l - 1]) violations.push({ level: l, span: spans[l], below: spans[l - 1] });
  return { depth: spans.length, span: spans, violations };
}
export function fingerprint(h) {
  const lv = levelOf(h);
  return [...h.nodes].map((n) => `${lv.get(n)}:${destroy(h, n).size - 1}`).sort().join(",");
}
export function sameHolarchy(a, b, { anchors = {} } = {}) {
  const fa = fingerprint(a), fb = fingerprint(b), pattern = fa === "" || fb === "" ? "gap" : fa === fb ? "same" : "other";
  const aligned = [];
  for (const n of a.nodes) {
    if (!b.nodes.has(n)) continue;
    const da = [...destroy(a, n)].sort(), db = [...destroy(b, n)].sort();
    aligned.push({ holon: n, destroyA: da, destroyB: db, verdict: da.join("|") === db.join("|") ? "agree" : "dispute" });
  }
  const dispute = aligned.some((r) => r.verdict === "dispute"), agree = aligned.some((r) => r.verdict === "agree");
  return { pattern, aligned, verdict: dispute ? "other" : agree ? "same" : "gap" };
}
