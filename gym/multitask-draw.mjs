#!/usr/bin/env node
// gym/multitask-draw.mjs — MEASURE THE TIME-SPLIT (2026-10-10).
//
// Hypothesis (the user's): ONE small model instance can do K INDEPENDENT
// coding tasks at once by SPLITTING ITS TIME across them — one generation
// that weaves through all K anchors, the box cutting each unit out by its
// fence. If true, K tasks cost about ONE generation (one prompt, one decode
// budget), not K sequential queue slots, and correctness is preserved by the
// per-cut probes.
//
// Control: the SAME four units, the SAME model, drawn SEQUENTIALLY (K calls)
// vs MULTITASKED (1 call). Wall-clock and per-unit verdicts, both arms, on
// this machine, honest either way: if the multitasked arm is slower or the
// probes refuse, that is the finding, not a fix.
import { execFileSync } from "node:child_process";
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

// FOUR INDEPENDENT units — same anchors, same probes, both arms.
const UNITS = [
  { name: "double", anchor: "function double(n) {", spec: "return twice the number n" },
  { name: "triple", anchor: "function triple(n) {", spec: "return three times the number n" },
  { name: "square", anchor: "function square(n) {", spec: "return the square of n" },
  { name: "halve", anchor: "function halve(n) {", spec: "return n divided by two" },
];
const PROBES = {
  double: { samples: [{ args: [4], want: 8 }, { args: [-3], want: -6 }] },
  triple: { samples: [{ args: [4], want: 12 }, { args: [0], want: 0 }] },
  square: { samples: [{ args: [4], want: 16 }, { args: [-3], want: 9 }] },
  halve: { samples: [{ args: [8], want: 4 }, { args: [5], want: 2.5 }] },
};
const cut = (text, name) => {
  // the completion anchor — the model CONTINUES the function; take the body to brace balance
  const start = text.indexOf("function " + name);
  if (start < 0) return null;
  let t = text.slice(start);
  const open = t.indexOf("{");
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < t.length; i++) {
    if (t[i] === "{") depth++; else if (t[i] === "}") { depth--; if (depth === 0) return t.slice(0, i + 1); }
  }
  return null;
};
const probe = (name, code) => {
  if (!code) return "missing";
  try { for (const { args, want } of PROBES[name].samples) { const fn = new Function(`return (${code});`)(); if (JSON.stringify(fn(...args)) !== JSON.stringify(want)) return "wrong"; } return "held"; }
  catch (e) { return "throws:" + e.message.slice(0, 40); }
};

// ── ARM A: SEQUENTIAL — K draws, one per unit ──
console.log("=== ARM A · SEQUENTIAL (K draws) ===");
let tA = 0, bytesA = 0; const seqVerdicts = [];
for (const u of UNITS) {
  const { text, ms } = await one(`Complete this function. Output ONLY the finished function, nothing else (no prose, no fences).\n\n${u.anchor}\n${u.spec}`, 120);
  tA += ms; bytesA += text.length;
  const v = probe(u.name, cut(text, u.name)); seqVerdicts.push(`${u.name}:${v}`);
  console.log(`  ${u.name.padEnd(7)} ${v.padEnd(14)} ${ms}ms`);
}

// ── ARM B: MULTITASKED — ONE generation, time split across all four ──
console.log("=== ARM B · MULTITASKED (ONE generation, time split) ===");
import { multitaskManifest, extractManifestUnits } from "../organs/generation/multitask.mjs";
import { writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import path2 from "node:path";
import { fileURLToPath as url2 } from "node:url";
const SWATCH2 = path2.join(path2.dirname(url2(import.meta.url)), "..", "gym", "swatch.jsonl");
const drawRec = (ms, bytes, ok) => { try { appendFileSync(SWATCH2, JSON.stringify({ schema: "Swatch@1", ts: new Date().toISOString(), weave: "draw:multitask-exp", class: "draw", engine: "gym/multitask experiment (direct ollama, disclosed)", model: MODEL, mouthCalls: 1, mouthBytes: bytes, corpusBytes: 0, huntBytes: 0, boxBytes: 0, verdict: ok ? "mouth" : "refused", evidence: "2026-10-10 house round — the multitask experiments record their draws" }) + "\n"); } catch { } };
const manifest = multitaskManifest(UNITS.map((u) => ({ name: u.name, anchor: u.anchor, spec: u.spec })));
const { text: multi, ms: tB } = await one(manifest, 480);
const cuts = extractManifestUnits(multi, UNITS.map((u) => u.name));
const B = [];
for (let i = 0; i < UNITS.length; i++) {
  const c = cuts[i];
  const v = c.ok ? probe(UNITS[i].name, c.code) : "fence-absent";
  B.push(`${UNITS[i].name}:${v}`);
  console.log(`  ${UNITS[i].name.padEnd(7)} ${v.padEnd(14)} (cut ${c.code ? c.code.length + "b" : "—"})`);
}

console.log(`\n=== THE MEASUREMENT ===`);
console.log(`  sequential   : ${(tA / 1000).toFixed(2)}s total, ${bytesA} bytes across ${UNITS.length} draws (one queue slot each)`);
console.log(`  multitasked  : ${(tB / 1000).toFixed(2)}s total, ${multi.length} bytes in one draw (one queue slot)`);
console.log(`  time split achieves ${(tA / tB).toFixed(1)}× the sequential wall-clock over ${UNITS.length} independent units`);
console.log(`  verdicts per unit — seq: ${seqVerdicts.join(", ")}, multi: ${B.join(", ")}`);
process.exit(0);