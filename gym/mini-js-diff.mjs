#!/usr/bin/env node
// gym/mini-js-diff.mjs — the DIFFERENTIAL oracle test. Is the mini-js wall the
// ORACLE (whole-suite pass/fail) or the MOUTH? Give the loop a per-expression
// differential fact — the first diverging expression, its value, and V8's —
// and see if a 1.5B converges where the coarse oracle did not.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { append, readLog, materialize, heal } from "../organs/generation/program.mjs";
import { wired } from "../organs/generation/repair.mjs";
import { draw } from "../organs/generation/engine.mjs";

const W = process.argv[2];
const REL = "src/mini.mjs";
const NAME = "evaluate";

const BASE = `import { parse } from "acorn";

export function evaluate(node, env = {}) {
  throw new Error("not implemented: evaluate");
}

export function run(src) {
  return evaluate(parse(src, { ecmaVersion: 2022 }), { Math });
}
`;
const TEST = `import { test } from "node:test";
import assert from "node:assert/strict";
import { run } from "../src/mini.mjs";
const cases = ["1 + 2 * 3","(1 + 2) * 3","10 - 4 / 2","2 * (3 + 4) - 5","7 % 3","2 ** 10","-3 + 5","1 < 2","3 === 3","5 > 2 && 3 < 4","true && false","false || true","1 ? 'yes' : 'no'","'a' + 'b'","Math.max(2, 9)","Math.floor(3.7)"];
for (const src of cases) test(src, () => {
  let native, got;
  try { native = eval(src); } catch (e) { native = "THREW:" + e.constructor.name; }
  try { got = run(src); } catch (e) { got = "THREW:" + e.constructor.name; }
  assert.deepEqual(got, native, "DIFF run(" + JSON.stringify(src) + ") = " + JSON.stringify(got) + " expected " + JSON.stringify(native));
});
`;

async function main() {
  const logPath = path.join(os.tmpdir(), "minijs.diff.log.jsonl");
  fs.writeFileSync(logPath, "");
  append(logPath, { seq: 0, kind: "file", path: REL, code: BASE, source: "seed+field:acorn@node_modules" });
  fs.mkdirSync(path.join(W, "test"), { recursive: true });
  fs.writeFileSync(path.join(W, "test", "mini.test.mjs"), TEST);

  const repair = wired({
    dir: W, rel: REL, name: NAME,
    draw: (prompt) => draw(prompt, { maxTokens: 1200, model: "qwen2.5-coder:1.5b", kind: "build" }),
    huntFns: [],
  });
  const { rounds, projection, claims } = await heal({ logPath, dir: W, testCommand: "npm test", hunt: repair.hunt, invent: repair.invent, maxRounds: 8 });

  console.log("=== mini-js, DIFFERENTIAL oracle (per-expression diffs) ===");
  console.log("first diverging fact fed each round:");
  for (const g of repair.report.gary) console.log("  " + g.facts[0]);
  console.log("the log:");
  for (const c of claims) console.log(`  ${String(c.seq).padStart(2)} ${[c.kind, c.source ? "source=" + c.source : "", c.model ? "model=" + c.model : "", c.ok !== undefined ? "ok=" + c.ok : "", c.reason ? "(" + c.reason + ")" : ""].filter(Boolean).join(" ")}`);
  console.log(`verdict: ${projection.verdict?.ok ? "PASS" : "FAIL"} · rounds ${rounds.length}`);
  console.log("the evaluator this run:\n" + (projection.files[REL] ?? "").replace(/^/gm, "    "));
}

main();
