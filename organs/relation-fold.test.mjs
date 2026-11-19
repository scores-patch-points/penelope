import test from "node:test";
import assert from "node:assert/strict";
import { foldRelations, sameFold, patternOf } from "./relation-fold.mjs";

const roles = { built_around: "root", born: "root", area: "root", population: "leaf", rooted_in: "root" };
const anchors = { Odysseus: "H", "the husband": "H", "the beggar": "S?", "the bed": "BED", "the marriage post": "BED", "the olive": "TREE", "a living tree": "TREE", Antinous: "A" };
const c = (end1, label, end2, addr) => ({ end1, label, end2, addr });

test("two accounts with no words in common fold to the same root relationship: same", () => {
  const A = foldRelations({ claims: [c("Odysseus", "built_around", "the olive", "A#1")], anchors });
  const B = foldRelations({ claims: [c("the husband", "built_around", "a living tree", "B#7")], anchors });
  const v = sameFold(A, B, { roles });
  assert.equal(v.root, "same");
  assert.deepEqual(v.rootTrail[0].addr, { a: ["A#1"], b: ["B#7"] }); // the verdict re-expands to both passages
});
test("an impostor shares the tree but not the maker: nothing to test is a gap, never a yes", () => {
  const A = foldRelations({ claims: [c("Odysseus", "built_around", "the olive", "A#1")], anchors });
  const I = foldRelations({ claims: [c("Antinous", "built_around", "a living tree", "I#2")], anchors });
  assert.equal(sameFold(A, I, { roles }).root, "gap");
});
test("a disputed root relationship decides other", () => {
  const A = foldRelations({ claims: [c("X", "born", 1879, "a")], anchors: { X: "P" } });
  const B = foldRelations({ claims: [c("X", "born", 1920, "b")], anchors: { X: "P" } });
  assert.equal(sameFold(A, B, { roles }).root, "other");
});
test("same root, disputing leaf: the answer is same-root with a counted leaf dispute (root vs leaves)", () => {
  const A = foldRelations({ claims: [c("X", "area", 3232, "a1"), c("X", "population", 400000, "a2")], anchors: { X: "P" } });
  const B = foldRelations({ claims: [c("X", "area", 3230, "b1"), c("X", "population", 90000, "b2")], anchors: { X: "P" } });
  const v = sameFold(A, B, { roles, tol: 0.05 });
  assert.equal(v.root, "same"); assert.equal(v.leaves.dispute, 1); assert.equal(v.leaves.agree, 0);
});
test("unanchored relationships are loose: kept, never compared, never a vote", () => {
  const A = foldRelations({ claims: [c("stranger", "born", 1879, "a")], anchors: {} });
  assert.equal(A.loose.length, 1); assert.equal(A.relations.size, 0);
  const B = foldRelations({ claims: [c("X", "born", 1879, "b")], anchors: { X: "P" } });
  assert.equal(sameFold(A, B, { roles }).root, "gap");
});
test("folds under different grounds (frames) are not comparable", () => {
  const A = foldRelations({ claims: [c("X", "born", 1879, "a")], anchors: { X: "P" }, ground: "g1" });
  const B = foldRelations({ claims: [c("X", "born", 1879, "b")], anchors: { X: "P" }, ground: "g2" });
  assert.equal(sameFold(A, B, { roles }).root, "gap");
});

test("pattern: the same shape with different anchors is the same pattern but not the same thing (analogy)", () => {
  const A = foldRelations({ claims: [c("Odysseus", "built_around", "the olive", "A1"), c("the bed", "rooted_in", "the olive", "A2")], anchors });
  const B = foldRelations({ claims: [c("Antinous", "built_around", "a living tree", "B1"), c("the marriage post", "rooted_in", "a living tree", "B2")], anchors });
  const v = sameFold(A, B, { roles, inverse: ["built_around"] });
  assert.equal(v.pattern.verdict, "same");   // same kind of story
  assert.equal(v.root, "other");             // but a different maker of the same bed: not the same thing
});
test("pattern: a different shape is a different pattern even on the same ground", () => {
  const A = foldRelations({ claims: [c("X", "born", 1879, "a"), c("X", "area", 5, "a")], anchors: { X: "P" } });
  const B = foldRelations({ claims: [c("X", "born", 1879, "b")], anchors: { X: "P" } });
  const v = sameFold(A, B, { roles });
  assert.equal(v.root, "same"); assert.equal(v.pattern.verdict, "other");
});
test("pattern: canonical form is independent of node naming and edge order", () => {
  const A = foldRelations({ claims: [c("p", "knows", "q", 1), c("q", "knows", "r", 2)], anchors: { p: "1", q: "2", r: "3" } });
  const B = foldRelations({ claims: [c("y", "knows", "z", 1), c("x", "knows", "y", 2)], anchors: { x: "A", y: "B", z: "C" } });
  assert.equal(patternOf(A), patternOf(B));
});

import { holarchy, levelOf, destroy, profile, fingerprint, sameHolarchy } from "./relation-fold.mjs";
const hAnchors = { marriage: "M", "the union": "M", bed: "B", "the chamber": "B", olive: "T", "the living tree": "T", feast: "F", wine: "W" };
const chain = (names, label = "rooted_in") => foldRelations({ claims: [c(names[0], label, names[1], "x"), c(names[1], label, names[2], "y")], anchors: hAnchors });

test("holarchy: levels, destroy (all wholes above, none below), extrinsic value", () => {
  const h = holarchy(chain(["marriage", "bed", "olive"]));
  const lv = levelOf(h);
  assert.equal(lv.get("T"), 0); assert.equal(lv.get("B"), 1); assert.equal(lv.get("M"), 2);
  assert.deepEqual([...destroy(h, "B")].sort(), ["B", "M"]);          // destroy the bed: the marriage falls, the tree stays
  assert.deepEqual([...destroy(h, "T")].sort(), ["B", "M", "T"]);     // destroy the tree: everything above falls
  assert.deepEqual([...destroy(h, "M")], ["M"]);                       // destroy the top: nothing else falls
});
test("holarchy: depth and span; a record that breaks 'greater depth, less span' is flagged as maybe heaps", () => {
  const ok = profile(holarchy(chain(["marriage", "bed", "olive"])));
  assert.equal(ok.depth, 3); assert.deepEqual(ok.span, [1, 1, 1]); assert.equal(ok.violations.length, 0);
  const heap = foldRelations({ claims: [c("marriage", "rooted_in", "bed", 1), c("feast", "rooted_in", "bed", 2), c("wine", "rooted_in", "bed", 3)], anchors: hAnchors });
  const p = profile(holarchy(heap)); // one part, three wholes above it: span grows with level
  assert.equal(p.violations.length, 1);
});
test("holarchy: the same dependency order in different words is the same pattern and the same ground", () => {
  const A = holarchy(chain(["marriage", "bed", "olive"])), B = holarchy(chain(["the union", "the chamber", "the living tree"]));
  assert.equal(fingerprint(A), fingerprint(B));
  const v = sameHolarchy(A, B);
  assert.equal(v.pattern, "same"); assert.equal(v.verdict, "same");
});
test("holarchy: same shape over different holons is the same pattern but not the same thing; a different order is a different pattern", () => {
  const A = holarchy(chain(["marriage", "bed", "olive"])), I = holarchy(chain(["feast", "wine", "olive"]));
  const v = sameHolarchy(A, I);
  assert.equal(v.pattern, "same");      // the same kind of dependency
  assert.equal(v.verdict, "other");     // destroying the shared tree takes different wholes with it
  const flat = holarchy(foldRelations({ claims: [c("marriage", "rooted_in", "olive", 1), c("bed", "rooted_in", "olive", 2)], anchors: hAnchors }));
  assert.equal(sameHolarchy(A, flat).pattern, "other");
});
