// FRESH run of PREREG-2.md (sha256 first 16: see result-fresh.json). Usage: EWT=<path to en_ewt-ud-test.conllu> node measure-fresh.mjs. Reads the file ONCE per invocation; a second invocation is REUSED. No regex, no word list reads text.
import fs from "node:fs"; import crypto from "node:crypto";
import { loadModel, sniffAt } from "../../organs/pos-sniff.mjs"; import { calibrationCard } from "../../organs/evidence-ledger.mjs";
const KW = "/Users/mlacy/Documents/khora-pharos-reading/native", FILE = process.env.EWT, SEED = 20261120, B = 200, OLLAMA = (process.env.OLLAMA_URL ?? "http://127.0.0.1:11434") + "/api/embed";
const { grammarFor } = await import(`${KW}/the-fold/pharos-reading.mjs`), { tagWithMargins } = await import(`${KW}/adapters/text/ud-parser.js`), g = await grammarFor("eng"), model = loadModel();
const knownForms = new Set(Object.keys(g.parser.lexicon.form).map((k) => k.slice(0, k.lastIndexOf("|"))));
const NOM = new Set(["NOUN", "PROPN"]), OTHER = new Set(["VERB", "ADJ", "ADV", "AUX", "NUM", "PRON", "ADP", "DET", "CCONJ", "PART", "SCONJ"]);
const embed = async (texts) => { for (let a = 0; ; a++) { try { const r = await fetch(OLLAMA, { method: "POST", body: JSON.stringify({ model: "nomic-embed-text", input: texts }) }); if (!r.ok) throw new Error(r.status); return (await r.json()).embeddings; } catch (e) { if (a >= 4) throw e; await new Promise((r) => setTimeout(r, 3000)); } } };
const isWord = (w) => w.length >= 3 && [...w].every((c) => c >= "a" && c <= "z");
const sentences = []; let cur = null;
for (const line of fs.readFileSync(FILE, "utf8").split("\n")) { if (!line.trim()) { if (cur?.length) sentences.push(cur); cur = null; continue; } if (line.startsWith("#")) continue; cur ??= []; const c = line.split("\t"); if (Number.isInteger(Number(c[0]))) cur.push({ form: c[1], upos: c[3] }); } if (cur?.length) sentences.push(cur);
const byWord = new Map(); sentences.forEach((s, si) => { if (s.length < 6 || s.length > 40) return; s.forEach((t, idx) => { if (!isWord(t.form)) return; const truth = NOM.has(t.upos) ? "nominal" : OTHER.has(t.upos) ? "other" : null; if (!truth) return; const k = byWord.get(t.form) ?? []; if (k.length < 3) { k.push({ si, idx, truth, word: t.form }); byWord.set(t.form, k); } }); });
const all = [...byWord.values()].flat(), occ = all.filter((o) => !knownForms.has(o.word.toLowerCase())), tagged = new Map(), rows = [];
for (const o of occ) {
  const forms = sentences[o.si].map((t) => t.form), text = forms.join(" "); let pos = 0; const tokens = forms.map((f) => { const t = { start: pos, end: pos + f.length }; pos += f.length + 1; return t; });
  if (!tagged.has(o.si)) tagged.set(o.si, tagWithMargins(g.parser.tagger, forms, g.parser.lex, g.parser.clusters));
  const tg = tagged.get(o.si), v = await sniffAt({ model, text, tokens, index: o.idx, embed, known: (w) => knownForms.has(w.toLowerCase()) });
  rows.push({ truth: o.truth, sniff: v.cls, tag: NOM.has(tg.tags[o.idx]) ? "nominal" : "other", margin: tg.margins[o.idx] });
}
let s0 = SEED; const rnd = () => { s0 = (s0 * 1664525 + 1013904223) >>> 0; return s0 / 4294967296; }, acc = (xs, k) => xs.filter((x) => x.truth === x[k]).length / xs.length, n = rows.length;
let wins = 0, ties = 0; for (let b = 0; b < B; b++) { let a = 0, c = 0; for (let i = 0; i < n; i++) { const x = rows[Math.floor(rnd() * n)]; if (x.truth === x.sniff) a++; if (x.truth === x.tag) c++; } if (a > c) wins++; else if (a === c) ties++; }
const fin = rows.filter((x) => Number.isFinite(x.margin)).sort((a, b) => a.margin - b.margin), third = Math.floor(fin.length / 3), low = new Set(fin.slice(0, third));
const thirds = [fin.slice(0, third), fin.slice(third, 2 * third), fin.slice(2 * third)].map((xs) => ({ n: xs.length, sniff: +acc(xs, "sniff").toFixed(3), tagger: +acc(xs, "tag").toFixed(3) }));
const sw = rows.filter((x) => x.truth !== x.sniff), nom = rows.filter((x) => x.truth === "nominal"), oth = rows.filter((x) => x.truth === "other");
const out = { prereg2: process.env.PREREG2_SHA, stamp: "FRESH", file: { sha256_16: crypto.createHash("sha256").update(fs.readFileSync(FILE)).digest("hex").slice(0, 16), sentences: sentences.length }, allOccurrences: all.length, unknownToTagger: n, nominal: nom.length,
  F1: { sniff: +acc(rows, "sniff").toFixed(4), tagger: +acc(rows, "tag").toFixed(4), B, sniffWins: wins, ties }, F2_powered: n >= 200, F3: { byTaggerMarginThird: thirds, hybridLowMarginUsesSniff: +(rows.filter((x) => x.truth === (low.has(x) ? x.sniff : x.tag)).length / n).toFixed(4), sniffWrongAlsoTaggerWrong: +(sw.filter((x) => x.truth !== x.tag).length / sw.length).toFixed(4) },
  F4: { sniffCard: calibrationCard({ layer: "pos-sniff-nominal", group: "nomic-embed+ud-ewt", planted: { n: nom.length, hit: nom.filter((x) => x.sniff === "nominal").length }, noise: { n: oth.length, hit: oth.filter((x) => x.sniff === "nominal").length }, provenance: "frozen sniff-eng2 on EWT test unknown-to-tagger, FRESH" }), taggerCard: calibrationCard({ layer: "khora-tagger-nominal", group: "khora-tagger", planted: { n: nom.length, hit: nom.filter((x) => x.tag === "nominal").length }, noise: { n: oth.length, hit: oth.filter((x) => x.tag === "nominal").length } }) } };
fs.writeFileSync(new URL("result-fresh.json", import.meta.url), JSON.stringify(out, null, 1)); console.log(JSON.stringify({ all: all.length, n, F1: out.F1, F2: out.F2_powered, F3: out.F3 }));
