// node compare/predict_eval.mjs <streams.json>   EXPLORATORY, DEV (30 articles): which predictor of the NEXT mention (which referent, coded by written face) makes a document least surprising?
// All predictors share khora's birth term pi_new = (births+1)/(N+2) for an unseen symbol; they differ in how the remaining mass is spread over the symbols already seen. Prequential (the prediction is made before the event).
// Learned tables are LEAVE-ONE-DOCUMENT-OUT: a document is never predicted by a table that has seen it. No constant is tuned to a target; every constant is khora's (gamma 1-1/4, 0.5/0.5) or a power-of-two bucket.
import fs from "node:fs";
const docs = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), L2 = Math.log2, G = 1 - 1 / 4;
const gapB = (d) => Math.min(6, Math.floor(L2(1 + d))), cntB = (n) => Math.min(6, Math.floor(L2(n)));
const B = 7;
// pass 1: per-document sufficient statistics of the learned table: trials[b][c], hits[b][c]
function tableOf(ev) {
  const T = Array.from({ length: B }, () => new Float64Array(B)), H = Array.from({ length: B }, () => new Float64Array(B)); const n = new Map(), last = new Map();
  for (const e of ev) { const s = e.face, t = e.t;
    if (n.has(s)) for (const [u, c] of n) { const b = gapB(t - last.get(u)), k = cntB(c); T[b][k]++; if (u === s) H[b][k]++; }
    n.set(s, (n.get(s) ?? 0) + 1); last.set(s, t); }
  return { T, H };
}
const tabs = docs.map((d) => tableOf(d.events));
const sumTab = (skip) => { const T = Array.from({ length: B }, () => new Float64Array(B)), H = Array.from({ length: B }, () => new Float64Array(B)); tabs.forEach((x, i) => { if (i === skip) return; for (let b = 0; b < B; b++) for (let k = 0; k < B; k++) { T[b][k] += x.T[b][k]; H[b][k] += x.H[b][k]; } }); return { T, H }; };
const NAMES = ["current (0.5 presence + 0.5 frequency)", "frequency only", "presence only (recency)", "order-1 continuation, half backed off to current", "learned gap x count table (other documents)", "learned table mixed 0.5 with current", "move-to-front rank 1/(r+1) alone", "frequency x rank weight", "0.5 frequency + 0.5 rank weight", "presence window 16 (gamma 15/16) alone", "0.5 frequency + 0.5 presence window 16", "0.5 frequency + 0.5 presence window 64", "cue words (previous + current sentence) -> referent, alone", "0.5 cue + 0.5 current", "0.5 cue + 0.5 (learned table mixed with current)"];
function score(ev, learned) {
  const bits = NAMES.map(() => 0), seenBits = NAMES.map(() => 0); let nSeen = 0, N = 0, births = 0; const n = new Map(), pres = new Map(), last = new Map(), follow = new Map(), p16 = new Map(), p64 = new Map(), order = [], wc = new Map(), ws = new Map(); let prev = null;
  for (const e of ev) { const s = e.face, t = e.t, piNew = (births + 1) / (N + 2);
    if (!n.has(s)) { const b = -L2(Math.max(piNew, 1e-12)); for (let i = 0; i < NAMES.length; i++) bits[i] += b; }
    else {
      let Zp = 0, Zf = 0, Zl = 0; const live = new Map(), lw = new Map();
      for (const [u, c] of n) { const p = pres.get(u); const v = p.v * G ** (t - p.t); live.set(u, v); Zp += v; Zf += c;
        const h = (learned.H[gapB(t - last.get(u))][cntB(c)] + 0.5) / (learned.T[gapB(t - last.get(u))][cntB(c)] + 1); lw.set(u, h); Zl += h; }
      const pFreq = n.get(s) / Zf, pPres = Zp > 0 ? live.get(s) / Zp : pFreq, pCur = 0.5 * pPres + 0.5 * pFreq, pL = lw.get(s) / Zl;
      let pCont = pCur; const f = prev !== null ? follow.get(prev) : null; if (f && f.size) { let tot = 0; for (const x of f.values()) tot += x; pCont = 0.5 * ((f.get(s) ?? 0) / tot) + 0.5 * pCur; }
      const rk = new Map(order.map((u, i) => [u, 1 / (order.length - i)]))   /* most recent last: rank 1 = most recent */; let Zr = 0, Zfr = 0; for (const [u, c] of n) { Zr += rk.get(u); Zfr += c * rk.get(u); }
      const pR = rk.get(s) / Zr, pFR = n.get(s) * rk.get(s) / Zfr;
      const wp = (m, g) => { let z = 0; for (const [u, c] of m) z += c.v * g ** (t - c.t); const v = m.get(s).v * g ** (t - m.get(s).t); return z > 0 ? v / z : pFreq; };
      const pP16 = wp(p16, 15 / 16), pP64 = wp(p64, 63 / 64);
      let cue = new Map(), Zc = 0; for (const w of e.ctx ?? []) { const tot = wc.get(w); if (!tot) continue; const m = ws.get(w); for (const [u, c] of m) { if (!n.has(u)) continue; const x = c / tot; cue.set(u, (cue.get(u) ?? 0) + x); Zc += x; } }
      const pC = Zc > 0 ? (cue.get(s) ?? 0) / Zc : pCur, pCmix = Zc > 0 ? 0.5 * pC + 0.5 * pCur : pCur, pLm = 0.5 * pL + 0.5 * pCur, pCL = Zc > 0 ? 0.5 * pC + 0.5 * pLm : pLm;
      const P = [pCur, pFreq, pPres, pCont, pL, 0.5 * pL + 0.5 * pCur, pR, pFR, 0.5 * pFreq + 0.5 * pR, pP16, 0.5 * pFreq + 0.5 * pP16, 0.5 * pFreq + 0.5 * pP64, Math.max(pC, 1e-9), pCmix, pCL].map((x) => (1 - piNew) * x);
      for (let i = 0; i < NAMES.length; i++) { const b = -L2(Math.max(P[i], 1e-12)); bits[i] += b; seenBits[i] += b; } nSeen++;
    }
    if (prev !== null) { if (!follow.has(prev)) follow.set(prev, new Map()); const m = follow.get(prev); m.set(s, (m.get(s) ?? 0) + 1); }
    if (!n.has(s)) births++; n.set(s, (n.get(s) ?? 0) + 1); const p = pres.get(s); pres.set(s, { v: (p ? p.v * G ** (t - p.t) : 0) + 1, t }); last.set(s, t); { for (const w of e.ctx ?? []) { wc.set(w, (wc.get(w) ?? 0) + 1); if (!ws.has(w)) ws.set(w, new Map()); const m2 = ws.get(w); m2.set(s, (m2.get(s) ?? 0) + 1); } for (const [m, g] of [[p16, 15 / 16], [p64, 63 / 64]]) { const q = m.get(s); m.set(s, { v: (q ? q.v * g ** (t - q.t) : 0) + 1, t }); } const ix = order.indexOf(s); if (ix >= 0) order.splice(ix, 1); order.push(s); } N++; prev = s; }
  return { bits, seenBits, nSeen, N };
}
const R = docs.map((d, i) => score(d.events, sumTab(i)));
const tot = (f) => NAMES.map((_, i) => R.reduce((s, r) => s + f(r)[i], 0)), allN = R.reduce((s, r) => s + r.N, 0), allSeen = R.reduce((s, r) => s + r.nSeen, 0);
const bitsAll = tot((r) => r.bits), bitsSeen = tot((r) => r.seenBits);
let rng = 20261119; const rnd = () => { rng |= 0; rng = (rng + 0x6D2B79F5) | 0; let t = Math.imul(rng ^ (rng >>> 15), 1 | rng); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const boot = (i) => { const v = []; for (let b = 0; b < 2000; b++) { let d = 0, nn = 0; for (let k = 0; k < R.length; k++) { const r = R[Math.floor(rnd() * R.length)]; d += r.seenBits[0] - r.seenBits[i]; nn += r.nSeen; } v.push(d / nn); } v.sort((a, b) => a - b); return [v[50], v[1949]]; };
console.log(`DEV (EXPLORATORY): ${docs.length} articles, ${allN} mention events, ${allSeen} of them re-mentions of an already-seen symbol (the rest are first mentions: identical cost for every predictor)`);
NAMES.forEach((nm, i) => { const ci = i ? boot(i) : [0, 0]; console.log(`${nm.padEnd(52)} bits/re-mention ${(bitsSeen[i] / allSeen).toFixed(3)}   bits/event ${(bitsAll[i] / allN).toFixed(3)}   gain vs current ${((bitsSeen[0] - bitsSeen[i]) / allSeen).toFixed(3)} bits/re-mention [${ci[0].toFixed(3)}, ${ci[1].toFixed(3)}]  docs better ${R.filter((r) => r.seenBits[i] < r.seenBits[0]).length}/${R.length}`); });
