// organs/tokenizer-rule-def.mjs — PENELOPE'S SIDE OF THE TOKENIZER RULES: define them (DEF·Pattern) and judge them (EVA·Pattern) from the COUNTS janus observed on the shared log.
// The split of work (REFERENT-FIRST rules 13 and 14, the owner's ruling of 2026-11-20: all work happens on the pharos; no system writes to itself or to another repo):
//   janus observes   clitic-attachment SEG·Pattern { corpus, form, nSplit, nGlued }  and  clitic-firing CON·Figure { corpus, form, fired, correct, ... }   (counts only: no rule, no standing, no verdict)
//   penelope defines tokenizer-rule  DEF·Pattern { language, variety, period, effect: "split", position: "suffix", form, giver, standing, evidence: [ids] }   (a rule is a DEF: a standing prior with a NAMED GIVER; a corpus alone is a CANDIDATE, never `given`)
//   penelope judges  rule-verdict    EVA·Pattern { rule: <addr>, status: survived | refuted | underexposed | unexposed, alpha: null (kept for the reader), upTo: the basis, weight, net, robust, n, k, overall, evidence: [ids] }   (the LATEST verdict stands; a rule is in force only when its latest verdict is `survived`)
// THE JUDGEMENT (the owner's ruling of 2026-11-20: "a difference that makes a difference" and the Born rule): a rule has no standing in itself, only through what it CHANGES. Each firing flips one decision from "glued" to "cut": RIGHT when the gold tokenization has a boundary there (`correct`), WRONG otherwise.
// So the rule's evidence is its flips, and its verdict is their balance. NO SIGNIFICANCE LEVEL: the weight is DERIVED from the counts, not chosen (the Born rule's stance: a weight comes from the structure; commitment happens at use).
//   weight   { split: correct / fired, glued: (fired - correct) / fired }: the two readings are HELD, each with its share of the evidence; the heavier one is what a use commits to
//   net      correct - (fired - correct) = the right flips minus the wrong flips
//   robust   the commitment survives dropping any ONE firing (|net| >= 2): a derived stability test, not a chosen threshold; a thin weight is still carried, with n, so a consumer can see how little it rests on
//   status   survived  net > 0 (the cut is the heavier reading: the rule makes a positive difference)
//            refuted   net < 0 (the glued reading is heavier: the rule makes things worse, as "not" cutting "knot")
//            underexposed  net = 0 (both readings equally weighted: nothing is committed, the spectrum stays held)
//            unexposed     it never fired (it makes no difference: idle)
// DOWNSTREAM EVIDENCE (janus `clitic-effect`, CON·Figure; the codec session, 2026-11-20): the rule's measured EFFECT on a downstream thing (LAS on the tokens around the form, split as gold minus glued; for 's, the possessive relation recovered), a NULL made from the same data (random same-shape cuts on the same sentences: draws, seed, nullReaching), and the HARM of a wrong firing (`wrongCuts.delta`: the same measure when a token that merely ends with the form and gold does not cut is cut anyway).
//   expected difference of a firing = (share of right firings) x effect + (share of wrong firings) x harm: the weights are the evidence shares, derived (the Born stance); nothing is chosen. A wrong share with NO harm measure is a typed gap, never zero harm (silence is a hole).
//   survived  expected > 0 AND no null draw reaches the effect (the effect is beyond the null's own range); refuted  expected < 0 (worse than leaving the word glued); underexposed  expected = 0, or > 0 but some null draw reaches it (not separable from a random cut). The empirical rank (nullReaching + 1) / (draws + 1) is REPORTED, with no cut-off chosen. A random cut usually breaks the word, so beating the null is a low bar: the harm term is the real adversary.
// The corpus-wide boundary counts janus also writes (with and without ALL the forms) are carried as `overall` (precision and recall before and after): a report of the aggregate difference, never a gate.
// A rule is per language and variety; none is ever borrowed from the nearest. What a giver must still name is WHO STANDS BEHIND a rule (a treebank is a giver of a candidate; a person or standard makes it `given`): that is the only choice left, and it is not a number.
// Pure (the log is written by weaveEntries through an injected pharos handle); no model, no regex, no word list.
import crypto from "node:crypto";
export const SCHEMA = "TokenizerRuleDef@2";
export const CELLS = Object.freeze({ "tokenizer-rule": "DEF·Pattern", "rule-verdict": "EVA·Pattern" });
const sha16 = (o) => crypto.createHash("sha256").update(JSON.stringify(o), "utf8").digest("hex").slice(0, 16);
const BASIS = "difference that makes a difference: each firing flips a boundary decision from glued to cut, right when the gold tokenization has the boundary; the verdict is the balance of right and wrong flips (and, where a downstream effect with a null is on record, the expected difference of a firing), the weight is derived from the counts and no significance level is chosen";
/** judge({ fired, correct }) -> { status, weight, net, robust, n, k, basis } */
export function judge({ fired, correct }) {
  if (!Number.isInteger(fired) || !Number.isInteger(correct) || fired < 0 || correct < 0 || correct > fired) return { gap: "bad_counts", why: "fired and correct must be whole numbers with 0 <= correct <= fired" };
  const net = correct - (fired - correct), base = { n: fired, k: correct, net, basis: BASIS };
  if (!fired) return { status: "unexposed", weight: null, robust: null, ...base };
  const weight = { split: correct / fired, glued: (fired - correct) / fired }, robust = Math.abs(net) >= 2;
  return { status: net > 0 ? "survived" : net < 0 ? "refuted" : "underexposed", weight, robust, ...base };
}
/** judgeEffect({ fired, correct, effect }) with the evidence a clitic-effect entry carries -> the verdict by the downstream difference, or a typed gap. `nul` = { draws, nullReaching }, `wrongCuts` = { instances, delta } or null. */
export function judgeEffect({ fired, correct, effect, nul, wrongCuts, sentences = null }) {
  const flips = judge({ fired, correct }); if (flips.gap) return flips; if (!fired) return flips;
  if (!Number.isFinite(effect) || !nul || !(nul.draws > 0)) return { gap: "no_effect_evidence", why: "no downstream effect with a null on record: the verdict stays the balance of flips and says so", flips };
  const w = correct / fired, wrong = 1 - w;
  if (wrong > 0 && !(wrongCuts && Number.isFinite(wrongCuts.delta))) return { gap: "no_wrong_cut_measure", why: "some firings are wrong and the harm of a wrong firing was not measured: the expected difference is not computed, and the harm is not assumed to be zero", flips };
  const expected = w * effect + (wrong > 0 ? wrong * wrongCuts.delta : 0), reach = nul.nullReaching ?? 0, rank = (reach + 1) / (nul.draws + 1);
  const status = expected < 0 ? "refuted" : expected > 0 && reach === 0 ? "survived" : "underexposed";
  return { status, weight: flips.weight, expected, effect, harm: wrongCuts ? wrongCuts.delta : null, rank: { nullReaching: reach, draws: nul.draws, empirical: rank, beyondNull: reach === 0 }, robust: flips.robust && nul.draws > 0, flips: { net: flips.net, n: flips.n, k: flips.k }, sentences, basis: BASIS };
}
const okGiver = (g) => g && typeof g.kind === "string" && g.kind && typeof g.name === "string" && g.name;
/** rulesAndVerdicts({ attachments, firings, language, variety, period, giver }) -> { entries, refused, gaps }. `attachments` and `firings` are the janus entries read from the log ({ id, addr, kind, cell, body }). */
export function rulesAndVerdicts({ attachments = [], firings = [], effects = [], language, variety = null, period = null, giver }) {
  const refused = [], gaps = [], entries = [];
  if (!language) return { entries, refused, gaps: [{ gap: "no_language", why: "a rule is per language; none is guessed" }] };
  if (!okGiver(giver)) return { entries, refused, gaps: [{ gap: "no_giver", why: "a tokenizer rule is a DEF with a named giver (kind and name); a corpus alone is a candidate that nobody has stood behind: nothing is defined" }] };
  const mine = (e, kind) => e?.kind === kind && e.cell === (kind === "clitic-attachment" ? "SEG·Pattern" : "CON·Figure") && e.body?.corpus?.language === language && (e.body.corpus.variety ?? null) === (variety ?? null);
  for (const e of [...attachments, ...firings, ...effects]) if (!mine(e, "clitic-attachment") && !mine(e, "clitic-firing") && !mine(e, "clitic-effect")) refused.push({ id: e?.id ?? e?.addr, why: `not a ${language}${variety ? "/" + variety : ""} clitic-attachment (SEG·Pattern) or clitic-firing (CON·Figure) entry` });
  const forms = [...new Set(attachments.filter((e) => mine(e, "clitic-attachment") && e.body.nSplit > 0).map((e) => e.body.form))].sort();
  for (const form of forms) {
    const att = attachments.filter((e) => mine(e, "clitic-attachment") && e.body.form === form), fire = firings.filter((e) => mine(e, "clitic-firing") && e.body.form === form), ids = [...att, ...fire].map((e) => e.id ?? e.addr);
    const addr = `tokenizer-rule:${sha16([language, variety, period, form, giver.name])}`;
    entries.push({ cell: CELLS["tokenizer-rule"], kind: "tokenizer-rule", addr, body: { schema: SCHEMA, by: "penelope", language, variety, period, effect: "split", position: "suffix", form, giver, standing: "candidate", evidence: ids } });
    const fired = fire.reduce((a, e) => a + (e.body.fired ?? 0), 0), correct = fire.reduce((a, e) => a + (e.body.correct ?? 0), 0), eff = effects.filter((e) => mine(e, "clitic-effect") && e.body.form === form).at(-1)?.body;
    let v = eff ? judgeEffect({ fired, correct, effect: eff.effect, nul: eff.null, wrongCuts: eff.wrongCuts ?? null, sentences: eff.sentences ?? null }) : judge({ fired, correct });
    if (v.gap) { gaps.push({ ...v, form }); if (v.flips) v = v.flips; else continue; }                  // a typed gap is reported AND the verdict falls back to the balance of flips, which says it has no downstream evidence
    const rate = (t) => (t && t.predicted && t.gold ? { precision: t.truePositive / t.predicted, recall: t.truePositive / t.gold } : null), b0 = fire.find((e) => e.body.boundaries)?.body.boundaries, overall = b0 ? { without: rate(b0.base), withAllForms: rate(b0.withAllForms) } : null;
    entries.push({ cell: CELLS["rule-verdict"], kind: "rule-verdict", addr: `rule-verdict:${sha16([addr, v.status, v.n ?? v.flips?.n, v.k ?? v.flips?.k, v.expected ?? null])}`, body: { schema: SCHEMA, by: "penelope", rule: addr, status: v.status, alpha: null, upTo: v.basis ?? BASIS, weight: v.weight, net: v.net ?? v.flips?.net, robust: v.robust, n: v.n ?? v.flips?.n, k: v.k ?? v.flips?.k, ...(v.expected !== undefined ? { expected: v.expected, effect: v.effect, harm: v.harm, rank: v.rank, sentences: v.sentences } : { downstream: "none on record" }), overall, evidence: [...fire.map((e) => e.id ?? e.addr), ...(eff ? effects.filter((e) => mine(e, "clitic-effect") && e.body.form === form).map((e) => e.id ?? e.addr) : [])] } });
  }
  if (!forms.length) gaps.push({ gap: "no_attachment_evidence", why: `no clitic-attachment entry for ${language}${variety ? "/" + variety : ""} with a split on record: no rule is defined, and none is borrowed from another language or variety` });
  return { entries, refused, gaps };
}
/** write the entries through an injected pharos handle (kinds declared first); by is Penelope: Interpretation is hers */
export function weaveEntries(P, h, entries) {
  for (const [name, cell] of Object.entries(CELLS)) { try { P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: `kind:${name}`, body: { name, cell } }); } catch { /* declared */ } }
  return entries.map((e) => P.weave(h, { cell: e.cell, kind: e.kind, addr: e.addr, body: e.body }));
}
