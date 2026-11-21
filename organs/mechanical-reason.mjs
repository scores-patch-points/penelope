// mechanical-reason.mjs — penelope reasons on the EOT cell layer, not on surface strings.
// Read any text through the khora (kernel-reach), flow it down to the meaning layer (toEot),
// and reason on the marks: the cube cells every dependency relation maps to, the kāraka arcs,
// the polarity. This is the "one river" made mechanical — a translation converges on the same
// cells (GL-CO-10, KL 0.0125 vs 0.1506 unrelated), so equivalence is a distance on cells,
// not a match on words.
//
// PURE in its reasoning (no model, no clock); it reaches the khora reader only to READ.
import { kernelImportOr } from "./kernel-reach.mjs";

const readModule = () => kernelImportOr("khora", "native/reading-one.mjs");
const eotModule = () => kernelImportOr("khora", "native/kernel/eot-rich.js");

/** Read a text and flow it to the meaning layer: the EOT arc cells (language-independent). */
export async function cellsOf(text, { language = "en", allowDegraded = true } = {}) {
  const R = await readModule(); if (!R) return { gap: "khora-absent", cells: {} };
  const E = await eotModule(); if (!E) return { gap: "eot-absent", cells: {} };
  const r = await R.read(String(text), { rows: true, allowDegraded, language });
  const counts = {};
  for (const p of r.parse ?? []) {
    const sent = { tokens: p.rows.map((x) => ({ id: x.id, form: x.form, lemma: x.lemma ?? x.form, upos: x.upos, feats: x.feats ?? "_", head: x.head, deprel: x.deprel })), sentId: String(p.order), text: p.text, lines: [p.text] };
    let rec; try { rec = E.toEot(sent, { language }); } catch { continue; }
    for (const a of rec.meaning.arcs) { const c = a.cell ?? ("rel:" + a.rel.split(":")[0]); counts[c] = (counts[c] ?? 0) + 1; }
  }
  return { language, cells: counts, gap: null };
}

/** Symmetric KL divergence between two cell distributions — the distance on the river. */
export function cellDistance(a, b) {
  const A = a.cells ?? a, B = b.cells ?? b;
  const kl = (p, q) => { let s = 0; let np = 0, nq = 0; for (const k in p) np += p[k]; for (const k in q) nq += q[k]; if (!np || !nq) return Infinity;
    // p=0 contributes nothing; q=0 is maximally surprising (epsilon), so identical is 0 and
    // disjoint is large, symmetric in p and q.
    for (const k of new Set([...Object.keys(p), ...Object.keys(q)])) { const pp = (p[k] ?? 0) / np; if (pp === 0) continue; const qq = (q[k] ?? 0) / nq || 1e-9; s += pp * Math.log(pp / qq); } return s; };
  return (kl(A, B) + kl(B, A)) / 2;
}

/** Equivalence: two texts are the same meaning iff their cell distance is below a threshold.
 *  The threshold is a DMD — the distance that makes a difference. Default: the measured
 *  translation gap (GL-CO-10) versus unrelated, with headroom. */
export async function equivalence(a, b, { language = "en", threshold = 0.05 } = {}) {
  const A = await cellsOf(a, { language }), B = await cellsOf(b, { language });
  if (A.gap) return { verdict: "undecided", why: A.gap };
  if (B.gap) return { verdict: "undecided", why: B.gap };
  const d = cellDistance(A, B);
  return { verdict: d < threshold ? "same" : "different", distance: +d.toFixed(4), threshold, cellsA: Object.keys(A.cells).length, cellsB: Object.keys(B.cells).length };
}

/** The relation triples: who does what to whom, from the parse's kāraka arcs.
 *  Each is { agent?, relation, patient? } where relation is the head verb's lemma. */
export async function relationsOf(text, { language = "en" } = {}) {
  const R = await readModule(); if (!R) return { gap: "khora-absent", relations: [] };
  const r = await R.read(String(text), { rows: true, allowDegraded: true, language });
  const out = [];
  for (const p of r.parse ?? []) {
    const rows = p.rows;
    const root = rows.find((x) => x.head === 0 && x.upos !== "PUNCT");
    if (!root) continue;
    const kartṛ = rows.filter((x) => x.karaka === "kartṛ").map((x) => x.lemma ?? x.form);
    const karman = rows.filter((x) => x.karaka === "karman").map((x) => x.lemma ?? x.form);
    out.push({ predicate: root.lemma ?? root.form, agents: kartṛ, patients: karman });
  }
  return { gap: null, relations: out };
}

/** A stop for the equivalence judge (organs/equivalence.mjs): the four-valued verdict
 *  at the "cells" rung, produced mechanically from the EOT cell distance. */
export async function cellStop(a, b, { language = "en", threshold = 0.05 } = {}) {
  const e = await equivalence(a, b, { language, threshold });
  if (e.verdict === "undecided") return { error: e.why };
  return { verdict4: { value: e.verdict === "same" ? "is" : "is-not", unsaid: false }, distance: e.distance, rung: "cells" };
}
