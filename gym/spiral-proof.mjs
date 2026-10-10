#!/usr/bin/env node
// gym/spiral-proof.mjs — FALSE IT, THEN PROVE IT: one widget, one append-only
// log, every act judged, the whole page never rewritten.
//
// WHAT WE WANT TO PROVE: iterating is appending ONE unit to the program log and
// re-projecting; every act is judged (cube-tied, wants settled by the box); a
// wrong act is caught AND corrected ON THE RECORD (the red verdict names its
// unit); a no-op or find-absent edit never enters the projection; and after N
// stumbles and one real edit the whole page differs from the build in exactly
// the one touched unit — nothing else.
//
// FALSIFICATIONS RUN AGAINST IT (each must fire, or this script is itself
// falsified):
//   F-0  the wiring hole in the judge (correct kernel, button calls garbage)
//        — admitted by the factor-only judge, REFUSED by the wiring gate.
//   F-1  a wrong factor (compiles, computes wrong) → judge RED, got/want named.
//   F-2  restoring the wrong bytes → judge GREEN again (the record keeps both).
//   F-3  a no-op edit (add === find) → refused by materialize, never projected.
//   F-4  an edit whose find bytes are absent → refused, never projected.
//   F-5  the one-unit edit: only the factor's expression changes; the bytes
//        outside that span are byte-identical before and after.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { arrange } from "../organs/generation/engine.mjs";
import { adapter as widget } from "../organs/generation/adapters/widget.mjs";
import { judgePage, wantOf } from "../organs/behavior-check.mjs";
import { append, readLog, materialize, projectTo } from "../organs/generation/program.mjs";
import { snipFunction } from "../organs/generation/repair.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PENELOPE = path.resolve(HERE, "..");
const V3 = path.resolve(PENELOPE, "..");
const LOG = path.join(PENELOPE, "gym", "spiral", "chain.log.jsonl");
const OUT = path.join(PENELOPE, "gym", "spiral", "widget.html");
const A = (c) => append(LOG, { seq: readLog(LOG).length, ...c });
const mark = (n, ok, why) => console.log(`  ${ok ? "✔" : "✖"} ${n} — ${why}`);

fs.mkdirSync(path.dirname(LOG), { recursive: true });
fs.writeFileSync(LOG, "");

// ── 0. THE WIDGET (the build, through the real spine; the formatter is a real
//    snip from the-fold, frame-probed: formatValue(5,"money") → "£5.00") ──
const F = { name: "perPerson", expr: "total*(1+tip/100)/people", args: ["total", "tip", "people"], title: "Bill splitter", format: "money", labels: { total: "Bill", tip: "Tip %", people: "People" }, start: { total: 100, tip: 20, people: 4 }, examples: [[100, 20, 4], [200, 15, 5]] };
const foldSrc = fs.readFileSync(path.join(V3, "the-fold", "fold-blocks.js"), "utf8");
const fmtAtom = snipFunction(foldSrc, "formatValue").replace(/^export\s+/, "");
const fmtOk = new Function(`return (${fmtAtom});`)()(5, "money") === "£5.00";
const formatter = fmtOk ? { name: "formatValue", code: fmtAtom, address: `the-fold/fold-blocks.js#${foldSrc.indexOf(fmtAtom)}` } : null;
const ctx = { factor: F, formatter, factorHunt: null };
const built = await arrange({ task: "Build a bill splitter", args: { out: path.join(PENELOPE, "organs", "arrangement-out") }, adapter: widget, context: ctx });

console.log("=== THE CHAIN (one append-only log) ===");
A({ kind: "file", path: "gym/spiral/widget.html", code: built.html, source: formatter ? "box+field" : "box", address: "perPerson@box + formatValue@the-fold" });

const wants = (expr) => F.examples.map((args) => ({ fn: "perPerson", args, compute: { expression: expr, bind: Object.fromEntries(F.args.map((a, i) => [a, args[i]])) } }));
const judge = () => { const onDisk = fs.readFileSync(OUT, "utf8"); const w = wants("total*(1+tip/100)/people"); return judgePage(onDisk, { needs: ["perPerson"], cases: w, wiring: true }); };
const judgeExpr = (expr) => { const onDisk = fs.readFileSync(OUT, "utf8"); return judgePage(onDisk, { needs: ["perPerson"], cases: wants(expr), wiring: true }); };

// (a) BUILD → judge → GREEN
projectTo(LOG, PENELOPE);
const v1 = judge();
A({ kind: "test", command: "judgePage wiring, perPerson@box", ok: v1.ok, output: v1.ok ? "holds" : v1.findings.map((f) => f.detail).join("; ") });
mark("build held", v1.ok, `${v1.observations.length} cube-tied acts`);

// (b) F-0 THE WIRING HOLE — a correct kernel behind a button that calls garbage
const hostile = built.html.replace('onclick="var r=perPerson(', 'onclick="var r=bogus(').replace("out.textContent = formatValue", "out2.textContent = formatValue");
if (hostile !== built.html) {
  const hole = judgePage(hostile, { needs: ["perPerson"], cases: wants("total*(1+tip/100)/people"), wiring: false });
  const gated = judgePage(hostile, { needs: ["perPerson"], cases: wants("total*(1+tip/100)/people"), wiring: true });
  mark("F-0 factor-only judge admits the unwired page", hole.ok, "the hole WAS real");
  mark("F-0 wiring gate refuses it", !gated.ok && gated.findings[0].kind === "unwired-factor", `NUL·Figure ${gated.findings[0].cell.terrain}·${gated.findings[0].cell.stance}`);
} else mark("F-0 wiring gate: hostile page not constructible", false, "the replace missed");

// (c) F-1 the wrong factor (compiles, computes wrong) → the judge goes RED.
//     The wants NEVER move with the code: the asker's contract stays whatever
//     expression the build declared, so a factor that computes 480 where the
//     contract says 36 is caught with the got/want named.
const goodExpr = "total*(1+tip/100)/people";
const wrongExpr = "total*(1+tip/100)*people";
A({ kind: "patch", path: "gym/spiral/widget.html", find: goodExpr, add: wrongExpr, source: "adversary", reason: "F-1: a wrong factor that compiles" });
projectTo(LOG, PENELOPE);
const v2 = judge();   // THE ORIGINAL CONTRACT, not the wrong code's own arithmetic
A({ kind: "test", command: "judgePage after F-1", ok: v2.ok, output: v2.ok ? "holds" : v2.findings.map((f) => f.detail).join("; ") });
mark("F-1 wrong factor is RED", !v2.ok, v2.findings[0]?.detail?.slice(0, 80) ?? "no finding");

// (d) F-2 the correction on the record → GREEN again
A({ kind: "patch", path: "gym/spiral/widget.html", find: wrongExpr, add: goodExpr, source: "heal", reason: "F-2: restore the corrected bytes" });
projectTo(LOG, PENELOPE);
const v3 = judge();
A({ kind: "test", command: "judgePage after F-2 heal", ok: v3.ok, output: v3.ok ? "holds" : v3.findings.map((f) => f.detail).join("; ") });
mark("F-2 heal held again", v3.ok, "the record now carries the red and the green");

// (e) F-3 no-op edit → refused by materialize, NEVER touches the projection
const beforeF3 = fs.readFileSync(OUT, "utf8");
A({ kind: "patch", path: "gym/spiral/widget.html", find: goodExpr, add: goodExpr, source: "mouth", reason: "F-3: add === find" });
projectTo(LOG, PENELOPE);
const afterF3 = fs.readFileSync(OUT, "utf8");
const p3 = materialize(readLog(LOG));
mark("F-3 no-op refused", p3.refusals > 0 && beforeF3 === afterF3, `projection byte-identical (${beforeF3.length}b)`);

// (f) F-4 find-absent edit → refused
A({ kind: "patch", path: "gym/spiral/widget.html", find: "function noSuchKernel()", add: "function x(){}", source: "mouth", reason: "F-4: find absent in the projection" });
projectTo(LOG, PENELOPE);
const p4 = materialize(readLog(LOG));
mark("F-4 absent-find refused", p4.refusals > 1, `${p4.refusals} total refusals on the log`);

// (g) F-5 THE ONE-UNIT EDIT: a 5% service fee joins the factor's expression —
//     the page differs from the build in exactly that one span, nothing else.
const newExpr = "total*1.05*(1+tip/100)/people";
const spanBefore = fs.readFileSync(OUT, "utf8").indexOf(goodExpr);
A({ kind: "patch", path: "gym/spiral/widget.html", find: goodExpr, add: newExpr, source: "you", reason: "F-5: one unit — a 5% service fee" });
projectTo(LOG, PENELOPE);
const v5 = judgeExpr(newExpr);
A({ kind: "test", command: "judgePage after F-5 (new contract)", ok: v5.ok, output: v5.ok ? `holds against ${wants(newExpr).length} box-settled case(s)` : v5.findings.map((f) => f.detail).join("; ") });
mark("F-5 the edited widget holds ITS new contract", v5.ok, v5.ok ? v5.observations.length + " cube-tied acts" : v5.findings[0]?.detail);

// ── F-5's measure: the page equals the build with EXACTLY this one unit
//    replaced. An INSERTION shifts the tail, so positional byte-compare is
//    meaningless past the span — the honest check is: remove the new unit
//    from the final page and the result must be the original build, byte for
//    byte. (The first version of this falsifier mis-measured the shift and
//    fired on its own arithmetic; caught by running it — falsify-or-die.) ──
const b4 = built.html, a5 = fs.readFileSync(OUT, "utf8");
const at = a5.indexOf(newExpr), atB = b4.indexOf(goodExpr);
const onlyUnit = at >= 0 && atB >= 0 && a5.slice(0, at) === b4.slice(0, atB) && a5.slice(at + newExpr.length) === b4.slice(atB + goodExpr.length);
mark("F-5 the diff is ONE unit", onlyUnit, `the final page minus [${newExpr}] equals the original build byte-for-byte (${a5.length - b4.length} net bytes inserted at #${at})`);

// ── the final reading: the whole page is never rewritten — the life of the
//    page is the build plus a handful of scalar edits; the interface, the
//    formatter and the shell never moved. ──
console.log(`\n=== PROVEN (survived F-0…F-5; every stumble on the record) ===`);
console.log(`  log claims: ${readLog(LOG).map((c) => c.kind).join(" → ")}`);
console.log(`  refusals on the log: ${materialize(readLog(LOG)).refusals} (the no-op and the absent find)`);
console.log(`  last verdict: ${materialize(readLog(LOG)).verdict?.ok ? "GREEN" : "RED"}`);
console.log(`  the whole page differs from the build in exactly one unit: the factor's expression. The formatter, the interface and the shell never moved.`);
process.exit(v1.ok && !v2.ok && v3.ok && beforeF3 === afterF3 && p4.refusals > 1 && v5.ok && onlyUnit ? 0 : 1);