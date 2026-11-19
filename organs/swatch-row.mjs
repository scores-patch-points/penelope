// organs/swatch-row.mjs — one line on the swatch for a model draw that does not pass through the engine's door (ESM).
// The CommonJS twin is gym/swatch-row.js (an organ may not import from gym/: the clean-checkout test loads organs alone) (the standalone writers). Autonoe requires that every draw lands a row: a draw that spends
// tokens and writes no row is a leak. The row records the ATTEMPT, before the response is read, so a refused draw is on the swatch too.
// SWATCH_PATH overrides the file (the selftest writes to a temp file and never touches gym/swatch.jsonl).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "gym", "swatch.jsonl");
export function swatch({ weave, engine, model, ok, evidence = "organs/swatch-row.mjs" } = {}) {
  const row = { schema: "Swatch@1", ts: new Date().toISOString(), weave: String(weave ?? "draw:unnamed"), class: "draw", engine: String(engine ?? "direct draw"),
    model: String(model ?? "unknown"), mouthCalls: 1, mouthBytes: 0, corpusBytes: 0, huntBytes: 0, boxBytes: 0, verdict: ok ? "drawn" : "refused", evidence };
  fs.appendFileSync(process.env.SWATCH_PATH || DEFAULT, JSON.stringify(row) + "\n");
  return row;
}
