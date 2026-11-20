import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { tailGE, nMin, judge, rulesAndVerdicts, weaveEntries } from "./tokenizer-rule-def.mjs";
const near = (a, b, e = 1e-12) => Math.abs(a - b) < e;
test("the exact binomial tail against a fair coin (BigInt sum, no floating error): known values", () => {
  assert.ok(near(tailGE(0, 5), 1)); assert.ok(near(tailGE(5, 5), 1 / 32)); assert.ok(near(tailGE(3, 5), 16 / 32)); assert.equal(tailGE(6, 5), 0); assert.ok(near(tailGE(7, 10), 176 / 1024));
  assert.ok(tailGE(123, 134) < 1e-18, "the janus measure for 's: 123 of 134 is far from a coin");
});
test("underexposure is DERIVED from alpha: the smallest n at which even an all-correct run could count", () => { assert.equal(nMin(0.05), 5); assert.equal(nMin(0.01), 7); assert.equal(nMin(0.5), 1); });
test("verdicts: survived (clearly above a coin), refuted (clearly below), underexposed (too few, or not distinguishable from a coin), unexposed (never fired); alpha must be given", () => {
  const a = { alpha: 0.01 };
  assert.equal(judge({ fired: 134, correct: 123 }, a).status, "survived"); assert.equal(judge({ fired: 89, correct: 89 }, a).status, "survived");
  assert.equal(judge({ fired: 30, correct: 2 }, a).status, "refuted", '"not" cutting "knot": fires, and is almost always wrong');
  assert.equal(judge({ fired: 6, correct: 6 }, a).status, "underexposed", "six firings can never reach alpha 0.01");
  assert.equal(judge({ fired: 20, correct: 12 }, a).status, "underexposed", "enough firings, but 12 of 20 is not distinguishable from a coin");
  assert.equal(judge({ fired: 0, correct: 0 }, a).status, "unexposed");
  assert.equal(judge({ fired: 134, correct: 123 }, {}).gap, "alpha_not_given"); assert.equal(judge({ fired: 134, correct: 123 }, { alpha: 1.5 }).gap, "alpha_not_given");
});
// test doubles in the shape janus writes (counts only); janus' own fixture is a double of THESE, not data to copy into a log
const corpus = { name: "UD_English-EWT", sha256: "ab12", licence: "CC BY-SA 4.0", language: "eng", variety: null };
const att = (form, nSplit, nGlued) => ({ id: `a-${form}`, kind: "clitic-attachment", cell: "SEG·Pattern", body: { corpus, form, nSplit, nGlued } }), fir = (form, fired, correct) => ({ id: `f-${form}`, kind: "clitic-firing", cell: "CON·Figure", body: { corpus, form, fired, correct } });
const attachments = [att("'s", 944, 47), att("n't", 100, 0), att("not", 5, 300), att("'d", 3, 1)], firings = [fir("'s", 134, 123), fir("n't", 89, 89), fir("not", 30, 2), fir("'d", 4, 4)];
const giver = { kind: "treebank", name: "UD_English-EWT", licence: "CC BY-SA 4.0" }, alphaGiver = { kind: "owner", name: "the owner" };
test("a rule is a DEF with a NAMED giver and standing candidate; the verdict is an EVA; the latest verdict decides; 'not' is refuted, \"'d\" underexposed", () => {
  const r = rulesAndVerdicts({ attachments, firings, language: "eng", giver, alpha: 0.01, alphaGiver }), by = (k) => r.entries.filter((e) => e.kind === k);
  assert.equal(by("tokenizer-rule").length, 4); assert.ok(by("tokenizer-rule").every((e) => e.cell === "DEF·Pattern" && e.body.standing === "candidate" && e.body.giver.name === "UD_English-EWT" && e.body.effect === "split" && e.body.position === "suffix"));
  const st = Object.fromEntries(by("rule-verdict").map((v) => [by("tokenizer-rule").find((e) => e.addr === v.body.rule).body.form, v.body.status]));
  assert.deepEqual(st, { "'s": "survived", "n't": "survived", "not": "refuted", "'d": "underexposed" });
  assert.ok(by("rule-verdict").every((v) => v.cell === "EVA·Pattern" && v.body.alphaGiver.name === "the owner" && v.body.upTo.includes("binomial")));
  assert.deepEqual(by("tokenizer-rule")[0].body.evidence.length > 0, true, "the rule cites the janus entries it rests on");
});
test("refusals are typed gaps, never defaults: no giver, no alpha giver, no language, no evidence for this variety, an entry in the wrong cell", () => {
  const base = { attachments, firings, language: "eng", giver, alpha: 0.01, alphaGiver };
  assert.equal(rulesAndVerdicts({ ...base, giver: null }).gaps[0].gap, "no_giver"); assert.equal(rulesAndVerdicts({ ...base, giver: { kind: "treebank" } }).gaps[0].gap, "no_giver");
  assert.equal(rulesAndVerdicts({ ...base, alphaGiver: null }).gaps[0].gap, "alpha_not_given"); assert.equal(rulesAndVerdicts({ ...base, alpha: undefined }).gaps[0].gap, "alpha_not_given");
  assert.equal(rulesAndVerdicts({ ...base, language: null }).gaps[0].gap, "no_language");
  const cr = rulesAndVerdicts({ ...base, variety: "creole" }); assert.equal(cr.entries.length, 0); assert.equal(cr.gaps[0].gap, "no_attachment_evidence", "a variety with no evidence gets the typed gap, never the English rules");
  const wrong = rulesAndVerdicts({ ...base, attachments: [{ ...att("'s", 9, 0), cell: "DEF·Pattern" }, ...attachments] }); assert.equal(wrong.refused.length, 1);
});
test("weave: the DEF and the EVA go on the log under Penelope's writer and pass the writers audit; a janus-written verdict is a violation", async () => {
  const LIB = process.env.PHAROS_LIB ?? ""; if (!LIB || !fs.existsSync(LIB)) return;
  const P = await import(`file://${LIB}`), W = await import(`file://${path.join(path.dirname(LIB), "writers.mjs")}`), r = rulesAndVerdicts({ attachments, firings, language: "eng", giver, alpha: 0.01, alphaGiver });
  const h = P.open("t", { dir: fs.mkdtempSync(path.join(os.tmpdir(), "tok-")), writer: "w" }); weaveEntries(P, h, r.entries);
  const es = P.entries(h).filter((e) => ["tokenizer-rule", "rule-verdict"].includes(e.kind)); assert.equal(es.length, r.entries.length);
  assert.ok(W.audit(es.map((e) => ({ ...e, by: "penelope" }))).ok); assert.ok(W.audit(es.filter((e) => e.kind === "rule-verdict").map((e) => ({ ...e, by: "janus" }))).violations.length > 0);
});
