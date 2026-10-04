#!/usr/bin/env node
// gym/nomodel-summary.mjs — print a NoModelWeave@1 report.json as the boundary table.
//   node gym/nomodel-summary.mjs report.json [report.json ...]
import fs from "node:fs";
import { table } from "./weave-nomodel.mjs";

for (const f of process.argv.slice(2)) {
  const r = JSON.parse(fs.readFileSync(f, "utf8"));
  console.log(`\n## ${f}\nhunt=${r.hunt}  field=[${(r.field ?? []).map((x) => x.split("/").pop()).join(", ")}]  model-door calls=${r.modelDoorCalls}  swatch growth=${r.anySwatchGrowth}`);
  console.log(table(r.rows, [
    { h: "target", f: (x) => x.target },
    { h: "units", f: (x) => x.units },
    { h: "field c/v", f: (x) => `${x.engineClaimed.field}/${x.diagnosis ? x.diagnosis.perUnit.filter((p) => p.stage === "field" && p.verified).length : "-"}` },
    { h: "hunt c/v", f: (x) => `${x.engineClaimed.hunt}/${x.diagnosis ? x.diagnosis.perUnit.filter((p) => p.stage === "hunt" && p.verified).length : "-"}` },
    { h: "mouth-needed", f: (x) => x.engineClaimed.modelRequired },
    { h: "unresolved", f: (x) => x.units - (x.diagnosis?.verifiedUnits ?? 0) },
    { h: "words", f: (x) => x.materializedWords },
    { h: "distinct", f: (x) => x.distinctContributions },
    { h: "fold(shipped)", f: (x) => x.diagnosis ? `${x.diagnosis.foldShipped.ok ? "ok" : "no"} adm=${x.diagnosis.foldShipped.admittedDistinct} ref=${x.diagnosis.foldShipped.refused}` : "-" },
    { h: "fold(contract)", f: (x) => x.diagnosis ? `${x.diagnosis.foldContract.ok ? "ok" : "no"} adm=${x.diagnosis.foldContract.admittedDistinct} gaps=${x.diagnosis.foldContract.gaps.length}/${x.diagnosis.foldContract.beats} ref=${x.diagnosis.foldContract.refused}` : "-" },
    { h: "ms", f: (x) => x.elapsedMs },
  ]));
  const x = r.rows[0];
  const same = new Set(r.rows.map((y) => y.outcomeVector + y.artifactHash)).size === 1;
  console.log(`rows identical across targets: ${same}`);
  if (x.diagnosis) {
    const d = x.diagnosis;
    console.log(`verified ${d.verifiedUnits}/${d.units ?? x.units} (content ${d.verifiedContentUnits}/${d.contentUnits}); units with ANY clearing evidence in the field: ${d.unitsWithAnyClearingEvidence}/${x.units}`);
    console.log("hunted pages:", d.huntedPages.length, "| markup in hunt contribution:", d.perUnit.filter((p) => p.markup).length);
    const hp = d.perUnit.filter((p) => p.huntPageBest).map((p) => `${p.unit}→${p.huntPageBest.url.split("/").pop()} best=${p.huntPageBest.bestCoverage}%${p.huntPageBest.clears ? "✓" : "✗"}`);
    if (hp.length) console.log("hunted pages' own best evidence per unit:", hp.join(" | "));
    console.log("per-unit best-evidence coverage:", d.unitEvidence.map((e) => `${e.unit.split("·").map((w) => w.slice(0, 3)).join("·")}=${e.bestCoverage}%`).join(" "));
    console.log("fold shipped refusals:", JSON.stringify(d.foldShipped.refusedByReason), "| contract refusals:", JSON.stringify(d.foldContract.refusedByReason));
  }
  const p = x.provenance;
  console.log(`provenance: events=${p.events} sources=${p.sources} ${JSON.stringify(p.sourceKinds)} bytes=${p.jsonBytes} dangling=${p.dangling.count}${JSON.stringify(p.dangling.byField)} ranges ${JSON.stringify(p.byteRanges)} subPageAnchors=${p.contributionSourcesWithSubPageAnchor}/${p.contributionSources} reuse=${p.sourcesReusedByMultipleContributions} dupIdentity=${p.duplicateSourceIdentities}`);
  console.log("lineage:", JSON.stringify(p.lineage));
  console.log("verdict (shipped):", x.verdict?.reason, "-", x.verdict?.detail);
  if (r.ceiling) {
    const c = r.ceiling;
    const f = (k, v) => v && console.log(`ceiling ${k}: sources=${v.sources} groundWords=${v.groundWords} snips=${v.snips} snipWords=${v.snipWords} citationMarked=${v.citationMarked} fold-admitted=${v.admittedDistinct} (${v.admittedWords}w) refused=${JSON.stringify(v.refusedByReason)}`);
    f("field", c.field);
    if (c.huntedPages) console.log(`hunted pages=${c.huntedPages} relevant-to-task=${c.huntedRelevant?.length ?? 0} dropped=${JSON.stringify((c.huntedDropped ?? []).map((d) => d.why))}`);
    f("field+relevant hunted", c.fieldPlusRelevantHunted);
    if (c.structure) console.log("structural cap (read off the adapter source):", JSON.stringify(c.structure));
    if (c.topicHunt) console.log(`topic-hunt probe "${c.topicHunt.query}": relevant pages=${c.topicHunt.relevantPages}/${c.topicHunt.pages.length}; sum of fold-admitted words (upper bound)=${c.topicHunt.sumAdmittedWordsUpperBound}; snips=${c.topicHunt.sumSnips}`, c.topicHunt.pages.map((p) => `${p.url.split("/").pop()}:${p.relevant ? p.admittedWords + "w" : "off-topic"}`).join(" "));
  }
}
