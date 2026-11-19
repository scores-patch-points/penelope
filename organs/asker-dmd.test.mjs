import test from "node:test";
import assert from "node:assert/strict";
import { declareAsker, judgeAsker, approach } from "./asker-dmd.mjs";

const tol = { year: { kind: "abs", tol: 1 }, area: { kind: "rel", tol: 0.1 }, pop: { kind: "rel", tol: 0.05, rate: 0.03, maxGap: 10 } };
const asker = (concerns, extra = {}) => declareAsker({ name: "reader", by: "the owner", why: "same subject?", concerns, tolerance: tol, ...extra });
const n = (id, dim, value, o = {}) => ({ id, dim, value, strength: "strong", tied: true, at: null, dependsOn: [], ...o });
const ok = (r) => r.ok === true;

test("an asker must be bylined, care about something, and declare tolerances and a descending ladder", () => {
  assert.equal(declareAsker({ concerns: ["x"], tolerance: tol }).reason, "asker_unbylined");
  assert.equal(declareAsker({ name: "a", by: "b", why: "c", concerns: [], tolerance: tol }).reason, "no_concerns");
  assert.equal(declareAsker({ name: "a", by: "b", why: "c", concerns: ["x"], tolerance: {} }).reason, "no_tolerance");
  assert.equal(asker(["x"], { ladder: [1, 2] }).reason, "bad_ladder");
  assert.equal(asker(["x"]).ok, true);
  assert.equal(declareAsker({ name: "a b", by: "b", why: "c", concerns: ["x"], tolerance: tol }).reason, "asker_unbylined");
  assert.equal(declareAsker({ name: "a", by: "b", why: "c", concerns: ["x"], tolerance: { y: { kind: "abs", tol: Infinity } } }).reason, "bad_tolerance");
  assert.equal(declareAsker({ name: "a", by: "b", why: "c", concerns: ["x"], tolerance: { y: { kind: "abs", tol: 1, rate: 0.1 } } }).reason, "drift_needs_maxGap");
  assert.equal(declareAsker({ name: "a", by: "b", why: "c", concerns: ["x"], tolerance: { y: { kind: "rel", tol: 5 } } }).reason, "bad_tolerance");
  assert.equal(asker(["x"], { ladder: [Infinity] }).reason, "bad_ladder");
});
test("a difference downstream of the concern, or beside it, makes no difference to this asker however large", () => {
  const a = [n("born", "year", 1879), n("pop", "pop", 1e6, { at: 2020 })], b = [n("born", "year", 1879), n("pop", "pop", 9e6, { at: 2020 })];
  assert.equal(judgeAsker({ asker: asker(["born"]), a, b }).verdict, "equivalent"); // pop is not a concern
  assert.equal(judgeAsker({ asker: asker(["pop"]), a, b }).verdict, "other");
});
test("a difference UPSTREAM of the concern makes a difference to it (the destroy test)", () => {
  const mk = (born, died) => [n("born", "year", born), n("died", "year", died, { dependsOn: ["born"] })];
  const v = judgeAsker({ asker: asker(["died"]), a: mk(1879, 1955), b: mk(1920, 1955) });
  assert.equal(v.verdict, "other"); assert.deepEqual(v.meaningful.sort(), ["born", "died"]);
});
test("the arrow of time: a dependency pointing forward in time is refused", () => {
  const bad = [n("early", "pop", 1, { at: 2000, dependsOn: ["late"] }), n("late", "pop", 1, { at: 2020 })];
  assert.equal(judgeAsker({ asker: asker(["early"]), a: bad, b: bad }).reason, "arrow_of_time_violated");
});
test("drift: the time gap is allowed for in a fluent; beyond what drift explains it differs", () => {
  const a = [n("p", "pop", 1000, { at: 2024 })], ok = [n("p", "pop", 1150, { at: 2019 })], far = [n("p", "pop", 2000, { at: 2019 })];
  assert.equal(judgeAsker({ asker: asker(["p"]), a, b: ok }).verdict, "equivalent");
  assert.equal(judgeAsker({ asker: asker(["p"]), a, b: far }).verdict, "other");
});
test("weak, untied or untimed differences are holes, never a veto; with nothing strong comparable the verdict is gap", () => {
  const a = [n("x", "year", 1, { strength: "weak" })], b = [n("x", "year", 9, { strength: "weak" })];
  const v = judgeAsker({ asker: asker(["x"]), a, b }); assert.equal(v.verdict, "gap"); assert.equal(v.holes[0].why, "weak_cannot_veto");
  const u = judgeAsker({ asker: asker(["x"]), a: [n("x", "year", 1, { tied: false })], b: [n("x", "year", 9)] }); assert.equal(u.holes[0].why, "untied");
  const t = judgeAsker({ asker: asker(["x"]), a: [n("x", "pop", 1, { at: 2020 })], b: [n("x", "pop", 9)] }); assert.equal(t.holes[0].why, "mixed_timing");
  assert.equal(judgeAsker({ asker: asker(["x"]), a: [n("x", "year", 1)], b: [] }).holes[0].why, "one-side");
});
test("two askers, one pair, two verdicts (the criterion is for the asker)", () => {
  const a = [n("area", "area", 100), n("pop", "pop", 1e6, { at: 2020 })], b = [n("area", "area", 101), n("pop", "pop", 5e6, { at: 2020 })];
  assert.equal(judgeAsker({ asker: asker(["area"]), a, b }).verdict, "equivalent");
  assert.equal(judgeAsker({ asker: asker(["pop"]), a, b }).verdict, "other");
});
test("approach: tightening the tolerance only ever loses pairs; finest level is the asymptote index; a hole at every level is not a stand", () => {
  const a = [n("area", "area", 100)];
  const near = approach({ asker: asker(["area"]), a, b: [n("area", "area", 100.4)] }), far = approach({ asker: asker(["area"]), a, b: [n("area", "area", 104)] });
  assert.equal(near.stands, true); assert.ok(near.finest <= far.finest || far.finest === null);
  const verdicts = near.levels.map((l) => l.verdict); assert.deepEqual(verdicts, [...verdicts].sort((x, y) => (x === "equivalent" ? -1 : 1) - (y === "equivalent" ? -1 : 1)));
  assert.equal(approach({ asker: asker(["area"]), a, b: [] }).stands, false);
});

// ---- findings of the review of this organ (each was a failing input before the fix) ----
test("a difference cannot hide behind an agreeing concern: the closure is the union of both sides, whatever edges either omits", () => {
  const a = [n("born", "year", 1879), n("died", "year", 1955, { dependsOn: ["born"] })], b = [n("born", "year", 1920), n("died", "year", 1955)];
  const v = judgeAsker({ asker: asker(["died"]), a, b });
  assert.equal(v.verdict, "other"); assert.ok(v.meaningful.includes("born")); assert.equal(v.notes[0].note, "edges_disagree");
});
test("malformed folds are refused, not guessed: duplicate ids, bad values, bad times, null and non-array nodes", () => {
  const A = asker(["d"]);
  assert.equal(judgeAsker({ asker: A, a: [n("d", "year", 5000), n("d", "year", 1955)], b: [n("d", "year", 1955)] }).reason, "duplicate_id");
  for (const bad of [NaN, "1900", undefined, Infinity]) assert.equal(judgeAsker({ asker: A, a: [n("d", "year", bad)], b: [n("d", "year", 1)] }).reason, "bad_value");
  assert.equal(judgeAsker({ asker: A, a: [n("d", "year", 1, { at: "2020" })], b: [n("d", "year", 1)] }).reason, "bad_time");
  assert.equal(judgeAsker({ asker: A, a: [null], b: [] }).reason, "bad_node");
  assert.equal(judgeAsker({ asker: A, a: "abc", b: [] }).reason, "bad_nodes");
  assert.equal(judgeAsker({ asker: A, a: [{ ...n("d", "year", 1), strength: "maybe" }], b: [] }).reason, "bad_strength");
});
test("the arrow of time is checked on every edge: unreachable, untimed-to-timed-later, and across sides; a timed node may depend on an invariant", () => {
  const A = asker(["x"]);
  assert.equal(judgeAsker({ asker: A, a: [n("x", "year", 1), n("e", "pop", 1, { at: 2000, dependsOn: ["l"] }), n("l", "pop", 1, { at: 2020 })], b: [n("x", "year", 1)] }).reason, "arrow_of_time_violated"); // not reachable from the concern
  assert.equal(judgeAsker({ asker: A, a: [n("x", "year", 1, { dependsOn: ["l"] }), n("l", "pop", 1, { at: 2020 })], b: [n("x", "year", 1)] }).reason, "arrow_of_time_violated"); // an invariant cannot depend on a later fluent
  assert.equal(judgeAsker({ asker: A, a: [n("x", "year", 1, { at: 2024, dependsOn: ["i"] }), n("i", "year", 1)], b: [n("x", "year", 1, { at: 2024 })] }).ok, true); // timed depends on invariant: fine
  assert.equal(judgeAsker({ asker: A, a: [n("x", "year", 1), n("y", "year", 1, { dependsOn: ["x"] }), n("x2", "year", 1, { dependsOn: ["y"] })], b: [] }).ok, true);
  assert.equal(judgeAsker({ asker: A, a: [n("x", "year", 1, { dependsOn: ["y"] }), n("y", "year", 1, { dependsOn: ["x"] })], b: [] }).reason, "dependency_cycle");
});
test("drift cannot absorb a difference: the time gap is capped at the declared maxGap", () => {
  const a = [n("p", "pop", 1000, { at: 2024 })], far = [n("p", "pop", 1, { at: 1005 })];
  assert.equal(judgeAsker({ asker: asker(["p"]), a, b: far }).verdict, "other");
});
test("scale must be finite and positive; a zero tolerance with a difference gives a finite residual", () => {
  const a = [n("y", "year", 1)], b = [n("y", "year", 1.1)];
  assert.equal(judgeAsker({ asker: asker(["y"]), a, b, scale: 0 }).reason, "bad_scale");
  assert.equal(judgeAsker({ asker: asker(["y"]), a, b, scale: -1 }).reason, "bad_scale");
  const exact = declareAsker({ name: "exact", by: "o", why: "w", concerns: ["y"], tolerance: { year: { kind: "abs", tol: 0 } } });
  const v = judgeAsker({ asker: exact, a: [n("y", "year", 1)], b: [n("y", "year", 2)] }); assert.equal(v.verdict, "other"); assert.ok(Number.isFinite(v.residual));
});
test("only an asker made by declareAsker is trusted; the declared asker is immutable", () => {
  const forged = { ok: true, concerns: ["y"], tolerance: { year: { kind: "abs", tol: 1e9 } }, ladder: [1] };
  assert.equal(judgeAsker({ asker: forged, a: [n("y", "year", 1)], b: [n("y", "year", 9)] }).reason, "no_declared_asker");
  assert.equal(approach({ asker: forged, a: [], b: [] }).reason, "no_declared_asker");
  const ak = asker(["y"]); assert.throws(() => { "use strict"; ak.concerns.push("hack"); });
});
test("equivalent needs every concern answered: a hole at a concern is a gap even when something else agrees", () => {
  const a = [n("area", "area", 100), n("pop", "pop", 5, { at: 2020, strength: "weak" })], b = [n("area", "area", 100), n("pop", "pop", 5, { at: 2020, strength: "weak" })];
  const v = judgeAsker({ asker: asker(["area", "pop"]), a, b });
  assert.equal(v.verdict, "gap"); assert.deepEqual(v.concernHoles, ["pop"]); assert.equal(v.coverage.concernsAnswered, 1);
  assert.equal(judgeAsker({ asker: asker(["area"]), a: [n("area", "area", 100), n("z", "mystery", 1)], b: [n("area", "area", 100), n("z", "mystery", 9)] }).verdict, "equivalent"); // z is not a concern
  assert.equal(judgeAsker({ asker: asker(["area", "nowhere"]), a, b }).verdict, "gap"); // a concern absent on both sides
});
test("a dimension with no declared tolerance, a dimension mismatch, one-side and mixed timing are holes, not votes", () => {
  const A = asker(["m"]);
  assert.equal(judgeAsker({ asker: A, a: [n("m", "mystery", 1)], b: [n("m", "mystery", 9)] }).holes[0].why, "asker_declared_no_tolerance_for_dimension");
  assert.equal(judgeAsker({ asker: A, a: [n("m", "year", 1)], b: [n("m", "pop", 1)] }).holes[0].why, "dimension_mismatch");
  assert.equal(judgeAsker({ asker: asker(["p"]), a: [n("p", "pop", 1, { at: 2020 })], b: [n("p", "pop", 99)] }).holes[0].why, "mixed_timing");
});
test("the verdict carries the informed-adversary rate the caller measured, or says it was not supplied", () => {
  const a = [n("y", "year", 1)], b = [n("y", "year", 1)];
  assert.match(judgeAsker({ asker: asker(["y"]), a, b }).adversary.caveat, /not supplied/);
  assert.equal(judgeAsker({ asker: asker(["y"]), a, b, informedRate: 0.96 }).adversary.informedRate, 0.96);
  assert.equal(judgeAsker({ asker: asker(["y"]), a, b, informedRate: 2 }).reason, "bad_informedRate");
});
test("approach: finest is null when a hole stands at every level; a tight pair stands to a finer level than a loose one", () => {
  const a = [n("area", "area", 100)];
  const none = approach({ asker: asker(["area"]), a, b: [] }); assert.equal(none.stands, false); assert.equal(none.finest, null);
  const near = approach({ asker: asker(["area"]), a, b: [n("area", "area", 100.4)] }), far = approach({ asker: asker(["area"]), a, b: [n("area", "area", 109)] });
  assert.equal(near.finest, 0.1); assert.ok(far.finest !== null && far.finest > near.finest); // 0.4% passes the tightest scale (0.01); 9% only down to scale 1
});
