// organs/mind-anaphora.mjs — anaphora wired to the theory of mind, not a presence proxy.
//
// A pronoun binds to the referent whose STANDING in the speaker's mental model is highest.
// The standing is the whom-standing vocabulary (organs/whom-standing.js): turn (in the current
// clause), spoken (the speaker made it the agent — kartṛ), memory (earlier, decayed by distance),
// seen (the reader has met it). The roles are read off the kārakas; the standing replaces a
// hand-set decayed activation. Pure in its reasoning; reaches the khora reader only to read.

import { kernelImportOr } from "./kernel-reach.mjs";

const STANDING = Object.freeze({ turn: 4, spoken: 3, memory: 2, seen: 1 });  // declared, giver: the author

const surfOf = (c) => [c.surface, ...(c.allSurfaces ?? [])].map((s) => String(s).toLowerCase());

export async function mindAnaphora(text, { language = "en", floor = 1 } = {}) {
  const R = await kernelImportOr("khora", "native/reading-one.mjs");
  if (!R) return { gap: "khora-absent" };
  const r = await R.read(String(text), { rows: true, allowDegraded: true, language });
  const cast = r.cast ?? [];
  const pronouns = (r.pronounsGuess ?? []).filter((p) => p.ref !== undefined);
  // sentence boundaries: each sentence's start/end character offsets into the joined text
  const sentBounds = [];
  let o = 0;
  for (const s of r.sentences ?? []) { sentBounds.push([o, o + (s.text?.length ?? 0)]); o += (s.text?.length ?? 0) + 1; }
  const sentOf = (offset) => { let si = -1; for (let i = 0; i < sentBounds.length; i++) if (sentBounds[i][0] <= offset && offset <= sentBounds[i][1]) { si = i; break; } return si; };
  // the kartṛ (agent) rows' surface forms, for the spoken standing
  const agentForms = new Set();
  for (const p of r.parse ?? []) for (const row of p.rows) if (row.karaka === "kartṛ" && (row.lemma || row.form)) agentForms.add(String(row.lemma ?? row.form).toLowerCase());

  const bindings = [];
  for (const p of pronouns) {
    const cur = p.sentence ?? sentOf(p.at[0]);
    let best = null, bv = floor - 1;
    for (const c of cast) {
      // the sentences this referent is mentioned in
      const sents = (c.mentionSpans ?? []).map(([a]) => sentOf(a)).filter((x) => x >= 0);
      const inTurn = sents.includes(cur);
      const inMemory = sents.some((s) => s < cur);
      const spoken = surfOf(c).some((s) => agentForms.has(s));
      let standing = 0;
      if (inTurn) standing = STANDING.turn;
      else if (inMemory) standing = STANDING.memory;
      if (spoken) standing = Math.max(standing, STANDING.spoken);
      if (sents.length) standing = Math.max(standing, STANDING.seen);
      if (standing > bv) { bv = standing; best = c.ref; }
    }
    bindings.push({ pronoun: p.pronoun, at: p.at, sentence: cur, bound: best, standing: bv });
  }
  return { bindings, referents: cast.length, pronouns: pronouns.length };
}
