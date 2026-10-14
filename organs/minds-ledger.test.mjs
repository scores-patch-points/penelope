import _nodeTest from "node:test";
import assert from "node:assert/strict";
import { loadOrSkip, kernelImport } from "./kernel-reach.mjs";

// This subject needs a sibling checkout (organs/kernel-reach.mjs). Absent, its
// tests SKIP with the typed reason named, rather than crash the file.
const { mod: _subject, skip: _skip } = await loadOrSkip(async () => ({
  ...(await import("./notes-ledger.mjs")),
  ...(await import("./minds-ledger.mjs")),
  sourceOfWitness: (await kernelImport("khora", "native/kernel/notes.js")).sourceOfWitness,
  makeNotes: (await kernelImport("khora", "native/kernel/notes.js")).makeNotes,
  idOf: (await kernelImport("khora", "native/kernel/commitments.js")).idOf,
}));
const { openLedger, terrainsOf, defineBy, testBy, concedeBy, assertBy, runDialogue, mindsOf, mindWitness, REFUSALS, sourceOfWitness, makeNotes, idOf } = _subject ?? {};
const test = (name, fn) => _nodeTest(name, { skip: _skip }, fn);

// THE POSITIVE CONTROL (GL-EN-33 law 6): a planted elenchus the loop must reproduce BEFORE any Republic run means anything.
// Book I's shape, as a fixture: a definition falls to a counterexample, its giver concedes, a new definition follows; another
// mind's definition is tested and NOT conceded (aporia); and the four ways a dialogue can be wrong are each refused, typed.
const D1 = ["justice", "telling the truth and paying one's debts"];
const D2 = ["justice", "giving each what is owed"];
const D3 = ["justice", "the advantage of the stronger"];
const D4 = ["justice", "knowledge"];
const N_FOLD = (log) => makeNotes().fold(log);
const id = (m, giver) => (idOf ? idOf({ kind: "same-as", members: m, giver }) : null); // null only when the subject skipped (no sibling)

const TURNS = [
  { speaker: "Cephalus", act: "define", concept: D1[0], definiens: D1[1], at: "pg#b100-160" },
  { speaker: "Socrates", act: "test", target: id(D1, "Cephalus"), counterexample: "to return borrowed weapons to a friend who has gone mad would not be just", at: "pg#b200-290" },
  { speaker: "Cephalus", act: "concede", target: id(D1, "Cephalus"), trigger: "I agree: it is not always just to give back what one owes", at: "pg#b300-360" },
  { speaker: "Cephalus", act: "define", concept: D2[0], definiens: D2[1], at: "pg#b400-450" },
  { speaker: "Socrates", act: "test", target: id(D2, "Cephalus"), counterexample: "a friend who is not good is owed no good, so what is owed cannot be all one's due", at: "pg#b500-580" },
  { speaker: "Cephalus", act: "concede", target: id(D2, "Cephalus"), trigger: "that is so, and I leave the argument to my heir", at: "pg#b600-660" },
  { speaker: "Thrasymachus", act: "define", concept: D3[0], definiens: D3[1], at: "pg#b700-760" },
  { speaker: "Socrates", act: "test", target: id(D3, "Thrasymachus"), counterexample: "rulers err about their own advantage, and then the weaker's obedience harms the stronger", at: "pg#b800-890" },
  { speaker: "Socrates", act: "concede", target: id(D3, "Thrasymachus"), trigger: "then I take it back", at: "pg#b900-940" },        // NOT the giver
  { speaker: "Polemarchus", act: "define", concept: D3[0], definiens: D3[1], at: "pg#b950-990" },                      // would replace Thrasymachus' giver
  { speaker: "Thrasymachus", act: "test", target: id(D3, "Thrasymachus"), counterexample: "none", at: "pg#b995-999" },                 // a mind testing its own
  { speaker: "Thrasymachus", act: "assert", subj: "rulers", pred: "never err", obj: "in their craft", at: "pg#b1000-1050" },
  { speaker: "I", act: "define", concept: D4[0], definiens: D4[1], at: "pg#b1100-1130" },                              // "I" is not "Socrates"
];

const run = () => runDialogue(openLedger({ question: "What is justice?" }), TURNS);

test("the planted elenchus is reproduced: definitions fall to another mind's counterexample and are conceded by their giver alone", () => {
  const out = run();
  const eps = out.episodes;
  assert.deepEqual(eps.map((e) => e.giver), ["cephalus", "cephalus", "thrasymachus", "polemarchus", "i"]);
  assert.equal(eps[0].definition, id(D1, "Cephalus"));
  assert.ok(eps[0].closed && eps[0].closed.by === "cephalus");
  assert.ok(eps[1].closed && eps[1].closed.by === "cephalus");
  assert.equal(eps[0].stop.verdict, "resolved", "a definition that fell and was conceded resolves");
  assert.equal(eps[1].stop.verdict, "resolved");
  assert.equal(eps[2].stop.verdict, "open_at_end", "an aporia is open, never a verdict");
  assert.equal(eps[3].stop.verdict, "open_at_end");
  assert.equal(eps[4].stop.verdict, "open_at_end");
});

test("the recursion is real: a concession is followed by the next DEF, which points back at what it replaces", () => {
  const eps = run().episodes;
  assert.equal(eps[1].replaces, id(D1, "Cephalus"));
  assert.equal(eps[0].replaces, null);
  const out = run();
  const d2 = out.log.entries.find((e) => e.task_id === id(D2, "Cephalus") && e.commitment);
  assert.match(String(d2.because), /replaces commit:same-as/);
});

test("it is not read-all: the unresolved count rises and falls with the contest, round by round", () => {
  const rounds = run().episodes[0].rounds.map((r) => r.total);
  assert.deepEqual(rounds, [1, 2, 0], "define: 1 open; the counterexample adds a live contest; the concession clears both");
  assert.ok(rounds.some((x, i) => i > 0 && x > rounds[i - 1]), "a finding of one round fed the next (the count went UP before it came down)");
});

test("only the giver concedes; a mind never tests its own; a second mind GETS ITS OWN commitment and never replaces the first's", () => {
  const out = run();
  const types = out.refusals.map((r) => r.type);
  assert.ok(types.includes(REFUSALS.NOT_THE_GIVER));
  assert.ok(types.includes(REFUSALS.SELF_TEST));
  assert.ok(!types.includes("giver_collision"), "the kernel's id carries the giver: there is no collision to refuse");
  const m = mindsOf(out.log);
  assert.deepEqual(m.thrasymachus.refused, [id(D3, "Thrasymachus")], "D3 is still Thrasymachus's, refused, unconceded");
  assert.deepEqual(m.polemarchus.defined, [id(D3, "Polemarchus")], "Polemarchus put the same words forward and holds them as his own");
  assert.notEqual(id(D3, "Polemarchus"), id(D3, "Thrasymachus"));
  assert.deepEqual(m.polemarchus.refused, [], "another mind's counterexample to Thrasymachus does not touch Polemarchus's commitment");
});

test("a shared heard link note is taken back only when no other mind still stands on it", () => {
  const log0 = openLedger({ question: "What is justice?" });
  const a = defineBy(log0, { speaker: "Thrasymachus", concept: D3[0], definiens: D3[1], at: "pg#b700-760" });
  const b = defineBy(a.log, { speaker: "Polemarchus", concept: D3[0], definiens: D3[1], at: "pg#b950-990" });
  const c = concedeBy(b.log, { speaker: "Thrasymachus", target: a.id, trigger: "I withdraw it", at: "pg#b1000-1010" });
  const link = (log) => N_FOLD(log).find((n) => String(n.end1).toLowerCase() === D3[0] && String(n.end2).toLowerCase() === D3[1]);
  assert.ok(link(c.log) && !link(c.log).conceded, "Polemarchus still stands on the heard link: it is not withdrawn");
  const d = concedeBy(c.log, { speaker: "Polemarchus", target: b.id, trigger: "and so do I", at: "pg#b1020-1030" });
  assert.ok(!link(d.log) || link(d.log).conceded, "the last mind to stand on it takes it back");
});

test("a concession is a REC, never a deletion: the trigger is verbatim, and the definition and its note stay on the log", () => {
  const out = run();
  const e = out.log.entries.find((x) => x.concedes === id(D1, "Cephalus"));
  assert.match(e.trigger, /cephalus at pg#b300-360: I agree: it is not always just/);
  assert.ok(out.log.entries.some((x) => x.task_id === id(D1, "Cephalus") && x.commitment), "the DEF is still there");
  assert.ok(out.log.entries.some((x) => x.operator === "REC" && String(x.concedes).includes("justice|is|telling the truth")), "the note was conceded too");
  const m = mindsOf(out.log);
  assert.deepEqual(m.cephalus.conceded, [id(D1, "Cephalus"), id(D2, "Cephalus")]);
  // append-only: every prefix of the walk is a prefix of the whole
  const whole = out.log.entries.map((x) => x.seq);
  assert.deepEqual(whole, [...whole].sort((a, b) => a - b));
});

test("speakers are surfaces, never merged: 'I' and 'Socrates' are two minds, and a mind is one source however often it speaks", () => {
  const out = run();
  const m = mindsOf(out.log);
  assert.ok(m.i && m.socrates);
  assert.deepEqual(m.i.defined, [id(D4, "I")]);
  assert.equal(m.socrates.defined.length, 0);
  assert.equal(m.socrates.tested.length >= 2, true);
  assert.equal(sourceOfWitness(mindWitness("Socrates", "pg#b200-290")), sourceOfWitness(mindWitness("Socrates", "pg#b800-890")));
  assert.notEqual(sourceOfWitness(mindWitness("I", "pg#b1-2")), sourceOfWitness(mindWitness("Socrates", "pg#b1-2")));
});

test("the contest is the kernel's: the counterexample lands CON · Figure against the link, the denying source is the tester", () => {
  const out = run();
  const con = out.log.entries.filter((e) => e.operator === "CON" && e.disputes);
  assert.ok(con.length >= 3);
  assert.deepEqual([...new Set(con.map((e) => e.source))].sort(), ["socrates"]);
  assert.ok(con.every((e) => typeof e.because === "string" && e.because.length > 10), "the deciding words are on the record");
});

test("the registers: DEF/EVA/REC land in Lens, the denials in Link, the heard definitions in Entity, the frame in Atmosphere", () => {
  const t = terrainsOf(run().log);
  assert.ok(t.registers.Lens.operators.DEF && t.registers.Lens.operators.EVA && t.registers.Lens.operators.REC);
  assert.ok(t.registers.Link.count > 0 && t.registers.Entity.count > 0 && t.registers.Atmosphere.count > 0);
  assert.equal(t.unstamped.length, 0);
});

test("direct doors: define/test/concede return the same typed refusals, with the log untouched", () => {
  const log = openLedger({});
  const a = defineBy(log, { speaker: "Cephalus", concept: D1[0], definiens: D1[1], at: "x#1-2" });
  assert.ok(a.id);
  const before = a.log.entries.length;
  const t = testBy(a.log, { tester: "Cephalus", target: a.id, counterexample: "mine", at: "x#3-4" });
  assert.equal(t.refused.type, REFUSALS.SELF_TEST);
  assert.equal(t.log.entries.length, before);
  const c = concedeBy(a.log, { speaker: "Socrates", target: a.id, trigger: "x", at: "x#5-6" });
  assert.equal(c.refused.type, REFUSALS.NOT_THE_GIVER);
  assert.equal(c.refused.giver, "Cephalus", "the kernel keeps the giver as declared");
  assert.equal(assertBy(a.log, { speaker: "", subj: "a", pred: "b", obj: "c", at: "x#7-8" }).refused.type, REFUSALS.NO_WORDS);
});
