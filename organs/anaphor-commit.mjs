// organs/anaphor-commit.mjs — COMMITTING a pronoun: "this pronoun refers to X" is a DEF at Figure (Interpretation: what a thing is taken to be). Penelope asserts it;
// khora and janus only leave evidence. Until she can commit, a pronoun is HELD as a spectrum (an eigenvalue: every candidate the presence rung scored, each with its
// activation). Pure: it takes one text's held spectra, its dependency rows and whatever evidence entries it is handed; it reads no log, calls no model, writes nothing.
//
// THE RULING. Never collapse by activation: khora MEASURED that its binding margin does not separate right from wrong (precision flat across margin quartiles).
// So activation is DISPLAYED (the spectrum as read) and NEVER DECIDES. A candidate leaves only on a declared, checkable fact, and the rule that removed it is named:
//   gender-clash         the pronoun is he-class or she-class (the pronoun's own row: feats Gender=Masc|Fem). A referent that the reading's own pronoun bindings call both a he-class and a
//                        she-class pronoun is contradicted: one of the two is wrong and nothing here says which, so it is not offered to anyone. (These bindings are khora's, not an
//                        independent witness: stated, not hidden.) A janus `binding` entry whose agreement.gender is "mismatch" for this pronoun removes that candidate too.
//                        "unknown" is a HOLE and removes nothing; only "mismatch" does.
//   non-nominal          for a he/she pronoun: a referent none of whose mentions has a noun or proper noun at its head (rows: upos NOUN|PROPN) is not a thing a he/she names (an adjective or
//                        a demonym used as a modifier). A person needs a nominal mention.
//   disjoint-reference   a non-reflexive, non-possessive pronoun that is a CORE ARGUMENT (nsubj, obj, iobj) is not coreferent with another core argument of its own predicate
//                        (the binding principle for pronouns: "Bell defeated him": him is not Bell). Read from janus's `binding` clauseMate when supplied (true or false decided,
//                        null falls back), else from the dependency rows (same head, same sentence, coordination followed up). Adjuncts (obl) and possessive determiners are not
//                        covered: "John saw a snake near him", "John saw his friend" allow coreference.
//   Declared evidence    kinds she is told about by name, read through ADAPTERS. Today: `binding` (janus). Any other kind is a typed gap (no_adapter), never silently ignored or guessed.
// COMMIT iff exactly one candidate survives. NEW when the spectrum has no candidate at all. HELD otherwise (several survive, or none): the survivors and the reasons the rest left are said.
// NO REGULAR EXPRESSIONS: tags are parsed structurally ("Key=Val|Key=Val" split at "|" then at the first "=", "base:subtype" at the first ":"), compared exactly.
// NO NUMBER here is a threshold; nothing is compared with chance, so no seeded null is needed. The only count-like choice is how many spectrum candidates are SHOWN (SHOWN), a display.
export const SCHEMA = "AnaphorCommit@1";
export const SHOWN = 8;
export const KIND = "anaphor-definition", CELL = "DEF·Figure";
export const CORE = Object.freeze(["nsubj", "obj", "iobj"]);

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
/** "A=B|C=D" -> Map; "_" or nothing -> empty. Split at "|" then at the FIRST "=". */
export function parseFeats(s) {
  const m = new Map(); if (typeof s !== "string" || s === "_" || s === "") return m;
  for (const part of s.split("|")) { const i = part.indexOf("="); if (i > 0) m.set(part.slice(0, i), part.slice(i + 1)); }
  return m;
}
/** "nsubj:pass" -> "nsubj" */
export const depBase = (d) => { const s = String(d ?? ""), i = s.indexOf(":"); return i < 0 ? s : s.slice(0, i); };
const sameSpan = (a, b) => Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];

/** adapters: entry kind -> (entry) -> { at: [a,b], ruled: Map ref -> { gender?: "mismatch"|"match"|"unknown", clauseMate?: true|false|null }, anaphor } | null */
export const ADAPTERS = Object.freeze({
  binding: (e) => {
    const b = e?.body, a = b?.anaphor;
    if (!isObj(b) || !isObj(a) || !Number.isInteger(a.at) || !Number.isInteger(a.end) || !Array.isArray(b.candidates)) return null;
    const ruled = new Map();
    for (const c of b.candidates) { const ref = c?.ref?.being; if (typeof ref === "string") ruled.set(ref, { gender: c.agreement?.gender ?? "unknown", clauseMate: c.clauseMate ?? null, role: c.role ?? null }); }
    return { at: [a.at, a.end], ruled, anaphor: a, doc: b.doc ?? null, id: e.id };
  },
});

/** evidenceFrom(entries) -> { items, read: [{kind, id}], gaps }. entries: [{ id, kind, body }]; a kind with no adapter is a gap that says so. */
export function evidenceFrom(entries = []) {
  const items = [], read = [], gaps = [], seen = new Set();
  for (const e of entries) {
    const f = ADAPTERS[e?.kind];
    if (!f) { if (!seen.has(e?.kind)) { seen.add(e?.kind); gaps.push({ kind: e?.kind ?? null, why: "no_adapter", note: `no adapter is registered for evidence kind ${e?.kind}: its shape is not read, so it removes nothing` }); } continue; }
    const x = f(e);
    if (!x) { gaps.push({ kind: e.kind, id: e.id, why: "unreadable", note: "an entry of a kind she reads, whose body does not have the declared shape" }); continue; }
    items.push({ ...x, kind: e.kind }); read.push({ kind: e.kind, id: e.id });
  }
  return { items, read, gaps };
}

function indexRows(rows) {
  const byAt = rows.filter((r) => Number.isInteger(r.at) && Number.isInteger(r.end)).sort((a, b) => a.at - b.at);
  const bySent = new Map(); for (const r of rows) { if (!bySent.has(r.s)) bySent.set(r.s, new Map()); bySent.get(r.s).set(r.id, r); }
  const at = new Map(byAt.map((r) => [`${r.at}:${r.end}`, r]));
  return { byAt, bySent, at };
}
const tokensIn = (ix, a, b) => { const out = []; for (const r of ix.byAt) { if (r.at >= b) break; if (r.at >= a && r.end <= b) out.push(r); } return out; };
/** the head token of a mention, one per sentence it touches: the token whose head is not inside the mention */
function mentionHeads(ix, span) {
  const toks = tokensIn(ix, span[0], span[1]), by = new Map(); for (const t of toks) { if (!by.has(t.s)) by.set(t.s, []); by.get(t.s).push(t); }
  const out = [];
  for (const [, ts] of by) { const ids = new Set(ts.map((t) => t.id)); out.push(ts.find((t) => !ids.has(t.head)) ?? ts[0]); }
  return out;
}
/** follow coordination up: "John and Mary": Mary is conj of John; the coordination's role is John's */
function lifted(ix, t) {
  let c = t; for (let n = 0; n < 32 && c && depBase(c.deprel) === "conj"; n++) { c = ix.bySent.get(c.s)?.get(c.head) ?? null; }
  return c;
}
const genderOf = (row) => { const g = parseFeats(row?.feats).get("Gender"); return g === "Masc" ? "m" : g === "Fem" ? "f" : null; };

/**
 * decide({ held, referents, rows, evidence }) -> { schema, pronouns: [...], gaps, evidenceRead }
 *   held       the text-referents body's `held` (the spectra: { pronoun, at: [a,b], cands: [[ref, activation]...], bound })
 *   referents  the text-referents body's `referents` ([{ ref, face, spans, pronouns }]) and `faces`
 *   rows       the text-reading body's rows (null or empty: a typed gap, nothing is decided)
 *   evidence   entries [{ id, kind, body }] of the kinds she is told about (ADAPTERS), or []
 */
export function decide({ held = null, referents = [], faces = {}, rows = null, evidence = [] } = {}) {
  const gaps = [], ev = evidenceFrom(evidence);
  gaps.push(...ev.gaps);
  if (!Array.isArray(held) || !held.length) { gaps.push({ why: "no_spectrum", note: "the text-referents entry holds no pronoun spectrum (khora writes it only with the held spectrum option)" }); return { schema: SCHEMA, pronouns: [], gaps, evidenceRead: ev.read }; }
  if (!evidence.length) gaps.push({ why: "no_evidence_read", note: "no evidence entry was handed to the organ: only the text's own rows and khora's bindings can remove a candidate" });
  const haveRows = Array.isArray(rows) && rows.length > 0, ix = haveRows ? indexRows(rows) : null;
  if (!haveRows) gaps.push({ why: "no_rows", note: "no dependency rows for this text: no rule that reads them can run, so every pronoun stays held" });
  const refs = new Map((referents ?? []).map((r) => [r.ref, r]));

  // gender calls the reading itself made (khora's bound pronouns), per referent: the spans of both sources, deduplicated
  const calls = new Map();
  if (haveRows) {
    const note = (ref, span) => { const g = genderOf(ix.at.get(`${span[0]}:${span[1]}`)); if (!g) return; const k = `${span[0]}:${span[1]}`; if (!calls.has(ref)) calls.set(ref, new Map()); calls.get(ref).set(k, g); };
    for (const r of referents ?? []) for (const sp of r.pronouns ?? []) note(r.ref, sp);
    for (const h of held) if (typeof h.bound === "string") note(h.bound, h.at);
  }
  const clashOf = (ref) => { const m = calls.get(ref); if (!m) return null; const vs = new Set(m.values()); return vs.has("m") && vs.has("f") ? [...m.entries()].map(([k, g]) => `${k}=${g}`).join(",") : null; };
  const nominal = (ref) => { const r = refs.get(ref); if (!r) return null; const ms = (r.spans ?? []).flatMap((sp) => mentionHeads(ix, sp)); if (!ms.length) return null; return ms.some((t) => t.upos === "NOUN" || t.upos === "PROPN"); };

  const pronouns = [];
  for (const h of held) {
    const at = Array.isArray(h.at) ? [h.at[0], h.at[1]] : null, cands = Array.isArray(h.cands) ? h.cands : [];
    const spectrum = cands.map(([ref, a]) => ({ ref, activation: a }));
    const out = { pronoun: h.pronoun ?? null, at, spectrum, total: spectrum.length, eliminated: [], survivors: [], verdict: "held", defined: null, rule: null, gaps: [] };
    const row = haveRows && at ? ix.at.get(`${at[0]}:${at[1]}`) ?? null : null;
    if (!haveRows) { out.rule = "gap:no_rows"; out.survivors = spectrum.map((c) => c.ref); out.gaps.push("no_rows"); pronouns.push(out); continue; }
    if (!row) { out.rule = "gap:no_row_for_pronoun"; out.survivors = spectrum.map((c) => c.ref); out.gaps.push("no_row_for_pronoun"); pronouns.push(out); continue; }
    if (!spectrum.length) { out.verdict = "new"; out.rule = "no candidate in the spectrum: the anaphor introduces something new"; pronouns.push(out); continue; }
    const f = parseFeats(row.feats), cls = genderOf(row), reflexive = f.get("Reflex") === "Yes", possessive = f.get("Poss") === "Yes", base = depBase(row.deprel);
    const coreP = CORE.includes(base) && !reflexive && !possessive;
    const bound = ev.items.find((x) => x.kind === "binding" && sameSpan(x.at, at));
    const myLift = coreP ? lifted(ix, row) : null, myBase = myLift ? depBase(myLift.deprel) : null;
    const why = new Map();
    const add = (ref, s) => { if (!why.has(ref)) why.set(ref, []); why.get(ref).push(s); };
    for (const { ref } of spectrum) {
      if (cls) {
        const clash = clashOf(ref);
        if (clash) add(ref, `gender-clash: the reading calls it both a he-class and a she-class pronoun (${clash})`);
        const g = bound?.ruled.get(ref)?.gender;
        if (g === "mismatch") add(ref, `gender-clash: janus binding ${bound.id} says the gender agreement is a mismatch`);
        if (nominal(ref) === false) add(ref, "non-nominal: no mention of it has a noun or proper noun at its head");
      }
      if (coreP && myLift && CORE.includes(myBase)) {
        const jr = bound?.ruled.get(ref), cm = jr?.clauseMate ?? null;
        if (cm === true && CORE.includes(depBase(jr.role ?? ""))) add(ref, `disjoint-reference: janus binding ${bound.id} says they share a predicate, and it is a core argument there`);
        else if (cm === null) {
          const r = refs.get(ref);
          for (const sp of r?.spans ?? []) for (const t of mentionHeads(ix, sp)) {
            const l = lifted(ix, t);
            if (l && l.s === myLift.s && l.id !== myLift.id && l.head === myLift.head && CORE.includes(depBase(l.deprel))) add(ref, `disjoint-reference: its mention "${l.form}" at ${l.at} is ${depBase(l.deprel)} of the same predicate as the pronoun (${myBase})`);
          }
        }
      }
    }
    out.eliminated = spectrum.filter((c) => why.has(c.ref)).map((c) => ({ ref: c.ref, why: [...new Set(why.get(c.ref))].join("; ") }));
    out.survivors = spectrum.filter((c) => !why.has(c.ref)).map((c) => c.ref);
    if (out.survivors.length === 1) { out.verdict = "committed"; out.defined = out.survivors[0]; out.rule = "exactly one candidate survives the eliminations"; }
    else if (!out.survivors.length) out.rule = "every candidate was eliminated: none to commit to (an antecedent outside the spectrum, or an elimination that is wrong)";
    else out.rule = `${out.survivors.length} candidates survive: the evidence does not decide, and activation is not evidence`;
    if (!cls) out.gaps.push("pronoun_not_he_or_she");
    if (reflexive) out.gaps.push("reflexive_not_covered_by_disjointness");
    if (bound == null && evidence.length) out.gaps.push("no_binding_entry_for_this_pronoun");
    pronouns.push(out);
  }
  for (const p of pronouns) p.face = p.defined ? (faces?.[p.defined] ?? refs.get(p.defined)?.face ?? null) : null;
  return { schema: SCHEMA, pronouns, gaps, evidenceRead: ev.read };
}

/** the body of an anaphor-definition entry from one decided pronoun; `read` names the entries read */
export function bodyOf(p, read) {
  const top = [...p.spectrum].sort((a, b) => b.activation - a.activation || (a.ref < b.ref ? -1 : 1)).slice(0, SHOWN);
  return {
    pronoun: p.pronoun, at: p.at, defined: p.defined, face: p.face ?? null, verdict: p.verdict, rule: p.rule,
    survivors: p.survivors, eliminated: p.eliminated,
    held: { shown: top.map((c) => [c.ref, c.activation]), of_total: p.total, note: "the spectrum as khora's rung scored it, top by activation; shown, never used to decide" },
    gaps: p.gaps, read,
  };
}
