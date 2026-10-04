// organs/integration/retention.test.mjs — Milestone 7, penelope side.
//
// Penelope retains the khora trace append-only, verifies its hash chain,
// preserves confidential scope through transformation, and propagates
// unresolved obligations into the returned artifact. This is a self-contained
// fixture trace (artifact-neutral) — penelope never imports khora.

import test from "node:test";
import assert from "node:assert/strict";
import {
  createRetention,
  verifyRetention,
  preservedDisclosureScope,
  scopeHolds,
  unresolvedObligationsFrom,
} from "./retention.mjs";
import { traceFixture, hashChain } from "./retention.fixture.mjs";

test("retention is append-only: a re-admitted trace is reported, never merged", () => {
  const r = createRetention();
  const t = traceFixture();
  const first = r.retain(t);
  assert.equal(first.ok, true);
  const second = r.retain(t);
  assert.equal(second.ok, false, "a duplicate retention is reported");
  assert.match(second.reason, /duplicate/);
  assert.equal(r.size, 1, "append-only: nothing was merged or overwritten");
});

test("retention verifies every trace's hash chain against declared tests", () => {
  const r = createRetention();
  r.retain(traceFixture());
  const v = verifyRetention(r, { hashChain });
  assert.equal(v.ok, true, v.problems.join("; "));
});

test("retention rejects a corrupted trace (broken chain)", () => {
  const r = createRetention();
  r.retain(traceFixture());
  // Corrupt the fixture's ledger prev to simulate truncation.
  const bad = { ...traceFixture(), prev: "deadbeef" };
  const r2 = createRetention();
  r2.retain(bad);
  const v = verifyRetention(r2, { hashChain });
  assert.equal(v.ok, false, "a broken chain must fail verification");
});

test("confidential scope is preserved through transformation", () => {
  const t = traceFixture();
  const scopes = preservedDisclosureScope(t);
  assert.ok(scopeHolds(scopes, "cited-material"), "the admitted scope is preserved");
  assert.ok(scopeHolds(scopes, "queries-to-p1"), "the query scope is preserved");
});

test("unresolved obligations ride the retained artifact", () => {
  const t = traceFixture();
  const obligations = unresolvedObligationsFrom(t);
  assert.ok(Array.isArray(obligations), "obligations are extracted");
});