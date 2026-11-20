import test from "node:test"; import assert from "node:assert/strict"; import { checkClaim, checkReply } from "./reply-check.mjs";
const M = (a, rel, b, polarity = "+") => ({ a, rel, b, polarity }), marks = [M("Tom", "live_in", "Leeds"), M("Anna", "work_at", "Dynamo"), M("Maria", "hire", "Victor")], F = { marks, functional: ["live"] };
test("truth is a property of the claim, not of the words: a real city asserted of the wrong person is untrue; the same fact in other words about the same beings is not flagged", () => {
  assert.equal(checkClaim(M("Anna", "live_in", "Leeds"), F).status, "unsupported", "Leeds is a real city in the material, and it is still a lie about Anna");
  assert.equal(checkClaim(M("Tom", "live_in", "Leeds"), F).status, "supported");
  assert.equal(checkClaim(M("Tom", "reside_in", "Leeds"), F).status, "pair_supported", "same two beings, a different relation: counted as unchecked, not trusted silently and not accused");
});
test("a single-valued relation with another value on record is CONTRADICTED; without the declared prior it is merely unsupported", () => {
  assert.equal(checkClaim(M("Tom", "live_in", "Zurich"), F).status, "contradicted");
  assert.equal(checkClaim(M("Tom", "live_in", "Zurich"), { marks }).status, "unsupported");
});
test("a negation asserted from silence is fabricated; a negation a mark rules out is supported", () => {
  assert.equal(checkClaim(M("Anna", "work_at", "Zebra", "-"), F).status, "negation_from_silence");
  assert.equal(checkClaim(M("Tom", "live_in", "Zurich", "-"), F).status, "supported", "Tom's single-valued residence is Leeds");
});
test("derived findings and labelled proposals are allowed only as what they are", () => {
  const d = [M("Victor", "live_in", "Bath")], p = [M("Victor", "work_at", "Acme")];
  assert.equal(checkClaim(M("Victor", "live_in", "Bath"), { ...F, derived: d }).status, "derived");
  assert.equal(checkClaim(M("Victor", "work_at", "Acme"), { ...F, proposals: p }).status, "proposed");
  assert.equal(checkClaim(M("Victor", "work_at", "Acme"), F).status, "unsupported", "without the proposal on the table it is a fabrication");
});
test("verdict: fabricated if ANY claim is untrue, grounded if all are checked, unread when the reader found nothing (neither a pass nor a fail)", () => {
  assert.equal(checkReply({ replyClaims: [M("Tom", "live_in", "Leeds"), M("Anna", "live_in", "Leeds")], ...F }).verdict, "fabricated");
  assert.equal(checkReply({ replyClaims: [M("Tom", "live_in", "Leeds")], ...F }).verdict, "grounded");
  const u = checkReply({ replyClaims: [], ...F }); assert.equal(u.verdict, "unread"); assert.deepEqual(u.fabricated, []);
  assert.equal(checkReply({ replyClaims: [M("Tom", "reside_in", "Leeds")], ...F }).unchecked, 1);
});
import { unquoted, isWorld, fillHole, checkAnswer } from "./reply-check.mjs";
const T = (id, form, upos, at) => ({ id, form, upos, at, end: at + form.length });
test("V3: talk about the discourse is not a claim about the world; a name, a known being and a literal are", () => {
  const beings = new Set(["Tom", "Leeds", "deploy time"]);
  assert.equal(isWorld({ a: "machine check question", aUpos: "NOUN", b: "answer", bUpos: "NOUN" }, beings), false);
  assert.equal(isWorld({ a: "Tom", aUpos: "PROPN", b: "Leeds", bUpos: "PROPN" }, beings), true);
  assert.equal(isWorld({ a: "Anna", aUpos: "PROPN", b: "Zebra", bUpos: "PROPN" }, beings), true, "an unknown NAME is a world claim: it can be a fabrication");
  assert.equal(isWorld({ a: "deploy time", aUpos: "NOUN", b: "15:45", object: "literal" }, beings), true);
  assert.equal(isWorld({ a: "Tom", aUpos: "PROPN", b: "weather", bUpos: "NOUN" }, beings), false, "a name joined to a common noun the material never mentions is talk, not a world claim");
  assert.equal(isWorld({ a: "answer", aUpos: "NOUN", b: "Leeds", bUpos: "PROPN" }, beings), false);
});
test("V3: a quoted statement is a mention, cut out by the quote tokens' offsets", () => {
  const text = 'The statement "Maria lives in Ely" is false.', rows = [T(1, "The", "DET", 0), T(2, "statement", "NOUN", 4), T(3, '"', "PUNCT", 14), T(4, "Maria", "PROPN", 15), T(5, '"', "PUNCT", 29), T(6, "is", "AUX", 31)];
  assert.equal(unquoted(text, rows).includes("Maria"), false); assert.equal(unquoted(text, rows.filter((r) => r.upos !== "PUNCT")), text, "no quote tokens: nothing is cut");
});
test("V3: a terse answer fills the question's hole; a wrong filler is a fabrication, a decline asserts nothing", () => {
  const marks = [M("Hugo", "live_in", "Leeds"), M("Tom", "live_in", "Leeds"), M("Tom", "live_in", "Bath")], F2 = { marks, functional: ["live"] };
  const run = (text, names, pattern) => checkAnswer({ text, readRows: (t) => (t.trim() ? names.map((n, i) => ({ form: n, upos: "PROPN", at: i, end: i + 1 })) : []), claimsOf: () => [], pattern, ...F2 });
  const hb = { kind: "hole-b", lemma: "live", a: "Hugo" };
  assert.equal(run("Leeds.", ["Leeds"], hb).verdict, "grounded"); assert.equal(run("Leeds.", ["Leeds"], hb).filled, true); assert.equal(run("Leeds.", ["Leeds"], hb).unchecked, 0, "the filled claim carries the question's own relation, so it is SUPPORTED, not a paraphrase-unchecked pair");
  assert.equal(run("Bath.", ["Bath"], hb).verdict, "fabricated", "Bath is a real city in the material, and it is untrue of Hugo");
  assert.equal(run("unknown", [], hb).verdict, "no_assertion");
  const ha = { kind: "hole-a", rel: "live_in", b: "Leeds" }; assert.equal(run("Hugo and Tom", ["Hugo", "Tom"], ha).verdict, "grounded");
  assert.equal(run("Anna", ["Anna"], ha).verdict, "fabricated");
  assert.equal(run("Hugo, Tom, and Anna", ["Hugo", "Tom", "Anna"], ha).verdict, "fabricated", "every filler is judged, not only the first");
});
test("V3: meta-prose claims are ignored and counted; a real claim inside the same reply is still judged", () => {
  const marks = [M("Maria", "live_in", "Bath")], claims = [{ a: "machine check question", rel: "found", b: "x", aUpos: "NOUN", bUpos: "NOUN" }, { a: "Maria", rel: "live_in", b: "Bath", aUpos: "PROPN", bUpos: "PROPN" }, { a: "Maria", rel: "live_in", b: "Ely", aUpos: "PROPN", bUpos: "PROPN" }];
  const r = checkAnswer({ text: "t", readRows: () => [], claimsOf: () => claims, marks, functional: ["live"] });
  assert.equal(r.ignored, 1); assert.equal(r.verdict, "fabricated"); assert.deepEqual(r.fabricated.map((c) => c.b), ["Ely"]);
});
