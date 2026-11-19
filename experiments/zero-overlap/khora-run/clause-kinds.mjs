import fs from "node:fs";
const K = "/Users/mlacy/Documents/khora-cast/khora/native";
const { terrainEvidence, createTerrainInductionIndex, indexTerrainInductionEntries } = await import(K + "/kernel/terrain-induction.js");
const { induceEntityKindCandidates } = await import(K + "/kernel/entity-kind-induction.js");
const rows = JSON.parse(fs.readFileSync(process.argv[2], "utf8")); const SHUF = process.argv[3] === "shuffle";
const S = (a) => new Set(a.split(" "));
const PRON = S("i you he she it we they me him her us them my your his its our their this that these those who which what there"), DET = S("a an the some any each every all no"), PREP = S("of in on at by for with from to into onto over under about between among through during before after against within without upon toward towards across around"), CONJ = S("and or but nor yet so"), WH = S("when where why how whether"), SUBORD = S("since because although when if while unless though whereas as"), QUANT = S("all every each any some many most no"), COP = S("be am is are was were been being"), MODAL = S("can could may might must shall should will would"), NEG = /\b(not|no|never|nothing|none|neither|nor|nobody|nowhere)\b|n't/i;
const wordsOf = (c) => c.trim().split(/\s+/).filter(Boolean);
const feats = (c) => {
  const w = wordsOf(c), lw = w.map((x) => x.toLowerCase().replace(/[^\p{L}\p{N}'-]/gu, "")), f = lw[0] ?? "";
  const first = !f ? "none" : PRON.has(f) ? "pronoun" : DET.has(f) ? "det" : PREP.has(f) ? "prep" : CONJ.has(f) ? "conj" : WH.has(f) ? "wh" : /^\d/.test(f) ? "numeral" : /^[A-ZÀ-Þ]/.test(w[0]) && !SUBORD.has(f) ? "name" : "other";
  const passive = lw.some((x, i) => COP.has(x) && (/(ed|en)$/.test(lw[i + 1] ?? "") || /(ed|en)$/.test(lw[i + 2] ?? "")));
  const caps = w.slice(1).filter((x) => /^[A-ZÀ-Þ]/.test(x)).length, commas = (c.match(/,/g) ?? []).length;
  return { len: w.length <= 5 ? "<=5" : w.length <= 9 ? "6-9" : w.length <= 15 ? "10-15" : "16+", first, neg: NEG.test(c) ? "yes" : "no", modal: lw.some((x) => MODAL.has(x)) ? "yes" : "no", cop: lw.some((x) => COP.has(x)) ? "yes" : "no", q: /\?/.test(c) ? "yes" : "no", passive: passive ? "yes" : "no", subord: SUBORD.has(f) ? "yes" : "no", quant: lw.some((x) => QUANT.has(x)) ? "yes" : "no", digit: /\d/.test(c) ? "yes" : "no", commas: commas === 0 ? "0" : commas === 1 ? "1" : "2+", caps: caps === 0 ? "0" : caps === 1 ? "1" : "2+" };
};
let F = rows.map((r) => feats(r.clause));
if (SHUF) { let seed = 20261118; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296); const keys = Object.keys(F[0]); for (const k of keys) { const col = F.map((f) => f[k]); for (let i = col.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [col[i], col[j]] = [col[j], col[i]]; } F = F.map((f, i) => ({ ...f, [k]: col[i] })); } }
const entries = []; let seq = 0;
F.forEach((f, i) => { for (const [k, v] of Object.entries(f)) entries.push(terrainEvidence({ id: `ke-${++seq}`, entityRef: `cl:${i}`, featureKey: k, featureValue: v, sequencePosition: i, witness: `cl:${i}`, anchor: { start: i, end: i + 1 } })); });
const index = createTerrainInductionIndex(); indexTerrainInductionEntries(index, entries);
const t0 = Date.now(); const induced = induceEntityKindCandidates(index.entityFeatures, { population: "clauses:lexan-en" });
const kinds = induced.candidates.map((c) => ({ key: c.kindKey, members: [...c.memberRefs].map((m) => Number(m.slice(3))), params: (c.distinguishingParameters ?? c.parameters ?? []).slice(0, 8).map((p) => `${p.featureKey ?? p.key}=${p.featureValue ?? p.value}`), p: c.cohesionNull?.pValue ?? null, passed: c.cohesionNull?.passed ?? null }));
console.log(JSON.stringify({ shuffled: SHUF, clauses: rows.length, evidence: entries.length, seconds: (Date.now() - t0) / 1000, kinds: kinds.length, passed: kinds.filter((k) => k.passed).length, diagnostics: induced.diagnostics }, null, 1).slice(0, 1200));
if (SHUF) process.exit(0);
// NMI against labels, with permutation nulls
const group = new Array(rows.length).fill("none"); kinds.forEach((k, ki) => k.members.forEach((m) => (group[m] = `k${ki}`)));
const nmi = (a, b) => { const n = a.length, ca = new Map(), cb = new Map(), cab = new Map(); for (let i = 0; i < n; i++) { ca.set(a[i], (ca.get(a[i]) ?? 0) + 1); cb.set(b[i], (cb.get(b[i]) ?? 0) + 1); const k = a[i] + "\u0000" + b[i]; cab.set(k, (cab.get(k) ?? 0) + 1); } let mi = 0; for (const [k, v] of cab) { const [x, y] = k.split("\u0000"); mi += (v / n) * Math.log((v * n) / (ca.get(x) * cb.get(y))); } const H = (m) => -[...m.values()].reduce((s, v) => s + (v / n) * Math.log(v / n), 0); const d = Math.sqrt(H(ca) * H(cb)); return d ? mi / d : 0; };
let seed = 20261118; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const nullOf = (a, b) => { const bb = [...b]; const v = []; for (let t = 0; t < 1000; t++) { for (let i = bb.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [bb[i], bb[j]] = [bb[j], bb[i]]; } v.push(nmi(a, bb)); } v.sort((x, y) => x - y); return v[Math.floor(0.95 * v.length)]; };
const L = (get) => rows.map(get), report = (name, b) => { const obs = nmi(group, b), thr = nullOf(group, b); console.log(`   NMI(kinds, ${name.padEnd(18)}) = ${obs.toFixed(4)}  null95 ${thr.toFixed(4)}  ${obs > thr ? "ABOVE chance" : "within chance"}`); };
report("Claude Q1", L((r) => r.claude[0])); report("Claude Q2", L((r) => r.claude[1])); report("Claude Q3", L((r) => r.claude[2])); report("Claude 27-cell", L((r) => r.claude.join("|"))); report("register (control)", L((r) => r.register));
if (rows[0].gpt) { report("GPT-4 Q1", L((r) => (r.gpt ?? [])[0] ?? "na")); }
for (const [i, k] of kinds.entries()) { const reg = {}, q1 = {}; for (const m of k.members) { reg[rows[m].register] = (reg[rows[m].register] ?? 0) + 1; q1[rows[m].claude[0]] = (q1[rows[m].claude[0]] ?? 0) + 1; } console.log(`\nkind k${i} [${k.passed ? "PASS" : "fail"}] n=${k.members.length} p=${k.p}\n   params: ${k.params.join(", ")}\n   registers: ${JSON.stringify(reg)}\n   Claude Q1: ${JSON.stringify(q1)}\n   e.g. ${k.members.slice(0, 3).map((m) => rows[m].clause.slice(0, 80)).join("  ||  ")}`); }
