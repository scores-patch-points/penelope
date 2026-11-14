// equivalence.test.mjs — the judge is pure: stops in, a verdict-per-rung function out.
import test from "node:test";
import assert from "node:assert/strict";
import { declareLadder, readStop, surviving, judge, verdictAt, rejudge, marksFor, VERDICTS } from "./equivalence.mjs";
import { admitMark } from "./weave-mark.mjs";

const L = declareLadder({ rungs: ["casual", "strict"], by: "t", why: "strict asks more" });
const stop = (value, { unsaid = false, survive = [] } = {}) => ({ verdict4: { value, unsaid }, distinctions: survive.map((t) => ({ layer: "existence", kind: "part", side: "b", b: { text: t }, survives: true })).concat([{ layer: "existence", kind: "part", side: "a", a: { text: "pruned" }, survives: false }]) });

test("DEF: a ladder is bylined, says why, has two or more distinct rungs, or is refused", () => {
  assert.equal(L.ok, true); assert.equal(L.ratified, false);
  assert.equal(declareLadder({ rungs: ["a", "b"], why: "x" }).reason, "unbylined_ladder");
  assert.equal(declareLadder({ rungs: ["a", "b"], by: "t" }).reason, "no_why");
  assert.equal(declareLadder({ rungs: ["a"], by: "t", why: "x" }).reason, "too_few_rungs");
  assert.equal(declareLadder({ rungs: ["a", "a"], by: "t", why: "x" }).reason, "repeated_rung");
  assert.equal(judge({ pid: "p", ladder: null, stops: {} }).reason, "no_ladder");
});

test("the finder's four values are read once: is, is-not, and everything else is undecided", () => {
  assert.equal(readStop(stop("is")).verdict, "same");
  assert.equal(readStop(stop("is-not")).verdict, "different");
  for (const s of [stop("both"), stop("neither"), stop("is", { unsaid: true }), { error: "x" }, { refused: true }, undefined, {}]) assert.equal(readStop(s).verdict, "undecided");
  assert.deepEqual(surviving(stop("is-not", { survive: ["x", "y"] })).length, 2);
});

test("EVA: same at every rung is same over the ladder covered, never bare", () => {
  const j = judge({ pid: "p", ladder: L, stops: { casual: stop("is"), strict: stop("is") } });
  assert.equal(j.limit.verdict, "same"); assert.equal(j.limit.from, "casual"); assert.equal(j.sameUpTo, "strict");
  assert.equal(j.frameDependent, false); assert.deepEqual(j.steps, []); assert.deepEqual(j.range.incompleteOver, []);
});

test("EVA: the first difference names the step where a pair stops being the same", () => {
  const j = judge({ pid: "p", ladder: L, stops: { casual: stop("is"), strict: stop("is-not", { survive: ["one fact"] }) } });
  assert.deepEqual(j.steps, [{ from: "casual", to: "strict", was: "same", becomes: "different" }]);
  assert.equal(j.sameUpTo, "casual"); assert.equal(j.differentFrom, "strict"); assert.equal(j.frameDependent, true);
  assert.equal(j.limit.verdict, "different"); assert.equal(j.limit.from, "strict");
  assert.equal(verdictAt(j, "casual"), "same"); assert.equal(verdictAt(j, "strict"), "different");
  assert.equal(verdictAt(j, "auditor"), "refused"); // a frame the ladder does not hold is not answered
});

test("a stricter rung saying same where a looser one says different: the ladder is not an order, and no limit is given", () => {
  const j = judge({ pid: "p", ladder: L, stops: { casual: stop("is-not", { survive: ["x"] }), strict: stop("is") } });
  assert.equal(j.monotone, false); assert.equal(j.limit.verdict, "undecided"); assert.equal(j.sameUpTo, null);
  assert.equal(verdictAt(j, "strict"), "undecided");
});

test("a rung with no decided stop is undecided and named in the range; it is never filled in", () => {
  const j = judge({ pid: "p", ladder: L, stops: { casual: stop("is") } });
  assert.equal(j.limit.verdict, "undecided"); assert.equal(j.sameUpTo, "casual");
  assert.deepEqual(j.range.covered, ["casual"]); assert.equal(j.range.incompleteOver[0].rung, "strict");
  assert.equal(j.accumulates, null);
});

test("the integral: accumulation is checked against the standing and reported, not repaired", () => {
  const j = judge({ pid: "p", ladder: L, stops: { casual: stop("is", { survive: ["left over"] }), strict: stop("is-not") } });
  assert.equal(j.rungs[0].accumulationAgrees, false); // same, yet a distinction survived
  assert.equal(j.rungs[1].accumulationAgrees, false); // different, yet nothing survived
  assert.equal(j.rungs[0].verdict, "same"); assert.equal(j.rungs[1].verdict, "different"); // verdicts untouched
  assert.equal(j.accumulates, false); // casual's surviving distinction is not in strict's
  const k = judge({ pid: "p", ladder: L, stops: { casual: stop("is-not", { survive: ["x"] }), strict: stop("is-not", { survive: ["x", "y"] }) } });
  assert.equal(k.accumulates, true);
});

test("the judge sees no label and no text: extra fields on a stop change nothing", () => {
  const a = judge({ pid: "p", ladder: L, stops: { casual: stop("is"), strict: stop("is-not", { survive: ["x"] }) } });
  const b = judge({ pid: "p", ladder: L, stops: { casual: { ...stop("is"), l1: "OTHER", a: "text" }, strict: { ...stop("is-not", { survive: ["x"] }), l1: "SAME" } } });
  assert.deepEqual(a, b);
});

test("REC: a longer ladder is judged again; what held, what was added, and whether the verdict stuck", () => {
  const j1 = judge({ pid: "p", ladder: L, stops: { casual: stop("is"), strict: stop("is") } });
  const L3 = declareLadder({ rungs: ["casual", "strict", "auditor"], by: "t", why: "one more rung" });
  const j2 = judge({ pid: "p", ladder: L3, stops: { casual: stop("is"), strict: stop("is"), auditor: stop("is-not", { survive: ["x"] }) } });
  const r = rejudge(j1, j2);
  assert.deepEqual(r.held, ["casual", "strict"]); assert.deepEqual(r.added, [{ rung: "auditor", verdict: "different" }]);
  assert.equal(r.sticks, false); assert.equal(r.limitWas.verdict, "same"); assert.equal(r.limitIs.verdict, "different");
  assert.equal(rejudge(j1, j1).sticks, true);
  assert.equal(rejudge(j1, judge({ pid: "q", ladder: L, stops: {} })).reason, "different_pairs");
});

test("her own door admits the three marks (ladder, judgement, re-judgement), each bylined, witnessed and declared", () => {
  const j1 = judge({ pid: "p", ladder: L, stops: { casual: stop("is"), strict: stop("is") } });
  const ms = marksFor({ ladder: L, judgement: j1, rec: rejudge(j1, j1), log: "equivalence-test", ofPrev: [] });
  assert.deepEqual(ms.map((m) => m.cell), ["DEF·Ground", "EVA·Figure", "REC·Figure"]);
  for (const m of ms) assert.equal(admitMark(m).ok, true, JSON.stringify(admitMark(m)));
  assert.ok(VERDICTS.includes(j1.limit.verdict));
});

test("the finder owner's reading of 'both' is an option, not the default: decided not-same, with its relation reported", () => {
  const b = (whole) => ({ verdict4: { value: "both", unsaid: false }, whole, distinctions: [] });
  assert.equal(readStop(b({})).verdict, "undecided"); // pre-registered default unchanged
  const r = readStop(b({ a_says_b: "yes", b_says_a: "no" }), { both: "different" });
  assert.equal(r.verdict, "different"); assert.equal(r.relation, "a contains b");
  assert.equal(readStop(b({ a_says_b: "yes", b_says_a: "yes" }), { both: "different" }).relation, "contested");
  assert.equal(readStop(b({ a_says_b: "no", b_says_a: "not asked: the answer could not change" }), { both: "different" }).relation, "apart");
  assert.equal(readStop({ verdict4: { value: "both", unsaid: true } }, { both: "different" }).verdict, "undecided"); // unsaid stays undecided
  const j = judge({ pid: "p", ladder: L, both: "different", stops: { casual: stop("is"), strict: b({ a_says_b: "yes", b_says_a: "no" }) } });
  assert.equal(j.bothReadAs, "different"); assert.equal(j.frameDependent, true); assert.equal(j.rungs[1].relation, "a contains b");
});
