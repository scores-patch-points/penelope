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
// A difference at node X makes a difference to the asker only if X is in the UPSTREAM closure of one of the asker's concerns: destroying X
// would destroy the concern. The arrow of time orders the closure: a node can only feed a concern if it is not LATER than it (an untimed node
// is an invariant and is earlier than everything). A dependency that points forward in time is a malformed holograph and is refused.
// A difference downstream of the concerns, or beside them, makes no difference to this asker however large it is.
//
// HOW A DIFFERENCE IS WEIGHED. Per dimension, absolute or relative, with the time gap allowed for in fluents (drift x years apart).
//   agree    within tolerance
//   differ   beyond tolerance, AND the node is strong, tied to its subject, and (for a fluent) stated in time; otherwise it is a HOLE
//   hole     one-side, untied or untimed: blocked, never a vote. Weak nodes can only support, never veto.
// Verdict: other (a strong, tied difference that makes a difference), equivalent (at least one strong agreement, no such difference), gap
// (nothing strong and comparable that makes a difference to this asker: the caller defaults to Other).
//
// Not here: forging. A tolerance on a forgeable dimension is forgeable (experiments/zero-overlap: rows 7, 8, 23); the caller must report the
// informed-adversary rate beside this verdict. Not here: how nodes and the dependency order are read from text (the reader's job).

export const ASKER_SCHEMA = "AskerVerdict@1";
const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const str = (x) => typeof x === "string" && x.trim().length > 0;
const refuse = (reason, detail) => ({ schema: ASKER_SCHEMA, ok: false, verdict: "refused", reason, ...(detail ? { detail } : {}) });

/** declareAsker({ name, by, why, concerns: [nodeId], tolerance: { dim: { kind: "abs"|"rel", tol, rate? } }, ladder? }) -> the DEF, or a refusal. */
export function declareAsker(spec = {}) {
  if (!isObj(spec)) return refuse("no_asker");
  const { name, by, why, concerns, tolerance, ladder = [10, 5, 2, 1, 0.5, 0.2, 0.1] } = spec;
  if (!str(name) || !str(by) || !str(why)) return refuse("asker_unbylined", "name, by and why are required: the tolerance is someone's, not the organ's");
  if (!Array.isArray(concerns) || !concerns.length || !concerns.every(str)) return refuse("no_concerns", "an asker cares about something");
  if (!isObj(tolerance) || !Object.keys(tolerance).length) return refuse("no_tolerance");
  for (const [dim, t] of Object.entries(tolerance)) if (!isObj(t) || !["abs", "rel"].includes(t.kind) || !(t.tol >= 0)) return refuse("bad_tolerance", dim);
  if (!Array.isArray(ladder) || !ladder.length || !ladder.every((f) => f > 0) || ladder.some((f, i) => i && f >= ladder[i - 1])) return refuse("bad_ladder", "strictly descending positive factors");
  return { schema: ASKER_SCHEMA, ok: true, name, by, why, concerns: [...concerns], tolerance: { ...tolerance }, ladder: [...ladder] };
}

const byId = (nodes) => new Map((nodes ?? []).map((n) => [n.id, n]));

/** The nodes that make a difference to the asker: the upstream closure of the concerns, ordered by the arrow of time. Refuses a forward dependency. */
export function meaningfulNodes(asker, nodes) {
  const g = byId(nodes), seen = new Set(), out = [];
  const queue = asker.concerns.filter((c) => g.has(c));
  for (const id of queue) {
    if (seen.has(id)) continue; seen.add(id); out.push(id);
    const n = g.get(id);
    for (const d of n.dependsOn ?? []) {
      const p = g.get(d);
      if (!p) continue;
      if (n.at != null && p.at != null && p.at > n.at) return { ok: false, reason: "arrow_of_time_violated", detail: `${id} (at ${n.at}) depends on ${d} (at ${p.at})` };
      queue.push(d);
    }
  }
  return { ok: true, ids: out };
}

const sameTimeKind = (n) => n.at == null; // an untimed node is an invariant
function weigh(tol, a, b, scale) {
  const base = tol.kind === "rel" ? Math.abs(a.value - b.value) / Math.max(Math.abs(a.value), Math.abs(b.value), 1e-9) : Math.abs(a.value - b.value);
  const gap = !sameTimeKind(a) && !sameTimeKind(b) ? Math.abs(a.at - b.at) : 0;
  const d = Math.max(0, base - (tol.rate ?? 0) * gap), allowed = tol.tol * scale;
  return { d, allowed, ratio: allowed > 0 ? d / allowed : d > 0 ? Infinity : 0 };
}

/** judgeAsker({ asker, a, b, scale = 1 }) -> AskerVerdict. a and b are the two folds' nodes (same ids name the same node on both sides). */
export function judgeAsker({ asker, a, b, scale = 1 } = {}) {
  if (!asker?.ok) return refuse("no_declared_asker");
  const all = [...(a ?? []), ...(b ?? [])];
  const m = meaningfulNodes(asker, all.length ? [...byId(all).values()] : []);
  if (!m.ok) return refuse(m.reason, m.detail);
  const A = byId(a), B = byId(b), trail = [], holes = [];
  let strongAgree = 0, strongDiffer = 0, residual = 0;
  for (const id of m.ids) {
    const x = A.get(id), y = B.get(id), dim = (x ?? y)?.dim;
    if (!x || !y) { holes.push({ id, why: "one-side" }); continue; }
    const tol = asker.tolerance[dim];
    if (!tol) { holes.push({ id, why: "asker_declared_no_tolerance_for_dimension" }); continue; }
    const w = weigh(tol, x, y, scale), strong = x.strength === "strong" && y.strength === "strong", tied = x.tied === true && y.tied === true;
    const timed = (sameTimeKind(x) && sameTimeKind(y)) || (!sameTimeKind(x) && !sameTimeKind(y));
    if (w.ratio <= 1) { trail.push({ id, outcome: strong ? "agree" : "support", d: w.d, allowed: w.allowed }); if (strong) strongAgree++; residual = Math.max(residual, w.ratio); continue; }
    if (strong && tied && timed) { trail.push({ id, outcome: "differ", d: w.d, allowed: w.allowed }); strongDiffer++; residual = Math.max(residual, w.ratio); continue; }
    holes.push({ id, why: !strong ? "weak_cannot_veto" : !tied ? "untied" : "untimed" });
  }
  const verdict = strongDiffer ? "other" : strongAgree ? "equivalent" : "gap";
  return { schema: ASKER_SCHEMA, ok: true, verdict, residual, meaningful: m.ids, trail, holes, scale, why: verdict === "other" ? "a strong, tied difference makes a difference to this asker" : verdict === "equivalent" ? "every difference that makes a difference to this asker is within its tolerance" : "nothing strong and comparable makes a difference to this asker: a hole, default Other" };
}

/** approach({ asker, a, b }) -> the verdict at every ladder level (loose to tight) and the finest level at which the pair still stands. */
export function approach({ asker, a, b } = {}) {
  if (!asker?.ok) return refuse("no_declared_asker");
  const levels = asker.ladder.map((scale) => ({ scale, verdict: judgeAsker({ asker, a, b, scale }) }));
  if (levels.some((l) => !l.verdict.ok)) return levels.find((l) => !l.verdict.ok).verdict;
  let finest = null;
  for (const l of levels) { if (l.verdict.verdict === "equivalent") finest = l.scale; else break; }
  return { schema: ASKER_SCHEMA, ok: true, levels: levels.map((l) => ({ scale: l.scale, verdict: l.verdict.verdict, residual: l.verdict.residual })), finest, stands: finest !== null, tightest: asker.ladder[asker.ladder.length - 1] };
}
