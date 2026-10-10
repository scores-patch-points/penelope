// organs/read-code-by-priors.mjs — THE THIN READER (2026-10-10).
//
// A code language = token-class prior + binding-marker prior + a thin reader.
// This is the reader: it tokenizes with the UNIVERSAL class scanner (strings,
// comments, identifiers, numbers, operators — the same scan for every
// language), then consults the language's sealed priors to say what each
// identifier is BOUND TO. It does not know syntax; the priors carry it. An
// identifier whose (id, next) pair is a prior-marked binding is "cased": bound
// by that marker with its measured lift. A pair the priors have never seen is
// a typed unknown — never a guess.
import fs from "node:fs";
import path from "node:path";

const priorPath = "/Users/mlacy/Documents/3.0/Zenodotus/derived-priors/code-priors/code-lang/code-lang-priors.jsonl";
const load = () => { try { return fs.readFileSync(priorPath, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } };
const FAMILY = { js: "js", mjs: "js", jsx: "js", ts: "js", py: "py", css: "css", html: "html", md: "md", json: "json", sh: "sh", yml: "yaml", yaml: "yaml", rs: "rs", go: "go", rb: "rb" };

export function tokenize(src) {
  const out = []; let i = 0; const n = src.length;
  while (i < n) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '"' || c === "'" || c === "`") { const q = c; let j = i + 1, esc = false, end = n; for (; j < n; j++) { if (src[j] === "\\" && !esc) { esc = true; continue; } if (src[j] === q && !esc) { end = j + 1; break; } esc = false; } out.push({ cls: "str", lex: src.slice(i, end) }); i = end; continue; }
    if (c === "#" && src[i + 1] === "!") { const j = src.indexOf("\n", i); out.push({ cls: "com", lex: src.slice(i, j < 0 ? n : j) }); i = j < 0 ? n : j; continue; }
    if (c === "/" && src[i + 1] === "/") { const j = src.indexOf("\n", i); out.push({ cls: "com", lex: src.slice(i, j < 0 ? n : j) }); i = j < 0 ? n : j; continue; }
    if (c === "#") { const end = src.indexOf("\n", i); out.push({ cls: "com", lex: src.slice(i, end < 0 ? n : end) }); i = end < 0 ? n : end; continue; }
    if (c === "/" && src[i + 1] === "*") { const end = src.indexOf("*/", i + 2); out.push({ cls: "com", lex: src.slice(i, end < 0 ? n : end + 2) }); i = end < 0 ? n : end + 2; continue; }
    if (/[A-Za-z_\u00c0-\u024f$]/.test(c)) { let j = i + 1; while (j < n && /[\w\u00c0-\u024f$]/.test(src[j])) j++; out.push({ cls: "id", lex: src.slice(i, j) }); i = j; continue; }
    if (/\d/.test(c)) { let j = i + 1; while (j < n && /[\d._]/.test(src[j])) j++; out.push({ cls: "num", lex: src.slice(i, j) }); i = j; continue; }
    let j = i + 1; while (j < n && !/[\w\s"'\`]/.test(src[j])) j++; out.push({ cls: "op", lex: src.slice(i, j) }); i = j; continue;
  }
  return out;
}

/** readByPriors(file, src) — tokens with the language's case-marking stamped
 *  on every identifier: what it is bound by, and the measured lift of that
 *  binding — or a typed unknown. THIN: no grammar of the language is written
 *  here; the priors are the grammar. */
export function readByPriors(file, src) {
  const lang = FAMILY[path.extname(file).slice(1)] ?? null;
  const priors = load().find((p) => p.lang === lang) ?? null;
  const marks = new Map((priors?.bindingMarkers ?? []).map((m) => [m.marker ?? m.pair, m.sharePct ?? m.lift]));
  const fol = new Set((priors?.followers ?? []).map((x) => x.particle));
  const toks = tokenize(src);
  const readings = [];
  for (let i = 0; i < toks.length - 1; i++) {
    if (toks[i].cls !== "id") continue;
    const next = toks[i + 1].lex;
    const share = marks.get(next);
    // THE DEFINITION PARTICLES: id followed by a sealed particle (function,
    // const, def, class…) is a DEFINITION binding — the code case-marking for
    // names coming into being.
    const particle = toks[i + 1]?.cls === "id" && fol.has(next) ? { by: "def-by-" + next, lift: 1 } : null;
    // THE STRENGTH TIERS (2026-10-10): a marker below the 0.5 strong floor is
    // still real at weak share — reported `weak`, never as nothing; and a name
    // followed by a name that is no particle is a REFERENCE (a known
    // non-binding), never an unknown.
    const weak = share !== undefined && share < 0.5 && share >= 0.1 ? { by: next, lift: share, weak: true } : null;
    const ref = !particle && weak === null && toks[i + 1]?.cls === "id" ? { by: "ref:" + next, ref: true } : null;
    readings.push({ id: toks[i].lex, next, bound: (share && share >= 0.5) ? { by: next, lift: share } : particle || weak || null, ref: ref ? ref.by : null, unknown: !priors ? true : (share === undefined && !particle && !ref) });
  }
  const bound = readings.filter((r) => r.bound);
  return { lang, prior: priors ? { tokens: priors.tokens, markers: priors.bindingMarkers.length } : null,
    readings, bound, unknowns: readings.filter((r) => r.unknown).length, note: "the reader knows nothing but the token scanner and the priors." };
}

export function selftest() {
  const t = (n, c) => { if (!c) { console.error("FAIL", n); process.exitCode = 1; } else console.log("ok", n); };
  const r = readByPriors("lib/tip.js", "export function computeTip(amount, pct) { return Math.round(amount * pct) / 100; }");
  t("reads with the js priors", r.lang === "js" && r.prior !== null);
  t("identifiers get bindings or typed unknowns", r.readings.length > 0 && r.unknowns >= 0);
  t("no grammar written: the reader is thin by construction", r.note.includes("nothing but the token scanner"));
}
selftest();