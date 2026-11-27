// edit-decision.test.mjs — the rules ED1, ED2, ED3 over REAL janus bodies (organs/fixtures/janus-edit-intents.fixture.jsonl: the edit-weave + weaveProposals output of the janus edit-pipeline branch on
// 'Please trim this clip. Then make the pacing better. Delete it.' with SYNTHETIC word timings, frozen; no sibling is imported) and hand-built edit-choice entries to the contract's shape. Exploratory: one text, three intents.
// Each arm is a control for another: a rule that said yes everywhere would fail the refusals; one that said no everywhere would fail the happy path.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hits } from "../gym/text-regex-ratchet.mjs";
import { defOf, evaOf, recOf, marksFor, parseAddr, editAddr, choiceAddrOf, KINDS, DEF_KIND, EVA_KIND, REC_KIND, DEFINABLE, EDIT_SCHEMA } from "./edit-decision.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const fx = fs.readFileSync(path.join(HERE, "fixtures", "janus-edit-intents.fixture.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).map((e) => ({ ...e, id: `id:${e.addr}` }));
const at = (a) => fx.find((e) => e.addr === a);
const SHA = "66d46b917281d6e2", trimI = at(`intent:${SHA}#0`), pacingI = at(`intent:${SHA}#1`), gapI = at(`intent:${SHA}#2`), trimP = at(`proposal:${SHA}#0:0`), pacingP = at(`proposal:${SHA}#1:0`);
const choice = (i, n, body) => ({ id: `id:choice#${i}`, kind: "edit-choice", cell: "INS·Figure", addr: `choice:${SHA}#${i}`, body: { giver: "asker:ana", proposal: `proposal:${SHA}#${i}:${n}`, tolerance: 0.25, ...body } });

test("fixtures are janus's own bodies at janus's cells, and say what the rules read", () => {
  assert.equal(fx.length, 5); for (const e of fx) assert.equal(e.by, "janus");
  assert.deepEqual([trimI.body.status, pacingI.body.status, gapI.body.status], ["needs_params", "ready", "gap"]);
  assert.deepEqual(trimI.body.params_missing, ["span"]); assert.deepEqual(gapI.body.gaps.map((g) => g.gap), ["referent_unresolved"]);
  assert.equal(trimP.body.method, "trim_to_speech"); assert.deepEqual(trimP.body.spans, [{ from: 0, to: 1 }]); assert.equal(trimP.body.intent, trimI.addr);
});

test("addresses: parsed as ids, never as text; the triad address and its choice address round trip", () => {
  assert.deepEqual(parseAddr(`proposal:${SHA}#1:3`, "proposal"), { sha: SHA, i: 1, n: 3 }); assert.deepEqual(parseAddr(`intent:${SHA}#2`, "intent"), { sha: SHA, i: 2 });
  for (const bad of [`intent:${SHA}`, `intent:#2`, `intent:${SHA}#x`, `intent:${SHA}#1:2:3`, `intent:${SHA}#-1`, `proposal:${SHA}#1`.replace("proposal", "intent") + ":a", null, 5]) assert.equal(parseAddr(bad, "intent"), null, String(bad));
  assert.equal(editAddr(SHA, 0), `edit:${SHA}#0`); assert.equal(choiceAddrOf(`edit:${SHA}#0`), `choice:${SHA}#0`); assert.equal(choiceAddrOf("edit:nope"), null);
});

test("ED1 the happy DEF: a named giver chose a live proposal of a needs_params intent; the asker's own spans win, the proposal's are adopted when the asker gave none; the body is the declared standard", () => {
  const own = defOf({ intent: trimI, proposal: trimP, choice: choice(0, 0, { spans: [{ from: 0.1, to: 1.1 }] }) });
  assert.equal(own.gap, null); assert.deepEqual(own.body, { schema: EDIT_SCHEMA, rule: "ED1", giver: "asker:ana", intent: trimI.addr, proposal: trimP.addr, primitive: "remove_span", clip: "clip-7", method: "trim_to_speech", spans: [{ from: 0.1, to: 1.1 }], tolerance: 0.25, declared_from: "asker" });
  const adopted = defOf({ intent: trimI, proposal: trimP, choice: choice(0, 0, {}) }); assert.deepEqual(adopted.body.spans, trimP.body.spans); assert.equal(adopted.body.declared_from, "proposal");
  const ready = defOf({ intent: pacingI, proposal: pacingP, choice: choice(1, 0, {}) }); assert.equal(ready.body.primitive, "remove_span"); assert.equal(ready.body.clip, null); assert.equal(ready.body.method, "outlier_gaps");
  assert.deepEqual(DEFINABLE, ["ready", "needs_params"]);
});

test("ED1 refusals, each with its typed reason: no choice, no giver, ambiguous intent, gap intent (reason from the intent's own gaps), unsupplied param, address mismatch, malformed spans, absent entries", () => {
  const P = { intent: trimI, proposal: trimP, choice: choice(0, 0, {}) }, gap = (x) => defOf({ ...P, ...x }).gap;
  assert.equal(gap({ choice: null }), "no_def:no_choice");
  for (const giver of [undefined, "", "   ", null, 7]) assert.equal(gap({ choice: choice(0, 0, { giver }) }), "no_def:no_giver", String(giver));
  const amb = { ...trimI, body: { ...trimI.body, status: "ambiguous", alternatives: [{ primitive: "remove_span" }, { primitive: "split" }] } }; const a = defOf({ ...P, intent: amb });
  assert.equal(a.body, null); assert.equal(a.gap, "no_def:intent_status:ambiguous"); assert.equal(a.alternatives, 2);
  const g = defOf({ intent: { ...gapI }, proposal: { ...trimP, addr: `proposal:${SHA}#2:0`, body: { ...trimP.body, intent: gapI.addr } }, choice: choice(2, 0, { spans: [{ from: 0, to: 1 }] }) });
  assert.equal(g.body, null); assert.equal(g.gap, "no_def:intent_gap:referent_unresolved"); assert.deepEqual(g.gaps, ["referent_unresolved"]);
  assert.equal(gap({ intent: { ...trimI, body: { ...trimI.body, status: "gap", gaps: [] } } }), "no_def:intent_status:gap");
  assert.equal(gap({ intent: { ...trimI, body: { ...trimI.body, params_missing: ["span", "criterion"] } } }), "no_def:param_unsupplied:criterion");
  assert.equal(gap({ choice: choice(0, 0, { proposal: null }) }), "no_def:no_proposal_named"); assert.equal(gap({ proposal: null }), "no_def:proposal_not_live"); assert.equal(gap({ proposal: pacingP }), "no_def:proposal_not_live", "the choice names another proposal");
  assert.equal(gap({ intent: null }), "no_def:intent_not_live"); assert.equal(gap({ intent: pacingI }), "no_def:intent_not_live", "the proposal names another intent");
  assert.equal(gap({ choice: { ...choice(0, 0, {}), addr: `choice:${SHA}#1` } }), "no_def:address_mismatch"); assert.equal(gap({ choice: { ...choice(0, 0, {}), addr: "choice:x" } }), "no_def:bad_address");
  assert.equal(gap({ choice: choice(0, 0, { spans: [{ from: 2, to: 1 }] }) }), "no_def:spans_malformed"); assert.equal(gap({ choice: choice(0, 0, { spans: [] }) }), "no_def:spans_malformed");
  assert.equal(gap({ proposal: { ...trimP, body: { ...trimP.body, primitive: undefined } } }), "no_def:no_primitive");
  assert.deepEqual(pacingI.body.primitives, ["change_state_to"]); assert.equal(pacingP.body.primitive, "remove_span", "real janus data: the proposal realises the intent's primitive, so the two names differ and are not compared");
  assert.equal(gap({ proposal: { ...trimP, body: { ...trimP.body, spans: [{ from: "0", to: 1 }] } } }), "no_def:proposal_spans_malformed");
  assert.equal(defOf({}).gap, "no_def:no_choice");
});

test("ED2: stands iff the same method, primitive and clip, the same number of spans, each end within the ASKER's tolerance; ONE witness is `single`, never agreement; the measured differences are recorded", () => {
  const def = defOf({ intent: trimI, proposal: trimP, choice: choice(0, 0, { spans: [{ from: 0.25, to: 1.25 }], tolerance: 0.25 }) }).body;
  const e = evaOf({ def, proposal: trimP }); assert.equal(e.gap, null);
  assert.equal(e.body.stands, true, "differences of exactly the tolerance stand (<=)"); assert.equal(e.body.standing, "single"); assert.equal(e.body.witnesses, 1); assert.deepEqual(e.body.differences, [{ index: 0, from: 0.25, to: 0.25 }]); assert.equal(e.body.max_difference, 0.25);
  assert.equal(e.body.independent, true); assert.deepEqual(e.body.reasons, []); assert.match(e.body.note, /ONE witness/); assert.ok(!("agreement" in e.body) && !JSON.stringify(e.body).includes("agree"), "one witness is never called agreement");
  const far = evaOf({ def: { ...def, spans: [{ from: 0.5, to: 1.5 }] }, proposal: trimP }); assert.equal(far.body.stands, false); assert.deepEqual(far.body.reasons, ["span_beyond_tolerance"]); assert.deepEqual(far.body.differences, [{ index: 0, from: 0.5, to: 0.5 }]); assert.equal(far.body.max_difference, 0.5);
  const one = evaOf({ def: { ...def, spans: [{ from: 0.25, to: 1.9 }] }, proposal: trimP }); assert.equal(one.body.stands, false, "one end beyond is enough");
  const many = evaOf({ def: { ...def, spans: [{ from: 0, to: 1 }, { from: 5, to: 6 }] }, proposal: trimP }); assert.equal(many.body.stands, false); assert.deepEqual(many.body.reasons, ["span_count"]); assert.deepEqual(many.body.spans, { declared: 2, proposed: 1 });
  const m = evaOf({ def: { ...def, method: "outlier_gaps" }, proposal: trimP }); assert.equal(m.body.stands, false); assert.deepEqual(m.body.reasons, ["method"]);
  assert.deepEqual(evaOf({ def: { ...def, primitive: "split", clip: "clip-9" }, proposal: trimP }).body.reasons, ["primitive", "clip"]);
  const proposalOrder = evaOf({ def: { ...def, spans: [{ from: 0, to: 1 }, { from: 5, to: 6 }], tolerance: 0.1 }, proposal: { ...trimP, body: { ...trimP.body, spans: [{ from: 5, to: 6 }, { from: 0, to: 1 }] } } }); assert.equal(proposalOrder.body.stands, true, "spans are compared in time order");
  const adopted = defOf({ intent: trimI, proposal: trimP, choice: choice(0, 0, {}) }).body, t = evaOf({ def: adopted, proposal: trimP }); assert.equal(t.body.stands, true); assert.equal(t.body.independent, false, "the asker gave no spans: the evidence is the standard, the test is tautological and says so");
});
test("ED2 abstains (no body, a typed reason) without a positive finite tolerance, and with no DEF or no evidence", () => {
  const def = defOf({ intent: trimI, proposal: trimP, choice: choice(0, 0, {}) }).body;
  for (const tolerance of [undefined, null, 0, -1, NaN, "0.5", Infinity]) { const d = defOf({ intent: trimI, proposal: trimP, choice: choice(0, 0, { tolerance }) }); assert.equal(d.gap, null, "a DEF stands without a tolerance"); assert.equal(d.body.tolerance, null === d.body.tolerance ? null : d.body.tolerance); const e = evaOf({ def: d.body, proposal: trimP }); assert.equal(e.body, null, `tolerance ${String(tolerance)}`); assert.equal(e.gap, "eva_abstains:tolerance"); }
  assert.equal(evaOf({ def: null, proposal: trimP }).gap, "no_eva:no_def"); assert.equal(evaOf({ def: { ...def, giver: undefined }, proposal: trimP }).gap, "no_eva:no_def"); assert.equal(evaOf({ def, proposal: null }).gap, "no_eva:no_proposal"); assert.equal(evaOf({}).body, null);
});
test("ED3: an order only from a standing EVA, applies false; EVA without DEF and REC without a standing EVA are IMPOSSIBLE", () => {
  const def = defOf({ intent: trimI, proposal: trimP, choice: choice(0, 0, { spans: [{ from: 0.25, to: 1.25 }] }) }).body, yes = evaOf({ def, proposal: trimP }).body, no = evaOf({ def: { ...def, spans: [{ from: 3, to: 4 }] }, proposal: trimP }).body;
  const r = recOf({ def, eva: yes, defId: "D", evaId: "E" }); assert.deepEqual(r.body, { schema: EDIT_SCHEMA, rule: "ED3", primitive: "remove_span", clip: "clip-7", spans: def.spans, intent: trimI.addr, def: "D", eva: "E", applies: false });
  assert.equal(recOf({ def, eva: no, defId: "D", evaId: "E" }).gap, "no_rec:eva_not_standing"); assert.equal(recOf({ def, eva: null, defId: "D", evaId: "E" }).gap, "no_rec:no_eva"); assert.equal(recOf({ def: null, eva: yes, defId: "D", evaId: "E" }).gap, "no_rec:no_def");
  assert.equal(recOf({ def, eva: { ...yes, stands: "true" }, defId: "D", evaId: "E" }).body, null, "only the boolean true stands"); assert.equal(recOf({ def, eva: yes }).gap, "no_rec:no_ids"); assert.equal(recOf({}).body, null);
  // the mark builder is the second wall: a REC mark needs a standing-EVA order naming the EVA it follows, an EVA mark needs its DEF, a DEF mark a giver
  const mk = (kind, body, prev, of) => marksFor({ kind, sha: SHA, i: 0, body, prev, of, log: "t" });
  assert.equal(mk(REC_KIND, r.body, "E", ["E", "D"]).length, 1); assert.equal(mk(REC_KIND, r.body, "E", ["D"]).length, 0); assert.equal(mk(REC_KIND, { ...r.body, applies: true }, "E", ["E", "D"]).length, 0, "applies is the editor's to say"); assert.equal(mk(REC_KIND, r.body, "X", ["X", "D"]).length, 0, "an order must follow the EVA it names");
  assert.equal(mk(REC_KIND, yes, "E", ["E"]).length, 0, "an EVA body is not an order"); assert.equal(mk(EVA_KIND, yes, "D", ["D"]).length, 1); assert.equal(mk(EVA_KIND, yes, undefined, ["D"]).length, 0, "no DEF to follow"); assert.equal(mk(EVA_KIND, r.body, "D", ["D"]).length, 0); assert.equal(mk(EVA_KIND, yes, "D", ["Y"]).length, 0);
  assert.equal(mk(DEF_KIND, def, "C", ["C", "P", "I"]).length, 1); assert.equal(mk(DEF_KIND, { ...def, giver: "" }, "C", ["C"]).length, 0, "no giver, no DEF mark"); assert.equal(mk(DEF_KIND, def, undefined, ["C"]).length, 0, "no choice to follow");
});

test("marks: the contract's addresses, cells and kinds, `of` the previous; a revision names what it replaces; no kind but her three is ever made", () => {
  const def = defOf({ intent: trimI, proposal: trimP, choice: choice(0, 0, {}) }).body;
  const [d] = marksFor({ kind: DEF_KIND, sha: SHA, i: 0, body: def, prev: "C", of: ["C", "P", "I"], log: "t", revises: "old" });
  assert.equal(d.cell, "DEF·Figure"); assert.equal(d.kind, "edit-def"); assert.equal(d.addr, `edit:${SHA}#0`); assert.deepEqual(d.of, ["C", "P", "I"]); assert.equal(d.basis.revises, "old"); assert.equal(d.basis.role, "REC"); assert.equal(d.basis.rule, "ED1"); assert.ok(d.witness.how && d.declare.why);
  assert.deepEqual(Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [k, v.cell])), { "edit-def": "DEF·Figure", "edit-eva": "EVA·Figure", "edit-rec": "REC·Figure" });
  for (const k of Object.values(KINDS)) assert.ok(["DEF", "EVA", "REC"].includes(k.cell.split("·")[0]), "an Interpretation cell");
  for (const kind of ["edit-choice", "edit-proposal", "edit-intent", "retract", "kind", "nope", undefined]) assert.deepEqual(marksFor({ kind, sha: SHA, i: 0, body: def, prev: "C", of: ["C"], log: "t" }), [], String(kind));
  assert.deepEqual(marksFor({ kind: DEF_KIND, sha: SHA, i: 0, body: def, prev: "C", of: ["C"] }), [], "no log"); assert.deepEqual(marksFor({ kind: DEF_KIND, sha: SHA, i: 0.5, body: def, prev: "C", of: ["C"], log: "t" }), []);
});

test("no regex: neither file applies a pattern, so the ratchet counts nothing of hers (an address is split, never matched)", () => {
  const mine = hits(["organs", "gym"]).filter((h) => h.file.includes("edit-decision"));
  assert.deepEqual(mine, []);
  for (const f of ["edit-decision.mjs", "../gym/edit-decision-run.mjs"]) { const src = fs.readFileSync(path.join(HERE, f), "utf8"); assert.ok(!src.includes("new RegExp") && !src.includes("regex-ok"), f); assert.ok(!/^\s*import .*(khora|janus)/m.test(src), `${f} imports no sibling`); }
});
