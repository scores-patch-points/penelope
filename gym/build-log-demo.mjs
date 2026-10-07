#!/usr/bin/env node
// gym/build-log-demo.mjs — THE THING: get the code, stitch it with provenance,
// draw only the residue, and project the artifact from the append-only log.
//
//   node gym/build-log-demo.mjs [--out <dir>] [--open]
//
// HUNT-FIRST: for each unit the FIELD (a real corpus) is snipped by address,
// then the HUNT (a real source URL). MOUTH-LAST: only a unit neither held is
// drawn by the mouth. Every byte that enters the artifact is one append-only
// log line carrying its provenance; the artifact is materialize(log) — the
// log is the truth, the file is its projection.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { snip, probeUnit, testUnits, assemble, mouthFragment } from "../organs/generation/adapters/code.mjs";
import { draw } from "../organs/generation/engine.mjs";
import { runBuild, project, readLog } from "../organs/generation/build-log.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
void HERE;
const MODEL = process.env.DEMO_MODEL ?? "qwen2.5-coder:1.5b";

// ── the units (the void, defined) ───────────────────────────────────────────
const units = [
  { name: "mean", spec: "the arithmetic mean of an array of numbers", settle: "__c.unit([1,2,3,4]) === 2.5" },
  { name: "median", spec: "the median of an array; even count -> mean of the two middle values", settle: "__c.unit([3,1,2]) === 2" },
  { name: "mode", spec: "the most frequent value; tie -> the smallest", settle: "__c.unit([2,2,1,1]) === 1" },
  { name: "range", spec: "return [min, max] for an array of numbers", settle: 'JSON.stringify(__c.unit([4,1,9,3])) === "[1,9]"' },
  { name: "clamp", spec: "clamp n into [lo, hi]", settle: "__c.unit(9,0,5) === 5" },
];

// ── the corpus (the FIELD the hunt reads by address) ────────────────────────
const LIBRARY = `// library.mjs — the corpus: real, addressed implementations.
export function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
export function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
export function mode(xs) {
  const counts = new Map();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best = xs[0], bestN = 0;
  for (const [x, n] of [...counts].sort((a, b) => a[0] - b[0])) if (n > bestN) { best = x; bestN = n; }
  return best;
}
`;
const HUNTED = `// https://raw.example.org/stats.mjs
export function range(xs) {
  return [Math.min(...xs), Math.max(...xs)];
}
`;
const FIELD_ADDR = "corpus://library.mjs";
const HUNT_ADDR = "https://raw.example.org/stats.mjs";

const ensureExport = (code) => (code && !/^\s*export\s/.test(code) ? "export " + code : code);
const addr = (text, name) => { const i = text.indexOf(`function ${name}(`); return i < 0 ? null : `${FIELD_ADDR}#${i}`; };

const field = (u) => { const c = snip(LIBRARY, u.name); return c ? { code: ensureExport(c), address: addr(LIBRARY, u.name) } : null; };
const hunt = (u) => { const c = snip(HUNTED, u.name); return c ? { code: ensureExport(c), address: HUNT_ADDR } : null; };
const mouth = async (u) => {
  const text = await draw(mouthFragment(u, u.spec), { maxTokens: 220, model: MODEL, kind: "build" });
  const c = snip(text, u.name);
  return c ? { code: ensureExport(c), model: MODEL } : null;
};
const gate = (u, code) => (code ? probeUnit(code, u) : { ok: false, reason: "no code" });
const assembleFn = (joined, order) => assemble(joined, order.map((name) => ({ name })));
const test = (code, us) => testUnits(code, us);

async function main() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 1) if (process.argv[i].startsWith("--")) args[process.argv[i].slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true;
  const outDir = path.resolve(args.out ?? path.join(os.tmpdir(), "build-log-demo"));
  fs.mkdirSync(outDir, { recursive: true });
  const logPath = path.join(outDir, "build.log.jsonl");

  const { artifact, verdict, log } = await runBuild({ units, logPath, field, hunt, draw: mouth, gate, assemble: assembleFn, test });
  const replay = project(logPath, { assemble: assembleFn });
  const bySource = artifact.units.reduce((a, u) => ((a[u.source] = (a[u.source] ?? 0) + 1), a), {});

  const lines = [];
  const P = (s = "") => lines.push(s);
  P("=== THE APPEND-ONLY LOG (" + log.length + " claims) ===");
  for (const c of log) {
    const bits = Object.entries(c).filter(([k]) => k !== "schema" && k !== "seq").map(([k, v]) => `${k}=${typeof v === "string" && v.length > 60 ? JSON.stringify(v.slice(0, 57) + "…") : JSON.stringify(v)}`);
    P(`  ${String(c.seq).padStart(2)} ${c.kind.padEnd(8)} ${bits.join(" ")}`);
  }
  P("");
  P("=== THE PROJECTION (materialize(log)) ===");
  P(`  units stitched: ${artifact.units.length}/${artifact.order.length} (complete: ${artifact.complete})`);
  P(`  by source: ${Object.entries(bySource).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
  P("  provenance:");
  for (const u of artifact.units) P(`    ${u.unit.padEnd(8)} <- ${u.source}${u.address ? "  " + u.address : ""}${u.model ? "  model=" + u.model : ""}`);
  P(`  refusals: ${artifact.refusals}`);
  P("");
  P("=== THE ARTIFACT ===");
  P(artifact.code.replace(/^/gm, "  "));
  P("");
  P("=== THE TEST (the real gate, on the projected bytes) ===");
  P(`  ${verdict.ok ? "PASS" : "FAIL"} — ${verdict.reason}${verdict.detail ? ": " + String(verdict.detail).slice(0, 160) : ""} (${verdict.rows ?? "?"} rows)`);
  P("");
  P("=== THE FOLD PROPERTY ===");
  P(`  project(log).code === materialize(log).code : ${replay.code === artifact.code ? "MATCH (byte-equal)" : "MISMATCH"}`);
  P(`  artifact sha1: ${execSync(`printf %s ${JSON.stringify(artifact.code)} | shasum`, { encoding: "utf8" }).slice(0, 12)}`);

  const text = lines.join("\n");
  console.log(text);
  fs.writeFileSync(path.join(outDir, "artifact.mjs"), artifact.code);
  fs.writeFileSync(path.join(outDir, "report.txt"), text);
  console.log(`\nlog:      ${logPath}`);
  console.log(`artifact: ${path.join(outDir, "artifact.mjs")}`);
  if (args.open) { try { execSync(`open ${JSON.stringify(path.join(outDir, "report.txt"))}`); } catch { /* ignore */ } }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
