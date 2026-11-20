import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { calibrationCard, combine, cardsFromRuns } from "./evidence-ledger.mjs";
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const card = (layer, group, ph, pn, nh, nn) => calibrationCard({ layer, group, planted: { n: pn, hit: ph }, noise: { n: nn, hit: nh } });
test("a card is derived from counts with Laplace's rule: tpr = (k+1)/(n+2), fpr likewise, lrGood = tpr / fpr; bad counts are a typed gap", () => {
  const c = card("L", "g", 19, 20, 163, 20744); assert.ok(near(c.tpr, 20 / 22)); assert.ok(near(c.fpr, 164 / 20746)); assert.ok(near(c.lrGood, (20 / 22) / (164 / 20746)));
  assert.equal(calibrationCard({ layer: "L", group: "g", planted: { n: 0, hit: 0 }, noise: { n: 5, hit: 1 } }).gap, "bad_card"); assert.equal(calibrationCard({ layer: "L", group: "g", planted: { n: 5, hit: 6 }, noise: { n: 5, hit: 1 } }).gap, "bad_card"); assert.equal(calibrationCard({ layer: "L", group: "g", planted: { n: 5.5, hit: 1 }, noise: { n: 5, hit: 1 } }).gap, "bad_card"); assert.equal(calibrationCard({ layer: "", group: "g", planted: { n: 5, hit: 1 }, noise: { n: 5, hit: 1 } }).gap, "bad_card");
});
test("the prior is one in the search space (derived) or a declared probability with a giver; neither is a typed gap", () => {
  assert.ok(near(combine({ candidates: 1000, evidence: [] }).prior, 0.001)); assert.equal(combine({ evidence: [] }).gap, "no_search_space"); assert.equal(combine({ candidates: 1, evidence: [] }).gap, "no_search_space");
  assert.ok(near(combine({ prior: { p: 0.2, giver: "the owner" }, evidence: [] }).prior, 0.2)); assert.equal(combine({ prior: { p: 0.2 }, evidence: [] }).gap, "bad_prior"); assert.equal(combine({ prior: { p: 1, giver: "x" }, evidence: [] }).gap, "bad_prior");
});
test("a layer that FIRED adds count x ln(lrGood); one that did not fire adds NOTHING (absence of evidence is not evidence of absence); an unmeasured one is a listed gap", () => {
  const c = card("L1", "g1", 9, 10, 0, 1000), r = combine({ candidates: 1000, evidence: [{ layer: "L1", group: "g1", outcome: "good", count: 2, card: c }] });
  assert.ok(near(r.logOdds, Math.log(1 / 999) + 2 * Math.log(c.lrGood))); assert.equal(r.kEff, 1);
  const quiet = combine({ candidates: 1000, evidence: [{ layer: "L1", group: "g1", outcome: "not_good", card: c }] }); assert.ok(near(quiet.logOdds, Math.log(1 / 999))); assert.equal(quiet.silent.length, 1);
  assert.deepEqual(combine({ candidates: 1000, evidence: [{ layer: "L9", group: "g9", outcome: "unmeasured" }] }).needs, ["measure L9"]);
});
test("a layer with no calibration card is LISTED and adds no weight", () => {
  const r = combine({ candidates: 1000, evidence: [{ layer: "treebank", group: "ewt", outcome: "good", card: null }, { layer: "bad", group: "b", outcome: "good", card: { gap: "bad_card" } }] });
  assert.ok(near(r.logOdds, Math.log(1 / 999))); assert.equal(r.uncalibrated.length, 2); assert.deepEqual(r.needs, ["calibrate treebank", "calibrate bad"]);
});
test("layers from one source GROUP are dependent: only the strongest counts, so the same source never agrees twice; independent groups add", () => {
  const a = card("A", "same", 9, 10, 1, 1000), b = card("B", "same", 9, 10, 0, 1000), c = card("C", "other", 9, 10, 1, 500);
  const dep = combine({ candidates: 1000, evidence: [{ layer: "A", group: "same", outcome: "good", card: a }, { layer: "B", group: "same", outcome: "good", card: b }] }); assert.equal(dep.kEff, 1); assert.equal(dep.groups[0].layer, "B", "the stronger of the two");
  const ind = combine({ candidates: 1000, evidence: [{ layer: "A", group: "same", outcome: "good", card: a }, { layer: "C", group: "other", outcome: "good", card: c }] }); assert.equal(ind.kEff, 2); assert.ok(ind.logOdds > combine({ candidates: 1000, evidence: [{ layer: "A", group: "same", outcome: "good", card: a }] }).logOdds);
});
test("a layer that measured HARM vetoes: weight 0, status vetoed, the reason kept; and the posterior only rises with independent calibrated layers and never reaches 1", () => {
  const strong = card("S", "s", 20, 20, 0, 100000), v = combine({ candidates: 1000, evidence: [{ layer: "S", group: "s", outcome: "good", card: strong }, { layer: "H", group: "h", outcome: "refuted" }] }); assert.equal(v.posterior, 0); assert.equal(v.status, "vetoed"); assert.deepEqual(v.vetoes, [{ layer: "H", group: "h" }]);
  let prev = combine({ candidates: 1000, evidence: [] }).posterior; for (let k = 1; k <= 6; k++) { const ev = Array.from({ length: k }, (_, i) => ({ layer: `L${i}`, group: `g${i}`, outcome: "good", card: card(`L${i}`, `g${i}`, 20, 20, 1, 1000) })), p = combine({ candidates: 1000, evidence: ev }).posterior; assert.ok(p > prev, "each independent calibrated layer sharpens the weight"); assert.ok(p < 1, "never certain"); prev = p; }
  assert.equal(combine({ candidates: 1000, evidence: Array.from({ length: 3 }, (_, i) => ({ layer: `L${i}`, group: `g${i}`, outcome: "good", card: card(`L${i}`, `g${i}`, 20, 20, 1, 1000) })) }).status, "survived");
});
test("the calibration cards DERIVED from the committed planted-truth runs have the values the runs give (golden)", () => {
  const rd = (f) => JSON.parse(fs.readFileSync(new URL(`../experiments/self-supervised-segmentation/${f}`, import.meta.url), "utf8")), cards = cardsFromRuns({ heldout: rd("heldout-result-calibrate.json"), power: rd("calibration-result-power.json"), run1: rd("calibration-result-run1.json") });
  assert.deepEqual(cards["tier1-heldout-compression"].planted, { n: 20, hit: 19 }); assert.equal(cards["tier1-heldout-compression"].noise.hit, 163); assert.equal(cards["tier1-heldout-compression"].noise.n, 5186 * 4);
  assert.ok(cards["tier1-heldout-compression"].lrGood > 100, "the held-out compression layer is strong evidence when it fires"); assert.ok(cards["tagger-context-confidence"].lrGood < 5 && cards["tagger-alltoken-confidence"].lrGood < 6, "the tagger layers are weak evidence: they fire on noise too");
  assert.ok(cards["tier1-heldout-compression"].lrGood > 20 * cards["tagger-context-confidence"].lrGood, "calibration, not preference, ranks the layers");
});
