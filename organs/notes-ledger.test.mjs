import _nodeTest from "node:test";
import assert from "node:assert/strict";
import { loadOrSkip } from "./kernel-reach.mjs";

// This subject needs a sibling checkout (organs/kernel-reach.mjs). Absent, its
// tests SKIP with the typed reason named, rather than crash the file.
const { mod: _subject, skip: _skip } = await loadOrSkip(() => import("./notes-ledger.mjs"));
const { openLedger, landContent, landTurns, runLoop, evaluateAsk, terrainsOf, recordTerrains, TERRAINS, GIVER } = _subject ?? {};
const test = (name, fn) => _nodeTest(name, { skip: _skip }, fn);

let n = 0;
const sp = (src, [subj, pred, obj, polarity = "+", activation = 1], text = null) => {
  const i = n++;
  return { id: `s${i}`, address: `px_${src}/text@h#b${i * 100}-${i * 100 + 60}`, text: text ?? `${subj} ${polarity === "-" ? "did not " : ""}${pred} ${obj}.`, claim: { subj, pred, obj, polarity }, activation };
};
const region = () => {
  n = 0;
  return [
    sp("a", ["the House", "pass", "the Sunshine Act", "+", 9]),
    sp("a", ["Maria Lopez", "approved", "the freeze", "+", 8]),
    sp("b", ["the Senate", "pass", "the Sunshine Act", "+", 6]),
    sp("b", ["Daniel Reyes", "opposed", "the fare increase", "+", 5]),
    sp("c", ["the House", "pass", "the Sunshine Act", "-", 4], "The House did not pass the Sunshine Act."),
    sp("c", ["Anna Cole", "chairs", "the committee", "+", 3]),
  ];
};
const SLOT = { end1: "the House", label: "pass", end2: null };
const opsOf = (log) => new Set(log.entries.map((e) => e.operator));

test("the loop closes: DEF, EVA and REC all land on ONE log, in helix order (nothing judged before it is instantiated)", () => {
  const r = region();
  const log = openLedger({ question: "When did the House pass the Sunshine Act?" });
  const out = runLoop({ log, slot: SLOT, region: r, question: "When did the House pass the Sunshine Act?", askTerms: ["House", "Sunshine"] });
  const ops = opsOf(out.log);
  for (const op of ["DEF", "EVA", "REC"]) assert.ok(ops.has(op), `${op} landed`);
  const first = (op) => out.log.entries.findIndex((e) => e.operator === op);
  assert.ok(first("DEF") < first("INS"), "a void is declared before anything is heard");
  assert.ok(first("INS") < first("EVA"), "an ask is judged only after something was instantiated");
  assert.ok(out.rounds.length >= 1);
  assert.ok(out.log.entries.every((e, i, a) => i === 0 || e.seq > a[i - 1].seq), "append-only, seq-ordered");
});

test("grounded: every heard note stands on addressed spans that name region bytes", () => {
  const r = region();
  const out = runLoop({ log: openLedger({}), slot: SLOT, region: r });
  const addrs = new Set(r.map((s) => s.address));
  const spanAts = out.log.entries.flatMap((e) => (e.spans ?? []).map((s) => s.at));
  assert.ok(spanAts.length > 0);
  assert.ok(spanAts.every((a) => addrs.has(a)), "no note rests on bytes the region does not have");
});

test("the stop is measured: bounded by the sources that exist, with a typed verdict, never a typed repeat count", () => {
  const r = region();
  const out = runLoop({ log: openLedger({}), slot: SLOT, region: r });
  assert.ok(out.rounds.length <= out.sources);
  assert.ok(["resolved", "converged", "diverging", "ceiling", "decaying", "insufficient_history"].includes(out.stop.verdict));
});

test("a void is filled by the door (REC·Ground), and the filling is on the log, not an overwrite", () => {
  const r = region();
  const out = runLoop({ log: openLedger({}), slot: { end1: "the House", label: "pass", end2: null }, region: r });
  const rec = out.log.entries.filter((e) => e.operator === "REC" && e.rezeros);
  assert.ok(rec.length >= 1, "the heard link re-zeroed the void");
  assert.ok(out.log.entries.some((e) => e.void === true), "the declaration is still on the record beside its filling");
});

test("the person at the door: a correction concedes (REC) the note whose bytes it quotes; nothing is deleted", () => {
  const r = region();
  const base = runLoop({ log: openLedger({}), slot: SLOT, region: r });
  const before = base.log.entries.length;
  const t = landTurns(base.log, ["Not so, that's wrong: Maria Lopez approved the freeze."], { region: r });
  assert.equal(t.conceded.length, 1);
  assert.ok(t.log.entries.length > before, "the log only grew");
  assert.ok(t.log.entries.some((e) => e.concedes && /approved/.test(e.concedes)), "the concession names the note");
  assert.ok(t.log.entries.some((e) => /maria lopez\|approved\|the freeze/.test(e.task_id ?? "")), "the conceded note is still on the log");
  // the person's own words are on the ledger as THEIR note
  assert.ok(t.log.entries.some((e) => e.end1 === GIVER && e.label === "corrects"));
});

test("the wall: the person is never a witness of a content note", () => {
  const r = region();
  const base = runLoop({ log: openLedger({}), slot: SLOT, region: r });
  const t = landTurns(base.log, ["Maria Lopez approved the freeze.", "The House passed the Sunshine Act, I think."], { region: r });
  const contentEntries = t.log.entries.filter((e) => e.end1 && e.end1 !== GIVER && Array.isArray(e.witnesses));
  assert.ok(contentEntries.length > 0);
  assert.ok(contentEntries.every((e) => e.witnesses.every((w) => !String(w).startsWith("chat:"))), "no chat witness on a content note");
  assert.ok(t.log.entries.filter((e) => e.end1 === GIVER).every((e) => e.witnesses.every((w) => String(w).startsWith("chat:"))));
});

test("a correction that quotes nothing is unanchored: kept, typed, and it concedes nothing", () => {
  const r = region();
  const base = runLoop({ log: openLedger({}), slot: SLOT, region: r });
  const t = landTurns(base.log, ["Not so, that's wrong."], { region: r });
  assert.equal(t.conceded.length, 0);
  assert.equal(t.unanchored.length, 1);
  assert.ok(t.log.entries.some((e) => e.end1 === GIVER && e.label === "corrects"));
});

const bigRegion = () => {
  n = 0;
  const names = ["alder", "birch", "cedar", "dogwood", "elmwood", "fir", "gorse", "hazel", "ivy", "juniper", "kauri", "larch", "maple", "nettle", "olive", "poplar", "quince", "rowan", "spruce", "teak", "umber", "vetch", "willow", "yarrow", "zinnia", "acorn", "bramble", "clover", "daisy", "fennel"];
  const verbs = ["plants", "prunes", "graft", "waters", "cuts", "marks", "counts", "sorts", "digs", "binds", "stakes", "trims", "weeds", "mulches", "tills", "sows", "reaps", "stores", "ships", "sells", "buys", "tests", "rates", "logs", "maps", "names", "tags", "files", "lists", "ties"];
  const objs = ["meadow", "orchard", "hedgerow", "greenhouse", "terrace", "vineyard", "paddock", "allotment", "thicket", "glade", "grove", "nursery", "bedding", "border", "lawn", "pasture", "copse", "wetland", "moorland", "heath", "garden", "planter", "cloche", "trellis", "arbour", "pergola", "gazebo", "rockery", "fernery", "pond"];
  return names.map((nm, k) => sp(["a", "b", "c", "d", "e"][k % 5], [nm, verbs[k], k < 12 ? "the Sunshine Act" : `the ${objs[k]}`, "+", 30 - k]));
};

test("EVA is a null: an ask that does work on what was heard HOLDS; one that does none is REFUSED and the loop concedes it (REC)", () => {
  const r = bigRegion();
  const good = runLoop({ log: openLedger({}), slot: { end1: "alder", label: "plants", end2: null }, region: r, question: "the Sunshine Act", askTerms: ["Sunshine"] });
  assert.equal(good.evaluation.verdict, "holds", JSON.stringify(good.evaluation.evidence));
  assert.ok(good.evaluation.evidence.observed >= 12);
  assert.equal(good.evaluation.evidence.exceeded, 0);
  const bad = runLoop({ log: openLedger({}), slot: { end1: "alder", label: "plants", end2: null }, region: r, question: "zebra quokka", askTerms: ["zebra", "quokka"] });
  assert.equal(bad.evaluation.verdict, "refused");
  assert.ok(bad.log.entries.some((e) => e.operator === "REC" && e.concedes && String(e.trigger).startsWith("EVA refused")), "the refusal concedes its own commitment");
  assert.ok(bad.log.entries.some((e) => e.commitment === "matters"), "the refused commitment is still on the log");
});

test("EVA at small n is reported at its power, not as a pass: a five-note ledger cannot separate an ask from its redraws", () => {
  const out = runLoop({ log: openLedger({}), slot: SLOT, region: region(), question: "the House", askTerms: ["House", "Sunshine"] });
  assert.ok(out.evaluation.evidence.notes <= 6);
  assert.equal(out.evaluation.verdict, "refused", "a tiny ledger is refused, never waved through");
});

test("characterization: with the received priors 'No, that's wrong.' is an ASSERTION (the received negation class has no 'no'); 'Not so, ...' is the correction", () => {
  const r = region();
  const a = landTurns(openLedger({}), ["No, that's wrong."], { region: r });
  assert.equal(a.landed[0].kind, "assertion");
  const b = landTurns(openLedger({}), ["Not so, that's wrong."], { region: r });
  assert.equal(b.landed[0].kind, "correction");
});

test("an unaskable slot is typed: a question whose subject is the unknown declares no void", () => {
  const r = region();
  const out = runLoop({ log: openLedger({}), slot: { end1: "?", label: "approved" }, region: r });
  assert.ok(out.gaps.some((g) => g.type === "unaskable_slot"));
  assert.equal(out.voidId, null);
  assert.ok(out.rounds.length >= 1, "it still reads");
});

test("the user's channel changes what the loop does: with an ask turn a commitment is declared and tested; without, none", () => {
  const r = region();
  const base = openLedger({});
  const asked = landTurns(base, ["When did the House pass the Sunshine Act?"], { region: r });
  assert.equal(asked.asks.length, 1);
  assert.ok(asked.log.entries.some((e) => e.commitment === "matters" && e.giver === GIVER));
  const withAsk = runLoop({ log: asked.log, slot: SLOT, region: r, askTerms: ["House", "Sunshine"], question: "q" });
  const without = runLoop({ log: openLedger({}), slot: SLOT, region: r });
  assert.ok(withAsk.evaluation && !without.evaluation);
  assert.notEqual(withAsk.log.entries.length, without.log.entries.length);
});

test("the nine registers: exactly the cube's nine terrains, every entry filed or counted apart, none guessed", () => {
  assert.deepEqual([...TERRAINS], ["Void", "Entity", "Kind", "Field", "Link", "Network", "Atmosphere", "Lens", "Paradigm"]);
  const r = region();
  let out = runLoop({ log: openLedger({}), slot: SLOT, region: r, question: "the House and the Sunshine Act", askTerms: ["House", "Sunshine"] });
  out = { ...out, log: landTurns(out.log, ["Not so, that's wrong: Maria Lopez approved the freeze."], { region: r }).log };
  const t = terrainsOf(out.log);
  assert.deepEqual(Object.keys(t.registers), [...TERRAINS]);
  const filed = Object.values(t.registers).reduce((a, x) => a + x.count, 0);
  assert.equal(filed + t.unstamped.length + t.unknownTerrain.length, t.entries, "every entry is accounted for");
  assert.equal(t.unstamped.length, 0);
  assert.ok(t.registers.Atmosphere.count > 0 && t.registers.Entity.count > 0, "the frame/void and the heard notes land where the cube says");
  assert.ok(t.registers.Lens.count > 0, "the person's commitment lands in Lens");
});

test("the record is append-only and earned-only: candidate status, re-filing refused, a superseding entry points back", () => {
  const r = region();
  const out = runLoop({ log: openLedger({}), slot: SLOT, region: r });
  const snap = terrainsOf(out.log);
  const a = recordTerrains([], snap, { id: "nl:1", at: "2026-10-14T00:00:00Z" });
  assert.equal(a.entry.status, "candidate");
  assert.ok(Object.isFrozen(a.entry));
  assert.equal(recordTerrains(a.history, snap, { id: "nl:1" }).refused.type, "re_filed");
  const b = recordTerrains(a.history, snap, { id: "nl:2", supersedes: "nl:1" });
  assert.equal(b.history.length, 2);
  assert.equal(b.entry.supersedes, "nl:1");
  assert.deepEqual(Object.keys(a.entry.registers), [...TERRAINS]);
});
