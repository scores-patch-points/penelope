import fs from "node:fs";
const { declareAsker, judgeAsker } = await import(process.argv[2]);
const rows = JSON.parse(fs.readFileSync("surf-pool.json", "utf8"));
const mk = (name, concerns, tolerance) => declareAsker({ name, by: "the owner (PREREG-SURF)", why: "find the equivalent", concerns, tolerance });
const ASKERS = [mk("place", ["area"], { area: { kind: "rel", tol: 0.1 } }), mk("birth", ["born"], { year: { kind: "abs", tol: 1 } }), mk("death", ["died"], { year: { kind: "abs", tol: 1 } })];
// STRUCTURE score of a candidate: tier 0 = equivalent (lower residual better), tier 1 = cannot judge (gap), tier 2 = other; the best asker verdict wins.
const structure = (en, nodes) => { let best = { tier: 1, residual: 0 }; for (const a of ASKERS) { const v = judgeAsker({ asker: a, a: en, b: nodes }); if (!v.ok) continue; const t = v.verdict === "equivalent" ? { tier: 0, residual: v.residual } : v.verdict === "other" ? { tier: 2, residual: v.residual } : { tier: 1, residual: 0 }; if (t.tier === 0 && (best.tier !== 0 || t.residual < best.residual)) best = t; else if (t.tier === 2 && best.tier === 1) best = t; } return best; };
const rank = (items, key) => { const s = [...items].sort((a, b) => key(a) - key(b)); return s.findIndex((x) => x.true) + 1; };
const stats = () => ({ n: 0, p1: 0, rr: 0, r5: 0 });
const add = (s, r) => { s.n++; s.p1 += r === 1; s.rr += 1 / r; s.r5 += r <= 5; };
const fmt = (s) => (s.n ? `P@1 ${(s.p1 / s.n).toFixed(3)}  MRR ${(s.rr / s.n).toFixed(3)}  R@5 ${(s.r5 / s.n).toFixed(3)}  (n=${s.n})` : "n=0");
for (const lang of ["fr", "de"]) {
  const R = rows.filter((r) => r.lang === lang);
  const table = {}; const get = (k) => (table[k] ??= { STRING: stats(), STRUCTURE: stats(), COMBINED: stats() });
  let judgeable = 0, rescued = 0, stringMiss = 0;
  for (const r of R) {
    for (const c of r.cands) c.st = structure(r.en, c.nodes);
    const T = r.cands.find((c) => c.true), strT = T.str, stratum = strT === 0 ? "ZERO" : strT <= 3 ? "LOW" : "MORE";
    const rString = rank(r.cands, (c) => -c.str + c.noise * 1e-3);
    const rStruct = rank(r.cands, (c) => c.st.tier * 1e6 + (c.st.tier === 0 ? c.st.residual : 0) + c.noise * 1e-3);
    const rComb = rank(r.cands, (c) => c.st.tier * 1e6 + (c.st.tier === 0 ? c.st.residual * 1000 : 0) - c.str + c.noise * 1e-3);
    const canJudge = T.st.tier !== 1;
    for (const key of ["ALL", stratum, ...(canJudge ? ["JUDGEABLE", "JUDGEABLE+" + stratum] : [])]) { const t = get(key); add(t.STRING, rString); add(t.STRUCTURE, rStruct); add(t.COMBINED, rComb); }
    if (canJudge) { judgeable++; if (rString > 5) { stringMiss++; if (rStruct === 1) rescued++; } }
  }
  console.log(`\n== ${lang}: ${R.length} articles; true counterpart judgeable by the criterion: ${judgeable} (${(judgeable / R.length).toFixed(3)})`);
  for (const k of Object.keys(table).sort()) console.log(`  [${k}]`, ...["STRING", "STRUCTURE", "COMBINED"].map((m) => `\n      ${m.padEnd(9)} ${fmt(table[k][m])}`));
  console.log(`  judgeable articles where STRING puts the truth outside its top 5: ${stringMiss}; of those STRUCTURE ranks it FIRST in ${rescued}`);
}
