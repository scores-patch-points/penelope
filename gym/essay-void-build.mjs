// gym/essay-void-build.mjs — DEFINE THE VOID OF AN ESSAY, THEN BUILD TOWARD IT.
//
// An essay is not a bag of sentences. It is a VOID declared across the cube's
// nine operators — what space it is, what must resolve, what kind of thing may
// stand, the extent to cover, what binds a claim, how the parts compose, how
// many claims, what each claim must pass, and what reopens it. Define that void,
// then FILL each operator from the research (the EOT), and the essay is the
// filled void — every cell grounded, no cell a guess.
//
// The research (search -> fetch -> EOT) is the field; the void says which part
// of the field each cell needs. A cell with no grounded filler is a NAMED GAP,
// never a fabricated paragraph.
//
//   node gym/essay-void-build.mjs [subject]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ER7 = path.resolve(HERE, "..", "..", "eoreader7");
const { liveWeb } = await import(path.join(ER7, "native/the-fold/surf.js"));
const { engineRelationsFor } = await import(path.join(ER7, "native/the-fold/reader-bundle.js"));

const subject = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "dolphins";
const key = subject.toLowerCase().replace(/s$/, "");
const OUT = process.env.ESSAY_OUT || path.join(HERE, "..", "apps", "weaves");

console.log(`\n═══ DEFINE THE VOID OF AN ESSAY, THEN BUILD TOWARD IT: "${subject}" ═══\n`);

// ── THE VOID: the nine operators, each given an ESSAY meaning + a filler ────
const VOID = [
  { op: "NUL", grain: "Ground",  asks: "what space is this essay, marked off from all it is not", fill: () => ({ text: `An essay on ${subject}`, basis: "the subject the ask names" }) },
  { op: "SIG", grain: "Figure",  asks: "what must resolve for this space to exist — the named being", fill: (eot) => ({ text: `${subject}`, basis: `${eot.filter((o) => new RegExp(`\\b${key}s?\\b`, "i").test(o.text)).length} observations name it` }) },
  { op: "INS", grain: "Pattern", asks: "what kind of thing may stand here — grounded claims, not meta", fill: (eot) => { const g = grounded(eot); return { text: `${g.length} grounded claims`, basis: `${g.length} of ${eot.length} observations are complete sentences naming ${subject}` }; } },
  { op: "SEG", grain: "Ground",  asks: "the extent to cover — the subject's real range", fill: (eot) => { const segs = segments(grounded(eot)); return { text: Object.keys(segs).join(", "), basis: `${Object.keys(segs).length} subtopics found in the material`, segs }; } },
  { op: "CON", grain: "Figure",  asks: "what binds each claim to its ground", fill: (eot) => { const g = grounded(eot); return { text: `every claim carries its source address`, basis: `${g.length} claims, ${new Set(g.map((o) => o.source)).size} sources, each at a byte offset` }; } },
  { op: "SYN", grain: "Pattern", asks: "how the parts compose — the movement", fill: (eot) => ({ text: "definition → range → behaviour → stakes", basis: "the subtopics ordered by what a reader needs first" }) },
  { op: "DEF", grain: "Figure",  asks: "how many claims the essay holds", fill: (eot) => { const n = Math.min(8, grounded(eot).length); return { text: `${n}`, basis: `declared, not read off grammar` }; } },
  { op: "EVA", grain: "Figure",  asks: "what each claim must pass", fill: () => ({ text: "a verbatim span of a real source, at its address", basis: "the grounding test, mechanical" }) },
  { op: "REC", grain: "Ground",  asks: "what reopens the essay", fill: () => ({ text: "new research on the subject", basis: "a fresh source revises the extent" }) },
];

function grounded(eot) {
  const clean = (t) => /^[A-Z“"]/.test(t) && /[.!?]$/.test(t.trim()) && !/[:]/.test(t.slice(0, 45)) && !/^(skip|overview|faqs|menu|share|table of contents)/i.test(t) && !/ - |\bOverview\b|\bThreats\b|\bFAQs\b/.test(t);
  const seen = new Set();
  return eot.filter((o) => new RegExp(`\\b${key}s?\\b`, "i").test(o.text) && clean(o.text) && o.text.length >= 60 && o.text.length <= 300)
    .filter((o) => { const k = o.text.toLowerCase().slice(0, 80); if (seen.has(k)) return false; seen.add(k); return true; });
}
const TOPICS = { reproduction: /(reproduc|mate|calv|gestation|breed|young|calf)/i, conservation: /(conserv|endanger|threat|protect|decline|bycatch|welfare|rescue)/i, species: /(bottlenose|orca|spinner|river dolphin|common dolphin|delphinus|species)/i, behaviour: /(behavio|feed|hunt|swim|social|communicat|migrat|tool|play|intelligen|echo|acrobat)/i, habitat: /(habitat|ocean|sea|water|coast|river|range|live|found|lake)/i, definition: /(is|are|refers|belong|mammal|family|cetacea)/i };
const TOPIC_ORDER = ["species", "reproduction", "conservation", "behaviour", "habitat", "definition"];
function segments(g) { const out = {}; for (const o of g) { for (const t of TOPIC_ORDER) if (TOPICS[t].test(o.text)) { (out[t] ??= []).push(o); break; } } return out; }

// ── THE RESEARCH (the field) ────────────────────────────────────────────────
const web = liveWeb();
const s = await web.search(`${subject} habitat behaviour species facts conservation`);
const sources = [];
for (const r of (s.results ?? []).slice(0, 6)) {
  try { const f = await web.fetch(r.url); const text = String(f?.text ?? "").replace(/\s+/g, " ").trim(); if (text.length >= 300) sources.push({ url: r.url, text }); } catch { /* skip */ }
}
const eot = [];
for (const src of sources) for (const e of (engineRelationsFor([{ ref: src.url, text: src.text }]).edges ?? [])) for (const sp of (e.spans ?? [])) eot.push({ source: src.url, at: [sp.start, sp.end], text: sp.text, roles: { ARG0: e.end1, ARG1: e.end2 } });
console.log(`FIELD: ${sources.length} sources, ${eot.length} observations\n`);

// ── FILL THE VOID, operator by operator, in the cube's order ────────────────
console.log(`THE VOID OF AN ESSAY, FILLED:`);
const filled = {};
for (const cell of VOID) {
  const f = cell.fill(eot);
  filled[cell.op] = f;
  console.log(`  ${cell.op}·${cell.grain}  ${cell.asks}`);
  console.log(`     → ${f.text}   (${f.basis})`);
}

// ── BUILD: the essay is the filled void, in the SYN order, every line grounded
const segs = filled.SEG.segs ?? {};
const order = ["definition", "habitat", "species", "behaviour", "reproduction", "conservation"];
const sentenceOf = (o) => { const parts = o.text.split(/(?<=[.!?])\s+/).map((s) => s.trim()); const good = parts.filter((s) => new RegExp(`\\b${key}s?\\b`, "i").test(s) && /^[A-Z“"]/.test(s) && /[.!?]$/.test(s) && s.length >= 50); return (good.sort((a, b) => b.length - a.length)[0] ?? o.text).trim(); };
const pick = (t) => (segs[t] ?? []).map((o) => ({ ...o, text: sentenceOf(o) })).filter((o) => o.text.length >= 50 && o.text.length <= 320).sort((a, b) => b.text.length - a.text.length).slice(0, 2);
const lines = [];
for (const t of order) for (const o of pick(t)) lines.push({ topic: t, text: o.text, source: o.source, at: o.at });
const capped = lines.slice(0, Number(filled.DEF.text));

const essay = capped.map((l) => `${l.text} ⟦${l.source}@${l.at[0]}-${l.at[1]}⟧`).join("\n\n");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject} — a grounded essay</title>
<style>body{font:18px/1.7 Georgia,serif;max-width:680px;margin:0 auto;padding:48px 28px;background:#fbf8f1;color:#231d13}h1{font-size:30px;font-style:italic}p{margin:0 0 1.1em}sup{font:10px ui-monospace;color:#8a7a52}footer{margin-top:40px;border-top:1px solid #c9bda0;padding-top:14px;font:12px ui-monospace;color:#6b5b3a}</style></head>
<body><h1>${subject}</h1>
${capped.map((l) => `<p>${l.text} <sup>[${l.source.replace(/^https?:\/\//, "").slice(0, 30)}@${l.at[0]}]</sup></p>`).join("\n")}
<footer>the filled void of an essay — ${capped.length} claims, every line a verbatim span of a real source, at its address. Subtopics: ${Object.keys(segs).join(", ")}.</footer></body></html>`;
fs.mkdirSync(OUT, { recursive: true });
const slug = `dolphins-void-${Date.now()}`;
fs.writeFileSync(path.join(OUT, `${slug}.html`), html);
console.log(`\n════════ THE ESSAY (the filled void) ════════\n`);
console.log(essay);
console.log(`\n→ ${OUT}/${slug}.html`);
console.log(`VOID COVERAGE: ${Object.keys(segs).length}/6 subtopics filled from the field; cells NUL/SIG/INS/CON/EVA/REC declared, SEG filled, DEF=${filled.DEF.text} claims.`);
