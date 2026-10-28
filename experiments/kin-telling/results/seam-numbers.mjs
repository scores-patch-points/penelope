// POST-HOC (after the held-out run; changes no bar): khora's seamReport (native/organs/seam-ledger.js, read-only clone) over the composed output, per question.
// Two typings of my segments: STRICT = only Russian text spans (ru) and the asker's span (ask) are "source" (addressed spans of U or W); everything else is frame or value.
// WIDE = every addressed material segment (ru, ask, and the copied giver-row / record strings) is "source"; frame stays frame; the recomputed count is "value".
import fs from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
const KHORA = process.env.KHORA_HOME;
const { seamReport } = await import(pathToFileURL(`${KHORA}/native/organs/seam-ledger.js`).href);
const dir = fileURLToPath(new URL(".", import.meta.url));
const map = (mode) => (g) => {
  if (g.k === "f") return { kind: "frame", t: g.k === "ru" || g.k === "ask" ? `«${g.t}»` : g.t };
  const t = g.k === "ru" || g.k === "ask" ? `«${g.t}»` : g.t;
  if (g.k === "val") return { kind: "value", t };
  if (mode === "strict") return g.k === "ru" || g.k === "ask" ? { kind: "source", t, address: g.a } : { kind: "value", t };
  return { kind: "source", t, address: g.a };
};
const pct = (x) => (x == null ? "—" : (100 * x).toFixed(1) + "%");
for (const w of ["dev", "heldout"]) {
  const c = JSON.parse(fs.readFileSync(`${dir}composed-${w}.json`, "utf8"));
  console.log(`\n=== ${w}: per question (mouthShare / addressedShare strict / addressedShare wide / seamDensity wide / contract)`);
  const all = { strict: [], wide: [] };
  for (const d of [...c.docs, ...c.batteries].filter((x) => x.sentences.length)) {
    const row = {};
    for (const mode of ["strict", "wide"]) {
      const sents = d.sentences.map((s) => ({ segs: s.segs.map(map(mode)) }));
      row[mode] = seamReport(sents); all[mode].push(...sents);
    }
    if (d.id.startsWith("Q")) console.log(`${d.id.padEnd(4)} mouth ${pct(row.wide.mouthShare)}  strict ${pct(row.strict.addressedShare)}  wide ${pct(row.wide.addressedShare)}  seamDensity(wide) ${pct(row.wide.seamDensity)}  contract ${row.wide.contract.ok && row.strict.contract.ok ? "ok" : "VIOLATION"}`);
  }
  const S = seamReport(all.strict), W = seamReport(all.wide);
  console.log(`ALL  ${w}: sentences ${all.wide.length}; mouthShare ${pct(W.mouthShare)}; addressedShare strict ${pct(S.addressedShare)}, wide ${pct(W.addressedShare)}; seamDensity strict ${pct(S.seamDensity)}, wide ${pct(W.seamDensity)}; contract ok strict ${S.contract.ok} wide ${W.contract.ok}; sentences with no source segment (strict): ${all.strict.filter((s) => !s.segs.some((g) => g.kind === "source")).length}, (wide): ${all.wide.filter((s) => !s.segs.some((g) => g.kind === "source")).length}`);
}
