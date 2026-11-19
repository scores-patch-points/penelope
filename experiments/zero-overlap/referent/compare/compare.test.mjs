// node --test compare.test.mjs   (needs khora and its priors; reads each statement's paragraph through khora's one door)
import { test } from "node:test";
import assert from "node:assert/strict";
import { compareStatements, reopen, sha, canon, sameName } from "./compare.mjs";

const doc = (id, text) => ({ id, text });
const stmt = (d, snippet) => { const i = d.text.indexOf(snippet); assert.ok(i >= 0, `snippet not in doc: ${snippet}`); return { doc: d, span: [i, i + snippet.length] }; };
const base = { language: "eng", by: "test-asker", at: "tag:t0", acyclic: ["defeat"], functional: [], containers: {}, grain: "fine" };
const Q = (concerns = ["defeat"]) => ({ about: "Marshall Bell", concerns });
const S1 = "Marshall Bell defeated Arthur Greene at the siege in 1912.";
const dA = doc("docA", `Chapter notes.\nThe war began early in the year. ${S1}\nLater events followed.`);
const run = (bText, o = {}) => compareStatements({ A: stmt(dA, S1), B: stmt(doc("docB", bText), o.snip ?? bText.split("\n").pop()), question: o.q ?? Q(), declare: { ...base, ...(o.declare ?? {}) } });

test("a restatement in another document, nested in other text, is Same", async () => {
  const r = await run(`An unrelated heading.\n${S1}`, { snip: S1 });
  assert.equal(r.verdict, "Same"); assert.ok(r.differences.some((d) => d.kind === "AGREE" && d.strong));
  assert.equal(r.trail.A.reopens && r.trail.B.reopens, true);
});
test("a denial of the same relation between the same bound referents is Other, with its witnesses", async () => {
  const r = await run("Marshall Bell did not defeat Arthur Greene at the siege.");
  assert.equal(r.verdict, "Other"); const c = r.differences.find((d) => d.kind === "CONFLICT"); assert.ok(c); assert.match(c.why, /opposite polarity/);
});
test("swapped roles are a Conflict only where the relation is declared asymmetric", async () => {
  const sw = "Arthur Greene defeated Marshall Bell at the siege.";
  assert.equal((await run(sw)).verdict, "Other");
  const r = await run(sw, { declare: { acyclic: [] } }); assert.notEqual(r.verdict, "Other"); assert.ok(r.differences.some((d) => d.kind === "HOLE" && /not declared asymmetric/.test(d.why)));
});
test("silence on the question's concern is a hole: Hold, with what would settle it", async () => {
  const r = await run("Marshall Bell was born in Ohio.");
  assert.equal(r.verdict, "Hold"); assert.ok(r.hunger.length > 0); assert.ok(r.hunger.some((h) => /defeat/.test(h)));
});
test("a different object of a relation not declared one-valued is not a conflict", async () => {
  const r = await run("Marshall Bell defeated John Brown at the siege.");
  assert.notEqual(r.verdict, "Other"); assert.ok(r.differences.some((d) => d.kind === "HOLE" && /different events/.test(d.why)));
});
test("a claim about someone else says nothing about the referent: Hold", async () => {
  const r = await run("The general defeated Arthur Greene at the siege.");
  assert.equal(r.verdict, "Hold");
});
test("a resolution difference narrows and never convicts: Same at the coarse grain, Hold at the fine grain", async () => {
  const a = "Marshall Bell governed Topeka after the war.", b = "Marshall Bell governed Kansas after the war.";
  const mk = (grain) => compareStatements({ A: stmt(doc("dA", a), a), B: stmt(doc("dB", b), b), question: Q(["govern"]), declare: { ...base, grain, containers: { Topeka: "Kansas" } } });
  const coarse = await mk("coarse"), fine = await mk("fine");
  assert.equal(coarse.verdict, "Same"); assert.equal(fine.verdict, "Hold"); assert.ok(fine.differences.some((d) => d.kind === "RESOLUTION" && d.grain === "fine"));
  assert.notEqual(coarse.verdict, "Other"); assert.notEqual(fine.verdict, "Other");
});
test("a read whose declared language is not the heard language is refused, not degraded", async () => {
  const fr = "Le premier brigadier a été formé en 1912 pour une mission à Cuba, et elle a été dissoute en 1950 après cinq brèves activations.";
  const r = await run(fr, { snip: fr }); assert.equal(r.verdict, "refused"); assert.equal(r.reason, "language_mismatch");
});
test("nothing is defaulted: by, at and language must be declared", async () => {
  const r = await compareStatements({ A: stmt(dA, S1), B: stmt(dA, S1), question: Q(), declare: { language: "eng" } }); assert.equal(r.verdict, "refused"); assert.equal(r.reason, "not_declared");
  assert.equal((await compareStatements({ A: stmt(dA, S1), B: stmt(dA, S1), declare: base })).reason, "no_question");
});
test("the trail re-opens to the exact bytes and refuses on drift", async () => {
  const r = await run(`Heading.\n${S1}`, { snip: S1 }); const t = r.trail.A;
  assert.equal(reopen(dA.text, t.addr).text, S1);
  assert.equal(reopen(dA.text.replace("Chapter", "Chapters"), t.addr).ok, false);
  const bad = { ...t.addr, sha256: sha("x") }; assert.equal(reopen(dA.text, bad).ok, false);
});
test("the verdict entry has the pharos shape and its id recomputes", async () => {
  const r = await run(`Heading.\n${S1}`, { snip: S1 }); const { id, ...rest } = r.entry;
  assert.equal(id, sha(canon(rest))); for (const k of ["cell", "kind", "addr", "body", "of", "basis", "by", "at"]) assert.ok(k in r.entry, k);
  assert.equal(r.entry.cell, "EVA·Figure"); assert.equal(r.entry.by, "test-asker");
});
test("names: the accidental set folds forms and spacing but keeps case; an alias is a token subset", () => {
  assert.equal(sameName("Marshall  Bell", "Marshall Bell"), true); assert.equal(sameName("Bell", "Marshall Bell"), true);
  assert.equal(sameName("marshall bell", "Marshall Bell"), false); assert.equal(sameName("u:1:0:general", "General"), false);
});
test("an agreement between unsaturated claims (a role missing) is not strong evidence: Hold, never Same", async () => {
  const a = "Marshall Bell fought bravely.", b = "Marshall Bell fought bravely.";
  const r = await compareStatements({ A: stmt(doc("dA", a), a), B: stmt(doc("dB", b), b), question: Q(["fight"]), declare: base });
  assert.equal(r.verdict, "Hold"); assert.ok(r.differences.some((d) => d.kind === "AGREE" && d.strong === false));
});
