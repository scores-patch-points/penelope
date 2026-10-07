// organs/generation/winnow.test.mjs — every gate shown failing.
// Run: node --test organs/generation/winnow.test.mjs
//
// The tests are the falsifying controls: each one constructs the case that
// would trip its gate and asserts the gate fires. A gate that cannot be shown
// firing here is a comment, not a gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RERUN_NULL, rerunFloor, bornAcceptance, successDefinition, hunt, winnow, correct, breed, runWinnow, selftest,
} from "./winnow.mjs";

const close = (a, b, eps = 1e-12) => Math.abs(a - b) <= eps;

test("selftest holds", () => {
  assert.equal(selftest().ok, true);
});

test("rerunFloor is the max pairwise |Δ|; a deterministic candidate measures zero", () => {
  assert.ok(close(rerunFloor([0.5, 0.5, 0.5]), 0));
  assert.ok(Math.abs(rerunFloor([1, 1, 1.2, 0.9]) - 0.3) < 1e-9);
  // falsifying control: if rerunFloor returned a constant the max-|Δ| claim is dead
  assert.notEqual(rerunFloor([0, 5]), rerunFloor([0, 0]));
});

test("bornAcceptance: a reroll carries zero mass and cannot recruit", () => {
  assert.equal(bornAcceptance({ delta: 0, populationDeltas: [0.1, 0.2] }), false);
  assert.equal(bornAcceptance({ delta: -1, populationDeltas: [0.1, 0.2] }), false);
  // a real improvement over a flat-population distribution clears the quantile
  assert.equal(bornAcceptance({ delta: 10, populationDeltas: [0.1, 0.2, 0.3] }), true);
  // falsifying control: with no population observed, nothing can be admitted
  assert.equal(bornAcceptance({ delta: 10, populationDeltas: [] }), false);
});

test("successDefinition MEASURES the bar — a deterministic measure gives epsilon, never a set number", () => {
  const sd = successDefinition({ measure: () => 0.42, seed: "s", draws: 4 });
  assert.equal(sd.floor, 0);
  assert.equal(sd.bar, Number.EPSILON);
  assert.equal(sd.rerunScores.length, 4);
  // a noisy measure sets a nonzero bar from the data, not a literal
  let n = 0;
  const noisy = successDefinition({ measure: () => [0.2, 0.4][n++ % 2], seed: "s", draws: 4 });
  assert.ok(close(noisy.bar, 0.2));
  assert.throws(() => successDefinition({ seed: "s" }), /measure/);
});

test("hunt refuses an illegal genotype at birth, by name, with its missing deps", () => {
  const h = hunt({ space: [{ id: "a" }, { id: "b" }, { id: "a" }], legal: (c) => c.id !== "b", deps: () => ["dep"] });
  assert.equal(h.candidates.length, 1);
  const bRef = h.refusedAtBirth.find((r) => r.id === "b");
  assert.equal(bRef.reason, "illegal-at-birth");
  assert.deepEqual(bRef.missing, ["dep"]);
  assert.ok(h.refusedAtBirth.some((r) => r.reason === "duplicate-in-space"));
  // the field may add a candidate; an illegal field candidate is refused, not admitted
  const h2 = hunt({ space: [{ id: "a" }], legal: (c) => c.id !== "z", field: () => [{ id: "z" }, { id: "y" }] });
  assert.equal(h2.candidates.length, 2);
  assert.ok(h2.refusedAtBirth.some((r) => r.id === "z" && r.reason === "illegal-at-birth"));
});

test("winnow kills no-signal, within-null-floor, duplicate-behavior and throws; survivors rank", () => {
  const sd = successDefinition({ measure: () => 0, seed: {}, draws: 2 });
  const w = winnow({
    candidates: [{ id: "a", out: "X" }, { id: "d", out: "X" }, { id: "b", out: "Y" }, { id: "c", out: "Z" }, { id: "e", out: "T" }],
    sd, baseline: 0,
    run: (c) => ({ a: 5, d: 5, b: NaN, c: 0 }[c.id] ?? (() => { throw new Error("boom"); })()),
    keyOf: (c) => c.out,
  });
  assert.equal(w.survivors.length, 1);
  assert.equal(w.survivors[0].candidate.id, "a");
  assert.deepEqual(w.killed.map((k) => k.reason).sort(), ["duplicate-behavior", "no-signal", "threw", "within-null-floor"]);
  // the null-floor gate is LIVE: one above the floor survives, exactly-at dies
  const sdE = successDefinition({ measure: () => 0, seed: {}, draws: 2 });
  const at = winnow({ candidates: [{ id: "at" }], sd: sdE, baseline: 0, run: () => 0 });
  const above = winnow({ candidates: [{ id: "above" }], sd: sdE, baseline: 0, run: () => 1e-9 });
  assert.equal(at.survivors.length, 0, "at-floor dies");
  assert.equal(above.survivors.length, 1, "above-floor lives");
});

test("correct keeps improving repairs, reverts a degrading one, and is bounded by the budget", () => {
  const sd = successDefinition({ measure: () => 0, seed: {}, draws: 2 });
  let calls = 0;
  const c = correct({
    candidate: { id: "x0", v: 0 }, sd, run: (x) => x.v,
    repair: (x) => { calls += 1; return { id: x.id + "+", v: x.v < 3 ? x.v + 1 : x.v - 1 }; },
    attempts: 4,
  });
  assert.equal(c.score, 3);
  assert.equal(c.improved, true);
  assert.equal(c.kept.length, 3);
  assert.ok(c.refused.some((r) => r.reason === "degraded"));
  assert.ok(calls <= 4, "bounded: never more repair calls than the budget");
});

test("breed admits a real improvement and records the refused child on the elenchus", () => {
  const sd = successDefinition({ measure: () => 0, seed: { id: "s", v: 0 }, draws: 2 });
  sd.observe(0.1); sd.observe(0.2); sd.observe(0.3);
  const b = breed({
    survivors: [{ candidate: { id: "p1", v: 5 }, score: 5 }, { candidate: { id: "p2", v: 4 }, score: 4 }],
    sd, run: (c) => c.v,
    crossover: (x, y) => ({ id: "child", v: Math.max(x.v, y.v) }),
    mutate: (c, gen) => ({ ...c, id: "g" + gen, v: c.v + (gen === 1 ? 2 : -100) }),
    generations: 2,
  });
  assert.equal(b.best.score, 7);
  assert.equal(b.kept.length, 1);
  assert.ok(b.elenchus.length >= 1, "refused offspring are kept on the elenchus");
  assert.ok(b.elenchus.some((e) => e.reason === "below-null-floor"));
  // an illegal child is refused, not run
  const b2 = breed({
    survivors: [{ candidate: { id: "p", v: 5 }, score: 5 }, { candidate: { id: "q", v: 4 }, score: 4 }],
    sd, run: (c) => c.v, legal: () => false,
    crossover: (x, y) => ({ id: "z" }), mutate: (c) => c, generations: 1,
  });
  assert.equal(b2.elenchus[0].reason, "illegal-at-birth");
});

test("runWinnow carries the whole movement and its dissent", () => {
  const r = runWinnow({
    space: [{ id: "s", v: 0 }, { id: "a", v: 1 }, { id: "b", v: 9 }, { id: "c", v: 0 }],
    measure: (c) => c.v, seed: { id: "s", v: 0 }, run: (c) => c.v, baseline: 0,
    keyOf: (c) => String(c.v),
  });
  assert.equal(r.schema, "WinnowEOT@1");
  assert.equal(r.champion.score, 9);
  assert.equal(r.winnow.survived, 2);           // 1 and 9 survive; 0,0 die within the floor
  assert.ok(r.dissent.winnowKilled >= 2);
  assert.equal(r.success.floor, 0);             // measured from the seed, not set
  // falsifying control for the whole motion: if the bar were hand-set high,
  // no candidate would survive — here the measurement lets the signal through
  assert.ok(r.success.bar === Number.EPSILON);
});

test("the success definition is the caller's measure — change the measure, change the champion", () => {
  const space = [{ id: "a", truth: 1, bytes: 100 }, { id: "b", truth: 2, bytes: 10 }];
  const seed = { id: "s", truth: 0, bytes: 0 };
  const byTruth = runWinnow({ space, seed, measure: (c) => c.truth * 100 - c.bytes, run: (c) => c.truth * 100 - c.bytes });
  assert.equal(byTruth.champion.candidate.id, "b", "truth outweighs size");
  const bySize = runWinnow({ space, seed, measure: (c) => c.bytes, run: (c) => c.bytes });
  assert.equal(bySize.champion.candidate.id, "a", "the same candidates, a different definition of winning");
});
