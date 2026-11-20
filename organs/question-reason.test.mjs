import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { sliceFor, testProposal, reasonOver, weaveReasoning } from "./question-reason.mjs";
const M = (a, rel, b, at, polarity = "+") => ({ a, rel, b, at, polarity });
const marks = [M("Tom", "live_in", "Derby", "s2"), M("Tom", "live_in", "Leeds", "s3"), M("Anna", "work_at", "Acme", "s4"), M("Maria", "hire", "Victor", "s0"), M("Victor", "live_in", "York", "s1")];
const F = { functional: ["live"] };
test("a proposal is tested against the marks: restates, contradicted under a declared single-value prior, new_being, or silent", () => {
  assert.equal(testProposal({ a: "Tom", rel: "live_in", b: "Leeds" }, marks, F).status, "restates");
  assert.equal(testProposal({ a: "Tom", rel: "live_in", b: "Zurich" }, marks, F).status, "contradicted");
  assert.equal(testProposal({ a: "Tom", rel: "live_in", b: "York" }, marks, {}).status, "silent", "without the prior nothing is ruled out (York is a being the material mentions)");
  assert.equal(testProposal({ a: "Tom", rel: "live_in", b: "York" }, marks, F).status, "contradicted");
  assert.equal(testProposal({ a: "Zed", rel: "work_at", b: "Acme" }, marks, F).status, "new_being");
  assert.equal(testProposal({ a: "Anna", rel: "work_at", b: "Zebra" }, marks, F).status, "new_being", "Zebra is in the question, not in what was said");
  assert.equal(testProposal({ a: "Victor", rel: "work_at", b: "Acme" }, marks, F).status, "silent");
});
test("the slice a sub-question may read is bounded, by the beings it names plus one hop, in turn order", () => {
  const s = sliceFor(["Maria"], marks); assert.deepEqual(s.map((m) => `${m.a} ${m.rel} ${m.b}`), ["Maria hire Victor", "Victor live_in York"]);
  assert.equal(sliceFor(["Tom"], marks, { limit: 1 }).length, 1);
});
const node = (id, standing, text = "does Anna still work at Zebra", note = "not_on_record") => ({ id, standing, text, note, kind: "polar" });
const model = (content, thinking = "hmm") => ({ calls: [], async think(p) { this.calls.push(p); return { thinking, content }; } });
const ctx = (m, claimsOf) => ({ marks, namesOf: () => ["Anna"], claimsOf, model: m, ...F });
test("only a hole or a gap goes to the model; a goal the machine settled, or a judgement, never does", async () => {
  const m = model("x"), out = await reasonOver([node("g1", "stands"), node("g2", "judgement"), node("g3", "contradicted"), node("g4", "hole")], ctx(m, () => []));
  assert.equal(m.calls.length, 1); assert.ok(out[3].thought && !out[0].thought && !out[1].thought && !out[2].thought);
  assert.match(m.calls[0].user, /The machine could not settle it because: not_on_record/);
});
test("a silent proposal makes the goal a CANDIDATE, labelled as the model's, never `stands`; a restated or contradicted one does not", async () => {
  const silent = (await reasonOver([node("g1", "hole")], ctx(model("Victor works at Acme."), () => [{ a: "Victor", rel: "work_at", b: "Acme" }])))[0];
  assert.equal(silent.standing, "candidate"); assert.match(silent.finding, /PROPOSED by the model, not on record/); assert.deepEqual(silent.basis.material, []); assert.equal(silent.proposals[0].status, "silent");
  const re = (await reasonOver([node("g1", "hole")], ctx(model("x"), () => [{ a: "Anna", rel: "work_at", b: "Acme" }])))[0]; assert.equal(re.standing, "hole", "a restatement is not a new proposal");
  const bad = (await reasonOver([node("g1", "hole", "does Tom live in Zurich")], ctx(model("x"), () => [{ a: "Tom", rel: "live_in", b: "Zurich" }])))[0]; assert.equal(bad.standing, "hole"); assert.equal(bad.proposals[0].status, "contradicted");
  const nb = (await reasonOver([node("g1", "hole")], ctx(model("x"), () => [{ a: "Anna", rel: "work_at", b: "Zebra" }])))[0]; assert.equal(nb.standing, "hole", "a proposal about a being the text never mentioned is not a candidate answer"); assert.equal(nb.proposals[0].status, "new_being");
  const none = (await reasonOver([node("g1", "hole")], ctx(model("nothing follows"), () => [])))[0]; assert.equal(none.standing, "hole"); assert.deepEqual(none.proposals, []);
});
test("weave: the thought is an Existence entry by the model citing the goal; the proposal cites the thought; the verdict is Penelope's EVA; the model writes no Interpretation", async () => {
  const LIB = process.env.PHAROS_LIB ?? ""; if (!LIB || !fs.existsSync(LIB)) return;   // pharos not beside: skip (typed, not a pass of anything else)
  const P = await import(`file://${LIB}`), W = await import(`file://${path.join(path.dirname(LIB), "writers.mjs")}`);
  const nodes = await reasonOver([node("g1", "hole")], ctx(model("Victor works at Acme."), () => [{ a: "Victor", rel: "work_at", b: "Acme" }]));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "qr-")), h = P.open("t", { dir, writer: "w" }), goal = (P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: "kind:goal", body: { name: "goal", cell: "SEG·Pattern" } }), P.weave(h, { cell: "SEG·Pattern", kind: "goal", addr: "goal:g1", body: {} }));
  weaveReasoning(P, h, nodes, new Map([["g1", goal.id]]));
  const es = P.entries(h), by = (k) => es.filter((e) => e.kind === k), th = by("thought")[0], pr = by("proposal")[0], vd = by("verdict")[0];
  assert.equal(th.cell, "INS·Figure"); assert.deepEqual(th.of, [goal.id]); assert.deepEqual(pr.of, [th.id]); assert.equal(vd.cell, "EVA·Figure"); assert.equal(vd.body.status, "silent");
  const asModel = es.filter((e) => ["thought", "proposal"].includes(e.kind)).map((e) => ({ ...e, by: "penelope" }));
  assert.ok(W.audit(asModel).ok, "thought and proposal are Existence and Structure");
  assert.ok(W.audit(es.filter((e) => e.kind === "verdict").map((e) => ({ ...e, by: "janus" }))).violations.length === 1, "a verdict written by anyone but the interpreter is a violation");
});
