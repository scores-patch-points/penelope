// anaphor-commit.test.mjs — committing a pronoun: exactly one survivor commits; several or none hold; activation never decides; each elimination rule is declared and checkable.
// The organ is loaded through $ANAPHOR_ORGAN when set, so gym/anaphor-mutants.mjs can run this very file against a broken copy and watch it fail.
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const A = await import(pathToFileURL(process.env.ANAPHOR_ORGAN ?? path.join(HERE, "anaphor-commit.mjs")).href);
const { decide, parseFeats, depBase, bodyOf } = A;

// ---- fixtures: sentences as token lists; offsets are computed, so spans point at the tokens --------------------------------------------
// tok(form, upos, head, deprel, feats): head is the 1-based id of the head in its sentence (0 = root)
const tok = (form, upos, head, deprel, feats = "_") => ({ form, upos, head, deprel, feats });
function reading(sentences) {
  const rows = []; let off = 0; const at = [];
  sentences.forEach((toks, s) => toks.forEach((t, i) => { rows.push({ s, id: i + 1, form: t.form, lemma: t.form.toLowerCase(), upos: t.upos, feats: t.feats, head: t.head, deprel: t.deprel, at: off, end: off + t.form.length }); at.push([off, off + t.form.length]); off += t.form.length + 1; }));
  const span = (s, id) => { const r = rows.find((x) => x.s === s && x.id === id); return [r.at, r.end]; };
  return { rows, span };
}
const HE = "Case=Nom|Gender=Masc|Number=Sing|Person=3|PronType=Prs", HIM = "Case=Acc|Gender=Masc|Number=Sing|Person=3|PronType=Prs", SHE = "Case=Nom|Gender=Fem|Number=Sing|Person=3|PronType=Prs";
const spec = (pronoun, at, cands, bound = null) => ({ pronoun, at, cands, bound });
const ref = (r, spans, pronouns = []) => ({ ref: r, face: r.slice(4), spans, pronouns });

// "Bell defeated him. Greene fled."  him (obj of defeated, s0 id3) is not Bell (nsubj of the same predicate); Greene is another sentence's subject
function bellGreene(extra = {}) {
  const R = reading([[tok("Bell", "PROPN", 2, "nsubj"), tok("defeated", "VERB", 0, "root"), tok("him", "PRON", 2, "obj", HIM), tok(".", "PUNCT", 2, "punct")], [tok("Greene", "PROPN", 2, "nsubj"), tok("fled", "VERB", 0, "root"), tok(".", "PUNCT", 2, "punct")]]);
  const referents = [ref("r:bell", [R.span(0, 1)]), ref("r:greene", [R.span(1, 1)])];
  return { R, referents, held: [spec("him", R.span(0, 3), [["r:bell", 3], ["r:greene", 0.1]])], ...extra };
}
const one = (d) => d.pronouns[0];
const run = (o) => decide({ faces: {}, evidence: [], ...o, rows: o.rows ?? o.R?.rows });

test("exactly one survivor commits: the same-predicate subject is not what 'him' means", () => {
  const f = bellGreene(), p = one(run(f));
  assert.equal(p.verdict, "committed"); assert.equal(p.defined, "r:greene"); assert.deepEqual(p.survivors, ["r:greene"]);
  assert.equal(p.eliminated.length, 1); assert.equal(p.eliminated[0].ref, "r:bell"); assert.match(p.eliminated[0].why, /^disjoint-reference/);
});

test("the rule is read across sentences by sentence AND head: a subject of another sentence's verb with the same token id is not a co-argument", () => {
  const p = one(run(bellGreene())); assert.deepEqual(p.survivors, ["r:greene"]);          // Greene is nsubj of head 2 in sentence 1; the pronoun's head is 2 in sentence 0
});

test("several survive: held, and the survivors are named; activation alone never commits", () => {
  const f = bellGreene(); f.held = [spec("him", f.R.span(0, 3), [["r:greene", 99], ["r:other", 0.0001]])]; f.referents.push(ref("r:other", []));
  const p = one(run(f)); assert.equal(p.verdict, "held"); assert.equal(p.defined, null); assert.deepEqual(p.survivors, ["r:greene", "r:other"]); assert.match(p.rule, /activation is not evidence/);
});

test("a single candidate with a huge activation and nothing against it is still only a survivor of a spectrum that has been read; two with one far ahead stay held", () => {
  const f = bellGreene(); f.held = [spec("him", f.R.span(0, 3), [["r:greene", 1e9], ["r:x", 1e-9]])]; f.referents.push(ref("r:x", []));
  assert.equal(one(run(f)).verdict, "held");
});

test("none survive: held, never a silent drop, and every elimination says why", () => {
  const f = bellGreene(); f.held = [spec("him", f.R.span(0, 3), [["r:bell", 3]])];
  const p = one(run(f)); assert.equal(p.verdict, "held"); assert.deepEqual(p.survivors, []); assert.equal(p.eliminated.length, 1); assert.match(p.rule, /every candidate was eliminated/);
});

test("an empty spectrum is NEW (the anaphor introduces something), not held and not committed", () => {
  const f = bellGreene(); f.held = [spec("him", f.R.span(0, 3), [])]; const p = one(run(f)); assert.equal(p.verdict, "new"); assert.equal(p.defined, null);
});

test("gender clash: a referent the reading calls both he-class and she-class is contradicted and offered to no one", () => {
  // "Ann met Bob. He fled. She fled. He left." : r:ann called he at one place and she at another
  const R = reading([[tok("Ann", "PROPN", 2, "nsubj"), tok("met", "VERB", 0, "root"), tok("Bob", "PROPN", 2, "obj")], [tok("He", "PRON", 2, "nsubj", HE), tok("fled", "VERB", 0, "root")], [tok("She", "PRON", 2, "nsubj", SHE), tok("fled", "VERB", 0, "root")], [tok("He", "PRON", 2, "nsubj", HE), tok("left", "VERB", 0, "root")]]);
  const referents = [ref("r:ann", [R.span(0, 1)], [R.span(1, 1), R.span(2, 1)]), ref("r:bob", [R.span(0, 3)])];
  const held = [spec("He", R.span(1, 1), [["r:ann", 2], ["r:bob", 1]], "r:ann"), spec("She", R.span(2, 1), [["r:ann", 2], ["r:bob", 1]], "r:ann"), spec("He", R.span(3, 1), [["r:ann", 2], ["r:bob", 1]], null)];
  const d = run({ R, referents, held }), p = d.pronouns[2];
  assert.equal(p.verdict, "committed"); assert.equal(p.defined, "r:bob"); assert.match(p.eliminated[0].why, /^gender-clash/);
});

test("gender clash also reads a binding that is only in held.bound (not in referents.pronouns); one gender alone is NOT a clash", () => {
  const R = reading([[tok("Ann", "PROPN", 2, "nsubj"), tok("met", "VERB", 0, "root"), tok("Bob", "PROPN", 2, "obj")], [tok("He", "PRON", 2, "nsubj", HE), tok("fled", "VERB", 0, "root")], [tok("She", "PRON", 2, "nsubj", SHE), tok("fled", "VERB", 0, "root")], [tok("He", "PRON", 2, "nsubj", HE), tok("left", "VERB", 0, "root")]]);
  const referents = [ref("r:ann", [R.span(0, 1)]), ref("r:bob", [R.span(0, 3)])];
  const mk = (b1, b2) => [spec("He", R.span(1, 1), [["r:ann", 2], ["r:bob", 1]], b1), spec("She", R.span(2, 1), [["r:ann", 2], ["r:bob", 1]], b2), spec("He", R.span(3, 1), [["r:ann", 2], ["r:bob", 1]], null)];
  assert.equal(run({ R, referents, held: mk("r:ann", "r:ann") }).pronouns[2].defined, "r:bob");
  const only = run({ R, referents, held: mk("r:ann", null) }).pronouns[2]; assert.equal(only.verdict, "held"); assert.deepEqual(only.eliminated, []);
});

test("a gender clash is only used for a he-class or she-class pronoun: for 'it' nothing is removed by it", () => {
  const R = reading([[tok("Ann", "PROPN", 2, "nsubj"), tok("met", "VERB", 0, "root"), tok("Bob", "PROPN", 2, "obj")], [tok("He", "PRON", 2, "nsubj", HE), tok("fled", "VERB", 0, "root")], [tok("She", "PRON", 2, "nsubj", SHE), tok("fled", "VERB", 0, "root")], [tok("It", "PRON", 2, "nsubj", "Gender=Neut|Number=Sing|Person=3|PronType=Prs"), tok("left", "VERB", 0, "root")]]);
  const referents = [ref("r:ann", [R.span(0, 1)], [R.span(1, 1), R.span(2, 1)]), ref("r:bob", [R.span(0, 3)])];
  const p = run({ R, referents, held: [spec("It", R.span(3, 1), [["r:ann", 2], ["r:bob", 1]])] }).pronouns[0];
  assert.equal(p.verdict, "held"); assert.deepEqual(p.eliminated, []); assert.ok(p.gaps.includes("pronoun_not_he_or_she"));
});

test("non-nominal: a referent that is only ever a modifier is not a he/she; a referent with NO mention rows is unknown, not eliminated", () => {
  const R = reading([[tok("Korean", "ADJ", 2, "amod"), tok("forces", "NOUN", 3, "nsubj"), tok("fled", "VERB", 0, "root"), tok("Lee", "PROPN", 3, "nsubj")], [tok("He", "PRON", 2, "nsubj", HE), tok("left", "VERB", 0, "root")]]);
  const referents = [ref("r:korean", [R.span(0, 1)]), ref("r:lee", [R.span(0, 4)]), ref("r:ghost", [])];
  const p = run({ R, referents, held: [spec("He", R.span(1, 1), [["r:korean", 3], ["r:lee", 1], ["r:ghost", 0.5]])] }).pronouns[0];
  assert.deepEqual(p.eliminated.map((e) => e.ref), ["r:korean"]); assert.match(p.eliminated[0].why, /^non-nominal/); assert.deepEqual(p.survivors, ["r:lee", "r:ghost"]);
});

test("disjoint reference needs the same predicate: a subject of another verb stays a candidate (embedded clause)", () => {
  // "Bell said he fled."  he = nsubj of fled; Bell = nsubj of said
  const R = reading([[tok("Bell", "PROPN", 2, "nsubj"), tok("said", "VERB", 0, "root"), tok("he", "PRON", 4, "nsubj", HE), tok("fled", "VERB", 2, "ccomp")]]);
  const referents = [ref("r:bell", [R.span(0, 1)]), ref("r:greene", [])];
  const p = run({ R, referents, held: [spec("he", R.span(0, 3), [["r:bell", 3], ["r:greene", 1]])] }).pronouns[0];
  assert.deepEqual(p.eliminated, []); assert.equal(p.verdict, "held");
});

test("adjuncts, possessives and reflexives are not covered by disjointness; a near-miss deprel or feature is not a match", () => {
  const body = (pronTok) => reading([[tok("Bell", "PROPN", 2, "nsubj"), tok("sat", "VERB", 0, "root"), pronTok]]);
  const check = (pronTok, label) => { const R = body(pronTok), p = run({ R, referents: [ref("r:bell", [R.span(0, 1)]), ref("r:x", [])], held: [spec("him", R.span(0, 3), [["r:bell", 3], ["r:x", 1]])] }).pronouns[0]; assert.deepEqual(p.eliminated.map((e) => e.ref).filter((r) => r === "r:bell"), [], label); };
  check(tok("him", "PRON", 2, "obl", HIM), "an oblique (adjunct) pronoun may corefer");
  check(tok("his", "PRON", 2, "obj", `${HIM}|Poss=Yes`), "a possessive may corefer");
  check(tok("himself", "PRON", 2, "obj", `${HIM}|Reflex=Yes`), "a reflexive is not a disjoint case");
  check(tok("him", "PRON", 2, "nsubjx", HIM), "a label that only starts like nsubj is not nsubj");
  check(tok("him", "PRON", 2, "object", HIM), "'object' is not 'obj'");
});

test("near-miss values do not match: the pronoun's Gender=Masculine is not Masc, Reflex=Yesx is not Yes, 'nsubj:pass' IS nsubj (base before the first colon)", () => {
  assert.equal(depBase("nsubj:pass"), "nsubj"); assert.equal(depBase("nsubjx"), "nsubjx"); assert.equal(parseFeats("A=B=C|D").get("A"), "B=C"); assert.equal(parseFeats("A=B|C=D").get("C"), "D"); assert.equal(parseFeats("_").size, 0);
  const R = reading([[tok("Bell", "PROPN", 2, "nsubj"), tok("saw", "VERB", 0, "root"), tok("him", "PRON", 2, "obj", "Case=Acc|Gender=Masculine|Person=3")], [tok("Korean", "ADJ", 2, "amod"), tok("fled", "VERB", 0, "root")]]);
  const referents = [ref("r:korean", [R.span(1, 1)]), ref("r:bell", [R.span(0, 1)])];
  const p = run({ R, referents, held: [spec("him", R.span(0, 3), [["r:korean", 1], ["r:bell", 1]])] }).pronouns[0];
  assert.deepEqual(p.eliminated.map((e) => e.ref), ["r:bell"]);                                   // Masculine is no gender class, so the non-nominal rule is NOT run on r:korean; disjointness still is
  const R3 = reading([[tok("Bell", "PROPN", 2, "nsubj"), tok("saw", "VERB", 0, "root"), tok("him", "PRON", 2, "obj", `${HIM}|Poss=Yesx|Reflex=yes`)]]);
  assert.deepEqual(run({ R: R3, referents: [ref("r:bell", [R3.span(0, 1)]), ref("r:x", [])], held: [spec("him", R3.span(0, 3), [["r:bell", 1], ["r:x", 1]])] }).pronouns[0].eliminated.map((e) => e.ref), ["r:bell"]);   // Poss=Yesx and Reflex=yes are not Poss=Yes / Reflex=Yes
  const R2 = reading([[tok("Bell", "PROPN", 2, "nsubj:pass"), tok("seen", "VERB", 0, "root"), tok("him", "PRON", 2, "obj", HIM)]]);
  assert.deepEqual(run({ R: R2, referents: [ref("r:bell", [R2.span(0, 1)]), ref("r:x", [])], held: [spec("him", R2.span(0, 3), [["r:bell", 1], ["r:x", 1]])] }).pronouns[0].eliminated.map((e) => e.ref), ["r:bell"]);
});

test("coordination is followed up: 'Bell and Greene saw him' removes both", () => {
  const R = reading([[tok("Bell", "PROPN", 3, "nsubj"), tok("and", "CCONJ", 4, "cc"), tok("Greene", "PROPN", 1, "conj"), tok("saw", "VERB", 0, "root"), tok("him", "PRON", 4, "obj", HIM)]]);
  // ids: Bell1 and2 Greene3 saw4 him5; Bell's head must be saw(4): fix the heads
  R.rows[0].head = 4; R.rows[1].head = 3; R.rows[2].head = 1;
  const p = run({ R, referents: [ref("r:bell", [R.span(0, 1)]), ref("r:greene", [R.span(0, 3)]), ref("r:z", [])], held: [spec("him", R.span(0, 5), [["r:bell", 1], ["r:greene", 1], ["r:z", 1]])] }).pronouns[0];
  assert.deepEqual(p.eliminated.map((e) => e.ref).sort(), ["r:bell", "r:greene"]); assert.equal(p.defined, "r:z");
});

// ---- janus's binding evidence --------------------------------------------------------------------------------------------------------
const binding = (id, at, cands, extra = {}) => ({ id, kind: "binding", body: { by: "janus.binding", doc: "text:x", window: 3, anaphor: { kind: "pronoun", s: 0, id: 3, form: "him", at: at[0], end: at[1], role: "obj", ...extra }, candidates: cands.map(([being, gender, clauseMate, role = "nsubj"]) => ({ ref: { being }, direction: "before", sentences: 0, chars: 1, role, agreement: { number: "unknown", gender, person: "unknown" }, clauseMate })), holes: [] } });

test("binding evidence: gender 'mismatch' eliminates; 'unknown' never does (all unknown: nothing eliminated)", () => {
  const f = bellGreene(); f.referents = [ref("r:bell", []), ref("r:greene", [])];                    // no mention rows: the rows rules cannot fire, only the evidence can
  const at = f.R.span(0, 3);
  const mism = run({ ...f, evidence: [binding("b1", at, [["r:bell", "mismatch", null], ["r:greene", "unknown", null]])] }).pronouns[0];
  assert.equal(mism.verdict, "committed"); assert.equal(mism.defined, "r:greene"); assert.match(mism.eliminated[0].why, /janus binding b1/);
  const unk = run({ ...f, evidence: [binding("b2", at, [["r:bell", "unknown", null], ["r:greene", "unknown", null]])] }).pronouns[0];
  assert.deepEqual(unk.eliminated, []); assert.equal(unk.verdict, "held");
  const mat = run({ ...f, evidence: [binding("b3", at, [["r:bell", "match", null], ["r:greene", "match", null]])] }).pronouns[0]; assert.deepEqual(mat.eliminated, []);
});

test("binding clauseMate: true with a core role eliminates; false is trusted over the rows; null falls back to the rows; true with a non-core role does not", () => {
  const f = bellGreene(), at = f.R.span(0, 3);
  const bare = { ...f, referents: [ref("r:bell", []), ref("r:greene", [])] };                       // rows say nothing about the candidates
  const t = run({ ...bare, evidence: [binding("b1", at, [["r:bell", "unknown", true, "nsubj"], ["r:greene", "unknown", false]])] }).pronouns[0]; assert.equal(t.defined, "r:greene"); assert.match(t.eliminated[0].why, /disjoint-reference: janus binding b1/);
  const nc = run({ ...bare, evidence: [binding("b2", at, [["r:bell", "unknown", true, "obl"], ["r:greene", "unknown", false]])] }).pronouns[0]; assert.deepEqual(nc.eliminated, []);
  const fl = run({ ...f, evidence: [binding("b3", at, [["r:bell", "unknown", false], ["r:greene", "unknown", false]])] }).pronouns[0]; assert.deepEqual(fl.eliminated, []);   // the rows would remove Bell; janus said not clause mates and is trusted
  const nu = run({ ...f, evidence: [binding("b4", at, [["r:bell", "unknown", null], ["r:greene", "unknown", null]])] }).pronouns[0]; assert.deepEqual(nu.eliminated.map((e) => e.ref), ["r:bell"]);
});

test("evidence of a kind she has no adapter for is a typed gap, never read and never silent; no evidence at all is a typed gap too", () => {
  const f = bellGreene();
  const d = run({ ...f, evidence: [{ id: "c1", kind: "claim", body: { rel: "instance-of" } }] });
  assert.ok(d.gaps.some((g) => g.why === "no_adapter" && g.kind === "claim")); assert.deepEqual(d.evidenceRead, []);
  assert.ok(run(f).gaps.some((g) => g.why === "no_evidence_read"));
  const bad = run({ ...f, evidence: [{ id: "b9", kind: "binding", body: { nope: 1 } }] }); assert.ok(bad.gaps.some((g) => g.why === "unreadable"));
});

test("typed gaps: no spectrum decides nothing; no rows holds every pronoun and says so; a pronoun with no row is held with its gap", () => {
  const f = bellGreene();
  const ns = decide({ held: null, rows: f.R.rows, referents: f.referents }); assert.deepEqual(ns.pronouns, []); assert.ok(ns.gaps.some((g) => g.why === "no_spectrum"));
  const es = decide({ held: [], rows: f.R.rows, referents: f.referents }); assert.ok(es.gaps.some((g) => g.why === "no_spectrum"));
  for (const rows of [null, []]) { const nr = decide({ held: f.held, rows, referents: f.referents }); assert.equal(nr.pronouns[0].verdict, "held"); assert.ok(nr.gaps.some((g) => g.why === "no_rows")); assert.deepEqual(nr.pronouns[0].survivors, ["r:bell", "r:greene"]); assert.deepEqual(nr.pronouns[0].gaps, ["no_rows"]); assert.equal(nr.pronouns[0].rule, "gap:no_rows"); }
  const nrow = decide({ held: [spec("him", [900, 903], [["r:bell", 1]])], rows: f.R.rows, referents: f.referents }); assert.equal(nrow.pronouns[0].verdict, "held"); assert.deepEqual(nrow.pronouns[0].gaps, ["no_row_for_pronoun"]);
});

test("the body keeps the spectrum as read (top by activation, shown only), the survivors and every elimination; the face is the defined referent's", () => {
  const f = bellGreene(), d = run({ ...f, faces: { "r:greene": "Greene" } }), b = bodyOf(d.pronouns[0], { referents: "e1" });
  assert.equal(b.verdict, "committed"); assert.equal(b.defined, "r:greene"); assert.equal(b.face, "Greene"); assert.deepEqual(b.held.shown[0], ["r:bell", 3]); assert.equal(b.held.of_total, 2); assert.equal(b.held.shown.length, 2);
  assert.deepEqual(b.survivors, ["r:greene"]); assert.equal(b.eliminated[0].ref, "r:bell"); assert.deepEqual(b.read, { referents: "e1" });
});

test("gender clash from referents.pronouns alone (held.bound all null) is read too", () => {
  const R = reading([[tok("Ann", "PROPN", 2, "nsubj"), tok("met", "VERB", 0, "root"), tok("Bob", "PROPN", 2, "obj")], [tok("He", "PRON", 2, "nsubj", HE), tok("fled", "VERB", 0, "root")], [tok("She", "PRON", 2, "nsubj", SHE), tok("fled", "VERB", 0, "root")], [tok("He", "PRON", 2, "nsubj", HE), tok("left", "VERB", 0, "root")]]);
  const referents = [ref("r:ann", [R.span(0, 1)], [R.span(1, 1), R.span(2, 1)]), ref("r:bob", [R.span(0, 3)])];
  const p = run({ R, referents, held: [spec("He", R.span(3, 1), [["r:ann", 2], ["r:bob", 1]], null)] }).pronouns[0];
  assert.equal(p.defined, "r:bob"); assert.match(p.eliminated[0].why, /gender-clash/);
});
