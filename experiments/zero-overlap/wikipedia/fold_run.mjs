import fs from "node:fs";
const P = "/private/tmp/claude-501/-Users-mlacy-Library-Application-Support-Claude-scratch-workspaces-4bf59fed-b26b-4f7d-a90f-11d28a16ba25-1a7b49f0-7962-48a4-8bfc-8a3bc2e27d2d-scratch-2026-11-18-297985/42c7580b-6f78-4d1c-a782-63163c05398a/scratchpad/repos/penelope/organs/relation-fold.mjs";
const { foldRelations, sameFold } = await import(P);
const roles = { area: "root", born: "root", died: "root", population: "leaf" }, anchors = { X: "X" };
const claimsOf = (side, tag) => { const o = []; if (side.area) o.push({ end1: "X", label: "area", end2: side.area, addr: tag }); for (const [k, v] of Object.entries(side.life || {})) o.push({ end1: "X", label: k === "born_year" ? "born" : "died", end2: v, addr: tag }); if (side.pop) o.push({ end1: "X", label: "population", end2: side.pop, addr: tag }); return o; };
const wil = (k, n) => { if (!n) return [NaN, NaN]; const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - h) / d, (c + h) / d]; };
for (const L of ["fr", "de"]) {
  const rows = JSON.parse(fs.readFileSync(`/Users/mlacy/Library/Application Support/Claude/scratch-workspaces/4bf59fed-b26b-4f7d-a90f-11d28a16ba25/1a7b49f0-7962-48a4-8bfc-8a3bc2e27d2d/scratch-2026-11-18-297985/wikipedia/fold-${L}.json`, "utf8"));
  const by = new Map(); rows.forEach((r) => { if (!by.has(r.scene)) by.set(r.scene, []); by.get(r.scene).push(r); });
  const fold = (side, t) => foldRelations({ claims: claimsOf(side, t), anchors, ground: "lead-section" });
  const run = (e, o, minAgree) => sameFold(fold(e, "en"), fold(o, "ot"), { roles, minAgree, tol: 0.10 });
  for (const minAgree of [1, 2]) {
    const T = { same: 0, other: 0, gap: 0 }, S = { same: 0, other: 0, gap: 0 }, PT = { same: 0, other: 0, gap: 0 }, PS = { same: 0, other: 0, gap: 0 }, F = { agree: 0, dispute: 0 }, FS = { agree: 0, dispute: 0 };
    for (const r of rows) {
      const t = run(r.en, r.ot, minAgree); T[t.root]++; PT[t.pattern.verdict]++; F.agree += t.leaves.agree; F.dispute += t.leaves.dispute;
      for (const q of by.get(r.scene)) if (q !== r) { const v = run(r.en, q.ot, minAgree); S[v.root]++; PS[v.pattern.verdict]++; FS.agree += v.leaves.agree; FS.dispute += v.leaves.dispute; }
    }
    const nT = T.same + T.other, nS = S.same + S.other;
    console.log(`== ${L}: ${rows.length} pairs, minAgree ${minAgree}`);
    console.log(`   GROUND  TRUE same ${T.same} other ${T.other} gap ${T.gap} (other rate ${(T.other / nT).toFixed(3)} [${wil(T.other, nT).map((x) => x.toFixed(3))}]; same rate among decided ${(T.same / nT).toFixed(3)}) | SUITOR same ${S.same} other ${S.other} gap ${S.gap} (false accept among decided ${(S.same / nS).toFixed(4)} [${wil(S.same, nS).map((x) => x.toFixed(4))}])`);
    console.log(`   PATTERN TRUE same ${PT.same} other ${PT.other} gap ${PT.gap} | SUITOR same ${PS.same} other ${PS.other} gap ${PS.gap} (same-shape rate TRUE ${(PT.same / Math.max(1, PT.same + PT.other)).toFixed(3)} vs SUITOR ${(PS.same / Math.max(1, PS.same + PS.other)).toFixed(3)})`);
    console.log(`   FIGURE (leaves) TRUE agree ${F.agree} dispute ${F.dispute} | SUITOR agree ${FS.agree} dispute ${FS.dispute}`);
  }
}
