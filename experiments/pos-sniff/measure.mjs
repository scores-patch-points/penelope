// EXPLORATORY / REUSED run of experiments/pos-sniff/PREREG.md (sha256 first 16: 7a5a8b0893b9d250). The frozen English sniff (organs/pos-sniff.mjs) and khora's tagger on the same informal-text occurrences.
// Usage: CREOLE=<dir holding singlish/ and naija/ copies of the Zenodotus files> node measure.mjs   No regex, no word list reads any text: tokens come from the treebank's own columns, offsets are exact.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
import { loadModel, sniffAt } from "../../organs/pos-sniff.mjs"; import { calibrationCard } from "../../organs/evidence-ledger.mjs";
const KW = "/Users/mlacy/Documents/khora-pharos-reading/native", DIR = process.env.CREOLE, SEED = 20261120, B = 200, OLLAMA = (process.env.OLLAMA_URL ?? "http://127.0.0.1:11434") + "/api/embed";
const { grammarFor } = await import(`${KW}/the-fold/pharos-reading.mjs`), { tagWithMargins } = await import(`${KW}/adapters/text/ud-parser.js`), g = await grammarFor("eng"), model = loadModel();
// the tagger's prior of known forms: the treebank-trained lexicon's keys are "form|UPOS"; a form is known when any key carries it (a data structure, not language)
const knownForms = new Set(Object.keys(g.parser.lexicon.form).map((k) => k.slice(0, k.lastIndexOf("|"))));
const NOM = new Set(["NOUN", "PROPN"]), OTHER = new Set(["VERB", "ADJ", "ADV", "AUX", "NUM", "PRON", "ADP", "DET", "CCONJ", "PART", "SCONJ"]);
const embed = async (texts) => { for (let a = 0; ; a++) { try { const r = await fetch(OLLAMA, { method: "POST", body: JSON.stringify({ model: "nomic-embed-text", input: texts }) }); if (!r.ok) throw new Error(r.status); return (await r.json()).embeddings; } catch (e) { if (a >= 4) throw e; await new Promise((r) => setTimeout(r, 3000)); } } };
const isWord = (w) => w.length >= 3 && [...w].every((c) => c >= "a" && c <= "z");
function load(dir) {
  const sentences = []; let cur = null;
  for (const f of fs.readdirSync(path.join(DIR, dir)).sort()) { for (const line of fs.readFileSync(path.join(DIR, dir, f), "utf8").split("\n")) { if (!line.trim()) { if (cur?.length) sentences.push(cur); cur = null; continue; } if (line.startsWith("#")) continue; cur ??= []; const c = line.split("\t"); if (Number.isInteger(Number(c[0]))) cur.push({ form: c[1], upos: c[3] }); } if (cur?.length) sentences.push(cur); cur = null; }
  const byWord = new Map(); sentences.forEach((s, si) => { if (s.length < 6 || s.length > 40) return; s.forEach((t, idx) => { if (!isWord(t.form)) return; const truth = NOM.has(t.upos) ? "nominal" : OTHER.has(t.upos) ? "other" : null; if (!truth) return; const k = byWord.get(t.form) ?? []; if (k.length < 3) { k.push({ si, idx, truth, word: t.form }); byWord.set(t.form, k); } }); });
  return { sentences, occ: [...byWord.values()].flat() };
}
let s0 = SEED; const rnd = () => { s0 = (s0 * 1664525 + 1013904223) >>> 0; return s0 / 4294967296; };
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 16);
const result = { prereg: "7a5a8b0893b9d250", stamp: "EXPLORATORY/REUSED", seed: SEED, model: model.provenance, sets: {} };
for (const [name, dir] of [["naija", "naija"], ["singlish", "singlish"]]) {
  const { sentences, occ } = load(dir), tagged = new Map(), rows = [];
  for (const o of occ) {
    const s = sentences[o.si], forms = s.map((t) => t.form), text = forms.join(" "); let pos = 0; const tokens = forms.map((f) => { const t = { start: pos, end: pos + f.length }; pos += f.length + 1; return t; });
    if (!tagged.has(o.si)) tagged.set(o.si, tagWithMargins(g.parser.tagger, forms, g.parser.lex, g.parser.clusters));
    const tg = tagged.get(o.si), v = await sniffAt({ model, text, tokens, index: o.idx, embed, known: () => false });
    rows.push({ unk: !knownForms.has(o.word.toLowerCase()), truth: o.truth, sniff: v.cls, tag: NOM.has(tg.tags[o.idx]) ? "nominal" : "other", margin: tg.margins[o.idx], score: Math.abs(v.score) });
  }
  const acc = (xs, k) => xs.filter((x) => x.truth === x[k]).length / xs.length, n = rows.length;
  let wins = 0, ties = 0; for (let b = 0; b < B; b++) { let a = 0, c = 0; for (let i = 0; i < n; i++) { const x = rows[Math.floor(rnd() * n)]; if (x.truth === x.sniff) a++; if (x.truth === x.tag) c++; } if (a > c) wins++; else if (a === c) ties++; }
  const fin = rows.filter((x) => Number.isFinite(x.margin)).sort((a, b) => a.margin - b.margin), third = Math.floor(fin.length / 3), thirds = [fin.slice(0, third), fin.slice(third, 2 * third), fin.slice(2 * third)].map((xs) => ({ n: xs.length, sniff: +acc(xs, "sniff").toFixed(3), tagger: +acc(xs, "tag").toFixed(3) }));
  const low = new Set(fin.slice(0, third)), hybrid = rows.map((x) => ({ truth: x.truth, h: low.has(x) ? x.sniff : x.tag })), nom = rows.filter((x) => x.truth === "nominal"), oth = rows.filter((x) => x.truth === "other");
  const U = rows.filter((x) => x.unk); let uw = 0, ut = 0; for (let b = 0; b < B; b++) { let a = 0, c = 0; for (let i = 0; i < U.length; i++) { const x = U[Math.floor(rnd() * U.length)]; if (x.truth === x.sniff) a++; if (x.truth === x.tag) c++; } if (a > c) uw++; else if (a === c) ut++; }
  result.sets[name] = { A1_unknownToTaggerLexicon_POSTHOC: U.length ? { n: U.length, nominal: U.filter((x) => x.truth === "nominal").length, sniff: +acc(U, "sniff").toFixed(4), tagger: +acc(U, "tag").toFixed(4), bootstrap: { B, sniffWins: uw, ties: ut } } : null, files: fs.readdirSync(path.join(DIR, dir)).sort().map((f) => `${f} ${sha(path.join(DIR, dir, f))}`), sentences: sentences.length, occurrences: n, nominal: nom.length,
    P1_sniffAccuracy: +acc(rows, "sniff").toFixed(4), P2_taggerAccuracy: +acc(rows, "tag").toFixed(4), P2_bootstrap: { B, sniffWins: wins, ties }, P3_byTaggerMarginThird: thirds, P3_hybridLowMarginUsesSniff: +(hybrid.filter((x) => x.truth === x.h).length / n).toFixed(4),
    P4_card: calibrationCard({ layer: "pos-sniff-nominal", group: "nomic-embed+ud-ewt", planted: { n: nom.length, hit: nom.filter((x) => x.sniff === "nominal").length }, noise: { n: oth.length, hit: oth.filter((x) => x.sniff === "nominal").length }, provenance: `frozen sniff-eng2 on ${name}, EXPLORATORY/REUSED` }),
    taggerCard: calibrationCard({ layer: "khora-tagger-nominal", group: "khora-tagger", planted: { n: nom.length, hit: nom.filter((x) => x.tag === "nominal").length }, noise: { n: oth.length, hit: oth.filter((x) => x.tag === "nominal").length } }) };
  console.log(name, n, "sniff", result.sets[name].P1_sniffAccuracy, "tagger", result.sets[name].P2_taggerAccuracy, "wins", wins, "/", B);
}
fs.writeFileSync(new URL("result.json", import.meta.url), JSON.stringify(result, null, 1));
