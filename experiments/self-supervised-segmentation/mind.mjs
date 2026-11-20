// EXPLORATORY run for PREREG-MIND.md (sha256 first 16: 618450e4c13a8f36). The mind = learned word-final cut programs kept as TRAILS in a pharos log, read back by the `trails` fold, ordered by khora's kernel/stigmergy.js, applied by khora's readingRows/applyMind path. No regex, no word list.
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { execFileSync } from "node:child_process";
const KW = "/Users/mlacy/Documents/khora-pharos-reading/native", Z = "/Users/mlacy/Documents/khora-cast/Zenodotus", PH = "/Users/mlacy/Documents/khora-cast/pharos/lib", KS = "/Users/mlacy/Documents/khora/native/kernel/stigmergy.js";
const { grammarFor } = await import(`${KW}/the-fold/pharos-reading.mjs`), { tagWithMargins } = await import(`${KW}/adapters/text/ud-parser.js`), { sentences, tokenize } = await import(`${KW}/adapters/text/ud-tokenizer.js`), { applyMind } = await import(`${KW}/adapters/text/mind-cuts.js`);
const P = await import(`${PH}/pharos.mjs`), S = await import(`${PH}/sig.mjs`), K = await import(KS), g = await grammarFor("eng");
const SEED = +(process.env.SEED ?? 20261120), REVERSE = process.env.REVERSE === "1", NB = 8, SAMPLE = 40, NULLDRAWS = 30, PROBE_TOKENS = 15000, OUT = process.env.OUT ?? "mind-result.json";
const git = (...a) => execFileSync("git", ["-C", Z, "-c", "gc.auto=0", ...a], { encoding: "utf8", maxBuffer: 1 << 28 }), ls = (p) => git("ls-tree", "-r", "HEAD", "--name-only").split("\n").filter((f) => f.startsWith(p) && f.endsWith(".txt")).sort();
const body = (p) => { const t = git("show", `HEAD:${p}`), i = t.startsWith("---") ? t.indexOf("\n---", 3) : -1; return i < 0 ? t : t.slice(t.indexOf("\n", i + 1) + 1); };
const toks = (files) => { const out = []; let bytes = 0; for (const f of files) { const b = body(f); bytes += Buffer.byteLength(b); for (const s of sentences(b, "und", g.tokenizer)) { const t = tokenize(s, g.tokenizer); if (t.length) out.push(t); } } return { sents: out, bytes }; };
const takeTokens = (ss, n) => { const o = []; let k = 0; for (const s of ss) { if (k >= n) break; o.push(s); k += s.length; } return o; };
const trainFiles = [...ls("19-organic-community/cosem/"), ...ls("19-organic-community/nus-sms/en/")], heldIdx = (i) => i % 10 === 0;
const trainDocs = trainFiles.filter((_, i) => !heldIdx(i)), heldDocs = trainFiles.filter((_, i) => heldIdx(i));
const ircFiles = ["ubuntu", "kubuntu", "xubuntu", "ubuntu-server"].flatMap((c) => ls(`19-organic-community/ubuntu-irc/${c}/`)), editedFiles = ls("01-literature-books/gutenberg/").filter((f) => !f.includes("Greek") && !f.includes("Latin") && !f.toLowerCase().includes("translation")).slice(0, 6);
const train = toks(trainDocs), probes = { "irc (unseen source, same register)": takeTokens(toks(ircFiles).sents, PROBE_TOKENS), "held-out cosem+nus (same source)": takeTokens(toks(heldDocs).sents, PROBE_TOKENS), "edited books (other register)": takeTokens(toks(editedFiles).sents, PROBE_TOKENS) };
const total = train.sents.reduce((a, s) => a + s.length, 0), per = Math.ceil(total / NB); let batches = []; { let cur = [], k = 0; for (const s of train.sents) { cur.push(s); k += s.length; if (k >= per && batches.length < NB - 1) { batches.push(cur); cur = []; k = 0; } } batches.push(cur); }
if (REVERSE) batches = batches.reverse();
console.log(`train: ${trainDocs.length} docs, ${total} tokens, ${train.bytes} bytes, ${batches.length} batches${REVERSE ? " (REVERSED order)" : ""}; probes: ${Object.entries(probes).map(([k, v]) => `${k} ${v.reduce((a, s) => a + s.length, 0)}t`).join(" | ")}`);
let seed = SEED; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const margin = (ws) => { const m = tagWithMargins(g.parser.tagger, ws, g.parser.lex, g.parser.clusters).margins.filter(Number.isFinite); return m.length ? m.reduce((a, b) => a + b, 0) / m.length : 0; }, mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
let taggings = 0; const sentMargin = (ws) => { taggings++; return margin(ws); };
// SURPRISE of reading a probe: minus the mean tagger margin over all tokens after the mind's cuts (the tagger is FIXED: only the mind can move this)
function surprise(sents, mind) { let sum = 0, n = 0; for (const s of sents) { const ws = applyMind(s, mind), m = tagWithMargins(g.parser.tagger, ws, g.parser.lex, g.parser.clusters).margins; for (const x of m) if (Number.isFinite(x)) { sum += x; n++; } } return -(sum / n); }
// the null for a cut of length L: random same-length cuts of random words (cached per L: paid once)
const nullCache = new Map(), nullFor = (L, sents) => { if (nullCache.has(L)) return nullCache.get(L); const cand = sents.filter((s) => s.some((w) => [...w].length > L)), draws = []; for (let d = 0; d < NULLDRAWS; d++) { const ds = []; for (let i = 0; i < SAMPLE; i++) { const s = cand[Math.floor(rnd() * cand.length)], idx = s.map((_, j) => j).filter((j) => [...s[j]].length > L), j = idx[Math.floor(rnd() * idx.length)], cs = [...s[j]], sp = [...s.slice(0, j), cs.slice(0, cs.length - L).join(""), cs.slice(cs.length - L).join(""), ...s.slice(j + 1)]; ds.push(sentMargin(sp) - sentMargin(s)); } draws.push(mean(ds)); } nullCache.set(L, draws); return draws; };
const HEAD = "informal-en:cosem+nus", PATIENCE = Math.ceil(Math.log(0.5) / Math.log(1 - 1 / (NULLDRAWS + 1)));   // ERRATUM-MIND-1: a run of failures stops meaning anything at even odds under the null itself
function newLog() { const h = P.open("mind", { dir: fs.mkdtempSync(path.join(os.tmpdir(), "mind-")), writer: "colony" }); P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: "kind:trail-deposit", body: { name: "trail-deposit", cell: "SIG·Ground" } }); return h; }
let depN = 0; const deposit = (h, body) => P.weave(h, { cell: "SIG·Ground", kind: "trail-deposit", addr: `trail:${HEAD}:${depN++}`, body });
const DAY = 86400000, T0 = Date.UTC(2026, 10, 1);
const mindFrom = (h, now) => { const trails = S.runFold("trails", h, { head: HEAD }), st = K.trailStats(trails, HEAD, { now }); return { cuts: st.filter((s) => s.strength > 0).sort((a, b) => b.strength - a.strength).map((s) => ({ suffix: s.route.slice(4), strength: s.strength })) }; };
function evalRoute(sents, route, cache = null) {
  const suf = route.slice(4), L = [...suf].length, aff = sents.filter((s) => s.some((w) => [...w].length > L && w.endsWith(suf)));
  if (aff.length < 5) return { skipped: true, ok: false, delta: null, L };
  const pick = []; for (let i = 0; i < Math.min(SAMPLE, aff.length); i++) pick.push(aff[Math.floor(rnd() * aff.length)]);
  const delta = mean(pick.map((s) => sentMargin(applyMind(s, { cuts: [{ suffix: suf }] })) - sentMargin(s))), nul = nullFor(L, sents);
  return { skipped: false, ok: delta > 0 && delta > Math.max(...nul), delta, L };   // ERRATUM-MIND-2: a positive difference AND beyond the null
}
// ---- one colony batch: ants walk the learned order, evaluate, deposit; stop when the next M evaluations add no new program ----
function learnBatch(h, sents, day, { fresh = false } = {}) {
  const now = T0 + day * DAY, types = new Map(); for (const s of sents) for (const w of s) { const k = w; (types.get(k) ?? types.set(k, 0).get(k)); types.set(k, types.get(k) + 1); }
  const bySuf = new Map(); for (const w of types.keys()) { const cs = [...w]; for (let L = 1; L <= Math.min(4, cs.length - 1); L++) { const b = cs.slice(cs.length - L).join(""); (bySuf.get(b) ?? bySuf.set(b, []).get(b)).push(w); } }
  const routes = [...bySuf].filter(([, ts]) => ts.length >= 2).sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : 1)).map(([b]) => `cut:${b}`);   // structural default order: the most general suffix first
  const known = new Set(mindFrom(h, now).cuts.map((c) => c.suffix)); let evals = 0, since = 0; const found = new Set(), tried = new Set(), t0 = taggings;
  while (tried.size < routes.length) {
    if (since >= PATIENCE) break;
    const trails = S.runFold("trails", h, { head: HEAD }), order = K.routeOrderFor(trails, HEAD, { now, routes, rng: rnd }), route = order.find((r) => !tried.has(r) && !known.has(r.slice(4))); if (!route) break; tried.add(route);
    const suf = route.slice(4), ev = evalRoute(sents, route); evals++;
    if (ev.skipped) { since++; continue; }
    const { ok, delta } = ev;
    deposit(h, { head: HEAD, route, ok, ms: 1, at: now, organ: "penelope.mind", delta, ...(delta < 0 ? { veto: 1 } : {}) });
    if (ok) found.add(suf); if (ok && !known.has(suf)) { known.add(suf); since = 0; } else since++;
  }
  return { evaluations: evals, taggings: taggings - t0, candidates: routes.length, found: [...found].sort() };
}
// ---- the learning curve ----
const hLog = newLog(), curve = [], PNAMES = Object.keys(probes), base = Object.fromEntries(PNAMES.map((k) => [k, surprise(probes[k], null)]));
console.log("NOMIND surprise:", PNAMES.map((k) => `${k.split(" ")[0]} ${base[k].toFixed(3)}`).join(" | "));
let ingested = 0;
let warmOrder = null, lastRoutes = null;
for (let b = 0; b < batches.length; b++) {
  if (b === batches.length - 1) { const ty = new Map(); for (const sn of batches[b]) for (const w of sn) ty.set(w, 1); const bs = new Map(); for (const w of ty.keys()) { const cs = [...w]; for (let L = 1; L <= Math.min(4, cs.length - 1); L++) { const x = cs.slice(cs.length - L).join(""); (bs.get(x) ?? bs.set(x, []).get(x)).push(w); } } lastRoutes = [...bs].filter(([, t2]) => t2.length >= 2).sort((x, y) => y[1].length - x[1].length || (x[0] < y[0] ? -1 : 1)).map(([x]) => `cut:${x}`); warmOrder = K.routeOrderFor(S.runFold("trails", hLog, { head: HEAD }), HEAD, { now: T0 + (b + 1) * DAY, routes: lastRoutes, explore: 0 }).filter((r) => lastRoutes.includes(r)); }
  const r = learnBatch(hLog, batches[b], b + 1); ingested += batches[b].reduce((a, s) => a + s.join(" ").length, 0); const mind = mindFrom(hLog, T0 + (b + 1) * DAY);
  const row = { batch: b + 1, found: r.found, programsAfter: mind.cuts.map((c) => c.suffix), evaluations: r.evaluations, taggings: r.taggings, candidates: r.candidates, programs: mind.cuts.length, top: mind.cuts.slice(0, 8).map((c) => c.suffix), surprise: Object.fromEntries(PNAMES.map((k) => [k, surprise(probes[k], mind)])) }; curve.push(row);
  console.log(`batch ${row.batch}: evaluations ${String(row.evaluations).padStart(4)} (of ${row.candidates} candidates), programs ${String(row.programs).padStart(3)}, top ${JSON.stringify(row.top)}, surprise delta vs nomind ${PNAMES.map((k) => (row.surprise[k] - base[k]).toFixed(3)).join(" | ")}`);
}
const finalMind = mindFrom(hLog, T0 + batches.length * DAY), final = Object.fromEntries(PNAMES.map((k) => [k, curve.at(-1).surprise[k] - base[k]]));
// RAND: same number of programs drawn at random from the candidate set, no learning
const allSufs = (() => { const m = new Map(); for (const s of batches.at(-1)) for (const w of s) { const cs = [...w]; for (let L = 1; L <= Math.min(4, cs.length - 1); L++) m.set(cs.slice(cs.length - L).join(""), 1); } return [...m.keys()]; })();
const rand = Array.from({ length: 10 }, () => { const picks = []; while (picks.length < finalMind.cuts.length) { const x = allSufs[Math.floor(rnd() * allSufs.length)]; if (!picks.includes(x)) picks.push(x); } const mind = { cuts: picks.map((suffix) => ({ suffix, strength: 1 })) }; return Object.fromEntries(PNAMES.map((k) => [k, surprise(probes[k], mind) - base[k]])); });
// H3a: a reader given ONLY the mind rebuilt from the trails (no content) reproduces the probe surprise exactly
const rebuilt = mindFrom(hLog, T0 + batches.length * DAY), exact = PNAMES.map((k) => surprise(probes[k], rebuilt) === curve.at(-1).surprise[k]);
const mindBytes = Buffer.byteLength(JSON.stringify(finalMind)), contentBytes = train.bytes;
// H6 (the SIG law): the SAME evaluations, three SEARCH ORDERS over the last batch's candidates: the trails' warm order, the cold structural default, random orders. The set of good programs is the same by construction; the cost is the number of evaluations until 50% / 90% / all of the good programs are found.
const last = batches.at(-1), res = new Map(); for (const r of lastRoutes) res.set(r, evalRoute(last, r)); const good = lastRoutes.filter((r) => res.get(r).ok), costTo = (order, frac) => { const need = Math.ceil(frac * good.length); let seen = 0; for (let i = 0; i < order.length; i++) if (res.get(order[i])?.ok && ++seen >= need) return i + 1; return null; };

// H7: the search-aware ceiling: the same search over the batch with every token's characters shuffled (lengths and spacing kept): the largest positive change any candidate reaches there
const shufStr = (w) => { const cs = [...w]; for (let i = cs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cs[i], cs[j]] = [cs[j], cs[i]]; } return cs.join(""); };
const permuted = last.map((sn) => sn.map(shufStr)), pTypes = new Map(); for (const sn of permuted) for (const w of sn) pTypes.set(w, 1);
const pBy = new Map(); for (const w of pTypes.keys()) { const cs = [...w]; for (let L = 1; L <= Math.min(4, cs.length - 1); L++) { const x = cs.slice(cs.length - L).join(""); (pBy.get(x) ?? pBy.set(x, []).get(x)).push(w); } }
const pRoutes = [...pBy].filter(([, t2]) => t2.length >= 2).map(([x]) => `cut:${x}`); let ceiling = -Infinity, pEvaluated = 0; for (const r of pRoutes) { const e = evalRoute(permuted, r); if (!e.skipped) { pEvaluated++; if (e.delta > ceiling) ceiling = e.delta; } }
const searchAware = good.filter((r) => res.get(r).delta > ceiling), CLIT = ["cut:'s", "cut:n't", "cut:'re", "cut:'ll", "cut:'ve", "cut:'m", "cut:'d"];
console.log(`\nH7 search-aware ceiling (permuted copy, ${pRoutes.length} candidates, ${pEvaluated} evaluable): ${ceiling.toFixed(3)}; good ${good.length}, beyond the ceiling ${searchAware.length}; clitics good: ${CLIT.filter((c) => good.includes(c)).map((c) => c.slice(4)).join(" ")} | clitics beyond the ceiling: ${CLIT.filter((c) => searchAware.includes(c)).map((c) => c.slice(4)).join(" ")}`);
console.log("  beyond the ceiling, strongest 15:", searchAware.map((r) => [r.slice(4), res.get(r).delta]).sort((x, y) => y[1] - x[1]).slice(0, 15).map(([x, d]) => `${x}:${d.toFixed(2)}`).join("  "));
const shuffle = (xs) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }, randOrders = Array.from({ length: 20 }, () => shuffle(lastRoutes));
const H6 = Object.fromEntries([0.5, 0.9, 1].map((f) => [f, { warm: costTo(warmOrder, f), cold: costTo(lastRoutes, f), randMean: mean(randOrders.map((o) => costTo(o, f))), randMin: Math.min(...randOrders.map((o) => costTo(o, f))) }]));
console.log(`\nH6 search order on the last batch: ${lastRoutes.length} candidates, ${good.length} good (positive and beyond the null)`); for (const [f, v] of Object.entries(H6)) console.log(`  evaluations to find ${(f * 100).toFixed(0)}% of the good programs: warm (trails) ${v.warm}   cold (default) ${v.cold}   random mean ${v.randMean.toFixed(0)} (best of 20: ${v.randMin})`);
const reset = null;
console.log("\nFINAL: surprise change vs NOMIND (negative = less surprising)"); for (const k of PNAMES) console.log(`  ${k.padEnd(40)} MIND ${final[k].toFixed(3).padStart(8)}   RAND min ${Math.min(...rand.map((r) => r[k])).toFixed(3)} mean ${mean(rand.map((r) => r[k])).toFixed(3)} max ${Math.max(...rand.map((r) => r[k])).toFixed(3)}`);
console.log(`mind: ${finalMind.cuts.length} programs, ${mindBytes} bytes vs ${contentBytes} bytes ingested (${(100 * mindBytes / contentBytes).toFixed(4)}%); exact reproduction from trails alone: ${exact.join(",")}`);
console.log("programs (by strength):", finalMind.cuts.slice(0, 25).map((c) => `${c.suffix}:${c.strength.toFixed(2)}`).join("  "));
fs.writeFileSync(OUT, JSON.stringify({ prereg: "618450e4c13a8f36", addendum1: "d0ad225f57a37a00", addendum2: "a836cd5c647b5e5b", erratum1: "c641e143ddb28b66", erratum2: "dc49518ef62105cd", seed: SEED, reverse: REVERSE, zenodotusCommit: "d79ee5a", sample: SAMPLE, nullDraws: NULLDRAWS, base, curve, final, rand, exact, mindBytes, contentBytes, H6, ceiling, searchAware: searchAware.map((r) => r.slice(4)), goodDelta: Object.fromEntries(good.map((r) => [r.slice(4), res.get(r).delta])), goodOnLast: good, finalMind }, null, 1));
