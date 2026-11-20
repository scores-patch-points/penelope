// organs/reply-check.mjs — THE FABRICATION ALARM: can a reply be UNTRUE? Truth is a property of a CLAIM, never of which words are present. A reply that names a real city can lie; a reply in other words can be true.
// So the reply is read through the READER into claims (injected `replyClaims`: the same reading as everything else, the mechanical paraphrase to canonical claim form), and each claim is judged against the STRUCTURE of the material: which beings it joins, by which relation, under which declared prior.
//   supported         a mark joins the same two beings under the same relation
//   pair_supported    a mark joins the same two beings under a DIFFERENT relation: a paraphrase or a different claim, the relation is UNCHECKED (counted, never silently trusted; no equivalence is assumed without a giver)
//   derived           the machine's own finding (read through the reader) joins them: a derivation, with its premises on the table
//   proposed          a model's nomination that was tested silent: allowed only because it is labelled a proposal
//   contradicted      a mark gives the same being a DIFFERENT value for a relation a giver declared single-valued
//   unsupported       nothing joins them: asserted from silence
//   negation_from_silence  "X does not ..." asserted with no mark that rules it out (silence is a hole, never a no)
// Verdict: fabricated (any claim contradicted, unsupported or negation_from_silence), grounded (every claim supported, pair_supported, derived or proposed), unread (the reader found no claim in the reply: NOT a pass, and not a fail: it is reported as unverified).
// No regex, no word list: the reader reads, the machine compares referents. Pure; the reader is injected.
const lemmaOf = (rel) => String(rel).split("_")[0];
export function checkClaim(c, { marks = [], derived = [], proposals = [], functional = [] } = {}) {
  const joins = (m) => m.a === c.a && m.b === c.b, same = (m) => lemmaOf(m.rel) === lemmaOf(c.rel), pos = (xs) => xs.filter((m) => m.polarity !== "-");
  if (c.polarity === "-") {
    const mine = pos(marks).filter((m) => m.a === c.a && same(m)), ruled = functional.includes(lemmaOf(c.rel)) && mine.some((m) => m.b !== c.b) || marks.some((m) => m.polarity === "-" && joins(m) && same(m));
    return ruled ? { status: "supported", why: "a mark rules it out" } : { status: "negation_from_silence", why: "no mark rules it out: silence is a hole, never a no" };
  }
  if (pos(marks).some((m) => joins(m) && same(m))) return { status: "supported", why: "on record" };
  if (pos(derived).some((m) => joins(m) && same(m))) return { status: "derived", why: "the machine's own finding" };
  if (pos(proposals).some((m) => joins(m) && same(m))) return { status: "proposed", why: "a model's nomination tested silent, labelled as a proposal" };
  const other = pos(marks).filter((m) => m.a === c.a && same(m));
  if (functional.includes(lemmaOf(c.rel)) && other.length) return { status: "contradicted", why: `${c.a} ${other[other.length - 1].rel.split("_").join(" ")} ${other[other.length - 1].b} is on record, and ${lemmaOf(c.rel)} is declared single-valued` };
  if (pos([...marks, ...derived]).some(joins)) return { status: "pair_supported", why: "the two beings are joined by a different relation: the relation is unchecked (no equivalence is assumed without a giver)" };
  return { status: "unsupported", why: "nothing joins these two beings" };
}
export function checkReply({ replyClaims, ...basis }) {
  const claims = (replyClaims ?? []).filter((c) => c.a != null && c.b != null && c.rel).map((c) => ({ claim: { a: c.a, rel: c.rel, b: c.b, polarity: c.polarity ?? "+" }, ...checkClaim(c, basis) }));
  const bad = claims.filter((x) => ["contradicted", "unsupported", "negation_from_silence"].includes(x.status));
  return { verdict: !claims.length ? "unread" : bad.length ? "fabricated" : "grounded", claims, fabricated: bad.map((x) => x.claim), unchecked: claims.filter((x) => x.status === "pair_supported").length };
}

// ---- V3 (2026-11-20, addendum 3): what V2 got wrong on the first runs, fixed at the source ----
// (1) a reply is full of talk ABOUT the discourse ("the machine checked the question", "contradiction in information"): those are not claims about the world and cannot be untrue in the way a fabrication is. A claim is WORLD only if each end is a being the material mentions, a proper name (the parser's own tag, claim.aUpos / bUpos), or a literal.
// (2) a reply that QUOTES a statement ("The statement 'Maria lives in Ely' ...") MENTIONS it, it does not assert it: quoted spans are cut out by the quote tokens' offsets before the reply is read.
// (3) a terse answer ("Leeds.") has no verb and so no claim: it is the FILLER of the question's hole. The claim is the question's pattern with the filler in the hole: (Hugo, live, Leeds). A reply that asserts nothing about the world (a decline, "unknown") cannot be untrue: its verdict is no_assertion, reported separately, correct for an unanswerable question and not an answer to an answerable one.
const QUOTES = new Set(['"', "“", "”"]);   // closed set of quotation characters: data, not words
/** the reply text with every quoted span removed (spans from the quote tokens' offsets, paired in order) */
export function unquoted(text, rows) {
  const qs = rows.filter((r) => r.upos === "PUNCT" && QUOTES.has(r.form) && r.at != null), cuts = [];
  for (let i = 0; i + 1 < qs.length; i += 2) cuts.push([qs[i].at, qs[i + 1].end]);
  let out = "", at = 0; for (const [a, b] of cuts) { out += text.slice(at, a) + " "; at = b; } return out + text.slice(at);
}
export const isWorld = (c, beings) => { if (c.a === c.b) return false; const known = (x) => beings.has(x), name = (u) => u === "PROPN"; return (known(c.a) || name(c.aUpos)) && (known(c.b) || c.object === "literal" || name(c.bUpos)); };
/** the question's pattern (question-from-rows) with the reply's fillers in the hole */
export function fillHole(pattern, fillers) {
  if (!pattern || pattern.gap || !fillers.length) return [];
  if (pattern.kind === "hole-b") return fillers.map((b) => ({ a: pattern.a, rel: pattern.lemma, b, polarity: "+", aUpos: "PROPN", bUpos: "PROPN" }));
  if (pattern.kind === "hole-a") return fillers.map((a) => ({ a, rel: pattern.rel, b: pattern.b, polarity: "+", aUpos: "PROPN", bUpos: "PROPN" }));
  return [];
}
/** checkAnswer({ text, readRows, claimsOf, pattern, marks, derived, proposals, functional }) -> checkReply's result plus { verdict: "no_assertion" } and { ignored, filled, mentions } */
export function checkAnswer({ text, readRows, claimsOf, pattern = null, marks = [], derived = [], proposals = [], functional = [] }) {
  const rows = readRows(text), bare = unquoted(text, rows), beings = new Set([...marks, ...derived].flatMap((m) => [m.a, m.b])), all = claimsOf(bare) ?? [], world = all.filter((c) => isWorld(c, beings));
  let claims = world, filled = false;
  if (!claims.length) { const inRows = readRows(bare).filter((r) => r.upos === "PROPN").map((r) => r.form), f = fillHole(pattern, [...new Set(inRows)]); if (f.length) { claims = f; filled = true; } }
  const r = checkReply({ replyClaims: claims, marks, derived, proposals, functional });
  return { ...r, verdict: r.verdict === "unread" ? "no_assertion" : r.verdict, ignored: all.length - world.length, filled, mentions: rows.length - readRows(bare).length > 0 };
}
