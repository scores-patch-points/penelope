// organs/referent-graph.mjs — everything is a referent; coreference is an edge.
//
// The semantic level is a flat referent graph: beings, events, and PRONOUNS are all nodes, and
// the relations are the edges — the kārakas (kartṛ, karman, …) and the IDENTITY edges that say
// "he" IS "Jonathan". The surface tokens fold into the nodes through the anchors: a name anchors
// to its referent, and a pronoun anchors to the SAME referent, so the fold collapses them into one
// node. Anaphora is edge completion — a pronoun node joined to its antecedent by an identity edge.
//
// Pure in its folding (organs/relation-fold.mjs foldRelations); reaches the khora reader only to read.

import { kernelImportOr } from "./kernel-reach.mjs";
import { foldRelations } from "./relation-fold.mjs";

const key = (s) => String(s).toLowerCase();

export async function referentGraph(text, { language = "en" } = {}) {
  const R = await kernelImportOr("khora", "native/reading-one.mjs");
  if (!R) return { gap: "khora-absent" };
  const r = await R.read(String(text), { rows: true, allowDegraded: true, language, admitNominals: true, speakers: true });

  // claims: the kāraka relations — end1 = the head (the event), label = the role, end2 = the argument
  const claims = [];
  for (const p of r.parse ?? []) for (const row of p.rows) {
    if (!row.karaka || !row.head) continue;
    const head = p.rows.find((x) => x.id === row.head);
    if (!head) continue;
    claims.push({ end1: key(head.lemma ?? head.form), label: row.karaka, end2: key(row.lemma ?? row.form) });
  }

  // anchors: EVERY surface → its referent. Beings and events anchor to themselves (every content
  // word is a referent); pronouns anchor to the referent they resolve to — the identity edge.
  const anchors = {};
  for (const p of r.parse ?? []) for (const row of p.rows) {
    if (!row.lemma && !row.form) continue;
    if (row.upos === "VERB" || row.upos === "NOUN" || row.upos === "PROPN") anchors[key(row.lemma ?? row.form)] = "node:" + key(row.lemma ?? row.form);
  }
  for (const c of r.cast ?? []) for (const s of [c.surface, ...(c.allSurfaces ?? [])]) anchors[key(s)] = c.ref;
  // the speaker and addressee referents (round-30 kind admission): I/you/me fold onto them
  for (const sb of r.speakerBindings ?? []) if (sb && typeof sb === "object" && "a" in sb && "cl" in sb) anchors[key(String(sb.surface ?? ""))] = sb.cl;

  // THE IDENTITY EDGES, DRAWN BY THE INDUCED RULE, not a hand-set standing. The rule that earned
  // 12.4% on the golden giver (vs 1.3% for the hand-set turn/spoken/memory/seen) is recency +
  // gender + number agreement. A referent's gender/number is read off the pronouns the read
  // already bound to it (the identity edge is drawn by the earned weighting, then folded).
  const sentBounds = [];
  { let o = 0; for (const s of r.sentences ?? []) { sentBounds.push([o, o + (s.text?.length ?? 0)]); o += (s.text?.length ?? 0) + 1; } }
  const sentOf = (off) => { let si = -1; for (let i = 0; i < sentBounds.length; i++) if (sentBounds[i][0] <= off && off <= sentBounds[i][1]) { si = i; break; } return si; };
  const castRefs = (r.cast ?? []).map((c) => ({ ref: c.ref, surfaces: [c.surface, ...(c.allSurfaces ?? [])].map(key), sents: (c.mentionSpans ?? []).map(([a]) => sentOf(a)).filter((x) => x >= 0) }));
  // referent gender/number: from the pronouns the read bound to it (the earned weighting's signals)
  const pronFeats = [];
  for (const p of r.parse ?? []) for (const row of p.rows) if (row.upos === "PRON" && /\b(Gender|Number)=/.test(row.feats ?? "")) pronFeats.push({ form: key(row.form), gender: /\bGender=(\w+)/.exec(row.feats)?.[1] ?? null, number: /\bNumber=(\w+)/.exec(row.feats)?.[1] ?? null });
  const refGender = new Map(), refNumber = new Map();
  for (const b of [...(r.pronounsGuess ?? []), ...(r.pronounsPresence ?? [])]) if (b.ref && b.pronoun) {
    const f = pronFeats.find((x) => x.form === key(b.pronoun));
    if (f?.gender) refGender.set(b.ref, f.gender);
    if (f?.number) refNumber.set(b.ref, f.number);
  }
  for (const p of r.parse ?? []) for (const row of p.rows) {
    if (row.upos !== "PRON" || !/^(he|she|it|they|him|her|them)$/i.test(row.form)) continue;
    const pg = /\bGender=(\w+)/.exec(row.feats ?? "")?.[1] ?? null, pn = /\bNumber=(\w+)/.exec(row.feats ?? "")?.[1] ?? null;
    let best = null, bv = -Infinity;
    for (const c of castRefs) {
      const recency = c.sents.some((s) => s < p.order) ? 0.5 : 0;
      const genderMatch = pg && refGender.get(c.ref) === pg ? 0.5 : 0;
      const numberMatch = pn && refNumber.get(c.ref) === pn ? 0.5 : 0;
      const st = recency + genderMatch + numberMatch;
      if (st > bv) { bv = st; best = c.ref; }
    }
    if (best) anchors[key(row.lemma ?? row.form)] = best;
  }

  const fold = foldRelations({ claims, anchors });
  return {
    gap: null,
    nodes: new Set([...Object.values(anchors)]),
    surfaceCount: Object.keys(anchors).length,
    nodeCount: new Set([...Object.values(anchors)]).size,
    edges: fold.relations,
    loose: fold.loose,
    claims: claims.length,
  };
}
