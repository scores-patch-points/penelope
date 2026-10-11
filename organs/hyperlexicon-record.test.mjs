// penelope/organs/hyperlexicon-record.test.mjs — the keeper's ledger: each
// weave/unweave epoch is filed with evidence + falsifying control, appended
// never rewritten, and the mouth says what stands.
import test from "node:test";
import assert from "node:assert/strict";
import { HL_RECORD_SCHEMA, recordHyperlexiconEpoch, renderJudgment } from "./hyperlexicon-record.mjs";

const janusVerdict = (success, effect, p) => ({ schema: "EOConsequenceVerdict@1", method: "held_out_future", success, effect, pValue: p, witness: "rigveda-arena" });

test("the record files weave, unweave, and refuse-epochs with evidence and a falsifying control", () => {
  let history = [];
  history = recordHyperlexiconEpoch(history, { id: "hl:epoch:1", reading: "rigveda:frontier", rowId: "abs:rigveda:recurrence", acted: "promoted_con", standing: "earned", verdict: janusVerdict(true, 0.72, 0.002) });
  history = recordHyperlexiconEpoch(history, { id: "hl:epoch:2", rowId: "abs:rigveda:recurrence", acted: "defeated_def", standing: "refuted", retainedDefeats: 1, verdict: janusVerdict(false, -0.1, 0.96), supersedes: null });
  history = recordHyperlexiconEpoch(history, { id: "hl:epoch:3", rowId: "abs:rigveda:recurrence", acted: "refused_refuted", standing: "refuted", verdict: janusVerdict(true, 0.9, 0.0001) });

  assert.equal(history.length, 3);
  assert.equal(history[0].schema, HL_RECORD_SCHEMA);
  assert.equal(history[0].pipeline, "hyperlexicon");
  assert.equal(history[0].status, "earned");
  assert.equal(history[0].evidence.effect, 0.72);
  assert.match(history[0].falsifyingControl, /0.15\/0.05/);
  assert.equal(history[1].status, "refuted");
  assert.equal(history[1].retainedDefeats, 1);
  // the refused re-promotion is FILED as its own refusal epoch — never erased
  assert.equal(history[2].status, "refused_reroute");
});

test("the mouth says what stands", () => {
  const words = renderJudgment({ earned: ["abs:rigveda:recurrence:v2"], candidates: ["abs:rigveda:cheap"], refuted: ["abs:rigveda:recurrence"], priorEntries: Array(270) });
  assert.match(words, /earned: abs:rigveda:recurrence:v2/);
  assert.match(words, /withheld-candidate: abs:rigveda:cheap/);
  assert.match(words, /defeated-preserved: abs:rigveda:recurrence/);
  assert.match(words, /retained mind holds 270 referents/);
  assert.match(renderJudgment({}), /nothing on the ledger/);
});