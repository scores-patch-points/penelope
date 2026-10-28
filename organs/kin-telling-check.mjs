// organs/kin-telling-check.mjs — G1-3, THE CHECKER: mechanical, and independent of the composer (2026-10-28).
//
// It does NOT import organs/kin-telling.mjs. It receives a composed output (sentences as typed segments) and the RAW sources (the fold, the
// Russian text bytes, the two giver files, the questions) and decides each sentence by itself:
//   C1 typing    every segment is a frame word of the declared closed set, or material with an address that RESOLVES against the source
//                (ru: the whitespace-normalised bytes equal the segment; row/rec: the JSON path holds the string; ask: the question's characters;
//                val: recomputed). An unaddressed material segment, or a kind outside the list (self:model included), fails the sentence.
//   C2 skeleton  the joined text equals the sentence text and the frame texts match a skeleton of THIS file's own table (it duplicates the
//                pre-registration's Appendix A; if the two tables disagree a sentence fails). The claim is PARSED from the sentence.
//   C3 claim     the parsed claim is re-derived from the raw fold (kin.facts, referents, kin.unbound, the lexicon's rules), never from the
//                composer's record or metadata.
//   C4 witness   a quoted witness is a witness of a fact the same paragraph states, and the quote itself supports that fact (it holds a surface of each
//                end and a Russian kin word the lexicon maps to the same relation; for a name-parts sex, a patronymic ending).
//   C5 relevance every claim is about the question's subject or a being the facts relate to it; UNB stands only beside a MISS.
//   C6 laws      first letter capital (or a quotation mark), ends with a full stop, quotes and parentheses balance, and at least one Russian-span
//                address (a ru segment, or the extent ru#0-N for an absence or a count).
//
//   makeChecker({ fold, textBuf, lexicon, lexiconSha, parallel, parallelSha, frames, framesSha?, registeredFramesSha? }) -> checker
//   checker.checkDoc(doc, question) -> { ok, sentences:[{ ok, failures, claim, key }], failures, claimKeys }
//   checker.checkSentence(sentence, docCtx?) -> the per-sentence verdict (used by the mutation tests)
//   typeProse(text) -> what the checker says about plain English with no segments (every sentence unaddressed)
import { createHash } from "node:crypto";

const norm = (s) => String(s).replace(/\s+/g, " ").trim();
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const render = (g) => (g.k === "ru" || g.k === "ask" ? `«${g.t}»` : g.t);
const KINDS = new Set(["f", "ru", "row", "rec", "ask", "val"]);
const EXTENT_KINDS = new Set(["NONE", "MISS", "MISS-SEX", "MISS-OPEN", "ABS"]);

// ── the checker's OWN skeleton table (a second description of Appendix A; not shared with the composer).
// tokens: a string is frame text; { m: kind, n: role } a material slot; { list: kind, n: role, join } a list slot; { opt: [tokens] } an optional clause.
const m = (kind, n) => ({ m: kind, n });
const list = (kind, n, join) => ({ list: kind, n, join });
const opt = (...t) => ({ opt: t });
const TABLE = [
  { id: "REL", v: 0, p: [m("ru", "A"), " is the ", m("row", "T"), " of ", m("ru", "B"), opt(" (", m("rec", "S"), ")"), "."] },
  { id: "REL", v: 1, p: ["The text names ", m("ru", "A"), " as the ", m("row", "T"), " of ", m("ru", "B"), opt(" (", m("rec", "S"), ")"), "."] },
  { id: "REL-D", v: 0, p: [m("ru", "A"), " is derived as the ", m("row", "T"), " of ", m("ru", "B"), " (", m("rec", "G"), ", ", m("rec", "S"), ")."] },
  { id: "REL-D", v: 1, p: ["The facts make ", m("ru", "A"), " the ", m("row", "T"), " of ", m("ru", "B"), " (", m("rec", "G"), ", ", m("rec", "S"), ")."] },
  { id: "WIT", v: 0, p: ["The text states ", m("ru", "Q"), "."] },
  { id: "WIT", v: 1, p: ["The text reads ", m("ru", "Q"), "."] },
  { id: "SEX", v: 0, p: [m("ru", "A"), " is ", m("row", "X"), " (", m("rec", "G"), ", ", m("rec", "S"), ")."] },
  { id: "SEX", v: 1, p: [m("rec", "G"), " gives ", m("ru", "A"), " as ", m("row", "X"), " (", m("rec", "S"), ")."] },
  { id: "SURF", v: 0, p: [m("ru", "A"), " is also written ", list("ru", "L", "and"), "."] },
  { id: "SURF", v: 1, p: ["The text also writes ", m("ru", "A"), " as ", list("ru", "L", "and"), "."] },
  { id: "GLOSS", v: 0, p: [m("ru", "A"), " is ", m("row", "N"), " in the aligned edition (", m("row", "S"), ")."] },
  { id: "GLOSS", v: 1, p: ["The aligned edition gives ", m("row", "N"), " for ", m("ru", "A"), " (", m("row", "S"), ")."] },
  { id: "NONE", v: 0, p: ["No ", list("row", "L", "or"), " of ", m("ru", "B"), " is derived."] },
  { id: "NONE", v: 1, p: ["The facts derive no ", list("row", "L", "or"), " of ", m("ru", "B"), "."] },
  { id: "MISS", v: 0, p: ["The text states no ", list("row", "L", "or"), " of ", m("ru", "B"), "."] },
  { id: "MISS", v: 1, p: ["No ", list("row", "L", "or"), " of ", m("ru", "B"), " is stated by the text."] },
  { id: "MISS-SEX", v: 0, p: ["The text states neither ", m("row", "X1"), " nor ", m("row", "X2"), " for ", m("ru", "B"), "."] },
  { id: "MISS-SEX", v: 1, p: ["Neither ", m("row", "X1"), " nor ", m("row", "X2"), " is stated for ", m("ru", "B"), " by the text."] },
  { id: "MISS-OPEN", v: 0, p: ["No ", m("row", "T"), " of ", m("ru", "B"), " is stated to be ", m("row", "X"), "; absence is not asserted."] },
  { id: "UNB", v: 0, p: ["Kin words in the text with an unbound end: ", list("ru", "L", "and"), "."] },
  { id: "ABS", v: 0, p: ["The reading of the text has no being written ", m("ask", "Q"), "."] },
  { id: "ABS", v: 1, p: ["No being written ", m("ask", "Q"), " is in the reading of the text."] },
];

// The sentence is reduced to a canonical string: its frame text as written, and each material segment as a placeholder naming its kind; each
// skeleton is compiled to a regular expression over that string. A skeleton matches only if the frame text between the slots is exactly the
// skeleton's, the slots are of the declared kinds, and a list is joined exactly (one item: none; two: " join "; more: ", " between and ", join " before the last).
const PH = (k) => `\u0001${k}\u0002`;
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function compile(tokens) {
  let src = "", slots = [];
  for (const tok of tokens) {
    if (typeof tok === "string") src += esc(tok);
    else if (tok.m) { src += PH(tok.m); slots.push({ n: tok.n, kind: tok.m }); }
    else if (tok.list) { const L = PH(tok.list); src += `(?:${L}|${L} ${tok.join} ${L}|${L}(?:, ${L})+, ${tok.join} ${L})`; slots.push({ n: tok.n, kind: tok.list, list: true }); }
    else if (tok.opt) { const inner = compile(tok.opt); src += `(?:${inner.src})?`; slots.push({ opt: inner.slots }); }
  }
  return { src, slots };
}
const COMPILED = TABLE.map((e) => ({ ...e, ...(() => { const c = compile(e.p); return { re: new RegExp(`^${c.src}$`, "u"), slots: c.slots }; })() }));
function matchSkeleton(segs) {
  const frames = [], mats = [];
  let canon = "";
  for (const g of segs) { if (g.k === "f") canon += g.t; else { canon += PH(g.k); mats.push(g); } }
  for (const e of COMPILED) {
    if (!e.re.test(canon)) continue;
    // assign the material segments to the roles, in pattern order
    const fixed = e.slots.filter((x) => !x.opt && !x.list).length, optN = e.slots.find((x) => x.opt)?.opt.length ?? 0;
    const hasList = e.slots.some((x) => x.list);
    const optPresent = optN > 0 && mats.length === fixed + optN;
    const bind = {};
    let i = 0;
    for (const sl of e.slots) {
      if (sl.opt) { if (optPresent) for (const o of sl.opt) bind[o.n] = mats[i++]; }
      else if (sl.list) { const take = mats.length - fixed - (optPresent ? optN : 0); bind[sl.n] = mats.slice(i, i + take); i += take; }
      else bind[sl.n] = mats[i++];
    }
    void hasList; void frames;
    return { id: e.id, v: e.v, bind };
  }
  return null;
}

export function makeChecker({ fold, textBuf, lexicon, lexiconSha, parallel = null, parallelSha = null, namePartsRu = null, frames, registeredFramesSha = null, framesSha = null }) {
  const text = textBuf.toString("utf8");
  const N = textBuf.length;
  const FRAME = new Set(frames.words);
  const PUNCT = new Set([...frames.punctuation, ...frames.quotes]);
  const referents = Array.isArray(fold.referents) ? fold.referents : Object.values(fold.referents);
  const surfacesOf = new Map(referents.map((r) => [r.id, new Set(r.surfaces.map((s) => norm(s.text)))]));
  const allSurfaces = referents.flatMap((r) => r.surfaces.map((s) => norm(s.text)));
  const facts = (fold.kin?.facts ?? []).map((f, idx) => ({ ...f, idx, witnesses: f.witnesses ?? (f.witness ? [f.witness] : []) }));
  const unbound = fold.kin?.unbound ?? [];
  const atoms = lexicon.atoms ?? {};
  const composites = lexicon.composites ?? {};
  const setup = [];
  if (fold.inputs?.text_ru?.sha256 && sha256(textBuf) !== fold.inputs.text_ru.sha256) setup.push("text_sha_mismatch");
  if (fold.inputs?.priors?.kin_lexicon && lexiconSha !== fold.inputs.priors.kin_lexicon) setup.push("lexicon_sha_mismatch");
  if (registeredFramesSha && framesSha !== registeredFramesSha) setup.push("frames_sha_mismatch");

  const beings = (t) => referents.filter((r) => surfacesOf.get(r.id).has(norm(t))).map((r) => r.id);

  // ── address resolution (C1)
  const jsonAt = (doc, path) => { let cur = doc; for (const k of path.split("/")) { if (cur == null) return undefined; cur = cur[k]; } return cur; };
  function resolve(g, question) {
    if (!KINDS.has(g.k)) return `bad_kind:${g.k}`;
    if (g.k === "f") return null;
    if (typeof g.a !== "string" || !g.a) return "unaddressed";
    if (g.k === "ru") {
      const mm = /^ru#(\d+)-(\d+)$/.exec(g.a);
      if (!mm) return "bad_ru_address";
      const a = +mm[1], b = +mm[2];
      if (!(a >= 0 && b > a && b <= N)) return "ru_address_out_of_range";
      return norm(textBuf.subarray(a, b).toString("utf8")) === g.t ? null : "ru_bytes_differ";
    }
    if (g.k === "row") {
      const mm = /^(kin-lexicon|parallel-names)@([0-9a-f]{8}):(key|val):(.+)$/.exec(g.a);
      if (!mm) return "bad_row_address";
      const [, prior, sha8, mode, path] = mm;
      const doc = prior === "kin-lexicon" ? lexicon : parallel, docSha = prior === "kin-lexicon" ? lexiconSha : parallelSha;
      if (!doc || !docSha || docSha.slice(0, 8) !== sha8) return "row_giver_hash_differs";
      const node = jsonAt(doc, path);
      if (node === undefined) return "row_path_missing";
      if (mode === "key") return path.split("/").at(-1) === g.t ? null : "row_key_differs";
      return String(node) === g.t ? null : "row_value_differs";
    }
    if (g.k === "rec") {
      const mm = /^fold:(.+)$/.exec(g.a);
      if (!mm) return "bad_rec_address";
      const v = jsonAt(fold, mm[1]);
      return typeof v === "string" && v === g.t ? null : "rec_value_differs";
    }
    if (g.k === "ask") {
      const mm = /^q:([^#]+)#(\d+)-(\d+)$/.exec(g.a);
      if (!mm || !question || mm[1] !== question.id) return "bad_ask_address";
      return question.text.slice(+mm[2], +mm[3]) === g.t ? null : "ask_text_differs";
    }
    if (g.k === "val") return g.a === "val:count(kin/unbound)" && g.t === String(unbound.length) ? null : "val_differs";
    return "unknown";
  }

  // ── the checker's own derivation over the raw facts
  const sexOf = (id) => facts.filter((f) => f.rel === "sex" && f.a === id);
  const worst = (idxs) => { const o = ["given", "candidate", "opinion"]; return o[Math.max(0, ...idxs.map((i) => o.indexOf(facts[i].standing)))] ; };
  // x is `atom` of y by STATED facts: [{ facts, standing }]
  function statedLicense(atom, x, y) {
    const out = [];
    const sexOk = (cb) => { if (!atom.sex) return cb([]); for (const s of sexOf(x)) if (s.value === atom.sex) cb([s.idx]); };
    for (const f of facts) {
      if (atom.rel === "parent_of" && f.rel === "parent_of") {
        if (atom.end === "a" && f.a === x && f.b === y) sexOk((extra) => out.push({ facts: [f.idx, ...extra] }));
        if (atom.end === "b" && f.a === y && f.b === x) sexOk((extra) => out.push({ facts: [f.idx, ...extra] }));
      } else if ((atom.rel === "sibling_of" || atom.rel === "spouse_of") && f.rel === atom.rel) {
        if ((f.a === x && f.b === y) || (f.a === y && f.b === x)) sexOk((extra) => out.push({ facts: [f.idx, ...extra] }));
      }
    }
    return out.map((o) => ({ ...o, standing: worst(o.facts) }));
  }
  function derivedSiblings(y) {
    const out = [];
    for (const p of facts.filter((f) => f.rel === "parent_of" && f.b === y)) for (const c of facts.filter((f) => f.rel === "parent_of" && f.a === p.a && f.b !== y)) out.push({ x: c.b, facts: [c.idx, p.idx], standing: "candidate" });
    return out;
  }
  // composite derivation: the set of x that are `term` of X (stated `term` facts, or head/alternative composition)
  function deriveComposite(term, X) {
    const c = composites[term];
    const out = new Map();
    for (const f of facts) if (f.rel === "term" && f.term === term && f.b === X) out.set(f.a, [{ facts: [f.idx], standing: f.standing }]);
    if (!c) return out;
    const head = atoms[c.head_of];
    if (!head) return out;
    const holders = (atomKey, y) => {
      const a = { key: atomKey, ...atoms[atomKey], sex: atoms[atomKey].sex ?? null };
      const res = [];
      const cands = new Set();
      for (const f of facts) for (const e of [f.a, f.b]) if (e) cands.add(e);
      for (const x of cands) for (const l of statedLicense(a, x, y)) res.push({ x, ...l });
      if (a.rel === "sibling_of") for (const d of derivedSiblings(y)) { if (a.sex && !sexOf(d.x).some((s) => s.value === a.sex)) continue; res.push(d); }
      return res;
    };
    for (const mid of holders(c.head_of, X)) {
      for (const alt of c.alternatives.filter((al) => al.evaluable && atoms[al.head])) {
        for (const u of holders(alt.head, mid.x)) {
          if (u.x === X || u.x === mid.x) continue;
          const fs = [...mid.facts, ...u.facts];
          const standing = fs.some((i) => facts[i].standing === "candidate") || u.standing === "candidate" || mid.standing === "candidate" ? "candidate" : "given";
          (out.get(u.x) ?? out.set(u.x, []).get(u.x)).push({ facts: fs, standing });
        }
      }
    }
    return out;
  }

  // ── C4 witness support
  // ROUND 3 (D1): the lookup is made on the ORTHOGRAPHIC FOLD of both sides (NFC, lower case, stress mark U+0301 removed, ё to е), the fold the text and the extractor compare by;
  // the lexicon spells its forms as Wiktionary does (with ё and stress marks), the text does not.
  const foldRu = (x) => String(x).normalize("NFC").toLowerCase().replace(/\u0301/g, "").replace(/ё/g, "е");
  const FORMS = new Map(Object.entries(lexicon.russian_forms ?? {}).map(([w, L]) => [foldRu(w), foldRu(L)]));
  const HEADS = new Map(Object.entries(lexicon.russian ?? {}).map(([L, v]) => [foldRu(L), v.en]));
  const kinWordAtoms = (token) => {
    const f = foldRu(token);
    const lemma = FORMS.get(f) ?? (HEADS.has(f) ? f : null);
    return lemma ? (HEADS.get(lemma) ?? null) : null;
  };
  const holdsSurface = (quote, id) => [...surfacesOf.get(id)].some((s) => quote.toLowerCase().includes(s.toLowerCase()));
  function supports(quote, f) {
    const tokens = quote.match(/[\p{L}\p{M}-]+/gu) ?? [];
    const ens = tokens.map(kinWordAtoms).filter(Boolean);
    if (f.rel === "sex") {
      if (!holdsSurface(quote, f.a)) return "end_not_in_quote";
      if (f.giver === "text:ru") return ens.some((e) => atoms[e]?.sex === f.value) ? null : "no_kin_word_for_sex";
      const suf = lexiconPatronymic;
      return suf && tokens.some((t) => suf.some((s) => new RegExp(`${s.slice(0, -1)}.{0,3}$`, "u").test(t.toLowerCase()))) ? null : "no_patronymic_ending";
    }
    if (!holdsSurface(quote, f.a) || !holdsSurface(quote, f.b)) return "end_not_in_quote";
    if (f.rel === "term") return ens.includes(f.term) ? null : "no_kin_word_for_term";
    return ens.some((e) => atoms[e]?.rel === f.rel) ? null : "no_kin_word_for_relation";
  }
  const lexiconPatronymic = namePartsRu?.patronymic?.suffixesCyrillic ?? null;

  // ── C3: re-derive a parsed claim
  function derive(kind, b, docCtx) {
    const used = [];
    const fail = (why) => ({ ok: false, why });
    switch (kind) {
      case "REL": {
        const shown = b.S ? b.S.t : "given";
        if (!atoms[b.T.t] && composites[b.T.t]) {
          // a composite term the text states outright: a `term` fact between exactly those two beings
          for (const rA of beings(b.A.t)) for (const rB of beings(b.B.t)) for (const f of facts) if (f.rel === "term" && f.term === b.T.t && f.a === rA && f.b === rB && f.standing === shown) { used.push(f.idx); docCtx.related.add(rA); docCtx.related.add(rB); }
          return used.length ? { ok: true, facts: used } : fail("no_term_fact_states_it");
        }
        const atom = atoms[b.T.t] ? { key: b.T.t, ...atoms[b.T.t], sex: atoms[b.T.t].sex ?? null } : null;
        if (!atom) return fail("term_not_an_atom");
        for (const rA of beings(b.A.t)) for (const rB of beings(b.B.t)) for (const l of statedLicense(atom, rA, rB)) if (l.standing === shown) { used.push(...l.facts); docCtx.related.add(rA); docCtx.related.add(rB); }
        return used.length ? { ok: true, facts: used } : fail("no_fact_licenses_the_relation");
      }
      case "REL-D": {
        if (!composites[b.T.t]) return fail("term_not_a_composite");
        for (const rA of beings(b.A.t)) for (const rB of beings(b.B.t)) {
          const got = deriveComposite(b.T.t, rB).get(rA);
          if (!got) continue;
          const rec = fold.derivation?.byReferent?.[rB]?.[b.T.t];
          const recorded = rec?.items?.some((it) => it.who === rA && it.derivations.some((d) => d.standing === b.S.t && d.steps.some((s) => s.kind === "rule" && s.giver === b.G.t)));
          if (!recorded) continue;
          for (const l of got) if (l.standing === b.S.t) { used.push(...l.facts); }
          if (used.length) { docCtx.related.add(rA); docCtx.related.add(rB); }
        }
        return used.length ? { ok: true, facts: used } : fail("composition_not_derivable_or_not_recorded");
      }
      case "WIT": {
        const mm = /^ru#(\d+)-(\d+)$/.exec(b.Q.a);
        const addr = b.Q.a;
        const fs = facts.filter((f) => f.witnesses.includes(addr));
        if (!fs.length) return fail("not_a_witness_of_any_fact");
        const stated = fs.filter((f) => docCtx.statedFacts.has(f.idx));
        if (!stated.length) return fail("witness_of_a_fact_the_paragraph_does_not_state");
        for (const f of stated) { const s = supports(b.Q.t, f); if (!s) return { ok: true }; docCtx.lastSupport = s; }
        return fail(`witness_unsupported:${docCtx.lastSupport}`);
      }
      case "SEX": {
        for (const rA of beings(b.A.t)) for (const f of sexOf(rA)) if (f.value === b.X.t && f.giver === b.G.t && f.standing === b.S.t) { used.push(f.idx); docCtx.related.add(rA); }
        return used.length ? { ok: true, facts: used } : fail("no_sex_fact_with_that_giver_and_standing");
      }
      case "SURF": {
        for (const rA of beings(b.A.t)) if (b.L.every((g) => surfacesOf.get(rA).has(norm(g.t)))) { docCtx.related.add(rA); return { ok: true }; }
        return fail("forms_not_surfaces_of_one_being");
      }
      case "GLOSS": {
        const rows = parallel?.rows ?? [];
        for (const rA of beings(b.A.t)) for (const row of rows) {
          if (row.collidesWith || row.english !== b.N.t || row.standing !== b.S.t) continue;
          if (row.forms.some((f) => surfacesOf.get(rA).has(f.form))) { docCtx.related.add(rA); return { ok: true }; }
        }
        return fail("no_non_colliding_parallel_names_row");
      }
      case "NONE": {
        const rs = beings(b.B.t);
        if (!rs.length) return fail("being_unknown");
        for (const t of b.L) {
          if (!composites[t.t]) return fail("term_not_a_composite");
          for (const rB of rs) {
            if (deriveComposite(t.t, rB).size) return fail("a_derivation_exists");
            const rec = fold.derivation?.byReferent?.[rB]?.[t.t];
            if (rec && rec.state !== "gap" && rec.items?.length) return fail("recorded_cell_is_answered");
          }
        }
        rs.forEach((r) => docCtx.related.add(r));
        return { ok: true };
      }
      case "MISS": {
        const rs = beings(b.B.t);
        if (!rs.length) return fail("being_unknown");
        const cands = new Set();
        for (const f of facts) for (const e of [f.a, f.b]) if (e) cands.add(e);
        for (const t of b.L) {
          const a = atoms[t.t] ? { key: t.t, ...atoms[t.t], sex: atoms[t.t].sex ?? null } : null;
          if (!a) return fail("term_not_an_atom");
          for (const rB of rs) for (const x of cands) if (statedLicense(a, x, rB).length) return fail("a_fact_states_it");
        }
        docCtx.missSubjects.add(b.B.t);
        return { ok: true, subject: rs };
      }
      case "MISS-SEX": {
        if (new Set([b.X1.t, b.X2.t]).size !== 2 || ![b.X1.t, b.X2.t].every((x) => Object.values(atoms).some((a) => a.sex === x))) return fail("sex_terms");
        const rs = beings(b.B.t);
        if (!rs.length) return fail("being_unknown");
        for (const rB of rs) if (sexOf(rB).length) return fail("a_sex_fact_exists");
        return { ok: true, subject: rs };
      }
      case "MISS-OPEN": {
        const a = atoms[b.T.t];
        if (!a || a.rel !== "sibling_of" || (a.sex ?? null) !== null) return fail("term_not_sibling");
        const rs = beings(b.B.t);
        if (!rs.length) return fail("being_unknown");
        for (const rB of rs) for (const f of facts.filter((f) => f.rel === "sibling_of" && (f.a === rB || f.b === rB))) {
          const other = f.a === rB ? f.b : f.a;
          if (sexOf(other).some((s) => s.value === b.X.t)) return fail("a_male_sibling_is_stated");
        }
        return { ok: true, subject: rs };
      }
      case "UNB": {
        // round 2: the listed spans ARE the fold's unbound statements (the multiset of byte spans is equal), and each span's bytes are a Russian kin word of the lexicon
        const want = unbound.map((u) => (Array.isArray(u.byteSpan) ? `ru#${u.byteSpan[0]}-${u.byteSpan[1]}` : null));
        if (want.some((w) => w === null)) return fail("fold_unbound_without_byte_span");
        const got = b.L.map((g) => g.a);
        if (got.length !== want.length || [...got].sort().join("|") !== [...want].sort().join("|")) return fail("spans_differ_from_the_folds_unbound_statements");
        for (const g of b.L) if (!(g.t.match(/[\p{L}\p{M}-]+/gu) ?? []).some((t) => kinWordAtoms(t))) return fail("a_listed_span_is_not_a_kin_word");
        return { ok: true };
      }
      case "ABS": {
        const name = norm(b.Q.t);
        if (allSurfaces.some((s) => s.toLowerCase() === name.toLowerCase())) return fail("a_referent_has_that_surface");
        const esc = name.split(" ").map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
        if (new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, "iu").test(text)) return fail("the_whole_name_is_in_the_text");
        return { ok: true };
      }
      default: return fail("unknown_claim_kind");
    }
  }

  const claimKey = (kind, b) => JSON.stringify([kind, ...Object.keys(b).sort().map((k) => [k, Array.isArray(b[k]) ? b[k].map((g) => g.t) : b[k].t])]);

  // C6 laws on one sentence
  function laws(sent) {
    const v = [];
    const t = sent.text;
    const first = (t.match(/\p{L}/u) ?? [""])[0];
    if (!/^[«“]/.test(t) && first && first !== first.toUpperCase()) v.push("L1_first_letter");
    if (!/\.$/.test(t)) v.push("L2_full_stop");
    if ((t.match(/«/g) ?? []).length !== (t.match(/»/g) ?? []).length) v.push("L3_quotes");
    if ((t.match(/\(/g) ?? []).length !== (t.match(/\)/g) ?? []).length) v.push("L3_parentheses");
    return v;
  }

  function newDocCtx(question) {
    return { question, related: new Set(), statedFacts: new Set(), missSubjects: new Set(), lastSupport: null, hasMiss: false };
  }

  /** The verdict on one sentence. `docCtx` carries what the paragraph has stated so far (for WIT, relevance, UNB). */
  function checkSentence(sent, docCtx = newDocCtx(null)) {
    const failures = [];
    const fail = (code, detail = null) => failures.push({ code, detail });
    const segs = Array.isArray(sent.segs) ? sent.segs : [];
    if (!segs.length) { fail("no_segments"); return { ok: false, failures, claim: null, key: null }; }
    // C1
    for (const g of segs) {
      const why = resolve(g, docCtx.question);
      if (why) fail("C1_" + why, g.k === "f" ? null : g.t);
      if (g.k === "f") {
        for (const w of g.t.toLowerCase().match(/[\p{L}]+/gu) ?? []) if (!FRAME.has(w)) fail("C1_frame_word_outside_set", w);
        for (const ch of g.t.replace(/[\p{L}\s]/gu, "")) if (!PUNCT.has(ch)) fail("C1_frame_punctuation_outside_set", ch);
        if (/[0-9]/.test(g.t)) fail("C1_digit_in_frame");
      }
    }
    // text equality
    if (segs.map(render).join("") !== sent.text) fail("C2_text_differs_from_segments");
    // C2
    const sk = matchSkeleton(segs);
    if (!sk) { fail("C2_no_skeleton"); return { ok: false, failures, claim: null, key: null }; }
    // extent
    if (EXTENT_KINDS.has(sk.id)) { if (sent.extent !== `ru#0-${N}`) fail("C6_no_extent"); }
    // C6
    for (const l of laws(sent)) fail(l);
    const hasRu = segs.some((g) => g.k === "ru" && !resolve(g, docCtx.question)) || (EXTENT_KINDS.has(sk.id) && sent.extent === `ru#0-${N}`);
    if (!hasRu) fail("C6_no_russian_span_address");
    // C3 / C4
    const d = derive(sk.id, sk.bind, docCtx);
    if (!d.ok) fail("C3_" + sk.id + "_" + d.why);
    else if (d.facts) d.facts.forEach((i) => docCtx.statedFacts.add(i));
    return { ok: failures.length === 0, failures, claim: sk.id, variant: sk.v, key: claimKey(sk.id, sk.bind), bind: sk.bind, derived: d };
  }

  /** Check a whole paragraph: facts-bearing claims first, then the WITs (they depend on what is stated), then relevance. */
  function checkDoc(doc, question) {
    const dc = newDocCtx(question);
    const verdicts = new Array(doc.sentences.length);
    const order = doc.sentences.map((s, i) => i).sort((p, q) => (doc.sentences[p].claim === "WIT" ? 1 : 0) - (doc.sentences[q].claim === "WIT" ? 1 : 0) || p - q);
    for (const i of order) verdicts[i] = checkSentence(doc.sentences[i], dc);
    // C5 relevance
    const X = subjectOf(doc, question);
    // the beings the facts relate to the subject: the subject and every being within two steps over the stated kin facts (the derivation's gaps
    // name a parent's or a child's sibling slot, and a sibling that the shared-parent rule would derive is two steps away)
    const allowed = new Set(X ? [X] : []);
    const step = (set) => { const next = new Set(set); for (const f of facts) { if (f.rel === "sex" || !f.b) continue; if (set.has(f.a)) next.add(f.b); if (set.has(f.b)) next.add(f.a); } return next; };
    if (X) for (const r of step(step(allowed))) allowed.add(r);
    const hasMiss = verdicts.some((v) => v.claim === "MISS");
    doc.sentences.forEach((s, i) => {
      const v = verdicts[i];
      if (!v.claim) return;
      const fail = (code) => { v.failures.push({ code, detail: null }); v.ok = false; };
      const b = v.bind;
      const mentions = ["A", "B"].filter((r) => b[r]?.k === "ru").flatMap((r) => beings(b[r].t));
      if (["REL", "REL-D", "SEX", "SURF", "GLOSS", "NONE", "MISS", "MISS-SEX", "MISS-OPEN"].includes(v.claim)) {
        if (doc.kind === "absent" || doc.template === "C-ABSENT") fail("C5_claim_in_an_absent_name_paragraph");
        else if (!X) fail("C5_no_subject");
        else if (!mentions.some((r) => allowed.has(r))) fail("C5_irrelevant_to_the_subject");
        else if ((v.claim === "REL" || v.claim === "REL-D") && ![b.A, b.B].some((g) => beings(g.t).includes(X))) fail("C5_relation_not_about_the_subject");
        else if (["SURF", "GLOSS", "SEX", "NONE"].includes(v.claim) && !mentions.includes(X)) fail("C5_claim_not_about_the_subject");
      }
      if (v.claim === "UNB" && !hasMiss) fail("C5_unb_without_miss");
      if (v.claim === "ABS" && !(doc.template === "C-ABSENT")) fail("C5_abs_outside_absent_question");
    });
    const failures = verdicts.flatMap((v, i) => v.failures.map((f) => ({ ...f, sentence: i })));
    return { ok: failures.length === 0 && verdicts.length > 0, sentences: verdicts, failures, claimKeys: verdicts.map((v) => v.key) };
  }
  function subjectOf(doc, question) {
    if (question?.referent) return question.referent;
    const mm = /^[BF]:(.+)$/.exec(doc.id ?? "");
    return mm ? mm[1] : null;
  }

  return { setup, checkSentence, checkDoc, newDocCtx, beings, deriveComposite, facts, N, resolve };
}

/** Plain English with no segments: every sentence is unaddressed, hence a failure of the G1-3 check. Returns the sentence count and the failures. */
export function typeProse(text) {
  const sentences = String(text).split(/(?<=[.!?])\s+|\n+/u).map((s) => s.trim()).filter(Boolean);
  return { sentences: sentences.length, failures: sentences.map((s) => ({ text: s, code: "C1_unaddressed_no_segments" })) };
}
