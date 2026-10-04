// organs/source-index.mjs — the CLEAN source index (2026-10-01).
//
// The box grounds claims against a source's CLEAN sentences only. A raw web
// extraction carries header/footer runs (PMC copyright, the abstract, the
// references) that made the first grounding dirty — the box correctly refused
// them. This organ splits a source into sentences with true byte addresses and
// marks the dirty ones (header/footer/reference runs), so the box grounds a
// claim only against a clean sentence, and a claim with no clean match is
// censored, never dressed on a dirty run.
//
// PURE (node builtins). Selftest:
//   node --input-type=module -e "import('./organs/source-index.mjs').then(m=>m.selftest())"
import fs from "node:fs";

export const SRC_SCHEMA = "SourceIndex@1";
const DIRTY = /\b(PMC\b|Copyright|Abstract|doi|PMID|ncbi|journal|Received|Accepted|Edited by|Reviewed by|Submitted)\b/i;
const ABBR = /(?:Theaet|Theaetetus|Dr|Mr|Mrs|Ms|St|Vol|vol|Fig|fig|e\.g|i\.e|etc|vs|No|approx)\.$/i;
const isEnd = (s, k) => {
  if (k >= s.length) return false;
  const ch = s[k];
  if (ch !== "." && ch !== "!" && ch !== "?") return false;
  if (ABBR.test(s.slice(Math.max(0, k - 12), k + 1))) return false;
  let j = k + 1;
  while (j < s.length && /\s/.test(s[j])) j++;
  if (j >= s.length) return true;
  return /[A-Z"']/.test(s[j]) || s[j] === "\n";
};

/** Index a source: every clean sentence with its TRUE byte address. Dirty
 *  sentences (header/footer/reference runs) are excluded from grounding — the
 *  box never dresses a claim on a dirty run. */
export function indexSource(file, { minWords = 5 } = {}) {
  let src;
  try { src = fs.readFileSync(file, "utf8"); } catch (e) { return { ok: false, gap: { kind: "source_unreadable", error: e.message } }; }
  const enc = new TextEncoder();
  const sentences = [];
  let start = 0, i = 0;
  const n = src.length;
  while (i < n) {
    if (isEnd(src, i)) {
      const sentence = src.slice(start, i + 1).replace(/\s+/g, " ").trim();
      const clean = !DIRTY.test(sentence) && sentence.split(/\s+/).length >= minWords;
      if (clean) sentences.push({ text: sentence, abs: enc.encode(src.slice(0, start)).length, len: enc.encode(sentence).length, clean: true });
      i += 1;
      start = i;
      while (i < n && /\s/.test(src[i])) i += 1; // skip the gap
      start = i;
      continue;
    }
    i += 1;
  }
  return { ok: true, schema: SRC_SCHEMA, source: file, sentences };
}

/** Find the clean sentence a claim's verbatim fragment lives in — the box's
 *  grounding lookup. Returns { ok, sentence, abs } or { ok:false } (censor). */
export function findClean(index, phrase) {
  if (!index?.ok) return { ok: false };
  const frag = String(phrase).split(/\s+/).slice(0, 6).join(" ");
  const lf = frag.toLowerCase();
  for (const s of index.sentences) {
    if (s.clean && s.text.toLowerCase().includes(lf)) return { ok: true, sentence: s.text, abs: s.abs, len: s.len };
  }
  return { ok: false };
}

export function selftest() {
  const t = (n, c) => { if (!c) { console.error("FAIL", n); process.exitCode = 1; } else console.log("ok", n); };
  const REP = "/Users/mlacy/Documents/3.0/ethos/01-literature-books/gutenberg/pg55201_The_Republic_by_Plato.txt";
  const idx = indexSource(REP);
  t("the Republic indexes clean sentences with byte addresses", idx.ok && idx.sentences.length > 50 && idx.sentences.some((s) => s.abs > 0));
  t("the waxen-tablet sentence is a clean sentence, byte-addressed", idx.sentences.some((s) => s.text.includes("waxen tablet of the memory") && s.clean));
  t("findClean locates a claim's fragment", (() => { const f = findClean(idx, "The waxen tablet of the memory"); return f.ok && f.sentence.includes("waxen tablet"); })());
  t("a claim with no clean match is censored, never dressed", !findClean(idx, "single neurons within the PFC maintain representations of task").ok);
  t("dirty header runs are excluded from the index", !idx.sentences.some((s) => /Copyright|PMC\b/.test(s.text)));
}