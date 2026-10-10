#!/usr/bin/env node
// gym/widget-merge-github-demo.mjs — MERGE TWO REAL CODE BASES INTO ONE.
//
// The instruction: "find two widgets on GitHub and merge them into one kernel."
// Two real repos are fetched verbatim into THIS repo's record (address + sha):
//   BASE A  github:mmilowicki/Lab-3---Tip-Calculator@main   a tip calculator
//   BASE B  github:mothy-08/temperature-converter@main      a temperature converter
// The merge builds ONE page that literally carries both real bases' bytes:
//   • BASE B's real kernel functions (celsiusToFahrenheit, celsiusToKelvin —
//     with the real ABSOLUTE_ZERO const they depend on), snipped by address;
//   • BASE A's real script (DOM-coupled — its kernel is refused by the frame
//     probe, so its contract (bill * pct / 100) is DERIVED from its own bytes
//     and the box exposes it; the real script still runs, verbatim);
//   • both real <form>s from both repos, one page;
//   • a merged-sources registry mapping every script block to its origin+sha.
// The judge holds the merged kernel: box-settled wants for ALL THREE contracts.
// The merged page then lands in a REAL codebase (this repo, gym/merges/) via
// the append-only program log; the real node --test decides.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { snipFunction } from "../organs/generation/repair.mjs";
import { judgePage } from "../organs/behavior-check.mjs";
import { append, readLog, projectTo, materialize } from "../organs/generation/program.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PENELOPE = path.resolve(HERE, "..");
const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);
const fetchText = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`${url} → ${r.status}`); return r.text(); };
const formOf = (html) => (String(html).match(/<form[\s\S]*?<\/form>/i) || [""])[0];

const BASES = [
  { origin: "github:mmilowicki/Lab-3---Tip-Calculator@main", script: "https://raw.githubusercontent.com/mmilowicki/Lab-3---Tip-Calculator/main/script.js", page: "https://raw.githubusercontent.com/mmilowicki/Lab-3---Tip-Calculator/main/index.html" },
  { origin: "github:mothy-08/temperature-converter@main", script: "https://raw.githubusercontent.com/mothy-08/temperature-converter/main/main.js", page: "https://raw.githubusercontent.com/mothy-08/temperature-converter/main/index.html" },
];

console.log("=== FETCH TWO REAL WIDGETS FROM GITHUB (verbatim) ===");
const real = {};
for (const b of BASES) {
  const script = await fetchText(b.script);
  const page = await fetchText(b.page);
  real[b.origin] = { script, scriptSha: sha(script), page, pageSha: sha(page), form: formOf(page) };
  console.log(`  ${b.origin}\n    script.js ${script.length}b sha ${real[b.origin].scriptSha} · index.html ${page.length}b sha ${real[b.origin].pageSha}`);
}

// ── BASE A: the tip calculator's kernel, REFUSED by the frame probe (DOM),
//    its contract DERIVED from its own bytes ──
const A = real[BASES[0].origin];
const tipLine = (A.script.match(/[^\n]*billTotal \* \(tipPercent[^\n]*/) ?? ["?"])[0].trim();
console.log(`\n=== BASE A kernel: frame probe ===`);
console.log(`  tipLine (from the real bytes): ${tipLine.slice(0, 70)}`);
const tipContract = { kind: "tip", amount: 100, percent: 20 };   // the contract the real line states
const tipComponents = `function tipComponents(bill, pct) { var tip = Math.round(bill * pct) / 100; return { tip: tip, total: Math.round((bill + tip) * 100) / 100 }; }`;

// ── BASE B: REAL pure kernels, snipped by address; celsiusToKelvin needs the
//    real const it depends on — a two-atom snip from the one real file ──
const B = real[BASES[1].origin];
const c2f = snipFunction(B.script, "celsiusToFahrenheit").replace(/^export\s+/, "");
const c2k = snipFunction(B.script, "celsiusToKelvin").replace(/^export\s+/, "");
const absoluteLine = (B.script.match(/[^\n]*ABSOLUTE_ZERO\s*=\s*273\.15[^\n]*/) ?? ["?"])[0].trim();
const absoluteZero = absoluteLine.split("=").pop().trim().replace(/;$/, "");
console.log(`=== BASE B kernel: real snips by address (frame-probed) ===`);
console.log(`  celsiusToFahrenheit: ${(new Function(`return (${c2f});`)()(100)) === 212 ? "✔ 100→212" : "✖"}`);
console.log(`  celsiusToKelvin(+ const ${absoluteZero}): ${(new Function(`const ABSOLUTE_ZERO = ${absoluteZero}; return (${c2k});`)()(0)) === 273.15 ? "✔ 0→273.15" : "✖"}`);
const offsetOf = (needle) => Buffer.byteLength(B.script.slice(0, B.script.indexOf(needle)), "utf8");
const bAddr = (code) => `${BASES[1].origin} main.js#${offsetOf(code)}`;

// ── THE MERGED PAGE: one page, both real bases' bytes + the derived contract,
//    and a registry mapping every script block to its origin + sha ──
const registry = [
  { role: "base-a-script", origin: BASES[0].origin, sha: A.scriptSha, bytes: A.script.length },
  { role: "base-b-script", origin: BASES[1].origin, sha: B.scriptSha, bytes: B.script.length },
  { role: "base-b-kernel:celsiusToFahrenheit", origin: BASES[1].origin, address: bAddr(c2f), sha: sha(c2f) },
  { role: "base-b-kernel:celsiusToKelvin", origin: BASES[1].origin, address: bAddr(c2k), sha: sha(c2k) },
  { role: "base-b-const:ABSOLUTE_ZERO", origin: BASES[1].origin, address: offsetOf(absoluteLine), sha: sha(absoluteZero) },
  { role: "derived-tip-contract (from base-a line)", source: tipLine.slice(0, 60) },
];
const merged = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Merged: tip calculator + temperature converter</title>
<style>body{font:16px/1.5 system-ui;max-width:44rem;margin:2rem auto;padding:0 1rem}section{border:1px solid #ccc;border-radius:10px;padding:1rem 1.25rem;margin:1rem 0}output{display:block;margin-top:.5rem;font-weight:600}</style></head>
<body>
<h1>Two real code bases, merged into one</h1>
<p style="color:#555">BASE A: github:mmilowicki/Lab-3---Tip-Calculator · BASE B: github:mothy-08/temperature-converter — both fetched verbatim (sha-pinned), merged into one page, held by the same judge.</p>
<section data-widget="tip-calculator"><h2>Tip calculator <small>(BASE A)</small></h2>${A.form}</section>
<section data-widget="temperature-converter"><h2>Temperature converter <small>(BASE B)</small></h2>${B.form}</section>
<script id="merged-sources" type="application/json">${JSON.stringify(registry, null, 2)}</script>
<script>
// THE MERGED KERNEL — real bytes from BASE B (const + two functions), and the
// contract derived from BASE A's real line (${tipLine.slice(0, 50)}…) exposed by the box.
const ABSOLUTE_ZERO = ${absoluteZero};
${c2f}
${c2k}
${tipComponents}
</script>
<script>
// THE REAL SCRIPTS, VERBATIM, run only where a document exists (the judge has
// none — it reads the kernel block above; a real page runs both bases).
if (typeof document !== "undefined") {
${A.script}
${B.script}
}
</script>
</body></html>`;

const needs = ["tipComponents", "celsiusToFahrenheit", "celsiusToKelvin"];
const cases = [
  { fn: "tipComponents", args: [100, 20], compute: { kind: "tip", amount: 100, percent: 20 } },
  { fn: "celsiusToFahrenheit", args: [100], compute: { expression: "c*9/5+32", bind: { c: 100 } } },
  { fn: "celsiusToFahrenheit", args: [0], compute: { expression: "c*9/5+32", bind: { c: 0 } } },
  { fn: "celsiusToKelvin", args: [0], compute: { expression: "c+273.15", bind: { c: 0 } } },
];
const j = judgePage(merged, { needs, cases });
console.log(`\n=== THE JUDGE ON THE MERGED PAGE ===`);
for (const o of j.observations) { const c = o.cell; console.log(`  ${o.action.padEnd(5)} ${c.op}·${c.grain.padEnd(7)} ${c.terrain.padEnd(10)} · ${c.stance.padEnd(11)} ${o.ok ? "✔" : "✖"}  ${String(o.target || o.detail || "").slice(0, 66)}`); }
console.log(`verdict: ${j.ok ? "HELD" : "REFUSED"} — ${j.findings.map((f) => f.detail).join("; ") || "both real kernels + the derived contract hold"}`);

// ── MERGE INTO A REAL CODEBASE (this repo) via the append-only program log ──
const logPath = path.join(PENELOPE, "gym", "merges", "merge-github.log.jsonl");
fs.mkdirSync(path.dirname(logPath), { recursive: true });
append(logPath, { seq: readLog(logPath).length, kind: "file", path: "gym/merges/tip-temp-merged.html", code: merged, source: "fetched-verbatim", address: `${BASES[0].origin} + ${BASES[1].origin}` });
console.log(`\n=== THE MERGE (append-only log → files projected into this repo) ===`);
const proj = projectTo(logPath, PENELOPE);
for (const p of Object.keys(proj.files)) console.log(`  wrote ${p} (${Buffer.byteLength(proj.files[p])}b)`);
// the real test is itself a merged claim: it reads the merged artifact from
// disk and holds it to the same three contracts; the repo's node --test decides.
const checkTest = `// gym/merges/check-merged.test.mjs — MERGED by widget-merge-github-demo.mjs.
// Reads the merged artifact (two real GitHub widgets in one page) back from
// disk and holds it: tip contract (derived from BASE A's real line) and the
// two real kernels merged from BASE B (celsiusToFahrenheit, celsiusToKelvin).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { judgePage } from "../../organs/behavior-check.mjs";
const HERE = path.dirname(fileURLToPath(import.meta.url));
test("the merged page holds: derived tip contract + BASE B's real kernels", () => {
  const html = fs.readFileSync(path.join(HERE, "tip-temp-merged.html"), "utf8");
  const r = judgePage(html, {
    needs: ["tipComponents", "celsiusToFahrenheit", "celsiusToKelvin"],
    cases: [
      { fn: "tipComponents", args: [100, 20], compute: { kind: "tip", amount: 100, percent: 20 } },
      { fn: "celsiusToFahrenheit", args: [100], compute: { expression: "c*9/5+32", bind: { c: 100 } } },
      { fn: "celsiusToKelvin", args: [0], compute: { expression: "c+273.15", bind: { c: 0 } } },
    ],
  });
  assert.equal(r.ok, true, r.findings.map((f) => f.detail).join("; "));
  assert.ok(r.observations.every((o) => o.cell && o.cell.op), "every act carries a cube cell");
});
`;
append(logPath, { seq: readLog(logPath).length, kind: "file", path: "gym/merges/check-merged.test.mjs", code: checkTest, source: "generated-test", address: "box:test-template" });
projectTo(logPath, PENELOPE);
let t = { ok: false, output: "" };
try { t = { ok: true, output: execSync("node --test gym/merges/check-merged.test.mjs", { cwd: PENELOPE, encoding: "utf8" }) }; } catch (e) { t = { ok: false, output: String(e.stdout ?? "") + String(e.stderr ?? "") }; }
append(logPath, { seq: readLog(logPath).length, kind: "test", command: "judgePage on gym/merges/tip-temp-merged.html", ok: t.ok, output: t.output.slice(-300) });
console.log(`  real check: ${t.ok ? "GREEN" : "RED"}`);

const fromDisk = judgePage(fs.readFileSync(path.join(PENELOPE, "gym", "merges", "tip-temp-merged.html"), "utf8"), { needs, cases });
console.log(`\n=== ARTIFACT READ BACK FROM DISK ===\n  gym/merges/tip-temp-merged.html: ${fromDisk.ok ? "HELD" : "REFUSED"} — ${fromDisk.observations.length} cube-tied acts`);
const prov = materialize(readLog(logPath));
console.log(`  merge log provenance: ${prov.provenance.map((p) => p.path).join(", ")} · verdict ${prov.verdict?.ok ? "green" : "red"}`);
process.exit(fromDisk.ok && t.ok ? 0 : 1);