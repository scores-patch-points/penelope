// organs/thought-producer.mjs — Penelope PRODUCES thoughts.
//
// A thought is a candidate meaning: a distribution over the EOT arc cells (the
// language-independent meaning layer, GL-CO-10). produceNext composes the NEXT thought
// from the error signal — the per-cell surprise decomposition (organs/predictive-reason.mjs
// errorSignal) — by moving the over-represented cells down and the under-represented cells
// up, toward the vision. This is the REC operator made GENERATIVE: the step GL-MR-02 kept as
// a limit ("the REC is a verdict 'toward or not', not a re-write") is now the re-write itself.
//
// reason() runs the loop forward without bound — DEF (the vision) EVA (the surprise) REC
// (produce the next) — until the surprise stops falling. The surprise that remains is the DMD
// (the difference that makes a difference): the closest the producer can reach by gradient
// descent alone. This is "indefinite reasoning": the machine does not stop after one
// judgement, it keeps producing thoughts toward the vision until the gradient is spent.
//
// PURE in its reasoning (no model, no clock, no khora). It reaches the khora reader only in
// reasonFromText, to READ the vision and the seed text into the cell layer (that reading is
// janus, through organs/mechanical-reason.mjs cellsOf — the sanctioned door, never a pattern).

import { cellDistance, cellsOf } from "./mechanical-reason.mjs";

// The correction rate: the fraction of the gap to the vision one produceNext step closes.
// Declared, not DMD-derived — giver: the author, 2026-11-21. (The DMD derivation is owed,
// the same kept limit as the 0.05 equivalence threshold, GL-MR-01.) rate < 1 keeps a
// trajectory; rate = 1 lands on the vision in a single step and leaves nothing to reason.
const DECLARED = Object.freeze({
  rate: 0.5,
  maxSteps: 128,
  tolerance: 1e-6,
});

const cells = (x) => (x && x.cells ? x.cells : x);

/** One REC step, generative: compose the next thought from the error signal. An
 *  over-represented cell (the candidate holds more than the vision) moves down; an
 *  under-represented cell moves up; each by `rate` of the gap. Returns the next thought and
 *  whether it moved toward the vision (surprise fell). Pure — vision and candidate are cell maps. */
export function produceNext(vision, candidate, { rate = DECLARED.rate } = {}) {
  const V = cells(vision), C = cells(candidate);
  const keys = new Set([...Object.keys(V), ...Object.keys(C)]);
  const next = {};
  const edits = [];
  for (const k of keys) {
    const v = V[k] ?? 0, c = C[k] ?? 0;
    next[k] = c + (v - c) * rate;
    if (Math.abs(v - c) > 1e-9) edits.push({ cell: k, over: c > v, from: +c.toFixed(4), to: +next[k].toFixed(4) });
  }
  const before = cellDistance(V, C), after = cellDistance(V, next);
  return { thought: next, edits, movedToward: after < before, surpriseBefore: +before.toFixed(6), surpriseAfter: +after.toFixed(6) };
}

/** The forward loop: DEF (vision) EVA (surprise) REC (produce next) until the surprise stops
 *  falling (the DMD) or the budget is spent. Returns the trajectory of thoughts and where it
 *  stopped. Pure. */
export function reason(vision, seed, { maxSteps = DECLARED.maxSteps, tolerance = DECLARED.tolerance } = {}) {
  const V = cells(vision);
  let current = { cells: cells(seed) };
  const steps = [];
  let prev = Infinity;
  let why = "maxSteps";
  for (let i = 0; i < maxSteps; i++) {
    const d = cellDistance(V, current.cells);
    steps.push({ n: i, surprise: +d.toFixed(6), thought: current.cells });
    if (d === 0) { why = "exact"; break; }
    const p = produceNext(V, current);
    if (!p.movedToward || Math.abs(prev - d) < tolerance) { why = "dmd"; break; }
    prev = d;
    current = { cells: p.thought };
  }
  return { steps, converged: why !== "maxSteps", why, finalSurprise: steps[steps.length - 1].surprise, thoughts: steps.length };
}

/** Read the vision and the seed through the khora (janus), then reason over their cell
 *  structures. The only place this organ reaches the reader. */
export async function reasonFromText(visionText, seedText, { language = "en", ...opts } = {}) {
  const vision = await cellsOf(visionText, { language });
  if (vision.gap) return { gap: vision.gap };
  const seed = await cellsOf(seedText, { language });
  if (seed.gap) return { gap: seed.gap };
  return { ...reason(vision, seed, opts), vision, seed };
}
