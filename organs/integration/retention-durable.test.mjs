// organs/integration/retention-durable.test.mjs — the durable retention restart
// test (Milestone 7).
//
// Restart semantics: a restart reconciles receipt before retry. Traces already
// retained are NOT re-appended on reopen; a duplicate re-admission is reported;
// the hash chain of every retained trace verifies on open; and a torn or
// corrupted durable store is detected on open, never silently trusted.

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDurableRetention } from "./retention-durable.mjs";
import { verifyRetention, preservedDisclosureScope } from "./retention.mjs";
import { traceFixture, hashChain } from "./retention.fixture.mjs";

function tempFile(t) {
  const dir = mkdtempSync(join(tmpdir(), "penelope-retention-"));
  const file = join(dir, "retention.jsonl");
  t.after(() => { try { rmSync(dir, { recursive: true, force: true }); } catch {} });
  return file;
}

test("a retained trace survives a restart: reopen shows the same record", (t) => {
  const file = tempFile(t);
  const first = createDurableRetention({ file });
  const trace = traceFixture();
  assert.ok(first.retain(trace).ok, "first session retains the trace");

  // Simulate a restart: a brand-new process reopens the SAME file.
  const second = createDurableRetention({ file });
  assert.equal(second.size, 1, "the trace survived the restart");
  const stored = second.byId(trace.sessionId);
  assert.ok(stored, "the trace is present by id after restart");
  assert.equal(stored.sessionId, trace.sessionId);
  // The durable record is byte-faithful: no collapse across the restart.
  assert.equal(JSON.stringify(stored.entries), JSON.stringify(trace.entries), "entries survive the restart byte-identically");
});

test("a restart does NOT re-append already-retained traces (no duplicate action)", (t) => {
  const file = tempFile(t);
  const first = createDurableRetention({ file });
  assert.ok(first.retain(traceFixture()).ok);

  const second = createDurableRetention({ file });
  assert.equal(second.size, 1, "reopen loads exactly the retained set, nothing re-appended");
  // A re-admission of the SAME trace_id is reported as a duplicate, never merged.
  const dup = second.retain(traceFixture());
  assert.equal(dup.ok, false, "a duplicate re-admission is reported");
  assert.match(dup.reason, /duplicate/);
  assert.equal(second.size, 1, "append-only: the duplicate did not double the record");
});

test("every retained trace's hash chain verifies on the durable store", (t) => {
  const file = tempFile(t);
  const first = createDurableRetention({ file });
  first.retain(traceFixture());

  const second = createDurableRetention({ file });
  const v = verifyRetention(second, { hashChain });
  assert.equal(v.ok, true, "the hash chain of every retained trace verifies after restart");
  assert.deepEqual(v.problems, []);
});

test("confidential disclosure scope survives the durable restart", (t) => {
  const file = tempFile(t);
  const first = createDurableRetention({ file });
  first.retain(traceFixture());

  const second = createDurableRetention({ file });
  const scopes = preservedDisclosureScope(second.byId("session-retention"));
  assert.ok(scopes.includes("cited-material"), "the admitted scope survived the restart");
  assert.ok(scopes.includes("queries-to-p1"), "the query scope survived the restart");
});

test("a torn durable line is detected on open, never silently trusted", (t) => {
  const file = tempFile(t);
  const first = createDurableRetention({ file });
  first.retain(traceFixture());
  // Corrupt the durable store with a torn line (simulating a crash mid-append).
  writeFileSync(file, readFileSync(file, "utf8") + '{"schema":"TraceRetentionEntry@1",', "utf8");

  assert.throws(
    () => createDurableRetention({ file }),
    /torn line/,
    "a torn line must be detected on open, not silently skipped",
  );
});

test("a durable retention is append-only across many sessions", (t) => {
  const file = tempFile(t);
  let size = 0;
  for (let i = 0; i < 3; i += 1) {
    const r = createDurableRetention({ file });
    size += 1;
    // Each session retains ONE trace with a distinct sessionId.
    const base = traceFixture();
    const distinct = { ...base, sessionId: `session-retention-${i}`, entries: base.entries.map((e, j) => ({ ...e, seq: j })) };
    assert.ok(r.retain(distinct).ok, `session ${i} retains its trace`);
    assert.equal(r.size, size, `session ${i} sees ${size} retained traces`);
  }
  const final = createDurableRetention({ file });
  assert.equal(final.size, 3, "three sessions' traces all survive the final reopen");
});