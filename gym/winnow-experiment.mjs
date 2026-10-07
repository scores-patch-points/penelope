#!/usr/bin/env node
// gym/winnow-experiment.mjs — TRY THE METHOD: hunt material, winnow it away,
// define success, error-correct, breed.
//
// A real run, not a diagram. The success definition is the REAL code adapter's
// gate (`probeUnit`: a unit's own settle, executed by node; and the whole
// module checked by `testUnits`). The MATERIAL is a bank of candidate
// implementations offered by three doors (field = the corpus, hunt = the web,
// mouth = a draw); the stand-in for the model is disclosed — the bank is
// deterministic, so the run reproduces (like D1's extractive stand-in).
//
// The "ways to get there" are strategy genomes over the engine's own fill
// choices: which door to consult; whether to VERIFY a candidate before
// accepting it; whether to REPAIR a unit no candidate satisfied. The room is a
// dependency DAG: REPAIR requires VERIFY (you cannot repair a failure you did
// not detect). Genomes illegal at birth are refused, named.
//
//   node gym/winnow-experiment.mjs [--out /tmp/winnow] [--gens N]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { probeUnit, testUnits } from "../organs/generation/adapters/code.mjs";
import { runWinnow } from "../organs/generation/winnow.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
void HERE;

// ── THE GENES (the ways to get there) ───────────────────────────────────────
const FIELD = 1, HUNT = 2, MOUTH = 4, VERIFY = 8, REPAIR = 16;
const SOURCES = [[FIELD, "field"], [HUNT, "hunt"], [MOUTH, "mouth"]];
const nameOf = (mask) => {
  const parts = [];
  if (mask & FIELD) parts.push("FIELD");
  if (mask & HUNT) parts.push("HUNT");
  if (mask & MOUTH) parts.push("MOUTH");
  if (mask & VERIFY) parts.push("VERIFY");
  if (mask & REPAIR) parts.push("REPAIR");
  return parts.join("+") || "nothing";
};
// THE DAG: REPAIR requires VERIFY. A genotype that violates it is refused at birth.
const legal = (g) => !(g.mask & REPAIR) || Boolean(g.mask & VERIFY);
const deps = (g) => ((g.mask & REPAIR) && !(g.mask & VERIFY) ? ["VERIFY"] : []);

// ── THE MATERIAL (the bank the hunt offers) ─────────────────────────────────
// Each unit carries its settle (the success definition for that unit, read off
// the exported binding `__c.unit`) and the candidate implementations each door
// offers. Some hold, some do not. `repair` is the bank's corrected variant.
const U = (name, spec, lhs, rhs, bank) => ({ name, spec, settle: `${lhs} === ${rhs}`, bank });
const units = [
  U("double", "return n times two", "__c.unit(3)", "6",
    { field: [{ id: "f1", code: "export function double(n){return n*2}" }, { id: "f1b", code: "export function double(n){return n+2}" }],
      hunt: [{ id: "h1", code: "export function double(n){return n*2+1}" }], mouth: [{ id: "m1", code: "export function double(n){return n-2}" }] }),
  U("square", "return n times n", "__c.unit(4)", "16",
    { field: [{ id: "f2", code: "export function square(n){return n+1}" }],
      hunt: [{ id: "h2", code: "export function square(n){return n*n}" }], mouth: [{ id: "m2", code: "export function square(n){return n**3}" }] }),
  U("isEven", "true when n is divisible by two", "__c.unit(7)", "false",
    { field: [{ id: "f3", code: "export function isEven(n){return n % 2 === 1}" }],
      hunt: [{ id: "h3", code: "export function isEven(n){return true}" }], mouth: [{ id: "m3", code: "export function isEven(n){return n % 2 === 0}" }] }),
  U("sumTo", "the sum of one through n", "__c.unit(5)", "15",
    { field: [{ id: "f4", code: "export function sumTo(n){return n}" }],
      hunt: [{ id: "h4", code: "export function sumTo(n){return n+1}" }],
      mouth: [{ id: "m4", code: "export function sumTo(n){let s=0;for(let i=1;i<=n;i++)s+=i;return s+1}" }],
      repair: { id: "r4", code: "export function sumTo(n){let s=0;for(let i=1;i<=n;i++)s+=i;return s}" } }),
  U("firstWord", "the part before the first space", '__c.unit("a b c")', '"a"',
    { field: [{ id: "f5", code: 'export function firstWord(s){return s.split(" ")[0]}' }],
      hunt: [{ id: "h5", code: "export function firstWord(s){return s}" }],
      mouth: [{ id: "m5", code: 'export function firstWord(s){return s.split(" ").pop()}' }] }),
  U("clamp", "n bounded to lo..hi", "__c.unit(9,0,5)", "5",
    { field: [{ id: "f6", code: "export function clamp(n,lo,hi){return n}" }],
      hunt: [{ id: "h6", code: "export function clamp(n,lo,hi){return Math.min(Math.max(n,lo),hi)}" }],
      mouth: [{ id: "m6", code: "export function clamp(n,lo,hi){return Math.max(n,lo)}" }] }),
  U("factorial", "the product of one through n", "__c.unit(4)", "24",
    { field: [{ id: "f7", code: "export function factorial(n){return n}" }],
      hunt: [{ id: "h7", code: "export function factorial(n){return n*n}" }],
      mouth: [{ id: "m7", code: "export function factorial(n){let p=1;for(let i=2;i<=n;i++)p*=i;return p}" }] }),
  U("reverse", "the string reversed", '__c.unit("abc")', '"cba"',
    { field: [{ id: "f8", code: "export function reverse(s){return s}" }],
      hunt: [{ id: "h8", code: "export function reverse(s){return s.toUpperCase()}" }],
      mouth: [{ id: "m8", code: 'export function reverse(s){return s.split("").join("")}' }],
      repair: { id: "r8", code: 'export function reverse(s){return s.split("").reverse().join("")}' } }),
];

// ── THE SUCCESS DEFINITION (the real gate), memoized ────────────────────────
const probeMemo = new Map();
function passes(unit, code) {
  const key = unit.name + "\u0000" + code;
  if (!probeMemo.has(key)) probeMemo.set(key, probeUnit(code, unit).ok === true);
  return probeMemo.get(key);
}

// Fill one unit under one strategy genome. Door order is fixed; a blind
// strategy takes the first candidate it meets without probing; a verifying
// strategy probes each and takes the first that holds; REPAIR falls to the
// bank's repair variant when no candidate held.
function fillUnit(mask, unit) {
  const cands = SOURCES.filter(([bit]) => mask & bit).flatMap(([, src]) => unit.bank[src] ?? []);
  if (!cands.length) return null;
  if (!(mask & VERIFY)) return cands[0].code;            // blind: first met
  for (const c of cands) if (passes(unit, c.code)) return c.code;
  if (mask & REPAIR) { const r = unit.bank.repair; if (r && passes(unit, r.code)) return r.code; }
  return null;
}

// The measure: fraction of units the strategy ACTUALLY satisfies — the chosen
// implementation is judged by the real gate, whether or not the strategy
// bothered to verify it. A blind strategy that takes the wrong candidate scores
// low; a verifying one that takes the right candidate scores high.
function score(mask) {
  let won = 0;
  for (const u of units) { const code = fillUnit(mask, u); if (code !== null && passes(u, code)) won += 1; }
  return won / units.length;
}

// ── THE MATERIAL WINNOW (hunted material, real gate) ────────────────────────
function materialStats() {
  let offered = 0, passed = 0;
  const rows = [];
  for (const u of units) {
    for (const [, src] of SOURCES) for (const c of u.bank[src] ?? []) { offered += 1; if (passes(u, c.code)) passed += 1; }
    const all = SOURCES.flatMap(([, s]) => u.bank[s] ?? []);
    rows.push({ unit: u.name, offered: all.length, held: all.filter((c) => passes(u, c.code)).length });
  }
  return { offered, passed, killed: offered - passed, rows };
}

// ── THE WAYS TO GET THERE (the declared space; none is the full solution) ────
const space = [
  { id: "a-FIELD", mask: FIELD },
  { id: "b-HUNT", mask: HUNT },
  { id: "c-MOUTH", mask: MOUTH },
  { id: "d-FIELD+VERIFY", mask: FIELD | VERIFY },
  { id: "e-HUNT+VERIFY", mask: HUNT | VERIFY },
  { id: "f-MOUTH+VERIFY", mask: MOUTH | VERIFY },
  { id: "g-FIELD+HUNT+VERIFY", mask: FIELD | HUNT | VERIFY },
  { id: "h-FIELD+MOUTH+VERIFY", mask: FIELD | MOUTH | VERIFY },
  { id: "i-HUNT+MOUTH+VERIFY", mask: HUNT | MOUTH | VERIFY },
  { id: "j-all-blind", mask: FIELD | HUNT | MOUTH },
  { id: "k-HUNT+VERIFY+REPAIR", mask: HUNT | VERIFY | REPAIR },
  { id: "l-FIELD+HUNT+VERIFY+REPAIR", mask: FIELD | HUNT | VERIFY | REPAIR },
  { id: "m-FIELD+HUNT+MOUTH+VERIFY", mask: FIELD | HUNT | MOUTH | VERIFY },
  { id: "n-MOUTH+VERIFY+REPAIR", mask: MOUTH | VERIFY | REPAIR },
];

// ── BREED OPERATORS (deterministic; no hand-set threshold anywhere) ─────────
const crossover = (a, b) => ({ id: `x${a.mask}·${b.mask}`, mask: a.mask | b.mask });
const mutate = (g, gen) => ({ id: `g${gen}`, mask: g.mask ^ (1 << ((gen - 1) % 5)) });
// ERROR-CORRECTION of a strategy: turn on the next lever its own failure
// implies — first VERIFY (a blind strategy cannot tell truth from noise), then
// REPAIR, then the doors it never opened. Returns null when nothing is missing.
function repairStrategy(g) {
  const order = [VERIFY, REPAIR, MOUTH, HUNT];
  const add = order.find((bit) => !(g.mask & bit));
  if (add === undefined) return null;
  return { id: `${g.id}+${nameOf(add)}`, mask: g.mask | add };
}

// ── RUN ─────────────────────────────────────────────────────────────────────
export function runExperiment({ gens = 3 } = {}) {
  const seed = { id: "seed-FIELD-blind", mask: FIELD };
  const common = { space, legal, deps, idOf: (g) => g.id, measure: (g) => score(g.mask), seed, run: (g) => score(g.mask), baseline: null, keyOf: (g) => String(g.mask) };
  // TWO WAYS THROUGH THE SAME SUCCESS DEFINITION: error-correct the best
  // survivor, and breed the survivors. Neither is the champion by decree — the
  // definition scores both, and the better one wins.
  const byCorrect = runWinnow({ ...common, repair: repairStrategy, generations: 0 });
  const byBreed = runWinnow({ ...common, repair: null, mutate, crossover, generations: gens });

  const mat = materialStats();
  const landscape = [...space].map((g) => ({ id: g.id, mask: g.mask, way: nameOf(g.mask), score: score(g.mask) })).sort((a, b) => b.score - a.score);

  const champOf = (r) => r.champion?.candidate?.mask ?? 0;
  const scoreOf = (r) => r.champion?.score ?? 0;
  const champ = scoreOf(byBreed) >= scoreOf(byCorrect) ? champOf(byBreed) : champOf(byCorrect);
  const winner = scoreOf(byBreed) >= scoreOf(byCorrect) ? "breed" : "correct";

  // FALSIFY: the champion's claim is checked by the REAL whole-module gate
  // (testUnits), and by an adversarial control that must NOT pass.
  const assembled = units.map((u) => fillUnit(champ, u)).filter(Boolean).join("\n") + "\n";
  const wholeGate = testUnits(assembled, units);
  const noVerify = space.find((g) => g.id === "j-all-blind").mask;
  const advAssembled = units.map((u) => fillUnit(noVerify, u)).filter(Boolean).join("\n") + "\n";
  const advGate = testUnits(advAssembled, units);

  const out = {
    schema: "WinnowExperiment@1", at: new Date().toISOString(), units: units.length,
    material: { offered: mat.offered, passed: mat.passed, killed: mat.killed, rows: mat.rows },
    success_definition: byCorrect.success,
    landscape,
    winnow: { hunted: byCorrect.winnow.hunted, survived: byCorrect.winnow.survived, killed: byCorrect.winnow.killed },
    correct: byCorrect.correct, breed: byBreed.breed,
    champion: { way: nameOf(champ), mask: champ, score: Math.max(scoreOf(byCorrect), scoreOf(byBreed)), reachedBy: winner },
    falsify: { wholeModuleGate: wholeGate.ok, wholeModuleRows: wholeGate.rows ?? null, adversarialNoVerify: advGate.ok === true ? "UNEXPECTED-PASS" : advGate.reason },
  };
  return { out, assembled };
}

// ── THE BROWSER PAGE: the process, then the champion's code RUNNING ──────────
const DEMO = [
  ["double", [3], 6], ["square", [4], 16], ["isEven", [7], false], ["sumTo", [5], 15],
  ["firstWord", ["a b c"], "a"], ["clamp", [9, 0, 5], 5], ["factorial", [4], 24], ["reverse", ["abc"], "cba"],
];
export function renderHtml(exp) {
  const { material: mat, success_definition: sd, landscape, winnow, correct, breed, champion, falsify, units: n } = exp;
  const srcJson = JSON.stringify(exp.assembled ?? "");
  const pct = (v) => Math.max(0, Math.min(100, v * 100)).toFixed(1);
  const hbar = (v, cls = "") => `<span class="bar ${cls}" style="width:${pct(v)}%"></span>`;
  const rowsMat = mat.rows.map((r) => `<tr><td>${r.unit}</td><td class="num">${r.offered}</td><td class="num">${r.held}</td><td><span class="bar" style="width:${pct(r.held / n)}%"></span></td></tr>`).join("");
  const rowsLand = landscape.map((g) => `<tr><td class="mono">${g.way}</td><td class="num">${g.score * n}/${n}</td><td class="score"><span class="bar" style="width:${pct(g.score)}%"></span></td></tr>`).join("");
  const rowsKill = winnow.killed.map((k) => `<li><b>${k.id}</b> — ${k.reason}${k.delta !== undefined ? ` (Δ${k.delta})` : ""}</li>`).join("");
  const rowsKept = (breed.kept || []).map((k) => `<li><b>gen ${k.gen}</b> ${k.id} → ${k.score * n}/${n} (+${k.improvement.toFixed(3)}) from ${k.from.join(" × ")}</li>`).join("") || "<li>(none)</li>";
  const rowsElen = (breed.elenchus || []).map((e) => `<li>gen ${e.gen} ${e.id} — ${e.reason}</li>`).join("") || "<li>(none)</li>";
  const demoJson = JSON.stringify(DEMO);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Penelope · winnow — the coding ability</title>
<style>
:root{--bg:#f6f1e7;--fg:#2b2118;--dim:#7a6b58;--line:#d8ccb6;--good:#2f7d4f;--bad:#a83b2f;--acc:#8a5a2b}
@media(prefers-color-scheme:dark){:root{--bg:#1c1712;--fg:#e8dcc6;--dim:#9c8b72;--line:#3a3026;--good:#63c58a;--bad:#e07a6c;--acc:#d2a24e}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace}
main{max-width:900px;margin:0 auto;padding:32px 20px 80px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:var(--acc);margin:34px 0 10px;border-bottom:1px solid var(--line);padding-bottom:6px}
p{color:var(--dim);margin:.4em 0}.lead{color:var(--fg)}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:4px 8px;text-align:left;border-bottom:1px solid var(--line)}
th{color:var(--dim);font-weight:400}.num{text-align:right;font-variant-numeric:tabular-nums}
.mono{font-size:12.5px}.score{width:45%}
.bar{display:inline-block;height:10px;border-radius:3px;background:linear-gradient(90deg,var(--acc),var(--good));min-width:2px}
.kpis{display:flex;gap:18px;flex-wrap:wrap;margin:8px 0}.kpi{background:color-mix(in srgb,var(--fg) 6%,transparent);border:1px solid var(--line);border-radius:8px;padding:10px 14px;min-width:120px}
.kpi b{display:block;font-size:24px}.kpi span{color:var(--dim);font-size:12px}
ul{margin:.3em 0;padding-left:1.2em;color:var(--dim)}li b{color:var(--fg)}
pre{background:color-mix(in srgb,var(--fg) 6%,transparent);border:1px solid var(--line);border-radius:8px;padding:12px;overflow:auto;font-size:12.5px}
.pass{color:var(--good);font-weight:bold}.fail{color:var(--bad);font-weight:bold}
.chip{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:1px 9px;font-size:12px;color:var(--dim);margin-right:6px}
.live td:first-child{color:var(--fg)}.live .got{font-weight:bold}
</style></head><body><main>
<p class="chip">Penelope</p><p class="chip">hunt → winnow → correct → breed</p>
<h1>Our coding ability, on the record</h1>
<p class="lead">Hunt material, winnow it away, define success first, error-correct against it, and let the survivors breed. The success definition is the <b>real code gate</b> (<code>probeUnit</code> + <code>testUnits</code>); the material bank is a disclosed deterministic stand-in. Generated by <code>gym/winnow-experiment.mjs</code>.</p>

<div class="kpis">
  <div class="kpi"><b>${mat.offered}</b><span>implementations hunted</span></div>
  <div class="kpi"><b>${mat.passed}</b><span>held by the gate</span></div>
  <div class="kpi"><b>${winnow.hunted}</b><span>strategies hunted</span></div>
  <div class="kpi"><b>${winnow.winnowed}</b><span>winnowed away</span></div>
  <div class="kpi"><b>${champion.score * n}/${n}</b><span>champion (${champion.reachedBy})</span></div>
</div>

<h2>1 · The material, winnowed by the real gate</h2>
<p>${mat.offered} candidate implementations offered by three doors; <b>${mat.passed} held</b>, ${mat.killed} killed — the gate is the definition of winning.</p>
<table><thead><tr><th>unit</th><th class="num">offered</th><th class="num">held</th><th></th></tr></thead><tbody>${rowsMat}</tbody></table>

<h2>2 · The success definition (measured, never set)</h2>
<p>seed <code>${sd.baseline !== undefined ? "FIELD-blind" : ""}</code> → rerun floor <b>${sd.floor}</b>, bar <b>${sd.bar}</b> (= epsilon: the measure is deterministic); baseline <b>${sd.baseline.toFixed(3)}</b>, budget <b>${sd.budget}</b>.</p>

<h2>3 · The ways to get there (the landscape)</h2>
<table><thead><tr><th>strategy genome</th><th class="num">score</th><th></th></tr></thead><tbody>${rowsLand}</tbody></table>

<h2>4 · Winnow — most are killed</h2>
<p>hunted <b>${winnow.hunted}</b>, survived <b>${winnow.survived}</b>, winnowed <b>${winnow.killed.length}</b>.</p>
<ul>${rowsKill}</ul>

<h2>5 · Error-correct, against the named failure</h2>
${correct ? `<p>best survivor <code>${correct.candidate?.id ?? ""}</code>: <b>${correct.before.toFixed(3)} → ${correct.score.toFixed(3)}</b> — the missing door turned on.</p>` : "<p>(no repair)</p>"}

<h2>6 · Breed — the cross is a candidate; the definition selects</h2>
<p>generations <b>${breed.generations}</b>, kept <b>${breed.kept.length}</b>, elenchus <b>${breed.elenchus.length}</b>.</p>
<ul>${rowsKept}</ul>
<p style="color:var(--dim)">refused:</p><ul>${rowsElen}</ul>

<h2>7 · Champion</h2>
<p><b>${champion.way}</b> (mask ${champion.mask}) — <b>${champion.score * n}/${n}</b>, reached by <b>${champion.reachedBy}</b>. Falsify: whole-module gate <span class="${falsify.wholeModuleGate ? "pass" : "fail"}">${falsify.wholeModuleGate ? "PASS (" + falsify.wholeModuleRows + " rows)" : "FAIL"}</span> · adversarial no-VERIFY control <span class="fail">${falsify.adversarialNoVerify}</span>.</p>

<h2>8 · The champion's code, running in this page</h2>
<p>the assembled module is imported below and each unit called with a fixture — a green row is the code actually executing.</p>
<table class="live"><thead><tr><th>call</th><th>expected</th><th>got</th><th></th></tr></thead><tbody id="live"></tbody></table>
<details><summary style="color:var(--dim);cursor:pointer;margin-top:8px">the assembled module</summary><pre>${(exp.assembled ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</pre></details>

<script type="module">
const DEMO = ${demoJson};
const SRC = ${srcJson};
const body = document.getElementById("live");
try {
  const mod = await import(URL.createObjectURL(new Blob([SRC], { type: "text/javascript" })));
  for (const [name, args, expected] of DEMO) {
    const tr = document.createElement("tr");
    let got, ok = false;
    try { got = mod[name](...args); ok = JSON.stringify(got) === JSON.stringify(expected); }
    catch (e) { got = "threw: " + e.message; }
    tr.innerHTML = "<td>" + name + "(" + args.map((a) => JSON.stringify(a)).join(", ") + ")</td>" +
      "<td>" + JSON.stringify(expected) + "</td>" +
      "<td class='got'>" + JSON.stringify(got) + "</td>" +
      "<td class='" + (ok ? "pass" : "fail") + "'>" + (ok ? "PASS" : "FAIL") + "</td>";
    body.appendChild(tr);
  }
} catch (e) {
  body.innerHTML = "<tr><td colspan='4' class='fail'>live import failed: " + e.message + " — open over http (node gym/server.mjs) if the browser blocks blob modules on file://</td></tr>";
}
</script>
<p style="margin-top:40px;color:var(--dim);font-size:12px">at ${exp.at} · ${n} units · generated from gym/tapestry.spec.json's WNB thread (GL-EN-18)</p>
</main></body></html>`;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function main() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 1) if (process.argv[i].startsWith("--")) args[process.argv[i].slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true;
  const gens = Number(args.gens ?? 3);
  const outDir = path.resolve(args.out ?? path.join(os.tmpdir(), "winnow-" + Date.now()));
  fs.mkdirSync(outDir, { recursive: true });
  const { out, assembled } = runExperiment({ gens });
  const jsonPath = path.join(outDir, "winnow-experiment.json");
  const htmlPath = path.join(outDir, "winnow-experiment.html");
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2));
  fs.writeFileSync(htmlPath, renderHtml({ ...out, assembled }));
  const n = out.units;
  console.log(`material: ${out.material.passed}/${out.material.offered} held · strategies: ${out.winnow.hunted} hunted, ${out.winnow.killed.length} winnowed · champion ${out.champion.way} ${out.champion.score * n}/${n} (${out.champion.reachedBy})`);
  console.log(`gate: ${out.falsify.wholeModuleGate ? "PASS" : "FAIL"} · adversarial no-VERIFY: ${out.falsify.adversarialNoVerify}`);
  console.log(`json: ${jsonPath}`);
  console.log(`page: ${htmlPath}`);
  if (args.open) { try { execSync(`open ${JSON.stringify(htmlPath)}`); console.log("opened in the browser"); } catch { console.log("(could not auto-open — open the page path above)"); } }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
