// Applies the evidence ledger to the clitic candidates. Layers: tier-1 held-out compression (calibrated) fired when goodFolds > 0 of the real run; tagger context layer from clitic-ctx-result.json (calibrated, weak); treebank/codec layers listed as uncalibrated. EXPLORATORY.
// Folds share training data (dependent), so a form that was good in any fold counts ONCE: counting 3 good folds as 3 independent draws gave "ing" 0.997 (an overconfidence found on first run, corrected before commit).
import fs from "node:fs"; import { cardsFromRuns, combine } from "../../organs/evidence-ledger.mjs";
const rd = (f) => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8")), cards = cardsFromRuns({ heldout: rd("heldout-result-calibrate.json"), power: rd("calibration-result-power.json"), run1: rd("calibration-result-run1.json") }), real = rd("heldout-result-real.json"), ctx = rd("clitic-ctx-result.json");
const out = {}, forms = Object.keys(real.forms), candidates = 5186;
for (const f of forms) {
  const h = real.forms[f], c = ctx.out[f] ?? null, ev = [{ layer: "tier1-heldout-compression", group: "own-tokens", outcome: h.goodFolds > 0 ? "good" : "not_good", count: 1, card: cards["tier1-heldout-compression"] }, { layer: "tagger-context-confidence", group: "khora-tagger", outcome: c == null ? "unmeasured" : (c.nullReaching === 0) ? "good" : "not_good", card: cards["tagger-context-confidence"] }, { layer: "treebank-possessive-recovery", group: "ewt", outcome: "good", card: null }];
  const r = combine({ candidates, evidence: ev }); out[f] = { posterior: +r.posterior.toFixed(6), status: r.status, kEff: r.kEff, needs: r.needs, fired: r.groups.map((g) => g.layer) };
}
console.log(JSON.stringify(out, null, 1)); fs.writeFileSync(new URL("ledger-clitics-result.json", import.meta.url), JSON.stringify({ stamp: "EXPLORATORY", cards, out }, null, 1));
