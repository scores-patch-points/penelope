// seam-verdicts.test.mjs — Penelope's verdicts over what other writers left in the log. Pure: no log is opened.
import test from "node:test";
import assert from "node:assert/strict";
import { declareWordBound, declareRunBound, declareStandingLadder, judgeWordFold, judgeRun, judgeStanding, rejudge, marksFor, nullsNeeded } from "./seam-verdicts.mjs";
import { admitMark } from "./weave-mark.mjs";

const by = "test-declarer", why = "for the test";
const fold = (per, over = {}) => ({ id: "E1", addr: "word-fold:link:translation:buy|purchase", body: { a: "buy", b: "purchase", channel: "link:translation", per }, ...over });
const nul = (counts) => ({ n: counts.length, counts });
const twenty = Array.from({ length: 20 }, (_, i) => (i < 18 ? 0 : i - 17));   // 18 zeros, then 1, 2

test("DEF: no bound without a byline, a why and its own number; nothing is defaulted", () => {
  assert.equal(declareWordBound({ quantile: 0.95, why }).reason, "unbylined_bound");
  assert.equal(declareWordBound({ quantile: 0.95, by }).reason, "no_why");
  assert.equal(declareWordBound({ by, why }).reason, "no_quantile");
  assert.equal(declareRunBound({ by, why }).reason, "no_max");
  assert.equal(declareStandingLadder({ rungs: ["restated"], by, why }).reason, "no_floor");
  assert.equal(declareStandingLadder({ rungs: ["restated", "grounded"], floor: 2, by, why }).reason, "no_grounded");
  assert.equal(declareStandingLadder({ rungs: ["louder"], floor: 2, by, why }).reason, "bad_rungs");
  assert.equal(declareWordBound({ quantile: 0.95, by, why }).ratified, false);
});

test("EVA word fold: beyond or within the declared quantile of the null, per radius, with a limit", () => {
  const b = declareWordBound({ quantile: 0.95, by, why });
  const j = judgeWordFold(fold([{ radius: 1, shared: 41, empty: false, null: nul(twenty) }, { radius: 2, shared: 50, empty: false, null: nul(twenty) }]), b);
  assert.deepEqual(j.radii.map((r) => [r.verdict, r.cut]), [["beyond-null", 1], ["beyond-null", 1]]);
  assert.deepEqual(j.limit, { verdict: "beyond-null", from: 1 });
  assert.deepEqual(j.of, ["E1"]);
  const w = judgeWordFold(fold([{ radius: 1, shared: 1, empty: false, null: nul(twenty) }]), b);
  assert.equal(w.limit.verdict, "within-null");
});

test("EVA word fold: undecided is said, with its reason, never filled in", () => {
  const b = declareWordBound({ quantile: 0.95, by, why });
  assert.equal(nullsNeeded(0.95), 20);
  const few = judgeWordFold(fold([{ radius: 1, shared: 9, empty: false, null: nul([0, 0, 1]) }]), b);
  assert.equal(few.limit.verdict, "undecided");
  assert.match(few.radii[0].why, /needs 20/);
  const empty = judgeWordFold(fold([{ radius: 1, shared: 0, empty: true, null: nul(twenty) }]), b);
  assert.match(empty.limit.why, /empty ball/);
  const moving = judgeWordFold(fold([{ radius: 1, shared: 0, empty: false, null: nul(twenty) }, { radius: 2, shared: 30, empty: false, null: nul(twenty) }]), b);
  assert.equal(moving.limit.verdict, "undecided");
  assert.match(moving.limit.why, /changes between radius 1 and 2/);
});

test("EVA: no judgement without the right declared bound", () => {
  assert.equal(judgeWordFold(fold([{ radius: 1, shared: 1, null: nul(twenty) }]), null).reason, "no_bound");
  assert.equal(judgeWordFold(fold([{ radius: 1, shared: 1, null: nul(twenty) }]), declareRunBound({ maxErrorFindings: 0, by, why })).reason, "no_bound");
  assert.equal(judgeRun({ body: { errorFindings: 0 } }, declareWordBound({ quantile: 0.9, by, why })).reason, "no_bound");
});

test("EVA run: stands, does not stand, or undecided when the run carries no count", () => {
  const b = declareRunBound({ maxErrorFindings: 0, by, why });
  const run = (n) => ({ id: "R1", addr: "run:t", body: { errorFindings: n, denominators: { claims: 2, grounds: 1, units: 2, notes: 0 } } });
  assert.equal(judgeRun(run(0), b).verdict, "stands");
  assert.equal(judgeRun(run(1), b).verdict, "does-not-stand");
  assert.equal(judgeRun(run(null), b).verdict, "undecided");
  assert.equal(judgeRun(run(1), declareRunBound({ maxErrorFindings: 1, by, why })).verdict, "stands");
  assert.deepEqual(judgeRun(run(1), b).denominators.claims, 2);
});

const st = (id, run, verdict, instrument) => ({ id, addr: "unit:abc", body: { unit: "U", run, verdict, instrument } });
const ladder = declareStandingLadder({ rungs: ["restated", "grounded", "independent"], floor: 2, grounded: ["cited", "event"], by, why });

test("EVA standing: a range over the rungs, not one word; one instrument re-run is restated and nothing more", () => {
  const j = judgeStanding([st("a", "r1", "unaddressed", "eot-janus"), st("b", "r2", "unaddressed", "eot-janus"), st("c", "r3", "unaddressed", "eot-janus")], ladder);
  assert.deepEqual(j.rungs.map((r) => [r.rung, r.verdict, r.count]), [["restated", "holds", 3], ["grounded", "does-not-hold", 0], ["independent", "does-not-hold", 1]]);
  assert.equal(j.holdsUpTo, "restated");
  assert.deepEqual(j.stopsAt, { rung: "grounded", verdict: "does-not-hold" });
  assert.deepEqual(j.of, ["a", "b", "c"]);
  const full = judgeStanding([st("a", "r1", "cited", "x"), st("b", "r2", "event", "y")], ladder);
  assert.equal(full.holdsUpTo, "independent");
  assert.equal(full.stopsAt, null);
});

test("EVA standing: two statements in ONE run are one; no named instrument is undecided; two units are refused", () => {
  assert.equal(judgeStanding([st("a", "r1", "cited", "x"), st("b", "r1", "cited", "x")], ladder).rungs[0].verdict, "does-not-hold");
  const un = judgeStanding([st("a", "r1", "cited", null), st("b", "r2", "cited", null)], ladder);
  assert.deepEqual([un.rungs[2].verdict, un.holdsUpTo, un.unnamedInstrument], ["undecided", "grounded", 2]);
  assert.equal(judgeStanding([st("a", "r1", "cited", "x"), { ...st("b", "r2", "cited", "y"), addr: "unit:other" }], ladder).reason, "several_units");
});

test("REC: what held and what changed, of the same address only", () => {
  const before = judgeStanding([st("a", "r1", "unaddressed", "x"), st("b", "r2", "unaddressed", "x")], ladder);
  const after = judgeStanding([st("a", "r1", "unaddressed", "x"), st("b", "r2", "unaddressed", "x"), st("c", "r3", "cited", "y"), st("d", "r4", "cited", "y")], ladder);
  const rec = rejudge(before, after);
  assert.deepEqual(rec.held, ["restated"]);
  assert.deepEqual(rec.changed, [{ at: "grounded", was: "does-not-hold", becomes: "holds" }, { at: "independent", was: "does-not-hold", becomes: "holds" }]);
  assert.equal(rec.sticks, false);
  assert.equal(rejudge(before, judgeRun({ addr: "run:t", body: { errorFindings: 0 } }, declareRunBound({ maxErrorFindings: 0, by, why }))).reason, "different_subjects");
});

test("marks: every mark passes her own door's admission; a verdict is woven of its evidence", () => {
  const b = declareWordBound({ quantile: 0.95, by, why });
  const j = judgeWordFold(fold([{ radius: 1, shared: 41, empty: false, null: nul(twenty) }]), b);
  const marks = marksFor({ bound: b, judgement: j, rec: rejudge(j, j), log: "fold", ofPrev: ["V0"], ofBound: ["B1"] });
  assert.deepEqual(marks.map((m) => [m.kind, m.cell]), [["seam-bound", "DEF·Ground"], ["word-fold-verdict", "EVA·Figure"], ["seam-rejudgement", "REC·Figure"]]);
  for (const m of marks) assert.deepEqual(admitMark(m), { ok: true });
  assert.deepEqual(marks[1].of, ["E1", "B1"]);
  assert.equal(marks[1].addr, "verdict:word-fold:link:translation:buy|purchase");
});
