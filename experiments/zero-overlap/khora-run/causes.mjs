import fs from "node:fs";
import { createSession, admitChunked, sessionReferents } from "/Users/mlacy/Documents/khora-cast/khora/native/legacy-ported/packages/host/corpus.js";
import { transferEntropy } from "/Users/mlacy/Documents/khora-cast/khora/native/legacy-ported/packages/engine/emergence/binding.js";
const path = process.argv[2], text = fs.readFileSync(path, "utf8");
const session = createSession(); admitChunked(session, { text, sourceId: "file:x", language: "en" });
const cast = sessionReferents(session, { sourceId: "file:x", priors: [], limit: 800 });
const split = (t) => t.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÞÄÖÜ])|\n+/).filter((s) => s.trim());
const sents = [], art = [];
text.split("\n\n").forEach((a, ai) => split(a).forEach((s) => { sents.push(s); art.push(ai); }));
const N = sents.length;
// entities: referent surfaces with >= 2 arrival sentences
const ents = [];
for (const r of cast.referents ?? []) {
  const surf = [...new Set((r.surfaces ?? [r.display]).filter((x) => x.length > 2))].sort((a, b) => b.length - a.length);
  const arr = []; sents.forEach((s, i) => { if (surf.some((x) => s.includes(x))) arr.push(i); });
  if (arr.length >= 2) ents.push({ id: r.display, surf, arr });
}
// mentions per sentence (non-overlapping, longest surface first)
const mentions = sents.map((s) => {
  const taken = [], out = [];
  for (const e of ents) for (const x of e.surf) { let from = 0, k; while ((k = s.indexOf(x, from)) >= 0) { if (!taken.some(([a, b]) => k < b && k + x.length > a)) { taken.push([k, k + x.length]); out.push({ e: e.id, start: k, end: k + x.length }); } from = k + x.length; } }
  return out.sort((a, b) => a.start - b.start);
});
const CUES = {
  efficient: /\b(built|founded|established|created|formed|designed|invented|discovered|constructed|named after|by)\b/i,
  material: /\b(made of|consists?|composed|comprising|comprises|includes?|contains?|divided into|part of|member of|within)\b/i,
  formal: /\b(is an?|are an?|was an?|type of|kind of|known as|called|officially)\b/i,
  final: /\b(for|in order to|so that|purpose|serves?|used to|used for|aimed)\b/i,
};
const pairs = new Map(); const dir = new Map(); const nbr = new Map(); const outdeg = new Map(), indeg = new Map();
const inc = (m, k, v = 1) => m.set(k, (m.get(k) ?? 0) + v);
mentions.forEach((ms, si) => {
  const ids = [...new Set(ms.map((m) => m.e))];
  for (const a of ids) for (const b of ids) if (a !== b) { if (!nbr.has(a)) nbr.set(a, new Set()); nbr.get(a).add(b); }
  for (let i = 0; i + 1 < ms.length; i++) {
    const A = ms[i], B = ms[i + 1]; if (A.e === B.e) continue;
    const between = sents[si].slice(A.end, B.start); const words = between.trim().split(/\s+/).filter(Boolean);
    if (words.length > 8 || /[.;:]/.test(between)) continue;
    const key = [A.e, B.e].sort().join("\u0000"); const rec = pairs.get(key) ?? { co: 0, fw: new Map(), cues: { efficient: 0, material: 0, formal: 0, final: 0 } };
    rec.co++; inc(rec.fw, `${A.e}\u0000${B.e}`);
    for (const [c, rx] of Object.entries(CUES)) if (rx.test(between)) rec.cues[c]++;
    pairs.set(key, rec); inc(outdeg, A.e); inc(indeg, B.e);
  }
});
const artSets = new Map(ents.map((e) => [e.id, new Set(e.arr.map((i) => art[i]))]));
const series = new Map(ents.map((e) => { const s = new Array(N).fill(0); e.arr.forEach((i) => (s[i] = 1)); return [e.id, s]; }));
const rows = [];
for (const [key, rec] of pairs) {
  const labs = Object.entries(rec.cues).filter(([, v]) => v > 0).map(([k]) => k); if (labs.length !== 1) continue;
  const [x, y] = key.split("\u0000"); const fx = rec.fw.get(`${x}\u0000${y}`) ?? 0, fy = rec.fw.get(`${y}\u0000${x}`) ?? 0; const [A, B] = fx >= fy ? [x, y] : [y, x];
  const sa = artSets.get(A), sb = artSets.get(B), both = [...sa].filter((t) => sb.has(t)).length;
  const te = transferEntropy(series.get(A), series.get(B)) - transferEntropy(series.get(B), series.get(A));
  const cont = both / sa.size - both / sb.size;
  const na = nbr.get(A) ?? new Set(), nb = nbr.get(B) ?? new Set(); const inter = [...na].filter((t) => nb.has(t) && t !== A && t !== B).length, uni = new Set([...na, ...nb]).size;
  const sink = ((indeg.get(B) ?? 0) - (outdeg.get(B) ?? 0)) / Math.max(1, (indeg.get(B) ?? 0) + (outdeg.get(B) ?? 0));
  rows.push({ label: labs[0], f: [te, cont, uni ? inter / uni : 0, sink], q: [Math.log1p(artSets.get(A).size), Math.log1p(artSets.get(B).size), Math.log1p(rec.co)], A, B });
}
const zs = (cols) => cols[0].map((_, j) => { const v = cols.map((r) => r[j]); const m = v.reduce((a, b) => a + b, 0) / v.length, sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length) || 1; return v.map((x) => (x - m) / sd); });
const Z = (key) => { const cols = rows.map((r) => r[key]); const zz = zs(cols); return rows.map((_, i) => zz.map((c) => c[i])); };
const classes = ["efficient", "material", "formal", "final"];
const loo = (X, y) => { // nearest centroid, leave-one-out
  const d = X[0].length, sums = {}, cnt = {}; classes.forEach((c) => { sums[c] = new Array(d).fill(0); cnt[c] = 0; });
  X.forEach((x, i) => { cnt[y[i]]++; x.forEach((v, j) => (sums[y[i]][j] += v)); });
  let ok = 0;
  X.forEach((x, i) => { let best = null, bd = Infinity; for (const c of classes) { const n = cnt[c] - (y[i] === c ? 1 : 0); if (n < 1) continue; let dist = 0; for (let j = 0; j < d; j++) { const m = (sums[c][j] - (y[i] === c ? x[j] : 0)) / n; dist += (x[j] - m) ** 2; } if (dist < bd) { bd = dist; best = c; } } if (best === y[i]) ok++; });
  return ok / X.length;
};
const y = rows.map((r) => r.label), XS = Z("f"), XQ = Z("q");
const counts = Object.fromEntries(classes.map((c) => [c, y.filter((l) => l === c).length]));
const majority = Math.max(...Object.values(counts)) / rows.length;
const accS = loo(XS, y), accQ = loo(XQ, y), accSQ = loo(XS.map((r, i) => [...r, ...XQ[i]]), y);
let seed = 20261118; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
let ge = 0; for (let t = 0; t < 1000; t++) { const yy = [...y]; for (let i = yy.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [yy[i], yy[j]] = [yy[j], yy[i]]; } if (loo(XS, yy) >= accS) ge++; }
console.log(JSON.stringify({ sentences: N, entities: ents.length, labelledPairs: rows.length, counts, majority: +majority.toFixed(3), accFourSignals: +accS.toFixed(3), accFrequencyOnly: +accQ.toFixed(3), accSignalsPlusFrequency: +accSQ.toFixed(3), permutationP: (ge + 1) / 1001 }, null, 1));
// per-class mean of each signal (raw)
for (const c of classes) { const rs = rows.filter((r) => r.label === c); if (!rs.length) continue; const m = [0, 1, 2, 3].map((j) => rs.reduce((a, r) => a + r.f[j], 0) / rs.length); console.log(c.padEnd(9), "n", rs.length, "TE", m[0].toFixed(4), "contain", m[1].toFixed(3), "nbrSim", m[2].toFixed(3), "sink", m[3].toFixed(3)); }
fs.writeFileSync(path.replace(/\.txt$/, ".causes.json"), JSON.stringify(rows.slice(0, 400)));
