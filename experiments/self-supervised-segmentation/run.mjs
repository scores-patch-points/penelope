// EXPLORATORY run for PREREG.md (sha256 first 16: 544fcb4594e5f70f). Reads text from the LOCAL git history of Zenodotus (no download); khora's generic tokenizer and tagger; no regex, no word list.
import fs from "node:fs"; import { execFileSync } from "node:child_process";
const KW = "/Users/mlacy/Documents/khora-pharos-reading/native", Z = "/Users/mlacy/Documents/khora-cast/Zenodotus";
const { grammarFor } = await import(`${KW}/the-fold/pharos-reading.mjs`), { tagWithMargins } = await import(`${KW}/adapters/text/ud-parser.js`), { sentences, tokenize } = await import(`${KW}/adapters/text/ud-tokenizer.js`);
const g = await grammarFor("eng"), SEED = 20261120, DRAWS = 100, CAP = 200;   // CAP: sentences per form and side (a run-time bound chosen for time, declared here, before any result)
const git = (...a) => execFileSync("git", ["-C", Z, ...a], { encoding: "utf8", maxBuffer: 1 << 28 }), ls = (p) => git("ls-tree", "-r", "HEAD", "--name-only").split("\n").filter((f) => f.startsWith(p));
const body = (path) => { const t = git("show", `HEAD:${path}`), i = t.startsWith("---") ? t.indexOf("\n---", 3) : -1; return i < 0 ? t : t.slice(t.indexOf("\n", i + 1) + 1); };
const informalFiles = [...ls("19-organic-community/nus-sms/en/"), ...ls("19-organic-community/cosem/"), ...["ubuntu", "kubuntu", "xubuntu", "ubuntu-server"].flatMap((c) => ls(`19-organic-community/ubuntu-irc/${c}/`))].filter((f) => f.endsWith(".txt")).sort();
const editedFiles = ls("01-literature-books/gutenberg/").filter((f) => f.endsWith(".txt") && !f.includes("Greek") && !f.includes("Latin") && !f.toLowerCase().includes("translation")).sort().slice(0, 6);
const toks = (files) => { const out = []; for (const f of files) for (const s of sentences(body(f), "und", g.tokenizer)) { const t = tokenize(s, g.tokenizer); if (t.length) out.push(t); } return out; };
let inf = toks(informalFiles), edi = toks(editedFiles); const count = (ss) => ss.reduce((a, s) => a + s.length, 0), cut = (ss, n) => { const o = []; let k = 0; for (const s of ss) { if (k >= n) break; o.push(s); k += s.length; } return o; };
const NTOK = Math.min(count(inf), count(edi)); inf = cut(inf, NTOK); edi = cut(edi, NTOK);
console.log(`informal: ${informalFiles.length} files, edited: ${editedFiles.length} files (${editedFiles.map((f) => f.split("/").pop().slice(0, 28)).join(" | ")}); equalized to ${NTOK} tokens each (informal ${count(inf)}, edited ${count(edi)})`);
console.log("sample informal sentence:", JSON.stringify(inf[Math.floor(inf.length / 2)].slice(0, 14)));
// ---- description-length gain of adopting a suffix (Morfessor two-part code; the spelling cost is derived from the alphabet) ----
function gains(sents) {
  const n = new Map(); let N = 0; for (const s of sents) for (const w of s) { const k = w.toLowerCase(); n.set(k, (n.get(k) ?? 0) + 1); N++; }
  const alphabet = new Set(); for (const w of n.keys()) for (const c of w) alphabet.add(c); const spell = (w) => [...w].length * Math.log2(alphabet.size), lg = Math.log2;
  const bySuffix = new Map(); for (const w of n.keys()) { const cs = [...w]; for (let L = 1; L <= Math.min(4, cs.length - 1); L++) { const b = cs.slice(cs.length - L).join(""); (bySuffix.get(b) ?? bySuffix.set(b, []).get(b)).push(w); } }
  const out = new Map();
  for (const [b, types] of bySuffix) {
    if (types.length < 2) continue;                                              // a rule applies to at least two instances
    const bl = [...b].length, newN = new Map(); let moved = 0, oldSum = 0;       // oldSum: old contribution of the affected types
    const affect = new Set(), add = (t, d) => { affect.add(t); newN.set(t, (newN.get(t) ?? n.get(t) ?? 0) + d); };
    for (const w of types) { const c = n.get(w), a = [...w].slice(0, [...w].length - bl).join(""); add(w, -c); add(a, c); add(b, c); moved += c; }
    const N2 = N + moved; let L0aff = 0, L1aff = 0;
    for (const t of affect) { const o = n.get(t) ?? 0, m = newN.get(t) ?? 0; if (o > 0) L0aff += -o * lg(o / N) + spell(t); if (m > 0) L1aff += -m * lg(m / N2) + spell(t); }
    let affOld = 0; for (const t of affect) affOld += n.get(t) ?? 0; const rest = (N - affOld) * lg(N2 / N);   // every untouched token pays log2(N'/N) more
    out.set(b, { gain: L0aff + 0 - (L1aff + rest), types: types.length, tokensMoved: moved });
  }
  return out;
}
const gInf = gains(inf), gEdi = gains(edi);
const FORMS = ["'s", "n't", "'ll", "'m", "'ve", "'re", "'d"], VARIANTS = FORMS.map((f) => f.split("'").join("")), REF = { "n't": 5.8, "'m": 3.3, "'ve": 2.9, "'s": 2.7, "'re": 1.9, "'d": 0.0, "'ll": -1.0 };
const G = (m, b) => m.get(b)?.gain ?? null, rank = (xs) => xs.map((x) => xs.filter((y) => y > x).length + 1 + (xs.filter((y) => y === x).length - 1) / 2);
const spearman = (a, b) => { const ra = rank(a), rb = rank(b), n = a.length, ma = ra.reduce((x, y) => x + y, 0) / n, mb = rb.reduce((x, y) => x + y, 0) / n; let c = 0, va = 0, vb = 0; for (let i = 0; i < n; i++) { c += (ra[i] - ma) * (rb[i] - mb); va += (ra[i] - ma) ** 2; vb += (rb[i] - mb) ** 2; } return c / Math.sqrt(va * vb); };
console.log("\nDESCRIPTION-LENGTH GAIN (bits) of splitting each suffix off, informal vs edited");
const rows = [...FORMS, ...VARIANTS].map((b) => ({ form: b, informal: G(gInf, b.toLowerCase()), edited: G(gEdi, b.toLowerCase()) }));
for (const r of rows) console.log(`  ${r.form.padEnd(5)} informal ${r.informal === null ? "n/a (fewer than two types)" : r.informal.toFixed(0).padStart(8)}   edited ${r.edited === null ? "n/a" : r.edited.toFixed(0).padStart(8)}`);
const clitRows = FORMS.map((f) => ({ f, gain: G(gInf, f.toLowerCase()), ref: REF[f] })).filter((r) => r.gain !== null), rho = clitRows.length >= 3 ? spearman(clitRows.map((r) => r.gain), clitRows.map((r) => r.ref)) : null;
console.log(`\nSpearman rho (informal gain vs reference effect), n = ${clitRows.length}: ${rho === null ? "n/a" : rho.toFixed(2)}   (reference = 7 preliminary DEV numbers: weak)`);
const top = (m, k = 10) => [...m].sort((a, b) => b[1].gain - a[1].gain).slice(0, k).map(([b, v]) => `${b}:${v.gain.toFixed(0)}`);
console.log("top 10 suffixes by gain, EDITED:  ", top(gEdi).join("  ")); console.log("top 10 suffixes by gain, INFORMAL:", top(gInf).join("  "));
// ---- the downstream model's own confidence, against a random-cut null from the same text ----
let seed = SEED; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length, margin = (ws) => { const m = tagWithMargins(g.parser.tagger, ws, g.parser.lex, g.parser.clusters).margins.filter(Number.isFinite); return m.length ? mean(m) : 0; };
const splitAt = (ws, i, L) => [...ws.slice(0, i), [...ws[i]].slice(0, [...ws[i]].length - L).join(""), [...ws[i]].slice([...ws[i]].length - L).join(""), ...ws.slice(i + 1)];
function confidence(sents, form) {
  const L = [...form].length, hit = sents.filter((s) => s.some((w) => [...w].length > L && w.endsWith(form))).slice(0, CAP); if (hit.length < 5) return { n: hit.length, gap: "fewer than 5 sentences carry the form" };
  const obs = mean(hit.map((s) => { let ws = s; for (let i = ws.length - 1; i >= 0; i--) if ([...ws[i]].length > L && ws[i].endsWith(form)) ws = splitAt(ws, i, L); return margin(ws) - margin(s); }));
  const nul = []; for (let d = 0; d < DRAWS; d++) nul.push(mean(hit.map((s) => { const c = s.map((w, i) => i).filter((i) => [...s[i]].length > L); if (!c.length) return 0; return margin(splitAt(s, c[Math.floor(rnd() * c.length)], L)) - margin(s); })));
  const reach = nul.filter((x) => x >= obs).length; return { n: hit.length, observed: obs, nullMean: mean(nul), nullMax: Math.max(...nul), nullReaching: reach, rank: (reach + 1) / (DRAWS + 1) };
}
console.log(`\nTAGGER CONFIDENCE CHANGE (mean margin, split minus glued) vs a random-cut null (${DRAWS} draws), per form and side`);
const conf = {}; for (const b of [...FORMS, ...VARIANTS]) { conf[b] = { informal: confidence(inf, b), edited: confidence(edi, b) }; for (const side of ["informal", "edited"]) { const c = conf[b][side]; console.log(`  ${b.padEnd(5)} ${side.padEnd(8)} ${c.gap ? "n = " + c.n + " (" + c.gap + ")" : `n=${String(c.n).padStart(3)} observed ${c.observed.toFixed(2).padStart(7)}  null mean ${c.nullMean.toFixed(2).padStart(7)} max ${c.nullMax.toFixed(2).padStart(6)}  null reaching ${c.nullReaching}/${DRAWS}  rank ${c.rank.toFixed(3)}`}`); } }
fs.writeFileSync(new URL("./result.json", import.meta.url), JSON.stringify({ prereg: "544fcb4594e5f70f", zenodotusCommit: "d79ee5a", seed: SEED, draws: DRAWS, cap: CAP, tokens: NTOK, informalFiles: informalFiles.length, editedFiles, rho, rows, conf, topEdited: top(gEdi), topInformal: top(gInf) }, null, 1));
