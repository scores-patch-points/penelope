// FRESH run of PREREG.md (sha256 first 16: f5cd88ff8fa61f5e). Usage: EWT=/tmp/ewt-dev.conllu node measure.mjs. No regex, no word list reads text.
import fs from "node:fs";
import { proposeCut } from "../../organs/clitic-slice.mjs";
const EWT = process.env.EWT;
const SEED = 20261120, MINC = 5, NCTX = 200, K = 64, RESTARTS = 10, SHUF = 200;
const THRAX_MAP = Object.freeze({ NOUN: "noun", PROPN: "noun", VERB: "verb", AUX: "verb", PRON: "pronoun", DET: "article", ADP: "preposition", CCONJ: "conjunction", SCONJ: "conjunction", ADV: "adverb", INTJ: "interjection" });
const GIVER_NAMES = new Set(["'s", "'", "n't", "'ll", "'m", "'ve", "'d"]);
const NOT_NAMED = "'re";
let s0 = SEED; const rnd = () => { s0 = (s0 * 1664525 + 1013904223) >>> 0; return s0 / 4294967296; };
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const norm = (f) => f.toLowerCase().replaceAll("’", "'");
function load(file) {
  const out = []; let cur = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) { if (cur.length) out.push(cur); cur = []; continue; }
    if (line.startsWith("#")) continue;
    const c = line.split("\t");
    if (Number.isInteger(Number(c[0]))) cur.push({ form: c[1], w: c[1].toLowerCase(), u: c[3] });
  }
  if (cur.length) out.push(cur);
  return out;
}
const sents = load(EWT);
const train = [], held = [];
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
const clusterWeight = new Map();
for (const w of keep) { const c = typeCluster.get(w); const u = [...gold.get(w).entries()].sort((a, b) => b[1] - a[1])[0][0]; const th = THRAX_MAP[u]; if (!th) continue; if (!clusterWeight.has(c)) clusterWeight.set(c, new Map()); const m = clusterWeight.get(c); m.set(th, (m.get(th) ?? 0) + (cnt.get(w) ?? 1)); }
const clusterDist = new Map();
for (const [c, m] of clusterWeight) { const tot = [...m.values()].reduce((a, b) => a + b, 0); const dist = {}; for (const [k, v] of m) dist[k] = v / tot; clusterDist.set(c, dist); }
const smell = (form) => {
  const c = typeCluster.get(form.toLowerCase());
  const dist = c === undefined ? null : clusterDist.get(c);
  if (!dist) return null;
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
  const cls = entries[0][0], top = entries[0][1], second = entries.length > 1 ? entries[1][1] : 0;
  return { cls, margin: top - second, dist };
};

// find clitic attachments in held-out (gold split: host followed by marker)
const attachments = [];
for (const s of held) for (let i = 0; i + 1 < s.length; i++) {
  const mk = norm(s[i + 1].form);
  if (GIVER_NAMES.has(mk) || mk === NOT_NAMED) attachments.push({ host: s[i], marker: s[i + 1], markerNorm: mk });
}
const rows = attachments.map((a) => {
  const glued = norm(a.host.form) + a.markerNorm;
  const hostForm = norm(a.host.form);
  return {
    hostForm, marker: a.markerNorm, glued,
    gluedSmell: smell(glued), hostSmell: smell(hostForm), markerSmell: smell(a.markerNorm),
    hostGold: THRAX_MAP[a.host.u] ?? null,
  };
});
const named = rows.filter((r) => !(r.marker === NOT_NAMED));
const glueNameable = named.filter((r) => r.gluedSmell?.cls).length;
const hostNameable = named.filter((r) => r.hostSmell?.cls).length;
const propRecall = named.filter((r) => proposeCut({ form: r.glued, smell, markers: GIVER_NAMES }) !== null).length;
// precision: proponent over held-out single gold tokens (the non-clitic population)
let fp = 0, singleCount = 0;
for (const s of held) for (const t of s) { singleCount++; if (proposeCut({ form: norm(t.form), smell, markers: GIVER_NAMES })) fp++; }
// C2: host class agreement + margin, vs label shuffle
const hostRows = named.filter((r) => r.hostGold && r.hostSmell);
const agree = (rows2, keyOf) => rows2.filter((r) => r.hostSmell.cls === keyOf(r)).length / rows2.length;
const obsAgree = agree(hostRows, (r) => r.hostGold);
let nullAgree = []; for (let q = 0; q < SHUF; q++) { const g = shuffle(hostRows.map((r) => r.hostGold)); nullAgree.push(hostRows.filter((r, i) => r.hostSmell.cls === g[i]).length / hostRows.length); }
const margin = hostRows.map((r) => r.hostSmell.margin);
const meanMargin = margin.reduce((a, b) => a + b, 0) / (margin.length || 1);
const out = {
  prereg: "f5cd88ff8fa61f5e", stamp: "FRESH", trainSentences: train.length, heldSentences: held.length, typesClustered: keep.length,
  attachments: attachments.length, named: named.length, unNamedRe: rows.length - named.length,
  C1: { glueNameable, hostNameable, glueRate: +(glueNameable / named.length).toFixed(4), hostRate: +(hostNameable / named.length).toFixed(4), holds: glueNameable < hostNameable },
  C2: { n: hostRows.length, hostClassAgreement: +obsAgree.toFixed(4), nullMax: +Math.max(...nullAgree).toFixed(4), holds: obsAgree > Math.max(...nullAgree), meanMargin: +meanMargin.toFixed(4) },
  C3: { recall: +(propRecall / named.length).toFixed(4), proposed: propRecall, of: named.length, falsePositivesOnHeldSingleTokens: fp, singleTokens: singleCount },
};
fs.writeFileSync(new URL("result-fresh.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
