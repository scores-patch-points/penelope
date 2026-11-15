// pair-verdicts.test.mjs — Penelope's verdict on a pair of texts from a pair-diff and a pair-witness in the log.
// Pure: no log is opened, no text read. Each rule of the contract has a case that would fail if the rule changed.
import test from "node:test";
import assert from "node:assert/strict";
import { declarePairBound, boundFromEntry, licensed, orderChanged, reasonsOf, witnessDirection, judge, marksFor, boundBody, KNOWN_QUANTILE_RULES } from "./pair-verdicts.mjs";
import { admitMark } from "./weave-mark.mjs";

const RULE = "sorted[min(n-1, ceil(q*n)-1)], count must be strictly greater";
const WIT = "three wordings, unanimous per direction";
const SPEC = { name: "test-bound", by: "test-declarer", why: "for the test", ratified: false, share: 0.5032467532467533, wordQuantile: 0.95, quantileRule: RULE, witness: WIT };
const B = declarePairBound(SPEC);
// fifty nulls 0..49 (shuffled order in the entry must not matter): index 47 of the sorted list is 47
const fifty = Array.from({ length: 50 }, (_, k) => (k * 37) % 50);
const ev = (shared, nulls = fifty, over = {}) => ({ shared, empty: false, nulls, n: nulls.length, ...over });
const sub = (i, j, abShared, baShared = abShared, contentA = true) => ({ i, j, a: "x" + i, b: "y" + j, upos: ["NOUN", "NOUN"], contentA, evidence: { ab: ev(abShared), ba: ev(baShared) } });
const diffOf = (over = {}) => ({ share: 0.8, lcs: 4, nA: 5, nB: 5, anchors: [[0, 0, true], [1, 1, true], [3, 3, true], [4, 4, true]], substitutions: [], orphans: [], ...over });
const W = (ab, ba) => ({ model: "qwen3:8b", wordings: ["W1", "W2", "W3"], answers: { ab, ba } });
const Y = ["yes", "yes", "yes"], N = ["no", "no", "no"];

test("DEF: refused without a byline, a why, a name, the share, the word quantile or either rule; nothing defaulted", () => {
  assert.equal(B.ok, true);
  assert.equal(declarePairBound({ ...SPEC, by: undefined }).reason, "unbylined_bound");
  assert.equal(declarePairBound({ ...SPEC, by: "  " }).reason, "unbylined_bound");
  assert.equal(declarePairBound({ ...SPEC, why: undefined }).reason, "no_why");
  assert.equal(declarePairBound({ ...SPEC, name: "a/b" }).reason, "no_name");
  assert.equal(declarePairBound({ ...SPEC, share: undefined }).reason, "no_share");
  assert.equal(declarePairBound({ ...SPEC, share: 1.5 }).reason, "no_share");
  assert.equal(declarePairBound({ ...SPEC, wordQuantile: undefined }).reason, "no_word_quantile");
  assert.equal(declarePairBound({ ...SPEC, wordQuantile: 1 }).reason, "no_word_quantile");
  assert.equal(declarePairBound({ ...SPEC, quantileRule: undefined }).reason, "no_quantile_rule");
  assert.equal(declarePairBound({ ...SPEC, quantileRule: "the median" }).reason, "unknown_quantile_rule");
  assert.equal(declarePairBound({ ...SPEC, witness: undefined }).reason, "no_witness_rule");
  assert.equal(declarePairBound({ ...SPEC, witness: "majority of five" }).reason, "unknown_witness_rule");
  assert.equal(declarePairBound({ ...SPEC, ratified: undefined }).ratified, false);
});

test("DEF: the bound entry's body is the contract's, and a log entry reads back to the same bound", () => {
  const { addr, body } = boundBody(B);
  assert.equal(addr, "pair-bound:test-bound");
  assert.deepEqual(Object.keys(body).sort(), ["by", "quantileRule", "ratified", "share", "why", "witness", "wordQuantile"]);
  const back = boundFromEntry({ addr, body });
  assert.deepEqual(back, B);
  assert.equal(boundFromEntry({ addr: "bound:x", body }).reason, "not_a_pair_bound");
  assert.equal(boundFromEntry({ addr, body: { ...body, by: "" } }).reason, "unbylined_bound");
});

test("EVA refuses without a bound: no judgement, no licence, no order, no reasons", () => {
  assert.equal(judge(diffOf(), null, null).reason, "no_bound");
  assert.equal(judge(diffOf(), null, declarePairBound({ ...SPEC, by: undefined })).reason, "no_bound");
  assert.equal(licensed(sub(2, 2, 99), null), null);
  assert.equal(orderChanged(diffOf(), null), null);
  assert.equal(reasonsOf(diffOf(), null), null);
});

test("the quantile rule at its edges: n=50 reads index 47 and the count must be strictly greater", () => {
  assert.equal(KNOWN_QUANTILE_RULES[RULE].cut([...fifty].sort((x, y) => x - y), 0.95), 47);
  assert.equal(licensed(sub(2, 2, 48), B), true);
  assert.equal(licensed(sub(2, 2, 47), B), false, "equal to the cut is not beyond it");
  // falsifier for the index: a list where index 46, 47 and 48 differ; only index 47 gives this split
  const step = Array.from({ length: 50 }, (_, k) => (k < 47 ? 0 : k === 47 ? 10 : 20));
  assert.equal(licensed({ i: 0, j: 0, contentA: true, evidence: { ab: ev(11, step), ba: ev(11, step) } }, B), true);
  assert.equal(licensed({ i: 0, j: 0, contentA: true, evidence: { ab: ev(10, step), ba: ev(10, step) } }, B), false);
});

test("the quantile rule at its edges: n=1 reads its only null; n=0 and an empty ball are never licensed", () => {
  const one = (shared) => ({ i: 0, j: 0, contentA: true, evidence: { ab: ev(shared, [5]), ba: ev(shared, [5]) } });
  assert.equal(licensed(one(6), B), true);
  assert.equal(licensed(one(5), B), false);
  const none = { i: 0, j: 0, contentA: true, evidence: { ab: ev(1000, []), ba: ev(1000, []) } };
  assert.equal(licensed(none, B), false);
  const empty = { i: 0, j: 0, contentA: true, evidence: { ab: { shared: 0, empty: true, nulls: [], n: 0 }, ba: ev(99) } };
  assert.equal(licensed(empty, B), false);
});

test("a licence needs BOTH directions; malformed evidence is refused, not guessed", () => {
  assert.equal(licensed(sub(2, 2, 48, 47), B), false);
  assert.equal(licensed(sub(2, 2, 47, 48), B), false);
  assert.equal(licensed({ ...sub(2, 2, 48), evidence: { ab: ev(48), ba: { shared: 48, empty: false, nulls: [1, 2], n: 3 } } }, B), null);
  assert.equal(licensed({ ...sub(2, 2, 48), evidence: { ab: ev(48) } }, B), null);
  const d = diffOf({ substitutions: [{ ...sub(2, 2, 48), evidence: { ab: ev(48) } }] });
  assert.equal(judge(d, null, B).reason, "malformed_evidence");
  assert.equal(judge({ share: "x" }, null, B).reason, "not_a_diff");
});

test("order: a descent among content anchors is changed; a descent only through a non-content row is not", () => {
  assert.equal(orderChanged(diffOf(), B), false);
  assert.equal(orderChanged(diffOf({ anchors: [[0, 1, true], [1, 0, true]] }), B), true);
  assert.equal(orderChanged(diffOf({ anchors: [[0, 1, false], [1, 0, true]] }), B), false);
  // sorting is by i, whatever order the anchors come in
  assert.equal(orderChanged(diffOf({ anchors: [[3, 3, true], [0, 0, true], [1, 1, true]] }), B), false);
});

test("order with mixed licences: a licensed substitution enters the order, an unlicensed one does not", () => {
  const anchors = [[0, 0, true], [2, 2, true]];
  // the substitution at i=1 sits at j=5, after the anchor at j=2: a crossing only if it is licensed
  assert.equal(orderChanged(diffOf({ anchors, substitutions: [sub(1, 5, 48)] }), B), true);
  assert.equal(orderChanged(diffOf({ anchors, substitutions: [sub(1, 5, 47)] }), B), false);
  // one licensed in place, one unlicensed out of place: order unchanged, reason unlicensed
  const mixed = diffOf({ anchors: [[0, 0, true], [3, 3, true]], substitutions: [sub(1, 1, 48), sub(2, 9, 10)] });
  assert.equal(orderChanged(mixed, B), false);
  assert.deepEqual(reasonsOf(mixed, B), ["unlicensed"]);
  // a licensed but non-content substitution out of place does not change order
  assert.equal(orderChanged(diffOf({ anchors, substitutions: [sub(1, 5, 48, 48, false)] }), B), false);
});

test("reasons: orphan, unlicensed and order, in that order, each only when present", () => {
  assert.deepEqual(reasonsOf(diffOf(), B), []);
  assert.deepEqual(reasonsOf(diffOf({ orphans: [{ side: "a", word: "very", upos: "ADV" }] }), B), ["orphan"]);
  const all = diffOf({ anchors: [[0, 1, true], [1, 0, true]], substitutions: [sub(2, 2, 1)], orphans: [{ side: "b", word: "x", upos: "NOUN" }] });
  assert.deepEqual(reasonsOf(all, B), ["orphan", "unlicensed", "order"]);
});

test("addressed with reasons: other by the diff, the witness ignored; share equal to the bound is addressed", () => {
  const d = diffOf({ share: B.share, orphans: [{ side: "a", word: "not", upos: "PART" }] });
  const j = judge(d, W(Y, Y), B);
  assert.equal(j.verdict, "other"); assert.equal(j.by, "diff"); assert.deepEqual(j.reasons, ["orphan"]);
  const below = judge({ ...d, share: B.share - 1e-12 }, null, B);
  assert.equal(below.verdict, "need-witness", "just below the bound is not addressed, so the diff does not settle it");
});

test("not settled by the diff: need-witness without a witness (addressed and clean, or not addressed)", () => {
  const clean = judge(diffOf(), null, B);
  assert.equal(clean.verdict, "need-witness"); assert.equal(clean.by, null); assert.match(clean.why, /addressed/);
  const far = judge(diffOf({ share: 0.2, orphans: [{ side: "a", word: "x", upos: "NOUN" }] }), null, B);
  assert.equal(far.verdict, "need-witness"); assert.deepEqual(far.reasons, ["orphan"]); assert.match(far.why, /not addressed/);
});

test("the witness: same when both directions are unanimous yes, other when either is unanimous no, else undecided", () => {
  const d = diffOf();
  assert.equal(judge(d, W(Y, Y), B).verdict, "same");
  assert.equal(judge(d, W(Y, Y), B).by, "witness");
  assert.equal(judge(d, W(Y, N), B).verdict, "other");
  assert.equal(judge(d, W(N, ["yes", "no", "yes"]), B).verdict, "other", "a no in one direction beats a gap in the other");
  assert.equal(judge(d, W(Y, ["yes", "yes", "no"]), B).verdict, "undecided");
  assert.equal(judge(d, W(["no", "no", "unparsed"], ["yes", "yes", "unparsed"]), B).verdict, "undecided", "an unparsed answer breaks unanimity both ways");
  assert.equal(witnessDirection(["unparsed", "unparsed", "unparsed"], B), "gap");
});

test("a malformed witness is refused: wrong count of wordings or answers, an answer outside yes/no/unparsed", () => {
  const d = diffOf();
  assert.equal(judge(d, { ...W(Y, Y), wordings: ["W1", "W2"] }, B).reason, "not_a_witness");
  assert.equal(judge(d, W(["yes", "yes"], Y), B).reason, "not_a_witness", "two yes answers are not three");
  assert.equal(judge(d, W(Y, ["yes", "yes", "maybe"]), B).reason, "not_a_witness");
  assert.equal(judge(d, { model: "m" }, B).reason, "not_a_witness");
});

test("marks: a request of [diff, bound]; a verdict of [diff, bound, witness]; bodies are the contract's; her door admits them", () => {
  const diff = { id: "D1", addr: "diff:0123456789abcdef" };
  const [bm] = marksFor({ bound: B, log: "pair-test" });
  assert.equal(bm.kind, "pair-bound"); assert.equal(bm.cell, "DEF·Ground"); assert.equal(bm.addr, "pair-bound:test-bound");
  const [rm] = marksFor({ judgement: judge(diffOf(), null, B), diff, boundId: "B1", log: "pair-test" });
  assert.equal(rm.kind, "witness-request"); assert.equal(rm.cell, "DEF·Figure"); assert.equal(rm.addr, "witness-request:0123456789abcdef");
  assert.deepEqual(rm.of, ["D1", "B1"]); assert.deepEqual(Object.keys(rm.body).sort(), ["pair", "why"]); assert.equal(rm.body.pair, "pair:0123456789abcdef");
  const [vm] = marksFor({ judgement: judge(diffOf(), W(Y, Y), B), diff, boundId: "B1", witnessId: "W1", log: "pair-test" });
  assert.equal(vm.kind, "pair-verdict"); assert.equal(vm.cell, "EVA·Figure"); assert.equal(vm.addr, "verdict:0123456789abcdef");
  assert.deepEqual(vm.of, ["D1", "B1", "W1"]); assert.deepEqual(vm.body, { verdict: "same", by: "witness", why: vm.body.why, reasons: [] });
  const [dm] = marksFor({ judgement: judge(diffOf({ orphans: [{ side: "a", word: "x", upos: "NOUN" }] }), null, B), diff, boundId: "B1", witnessId: "W1", log: "pair-test" });
  assert.deepEqual(dm.of, ["D1", "B1"], "a verdict by the diff is not woven of a witness");
  for (const m of [bm, rm, vm, dm]) assert.equal(admitMark(m).ok, true);
  assert.equal(marksFor({ judgement: { ok: false }, diff, log: "pair-test" }).length, 0);
  for (const m of [vm, dm]) for (const k of ["same", "true", "ok"]) assert.equal(k in m.body, false);
});
