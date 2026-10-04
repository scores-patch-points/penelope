// organs/void-refine.mjs — THE UNIVERSAL REFINEMENT: define the void, refine it
// under the real judge, in the cube's dependency order. Domain-agnostic.
//
// Falsified general (native/eval/the-fold/falsify-void-refine.mjs: 4/4 tasks,
// same engine, none tuned). This is the domain-agnostic organ the pipeline
// calls: give it a start state, a repertoire of TRANSFORMS (each serving a void
// OPERATOR, with the operators it depends on), and a JUDGE (the real test — a
// testCommand for code, the essay bars for text). It iterates:
//
//   · judge the state; if it passes, the void has arrived.
//   · else the judge NAMES the failure; the transform whose `answers(failure)`
//     matches is selected;
//   · a transform may only be declared when the operators it depends on are
//     already declared (the cube's order: NUL SIG INS SEG CON SYN DEF EVA REC);
//     a move that skips ahead is an ILLEGAL MOVE, refused and named;
//   · apply, repeat. No legal transform answering the failure = the irreducible
//     leaf, which is the mouth's.
//
// Pure: no model, no I/O. The transforms and the judge are injected.
export const OP_ORDER = Object.freeze(["NUL", "SIG", "INS", "SEG", "CON", "SYN", "DEF", "EVA", "REC"]);
export const DOMAIN = Object.freeze({ NUL: "Existence", SIG: "Existence", INS: "Existence", SEG: "Structure", CON: "Structure", SYN: "Structure", DEF: "Interpretation", EVA: "Interpretation", REC: "Interpretation" });
const rank = (op) => OP_ORDER.indexOf(op);

/** legal(t, declared) -> { ok, missing, behind } — the operators t depends on
 *  that are not yet declared (an illegal move when non-empty), AND whether t
 *  goes BEHIND the cube's order (its operator is earlier than one already
 *  declared — the progression is not skippable, in either direction). */
export function legal(t, declared) {
  const missing = (t.deps ?? []).filter((op) => !declared.has(op));
  const maxRank = declared.size ? Math.max(...[...declared].map(rank)) : -1;
  const behind = rank(t.op) < maxRank;
  return { ok: missing.length === 0 && !behind, missing, behind };
}

/**
 * refine({ start, transforms, judge, maxSteps }) -> the refinement trace.
 *   start      — the initial state (a string, an object, anything)
 *   transforms — [{ name, op, deps, apply(state) }]
 *   judge      — (state) -> { ok, failure }  (the REAL test; failure is what it names)
 *
 * The transform is chosen MONOTONICALLY: the earliest-operator legal transform
 * whose application changes the state. That keeps declaration in the cube's
 * order (never going behind) and is domain-agnostic — it needs no numeric diff,
 * only that a transform MOVES the state and the judge decides.
 */
export function refine({ start, transforms = [], judge, maxSteps = 16 } = {}) {
  if (typeof judge !== "function") throw new TypeError("refine: judge (the real test) is required");
  let state = start;
  const declared = new Set();
  const seq = [];
  const refused = [];
  for (let step = 0; step < maxSteps; step += 1) {
    const j = judge(state);
    if (j?.ok) return { ok: true, state, declared: [...declared], seq, refused, steps: step };
    const legalT = transforms
      .filter((t) => !declared.has(t.op) && legal(t, declared).ok)
      .sort((a, b) => rank(a.op) - rank(b.op));
    const chosen = legalT.find((t) => { try { return t.apply(state) !== state; } catch { return false; } });
    if (!chosen) {
      const tempting = transforms.find((t) => !declared.has(t.op) && !legal(t, declared).ok);
      if (tempting) { const L = legal(tempting, declared); refused.push({ name: tempting.name, op: tempting.op, missing: L.missing, behind: L.behind }); }
      return { ok: false, state, declared: [...declared], seq, refused, steps: step, reason: "no legal transform changes the state — the irreducible leaf is the mouth's" };
    }
    declared.add(chosen.op);
    state = chosen.apply(state);
    seq.push(`${chosen.name}(${chosen.op}·${DOMAIN[chosen.op]})`);
  }
  return { ok: false, state, declared: [...declared], seq, refused, steps: maxSteps, reason: "max steps reached" };
}
