// Penelope's loop on the mutation battery (PREREG.md, ERRATUM-1.md). Reads perspective / answer / pair-question / battery-key / text-reading /
// speech marks; writes battery-eval (EVA) and rec (REC) marks. Penelope's organ judges; this script holds the loop around it.
//   node judge.mjs <pointer> <logdir> <logname> dev          arms V0, VS, then REC revisions on the development pairs
//   node judge.mjs <pointer> <logdir> <logname> held --final  the arm development admitted, once, on the held-out pairs
import fs from "node:fs";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
const [,, pointer, logDir, logName, split, flag] = process.argv;
const ptr = JSON.parse(fs.readFileSync(pointer, "utf8"));
const P = await import(pathToFileURL(ptr.lib).href);
const V = await import("/private/tmp/claude-501/-Users-mlacy-Library-Application-Support-Claude-scratch-workspaces-4bf59fed-b26b-4f7d-a90f-11d28a16ba25-1a7b49f0-7962-48a4-8bfc-8a3bc2e27d2d-scratch-2026-11-18-297985/42c7580b-6f78-4d1c-a782-63163c05398a/scratchpad/repos/penelope/organs/vantage-verdicts.mjs");
const h = P.open(logName, { writer: "penelope-b", dir: logDir });
const live = (k) => P.fold(h, { kind: k }).entries;
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
for (const [kind, cell, why] of [["battery-eval", "EVA·Figure", "verdicts of one arm on a battery split: balanced accuracy, false-accept rate, per-type results"], ["rec", "REC·Pattern", "whether a revision of the declared perspective is admitted: balanced accuracy must rise, false accepts must not, and no suitor may be let in"]])
  if (!live("kind").find((e) => e.body?.name === kind)) P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: "kind:" + kind, body: { name: kind, cell, why } });
// ---- marks ---------------------------------------------------------------------------------------------------------------------
const pe = live("perspective").at(-1), pdef = { name: pe.addr.split(":")[1], ...pe.body };
const key = live("battery-key").filter((e) => e.addr === "battery-key:" + split).at(-1)?.body.pairs ?? [];
const pq = Object.fromEntries(live("pair-question").map((e) => [e.addr, e.body]));
const ans = {}; for (const e of live("answer")) { const [, t, q] = e.addr.split(":"); (ans[t] ??= {})[q] = e.body.answer; }
const rows = Object.fromEntries(live("text-reading").map((e) => ["text:" + e.addr.split(":")[1], e.body.rows]));
const kf = (r) => String(r.key ?? r.lemma ?? r.form).toLowerCase();
const table = { "1623": {}, modern: {} };
for (const s of live("speech")) for (const r of rows[s.body.text] ?? []) { const t = (table[s.body.edition][kf(r)] ??= {}); t[r.upos] = (t[r.upos] ?? 0) + 1; }
const n1 = (w) => String(w).toLowerCase().replace(/u/g, "v").replace(/j/g, "i"), n2 = (w) => n1(w).replace(/(.)\1+/g, "$1").replace(/e$/, "");
const L1 = "same word when letter case, u/v and i/j are ignored", L2 = "same word when also a doubled letter is one and a final e is dropped";
// ---- arms ----------------------------------------------------------------------------------------------------------------------
const answersOf = (addr) => ans[addr.split(":")[1]] ?? {};
function vantage(state) {                        // Penelope's organ, under a state: licences, re-weighing, proof
  const persp = V.declarePerspective({ ...pdef, ...(state.reweigh ? { reweigh: V.RE_WEIGH } : {}) });
  return (p) => { const q = pq[p.addr]; return V.judgeVantage({ perspective: persp, a: answersOf(q.a), b: answersOf(q.b), licences: state.licences, classesA: table[p.aEd], classesB: table[p.bEd], proof: state.proof ?? null }); };
}
const toks = (addr) => (rows[addr] ?? []).map((r) => n2(String(r.form).toLowerCase()));
const baselines = { T1: (p) => { const q = pq[p.addr], a = toks(q.a), b = toks(q.b); return { verdict: a.length === b.length && a.every((x, i) => x === b[i]) ? "same" : "other" }; },
                    T2: (p) => { const q = pq[p.addr], a = new Set(toks(q.a)), b = new Set(toks(q.b)); return { verdict: a.size === b.size && [...a].every((x) => b.has(x)) ? "same" : "other" }; } };
function score(pairs, fn) {
  const by = {}; let sameOk = 0, sameN = 0, othOk = 0, othN = 0, fa = 0, gap = 0; const suitors = {};
  const verdicts = new Map();
  for (const p of pairs) {
    const v = fn(p).verdict; verdicts.set(p.addr, v);
    (by[p.type] ??= { same: 0, other: 0, gap: 0, n: 0 })[v === "same" ? "same" : v === "other" ? "other" : "gap"]++; by[p.type].n++;
    if (v === "gap") gap++;
    if (p.gold === "same") { sameN++; if (v === "same") sameOk++; } else { othN++; if (v === "other") othOk++; if (v === "same") { fa++; suitors[p.type] = (suitors[p.type] ?? 0) + 1; } }
  }
  const recS = sameOk / sameN, recO = othOk / othN;
  return { n: pairs.length, recallSame: recS, recallOther: recO, BA: (recS + recO) / 2, FA: fa / othN, gaps: gap, suitorsAdmitted: suitors, byType: by, verdicts };
}
const show = (name, r) => console.log(name.padEnd(30), `n=${r.n}  BA ${r.BA.toFixed(3)}  recall same ${r.recallSame.toFixed(3)}  recall other ${r.recallOther.toFixed(3)}  FA ${r.FA.toFixed(3)}  suitors in: ${JSON.stringify(r.suitorsAdmitted)}`);
const slim = (r) => { const { verdicts, ...rest } = r; return rest; };
if (split === "dev") {
  const pairs = key; let state = { licences: [], reweigh: false, proof: null }; const out = {};
  const BL = Object.fromEntries(Object.entries(baselines).map(([n, f]) => [n, score(pairs, f)])); for (const [n, r] of Object.entries(BL)) show(n + " (baseline)", r);
  let cur = score(pairs, vantage(state)); show("V0 lenient", cur);
  const log = [];
  const tryRevision = (name, next, evidence) => {
    const r = score(pairs, vantage(next));
    const moved = [...r.verdicts].filter(([a, v]) => cur.verdicts.get(a) !== v).length;
    const newSuitors = pairs.filter((p) => p.gold === "other" && cur.verdicts.get(p.addr) !== "same" && r.verdicts.get(p.addr) === "same").length;
    const ok = moved > 0 && r.BA > cur.BA && r.FA <= cur.FA && newSuitors === 0;
    const why = !moved ? "no verdict moved: refused" : newSuitors ? `${newSuitors} suitor(s) let in: refused whatever the gain` : r.FA > cur.FA ? "false accepts rose: refused" : r.BA <= cur.BA ? "balanced accuracy did not rise: refused" : "BA rose, no suitor let in";
    log.push({ revision: name, admitted: ok, why, BA: [cur.BA, r.BA], FA: [cur.FA, r.FA], evidence });
    console.log(`REC  ${name.padEnd(26)} ${ok ? "ADMITTED" : "refused "}  BA ${cur.BA.toFixed(3)} -> ${r.BA.toFixed(3)}  FA ${cur.FA.toFixed(3)} -> ${r.FA.toFixed(3)}  (${why})`);
    P.weave(h, { cell: "REC·Pattern", kind: "rec", addr: `rec:dev:${name}`, body: log.at(-1), basis: { prereg: sha("PREREG.md"), erratum: sha("ERRATUM-1.md") } });
    if (ok) { state = next; cur = r; }
  };
  tryRevision("proof=set (strict)", { ...state, proof: V.PROOF_SET }, "the default is Other; sameness is proven");
  // residue the admitted arm gets wrong among gold-SAME pairs; licences are nominated only if they license a residue element pair
  for (let round = 1; round <= 3; round++) {
    const misses = pairs.filter((p) => p.gold === "same" && cur.verdicts.get(p.addr) !== "same");
    const cover = (norm) => { let n = 0, ex = []; for (const p of misses) { const a = answersOf(pq[p.addr].a), b = answersOf(pq[p.addr].b); for (const q of Object.keys(a)) { const x = (a[q] ?? []).filter((e) => !(b[q] ?? []).includes(e)), y = (b[q] ?? []).filter((e) => !(a[q] ?? []).includes(e)); for (const e of x) { const m = y.find((f) => norm(e) === norm(f)); if (m) { n++; if (ex.length < 4) ex.push(e + "/" + m); } } } } return { n, ex }; };
    let moved = false;
    if (!state.licences.includes(L1)) { const c = cover(n1); if (c.n) { tryRevision("licence n1", { ...state, licences: [L1] }, c); moved = true; continue; } }
    if (!state.licences.includes(L2)) { const c = cover(n2); if (c.n) { tryRevision("licence n2", { ...state, licences: [L1, L2] }, c); moved = true; continue; } }
    if (!state.reweigh) { const rowsFor = misses.map((p) => { const j = vantage(state)(p); const q = pq[p.addr]; return { pair: p.addr, verdict: j.verdict, questions: j.questions, a: answersOf(q.a), b: answersOf(q.b), classesA: table[p.aEd], classesB: table[p.bEd] }; });
      const nom = V.nominate({ perspective: V.declarePerspective(pdef), rows: rowsFor }); if (nom.length) { tryRevision("re-weigh by the whole", { ...state, reweigh: true }, { elements: nom[0].because.length }); moved = true; continue; } }
    if (!moved) { console.log(`round ${round}: nothing left to nominate from the residue`); break; }
  }
  const fin = score(pairs, vantage(state)); show("FINAL dev arm", fin);
  console.log("per type (final):", JSON.stringify(Object.fromEntries(Object.entries(fin.byType).map(([t, c]) => [t, `same ${c.same} / other ${c.other} / gap ${c.gap}`]))));
  P.weave(h, { cell: "EVA·Figure", kind: "battery-eval", addr: "eval:dev:final", body: { state, final: slim(fin), baselines: Object.fromEntries(Object.entries(BL).map(([k, v]) => [k, slim(v)])), V0: slim(score(pairs, vantage({ licences: [], reweigh: false, proof: null }))), log } });
  P.weave(h, { cell: "REC·Pattern", kind: "rec", addr: "rec:dev:final", body: { state, log } });
} else if (split === "held" && flag === "--final") {
  if (sha("PREREG.md") !== fs.readFileSync("PREREG.md.sha256", "utf8").trim()) { console.error("PREREG.md changed since it was stamped: refusing"); process.exit(1); }
  if (live("battery-eval").some((e) => e.addr === "eval:held:final")) { console.error("the held-out pairs were already judged once: refusing"); process.exit(1); }
  const fin = live("rec").filter((e) => e.addr === "rec:dev:final").at(-1); if (!fin) { console.error("no dev admission on record"); process.exit(1); }
  const state = fin.body.state, pairs = key; console.log("final arm from development:", JSON.stringify(state));
  const BL = Object.fromEntries(Object.entries(baselines).map(([n, f]) => [n, score(pairs, f)])), V0 = score(pairs, vantage({ licences: [], reweigh: false, proof: null })), AX = score(pairs, vantage(state));
  for (const [n, r] of Object.entries(BL)) show(n + " (baseline)", r); show("V0 lenient", V0); show("FINAL arm", AX);
  console.log("per type (final):", JSON.stringify(Object.fromEntries(Object.entries(AX.byType).map(([t, c]) => [t, `same ${c.same} / other ${c.other} / gap ${c.gap}`]))));
  const bestBL = Math.max(BL.T1.BA, BL.T2.BA), H1 = AX.BA >= bestBL + 0.05, H2 = AX.FA <= V0.FA;
  P.weave(h, { cell: "EVA·Figure", kind: "battery-eval", addr: "eval:held:final", body: { state, final: slim(AX), V0: slim(V0), baselines: Object.fromEntries(Object.entries(BL).map(([k, v]) => [k, slim(v)])), H1, H2 }, basis: { prereg: sha("PREREG.md"), erratum: sha("ERRATUM-1.md") } });
  console.log(`\nH1 (BA at least best baseline + 0.05): ${H1 ? "HOLDS" : "FALSIFIED"}   H2 (FA not above V0's): ${H2 ? "HOLDS" : "FALSIFIED"}`);
} else { console.error("usage: judge.mjs <pointer> <logdir> <logname> dev | held --final"); process.exit(2); }
