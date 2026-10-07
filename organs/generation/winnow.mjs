#!/usr/bin/env node
// organs/generation/winnow.mjs — HUNT → WINNOW → CORRECT → BREED, DOMAIN-SHARED.
//
// The house law is library → box → hunt → mouth. This organ is the layer the
// generation engine has never had: what to do with the hunt's ABUNDANCE. The
// mouth is not in this file. The center of gravity is the SUCCESS DEFINITION —
// most of the work is deciding what counts as winning and error-correcting
// against it, not drawing more cloth.
//
//   DEFINE SUCCESS  the acceptance bar is MEASURED, never set. Two measured
//                   gates: (1) the RERUN-NULL floor — the same seed scored
//                   `draws` times; the max |Δ| between reruns IS the
//                   false-positive band (a null drawn once is a null drawn
//                   zero times); (2) the BORN-MASS test — an improvement Δ
//                   over the best must carry mass Δ² that clears the
//                   alpha-quantile of the population's OWN observed
//                   improvements (a reroll never does). Givers:
//                   lavar/elenchus-bar.mjs, pulled in verbatim below.
//   HUNT            over-produce candidates — "lots of ways to get there":
//                   every genome the declared space offers, legal at birth
//                   against the dependency DAG, plus whatever the caller's
//                   field supplies (a search, the corpus, another agent).
//                   An illegal genotype is refused at birth, by name.
//   WINNOW          run EVERY candidate under the SAME measure and keep only
//                   the ones that carry signal over the seed's own floor;
//                   kill the rest with a named reason (no-signal /
//                   within-null-floor / duplicate-behavior). Most are killed.
//   CORRECT         for a survivor that still fails, apply the caller's repair
//                   transforms against the named failure; a transform that
//                   DEGRADES is reverted and recorded (elenchus), never
//                   silently kept. Bounded by the budget, never unbounded.
//   BREED           crossover + mutate the survivors across generations; admit
//                   an offspring only if it clears the bar AND carries born
//                   mass; a refused offspring stays on the record.
//
// GL-EN-15 (low = possibility, high = probability): the breed PROPOSES; the
// success definition SELECTS. The result carries the champion AND the dissent
// (every refusal), by FALSIFY-OR-DIE. No threshold in this file is hand-set.
//
// The measure, the run, the field, the repair, the mutate and the crossover
// are all INJECTED — pure module, node builtins only, node-testable.

// ── THE MEASURED BAR (pulled in verbatim from lavar/elenchus-bar.mjs;
// eoreader7-tschichold native/eval/lavar, 2026-09-13; no imports, pure) ──

/** The declared rerun-null contract: how many times the seed is re-scored, and
 * the alpha whose quantile admits. Givers: null-arm's own seed discipline and
 * the repo's standing 0.05. */
export const RERUN_NULL = Object.freeze({ draws: 5, seed: 42, alpha: 0.05 });

/** rerunFloor(scores) — the max |Δ| across reruns of one candidate: the
 * reproducibility floor of the measure on this material. Pure. */
export function rerunFloor(scores = []) {
  let floor = 0;
  for (let i = 0; i < scores.length; i += 1) {
    for (let j = i + 1; j < scores.length; j += 1) {
      floor = Math.max(floor, Math.abs(scores[i] - scores[j]));
    }
  }
  return floor;
}

/** bornAcceptance({delta, populationDeltas, alpha}) — does this improvement
 * carry coherent born mass over the population's own improvement
 * distribution? The candidate's Δ² must clear the alpha-quantile of the
 * population's Δ² — a reroll never does. Pure. */
export function bornAcceptance({ delta = 0, populationDeltas = [], alpha = RERUN_NULL.alpha } = {}) {
  if (!Number.isFinite(delta) || delta <= 0) return false;
  const masses = populationDeltas.filter((d) => Number.isFinite(d)).map((d) => d * d);
  if (!masses.length) return false;
  const sorted = [...masses].sort((a, b) => a - b);
  const q = sorted[Math.max(0, Math.ceil((1 - alpha) * sorted.length) - 1)];
  return delta * delta >= q;
}

// ── DEFINE SUCCESS ──────────────────────────────────────────────────────────
/** successDefinition({ measure, seed, draws, alpha, budget }) — the primary
 * artifact. `measure(candidate)` is the caller's own scoring function over a
 * held-out set. The seed is scored `draws` times; the max |Δ| is the floor.
 * The bar is the floor, never below epsilon (so a zero floor still lets any
 * positive Δ through, and a measured nonzero floor is honored). `observed`
 * accumulates the population's own improvements (born-mass reference); the
 * caller records them via observe(). Nothing is tuned. */
export function successDefinition({ measure, seed, draws = RERUN_NULL.draws, alpha = RERUN_NULL.alpha, budget = null } = {}) {
  if (typeof measure !== "function") throw new Error("successDefinition: measure(candidate) is required");
  if (!Number.isInteger(draws) || draws < 1) throw new Error("successDefinition: draws must be a positive integer");
  const rerunScores = Array.from({ length: draws }, () => measure(seed));
  const floor = rerunFloor(rerunScores);
  const bar = Math.max(floor, Number.EPSILON);
  const observed = [];
  const sd = {
    schema: "SuccessDefinition@1",
    measure, seed, draws, alpha,
    budget: budget ?? draws,
    rerunScores, floor, bar,
    observed,
    observe(improvement) { if (Number.isFinite(improvement)) observed.push(improvement); },
    admits(improvement) {
      if (!Number.isFinite(improvement)) return { admitted: false, reason: "no-signal" };
      if (improvement < bar) return { admitted: false, reason: "below-null-floor" };
      if (!bornAcceptance({ delta: improvement, populationDeltas: observed, alpha })) return { admitted: false, reason: "insufficient-born-mass" };
      return { admitted: true, reason: "cleared-null-and-born-mass" };
    },
  };
  return sd;
}

// ── HUNT ────────────────────────────────────────────────────────────────────
/** hunt({ space, field, legal, deps, idOf }) — over-produce candidates. Every
 * genome in `space` is legal-checked at birth (a genotype that violates the
 * dependency DAG is refused, named); the caller's `field` may add more
 * (external material). Duplicates by id are collapsed. Returns the hunted
 * candidates and the births refused. */
export function hunt({ space = [], field = null, legal = () => true, deps = () => [], idOf = (c) => c?.id ?? c } = {}) {
  const candidates = [];
  const refusedAtBirth = [];
  const seen = new Set();
  for (const c of space) {
    const id = idOf(c);
    if (!legal(c)) { refusedAtBirth.push({ id, reason: "illegal-at-birth", missing: deps(c) }); continue; }
    if (seen.has(id)) { refusedAtBirth.push({ id, reason: "duplicate-in-space" }); continue; }
    seen.add(id);
    candidates.push(c);
  }
  const fromField = typeof field === "function" ? (field(candidates) ?? []) : [];
  const extra = [];
  for (const c of fromField) {
    const id = idOf(c);
    if (!legal(c)) { refusedAtBirth.push({ id, reason: "illegal-at-birth", source: "field" }); continue; }
    if (seen.has(id)) { refusedAtBirth.push({ id, reason: "duplicate-of-hunted", source: "field" }); continue; }
    seen.add(id);
    extra.push(c);
  }
  return { candidates: [...candidates, ...extra], refusedAtBirth, hunted: candidates.length + extra.length, fromSpace: candidates.length, fromField: extra.length };
}

// ── WINNOW ──────────────────────────────────────────────────────────────────
/** winnow({ candidates, sd, run, baseline, keyOf }) — run every candidate under
 * the SAME measure and keep only the ones that carry signal. `run(candidate)`
 * -> number | { score, detail }. A candidate is KILLED when it throws, when its
 * score is not finite (no-signal), when it sits within the seed's own null
 * floor (within-null-floor), or when it repeats another survivor's behavior
 * (duplicate-behavior). Every kill is named. Survivors are ranked best-first. */
export function winnow({ candidates = [], sd, run, baseline = null, keyOf = null } = {}) {
  if (typeof run !== "function") throw new Error("winnow: run(candidate) is required");
  const survivors = [];
  const killed = [];
  const behaviors = new Map();
  for (const c of candidates) {
    let score, detail = null;
    try {
      const r = run(c);
      score = typeof r === "number" ? r : r?.score;
      detail = typeof r === "object" ? (r?.detail ?? null) : null;
    } catch (e) {
      killed.push({ id: c?.id ?? String(c), reason: "threw", error: String(e?.message ?? e) });
      continue;
    }
    if (!Number.isFinite(score)) { killed.push({ id: c?.id ?? String(c), reason: "no-signal", score: null }); continue; }
    if (baseline !== null && Number.isFinite(baseline) && (score - baseline) <= sd.floor) {
      killed.push({ id: c?.id ?? String(c), reason: "within-null-floor", score, delta: score - baseline });
      continue;
    }
    if (typeof keyOf === "function") {
      const key = keyOf(c);
      if (behaviors.has(key)) { killed.push({ id: c?.id ?? String(c), reason: "duplicate-behavior", of: behaviors.get(key) }); continue; }
      behaviors.set(key, c?.id ?? String(c));
    }
    survivors.push({ candidate: c, score, detail });
  }
  survivors.sort((a, b) => b.score - a.score);
  return {
    survivors, killed,
    hunted: candidates.length, survived: survivors.length, winnowed: killed.length,
    best: survivors[0] ?? null,
  };
}

// ── CORRECT ─────────────────────────────────────────────────────────────────
/** correct({ candidate, sd, run, repair, attempts }) — error-correct a
 * survivor against the named failure. `repair(candidate, { score, detail,
 * step })` proposes the next candidate (or null when it has nothing left).
 * A proposal that raises the score is KEPT; one that degrades or carries no
 * signal is REVERTED and recorded (elenchus), and the loop continues. Bounded
 * by `attempts` (default sd.budget), never unbounded. Returns the best state,
 * the before-score, the kept steps and the refused proposals. */
export function correct({ candidate, sd, run, repair, attempts = null } = {}) {
  if (typeof run !== "function") throw new Error("correct: run(candidate) is required");
  if (typeof repair !== "function") throw new Error("correct: repair(candidate, failure) is required");
  const budget = Number.isInteger(attempts) && attempts >= 0 ? attempts : sd.budget;
  const first = run(candidate);
  let best = typeof first === "number"
    ? { candidate, score: first, detail: null }
    : { candidate, score: first?.score, detail: first?.detail ?? null };
  const before = best.score;
  const kept = [];
  const refused = [];
  for (let step = 0; step < budget; step += 1) {
    const proposal = repair(best.candidate, { score: best.score, detail: best.detail, step });
    if (!proposal) break;
    let score;
    try { const r = run(proposal); score = typeof r === "number" ? r : r?.score; }
    catch (e) { refused.push({ step, id: proposal?.id ?? null, reason: "threw", error: String(e?.message ?? e) }); continue; }
    if (!Number.isFinite(score)) { refused.push({ step, id: proposal?.id ?? null, reason: "no-signal", score: null }); continue; }
    if (score > best.score) { best = { candidate: proposal, score, detail: null }; kept.push({ step, id: proposal?.id ?? null, score }); continue; }
    refused.push({ step, id: proposal?.id ?? null, reason: score < best.score ? "degraded" : "flat", score });
  }
  return { candidate: best.candidate, score: best.score, before, improved: best.score > before, kept, refused };
}

// ── BREED ───────────────────────────────────────────────────────────────────
/** breed({ survivors, sd, run, mutate, crossover, legal, generations, idOf }) —
 * the generational loop. Parents are the ranked survivors. Each generation
 * crosses the top two, mutates, and runs the child; the child is admitted
 * only if it clears the bar AND carries born mass over the population's own
 * observed improvements (sd.observe records them). A refused or illegal child
 * stays on the elenchus. Returns the champion and the full dissent. */
export function breed({ survivors = [], sd, run, mutate, crossover, legal = () => true, generations = 1, idOf = (c) => c?.id ?? c } = {}) {
  if (typeof run !== "function") throw new Error("breed: run(candidate) is required");
  if (typeof mutate !== "function" || typeof crossover !== "function") throw new Error("breed: mutate and crossover are required");
  if (!survivors.length) return { best: null, generations: 0, kept: [], elenchus: [] };
  let ranked = [...survivors].sort((a, b) => b.score - a.score);
  let best = ranked[0];
  const kept = [];
  const elenchus = [];
  for (let gen = 1; gen <= generations; gen += 1) {
    const [a, b] = ranked;
    // THE BREED PROPOSES: the cross (elitism — the parents' own combination is
    // a candidate) AND a mutation of it. The definition selects among both.
    const cross = crossover(a.candidate, b.candidate);
    const children = [cross, mutate(cross, gen)];
    const seen = new Set();
    for (const child of children) {
      const id = idOf(child);
      if (seen.has(id)) continue;
      seen.add(id);
      if (!legal(child)) { elenchus.push({ gen, id, reason: "illegal-at-birth" }); continue; }
      let score;
      try { const r = run(child); score = typeof r === "number" ? r : r?.score; }
      catch (e) { elenchus.push({ gen, id, reason: "threw", error: String(e?.message ?? e) }); continue; }
      if (!Number.isFinite(score)) { elenchus.push({ gen, id, reason: "no-signal" }); continue; }
      const improvement = score - best.score;
      sd.observe(improvement);
      const verdict = sd.admits(improvement);
      if (verdict.admitted) {
        kept.push({ gen, id, score, improvement, from: [idOf(a.candidate), idOf(b.candidate)] });
        best = { candidate: child, score };
        ranked = [best, a];
      } else {
        elenchus.push({ gen, id, score, improvement, reason: verdict.reason });
      }
    }
  }
  return { best, generations, kept, elenchus };
}

// ── THE WHOLE MOVEMENT ──────────────────────────────────────────────────────
/** runWinnow(config) — hunt → winnow → correct → breed, one record. All of
 * measure/run/field/repair/mutate/crossover are injected. `baseline` is the
 * seed's own score (what "no better than the seed" means); if null the seed's
 * measured score is used. Returns a WinnowEOT@1 with the champion AND every
 * refusal (births, winnow kills, corrections, elenchus). */
export function runWinnow({
  space = [], field = null, legal = () => true, deps = () => [], idOf = (c) => c?.id ?? c,
  measure, seed, run, repair = null, mutate = null, crossover = null,
  generations = 0, baseline = null, keyOf = (c) => JSON.stringify(c),
  draws = RERUN_NULL.draws, alpha = RERUN_NULL.alpha,
} = {}) {
  if (typeof run !== "function") throw new Error("runWinnow: run(candidate) is required");
  const sd = successDefinition({ measure: measure ?? ((c) => (typeof run(c) === "number" ? run(c) : run(c)?.score)), seed, draws, alpha });
  const base = baseline === null ? sd.measure(seed) : baseline;
  // HUNT: over-produce, refuse illegal at birth.
  const hunted = hunt({ space, field, legal, deps, idOf });
  // WINNOW: run all, keep the signal.
  const winnowed = winnow({ candidates: hunted.candidates, sd, run, baseline: base, keyOf });
  // CORRECT: push the best survivor against its own failure, if a repair exists.
  let corrected = null;
  if (repair && winnowed.best) {
    corrected = correct({ candidate: winnowed.best.candidate, sd, run, repair });
  }
  // BREED: cross the survivors, admit by the bar + born mass.
  const parents = corrected && corrected.improved
    ? [{ candidate: corrected.candidate, score: corrected.score }, ...winnowed.survivors]
    : winnowed.survivors;
  const bred = (mutate && crossover) ? breed({ survivors: parents, sd, run, mutate, crossover, legal, generations, idOf }) : { best: parents[0] ?? null, generations: 0, kept: [], elenchus: [] };
  const champion = bred.best ?? corrected ?? winnowed.best ?? null;
  return {
    schema: "WinnowEOT@1",
    law: "define-success · hunt · winnow · correct · breed (falsify-or-die)",
    success: {
      schema: sd.schema, draws: sd.draws, alpha: sd.alpha, budget: sd.budget,
      rerunScores: sd.rerunScores, floor: sd.floor, bar: sd.bar,
      baseline: base, observed: [...sd.observed],
    },
    hunt: { hunted: hunted.hunted, fromSpace: hunted.fromSpace, fromField: hunted.fromField, refusedAtBirth: hunted.refusedAtBirth },
    winnow: { hunted: winnowed.hunted, survived: winnowed.survived, winnowed: winnowed.winnowed, killed: winnowed.killed, best: winnowed.best },
    correct: corrected,
    breed: { generations: bred.generations, kept: bred.kept, elenchus: bred.elenchus },
    champion,
    survivors: winnowed.survivors,
    dissent: {
      refusedAtBirth: hunted.refusedAtBirth.length,
      winnowKilled: winnowed.killed.length,
      correctionsRefused: corrected ? corrected.refused.length : 0,
      elenchus: bred.elenchus.length,
    },
  };
}

// ── selftest: every gate is SHOWN failing (a check that cannot fail is a comment) ──
export function selftest() {
  const checks = [];
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // 1. rerunFloor is the max pairwise |Δ|
  checks.push(["rerunFloor", rerunFloor([1, 1, 1.2, 0.9]) === 0.30000000000000004 || Math.abs(rerunFloor([1, 1, 1.2, 0.9]) - 0.3) < 1e-12]);
  // 2. bornAcceptance: a reroll (Δ<=0) carries zero mass and is refused
  checks.push(["bornAcceptance refuses a reroll", bornAcceptance({ delta: 0, populationDeltas: [0.1, 0.2] }) === false]);
  // 3. successDefinition measures the bar, never sets it (zero floor => epsilon)
  const sd = successDefinition({ measure: () => 0.5, seed: "s", draws: 3 });
  checks.push(["successDefinition bar = epsilon on a deterministic measure", sd.floor === 0 && sd.bar === Number.EPSILON]);
  // 4. hunt refuses an illegal genotype at birth, by name
  const h = hunt({ space: [{ id: "a" }, { id: "b" }], legal: (c) => c.id !== "b", deps: () => ["dep"] });
  checks.push(["hunt refuses illegal-at-birth", h.candidates.length === 1 && h.refusedAtBirth[0].id === "b" && h.refusedAtBirth[0].reason === "illegal-at-birth"]);
  // 5. winnow kills no-signal, within-null-floor, duplicate-behavior
  const sd2 = successDefinition({ measure: () => 0, seed: {}, draws: 2 });
  const w = winnow({
    candidates: [{ id: "a", out: "X" }, { id: "d", out: "X" }, { id: "b", out: "Y" }, { id: "c", out: "Z" }],
    sd: sd2, baseline: 0,
    run: (c) => ({ a: 5, d: 5, b: NaN, c: 0 }[c.id]),
    keyOf: (c) => c.out,
  });
  const reasons = w.killed.map((k) => k.reason).sort();
  checks.push(["winnow kills the three ways", w.survivors.length === 1 && eq(reasons, ["duplicate-behavior", "no-signal", "within-null-floor"])]);
  // 6. correct keeps an improving repair and reverts a degrading one
  const sd3 = successDefinition({ measure: () => 0, seed: {}, draws: 2 });
  const c1 = correct({ candidate: { id: "x0", v: 0 }, sd: sd3, run: (c) => c.v, repair: (c) => ({ id: c.id + "+", v: c.v + (c.v < 3 ? 1 : -1) }), attempts: 4 });
  checks.push(["correct keeps improving repairs and reverts degrading", c1.score === 3 && c1.refused.some((r) => r.reason === "degraded")]);
  // 7. breed refuses a degrading child (elenchus), admisses a real improvement
  const sd4 = successDefinition({ measure: () => 0, seed: { id: "s", v: 0 }, draws: 2 });
  sd4.observe(0.1); sd4.observe(0.2); sd4.observe(0.3); // born-mass reference
  const b = breed({
    survivors: [{ candidate: { id: "p1", v: 5 }, score: 5 }, { candidate: { id: "p2", v: 4 }, score: 4 }],
    sd: sd4, run: (c) => c.v,
    crossover: (a, b) => ({ id: "child", v: Math.max(a.v, b.v) }),
    mutate: (c, gen) => ({ ...c, id: "g" + gen, v: c.v + (gen === 1 ? 2 : -100) }),
    generations: 2,
  });
  checks.push(["breed admits a real improvement", b.best.score === 7]);
  checks.push(["breed records the refused children on the elenchus", b.elenchus.length >= 1 && b.elenchus.some((e) => e.reason === "below-null-floor")]);
  // 8. runWinnow carries the whole dissent
  const r = runWinnow({
    space: [{ id: "s", v: 0 }, { id: "a", v: 1 }, { id: "b", v: 9 }],
    measure: (c) => c.v, seed: { id: "s", v: 0 }, run: (c) => c.v, baseline: 0,
    keyOf: (c) => String(c.v),
  });
  checks.push(["runWinnow records hunt/winnow/dissent", r.schema === "WinnowEOT@1" && r.winnow.winnowed >= 1 && r.champion.score === 9]);
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  if (failed.length) throw new Error("winnow selftest failed: " + failed.join("; "));
  return { ok: true, checks: checks.length };
}

export default { RERUN_NULL, rerunFloor, bornAcceptance, successDefinition, hunt, winnow, correct, breed, runWinnow, selftest };
