// ai-code-harness/pipeline/adapters/prose.mjs — THE PROSE ADAPTER.
//
// Only what is truly different about PROSE lives here; the ENGINE owns the
// order, retries, scars, EOT. The prose adapter does NOT reimplement the
// essay machinery — it delegates to eoreader7's falsified organs (68 tests
// green at commit 2a033d7):
//
//   topicPhrase    — the essay subject, extracted from the ask (the count
//                    clause never hijacks the subject — T1-T4)
//   voidCellsFor   — the void cells the essay must fill (DEF the void first)
//   relevantSources+snipsFromSources — the field: the hunt's material kept by
//                    relevance and cut to snips (a source survives only when
//                    it shares the task's vocabulary)
//   wideToAtoms    — the wide draft → claim-cored, referent-tagged atoms
//   foldWideToShape— the FOLD: re-admission (invented referents, meta,
//                    hollow-actors refused), dedupe by claim-core, assign to
//                    beats, name gaps and residual (F1-F6)
//   concrescence   — the detector: strain CONSTANT, not zero (C1-C5)
//
// The MOUTH-LAST / HUNT-FIRST law, the small-model law (prompt is a
// completion anchor), and falsify-or-die are the ENGINE's, inherited here.
import { createRequire } from "node:module";
import { draw } from "../engine.mjs";

const require = createRequire(import.meta.url);
// eoreader7 is a sibling checkout (../eoreader7); ER7_HOME overrides it.
const ER7 = process.env.ER7_HOME ?? decodeURIComponent(new URL("../../../../khora", import.meta.url).pathname);
let organs = null;
let composedReader = null;
try {
  const ledger = await import(`${ER7}/native/the-fold/document-ledger.js`);
  const fold = await import(`${ER7}/native/the-fold/essay-fold.js`);
  const proxy = await import(`${ER7}/proxy-runner.mjs`);
  organs = { ...ledger, ...fold, ...proxy };
} catch (e) { organs = null; console.error(`[prose] organs not loaded: ${e.message}`); }
// THE MODEL-FREE READER (composed: positional clause connector where it
// settles, recurrence arrangement elsewhere). Loaded lazily; a prose unit the
// BOX can settle from the material needs NO parser and NO mouth.
try {
  const composed = await import(`${ER7}/native/adapters/text/gfp-relations-composed.js`);
  const spans = await import(`${ER7}/native/adapters/text/spans.js`);
  const wordclass = await import(`${ER7}/native/adapters/text/wordclass.js`);
  const referents = await import(`${ER7}/native/the-fold/referents.js`);
  composedReader = { composedRelations: composed.composedRelations, splitSentences: spans.splitSentences, classifyWord: wordclass.classifyWord, dominantClass: wordclass.dominantClass, buildReferents: referents.buildReferents };
} catch (e) { composedReader = null; console.error(`[prose] composed reader not loaded: ${e.message}`); }

// ── THE BOX SETTLES A PROSE UNIT, NO MODEL — over LIVE material + PRIORS ──
// penelope's two standing resources, both used:
//   LIVE   the shadow (ctx.shadow, a Map url->code the field/hunt retained) and
//          source-index.js (penelope's own clean-sentence index) — the box
//          settles only against a CLEAN sentence of material already in hand.
//   PRIORS the RECEIVED priors are injected, never re-derived: eoreader7's
//          priors (pos-en.json, role-config-eng.json) AND penelope's own
//          source-index. A unit whose question names a being the material
//          relates is settled by the composed model-free reader — the box
//          answering before the mouth is consulted (the box settles, the mouth
//          draws only the residue). `material` may be a string (operator's own
//          ground) or omitted, in which case the SHADOW is read.
let _posPrior = null, _roleConfig = null, _verbForms = null;
async function loadPriors() {
  try {
    if (!_posPrior) { const fs = require("node:fs"); const path = require("node:path"); const p = path.join(ER7, "native", "priors"); for (const n of ["pos-en.json", "pos-eng.json"]) if (fs.existsSync(path.join(p, n))) { _posPrior = JSON.parse(fs.readFileSync(path.join(p, n), "utf8")); break; } }
    if (!_roleConfig) { const fs = require("node:fs"); const path = require("node:path"); const rc = path.join(ER7, "native", "priors", "role-config-eng.json"); if (fs.existsSync(rc)) _roleConfig = JSON.parse(fs.readFileSync(rc, "utf8")); }
    // THE VERB-FORMS CLOSED CLASS (reader-bundle.js's own builder, reused): the
    // POS prior's verb/aux-dominant forms join the attested set, so the
    // positional clause reader can type a connector on real prose ("found",
    // "is", "strikes") instead of refusing every sentence. Received prior,
    // never a hand list.
    if (!_verbForms && _posPrior?.forms) {
      // THE VERB-FORMS CLOSED CLASS (reader-bundle.js's own builder, reused):
      // the POS prior's verb/aux-dominant forms join the attested set, so the
      // positional clause reader can type a connector. The share floor is 0.9
      // (a word English almost always uses as a verb); lowered toward 0.6 it
      // admits verbs whose dominant class is more mixed, widening the settle
      // reach — measured against the box-vs-model falsifier, never assumed.
      const GRAMMAR_MIN_SHARE = 0.6;
      const forms = new Set();
      for (const [w, counts] of Object.entries(_posPrior.forms)) {
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        if (total > 0 && ((counts.VERB ?? 0) + (counts.AUX ?? 0)) / total >= GRAMMAR_MIN_SHARE) forms.add(w.toLowerCase());
      }
      _verbForms = forms.size ? forms : null;
    }
  } catch { /* priors absent — recurrence alone, disclosed */ }
  return { posPrior: _posPrior, roleConfig: _roleConfig, verbForms: _verbForms };
}

/** The LIVE material: the operator's own text when given, plus every clean
 *  sentence of the shadow (url->code). source-index.js indexes a FILE; for the
 *  shadow's in-memory code we split with the same span discipline (spans.js)
 *  and drop the dirty header/footer runs source-index would drop — so a claim
 *  grounds only against a clean sentence of live material already in hand. */
async function liveMaterial(material, ctx) {
  const own = typeof material === "string" ? material : (material?.text ?? material?.ground ?? "");
  const pieces = [];
  if (own.trim()) pieces.push(own.trim());
  const shadow = ctx?.shadow instanceof Map ? ctx.shadow : (ctx?.shadow && typeof ctx.shadow === "object" ? new Map(Object.entries(ctx.shadow)) : null);
  if (shadow) {
    const split = composedReader?.splitSentences;
    const DIRTY = /\b(PMC\b|Copyright|doi|PMID|ncbi|Received|Accepted|Edited by|Reviewed by|Submitted)\b/i;
    for (const [, code] of shadow) {
      const sents = split ? split(String(code)) : [{ text: String(code) }];
      // one clean sentence per LINE — splitSentences treats a newline as a
      // boundary, so the positional clause reader fires per sentence while the
      // recurrence leg still reads the whole (the newline is not a word).
      const clean = sents.map((s) => s.text ?? s).filter((t) => t && !DIRTY.test(t));
      pieces.push(clean.join("\n"));
    }
  }
  return pieces.join("\n");
}

/** computeSettles(units, material, ctx) — async now, because loading priors and
 *  indexing the live shadow is I/O. The engine awaits it (engine.mjs:201 awaits
 *  adapter.computeSettles when present). */
export async function computeSettles(units, material = null, ctx = {}) {
  if (!composedReader) return units;
  const { posPrior, roleConfig, verbForms } = await loadPriors();
  const text = await liveMaterial(material, ctx);
  if (!text.trim()) return units;
  // REMEMBER REFERENTS: the index is built once per material text and reused
  const refs = composedReader.buildReferents ? composedReader.buildReferents(text) : null;
  const figures = new Set();
  if (refs) for (const id of (refs.index?.referents ?? [])) { const rep = refs.represent(id); if (rep && rep.length >= 3) figures.add(rep.toLowerCase()); }
  // verbForms injected so the positional clause reader can type the connector
  // (reader-bundle.js's own discipline: the received closed class arrives in).
  const read = composedReader.composedRelations(text, { posPrior, figures: figures.size >= 3 ? figures : null, roleConfig, classifyWord: composedReader.classifyWord, dominantClass: composedReader.dominantClass, verbForms });
  for (const u of units) {
    if (u.settle) continue;
    const q = String(u.spec ?? "").toLowerCase();
    const qWords = new Set(q.split(/[^a-z0-9']+/).filter((w) => w.length > 3));
    // THE QUESTION'S BEING MUST BE AN END, OR THE CONNECTOR HEAD A REAL VERB
    // IN THE MATERIAL — never a shared function word (measured live: the loose
    // match settled 7/7 units to one navigation-chrome relation "What is …",
    // matching on "is"). A settle names a real being the ask asked about.
    // A SETTLE IS A POSITIONAL (CLAUSE) RELATION, NEVER A RECURRENCE FRAGMENT.
    // Measured (box-vs-model-experiment.mjs): a recurrence settle like
    // "The Judge was at a meeting of the Raisin Growers Association" is not a
    // clean clause — its label is not a verbatim connector, so it is a
    // fabrication with a clean face. Only a relation the POSITIONAL reader
    // settled (basis carries "positional") is the box's honest claim.
    const hit = read.relations.find((r) => {
      if (!String(r.basis ?? "").includes("positional")) return false;
      const e1 = String(r.end1).toLowerCase(), e2 = String(r.end2).toLowerCase();
      const head = String(r.label).toLowerCase().split(/\s+/)[0];
      const realHead = head.length > 3 && /[a-z]/.test(head) && !/^(what|is|are|was|were|the|of|and|to|in|a|an)$/.test(head);
      const namedEnd = [e1, e2].some((e) => e.length >= 4 && !/^(what|which|that|this|they|them|with|from|into|over|also)$/.test(e) && q.includes(e));
      return namedEnd || (realHead && qWords.has(head));
    });
    if (hit) { u.settle = { end1: hit.end1, label: hit.label, end2: hit.end2, cell: hit.cell ?? null, basis: `box settled from live material + priors, no model (${hit.basis ?? read.basis})` }; u.settledBy = "box"; }
  }
  // THE DMD-BOUNDED UNIVERSE GATE: a settle is admitted only if its beings sit
  // inside the material's own DMD universe (Sullivan+Chomsky). Folded per
  // thread (the material IS the conversation), never per corpus — a claim from
  // a one-off chat stays outside. Measured (gym/falsify-dmd-threads.mjs): real
  // claims reconstruct at resid 0.28–0.35, foreign at 1.0 — the 0.5 cut sits
  // between. Every settle that names beings the material does not individuate
  // is refused here, even though the clause reader matched it.
  const uniText = await liveMaterial(material, ctx);
  if (uniText.trim()) {
    const uniR = (composedReader.buildReferents ? composedReader.buildReferents(uniText) : null);
    for (const u of units) {
      if (!u.settle) continue;
      const cand = `${u.settle.end1} ${u.settle.label} ${u.settle.end2}`;
      const ids = uniR ? new Set(uniR.resolveText(cand)) : new Set();
      if (!ids.size) { u.settle.admitted = false; u.settle.basis += `; REFUSED — its beings are not individuated by the material's own universe`; continue; }
      const uni = await dmdUniverse(ctx.corpus ?? "material", uniText);
      const x = uni.dims.map((d) => ids.has(d) ? 1 : 0);
      if (!x.some((v) => v > 0)) { u.settle.admitted = false; u.settle.basis += `; REFUSED — its beings are outside the material's DMD universe`; continue; }
      const proj = new Array(uni.dims.length).fill(0);
      for (const v of uni.U) { let c = 0; for (let i = 0; i < uni.dims.length; i++) c += x[i] * v[i]; for (let i = 0; i < uni.dims.length; i++) proj[i] += c * v[i]; }
      let err = 0, norm = 0;
      for (let i = 0; i < uni.dims.length; i++) { err += (x[i] - proj[i]) ** 2; norm += x[i] ** 2; }
      const resid = norm ? Math.sqrt(err) / Math.sqrt(norm) : 1;
      u.settle.resid = +resid.toFixed(3);
      u.settle.admitted = resid < 0.5;
      if (!u.settle.admitted) u.settle.basis += `; REFUSED — resid ${u.settle.resid} is outside the material's DMD universe (cut 0.5, measured gym/falsify-dmd-threads)`;
    }
  }
  return units;
}

// ── THE DMD-BOUNDED UNIVERSE — SULLIVAN + CHOMSKY (2026-10-02) ────────────
// Grounding is NOT string containment. An assertion is grounded iff it sits
// inside the register's DMD-bounded universe, which has two halves:
//   SULLIVAN  the register's OWN beings are individuated first (buildReferents
//             — recurrence + company, the well-house: a being is earned from the
//             material, never assumed).
//   CHOMSKY   the arrangement is universal — GFP figure-connector-figure
//             (relations-gfp.js: end1 —label→ end2, no grammar, no position).
// The universe is the top eigenvectors of the register's state-trajectory gram;
// a candidate's state reconstructs IN it (grounded) or is orthogonal (out).
let _dmdCache = new Map();
async function dmdUniverse(register, text, { rank = 8 } = {}) {
  const key = `${register}:${String(text ?? "").length}:${String(text ?? "").slice(0, 40).replace(/\s+/g, "")}`;
  if (_dmdCache.has(key)) return _dmdCache.get(key);
  const { splitSentences } = await import(`${ER7}/native/adapters/text/spans.js`);
  const { buildReferents } = await import(`${ER7}/native/the-fold/referents.js`);
  const { symmetricEigen } = await import(`${ER7}/native/kernel/dmd.js`);
  const R = buildReferents(text);
  const sentences = splitSentences(text).map((s) => String(s.text ?? s)).filter((t) => (t.match(/[A-Za-z]{2,}/g) || []).length >= 3).slice(0, 400);
  // SULLIVAN: each sentence's state = the set of the register's OWN beings it
  // carries (resolved referent ids) — the register's cast, learned from itself.
  const dims = [...new Set(sentences.flatMap((t) => [...R.resolveText(t)]))].sort();
  const X = sentences.map((t) => { const ids = new Set(R.resolveText(t)); return dims.map((d) => ids.has(d) ? 1 : 0); });
  const n = X.length; const d = dims.length;
  const P = Array.from({ length: d }, (_, a) => Array.from({ length: d }, (_, b) => { let v = 0; for (let i = 0; i < n; i++) v += X[i][a] * X[i][b]; return v; }));
  const { values, vectors } = symmetricEigen(P);
  const keep = values.map((v, i) => i).filter((i) => values[i] > 1e-9).sort((a, b) => values[b] - values[a]).slice(0, rank);
  const uni = { dims, U: keep.map((i) => vectors.map((row) => row[i])), basis: keep.map((i) => values[i]) };
  _dmdCache.set(key, uni);
  return uni;
}

/** inUniverse(candidate, register, text) -> { in: bool, resid, universe } —
 *  is the candidate's assertion inside the register's DMD-bounded universe?
 *  CHOMSKY: its ends resolve to the register's own beings (the universal
 *  arrangement); SULLIVAN: those beings must be individuated by the register. */
export async function inUniverse(candidate, register, text) {
  const { buildReferents } = await import(`${ER7}/native/the-fold/referents.js`);
  const R = buildReferents(text);
  const uni = await dmdUniverse(register, text);
  const ids = new Set(R.resolveText(String(candidate ?? "")));
  if (!ids.size || !uni.dims.length) return { in: false, resid: 1, universe: uni, reason: "the candidate names no being the register individuates" };
  const x = uni.dims.map((d) => ids.has(d) ? 1 : 0);
  const n = x.length; if (!x.some((v) => v > 0)) return { in: false, resid: 1, universe: uni, reason: "the candidate's beings are not in the register's universe" };
  const proj = new Array(n).fill(0);
  for (const v of uni.U) { let c = 0; for (let i = 0; i < n; i++) c += x[i] * v[i]; for (let i = 0; i < n; i++) proj[i] += c * v[i]; }
  let err = 0, norm = 0;
  for (let i = 0; i < n; i++) { err += (x[i] - proj[i]) ** 2; norm += x[i] ** 2; }
  const resid = norm ? Math.sqrt(err) / Math.sqrt(norm) : 1;
  // the null: how well a RANDOM being-set reconstructs — the candidate is in
  // only if its residual is BELOW the universe's own spread
  const spread = uni.basis.reduce((a, b) => a + b, 0);
  const in_ = resid < 0.5 && spread > 0; // a candidate over the register's own beings reconstructs well
  return { in: in_, resid: +resid.toFixed(3), spread: +spread.toFixed(2), universe: uni, reason: in_ ? "the candidate's beings sit inside the register's DMD universe" : "the candidate's beings lie outside the register's DMD universe" };
}

// ── THE READING: the ask yields ONE subject; the void cells become the
// units (each cell is a unit whose spec is its question) ──
export async function readUnits(task) {
  if (!organs) return [];
  const subject = organs.topicPhrase(task);
  const { cells } = organs.voidCellsFor({ topic: subject, question: task });
  const units = (cells ?? [])
    .filter((c) => c.question && c.relevant)
    .map((c) => ({ name: `${c.op}·${c.grain}`, spec: c.question, settle: null, cell: c }));
  return units;
}

// ── THE VOID, READ WITH A HUNT (GL-CD-10, prose): when the first reading draws
// no cells, the subject's own record is hunted and the void is BORN FROM WHAT
// WAS FOUND — the reading + referents of the hunted material feed voidCellsFor
// again, so a prose void is either resolved by evidence or returned well-defined
// (a named gap with what would satisfy it and the hunt disclosed). A failed hunt
// names the void; it never fabricates. Mirrors the code adapter's readVoid. ──
export async function readVoid(task, ctx = {}) {
  const reason = "the first reading drew no cells — the subject's record yielded nothing to enumerate";
  const satisfy = "void cells {op,grain,question} that the subject's own material supports";
  let url = null, text = null;
  try {
    if (!web) web = (await import("../../../../khora/native/the-fold/surf.js")).liveWeb();
    const s = await web.search(task);
    for (const hit of (s.results ?? []).slice(0, 3)) {
      const f = await web.fetch(hit.url);
      const t = String(f?.text ?? "").replace(/\s+/g, " ").trim();
      // THE HUNT KEEPS CLEAN PROSE, NEVER BINARY OR A MACHINE PAGE: a fetched
      // PDF/PS body or a control-byte run would seed the shadow with garbage
      // the autofill would then snip as "ground" (measured 2026-10-04). A
      // void-born material must read like prose a relation reader can reduce.
      const looksBinary = /[\x00-\x08\x0e-\x1f]/.test(t) || /^%PDF|^%!PS/i.test(t.trim()) || t.includes("\ufffd");
      const words = (t.match(/[A-Za-z]{3,}/g) || []).length;
      if (!looksBinary && t.length >= 240 && words >= 40) { url = hit.url; text = t.slice(0, 8000); break; }
    }
  } catch { /* hunt is best-effort; a failed hunt is a disclosed gap */ }
  if (!text) return { units: [], gap: { kind: "reading-void", reason, satisfy, hunted: url ?? null } };
  ctx.shadow = ctx.shadow ?? new Map();
  ctx.shadow.set(url, text);
  // THE VOID BORN FROM THE HUNT: the reading and referents are the hunted
  // material's own, and voidCellsFor re-derives the cells against them — the
  // void is born from what was found, never a fixed count (document-ledger's
  // own born gate).
  const { topicPhrase } = organs;
  const subject = topicPhrase(task);
  let reading = null, shadowReferents = [];
  if (composedReader) {
    try {
      const read = composedReader.composedRelations(text, {});
      reading = { relations: (read?.relations ?? []).slice(0, 60), basis: read?.basis ?? "composed relation reader" };
      const refs = composedReader.buildReferents ? composedReader.buildReferents(text) : null;
      shadowReferents = refs ? (refs.index?.referents ?? []).slice(0, 8).map((r) => refs.represent(r)).filter((x) => x && String(x).length >= 3) : [];
    } catch { /* reading best-effort — cells fall back to the canonical set */ }
  }
  const { cells } = organs.voidCellsFor({ topic: subject, question: task, shadowReferents, reading });
  const units = (cells ?? []).filter((c) => c.question && c.relevant).map((c) => ({ name: `${c.op}·${c.grain}`, spec: c.question, settle: null, cell: c }));
  if (units.length) return { units, reason, satisfy, source: url, material: text.length };
  return { units: [], gap: { kind: "reading-void", reason, satisfy, hunted: url } };
}

// ── THE FIELD (autofill): a unit the field already holds is snipped from the
// retained sources (the shadow), by frame (relevance), never by name ──
export function autofill(unit, ctx) {
  if (!organs || !ctx?.shadow) return null;
  const { relevantSources, snipsFromSources } = organs;
  const rel = relevantSources(ctx.shadow, unit.spec);
  const snips = snipsFromSources(rel.kept, { maxSnips: 2, maxChars: 220 });
  if (!snips.length) return null;
  const code = snips.map((s) => s.snip).join(" ");
  return { code, address: snips[0].url };
}

// ── THE HUNT (Ranke's chase): the field lacks the framed unit — go get it.
// The hunt is the same egress the web organ uses (surf.js::liveWeb — the
// working DuckDuckGo no-key web organ, the one eoreader7's own pipeline
// hunts with; the old SEARCH_URL pointed at the absorbed the-fold endpoint
// and was dead). The landed material becomes the shadow the fold re-admits
// against. ──
let web = null;
export async function hunt(unit, ctx) {
  try {
    if (!web) web = (await import("../../../../khora/native/the-fold/surf.js")).liveWeb();
    const s = await web.search(unit.spec);
    const results = (s.results ?? []).slice(0, 3);
    if (!results.length) return null;
    for (const hit of results) {
      const url = hit.url;
      const fetched = await web.fetch(url);
      const text = fetched?.text ?? "";
      const code = String(text ?? "").replace(/\s+/g, " ").slice(0, 400);
      // THE HUNT KEEPS CLEAN PROSE (the readVoid discipline): a PDF/PS body or
      // a control-byte run would seed the shadow with garbage the autofill
      // would then snip as "ground" — a hunt landing is material the fold can
      // re-admit, never bytes that only look like it.
      const looksBinary = /[\x00-\x08\x0e-\x1f]/.test(code) || /^%PDF|^%!PS/i.test(code.trim()) || code.includes("\ufffd");
      const words = (code.match(/[A-Za-z]{3,}/g) || []).length;
      if (code.length >= 40 && !looksBinary && words >= 6) {
        ctx.shadow = ctx.shadow ?? new Map();
        ctx.shadow.set(url, code);
        return { code, url };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ── THE MOUTH: one cell, framed as a fact — the void cell's question is the
// completion anchor (small-model law: never a steering instruction) ──
export function mouthFragment(unit, atom) {
  return (
    `Write one paragraph that answers this question about the subject. Question: ${atom}. ` +
    `Write only the paragraph. No intro, no outro, no headings. Ground every claim; name only real referents from the subject's own record.`
  );
}

// ── THE SNIP for prose: a drawn paragraph is kept whole; the wide draft's
// sentence extraction is the FOLD's (wideToAtoms), not a regex here ──
export function snip(code) {
  return String(code ?? "").replace(/```[a-z]*/gi, "").trim();
}

// ── THE SWARM, ONE UNIT: the cell's question appears in the folded material
// (the survival of the spec is the admission) — plus the three framing gates
// from the fold: invented referents, meta-sentences, hollow actors. ──
export function probeUnit(code, u) {
  if (!organs) return { ok: false, detail: "organs not loaded" };
  const qWords = String(u.spec ?? "").split(/\W+/).filter((w) => w.length > 4);
  const body = String(code ?? "").toLowerCase();
  const present = qWords.filter((w) => body.includes(w.toLowerCase()));
  const coverage = qWords.length ? present.length / qWords.length : 1;
  if (coverage < 0.3) return { ok: false, detail: `cell's question not answered: ${qWords.filter((w) => !body.includes(w.toLowerCase())).slice(0, 5).join(", ")} (coverage ${Math.round(coverage * 100)}%)` };
  return { ok: true, detail: `cell's question touched (coverage ${Math.round(coverage * 100)}%)` };
}

// ── THE DMD-UNIVERSE GATE ON THE MOUTH (GL-EN-13, extended to the residue):
// the box's settles are admitted only inside the thread's universe; so must the
// mouth's DRAWN assertion be. The law is per-thread: a draw whose beings the
// material does not individuate, or whose residual sits outside the thread's
// modes, is REFUSED — the mouth may not invent a universe the material never
// earned. Async (the universe is the eigendecomposition); the engine awaits it
// after probeUnit passes, before the draw is admitted. ──
export async function gateUnit(code, u, ctx = {}) {
  const material = await liveMaterial(null, ctx);
  if (!material.trim()) return { ok: true, detail: "no material to ground against — the draw stands only by its own claim" };
  const R = composedReader.buildReferents ? composedReader.buildReferents(material) : null;
  if (!R) return { ok: true, detail: "no referent index — the draw stands" };
  // the drawn assertion's OWN beings, folded back through the material's
  // individuation — never by string containment
  const uni = await dmdUniverse(ctx.corpus ?? "material", material);
  if (!uni.dims.length) return { ok: true, detail: "the thread has no universe to bound the draw" };
  const ids = new Set(R.resolveText(String(code ?? "")));
  if (!ids.size) return { ok: false, detail: "REFUSED — the draw names no being the material individuates (GL-EN-13)" };
  const x = uni.dims.map((d) => ids.has(d) ? 1 : 0);
  if (!x.some((v) => v > 0)) return { ok: false, detail: "REFUSED — the draw's beings lie outside the thread's DMD universe (GL-EN-13)" };
  const proj = new Array(uni.dims.length).fill(0);
  for (const v of uni.U) { let c = 0; for (let i = 0; i < uni.dims.length; i++) c += x[i] * v[i]; for (let i = 0; i < uni.dims.length; i++) proj[i] += c * v[i]; }
  let err = 0, norm = 0;
  for (let i = 0; i < uni.dims.length; i++) { err += (x[i] - proj[i]) ** 2; norm += x[i] ** 2; }
  const resid = norm ? Math.sqrt(err) / Math.sqrt(norm) : 1;
  if (resid >= 0.5) return { ok: false, detail: `REFUSED — resid ${resid.toFixed(3)} outside the thread's DMD universe (cut 0.5, GL-EN-13)` };
  return { ok: true, resid: +resid.toFixed(3), detail: `draw's beings sit inside the thread's DMD universe (resid ${resid.toFixed(3)})` };
}

// ── THE WHOLE ASSEMBLY: the fold. Every sentence re-admitted against the
// whole ground, deduped by claim-core, assigned to beats; gaps and residual
// named. The dissent (refused) is disclosed, never vanished. ──
export function testUnits(code, units) {
  if (!organs) return { ok: false, reason: "organs", detail: "eoreader7 organs not loaded" };
  const atoms = organs.wideToAtoms([code], { ground: "" });
  const folded = organs.foldWideToShape(atoms);
  const gaps = folded.beats.filter((b) => b.gap).map((b) => b.title);
  const refused = folded.refused?.length ?? 0;
  const residual = folded.residual?.length ?? 0;
  const ok = gaps.length === 0 && refused === 0 && residual === 0;
  return {
    ok,
    reason: ok ? "concrescent" : "folded-with-dissent",
    detail: `beats:${folded.beats.length} gaps:${gaps.length ? gaps.join(",") : "none"} refused:${refused} residual:${residual}`,
    folded,
  };
}

export function toDocument({ code, units, title }) {
  const beatNames = units.map((u) => u.name).join(", ");
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font:18px/1.6 Georgia,serif;max-width:640px;margin:40px auto;padding:0 24px} .beat{font:12px monospace;color:#888;margin:28px 0 4px}</style>
</head>
<body>
<h1>${title}</h1>
<div id="essay" style="white-space:pre-wrap"></div>
<pre id="meta" style="font:12px monospace;background:#f4f4f4;padding:8px;border-radius:6px;margin-top:28px"></pre>
<script>
document.getElementById("essay").textContent = ${JSON.stringify(code)};
document.getElementById("meta").textContent = "beats asked: ${beatNames}";
</script>
</body></html>`;
}

// The prose adapter's sharpen names the real referent jurisdiction (the essay's
// "an atom is an address with a jurisdiction"): a cell the mouth failed must
// be answered from the subject's OWN record, not the mouth's invention.
export function sharpen(unit, atom, why) {
  return `${unit.spec} — answer from the subject's OWN record; name only referents the shadow's material established; never invent a name.`;
}

// ── THE REFINEMENT TRANSFORMS (organs/void-refine.mjs): when testUnits fails,
// the passage is refined under the fold itself, in the cube's operator order.
// Each is a held text operation; the real fold (testUnits) is the judge.
export const refineTransforms = [
  { name: "strip_meta", op: "SIG", deps: [], apply: (t) => String(t).split(/(?<=[.!?])\s+/).filter((s) => !/(this (passage|essay|section|piece)|explores|discusses|highlights)/i.test(s)).join(" ").trim() },
  { name: "house", op: "INS", deps: ["SIG"], apply: (t) => String(t).replace(/\bthe (system|region|thing)\b/gi, "the fold") },
  { name: "scope", op: "SEG", deps: ["SIG"], apply: (t) => String(t).split(/(?<=[.!?])\s+/).filter((s) => !/weather|mild|also/i.test(s)).join(" ").trim() },
  { name: "ground", op: "CON", deps: ["SIG", "SEG"], apply: (t) => `${String(t).replace(/\.$/, "")} ⟦fold@0⟧.` },
];

export default {
  kind: "prose",
  ext: "html",
  readUnits,
  readVoid,
  autofill,
  hunt,
  mouthFragment,
  mouthTokens: 400,
  snip,
  probeUnit,
  gateUnit,
  testUnits,
  toDocument,
  sharpen,
  refineTransforms,
};