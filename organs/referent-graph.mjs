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

  // THE IDENTITY EDGES, DRAWN BY THE READ'S OWN BINDINGS and labelled with the pro-form's
  // agreement bundle (person · number · gender) — the label that makes an edge explicit. The read
  // resolved each pronoun to a referent; the graph stamps the edge with that label and checks
  // COHERENCE twice:
  //   internal — a referent's attested bundle is the consensus of the labels bound to it, and an
  //     edge whose label contradicts that consensus is marked contested (a within-read contradiction).
  //   external — the same label is checked against the INGESTED-MATERIAL prior (khora's gender
  //     chain: corpus > Wikidata > name table, built from War and Peace among others), so an edge
  //     that contradicts what the world attests is marked externalContested — coherence against
  //     the attested bundle, not just internal consistency.
  // No regex, no re-derivation — the label comes from the reader's rows (pronounsGuess/presence
  // .agreement) and the external bundle from the giver's own chain.
  const GC = await kernelImportOr("khora", "native/adapters/text/gender-chain.js");
  const externalGender = new Map();   // ref -> class (m/f/n/x), from the ingested-material chain
  if (GC?.genderPriorChainFor) { try { const giver = GC.genderPriorChainFor(language); if (giver) { const prior = giver({ text: String(text), cast: r.cast ?? [] }); for (const [ref, cls] of prior ?? []) externalGender.set(ref, cls); } } catch { /* a giver that throws on this cast is a gap, never a crash */ } }

  const identityEdges = [];        // { pronoun, ref, agreement, contested, externalContested, external }
  const refAgreement = new Map();  // ref -> attested { person, number, gender } (consensus; "contested" where the labels split)
  const bindings = [...(r.pronounsGuess ?? []), ...(r.pronounsPresence ?? [])];
  for (const b of bindings) if (b.ref && b.agreement) {
    const cur = refAgreement.get(b.ref) ?? {};
    for (const [k, v] of Object.entries(b.agreement)) if (v != null && v !== "unknown") { if (!(k in cur)) cur[k] = v; else if (cur[k] !== v) cur[k] = "contested"; }
    refAgreement.set(b.ref, cur);
  }
  for (const b of bindings) {
    if (!b.ref || !b.pronoun) continue;
    const label = b.agreement ?? {};
    const att = refAgreement.get(b.ref) ?? {};
    let contested = false;
    for (const k of ["gender", "number", "person"]) if (label[k] != null && att[k] != null && att[k] !== "contested" && label[k] !== att[k]) contested = true;
    const ext = externalGender.get(b.ref) ?? null;
    const externalContested = !!(ext && label.gender != null && label.gender !== "unknown" && ext !== label.gender);
    identityEdges.push({ pronoun: key(b.pronoun), ref: b.ref, agreement: label, contested, externalContested, external: ext });
    anchors[key(b.pronoun)] = b.ref;   // a contested edge still anchors (the read resolved it); the fold reports it contested
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
    identityEdges,
    refAgreement: Object.fromEntries([...refAgreement].map(([k, v]) => [k, v])),
    externalGender: Object.fromEntries([...externalGender].map(([k, v]) => [k, v])),
  };
}
