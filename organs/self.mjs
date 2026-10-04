#!/usr/bin/env node
// eo-teachings/self.mjs — γνῶθι σεαυτόν. The reflexive read: the reader turned
// on its own repository. It descends "what am I" to the givers that comprise
// it, and it draws its own empty cells rather than claiming to be whole.
//
// READ-ONLY. This organ never writes the repo it reads. It joins three things
// already on disk — the `// Handle:` lines (the archons), the verified teaching
// manifest (eo-teachings/manifest, the givers' own bytes), and the cube's 27
// cells (the address space) — and reports what is witnessed, what is only
// asserted-in-a-comment, and what cell is empty.
//
// THE DESCENT TEST APPLIES TO THE SELF (FOLD II.3). A handle that names a
// teaching the manifest cannot verify renders `unwitnessed`, never as fact —
// the same rule the system holds for any claim about the world, turned inward.
// The first self-portrait is mostly gaps, and that is the honest one.
//
//   node self.mjs           the registry: every handle, its status
//   node self.mjs --gaps    the 27 cells, which organs fill each, which are empty
//   node self.mjs --json    machine-readable EOSelf@1
import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/mlacy/Documents/3.0";
const SCAN = [path.join(ROOT, "khora/native"), path.join(ROOT, "holodeck")];
const MANIFEST = path.join(ROOT, "eo-teachings/manifest");
const CENSUS = path.join(ROOT, "khora/native/docs/THE-MODULE-CENSUS.md");
const { cellOf, GRAINS } = await import(`${ROOT}/khora/native/kernel/cube.js`);
const OPS = ["NUL", "SIG", "INS", "SEG", "CON", "SYN", "DEF", "EVA", "REC"];

const SKIP = /node_modules|\/worktrees\/|\/tests?\/|\/eval\/|\.test\.|legacy-eoreader6\.1/;
const rel = (abs) => path.relative(ROOT, abs);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (SKIP.test(p)) continue;
    if (e.isDirectory()) walk(p, out);
    else if (/\.m?js$/.test(e.name)) out.push(p);
  }
  return out;
}

// Parse a handle line: `Handle: NAME — teaching. Amendment XVII.`
function parseHandle(text, file) {
  const m = text.match(/Handle:\s*([^\n]+?)\s+[—-]{1,2}\s+([^\n]+)/);
  if (!m) return null;
  const name = m[1].trim();
  let teaching = m[2].trim().replace(/\s*Amendment XVII\.?\s*$/i, "").replace(/\s*\*\/\s*$/, "").trim();
  // the paraphrase is the file author's, not a giver's own bytes: a nomination
  return { file: rel(file), handle: name, paraphrase: teaching };
}

// The verified teachings on disk (from snip.mjs). Empty until the harvest runs.
function loadManifest() {
  const out = [];
  const walkM = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walkM(p); else if (e.name.endsWith(".json")) out.push({ file: rel(p), ...JSON.parse(fs.readFileSync(p, "utf8")) }); } };
  walkM(MANIFEST);
  return out;
}

// The census cell column: file -> Set of "OP·Grain" it declares.
function loadCensusCells() {
  const map = new Map();
  if (!fs.existsSync(CENSUS)) return map;
  for (const line of fs.readFileSync(CENSUS, "utf8").split("\n")) {
    const file = line.match(/`?([\w./-]+\.m?js)`?/)?.[1];
    const cell = line.match(/\b(NUL|SIG|INS|SEG|CON|SYN|DEF|EVA|REC)·(Ground|Figure|Pattern)\b/);
    if (file && cell) { const base = path.basename(file); if (!map.has(base)) map.set(base, new Set()); map.get(base).add(`${cell[1]}·${cell[2]}`); }
  }
  return map;
}

/**
 * computeSelf({ readDate }) — the pure computation, importable as a library.
 * `readDate` is caller-supplied (never Date.now() here — this file is meant
 * to be called from contexts, such as a Workflow script, where the clock is
 * unavailable; a CLI invocation below supplies it from the OS itself).
 * Everything else in this module is presentation over this one function.
 */
export function computeSelf({ readDate = null } = {}) {
  const handles = [];
  for (const f of SCAN.flatMap((d) => walk(d))) {
    const txt = fs.readFileSync(f, "utf8").slice(0, 2000);
    if (!/Handle:/.test(txt)) continue;
    const h = parseHandle(txt, f);
    if (h) handles.push(h);
  }
  const manifest = loadManifest();
  const verifiedBy = new Map(); // handle name (lowercased first token) -> record
  for (const r of manifest) {
    if (r.status !== "verified" && r.status !== "verified_local_archive_pending") continue;
    const key = String(r.handle ?? r.giver ?? "").toLowerCase();
    verifiedBy.set(key, r);
  }
  const matchVerified = (name) => {
    const first = name.toLowerCase().split(/[ /—-]/)[0];
    for (const [k, r] of verifiedBy) if (k.includes(first) || (first && k.split(/[ /]/)[0] === first)) return r;
    return null;
  };

  // an organ's tests are its FALSIFIABLE behaviour (FOLD II.10) — attached so the
  // self-model knows not just what each archon teaches but what it is proven to do.
  const TEST_DIRS = [path.join(ROOT, "khora/native/tests"), path.join(ROOT, "khora/native/conformance"), path.join(ROOT, "holodeck")];
  const allTests = TEST_DIRS.flatMap((d) => fs.existsSync(d) ? fs.readdirSync(d).filter((f) => /\.test\.m?js$/.test(f)).map((f) => ({ base: f, path: rel(path.join(d, f)) })) : []);
  const testsFor = (organFile) => {
    const stem = path.basename(organFile).replace(/\.m?js$/, "");
    return allTests.filter((t) => t.base === `${stem}.test.js` || t.base === `${stem}.test.mjs` || (t.base.startsWith(`${stem}-`) && /\.test\.m?js$/.test(t.base))).map((t) => t.path);
  };

  const registry = handles.map((h) => {
    const v = matchVerified(h.handle);
    return { ...h, tests: testsFor(h.file), teaching: v ? { status: "verified", quote: v.quote, anchor: v.archive?.url ?? v.source?.path } : { status: "unwitnessed", paraphrase: h.paraphrase } };
  });

  const census = loadCensusCells();
  const cells = OPS.flatMap((op) => GRAINS.map((g) => {
    const c = cellOf(op, g);
    const trits = `${["Differentiate", "Relate", "Generate"].indexOf(c.mode)}${["Existence", "Structure", "Interpretation"].indexOf(c.domain)}${GRAINS.indexOf(g)}`;
    const fillers = handles.filter((h) => census.get(path.basename(h.file))?.has(`${op}·${g}`)).map((h) => path.basename(h.file));
    return { trits, address: `${op}·${g}`, terrain: c.terrain, stance: c.stance, fillers, empty: fillers.length === 0 };
  }));

  return {
    schema: "EOSelf@1",
    read: readDate,
    handles: registry.length,
    verified: registry.filter((r) => r.teaching.status === "verified").length,
    unwitnessed: registry.filter((r) => r.teaching.status === "unwitnessed").length,
    emptyCells: cells.filter((c) => c.empty).map((c) => `${c.trits} ${c.address}`),
    registry,
    cells,
  };
}

// ── CLI, only when this file is run directly (never on import) ──────────────
const isMain = (() => { try { return import.meta.url === `file://${path.resolve(process.argv[1] ?? "")}`; } catch { return false; } })();
if (!isMain) {
  // imported as a library — computeSelf() is the whole export surface below this line
} else {

const self = computeSelf({ readDate: new Date().toISOString().slice(0, 10) });
const { registry, cells } = self;
const args = process.argv.slice(2);
if (args.includes("--json")) { console.log(JSON.stringify(self, null, 2)); process.exit(0); }

if (args.includes("--gaps")) {
  console.log(`\nγνῶθι σεαυτόν — the address space, and what fills it\n`);
  for (const c of cells) {
    const mark = c.empty ? "· · ·" : c.fillers.slice(0, 3).join(", ") + (c.fillers.length > 3 ? ` +${c.fillers.length - 3}` : "");
    console.log(`  ${c.trits}  ${c.address.padEnd(9)} ${c.terrain.padEnd(11)}${c.stance.padEnd(12)} ${c.empty ? "EMPTY" : ""}  ${mark}`);
  }
  const empties = cells.filter((c) => c.empty);
  console.log(`\n  ${empties.length} of 27 cells unfilled by a handled organ (census-mapped).`);
  console.log(`  candor: an empty cell is named, never hidden — this is part of what I am.\n`);
  process.exit(0);
}

console.log(`\nγνῶθι σεαυτόν — what I am made of, descended to its givers\n`);
console.log(`  ${self.handles} handled organs · ${self.verified} verified to bytes · ${self.unwitnessed} unwitnessed (paraphrase only)\n`);
for (const r of registry.slice(0, 8)) {
  console.log(`  ${r.teaching.status === "verified" ? "✓" : "·"} ${r.handle.padEnd(16)} ${r.teaching.status === "verified" ? `"${r.teaching.quote.slice(0, 60)}…"` : `— ${r.paraphrase.slice(0, 66)}`}`);
}
console.log(`  … ${registry.length - 8} more (--json for all)\n`);
console.log(`  ${self.verified === 0
  ? "candor: I can verify none of my teachings to their givers' bytes yet.\n  the harvest (snip.mjs) has not run. this portrait is honest and mostly empty."
  : `candor: ${self.unwitnessed} handles still name a teaching I cannot verify.`}\n`);

}
