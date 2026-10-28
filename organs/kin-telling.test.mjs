// organs/kin-telling.test.mjs — G1-3: the English composer, its independent checker, the controls and the default-untouched proof.
//
// A fixture of invented size stands in for the fold (a handful of beings, a Russian text of four lines, a lexicon shaped like janus
// priors/kin-lexicon.json). Tests that need the real windows (the workspace's foldcode-answer folds) or janus (deriveKin) SKIP with a typed reason
// when those are absent, as the house does for a missing sibling checkout.
// Run: node --test organs/kin-telling.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { makeKinContext, composeQuestion, composeWindow, composeBattery, render, selftest, FRAME_SET, SKELETONS } from "./kin-telling.mjs";
import { makeChecker, typeProse } from "./kin-telling-check.mjs";
import { generationKinds } from "./generation/api.mjs";
import adapter from "./generation/adapters/kin-telling.mjs";
import { weave } from "./generation/api.mjs";
import { armTripwires, staticScan } from "../gym/kin-telling-run.mjs";
import { makeMutator } from "../gym/kin-telling-mutants.mjs";
import { growthFixture, windowPaths, loadWindow, FRAMES_PATH } from "../gym/kin-telling-lib.mjs";
import { kernelPath } from "./kernel-reach.mjs";

const sha = (b) => createHash("sha256").update(b).digest("hex");
const frames = JSON.parse(fs.readFileSync(FRAMES_PATH, "utf8"));

// ── the fixture
const TEXT = "Пётр молчал.\nПриехал князь Василий.\nИпполит, сын князя Василия.\nЭлен, дочь князя Василия.\nАнна Павловна Шерер приняла гостей.\nЛиза, дочь Анны Павловны.\n";
const textBuf = Buffer.from(TEXT, "utf8");
const span = (s) => { const a = Buffer.byteLength(TEXT.slice(0, TEXT.indexOf(s))); return `ru#${a}-${a + Buffer.byteLength(s)}`; };
const atom = (rel, end, sex) => ({ rel, end, sex, giver: "wiktionary-en", sense: 0, witness: "gloss" });
const lexicon = {
  atoms: { father: atom("parent_of", "a", "male"), mother: atom("parent_of", "a", "female"), parent: atom("parent_of", "a", null), son: atom("parent_of", "b", "male"), daughter: atom("parent_of", "b", "female"), child: atom("parent_of", "b", null),
    brother: atom("sibling_of", "a", "male"), sister: atom("sibling_of", "a", "female"), sibling: atom("sibling_of", "a", null), husband: atom("spouse_of", "a", "male"), wife: atom("spouse_of", "a", "female"), spouse: atom("spouse_of", "a", null) },
  composites: { uncle: { head_of: "parent", alternatives: [{ head: "brother", evaluable: true }], giver: "wiktionary-en", witness: "The brother of one's parent." }, grandfather: { head_of: "parent", alternatives: [{ head: "father", evaluable: true }], giver: "wiktionary-en", witness: "A father of someone's parent." } },
  russian: { сын: { en: "son", kind: "atom" }, дочь: { en: "daughter", kind: "atom" } },
  russian_forms: { сына: "сын", дочери: "дочь" },
};
const lexSha = sha(JSON.stringify(lexicon));
const parallel = { rows: [{ root: "Элен", forms: [{ form: "Элен", uses: 5 }], english: "Helene", standing: "candidate", giver: "aligned edition" }, { root: "Анна", forms: [{ form: "Анна", uses: 5 }], english: "Anna", standing: "candidate", collidesWith: ["Павловна"] }] };
const parSha = sha(JSON.stringify(parallel));
const nameParts = { patronymic: { suffixesCyrillic: ["ович", "евич", "ич", "овна", "евна", "ична", "инична"] } };
const surf = (arr) => arr.map(([text, n]) => ({ text, n, foldedBy: "most_written" }));
const referents = [
  { id: "r_vas", display: "князь Василий", standing: "referent", surfaces: surf([["князь Василий", 2], ["князя Василия", 3]]) },
  { id: "r_ipp", display: "Ипполит", standing: "referent", surfaces: surf([["Ипполит", 1]]) },
  { id: "r_elen", display: "Элен", standing: "referent", surfaces: surf([["Элен", 1]]) },
  { id: "r_anna", display: "Анна Павловна", standing: "referent", surfaces: surf([["Анна Павловна", 1], ["Анна Павловна Шерер", 1], ["Анны Павловны", 1]]) },
  { id: "r_pet", display: "Пётр", standing: "referent", surfaces: surf([["Пётр", 0]]) },
];
const w1 = span("Ипполит, сын князя Василия"), w2 = span("Элен, дочь князя Василия"), w3 = span("Анна Павловна Шерер");
const fold = {
  referents, six: ["r_vas"],
  kin: { facts: [
    { rel: "parent_of", a: "r_vas", b: "r_ipp", giver: "text:ru", standing: "given", witnesses: [w1] }, { rel: "sex", a: "r_ipp", b: null, value: "male", giver: "text:ru", standing: "given", witnesses: [w1] },
    { rel: "parent_of", a: "r_vas", b: "r_elen", giver: "text:ru", standing: "given", witnesses: [w2] }, { rel: "sex", a: "r_elen", b: null, value: "female", giver: "text:ru", standing: "given", witnesses: [w2] },
    { rel: "sex", a: "r_anna", b: null, value: "female", giver: "name-parts-ru", standing: "candidate", witnesses: [w3] },
  ], unbound: [{ why: "both_ends_unbound" }, { why: "both_ends_unbound" }] },
  derivation: { battery: ["uncle", "grandfather"], byReferent: { r_vas: {
    uncle: { state: "gap", items: [], gaps: [{ kind: "no_parent_fact", slot: { rel: "parent_of", a: "?", b: "r_vas" } }], ruleNotes: [] },
    grandfather: { state: "gap", items: [], gaps: [{ kind: "no_parent_fact", slot: { rel: "parent_of", a: "?", b: "r_vas" } }], ruleNotes: [] },
  } } },
};
const Q = (id, template, text, subject, referent, extra = {}) => ({ id, n: Number(id.slice(1)), template, text, subject, referent, answerable: true, ...extra });
const questions = [
  Q("Q1", "T-KIN", "Which people in this text are Элен's kin, and how?", "Элен", "r_elen"),
  Q("Q2", "T-KIN", "Which people in this text are Пётр's kin, and how?", "Пётр", "r_pet"),
  Q("Q3", "T-ID", "Who is Анна Павловна in this text?", "Анна Павловна", "r_anna"),
  Q("Q4", "C-UNCLE", "Who is the uncle of князь Василий in this text?", "князь Василий", "r_vas"),
  Q("Q5", "C-ABSENT", "Who is Наташа Ростова in this text?", "Наташа Ростова", null),
  Q("Q6", "T-SPEECH", "Whom does Элен speak to in this text?", "Элен", "r_elen"),
  Q("Q7", "T-ID", "Who is князь Василий in this text?", "князь Василий", "r_vas"),
];
const mkCtx = () => makeKinContext({ fold, textBuf, lexicon, lexiconSha: lexSha, parallel, parallelSha: parSha, window: "fixture" });
const mkChk = () => makeChecker({ fold, textBuf, lexicon, lexiconSha: lexSha, parallel, parallelSha: parSha, namePartsRu: nameParts, frames });
const byId = Object.fromEntries(questions.map((q) => [q.id, q]));

test("selftest", () => assert.equal(selftest().ok, true));

test("every skeleton word is in the declared closed set, and the set is exactly those words", () => {
  const used = new Set();
  for (const variants of Object.values(SKELETONS)) for (const v of variants) for (const w of v.replace(/\{[^}]*\}/g, " ").replace(/\[[^\]]*\]/g, (m) => m.replace(/\{[^}]*\}/g, " ")).toLowerCase().match(/[a-z]+/g) ?? []) used.add(w);
  used.add("and"); used.add("or");
  assert.deepEqual([...used].sort(), [...FRAME_SET].sort());
});

test("a stated kin fact is composed with its quotation, and the checker re-derives it", () => {
  const ctx = mkCtx(), chk = mkChk();
  const d = composeQuestion(ctx, byId.Q1);
  assert.deepEqual(d.sentences.map((s) => s.text), [
    "«князь Василий» is the parent of «Элен».",
    "The text states «Элен, дочь князя Василия».",
    "Neither male nor female is stated for «князь Василий» by the text.",
    "The text states no child, sibling, or spouse of «Элен».",
    "Kin words in the text with an unbound end: 2.",
  ]);
  const v = chk.checkDoc(d, byId.Q1);
  assert.equal(v.ok, true, JSON.stringify(v.failures));
  for (const s of d.sentences) assert.ok(s.segs.some((g) => g.k === "ru") || s.extent, "every sentence has a Russian-span address");
});

test("a typed gap names the missing fact and the giver that does not state it, and states no fact", () => {
  const d = composeQuestion(mkCtx(), byId.Q2);
  assert.match(d.sentences[0].text, /^The text states no parent, child, sibling, or spouse of «Пётр»\.$/);
  assert.ok(d.sentences.every((s) => !["REL", "REL-D", "SEX"].includes(s.claim)));
  assert.equal(mkChk().checkDoc(d, byId.Q2).ok, true);
});

test("an absent name is composed from the asker's span and the extent; a name that has a referent is refused", () => {
  const ctx = mkCtx(), chk = mkChk();
  const d = composeQuestion(ctx, byId.Q5);
  assert.equal(d.sentences[0].text, "The reading of the text has no being written «Наташа Ростова».");
  assert.equal(d.sentences[0].extent, `ru#0-${textBuf.length}`);
  assert.equal(chk.checkDoc(d, byId.Q5).ok, true);
  const present = composeQuestion(ctx, { ...byId.Q5, subject: "Элен", text: "Who is Элен in this text?" });
  assert.equal(present.sentences.length, 0);
  assert.equal(present.uncomposed[0].reason, "subject_has_a_referent");
});

test("identity: a name-parts sex candidate carries its standing; a colliding English name is never used", () => {
  const d = composeQuestion(mkCtx(), byId.Q3);
  assert.ok(d.sentences.some((s) => /female \(name-parts-ru, candidate\)\./.test(s.text) || /name-parts-ru gives/.test(s.text)));
  assert.ok(!d.sentences.some((s) => /Anna/.test(s.text)), "the row with collidesWith is not used");
  const e = composeQuestion(mkCtx(), byId.Q1 && { ...byId.Q1, template: "T-ID", id: "Q1" });
  assert.ok(e.sentences.some((s) => /Helene/.test(s.text)));
  assert.equal(mkChk().checkDoc(d, byId.Q3).ok, true);
});

test("an out-of-scope question (speech) is a typed reason, never a sentence", () => {
  const d = composeQuestion(mkCtx(), byId.Q6);
  assert.equal(d.sentences.length, 0);
  assert.equal(d.uncomposed[0].reason, "no_record_for_question_kind");
});

test("the battery cell: a gap is NONE plus the missing fact; the sentence list is checker-clean", () => {
  const d = composeBattery(mkCtx(), "r_vas");
  assert.match(d.sentences[0].text, /^No uncle or grandfather of «князь Василий» is derived\.$|^No grandfather or uncle of «князь Василий» is derived\.$|^The facts derive no/);
  assert.equal(mkChk().checkDoc(d, null).ok, true);
});

test("plain English with no addresses fails the check, sentence by sentence", () => {
  const t = typeProse("Elena is the daughter of Prince Vasili. Hippolyte is his son.");
  assert.equal(t.sentences, 2);
  assert.equal(t.failures.length, 2);
});

test("the checker rejects: a stripped address, a changed byte, a word outside the set, a self:model segment, a false relation, a missing extent", () => {
  const ctx = mkCtx(), chk = mkChk();
  const d = composeQuestion(ctx, byId.Q1);
  const mut = (i, fn) => { const m = JSON.parse(JSON.stringify(d)); fn(m.sentences[i]); m.sentences[i].text = m.sentences[i].segs.map((g) => (g.k === "ru" || g.k === "ask" ? `«${g.t}»` : g.t)).join(""); return chk.checkDoc(m, byId.Q1); };
  assert.equal(mut(0, (s) => { delete s.segs[0].a; }).ok, false);
  assert.equal(mut(0, (s) => { s.segs[0].t = s.segs[0].t.replace("к", "х"); }).ok, false);
  assert.equal(mut(0, (s) => { s.segs[1].t = s.segs[1].t.replace("is", "was"); }).ok, false);
  assert.equal(mut(0, (s) => { s.segs[0].k = "self:model"; }).ok, false);
  assert.equal(mut(0, (s) => { const t = s.segs.find((g) => g.k === "row"); t.t = "child"; t.a = t.a.replace("atoms/parent", "atoms/child"); }).ok, false, "the reversed relation is not a fact");
  const noExtent = JSON.parse(JSON.stringify(d)); delete noExtent.sentences[3].extent;
  assert.equal(chk.checkDoc(noExtent, byId.Q1).ok, false);
});

test("the mutation battery: every non-equivalent mutant of every composed sentence is rejected", () => {
  const ctx = mkCtx(), chk = mkChk(), mut = makeMutator({ fold, textBuf, lexicon, lexiconSha: lexSha });
  let made = 0, killed = 0;
  for (const q of questions.filter((x) => x.template !== "T-SPEECH")) {
    const d = composeQuestion(ctx, q);
    assert.equal(chk.checkDoc(d, q).ok, true, `${q.id} baseline`);
    d.sentences.forEach((s, i) => { for (const { sentence } of mut.mutantsOf(s, d)) { made++; if (!chk.checkDoc({ ...d, sentences: d.sentences.map((x, j) => (j === i ? sentence : x)) }, q).ok) killed++; } });
  }
  assert.ok(made >= 20, `only ${made} mutants`);
  assert.equal(killed, made);
});

test("variants never change what is claimed (the parsed claim set is the same across first, second and chosen)", () => {
  const chk = mkChk();
  for (const q of questions.filter((x) => x.template !== "T-SPEECH")) {
    const keys = (policy) => chk.checkDoc(composeQuestion(mkCtx(), q, { policy }), q).claimKeys.sort().join("\n");
    assert.equal(keys("first"), keys("second"), q.id);
    assert.equal(keys("first"), keys("chosen"), q.id);
  }
});

test("two runs are byte-identical", () => {
  const a = JSON.stringify(composeWindow(mkCtx(), questions)), b = JSON.stringify(composeWindow(mkCtx(), questions));
  assert.equal(a, b);
});

test("the shuffled controls fail the checker (ends shuffled; witnesses shuffled)", () => {
  const chk = mkChk();
  const ids = referents.map((r) => r.id).sort();
  const sigma = new Map(ids.map((id, i) => [id, ids[(i + 1) % ids.length]]));
  const d1 = composeQuestion(mkCtx(), byId.Q1, { control: { id: (x) => sigma.get(x) ?? x } });
  assert.equal(chk.checkDoc(d1, byId.Q1).ok, false);
  const d2 = composeQuestion(mkCtx(), byId.Q1, { control: { wit: (w) => (w === w2 ? w1 : w) } });
  const v2 = chk.checkDoc(d2, byId.Q1);
  assert.equal(v2.ok, false);
  assert.ok(v2.failures.some((f) => /WIT/.test(f.code)), "the swapped witness is rejected by the WIT check");
});

test("a name-parts patronymic witness is supported across case endings, and the sex it gives is shown as a candidate", () => {
  const f2 = { ...fold, referents: [...referents, { id: "r_liza", display: "Лиза", standing: "referent", surfaces: surf([["Лиза", 1]]) }, ],
    kin: { ...fold.kin, facts: [...fold.kin.facts.filter((f) => !(f.rel === "sex" && f.a === "r_anna")),
      { rel: "parent_of", a: "r_anna", b: "r_liza", giver: "text:ru", standing: "given", witnesses: [span("Лиза, дочь Анны Павловны")] },
      { rel: "sex", a: "r_anna", b: null, value: "female", giver: "name-parts-ru", standing: "candidate", witnesses: [span("Анны Павловны")] }] } };
  const ctx = makeKinContext({ fold: f2, textBuf, lexicon, lexiconSha: lexSha, parallel, parallelSha: parSha });
  const chk = makeChecker({ fold: f2, textBuf, lexicon, lexiconSha: lexSha, parallel, parallelSha: parSha, namePartsRu: nameParts, frames });
  const q = Q("Q9", "T-KIN", "Which people in this text are Лиза's kin, and how?", "Лиза", "r_liza");
  const d = composeQuestion(ctx, q);
  assert.match(d.sentences[0].text, /^«Анна Павловна» is the mother of «Лиза» \(candidate\)\.$/);
  assert.ok(d.sentences.some((s) => s.claim === "WIT" && /Анны Павловны»\.$/.test(s.text) && !/дочь/.test(s.text)), "the patronymic witness is quoted");
  const v = chk.checkDoc(d, q);
  assert.equal(v.ok, true, JSON.stringify(v.failures));
});

test("no model: the pure files import only node:crypto and local files; the tripwire fires on a probe and stays silent over the composer", async () => {
  for (const f of ["kin-telling.mjs", "kin-telling-check.mjs", "generation/adapters/kin-telling.mjs"]) assert.equal(staticScan(fileURLToPath(new URL(`./${f}`, import.meta.url))).ok, true, f);
  const wire = armTripwires();
  try {
    const probe = await wire.probe();
    assert.equal(probe.spawnTripped, true); assert.equal(probe.fetchTripped, true);
    wire.resetCounts();
    composeWindow(mkCtx(), questions);
    const c = wire.count();
    assert.equal(c.fired, 0); assert.equal(c.fetchModelDoor, 0);
  } finally { wire.restore(); }
});

test("through weave({noModel:true}) every sentence is a field-settled unit, none model-required, same text as the direct path", async () => {
  const ctx = mkCtx(), chk = mkChk();
  const q = byId.Q1;
  const quiet = console.log; console.log = () => {};
  let r;
  try { r = await weave({ intent: q.text, artifact: adapter, noModel: true, output: fs.mkdtempSync("/tmp/kin-telling-weave-"), context: { kin: { composeCtx: ctx, checker: chk, question: q } } }); } finally { console.log = quiet; }
  const stages = r.evidence.outcomes.map((o) => o.stage);
  assert.ok(stages.length > 0 && stages.every((s) => s === "field"), stages.join(","));
  assert.equal(r.noModel, true); assert.equal(r.model, null); assert.equal(r.ok, true, JSON.stringify(r.verification));
  assert.equal(r.artifact.value, composeQuestion(ctx, q).sentences.map((s) => s.text).join("\n\n") + "\n");
});

test("default behaviour is untouched: the adapter is not a built-in kind, and weave still refuses an unknown kind as a typed gap", async () => {
  assert.ok(!generationKinds().includes("kin-telling"));
  const r = await weave({ intent: "x", artifact: "kin-telling", noModel: true });
  assert.equal(r.ok, false); assert.equal(r.status, "gap");
});

// ── tests that need siblings or the workspace: typed SKIPs
const janusHome = (() => { try { const p = kernelPath("janus", "native/organs/kinship.js"); return fs.existsSync(p) && fs.existsSync(kernelPath("janus", "priors/kin-lexicon.json")) ? p : null; } catch { return null; } })();
test("growth: more facts, answered by the real janus deriveKin, flow through the unchanged composer and the checker", { skip: janusHome ? false : "janus-absent: native/organs/kinship.js" }, async () => {
  const K = await import(janusHome);
  const lex = JSON.parse(fs.readFileSync(kernelPath("janus", "priors/kin-lexicon.json"), "utf8"));
  const lexS = sha(fs.readFileSync(kernelPath("janus", "priors/kin-lexicon.json")));
  const fx = growthFixture(K, lex);
  const ctx = makeKinContext({ fold: fx.fold, textBuf: fx.textBuf, lexicon: lex, lexiconSha: lexS, window: "growth" });
  const chk = makeChecker({ fold: fx.fold, textBuf: fx.textBuf, lexicon: lex, lexiconSha: lexS, namePartsRu: nameParts, frames });
  const out = composeWindow(ctx, fx.questions);
  const qs = Object.fromEntries(fx.questions.map((q) => [q.id, q]));
  for (const d of [...out.docs, ...out.batteries]) { const v = chk.checkDoc(d, qs[d.id] ?? null); assert.equal(v.ok, true, `${d.id}: ${JSON.stringify(v.failures.slice(0, 3))}`); assert.equal(d.uncomposed.length, 0); }
  const uncle = out.docs.find((d) => d.id === "G1");
  assert.match(uncle.sentences[0].text, /is derived as the uncle of/);
  assert.ok(out.docs.find((d) => d.id === "G2").sentences.some((s) => /grandfather/.test(s.text)));
});

const wins = windowPaths();
const haveDev = fs.existsSync(`${wins.dev.dir}/fold.json`) && fs.existsSync(wins.dev.plain) && janusHome;
test("the development window: every registered bar that is mechanical passes", { skip: haveDev ? false : "workspace-or-janus-absent: foldcode-answer fold and janus priors" }, async () => {
  const { runWindow } = await import("../gym/kin-telling-run.mjs");
  const S = loadWindow(wins.dev, {});
  const run = await runWindow(S, { noWeave: true });
  const b = run.report.bars;
  for (const k of ["B0", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"]) assert.equal(b[k].pass, true, `${k}: ${JSON.stringify(b[k]).slice(0, 300)}`);
});
