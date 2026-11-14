// gym/equivalence-run.mjs — run the equivalence judge over a directory of the text finder's stops.
//   node gym/equivalence-run.mjs --dev <dir with information.<ground>.jsonl and pairs.json> --ladder casual,strict --by <who> --why <why> [--out file.json]
// The judge sees the stops only. Labels (pairs.json l1, type) are joined AFTER judging, to score the
// pre-registered predictions (experiments/equivalence/PREREG.md). Reads only; writes --out if given.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { declareLadder, judge } from "../organs/equivalence.mjs";

const arg = (k, d = null) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const dev = arg("dev"), names = String(arg("ladder", "")).split(",").filter(Boolean);
if (!dev || names.length < 2) { console.error("usage: --dev <dir> --ladder a,b[,c] --by <who> --why <why>"); process.exit(2); }
const ladder = declareLadder({ rungs: names, by: arg("by", ""), why: arg("why", "") });
if (!ladder.ok) { console.error("ladder refused:", ladder.reason, ladder.detail ?? ""); process.exit(2); }

const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const files = {}, stops = {};
for (const g of names) {
  const f = path.join(dev, `information.${g}.jsonl`); files[g] = { file: f, sha256: sha(f) };
  for (const line of fs.readFileSync(f, "utf8").split("\n")) { if (!line.trim()) continue; const r = JSON.parse(line); (stops[r.pid] ||= {})[g] = r; }
}
const pairsFile = path.join(dev, "pairs.json"), pairs = JSON.parse(fs.readFileSync(pairsFile, "utf8")).pairs;
const bothAs = arg("both", "undecided"); // "undecided" is the pre-registered reading; "different" is the finder owner's
const judged = pairs.map((p) => ({ p, j: judge({ pid: p.pid, ladder, stops: stops[p.pid] ?? {}, both: bothAs }) })); // labels are not passed in

const [loose, strict] = [names[0], names[names.length - 1]];
const at = (j, g) => j.rungs.find((r) => r.rung === g).verdict;
const both = judged.filter(({ j }) => at(j, loose) !== "undecided" && at(j, strict) !== "undecided");
const cls = ({ j }) => `${at(j, loose)}>${at(j, strict)}`;
const table = {}; for (const x of judged) { const k = cls(x); ((table[k] ||= {})[x.p.l1] ||= 0); table[k][x.p.l1]++; }
const byType = {}; for (const x of judged) { const k = cls(x); ((byType[k] ||= {})[x.p.type] ||= 0); byType[k][x.p.type]++; }
const nonMonotone = both.filter(({ j }) => !j.monotone);
const contra = both.filter(({ p }) => p.l1 === "CONTRADICTS");
const flips = both.filter(({ j }) => j.frameDependent);
const sameShare = pairs.filter((p) => p.l1 === "SAME").length / pairs.length;
const flipSame = flips.filter(({ p }) => p.l1 === "SAME").length;
const acc = Object.fromEntries(names.map((g) => [g, {
  same_with_surviving: judged.filter(({ j }) => { const r = j.rungs.find((x) => x.rung === g); return r.verdict === "same" && r.surviving > 0; }).length,
  different_with_none: judged.filter(({ j }) => { const r = j.rungs.find((x) => x.rung === g); return r.verdict === "different" && r.surviving === 0; }).length,
}]));
const anyStep = judged.filter(({ j }) => j.steps.some((s) => s.was !== "undecided" && s.becomes !== "undecided")).length;
const result = {
  schema: "EquivalenceRun@1", bothReadAs: bothAs, ladder: { rungs: ladder.rungs, by: ladder.by, why: ladder.why, ratified: ladder.ratified },
  inputs: { ...files, pairs: { file: pairsFile, sha256: sha(pairsFile) } },
  pairs: pairs.length, decidedAtBoth: both.length,
  undecided: Object.fromEntries(names.map((g) => [g, judged.filter(({ j }) => at(j, g) === "undecided").length])),
  classesByLabel: table, classesByType: byType,
  P1: { claim: "no pair is same at the strict rung and different at the loose one", violations: nonMonotone.map(({ p }) => p.pid), pass: nonMonotone.length === 0 },
  P2: { claim: "every CONTRADICTS pair decided at both rungs is different at both", n: contra.length, notDifferentAtBoth: contra.filter(({ j }) => !(at(j, loose) === "different" && at(j, strict) === "different")).map(({ p, j }) => ({ pid: p.pid, class: `${at(j, loose)}>${at(j, strict)}` })) },
  P3: { claim: "among pairs same at loose and different at strict, the share labelled SAME is at most the set's share", flips: flips.length, flipsLabelledSame: flipSame, share: flips.length ? flipSame / flips.length : null, setShare: sameShare, tooFew: flips.length < 5, byLabel: flips.reduce((a, { p }) => ((a[p.l1] = (a[p.l1] || 0) + 1), a), {}), byType: flips.reduce((a, { p }) => ((a[p.type] = (a[p.type] || 0) + 1), a), {}) },
  P4: acc,
  P5: { decidedAtBoth: both.length, casualSubsetOfStrict: both.filter(({ j }) => j.accumulates === true).length },
  against: { pairsWithAFirstDifference: anyStep },
  relationsAtStrict: judged.reduce((a, { j, p }) => { const r = j.rungs.find((x) => x.rung === strict).relation; if (r) { (a[r] ||= {})[p.l1] = ((a[r] || {})[p.l1] || 0) + 1; } return a; }, {}),
};
result.P2.pass = result.P2.notDifferentAtBoth.length === 0;
result.P3.pass = result.P3.tooFew ? null : result.P3.share <= sameShare;
console.log(JSON.stringify(result, null, 1));
const out = arg("out"); if (out) fs.writeFileSync(out, JSON.stringify({ ...result, judgements: judged.map(({ j }) => j) }, null, 1));
