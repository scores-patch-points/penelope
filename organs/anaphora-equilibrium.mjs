// organs/anaphora-equilibrium.mjs — anaphora is an equilibrium, not a pipeline.
//
// The seed is the PRIOR (recency — each pronoun binds to the most recent referent); the standing
// is the SURPRISE (organs/whom-standing.js standingsOf: held-corroborated vs new); and the fixed
// point is where the two settle. Iterate: build referent-keyed claims from the current resolution,
// run the standing matrix, re-anchor each pronoun to the most recent HELD referent, repeat until
// the resolution stops changing. The seed is the only hand-set; the standing refines it to the
// fixed point the way the free-energy loop refines a prediction toward minimum surprise.

import { kernelImportOr } from "./kernel-reach.mjs";

const key = (s) => String(s).toLowerCase();
const PRON = /^(he|she|it|they|him|her|them)$/i;

export async function anaphoraEquilibrium(text, { language = "en", maxIter = 40 } = {}) {
  const R = await kernelImportOr("khora", "native/reading-one.mjs");
  const Whom = await kernelImportOr("khora", "native/organs/whom-standing.js");
  if (!R || !Whom?.standingsOf) return { gap: "khora-absent" };
  const r = await R.read(String(text), { rows: true, allowDegraded: true, language });
  const cast = r.cast ?? [];

  // base anchors: content words anchor to themselves; cast names to their referent
  const base = {};
  for (const p of r.parse ?? []) for (const row of p.rows) if (row.upos === "VERB" || row.upos === "NOUN" || row.upos === "PROPN") base[key(row.lemma ?? row.form)] = "node:" + key(row.lemma ?? row.form);
  for (const c of cast) for (const s of [c.surface, ...(c.allSurfaces ?? [])]) base[key(s)] = c.ref;

  const sents = r.sentences ?? [];
  const sentOf = (a) => { for (let i = 0; i < sents.length; i++) if (sents[i].offset <= a && a < sents[i].offset + (sents[i].text?.length ?? 0)) return i; return -1; };
  const castSents = cast.map((c) => ({ ref: c.ref, sents: (c.mentionSpans ?? []).map(([a]) => sentOf(a)).filter((x) => x >= 0) }));
  const pronTokens = [];
  for (const p of r.parse ?? []) for (const row of p.rows) if (row.upos === "PRON" && PRON.test(row.form)) pronTokens.push({ form: key(row.lemma ?? row.form), sent: p.order });
  const mostRecent = (pt, allowed) => { let best = null, bs = -1; for (const c of castSents) if (!allowed || allowed.has(c.ref)) { const ls = Math.max(-1, ...c.sents.filter((s) => s < pt.sent)); if (ls > bs) { bs = ls; best = c.ref; } } return best; };

  // SEED: the prior (recency)
  let resolution = new Map();
  for (const pt of pronTokens) { const b = mostRecent(pt, null); if (b) resolution.set(pt.form, b); }
  const seeded = resolution.size;

  // FIXED POINT: the standing refines the seed until it settles
  let iter = 0;
  for (; iter < maxIter; iter++) {
    const anchors = { ...base }; for (const [p, ref] of resolution) anchors[p] = ref;
    const U = []; let n = 0;
    for (const p of r.parse ?? []) for (const v of p.rows.filter((x) => x.upos === "VERB")) {
      const subj = p.rows.find((x) => x.head === v.id && x.karaka === "kartṛ"), obj = p.rows.find((x) => x.head === v.id && (x.karaka === "karman" || x.karaka === "adhikaraṇa" || x.karaka === "sampradāna"));
      if (!subj || !obj) continue;
      const sK = key(subj.lemma ?? subj.form), oK = key(obj.lemma ?? obj.form), pK = key(v.lemma ?? v.form);
      U.push({ id: `u${n++}`, address: `sc:${p.order}`, text: p.text, side: "U", claim: { subj: anchors[sK] ?? sK, pred: anchors[pK] ?? pK, obj: anchors[oK] ?? oK, polarity: "+" } });
    }
    const W = [];
    for (const u of U) if (cast.some((c) => c.ref === u.claim.subj)) W.push({ id: `w${W.length}`, address: u.address, text: u.text, side: "W", claim: { ...u.claim }, provenance: { kind: "spoken", ref: u.claim.subj } });
    const st = Whom.standingsOf({ region: U, whom: W });
    const held = new Set();
    for (const it2 of st.items ?? []) if (it2.standing === "held-corroborated") { const [a, o] = String(it2.proposition ?? "").split("|"); held.add(a); if (o) held.add(o); }
    const next = new Map();
    for (const pt of pronTokens) { const b = mostRecent(pt, held); if (b) next.set(pt.form, b); }
    const same = resolution.size === next.size && [...resolution.keys()].every((k) => resolution.get(k) === next.get(k));
    resolution = next;
    if (same) { iter++; break; }
  }

  return { gap: null, pronouns: pronTokens.length, seeded, resolved: resolution.size, convergedAt: iter, referents: new Set(resolution.values()).size, resolution: Object.fromEntries(resolution) };
}
