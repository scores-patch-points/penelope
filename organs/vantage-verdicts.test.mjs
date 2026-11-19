import test from "node:test";
import assert from "node:assert/strict";
import { declarePerspective, outcomeOf, judgeVantage } from "./vantage-verdicts.mjs";

const P = declarePerspective({ name: "p1", by: "test", why: "a test perspective", questions: [{ id: "beings", asks: "Which beings are named?" }, { id: "negations", asks: "What is negated?" }, { id: "things", asks: "Which things are named?" }] });
const L1 = ["same word when letter case, u/v and i/j are ignored"];

test("a perspective is bylined, has a why and at least one question", () => {
  assert.equal(P.ok, true);
  assert.equal(declarePerspective({ name: "x", why: "w", questions: [{ id: "a", asks: "?" }] }).reason, "unbylined_perspective");
  assert.equal(declarePerspective({ name: "x", by: "t", why: "w", questions: [] }).reason, "no_questions");
  assert.equal(declarePerspective({ name: "x", by: "t", why: "w", questions: [{ id: "a", asks: "?" }, { id: "a", asks: "?" }] }).reason, "repeated_question");
});
test("per-question outcomes follow the LS table", () => {
  assert.equal(outcomeOf(["a", "b"], ["b"]), "same");
  assert.equal(outcomeOf(["a"], ["b"]), "differ");
  assert.equal(outcomeOf(["a"], []), "one-side");
  assert.equal(outcomeOf([], undefined), "neither");
});
test("a licence rule lets u/v spelling answer the same question alike", () => {
  assert.equal(outcomeOf(["leaues"], ["leaves"]), "differ");
  assert.equal(outcomeOf(["leaues"], ["leaves"], L1), "same");
});
test("verdict: same / other / gap, and same is for the perspective", () => {
  const same = judgeVantage({ perspective: P, a: { beings: ["worcester"], things: ["leaues"] }, b: { beings: ["worcester"], things: ["leaves"] }, licences: L1 });
  assert.equal(same.verdict, "same");
  assert.equal(same.strict, true);
  const polarity = judgeVantage({ perspective: P, a: { beings: ["worcester"], negations: ["not"] }, b: { beings: ["worcester"] } });
  assert.equal(polarity.verdict, "other", "a negation on one side is a difference that makes a difference");
  const differ = judgeVantage({ perspective: P, a: { things: ["wind"] }, b: { things: ["loser"] } });
  assert.equal(differ.verdict, "other");
  const gap = judgeVantage({ perspective: P, a: {}, b: {} });
  assert.equal(gap.verdict, "gap");
});
test("no perspective, no judgement; an unknown licence rule is refused", () => {
  assert.equal(judgeVantage({ a: {}, b: {} }).reason, "no_perspective");
  assert.equal(judgeVantage({ perspective: P, a: {}, b: {}, licences: ["anything goes"] }).reason, "unknown_licence_rule");
});

// ---- REC ----------------------------------------------------------------------------------------------------------
import { RE_WEIGH, dominantClass, reweigh, nominate, guardRevision } from "./vantage-verdicts.mjs";
const PU = declarePerspective({ name: "pu", by: "t", why: "w", questions: [{ id: "beings", asks: "Which beings?", upos: "PROPN" }, { id: "things", asks: "Which things?", upos: "NOUN" }] });
test("dominant class: the most frequent, null on a tie or no evidence", () => {
  assert.equal(dominantClass({ NOUN: 9, PROPN: 1 }), "NOUN");
  assert.equal(dominantClass({ NOUN: 2, PROPN: 2 }), null);
  assert.equal(dominantClass(undefined), null);
});
test("the whole re-weighs the part: an element dominantly another class is dropped, one with no evidence is kept", () => {
  const q = PU.questions[0];
  assert.deepEqual(reweigh(["sunne", "worcester", "zzz"], q, { sunne: { NOUN: 8, PROPN: 1 }, worcester: { PROPN: 30 } }), ["worcester", "zzz"]);
});
test("REC nominates the re-weighing only from residue the whole can explain, and only once", () => {
  const rows = [{ pair: "p1", verdict: "other", questions: [{ id: "beings", outcome: "one-side" }], a: { beings: ["sunne"] }, b: { beings: [] }, classesA: { sunne: { NOUN: 8, PROPN: 1 } }, classesB: {} }];
  const n = nominate({ perspective: PU, rows });
  assert.equal(n.length, 1);
  assert.equal(n[0].because[0].dominant, "NOUN");
  assert.equal(nominate({ perspective: { ...PU, reweigh: RE_WEIGH }, rows }).length, 0, "already applied: nothing to nominate");
  assert.equal(nominate({ perspective: PU, rows: [{ ...rows[0], classesA: { sunne: { PROPN: 9 } } }] }).length, 0, "the whole agrees with the part: nothing to nominate");
});
test("a revised perspective re-weighs inside the judge", () => {
  const PR = declarePerspective({ name: "pr", by: "t", why: "w", reweigh: RE_WEIGH, questions: PU.questions });
  const j = judgeVantage({ perspective: PR, a: { beings: ["sunne"], things: ["hill"] }, b: { beings: [], things: ["hill"] }, classesA: { sunne: { NOUN: 8, PROPN: 1 } }, classesB: {} });
  assert.equal(j.verdict, "same");
  assert.equal(judgeVantage({ perspective: PU, a: { beings: ["sunne"], things: ["hill"] }, b: { beings: [], things: ["hill"] } }).verdict, "other");
});
test("the guard sets two independent organs against each other: violations and the disagreement must not grow", () => {
  const B = [{ pair: "p1", share: 0.8, verdict: "other" }, { pair: "p2", share: 0.05, verdict: "other" }];
  assert.equal(guardRevision({ before: B, after: [{ pair: "p1", share: 0.8, verdict: "same" }, B[1]], share: 0.5 }).accept, true);
  assert.equal(guardRevision({ before: B, after: [B[0], { pair: "p2", share: 0.05, verdict: "same" }], share: 0.5 }).accept, false);
  assert.equal(guardRevision({ before: B, after: B, share: 0.5 }).accept, false, "a no-op is refused");
});

// ---- the default is Other; sameness is proven ---------------------------------------------------------------------
import { PROOF_SET } from "./vantage-verdicts.mjs";
test("a suitor that shares an element is not let in when sameness must be proven as the same set", () => {
  const a = { beings: ["worcester"], things: ["hill", "day"] }, b = { beings: ["worcester"], things: ["hill", "sun"] };
  assert.equal(judgeVantage({ perspective: P, a, b }).verdict, "same", "the lenient rule shares an element and accepts");
  const j = judgeVantage({ perspective: P, a, b, proof: PROOF_SET });
  assert.equal(j.verdict, "other");
  assert.match(j.why, /not proven/);
  assert.equal(judgeVantage({ perspective: P, a: { beings: ["worcester"] }, b: { beings: ["worcester"] }, proof: PROOF_SET }).verdict, "same");
});
