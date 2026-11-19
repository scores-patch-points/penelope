// gym/swatch-row.js — the one-line swatch writer for the standalone essay writers (CommonJS).
// Every model draw those scripts make lands on gym/swatch.jsonl, as Autonoe requires: a draw that spends tokens and writes no
// row is a leak. The row records the draw ATTEMPT (before the response is read), so a refused or failed draw is on the swatch too.
const fs = require("fs");
const path = require("path");
function swatch(script, model, ok) {
  const row = { schema: "Swatch@1", ts: new Date().toISOString(), weave: "draw:" + path.basename(String(script), ".js"), class: "draw",
    engine: "ollama direct (standalone gym writer)", model: String(model), mouthCalls: 1, mouthBytes: 0, corpusBytes: 0, huntBytes: 0, boxBytes: 0,
    verdict: ok ? "drawn" : "refused", evidence: "gym/swatch-row.js" };
  fs.appendFileSync(path.join(__dirname, "swatch.jsonl"), JSON.stringify(row) + "\n");
}
module.exports = { swatch };
