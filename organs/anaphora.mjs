// organs/anaphora.mjs — anaphora as the meeting of two surfaces, forming a LINE.
//
// Hindsight is the past surface: the referents already admitted, with decayed presence.
// Foresight is the future surface: the continuation that will confirm or refute. They meet
// at the pronoun — the line. A line is where two colors meet; its WIDTH is the contested
// band, the margin between the prediction and its rival, and the read reports the width, not
// a bare verdict.
//
//   confirmed    the future names the referent the past predicted — a thin line (wide margin)
//   contested    the future names a different referent — a wide line (the colors bleed)
//   void         no admitted referent cleared the floor — one surface is empty (a gap)
//   unconfirmed  no future name yet — the line is held open, not committed
//
// Pure. No khora, no model, no clock: it folds a mention stream into bindings.

/** resolve(mentions) -> the bindings, each a line where hindsight meets foresight.
 *  `mentions` is a stream of { kind: "name" | "pronoun", surface } in reading order. */
export function resolve(mentions, { decay = 0.8, floor = 0.01 } = {}) {
  const referents = new Map();   // surface -> { surface, activation }
  const bindings = [];
  const nextNameAt = (from) => { for (let j = from + 1; j < mentions.length; j++) if (mentions[j].kind === "name") return mentions[j]; return null; };
  for (let i = 0; i < mentions.length; i++) {
    const m = mentions[i];
    if (m.kind === "name") {
      const r = referents.get(m.surface) ?? { surface: m.surface, activation: 0 };
      r.activation += 1;
      referents.set(m.surface, r);
      continue;
    }
    // hindsight: decay the past, rank what remains
    for (const r of referents.values()) r.activation *= decay;
    const ranked = [...referents.values()].sort((a, b) => b.activation - a.activation);
    const predicted = ranked[0] && ranked[0].activation >= floor ? ranked[0] : null;
    const runnerUp = ranked[1] ?? null;
    // the line's width: the margin between the prediction and its rival (0 = two colors bleeding into one)
    const width = predicted && runnerUp ? predicted.activation - runnerUp.activation : predicted ? predicted.activation - floor : 0;
    // foresight: the next name-mention tests the prediction
    const next = nextNameAt(i);
    const verdict = !predicted ? "void" : next === null ? "unconfirmed" : next.surface === predicted.surface ? "confirmed" : "contested";
    bindings.push({
      at: i, pronoun: m.surface,
      hindsight: predicted?.surface ?? null,
      foresight: next?.surface ?? null,
      width: +width.toFixed(4),
      verdict,
    });
  }
  return { bindings, referents: [...referents.values()].map((r) => r.surface) };
}
