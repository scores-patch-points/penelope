import test from "node:test";
import assert from "node:assert/strict";
import { foldRelations, sameFold, patternOf, dmdFold, sameOrOther } from "./relation-fold.mjs";

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

test("dmdFold + sameOrOther: paraphrase is same-structure below the null AND same-sign (the falsification fixed)", () => {
  const foldOf = (edges) => { const R = new Map(); for (const [a, l, b] of edges) { const k = `${a}|${l}`; if (!R.has(k)) R.set(k, { end1: a, label: l, ends: new Map() }); R.get(k).ends.set(b, []); } return { relations: R }; };
  const A = foldOf([["jonathan","kartṛ","give"],["book","karman","give"],["mina","sampradāna","give"]]);
  const B = foldOf([["jonathan","kartṛ","give"],["book","karman","give"],["mina","adhikaraṇa","give"]]);   // dative alternation: leaf role differs
  const E = foldOf([["dog","kartṛ","chase"],["cat","karman","chase"]]);
  const F = foldOf([["cat","kartṛ","chase"],["dog","karman","chase"]]);                                     // role reversal: root differs

  // structure: B's leaf (mina role) differs from A, but the roots agree -> below null (same)
  const ab = sameOrOther({ fold: A, polarity: {} }, { fold: B, polarity: {} });
  assert.equal(ab.structure, "same", "dative alternation keeps the roots");
  // role reversal: the kartṛ disputes -> makes a difference
  const ef = sameOrOther({ fold: E, polarity: {} }, { fold: F, polarity: {} });
  assert.equal(ef.structure, "other", "role reversal disputes the roots");

  // the falsification: identical structure, flipped sign -> OTHER (negation is a difference that makes a difference)
  const neg = sameOrOther({ fold: A, polarity: { neg: false } }, { fold: A, polarity: { neg: true } });
  assert.equal(neg.polarity, "other", "negation flips the sign");
  assert.equal(neg.verdict, "other", "so a negated sentence is NOT a paraphrase of the asserted one");
  const modal = sameOrOther({ fold: A, polarity: { modal: null } }, { fold: A, polarity: { modal: "might" } });
  assert.equal(modal.verdict, "other", "modality is a difference that makes a difference too");
});

// ---------------------------------------------------------------------------------------------------------------------------------------
// GL-DF-01: dmdFoldExact / sameOrOtherExact. No percentile, no trials, no seed: a slot disputed is other; agreement counts only if it pins.
// ---------------------------------------------------------------------------------------------------------------------------------------
import { dmdFoldExact, sameOrOtherExact, KARAKA_ROOTS, NULL_BUDGET } from "./relation-fold.mjs";
const foldOf = (edges) => { const R = new Map(); for (const [a, l, b] of edges) { const k = `${a}|${l}`; if (!R.has(k)) R.set(k, { end1: a, label: l, ends: new Map() }); R.get(k).ends.set(b, [`${a}.${l}.${b}`]); } return { relations: R }; };
const give = [["jonathan", "kartṛ", "give"], ["book", "karman", "give"], ["mina", "sampradāna", "give"]];
const struct = (A, B, o) => dmdFoldExact(foldOf(A), foldOf(B), o);

test("PINNED DEFECT of the old rule (GL-DF-01): the p95 cut calls these same/other the wrong way; if this fails the old measure changed: supersede, do not edit", () => {
  const old = (A, B) => sameOrOther({ fold: foldOf(A), polarity: {} }, { fold: foldOf(B), polarity: {} }).structure;
  assert.equal(old(give, [["book", "kartṛ", "give"], ["jonathan", "karman", "give"], ["mina", "sampradāna", "give"]]), "same", "old: agent/patient reversed, recipient kept -> same (wrong)");
  assert.equal(old([], []), "other", "old: two folds with no root edge -> other (0 >= 0 on a null with no spread)");
  assert.equal(old([["x", "kartṛ", "x"]], [["x", "kartṛ", "x"]]), "other", "old: one identical entity -> other");
});

test("exact: a slot filled with a different filler is other, with no null and no threshold", () => {
  const rev = struct(give, [["book", "kartṛ", "give"], ["jonathan", "karman", "give"], ["mina", "sampradāna", "give"]]);
  assert.equal(rev.structure, "other"); assert.equal(rev.slots.dispute, 2); assert.equal(rev.evidence, null);
  assert.deepEqual(rev.trail.find((r) => r.label === "kartṛ" && r.verdict === "dispute").addr, { a: ["jonathan.kartṛ.give"], b: ["book.kartṛ.give"] }); // re-expands to both passages
  const five = [["a", "kartṛ", "e1"], ["b", "karman", "e1"], ["c", "sampradāna", "e1"], ["d", "apādāna", "e1"], ["f", "kartṛ", "e2"]];
  assert.equal(struct(five, [...five.slice(0, 4), ["z", "kartṛ", "e2"]]).structure, "other", "one changed agent of five");
  assert.equal(struct(five, [["a", "kartṛ", "e1"], ["q", "karman", "e1"], ["r", "sampradāna", "e1"], ["s", "apādāna", "e1"], ["t", "kartṛ", "e2"]]).structure, "other", "four of five changed");
});

test("exact: identical and paraphrased folds are same, and say how far the null had to be searched", () => {
  const id = struct(give, give);
  assert.equal(id.structure, "same"); assert.equal(id.evidence.nullSize, 6); assert.equal(id.evidence.atLeastAsGood, 1); assert.equal(id.evidence.movers, 0);
  // dative alternation: the recipient is a leaf on one side. A hole is a silence, not a vote.
  const dat = struct(give, [["jonathan", "kartṛ", "give"], ["book", "karman", "give"], ["mina", "adhikaraṇa", "give"]]);
  assert.equal(dat.structure, "same"); assert.equal(dat.slots.hole, 1); assert.equal(dat.slots.dispute, 0);
  // a partial description that contradicts nothing
  assert.equal(struct(give, [["jonathan", "kartṛ", "give"], ["book", "karman", "give"]]).structure, "same");
});

test("exact: nothing shared is a gap, never a verdict; a degenerate null no longer calls identical folds other", () => {
  assert.equal(struct([], []).structure, "gap");
  assert.equal(struct(give, [["sam", "kartṛ", "buy"], ["car", "karman", "buy"]]).structure, "gap", "a different event shares no slot");
  const one = struct([["x", "kartṛ", "x"]], [["x", "kartṛ", "x"]]);
  assert.equal(one.structure, "same"); assert.equal(one.evidence.nullSize, 1, "the null had no spread, and the verdict says so");
});

test("exact: ONE shared edge among three is a coincidence the vocabulary can produce: gap with the witness relabeling, not same", () => {
  const A = [["a", "kartṛ", "e1"], ["b", "karman", "e1"], ["c", "sampradāna", "e1"]], B = [["a", "kartṛ", "e1"], ["q", "karman", "e2"], ["r", "sampradāna", "e2"]];
  const r = struct(A, B);
  assert.equal(r.structure, "gap"); assert.ok(r.evidence.movers > 0); assert.ok(r.evidence.witness.length > 0);
  assert.equal(struct(A, [["a", "kartṛ", "e1"], ["b", "karman", "e1"]]).structure, "same", "two shared edges pin it");
});

test("exact: a symmetry of the fold is not an identity: two agents x,y against one agent x cannot say which is which", () => {
  const xy = [["x", "kartṛ", "e"], ["y", "kartṛ", "e"]];
  assert.equal(struct(xy, xy).structure, "same", "the swap maps the agreement onto itself");
  assert.equal(struct(xy, [["x", "kartṛ", "e"]]).structure, "gap", "the swap moves the agreeing edge and agrees as much");
});

test("exact: functional roots with values: a different value for the same end1 and label is a dispute; equal values agree; no tolerance is offered", () => {
  const o = { roots: ["born"], inverse: [] };
  assert.equal(struct([["P", "born", 1879]], [["P", "born", 1920]], o).structure, "other");
  assert.equal(struct([["P", "born", 1879]], [["P", "born", 1879]], o).structure, "same");
  assert.equal(struct([["P", "born", 1879]], [["P", "born", 1880]], o).structure, "other", "1879 vs 1880 is still a dispute: a tolerance would be a hand-set threshold");
  // values are fixed, entities move: the year 1879 pins P (a relabeling that swapped the two years as well as P and Q would reproduce it)
  const pinned = struct([["P", "born", 1879], ["Q", "born", 1920]], [["P", "born", 1879]], o);
  assert.equal(pinned.structure, "same"); assert.equal(pinned.evidence.nullSize, 2, "only P and Q can move");
});

test("exact: an over-budget null refuses (typed gap), it never samples", () => {
  const r = struct(give, give, { budget: 2 });
  assert.equal(r.structure, "gap"); assert.match(r.why, /null_too_large/); assert.equal(r.evidence.nullSize, 6); assert.equal(NULL_BUDGET, 362880);
});

test("exact: invariances: swapping the pair, renaming every entity, and edge order change nothing", () => {
  let s = 7; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pool = ["p1", "p2", "p3", "p4", "p5", "p6"], evs = ["e1", "e2"], draw = () => foldOf(KARAKA_ROOTS.slice(0, 3).map((r) => [pool[Math.floor(rnd() * pool.length)], r, evs[Math.floor(rnd() * evs.length)]]));
  const rename = (f, m) => { const R = new Map(); for (const r of f.relations.values()) { const e1 = m[r.end1] ?? r.end1, k = `${e1}|${r.label}`; if (!R.has(k)) R.set(k, { end1: e1, label: r.label, ends: new Map() }); for (const [e2, ad] of r.ends) R.get(k).ends.set(m[e2] ?? e2, ad); } return { relations: R }; };
  const m = { p1: "z1", p2: "z2", p3: "z3", p4: "z4", p5: "z5", p6: "z6", e1: "v1", e2: "v2" };
  for (let i = 0; i < 60; i++) {
    const A = draw(), B = draw(), ab = dmdFoldExact(A, B), ba = dmdFoldExact(B, A), rn = dmdFoldExact(rename(A, m), rename(B, m));
    assert.equal(ab.structure, ba.structure, "symmetric in the pair"); assert.equal(ab.structure, rn.structure, "names do not matter");
    assert.equal(ab.evidence?.atLeastAsGood, ba.evidence?.atLeastAsGood);
  }
});

test("exact: unrelated random folds that share one root edge are never called same (the old rule called all of them same)", () => {
  let s = 12345; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pool = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"], draw = () => foldOf([0, 1, 2].map((i) => [pool[Math.floor(rnd() * pool.length)], KARAKA_ROOTS[i], "ev"]));
  let oneShared = 0;
  for (let i = 0; i < 400; i++) {
    const A = draw(), B = draw(), edges = (f) => new Set([...f.relations.values()].map((r) => `${r.end1}|${r.label}`)), ea = edges(A), eb = edges(B);
    if ([...ea].filter((e) => eb.has(e)).length !== 1) continue;
    oneShared++;
    assert.notEqual(dmdFoldExact(A, B).structure, "same");
  }
  assert.ok(oneShared > 30, `the sample has to contain the case (${oneShared} pairs)`);
});

test("sameOrOtherExact: polarity is a declared policy; a sign flip decides even over a gap; a gap stays a gap otherwise", () => {
  const A = foldOf(give);
  assert.equal(sameOrOtherExact({ fold: A, polarity: {} }, { fold: A, polarity: {} }).verdict, "same");
  assert.equal(sameOrOtherExact({ fold: A, polarity: { neg: false } }, { fold: A, polarity: { neg: true } }).verdict, "other", "negation");
  assert.equal(sameOrOtherExact({ fold: A, polarity: { modal: null } }, { fold: A, polarity: { modal: "might" } }).verdict, "other", "modality");
  const far = foldOf([["sam", "kartṛ", "buy"]]);
  assert.equal(sameOrOtherExact({ fold: A, polarity: {} }, { fold: far, polarity: {} }).verdict, "gap");
  assert.equal(sameOrOtherExact({ fold: A, polarity: { neg: true } }, { fold: far, polarity: {} }).verdict, "other");
  const rev = foldOf([["book", "kartṛ", "give"], ["jonathan", "karman", "give"], ["mina", "sampradāna", "give"]]);
  assert.equal(sameOrOtherExact({ fold: A, polarity: {} }, { fold: rev, polarity: {} }).structure, "other", "role reversal");
});
