import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { judge, rulesAndVerdicts, weaveEntries } from "./tokenizer-rule-def.mjs";
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
