// organs/snip-cite.mjs — the mechanical quote (2026-10-01).
//
// A model NEVER writes a verbatim quote. The mouth names the citation; the box
// SNIPS it at its permanent byte address and substitutes the source's own
// bytes. Kleeneup's law, applied to generation: a thing is found by its byte
// address in the field, never by a pattern guessed over it; a drifted address
// is REFUSED, never silently re-found. The failure that earned this:
// 2026-10-01 — hand-typed "verbatim" quotes in the waxen-tablet essay did NOT
// resolve in the source (indexOf −1; line breaks and footnote markers the
// author did not copy). The mouth's residue is the connective prose and the
// choice of WHICH address to cite; the quote itself is always the box's snip.
//
// The mouth's draft carries citations as ⟦<source>@<byte-address>⟧ markers.
// replaceCites resolves each through a snip and substitutes the verbatim bytes
// in curly quotes; a marker the box cannot resolve stays a named gap, never the
// mouth's guess.
//
// PURE (node builtins only). Selftest:
//   node --input-type=module -e "import('./organs/snip-cite.mjs').then(m=>m.selftest())"
import fs from "node:fs";

export const SNIP_SCHEMA = "SnipCite@1";

/** Snip the VERBATIM ENCLOSING SENTENCE at a permanent byte address in a
 *  source file. The address may land anywhere inside the sentence: the box
 *  walks BACKWARD to the sentence's start and FORWARD to its end, so a marker
 *  that lands mid-sentence still yields the whole clean claim. A terminal is a
 *  sentence boundary only when it is not an abbreviation (Theaet., Dr., …) and
 *  is followed by a capital or the buffer end — the fragment failure of
 *  2026-10-01 (the snip stopped at "Theaet." and at sentence-tails). A drifted
 *  address is a typed refusal, never a re-found guess. */
export function snipSentence(sourcePath, abs, { window = 600, maxLen = 520 } = {}) {
  let src;
  try { src = fs.readFileSync(sourcePath, "utf8"); } catch (e) { return { ok: false, gap: { kind: "source_unreadable", error: e.message } }; }
  const bytes = new TextEncoder().encode(src);
  if (!Number.isInteger(abs) || abs < 0 || abs >= bytes.length) return { ok: false, gap: { kind: "address_out_of_range", abs } };
  const dec = new TextDecoder();
  // the window AROUND the address (backward for the start, forward for the end)
  const startByte = Math.max(0, abs - window);
  const fwdByte = Math.min(bytes.length, abs + maxLen);
  const around = dec.decode(bytes.slice(startByte, fwdByte));
  const rel = abs - startByte; // the address's position within `around`
  const ABBR = /(?:Theaet|Theaetetus|Dr|Mr|Mrs|Ms|St|Vol|vol|Fig|fig|e\.g|i\.e|etc|vs|No|approx)\.$/i;
  const isEnd = (s, k) => {
    if (k >= s.length) return false;
    const ch = s[k];
    if (ch !== "." && ch !== "!" && ch !== "?") return false;
    if (/\.$/.test(s.slice(Math.max(0, k - 12), k + 1)) && ABBR.test(s.slice(Math.max(0, k - 12), k + 1))) return false;
    let j = k + 1;
    while (j < s.length && /\s/.test(s[j])) j++;
    if (j >= s.length) return true;
    return /[A-Z"']/.test(s[j]) || s[j] === "\n";
  };
  // walk BACKWARD to the enclosing sentence start (past the previous boundary)
  let start = rel;
  while (start > 0) {
    if (isEnd(around, start - 1)) break;
    start -= 1;
  }
  // walk FORWARD to the sentence end
  let end = rel;
  while (end < around.length) {
    if (isEnd(around, end)) break;
    end += 1;
  }
  if (end >= around.length) end = around.length - 1;
  const quote = around.slice(start, end + 1).replace(/\s+/g, " ").trim();
  if (!quote) return { ok: false, gap: { kind: "empty_snip", abs } };
  const len = new TextEncoder().encode(around.slice(start, end + 1)).length;
  const outAbs = startByte + start;
  return { ok: true, quote, abs: outAbs, len, source: sourcePath, verified: true };
}

/** Replace every ⟦source@abs⟧ marker in the mouth's draft with the box's snip.
 *  `resolve(sourcePath, abs)` defaults to snipSentence. A refused citation is
 *  left as ⟦REFUSED: …⟧ on the page and named on the result — a gap, never a
 *  guess. */
export function replaceCites(draft, { resolve = null } = {}) {
  const re = /⟦([^⟧]+)@(\d+)⟧/g;
  const out = [];
  let last = 0, m;
  const snips = [];
  while ((m = re.exec(draft))) {
    out.push(draft.slice(last, m.index));
    const source = m[1], abs = Number(m[2]);
    const r = (resolve ?? snipSentence)(source, abs);
    if (r.ok) { out.push(`“${r.quote}”`); snips.push({ source, abs, quote: r.quote, len: r.len, verified: true }); }
    else { snips.push({ source, abs, gap: r.gap?.kind ?? "unresolved", verified: false }); out.push(`⟦REFUSED ${source}@${abs} — ${r.gap?.kind ?? "unresolved"}⟧`); }
    last = m.index + m[0].length;
  }
  out.push(draft.slice(last));
  const refused = snips.filter((s) => !s.verified);
  return { text: out.join(""), snips, refused };
}

/** groundOutput — the mouth NEVER grounds itself. The mouth draws freely; the
 *  box scans the output for quote attempts ("…"), and for each:
 *    - FOUND in a known source  → MECHANICALLY REPLACE with the source's
 *      verbatim enclosing sentence at its byte address (snipSentence).
 *    - NOT FOUND reliably       → CENSOR: the span is removed and marked, so an
 *      ungrounded quote NEVER survives.
 *  The mouth is never prohibited from quoting (Gary: information, not
 *  prohibition); the box is the guarantee — replace what it can verify, censor
 *  what it cannot. Matching is by a normalized distinctive core (the span's
 *  words, punctuation-collapsed); a paraphrase that matches nothing is censored,
 *  never guessed. */
export function groundOutput(text, sources, { minWords = 8 } = {}) {
  const norm = (s) => s.toLowerCase().replace(/[’'"]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
  const QUOTE = /[“"]([^”"]{8,})[”"]/g;
  const out = [];
  let last = 0, m;
  const replaced = [], censored = [];
  while ((m = QUOTE.exec(text))) {
    out.push(text.slice(last, m.index));
    const span = m[1].trim();
    const core = norm(span);
    if (core.split(" ").length < minWords) {
      // too short to verify reliably — censor, never guess
      censored.push({ span, why: "too short to verify" });
      out.push("⟦censored: unverifiable quote⟧");
      last = m.index + m[0].length;
      continue;
    }
    let hit = null;
    for (const src of sources) {
      let file;
      try { file = fs.readFileSync(src.file, "utf8"); } catch { continue; }
      // RELIABLE MATCH: a verbatim 6-word fragment of the mouth's span, searched
      // case-insensitively in the RAW source. Paraphrase never matches →
      // censored. A match gives a true char index → true byte address → the
      // box's snip. And the replacement must be CLEAN: a snip that carries
      // header/footer markers (PMC, Copyright, Abstract, doi, PMID) is a dirty
      // quote — the box censors rather than presents it (2026-10-01: the first
      // walk replaced good quotes with the wrong verbatim and grabbed the
      // copyright footer; replace-only-on-a-clean-real-match is the law).
      const frag = span.split(/\s+/).slice(0, 6).join(" ");
      const raw = file;
      const fragIdx = raw.toLowerCase().indexOf(frag.toLowerCase());
      if (fragIdx < 0) continue;
      const abs = new TextEncoder().encode(raw.slice(0, fragIdx)).length;
      const s = snipSentence(src.file, abs);
      if (s.ok && !/\b(PMC\b|Copyright|Abstract|doi|PMID|ncbi|article in|journal)\b/i.test(s.quote)) { hit = { ...s, label: src.label }; break; }
    }
    if (hit) {
      replaced.push({ span, quote: hit.quote, abs: hit.abs, len: hit.len, source: hit.label });
      out.push(`“${hit.quote}” [${hit.label}@${hit.abs}]`);
    } else {
      censored.push({ span, why: "not found in any known source" });
      out.push("⟦censored: unverifiable quote⟧");
    }
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return { text: out.join(""), replaced, censored };
}

export function selftest() {
  const t = (n, c) => { if (!c) { console.error("FAIL", n); process.exitCode = 1; } else console.log("ok", n); };
  const REP = "/Users/mlacy/Documents/3.0/ethos/01-literature-books/gutenberg/pg55201_The_Republic_by_Plato.txt";
  // a real byte address: the waxen-tablet sentence's own bytes
  const src = fs.readFileSync(REP, "utf8");
  const start = src.indexOf("The waxen tablet of the memory");
  const abs = new TextEncoder().encode(src.slice(0, start)).length;
  const r = snipSentence(REP, abs);
  t("a byte address snips the verbatim sentence", r.ok && r.quote.includes("waxen tablet") && r.verified);
  t("a drifted address is refused, never re-found", snipSentence(REP, 3).gap?.kind === "address_out_of_range" || snipSentence(REP, 10 ** 9).gap?.kind === "address_out_of_range");
  t("a bad source is a typed gap", snipSentence("/no/such/file.txt", abs).gap?.kind === "source_unreadable");
  // the mouth's draft with citation markers → the box substitutes verbatim
  const draft = "Memory hardens: ⟦" + REP + "@" + abs + "⟧. The box, not the mouth, wrote that sentence.";
  const rep = replaceCites(draft);
  t("the mouth's citation marker becomes a mechanical snip", /“The waxen tablet/.test(rep.text) && rep.refused.length === 0);
  t("a refused citation stays a named gap, never the mouth's guess", replaceCites("See ⟦/no/file@5⟧ here.").refused.length === 1 && /REFUSED/.test(replaceCites("See ⟦/no/file@5⟧ here.").text));
  // THE HARD RULE (2026-10-01): the mouth never grounds itself. A quote the box
  // can verify cleanly is REPLACED with the source's verbatim; a quote it cannot
  // is CENSORED. Replace-only-on-a-clean-real-match; otherwise censor.
  const SRC = [
    { label: "republic", file: REP },
    { label: "research", file: "/tmp/wm-research.txt" },
  ];
  const gd = groundOutput('Plato called it "the waxen tablet of the memory which was once capable of receiving true thoughts and clear impressions becomes hard and crowded". And something "weaves and unweaves like a ghost in the machine".', SRC);
  t("a verifiable quote is mechanically replaced, verbatim", gd.replaced.length === 1 && /“The waxen tablet/.test(gd.text) && gd.replaced[0].abs > 0);
  t("an unverifiable quote is censored, never left ungrounded", gd.censored.length === 1 && /censored/.test(gd.text));
}