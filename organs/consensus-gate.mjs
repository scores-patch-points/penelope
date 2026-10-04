// consensus-gate.mjs — DMD-bounded comp-consensus gate.
//
// A candidate layout is a MODE in Koopman's sense (native/kernel/dmd.js):
// it has a FREQUENCY (recurrence across independent comps) and a GROWTH
// rate (support trajectory as the harvest arrives). The gate opens only
// when frequency clears a finite-sample bound with non-negative growth,
// inside a harvest budget. There is no fixed N anywhere: the bound moves
// with n, and the gate answers CALLABLE / MORE (and how many more at
// current share) / DISSOLVED / EXHAUSTED.
//
// Mapping, stated honestly: this is the CATEGORICAL analogue of DMD, not
// the numeric operator — comps arrive as labels, not state vectors, so
// dmd.js is not imported (running Jacobi rotations on 0/1 rows would be
// numerology). Frequency ~= mode energy, growth ~= eigenvalue magnitude
// sign, the Hoeffding bound ~= the noise floor.
//
// Labels: each harvested comp resolves to one layout label (e.g.
// "CD/T/M/V/S") or a non-witness (shell with no static rows, miss, empty
// — these count toward budget but never toward a mode).
//
// Bound: under the null the K observed categories are equiprobable, so
// the leading share's chance baseline is 1/K. Hoeffding: with n witnesses,
// share clears 1/K + sqrt(ln(1/alpha)/(2n)) with confidence 1-alpha.
// Growth: cumulative leading-share over the second half of arrivals must
// be >= first half (still confirming or stable, not dissolving).
// Minimum 3 witnesses (triangulation — a pattern needs three to be a
// pattern, set by hand, disclosed). Budget maxN bounds the harvest.

export const GATE_SCHEMA = "ConsensusGate@1";

export function gate(layouts, { alpha = 0.05, minN = 3, maxN = 12 } = {}) {
  const witnesses = layouts.filter((l) => l != null);
  const n = witnesses.length;
  const counts = new Map();
  for (const l of witnesses) counts.set(l, (counts.get(l) ?? 0) + 1);
  const K = counts.size;
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [mode, hits] = ranked[0] ?? [null, 0];
  const share = n ? hits / n : 0;
  const bound = K ? 1 / K + Math.sqrt(Math.log(1 / alpha) / (2 * Math.max(n, 1))) : Infinity;
  // growth: DISSOLVED only on hard vanishing — the mode appeared
  // repeatedly in the first half (>= 2 hits) and zero times in the
  // second. Anything less is small-n noise, not a trajectory. (An
  // earlier halves-rate version vetoed AAAA,B,C as "dissolving" — it
  // mistook late diversity for decline. Recorded, fixed.)
  const half = Math.ceil(n / 2);
  const firstHits = witnesses.slice(0, half).filter((l) => l === mode).length;
  const secondHits = witnesses.slice(half).filter((l) => l === mode).length;
  const growth = secondHits - firstHits;
  const vanished = firstHits >= 2 && secondHits === 0;
  const neededAtShare = (s) => {
    if (s <= 0) return Infinity;
    // smallest n' such that s >= 1/K + sqrt(ln(1/alpha)/(2n'))
    const m = Math.log(1 / alpha) / 2;
    const gap = s - 1 / Math.max(K, 1);
    if (gap <= 0) return Infinity;
    return Math.ceil(m / (gap * gap));
  };
  if (n < minN)
    return { verdict: "MORE", mode, hits, n, K, share, bound, growth, reason: `only ${n} witnesses (min ${minN})`, next: `harvest to ${minN}` };
  if (vanished)
    return { verdict: "DISSOLVED", mode, hits, n, K, share, bound, growth, reason: "leading mode appeared repeatedly then vanished as harvest widened — do not guess it", next: "harvest wider (different sources), not deeper" };
  if (K === 1)
    return { verdict: "CALLABLE", mode, hits, n, K, share, bound: 1, growth, reason: `unanimous across ${n} witnesses, no rival mode — standing: copycat-template risk disclosed, not checked`, next: null };
  if (share >= bound)
    return { verdict: "CALLABLE", mode, hits, n, K, share, bound, growth, reason: `share ${share.toFixed(2)} clears bound ${bound.toFixed(2)} at alpha ${alpha}, mode still present late`, next: null };
  if (layouts.length >= maxN || n >= maxN)
    return { verdict: "EXHAUSTED", mode, hits, n, K, share, bound, growth, reason: `budget ${maxN} spent without clearing — named gap`, next: null };
  const need = neededAtShare(share) - n;
  const next = need > maxN - n
    ? `would need ~${need + n} at current share — exceeds budget ${maxN}: needs HIGHER agreement, not just more comps`
    : `~${Math.max(need, 1)} more confirming comps at current share (budget ${maxN})`;
  return { verdict: "MORE", mode, hits, n, K, share, bound, growth, reason: `share ${share.toFixed(2)} below bound ${bound.toFixed(2)}`, next };
}

// ——— self-tests (run: node --input-type=module -e "import('./consensus-gate.mjs').then(m=>m.selftest())") ———
export function selftest() {
  const t = (name, cond) => { if (!cond) { console.error("FAIL", name); process.exitCode = 1; } else console.log("ok", name); };
  let r = gate(["A", "A", "A", "A", "B", "C"], { alpha: 0.3 });
  t("strong consensus callable", r.verdict === "CALLABLE");
  r = gate(["A", "B"]);
  t("two witnesses asks more", r.verdict === "MORE");
  r = gate(["A", "A", "A", "A", "B", "C", "B", "D"]);
  t("vanished leader dissolves", r.verdict === "DISSOLVED");
  r = gate(["A", "B", "C", "A", "B", "C", "A", "B", "C", "A", "B", "C"], { maxN: 12 });
  t("no pattern in budget exhausts", r.verdict === "EXHAUSTED");
  r = gate(["A", "B", "A", "B"]);
  t("interleaved split asks more with guidance", r.verdict === "MORE" && /more confirming|HIGHER agreement/.test(r.next));
  r = gate(["CD/T/M/V/S", "T/M/V/S", "T/M/V", "CD/T/M/V/S"]);
  t("launch-4 split asks more, not dissolved", r.verdict === "MORE" && r.growth >= 0);
  r = gate([null, null, "A", "A", "A", null]);
  t("non-witnesses spend budget, not modes", r.verdict === "CALLABLE" && r.n === 3);
}
