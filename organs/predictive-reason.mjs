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

/** REC, decomposed: WHERE the surprise lives, cell by cell. The KL term p(k) log(p(k)/q(k))
 *  is the per-cell contribution to the surprise — a large positive term means the candidate
 *  OVER-represents that cell (relative to the vision), a large negative term means it
 *  UNDER-represents it. This is the correction signal: to move toward the shape, bring the
 *  over-represented cells down and the under-represented up. The gradient of the loop. */
export async function errorSignal(vision, candidate, { language } = {}) {
  const c = await cellsOf(candidate, { language });
  if (c.gap) return { gap: c.gap };
  const V = vision.cells ?? vision, C = c.cells;
  let nv = 0, nc = 0; for (const k in V) nv += V[k]; for (const k in C) nc += C[k];
  if (!nv || !nc) return { gap: "empty", cells: [] };
  const terms = [];
  for (const k of new Set([...Object.keys(V), ...Object.keys(C)])) {
    const p = (V[k] ?? 0) / nv, q = (C[k] ?? 0) / nc;
    if (p === 0) continue;
    terms.push({ cell: k, vision: +p.toFixed(4), candidate: +q.toFixed(4), contribution: +(p * Math.log(p / (q || 1e-9))).toFixed(4), over: q > p });
  }
  terms.sort((a, b) => b.contribution - a.contribution);
  return { gap: null, overRepresented: terms.filter(t => t.over && t.contribution > 0.01), underRepresented: terms.filter(t => !t.over && t.contribution > 0.01), terms };
}

/** Search by shape: the question is the vision; the answer is the corpus passage that
 *  minimizes surprise against it. Read the question to its cells, read each passage to its
 *  cells, rank by cell distance (the least surprising first). This is retrieval as the
 *  DEF/EVA/REC loop — the question predicts, each passage is evaluated, the least surprising
 *  one is the answer's shape. Content matching, not keyword matching: two passages with the
 *  same shape are close even with zero shared words. */
export async function search(question, passages, { language = "en" } = {}) {
  const vision = await defineVision(question, { language });
  if (vision.gap) return { gap: vision.gap };
  const ranked = [];
  for (const p of passages) {
    const c = await cellsOf(p, { language });
    if (c.gap) { ranked.push({ text: p, surprise: Infinity, gap: c.gap }); continue; }
    ranked.push({ text: p, surprise: cellDistance(vision, c) });
  }
  ranked.sort((a, b) => a.surprise - b.surprise);
  return { gap: null, ranked };
}
