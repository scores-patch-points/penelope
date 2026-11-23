// organs/referent-graph.mjs — THE FOLD, reading off the pharos. Nothing special.
//
// Khora wrote the beings (INS·Figure), the kāraka edges (SYN·Pattern), and the pronoun bindings
// (CON·Figure) when it read; janus writes the polarity (EVA·Figure). This organ opens the pharos,
// reads those entries, and folds them into nodes and edges — surfaces collapse into referents, the
// kāraka edges are the relations, the pronoun bindings are the identity edges. It knows no kārakas,
// no gender, no polarity, no agreement logic: it reads what was woven and folds by addr. The special
// knowledge lives in the repos that wrote the entries, not in the fold.
//
// A fold over the whole log is the honest simplification for now; scoping a fold to ONE read's
// entries (via their `of` link to the read) is the refinement this note leaves open.
import { kernelImportOr } from "./kernel-reach.mjs";
import { foldRelations } from "./relation-fold.mjs";

const key = (s) => String(s).toLowerCase();

// The raw fold, for the comparison / pattern / holarchy machinery (sameFold, patternOf, holarchy):
// claims (the kāraka edges) + anchors (surfaces -> referent), plus the folded relations. A caller that
// wants the graph STATS uses referentGraph; one that wants to COMPARE or LAYER folds uses this.
export async function foldFromPharos({ pharosDir = null, writer = "khora", name = "khora" } = {}) {
  const P = await kernelImportOr("pharos", "lib/pharos.mjs");
  if (!P) return { gap: "pharos-absent" };
  const h = P.open(name, { dir: pharosDir, writer });
  const all = P.entries(h);
  const beings = all.filter((e) => e.kind === "being");
  const karakas = all.filter((e) => e.kind === "karaka");
  const bindings = all.filter((e) => e.kind === "binding");

  const anchors = {};
  for (const b of beings) for (const s of [b.body?.surface, ...(b.body?.surfaces ?? [])]) if (s) anchors[key(s)] = b.addr;
  for (const b of bindings) if (b.body?.pronoun && b.body?.ref) anchors[key(b.body.pronoun)] = b.body.ref;
  for (const e of karakas) for (const w of [e.body?.head, e.body?.arg]) if (w && !(key(w) in anchors)) anchors[key(w)] = "node:" + key(w);

  const claims = karakas.filter((e) => e.body?.head && e.body?.arg).map((e) => ({ end1: key(e.body.head), label: e.body.role, end2: key(e.body.arg) }));
  return { gap: null, claims, anchors, fold: foldRelations({ claims, anchors }), beings: beings.length, bindings: bindings.length };
}

export async function referentGraph({ pharosDir = null, writer = "khora" } = {}) {
  const f = await foldFromPharos({ pharosDir, writer });
  if (f.gap) return f;
  const { claims, anchors, fold } = f;
  return {
    gap: null,
    nodes: new Set([...Object.values(anchors)]),
    surfaceCount: Object.keys(anchors).length,
    nodeCount: new Set([...Object.values(anchors)]).size,
    edges: fold.relations,
    loose: fold.loose,
    claims: claims.length,
    beings: f.beings,
    bindings: f.bindings,
  };
}
