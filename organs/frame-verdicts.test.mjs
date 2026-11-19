import test from "node:test";
import assert from "node:assert/strict";
import { judgeFrames, admitLadder, effectiveFrames, admitWithIndependence, judgeLineage, commitProbe, revealProbe, compareClaims } from "./frame-verdicts.mjs";

const has = (needle) => ({ name: `has:${needle}`, why: "t", run: (c) => ({ pass: c.includes(needle), score: c.includes(needle) ? 1 : 0 }) });
test("fails the first frame: other, default stance", () => {
  assert.equal(judgeFrames({ frames: [has("bed")], claim: ["scar"], rivals: [] }).verdict, "other");
});
test("passes and no rival passes: same", () => {
  const j = judgeFrames({ frames: [has("bed")], claim: ["bed", "scar"], rivals: [["scar"], ["olive"]] });
  assert.equal(j.verdict, "same"); assert.equal(j.frame, "has:bed");
});
test("passes but a rival passes too: new_frame, then the next frame decides", () => {
  const j = judgeFrames({ frames: [has("scar"), has("bed")], claim: ["scar", "bed"], rivals: [["scar"], ["olive"]] });
  assert.equal(j.verdict, "same"); assert.equal(j.frame, "has:bed");
  assert.deepEqual(j.trail.map((t) => t.outcome), ["new_frame", "same"]);
});
test("claimant passes frame one, fails frame two: other, with the trail kept", () => {
  const j = judgeFrames({ frames: [has("scar"), has("bed")], claim: ["scar"], rivals: [["scar"]] });
  assert.equal(j.verdict, "other"); assert.equal(j.trail[0].outcome, "new_frame");
});
test("a ladder that never separates is a gap, never a guess", () => {
  const j = judgeFrames({ frames: [has("scar")], claim: ["scar"], rivals: [["scar"]] });
  assert.equal(j.verdict, "gap"); assert.equal(j.newFrameExhausted, true);
});
test("no frames or a malformed frame is a gap", () => {
  assert.equal(judgeFrames({ frames: [], claim: [] }).verdict, "gap");
  assert.equal(judgeFrames({ frames: [{ name: "x" }], claim: [] }).why, "malformed_frame");
});
test("a ladder revision is admitted only if BA rises and false accepts do not", () => {
  const b = { tp: 30, fn: 70, fa: 5, tn: 95 };
  assert.equal(admitLadder({ before: b, after: { tp: 40, fn: 60, fa: 5, tn: 95 } }).accept, true);
  assert.equal(admitLadder({ before: b, after: { tp: 60, fn: 40, fa: 30, tn: 70 } }).accept, false);
  assert.equal(admitLadder({ before: b, after: b }).accept, false);
});

test("independent frames give k_eff near k; correlated frames give less", () => {
  const ind = []; for (const a of [0, 1]) for (const b of [0, 1]) for (const c of [0, 1]) ind.push([!!a, !!b, !!c]);
  assert.ok(Math.abs(effectiveFrames({ patterns: ind }).k_eff - 3) < 1e-9);
  const cor = [[1,1,1],[1,1,1],[0,0,0],[0,0,0],[1,1,0],[0,0,1],[1,0,0],[0,1,0]].map((r) => r.map(Boolean));
  assert.ok(effectiveFrames({ patterns: cor }).k_eff < 3);
});
test("k_eff is null when it cannot be measured, never a guess", () => {
  assert.equal(effectiveFrames({ patterns: [[true, false], [false, false]] }).k_eff, null);
  assert.equal(effectiveFrames({ patterns: [] }).k_eff, null);
});
test("a frame is credited only if it raises k_eff as well as passing the gate", () => {
  const b = { tp: 30, fn: 70, fa: 5, tn: 95 }, a = { tp: 40, fn: 60, fa: 5, tn: 95 };
  assert.equal(admitWithIndependence({ before: b, after: a, kEffBefore: 1.9, kEffAfter: 1.9 }).accept, false);
  assert.equal(admitWithIndependence({ before: b, after: a, kEffBefore: 1.9, kEffAfter: 2.6 }).accept, true);
  assert.equal(admitWithIndependence({ before: b, after: a }).accept, false);
});
test("lineage: continuous, drifted (since when), broken; declared perspective is carried, not computed", () => {
  const f = [has("bed")], by = "wife";
  const s = (at, claim) => ({ at, claim });
  assert.equal(judgeLineage({ frames: f, states: [s(1, ["bed"]), s(2, ["bed"])] }).verdict, "continuous");
  const d = judgeLineage({ frames: f, states: [s(1, ["bed"]), s(2, ["bed"]), s(3, ["scar"])], declared: { by, text: "the man I married" } });
  assert.equal(d.verdict, "drifted"); assert.equal(d.since, 3); assert.equal(d.lastSame, 2); assert.equal(d.declared.by, by);
  assert.equal(judgeLineage({ frames: f, states: [s(1, ["scar"])] }).verdict, "broken");
  assert.equal(judgeLineage({ frames: f, states: [] }).verdict, "gap");
});

test("commit-reveal: the committed probe verifies; a swapped probe, wrong salt or missing part does not", () => {
  const c = commitProbe({ probe: "what is the bed attached to", salt: "s3cret" });
  assert.equal(revealProbe({ ...c, probe: "what is the bed attached to", salt: "s3cret" }).ok, true);
  assert.equal(revealProbe({ ...c, probe: "what colour is the cloak", salt: "s3cret" }).ok, false);
  assert.equal(revealProbe({ ...c, probe: "what is the bed attached to", salt: "other" }).ok, false);
  assert.equal(commitProbe({ probe: "x" }).commit, null);
  assert.equal(revealProbe({ commit: null, probe: "x", salt: "y" }).ok, false);
});

const C = (o) => ({ subject: "president", frame: "us-2024", ...o });
test("claims: an invariant (birthplace) has one value; two values dispute, the same value agrees", () => {
  const a = C({ id: 1, predicate: "born_in", kind: "invariant", value: "Scranton" });
  assert.equal(compareClaims(a, { ...a, id: 2, value: "Scranton" }).verdict, "agree");
  assert.equal(compareClaims(a, { ...a, id: 2, value: "Wilmington" }).verdict, "dispute");
});
test("claims: a fluent (location) can differ at different times and disputes only over overlapping times", () => {
  const a = C({ id: 1, predicate: "is_in", kind: "fluent", value: "Paris", at: [1, 3] });
  assert.equal(compareClaims(a, { ...a, id: 2, value: "Rome", at: [5, 7] }).verdict, "compatible");
  assert.equal(compareClaims(a, { ...a, id: 2, value: "Rome", at: [3, 7] }).verdict, "dispute");
  assert.equal(compareClaims(a, { ...a, id: 2, value: "Rome", at: [null, null] }).verdict, "dispute");
});
test("claims: different frames are incomparable; a missing dependency is blocked, never guessed; other subjects are unrelated", () => {
  const a = C({ id: 1, predicate: "is_in", kind: "fluent", value: "Paris", at: [1, 3] });
  assert.equal(compareClaims(a, { ...a, frame: "us-1990", value: "Rome", at: [1, 3] }).verdict, "incomparable");
  const d = { ...a, id: 3, dependsOn: [99] };
  assert.equal(compareClaims(d, { ...a, id: 4, value: "Rome", at: [5, 6] }, { record: [{ id: 1 }] }).verdict, "blocked");
  assert.equal(compareClaims(d, { ...a, id: 4, value: "Rome", at: [5, 6] }, { record: [{ id: 99 }] }).verdict, "compatible");
  assert.equal(compareClaims(a, { ...a, subject: "vp", value: "Rome" }).verdict, "unrelated");
});

test("numeric fluents: rounding is tolerated, drift explains small gaps over time, a fluent with no time is blocked", () => {
  const P = (id, value, at) => C({ id, predicate: "population", kind: "fluent", value, at });
  const o = { tol: 0.05, maxRate: 0.02 };
  assert.equal(compareClaims(P(1, 11825551, [2025, 2025]), P(2, 11800000, [2024, 2024]), o).verdict, "agree");
  assert.equal(compareClaims(P(1, 1588670, [2024, 2024]), P(2, 1234571, [2010, 2010]), o).verdict, "compatible"); // 22% over 14 years: drift explains it
  assert.equal(compareClaims(P(1, 1588670, [2024, 2024]), P(2, 300000, [2010, 2010]), o).verdict, "dispute");
  assert.equal(compareClaims(P(1, 1000, [2024, 2024]), P(2, 1150, [2019, 2019]), o).verdict, "compatible");
  assert.equal(compareClaims(P(1, 1000, [2024, 2024]), P(2, 2000, [2024, 2024]), o).verdict, "dispute");
  assert.equal(compareClaims(P(1, 1000, [2024, 2024]), { ...P(2, 2000), at: undefined }, o).verdict, "blocked");
  assert.equal(compareClaims(P(1, 1000, [2024, 2024]), P(2, 2000, [2000, 2000])).verdict, "compatible");
});

test("inferred time is carried with its uncertainty: it supports a dispute only beyond the widest drift", () => {
  const I = (id, value, at) => C({ id, predicate: "population", kind: "fluent", value, at, atInferred: true });
  const o = { tol: 0.05, maxRate: 0.03 };
  assert.equal(compareClaims(I(1, 1000, [2021, 2026]), I(2, 1200, [2021, 2026]), o).verdict, "compatible"); // 20% <= 5% + 3% x 5
  assert.equal(compareClaims(I(1, 1000, [2021, 2026]), I(2, 2000, [2021, 2026]), o).verdict, "blocked"); // default: an inferred time cannot falsify
  assert.equal(compareClaims(I(1, 1000, [2021, 2026]), I(2, 2000, [2021, 2026]), { ...o, inferredMayDispute: true }).verdict, "dispute");
  assert.equal(compareClaims(I(1, 1000, [2021, 2026]), C({ id: 2, predicate: "population", kind: "fluent", value: 1500, at: [2010, 2010] }), { ...o, inferredMayDispute: true }).inferred, true);
  const L = (id, v, at) => C({ id, predicate: "is_in", kind: "fluent", value: v, at, atInferred: true });
  assert.equal(compareClaims(L(1, "Paris", [2021, 2026]), L(2, "Rome", [2024, 2026])).verdict, "blocked");
  assert.equal(compareClaims(L(1, "Paris", [2010, 2012]), L(2, "Rome", [2024, 2026])).verdict, "compatible");
});
