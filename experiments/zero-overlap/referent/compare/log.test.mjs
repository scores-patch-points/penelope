// node --test log.test.mjs   (needs khora and its priors)
import { test } from "node:test";
import assert from "node:assert/strict";
import { compareStatements, address, makeSame } from "./compare.mjs";
import { Log, addVerdict, identityEvent, identityAt, reconsider, standingAt, declarePrior, declareIdentity } from "./log.mjs";

const SA = "Marshall Bell defeated Arthur Greene at the siege in 1912.", SB = "Black Jack defeated Arthur Greene at the siege in 1912.", SB2 = "Black Jack did not defeat Arthur Greene at the siege.", SC = "Marshall Bell, known as Black Jack, led the brigade.";
const dA = { id: "docA", text: `Chapter notes.\nThe war began early. ${SA}\nLater events followed.` };
const dB = { id: "docB", text: `A different book.\n${SB}` }, dB2 = { id: "docB2", text: `A different book.\n${SB2}` }, dC = { id: "docC", text: `Letters.\n${SC}` };
const docs = [dA, dB, dB2, dC];
const stmt = (d, s) => { const i = d.text.indexOf(s); return { doc: d, span: [i, i + s.length] }; };
const base = { language: "eng", by: "asker", at: "t", acyclic: ["defeat"], functional: [], containers: {}, grain: "fine" };
const Q = { about: "Marshall Bell", concerns: ["defeat"] };
const ctx = { by: "logger", at: "tag" };
// the identity is a DEFINITION: a GIVEN prior (a named giver), a per-pair declaration citing it, and only then a merge (REC applies it)
const given = (log) => log.entries.find((e) => e.kind === "identity-prior" && e.body.standing === "given") ?? declarePrior(log, { asker: "asker", tolerance: 0.05, giver: "the asker", priors: ["declared for the tests"], ...ctx });
const mergeOf = (log, a, b) => { const p = given(log), d = declareIdentity(log, { prior: p.id, a, b, evidence: [], ...ctx }); return identityEvent(log, { kind: "merge", a, b, witnesses: witness(), declaration: d.id, ...ctx }); };
const witness = () => { const i = dC.text.indexOf(SC); return [address(dC.text, i, i + SC.length)]; };
const verdict = async (log, B, identity) => addVerdict(log, await compareStatements({ A: stmt(dA, SA), B: stmt(...B), question: Q, declare: { ...base, identity } }), ctx);

test("a later witnessed merge revises an earlier Hold to Same, through a foresight gate; the earlier entry is never rewritten and the cursor shows both", async () => {
  const log = new Log(); const v0 = await verdict(log, [dB, SB]); assert.equal(v0.body.verdict, "Hold");
  const id0 = v0.id, m = mergeOf(log, "Black Jack", "Marshall Bell"); assert.ok(m.id);
  assert.equal(standingAt(log).get(id0).stale, true, "the verdict rests on a re-addressed id and has not been reconsidered");
  const r = await reconsider(log, log.entries.findIndex((e) => e.kind === "merge"), { docs, ...ctx, foresight: async () => ({ bits: 12, nullMean: 3 }) });
  assert.equal(r.results.length, 1); const x = r.results[0]; assert.equal(x.from, "Hold"); assert.equal(x.to, "Same"); assert.equal(x.admitted, true); assert.equal(x.break, false);
  assert.ok(r.hindsight.reached >= 1); assert.ok(r.hindsight.rank >= 0 && r.hindsight.rank <= 1);
  assert.equal(standingAt(log).get(id0).verdict, "Same"); assert.equal(standingAt(log, log.entries.findIndex((e) => e.kind === "merge")).get(id0).verdict, "Hold");
  assert.equal(log.entries[0].id, id0); assert.equal(log.entries[0].body.verdict, "Hold");
  assert.equal(standingAt(log).get(id0).stale, undefined);
});
test("hindsight alone does not admit: with no foresight gate a revision stays proposed and the standing does not move", async () => {
  const log = new Log(); const v0 = await verdict(log, [dB, SB]); mergeOf(log, "Black Jack", "Marshall Bell");
  const r = await reconsider(log, log.entries.findIndex((e) => e.kind === "merge"), { docs, ...ctx }); assert.equal(r.results[0].admitted, false);
  const s = standingAt(log).get(v0.id); assert.equal(s.verdict, "Hold"); assert.equal(s.pending.length, 1); assert.match(s.pending[0].why, /no foresight gate/);
});
test("a gate whose foresight is not above its null rejects the revision, and the rejection is on the log", async () => {
  const log = new Log(); const v0 = await verdict(log, [dB, SB]); mergeOf(log, "Black Jack", "Marshall Bell");
  const r = await reconsider(log, log.entries.findIndex((e) => e.kind === "merge"), { docs, ...ctx, foresight: async () => ({ bits: 2, nullMean: 9 }) }); assert.equal(r.results[0].admitted, false);
  assert.equal(standingAt(log).get(v0.id).verdict, "Hold"); assert.ok(log.entries.some((e) => e.kind === "admit" && e.body.admitted === false));
});
test("a cannot-link added after a merge holds the whole component: Same is weakened, flagged as a break, and the order of the two events does not matter", async () => {
  const gate = async () => ({ bits: 5, nullMean: 1 });
  const log = new Log(); const v0 = await verdict(log, [dB, SB]);
  mergeOf(log, "Black Jack", "Marshall Bell"); await reconsider(log, log.entries.findIndex((e) => e.kind === "merge"), { docs, ...ctx, foresight: gate });
  assert.equal(standingAt(log).get(v0.id).verdict, "Same");
  const ap = identityEvent(log, { kind: "apart", a: "Black Jack", b: "Marshall Bell", witnesses: witness(), ...ctx }); const evIdx = log.entries.indexOf(ap);
  const r = await reconsider(log, evIdx, { docs, ...ctx, foresight: gate });
  const rows = r.results.filter((x) => x.to); assert.ok(rows.some((x) => x.from === "Same" && x.to === "Hold" && x.break === true));
  // the same two events in the other order give the same identity relation, hence the same fresh verdict
  const log2 = new Log(); identityEvent(log2, { kind: "apart", a: "Black Jack", b: "Marshall Bell", witnesses: witness(), ...ctx }); mergeOf(log2, "Black Jack", "Marshall Bell");
  const fresh = (l) => compareStatements({ A: stmt(dA, SA), B: stmt(dB, SB), question: Q, declare: { ...base, identity: identityAt(l) } });
  assert.equal((await fresh(log)).verdict, (await fresh(log2)).verdict); assert.equal((await fresh(log2)).verdict, "Hold");
});
test("a witnessed Other changes only when a witness is retracted", async () => {
  const gate = async () => ({ bits: 5, nullMean: 1 }); const log = new Log();
  const m = mergeOf(log, "Black Jack", "Marshall Bell");
  const v = await verdict(log, [dB2, SB2], identityAt(log)); assert.equal(v.body.verdict, "Other"); assert.deepEqual(v.body.identity_witnesses, [m.id]);
  const ap = identityEvent(log, { kind: "apart", a: "Black Jack", b: "Marshall Bell", witnesses: witness(), ...ctx });
  const r = await reconsider(log, log.entries.indexOf(ap), { docs, ...ctx, foresight: gate }); assert.ok(r.results.some((x) => x.from === "Other" && x.to === "Hold"));
  const s1 = standingAt(log).get(v.id); assert.equal(s1.verdict, "Other"); assert.ok(s1.pending.some((p) => /held-by-witness/.test(p.why)));
  log.append({ kind: "retract", addr: `retract:${m.id.slice(0, 16)}`, body: { why: "the alias witness was withdrawn" }, of: [m.id], ...ctx });
  assert.equal(standingAt(log).get(v.id).verdict, "Hold");
});
test("replay: the log serialises, reloads with every id verified, and a drifted entry is refused", async () => {
  const log = new Log(); const v0 = await verdict(log, [dB, SB]); mergeOf(log, "Black Jack", "Marshall Bell");
  await reconsider(log, log.entries.findIndex((e) => e.kind === "merge"), { docs, ...ctx, foresight: async () => ({ bits: 9, nullMean: 2 }) });
  const re = Log.fromJSONL(log.toJSONL()); assert.equal(re.entries.length, log.entries.length); assert.equal(standingAt(re).get(v0.id).verdict, standingAt(log).get(v0.id).verdict);
  const lines = log.toJSONL().split("\n"); const bad = JSON.parse(lines[0]); bad.body.verdict = "Same"; lines[0] = JSON.stringify(bad);
  assert.throws(() => Log.fromJSONL(lines.join("\n")), /drift/);
});
test("only a witnessed identity decision is recorded", () => {
  const log = new Log(); assert.match(identityEvent(log, { kind: "merge", a: "A", b: "B", witnesses: [], ...ctx }).refused, /no_witness/);
  assert.equal(log.entries.length, 0); assert.ok(identityEvent(log, { kind: "bogus", a: "A", b: "B", witnesses: [1], ...ctx }).refused);
  assert.throws(() => log.append({ kind: "verdict", addr: "x", body: {}, by: "b" }), /declared/);
});
test("unchanged verdicts add nothing: an identity event on an unrelated pair leaves the log alone", async () => {
  const log = new Log(); await verdict(log, [dB, SB]); mergeOf(log, "Someone Else", "Another Person");
  const r = await reconsider(log, log.entries.findIndex((e) => e.kind === "merge"), { docs, ...ctx, foresight: async () => ({ bits: 9, nullMean: 2 }) }); assert.equal(r.results.length, 0); assert.equal(log.entries.filter((e) => e.kind === "revision" || e.kind === "admit" || e.kind === "verdict").length, 1, "no revision and no admission were added");
});

test("a must-link component that holds a cannot-link pair is held whole, whatever the order of the links", () => {
  const X = "Alpha Smith", Y = "Beta Jones", Z = "Gamma Lee";
  const free = makeSame({ merges: [[X, Y], [Y, Z]], aparts: [] }); assert.equal(free(X, Z), true); assert.equal(free(X, Y), true);
  for (const merges of [[[X, Y], [Y, Z]], [[Y, Z], [X, Y]], [[Z, Y], [Y, X]]]) {
    const held = makeSame({ merges, aparts: [[X, Z]] });
    assert.equal(held(X, Z), false); assert.equal(held(X, Y), false, "the whole component is held, not just the forbidden pair"); assert.equal(held(Y, Z), false);
  }
  const unrelated = makeSame({ merges: [[X, Y]], aparts: [[Z, "Delta Park"]] }); assert.equal(unrelated(X, Y), true, "a cannot-link outside the component holds nothing");
});

// ---- the identity is a DEFINITION: declared with a giver, resting on priors; EVA stands under it up to a tolerance; REC applies it; a corpus alone is a candidate; a model never writes it ----
test("a standing prior is GIVEN only with a named giver; without one it is a candidate; asker and tolerance are never defaulted; a model never writes it", () => {
  const log = new Log();
  const c = declarePrior(log, { asker: "asker", tolerance: 0.05, priors: ["a corpus"], ...ctx }); assert.equal(c.cell, "DEF·Pattern"); assert.equal(c.body.standing, "candidate"); assert.equal(c.body.giver, null);
  const g = declarePrior(log, { asker: "asker", tolerance: 0.05, giver: "UD English treebank", priors: ["the treebank"], ...ctx }); assert.equal(g.body.standing, "given"); assert.equal(g.body.giver, "UD English treebank");
  assert.match(declarePrior(log, { tolerance: 0.05, ...ctx }).refused, /never defaulted/); assert.match(declarePrior(log, { asker: "asker", ...ctx }).refused, /never defaulted/); assert.match(declarePrior(log, { asker: "asker", tolerance: "", ...ctx }).refused, /never defaulted/);
  assert.match(declarePrior(log, { asker: "asker", tolerance: 0.05, giver: "g", by: "model:claude", at: "t" }).refused, /model never writes/); assert.match(declarePrior(log, { asker: "asker", tolerance: 0.05, giver: "model:claude", ...ctx }).refused, /model never writes/);
  assert.match(declarePrior(log, { asker: "asker", tolerance: 0.05, giver: "g", by: "self:model:x", at: "t" }).refused, /model never writes/);
  assert.ok(declarePrior(log, { asker: "asker", tolerance: 0.05, giver: "g", by: "modeler", at: "t" }).id, "a writer whose name merely starts with model is not a model writer (exact prefix, no pattern)");
});
test("a per-pair declaration cites a live prior and the evidence it rests on; it inherits the prior's standing and giver; it is a DEF at Figure", () => {
  const log = new Log(), p = declarePrior(log, { asker: "asker", tolerance: 0.05, giver: "the asker", ...ctx });
  assert.match(declareIdentity(log, { prior: "nope", a: "A", b: "B", ...ctx }).refused, /no_prior/); assert.match(declareIdentity(log, { prior: p.id, a: "A", ...ctx }).refused, /names the pair/);
  const d = declareIdentity(log, { prior: p.id, a: "Black Jack", b: "Marshall Bell", evidence: ["janus-merged-world-1", "janus-binding-2"], ...ctx });
  assert.equal(d.cell, "DEF·Figure"); assert.deepEqual(d.of, [p.id, "janus-merged-world-1", "janus-binding-2"]); assert.equal(d.body.standing, "given"); assert.equal(d.body.giver, "the asker"); assert.equal(d.body.tolerance, 0.05);
  log.append({ kind: "retract", addr: "retract:p", body: { why: "withdrawn" }, of: [p.id], ...ctx }); assert.match(declareIdentity(log, { prior: p.id, a: "A", b: "B", ...ctx }).refused, /no_prior/, "a retracted prior cannot be cited");
  assert.match(declareIdentity(log, { prior: p.id, a: "A", b: "B", by: "model:x", at: "t" }).refused, /model never writes/);
});
test("REC applies a GIVEN identity only: a merge with no declaration, a candidate, or another pair's declaration is refused; the merge cites its declaration", () => {
  const log = new Log(), W = witness(), pc = declarePrior(log, { asker: "asker", tolerance: 0.05, priors: ["a corpus"], ...ctx }), pg = declarePrior(log, { asker: "asker", tolerance: 0.05, giver: "the asker", ...ctx });
  assert.match(identityEvent(log, { kind: "merge", a: "A", b: "B", witnesses: W, ...ctx }).refused, /no_declaration/);
  const dc = declareIdentity(log, { prior: pc.id, a: "A", b: "B", ...ctx }); assert.equal(dc.body.standing, "candidate");
  assert.match(identityEvent(log, { kind: "merge", a: "A", b: "B", witnesses: W, declaration: dc.id, ...ctx }).refused, /candidate_cannot_merge/);
  const dg = declareIdentity(log, { prior: pg.id, a: "A", b: "B", ...ctx }); assert.match(identityEvent(log, { kind: "merge", a: "A", b: "C", witnesses: W, declaration: dg.id, ...ctx }).refused, /another_pair/);
  const m = identityEvent(log, { kind: "merge", a: "B", b: "A", witnesses: W, declaration: dg.id, ...ctx }); assert.equal(m.cell, "REC·Figure"); assert.deepEqual(m.of, [dg.id]); assert.equal(m.body.giver, "the asker");
  assert.match(identityEvent(log, { kind: "merge", a: "A", b: "B", witnesses: [], declaration: dg.id, ...ctx }).refused, /no_witness/);
});
test("a candidate raises and applies nothing: identityAt lists it as a candidate and merges nothing; retracting a declaration REVOKES its merge (REC revises the DEF)", () => {
  const log = new Log(), pc = declarePrior(log, { asker: "asker", tolerance: 0.05, ...ctx }); declareIdentity(log, { prior: pc.id, a: "A", b: "B", ...ctx });
  let id = identityAt(log); assert.deepEqual(id.merges, []); assert.deepEqual(id.candidates, [["A", "B"]]);
  const m = mergeOf(log, "C", "D"); id = identityAt(log); assert.deepEqual(id.merges, [["C", "D"]]);
  const decl = log.entries.find((e) => e.kind === "identity-declaration" && e.body.a === "C"); log.append({ kind: "retract", addr: "retract:d", body: { why: "the giver withdrew it" }, of: [decl.id], ...ctx });
  assert.deepEqual(identityAt(log).merges, [], "the merge rested on a declaration that was retracted"); assert.ok(m.id);
});
test("EVA stands under the prior up to its tolerance: a verdict cites the prior and records up_to; with no live prior it is refused; a model never writes it", async () => {
  const log = new Log(), p = declarePrior(log, { asker: "asker", tolerance: 0.05, giver: "the asker", ...ctx });
  const res = await compareStatements({ A: stmt(dA, SA), B: stmt(dB, SB), question: Q, declare: { ...base, identity: identityAt(log) } });
  assert.match(addVerdict(log, res, { under: ["nope"], ...ctx }).refused, /no_prior/); assert.match(addVerdict(log, res, { under: [p.id], by: "model:claude", at: "t" }).refused, /model never writes/);
  const v = addVerdict(log, res, { under: [p.id], ...ctx }); assert.equal(v.cell, "EVA·Figure"); assert.deepEqual(v.body.under, [p.id]); assert.deepEqual(v.body.up_to, [0.05]); assert.ok(v.of.includes(p.id));
  const s = standingAt(log).get(v.id); assert.deepEqual(s.under, [p.id]); assert.deepEqual(s.upTo, [0.05]);
  const bare = addVerdict(log, res, { ...ctx }); assert.equal(bare.body.up_to, undefined, "a verdict under no prior claims no tolerance");
});
