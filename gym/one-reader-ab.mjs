// gym/one-reader-ab.mjs — the A/B for moving the prose box onto khora's ONE reader (the Isthmus; THE-READING-PIPELINE.md).
// Same material, same units, both arms model-free:
//   A  default (composed)        the composed positional reader penelope assembled itself (gfp-relations-composed.js)
//   B  PENELOPE_READER=one       khora's master pipeline (read-core.mjs::readWith), the language declared or heard
// Material: the first 12 .txt articles, in path order, of Zenodotus 02-encyclopedic/wikipedia (real prose, not written for this).
// Units: "What did <referent> do?" for each article's 4 most-mentioned referents (buildReferents), the same for both arms.
// Measured per arm: units settled; settles whose label is VERBATIM in a material sentence that also holds both ends (the old
// falsifier's criterion: a settle that is not a verbatim clause is a fabrication with a clean face); settles the DMD universe admits.
//   KHORA_HOME=<khora> node gym/one-reader-ab.mjs [--zenodotus=<dir>]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const ZEN = arg("zenodotus", path.join(process.env.HOME, "Downloads/workspace/Zenodotus"));
if (process.argv.includes("--arm")) {
  const { computeSettles } = await import("../organs/generation/adapters/prose.mjs");
  const { kernelImport } = await import("../organs/kernel-reach.mjs");
  const { buildReferents } = await kernelImport("khora", "native/the-fold/referents.js");
  const dir = path.join(ZEN, "02-encyclopedic", "wikipedia");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".txt")).sort().slice(0, 12);
  const rows = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(dir, f), "utf8").slice(0, 20000);
    const R = buildReferents(text);
    const low = text.toLowerCase();
    const count = (rep) => low.split(rep.toLowerCase()).length - 1;
    const top = [...(R.index?.referents ?? [])].map((id) => ({ id, rep: R.represent(id) })).filter((x) => x.rep && x.rep.length >= 3).map((x) => ({ ...x, n: count(x.rep) })).sort((a, b) => b.n - a.n || (a.rep < b.rep ? -1 : 1)).slice(0, 4);
    const units = top.map((x, i) => ({ id: `${f}#${i}`, spec: `What did ${x.rep} do?` }));
    await computeSettles(units, text, { corpus: f });
    const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.toLowerCase());
    for (const u of units) {
      const s = u.settle;
      const verbatim = !!s && sentences.some((x) => x.includes(String(s.label).toLowerCase()) && x.includes(String(s.end1).toLowerCase()) && x.includes(String(s.end2).toLowerCase()));
      const sent = s ? text.split(/(?<=[.!?])\s+|\n+/).find((x) => { const l = x.toLowerCase(); return l.includes(String(s.label).toLowerCase()) && l.includes(String(s.end1).toLowerCase()); }) ?? null : null;
      rows.push({ unit: u.id, spec: u.spec, sentence: sent ? sent.slice(0, 220) : null, settled: !!s, admitted: s ? s.admitted !== false : null, verbatim: s ? verbatim : null, settle: s ? `${s.end1} —${s.label}→ ${s.end2}` : null, basis: s?.basis?.slice(0, 120) ?? null });
    }
  }
  console.log(JSON.stringify(rows));
  process.exit(0);
}
const run = (env) => JSON.parse(execFileSync(process.execPath, [new URL(import.meta.url).pathname, "--arm", `--zenodotus=${ZEN}`], { env: { ...process.env, ...env }, encoding: "utf8", maxBuffer: 64 << 20 }).trim().split("\n").pop());
const A = run({ PENELOPE_READER: "composed" }), B = run({ PENELOPE_READER: "one" });
const sum = (rows) => ({ units: rows.length, settled: rows.filter((r) => r.settled).length, verbatim: rows.filter((r) => r.verbatim).length, notVerbatim: rows.filter((r) => r.settled && !r.verbatim).length, admitted: rows.filter((r) => r.settled && r.admitted).length });
const out = { material: "Zenodotus 02-encyclopedic/wikipedia, first 12 articles (20k chars each)", A_composed: sum(A), B_oneReader: sum(B),
  admittedB: B.filter((r) => r.settled && r.admitted).map((r) => ({ spec: r.spec, settle: r.settle, sentence: r.sentence })),
  admittedA: A.filter((r) => r.settled && r.admitted).map((r) => ({ spec: r.spec, settle: r.settle, sentence: r.sentence })),
  examples: { A: A.filter((r) => r.settled).slice(0, 6).map((r) => [r.spec, r.settle, r.verbatim]), B: B.filter((r) => r.settled).slice(0, 6).map((r) => [r.spec, r.settle, r.verbatim]) } };
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(new URL("./one-reader-ab-RESULT.json", import.meta.url), JSON.stringify({ ...out, rows: { A, B } }, null, 1) + "\n");
