// EXPLORATORY run for PREREG-HELDOUT.md (sha256 first 16: 666d063e2c482a68). TIER 1: held-out predictive compression from our OWN tokens (no tagger, no parser). No regex, no word list.
import fs from "node:fs"; import { execFileSync } from "node:child_process";
const KW = "/Users/mlacy/Documents/khora-pharos-reading/native", Z = "/Users/mlacy/Documents/khora-cast/Zenodotus";
const { grammarFor } = await import(`${KW}/the-fold/pharos-reading.mjs`), { sentences, tokenize } = await import(`${KW}/adapters/text/ud-tokenizer.js`), { applyMind } = await import(`${KW}/adapters/text/mind-cuts.js`);
const g = await grammarFor("eng"), SEED = 20261120, NB = 8, BOOT = 1000, MODE = process.env.MODE ?? "calibrate", OUT = process.env.OUT ?? `heldout-result-${MODE}.json`;
const git = (...a) => execFileSync("git", ["-C", Z, "-c", "gc.auto=0", ...a], { encoding: "utf8", maxBuffer: 1 << 28 }), ls = (p) => git("ls-tree", "-r", "HEAD", "--name-only").split("\n").filter((f) => f.startsWith(p) && f.endsWith(".txt")).sort();
const body = (p) => { const t = git("show", `HEAD:${p}`), i = t.startsWith("---") ? t.indexOf("\n---", 3) : -1; return i < 0 ? t : t.slice(t.indexOf("\n", i + 1) + 1); };
const files = [...ls("19-organic-community/cosem/"), ...ls("19-organic-community/nus-sms/en/")].filter((_, i) => i % 10 !== 0), train = [];
for (const f of files) for (const s of sentences(body(f), "und", g.tokenizer)) { const t = tokenize(s, g.tokenizer); if (t.length) train.push(t); }
const total = train.reduce((a, s) => a + s.length, 0), per = Math.ceil(total / NB); let batches = []; { let cur = [], k = 0; for (const s of train) { cur.push(s); k += s.length; if (k >= per && batches.length < NB - 1) { batches.push(cur); cur = []; k = 0; } } batches.push(cur); }
let seed = SEED; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }, mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
// ---- the model: Witten-Bell token bigram over a char-bigram spelling model for new tokens; bits are over the token stream; the denominator is the characters of the text ----
function buildModel(sents) {
  const uni = new Map(), big = new Map(); let N = 0; const types = new Set(), cb = new Map(), cn = new Map(), alpha = new Set();
  const bump = (m, k, d = 1) => m.set(k, (m.get(k) ?? 0) + d);
  for (const s of sents) { let prev = "<s>"; for (const w of [...s, "</s>"]) { bump(uni, w); N++; let m = big.get(prev); if (!m) big.set(prev, (m = new Map())); bump(m, w); prev = w; if (w !== "</s>") types.add(w); } }
  for (const w of types) { let p = "^"; for (const c of [...w, "$"]) { bump(cb, p + "\u0000" + c); bump(cn, p); p = c; if (c !== "$") alpha.add(c); } }
  const A = alpha.size + 1, Tu = uni.size, bT = new Map(), bC = new Map(); for (const [v, m] of big) { bT.set(v, m.size); let c = 0; for (const x of m.values()) c += x; bC.set(v, c); }
  const pchar = (w) => { let p = "^", lp = 0; for (const c of [...w, "$"]) { lp += Math.log2(((cb.get(p + "\u0000" + c) ?? 0) + 1) / ((cn.get(p) ?? 0) + A)); p = c; } return lp; };   // log2 probability of spelling w
  const cache = new Map(), puni = (w) => { let v = cache.get(w); if (v === undefined) { const c = uni.get(w) ?? 0; v = w === "</s>" ? (c + 0.5) / (N + Tu) : (c + Tu * Math.pow(2, pchar(w))) / (N + Tu); cache.set(w, v); } return v; };
  return { bits(s) { let prev = "<s>", b = 0; for (const w of [...s, "</s>"]) { const m = big.get(prev), pu = puni(w); b -= Math.log2(m ? ((m.get(w) ?? 0) + bT.get(prev) * pu) / (bC.get(prev) + bT.get(prev)) : pu); prev = w; } return b; } };
}
const chars = (ss) => ss.reduce((a, s) => a + s.reduce((x, w) => x + [...w].length, 0), 0);
// per-fold paired bootstrap of the mean per-sentence delta; the resample indices are shared across candidates
const idxCache = new Map(), boot = (n) => { if (!idxCache.has(n)) { const M = new Uint32Array(BOOT * n); for (let i = 0; i < M.length; i++) M[i] = Math.floor(rnd() * n); idxCache.set(n, M); } return idxCache.get(n); };
function bootGood(d) { const n = d.length, M = boot(n); let ge = 0; for (let b = 0; b < BOOT; b++) { let s = 0; for (let i = 0; i < n; i++) s += d[M[b * n + i]]; if (s / n >= 0) ge++; } return ge; }
const cutSents = (ss, suf) => ss.map((s) => applyMind(s, { cuts: [{ suffix: suf }] }));
function evalFolds(bs, suffixes) {
  const res = new Map(suffixes.map((x) => [x, []])), K = bs.length;
  for (let k = 0; k < K; k++) {
    const trainS = bs.flatMap((b, i) => (i === k ? [] : b)), val = bs[k], base = buildModel(trainS), bb = val.map((s) => base.bits(s)), ch = chars(val);
    for (const suf of suffixes) { const tc = cutSents(trainS, suf), vc = cutSents(val, suf), m = buildModel(tc), d = vc.map((s, i) => m.bits(s) - bb[i]), mu = mean(d), ge = mu < 0 ? bootGood(d) : BOOT; res.get(suf).push({ fold: k + 1, deltaBpc: mu * val.length / ch, bootGE: ge, good: ge === 0 }); }
  }
  return res;
}
const cands = (bs) => { const by = new Map(); const seen = new Set(); for (const b of bs) for (const s of b) for (const w of s) { if (seen.has(w)) continue; seen.add(w); const cs = [...w]; for (let L = 1; L <= Math.min(4, cs.length - 1); L++) { const x = cs.slice(cs.length - L).join(""); by.set(x, (by.get(x) ?? 0) + 1); } } return [...by].filter(([, n]) => n >= 2).map(([x]) => x).sort(); };
const shuf = (w) => { const cs = [...w]; for (let i = cs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cs[i], cs[j]] = [cs[j], cs[i]]; } return cs.join(""); }, alphaW = (w) => [...w].every((c) => c >= "a" && c <= "z");
const out = { prereg: "666d063e2c482a68", seed: SEED, mode: MODE };
if (MODE === "calibrate") {
  const four = batches.slice(0, 4), freq = new Map(); for (const s of four[0]) for (const w of s) if ([...w].length === 3 && alphaW(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  const PLANT = [...freq].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 5).map(([w]) => w); console.log("planted (derived):", PLANT.join(" "));
  const glue = (ss) => ss.map((s) => { const o = []; for (const w of s) { if (PLANT.includes(w) && o.length && alphaW(o.at(-1)) && rnd() < 0.5) o[o.length - 1] += w; else o.push(w); } return o; });
  const rare = (ss) => { const o = ss.map((s) => [...s]); let n = 0; for (let i = 0; i < o.length && n < 8; i++) { const j = o[i].findIndex((w) => alphaW(w) && [...w].length >= 3); if (j >= 0 && rnd() < 0.05) { o[i][j] += "zq"; n++; } } for (let i = o.length - 1; i >= 0 && n < 8; i--) { const j = o[i].findIndex((w) => alphaW(w) && [...w].length >= 3 && !w.endsWith("zq")); if (j >= 0) { o[i][j] += "zq"; n++; } } return o; };
  const conds = { A: four.map((b) => b.map((s) => s.map(shuf))), B: four.map(glue), C: four.map((b, i) => (i === 0 ? rare(b) : b)) };
  for (const [name, bs] of Object.entries(conds)) {
    const t0 = Date.now(), list = name === "B" || name === "C" ? [...new Set([...cands(bs)])] : cands(bs), res = evalFolds(bs, list), goodFolds = (x) => res.get(x).filter((r) => r.good).length;
    const perFold = [0, 1, 2, 3].map((k) => list.filter((x) => res.get(x)[k].good).length), rep = list.filter((x) => goodFolds(x) >= 2), once = list.filter((x) => goodFolds(x) === 1);
    out[name] = { candidates: list.length, goodPerFold: perFold, ratePerFold: perFold.map((n) => n / list.length), replicated: rep.length, replicatedShare: rep.length / list.length, once: once.length, replicatedList: rep.slice(0, 30) };
    if (name === "B") { out[name].planted = Object.fromEntries(PLANT.map((w) => [w, goodFolds(w)])); out[name].plantedDeltaBpc = Object.fromEntries(PLANT.map((w) => [w, +mean(res.get(w).map((r) => r.deltaBpc)).toFixed(5)])); out[name].nonPlantedReplicated = rep.filter((x) => !PLANT.includes(x)).length; }
    if (name === "C") out[name].zq = res.has("zq") ? goodFolds("zq") : "not a candidate";
    console.log(`${name}: ${list.length} candidates; good per fold ${perFold.join(",")} (${perFold.map((n) => (100 * n / list.length).toFixed(2) + "%").join(", ")}; theory at most 3.23%); REPLICATED ${rep.length} (${(100 * rep.length / list.length).toFixed(3)}%; theory at most 0.104%); once ${once.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`, name === "B" ? `| planted good in n folds ${JSON.stringify(out[name].planted)} | non-planted replicated ${out[name].nonPlantedReplicated}` : "", name === "C" ? `| zq good in ${out[name].zq} folds` : "");
    fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  }
} else {
  const FORMS = ["'s", "n't", "'ll", "'m", "'ve", "'re", "'d"], MORPH = ["s", "ed", "ing", "ly", "er", "ness"], list = [...FORMS, ...MORPH].filter((x) => cands(batches).includes(x)), t0 = Date.now(), res = evalFolds(batches, list);
  out.forms = {}; for (const x of list) { const r = res.get(x); out.forms[x] = { goodFolds: r.filter((z) => z.good).length, folds: r.length, meanDeltaBpc: mean(r.map((z) => z.deltaBpc)), perFold: r.map((z) => +z.deltaBpc.toFixed(5)) }; console.log(`  ${x.padEnd(5)} good on ${out.forms[x].goodFolds}/${r.length} folds, mean delta bits-per-char ${out.forms[x].meanDeltaBpc.toFixed(5)} (negative = cheaper to predict)`); }
  console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s`); fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
}
