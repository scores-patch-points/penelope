// organs/generation/build-log.test.mjs — the log's two properties, shown.
// Run: node --test organs/generation/build-log.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { append, readLog, materialize, project, nextSeq, runBuild, selftest } from "./build-log.mjs";

const tmp = () => path.join(os.tmpdir(), `bl-${process.pid}-${Math.random().toString(36).slice(2)}.jsonl`);
const log = (rows) => rows.map((c, i) => ({ seq: i, ...c }));

test("selftest holds", () => assert.equal(selftest().ok, true));

test("materialize is PURE — same claims, same bytes (byte-equal replay)", () => {
  const claims = log([
    { kind: "unit", phase: "define", unit: "a", spec: "A" },
    { kind: "fill", unit: "a", source: "field", address: "corpus://a", code: "const a=()=>1;" },
  ]);
  const one = materialize(claims);
  const two = materialize(JSON.parse(JSON.stringify(claims)));
  assert.equal(one.code, two.code);
  // falsifying control: no clock leaks in — a claim's wall-time never changes the bytes
  const stamped = claims.map((c) => ({ ...c, at: "2099-01-01" }));
  assert.equal(materialize(stamped).code, one.code);
});

test("provenance: every unit names its source and address", () => {
  const p = materialize(log([
    { kind: "unit", phase: "define", unit: "a", spec: "A" },
    { kind: "fill", unit: "a", source: "hunt", address: "https://x/a.js", code: "x" },
    { kind: "unit", phase: "define", unit: "b", spec: "B" },
    { kind: "fill", unit: "b", source: "draw", model: "qwen2.5-coder:1.5b", code: "y" },
  ]));
  assert.deepEqual(p.provenance.map((x) => [x.unit, x.source, x.address, x.model]), [["a", "hunt", "https://x/a.js", null], ["b", "draw", null, "qwen2.5-coder:1.5b"]]);
});

test("a REFUSAL never enters the projection; an unfilled unit is incomplete", () => {
  const p = materialize(log([
    { kind: "unit", phase: "define", unit: "a", spec: "A" },
    { kind: "fill", unit: "a", source: "field", code: "good" },
    { kind: "unit", phase: "define", unit: "b", spec: "B" },
    { kind: "refusal", unit: "b", source: "draw", reason: "does not parse" },
  ]));
  assert.equal(p.complete, false);
  assert.equal(p.units.length, 1);
  assert.ok(!p.code.includes("goodgood")); // no invented fill
  assert.equal(p.refusals, 1);
});

test("resume is APPEND — a later fill supersedes the earlier (last wins)", () => {
  const first = log([
    { kind: "unit", phase: "define", unit: "a", spec: "A" },
    { kind: "fill", unit: "a", source: "draw", code: "WRONG" },
  ]);
  const more = [...first, { seq: first.length, kind: "fill", unit: "a", source: "field", address: "corpus://a", code: "RIGHT" }];
  assert.equal(materialize(first).code, "WRONG");
  assert.equal(materialize(more).code, "RIGHT");
  // the append is monotone: the first projection is a prefix-state of the log, never rewritten
  assert.equal(materialize(first).code, materialize(more.slice(0, first.length)).code);
});

test("runBuild: field → hunt → mouth, each candidate logged; the artifact is the projection; test recorded", async () => {
  const lp = tmp();
  const calls = [];
  const units = [{ name: "a", spec: "A" }, { name: "b", spec: "B" }, { name: "c", spec: "C" }];
  const { artifact, verdict, log: rows } = await runBuild({
    units, logPath: lp,
    field: (u) => { calls.push("field:" + u.name); return u.name === "a" ? { code: "code-a", address: "corpus://a" } : null; },
    hunt: (u) => { calls.push("hunt:" + u.name); return u.name === "b" ? { code: "code-b", address: "https://x/b.js" } : null; },
    draw: (u) => { calls.push("draw:" + u.name); return { text: "code-c", reason: "residue", model: "qwen2.5-coder:1.5b" }; },
    gate: (u, code) => (code && code.startsWith("code-") ? { ok: true, reason: "ok" } : { ok: false, reason: "no code" }),
    assemble: (joined, order) => joined + `\nexport { ${order.join(", ")} };`,
    test: (code, us) => ({ ok: code.includes("code-a") && code.includes("code-b") && code.includes("code-c"), reason: "whole module" }),
  });
  assert.equal(verdict.ok, true);
  // mouth-last: b was hunted only after the field missed; c reached the mouth only after both missed
  assert.deepEqual(calls.filter((c) => c.startsWith("field")), ["field:a", "field:b", "field:c"]);
  assert.ok(calls.indexOf("hunt:b") > calls.indexOf("field:b"));
  assert.ok(calls.indexOf("draw:c") > calls.indexOf("hunt:c"));
  assert.equal(artifact.complete, true);
  assert.deepEqual(artifact.units.map((u) => u.source), ["field", "hunt", "draw"]);
  assert.equal(artifact.code, "code-a\n\ncode-b\n\ncode-c\nexport { a, b, c };");
  // the log holds the whole movement; re-projecting it reproduces the artifact byte-for-byte
  assert.deepEqual(rows.filter((r) => r.kind === "fill").map((r) => r.source), ["field", "hunt", "draw"]);
  assert.equal(project(lp, { assemble: (j, o) => j + `\nexport { ${o.join(", ")} };` }).code, artifact.code);
  fs.unlinkSync(lp);
});

test("runBuild: a unit nothing satisfies is a NAMED GAP, never invented", async () => {
  const lp = tmp();
  const { artifact, log: rows } = await runBuild({
    units: [{ name: "x", spec: "X" }], logPath: lp,
    field: () => ({ code: "bad", address: "corpus://x" }),
    gate: () => ({ ok: false, reason: "settle failed" }),
    test: () => ({ ok: false, reason: "red" }),
  });
  assert.equal(artifact.complete, false);
  assert.ok(rows.some((r) => r.kind === "refusal" && r.source === "field"));
  assert.ok(rows.some((r) => r.kind === "unfilled" && r.unit === "x"));
  assert.ok(!artifact.code.includes("bad"));
  fs.unlinkSync(lp);
});
