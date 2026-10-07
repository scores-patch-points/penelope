#!/usr/bin/env node
// gym/mini-js-ast.mjs — THE CRAZY ONE, done right. A local 1.5B writes a
// working JavaScript evaluator. It is given FACTS, never prohibitions:
//   - the AST LAW, read mechanically from the field (acorn parsing samples),
//   - the BEHAVIOUR fact, read from the differential oracle (V8 itself).
// Gary frames the draw (facts, ask last); the snip takes the atom; V8 judges.
import { execFileSync } from "node:child_process";
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

/** the AST LAW, read mechanically from the field (acorn), never hand-typed */
function astLaw() {
  const builder = `
import { parse } from "acorn";
const samples = ["1 + 2 * 3","(1+2)*3","-3","1 < 2","3 === 3","true && false","1 ? 'a' : 'b'","'a' + 'b'","Math.max(2,9)","x"];
const seen = new Map();
const skip = new Set(["start","end","type","loc","range","sourceType","raw"]);
const walk = (n) => { if (!n || typeof n !== "object") return; if (n.type) seen.set(n.type, Object.keys(n).filter(k=>!skip.has(k))); for (const k of Object.keys(n)) { const v = n[k]; if (v && typeof v === "object") Array.isArray(v) ? v.forEach(walk) : walk(v); } };
for (const s of samples) walk(parse(s, { ecmaVersion: 2022 }));
console.log([...seen].map(([t,k])=>t+"{"+k.join(",")+"}").join("  "));
`;
  return "acorn AST node types and their fields: " + execFileSync("node", ["--input-type=module", "-e", builder], { cwd: W, encoding: "utf8" }).trim();
}

async function main() {
  const logPath = path.join(os.tmpdir(), "minijs.ast.log.jsonl");
  fs.writeFileSync(logPath, "");
  append(logPath, { seq: 0, kind: "file", path: REL, code: BASE, source: "seed+field:acorn@node_modules" });
  fs.mkdirSync(path.join(W, "test"), { recursive: true });
  fs.writeFileSync(path.join(W, "test", "mini.test.mjs"), TEST);

  const law = astLaw();
  const repair = wired({
    dir: W, rel: REL, name: NAME,
    draw: (prompt) => draw(prompt, { maxTokens: 1200, model: "qwen2.5-coder:1.5b", kind: "build" }),
    huntFns: [],
    specFacts: [`The evaluator is called with an acorn AST node; node.type names the kind. ${law}`],
  });
  const { rounds, projection, claims } = await heal({ logPath, dir: W, testCommand: "npm test", hunt: repair.hunt, invent: repair.invent, maxRounds: 6 });

  console.log("=== THE CRAZY ONE — a 1.5B builds a JavaScript evaluator (V8 judges) ===");
  console.log("the AST law handed over (from acorn): " + law);
  console.log("\nthe facts fed each round:");
  for (const g of repair.report.gary) console.log("  · " + g.facts[0]);
  console.log("\nthe log:");
  for (const c of claims) console.log(`  ${String(c.seq).padStart(2)} ${[c.kind, c.model ? "model=" + c.model : "", c.ok !== undefined ? "ok=" + c.ok : "", c.reason ? "(" + c.reason + ")" : ""].filter(Boolean).join(" ")}`);
  console.log(`\nthe real tests (vs native eval): ${projection.verdict?.ok ? "PASS" : "FAIL"} · rounds ${rounds.length}`);
  console.log("\nthe evaluator the local model produced:\n" + (projection.files[REL] ?? "").replace(/^/gm, "    "));
}

main();
