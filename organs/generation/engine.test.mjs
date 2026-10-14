// organs/generation/engine.test.mjs — the spine's own edges, shown with a stub adapter.
// (no model, no network: every adapter hook is a local function)
// Run: node --test organs/generation/engine.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { arrange } from "./engine.mjs";

const quiet = async (fn) => {
  const log = console.log;
  console.log = () => {};
  try { return await fn(); } finally { console.log = log; }
};
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "engine-test-"));

// A stub adapter whose field fill is "BROKEN" and whose test wants "FIXED".
const stub = (overrides = {}) => ({
  kind: "t",
  readUnits: () => [{ name: "a", spec: "s" }],
  autofill: () => ({ code: "BROKEN", address: "x" }),
  snip: (v) => v,
  probeUnit: () => ({ ok: true }),
  testUnits: (code) => (code.includes("FIXED") ? { ok: true, reason: "ok" } : { ok: false, reason: "needs-fix", detail: "d" }),
  toDocument: () => "<html/>",
  refineTransforms: [{ name: "fix", op: "NUL", deps: [], apply: (s) => s.replace("BROKEN", "FIXED") }],
  ...overrides,
});

test("a refinement that converges returns the refined verdict and the refined bytes (D13: was a const-reassignment TypeError)", async () => {
  const out = tmp();
  const r = await quiet(() => arrange({ task: "t", args: { out }, adapter: stub(), context: { noModel: true } }));
  assert.equal(r.verdict.ok, true, "the verdict is the post-refinement verdict");
  assert.equal(r.verdict.reason, "ok");
  assert.match(r.code, /FIXED/, "the returned artifact is the shipped (refined) bytes, not the pre-refine join");
  assert.doesNotMatch(r.code, /BROKEN/);
  const eot = JSON.parse(fs.readFileSync(path.join(out, `${r.slug}.eot.json`), "utf8"));
  assert.equal(eot.swarm.verdict.ok, true);
  const stages = eot.provenance.events.map((e) => e.stage);
  assert.ok(stages.includes("refine") && stages.includes("verify"), "refine and verify are both on the ledger");
  assert.match(fs.readFileSync(path.join(out, `${r.slug}.folded.js`), "utf8"), /FIXED/);
});

test("negative control: a refinement that cannot converge ends in a failing verdict, never a throw, never a fabricated pass", async () => {
  const out = tmp();
  const r = await quiet(() => arrange({
    task: "t", args: { out }, context: { noModel: true },
    adapter: stub({ refineTransforms: [{ name: "noop", op: "NUL", deps: [], apply: (s) => s }] }),
  }));
  assert.equal(r.verdict.ok, false);
  assert.equal(r.verdict.reason, "needs-fix");
  assert.match(r.code, /BROKEN/);
});

test("positive control: a unit that passes its test needs no refinement and records none", async () => {
  const out = tmp();
  const r = await quiet(() => arrange({
    task: "t", args: { out }, context: { noModel: true },
    adapter: stub({ autofill: () => ({ code: "FIXED already", address: "x" }) }),
  }));
  assert.equal(r.verdict.ok, true);
  const eot = JSON.parse(fs.readFileSync(path.join(out, `${r.slug}.eot.json`), "utf8"));
  assert.ok(!eot.provenance.events.some((e) => e.stage === "refine"), "no refine event when the first test passed");
});
