#!/usr/bin/env node
// gym/build-calc-demo.mjs — A COMPLICATED BUILD, projected from the log.
//
// Target: a small expression evaluator (6 chained units) with a real
// behavioural test suite run against the PROJECTED artifact.
//
//   field  — a corpus of real, addressed implementations, snipped by name
//            (tokenize, precedence, toRPN, evalRPN) — most of the code.
//   hunt   — a real search of the machine's own codebase (rg) for the unit;
//            a miss is a logged refusal, never an invention.
//   mouth  — the residue the field and hunt could not hold (calculate,
//            evaluateWithVars), drawn from the completion anchor.
//
// Every byte is one append-only claim; the artifact is materialize(log); the
// real test (node --test) is run against the projected bytes and its verdict
// appended. Nothing is written except by folding the log.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { snip, probeUnit, assemble, mouthFragment } from "../organs/generation/adapters/code.mjs";
import { draw } from "../organs/generation/engine.mjs";
import { runBuild, project } from "../organs/generation/build-log.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const MODEL = process.env.DEMO_MODEL ?? "qwen2.5-coder:1.5b";

// ── the void, defined ───────────────────────────────────────────────────────
const units = [
  { name: "tokenize", spec: "split an arithmetic expression into numbers and the operators + - * / ( )" },
  { name: "precedence", spec: "operator precedence: +,- = 1; *,/ = 2; otherwise 0" },
  { name: "toRPN", spec: "shunting-yard: infix token array -> reverse-Polish array" },
  { name: "evalRPN", spec: "evaluate a reverse-Polish token array to a number" },
  { name: "calculate", spec: "calculate an infix expression string: evalRPN(toRPN(tokenize(expr)))" },
  { name: "evaluateWithVars", spec: "substitute variables {name: number} into the expression, then calculate" },
];

// ── the FIELD: a corpus of real, addressed implementations ──────────────────
const LIBRARY = `// library.mjs — the corpus (real, addressed).
export function tokenize(expr) {
  const out = [];
  const re = /\\s*(\\d+|[()+\\-*/])/g;
  let m;
  while ((m = re.exec(expr)) !== null) out.push(/^\\d+$/.test(m[1]) ? Number(m[1]) : m[1]);
  return out;
}
export function precedence(op) {
  if (op === "+" || op === "-") return 1;
  if (op === "*" || op === "/") return 2;
  return 0;
}
export function toRPN(tokens) {
  const out = [];
  const ops = [];
  for (const t of tokens) {
    if (typeof t === "number") out.push(t);
    else if (t === "(") ops.push(t);
    else if (t === ")") { while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop()); ops.pop(); }
    else { while (ops.length && precedence(ops[ops.length - 1]) >= precedence(t)) out.push(ops.pop()); ops.push(t); }
  }
  while (ops.length) out.push(ops.pop());
  return out;
}
export function evalRPN(rpn) {
  const st = [];
  for (const t of rpn) {
    if (typeof t === "number") { st.push(t); continue; }
    const b = st.pop();
    const a = st.pop();
    st.push(t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : a / b);
  }
  return st.pop();
}
export function calculate(expr) {
  return evalRPN(toRPN(tokenize(expr)));
}
export function evaluateWithVars(expr, vars) {
  let e = expr;
  for (const k of Object.keys(vars)) e = e.split(k).join("(" + vars[k] + ")");
  return calculate(e);
}
`;
const FIELD_ADDR = "corpus://library.mjs";

const ensureExport = (code) => (code && !/^\s*export\s/.test(code) ? "export " + code : code);
const field = (u) => {
  const c = snip(LIBRARY, u.name);
  if (!c) return null;
  const i = LIBRARY.indexOf(`function ${u.name}(`);
  return { code: ensureExport(c), address: `${FIELD_ADDR}#${i}` };
};
// the HUNT: search the machine's own codebase (rg) for a real implementation.
const huntRoots = [path.join(ROOT, "organs"), path.join(ROOT, "..", "khora", "native"), path.join(ROOT, "..", "ai-code-harness")];
const hunt = (u) => {
  for (const rootDir of huntRoots) {
    if (!fs.existsSync(rootDir)) continue;
    let hit = "";
    try { hit = execSync(`rg -l --no-messages "function ${u.name}\\(" ${JSON.stringify(rootDir)} | head -1`, { encoding: "utf8" }).trim(); } catch { hit = ""; }
    if (!hit) continue;
    const text = fs.readFileSync(hit, "utf8");
    const c = snip(text, u.name);
    if (c) return { code: ensureExport(c), address: `${hit.replace(ROOT + "/", "")}#function ${u.name}` };
  }
  return null;
};
const mouth = async (u) => {
  const text = await draw(mouthFragment(u, u.spec), { maxTokens: 240, model: MODEL, kind: "build" });
  const c = snip(text, u.name);
  return c ? { code: ensureExport(c), model: MODEL } : null;
};
const gate = (u, code) => (code ? probeUnit(code, u) : { ok: false, reason: "no code" });
const assembleFn = (joined, order) => assemble(joined, order.map((name) => ({ name })));

// ── the REAL test: a behavioural suite run against the projected bytes ───────
const SUITE = `import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate, evaluateWithVars } from "./calc.mjs";
const calcCases = [["1+2*3",7],["(1+2)*3",9],["10-4/2",8],["2*(3+4)-5",9],["8/2/2",2],["1+2+3+4",10],["2*3*4",24],["(2+3)*(4-1)",15],["100/5/2",10],["42",42],["(1+(2*3))-4",3],["9-8+2",3]];
for (const [e, v] of calcCases) test("calculate " + e, () => assert.equal(calculate(e), v));
const varCases = [["x+1", { x: 5 }, 6], ["2*y", { y: 3 }, 6], ["a*b+1", { a: 2, b: 4 }, 9]];
for (const [e, vars, v] of varCases) test("evaluateWithVars " + e, () => assert.equal(evaluateWithVars(e, vars), v));
`;
function runSuite(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "calc-build-"));
  fs.writeFileSync(path.join(dir, "calc.mjs"), code);
  fs.writeFileSync(path.join(dir, "calc.test.mjs"), SUITE);
  let out = "";
  try { out = execSync("node --test calc.test.mjs", { cwd: dir, encoding: "utf8", stdio: "pipe" }); } catch (e) { out = String(e.stdout ?? "") + String(e.stderr ?? ""); }
  const pass = Number((out.match(/^# pass (\d+)/m) ?? out.match(/ℹ pass (\d+)/) ?? [])[1] ?? 0);
  const fail = Number((out.match(/^# fail (\d+)/m) ?? out.match(/ℹ fail (\d+)/) ?? [])[1] ?? 0);
  return { ok: fail === 0 && pass > 0, reason: `node --test: ${pass} pass / ${fail} fail`, rows: pass + fail, dir };
}

async function main() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 1) if (process.argv[i].startsWith("--")) args[process.argv[i].slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true;
  const outDir = path.resolve(args.out ?? path.join(os.tmpdir(), "build-calc-demo"));
  fs.mkdirSync(outDir, { recursive: true });
  const logPath = path.join(outDir, "build.log.jsonl");

  const drawFn = args.nomodel ? null : mouth; // --nomodel: ZERO model draws — the field and hunt must carry it
  const { artifact, verdict, log } = await runBuild({ units, logPath, field, hunt, draw: drawFn, gate, assemble: assembleFn, test: (code) => runSuite(code) });
  const replay = project(logPath, { assemble: assembleFn });
  const bySource = artifact.units.reduce((a, u) => ((a[u.source] = (a[u.source] ?? 0) + 1), a), {});

  const lines = [];
  const P = (s = "") => lines.push(s);
  P(`=== BUILD: ${units.length} units, append-only log (${log.length} claims) ===\n`);
  for (const c of log) {
    const bits = Object.entries(c).filter(([k]) => k !== "schema" && k !== "seq" && k !== "code").map(([k, v]) => `${k}=${typeof v === "string" && v.length > 52 ? JSON.stringify(v.slice(0, 49) + "…") : JSON.stringify(v)}`);
    P(`  ${String(c.seq).padStart(2)} ${c.kind.padEnd(8)} ${bits.join(" ")}`);
  }
  P(`\n=== THE PROJECTION (materialize(log)) ===`);
  P(`  complete: ${artifact.complete} · by source: ${Object.entries(bySource).map(([k, v]) => `${k} ${v}`).join(" · ")} (mouth-last)`);
  for (const u of artifact.units) P(`    ${u.unit.padEnd(16)} <- ${u.source}${u.address ? "  " + u.address : ""}${u.model ? "  model=" + u.model : ""}`);
  P(`  refusals: ${artifact.refusals}`);
  P(`\n=== THE ARTIFACT (${Buffer.byteLength(artifact.code)} bytes) ===`);
  P(artifact.code.replace(/^/gm, "  "));
  P(`\n=== THE TEST (node --test on the projected bytes) ===`);
  P(`  ${verdict.ok ? "PASS" : "FAIL"} — ${verdict.reason}`);
  P(`\n=== THE FOLD PROPERTY ===`);
  P(`  project(log).code === artifact.code :  ${replay.code === artifact.code ? "MATCH (byte-equal)" : "MISMATCH"}`);

  const text = lines.join("\n");
  console.log(text);
  fs.writeFileSync(path.join(outDir, "artifact.mjs"), artifact.code);
  fs.writeFileSync(path.join(outDir, "build.log.jsonl"), fs.readFileSync(logPath));
  fs.writeFileSync(path.join(outDir, "report.txt"), text);
  console.log(`\nartifact: ${path.join(outDir, "artifact.mjs")}`);
  console.log(`log:      ${logPath}`);
  if (args.open) { try { execSync(`open ${JSON.stringify(path.join(outDir, "report.txt"))}`); } catch { /* ignore */ } }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
