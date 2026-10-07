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
import { fileURLToPath } from "node:url";
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
function main() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 1) if (process.argv[i].startsWith("--")) args[process.argv[i].slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true;
  const gens = Number(args.gens ?? 3);
  const outDir = path.resolve(args.out ?? path.join(os.tmpdir(), "winnow-" + Date.now()));
  fs.mkdirSync(outDir, { recursive: true });

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

  const lines = [];
  const P = (s = "") => lines.push(s);
  P("=== THE MATERIAL (hunted, then winnowed by the real gate) ===");
  P(`  ${mat.offered} candidate implementations offered by field/hunt/mouth`);
  P(`  kept by the gate: ${mat.passed}/${mat.offered} (${(100 * mat.passed / mat.offered).toFixed(0)}%)   killed: ${mat.killed}`);
  for (const r of mat.rows) P(`    ${r.unit.padEnd(10)} offered ${r.offered}, held ${r.held}`);
  P("");
  P("=== THE SUCCESS DEFINITION (measured, never set) ===");
  P(`  seed = ${seed.id}; rerun floor = ${byCorrect.success.floor}; bar = ${byCorrect.success.bar} (= epsilon: the measure is deterministic)`);
  P(`  baseline (the seed's own score) = ${byCorrect.success.baseline.toFixed(3)}`);
  P("");
  P("=== THE WAYS TO GET THERE (the landscape) ===");
  for (const g of landscape) P(`  ${g.way.padEnd(34)} ${(g.score * units.length).toFixed(0)}/${units.length}  (${g.score.toFixed(3)})`);
  P("");
  P("=== WINNOW (most killed) ===");
  P(`  hunted ${byCorrect.winnow.hunted}, survived ${byCorrect.winnow.survived}, winnowed ${byCorrect.winnow.winnowed}`);
  for (const k of byCorrect.winnow.killed) P(`    KILLED ${k.id} (${k.reason}${k.delta !== undefined ? `, Δ${k.delta}` : ""})`);
  P("");
  P("=== ERROR-CORRECT (against the named failure) ===");
  if (byCorrect.correct) {
    P(`  best survivor ${byCorrect.winnow.best.candidate.id} (${nameOf(byCorrect.winnow.best.candidate.mask)}): ${byCorrect.correct.before.toFixed(3)} -> ${byCorrect.correct.score.toFixed(3)} (${nameOf(byCorrect.correct.candidate.mask)})`);
    for (const k of byCorrect.correct.kept) P(`    KEPT step ${k.step}: score ${k.score.toFixed(3)}`);
    for (const r of byCorrect.correct.refused) P(`    REFUSED step ${r.step} (${r.reason})`);
  } else P("  (no repair)");
  P("");
  P("=== BREED (crossover + mutation, admitted by bar + born mass) ===");
  P(`  generations ${byBreed.breed.generations}; kept ${byBreed.breed.kept.length}; elenchus ${byBreed.breed.elenchus.length}`);
  for (const k of byBreed.breed.kept) P(`    KEPT gen ${k.gen} ${k.id}: ${k.score.toFixed(3)} (+${k.improvement.toFixed(3)}) from ${k.from.join(" × ")}`);
  for (const e of byBreed.breed.elenchus) P(`    REFUSED gen ${e.gen} ${e.id}: ${e.reason} (Δ${(e.improvement ?? 0).toFixed(3)})`);
  P("");
  P("=== CHAMPION ===");
  P(`  ${nameOf(champ)} (mask ${champ}) — score ${(Math.max(scoreOf(byCorrect), scoreOf(byBreed))).toFixed(3)} (${Math.round(Math.max(scoreOf(byCorrect), scoreOf(byBreed)) * units.length)}/${units.length}) — reached by ${winner}`);
  P("");
  P("=== FALSIFY (double-check and adversarial control) ===");
  P(`  whole-module gate (testUnits) on the champion: ${wholeGate.ok ? "PASS (" + wholeGate.rows + " rows)" : "FAIL — " + wholeGate.detail}`);
  P(`  adversarial control (all doors, no VERIFY): ${advGate.ok ? "PASS — the verify gate is not load-bearing!" : `FAIL as it must (${advGate.reason})`}`);

  console.log(lines.join("\n"));
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
  fs.writeFileSync(path.join(outDir, "winnow-experiment.json"), JSON.stringify(out, null, 2));
  console.log(`\nreport: ${path.join(outDir, "winnow-experiment.json")}`);
}

main();
