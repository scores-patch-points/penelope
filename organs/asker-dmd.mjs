// organs/asker-dmd.mjs — equivalence for the ASKER: two things are equivalent when the difference between them, for the person asking,
// is smaller than a difference that makes a difference to that person. PURE: no imports of any other repo, no text read, no model, no clock.
//
//   Eq_asker(A, B)  <=>  every difference that MAKES A DIFFERENCE to the asker is within the asker's own tolerance.
//   DEF  declareAsker: who asks, why, WHAT THEY CARE ABOUT (concerns: nodes of the dependency order), the tolerance per dimension, the ladder.
//   EVA  judgeAsker: the differences between two folds, kept only if they make a difference to the asker, then weighed against the tolerance.
//   REC  approach: tighten the tolerance down the ladder; the finest level at which the pair still stands is the approach, asymptotic in the
//        sense that it only ever moves toward identity. Monotone BY CONSTRUCTION: what is empirical is how pairs spread over the levels.
//
// WHAT MAKES A DIFFERENCE (the destroy test with the arrow of time). A node is a claim {id, dim, value, at, dependsOn, strength, tied}.
// A difference at node X makes a difference to the asker only if X is in the UPSTREAM closure of one of the asker's concerns on EITHER side:
// destroying X would destroy the concern. The closure is the union over both sides, so a side cannot hide a node by omitting an edge (an
// edge the two sides disagree on is recorded in `notes`). The arrow of time: a dependency {n dependsOn p} needs p to be earlier than or at the
// time of n; an untimed node is an invariant, earlier than everything, so an invariant cannot depend on a timed node. Every edge on each side
// is checked, reachable or not; a forward edge, a cycle, a duplicate id or a malformed node refuses the whole comparison.
//
// HOW A DIFFERENCE IS WEIGHED. Per dimension, absolute or relative; a fluent allows drift: rate x the time gap, with the gap CAPPED at the
// dimension's declared maxGap (so a huge gap cannot absorb any difference).
//   agree    within tolerance
//   differ   beyond tolerance, AND strong, tied to its subject, and consistently timed (both timed or both untimed); otherwise a HOLE
//   hole     one-side, untied, weak, mixed timing, dimension mismatch, no declared tolerance: blocked, never a vote
// Verdict: other (a strong, tied difference that makes a difference); equivalent (at least one strong agreement, no such difference, and NO
// concern is a hole: the asker cared about it); gap (otherwise: the caller defaults to Other). `coverage` and `holes` say how much was seen.
//
// Not here: forging. A tolerance on a forgeable dimension is forgeable (experiments/zero-overlap rows 7, 8, 23). strong and tied are the
// CALLER's assertions: the organ cannot see provenance. So the verdict carries `adversary`: the informed-adversary rate the caller measured
// for these dimensions, or null with a caveat. Not here: how nodes and the dependency order are read from text (the reader's job).

export const ASKER_SCHEMA = "AskerVerdict@1";
const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const str = (x) => typeof x === "string" && x.trim().length > 0;
const num = (x) => typeof x === "number" && Number.isFinite(x);
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;
const refuse = (reason, detail) => ({ schema: ASKER_SCHEMA, ok: false, verdict: "refused", reason, ...(detail ? { detail } : {}) });
const DECLARED = new WeakSet(); // only askers made by declareAsker are trusted: a hand-built {ok:true} is refused

export const KINDS = Object.freeze({
  "asker-verdict": { cell: "EVA·Pattern", why: "equivalent / other / gap for one asker: the differences that make a difference to them against their tolerance, with the holes and the coverage" },
  "asker-declaration": { cell: "DEF·Ground", why: "an asker's concerns, tolerances and ladder, bylined and fixed before the two folds are read" },
});
export const verdictBody = (pairSha, v) => ({ addr: `asker:${pairSha}`, body: { verdict: v.verdict, residual: v.residual, meaningful: v.meaningful, holes: v.holes, coverage: v.coverage, adversary: v.adversary } });

/** declareAsker({ name, by, why, concerns: [nodeId], tolerance: { dim: { kind: "abs"|"rel", tol, rate?, maxGap? } }, ladder?, ratified? }) -> the DEF, or a refusal. */
export function declareAsker(spec = {}) {
  if (!isObj(spec)) return refuse("no_asker");
  const { name, by, why, concerns, tolerance, ladder = [10, 5, 2, 1, 0.5, 0.2, 0.1], ratified = false } = spec;
  if (!str(name) || !TOKEN.test(name) || !str(by) || !str(why)) return refuse("asker_unbylined", "name (a plain token), by and why are required: the tolerance is someone's, not the organ's");
  if (!Array.isArray(concerns) || !concerns.length || !concerns.every(str)) return refuse("no_concerns", "an asker cares about something");
  if (!isObj(tolerance) || !Object.keys(tolerance).length) return refuse("no_tolerance");
  const tol = {};
  for (const [dim, t] of Object.entries(tolerance)) {
    if (!isObj(t) || !["abs", "rel"].includes(t.kind) || !num(t.tol) || t.tol < 0 || (t.kind === "rel" && t.tol > 1)) return refuse("bad_tolerance", dim);
    const rate = t.rate ?? 0;
    if (!num(rate) || rate < 0) return refuse("bad_rate", dim);
    if (rate > 0 && !(num(t.maxGap) && t.maxGap > 0)) return refuse("drift_needs_maxGap", `${dim}: a drift rate needs a declared cap on the time gap`);
    tol[dim] = Object.freeze({ kind: t.kind, tol: t.tol, rate, maxGap: rate > 0 ? t.maxGap : 0 });
  }
  if (!Array.isArray(ladder) || !ladder.length || !ladder.every((f) => num(f) && f > 0) || ladder.some((f, i) => i && f >= ladder[i - 1])) return refuse("bad_ladder", "strictly descending finite positive factors");
  const asker = Object.freeze({ schema: ASKER_SCHEMA, ok: true, name, by, why, ratified: ratified === true, concerns: Object.freeze([...concerns]), tolerance: Object.freeze(tol), ladder: Object.freeze([...ladder]) });
  DECLARED.add(asker);
  return asker;
}

function readSide(nodes) {
  if (!Array.isArray(nodes)) return refuse("bad_nodes", "a fold is an array of nodes");
  const map = new Map();
  for (const n of nodes) {
    if (!isObj(n) || !str(n.id) || !str(n.dim)) return refuse("bad_node", "id and dim are required strings");
    if (!num(n.value)) return refuse("bad_value", `${n.id}: value must be a finite number`);
    if (!(n.at === null || n.at === undefined || num(n.at))) return refuse("bad_time", `${n.id}: at must be a finite number or absent`);
    if (n.strength !== "strong" && n.strength !== "weak") return refuse("bad_strength", n.id);
    if (typeof n.tied !== "boolean") return refuse("bad_tied", n.id);
    if (n.dependsOn !== undefined && !(Array.isArray(n.dependsOn) && n.dependsOn.every(str))) return refuse("bad_dependsOn", n.id);
    if (map.has(n.id)) return refuse("duplicate_id", n.id);
    map.set(n.id, { ...n, at: n.at ?? null, dependsOn: [...(n.dependsOn ?? [])] });
  }
  for (const n of map.values()) for (const d of n.dependsOn) { // the arrow of time on EVERY edge, reachable or not
    const p = map.get(d); if (!p) continue;
    if (p.at !== null && (n.at === null || p.at > n.at)) return refuse("arrow_of_time_violated", `${n.id} (at ${n.at}) depends on ${d} (at ${p.at})`);
  }
  const state = new Map(); // cycle check
  const visit = (id) => { if (state.get(id) === 2) return false; if (state.get(id) === 1) return true; state.set(id, 1); for (const d of map.get(id).dependsOn) if (map.has(d) && visit(d)) return true; state.set(id, 2); return false; };
  for (const id of map.keys()) if (visit(id)) return refuse("dependency_cycle", id);
  return { ok: true, map };
}

function closure(concerns, map) {
  const seen = new Set(), queue = concerns.filter((c) => map.has(c));
  for (let i = 0; i < queue.length; i++) { const id = queue[i]; if (seen.has(id)) continue; seen.add(id); for (const d of map.get(id).dependsOn) if (map.has(d)) queue.push(d); }
  return seen;
}

function weigh(tol, x, y, scale) {
  const base = tol.kind === "rel" ? Math.abs(x.value - y.value) / Math.max(Math.abs(x.value), Math.abs(y.value), 1e-9) : Math.abs(x.value - y.value);
  const gap = x.at !== null && y.at !== null ? Math.min(Math.abs(x.at - y.at), tol.maxGap) : 0;
  const d = Math.max(0, base - tol.rate * gap), allowed = tol.tol * scale;
  return { d, allowed, ratio: allowed > 0 ? d / allowed : d > 0 ? 1e9 : 0 };
}

/** judgeAsker({ asker, a, b, scale = 1, informedRate = null }) -> AskerVerdict. a and b are the two folds' nodes (the same id names the same node). */
export function judgeAsker({ asker, a, b, scale = 1, informedRate = null } = {}) {
  if (!asker || !DECLARED.has(asker)) return refuse("no_declared_asker", "use declareAsker; a hand-built asker is not trusted");
  if (!num(scale) || scale <= 0) return refuse("bad_scale", "scale must be a finite positive number");
  if (informedRate !== null && !(num(informedRate) && informedRate >= 0 && informedRate <= 1)) return refuse("bad_informedRate");
  const A = readSide(a); if (!A.ok) return A;
  const B = readSide(b); if (!B.ok) return B;
  const ids = new Set([...closure(asker.concerns, A.map), ...closure(asker.concerns, B.map)]);
  const trail = [], holes = [], notes = [], compared = new Map(); let strongAgree = 0, strongDiffer = 0, residual = 0;
  const hole = (id, why) => { holes.push({ id, why }); compared.set(id, "hole"); };
  for (const id of ids) {
    const x = A.map.get(id), y = B.map.get(id);
    if (!x || !y) { hole(id, "one-side"); continue; }
    if (x.dim !== y.dim) { hole(id, "dimension_mismatch"); continue; }
    if ([...x.dependsOn].sort().join("\u0000") !== [...y.dependsOn].sort().join("\u0000")) notes.push({ id, note: "edges_disagree" });
    const tol = asker.tolerance[x.dim];
    if (!tol) { hole(id, "asker_declared_no_tolerance_for_dimension"); continue; }
    const w = weigh(tol, x, y, scale), strong = x.strength === "strong" && y.strength === "strong", tied = x.tied && y.tied, mixed = (x.at === null) !== (y.at === null);
    if (w.ratio <= 1) { trail.push({ id, outcome: strong ? "agree" : "support", d: w.d, allowed: w.allowed, ...(mixed ? { note: "mixed_timing: no drift allowed" } : {}) }); compared.set(id, strong ? "agree" : "support"); if (strong) strongAgree++; residual = Math.max(residual, w.ratio); continue; }
    if (strong && tied && !mixed) { trail.push({ id, outcome: "differ", d: w.d, allowed: w.allowed }); compared.set(id, "differ"); strongDiffer++; residual = Math.max(residual, w.ratio); continue; }
    hole(id, !strong ? "weak_cannot_veto" : !tied ? "untied" : "mixed_timing");
  }
  const concernHoles = asker.concerns.filter((c) => !ids.has(c) || compared.get(c) === "hole" || compared.get(c) === "support");
  const verdict = strongDiffer ? "other" : strongAgree && !concernHoles.length ? "equivalent" : "gap";
  return { schema: ASKER_SCHEMA, ok: true, verdict, residual, meaningful: [...ids], trail, holes, notes, concernHoles, coverage: { concerns: asker.concerns.length, concernsAnswered: asker.concerns.length - concernHoles.length, nodesCompared: trail.length, holes: holes.length }, adversary: { informedRate, caveat: informedRate === null ? "informed-adversary rate not supplied: strong and tied are the caller's assertions" : undefined }, scale, why: verdict === "other" ? "a strong, tied difference makes a difference to this asker" : verdict === "equivalent" ? "every difference that makes a difference to this asker is within its tolerance, and every concern was answered" : strongAgree ? "something agrees, but a concern is a hole: not established, default Other" : "nothing strong and comparable makes a difference to this asker: a hole, default Other" };
}

/** approach({ asker, a, b, informedRate }) -> the verdict at every ladder level (loose to tight) and the finest level at which the pair still stands. */
export function approach({ asker, a, b, informedRate = null } = {}) {
  if (!asker || !DECLARED.has(asker)) return refuse("no_declared_asker", "use declareAsker; a hand-built asker is not trusted");
  const levels = asker.ladder.map((scale) => ({ scale, v: judgeAsker({ asker, a, b, scale, informedRate }) }));
  const bad = levels.find((l) => !l.v.ok); if (bad) return bad.v;
  let finest = null;
  for (const l of levels) { if (l.v.verdict === "equivalent") finest = l.scale; else break; }
  return { schema: ASKER_SCHEMA, ok: true, levels: levels.map((l) => ({ scale: l.scale, verdict: l.v.verdict, residual: l.v.residual })), finest, stands: finest !== null, tightest: asker.ladder[asker.ladder.length - 1], coverage: levels[levels.length - 1].v.coverage, adversary: levels[0].v.adversary };
}
