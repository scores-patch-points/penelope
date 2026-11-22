// organs/signal-drift.mjs — the continuous grain, with every threshold DERIVED, none hand-picked.
//
// The three grains are not buckets: a language/text is a point in the case/particle/order
// simplex, and that point DRIFTS — by era, by genre, and within a single text (a register shift).
// This organ reads a text through the khora reader, classifies each kāraka-carrying token by
// which surface signal marked its role (a morphological Case feature, an adposition, or word
// order alone), and traces the running mix in a sliding window.
//
// A register boundary is a difference that makes a difference, and BOTH halves of that are
// derived from a SENTENCE-LEVEL null (permute whole sentences, keep each sentence's grammar
// intact): the DMD is the null's 95th-percentile lag-K drift (how big a net change must be),
// and the persistence is the null's 95th-percentile run of above-floor windows (how long it
// must sustain). K is the window — the decorrelation distance, where a single token has
// decayed out of both compared windows. A stable text reads zero; a block shift reads one.
//
// Pure in its derivation (no model, no clock); it reaches the khora reader only to READ.

import { kernelImportOr } from "./kernel-reach.mjs";

// The signal classification is a DECLARED heuristic (giver: karakaOf, the case→particle→deprel
// order). window / shuffles / seed are declared with the same giver. The DMD and the persistence
// are NOT declared — they are derived from the null inside deriveNull.
const DECLARED = Object.freeze({ window: 48, shuffles: 200, seed: 7 });

// the four signal dimensions: noun case (role-marking, Pattern), pronoun case (English I/me —
// a register marker, not role-marking), adposition (particle), word order. Splitting pronoun
// case from noun case is the honest fix: English is not "40% case", it is 40% first-person.
const DIMS = Object.freeze(["case", "pronoun", "particle", "order"]);

function signalOf(rows, row) {
  const hasCase = /\bCase=/.test(row.feats ?? "");
  if (hasCase && row.upos === "PRON") return "pronoun";
  if (hasCase) return "case";
  if (rows.some((x) => x.head === row.id && x.deprel === "case")) return "particle";
  return "order";
}

const runningMix = (signals, w) => {
  const m = [];
  for (let i = w; i < signals.length; i++) {
    const q = signals.slice(i - w, i);
    m.push(DIMS.map((d) => q.filter((x) => x === d).length / w));
  }
  return m;
};
const lagDrift = (mix, K) => {
  const d = [];
  for (let i = 0; i + K < mix.length; i++) {
    let mx = 0;
    for (let k = 0; k < DIMS.length; k++) mx = Math.max(mx, Math.abs(mix[i + K][k] - mix[i][k]));
    d.push(mx);
  }
  return d;
};
const runs = (above) => {
  const r = [];
  let s = -1;
  for (let i = 0; i <= above.length; i++) { if (above[i]) { if (s < 0) s = i; } else if (s >= 0) { r.push(i - s); s = -1; } }
  return r;
};
function mulberry32(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const sentenceShuffle = (sentences, rng) => { const order = sentences.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } return order.flatMap((i) => sentences[i]); };

/** Derive the DMD and the persistence from a sentence-level null. `sentences` is an array of
 *  per-sentence signal arrays. Pure. */
export function deriveNull(sentences, { window = DECLARED.window, shuffles = DECLARED.shuffles, seed = DECLARED.seed } = {}) {
  const rng = mulberry32(seed), nullDrifts = [];
  for (let s = 0; s < shuffles; s++) nullDrifts.push(...lagDrift(runningMix(sentenceShuffle(sentences, rng), window), window));
  nullDrifts.sort((a, b) => a - b);
  const dmd = nullDrifts[Math.floor(nullDrifts.length * 0.95)];
  const rng2 = mulberry32(seed), nullRuns = [];
  for (let s = 0; s < shuffles; s++) nullRuns.push(...runs(lagDrift(runningMix(sentenceShuffle(sentences, rng2), window), window).map((d) => d > dmd)));
  nullRuns.sort((a, b) => a - b);
  const persistence = nullRuns.length ? nullRuns[Math.floor(nullRuns.length * 0.95)] : 0;
  const nullMaxRun = nullRuns.length ? Math.max(...nullRuns) : 0;
  return { dmd, persistence, nullMaxRun, shuffles };
}

/** Read a text and trace its path through the case/particle/order simplex, marking register
 *  boundaries. Returns the mix totals, the derived thresholds, and the boundaries. */
export async function signalDrift(text, { language = "en", window = DECLARED.window } = {}) {
  const R = await kernelImportOr("khora", "native/reading-one.mjs");
  if (!R) return { gap: "khora-absent" };
  const r = await R.read(String(text), { rows: true, allowDegraded: true, language });
  const sentences = [];
  for (const p of r.parse ?? []) {
    const sig = [];
    for (const row of p.rows) if (row.karaka) sig.push(signalOf(p.rows, row));
    if (sig.length) sentences.push(sig);
  }
  const signals = sentences.flat();
  if (signals.length < window * 2) return { gap: "too few kāraka tokens for a lag-K comparison", tokens: signals.length, window };
  const { dmd, persistence, nullMaxRun, shuffles } = deriveNull(sentences, { window });
  const real = lagDrift(runningMix(signals, window), window);
  const boundaries = runs(real.map((d) => d > dmd)).filter((len) => len > persistence);
  const total = Object.fromEntries(DIMS.map((d) => [d, signals.filter((s) => s === d).length]));
  return { tokens: signals.length, total, dmd: +dmd.toFixed(3), persistence, nullMaxRun, shuffles, boundaryCount: boundaries.length, boundaries };
}
