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
  const r = await R.read(String(text), { rows: true, allowDegraded: true, language });

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
  for (const p of [...(r.pronounsGuess ?? []), ...(r.pronounsPresence ?? [])]) if (p.ref && p.surface) anchors[key(p.surface)] = p.ref;

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
