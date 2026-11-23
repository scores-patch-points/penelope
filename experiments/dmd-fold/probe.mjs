// experiments/dmd-fold/probe.mjs — GL-DF-01: the old percentile rule (dmdFold) against the exact rule (dmdFoldExact), on cases whose answer is known
// and on random UNRELATED folds. Synthetic: a seeded LCG, no corpus read, nothing downloaded. Label: EXPLORATORY.
//   node experiments/dmd-fold/probe.mjs
import { dmdFold, dmdFoldExact, KARAKA_ROOTS } from "../../organs/relation-fold.mjs";

const foldOf = (edges) => { const R = new Map(); for (const [a, l, b] of edges) { const k = `${a}|${l}`; if (!R.has(k)) R.set(k, { end1: a, label: l, ends: new Map() }); R.get(k).ends.set(b, []); } return { relations: R }; };
const oldVerdict = (A, B, o) => (dmdFold(A, B, o).makesDifference ? "other" : "same");

const give = [["jonathan", "kartṛ", "give"], ["book", "karman", "give"], ["mina", "sampradāna", "give"]];
const five = [["a", "kartṛ", "e1"], ["b", "karman", "e1"], ["c", "sampradāna", "e1"], ["d", "apādāna", "e1"], ["f", "kartṛ", "e2"]];
const known = [
  ["identical 3-edge fold", give, give, "same"],
  ["dative alternation (recipient is a leaf on one side)", give, [["jonathan", "kartṛ", "give"], ["book", "karman", "give"], ["mina", "adhikaraṇa", "give"]], "same"],
  ["partial description, contradicts nothing", give, give.slice(0, 2), "same"],
  ["agent/patient reversed, recipient kept", give, [["book", "kartṛ", "give"], ["jonathan", "karman", "give"], ["mina", "sampradāna", "give"]], "other"],
  ["5 edges, 1 changed (an agent)", five, [...five.slice(0, 4), ["z", "kartṛ", "e2"]], "other"],
  ["5 edges, 4 changed", five, [["a", "kartṛ", "e1"], ["q", "karman", "e1"], ["r", "sampradāna", "e1"], ["s", "apādāna", "e1"], ["t", "kartṛ", "e2"]], "other"],
  ["completely different event (no shared slot)", give, [["sam", "kartṛ", "buy"], ["car", "karman", "buy"], ["lee", "sampradāna", "buy"]], "gap"],
  ["two folds with no root edge", [], [], "gap"],
  ["one identical entity", [["x", "kartṛ", "x"]], [["x", "kartṛ", "x"]], "same"],
];
console.log("KNOWN CASES (want = the answer a reader would give; the old rule has no gap, so for a want of gap either 'other' is acceptable)");
console.log("case".padEnd(54), "want".padEnd(7), "OLD".padEnd(7), "NEW".padEnd(7), "NEW why");
let oldRight = 0, newRight = 0;
for (const [name, a, b, want] of known) {
  const A = foldOf(a), B = foldOf(b), o = oldVerdict(A, B), n = dmdFoldExact(A, B).structure;
  const ok = (v) => v === want || (want === "gap" && v === "other");
  oldRight += ok(o); newRight += ok(n);
  console.log(name.padEnd(54), want.padEnd(7), `${o}${ok(o) ? "" : " ✗"}`.padEnd(7), `${n}${ok(n) ? "" : " ✗"}`.padEnd(7), dmdFoldExact(A, B).why.slice(0, 70));
}
console.log(`right: old ${oldRight}/${known.length}, new ${newRight}/${known.length}`);

// the old rule is not unstable: its cut is saturated. Seeds and the order of the pair change nothing on any known case.
let flips = 0;
for (const [, a, b] of known) { const A = foldOf(a), B = foldOf(b), base = oldVerdict(A, B); for (let s = 1; s <= 200; s++) { if (oldVerdict(A, B, { seed: s }) !== base) flips++; if (oldVerdict(B, A, { seed: s }) !== base) flips++; } }
console.log(`old rule, seeds 1..200 and a,b swapped, ${known.length} cases: ${flips} verdict flips`);

// random UNRELATED folds: three root edges each, drawn from one pool of 8 entities and a single event; the truth is "not the same event" unless all 3 edges are shared
let s = 12345; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const pool = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"], N = 400;
const draw = () => foldOf([0, 1, 2].map((i) => [pool[Math.floor(rnd() * pool.length)], KARAKA_ROOTS[i], "ev"]));
const edgeSet = (f) => new Set([...f.relations.values()].map((r) => `${r.end1}|${r.label}`));
const rows = new Map();
for (let i = 0; i < N; i++) {
  const A = draw(), B = draw(), ea = edgeSet(A), eb = edgeSet(B), shared = [...ea].filter((e) => eb.has(e)).length;
  const row = rows.get(shared) ?? { n: 0, oldSame: 0, newSame: 0, newGap: 0, newOther: 0 }; row.n++;
  if (oldVerdict(A, B) === "same") row.oldSame++;
  const v = dmdFoldExact(A, B).structure; row[v === "same" ? "newSame" : v === "gap" ? "newGap" : "newOther"]++; rows.set(shared, row);
}
console.log(`\nRANDOM UNRELATED PAIRS (N=${N}, 3 root edges each, 8 entities, 1 event, LCG seed 12345): truth is "same" only if all 3 edges are shared`);
console.log("shared edges".padEnd(14), "pairs".padEnd(7), "OLD said same".padEnd(15), "NEW same".padEnd(10), "NEW gap".padEnd(9), "NEW other");
for (const [k, r] of [...rows].sort((x, y) => x[0] - y[0])) console.log(String(k).padEnd(14), String(r.n).padEnd(7), String(r.oldSame).padEnd(15), String(r.newSame).padEnd(10), String(r.newGap).padEnd(9), r.newOther);
