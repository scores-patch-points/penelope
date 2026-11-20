// organs/pos-sniff.mjs — the ablation SNIFF as a layer of evidence: for a word the prior does not know, is it NOMINAL or OTHER in THIS sentence?
// Ported from Zenodotus scripts/udhr-core/sniff.mjs (cc0894c, GL-UD-09/12/13) so that it reads through the READER'S OFFSETS, never a pattern on the text (rule 8): the word is a token's [start, end) in the text,
// the mask is spliced at those offsets, the neighbours are the adjacent TOKENS the reader cut (the model was trained on adjacent tokens, punctuation included).
// Evidence: embed(sentence) minus embed(sentence with the word masked), scored against two class centroids, with the word's ending and the neighbours' log-odds, one logistic (weights in the model file).
// The model is Zenodotus's sniff-eng2.json (learned from UD English-EWT, CC BY-SA 4.0, embedder nomic-embed-text), pinned by sha256; POS is language- and period-specific, so it is English only: another language is a typed gap, never English by default (rule 8).
// STANDING RULES kept: a sniff is a REVISABLE PRESSURE, never a verdict (source: "sniff"); a word the prior KNOWS is refused (a settled word is never second-guessed); no prior given is a typed gap.
// The embedder and the prior are INJECTED: this file does no I/O except reading its own pinned model. The embedder is a third-party model (training wheels): its output is only the delta, never an answer.
import fs from "node:fs"; import crypto from "node:crypto";
export const MODEL_SHA256 = "bbfdcf8a4d73dfc6604fc795b4725d00cb11b5deb4f2fc1f6741db099d1b3457";
const MASK = "___";
export class SniffGap extends Error { constructor(code, why) { super(`${code}: ${why}`); this.code = code; this.why = why; } }
export function loadModel(file = new URL("./data/pos-sniff-eng2.json", import.meta.url)) {
  const bytes = fs.readFileSync(file);
  if (crypto.createHash("sha256").update(bytes).digest("hex") !== MODEL_SHA256) throw new SniffGap("bad_model_pin", "the model file is not the pinned sniff-eng2.json (sha256 mismatch): re-pin, never assume");
  return JSON.parse(bytes.toString("utf8"));
}
export const norm = (v) => { const n = Math.hypot(...v) || 1; return v.map((x) => x / n); };
export const cos = (a, b) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; } return x && y ? d / Math.sqrt(x * y) : 0; };
export const deltaMargin = (d, c) => (cos(d, c.nominal) - cos(d, c.other)) * 20;
export function suffixLogOdds({ t, prior }, word) { let lo = 0; for (const k of [1, 2, 3]) { const c = t[k][word.slice(-k)]; if (c) lo = Math.log((c[0] + 1) / (c[1] + 1)) - prior; } return lo; }
export const ctxLogOdds = ({ t, prior }, w) => { const c = t[w]; return c ? Math.log((c[0] + 1) / (c[1] + 1)) - prior : 0; };
export const score2 = (m, d, word, prev, next) => m.weights[0] * deltaMargin(d, m.centroids) + m.weights[1] * suffixLogOdds(m.suffix, word) + m.weights[2] * ctxLogOdds(m.ctx.prev, prev) + m.weights[3] * ctxLogOdds(m.ctx.next, next) + m.weights[4];
/** the delta of one token: embed the text and the text with that token's [start, end) replaced by the mask */
export async function deltaAt(embed, text, tok) {
  const masked = text.slice(0, tok.start) + MASK + text.slice(tok.end), [a, b] = (await embed([text, masked])).map(norm);
  return norm(a.map((v, j) => v - b[j]));
}
/** sniffAt({ model, text, tokens, index, embed, known, language }) -> { word, cls, score, accept, source: "sniff", revisable: true }
 *  tokens: [{ start, end }] as the reader cut them; known(word) -> boolean is the language's prior (injected; none given is a typed gap). Throws SniffGap, typed. */
export async function sniffAt({ model, text, tokens, index, embed, known, language = "eng" }) {
  if (language !== "eng") throw new SniffGap("no_codec_for_language", "the sniff was learned from English and is not applied to " + language + " without a measured transfer");
  if (typeof known !== "function") throw new SniffGap("no_prior", "the sniff is for a word the prior does not know: pass the prior's known(word); none was given");
  const tok = tokens?.[index]; if (!tok || !(tok.start >= 0 && tok.end > tok.start && tok.end <= text.length)) throw new SniffGap("bad_token", "index " + index + " is not a token with offsets inside the text");
  const word = text.slice(tok.start, tok.end);
  if (known(word)) throw new SniffGap("known_word", "the prior already knows " + JSON.stringify(word) + ": a settled word is never second-guessed");
  const at = (i, edge) => (i < 0 || i >= tokens.length ? edge : text.slice(tokens[i].start, tokens[i].end).toLowerCase());
  const d = await deltaAt(embed, text, tok), s = score2(model, d, word, at(index - 1, "<s>"), at(index + 1, "</s>"));
  return Object.freeze({ word, cls: s >= 0 ? "nominal" : "other", score: +s.toFixed(4), accept: Math.abs(s) >= model.threshold, source: "sniff", revisable: true });
}
/** the vote as an evidence entry for the ledger: the layer FIRES when the sniff says nominal (the card was derived for exactly that firing); the card is supplied by the caller from a planted-truth run */
export const toEvidence = (vote, card) => ({ layer: "pos-sniff-nominal", group: "nomic-embed+ud-ewt", outcome: vote.cls === "nominal" ? "good" : "not_good", card });
