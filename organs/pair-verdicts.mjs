// organs/pair-verdicts.mjs — whether two texts say the same, judged from what other writers left in the log.
// Handle: Penelope. The paraphrase seam (contract shared by khora, janus and penelope, 2026-11-15): Khora
// reads and counts (text-reading), Janus connects (pair-diff: the rows that correspond, the substitutions
// with their word evidence, the orphans; pair-witness: a model's testimony), and Penelope judges under a
// DECLARED bound. A share or a count is Janus's; whether it is enough is hers.
//
//   DEF   declarePairBound: the bound, bylined, with its why and every number it uses (the share a pair
//         must reach to be ADDRESSED, the quantile of the null a word pair's shared count must clear) and
//         the two rules it names (how the quantile is read, how the witness is read). Nothing is defaulted.
//   EVA   judge(diffBody, witnessBody | null, bound) -> { verdict, by, why, reasons }:
//           a word pair is LICENSED when, in both directions, its evidence is not empty, has n > 0 and its
//           shared count is strictly greater than the declared quantile of its nulls;
//           the pair is ADDRESSED when share >= bound.share;
//           ORDER is changed when the (i, j) list of every anchor and every licensed substitution, kept
//           only where contentA is true and sorted by i, descends anywhere in j;
//           REASONS = orphan (any orphan), unlicensed (any substitution not licensed), order;
//           addressed with reasons: "other" by the diff. Otherwise the diff does not settle it: with no
//           witness the answer is "need-witness" (the question is asked only here); with one, each
//           direction is yes when every answer is yes, no when every answer is no, else gap; "same" when
//           both are yes, "other" when either is no, else "undecided"; by the witness.
//         This reproduces ledgers/paraphrase-100/composite/composite.mjs over the log's entries.
//   bodies / marks for her own door (organs/weave-mark.mjs): pair-bound DEF·Ground, witness-request
//         DEF·Figure, pair-verdict EVA·Figure, each with the contract's address and body.
//
// What this file knows is HOW to compute the rules a bound may name (KNOWN_QUANTILE_RULES, KNOWN_WITNESS_RULES,
// keyed by the rule's declared text); WHICH rule applies and every number in it is the bound's. A bound naming a
// rule this file cannot compute is refused, never approximated.
// PURE: no imports, no clock, no randomness, no log access, no text read, no model called.

export const PAIR_SCHEMA = "PairVerdict@1";
const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const refuse = (reason, detail) => ({ schema: PAIR_SCHEMA, ok: false, verdict: "refused", reason, ...(detail ? { detail } : {}) });
const str = (x) => typeof x === "string" && x.trim().length > 0;

/** Rules a bound may name, by their declared text. Each is a computation, not a tolerance. */
export const KNOWN_QUANTILE_RULES = Object.freeze({
  "sorted[min(n-1, ceil(q*n)-1)], count must be strictly greater": {
    cut: (sorted, q) => sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)],
    clears: (shared, cut) => shared > cut,
  },
});
export const NO_WITNESS = "none: the diff settles, no witness is asked";
export const KNOWN_WITNESS_RULES = Object.freeze({
  "three wordings, unanimous per direction": { wordings: 3 },
  // No model, no testimony. Under this rule the diff alone can say "same" (addressed, every substitution licensed,
  // no orphan, order kept), "other" (addressed with a reason) or leave the pair "undecided" (not addressed).
  [NO_WITNESS]: { wordings: 0 },
});

// Licence rules: when two words that a diff pairs as a substitution are the same word. Declared by a bound, bylined,
// each a computation over the two words and nothing else (no corpus, no model). A form-axis rule, never a tolerance.
const ORTH1 = (w) => String(w).toLowerCase().replace(/u/g, "v").replace(/j/g, "i");
const ORTH2 = (w) => ORTH1(w).replace(/(.)\1+/g, "$1").replace(/e$/, "");
export const KNOWN_LICENCE_RULES = Object.freeze({
  "same word when letter case, u/v and i/j are ignored": { same: (a, b) => ORTH1(a) === ORTH1(b) },
  "same word when also a doubled letter is one and a final e is dropped": { same: (a, b) => ORTH2(a) === ORTH2(b) },
});

// ---- DEF -----------------------------------------------------------------------------------------------

/** declarePairBound({ name, by, why, share, wordQuantile, quantileRule, witness, ratified }) -> the bound or a refusal. */
export function declarePairBound(spec = {}) {
  if (!isObj(spec)) return refuse("no_bound");
  if (!str(spec.by)) return refuse("unbylined_bound", "a bound is declared by someone");
  if (!str(spec.why)) return refuse("no_why", "a bound says why it is this bound");
  if (typeof spec.name !== "string" || !/^[A-Za-z0-9._-]+$/.test(spec.name)) return refuse("no_name", "a bound has a name, a plain token, for its address pair-bound:<name>");
  if (typeof spec.share !== "number" || !Number.isFinite(spec.share) || spec.share < 0 || spec.share > 1) return refuse("no_share", "the share a pair must reach to be addressed is declared, a number from 0 to 1");
  const q = spec.wordQuantile;
  if (typeof q !== "number" || !(q > 0 && q < 1)) return refuse("no_word_quantile", "the quantile of the null a word pair must clear is declared, a number strictly between 0 and 1");
  if (!str(spec.quantileRule)) return refuse("no_quantile_rule", "how the quantile of the nulls is read is declared");
  if (!KNOWN_QUANTILE_RULES[spec.quantileRule]) return refuse("unknown_quantile_rule", `this organ computes only: ${Object.keys(KNOWN_QUANTILE_RULES).join(" | ")}`);
  if (!str(spec.witness)) return refuse("no_witness_rule", "how the witness's answers are read is declared");
  if (!KNOWN_WITNESS_RULES[spec.witness]) return refuse("unknown_witness_rule", `this organ computes only: ${Object.keys(KNOWN_WITNESS_RULES).join(" | ")}`);
  const licences = spec.licences === undefined ? [] : spec.licences;
  if (!Array.isArray(licences) || licences.some((r) => typeof r !== "string")) return refuse("bad_licences", "licences is a list of declared licence rules");
  const unknown = licences.find((r) => !KNOWN_LICENCE_RULES[r]);
  if (unknown) return refuse("unknown_licence_rule", `this organ computes only: ${Object.keys(KNOWN_LICENCE_RULES).join(" | ")}`);
  return { schema: PAIR_SCHEMA, ok: true, bound: "pair", name: spec.name, by: spec.by, why: spec.why, ratified: spec.ratified === true,
    share: spec.share, wordQuantile: q, quantileRule: spec.quantileRule, witness: spec.witness, licences: [...licences] };
}

/** boundFromEntry(entry) -> the bound declared by a pair-bound log entry (its name is its address). */
export function boundFromEntry(entry) {
  const addr = typeof entry?.addr === "string" ? entry.addr : "";
  if (!addr.startsWith("pair-bound:") || !isObj(entry.body)) return refuse("not_a_pair_bound");
  return declarePairBound({ ...entry.body, name: addr.slice("pair-bound:".length) });
}

const isBound = (b) => isObj(b) && b.ok === true && b.bound === "pair";

// ---- EVA: the parts ------------------------------------------------------------------------------------

const isCount = (x) => typeof x === "number" && Number.isFinite(x);
/** one direction of word evidence { shared, empty, nulls, n }: malformed -> null */
function direction(ev) {
  if (!isObj(ev) || typeof ev.empty !== "boolean" || !Number.isInteger(ev.n) || ev.n < 0 || !Array.isArray(ev.nulls) || !ev.nulls.every(isCount)) return null;
  if (ev.nulls.length !== ev.n) return null;
  if (!ev.empty && !isCount(ev.shared)) return null;
  return ev;
}
const clearsNull = (ev, bound) => {
  if (ev.empty || ev.n <= 0) return false;
  const R = KNOWN_QUANTILE_RULES[bound.quantileRule];
  const sorted = [...ev.nulls].sort((x, y) => x - y);
  return R.clears(ev.shared, R.cut(sorted, bound.wordQuantile));
};

/** licensed(substitution, bound) -> true | false; null when its evidence is malformed. */
export function licensed(sub, bound) {
  if (!isBound(bound)) return null;
  if (bound.licences?.some((r) => KNOWN_LICENCE_RULES[r].same(sub?.a, sub?.b))) return true;
  const ab = direction(sub?.evidence?.ab), ba = direction(sub?.evidence?.ba);
  if (!ab || !ba) return null;
  return clearsNull(ab, bound) && clearsNull(ba, bound);
}

/** the (i, j) list order is read over: every anchor plus every licensed substitution, contentA only, sorted by i */
const orderPairs = (d, lic) => [
  ...d.anchors.map(([i, j, c]) => ({ i, j, c })),
  ...d.substitutions.filter((_, k) => lic[k]).map((s) => ({ i: s.i, j: s.j, c: s.contentA })),
].filter((p) => p.c === true).sort((x, y) => x.i - y.i);
const descends = (ps) => { for (let k = 1; k < ps.length; k++) if (ps[k].j < ps[k - 1].j) return true; return false; };

function checkDiff(d) {
  if (!isObj(d)) return "not a diff body";
  if (!isCount(d.share)) return "share is not a number";
  if (!Array.isArray(d.anchors) || !d.anchors.every((a) => Array.isArray(a) && a.length === 3 && Number.isInteger(a[0]) && Number.isInteger(a[1]) && typeof a[2] === "boolean")) return "anchors are not [i, j, contentA]";
  if (!Array.isArray(d.substitutions) || !d.substitutions.every((s) => isObj(s) && Number.isInteger(s.i) && Number.isInteger(s.j) && typeof s.contentA === "boolean")) return "substitutions are not { i, j, contentA, evidence }";
  if (!Array.isArray(d.orphans)) return "orphans is not a list";
  return null;
}

/** orderChanged(diffBody, bound) -> true | false; null when the diff or its evidence is malformed. */
export function orderChanged(d, bound) {
  if (!isBound(bound) || checkDiff(d)) return null;
  const lic = d.substitutions.map((s) => licensed(s, bound));
  if (lic.some((x) => x === null)) return null;
  return descends(orderPairs(d, lic));
}

/** reasonsOf(diffBody, bound) -> ["orphan"?, "unlicensed"?, "order"?]; null when malformed. */
export function reasonsOf(d, bound) {
  if (!isBound(bound) || checkDiff(d)) return null;
  const lic = d.substitutions.map((s) => licensed(s, bound));
  if (lic.some((x) => x === null)) return null;
  return [d.orphans.length ? "orphan" : null, lic.some((x) => !x) ? "unlicensed" : null, descends(orderPairs(d, lic)) ? "order" : null].filter(Boolean);
}

/** one direction of the witness under the declared witness rule: "yes" | "no" | "gap"; null when malformed */
export function witnessDirection(answers, bound) {
  const W = isBound(bound) ? KNOWN_WITNESS_RULES[bound.witness] : null;
  if (!W || !Array.isArray(answers) || answers.length !== W.wordings || !answers.every((a) => a === "yes" || a === "no" || a === "unparsed")) return null;
  return answers.every((a) => a === "yes") ? "yes" : answers.every((a) => a === "no") ? "no" : "gap";
}

// ---- EVA: the verdict ----------------------------------------------------------------------------------

/** judge(diffBody, witnessBody | null, bound) -> { ok, verdict: "same"|"other"|"undecided"|"need-witness", by, why, reasons, ... } | refusal */
export function judge(d, w, bound) {
  if (!isBound(bound)) return refuse("no_bound", "a pair is judged only under a declared, bylined pair bound");
  const bad = checkDiff(d);
  if (bad) return refuse("not_a_diff", bad);
  const reasons = reasonsOf(d, bound);
  if (reasons === null) return refuse("malformed_evidence", "a substitution's word evidence is not { shared, empty, nulls, n } with n = nulls.length in both directions");
  const addressed = d.share >= bound.share;
  const at = `share ${d.share} ${addressed ? ">=" : "<"} ${bound.share}`;
  const base = { schema: PAIR_SCHEMA, ok: true, reasons, addressed, share: d.share, bound: { name: bound.name, by: bound.by, ratified: bound.ratified } };
  if (addressed && reasons.length) return { ...base, verdict: "other", by: "diff", why: `addressed (${at}) and the diff shows ${reasons.join(", ")}` };
  if (bound.witness === NO_WITNESS) {
    if (addressed) return { ...base, verdict: "same", by: "diff", why: `addressed (${at}), every substitution licensed${bound.licences.length ? ` (${bound.licences.length} declared licence rule${bound.licences.length === 1 ? "" : "s"})` : ""}, no orphan, order kept; the bound asks no witness` };
    return { ...base, verdict: "undecided", by: "diff", why: `not addressed (${at}): the diff does not cover the pair, and the bound asks no witness, so the pair stays undecided` };
  }
  const unsettled = addressed ? `addressed (${at}) but the diff shows no difference, and a diff alone does not say same` : `not addressed (${at}): the diff does not cover the pair`;
  if (w === null || w === undefined) return { ...base, verdict: "need-witness", by: null, why: unsettled };
  if (!isObj(w) || !isObj(w.answers)) return refuse("not_a_witness", "a witness body carries answers { ab, ba }");
  const W = KNOWN_WITNESS_RULES[bound.witness];
  if (!Array.isArray(w.wordings) || w.wordings.length !== W.wordings) return refuse("not_a_witness", `the bound's witness rule reads ${W.wordings} wordings; the witness has ${Array.isArray(w.wordings) ? w.wordings.length : "none"}`);
  const ab = witnessDirection(w.answers.ab, bound), ba = witnessDirection(w.answers.ba, bound);
  if (!ab || !ba) return refuse("not_a_witness", `each direction carries ${W.wordings} answers, each yes, no or unparsed`);
  const verdict = ab === "yes" && ba === "yes" ? "same" : ab === "no" || ba === "no" ? "other" : "undecided";
  return { ...base, verdict, by: "witness", why: `${unsettled}; the witness (${bound.witness}) says a-as-passage ${ab}, b-as-passage ${ba}`, witness: { ab, ba } };
}

// ---- bodies and marks for her own door --------------------------------------------------------------------

export const KINDS = Object.freeze({
  "pair-bound": { cell: "DEF·Ground", why: "a declared bound under which a pair's diff and witness are judged: the share that addresses a pair, the quantile of the null a word pair must clear, how the witness is read" },
  "witness-request": { cell: "DEF·Figure", why: "a pair the diff does not settle under the bound: the question is put to the witness only here" },
  "pair-verdict": { cell: "EVA·Figure", why: "whether two texts say the same under a declared bound, by the diff or by the witness, with the reasons" },
});
const shaOf = (diffAddr) => (typeof diffAddr === "string" && diffAddr.startsWith("diff:") ? diffAddr.slice(5) : null);

/** the contract's entry bodies (address and body), no log needed */
export const boundBody = (b) => ({ addr: `pair-bound:${b.name}`, body: { by: b.by, why: b.why, ratified: b.ratified, share: b.share, wordQuantile: b.wordQuantile, quantileRule: b.quantileRule, witness: b.witness, ...(b.licences?.length ? { licences: b.licences } : {}) } });
export const requestBody = (diffAddr, j) => ({ addr: `witness-request:${shaOf(diffAddr)}`, body: { pair: `pair:${shaOf(diffAddr)}`, why: j.why } });
export const verdictBody = (diffAddr, j) => ({ addr: `verdict:${shaOf(diffAddr)}`, body: { verdict: j.verdict, by: j.by, why: j.why, reasons: j.reasons } });

/** marksFor({ bound, judgement, diff, boundId, witnessId, log, by }) -> WeaveMark@1 marks for organs/weave-mark.mjs.
 *  diff: the pair-diff entry ({ id, addr }). A request is woven of [diff, bound]; a verdict of [diff, bound, witness?]. */
export function marksFor({ bound = null, judgement = null, diff = null, boundId = null, witnessId = null, log, by = "penelope.pair" } = {}) {
  const out = [];
  if (isBound(bound)) {
    const { addr, body } = boundBody(bound);
    out.push({ by, log, kind: "pair-bound", cell: KINDS["pair-bound"].cell, addr, body, of: [],
      witness: { how: "declared by its byline; not derived from any data" }, declare: { why: KINDS["pair-bound"].why } });
  }
  if (judgement?.ok && shaOf(diff?.addr)) {
    const of = [diff.id, boundId].filter(Boolean);
    const how = "computed from the entries named in `of`, read from the log by kind; no text read, no model called";
    if (judgement.verdict === "need-witness") {
      const { addr, body } = requestBody(diff.addr, judgement);
      out.push({ by, log, kind: "witness-request", cell: KINDS["witness-request"].cell, addr, body, of, basis: { schema: PAIR_SCHEMA }, witness: { how }, declare: { why: KINDS["witness-request"].why } });
    } else {
      const { addr, body } = verdictBody(diff.addr, judgement);
      out.push({ by, log, kind: "pair-verdict", cell: KINDS["pair-verdict"].cell, addr, body, of: judgement.by === "witness" && witnessId ? [...of, witnessId] : of,
        basis: { schema: PAIR_SCHEMA }, witness: { how }, declare: { why: KINDS["pair-verdict"].why } });
    }
  }
  return out;
}
