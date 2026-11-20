import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { judge, judgeEffect, giverFrom, rulesAndVerdicts, weaveEntries } from "./tokenizer-rule-def.mjs";
test("a firing is a flip: the verdict is the BALANCE of right and wrong flips; the weight is derived from the counts; no significance level exists anywhere", () => {
  const v = judge({ fired: 134, correct: 123 }); assert.equal(v.status, "survived"); assert.equal(v.net, 112); assert.ok(Math.abs(v.weight.split - 123 / 134) < 1e-12 && Math.abs(v.weight.glued - 11 / 134) < 1e-12); assert.equal(v.robust, true);
  assert.equal(judge({ fired: 30, correct: 2 }).status, "refuted", '"not" cutting "knot": the glued reading is the heavier one'); assert.equal(judge({ fired: 30, correct: 2 }).net, -26);
  assert.equal(judge({ fired: 20, correct: 10 }).status, "underexposed", "equal weights: nothing is committed, the spectrum stays held");
  assert.equal(judge({ fired: 0, correct: 0 }).status, "unexposed", "it never fired: it makes no difference");
  assert.equal(judge({ fired: 4, correct: 4 }).status, "survived", "four firings, all right: a positive difference, carried with n = 4");
  assert.equal(judge({ fired: 5, correct: 3 }).robust, false, "net +1: dropping one firing would flip it, so the commitment is fragile and says so"); assert.equal(judge({ fired: 5, correct: 3 }).status, "survived", "a net of ONE right flip is still a positive difference: no hidden threshold of one is chosen"); assert.equal(judge({ fired: 5, correct: 2 }).status, "refuted");
  assert.equal(judge({ fired: 6, correct: 4 }).robust, true); assert.equal(judge({ fired: 1, correct: 1 }).robust, false);
  assert.equal(judge({ fired: 3, correct: 5 }).gap, "bad_counts"); assert.equal(judge({ fired: 2.5, correct: 1 }).gap, "bad_counts");
  assert.ok(!Object.keys(judge({ fired: 9, correct: 9 })).includes("p") && judge({ fired: 9, correct: 9 }).basis.includes("no significance level is chosen"));
});
// test doubles in the shape janus writes (counts only); janus' own fixture is a double of THESE, not data to copy into a log
const B = (tpB, pB, tpW, pW, g) => ({ base: { truePositive: tpB, predicted: pB, gold: g }, withAllForms: { truePositive: tpW, predicted: pW, gold: g } });
const corpus = { name: "UD_English-EWT", sha256: "ab12", licence: "CC BY-SA 4.0", language: "eng", variety: null };
const att = (form, nSplit, nGlued) => ({ id: `a-${form}`, kind: "clitic-attachment", cell: "SEG·Pattern", body: { corpus, form, nSplit, nGlued } }), fir = (form, fired, correct) => ({ id: `f-${form}`, kind: "clitic-firing", cell: "CON·Figure", body: { corpus, form, fired, correct } });
const attachments = [att("'s", 944, 47), att("n't", 100, 0), att("not", 5, 300), att("'d", 3, 1)], firings = [{ ...fir("'s", 134, 123), body: { ...fir("'s", 134, 123).body, boundaries: B(900, 1000, 990, 1100, 1000) } }, fir("n't", 89, 89), fir("not", 30, 2), fir("'d", 4, 4)];
const giver = { kind: "treebank", name: "UD_English-EWT", licence: "CC BY-SA 4.0" };
test("a rule is a DEF with a NAMED giver and standing candidate; the verdict is an EVA carrying weight, net and robustness; 'not' is refuted, \"'d\" survives thinly and says how thin", () => {
  const r = rulesAndVerdicts({ attachments, firings, language: "eng", giver }), by = (k) => r.entries.filter((e) => e.kind === k);
  assert.equal(by("tokenizer-rule").length, 4); assert.ok(by("tokenizer-rule").every((e) => e.cell === "DEF·Pattern" && e.body.standing === "candidate" && e.body.giver.name === "UD_English-EWT" && e.body.effect === "split" && e.body.position === "suffix"));
  const st = Object.fromEntries(by("rule-verdict").map((v) => [by("tokenizer-rule").find((e) => e.addr === v.body.rule).body.form, v.body.status]));
  assert.deepEqual(st, { "'s": "survived", "n't": "survived", "not": "refuted", "'d": "survived" });
  assert.ok(by("rule-verdict").every((v) => v.cell === "EVA·Pattern" && v.body.alpha === null && v.body.upTo.includes("difference that makes a difference") && typeof v.body.net === "number"));
  const vs = (f) => by("rule-verdict").find((v) => by("tokenizer-rule").find((e) => e.addr === v.body.rule).body.form === f).body;
  assert.equal(vs("'s").robust, true); assert.equal(vs("'s").net, 112); assert.deepEqual(vs("'s").overall.without, { precision: 0.9, recall: 0.9 }, "the corpus-wide difference is carried as a report: precision and recall without all the forms"); assert.ok(vs("'s").overall.withAllForms.recall > vs("'s").overall.without.recall);
  assert.equal(vs("n't").overall, null, "no boundary counts on that entry: nothing is invented");
  assert.deepEqual(by("tokenizer-rule")[0].body.evidence.length > 0, true, "the rule cites the janus entries it rests on");
});
test("refusals are typed gaps, never defaults: no giver, no language, no evidence for this variety, an entry in the wrong cell", () => {
  const base = { attachments, firings, language: "eng", giver };
  assert.equal(rulesAndVerdicts({ ...base, giver: null }).gaps[0].gap, "no_giver"); assert.equal(rulesAndVerdicts({ ...base, giver: { kind: "treebank" } }).gaps[0].gap, "no_giver");
  assert.equal(rulesAndVerdicts({ ...base, language: null }).gaps[0].gap, "no_language");
  const cr = rulesAndVerdicts({ ...base, variety: "creole" }); assert.equal(cr.entries.length, 0); assert.equal(cr.gaps[0].gap, "no_attachment_evidence", "a variety with no evidence gets the typed gap, never the English rules");
  const wrong = rulesAndVerdicts({ ...base, attachments: [{ ...att("'s", 9, 0), cell: "DEF·Pattern" }, ...attachments] }); assert.equal(wrong.refused.length, 1);
});
test("weave: the DEF and the EVA go on the log under Penelope's writer and pass the writers audit; a janus-written verdict is a violation", async () => {
  const LIB = process.env.PHAROS_LIB ?? ""; if (!LIB || !fs.existsSync(LIB)) return;
  const P = await import(`file://${LIB}`), W = await import(`file://${path.join(path.dirname(LIB), "writers.mjs")}`), r = rulesAndVerdicts({ attachments, firings, language: "eng", giver });
  const h = P.open("t", { dir: fs.mkdtempSync(path.join(os.tmpdir(), "tok-")), writer: "w" }); weaveEntries(P, h, r.entries);
  const es = P.entries(h).filter((e) => ["tokenizer-rule", "rule-verdict"].includes(e.kind)); assert.equal(es.length, r.entries.length);
  assert.ok(W.audit(es.map((e) => ({ ...e, by: "penelope" }))).ok); assert.ok(W.audit(es.filter((e) => e.kind === "rule-verdict").map((e) => ({ ...e, by: "janus" }))).violations.length > 0);
});

// doubles of the codec session's preliminary numbers (clitic-effect, CON·Figure); the SHAPE is theirs, the values are placeholders for the full run
const eff = (form, effect, reach, draws = 100, wrongCuts = { instances: 0, tokens: 0, delta: 0 }, sentences = 500) => ({ id: `e-${form}`, kind: "clitic-effect", cell: "CON·Figure", body: { corpus, form, sentences, effect, null: { kind: "one random word cut at the form's length on the same sentences", draws, seed: 7, nullReaching: reach, mean: -4, sd: 1, min: -8, max: -1 }, wrongCuts } });
test("the verdict by downstream difference: the expected difference of a firing is the evidence-weighted effect and harm; survived only beyond the null's own range", () => {
  const good = judgeEffect({ fired: 100, correct: 100, effect: 2.7, nul: { draws: 100, nullReaching: 0 } }); assert.equal(good.status, "survived"); assert.equal(good.expected, 2.7); assert.equal(good.rank.beyondNull, true); assert.ok(Math.abs(good.rank.empirical - 1 / 101) < 1e-12, "the empirical rank is REPORTED: (0 + 1) / (100 + 1)");
  const harmed = judgeEffect({ fired: 100, correct: 50, effect: 4, nul: { draws: 100, nullReaching: 0 }, wrongCuts: { instances: 50, tokens: 200, delta: -10 } }); assert.equal(harmed.expected, -3, "0.5 x 4 + 0.5 x -10"); assert.equal(harmed.status, "refuted", "a rule that harms more when wrong than it helps when right is worse than leaving the word glued");
  assert.equal(judgeEffect({ fired: 12, correct: 12, effect: -1.0, nul: { draws: 100, nullReaching: 0 } }).status, "refuted", "a negative effect on the right firings alone is worse than glued: refuted");
  assert.equal(judgeEffect({ fired: 4, correct: 4, effect: 0, nul: { draws: 10, nullReaching: 1 } }).status, "underexposed", "no effect: no difference");
  assert.equal(judgeEffect({ fired: 100, correct: 100, effect: 2, nul: { draws: 100, nullReaching: 3 } }).status, "underexposed", "positive, but 3 random cuts do as well: not separable from the null");
  assert.equal(judgeEffect({ fired: 100, correct: 100, effect: 2, nul: { draws: 100, nullReaching: 3 } }).rank.empirical, 4 / 101); assert.equal(judgeEffect({ fired: 100, correct: 100, effect: 2, nul: { draws: 100, nullReaching: 3 } }).rank.beyondNull, false);
});
test("typed gaps, never assumed numbers: no downstream evidence, and a wrong share with no harm measure (harm is NOT assumed zero)", () => {
  assert.equal(judgeEffect({ fired: 10, correct: 10 }).gap, "no_effect_evidence"); assert.equal(judgeEffect({ fired: 10, correct: 10, effect: 1, nul: { draws: 0, nullReaching: 0 } }).gap, "no_effect_evidence");
  const g = judgeEffect({ fired: 10, correct: 7, effect: 1, nul: { draws: 100, nullReaching: 0 } }); assert.equal(g.gap, "no_wrong_cut_measure"); assert.equal(g.flips.status, "survived", "the balance of flips is still there, and the verdict falls back to it");
  assert.equal(judgeEffect({ fired: 10, correct: 10, effect: 1, nul: { draws: 100, nullReaching: 0 } }).status, "survived", "all firings right: no harm measure is needed");
});
test("rulesAndVerdicts with effect entries: the verdict carries the expected difference, the rank and the harm; without them it says 'downstream none on record' and reports the gap", () => {
  const withE = rulesAndVerdicts({ attachments, firings, effects: [eff("\'s", 2.7, 0, 100, { instances: 3, tokens: 9, delta: -1 }), eff("n\'t", 5.8, 0, 100, undefined), eff("not", 3, 0, 100, { instances: 28, tokens: 80, delta: -9 }), eff("\'d", 0, 1, 10)], language: "eng", giver });
  const by = (f) => { const rule = withE.entries.find((e) => e.kind === "tokenizer-rule" && e.body.form === f); return withE.entries.find((e) => e.kind === "rule-verdict" && e.body.rule === rule.addr).body; };
  assert.equal(by("\'s").status, "survived"); assert.ok(Math.abs(by("\'s").expected - (123 / 134 * 2.7 + 11 / 134 * -1)) < 1e-12, "123/134 right x 2.7 + 11/134 wrong x -1"); assert.equal(by("\'s").rank.nullReaching, 0); assert.equal(by("\'s").harm, -1);
  assert.equal(by("not").status, "refuted", "30 firings, 2 right: 0.067 x 3 + 0.933 x -9 < 0"); assert.equal(by("\'d").status, "underexposed", "4 firings, effect 0: no difference");
  const none = rulesAndVerdicts({ attachments, firings, language: "eng", giver }), n1 = none.entries.find((e) => e.kind === "rule-verdict").body; assert.equal(n1.downstream, "none on record"); assert.equal(n1.expected, undefined);
});

const DECL = JSON.parse(fs.readFileSync(new URL("./data/giver-ud-english-clitics.json", import.meta.url), "utf8"));
test("the giver declaration is data with PROVENANCE: who declared it, which forms it names, the pinned grounds; anything less is refused", () => {
  const g = giverFrom(DECL); assert.equal(g.giver.name, "Universal Dependencies English documentation"); assert.equal(g.giver.declaredBy.name, "the owner"); assert.equal(g.giver.pins.length, 3); assert.ok(g.giver.pins.every((p) => /^[0-9a-f]{64}$/.test(p.sha256)));
  assert.ok(g.names.has("'s") && g.names.has("n't") && !g.names.has("'re"), "'re is not named by the standard: a candidate");
  assert.equal(giverFrom({ ...DECL, declaredBy: null }).gap, "bad_giver"); assert.equal(giverFrom({ ...DECL, names: [] }).gap, "bad_giver"); assert.equal(giverFrom({ ...DECL, pins: [] }).gap, "bad_giver"); assert.equal(giverFrom({ ...DECL, pins: [{ url: "u", sha256: "abc" }] }).gap, "bad_giver", "a pin with a short hash is not a ground"); assert.equal(giverFrom({ ...DECL, name: "" }).gap, "bad_giver");
});
test("a form the standard NAMES becomes `given` under it; any other form stays a candidate under the corpus as its giver, never the standard", () => {
  const g = giverFrom(DECL), at = [att("'s", 944, 47), att("'re", 40, 0), att("not", 5, 300)], fi = [fir("'s", 134, 123), fir("'re", 12, 12), fir("not", 30, 2)];
  const r = rulesAndVerdicts({ attachments: at, firings: fi, language: "eng", giver: { ...g.giver, names: [...g.names] } }), rule = (f) => r.entries.find((e) => e.kind === "tokenizer-rule" && e.body.form === f).body;
  assert.equal(rule("'s").standing, "given"); assert.equal(rule("'s").giver.name, "Universal Dependencies English documentation"); assert.equal(rule("'s").giver.pins.length, 3);
  assert.equal(rule("'re").standing, "candidate"); assert.equal(rule("'re").giver.kind, "treebank"); assert.equal(rule("'re").giver.name, "UD_English-EWT"); assert.equal(rule("not").standing, "candidate", "the standard does not name 'not': a corpus count alone");
  assert.equal(rulesAndVerdicts({ attachments: at, firings: fi, language: "eng", giver }).entries.find((e) => e.kind === "tokenizer-rule").body.standing, "candidate", "a giver that names no forms makes nothing given");
});
