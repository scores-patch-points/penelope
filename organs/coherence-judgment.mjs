// organs/coherence-judgment.mjs — the judgment: is an identity edge coherent? (penelope writes it; the fold does not judge.)
//
// Reads the pronoun bindings khora wrote (CON·Figure, each carrying its agreement label), computes
// each referent's ATTESTED bundle — the consensus of the labels bound to it — and writes the
// judgment: an edge whose label contradicts that consensus is `contested`. This is the coherence
// check that used to live inside the fold; as its own writer it is a judgment (EVA), not a fold
// step, and it writes its own entries so a surface can project the contested edges off the log.
//
// The EXTERNAL half (an edge contradicting the corpus's attested gender) is the same shape but
// waits on khora writing its gender prior as DEF·Figure entries; this organ reads only the bindings
// and judges internal coherence for now.
import { kernelImportOr } from "./kernel-reach.mjs";

export async function coherenceJudgment({ pharosDir = null, writer = "penelope", name = "khora" } = {}) {
  const P = await kernelImportOr("pharos", "lib/pharos.mjs");
  if (!P) return { gap: "pharos-absent" };
  const h = P.open(name, { dir: pharosDir, writer });
  const bindings = P.entries(h).filter((e) => e.kind === "binding");

  // the consensus: each referent's attested bundle, "contested" where the labels split
  const consensus = new Map();
  for (const b of bindings) {
    const ref = b.body?.ref, ag = b.body?.agreement;
    if (!ref || !ag) continue;
    const cur = consensus.get(ref) ?? {};
    for (const [k, v] of Object.entries(ag)) if (v != null && v !== "unknown") { if (!(k in cur)) cur[k] = v; else if (cur[k] !== v) cur[k] = "contested"; }
    consensus.set(ref, cur);
  }

  for (const [kind, cell] of [["attested", "DEF·Figure"], ["coherence", "EVA·Figure"]]) {
    if (!P.entries(h).some((e) => e.kind === "kind" && e.addr === `kind:${kind}`)) P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: `kind:${kind}`, body: { name: kind, cell } });
  }
  for (const [ref, ag] of consensus) P.weave(h, { cell: "DEF·Figure", kind: "attested", addr: String(ref), body: { agreement: ag } });

  let contestedCount = 0;
  for (const b of bindings) {
    const ref = b.body?.ref, ag = b.body?.agreement;
    if (!ref || !ag) continue;
    const att = consensus.get(ref) ?? {};
    let contested = false;
    for (const k of ["gender", "number", "person"]) if (ag[k] != null && att[k] != null && att[k] !== "contested" && ag[k] !== att[k]) contested = true;
    if (contested) contestedCount++;
    P.weave(h, { cell: "EVA·Figure", kind: "coherence", addr: String(b.addr), body: { ref, contested, agreement: ag } });
  }

  return { gap: null, referents: consensus.size, bindings: bindings.length, contested: contestedCount };
}
