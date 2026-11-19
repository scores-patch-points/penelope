// node --test foresight.test.mjs  (needs khora and its priors)
import { test } from "node:test";
import assert from "node:assert/strict";
import { compareStatements, address } from "./compare.mjs";
import { Log, addVerdict, identityEvent, reconsider, standingAt } from "./log.mjs";
import { surpriseBits, symbolizer, streamOf, makeForesight, effect, admission, decideEvent, SEEDS, DRAWS } from "./foresight.mjs";

const ctx = { by: "logger", at: "tag" }, base = { language: "eng", by: "asker", at: "t", acyclic: ["defeat"], functional: [], containers: {}, grain: "fine" }, Q = { about: "Marshall Bell", concerns: ["defeat"] };
const SA = "Marshall Bell defeated Arthur Greene at the siege in 1912.", SB = "Black Jack defeated Arthur Greene at the siege in 1912.", SC = "Marshall Bell, known as Black Jack, led the brigade.";
// a document where two names alternate in the LATER part, so that coding them as one symbol removes surprise there; other beings are independent noise
const others = ["Arthur Greene", "Henry Dunn", "Olivia Park", "Thomas Reed", "Rita Cole", "Victor Hale", "Cuba", "Madrid"];
const mkDoc = (id, alias) => {
  const early = [], late = []; let k = 0;
  for (let i = 0; i < 16; i++) early.push(`${others[k++ % others.length]} met ${others[(k * 3 + 1) % others.length]} near the river.`);
  early.push(`${SB}`);
  for (let i = 0; i < 36; i++) late.push(`${i % 2 ? alias : "Marshall Bell"} wrote to the committee about the siege.`);   // a long strict alternation: the clear true alias the stricter gate must still admit
  return { id, text: `Notes.\n${early.join(" ")}\n${late.join(" ")}` };
};
const dEarlyCut = (d) => d.text.indexOf(SB) + SB.length;
const dA = { id: "docA", text: `Chapter notes.\nThe war began early. ${SA}\nLater events followed.` }, dC = { id: "docC", text: `Letters.\n${SC}` };
const witness = () => { const i = dC.text.indexOf(SC); return [address(dC.text, i, i + SC.length)]; };
const stmt = (d, s) => { const i = d.text.indexOf(s); return { doc: d, span: [i, i + s.length] }; };

test("surprise: a coding that makes alternating names one symbol removes surprise; with nothing to merge it does nothing", () => {
  const ev = (faces) => faces.map((f, i) => ({ face: f, t: i, pos: i * 10 }));
  const alt = ev(["a", "b", "a", "b", "a", "b", "a", "b", "a", "b"]);
  const sep = surpriseBits(alt, (f) => f).reduce((x, y) => x + y, 0), one = surpriseBits(alt, () => "x").reduce((x, y) => x + y, 0);
  assert.ok(one < sep, `merged ${one} should be below separate ${sep}`);
  const e = effect(alt, 20, { merges: [], aparts: [] }, { merges: [["a", "b"]], aparts: [] }); assert.ok(e.foresight > 0 && e.later > 0);
  assert.ok(Math.abs(effect(alt, 20, { merges: [], aparts: [] }, { merges: [], aparts: [] }).foresight) < 1e-9);
});
test("a true alias that alternates in the unseen later text is ADMITTED: foresight above the null's robust threshold", async () => {
  const dB = mkDoc("docB", "Black Jack"), docs = [dA, dB, dC], log = new Log();
  const v0 = addVerdict(log, await compareStatements({ A: stmt(dA, SA), B: stmt(dB, SB), question: Q, declare: base }), ctx); assert.equal(v0.body.verdict, "Hold");
  identityEvent(log, { kind: "merge", a: "Black Jack", b: "Marshall Bell", witnesses: witness(), ...ctx });
  const gate = makeForesight(log, 1, docs); const r = await reconsider(log, 1, { docs, ...ctx, foresight: gate });
  const x = r.results[0]; assert.ok(x.gate && !x.gate.gap, JSON.stringify(x.gate)); assert.ok(x.gate.bits > 0 && x.gate.bits > x.gate.nullMean, `${x.gate.bits} vs ${x.gate.nullMean}`);
  assert.equal(x.admitted, true); assert.equal(standingAt(log).get(v0.id).verdict, "Same"); assert.ok(x.gate.rank >= 0.9, `rank ${x.gate.rank}`);
});
test("a false alias (two beings that do not co-vary in the later text) is NOT admitted, and the standing does not move", async () => {
  const dB = mkDoc("docB", "Henry Dunn"), docs = [dA, dB, dC], log = new Log();
  const v0 = addVerdict(log, await compareStatements({ A: stmt(dA, SA), B: stmt(dB, SB), question: Q, declare: base }), ctx);
  identityEvent(log, { kind: "merge", a: "Black Jack", b: "Marshall Bell", witnesses: witness(), ...ctx });
  const g = await makeForesight(log, 1, docs)({ body: { of: v0.id } });   // here the SECOND name in the later text is Henry Dunn, not Black Jack: the merged pair never co-occurs
  console.log("   false alias gate:", JSON.stringify({ bits: g.bits, threshold: g.nullMean, rank: g.rank, gap: g.gap }));
  assert.equal(g.gap, undefined, `it must be a real numeric decision, not a gap: ${JSON.stringify(g)}`); assert.ok(!(g.bits > 0 && g.bits > g.nullMean), `a merge of names that never appear later must not pass: ${JSON.stringify(g)}`);
});
test("no later material, or an underpowered null, is a typed gap that admits nothing", async () => {
  const dB = { id: "docB", text: `A short note.\n${SB}` }, log = new Log();
  const v0 = addVerdict(log, await compareStatements({ A: stmt(dA, SA), B: stmt(dB, SB), question: Q, declare: base }), ctx);
  identityEvent(log, { kind: "merge", a: "Black Jack", b: "Marshall Bell", witnesses: witness(), ...ctx });
  const g = await makeForesight(log, 1, [dA, dB, dC])({ body: { of: v0.id } }); assert.ok(g.gap, JSON.stringify(g)); assert.equal(g.bits > g.nullMean && !g.gap, false);
});
test("a cannot-link has no foresight measure yet: typed, and nothing is admitted", async () => {
  const dB = mkDoc("docB", "Black Jack"), log = new Log(); const v0 = addVerdict(log, await compareStatements({ A: stmt(dA, SA), B: stmt(dB, SB), question: Q, declare: base }), ctx);
  identityEvent(log, { kind: "apart", a: "Black Jack", b: "Marshall Bell", witnesses: witness(), ...ctx });
  const g = await makeForesight(log, 1, [dA, dB, dC])({ body: { of: v0.id } }); assert.equal(g.gap, "foresight_defined_for_merge_only");
});
test("admission: above zero and above BOTH seeds' maxima; beating only one is a dissent, not an admission", () => {
  assert.deepEqual(admission(5, [3, 4]), { admitted: true, dissent: false });
  assert.deepEqual(admission(3.5, [3, 4]), { admitted: false, dissent: true });
  assert.deepEqual(admission(2, [3, 4]), { admitted: false, dissent: false });
  assert.deepEqual(admission(-1, [-5, -6]), { admitted: false, dissent: false }, "never admitted at or below zero, even above a negative null");
  assert.equal(SEEDS.length, 2); assert.equal(DRAWS, 39);
});
