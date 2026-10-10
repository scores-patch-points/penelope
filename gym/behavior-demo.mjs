#!/usr/bin/env node
// gym/behavior-demo.mjs — THE WIDGET'S JUDGE, LIVE (2026-10-10).
//
// The organ the whole conversation was missing: the artifact is judged by what
// it DOES. A tip-calculator page whose script exposes `computeTip` is driven
// through the page adapter's testUnits with `ctx.behavior` declared; its cases
// are settled by the BOX (wantOf — 20% of 100 is {tip:20,total:120}, computed,
// never drawn) and every act lands on a cube cell.
import { judgePage } from "../organs/behavior-check.mjs";
import { adapter } from "../organs/generation/adapters/page.mjs";

// A REAL TIP CALCULATOR, as the mouth might have written it (factors exposed).
// The judge does not trust it because it renders; it clicks the contract it
// declares and reads the numbers it produces.
const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Tip Calculator</title></head>
<body>
  <section class="fold-unit" data-ground="calc-example#12">
    <h2>Tip calculator</h2>
    <p>This is the calculator of ⟦calc-example@12⟧.</p>
    <label for="bill">Bill</label>
    <input id="bill" type="number" value="100">
    <div>
      <button onclick="apply(10)">10%</button>
      <button onclick="apply(15)">15%</button>
      <button onclick="apply(20)">20%</button>
    </div>
    <output id="out"></output>
  </section>
  <script>
    function computeTip(amount, percent) {
      const tip = Math.round(amount * percent) / 100;
      return { tip: tip, total: Math.round((amount + tip) * 100) / 100 };
    }
    function apply(p){ const r = computeTip(Number(document.getElementById("bill").value), p); document.getElementById("out").textContent = r.tip + " total " + r.total; }
  </script>
</body></html>`;

const BEHAVIOR = {
  needs: ["computeTip"],
  cases: [
    { fn: "computeTip", args: [100, 20], compute: { kind: "tip", amount: 100, percent: 20 } },
    { fn: "computeTip", args: [36.5, 20], compute: { kind: "tip", amount: 36.5, percent: 20 } },
    { fn: "computeTip", args: [50, 15], compute: { kind: "tip", amount: 50, percent: 15 } },
  ],
};

console.log("=== THE BEHAVIORAL JUDGE (cube-tied acts) ===");
const j = judgePage(PAGE, BEHAVIOR);
for (const o of j.observations) {
  const c = o.cell;
  console.log(`${o.action.padEnd(6)} ${c.op}·${c.grain.padEnd(7)} ${c.mode.padEnd(14)} · ${c.terrain.padEnd(10)} · ${c.stance.padEnd(11)} ${o.ok ? "✔" : "✖"}  ${String(o.target || o.detail || "").slice(0, 70)}`);
}
console.log(`\nverdict: ${j.ok ? "HELD" : "REFUSED"} — ${j.ok ? "every case held against a box-settled want" : j.findings.map((f) => f.kind).join(", ")}`);

console.log("\n=== THE PAGE ADAPTER, WITH ctx.behavior DECLARED ===");
const uh = adapter.testUnits ?? adapter.probeUnit;
const ctx = { behavior: BEHAVIOR };
const v = await adapter.testUnits(PAGE, [{ name: "section", spec: "the tip calculator" }], ctx);
console.log("testUnits:", v.ok ? "HELD" : "REFUSED", "—", v.reason);
if (v.ok) console.log("  detail:", JSON.stringify(v.detail));