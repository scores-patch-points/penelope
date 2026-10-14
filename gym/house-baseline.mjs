// gym/house-baseline.mjs — the append-only record of the house's KNOWN red.
//
// The house duties (the four handmaidens, check-tapestry) were on no default
// gate: run by hand, all four were red and nothing blocked anything. Making the
// gate permanently red would make it meaningless; making it silent would hide
// the debt. The ratchet is the third thing: the red that exists is RECORDED
// here, once, and the gate fails only on red that is not recorded.
//
// The file is gym/house-baseline.jsonl, one JSON object per line, APPEND-ONLY:
//   { schema: "HouseBaseline@1", op: "red",   id, line, at, why }  a red line the house knowingly carries
//   { schema: "HouseBaseline@1", op: "green", id, at, why }        that line was fixed (a regression is NEW red again)
// A line is currently-known-red iff its LAST op is "red". Nothing is deleted:
// the history of what was red, and when it was fixed, is the record.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SCHEMA = "HouseBaseline@1";
const HERE = path.dirname(fileURLToPath(import.meta.url));
export const BASELINE_FILE = path.join(HERE, "house-baseline.jsonl");

/** All records in file order; a malformed line is an error, named. */
export function readBaseline(file = BASELINE_FILE) {
  if (!fs.existsSync(file)) return { records: [], errors: [] };
  const records = [], errors = [];
  fs.readFileSync(file, "utf8").split("\n").forEach((l, i) => {
    if (!l.trim()) return;
    try {
      const r = JSON.parse(l);
      if (r?.schema !== SCHEMA || !["red", "green"].includes(r.op) || typeof r.id !== "string" || !r.id) throw new Error("not a HouseBaseline@1 record");
      records.push(r);
    } catch (e) { errors.push(`line ${i + 1}: ${e.message}`); }
  });
  return { records, errors };
}

/** The set of ids currently known red (last op wins). */
export function knownRed(records) {
  const last = new Map();
  for (const r of records) last.set(r.id, r.op);
  return new Set([...last].filter(([, op]) => op === "red").map(([id]) => id));
}

export const isKnownRed = (id, file = BASELINE_FILE) => knownRed(readBaseline(file).records).has(id);

/** APPEND records in one write (a single atomic append, never a rewrite). */
export function appendRecords(recs, file = BASELINE_FILE) {
  if (!recs.length) return 0;
  fs.appendFileSync(file, recs.map((r) => JSON.stringify({ schema: SCHEMA, ...r })).join("\n") + "\n");
  return recs.length;
}
