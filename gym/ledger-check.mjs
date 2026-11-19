#!/usr/bin/env node
// gym/ledger-check.mjs — THE LEDGER'S LABELS ARE CHECKED, NOT TRUSTED (GL-LG-01).
// A number quoted without the split it came from reads as general; this is how the zero-overlap work overstated itself more than once
// (in-sample pronoun dials, dev-set paraphrase paths, a held-out reused by later frames). experiments/zero-overlap/LEDGER.md carries, per row,
// a Label and the Splits it scored (id:role), and experiments/zero-overlap/splits.json registers the splits. This reads both and fails when:
//   1. a split already scored by an earlier row is scored again as held / fresh (a held-out or fresh set is read ONCE; later rows say dev, reused or explore);
//   2. a row's Label is not exactly the set of its roles' labels (held HELD-OUT, fresh FRESH, reused REUSED, dev DEV, explore EXPLORATORY);
//   3. a row's Result text claims a label the row does not have (the prose may not outrun the label);
//   4. a row that is not purely EXPLORATORY has no stamp; 5. a script its Reproduce cell names does not exist; 6. a row names a split the registry lacks,
//   or the registry holds a split no row uses; 7. a MEASURE CHANGED UNDER ITS NAME (GL-LG-02): every script a row names is pinned by hash in
//   experiments/zero-overlap/measures.jsonl (append-only, with a reason), and a script whose bytes differ from its latest pin fails until the change is
//   recorded (`node gym/ledger-check.mjs --pin --why "..."`) or the number is re-run as a new row. "The numbers dropped because the measure changed" is then a
//   line in the record, not a surprise. Row order is chronological. Pure: it reads files and judges; it runs nothing (--pin only appends to measures.jsonl).
import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROLE_LABEL = Object.freeze({ held: "HELD-OUT", fresh: "FRESH", reused: "REUSED", dev: "DEV", explore: "EXPLORATORY" });
const LABELS = Object.values(ROLE_LABEL);
const ONCE = new Set(["held", "fresh"]);

export function parseLedger(md) {
  const rows = [];
  for (const line of String(md).split("\n")) {
    if (!/^\| \d+ \|/.test(line)) continue;
    const c = line.trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim());
    if (c.length !== 7) { rows.push({ n: Number(c[0]), malformed: true }); continue; }
    rows.push({ n: Number(c[0]), claim: c[1], result: c[2], label: c[3], splits: c[4].split(",").map((x) => x.trim()).filter(Boolean).map((x) => { const [id, role] = x.split(":"); return { id, role }; }), stamp: c[5], repro: c[6] });
  }
  return rows;
}

/** checkLedger({ rows, splits, exists }) -> string[] of problems (empty = the ledger's labels hold). `exists(rel)` says whether a named script exists. */
export function checkLedger({ rows = [], splits = {}, exists = () => true, pins, shaOf = () => null } = {}) {
  const out = [];
  const used = new Map();
  for (const r of [...rows].sort((a, b) => a.n - b.n)) {
    if (r.malformed) { out.push(`ROW ${r.n}: malformed (7 cells expected)`); continue; }
    const roles = new Set();
    for (const s of r.splits) {
      if (!ROLE_LABEL[s.role]) { out.push(`ROW ${r.n}: split ${s.id} has unknown role "${s.role}"`); continue; }
      if (!splits[s.id]) { out.push(`ROW ${r.n}: split ${s.id} is not in splits.json`); continue; }
      roles.add(s.role);
      if (!used.has(s.id)) used.set(s.id, []);
      const prior = used.get(s.id);
      if (ONCE.has(s.role) && prior.length) out.push(`ROW ${r.n}: scores split ${s.id} as ${s.role}, but row ${prior[0].n} already scored it (${prior[0].role}); a held-out/fresh set is read once, so this row is dev, reused or explore`);
      prior.push({ n: r.n, role: s.role });
    }
    const want = new Set([...roles].map((x) => ROLE_LABEL[x])), have = new Set(r.label.split("+").map((x) => x.trim()).filter(Boolean));
    if (want.size !== have.size || [...want].some((x) => !have.has(x))) out.push(`ROW ${r.n}: label "${r.label}" is not the labels of its roles (${[...want].sort().join(" + ") || "none"})`);
    for (const t of LABELS) if (new RegExp(`\\b${t}\\b`).test(r.result) && !have.has(t)) out.push(`ROW ${r.n}: the Result text says ${t} but the row's label is "${r.label}"`);
    const exploratoryOnly = have.size === 1 && have.has("EXPLORATORY");
    if (!exploratoryOnly && !/[0-9a-f]{8,}/i.test(r.stamp)) out.push(`ROW ${r.n}: no stamp (a pre-registration sha), and the row is not purely exploratory`);
    for (const m of r.repro.matchAll(/([\w./-]+\.(?:py|mjs|js))(?![\w])/g)) {
      if (!exists(m[1])) { out.push(`ROW ${r.n}: Reproduce names ${m[1]}, which does not exist`); continue; }
      if (pins === undefined) continue;
      const pin = latestPin(pins, r.n, m[1]), now = shaOf(m[1]);
      if (!pin) out.push(`ROW ${r.n}: ${m[1]} is not pinned in measures.jsonl (a measure with no pin can change under its name)`);
      else if (now !== pin.sha256) out.push(`ROW ${r.n}: the measure ${m[1]} changed since its pin of ${pin.at} (${pin.why}); the number may no longer be the one reported: re-run it as a new row, or record the change with --pin --why "..."`);
    }
  }
  for (const id of Object.keys(splits)) {
    if (!used.has(id)) out.push(`SPLIT ${id}: no row uses it`);
    for (const k of ["what", "regenerate"]) if (!splits[id][k]) out.push(`SPLIT ${id}: no "${k}"`);
  }
  return out;
}

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
/** pins: parsed lines of measures.jsonl in file order; the latest line for a (row, file) is the pin in force. */
export function latestPin(pins, n, file) { let p = null; for (const x of pins) if (x.row === n && x.file === file) p = x; return p; }
export function parsePins(text) {
  const out = [];
  for (const line of String(text).split("\n")) { if (!line.trim()) continue; try { const x = JSON.parse(line); if (x.schema === "MeasurePin@1" && Number.isInteger(x.row) && x.file && x.sha256 && x.why) out.push(x); else out.push({ bad: line }); } catch { out.push({ bad: line }); } }
  return out;
}
/** the pins to append: for each (row, file) whose pin is missing or whose bytes changed. */
export function pinsToWrite({ rows, pins, shaOf, exists, why, at }) {
  const out = [];
  for (const r of rows) for (const m of r.repro.matchAll(/([\w./-]+\.(?:py|mjs|js))(?![\w])/g)) {
    if (!exists(m[1])) continue;
    const pin = latestPin(pins, r.n, m[1]), now = shaOf(m[1]);
    if (!pin || pin.sha256 !== now) out.push({ schema: "MeasurePin@1", row: r.n, file: m[1], sha256: now, at, why });
  }
  return out;
}

export function checkFiles(dir) {
  const rows = parseLedger(fs.readFileSync(path.join(dir, "LEDGER.md"), "utf8"));
  const splits = JSON.parse(fs.readFileSync(path.join(dir, "splits.json"), "utf8")).splits;
  const pinText = fs.existsSync(path.join(dir, "measures.jsonl")) ? fs.readFileSync(path.join(dir, "measures.jsonl"), "utf8") : "";
  const parsed = parsePins(pinText), bad = parsed.filter((x) => x.bad).map((x) => `measures.jsonl: not a valid MeasurePin@1 line: ${x.bad.slice(0, 80)}`);
  const problems = checkLedger({ rows, splits, exists: (rel) => fs.existsSync(path.join(dir, rel)), pins: parsed.filter((x) => !x.bad), shaOf: (rel) => sha256(fs.readFileSync(path.join(dir, rel))) });
  return [...bad, ...problems];
}

if (import.meta.url === `file://${process.argv[1]}` || (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href)) {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "experiments", "zero-overlap");
  const args = process.argv.slice(2);
  if (args.includes("--pin")) {
    const why = args.includes("--why") ? args[args.indexOf("--why") + 1] : null;
    if (!why) { console.error("--pin is a decision: say why (--why \"...\")"); process.exit(2); }
    const rows = parseLedger(fs.readFileSync(path.join(dir, "LEDGER.md"), "utf8"));
    const file = path.join(dir, "measures.jsonl"), pins = parsePins(fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "").filter((x) => !x.bad);
    const add = pinsToWrite({ rows, pins, shaOf: (rel) => sha256(fs.readFileSync(path.join(dir, rel))), exists: (rel) => fs.existsSync(path.join(dir, rel)), why, at: new Date().toISOString().slice(0, 10) });
    if (add.length) fs.appendFileSync(file, add.map((x) => JSON.stringify(x)).join("\n") + "\n");
    console.log(`ledger-check: pinned ${add.length} measure(s)`);
    process.exit(0);
  }
  const problems = checkFiles(dir);
  if (problems.length) { console.error(`ledger-check: ${problems.length} problem(s)\n` + problems.map((p) => "  " + p).join("\n")); process.exit(1); }
  console.log("ledger-check: every label holds (rows, splits, stamps, scripts) and every measure is pinned");
}
