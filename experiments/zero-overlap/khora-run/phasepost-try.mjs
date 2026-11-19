// Classify khora thin SVO triples into the 27 cells with phasepost.js and the real ActPrior@1 (VerbNet act table).
// (Zenodotus/derived-priors is outside the granted folder), so an EMPTY prior is injected: only the mechanical and copula tiers can fire,
// lexical verbs come back as typed gaps (never a guess).
import fs from "node:fs";
const K = "/Users/mlacy/Documents/khora-cast/khora/native";
const { makePhasepost } = await import(K + "/adapters/text/phasepost.js");
const { cellOf } = await import(K + "/kernel/cube.js");
const pri = await import(K + "/adapters/text/priors.js");
const { classify, grainOf } = makePhasepost({ actPrior: JSON.parse(fs.readFileSync('/Users/mlacy/Documents/khora-cast/Zenodotus/derived-priors/act-priors/act-prior-en.json','utf8')), cellOf, definiteDeterminers: pri.DEFINITE_DETERMINERS, indefiniteDeterminers: pri.INDEFINITE_DETERMINERS });
const triples = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const standing = {}, cells = {}, grains = {}, ex = [];
for (const t of triples) {
  const v = classify({ end1: t.subject, label: t.verb, end2: t.object });
  standing[v.standing] = (standing[v.standing] ?? 0) + 1;
  if (v.grain) grains[v.grain] = (grains[v.grain] ?? 0) + 1;
  if (v.cell && !v.cell.gap) { const k = `${v.op}·${v.grain}`; cells[k] = (cells[k] ?? 0) + 1; }
  if (ex.length < 12 && (v.standing === "copula" || v.standing === "mechanical")) ex.push({ s: t.subject, v: t.verb, o: t.object, op: v.op, grain: v.grain, standing: v.standing, because: v.because });
}
console.log(JSON.stringify({ triples: triples.length, standing, grains, cells }, null, 1));
console.log(ex.map((e) => JSON.stringify(e)).join("\n"));
