#!/usr/bin/env node
// gym/mini-js-demo.mjs — THE CRAZY ONE. A local 1.5B model builds a working
// JavaScript evaluator: acorn (a real parser, the FIELD) does the parsing, the
// MOUTH draws only the evaluator, and the judge is V8 ITSELF — every case is
// compared to native eval().
//
//   node gym/mini-js-demo.mjs <workspace-with-acorn>
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
const cases = ["1 + 2 * 3","(1 + 2) * 3","10 - 4 / 2","2 * (3 + 4) - 5","1 + 2 + 3 + 4","7 % 3","2 ** 10","-3 + 5","1 < 2","3 === 3","5 > 2 && 3 < 4","true && false","false || true","1 ? 'yes' : 'no'","'a' + 'b'","Math.max(2, 9)","Math.floor(3.7)","Math.abs(-4)","2 + 3 === 5","10 - 2 - 3"];
for (const src of cases) test(src, () => assert.deepEqual(run(src), eval(src)));
`;

async function main() {
  const logPath = path.join(os.tmpdir(), "minijs.program.log.jsonl");
  fs.writeFileSync(logPath, "");
  append(logPath, { seq: 0, kind: "file", path: REL, code: BASE, source: "seed+field:acorn@node_modules" });
  fs.mkdirSync(path.join(W, "test"), { recursive: true });
  fs.writeFileSync(path.join(W, "test", "mini.test.mjs"), TEST);

  const repair = wired({
    dir: W, rel: REL, name: NAME,
    draw: (prompt) => draw(prompt, { maxTokens: 900, model: "qwen2.5-coder:1.5b", kind: "build" }),
    huntFns: [], // no field for the evaluator — it is the residue, and the mouth must write it
  });
  const { rounds, projection, claims } = await heal({ logPath, dir: W, testCommand: "npm test", hunt: repair.hunt, invent: repair.invent, maxRounds: 4 });

  console.log("=== THE CRAZY ONE — a 1.5B builds a JavaScript evaluator (V8 is the judge) ===");
  console.log("Gary's read of the draw (facts, no prohibition):");
  for (const g of repair.report.gary) console.log("  findings:", g.findings.join(",") || "clean", "| refused:", g.refused.join(",") || "none", "| fact:", g.facts[0]);
  console.log("the log:");
  for (const c of claims) console.log(`  ${String(c.seq).padStart(2)} ${[c.kind, c.path ?? "", c.source ? "source=" + c.source : "", c.model ? "model=" + c.model : "", c.ok !== undefined ? "ok=" + c.ok : "", c.reason ? "(" + c.reason + ")" : ""].filter(Boolean).join(" ")}`);
  console.log(`the real tests (vs native eval): ${projection.verdict?.ok ? "PASS" : "FAIL"} · rounds ${rounds.length}`);
  console.log("the drawn evaluator:\n" + (projection.files[REL] ?? "").replace(/^/gm, "    "));
}

main();
