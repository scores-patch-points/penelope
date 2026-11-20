// organs/tokenizer-rule-def.mjs — PENELOPE'S SIDE OF THE TOKENIZER RULES: define them (DEF·Pattern) and judge them (EVA·Pattern) from the COUNTS janus observed on the shared log.
// The split of work (REFERENT-FIRST rules 13 and 14, the owner's ruling of 2026-11-20: all work happens on the pharos; no system writes to itself or to another repo):
//   janus observes   clitic-attachment SEG·Pattern { corpus, form, nSplit, nGlued }  and  clitic-firing CON·Figure { corpus, form, fired, correct, ... }   (counts only: no rule, no standing, no verdict)
//   penelope defines tokenizer-rule  DEF·Pattern { language, variety, period, effect: "split", position: "suffix", form, giver, standing, evidence: [ids] }   (a rule is a DEF: a standing prior with a NAMED GIVER; a corpus alone is a CANDIDATE, never `given`)
//   penelope judges  rule-verdict    EVA·Pattern { rule: <addr>, status: survived | refuted | underexposed | unexposed, alpha, upTo, evidence: [ids] }   (the LATEST verdict stands; a rule is in force only when its latest verdict is `survived`)
// THE TEST (Penelope's own, stated in every verdict's `upTo`): of the splits the rule made on a HELD-OUT corpus (`fired`), the share that landed on a gold token boundary (`correct`) is tested against a fair coin, exact one-sided binomial. survived: more than half and p <= alpha. refuted: fewer than half and the mirror p <= alpha.
// underexposed: too few firings for `alpha` to be attainable at all (the smallest n whose all-correct tail is <= alpha, derived from alpha, not chosen). unexposed: it never fired.
// NO NUMBER IS CHOSEN HERE: `alpha` is GIVEN, with a named giver, or the stage refuses with a typed gap (the same stance as the identity tolerance, GL-ID-01). A rule is per language and variety; none is ever borrowed from the nearest one.
// Pure (the log is written by weaveEntries through an injected pharos handle); no model, no regex, no word list.
import crypto from "node:crypto";
export const SCHEMA = "TokenizerRuleDef@1";
export const CELLS = Object.freeze({ "tokenizer-rule": "DEF·Pattern", "rule-verdict": "EVA·Pattern" });
const sha16 = (o) => crypto.createHash("sha256").update(JSON.stringify(o), "utf8").digest("hex").slice(0, 16);
/** exact P(X >= k) for X ~ Binomial(n, 1/2), as a number (BigInt arithmetic: no floating error in the sum) */
export function tailGE(k, n) {
  if (k <= 0) return 1; if (k > n) return 0;
  let c = 1n, sum = 0n; const N = BigInt(n); for (let i = 0n; i <= N; i++) { if (i >= BigInt(k)) sum += c; c = (c * (N - i)) / (i + 1n); }
  const den = 1n << N, scale = 10n ** 18n; return Number((sum * scale) / den) / 1e18;
}
/** the smallest n at which an all-correct run can reach `alpha` at all (0.5^n <= alpha): below it no outcome could ever count, so the rule is underexposed */
export const nMin = (alpha) => { let n = 1; while (0.5 ** n > alpha) n++; return n; };
export function judge({ fired, correct }, { alpha }) {
  if (!Number.isFinite(alpha) || alpha <= 0 || alpha >= 1) return { gap: "alpha_not_given", why: "alpha is a number a giver supplies (0 < alpha < 1); none is chosen here" };
  const upTo = "exact one-sided binomial against a fair coin on a held-out corpus", base = { alpha, upTo, n: fired, k: correct };
  if (!fired) return { status: "unexposed", ...base, p: null };
  if (fired < nMin(alpha)) return { status: "underexposed", ...base, p: tailGE(correct, fired), nMin: nMin(alpha) };
  const pHigh = tailGE(correct, fired), pLow = tailGE(fired - correct, fired);          // P(X >= correct) for a fair coin; the mirror for too FEW correct
  if (correct * 2 > fired && pHigh <= alpha) return { status: "survived", ...base, p: pHigh };
  if (correct * 2 < fired && pLow <= alpha) return { status: "refuted", ...base, p: pLow };
  return { status: "underexposed", ...base, p: pHigh, nMin: nMin(alpha) };                // enough firings, but not distinguishable from a coin: not a survivor, not a refutation
}
const okGiver = (g) => g && typeof g.kind === "string" && g.kind && typeof g.name === "string" && g.name;
/** rulesAndVerdicts({ attachments, firings, language, variety, period, giver, alpha, alphaGiver }) -> { entries, refused, gaps }. `attachments` and `firings` are the janus entries read from the log ({ id, addr, kind, cell, body }). */
export function rulesAndVerdicts({ attachments = [], firings = [], language, variety = null, period = null, giver, alpha, alphaGiver }) {
  const refused = [], gaps = [], entries = [];
  if (!language) return { entries, refused, gaps: [{ gap: "no_language", why: "a rule is per language; none is guessed" }] };
  if (!okGiver(giver)) return { entries, refused, gaps: [{ gap: "no_giver", why: "a tokenizer rule is a DEF with a named giver (kind and name); a corpus alone is a candidate that nobody has stood behind: nothing is defined" }] };
  if (!okGiver(alphaGiver) || !Number.isFinite(alpha)) return { entries, refused, gaps: [{ gap: "alpha_not_given", why: "the verdict's alpha needs a number AND a named giver; neither is chosen here" }] };
  const mine = (e, kind) => e?.kind === kind && e.cell === (kind === "clitic-attachment" ? "SEG·Pattern" : "CON·Figure") && e.body?.corpus?.language === language && (e.body.corpus.variety ?? null) === (variety ?? null);
  for (const e of [...attachments, ...firings]) if (!mine(e, "clitic-attachment") && !mine(e, "clitic-firing")) refused.push({ id: e?.id ?? e?.addr, why: `not a ${language}${variety ? "/" + variety : ""} clitic-attachment (SEG·Pattern) or clitic-firing (CON·Figure) entry` });
  const forms = [...new Set(attachments.filter((e) => mine(e, "clitic-attachment") && e.body.nSplit > 0).map((e) => e.body.form))].sort();
  for (const form of forms) {
    const att = attachments.filter((e) => mine(e, "clitic-attachment") && e.body.form === form), fire = firings.filter((e) => mine(e, "clitic-firing") && e.body.form === form), ids = [...att, ...fire].map((e) => e.id ?? e.addr);
    const addr = `tokenizer-rule:${sha16([language, variety, period, form, giver.name])}`;
    entries.push({ cell: CELLS["tokenizer-rule"], kind: "tokenizer-rule", addr, body: { schema: SCHEMA, by: "penelope", language, variety, period, effect: "split", position: "suffix", form, giver, standing: "candidate", evidence: ids } });
    const fired = fire.reduce((a, e) => a + (e.body.fired ?? 0), 0), correct = fire.reduce((a, e) => a + (e.body.correct ?? 0), 0), v = judge({ fired, correct }, { alpha });
    if (v.gap) { gaps.push({ ...v, form }); continue; }
    entries.push({ cell: CELLS["rule-verdict"], kind: "rule-verdict", addr: `rule-verdict:${sha16([addr, v.status, alpha])}`, body: { schema: SCHEMA, by: "penelope", rule: addr, status: v.status, alpha, alphaGiver, upTo: v.upTo, n: v.n, k: v.k, p: v.p, ...(v.nMin ? { nMin: v.nMin } : {}), evidence: fire.map((e) => e.id ?? e.addr) } });
  }
  if (!forms.length) gaps.push({ gap: "no_attachment_evidence", why: `no clitic-attachment entry for ${language}${variety ? "/" + variety : ""} with a split on record: no rule is defined, and none is borrowed from another language or variety` });
  return { entries, refused, gaps };
}
/** write the entries through an injected pharos handle (kinds declared first); by is Penelope: Interpretation is hers */
export function weaveEntries(P, h, entries) {
  for (const [name, cell] of Object.entries(CELLS)) { try { P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: `kind:${name}`, body: { name, cell } }); } catch { /* declared */ } }
  return entries.map((e) => P.weave(h, { cell: e.cell, kind: e.kind, addr: e.addr, body: e.body }));
}
