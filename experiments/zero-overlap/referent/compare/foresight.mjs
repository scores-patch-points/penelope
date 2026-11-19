// foresight.mjs — the foresight gate for revisions: does the identity event a revision rests on REDUCE SURPRISE in the text it has not seen?
// Defined in the style of khora's identity/novels/competence-core.mjs (round 8): a reader predicts each mention event before it happens; surprise = -log2 of that prediction;
// a "thought" (here: a witnessed identity event) changes which symbol a mention is coded as; HINDSIGHT = the surprise it removes at or before the cut, FORESIGHT = the surprise it removes AFTER the cut.
// The reader (declared, not tuned; the constants are khora's): P(symbol) = pi_new if unseen, else (1 - pi_new) * (0.5 * presence share + 0.5 * frequency), pi_new = (births + 1) / (N + 2),
// presence = counts decayed by gamma^(sentences elapsed), gamma = 1 - 1/window, window 4 (kernel/activation.js gammaFor).
// ADMISSION (a robust unit, never a typed margin): foresight > 0 AND foresight > median(null) + 1.4826 * MAD(null), the null being the foresight of RANDOM merges of the same kind between
// other beings of the same document over the same cut; at least NULLMIN null draws and LATERMIN later mentions or the gate says so, typed, and admits nothing.
import { makeSame, norm } from "./compare.mjs";
import { identityAt, docRegistry } from "./log.mjs";
const KH = process.env.KHORA_HOME ?? "/Users/mlacy/Documents/khora-cast/khora";
process.env.KHORA_PRIORS_DIR ||= `${process.env.HOME}/Documents/janus/priors`;
const { readDocument } = await import(`${KH}/native/reading.js`);
const { gammaFor } = await import(`${KH}/native/kernel/activation.js`);
export const WINDOW = 4, G = gammaFor(WINDOW), NULLMIN = 30, LATERMIN = 3, NULLDRAWS = 120;
const L2 = Math.log2;
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : 0; };
export const robustUnit = (a) => { const m = median(a); return 1.4826 * median(a.map((x) => Math.abs(x - m))); };

/** the mention stream of a document: every mention of every referent the reader built, in text order, with its sentence index */
const STREAMS = new Map();
export async function streamOf(doc) {
  if (STREAMS.has(doc.text)) return STREAMS.get(doc.text);
  const e = await readDocument(doc.text, { language: "eng", lexicon: false, referents: true, castIdentity: true, minCharacters: 0 });
  const spans = new Map((e.referents?.spans ?? []).map((s) => [s.id, s])), events = [];
  for (const r of e.referents?.referents ?? []) {
    const ms = (r.mentions ?? []).map((id) => spans.get(id)).filter(Boolean), tally = new Map();
    for (const m of ms) { const w = doc.text.slice(m.at[0], m.at[1]); tally.set(w, (tally.get(w) ?? 0) + 1); }
    const face = [...tally].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0]?.[0] ?? r.face;     // the spelling actually written, case kept (the reader's own face may be a lowercased form)
    for (const m of ms) events.push({ pos: m.at[0], end: m.at[1], face });
  }
  events.sort((a, b) => a.pos - b.pos);
  const bounds = [...doc.text.matchAll(/[.!?]["')\]]*\s+/g)].map((m) => m.index + m[0].length);
  for (const ev of events) { let k = 0; while (k < bounds.length && bounds[k] <= ev.pos) k++; ev.t = k; }
  STREAMS.set(doc.text, events); return events;
}
/** the symbol each face is coded as under an identity: faces the identity calls the same share one symbol (union-find, keyed by the smallest face) */
export function symbolizer(faces, identity) {
  const same = makeSame(identity), F = [...new Set(faces)], parent = new Map(F.map((f) => [f, f]));
  const find = (x) => { while (parent.get(x) !== x) x = parent.get(x); return x; };
  for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) if (same(F[i], F[j])) { const a = find(F[i]), b = find(F[j]); if (a !== b) parent.set(a > b ? a : b, a > b ? b : a); }
  return (f) => find(f);
}
/** prequential surprise (bits) of each event under a coding of faces into symbols */
export function surpriseBits(events, symOf) {
  const pres = new Map(), n = new Map(); let Ntot = 0, births = 0; const bits = new Float64Array(events.length);
  const live = (s, t) => { const c = pres.get(s); return c ? c.v * G ** (t - c.t) : 0; };
  events.forEach((e, k) => {
    const s = symOf(e.face), t = e.t; let Zp = 0; for (const x of pres.keys()) Zp += live(x, t);
    const piNew = (births + 1) / (Ntot + 2); let P;
    if (!((n.get(s) ?? 0) > 0)) P = piNew; else { const freq = n.get(s) / Ntot, share = Zp > 0 ? live(s, t) / Zp : 0; P = (1 - piNew) * (Zp > 0 ? 0.5 * share + 0.5 * freq : freq); }
    bits[k] = -L2(Math.max(P, 1e-12)); if (!n.has(s)) births++; n.set(s, (n.get(s) ?? 0) + 1); Ntot++; pres.set(s, { v: live(s, t) + 1, t });
  });
  return bits;
}
/** hindsight (at or before the cut) and foresight (after the cut) of moving from identity0 to identity1 */
export function effect(events, cut, id0, id1) {
  const faces = events.map((e) => e.face), b0 = surpriseBits(events, symbolizer(faces, id0)), b1 = surpriseBits(events, symbolizer(faces, id1));
  let hind = 0, fore = 0, later = 0; events.forEach((e, k) => { const d = b0[k] - b1[k]; if (e.pos <= cut) hind += d; else { fore += d; later++; } });
  return { hindsight: hind, foresight: fore, later };
}
/** the gate for one identity event: foresight on the documents of the revision's two statements, against a null of random merges over the same cuts */
export function makeForesight(log, eventIndex, docs, { seed = 20261119, draws = NULLDRAWS } = {}) {
  const ev = log.entries[eventIndex], id0 = identityAt(log, eventIndex), id1 = identityAt(log, eventIndex + 1), reg = docRegistry(docs);
  return async (rev) => {
    if (ev.kind !== "merge") return { bits: 0, nullMean: 0, gap: "foresight_defined_for_merge_only", detail: "a cannot-link has no foresight measure yet" };
    const verdict = log.entries.find((e) => e.id === rev.body.of); const parts = [];
    for (const side of ["A", "B"]) { const w = verdict.body.witnesses[side], d = reg.get(w.doc); if (d && !parts.some((p) => p.d === d)) parts.push({ d, w }); }
    if (!parts.length) return { bits: 0, nullMean: 0, gap: "document_not_found" };
    const rng = mulberry(seed); let bits = 0, later = 0, used = 0; const nullSums = Array.from({ length: draws }, () => 0), skipped = [];
    for (const { d, w } of parts) {                                              // a document with too little material is skipped for the real score AND the null alike
      const events = await streamOf(d), cut = Buffer.from(d.text, "utf8").subarray(0, w.b1).toString("utf8").length, faces = [...new Set(events.map((e) => e.face))];
      const real = effect(events, cut, id0, id1), alias = makeSame({ merges: [], aparts: [] });
      const same0 = makeSame(id0), pairs = []; for (let i = 0; i < faces.length; i++) for (let j = i + 1; j < faces.length; j++) if (!same0(faces[i], faces[j]) && !(ev.body.touched ?? []).some((t) => alias(t, faces[i]) || alias(t, faces[j]))) pairs.push([faces[i], faces[j]]);
      if (real.later < LATERMIN) { skipped.push(`${d.id}: ${real.later} later mentions, at least ${LATERMIN} needed`); continue; }
      if (pairs.length < NULLMIN) { skipped.push(`${d.id}: ${pairs.length} candidate random merges, at least ${NULLMIN} needed`); continue; }
      bits += real.foresight; later += real.later; used++;
      for (let k = 0; k < draws; k++) { const [x, y] = pairs[Math.floor(rng() * pairs.length)]; nullSums[k] += effect(events, cut, id0, { merges: [...id0.merges, [x, y]], aparts: id0.aparts }).foresight; }
    }
    if (!used) return { bits: 0, nullMean: 0, gap: "no_foresight_material", detail: skipped.join("; ") };
    const med = median(nullSums), unit = robustUnit(nullSums), threshold = med + unit, rank = nullSums.filter((x) => x <= bits).length / nullSums.length;
    return { bits, nullMean: threshold, nullMedian: med, nullUnit: unit, rank, later, draws: nullSums.length, documents: used, skipped };
  };
}
