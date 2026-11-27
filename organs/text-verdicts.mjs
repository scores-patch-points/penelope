// organs/text-verdicts.mjs — Penelope's verdicts on khora's NOMINATIONS about a text: is this span a quotation (DEF), is this frame reported speech (EVA), revised (REC).
// Handle: Penelope. Contract (HANDOFF "The reading is stored in the pharos", owner 2026-11-26): khora OBSERVES and writes `text-quotes` (SEG·Figure) and `text-frames` (CON·Figure) plus the
// `text-codec` that framed them (SIG·Pattern); it never defines. She reads those three BY KIND, never by author, and writes two kinds that khora reads back (the-fold/pharos-verdicts.mjs):
//
//   kind           cell        addr                        body                                                  of
//   quote-verdict  DEF·Figure  quotes:<sha16>#<index>      { index, quotation: true, schema, rule, codec }       [the text-quotes entry]
//   frame-verdict  EVA·Figure  frames:<sha16>#<index>      { index, reported: true|false, schema, rule, basis }  [the text-frames entry]
//
// (frame-verdict keeps the cell organs/frame-verdicts.mjs already declares for that kind; the two bodies are told apart by `schema`, and the addresses by the `#<index>` suffix.)
// A revision (REC) is a NEWER entry of the same kind at the same address, `basis.revises` naming the one it replaces (pharos fixes a kind's cell, so REC is a role, not a cell, here).
// A verdict that no longer holds is RETRACTED (weave-mark `unweave`), never erased. A nomination she cannot judge gets NO verdict: khora reads "no verdict" as unknown (null), never false.
//
// THE RULES (stated so they can be falsified; no number is hand-set, no model is called, no text is read: only fields of the three entries):
//   QR1  span i of a text-quotes entry is a QUOTATION (true) iff ALL hold:
//          (a) the entry has a table and no gaps; (b) the text-codec entry of the same text exists and `agrees === true` (the codec the surprise fold FOUND is the one the read RAN UNDER, so the
//          table framing the spans is corroborated by a witness independent of the marks); (c) the codec's table is the table the spans were made under; (d) the span is well formed (integer
//          open < close, integer depth >= 0). Otherwise NO verdict, with the reason (`codec_disagrees` is the EVALUATION: declared eng, found pcm). QR1 never says false: nothing in the three
//          entries is evidence that a marked span is NOT a quotation, so "false" is a typed gap, not a verdict.
//   FR1  frame i of a text-frames entry is reported speech (true) or not (false) iff the nomination says true|false AND khora's own cross-check shows the two independent detectors (the
//          speech-verb layer and the clause tree) found exactly the same sentences: crossCheck.onlyLayer === 0 and onlyTree === 0 (counts of two sets, so equal counts of difference = equal sets).
//          The verdict is then the nomination's value, now corroborated. A null nomination (an ablated or gapped layer) gets no verdict. If the detectors differ, NO frame is judged and the
//          disagreement is the EVALUATION (`detectors_disagree`, with the counts): the counts do not say which sentences differ, so no frame can be told apart.
//   A verdict agrees with the nomination wherever it is given; it adds corroboration (the basis says what), never a new reading. Falsifier: a text where QR1 or FR1 gives a verdict and a
//   hand-checked span or frame differs. NOT MEASURED: no gold exists in the three entries or was made for this change; the tests below pin the rule's behaviour, not its accuracy.
//
// PURE: no imports, no clock, no log access, no text read. gym/text-verdicts-run.mjs does the log; marksFor() builds marks for her own door (organs/weave-mark.mjs).

export const TEXT_VERDICT_SCHEMA = "TextVerdict@1";
export const QUOTE_VERDICT = "quote-verdict", FRAME_VERDICT = "frame-verdict";
export const KINDS = Object.freeze({
  [QUOTE_VERDICT]: { cell: "DEF·Figure", why: "whether a span khora nominated as a quotation IS one, under rule QR1: defined only where the codec the surprise fold found is the codec the read ran under; never false, only true or no verdict" },
  [FRAME_VERDICT]: { cell: "EVA·Figure", why: "whether a frame khora nominated as reported speech IS, under rule FR1: judged only where the speech-verb layer and the clause tree found the same sentences; no verdict where they differ" },
});
export const READS = Object.freeze({ codec: "text-codec", quotes: "text-quotes", frames: "text-frames" });

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const canon = (v) => JSON.stringify(v, (_, x) => (isObj(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));
/** The sha16 an address carries: `quotes:<sha16>`, `frames:<sha16>`, `codec:<sha16>` -> sha16. Null for any other shape. */
export const shaOf = (addr, prefix) => (typeof addr === "string" && addr.startsWith(`${prefix}:`) && addr.length > prefix.length + 1 && !addr.includes("#") ? addr.slice(prefix.length + 1) : null);
export const verdictAddr = (prefix, sha, index) => `${prefix}:${sha}#${index}`;

const none = (gap, why, extra = {}) => ({ verdicts: [], abstained: true, evaluation: { gap, why, ...extra } });

/** judgeQuotes({ quotes, codec }) -> { verdicts: [{ index, quotation: true }], abstained, evaluation: { gap, why, ... } | null, rule: "QR1" }. quotes, codec: the BODIES of the text-quotes and text-codec entries of one text. */
export function judgeQuotes({ quotes, codec } = {}) {
  const r = (x) => ({ rule: "QR1", ...x });
  if (!isObj(quotes)) return r(none("no_nomination", "no text-quotes entry"));
  if (!isObj(quotes.table) || (quotes.gaps ?? []).length) return r(none("quote_layer_gap", "the nomination has no table or carries gaps", { gaps: quotes.gaps ?? [] }));
  if (!isObj(codec)) return r(none("no_codec_entry", "no text-codec entry for this text: the table is uncorroborated"));
  if (codec.agrees === false) return r(none("codec_disagrees", `the read ran under ${codec.declared ?? "?"} but the surprise fold found ${codec.chosen ?? "?"}: the table framing the spans is contested`, { declared: codec.declared ?? null, chosen: codec.chosen ?? null, pOwn: codec.pOwn ?? null }));
  if (codec.agrees !== true) return r(none("codec_not_found", "the surprise fold found no codec to corroborate the declared one", { declared: codec.declared ?? null, codecGap: codec.gap ?? null }));
  if (!isObj(codec.quotes?.table) || canon(codec.quotes.table) !== canon(quotes.table)) return r(none("table_not_the_codecs", "the spans were made under a table other than the one the codec entry records"));
  const verdicts = [], skipped = [];
  (quotes.spans ?? []).forEach((s, index) => {
    const ok = isObj(s) && Number.isInteger(s.open) && Number.isInteger(s.close) && s.open < s.close && Number.isInteger(s.depth) && s.depth >= 0;
    if (ok) verdicts.push({ index, quotation: true, codec: { declared: codec.declared, chosen: codec.chosen, agrees: true, source: codec.quotes.source ?? null } });
    else skipped.push(index);
  });
  return r({ verdicts, abstained: !verdicts.length, evaluation: skipped.length ? { gap: "span_malformed", why: "a span with no integer open < close and depth >= 0 is not judged", indexes: skipped } : null });
}

/** judgeFrames({ frames }) -> { verdicts: [{ index, reported: true|false, basis }], abstained, evaluation, rule: "FR1" }. frames: the BODY of the text-frames entry. */
export function judgeFrames({ frames } = {}) {
  const r = (x) => ({ rule: "FR1", ...x });
  if (!isObj(frames) || !Array.isArray(frames.frames)) return r(none("no_nomination", "no text-frames entry"));
  const cc = frames.crossCheck;
  if (!isObj(cc) || !Number.isInteger(cc.onlyLayer) || !Number.isInteger(cc.onlyTree) || !Number.isInteger(cc.both)) return r(none("no_cross_check", "the nomination carries no cross-check of its two detectors: nothing corroborates it"));
  if (cc.onlyLayer !== 0 || cc.onlyTree !== 0) return r(none("detectors_disagree", "the speech-verb layer and the clause tree found different sentences of reported speech; the counts do not say which frames differ", { both: cc.both, onlyLayer: cc.onlyLayer, onlyTree: cc.onlyTree }));
  const basis = { both: cc.both, onlyLayer: cc.onlyLayer, onlyTree: cc.onlyTree };
  const verdicts = [];
  frames.frames.forEach((f, index) => { if (isObj(f) && (f.reported === true || f.reported === false)) verdicts.push({ index, reported: f.reported, basis }); });
  return r({ verdicts, abstained: !verdicts.length, evaluation: verdicts.length < frames.frames.length ? { gap: "frame_unknown", why: "a frame whose nomination is null (a layer ablated or gapped) is not judged", indexes: frames.frames.map((f, i) => i).filter((i) => !verdicts.some((v) => v.index === i)) } : null });
}

/** The body of one verdict entry, in the shape khora reads (pharos-verdicts.mjs): { index, quotation } or { index, reported }. */
export const quoteBody = (v, rule = "QR1") => ({ index: v.index, quotation: v.quotation, schema: TEXT_VERDICT_SCHEMA, rule, codec: v.codec });
export const frameBody = (v, rule = "FR1") => ({ index: v.index, reported: v.reported, schema: TEXT_VERDICT_SCHEMA, rule, basis: v.basis });
export const sameBody = (a, b) => canon(a) === canon(b);

/** marksFor({ kind, sha, nominationId, verdicts, log, by, revises }) -> WeaveMark@1 marks for organs/weave-mark.mjs, one per verdict. revises: Map index -> the entry id an older verdict at that address has (REC). */
export function marksFor({ kind, sha, nominationId, verdicts, log, by = "penelope.text", revises = new Map() } = {}) {
  const spec = KINDS[kind];
  if (!spec || !sha || !nominationId || !log) return [];
  const prefix = kind === QUOTE_VERDICT ? "quotes" : "frames";
  const how = "computed from the fields of the entries named in `of` (and the text-codec entry of the same text), read from the log by kind; no text read, no model called";
  return verdicts.map((v) => ({ by, log, kind, cell: spec.cell, addr: verdictAddr(prefix, sha, v.index), body: kind === QUOTE_VERDICT ? quoteBody(v) : frameBody(v), of: [nominationId],
    basis: { schema: TEXT_VERDICT_SCHEMA, rule: kind === QUOTE_VERDICT ? "QR1" : "FR1", ...(revises.has(v.index) ? { revises: revises.get(v.index), role: "REC" } : {}) }, witness: { how }, declare: { why: spec.why } }));
}
