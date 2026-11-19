import fs from "node:fs";
const ORGAN = process.argv[2];
const { declareAsker, judgeAsker, approach } = await import(ORGAN);
const rows = JSON.parse(fs.readFileSync("asker7-nodes.json", "utf8"));
const mk = (name, concerns, tolerance) => declareAsker({ name, by: "the owner (PREREG-ASKER-F7)", why: "same subject?", concerns, tolerance });
const ASKERS = { PLACE: mk("place", ["area"], { area: { kind: "rel", tol: 0.1 } }), BIRTH: mk("birth", ["born"], { year: { kind: "abs", tol: 1 } }), DEATH: mk("death", ["died"], { year: { kind: "abs", tol: 1 } }) };
const wil = (k, n) => { if (!n) return [NaN, NaN]; const z = 1.96, p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - h) / d, (c + h) / d]; };
const f = (x) => (Number.isNaN(x) ? "n/a" : x.toFixed(3));
for (const lang of ["fr", "de"]) {
  const R = rows.filter((r) => r.lang === lang);
  console.log(`\n== ${lang}: ${R.length} pairs (${R.filter((r) => r.inf).length} with an informed arm)`);
  for (const [name, asker] of Object.entries(ASKERS)) {
    const I2 = { equivalent: 0, other: 0, gap: 0 }, T = { equivalent: 0, other: 0, gap: 0 }, N = { equivalent: 0, other: 0, gap: 0 }, I = { equivalent: 0, other: 0, gap: 0 }, refused = {};
    const ladder = asker.ladder, surT = ladder.map(() => [0, 0]), surN = ladder.map(() => [0, 0]);
    for (const r of R) {
      const v = judgeAsker({ asker, a: r.en, b: r.true }); if (!v.ok) { refused[v.reason] = (refused[v.reason] ?? 0) + 1; continue; } T[v.verdict]++;
      const ap = approach({ asker, a: r.en, b: r.true }); if (ap.ok) ap.levels.forEach((l, i) => { if (l.verdict !== "gap") { surT[i][0]++; surT[i][1] += l.verdict === "equivalent"; } });
      for (const nb of r.nat) { const w = judgeAsker({ asker, a: r.en, b: nb }); if (!w.ok) { refused[w.reason] = (refused[w.reason] ?? 0) + 1; continue; } N[w.verdict]++; const ap2 = approach({ asker, a: r.en, b: nb }); if (ap2.ok) ap2.levels.forEach((l, i) => { if (l.verdict !== "gap") { surN[i][0]++; surN[i][1] += l.verdict === "equivalent"; } }); }
      if (r.inf) { const w = judgeAsker({ asker, a: r.en, b: r.inf }); if (w.ok) I[w.verdict]++; }
      if (r.inf2) { const w = judgeAsker({ asker, a: r.en, b: r.inf2 }); if (w.ok) I2[w.verdict]++; }
    }
    const nT = T.equivalent + T.other + T.gap, nN = N.equivalent + N.other + N.gap, nI = I.equivalent + I.other + I.gap, dT = T.equivalent + T.other, dN = N.equivalent + N.other;
    const [tl, th] = wil(T.other, dT), [nl, nh] = wil(N.equivalent, nN);
    console.log(`  asker ${name}: TRUE ${JSON.stringify(T)} coverage (verdict) ${f(dT / nT)} | other rate among verdicts ${f(T.other / Math.max(dT, 1))} [${f(tl)},${f(th)}] n=${dT}`);
    console.log(`     NATURAL ${JSON.stringify(N)} equivalent rate over all trials ${f(N.equivalent / nN)} [${f(nl)},${f(nh)}]; among verdict-bearing ${f(N.equivalent / Math.max(dN, 1))}   INFORMED(v1) ${JSON.stringify(I)} equivalent among verdict-bearing ${f(I.equivalent / Math.max(I.equivalent + I.other, 1))}   INFORMED(v2, persons fixed: REUSED) ${JSON.stringify(I2)} equivalent among verdict-bearing ${f(I2.equivalent / Math.max(I2.equivalent + I2.other, 1))}   refused ${JSON.stringify(refused)}`);
    console.log("     survival among verdict-bearing, scale: " + ladder.map((s, i) => `${s}: T ${f(surT[i][1] / Math.max(surT[i][0], 1))} N ${f(surN[i][1] / Math.max(surN[i][0], 1))}`).join(" | "));
    const tt = surT[ladder.length - 1][1], nn = surN[ladder.length - 1][1]; console.log(`     tightest scale: true ${tt} equivalent vs natural ${nn} equivalent (precision ${f(tt / Math.max(tt + nn, 1))}); gap(T,N) at tightest ${f(surT[ladder.length - 1][1] / Math.max(surT[ladder.length - 1][0], 1) - surN[ladder.length - 1][1] / Math.max(surN[ladder.length - 1][0], 1))}`);
  }
}
