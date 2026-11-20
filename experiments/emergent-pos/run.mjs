// EXPLORATORY run of PREREG.md (sha256 first 16: 8af0f2043d787ce1). Emergent word classes from raw token contexts (no tagger), scored against Thrax's classes (khora THRAX_MAP) ONLY as a scorer.
// Usage: EWT=<en_ewt-ud-test.conllu> node run.mjs [grc|fra|eng ...]   No regex, no word list reads text: tokens are the treebank's own columns.
import fs from "node:fs";
const KH = process.env.KHORA_HOME ?? "/Users/mlacy/Documents/khora-cast/khora", D = `${KH}/identity/pronouns-multilingual/data`;
const { THRAX_MAP } = await import(`${KH}/native/legacy-ported/packages/engine/perceiver/text/wordclass.js`);
const SETS = { grc: `${D}/grc-proiel/grc_proiel-ud-train.conllu`, fra: `${D}/fra/fr_gsd-ud-train.conllu`, eng: process.env.EWT };
const SEED = 20261120, MINC = 5, NCTX = 200, KGRID = [4, 8, 16, 32, 64], RESTARTS = 10, NULLS = 20, SHUF = 200;
let s0 = SEED; const rnd = () => { s0 = (s0 * 1664525 + 1013904223) >>> 0; return s0 / 4294967296; };
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function load(file) { const out = []; let cur = []; for (const line of fs.readFileSync(file, "utf8").split("\n")) { if (!line.trim()) { if (cur.length) out.push(cur); cur = []; continue; } if (line.startsWith("#")) continue; const c = line.split("\t"); if (Number.isInteger(Number(c[0]))) cur.push({ w: c[1].toLowerCase(), u: c[3] }); } if (cur.length) out.push(cur); return out; }
const H = (counts) => { const n = counts.reduce((a, b) => a + b, 0); return counts.reduce((a, c) => (c ? a - (c / n) * Math.log(c / n) : a), 0); };
function vmeasure(a, b) { const ka = [...new Set(a)], kb = [...new Set(b)], ia = new Map(ka.map((x, i) => [x, i])), ib = new Map(kb.map((x, i) => [x, i])), M = ka.map(() => kb.map(() => 0)); a.forEach((x, i) => M[ia.get(x)][ib.get(b[i])]++); const rows = M.map((r) => r.reduce((x, y) => x + y, 0)), cols = kb.map((_, j) => M.reduce((x, r) => x + r[j], 0)), n = a.length, Hc = H(cols), Hk = H(rows); let HcGk = 0, HkGc = 0; M.forEach((r, i) => r.forEach((v, j) => { if (v) { HcGk -= (v / n) * Math.log(v / rows[i]); HkGc -= (v / n) * Math.log(v / cols[j]); } })); const h = Hc ? 1 - HcGk / Hc : 1, c = Hk ? 1 - HkGc / Hk : 1; return h + c ? (2 * h * c) / (h + c) : 0; }
function kmeans(X, k) { // spherical, rows L2-normalised
  const n = X.length, d = X[0].length; let best = null;
  for (let r = 0; r < RESTARTS; r++) {
    const C = [X[Math.floor(rnd() * n)].slice()]; const dist = new Float64Array(n).fill(Infinity);
    while (C.length < k) { const c = C[C.length - 1]; let tot = 0; for (let i = 0; i < n; i++) { let dot = 0; for (let j = 0; j < d; j++) dot += X[i][j] * c[j]; dist[i] = Math.min(dist[i], 1 - dot); tot += dist[i]; } let u = rnd() * tot, pick = n - 1; for (let i = 0; i < n; i++) { u -= dist[i]; if (u <= 0) { pick = i; break; } } C.push(X[pick].slice()); }
    let asg = new Int32Array(n).fill(-1), cost = 0;
    for (let it = 0; it < 50; it++) { let moved = 0; cost = 0; for (let i = 0; i < n; i++) { let bj = 0, bd = -2; for (let q = 0; q < k; q++) { let dot = 0; for (let j = 0; j < d; j++) dot += X[i][j] * C[q][j]; if (dot > bd) { bd = dot; bj = q; } } cost += 1 - bd; if (asg[i] !== bj) { asg[i] = bj; moved++; } } if (!moved) break; const S = C.map(() => new Float64Array(d)), cnt = new Int32Array(k); for (let i = 0; i < n; i++) { cnt[asg[i]]++; for (let j = 0; j < d; j++) S[asg[i]][j] += X[i][j]; } for (let q = 0; q < k; q++) { if (!cnt[q]) { C[q] = X[Math.floor(rnd() * n)].slice(); continue; } const nm = Math.hypot(...S[q]) || 1; C[q] = Array.from(S[q], (v) => v / nm); } }
    if (!best || cost < best.cost) best = { cost, asg: Array.from(asg) };
  }
  return best.asg;
}
async function run(lang) {
  const sents = load(SETS[lang]), tr = [], dv = [], te = []; sents.forEach((s, i) => (i % 10 === 0 ? te : i % 10 === 1 ? dv : tr).push(s));
  const cnt = new Map(), gold = new Map(); for (const s of tr) for (const t of s) { cnt.set(t.w, (cnt.get(t.w) ?? 0) + 1); const g = gold.get(t.w) ?? new Map(); g.set(t.u, (g.get(t.u) ?? 0) + 1); gold.set(t.w, g); }
  const types = [...cnt.keys()], ti = new Map(types.map((w, i) => [w, i])), N = tr.reduce((a, s) => a + s.length, 0), Vn = types.length;
  const V = types.filter((w) => cnt.get(w) >= MINC).sort((a, b) => cnt.get(b) - cnt.get(a)), vi = new Map(V.map((w, i) => [w, i])), ctx = V.slice(0, NCTX), ci = new Map(ctx.map((w, i) => [w, i]));
  const M = V.map(() => new Float64Array(2 * NCTX)); for (const s of tr) s.forEach((t, i) => { const r = vi.get(t.w); if (r === undefined) return; const l = i > 0 ? ci.get(s[i - 1].w) : undefined, rt = i + 1 < s.length ? ci.get(s[i + 1].w) : undefined; if (l !== undefined) M[r][l]++; if (rt !== undefined) M[r][NCTX + rt]++; });
  const rowsum = M.map((r) => r.reduce((a, b) => a + b, 0)), colsum = Array.from({ length: 2 * NCTX }, (_, j) => M.reduce((a, r) => a + r[j], 0)), tot = rowsum.reduce((a, b) => a + b, 0), cs75 = colsum.map((c) => c ** 0.75), cst = cs75.reduce((a, b) => a + b, 0);
  const keep = []; const X = []; V.forEach((w, r) => { if (!rowsum[r]) return; const row = Array.from(M[r], (c, j) => (c ? Math.max(0, Math.log((c / tot) / ((rowsum[r] / tot) * (cs75[j] / cst)))) : 0)), nm = Math.hypot(...row); if (!nm) return; keep.push(w); X.push(row.map((v) => v / nm)); });
  // held-out model pieces
  const idx = (w) => ti.get(w) ?? -1, toks = (ss) => { const P = [], W = []; for (const s of ss) s.forEach((t, i) => { P.push(i ? idx(s[i - 1].w) : -2); W.push(idx(t.w)); }); return { P, W }; }, DV = toks(dv), TE = toks(te);
  const big = new Map(), foll = new Map(), cp = new Float64Array(Vn + 2); const key = (p, w) => (p + 2) * (Vn + 2) + (w + 1), nw = new Float64Array(Vn + 1); for (const s of tr) s.forEach((t, i) => { const p = i ? idx(s[i - 1].w) : -2, w = idx(t.w); big.set(key(p, w), (big.get(key(p, w)) ?? 0) + 1); cp[p + 2]++; (foll.get(p) ?? foll.set(p, new Set()).get(p)).add(w); nw[w]++; });
  const puni = (w) => ((w >= 0 ? nw[w] : 0) + 1) / (N + Vn + 1), pwb = (p, w) => { const c = cp[p + 2]; if (!c) return puni(w); const T = foll.get(p).size; return ((big.get(key(p, w)) ?? 0) + T * puni(w)) / (c + T); };
  const base = (S) => S.W.map((w, i) => pwb(S.P[i], w)), bDV = base(DV), bTE = base(TE), bits = (ps) => -ps.reduce((a, p) => a + Math.log2(p), 0) / ps.length;
  function classModel(clsOf, k) { // clsOf: Int array over all train types (index = type id), values 0..k (k = OOV)
    const cc = (w) => (w >= 0 ? clsOf[w] : k), nc = new Float64Array(k + 1), sz = new Float64Array(k + 1), cb = new Map(), cf = new Map(), cpn = new Float64Array(k + 2); for (let w = 0; w < Vn; w++) { nc[clsOf[w]] += nw[w]; sz[clsOf[w]]++; }
    for (const s of tr) s.forEach((t, i) => { const p = i ? cc(idx(s[i - 1].w)) : -1, c = cc(idx(t.w)), kk = (p + 1) * (k + 2) + c; cb.set(kk, (cb.get(kk) ?? 0) + 1); cpn[p + 1]++; (cf.get(p) ?? cf.set(p, new Set()).get(p)).add(c); });
    const cu = (c) => (nc[c] + 1) / (N + k + 1), pcc = (p, c) => { const n = cpn[p + 1]; if (!n) return cu(c); const T = cf.get(p).size; return ((cb.get((p + 1) * (k + 2) + c) ?? 0) + T * cu(c)) / (n + T); }, dl = 0.5, pwc = (w, c) => ((w >= 0 ? nw[w] : 0) + dl) / (nc[c] + dl * (sz[c] + 1));
    return (S) => S.W.map((w, i) => { const c = cc(w), p = S.P[i] === -2 ? -1 : cc(S.P[i]); return pcc(p, c) * pwc(w, c); });
  }
  function fit(clsOf, k) { const cm = classModel(clsOf, k), cD = cm(DV), cT = cm(TE); let L = 0.5; for (let it = 0; it < 30; it++) { let a = 0; for (let i = 0; i < cD.length; i++) a += (L * cD[i]) / ((1 - L) * bDV[i] + L * cD[i]); L = Math.min(0.99, Math.max(0.01, a / cD.length)); } const mix = (b, c) => b.map((x, i) => (1 - L) * x + L * c[i]); return { L, devBits: bits(mix(bDV, cD)), testBits: bits(mix(bTE, cT)) }; }
  const asClsOf = (asg, k) => { const o = new Int32Array(Vn).fill(k); keep.forEach((w, i) => { o[ti.get(w)] = asg[i]; }); return o; };
  const out = { lang, sentences: sents.length, train: tr.length, dev: dv.length, test: te.length, vocabTrain: Vn, typesClustered: keep.length, baseline: { devBits: +bits(bDV).toFixed(4), testBits: +bits(bTE).toFixed(4) }, grid: {} }; let best = null;
  for (const k of KGRID) { if (k >= keep.length) continue; const asg = kmeans(X, k), f = fit(asClsOf(asg, k), k); out.grid[k] = { devGain: +(bits(bDV) - f.devBits).toFixed(4), testGain: +(bits(bTE) - f.testBits).toFixed(4), L: +f.L.toFixed(3) }; if (!best || f.devBits < best.dev) best = { k, asg, dev: f.devBits, f }; }
  const { k, asg, f } = best, gain = bits(bTE) - f.testBits, nullG = []; for (let q = 0; q < NULLS; q++) { const g = fit(asClsOf(shuffle(asg), k), k); nullG.push(bits(bTE) - g.testBits); }
  out.chosenK = k; out.E1 = { testGainBits: +gain.toFixed(4), nullMax: +Math.max(...nullG).toFixed(4), nullMean: +(nullG.reduce((a, b) => a + b, 0) / nullG.length).toFixed(4), holds: gain > Math.max(...nullG) };
  const thrax = keep.map((w) => { const g = [...gold.get(w).entries()].sort((a, b) => b[1] - a[1])[0][0]; return THRAX_MAP[g] ?? null; }), inScope = keep.map((_, i) => i).filter((i) => thrax[i]), A = inScope.map((i) => asg[i]), T = inScope.map((i) => thrax[i]), v = vmeasure(A, T), nul = Array.from({ length: SHUF }, () => vmeasure(A, shuffle(T)));
  out.E2 = { typesInScope: inScope.length, vmeasure: +v.toFixed(4), nullMax: +Math.max(...nul).toFixed(4), holds: v > Math.max(...nul) };
  out.E3 = {}; for (const t of [...new Set(T)].sort()) { let b = null; for (const c of new Set(A)) { const inter = A.filter((a, i) => a === c && T[i] === t).length, P = inter / A.filter((a) => a === c).length, R = inter / T.filter((x) => x === t).length, F = P + R ? (2 * P * R) / (P + R) : 0; if (!b || F > b.F) b = { cluster: c, P: +P.toFixed(3), R: +R.toFixed(3), F: +F.toFixed(3) }; } out.E3[t] = { n: T.filter((x) => x === t).length, ...b }; }
  out.clusters = Array.from({ length: k }, (_, c) => { const mem = keep.map((w, i) => i).filter((i) => asg[i] === c), by = new Map(); mem.forEach((i) => { if (thrax[i]) by.set(thrax[i], (by.get(thrax[i]) ?? 0) + 1); }); const dom = [...by.entries()].sort((a, b) => b[1] - a[1])[0]; return { c, size: mem.length, top: mem.slice(0, 8).map((i) => keep[i]).join(" "), thrax: dom ? `${dom[0]} ${(dom[1] / [...by.values()].reduce((a, b) => a + b, 0)).toFixed(2)}` : null }; });
  return out;
}
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ["grc", "fra", "eng"], results = {}; for (const l of langs) { results[l] = await run(l); const r = results[l]; console.log(l, "k", r.chosenK, "E1", JSON.stringify(r.E1), "E2", JSON.stringify(r.E2)); }
fs.writeFileSync(new URL("result.json", import.meta.url), JSON.stringify({ prereg: "8af0f2043d787ce1", stamp: "EXPLORATORY", seed: SEED, results }, null, 1));
