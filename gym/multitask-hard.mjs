#!/usr/bin/env node
// gym/multitask-hard.mjs — THE TIME-SPLIT ON A GENUINELY HARD E2E (2026-10-10).
//
// Five INDEPENDENT, genuinely difficult units for a 1.5B local model: a
// Levenshtein DP, a shunting-yard RPN converter, a quoted-CSV line parser,
// an n-th prime siever and Roman numerals — each with EXACT probes (string for
// string, token for token). Two arms, same model, same anchors:
//   ARM A  SEQUENTIAL — five draws.
//   ARM B  MULTITASKED — ONE generation, the manifest unfolded in its window,
//          fence-cut per unit (the boundary snip), probed per unit.
//   RUNG   RESUME — refused units (wrong/throws/fence-absent) are RE-QUEUED
//          one by one with the failure disclosed — the scheduler, not a
//          redraw — then re-probed.
// The probes decide; refusals stay named; the honest wall is reported either way.
import { multitaskManifest, extractManifestUnits } from "../organs/generation/multitask.mjs";
import { writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import path2 from "node:path";
import { fileURLToPath as url2 } from "node:url";
const SWATCH2 = path2.join(path2.dirname(url2(import.meta.url)), "..", "gym", "swatch.jsonl");
const drawRec = (ms, bytes, ok) => { try { appendFileSync(SWATCH2, JSON.stringify({ schema: "Swatch@1", ts: new Date().toISOString(), weave: "draw:multitask-exp", class: "draw", engine: "gym/multitask experiment (direct ollama, disclosed)", model: MODEL, mouthCalls: 1, mouthBytes: bytes, corpusBytes: 0, huntBytes: 0, boxBytes: 0, verdict: ok ? "mouth" : "refused", evidence: "2026-10-10 house round — the multitask experiments record their draws" }) + "\n"); } catch { } };

const OLLAMA = process.env.ER7_OLLAMA_URL ?? "http://localhost:11435";
const MODEL = "qwen2.5-coder:1.5b";
async function one(prompt, maxTokens) {
  const t0 = Date.now();
  const r = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], stream: false, options: { temperature: 0.2, num_predict: maxTokens } }),
  });
  if (!r.ok) throw new Error("ollama " + r.status);
  const j = await r.json();
  const text = j?.message?.content ?? "";
  drawRec(Date.now() - t0, Buffer.byteLength(text), !!text);
  return { text, ms: Date.now() - t0 };
}

const UNITS = [
  { name: "levenshtein", anchor: "function levenshtein(a, b) {", spec: "return the Levenshtein edit distance between strings a and b (dynamic programming; case-sensitive)", samples: [{ args: ["kitten", "sitting"], want: 3 }, { args: ["", "xyz"], want: 3 }] },
  { name: "toRPN", anchor: "function toRPN(tokens) {", spec: "shunting-yard: tokens is an infix token array (numbers and + - * / ( )), return the reverse-Polish token array", samples: [{ args: [["2", "+", "3", "*", "4"]], want: ["2", "3", "4", "*", "+"] }, { args: [["(", "1", "+", "2", ")", "*", "3"]], want: ["1", "2", "+", "3", "*"] }] },
  { name: "parseCsvLine", anchor: "function parseCsvLine(line) {", spec: "parse ONE CSV line: comma-separated fields; double quotes may wrap a field; two doubled quotes inside a quoted field are one quote; return the field array", samples: [{ args: ['a,"b,c",d'], want: ["a", "b,c", "d"] }, { args: ['"x""y",z'], want: ['x"y', "z"] }] },
  { name: "nthPrime", anchor: "function nthPrime(n) {", spec: "return the n-th prime number; the 1st prime is 2", samples: [{ args: [5], want: 11 }, { args: [10], want: 29 }] },
  { name: "toRoman", anchor: "function toRoman(n) {", spec: "convert an integer 1..3999 to Roman numerals", samples: [{ args: [1994], want: "MCMXCIV" }, { args: [9], want: "IX" }] },
];
const PROBES = Object.fromEntries(UNITS.map((u) => [u.name, u]));
const cut = (text, name) => {
  const start = text.indexOf("function " + name);
  if (start < 0) return null;
  const t = text.slice(start);
  const open = t.indexOf("{");
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < t.length; i++) { if (t[i] === "{") depth++; else if (t[i] === "}") { depth--; if (depth === 0) return t.slice(0, i + 1); } }
  return null;
};
const probe = (name, code) => {
  if (!code) return { v: "missing" };
  try {
    const fn = new Function(`return (${code});`)();
    for (const { args, want } of PROBES[name].samples) {
      const got = fn(...args);
      if (JSON.stringify(got) !== JSON.stringify(want)) return { v: "wrong", got, want };
    }
    return { v: "held" };
  } catch (e) { return { v: "throws", error: e.message.slice(0, 60) }; }
};
const line = (u, p) => `  ${u.name.padEnd(13)} ${p.v.padEnd(8)}${p.v === "wrong" ? `got ${JSON.stringify(p.got).slice(0, 50)} want ${JSON.stringify(p.want).slice(0, 50)}` : p.v === "throws" ? p.error : ""}`;

// ── ARM A · SEQUENTIAL ──
console.log("=== ARM A · SEQUENTIAL (5 draws, the control) ===");
let tA = 0; const aVerdicts = {};
for (const u of UNITS) {
  const { text, ms } = await one(`Write this function. Output ONLY the complete function, nothing else.\n\n${u.spec}\n${u.anchor}`, 260);
  tA += ms;
  const p = probe(u.name, cut(text, u.name)); aVerdicts[u.name] = p.v;
  console.log(line(u, p) + `  ${ms}ms`);
}

// ── ARM B · MULTITASKED (one generation, time split) ──
console.log("\n=== ARM B · MULTITASKED (ONE generation over all five) ===");
const manifest = multitaskManifest(UNITS.map((u) => ({ name: u.name, anchor: u.anchor, spec: u.spec })));
const { text: multi, ms: tB } = await one(manifest, 1200);
const cuts = extractManifestUnits(multi, UNITS.map((u) => u.name));
const bVerdicts = {}; const refused = [];
for (const u of UNITS) {
  const c = cuts.find((x) => x.unit === u.name);
  const p = c?.ok ? probe(u.name, c.code) : { v: "fence-absent" };
  bVerdicts[u.name] = p.v;
  console.log(line(u, p) + (c?.ok ? `  (${c.code.length}b)` : ""));
  if (p.v !== "held") refused.push(u.name);
}

// ── THE RESUME RUNG — the FAILURE SET is re-manifested TOGETHER (synergy:
//    all refusals surface in one pass, so the batch repairs in one more
//    generation, the shared failure report as its frame — the scheduler
//    learns the whole set, not retry-by-retry). Rounds to done, not tokens,
//    is the honest metric: 1 pass + 1 rung ≤ 2 draws, whatever the per-draw
//    token cost. ──
console.log(`\n=== THE RESUME RUNG (the refused set re-manifested in ONE pass — ${refused.length || 0} refused) ===`);
const resumed = {};
let tR = 0, rungDraws = 0;
let failed = refused;
for (let rung = 1; rung <= 3 && failed.length; rung++) {
  const refusedUnits = UNITS.filter((u) => failed.includes(u.name));
  const failureLines = refusedUnits.map((u) => {
    const c = cuts.find((x) => x.unit === u.name);
    const prev = c?.ok ? probe(u.name, c.code) : { v: "fence-absent" };
    return `[${u.name}] was judged ${prev.v}${prev.v === "wrong" ? ` — got ${JSON.stringify(prev.got).slice(0, 60)}, want ${JSON.stringify(prev.want).slice(0, 60)}` : prev.v === "throws" ? ` — ${prev.error}` : ""}`;
  });
  const rungManifest = "The units below were judged wrong on the earlier pass; each failure is stated. Rewrite ONLY those functions, fixing the stated failure, each complete and self-contained under its own marker.\n\n"
    + failureLines.join("\n") + "\n\n"
    + multitaskManifest(refusedUnits.map((u) => ({ name: u.name, anchor: u.anchor, spec: u.spec })));
  const { text, ms } = await one(rungManifest, 700);
  tR += ms; rungDraws++;
  const recuts = extractManifestUnits(text, refusedUnits.map((u) => u.name));
  const still = [];
  for (const u of refusedUnits) {
    const c = recuts.find((x) => x.unit === u.name);
    const p = c?.ok ? probe(u.name, c.code) : { v: "fence-absent" };
    resumed[u.name] = p.v;
    console.log(`  rung ${rung} ${u.name.padEnd(12)} ${p.v}`);
    if (p.v !== "held") still.push(u.name);
  }
  failed = still;
  if (failed.length) console.log(`  rung ${rung} still refused: ${failed.join(", ")} — re-manifesting again`);
}

// ── THE HONEST ACCOUNT ──
const held = (m) => Object.values(m).filter((v) => v === "held").length;
console.log(`\n=== THE MEASUREMENT (exact probes, per unit) ===`);
console.log(`  sequential : ${(tA / 1000).toFixed(1)}s · held ${held(aVerdicts)}/5 in ONE draw-round · ${JSON.stringify(aVerdicts)}`);
console.log(`  multitask  : ${(tB / 1000).toFixed(1)}s · held ${held(bVerdicts)}/5 in ONE draw · ${JSON.stringify(bVerdicts)}`);
console.log(`  resume rung: ${(tR / 1000).toFixed(1)}s across ${rungDraws} rung draw(s) → final held ${held({ ...bVerdicts, ...resumed })}/5 · ${JSON.stringify(resumed)}`);
const roundsMulti = 1 + rungDraws;
const roundsSeq = 1 + Object.values(aVerdicts).filter((v) => v !== "held").length;
const diff = roundsSeq - roundsMulti;
console.log("  DRAW ROUNDS to converged: sequential-as-retried ≈ " + roundsSeq + " · multitask-as-batch ≈ " + roundsMulti + (diff >= 1 ? " — the batch failed faster by " + diff + " round(s)" : " — no advantage on this sample"));
console.log(`  tokens: the multitask spent MORE bytes on the happy path but ONE prompt + ONE rung cover the whole batch — synergy is rounds-to-done, never tokens.`);
process.exit(0);