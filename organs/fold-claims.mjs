// organs/fold-claims.mjs — penelope's fold-at-a-point, as claims in the FoldRecord@1 store (the shared contract in khora).
//
// foldAtPoint (FoldAtPoint@1) selects, from the clean sources, the sentences whose differences make a difference to a for-whom, each with its
// byte address (`abs`, `len`, `src`). That is already provenance; what it lacked is a place in the ONE store every Fold repo reads. This adapter
// turns the selection into claims at holon addresses — `/t<unit>/c<i>` (the unit is the build / weave / essay number) — each carrying
// `basis.support` (`<src>#<from>-<to>`, the byte range) and `basis.cited` (the sentence, verbatim: it IS the source's bytes), plus the pointer
// the artifact keeps: { address, claimIds, forWhom }. A woven or written piece can then say "this sentence stands at /t3/c2, which is
// bytes 120-188 of this source" and a later read dereferences it, in any repo, with no copy.
//
// foldAtPoint itself is NOT changed (its shape is FoldAtPoint@1 for every existing caller); this is a pure projection of its result.
import { claimAt, pointerOf, holonOfSource } from "../../khora/native/the-fold/fold-record.js";

export { appendClaims, claimsAt, projectRecord, spokenFrom } from "../../khora/native/the-fold/fold-record.js";

/** `fold` = a foldAtPoint(...) result. `unit` = the number this artifact's fold is filed under. Returns { claims, pointer }; an `ok:false` fold has no claims. */
export function foldClaims(fold, unit) {
  const claims = [];
  if (!fold || fold.ok === false) return { claims, pointer: pointerOf({ turn: unit, claims, forWhom: fold?.forWhom ?? null }) };
  for (const sec of fold.folds || []) {
    for (const c of sec.claims || []) {
      const support = `${c.src}#${c.abs}-${c.abs + c.len}`;
      const claim = claimAt(unit, claims.length + 1, "showed", c.text, {
        unit, section: sec.section ?? null, aspect: sec.aspect ?? null, support, source: holonOfSource(support), cited: c.text, overlap: c.overlap ?? null,
        ...(c.stance ? { stance: c.stance } : {}),
      });
      if (claim) claims.push(claim);
    }
  }
  return { claims, pointer: pointerOf({ turn: unit, claims, forWhom: fold.forWhom }) };
}
