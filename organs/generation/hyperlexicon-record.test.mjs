// organs/generation/hyperlexicon-record.test.mjs — the keeper's append-only contract, enforced.
import test from "node:test";
import assert from "node:assert/strict";
import { emptyRecord, recordEvent, supersede, epochsOf, verdictsByStanding } from "./hyperlexicon-record.mjs";

test("append-only: an epoch is filed once; re-filing the same id is a TYPED REFUSAL, never a rewrite", () => {
  const r0 = emptyRecord();
  const one = recordEvent(r0, { id: "abs:rigveda:recurrence:v2", standing: "earned", referent: "rigveda", basis: { sources: 3 } }, { now: "t1" });
  assert.equal(one.ok, true);
  assert.equal(epochsOf(one.record).length, 1);
  const again = recordEvent(one.record, { id: "abs:rigveda:recurrence:v2", standing: "withheld-candidate", basis: { sources: 3 } }, { now: "t2" });
  assert.equal(again.ok, false);
  assert.equal(again.refused, "re-file");
  assert.match(again.why, /append-only: supersede it by pointer, never re-file it/);
  assert.equal(epochsOf(one.record).length, 1, "the record was NOT rewritten");
});

test("supersede-by-pointer: the old event stays; the new one names it; the retained mind drops the superseded", () => {
  let rec = emptyRecord();
  rec = recordEvent(rec, { id: "abs:rigveda:recurrence", standing: "earned", referent: "rigveda", basis: { step: 1 } }, { now: "t0" }).record;
  rec = recordEvent(rec, { id: "abs:rigveda:recurrence:v2", standing: "earned", referent: "rigveda", basis: { sources: 12 } }, { now: "t1" }).record;
  const s = supersede(rec, { id: "abs:rigveda:recurrence", by: "abs:rigveda:recurrence:v2-superseding", reason: "re-earn measured" }, { now: "t2" });
  assert.equal(s.ok, true);
  const events = epochsOf(s.record);
  assert.equal(events.length, 3, "the old entry is never removed");
  assert.equal(events[2].kind, "superseded");
  assert.equal(events[2].basis.supersedes, "abs:rigveda:recurrence");
  const mind = verdictsByStanding(s.record);
  assert.ok(!mind.earned.includes("abs:rigveda:recurrence"), "the superseded id no longer counts as retained");
  assert.ok(mind.earned.includes("abs:rigveda:recurrence:v2"));
});

test("supersede with an unknown target is a typed gap, never a silent no-op", () => {
  const r = recordEvent(emptyRecord(), { id: "x:seen", standing: "earned", basis: {} }).record;
  const bad = supersede(r, { id: "x:never-filed", by: "y", reason: "" });
  assert.equal(bad.ok, false);
  assert.equal(bad.refused, "unknown-target");
});

test("the retained mind: earned minus defeated, each with its standing", () => {
  let rec = emptyRecord();
  rec = recordEvent(rec, { id: "a:earned", standing: "earned", referent: "r", basis: {} }).record;
  rec = recordEvent(rec, { id: "a:cheap", standing: "withheld-candidate", referent: "r", basis: {} }).record;
  rec = recordEvent(rec, { id: "a:defeated", standing: "defeated-preserved", referent: "r", basis: {} }).record;
  const m = verdictsByStanding(rec);
  assert.deepEqual(m.earned, ["a:earned"]);
  assert.deepEqual(m.withheld, ["a:cheap"]);
  assert.deepEqual(m.defeated, ["a:defeated"]);
  assert.equal(m.retainedMind, 0);
});