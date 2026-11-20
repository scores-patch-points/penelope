// REUSED run of PREREG.md (sha256 first 16: 86fe2f0c281ce357). Usage: node measure.mjs [grc|zh|eng ...]. No regex, no word list reads text.
import fs from "node:fs";
const SEED = 20261120, MINC = 5, NCTX = 200, K = 64, RESTARTS = 10, SHUF = 200, BOOT = 1000;
const SETS = { grc: "/tmp/grc-proiel-train.conllu", zh: "/tmp/zh-gsd-train.conllu", eng: "/tmp/ewt-dev.conllu" };
let s0 = SEED; const rnd = () => { s0 = (s0 * 1664525 + 1013904223) >>> 0; return s0 / 4294967296; };
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function load(file) { const out = []; let cur = []; for (const line of fs.readFileSync(file, "utf8").split("\n")) { if (!line.trim()) { if (cur.length) out.push(cur); cur = []; continue; } if (line.startsWith("#")) continue; const c = line.split("\t"); if (Number.isInteger(Number(c[0]))) cur.push({ w: c[1].toLowerCase(), u: c[3] }); } if (cur.length) out.push(cur); return out; }
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
function run(lang) {
  const sents = load(SETS[lang]); const train = [], held = [];
  sents.forEach((s, i) => (i % 10 === 0 || i % 10 === 1 ? held : train).push(s));
  const cnt = new Map(), gold = new Map();
  for (const s of train) for (const t of s) { cnt.set(t.w, (cnt.get(t.w) ?? 0) + 1); const g = gold.get(t.w) ?? new Map(); g.set(t.u, (g.get(t.u) ?? 0) + 1); gold.set(t.w, g); }
  const types = [...cnt.keys()], V = types.filter((w) => cnt.get(w) >= MINC).sort((a, b) => cnt.get(b) - cnt.get(a));
  const vi = new Map(V.map((w, i) => [w, i]));
  const ctx = V.slice(0, NCTX), ci = new Map(ctx.map((w, i) => [w, i]));
  const M = V.map(() => new Float64Array(2 * NCTX));
  const totalTokens = train.reduce((a, s) => a + s.length, 0);
  for (const s of train) s.forEach((t, i) => { const r = vi.get(t.w); if (r === undefined) return; const l = i > 0 ? ci.get(s[i - 1].w) : undefined, rt = i + 1 < s.length ? ci.get(s[i + 1].w) : undefined; if (l !== undefined) M[r][l]++; if (rt !== undefined) M[r][NCTX + rt]++; });
  const rowsum = M.map((r) => r.reduce((a, b) => a + b, 0));
  const colsums = Array.from({ length: 2 * NCTX }, (_, j) => M.reduce((a, r) => a + r[j], 0));
  const cs75 = colsums.map((c) => c ** 0.75), cst = cs75.reduce((a, b) => a + b, 0);
  const keep = [], X = [];
  V.forEach((w, r) => { if (!rowsum[r]) return; const row = Array.from(M[r], (c, j) => c ? Math.max(0, Math.log((c / totalTokens) / ((rowsum[r] / totalTokens) * (cs75[j] / cst)))) : 0); const nm = Math.hypot(...row); if (!nm) return; keep.push(w); X.push(row.map((v) => v / nm)); });
  const asg = kmeans(X, K);
  const typeCluster = new Map(); keep.forEach((w, i) => typeCluster.set(w, asg[i]));
  // name clusters by dominant UPOS tag (weighted by token count)
  const clusterWeight = new Map();
  for (const w of keep) { const c = typeCluster.get(w); const u = [...gold.get(w).entries()].sort((a, b) => b[1] - a[1])[0][0]; if (!clusterWeight.has(c)) clusterWeight.set(c, new Map()); const m = clusterWeight.get(c); m.set(u, (m.get(u) ?? 0) + (cnt.get(w) ?? 1)); }
  const clusterName = new Map();
  for (const [c, m] of clusterWeight) { const dom = [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]; clusterName.set(c, dom); }
  const smell = (form) => { const c = typeCluster.get(form.toLowerCase()); return c === undefined ? null : (clusterName.get(c) ?? null); };
  const rows = [];
  for (const s of held) for (const t of s) rows.push({ gold: t.u, smell: smell(t.w) });
  const allTags = [...new Set(rows.map((r) => r.gold))].sort();
  const bal = (fires, labs) => { const P = labs.filter(Boolean).length, N = labs.length - P; if (!P || !N) return null; return (fires.filter((f, i) => f && labs[i]).length / P + fires.filter((f, i) => !f && !labs[i]).length / N) / 2; };
  const out = { lang, stamp: "REUSED", totalTokensHeld: rows.length, trainSentences: train.length, heldSentences: held.length, typesClustered: keep.length, namedClusters: clusterName.size, unnameableShare: +(rows.filter((r) => r.smell === null).length / rows.length).toFixed(4), tags: {}, summary: {} };
  for (const X of allTags) {
    const labels = rows.map((r) => r.gold === X); const fires = rows.map((r) => r.smell === X);
    const P = labels.filter(Boolean).length, N = labels.length - P;
    if (!P || !N) { out.tags[X] = { gap: P ? "no noise" : "no planted", n: P || N }; continue; }
    const b = bal(fires, labels);
    const nulls = Array.from({ length: SHUF }, () => bal(fires, shuffle(labels)));
    const cardHits = fires.filter((f, i) => f && labels[i]).length, cardNoise = fires.filter((f, i) => f && !labels[i]).length;
    const lrs = [];
    for (let q = 0; q < BOOT; q++) { const idx = Array.from({ length: rows.length }, () => Math.floor(rnd() * rows.length)); const pl = idx.filter((i) => labels[i]), nl = idx.filter((i) => !labels[i]); if (!pl.length || !nl.length) continue; const tpr = (pl.filter((i) => fires[i]).length + 1) / (pl.length + 2), fpr = (nl.filter((i) => fires[i]).length + 1) / (nl.length + 2); lrs.push(tpr / fpr); }
    lrs.sort((a, b) => a - b);
    const tpr = (cardHits + 1) / (P + 2), fpr = (cardNoise + 1) / (N + 2);
    const lo = lrs.length ? lrs[Math.floor(lrs.length * 0.025)] : null, hi = lrs.length ? lrs[Math.floor(lrs.length * 0.975)] : null;
    out.tags[X] = { planted: P, noise: N, balancedAccuracy: +b.toFixed(4), nullMax: +Math.max(...nulls).toFixed(4), holds: b > Math.max(...nulls), tpr: +(cardHits / P).toFixed(3), fpr: +(cardNoise / N).toFixed(3), lr: +(tpr / fpr).toFixed(2), lr95: [lo === null ? null : +lo.toFixed(2), hi === null ? null : +hi.toFixed(2)] };
  }
  const acc = rows.filter((r) => r.smell === r.gold).length / rows.length;
  const goldLabels = rows.map((r) => r.gold); let nullAcc = [];
  for (let q = 0; q < SHUF; q++) { const s = shuffle(goldLabels); nullAcc.push(rows.filter((r, i) => r.smell === s[i]).length / rows.length); }
  out.summary = { multiClassAccuracy: +acc.toFixed(4), nullMax: +Math.max(...nullAcc).toFixed(4) };
  return out;
}
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ["grc", "zh", "eng"];
const results = {}; for (const l of langs) { results[l] = run(l); const r = results[l]; console.log(l, JSON.stringify(r.summary), "unnameable", r.unnameableShare, "tags", Object.keys(r.tags).length); }
fs.writeFileSync(new URL("result.json", import.meta.url), JSON.stringify({ prereg: "86fe2f0c281ce357", seed: SEED, results }, null, 1));
