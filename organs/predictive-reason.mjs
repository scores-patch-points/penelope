// predictive-reason.mjs — error-correct toward the SHAPE of an output without having it,
// running DEF EVA REC cycles. The shape is the EOT cell structure (the language-independent
// meaning, GL-CO-10). DEF declares the vision (a target cell structure); EVA reads the
// current candidate and measures its surprise (cell distance) against the vision; REC
// recontextualizes — the candidate is corrected toward the vision. The cycle converges when
// the surprise stops falling; the surprise that remains IS the difference that makes a
// difference (the DMD). No model, no clock: pure.
import { cellsOf, cellDistance } from "./mechanical-reason.mjs";

/** DEF: the vision, as a cell structure. From a source text, or handed in directly. */
export async function defineVision(text, { language = "en" } = {}) {
  const c = await cellsOf(text, { language });
  return c.gap ? { gap: c.gap } : { cells: c.cells, language };
}

/** One EVA: how surprising is the candidate against the vision (the prediction error). */
export async function evaluate(candidate, vision, { language } = {}) {
  const c = await cellsOf(candidate, { language });
  if (c.gap) return { surprise: Infinity, gap: c.gap };
  return { surprise: cellDistance(vision, c), cells: c.cells };
}

/** REC: the correction cycle. Given a vision and a stream of candidate outputs, measure the
 *  surprise of each and report whether each step moved TOWARD the shape (surprise fell).
 *  This is the predictive-processing loop made explicit: the vision predicts, the surprise
 *  errors, the next candidate recontextualizes. */
export async function converge(vision, candidates, { language } = {}) {
  const out = [];
  let prev = Infinity;
  for (const cand of candidates) {
    const e = await evaluate(cand, vision, { language });
    out.push({ surprise: +e.surprise.toFixed(4), movedToward: e.surprise < prev });
    prev = e.surprise;
  }
  const converged = out.some((s) => s.movedToward);
  return { steps: out, converged, finalSurprise: prev };
}

/** The three operators, named, on a candidate: DEF (the vision), EVA (the surprise), REC (the
 *  verdict — closer to the shape, or not). This is the cycle as a single step. */
export async function cycle(vision, candidate, { language, threshold = 0.05 } = {}) {
  const e = await evaluate(candidate, vision, { language });
  return {
    DEF: { cells: Object.keys(vision.cells ?? vision).length },
    EVA: { surprise: +e.surprise.toFixed(4) },
    REC: { toward: e.surprise < threshold ? "shape-reached" : "shape-not-yet", gap: e.gap ?? null },
  };
}
