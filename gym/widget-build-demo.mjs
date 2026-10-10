#!/usr/bin/env node
// gym/widget-build-demo.mjs — GET IT TO BUILD IT: two DIFFERENT tasks, built by
// the arrangement spine (organs/generation/engine.mjs) through the widget
// adapter (adapters/widget.mjs), and judged by the cube-tied behavioral judge.
//
// Neither task is the tip calculator. The factor of each is settled by the BOX
// (its expression over named args), the interface is templated from the
// factor's own signature, and the test drives the page's factor with cases
// whose wants the box computed. ZERO draws: what the box holds, the mouth is
// never asked for (MOUTH-LAST).
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { arrange } from "../organs/generation/engine.mjs";
import { adapter as widget } from "../organs/generation/adapters/widget.mjs";
import { judgePage } from "../organs/behavior-check.mjs";

const out = fs.mkdtempSync(path.join(os.tmpdir(), "pen-widget-"));
const TASKS = [
  {
    task: "Build a BMI calculator",
    factor: {
      name: "bmi", expr: "kg/(m*m)", args: ["kg", "m"], title: "BMI calculator",
      labels: { kg: "Weight (kg)", m: "Height (m)" }, start: { kg: 70, m: 1.75 },
      examples: [[70, 1.75], [90, 1.8], [55, 1.6]],
    },
  },
  {
    task: "Build a bill splitter with tip",
    factor: {
      name: "perPerson", expr: "total*(1+tip/100)/people", args: ["total", "tip", "people"], title: "Bill splitter",
      labels: { total: "Bill total", tip: "Tip %", people: "People" }, start: { total: 120, tip: 20, people: 4 },
      examples: [[120, 20, 4], [200, 15, 5], [80, 10, 2]],
    },
  },
];

for (const t of TASKS) {
  console.log(`\n════ ${t.task} ════`);
  const r = await arrange({ task: t.task, args: { out }, adapter: widget, context: { factor: t.factor } });
  console.log(`units: ${r.units.map((u) => u.name).join(", ")}`);
  console.log(`outcomes: ${r.outcomes.map((o) => `${o.unit}=${o.stage}(${o.bytes}b)`).join(" · ")}`);
  console.log(`verdict: ${r.verdict.ok ? "HELD" : "REFUSED"} — ${r.verdict.reason}`);
  const obs = r.verdict.detail?.observations || [];
  const byCell = {};
  for (const o of obs) { const k = `${o.cell.op}·${o.cell.grain} ${o.cell.terrain} · ${o.cell.stance}`; byCell[k] = (byCell[k] || 0) + 1; }
  for (const [k, n] of Object.entries(byCell)) console.log(`  ${k}  ×${n}`);
  console.log(`page: ${r.eot.product.widget}`);
}

// FALSIFYING CONTROL: the same builder with a box-held factor that compiles but
// computes the WRONG formula (multiplication instead of division) must be
// REFUSED at the case's lens — not shipped because it renders.
console.log(`\n════ falsifying control: a compilable but wrong factor ════`);
const f = { name: "bmi", expr: "kg*m*m", args: ["kg", "m"], title: "BMI (wrong formula)", labels: {}, start: {}, examples: [[70, 1.75], [90, 1.8]] };
const page = `<!doctype html><html><body><script>function ${f.name}(${f.args.join(", ")}) { return Math.round((${f.expr}) * 100) / 100; }</script></body></html>`;
const j = judgePage(page, { needs: [f.name], cases: f.examples.map((args) => ({ fn: f.name, args, compute: { expression: "kg/(m*m)", bind: { kg: args[0], m: args[1] } } })) });
console.log(`verdict: ${j.ok ? "HELD (BAD)" : "REFUSED"} — ${j.findings.map((x) => x.kind).join(", ")}`);
console.log(`first refusal cell: ${j.findings[0]?.cell?.op}·${j.findings[0]?.cell?.grain} ${j.findings[0]?.cell?.terrain} · ${j.findings[0]?.cell?.stance} — ${j.findings[0]?.detail}`);
process.exit(j.ok ? 1 : 0);