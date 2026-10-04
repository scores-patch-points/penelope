// gym/to-notebook.mjs — the notebook loom, v0.
//
// Reads the ladder records + live log and writes a Jupyter notebook:
// markdown cells carry the specs, code cells RE-RUN the organ selftests
// (node, captured), outputs stored in the cells. Model-drawn history is
// markdown (recorded, never re-runnable asen — draws don't replay).
// Usage: node gym/to-notebook.mjs [--out notebook.ipynb]
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const run = (mod) => {
  try {
    const out = execSync(`node --input-type=module -e "import('${path.join(ROOT, "organs", mod)}').then(m=>m.selftest())"`, { encoding: "utf8", timeout: 60000 });
    return { ok: true, out };
  } catch (e) { return { ok: false, out: String(e.stdout ?? e.message).slice(0, 2000) }; }
};
const md = (source) => ({ cell_type: "markdown", metadata: {}, source: Array.isArray(source) ? source : [source] });
const code = (source, output) => ({
  cell_type: "code", execution_count: output.ok ? 1 : null, metadata: {},
  source: Array.isArray(source) ? source : [source],
  outputs: [{ output_type: "stream", name: output.ok ? "stdout" : "stderr", text: output.out }],
});
const live = (() => { try { return fs.readFileSync(path.join(HERE, "ladder-live.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } })();
const organs = ["consensus-gate.mjs", "detail-fetch.mjs", "behavior-check.mjs", "freshness.mjs"];
const cells = [
  md("# Penelope notebook — the pattern-book\nEach code cell re-runs an organ's selftests **now**; outputs are recorded in the cells. Model-drawn history below is markdown: recorded, never replayed (draws don't reproduce)."),
  ...organs.flatMap((o) => {
    const r = run(o);
    return [md(`## ${o} — re-run ${r.ok ? "PASS" : "FAIL"}`), code(`// re-runs organs/${o} selftest via node\n`, r)];
  }),
  md(`## Gym log — ${live.length} entries\n` + (live.length ? live.map((e) => `- ${new Date(e.t).toISOString()} ${e.kind}/${e.task ?? ""} ${e.pass === undefined ? "" : e.pass ? "PASS(mouth)" : "FAIL(box)"}`).join("\n") : "_no live attempts yet — open /chat and press a rung button._")),
];
const nb = { nbformat: 4, nbformat_minor: 5, metadata: { kernelspec: { display_name: "Node.js (recorded outputs)", language: "javascript", name: "javascript" } }, cells };
const out = process.argv[2] ?? path.join(ROOT, "penelope-notebook.ipynb");
fs.writeFileSync(out, JSON.stringify(nb, null, 1));
const pass = cells.filter((c) => c.cell_type === "code" && c.execution_count === 1).length;
console.log(`wrote ${out}: ${cells.length} cells, ${pass}/${organs.length} organ cells green`);
if (pass !== organs.length) process.exit(1);
