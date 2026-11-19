import test from "node:test";
import assert from "node:assert/strict";
import { judgeEquivalence, comparable } from "./perspective-eva.mjs";

const near = (x, y) => Math.abs(x - y) / Math.max(x, y) <= 0.1;
const geographer = { name: "geographer", terrain: "Lens", frame: "place", probes: [{ name: "area", lands: "Entity", power: 0.85, same: near }, { name: "region", lands: "Link", power: 0.4 }] };
const demographer = { name: "demographer", terrain: "Lens", frame: "people", probes: [{ name: "population", lands: "Entity", power: 0.3, same: near }] };
const A = { area: { value: 3232, addr: "en#12" }, region: { value: "Q1273" }, population: { value: 340000 } };
const B = { area: { value: 3230, addr: "fr#4" }, region: { value: "Q1273" }, population: { value: 90000 } };

test("same two texts: equivalent for the geographer, different for the demographer (the perspective decides what matters)", () => {
  assert.equal(judgeEquivalence({ perspective: geographer, a: A, b: B }).verdict, "equivalent");
  const d = judgeEquivalence({ perspective: demographer, a: A, b: B });
  assert.equal(d.verdict, "different"); assert.equal(d.differences[0].probe, "population");
});
test("a difference in something the perspective never declared makes no difference", () => {
  const A2 = { ...A, wording: { value: "formal" } }, B2 = { ...B, wording: { value: "plain" } };
  assert.equal(judgeEquivalence({ perspective: geographer, a: A2, b: B2 }).verdict, "equivalent");
});
test("silence is a hole, not agreement; all-silent is a gap", () => {
  const r = judgeEquivalence({ perspective: geographer, a: { area: null }, b: {} });
  assert.equal(r.verdict, "gap"); assert.equal(r.silent.length, 2);
  const partial = judgeEquivalence({ perspective: geographer, a: { area: { value: 5 } }, b: { area: { value: 5 }, region: null } });
  assert.equal(partial.verdict, "equivalent"); assert.deepEqual(partial.silent, [{ probe: "region", side: "both" }]);
});
test("a probe with no measured power cannot support equivalence (absence of a difference it could not find is not evidence)", () => {
  const weak = { name: "weak", terrain: "Lens", frame: "x", probes: [{ name: "colour", power: 0 }] };
  const r = judgeEquivalence({ perspective: weak, a: { colour: { value: "red" } }, b: { colour: { value: "red" } } });
  assert.equal(r.verdict, "gap"); assert.equal(r.powerless.length, 1);
});
test("one differing probe is enough: different, with its addresses; no perspective or probes is a gap", () => {
  const r = judgeEquivalence({ perspective: geographer, a: { area: { value: 100, addr: "x" }, region: { value: "Q1" } }, b: { area: { value: 900, addr: "y" }, region: { value: "Q1" } } });
  assert.equal(r.verdict, "different"); assert.deepEqual(r.differences[0].addr, { a: "x", b: "y" });
  assert.equal(judgeEquivalence({}).verdict, "gap");
});

test("a perspective lives in the Interpretation domain: Lens, Paradigm or Atmosphere, never a terrain of another domain", () => {
  const r = judgeEquivalence({ perspective: { ...geographer, terrain: "Entity" }, a: A, b: B });
  assert.equal(r.verdict, "gap"); assert.match(r.why, /Interpretation terrain/);
  assert.equal(judgeEquivalence({ perspective: { ...geographer, probes: [{ name: "area", lands: "Planet", power: 1 }] }, a: A, b: B }).verdict, "gap");
});
test("perspectives compare only at the same terrain and under the same frame (a Lens vs a Paradigm, or two frames, is a category mix-up)", () => {
  assert.equal(comparable(geographer, { ...geographer, name: "other geographer" }), true);
  assert.equal(comparable(geographer, demographer), false);                       // different frame
  assert.equal(comparable(geographer, { ...geographer, terrain: "Paradigm" }), false); // different terrain
});
