// A source quote must round-trip by its exact UTF-8 byte span.
// The model chooses an address; the reader owns every byte and the boundary.
import fs from 'node:fs';
export const VERIFIED_BYTE_SNIPS_SCHEMA = 'VerifiedByteSnips@1';
const ABBR = /(?:Theaet|Theaetetus|Dr|Mr|Mrs|Ms|St|Vol|vol|Fig|fig|e\.g|i\.e|etc|vs|No|approx)\.$/i;
const boundary = (bytes, i) => i === bytes.length || (bytes[i] & 0xc0) !== 0x80;

/** Sentence-level source snip at an absolute byte address, never a UTF-16
 * index. A partial/mid-codepoint sentence is a typed refusal, not evidence. */
export function snipSentenceUtf8(sourcePath, abs, { window = 8192, maxLen = 8192 } = {}) {
  let bytes;
  try { bytes = fs.readFileSync(sourcePath); }
  catch (e) { return { ok: false, gap: { kind: 'source_unreadable', error: String(e?.code ?? e?.message) } }; }
  if (!Number.isSafeInteger(abs) || abs < 0 || abs >= bytes.length) return { ok: false, gap: { kind: 'address_out_of_range', abs } };
  if (!boundary(bytes, abs)) return { ok: false, gap: { kind: 'address_not_utf8_boundary', abs } };
  if (!(Number.isInteger(window) && window >= 2) || !(Number.isInteger(maxLen) && maxLen >= 2))
    return { ok: false, gap: { kind: 'invalid_window' } };
  let base = Math.max(0, abs - window), limit = Math.min(bytes.length, abs + maxLen);
  while (base > 0 && !boundary(bytes, base)) base--;
  while (limit < bytes.length && !boundary(bytes, limit)) limit++;
  const around = bytes.subarray(base, limit).toString('utf8');
  const rel = bytes.subarray(base, abs).toString('utf8').length; // UTF-16 units, not bytes
  // End punctuation must not be an English abbreviation and must be followed
  // by a plausible new sentence (or EOF). The middle of a source is not EOF.
  const isEnd = (k) => {
    if (k < 0 || k >= around.length || !/[.!?]/.test(around[k])) return false;
    if (ABBR.test(around.slice(Math.max(0, k - 18), k + 1))) return false;
    let j = k + 1;
    while (j < around.length && /\s/.test(around[j])) j++;
    if (j === around.length) return limit === bytes.length;
    return /[\p{Lu}"“'‘]/u.test(around[j]);
  };
  let start = rel;
  while (start > 0 && !isEnd(start - 1)) start--;
  if (start === 0 && base !== 0) return { ok: false, gap: { kind: 'sentence_starts_before_window', abs } };
  let end = rel;
  while (end < around.length && !isEnd(end)) end++;
  if (end >= around.length && limit < bytes.length) return { ok: false, gap: { kind: 'sentence_ends_after_window', abs } };
  const raw = around.slice(start, end >= around.length ? end : end + 1);
  const leading = (raw.match(/^\s*/) ?? [''])[0].length;
  const trailing = (raw.match(/\s*$/) ?? [''])[0].length;
  const quote = raw.slice(leading, raw.length - trailing);
  if (!quote) return { ok: false, gap: { kind: 'empty_snip', abs } };
  const byteStart = base + Buffer.byteLength(around.slice(0, start + leading), 'utf8');
  const byteLen = Buffer.byteLength(quote, 'utf8');
  if (bytes.subarray(byteStart, byteStart + byteLen).toString('utf8') !== quote)
    return { ok: false, gap: { kind: 'source_bytes_drifted', abs } };
  return { schema: VERIFIED_BYTE_SNIPS_SCHEMA, ok: true, source: sourcePath, quote, abs: byteStart, len: byteLen,
    verified: true, requestedAbs: abs, exactBytes: true };
}

/** The only legal citation replacement for the byte-safe seal. The caller
 * provides the source authorization boundary; this module just resolves. */
export function replaceCitesUtf8(draft, { resolve = snipSentenceUtf8 } = {}) {
  const snips = [], out = []; let end = 0;
  for (const m of String(draft).matchAll(/⟦([^⟧]+)@(\d+)⟧/g)) {
    out.push(draft.slice(end, m.index));
    const source = m[1], at = Number(m[2]);
    const r = resolve(source, at);
    if (r?.ok) { out.push('“' + r.quote + '”'); snips.push({ source, abs: at,
      returnedAbs: r.abs, len: r.len, quote: r.quote, verified: true }); }
    else { const kind=r?.gap?.kind ?? 'unresolved';
      out.push('⟦REFUSED ' + source + '@' + at + ' — ' + kind + '⟧');
      snips.push({source,abs:at,gap:kind,verified:false}); }
    end = m.index + m[0].length;
  }
  out.push(draft.slice(end));
  return {text:out.join(''),snips,refused:snips.filter((s)=>!s.verified)};
}
