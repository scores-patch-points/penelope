// build-fold.mjs — STEP 1 of PREREG-FOLDCODE-ANSWER.md: the mechanical fold of the Russian excerpt. Deterministic; no model; no network.
//   node build-fold.mjs --khora <khora clone> --janus <janus clone>
// Reads the excerpt with khora's readDocument({language:'ru', minCharacters:0, referents:true, declension:true}) (the hyperlexicon is not asked:
// lexicon:false; see REGISTRATION "Deviations"), reads stated kinship with janus's plain extractor (scripts/kinship/extract-kin.mjs, unchanged),
// binds each end of a kinship statement to a REFERENT of the ledger by its character span (name keys are not referents), builds the fact base with
// janus native/organs/kinship.js, runs deriveKin for the six most-mentioned referents, and writes fold.json.
import fs from "node:fs";
import path from "node:path";
import { assertPrereg, clones, importFrom, sha256, sha256File, writeStable, TEXT_RU, TEXT_EN, PREREG, foldRu } from "./lib.mjs";

const prereg = assertPrereg();
const C = clones();
const { readDocument } = await importFrom(C.khora.dir, "native/reading.js");
const { createDeclensionFolder } = await importFrom(C.khora.dir, "native/adapters/text/declension.js");
const K = await importFrom(C.janus.dir, "native/organs/kinship.js");
const { extract } = await importFrom(C.janus.dir, "scripts/kinship/extract-kin.mjs");

const janusFile = (rel) => path.join(C.janus.dir, rel);
const buf = fs.readFileSync(TEXT_RU), text = buf.toString("utf8");
const lex = JSON.parse(fs.readFileSync(janusFile("priors/kin-lexicon.json"), "utf8"));
const np = JSON.parse(fs.readFileSync(janusFile("priors/name-parts-ru.json"), "utf8"));
const prior = JSON.parse(fs.readFileSync(janusFile("priors/declension-rus.json"), "utf8"));
const { sameStem } = createDeclensionFolder(prior);

// ── 1. the reading: the ledger of referents
const READ_OPTIONS = { language: "ru", minCharacters: 0, referents: true, declension: true, lexicon: false };
const entry = await readDocument(text, READ_OPTIONS);
if (entry.error) throw new Error(`readDocument error: ${JSON.stringify(entry.error)}`);
const L = entry.referents;
if (entry.readCharacters !== text.length) throw new Error("the reader did not read the whole text");
const spanById = new Map(L.spans.map((s) => [s.id, s]));
for (const s of L.spans) if (text.slice(s.at[0], s.at[1]) !== s.text) throw new Error(`span ${s.id} does not read back from the text`);
const refOfSpan = new Map();
for (const r of L.referents) for (const sid of r.mentions) refOfSpan.set(sid, r.id);

// byte <-> character offsets (the kin extractor speaks bytes, the ledger speaks UTF-16 characters)
const byteAt = new Int32Array(text.length + 1);
{
  let b = 0;
  for (let i = 0; i < text.length; i++) {
    byteAt[i] = b;
    const c = text.charCodeAt(i);
    if (c < 0x80) b += 1; else if (c < 0x800) b += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) { byteAt[i + 1] = b; b += 4; i++; }
    else b += 3;
  }
  byteAt[text.length] = b;
  if (b !== buf.length) throw new Error(`byte map is off: ${b} vs ${buf.length}`);
}
const charAtByte = (b) => { let lo = 0, hi = text.length; while (lo < hi) { const m = (lo + hi) >> 1; if (byteAt[m] < b) lo = m + 1; else hi = m; } return lo; };
const bytesOf = (a, b) => buf.subarray(a, b).toString("utf8");

// ── 2. the referents with their surfaces
const nameSpansOf = (r) => r.mentions.map((id) => spanById.get(id)).filter((s) => s?.kind === "name");
const beings = L.referents.filter((r) => r.standing === "referent").map((r) => {
  const ns = nameSpansOf(r), first = Math.min(...r.mentions.map((id) => spanById.get(id).at[0]));
  const counts = new Map();
  for (const s of ns) { const c = counts.get(s.text) ?? { text: s.text, n: 0, first: s.at[0] }; c.n++; c.first = Math.min(c.first, s.at[0]); counts.set(s.text, c); }
  return { r, ns, first, surfaces: [...counts.values()].sort((a, b) => b.n - a.n || a.first - b.first) };
}).sort((a, b) => b.r.mentions.length - a.r.mentions.length || a.first - b.first);

const tokensOf = (s) => foldRu(s).replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").filter(Boolean);
/** the display name: the most written surface with its case variants merged (the card's own rule, forms[0], with capitals merged); among the variants of the winning group the most written, a lower-case initial before a capital (a capital is usually the start of a sentence), then the first in the text. */
function displayOf(b) {
  const groups = new Map();
  for (const s of b.surfaces) { const k = foldRu(s.text); const g = groups.get(k) ?? { fold: k, n: 0, first: s.first, variants: [] }; g.n += s.n; g.first = Math.min(g.first, s.first); g.variants.push(s); groups.set(k, g); }
  const pick = [...groups.values()].sort((a, b) => b.n - a.n || a.first - b.first)[0];
  const lowerFirst = (t) => (t[0] === t[0].toLowerCase() ? 0 : 1);
  const variant = pick.variants.slice().sort((a, b) => b.n - a.n || lowerFirst(a.text) - lowerFirst(b.text) || a.first - b.first)[0].text;
  return { display: variant, rule: "most written surface, capitals merged; lower-case initial before capital among equals" };
}
const foldedBy = (form, name) => {
  if (form === name) return "most_written";
  const ft = tokensOf(form), nt = tokensOf(name);
  for (const a of ft) for (const b of nt) if (a !== b && (sameStem(a, b) || sameStem(b, a))) return "case_form_by_declension_table";
  if (ft.every((t) => nt.includes(t)) || nt.every((t) => ft.includes(t))) return "contained_in_or_contains";
  return "joined_by_the_reading";
};
const referents = beings.map((b, i) => {
  const d = displayOf(b), top = b.surfaces[0].text;
  return {
    id: b.r.id, rank: i + 1, face: b.r.face, display: d.display, displayRule: d.rule, standing: b.r.standing, engine: b.r.engine,
    mentions: b.r.mentions.length, nameMentions: b.ns.length, firstAt: b.first,
    surfaces: b.surfaces.map((s) => ({ text: s.text, n: s.n, foldedBy: foldedBy(s.text, top) })),
  };
});
const SIX = referents.slice(0, 6);
const refInfo = new Map(referents.map((r) => [r.id, r]));

// ── 3. stated kinship (janus plain extractor, unchanged) bound to REFERENTS by character span
const ex = extract({ text, lang: "ru", lexicon: lex, namePartsRu: np, from: 0, to: text.length });
const nameSpans = L.spans.filter((s) => s.kind === "name" && refInfo.has(refOfSpan.get(s.id))).map((s) => ({ ...s, ref: refOfSpan.get(s.id) }));
const closest = (cands, key) => cands.sort((a, b) => key(a) - key(b) || (b.at[1] - b.at[0]) - (a.at[1] - a.at[0]) || a.at[0] - b.at[0])[0] ?? null;
const specs = [], unbound = [], statements = [];
const quote = (a, b) => bytesOf(a, b).replace(/\s+/g, " ").trim();
for (const s of ex.stmts) {
  const rec = { cat: s.cat, term: s.en, kind: s.kind, byteSpan: s.span, text: quote(...s.span) };
  const lo = charAtByte(s.span[0]), hi = charAtByte(s.span[1]), tLo = charAtByte(s.termAt[0]), tHi = charAtByte(s.termAt[1]);
  statements.push(rec);
  if (s.cat !== "A") { unbound.push({ ...rec, why: s.cat === "P" ? "holder_unbound" : s.cat === "H" ? "possessor_unbound" : "both_ends_unbound" }); continue; }
  // a ledger name may begin before the extractor's mention (it takes a lower-case title: «князь Ипполит» for «Ипполит»), so the holder is the name that ENDS in [lo, term) nearest the term, the possessor the name that BEGINS in (term, hi] nearest the term
  const h = closest(nameSpans.filter((x) => x.at[1] > lo && x.at[1] <= tLo), (x) => tLo - x.at[1]);
  const p = closest(nameSpans.filter((x) => x.at[0] >= tHi && x.at[0] < hi), (x) => x.at[0] - tHi);
  if (!h || !p || h.ref === p.ref) { unbound.push({ ...rec, why: !h || !p ? "end_not_a_ledger_name" : "both_ends_one_referent" }); continue; }
  rec.holder = h.ref; rec.possessor = p.ref; rec.holderText = h.text; rec.possessorText = p.text;
  const giver = "text:ru", witness = `ru#${s.span[0]}-${s.span[1]}`, at = lex.atoms[s.en];
  if (s.kind === "atom" && at) {
    if (at.rel === "parent_of") specs.push(at.end === "a" ? { rel: "parent_of", a: h.ref, b: p.ref, giver, witness } : { rel: "parent_of", a: p.ref, b: h.ref, giver, witness });
    else specs.push({ rel: at.rel, a: h.ref, b: p.ref, giver, witness });
    if (at.sex) specs.push({ rel: "sex", a: h.ref, value: at.sex, giver, witness });
  } else specs.push({ rel: "term", term: s.en, a: h.ref, b: p.ref, giver, witness });
}
const patronymics = [];
for (const pt of ex.patro) {
  const lo = charAtByte(pt.span[0]), hi = charAtByte(pt.span[1]);
  const over = nameSpans.map((x) => ({ x, ov: Math.min(hi, x.at[1]) - Math.max(lo, x.at[0]) })).filter((o) => o.ov > 0).sort((a, b) => b.ov - a.ov || a.x.at[0] - b.x.at[0])[0];
  const rec = { text: quote(...pt.span), byteSpan: pt.span, sex: pt.sex, fatherGap: pt.fatherGap, father: pt.father };
  if (!over) { patronymics.push({ ...rec, bound: null }); continue; }
  rec.bound = over.x.ref;
  specs.push({ rel: "sex", a: over.x.ref, value: pt.sex, giver: "name-parts-ru", witness: `ru#${pt.span[0]}-${pt.span[1]}`, standing: "candidate" });
  patronymics.push(rec);
}
const base = K.factBase(specs);
const witnessText = (w) => { const [a, b] = w.split("#")[1].split("-").map(Number); return quote(a, b); };
const facts = base.facts.map((f) => ({
  id: f.id, rel: f.rel, a: f.a, b: f.b, value: f.value, term: f.term, giver: f.giver, standing: f.standing,
  witnesses: f.witnesses, witnessText: witnessText(f.witnesses[0]),
}));

// ── 4. deriveKin for the six (the producer's own premises and typed gaps)
const rules = K.rulesFromLexicon(lex);
const battery = Object.keys(rules.composites).filter((t) => rules.composites[t].alternatives.some((a) => a.evaluable) && rules.atoms[rules.composites[t].headOf]).sort();
const stepBrief = (s) => (s.kind === "rule" ? { kind: "rule", rule: s.rule, giver: s.giver, standing: s.standing } : { kind: "fact", rel: s.rel, a: s.a, b: s.b, value: s.value, giver: s.giver, witness: s.witness, standing: s.standing });
const derivation = {};
for (const R of SIX) {
  derivation[R.id] = {};
  for (const term of battery) {
    const a = K.deriveKin({ term, of: R.id }, { base, rules });
    derivation[R.id][term] = {
      state: a.state,
      items: a.items.map((i) => ({ who: i.who, derivations: i.derivations.map((d) => ({ standing: d.standing, steps: d.steps.map(stepBrief) })) })),
      gaps: a.gaps.map((g) => ({ kind: g.kind, slot: g.slot, detail: g.detail ?? null, opinionFillable: g.opinionFillable, opinionSlotId: g.opinionSlot?.id ?? null })),
      ruleNotes: a.ruleNotes,
    };
  }
}

// ── 5. the fold, as data
const readerGaps = (entry.gaps ?? []).map((g) => ({ gap: g.gap, count: g.count ?? null, detail: g.detail ?? null, plain: g.plain ?? null, referents: g.referents ?? null, candidates: g.candidates ?? null }));
const fold = {
  schema: "FoldcodeAnswerFold@1",
  built_by: "build-fold.mjs",
  inputs: {
    prereg: { path: PREREG, sha256: prereg },
    text_ru: { path: TEXT_RU, sha256: sha256File(TEXT_RU), bytes: buf.length, characters: text.length, role: "development data: chapters I to IV, Russian, wikisource" },
    text_en: { path: TEXT_EN, sha256: sha256File(TEXT_EN), bytes: fs.statSync(TEXT_EN).size, role: "aligned English chapters 1 to 3; used only for the by-string disagreement list, never in a model prompt" },
    khora: { commit: C.khora.commit, entry: "native/reading.js::readDocument", options: READ_OPTIONS },
    janus: { commit: C.janus.commit, producer: "native/organs/kinship.js", extractor: "scripts/kinship/extract-kin.mjs" },
    priors: {
      kin_lexicon: sha256File(janusFile("priors/kin-lexicon.json")),
      name_parts_ru: sha256File(janusFile("priors/name-parts-ru.json")),
      declension_rus: sha256File(janusFile("priors/declension-rus.json")),
      kinship_js: sha256File(janusFile("native/organs/kinship.js")),
    },
  },
  ledger: { sentences: entry.sentences.length, spans: L.spans.length, referents: L.referents.length, beings: referents.length, edges: L.edges.length, readerGaps: readerGaps.map((g) => g.gap), aliasReport: entry.aliasReport?.gap ?? null },
  topSixRule: "standing 'referent', ordered by mentions (all kinds) descending, ties by first position in the text; the first six",
  six: SIX.map((r) => r.id),
  referents,
  kin: {
    extractor: { counts: ex.counts, statementsTotal: ex.stmts.length, byCategory: ex.stmts.reduce((m, s) => ((m[s.cat] = (m[s.cat] ?? 0) + 1), m), {}) },
    statements,
    unbound,
    patronymics,
    specs,
    refused: base.refused,
    facts,
  },
  derivation: { battery, rules: Object.fromEntries(battery.map((t) => [t, { giver: rules.composites[t].giver, gloss: rules.composites[t].witness, headOf: rules.composites[t].headOf, alternatives: rules.composites[t].alternatives }])), byReferent: derivation },
  readerGaps,
};
writeStable("fold.json", fold);
console.log(`fold.json: ${referents.length} beings; six: ${SIX.map((r) => `${r.display} (${r.mentions})`).join(", ")}`);
console.log(`kin: ${ex.stmts.length} statements (${JSON.stringify(fold.kin.extractor.byCategory)}), ${specs.length} specs -> ${facts.length} facts, ${base.refused.length} refused, ${unbound.length} unbound, ${patronymics.length} patronymic mentions`);
