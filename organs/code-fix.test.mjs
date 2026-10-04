// organs/code-fix.test.mjs — the loop over the REAL spine: the gate is the
// code adapter's testUnits or a real behavior falsifier, the lint is janus's
// lintGfp + the khora's code-goal-lint, and only the DRAW is faked (the mouth
// lane is injected the way engine tests inject a lane).

import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildFixPrompt, extractModule, fixCode, reasonLint, evaluateWithGateScript } from "./code-fix.mjs";

const ADDER = [{ name: "add", spec: "add(a, b) returns the sum a + b" }];

test("a draft that passes the real adapter gate lands", async () => {
  const infer = async () => ({ text: "function add(a, b) { return a + b; }" });
  const res = await fixCode({ brief: "write a module exporting add(a, b)", units: ADDER, infer });
  assert.equal(res.ok, true);
  assert.equal(res.executor, "penelope-mouth");
  assert.equal(res.attempts.length, 1);
  assert.match(res.code, /export \{ add \};/);
});

test("a draft that fails a real behavior gate is sharpened and retried, never re-prompted louder", async () => {
  const draws = [
    "function add(a, b) { return a; }",
    "function add(a, b) { return a + b; }",
  ];
  let i = 0;
  const infer = async () => ({ text: draws[i++] });

  const gate = async (code) => {
    const dir = await mkdtemp(path.join(tmpdir(), "code-fix-gate-"));
    try {
      const file = path.join(dir, "m.mjs");
      await writeFile(file, code, "utf8");
      const mod = await import(pathToFileURL(file).href);
      const ok = mod.add(2, 3) === 5 && mod.add(-1, 1) === 0;
      return { ok, why: ok ? "exit 0" : "add(2,3) must be 5, got " + mod.add(2, 3) };
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  };

  const res = await fixCode({ brief: "write a module exporting add(a, b)", goals: [{ end1: "add(2,3)", label: "returns", end2: "5" }], units: ADDER, gate, infer, maxAttempts: 2 });
  assert.equal(res.ok, true);
  assert.equal(res.attempts.length, 2);
  assert.equal(res.attempts[0].ok, false);
  assert.equal(res.attempts[1].ok, true);
  assert.ok(res.scars.length >= 1, "the failed draft must leave a sharpened atom");
});

test("a draft that never satisfies the gate is a gate_unmet finding, never a fabricated pass", async () => {
  const infer = async () => ({ text: "function add(a, b) { return a; }" });
  const gate = async () => ({ ok: false, why: "add(2,3) must be 5" });
  const res = await fixCode({ brief: "write add", gate, infer, maxAttempts: 3 });
  assert.equal(res.ok, false);
  assert.equal(res.reason, "gate_unmet");
  assert.equal(res.attempts.length, 3);
});

test("reasonLint produces a typed finding and a sharpenable atom when the pass contradicts the goal", () => {
  const r = reasonLint({
    goals: [{ end1: "add(2,3)", label: "returns", end2: "5" }],
    pass: { end1: "add(2,3)", label: "returns", end2: "2" },
  });
  assert.equal(r.ok, false);
  assert.ok(r.findings.some((f) => f.kind === "expired_obligation"));
  assert.ok(r.clauses.some((c) => /add\(2,3\).*returns 5/.test(c)), "the atom must name the wanted value");
});

test("extractModule strips fences and keeps raw code", () => {
  assert.equal(extractModule("```js\nexport const x = 42;\n```"), "export const x = 42;");
  assert.equal(extractModule("  export const x = 42;  "), "export const x = 42;");
});

test("buildFixPrompt carries the brief, the current source, and the refusal hints", () => {
  const p = buildFixPrompt({ brief: "Fix the rounding.", target: "function r(x){return Math.round(x*100)/100;}", gateHints: ["moneyRound(1.005) returns 1.01"] });
  assert.match(p, /Fix the rounding\./);
  assert.match(p, /CURRENT SOURCE:/);
  assert.match(p, /moneyRound\(1\.005\) returns 1\.01/);
  assert.match(p, /Preserve every exported name/);
});

test("evaluateWithGateScript runs a real gate script against the candidate", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "code-fix-gate-"));
  try {
    const gatePath = path.join(dir, "gate.mjs");
    await writeFile(
      gatePath,
      `import { pathToFileURL } from "node:url";\nimport assert from "node:assert/strict";\nconst m = await import(pathToFileURL(process.argv[2]).href);\nassert.strictEqual(m.add(2, 3), 5);\nconsole.log("GATE PASS");\n`,
      "utf8",
    );
    const evaluate = evaluateWithGateScript({ gatePath });
    const pass = await evaluate("export function add(a,b){ return a+b; }");
    assert.equal(pass.ok, true);
    const fail = await evaluate("export function add(a,b){ return a; }");
    assert.equal(fail.ok, false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});