// organs/intent.mjs — foresight is the speaker's intent, read through the relationships.
//
// A pronoun is the speaker WANTING the listener to bind it; the listener's job is to recover
// the weighting the speaker constructed. The speaker weights a referent by making it the AGENT
// (kartṛ) and by recurring it — the agent slot is where the speaker puts who the discourse is
// about. So a candidate's intent weight is its decayed presence plus its agenthood, and the
// pronoun binds to the referent the speaker is weighting the listener toward. No surface hack:
// the weight is read off the kāraka roles the reader already produces.
//
// Pure in its weighting (no model, no clock); it reaches the khora reader only to READ.

import { kernelImportOr } from "./kernel-reach.mjs";

// The agent weight is a DECLARED prior (giver: the author) — how much more the speaker's
// putting a referent in the kartṛ slot signals intent than a bare recurrence does.
const DECLARED = Object.freeze({ decay: 0.8, agentWeight: 2, floor: 0.01 });

/** The intent-weighted binding over a mention stream. `mentions` is { kind: "name" | "pronoun",
 *  surface, karaka } in reading order. Each binding is a line: hindsight (the past weighting),
 *  foresight (the future name), and the width (the margin between the winner and its rival). */
export function intentBindings(mentions, { decay = DECLARED.decay, agentWeight = DECLARED.agentWeight, floor = DECLARED.floor } = {}) {
  const referents = new Map();   // surface -> { surface, agent, activation }
  const bindings = [];
  const nextNameAt = (from) => { for (let j = from + 1; j < mentions.length; j++) if (mentions[j].kind === "name") return mentions[j]; return null; };
  const weight = (r) => r.activation + agentWeight * r.agent;   // intent = presence + agenthood
  for (let i = 0; i < mentions.length; i++) {
    const m = mentions[i];
    if (m.kind === "name") {
      const r = referents.get(m.surface) ?? { surface: m.surface, agent: 0, activation: 0 };
      if (m.karaka === "kartṛ") r.agent += 1;   // the speaker made this referent the agent
      r.activation += 1;
      referents.set(m.surface, r);
      continue;
    }
    for (const r of referents.values()) r.activation *= decay;
    const ranked = [...referents.values()].sort((a, b) => weight(b) - weight(a));
    const predicted = ranked[0] && weight(ranked[0]) >= floor ? ranked[0] : null;
    const runnerUp = ranked[1] ?? null;
    const width = predicted && runnerUp ? weight(predicted) - weight(runnerUp) : predicted ? weight(predicted) - floor : 0;
    const next = nextNameAt(i);
    const verdict = !predicted ? "void" : next === null ? "unconfirmed" : next.surface === predicted.surface ? "confirmed" : "contested";
    bindings.push({ at: i, pronoun: m.surface, karaka: m.karaka, hindsight: predicted?.surface ?? null, hindsightAgent: predicted?.agent ?? 0, foresight: next?.surface ?? null, width: +width.toFixed(4), verdict });
  }
  return { bindings, referents: [...referents.values()].map((r) => ({ surface: r.surface, agent: r.agent })) };
}

/** Read a text and bind its pronouns to the referent the speaker is weighting toward. */
export async function intentFromText(text, { language = "en", ...opts } = {}) {
  const R = await kernelImportOr("khora", "native/reading-one.mjs");
  if (!R) return { gap: "khora-absent" };
  const r = await R.read(String(text), { rows: true, allowDegraded: true, language });
  const mentions = [];
  for (const p of r.parse ?? []) for (const row of p.rows) {
    if (row.upos === "PROPN") mentions.push({ kind: "name", surface: row.form, karaka: row.karaka });
    else if (row.upos === "PRON" && /\b(Person|Case|Gender)=/.test(row.feats ?? "")) mentions.push({ kind: "pronoun", surface: row.form, karaka: row.karaka });
  }
  return intentBindings(mentions, opts);
}
