// FRESH run of PREREG-FRESH.md (sha256 first 16: 89bc861dc6130419). Usage: EWT=/tmp/ewt-dev.conllu node measure-fresh.mjs. No regex, no word list reads text.
import fs from "node:fs";
const EWT = process.env.EWT;
const SEED = 20261120, MINC = 5, NCTX = 200, K = 64, RESTARTS = 10;
let s0 = SEED; const rnd = () => { s0 = (s0 * 1664525 + 1013904223) >>> 0; return s0 / 4294967296; };
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function load(file) {
  const out = []; let cur = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) { if (cur.length) out.push(cur); cur = []; continue; }
    if (line.startsWith("#")) continue;
    const c = line.split("\t");
    if (Number.isInteger(Number(c[0]))) cur.push({ form: c[1], w: c[1].toLowerCase(), u: c[3], rel: c[7] });
  }
  if (cur.length) out.push(cur);
  return out;
}
const sents = load(EWT);
const train = [], held = [];
sents.forEach((s, i) => (i % 10 === 0 || i % 10 === 1 ? held : train).push(s));

// clustering on train
const cnt = new Map(), gold = new Map();
for (const s of train) for (const t of s) {
  cnt.set(t.w, (cnt.get(t.w) ?? 0) + 1);
  const g = gold.get(t.w) ?? new Map();
  g.set(t.u, (g.get(t.u) ?? 0) + 1);
  gold.set(t.w, g);
}
const types = [...cnt.keys()], V = types.filter((w) => cnt.get(w) >= MINC).sort((a, b) => cnt.get(b) - cnt.get(a));
const vi = new Map(V.map((w, i) => [w, i]));
const ctx = V.slice(0, NCTX), ci = new Map(ctx.map((w, i) => [w, i]));
const M = V.map(() => new Float64Array(2 * NCTX));
const totalTokens = train.reduce((a, s) => a + s.length, 0);
for (const s of train) s.forEach((t, i) => {
  const r = vi.get(t.w); if (r === undefined) return;
  const l = i > 0 ? ci.get(s[i - 1].w) : undefined;
  const rt = i + 1 < s.length ? ci.get(s[i + 1].w) : undefined;
  if (l !== undefined) M[r][l]++;
  if (rt !== undefined) M[r][NCTX + rt]++;
});
const rowsum = M.map((r) => r.reduce((a, b) => a + b, 0));
const colsums = Array.from({ length: 2 * NCTX }, (_, j) => M.reduce((a, r) => a + r[j], 0));
const cs75 = colsums.map((c) => c ** 0.75);
const cst = cs75.reduce((a, b) => a + b, 0);
const keep = [], X = [];
V.forEach((w, r) => {
  if (!rowsum[r]) return;
  const row = Array.from(M[r], (c, j) => {
    if (!c) return 0;
    const pmi = Math.log((c / totalTokens) / ((rowsum[r] / totalTokens) * (cs75[j] / cst)));
    return Math.max(0, pmi);
  });
  const nm = Math.hypot(...row); if (!nm) return; keep.push(w); X.push(row.map((v) => v / nm));
});
function kmeans(X, k) {
  const n = X.length, d = X[0].length; let best = null;
  for (let r = 0; r < RESTARTS; r++) {
    const C = [X[Math.floor(rnd() * n)].slice()]; const dist = new Float64Array(n).fill(Infinity);
    while (C.length < k) { const c = C[C.length - 1]; let tot = 0; for (let i = 0; i < n; i++) { let dot = 0; for (let j = 0; j < d; j++) dot += X[i][j] * c[j]; dist[i] = Math.min(dist[i], 1 - dot); tot += dist[i]; } let u = rnd() * tot, pick = n - 1; for (let i = 0; i < n; i++) { u -= dist[i]; if (u <= 0) { pick = i; break; } } C.push(X[pick].slice()); }
    let asg = new Int32Array(n).fill(-1), cost = 0;
    for (let it = 0; it < 50; it++) { let moved = 0; cost = 0; for (let i = 0; i < n; i++) { let bj = 0, bd = -2; for (let q = 0; q < k; q++) { let dot = 0; for (let j = 0; j < d; j++) dot += X[i][j] * C[q][j]; if (dot > bd) { bd = dot; bj = q; } } cost += 1 - bd; if (asg[i] !== bj) { asg[i] = bj; moved++; } } if (!moved) break; const S = C.map(() => new Float64Array(d)), cntc = new Int32Array(k); for (let i = 0; i < n; i++) { cntc[asg[i]]++; for (let j = 0; j < d; j++) S[asg[i]][j] += X[i][j]; } for (let q = 0; q < k; q++) { if (!cntc[q]) { C[q] = X[Math.floor(rnd() * n)].slice(); continue; } const nm = Math.hypot(...S[q]) || 1; C[q] = Array.from(S[q], (v) => v / nm); } }
    if (!best || cost < best.cost) best = { cost, asg: Array.from(asg) };
  }
  return best.asg;
}
const asg = kmeans(X, K);
const typeCluster = new Map();
keep.forEach((w, i) => typeCluster.set(w, asg[i]));
const clusterUpos = new Map();
for (const w of keep) {
  const c = typeCluster.get(w);
  const g = [...gold.get(w).entries()].sort((a, b) => b[1] - a[1])[0][0];
  if (!clusterUpos.has(c)) clusterUpos.set(c, new Map());
  const m = clusterUpos.get(c);
  m.set(g, (m.get(g) ?? 0) + (cnt.get(w) ?? 1));
}
const nominalClusters = new Set();
for (const [c, m] of clusterUpos) {
  const dom = [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
  if (dom === "NOUN" || dom === "PROPN") nominalClusters.add(c);
}
const isNominal = (form) => {
  const w = form.toLowerCase();
  const c = typeCluster.get(w);
  if (c === undefined) return false;
  return nominalClusters.has(c);
};

const isS = (f) => f === "'s" || f === "’s";
const rows = [];
for (const s of held) {
  for (let i = 0; i < s.length; i++) {
    if (!isS(s[i].form)) continue;
    const planted = s[i].u === "PART" && s[i].rel === "case";
    const leftNom = i > 0 ? isNominal(s[i - 1].form) : false;
    const rightNom = i + 1 < s.length ? isNominal(s[i + 1].form) : false;
    rows.push({ planted, emergent: { left: leftNom, right: rightNom, both: leftNom && rightNom } });
  }
}

const labels = rows.map((r) => r.planted);
const P = labels.filter(Boolean).length;
const bal = (fires, labs) => {
  const pp = labs.filter(Boolean).length, nn = labs.length - pp;
  return (fires.filter((f, i) => f && labs[i]).length / pp + fires.filter((f, i) => !f && !labs[i]).length / nn) / 2;
};
const out = { prereg: "89bc861dc6130419", stamp: "FRESH", total: rows.length, planted: P, noise: rows.length - P, trainSentences: train.length, heldSentences: held.length, typesClustered: keep.length, nominalClusters: nominalClusters.size, rules: {} };
for (const variant of ["left", "both"]) {
  const fires = rows.map((r) => r.emergent[variant]);
  const b = bal(fires, labels);
  const nulls = Array.from({ length: 200 }, () => bal(fires, shuffle(labels)));
  const cardHits = fires.filter((f, i) => f && labels[i]).length;
  const cardNoise = fires.filter((f, i) => f && !labels[i]).length;
  const lrs = [];
  for (let q = 0; q < 1000; q++) {
    const idx = Array.from({ length: rows.length }, () => Math.floor(rnd() * rows.length));
    const pl = idx.filter((i) => labels[i]), nl = idx.filter((i) => !labels[i]);
    if (!pl.length || !nl.length) continue;
    const tpr = (pl.filter((i) => fires[i]).length + 1) / (pl.length + 2);
    const fpr = (nl.filter((i) => fires[i]).length + 1) / (nl.length + 2);
    lrs.push(tpr / fpr);
  }
  lrs.sort((a, b) => a - b);
  out.rules[`emergent-${variant}`] = {
    balancedAccuracy: +b.toFixed(4),
    nullMax: +Math.max(...nulls).toFixed(4),
    holds: b > Math.max(...nulls),
    tpr: +(cardHits / P).toFixed(3),
    fpr: +(cardNoise / (rows.length - P)).toFixed(3),
    lr: +(((cardHits + 1) / (P + 2)) / ((cardNoise + 1) / (rows.length - P + 2))).toFixed(2),
    lr95: [+lrs[25].toFixed(2), +lrs[974].toFixed(2)],
  };
}
fs.writeFileSync(new URL("result-fresh.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
