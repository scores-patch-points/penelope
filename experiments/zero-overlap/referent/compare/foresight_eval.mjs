// node compare/foresight_eval.mjs <set>   (set = dev for debugging, fresh3 for the scored run)  -- PREREG-FORESIGHT.md (stamp in PREREG-FORESIGHT.md.sha256short)
// Gold: two DISTINCT referents of the reader, written differently, whose linked mentions point to the same Wikipedia link target (links are gold only; never an input to the gate).
// Event: a merge of the two written spellings at the cut = the end of the later of their first mentions. Gate: foresight.mjs (house max over 39 draws, two seeds, intersection).
// Controls: up to 5 random referent pairs of the same document, not gold, not alias-by-name, matched on the power-of-two mention-count bins, same cut. Comparison: a hindsight-only gate.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import { makeSame } from "./compare.mjs";
import { streamOf, decideEvent, mulberry, median } from "./foresight.mjs";
const KH = process.env.KHORA_HOME ?? "/Users/mlacy/Documents/khora-cast/khora";
const { languageContextFor } = await import(`${KH}/native/the-fold/language-context.js`);
const HERE = path.dirname(fileURLToPath(import.meta.url)), SET = process.argv[2] ?? "dev", DIR = path.join(HERE, "..", "data", SET);
const NOEVENT = { merges: [], aparts: [] }, alias = makeSame(NOEVENT), CTL = 5, MINLATER = 3;
const bin = (n) => Math.floor(Math.log2(Math.max(1, n)));
const out = { set: SET, docs: [], refused: [] };
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")); const doc = { id: d.title, text: d.text };
  const heard = languageContextFor(d.text, {}).language ?? "none"; if (heard !== "eng") { out.refused.push({ title: d.title, heard }); continue; }
  const events = await streamOf(doc);
  // code point offsets (python) -> UTF-16 offsets
  const u16 = []; { let u = 0; for (const ch of d.text) { u16.push(u); u += ch.length; } u16.push(u); }
  const anchors = d.links.map((l) => ({ a: u16[l.c0], b: u16[l.c1], target: l.target }));
  // referents: id -> { face, mentions }
  const R = new Map(); for (const e of events) { if (!R.has(e.ref)) R.set(e.ref, { ref: e.ref, face: e.face, mentions: [] }); R.get(e.ref).mentions.push(e); }
  for (const r of R.values()) {                         // majority link target among the referent's linked mentions (an overlap of at least half the mention inside the anchor)
    const tally = new Map();
    for (const m of r.mentions) for (const a of anchors) { const ov = Math.min(m.end, a.b) - Math.max(m.pos, a.a); if (ov >= 0.5 * (m.end - m.pos) && ov > 0) tally.set(a.target, (tally.get(a.target) ?? 0) + 1); }
    const top = [...tally].sort((x, y) => y[1] - x[1]); r.target = top.length && (top.length === 1 || top[0][1] > top[1][1]) ? top[0][0] : null;
    r.first = Math.min(...r.mentions.map((m) => m.end));
  }
  const refs = [...R.values()]; const mapped = refs.filter((r) => r.target);
  const gold = []; for (let i = 0; i < mapped.length; i++) for (let j = i + 1; j < mapped.length; j++) { const a = mapped[i], b = mapped[j]; if (a.target === b.target && a.face !== b.face && !alias(a.face, b.face)) gold.push([a, b]); }
  const goldKey = new Set(gold.map(([a, b]) => [a.ref, b.ref].sort().join("|")));
  const later = (a, b, cut) => a.mentions.filter((m) => m.pos > cut).length + b.mentions.filter((m) => m.pos > cut).length;
  const rng = mulberry(20261119 + files.indexOf(f)), rows = []; let nGold = gold.length, nElig = 0;
  for (const [a, b] of gold) {
    const cut = Math.max(a.first, b.first); if (later(a, b, cut) < MINLATER) continue; nElig++;
    const dec = decideEvent(events, cut, [a.face, b.face], NOEVENT, { merges: [[a.face, b.face]], aparts: [] });
    rows.push({ kind: "true", faces: [a.face, b.face], target: a.target, cut, bins: [bin(a.mentions.length), bin(b.mentions.length)], ...dec });
    // controls matched on the mention-count bins
    const want = [bin(a.mentions.length), bin(b.mentions.length)].sort().join(",");
    const all = []; for (let i = 0; i < refs.length; i++) for (let j = i + 1; j < refs.length; j++) { const x = refs[i], y = refs[j]; if (x.face === y.face || alias(x.face, y.face) || goldKey.has([x.ref, y.ref].sort().join("|")) || later(x, y, cut) < MINLATER) continue; all.push([x, y]); }
    const matched = all.filter(([x, y]) => [bin(x.mentions.length), bin(y.mentions.length)].sort().join(",") === want);
    const pool = matched.length >= 3 ? matched : all, fallback = matched.length < 3;
    for (let k = 0; k < Math.min(CTL, pool.length); k++) { const [x, y] = pool.splice(Math.floor(rng() * pool.length), 1)[0];
      const c = decideEvent(events, cut, [x.face, y.face], NOEVENT, { merges: [[x.face, y.face]], aparts: [] }); rows.push({ kind: "ctl", faces: [x.face, y.face], cut, fallback, ...c }); }
  }
  out.docs.push({ title: d.title, referents: refs.length, mapped: mapped.length, gold: nGold, eligible: nElig, rows });
  console.log(`${d.title}: referents ${refs.length}, mapped to a link target ${mapped.length}, gold alias pairs ${nGold}, eligible ${nElig}, rows ${rows.length}`);
}
// ---------------- aggregate ----------------
const rows = (kind, fn = () => true) => out.docs.flatMap((d) => d.rows.filter((r) => r.kind === kind && fn(r)));
const T = rows("true"), C = rows("ctl"), Tg = T.filter((r) => !r.gap), Cg = C.filter((r) => !r.gap);
const rate = (a, f) => (a.length ? a.filter(f).length / a.length : NaN);
const rngB = mulberry(20261119);
function boot(statFn) { const D = out.docs.filter((d) => d.rows.some((r) => !r.gap)), vals = []; for (let b = 0; b < 2000; b++) { const s = []; for (let i = 0; i < D.length; i++) s.push(D[Math.floor(rngB() * D.length)]); const v = statFn(s); if (v === v) vals.push(v); } vals.sort((x, y) => x - y); return [vals[Math.floor(0.025 * vals.length)], vals[Math.floor(0.975 * vals.length)]]; }
const medDiff = (docs) => { const t = docs.flatMap((d) => d.rows.filter((r) => r.kind === "true" && !r.gap)).map((r) => r.foresight), c = docs.flatMap((d) => d.rows.filter((r) => r.kind === "ctl" && !r.gap)).map((r) => r.foresight); return t.length && c.length ? median(t) - median(c) : NaN; };
const rank = (a) => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]), r = Array(a.length); for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2 + 1; i = j + 1; } return r; };
const spearman = (x, y) => { if (x.length < 3) return NaN; const a = rank(x), b = rank(y), ma = a.reduce((s, v) => s + v, 0) / a.length, mb = b.reduce((s, v) => s + v, 0) / b.length; let n = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return n / Math.sqrt(da * db); };
const cost = (r) => Math.log2(Math.max(2, r.nullPairs ?? 2));     // bits to name one of the candidate pairs (descriptive; the pre-registered gate is not netted)
const gaps = (a) => a.reduce((m, r) => (r.gap ? (m[r.gap] = (m[r.gap] ?? 0) + 1, m) : m), {});
const S = {
  set: SET, documents: out.docs.length, refused: out.refused.length, referents: out.docs.reduce((s, d) => s + d.referents, 0), mapped: out.docs.reduce((s, d) => s + d.mapped, 0), goldPairs: out.docs.reduce((s, d) => s + d.gold, 0), eligible: out.docs.reduce((s, d) => s + d.eligible, 0),
  trueDecided: Tg.length, trueGaps: gaps(T), ctlDecided: Cg.length, ctlGaps: gaps(C), ctlFallback: C.filter((r) => r.fallback).length,
  foresightAdmitTrue: rate(Tg, (r) => r.admitted), dissentTrue: rate(Tg, (r) => r.dissent), foresightAdmitCtl: rate(Cg, (r) => r.admitted), dissentCtl: rate(Cg, (r) => r.dissent),
  netAdmitTrue: rate(Tg, (r) => r.admitted && r.foresight > cost(r)), netAdmitCtl: rate(Cg, (r) => r.admitted && r.foresight > cost(r)), medianCost: median(Tg.map(cost)), medianNetForeTrue: median(Tg.map((r) => r.foresight - cost(r))), medianNetForeCtl: median(Cg.map((r) => r.foresight - cost(r))), medianNetHindTrue: median(Tg.map((r) => r.hindsight - cost(r))), medianNetHindCtl: median(Cg.map((r) => r.hindsight - cost(r))),
  hindsightAdmitTrue: rate(Tg, (r) => r.hindAdmitted), hindsightAdmitCtl: rate(Cg, (r) => r.hindAdmitted),
  medianForeTrue: median(Tg.map((r) => r.foresight)), medianForeCtl: median(Cg.map((r) => r.foresight)), medianHindTrue: median(Tg.map((r) => r.hindsight)), medianHindCtl: median(Cg.map((r) => r.hindsight)),
  medDiffCI: boot(medDiff), spearmanHindFore: spearman(Tg.map((r) => r.hindsight), Tg.map((r) => r.foresight)),
};
S.falsifiers = { F1_unjudgeable: S.eligible < 30, F2_trueAdmitBelowHalf: S.foresightAdmitTrue < 0.5, F3_ctlAdmitAbove005: S.foresightAdmitCtl > 0.05, F4_ciLowerAtOrBelowZero: S.medDiffCI[0] <= 0, F5_hindsightNotWorseBy005: !(S.hindsightAdmitCtl - S.foresightAdmitCtl >= 0.05) };
console.log("\n== FORESIGHT EVALUATION", JSON.stringify(S, (k, v) => (typeof v === "number" ? +v.toFixed(4) : v), 1));
fs.writeFileSync(path.join(HERE, `foresight-eval-${SET}.json`), JSON.stringify({ summary: S, refused: out.refused, docs: out.docs.map((d) => ({ ...d, rows: d.rows.map(({ faces, kind, cut, foresight, hindsight, later, admitted, dissent, hindAdmitted, gap, rank, fallback, target, nullPairs }) => ({ faces, kind, cut, foresight, hindsight, later, admitted, dissent, hindAdmitted, gap, rank, fallback, target, nullPairs })) })) }, null, 1));
