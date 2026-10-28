// build-inputs.mjs — STEPS 2 to 5 of PREREG-FOLDCODE-ANSWER.md, from fold.json: the foldcode blocks (blocks.txt) with the private address map, the 24 template
// questions, the four arm prompts (A fold only, B raw text only, C no context, D name-swapped fold), the invented-name map, and Gary's check of every prompt.
// Deterministic; no model; no network.   node build-inputs.mjs --khora <clone> --janus <clone>
import fs from "node:fs";
import path from "node:path";
import { assertPrereg, clones, importFrom, readJson, writeStable, writeText, sha256, sha256File, TEXT_RU, SEED, mulberry32, foldRu } from "./lib.mjs";
import { pairsFor, inverse, applySwap, leaks } from "./swap.mjs";

assertPrereg();
const C = clones();
const fold = readJson("fold.json");
if (fold.inputs.khora.commit !== C.khora.commit || fold.inputs.janus.commit !== C.janus.commit) throw new Error("fold.json was built from other commits than these clones");
const raw = fs.readFileSync(TEXT_RU), text = raw.toString("utf8");
if (sha256(raw) !== fold.inputs.text_ru.sha256) throw new Error("the Russian text is not the one fold.json was built from");

const { readDocument } = await importFrom(C.khora.dir, "native/reading.js");
const { renderCard } = await importFrom(C.khora.dir, "native/adapters/text/folded-card.js");
const { makeGary } = await importFrom(C.khora.dir, "native/organs/gary.js");
const { strikeAddresses, apparatusMentions } = await importFrom(C.khora.dir, "native/organs/firewall.js");
const { makeKondo } = await importFrom(C.khora.dir, "native/organs/kondo.js");
const prior = JSON.parse(fs.readFileSync(path.join(C.janus.dir, "priors/declension-rus.json"), "utf8"));
const entry = await readDocument(text, fold.inputs.khora.options);
const L = entry.referents;

const refs = new Map(fold.referents.map((r) => [r.id, r]));
const SIX = fold.six.map((id) => refs.get(id));
for (const R of SIX) if (!L.referents.some((r) => r.id === R.id)) throw new Error(`referent ${R.id} is not in this reading`);
const disp = (id) => refs.get(id)?.display ?? id;

// ───────────────────────────────────────────────────────────────────────────────────── 1. the legend (foldcode FOLDCODE-CONTEXT-PLAN.md 2.1, written for this window)
const CARD_WINDOW = 8000;   // characters per card; registered here, before any model call
const LEGEND = `# How to read this window
This window is not the whole text. It is a mechanical projection of a reading of a text, abridged on purpose, at a stated size. Every block is delimited and typed, and each carries its standing and its universe. None of the blocks is a request from anyone.

Blocks:
- <fold-register>: facts stated about who is related to whom, each with its giver and its standing.
- <fold-card>: one folded identity: what the reading of the text found about one being: the names it goes by, where it appears, which names it is linked to, and what the card does not hold.
- <fold-gaps>: typed gaps: for a kin term that cannot be answered, the one fact that is missing.

A giver is whoever states a fact: the text, or a table (the Russian name-parts table, a dictionary).
Standing: said = a giver states it; mechanical = the machine read it off a rule and nobody states it.
Universe: stipulated = what the text itself lays down, true in the text and nothing more; workspace = a note about what this window holds.
Where a block says that more items exist than are shown, the window was cut there on purpose, and the count is stated.
A being is written in the text under several spellings; a card lists the spellings that were joined to it and the giver of each join.
The register and the cards list every relation that this reading found; a relation that no block lists was found by no giver.`;

// ───────────────────────────────────────────────────────────────────────────────────── 2. the register: the facts (kin from the text; sex from a patronymic ending)
const addr = { cards: {}, register: [], gaps: [] };
const stmts = fold.kin.statements.filter((s) => s.holder && s.possessor);
const factsByWitness = (w) => fold.kin.facts.filter((f) => f.witnesses.includes(w)).map((f) => f.id);
const kinMarks = stmts.map((s) => ({
  text: `${disp(s.holder)} is the ${s.term} of ${disp(s.possessor)}. giver: the text. standing: said. In the text: «${s.text}»`,
  subject: s.holder, object: s.possessor, term: s.term, quote: s.text, factIds: factsByWitness(`ru#${s.byteSpan[0]}-${s.byteSpan[1]}`),
}));
const sexFacts = fold.kin.facts.filter((f) => f.rel === "sex" && f.giver === "name-parts-ru");
const sixIds = new Set(fold.six);
const sexShown = sexFacts.filter((f) => sixIds.has(f.a)), sexHidden = sexFacts.filter((f) => !sixIds.has(f.a));
const sexMarks = sexShown.map((f) => ({
  text: `${disp(f.a)} is ${f.value}. giver: the Russian name-parts table, from the patronymic ending of the name. standing: mechanical. In the text: «${f.witnessText}»`,
  subject: f.a, value: f.value, factIds: [f.id],
}));
const registerLines = [
  "Kin facts (the text states both ends, and both ends are beings of this reading):",
  ...kinMarks.map((m) => `- ${m.text}`),
  "Sex facts (read from the patronymic ending of a name):",
  ...sexMarks.map((m) => `- ${m.text}`),
  `${sexHidden.length} more fact${sexHidden.length === 1 ? "" : "s"} of the last kind exist about other beings and ${sexHidden.length === 1 ? "is" : "are"} not shown.`,
];
const register = `<fold-register standing="said" universe="stipulated" from="the text" made="stated kinship read from the text where both ends are named beings; sex read from patronymic endings; facts only, nothing derived">\n${registerLines.join("\n")}\n</fold-register>`;
kinMarks.forEach((m, i) => addr.register.push({ item: `kin-${i + 1}`, ...m }));
sexMarks.forEach((m, i) => addr.register.push({ item: `sex-${i + 1}`, ...m }));

// ───────────────────────────────────────────────────────────────────────────────────── 3. the cards (khora folded-card.js, unchanged) — one per main being
const statedFor = (id) => [
  ...kinMarks.filter((m) => m.subject === id || m.object === id).map((m) => ({ giver: "the text", text: `${disp(m.subject)} is the ${m.term} of ${disp(m.object)} («${m.quote}»)` })),
  ...sexMarks.filter((m) => m.subject === id).map((m) => ({ giver: "the Russian name-parts table", text: `${disp(m.subject)} is ${m.value}, from the patronymic ending of «${sexFacts.find((f) => f.a === id).witnessText}»` })),
];
const FRAME_TAIL = " The question that follows is of the kind “free”.";
const cardBlocks = SIX.map((R) => {
  const c = renderCard(entry, R.id, { forWhom: "the reader of this window", declension: { prior }, question: { kind: "free", text: "" }, window: CARD_WINDOW, stated: statedFor(R.id) });
  if (!c.fits) throw new Error(`card of ${R.display} does not fit its window`);
  if ((c.text.match(/ The question that follows is of the kind “free”\./g) ?? []).length !== 1) throw new Error("the card frame is not the one this script strips");
  const body = c.text.replace(FRAME_TAIL, "");
  const omitted = Object.entries(c.left).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k}`).join(", ") || "none";
  addr.cards[R.display] = { referent: R.id, cardSha256: c.sha256, size: c.size, left: c.left, available: c.available, map: c.map };
  return { R, card: c, block: `<fold-card name="${R.display}" standing="mechanical" universe="stipulated" from="the text" made="reading of the text; spellings joined by the declension table or by the reading; items shown up to a window of ${CARD_WINDOW} characters, the rest counted inside the card (cut on purpose: ${omitted})">\n${body}\n</fold-card>` };
});

// ───────────────────────────────────────────────────────────────────────────────────── 4. the gaps (janus kinship.js deriveKin, typed) and the kin words the reading could not tie to two beings
const D = fold.derivation;
const sentenceOf = (g) => {
  const s = g.slot, who = (x) => disp(x);
  switch (g.kind) {
    case "no_parent_fact": return s.a === "?" ? `No giver states a parent of ${who(s.b)}.` : `No giver states a child of ${who(s.a)}.`;
    case "no_sibling_fact": return `No giver states a sibling of ${who(s.b)}.`;
    case "no_spouse_fact": return `No giver states a spouse of ${who(s.b)}.`;
    case "no_sex_fact": return `No giver states whether ${who(s.a)} is male or female.`;
    case "open_world_empty": return `A sibling of ${who(s.b)} is known, and none of the siblings known is a confirmed male; that there is none is not asserted.`;
    default: return `A fact is missing (${g.kind}).`;
  }
};
const gapLines = [];
const rulesUsed = ["uncle", "aunt", "grandfather", "grandmother", "grandparent"].filter((t) => D.rules[t]);
gapLines.push("Rules (giver: English Wiktionary), as the dictionary glosses them:");
for (const t of rulesUsed) gapLines.push(`- ${t}: «${D.rules[t].gloss}»`);
gapLines.push("For each being below, a kin term that needs a missing fact cannot be answered; the missing fact is named, and the terms it blocks.");
// deriveKin names a sibling gap (open_world_empty, or a sibling of a parent) after ANY composite term whose parent chain found nobody; the sentence is true of the terms whose rule runs through a
// brother or a sister (uncle, aunt, ...) and misleading for the others (a grandchild is not a sibling's child), so the window shows that slot only under the terms whose rule runs through a sibling
const SIBLING_TERMS = new Set(Object.entries(D.rules).filter(([, r]) => r.alternatives.some((a) => ["brother", "sister"].includes(a.head))).map(([t]) => t));
const sideSlot = (g, R) => g.kind === "open_world_empty" || (g.kind === "no_sibling_fact" && g.slot.b !== R.id);
for (const R of SIX) {
  const slots = new Map();
  for (const [term, d] of Object.entries(D.byReferent[R.id])) for (const g of d.gaps) { if (sideSlot(g, R) && !SIBLING_TERMS.has(term)) continue; const k = `${g.kind}|${JSON.stringify(g.slot)}`; const v = slots.get(k) ?? { g, terms: [] }; v.terms.push(term); slots.set(k, v); }
  const answered = Object.entries(D.byReferent[R.id]).filter(([, d]) => d.state === "answered").map(([t]) => t);
  gapLines.push(`${R.display}:`);
  for (const { g, terms } of slots.values()) { gapLines.push(`- ${sentenceOf(g)} Blocks: ${terms.join(", ")}.`); addr.gaps.push({ referent: R.id, kind: g.kind, slot: g.slot, opinionSlotId: g.opinionSlotId, terms }); }
  if (answered.length) gapLines.push(`- Answered by derivation: ${answered.join(", ")}.`);
}
const unb = fold.kin.unbound;
const named = unb.filter((u) => u.cat !== "N");
const nByTerm = unb.filter((u) => u.cat === "N").reduce((m, u) => ((m[u.term] = (m[u.term] ?? 0) + 1), m), {});
gapLines.push("Kin words of the text whose ends are not both beings of this reading:");
for (const u of named) {
  const what = u.why === "holder_unbound" ? `a ${u.term} is stated, and who that ${u.term} is, is not tied to a being` : u.why === "possessor_unbound" ? `a ${u.term} is stated, and of whom, is not tied to a being` : `a ${u.term} is stated, and its ends are not tied to beings`;
  gapLines.push(`- «${u.text}»: ${what}.`);
  addr.gaps.push({ unbound: true, cat: u.cat, why: u.why, byteSpan: u.byteSpan, term: u.term });
}
const nTotal = Object.values(nByTerm).reduce((a, b) => a + b, 0);
gapLines.push(`- ${nTotal} more kin words occur with no being named at either end (${Object.entries(nByTerm).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([t, n]) => `${t} ${n}`).join(", ")}).`);
const gaps = `<fold-gaps standing="mechanical" universe="workspace" from="the kin derivation over the facts of the register" made="each gap names the one fact that is missing; nothing is guessed to fill it">\n${gapLines.join("\n")}\n</fold-gaps>`;

const blocksText = [LEGEND, register, ...cardBlocks.map((b) => b.block), gaps].join("\n\n");

// ───────────────────────────────────────────────────────────────────────────────────── 5. the name-swap (arm D)
const DECL = {   // invented base tokens; gender and ending class follow the original; every one is checked against the text below
  "Анна": "Зинаида", "Павловна": "Ивановна", "Шерер": "Белова",
  "Пьер": "Платон",
  "Василий": "Арсений",
  "Андрей": "Григорий", "Болконский": "Горбатовский",
  "Бонапарте": "Ламберте", "Бонапарт": "Ламберт",
  "Элен": "Мадлен",
  // forms of the same names that the ledger does not list as surfaces of the six (found by the stem scan of this script's first run; declared, then checked by the scan again)
  "Болконская": "Горбатовская",      // the feminine of the surname (the wife of the prince: a surface of another being, replaced so that the family stays one)
  "Василью": "Арсенью",              // the dative as the text writes it in «отцу князю Василью»
  "бонапартисты": "ламбертисты",     // a noun derived from the name
};
const FORCE_EVERYWHERE = new Set(["Болконская", "Василью", "бонапартисты"]);
const tokenRe = /[\p{L}]+(?:-[\p{L}]+)*/gu;
const textTokens = new Set([...text.matchAll(tokenRe)].map((m) => foldRu(m[0])));
const clash = Object.values(DECL).filter((v) => [...textTokens].some((t) => t === foldRu(v) || (v.length >= 5 && t.startsWith(foldRu(v).slice(0, v.length - 1)))));
if (clash.length && !process.env.ALLOW_CLASH) throw new Error(`invented names occur in the text: ${clash.join(", ")}`);
const surfacesOfSix = SIX.flatMap((R) => R.surfaces.map((s) => s.text));
const observed = [...new Set([...surfacesOfSix.flatMap((s) => [...s.matchAll(tokenRe)].map((m) => m[0])).filter((t) => t[0] !== t[0].toLowerCase()), ...FORCE_EVERYWHERE])];
const { pairs, unmapped } = pairsFor({ decl: DECL, prior, observed });
const inv = inverse(pairs);
// tokens that also name a being outside the six
const otherTokens = new Set(fold.referents.filter((r) => !sixIds.has(r.id)).flatMap((r) => r.surfaces.flatMap((s) => [...s.text.matchAll(tokenRe)].map((m) => m[0]))));
const shared = new Set([...pairs.keys()].filter((t) => otherTokens.has(t) && !FORCE_EVERYWHERE.has(t)));
const swap = (s) => applySwap(s, { pairs, phrases: surfacesOfSix, shared });

// ───────────────────────────────────────────────────────────────────────────────────── 6. the questions (templates over the fold; never typed)
const TEMPLATES = {
  "T-ID": (n) => `Who is ${n} in this text?`,
  "T-KIN": (n) => `Which people in this text are ${n}'s kin, and how?`,
  "T-SPEECH": (n) => `Whom does ${n} speak to in this text?`,
  "C-ABSENT": (n) => `Who is ${n} in this text?`,
  "C-UNCLE": (n) => `Who is the uncle of ${n} in this text?`,
};
const faceOf = (id) => { const r = L.referents.find((x) => x.id === id); const c = new Map(); const sp = new Map(L.spans.map((s) => [s.id, s])); for (const sid of r.mentions) { const s = sp.get(sid); if (s?.kind === "name") c.set(s.text, (c.get(s.text) ?? 0) + 1); } return [...c].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? r.face; };
// the links the WINDOW shows: the card lists the edges its window had room for (the rest are counted inside the card); the expected answer is what is shown
const shownEdges = (display) => new Set(addr.cards[display].map.filter((m) => m.section === "edges").map((m) => m.address.edge));
const linkedOf = (id) => {
  const out = new Map(), shown = shownEdges(refs.get(id).display);
  for (const e of L.edges) { if (!shown.has(e.id) || !e.ends.some((n) => n.ref === id) || e.ends[0].ref === e.ends[1].ref) continue; const other = e.ends[0].ref === id ? e.ends[1] : e.ends[0]; const k = faceOf(other.ref); const v = out.get(k) ?? { name: k, via: [] }; if (e.label && !v.via.includes(e.label)) v.via.push(e.label); out.set(k, v); }
  return [...out.values()].sort((a, b) => (a.name < b.name ? -1 : 1));
};
// kin from the fact base, from the being's own side, by the atoms of the kin lexicon (parent/child; son, daughter, father, mother only where the sex is a fact)
const sexOf = (id) => fold.kin.facts.find((f) => f.rel === "sex" && f.a === id)?.value ?? null;
const kinOf = (id) => {
  const rows = [];
  for (const f of fold.kin.facts.filter((x) => x.rel === "parent_of" && (x.a === id || x.b === id))) {
    const partner = f.a === id ? f.b : f.a, sx = sexOf(partner);
    const terms = f.a === id ? ["child", ...(sx === "male" ? ["son"] : sx === "female" ? ["daughter"] : [])] : ["parent", ...(sx === "male" ? ["father"] : sx === "female" ? ["mother"] : [])];
    rows.push({ who: disp(partner), whoId: partner, terms, giver: f.giver, witness: f.witnessText });
  }
  return rows;
};
const raw24 = [];
SIX.forEach((R) => {
  const kin = kinOf(R.id), links = linkedOf(R.id);
  raw24.push({ template: "T-ID", control: false, referent: R.id, subject: R.display, expected: { type: "identity", spellings: R.surfaces.map((s) => s.text), facts: [...kinMarks.filter((m) => m.subject === R.id || m.object === R.id).map((m) => m.text), ...sexMarks.filter((m) => m.subject === R.id).map((m) => m.text)], linked: links.map((l) => l.name) } });
  raw24.push({ template: "T-KIN", control: false, referent: R.id, subject: R.display, expected: kin.length ? { type: "kin", kin } : "gap" });
  raw24.push({ template: "T-SPEECH", control: false, referent: R.id, subject: R.display, expected: { type: "linked_names_untyped", note: "the fold types no speech relation; the card shows untyped links with the words between the names (edgesShown of edgesHeld) and the sentences of the being's appearances", edgesShown: shownEdges(R.display).size, edgesHeld: addr.cards[R.display].available.edges, linked: links } });
});
// controls: 3 about a being the fold does not hold; 3 about a fact type no giver states (the uncle of a main being: deriveKin returns a typed gap)
const ABSENT_POOL = process.env.ABSENT_POOL ? JSON.parse(process.env.ABSENT_POOL) : ["Наташа Ростова", "Николай Ростов", "Фёдор Долохов", "Василий Денисов", "Андрей Билибин", "Пётр Багратион", "Михаил Сперанский", "Соня Ростова"];
const absentOk = ABSENT_POOL.filter((n) => n.split(" ").every((w) => { const s = foldRu(w).slice(0, Math.max(4, w.length - 2)); return ![...textTokens].some((t) => t.startsWith(s)); }));
const rng = mulberry32(SEED);
const absentDrawn = absentOk.map((n) => [rng(), n]).sort((a, b) => a[0] - b[0]).slice(0, 3).map((x) => x[1]);
for (const n of absentDrawn) raw24.push({ template: "C-ABSENT", control: true, referent: null, subject: n, expected: "gap", gapKind: "referent_not_in_reading" });
const uncleRefs = SIX.filter((R) => D.byReferent[R.id].uncle.state === "gap").slice(0, 3);
for (const R of uncleRefs) raw24.push({ template: "C-UNCLE", control: true, referent: R.id, subject: R.display, expected: "gap", gapKind: D.byReferent[R.id].uncle.gaps[0].kind, gapSlots: D.byReferent[R.id].uncle.gaps.map((g) => ({ kind: g.kind, slot: g.slot })) });
if (raw24.length !== 24) throw new Error(`${raw24.length} questions, not 24`);
// the order: a seeded shuffle, so that the controls are not all last
const order = raw24.map((q, i) => [mulberry32(SEED + 7 + i)(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const questions = order.map((i, k) => {
  const q = raw24[i], text = TEMPLATES[q.template](q.subject);
  return { n: k + 1, id: `Q${k + 1}`, template: q.template, control: q.control, referent: q.referent, subject: q.subject, text, textD: swap(text), subjectD: swap(q.subject), answerable: q.expected !== "gap", expected: q.expected, ...(q.gapKind ? { gapKind: q.gapKind, gapSlots: q.gapSlots ?? null } : {}) };
});

// ───────────────────────────────────────────────────────────────────────────────────── 7. the ask (the same words in every arm), the arms
const askText = (key) => `┌ ask ─────────────────────────────────────────────────────
Answer in English prose first, briefly. Then give one line for each question, at the end, in the form
Q<n>: <short answer, or the words: not in the context>
Write the name of every person in Russian script, as a Russian text spells it.

${questions.map((q) => `Q${q.n}. ${q[key]}`).join("\n")}
└──────────────────────────────────────────────────────`;
const ASK_A = askText("text"), ASK_D = askText("textD");
const C_NOTE = "The questions below are about the opening chapters of a novel. The novel itself is not given here.";
const ASK_C = ASK_A.replace("or the words: not in the context", "or the words: not known");

const swappedBlocks = process.env.BLOCKS_D ? fs.readFileSync(process.env.BLOCKS_D, "utf8").trimEnd() : swap(blocksText);
const RAW_INTRO = `# The text
Below is a text in full, as written.

<text standing="said" universe="stipulated" from="the text as written">`;
const arms = {
  A: { system: blocksText, user: ASK_A },
  B: { system: `${RAW_INTRO}\n${text.trimEnd()}\n</text>`, user: ASK_A },
  C: { system: C_NOTE, user: ASK_C },
  D: { system: swappedBlocks, user: ASK_D },
};
const armText = (a) => (a.system ? `${a.system}\n\n${a.user}` : a.user);
const armMessages = (a) => (a.system ? [{ role: "system", content: a.system }, { role: "user", content: a.user }] : [{ role: "user", content: a.user }]);

// ───────────────────────────────────────────────────────────────────────────────────── 8. Gary's check of every prompt
const OPTIONS = { num_ctx: 200000, num_predict: 4096 }, MODEL = "claude-opus-5-5";
const garyPlain = makeGary({});
const garyProd = makeGary({ strikeAddresses, apparatusMentions, kondo: makeKondo() });
const material = { A: addrCount(), B: 1, C: 0, D: addrCount() };
function addrCount() { return Object.values(addr.cards).reduce((n, c) => n + c.map.length, 0) + addr.register.length + addr.gaps.length; }
const garyOut = {};
for (const [arm, a] of Object.entries(arms)) {
  const msgs = armMessages(a);
  const plain = garyPlain.check(msgs, { model: MODEL, options: OPTIONS, material: material[arm] });
  const prod = garyProd.hand(msgs, { model: MODEL, options: OPTIONS, material: material[arm] });
  const apparatus = apparatusMentions(msgs.map((m) => m.content).join("\n"));
  const kondoRows = (makeKondo().reviewCall({ messages: msgs, model: MODEL, options: OPTIONS })?.findings ?? []).filter((f) => f.kind === "restated" || f.kind === "contained");
  const restated = [...kondoRows.reduce((m, f) => m.set(f.text, (m.get(f.text) ?? 0) + 1), new Map())].map(([t, n]) => ({ line: t, extraCopies: n }));
  garyOut[arm] = {
    messages: msgs.map((m) => ({ role: m.role, chars: m.content.length })),
    plain_makeGary_empty: { findings: plain.findings, gaps: plain.gaps.map((g) => g.type), tokensEstimated: plain.tokens },
    production_wiring_strikeAddresses_apparatusMentions_kondo: { findings: prod.findings, gaps: prod.gaps.map((g) => g.type), struckCharacters: prod.struck, refused: prod.refused.length, tokensEstimated: prod.tokens },
    apparatusMentions: apparatus.map((m) => ({ term: m.term, excerpt: m.excerpt })),
    nothingTwice_lines: restated,
    addressStruck: prod.struck,
    lastTurnIsUser: msgs.at(-1).role === "user",
    questionLastVerbatim: msgs.at(-1).content === (arm === "D" ? ASK_D : arm === "C" ? ASK_C : ASK_A),
    passes: [...plain.findings, ...prod.findings].every((f) => f.severity === "flag") && prod.struck === 0 && msgs.at(-1).role === "user",
    flags: [...new Set([...plain.findings, ...prod.findings].filter((f) => f.severity === "flag").map((f) => `${f.rule}: ${f.detail}`))],
  };
}

// ───────────────────────────────────────────────────────────────────────────────────── 9. the leak report for D, and the files
const originalTokens = [...pairs.keys()].filter((t) => !shared.has(t));
const dLeaks = leaks(swappedBlocks + "\n" + ASK_D, originalTokens);
const sharedLeft = [...shared].map((t) => ({ token: t, remaining: (swappedBlocks.match(new RegExp(`(?<![\\p{L}\\p{N}])${t}(?![\\p{L}\\p{N}])`, "gu")) ?? []).length }));
const LATIN = ["Bonaparte", "Buonaparte", "Pierre", "André", "Andre", "Hélène", "Helene", "Vasili", "Scherer", "Anna Pavlovna", "Mortemart"];
const latinLeft = LATIN.map((w) => ({ word: w, inD: (swappedBlocks.match(new RegExp(`(?<![\\p{L}])${w}(?![\\p{L}])`, "gu")) ?? []).length })).filter((x) => x.inD > 0);

writeText("blocks.txt", blocksText);
writeStable("address-map.json", { schema: "FoldcodeAnswerAddressMap@1", private: "NEVER included in any prompt", ...addr, questions: questions.map((q) => ({ id: q.id, referent: q.referent })) });
writeStable("questions.json", {
  schema: "FoldcodeAnswerQuestions@1", registered: "generated by template over the fold; never typed", seed: SEED, cardWindowCharacters: CARD_WINDOW,
  templates: Object.fromEntries(Object.entries(TEMPLATES).map(([k, f]) => [k, f("<referent>")])),
  absentPool: { declared: ABSENT_POOL, absentFromTheText: absentOk, drawn: absentDrawn },
  counts: { total: questions.length, template: questions.filter((q) => !q.control).length, controls: questions.filter((q) => q.control).length, answerable: questions.filter((q) => q.answerable).length, expectedGap: questions.filter((q) => !q.answerable).length },
  questions,
});
for (const [arm, a] of Object.entries(arms)) { writeText(`arm-${arm}.txt`, armText(a)); writeStable(`arm-${arm}.messages.json`, armMessages(a)); }
const forward = Object.fromEntries([...pairs].sort((a, b) => (a[0] < b[0] ? -1 : 1)));
writeStable("arm-D-map.json", {
  schema: "FoldcodeAnswerNameSwap@1",
  declaredBases: DECL, generatedBy: "swap.mjs::pairsFor, the declension table of janus priors/declension-rus.json (UniMorph), the way khora folded-card.js generates case forms",
  forward, inverse: Object.fromEntries([...inv].sort((a, b) => (a[0] < b[0] ? -1 : 1))), unmapped,
  sharedWithOtherBeings: [...shared], surfacesReplaced: [...new Set(surfacesOfSix)].sort(),
  perReferent: SIX.map((R) => ({ id: R.id, display: R.display, displayD: swap(R.display) })),
  leakScan: { originalStemsScanned: originalTokens.length, wordsStillBeginningWithAnOriginalStem: dLeaks, sharedTokensLeft: sharedLeft, latinScriptSpellingsLeft: latinLeft },
});
writeStable("gary-check.json", { schema: "FoldcodeAnswerGary@1", model: MODEL, options: OPTIONS, material, arms: garyOut });
const sizes = Object.fromEntries(Object.entries(arms).map(([k, a]) => [k, armText(a).length]));
console.log("questions:", JSON.stringify(Object.fromEntries(Object.entries({ total: 24, answerable: questions.filter((q) => q.answerable).length }))), "absent drawn:", absentDrawn.join(", "), "| uncle controls:", uncleRefs.map((r) => r.display).join(", "));
console.log("arm sizes (characters):", JSON.stringify(sizes));
console.log("swap unmapped:", JSON.stringify(unmapped), "| shared:", [...shared].join(","), "| leaks:", JSON.stringify(dLeaks), "| shared left:", JSON.stringify(sharedLeft), "| latin left:", JSON.stringify(latinLeft));
for (const [arm, g] of Object.entries(garyOut)) console.log(`gary ${arm}: passes=${g.passes} plain=${JSON.stringify(g.plain_makeGary_empty.findings.map((f) => `${f.severity}:${f.rule}`))} prod=${JSON.stringify(g.production_wiring_strikeAddresses_apparatusMentions_kondo.findings.map((f) => `${f.severity}:${f.rule}`))} struck=${g.addressStruck} apparatus=${g.apparatusMentions.length}`);
