// frame-verdicts.mjs — the third outcome: NEW FRAME (EVA / REC). Model-free; every frame is declared before the claimant answers (DEF).
//
// Penelope does not recognise Odysseus at the first interview: the probe neither confirms nor refutes ("is and is not a recognition",
// a half-credence), so she sets another test, and the bed settles it. A verdict therefore has three outcomes, not two:
//   same       the claimant passes the frame AND no rival passes it (the probe discriminates)
//   other      the claimant fails the frame (default stance: sameness is earned, never assumed)
//   new_frame  the claimant passes but a rival passes too: this frame cannot decide, so REC opens the next frame in the ladder
// A ladder that ends still undecided is a `gap` carrying its trail, never a guess.
//
//   judgeFrames({ frames, claim, rivals }) -> { verdict, frame, trail, why }
//   frame   { name, why, run(candidate) -> { pass: boolean, score?: number } }   (declared, ordered; the caller's measure, not a model)
//   rivals  other candidates asked under every frame (the suitors); [] means nothing can make a frame non-discriminating.
//   admitLadder({ before, after }) -> { accept, why }: a revision (new frame, reordered ladder) is admitted only if balanced accuracy
//   rises and the false-accept rate does not (before / after: { tp, fn, fa, tn }).

export const FRAME_SCHEMA = "FrameVerdict@1";

export function judgeFrames({ frames, claim, rivals = [] } = {}) {
  if (!Array.isArray(frames) || !frames.length) return { verdict: "gap", frame: null, trail: [], why: "no_frames_declared" };
  const trail = [];
  for (const f of frames) {
    if (typeof f?.run !== "function" || !f.name) return { verdict: "gap", frame: f?.name ?? null, trail, why: "malformed_frame" };
    const c = f.run(claim);
    if (!c?.pass) { trail.push({ frame: f.name, outcome: "other", score: c?.score ?? null }); return { verdict: "other", frame: f.name, trail, why: `the claimant fails frame ${f.name}` }; }
    const rp = rivals.filter((r) => f.run(r)?.pass).length;
    if (rp === 0) { trail.push({ frame: f.name, outcome: "same", score: c.score ?? null, rivalsPassing: 0 }); return { verdict: "same", frame: f.name, trail, why: `passes frame ${f.name} and none of ${rivals.length} rivals do` }; }
    trail.push({ frame: f.name, outcome: "new_frame", score: c.score ?? null, rivalsPassing: rp });
  }
  return { verdict: "gap", frame: null, trail, why: `no frame separates the claimant from the rivals (${trail.length} tried)`, newFrameExhausted: true };
}

const rate = (n, d) => (d ? n / d : 0);
export function admitLadder({ before, after } = {}) {
  const ba = (x) => (rate(x.tp, x.tp + x.fn) + (1 - rate(x.fa, x.fa + x.tn))) / 2, fa = (x) => rate(x.fa, x.fa + x.tn);
  const b1 = ba(before), b2 = ba(after), f1 = fa(before), f2 = fa(after);
  const accept = b2 > b1 && f2 <= f1;
  return { accept, ba: [b1, b2], fa: [f1, f2], why: accept ? "balanced accuracy rose and false accepts did not" : b2 <= b1 ? "balanced accuracy did not rise" : "false accepts rose" };
}

// INDEPENDENCE AS A MARK. A ladder of k frames only shrinks the false-accept rate like rate^k if the frames fail independently. Measured on
// Wikipedia pairs (fr/de dev) they do not: the same near-twin impostors pass several frames, so k frames are worth about 2. effectiveFrames
// measures this from the rivals' pass patterns: k_eff = log(joint pass rate) / log(geometric mean of the per-frame pass rates).
// k_eff = k when frames are independent, less when correlated. Returns null when it cannot be computed (no rival passed all frames, or any frame is never/always passed).
//   effectiveFrames({ patterns }) -> { k, k_eff, joint, marginals }    patterns: one boolean[k] per rival, same frame order
export function effectiveFrames({ patterns } = {}) {
  if (!Array.isArray(patterns) || !patterns.length) return { k: 0, k_eff: null, why: "no_patterns" };
  const k = patterns[0].length, n = patterns.length;
  const marginals = Array.from({ length: k }, (_, j) => patterns.filter((r) => r[j]).length / n);
  const joint = patterns.filter((r) => r.every(Boolean)).length / n;
  if (marginals.some((m) => m <= 0 || m >= 1) || joint <= 0) return { k, k_eff: null, joint, marginals, why: "degenerate_margin_or_no_joint_pass" };
  const g = Math.exp(marginals.reduce((a, m) => a + Math.log(m), 0) / k);
  return { k, k_eff: Math.log(joint) / Math.log(g), joint, marginals };
}
// A ladder revision that adds frames is credited only for the independent part: the added frames count at k_eff, not k.
// admitLadder stays the gate (BA up, FA not up); admitWithIndependence additionally refuses a revision whose k_eff did not rise.
export function admitWithIndependence({ before, after, kEffBefore, kEffAfter } = {}) {
  const a = admitLadder({ before, after });
  if (!a.accept) return a;
  if (kEffBefore == null || kEffAfter == null) return { ...a, accept: false, why: "k_eff not measured: the added frame is not credited" };
  return kEffAfter > kEffBefore ? { ...a, kEff: [kEffBefore, kEffAfter] } : { ...a, accept: false, why: "added frame is correlated with the old ones: k_eff did not rise" };
}

// DRIFT. "Is he still the man she married?" Identity through time is lineage, not equality: each later state is judged under the SAME ladder
// against the SAME anchor (the bed), and the verdict is about the chain.
//   continuous   every state is same under the ladder
//   drifted      the first state that is not same is named (`since`), with its verdict; earlier states stay continuous
//   broken       the earliest state already fails: there was never a lineage to follow
// `declared` (the "man he was meant to be") is a bylined perspective supplied by a person; it is carried into the verdict and never computed.
export function judgeLineage({ states, frames, rivals = [], declared = null } = {}) {
  if (!Array.isArray(states) || !states.length) return { verdict: "gap", why: "no_states", declared };
  const chain = states.map((s) => ({ at: s.at ?? null, ...judgeFrames({ frames, claim: s.claim, rivals }) }));
  const bad = chain.findIndex((c) => c.verdict !== "same");
  if (bad === -1) return { verdict: "continuous", chain, declared, why: "every state is the same under the ladder" };
  if (bad === 0) return { verdict: "broken", chain, since: chain[0].at, declared, why: `the earliest state is ${chain[0].verdict}: no anchor to follow` };
  return { verdict: "drifted", chain, since: chain[bad].at, lastSame: chain[bad - 1].at, declared, why: `state ${chain[bad].at ?? bad} is ${chain[bad].verdict} under the ladder after ${bad} same state(s)` };
}

// CLAIMS IN ORDER AND IN FRAME. "The president has one birthplace. The president can be in different places at different times."
// A claim is {id, subject, predicate, value, kind, frame, at, dependsOn}. kind "invariant" (one value for the subject: birthplace) or
// "fluent" (a value that holds over an interval `at` = [from, to]: location, office). Two claims about the same subject and predicate are:
//   incomparable  different frames (the standard of meaning differs): no verdict is possible, say so
//   blocked       a claim they depend on is not in the record (the dependency order is incomplete): a hole, never a guess
//   agree         same value
//   dispute       different values for an invariant, or for a fluent whose intervals overlap
//   compatible    different values for a fluent whose intervals do not overlap: both can be true
// Intervals are numbers (any order-preserving clock); a missing bound is open. This is the leaf question; the root question (same subject) is separate.
const overlaps = (a = [], b = []) => (a[0] ?? -Infinity) <= (b[1] ?? Infinity) && (b[0] ?? -Infinity) <= (a[1] ?? Infinity);
// options: record (claims known), tol (relative tolerance for numeric values), maxRate (largest relative drift per time unit a numeric fluent may show).
export function compareClaims(a, b, { record = [], tol = null, maxRate = null, inferredMayDispute = false } = {}) {
  if (!a || !b || a.subject !== b.subject || a.predicate !== b.predicate) return { verdict: "unrelated", why: "different subject or predicate" };
  if ((a.frame ?? null) !== (b.frame ?? null)) return { verdict: "incomparable", why: `frames differ (${a.frame} vs ${b.frame})` };
  const have = new Set(record.map((c) => c.id));
  const missing = [...(a.dependsOn ?? []), ...(b.dependsOn ?? [])].filter((id) => !have.has(id));
  if (missing.length) return { verdict: "blocked", missing, why: "a claim this depends on is not in the record" };
  const num = typeof a.value === "number" && typeof b.value === "number" && tol != null;
  const d = num ? Math.abs(a.value - b.value) / Math.max(Math.abs(a.value), Math.abs(b.value), 1e-9) : null;
  if (a.value === b.value || (num && d <= tol)) return { verdict: "agree", why: num && a.value !== b.value ? `within ${tol} relative` : "same value in the same frame" };
  const invariant = a.kind === "invariant" || b.kind === "invariant";
  if (invariant) return { verdict: "dispute", why: `${a.predicate} is an invariant: one value, two given` };
  if (a.at == null || b.at == null) return { verdict: "blocked", missing: ["time"], why: "a fluent with no time cannot be compared: the time is a missing dependency" };
  // A time that was INFERRED (atInferred: true; a declared window, e.g. the document's observation date minus W years) is a dependency
  // carried with its uncertainty, not a stated fact. It can only support a dispute when even the widest possible gap cannot explain the difference.
  if (a.atInferred || b.atInferred) {
    if (num && maxRate != null) {
      const maxGap = Math.max(Math.abs(b.at[1] - a.at[0]), Math.abs(a.at[1] - b.at[0]));
      return d <= tol + maxRate * maxGap ? { verdict: "compatible", inferred: true, why: "inferred times: the difference is within what the widest possible drift allows" } : inferredMayDispute ? { verdict: "dispute", inferred: true, why: "larger than drift can explain even at the widest possible gap" } : { verdict: "blocked", inferred: true, missing: ["stated time"], why: "a dispute that rests on an inferred time is suspect (dev: 77% of true pairs would be falsified): it is a hole, not a falsifier, unless the caller opts in" };
    }
    if (overlaps(a.at, b.at)) return { verdict: "blocked", inferred: true, missing: ["time precision"], why: "inferred times overlap: the order of the two values cannot be told" };
  }
  if (overlaps(a.at, b.at)) return { verdict: "dispute", why: "different values over overlapping times" };
  // Numeric fluents may drift between times: a gap of g time units explains a relative difference up to tol + maxRate * g.
  if (num && maxRate != null) {
    const gap = Math.max((b.at[0] ?? -Infinity) - (a.at[1] ?? Infinity), (a.at[0] ?? -Infinity) - (b.at[1] ?? Infinity));
    return d <= tol + maxRate * gap ? { verdict: "compatible", why: "different times: the difference is within what the drift allows" } : { verdict: "dispute", why: "different times, but the difference is larger than the drift allows" };
  }
  return { verdict: "compatible", why: "different values at different times: both can hold" };
}

// COMMIT-REVEAL. A probe written into a log everyone reads is no longer a bed: a claimant that reads the ladder can fit it. So the DEF step logs
// only a commitment (sha256 of probe text + a secret salt); the probe is revealed at the test, and anyone can check it is the one committed.
import { createHash } from "node:crypto";
const h = (x) => createHash("sha256").update(x).digest("hex");
export const commitProbe = ({ probe, salt } = {}) => (probe && salt ? { commit: h(`${salt}\n${probe}`) } : { commit: null, why: "probe_and_salt_required" });
export const revealProbe = ({ commit, probe, salt } = {}) => ({ ok: !!commit && !!probe && !!salt && h(`${salt}\n${probe}`) === commit, why: commit && probe && salt ? undefined : "commit_probe_and_salt_required" });

export const KINDS = Object.freeze({
  "frame-verdict": { cell: "EVA·Figure", why: "same, other or new_frame for a claimant under a declared ladder of frames; a ladder with no separating frame is a gap with its trail" },
  "lineage-verdict": { cell: "EVA·Pattern", why: "continuous, drifted (since when) or broken for a claimant across time under one declared ladder and anchor; any 'meant to be' is a bylined declaration, never computed" },
  "claim-comparison": { cell: "EVA·Pattern", why: "agree / dispute / compatible / incomparable / blocked for two claims in a frame, with their kind (invariant or fluent) and interval; the leaf question beside same-root" },
  "frame-ladder": { cell: "DEF·Ground", why: "a declared ladder of frames (probes), ordered, bylined, fixed before the claimant answers" },
});
export const verdictBody = (pairSha, j) => ({ addr: `frames:${pairSha}`, body: { verdict: j.verdict, frame: j.frame, trail: j.trail, why: j.why } });
