import test from "node:test";
import assert from "node:assert/strict";
import { declareAsker, meaningfulNodes, judgeAsker, approach } from "./asker-dmd.mjs";

const tol = { year: { kind: "abs", tol: 1 }, area: { kind: "rel", tol: 0.1 }, pop: { kind: "rel", tol: 0.05, rate: 0.03 } };
const asker = (concerns, extra = {}) => declareAsker({ name: "reader", by: "the owner", why: "same subject?", concerns, tolerance: tol, ...extra });
const n = (id, dim, value, o = {}) => ({ id, dim, value, strength: "strong", tied: true, at: null, dependsOn: [], ...o });

test("an asker must be bylined, care about something, and declare tolerances and a descending ladder", () => {
  assert.equal(declareAsker({ concerns: ["x"], tolerance: tol }).reason, "asker_unbylined");
  assert.equal(declareAsker({ name: "a", by: "b", why: "c", concerns: [], tolerance: tol }).reason, "no_concerns");
  assert.equal(declareAsker({ name: "a", by: "b", why: "c", concerns: ["x"], tolerance: {} }).reason, "no_tolerance");
  assert.equal(asker(["x"], { ladder: [1, 2] }).reason, "bad_ladder");
  assert.equal(asker(["x"]).ok, true);
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
  assert.equal(meaningfulNodes(asker(["early"]), bad).ok, false);
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
  const t = judgeAsker({ asker: asker(["x"]), a: [n("x", "pop", 1, { at: 2020 })], b: [n("x", "pop", 9)] }); assert.equal(t.holes[0].why, "untimed");
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
