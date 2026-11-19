import test from "node:test";
import assert from "node:assert/strict";
import { judgeEquivalence, comparable, KNOWN_SAME_RULES, numericLiteral } from "./perspective-eva.mjs";

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

test("referent answers are per document: equal ids are NOT agreement; only a licensed bridge decides, otherwise the probe is silent", () => {
  const pers = { name: "container", terrain: "Lens", frame: "place", probes: [{ name: "under", lands: "Link", power: 0.5 }] };
  const a = { under: { value: "ref_1", referent: true } }, b = { under: { value: "ref_1", referent: true } };
  const none = judgeEquivalence({ perspective: pers, a, b });
  assert.equal(none.verdict, "gap"); assert.match(none.silent[0].why, /per document/);                  // same id string, still no verdict
  assert.equal(judgeEquivalence({ perspective: pers, a, b, bridge: () => true }).verdict, "equivalent");
  assert.equal(judgeEquivalence({ perspective: pers, a: { under: { value: "ref_1", referent: true } }, b: { under: { value: "ref_2", referent: true } }, bridge: () => true }).verdict, "equivalent"); // different ids, licensed bridge
  assert.equal(judgeEquivalence({ perspective: pers, a, b, bridge: () => false }).verdict, "different");
  assert.equal(judgeEquivalence({ perspective: pers, a, b, bridge: () => null }).verdict, "gap");        // a bridge that cannot say is silence
});

// the real pipeline writes literals as STRINGS ("30"); a tolerance rule that cannot read its inputs is silent, never "different" (found by a proof run through a real pharos log, 2026-11-19)
const tolP = (tol = 0.05) => ({ name: "tol", terrain: "Lens", frame: "f", probes: [{ name: "age", lands: "Entity", power: 0.5, same: (x, y) => KNOWN_SAME_RULES["relative difference at most tol"].same(x, y, tol) }] });
const judgeAge = (x, y, tol) => judgeEquivalence({ perspective: tolP(tol), a: { age: { value: x } }, b: { age: { value: y } } });
test("a tolerance rule reads numeric STRINGS as numbers: '30' and '30' agree, '30' and '40' differ, numbers still work", () => {
  assert.equal(judgeAge("30", "30").verdict, "equivalent"); assert.equal(judgeAge("30", "31").verdict, "equivalent", "1/31 is inside 0.05");
  assert.equal(judgeAge("30", "40").verdict, "different"); assert.equal(judgeAge(30, 30).verdict, "equivalent"); assert.equal(judgeAge("30.0", "30").verdict, "equivalent"); assert.equal(judgeAge("-3", "-3").verdict, "equivalent");
});
test("values the rule cannot read are SILENT, never a difference: 'thirty', '30abc', '1e3', '0x10', '', '.5', '5.', two points", () => {
  for (const bad of ["thirty", "30abc", "1e3", "0x10", "", ".5", "5.", "1.2.3", "--3", "3-", " ", "+3"]) {
    const r = judgeAge(bad, "30"); assert.notEqual(r.verdict, "different", `"${bad}" must not make a difference`); assert.equal(r.verdict, "gap", `"${bad}"`); assert.ok(r.silent.some((s) => /cannot read/.test(s.why)));
  }
  assert.equal(judgeAge("30", "30abc").verdict, "gap");
});
test("numericLiteral is exact: only an optional minus, digits and one inner point are numbers", () => {
  assert.equal(numericLiteral("30"), 30); assert.equal(numericLiteral(" 30 "), 30); assert.equal(numericLiteral("-3.25"), -3.25); assert.equal(numericLiteral(7), 7);
  for (const v of ["", "-", ".", "3.", ".3", "3e2", "Infinity", "NaN", "1,000", "٣٠", null, undefined, {}, [], true, NaN, Infinity]) assert.equal(numericLiteral(v), null, String(v));
});
test("strict equality is unchanged, and an undecidable probe next to a decided one does not hide the decision", () => {
  const p = { name: "two", terrain: "Lens", frame: "f", probes: [{ name: "id", lands: "Entity", power: 0.5 }, { name: "age", lands: "Entity", power: 0.5, same: (x, y) => KNOWN_SAME_RULES["relative difference at most tol"].same(x, y, 0.05) }] };
  assert.equal(judgeEquivalence({ perspective: p, a: { id: { value: "7" }, age: { value: "thirty" } }, b: { id: { value: "8" }, age: { value: "30" } } }).verdict, "different", "the id differs; the unreadable age is silent");
  assert.equal(judgeEquivalence({ perspective: p, a: { id: { value: "7" }, age: { value: "thirty" } }, b: { id: { value: "7" }, age: { value: "30" } } }).verdict, "equivalent", "the id agrees with power; the unreadable age is listed as silent");
});
