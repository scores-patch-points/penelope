// gym/house-ratchet.mjs — THE HOUSE'S DEFAULT GATE: red may not GROW.
//
//   node gym/house-ratchet.mjs            gate: exit 1 on any red line not in the baseline
//   node gym/house-ratchet.mjs --list     the current red lines
//   node gym/house-ratchet.mjs --record --why "<reason>"
//                                          APPEND current red lines not in the baseline
//                                          (a decision: you are knowingly carrying them)
//   node gym/house-ratchet.mjs --tighten --why "<reason>"
//                                          APPEND green marks for baseline lines no longer red
//
// What it reads: check-tapestry (WEAVE, README, REF, COVER, DRIFT ...) and the
// four handmaidens (Eurycleia, Autonoe, Iphthime, Telemachus). Every finding is
// one id, `<member>:<kind>:<subject>`, so a fixed line and a regressed line are
// distinguishable. The baseline is gym/house-baseline.jsonl (append-only,
// gym/house-baseline.mjs): a fixed line stays on the record as `green`, and if
// it ever returns it is NEW red, not a known one.
//
// Falsifying control: gym/house-ratchet.test.mjs constructs a new red line and
// watches the gate fail, a known one and watches it pass, a fixed-then-
// regressed one and watches it fail again.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { inspect } from "./check-tapestry.mjs";
import { houseRound } from "./handmaidens.mjs";
import { readBaseline, knownRed, appendRecords, BASELINE_FILE } from "./house-baseline.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** One current red finding per entry: { id, line }. Deterministic order. */
export async function redLines(root = ROOT) {
  const out = [];
  for (const p of inspect(root).problems) out.push({ id: `tapestry:${p}`, line: p });
  const round = await houseRound();
  for (const m of round.members) {
    if (m.error) { out.push({ id: `${m.member}:could-not-stand-watch`, line: `${m.member} could not stand watch: ${m.error}` }); continue; }
    const add = (kind, subjects, text) => { for (const s of subjects ?? []) out.push({ id: `${m.member}:${kind}:${s}`, line: `${m.member}: ${text(s)}` }); };
    if (m.member === "eurycleia") add("unnamed", m.unnamed, (s) => `${s} draws but is named by no thread`);
    if (m.member === "autonoe") add("unrecorded", m.unrecorded, (s) => `${s} makes a draw call and writes no swatch row`);
    if (m.member === "iphthime") {
      add("uncited", m.uncited, (s) => `${s} is declared in the EOT and cited by no thread`);
      add("ghost-thread", m.ghostThreads, (s) => `the EOT asserts a ${s} thread the spec never grew`);
      add("no-path", m.noPath, (s) => `${s} has no evidence path`);
    }
    if (m.member === "telemachus") add("breach", m.breaches, (s) => `${s} draws past the sanctioned door`);
  }
  const seen = new Set();
  return out.filter((r) => (seen.has(r.id) ? false : seen.add(r.id)));
}

/** Pure: current red vs the baseline records. */
export function compare(current, records) {
  const known = knownRed(records);
  const cur = new Set(current.map((r) => r.id));
  return {
    added: current.filter((r) => !known.has(r.id)),            // NEW red: the gate's failure
    carried: current.filter((r) => known.has(r.id)),           // known red, still red
    fixed: [...known].filter((id) => !cur.has(id)).sort(),     // known red that is now green
  };
}

export async function gate({ root = ROOT, file = BASELINE_FILE } = {}) {
  const { records, errors } = readBaseline(file);
  const current = await redLines(root);
  const c = compare(current, records);
  return { ok: errors.length === 0 && c.added.length === 0, errors, ...c, red: current.length };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const why = args.includes("--why") ? args[args.indexOf("--why") + 1] : null;
  const at = new Date().toISOString().slice(0, 10);
  const g = await gate();
  if (args.includes("--list")) {
    for (const r of await redLines()) console.log(r.id);
    process.exit(0);
  }
  if (args.includes("--record")) {
    if (!why) { console.error("--record is a decision: say why (--why \"...\")"); process.exit(2); }
    const n = appendRecords(g.added.map((r) => ({ op: "red", id: r.id, line: r.line, at, why })));
    console.log(`recorded ${n} red line(s) in ${path.relative(ROOT, BASELINE_FILE)}`);
    process.exit(0);
  }
  if (args.includes("--tighten")) {
    if (!why) { console.error("--tighten needs a reason (--why \"...\")"); process.exit(2); }
    const n = appendRecords(g.fixed.map((id) => ({ op: "green", id, at, why })));
    console.log(`marked ${n} line(s) green`);
    process.exit(0);
  }
  for (const e of g.errors) console.error("BASELINE-ERROR", e);
  if (g.fixed.length) console.log(`house ratchet: ${g.fixed.length} baseline line(s) are green now — run with --tighten --why "..." to lock the gain`);
  if (!g.ok) {
    console.error(`HOUSE RATCHET: ${g.added.length} NEW red line(s) the baseline does not carry:`);
    for (const r of g.added) console.error("  " + r.line);
    console.error("Fix the finding (the suitor is the work left undone), or — if you are knowingly carrying it — `node gym/house-ratchet.mjs --record --why \"...\"` and commit the appended baseline.");
    process.exit(1);
  }
  console.log(`house ratchet: ${g.red} red line(s), all known (${g.carried.length}); none new`);
}
