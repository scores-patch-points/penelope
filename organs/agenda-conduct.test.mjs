import { test } from "node:test";
import assert from "node:assert/strict";
import { intentOf, artifactOf, normalizeOutcome, createAgendaConduct, defaultRun } from "./agenda-conduct.mjs";

const purpose = (extra = {}) => ({ id: "v", op: "INS", grain: "Figure", cell: "INS·Figure", kind: "missing", about: "the lock file", detail: "ORGANS.lock is empty", target: null, ...extra });

test("intentOf takes the void's about and measured detail, never invents", () => {
  assert.equal(intentOf(purpose()), "the lock file — ORGANS.lock is empty");
  assert.equal(intentOf({ about: "x", detail: "" }), "x");
  assert.equal(intentOf({ id: "v", detail: "d" }), "d");
  assert.equal(intentOf({ id: "v" }), "v");
  assert.equal(intentOf({ about: "a — b", detail: "b" }), "a — b");
});

test("artifactOf routes prose by kind/cell, code otherwise", () => {
  assert.equal(artifactOf(purpose()), "code");
  assert.equal(artifactOf({ kind: "prose" }), "prose");
  assert.equal(artifactOf({ artifact: "overview" }), "overview");
  assert.equal(artifactOf({ op: "SYN", grain: "Pattern" }), "prose");
});

test("STAGE 12: a pass over zero rows is unmeasured — shown, never measured; a measured pass stays measured", () => {
  const zero = normalizeOutcome({ ok: true, status: "verified", evidence: { verdict: { ok: true, reason: "spec-conformant", rows: 0 } } });
  assert.equal(zero.ok, true);
  assert.equal(zero.unmeasured, true);
  assert.match(zero.evidence, /gate unmeasured \(0 rows\)/);
  assert.match(zero.rule, /shown, not measured/);
  const measured = normalizeOutcome({ ok: true, status: "verified", evidence: { verdict: { ok: true, reason: "spec-conformant", rows: 3 } } });
  assert.equal(measured.unmeasured, null);
  assert.doesNotMatch(measured.evidence, /unmeasured/);
  const legacy = normalizeOutcome({ ok: true, status: "verified", evidence: { verdict: { ok: true, reason: "spec-conformant" } } });
  assert.equal(legacy.unmeasured, null); // no row count reported = today's reading
});

test("normalizeOutcome: a pass reads the gate's own reason, not the draft's word", () => {
  const out = normalizeOutcome({ schema: "CodePipeline@1", ok: true, status: "verified", artifact: { kind: "code", value: "export const x = 1;\n" }, evidence: { verdict: { ok: true, reason: "export-surface" } } });
  assert.equal(out.ok, true);
  assert.equal(out.detail, null);
  assert.match(out.evidence, /CodePipeline@1: verified/);
  assert.match(out.evidence, /gate=export-surface/);
  assert.match(out.rule, /the gate decided: export-surface/);
  assert.deepEqual(out.pathos, []);
});

test("normalizeOutcome: a failure becomes a held void with the gate's detail", () => {
  const out = normalizeOutcome({ schema: "CodePipeline@1", ok: false, status: "gate_unmet", error: "behavioral-test", evidence: { verdict: { ok: false, reason: "behavioral-test", detail: "expected 2 got 3" } } });
  assert.equal(out.ok, false);
  assert.equal(out.detail, "behavioral-test"); // result.error wins: the pipeline's own word
  assert.match(out.evidence, /not-ok|gate_unmet/);
});

test("normalizeOutcome carries a pathos marker verbatim when the pipeline emits one, and never invents one", () => {
  const withPathos = normalizeOutcome({ ok: false, status: "refused", pathos: [{ on: "refusal", change: "leave-alone" }] });
  assert.deepEqual(withPathos.pathos, [{ on: "refusal", change: "leave-alone" }]);
  assert.deepEqual(normalizeOutcome({ ok: false, status: "x" }).pathos, []);
});

test("MATERIALIZE: a successful run with a target writes the artifact and the evidence says so", async () => {
  const written = [];
  const conduct = createAgendaConduct({
    run: async () => ({ ok: true, status: "verified", artifact: { value: "export const x = 1;\n" }, evidence: { verdict: { ok: true, reason: "spec-conformance" } } }),
    write: (file, text) => written.push([file, text]),
  });
  const out = await conduct(purpose({ target: "/tmp/out.mjs" }));
  assert.equal(out.ok, true);
  assert.equal(written.length, 1);
  assert.equal(written[0][0], "/tmp/out.mjs");
  assert.equal(written[0][1], "export const x = 1;\n");
  assert.match(out.evidence, /materialized \/tmp\/out\.mjs/);
});

test("FALSIFY: no target, no write; a failed run, no write — materialization is never invented", async () => {
  const written = [];
  const conduct = createAgendaConduct({
    run: async () => ({ ok: true, artifact: { value: "x" } }),
    write: (file, text) => written.push([file, text]),
  });
  await conduct(purpose()); // no target in the purpose
  assert.equal(written.length, 0);
  const failing = createAgendaConduct({
    run: async () => ({ ok: false, status: "gate_unmet", artifact: { value: "x" } }),
    write: (file, text) => written.push([file, text]),
  });
  await failing(purpose({ target: "/tmp/out.mjs" }));
  assert.equal(written.length, 0);
});

test("createAgendaConduct is the injected join: the ladder's purpose in, the contract out", async () => {
  const calls = [];
  const conduct = createAgendaConduct({ run: async (p) => { calls.push(p.id); return { ok: true, status: "verified", artifact: { value: "ok" }, evidence: { verdict: { reason: "spec-conformance" } } }; } });
  const out = await conduct(purpose());
  assert.deepEqual(calls, ["v"]);
  assert.equal(out.ok, true);
  assert.match(out.rule, /spec-conformance/);
});

test("defaultRun routes prose to weave and code to the pipeline without touching the network at import", async () => {
  assert.equal(typeof defaultRun, "function");
  // we only assert the routing decision, never call the heavy path here
  const { artifactOf } = await import("./agenda-conduct.mjs");
  assert.equal(artifactOf({ kind: "prose" }), "prose");
  assert.equal(artifactOf({ kind: "missing" }), "code");
});
