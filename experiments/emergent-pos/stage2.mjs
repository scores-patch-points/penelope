// EXPLORATORY run of PREREG-STAGE2.md (sha256 first 16: 01f7fb4e063bc813); helpers copied verbatim from run.mjs (stage 1). Emergent word classes from raw token contexts (no tagger), scored against Thrax's classes (khora THRAX_MAP) ONLY as a scorer.
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

const K = 64, MINLCP = 4, FRAC = 0.6, NPERM = 20, NRAND = 200;
const lcp = (a, b) => { let n = 0; while (n < a.length && n < b.length && a[n] === b[n]) n++; return n; };
function pairShares(forms, cl, k) { // s(a,b) for all cluster pairs having any variant; forms: array of arrays of chars
  const bucket = new Map(); forms.forEach((f, i) => { if (f.length >= MINLCP) { const key = f.slice(0, MINLCP).join(""); (bucket.get(key) ?? bucket.set(key, []).get(key)).push(i); } });
  const has = forms.map(() => new Set()); for (const idx of bucket.values()) for (let x = 0; x < idx.length; x++) for (let y = x + 1; y < idx.length; y++) { const i = idx[x], j = idx[y], L = lcp(forms[i], forms[j]); if (L >= MINLCP && L >= FRAC * Math.min(forms[i].length, forms[j].length)) { if (cl[i] !== cl[j]) { has[i].add(cl[j]); has[j].add(cl[i]); } } }
  const size = new Float64Array(k), f = new Map(); cl.forEach((c) => size[c]++); has.forEach((s, i) => { for (const b of s) { const key = cl[i] * k + b; f.set(key, (f.get(key) ?? 0) + 1); } });
  const out = []; for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) { const fa = (f.get(a * k + b) ?? 0) / size[a], fb = (f.get(b * k + a) ?? 0) / size[b], s = Math.min(fa, fb); if (s > 0) out.push([a, b, s]); }
  return out;
}
async function run2(lang) {
  const sents = load(SETS[lang]), tr = []; sents.forEach((s, i) => { if (i % 10 > 1) tr.push(s); });
  const cnt = new Map(), gold = new Map(); for (const s of tr) for (const t of s) { cnt.set(t.w, (cnt.get(t.w) ?? 0) + 1); const g = gold.get(t.w) ?? new Map(); g.set(t.u, (g.get(t.u) ?? 0) + 1); gold.set(t.w, g); }
  const V = [...cnt.keys()].filter((w) => cnt.get(w) >= MINC).sort((a, b) => cnt.get(b) - cnt.get(a)), vi = new Map(V.map((w, i) => [w, i])), ctx = V.slice(0, NCTX), ci = new Map(ctx.map((w, i) => [w, i]));
  const M = V.map(() => new Float64Array(2 * NCTX)); for (const s of tr) s.forEach((t, i) => { const r = vi.get(t.w); if (r === undefined) return; const l = i > 0 ? ci.get(s[i - 1].w) : undefined, rt = i + 1 < s.length ? ci.get(s[i + 1].w) : undefined; if (l !== undefined) M[r][l]++; if (rt !== undefined) M[r][NCTX + rt]++; });
  const rowsum = M.map((r) => r.reduce((a, b) => a + b, 0)), colsum = Array.from({ length: 2 * NCTX }, (_, j) => M.reduce((a, r) => a + r[j], 0)), tot = rowsum.reduce((a, b) => a + b, 0), cs75 = colsum.map((c) => c ** 0.75), cst = cs75.reduce((a, b) => a + b, 0);
  const keep = [], X = []; V.forEach((w, r) => { if (!rowsum[r]) return; const row = Array.from(M[r], (c, j) => (c ? Math.max(0, Math.log((c / tot) / ((rowsum[r] / tot) * (cs75[j] / cst)))) : 0)), nm = Math.hypot(...row); if (!nm) return; keep.push(w); X.push(row.map((v) => v / nm)); });
  const k = K, asg = kmeans(X, k), ki = new Map(keep.map((w, i) => [w, i])), forms = keep.map((w) => [...w]);
  const thrax = keep.map((w) => { const g = [...gold.get(w).entries()].sort((a, b) => b[1] - a[1])[0][0]; return THRAX_MAP[g] ?? null; });
  // --- S1 families
  const real = pairShares(forms, asg, k); let nullMax = 0; for (let q = 0; q < NPERM; q++) for (const [, , s] of pairShares(shuffle(forms), asg, k)) nullMax = Math.max(nullMax, s);
  const par = Array.from({ length: k }, (_, i) => i), find = (x) => (par[x] === x ? x : (par[x] = find(par[x]))); for (const [a, b, s] of real) if (s > nullMax) par[find(a)] = find(b);
  const fam = asg.map((c) => find(c)), famOfCluster = Array.from({ length: k }, (_, c) => find(c)), famIds = [...new Set(famOfCluster)];
  const f1 = (members, cls) => { const T = keep.map((_, i) => i).filter((i) => thrax[i] === cls), inS = members.filter((i) => thrax[i]), inter = members.filter((i) => thrax[i] === cls).length; const P = inS.length ? inter / inS.length : 0, R = T.length ? inter / T.length : 0; return P + R ? (2 * P * R) / (P + R) : 0; };
  const bestF = (groupOf, ids, cls) => Math.max(...ids.map((g) => f1(keep.map((_, i) => i).filter((i) => groupOf(i) === g), cls)));
  const sizesOf = famIds.map((g) => famOfCluster.filter((x) => x === g).length), nMerged = real.filter(([, , s]) => s > nullMax).length;
  const S1 = { permNullMaxShare: +nullMax.toFixed(4), pairsAboveNull: nMerged, families: famIds.length, largestFamilyClusters: Math.max(...sizesOf) };
  for (const cls of ["noun", "verb"]) { const single = bestF((i) => asg[i], [...Array(k).keys()], cls), famF = bestF((i) => fam[i], famIds, cls), draws = []; for (let q = 0; q < NRAND; q++) { const order = shuffle([...Array(k).keys()]), grp = new Int32Array(k); let p = 0; sizesOf.forEach((sz, gi) => { for (let z = 0; z < sz; z++) grp[order[p++]] = gi; }); draws.push(bestF((i) => grp[asg[i]], sizesOf.map((_, gi) => gi), cls)); } S1[cls] = { bestSingleClusterF1: +single.toFixed(3), bestFamilyF1: +famF.toFixed(3), randomMergeMax: +Math.max(...draws).toFixed(3), holds: famF > single && famF > Math.max(...draws) }; }
  // --- S2 closed classes and nominations
  const tokOf = (w) => (ki.has(w) ? asg[ki.get(w)] : -1), mass = new Float64Array(k), sz = new Float64Array(k); keep.forEach((w, i) => { mass[asg[i]] += cnt.get(w); sz[asg[i]]++; });
  const lt = Array.from({ length: k }, (_, c) => Math.log(mass[c] / Math.max(1, sz[c]))); let lo = Math.min(...lt), hi = Math.max(...lt); for (let it = 0; it < 50; it++) { const a = lt.filter((x) => Math.abs(x - lo) <= Math.abs(x - hi)), b = lt.filter((x) => Math.abs(x - lo) > Math.abs(x - hi)); if (!a.length || !b.length) break; lo = a.reduce((x, y) => x + y, 0) / a.length; hi = b.reduce((x, y) => x + y, 0) / b.length; }
  const closed = Array.from({ length: k }, (_, c) => c).filter((c) => Math.abs(lt[c] - hi) < Math.abs(lt[c] - lo)), famOfTok = (w) => (ki.has(w) ? famOfCluster[asg[ki.get(w)]] : -1);
  const famTypes = new Map(); keep.forEach((_, i) => famTypes.set(fam[i], (famTypes.get(fam[i]) ?? 0) + 1)); const Nstar = [...famTypes.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const st = new Map(closed.map((c) => [c, { right: new Map(), n: 0, adjN: 0, bind: 0, both: 0 }])); for (const s of tr) s.forEach((t, i) => { const c = tokOf(t.w); if (!st.has(c)) return; const o = st.get(c), l = i > 0 ? famOfTok(s[i - 1].w) : null, r = i + 1 < s.length ? famOfTok(s[i + 1].w) : null; o.n++; if (r !== null) o.right.set(r, (o.right.get(r) ?? 0) + 1); if (l === Nstar || r === Nstar) o.adjN++; if (l !== null && r !== null && l !== -1 && r !== -1) { o.both++; if (l === r) o.bind++; } });
  const ent = (m) => { const n = [...m.values()].reduce((a, b) => a + b, 0); return n ? -[...m.values()].reduce((a, c) => a + (c / n) * Math.log(c / n), 0) / Math.log(famIds.length + 1) : 0; };
  const crit = { preposition: (o) => ent(o.right), article: (o) => (o.n ? o.adjN / o.n : 0), conjunction: (o) => (o.both >= 20 ? o.bind / o.both : 0) };
  const purity = (c, cls) => { const m = keep.map((_, i) => i).filter((i) => asg[i] === c && thrax[i]); return m.length >= 3 ? m.filter((i) => thrax[i] === cls).length / m.length : 0; };
  const S2 = {}, taken = new Set(); for (const cls of ["preposition", "article", "conjunction"]) { const cand = closed.filter((c) => !taken.has(c) && st.get(c).n >= 50).sort((a, b) => crit[cls](st.get(b)) - crit[cls](st.get(a))); if (!cand.length) { S2[cls] = { gap: "no closed cluster with enough tokens" }; continue; } const c = cand[0]; taken.add(c); const pur = purity(c, cls), rank = 1 + closed.filter((x) => purity(x, cls) > pur).length, mem = keep.map((_, i) => i).filter((i) => asg[i] === c), by = new Map(); mem.forEach((i) => { if (thrax[i]) by.set(thrax[i], (by.get(thrax[i]) ?? 0) + 1); }); const dom = [...by.entries()].sort((a, b) => b[1] - a[1])[0]; S2[cls] = { cluster: c, criterionScore: +crit[cls](st.get(c)).toFixed(3), purityForClass: +pur.toFixed(3), rankAmongClosed: rank, ofClosed: closed.length, holds: rank <= 3, actuallyMostly: dom ? `${dom[0]} ${(dom[1] / mem.filter((i) => thrax[i]).length).toFixed(2)}` : null, top: mem.slice(0, 8).map((i) => keep[i]).join(" ") }; }
  const totTok = [...cnt.values()].reduce((a, b) => a + b, 0), cover = (cs) => +(cs.reduce((a, c) => a + mass[c], 0) / totTok).toFixed(3);
  return { lang, k, typesClustered: keep.length, closedClusters: closed.length, S1, S2, S3_tokenShare: { closedClusters: cover(closed), nominated: cover([...taken]), largestFamily: cover(Array.from({ length: k }, (_, c) => c).filter((c) => famOfCluster[c] === Nstar)) } };
}
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ["grc", "fra", "eng"], results = {}; for (const l of langs) { results[l] = await run2(l); const r = results[l]; console.log(l, JSON.stringify({ S1: { fam: r.S1.families, above: r.S1.pairsAboveNull, noun: r.S1.noun, verb: r.S1.verb }, S2: Object.fromEntries(Object.entries(r.S2).map(([c, x]) => [c, x.gap ?? `rank ${x.rankAmongClosed}/${x.ofClosed} purity ${x.purityForClass} is ${x.actuallyMostly}`])) })); }
fs.writeFileSync(new URL("result-stage2.json", import.meta.url), JSON.stringify({ prereg: "01f7fb4e063bc813", stamp: "EXPLORATORY", seed: SEED, results }, null, 1));
