// node compare/smoke.mjs  -- EXPLORATORY smoke test of the comparator on DEV statement pairs (no claim). Question: about the target, every relation a concern.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import { compareStatements } from "./compare.mjs";
const HERE = path.dirname(fileURLToPath(import.meta.url)), DATA = path.join(HERE, "..", "data", "dev");
const P = JSON.parse(fs.readFileSync(path.join(HERE, "smoke-pairs.json"), "utf8"));
const declare = { language: "eng", by: "smoke-asker", at: "tag:smoke", acyclic: ["defeat", "beat", "kill", "succeed", "replace", "found", "command", "appoint", "capture", "invade", "precede", "follow"], functional: [], containers: {}, grain: "fine" };
const docs = new Map(); const get = (f) => { if (!docs.has(f)) { const d = JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8")); docs.set(f, { id: d.title, text: d.text }); } return docs.get(f); };
const R = {};
for (const kind of ["true", "imp"]) {
  const C = { Same: 0, Other: 0, Hold: 0, refused: 0, bothAbout: 0, aboutA: 0, aboutB: 0, satA: 0, satB: 0, kinds: {}, ex: [] };
  for (const p of P[kind]) {
    const d = get(p.doc);
    try {
      const r = await compareStatements({ A: { doc: d, span: p.A }, B: { doc: d, span: p.B }, question: { about: p.name, concerns: null }, declare });
      C[r.verdict] = (C[r.verdict] ?? 0) + 1;
      if (r.coverage) { if (r.coverage.aboutA > 0) C.aboutA++; if (r.coverage.aboutB > 0) C.aboutB++; if (r.coverage.saturatedA > 0) C.satA++; if (r.coverage.saturatedB > 0) C.satB++; if (r.coverage.aboutA > 0 && r.coverage.aboutB > 0) C.bothAbout++; }
      for (const x of r.differences ?? []) C.kinds[x.kind] = (C.kinds[x.kind] ?? 0) + 1;
      if ((kind === "true" && r.verdict === "Other") || (kind === "imp" && r.verdict === "Same")) C.ex.push({ name: p.name, A: r.trail?.A.statement.slice(0, 110), B: r.trail?.B.statement.slice(0, 110), d: (r.differences ?? []).slice(0, 2) });
    } catch (e) { C.refused++; }
  }
  R[kind] = C;
}
for (const [k, C] of Object.entries(R)) console.log(`${k.toUpperCase()} pairs ${P[k].length}: Same ${C.Same} Other ${C.Other} Hold ${C.Hold} refused/error ${C.refused}; claims about the referent: A side ${C.aboutA}, B side ${C.aboutB}, both ${C.bothAbout}; saturated: A ${C.satA}, B ${C.satB}; difference kinds ${JSON.stringify(C.kinds)}`);
console.log("true pairs called Other (false alarms):", JSON.stringify(R.true.ex, null, 1).slice(0, 1400)); console.log("impostor pairs called Same (false accepts):", JSON.stringify(R.imp.ex, null, 1).slice(0, 1400));
fs.writeFileSync(path.join(HERE, "smoke-result.json"), JSON.stringify(R, null, 1));
