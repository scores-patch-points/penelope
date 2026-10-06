import test from "node:test";
import assert from "node:assert/strict";
import { foldClaims, appendClaims, spokenFrom } from "./fold-claims.mjs";

const fold = { schema: "FoldAtPoint@1", ok: true, forWhom: "what is justice", stake: ["justice"], folds: [
  { section: "I", aspect: "definition", claims: [{ text: "Justice is the interest of the stronger.", abs: 120, len: 40, src: "republic", overlap: 3 }] },
  { section: "II", aspect: "critique", claims: [{ text: "Injustice is never profitable.", abs: 900, len: 30, src: "republic", overlap: 2, stance: { reading: "in_terms" } }] },
] };

test("a fold becomes claims at /t<unit>/c<i>, each with its byte range, cited bytes and (when injected) stance", () => {
  const { claims, pointer } = foldClaims(fold, 3);
  assert.deepEqual(claims.map((c) => c.ground), ["/t3/c1", "/t3/c2"]);
  assert.equal(claims[0].basis.support, "republic#120-160");
  assert.equal(claims[0].basis.cited, "Justice is the interest of the stronger.");
  assert.equal(claims[0].basis.source, "/s/republic/120-160");
  assert.equal(claims[1].basis.stance.reading, "in_terms");
  assert.deepEqual(pointer.claimIds, ["t3c1", "t3c2"]);
  assert.equal(pointer.forWhom, "what is justice");
});

test("the store alone rebuilds the fold's sentences, verbatim, in order (no copy lives anywhere else)", () => {
  const { claims, pointer } = foldClaims(fold, 3);
  assert.equal(spokenFrom(pointer, appendClaims([], claims)), "Justice is the interest of the stronger. Injustice is never profitable.");
});

test("a failed or empty fold has no claims and never throws", () => {
  assert.equal(foldClaims({ ok: false }, 1).claims.length, 0);
  assert.equal(foldClaims(null, 1).claims.length, 0);
  assert.equal(foldClaims({ ok: true, folds: [] }, 1).claims.length, 0);
});
