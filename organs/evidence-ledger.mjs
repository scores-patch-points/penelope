// organs/evidence-ledger.mjs — LAYERS OF EVIDENCE that move a claim (a rule, a program, a reading) asymptotically closer to what was meant, and never claim certainty.
// The owner's principle (2026-11-20): wire every signal in as a layer of evidence. Each layer has a CALIBRATION CARD derived from its planted-truth run: how often it fires on planted truth against how often on noise; that gives it a LIKELIHOOD RATIO and nothing is guessed. The ledger combines layers by odds:
//   prior      one in the number of candidates the search tried (the multiplicity, derived; or a prior a giver declared, with the giver)
//   a layer    contributes only when it FIRED (outcome "good"): count x ln(tpr / fpr), tpr and fpr Laplace-smoothed from the card's counts ((k + 1) / (n + 2)); a layer that did not fire adds NOTHING (absence of evidence is not evidence of absence: a low-power layer silent about a true thing must not count against it)
//   no card    a layer with no calibration is LISTED and adds no weight (a witness whose reliability is unknown); a layer not measured is listed as a gap
//   groups     layers from one source family (same corpus, same model) are DEPENDENT: only the strongest counts (k_eff = the number of independent groups that fired); two layers from the same source never AGREE twice
//   veto       a layer that measured HARM (outcome "refuted") vetoes: the weight is 0 and the reason is kept (Wilson's alarm trail: a wrong answer is an active danger, not an absence)
//   posterior  odds / (1 + odds): the WEIGHT carried with the claim; it rises with every independent calibrated layer that fires and never reaches 1; commitment happens at USE, to the heavier reading, recording the weight
// Pure; no model, no regex, no word list, no chosen constant (the +1 and +2 are Laplace's rule, the prior is the search space).
export const SCHEMA = "EvidenceLedger@1";
const lap = (k, n) => (k + 1) / (n + 2), isCount = (x) => Number.isInteger(x) && x >= 0;
/** calibrationCard({ layer, group, planted: { n, hit }, noise: { n, hit }, provenance }) -> the card, or { gap } when the counts are not whole numbers (a card is derived from a run, never typed in) */
export function calibrationCard({ layer, group, planted, noise, provenance = null }) {
  if (!layer || !group) return { gap: "bad_card", why: "a card names its layer and its source group" };
  if (!isCount(planted?.n) || !isCount(planted?.hit) || planted.hit > planted.n || planted.n === 0 || !isCount(noise?.n) || !isCount(noise?.hit) || noise.hit > noise.n || noise.n === 0) return { gap: "bad_card", why: "planted and noise each need whole-number counts with 0 <= hit <= n and n > 0: a card is derived from a planted-truth run" };
  const tpr = lap(planted.hit, planted.n), fpr = lap(noise.hit, noise.n);
  return { schema: SCHEMA, layer, group, planted, noise, tpr, fpr, lrGood: tpr / fpr, provenance };
}
/** combine({ candidates, prior, evidence }) -> { posterior, logOdds, prior, groups, uncalibrated, silent, vetoes, kEff, status, needs }
 *  evidence: [{ layer, group, outcome: "good" | "not_good" | "refuted" | "unmeasured", count = 1, card = null }]; `candidates` = the size of the search space (prior 1 / candidates) unless `prior = { p, giver }` is given. */
export function combine({ candidates = null, prior = null, evidence = [] } = {}) {
  let p0;
  if (prior) { if (!prior.giver || !(prior.p > 0 && prior.p < 1)) return { gap: "bad_prior", why: "a declared prior is a probability strictly between 0 and 1 AND names its giver" }; p0 = prior.p; }
  else { if (!Number.isInteger(candidates) || candidates < 2) return { gap: "no_search_space", why: "the prior is one in the number of candidates the search tried (at least 2): none was given" }; p0 = 1 / candidates; }
  const best = new Map(), uncalibrated = [], silent = [], vetoes = [];
  for (const e of evidence) {
    if (e.outcome === "refuted") { vetoes.push({ layer: e.layer, group: e.group }); continue; }
    if (e.outcome === "unmeasured") { silent.push({ layer: e.layer, why: "not measured" }); continue; }
    if (!e.card || e.card.gap) { uncalibrated.push({ layer: e.layer, group: e.group, outcome: e.outcome, why: "no calibration card: shown, not counted" }); continue; }
    if (e.outcome !== "good") { silent.push({ layer: e.layer, why: "did not fire: adds nothing (absence of evidence is not evidence of absence)" }); continue; }
    const c = (e.count ?? 1) * Math.log(e.card.lrGood), g = e.card.group, cur = best.get(g);
    if (!cur || c > cur.contribution) best.set(g, { group: g, layer: e.layer, contribution: c, lr: e.card.lrGood, count: e.count ?? 1 });
  }
  const groups = [...best.values()].sort((a, b) => b.contribution - a.contribution), logOdds = Math.log(p0 / (1 - p0)) + groups.reduce((a, x) => a + x.contribution, 0), veto = vetoes.length > 0;
  const posterior = veto ? 0 : 1 / (1 + Math.exp(-logOdds));
  const needs = [...uncalibrated.map((u) => `calibrate ${u.layer}`), ...silent.filter((s) => s.why === "not measured").map((s) => `measure ${s.layer}`)];
  return { schema: SCHEMA, prior: p0, logOdds, posterior, groups, kEff: groups.filter((x) => x.contribution > 0).length, uncalibrated, silent, vetoes, status: veto ? "vetoed" : posterior > 0.5 ? "survived" : "underexposed", needs };
}
/** cards from the planted-truth runs of experiments/self-supervised-segmentation (parsed result files injected; counts are DERIVED here, never typed in) */
export function cardsFromRuns({ heldout, power, run1 }) {
  const cards = {};
  if (heldout?.A && heldout?.B?.planted) { const P = Object.values(heldout.B.planted), folds = heldout.A.goodPerFold.length; cards["tier1-heldout-compression"] = calibrationCard({ layer: "tier1-heldout-compression", group: "own-tokens", planted: { n: P.length * folds, hit: P.reduce((a, x) => a + x, 0) }, noise: { n: heldout.A.candidates * folds, hit: heldout.A.goodPerFold.reduce((a, x) => a + x, 0) }, provenance: "heldout-result-calibrate.json: planted function words good per fold; noise candidates good per fold" }); }
  if (power?.conditions?.A && power?.conditions?.B) { const A = power.conditions.A.stats, B = power.conditions.B; cards["tagger-context-confidence"] = calibrationCard({ layer: "tagger-context-confidence", group: "khora-tagger", planted: { n: Object.keys(B.plantedGoodBatches).length * 4, hit: Object.values(B.plantedGoodBatches).reduce((a, x) => a + x, 0) }, noise: { n: A.reduce((a, s) => a + s.evaluable, 0), hit: A.reduce((a, s) => a + s.good, 0) }, provenance: "calibration-result-power.json (context-only, 200 sentences)" }); }
  if (run1?.conditions?.A && run1?.conditions?.B) { const A = run1.conditions.A.stats, B = run1.conditions.B; cards["tagger-alltoken-confidence"] = calibrationCard({ layer: "tagger-alltoken-confidence", group: "khora-tagger", planted: { n: Object.keys(B.plantedGoodBatches).length * 4, hit: Object.values(B.plantedGoodBatches).reduce((a, x) => a + x, 0) }, noise: { n: A.reduce((a, s) => a + s.evaluable, 0), hit: A.reduce((a, s) => a + s.good, 0) }, provenance: "calibration-result-run1.json (all-token, 40 sentences)" }); }
  return cards;
}
