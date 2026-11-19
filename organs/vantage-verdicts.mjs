// organs/vantage-verdicts.mjs — sameness from a vantage: Penelope's DEF and EVA over questions someone else asked
// and answers someone else gave. PURE: no imports of any other repo, no text read, no model, no clock.
//
// Arm LS of the effect-equivalence pre-registration (Addenda PP and QQ):
//   Eq_P(s, c) <=> no part of the difference makes a difference to P, and P is the set of questions asked of BOTH texts.
//   DEF   declarePerspective: the questions, bylined, with why. Questions come from outside this organ.
//   EVA   judgeVantage: per question, the outcome of the two answers
//           same      both sides answer and the answers share an element
//           differ    both answer and share nothing
//           one-side  only one side answers
//           neither   neither side answers
//         then the verdict: gap (P can ask nothing either text answers), other (any differ or one-side),
//         same (every answerable question agrees). "Same" is always same FOR this perspective.
//   Elements are compared as written, or as the same word under a declared licence rule (pair-verdicts.mjs).
//   Not here: "contradicts" (an earned dispute) and "unrelated" (no shared ground); those need other organs.
import { KNOWN_LICENCE_RULES } from "./pair-verdicts.mjs";

export const VANTAGE_SCHEMA = "VantageVerdict@1";
const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const str = (x) => typeof x === "string" && x.trim().length > 0;
const refuse = (reason, detail) => ({ schema: VANTAGE_SCHEMA, ok: false, verdict: "refused", reason, ...(detail ? { detail } : {}) });

/** declarePerspective({ name, by, why, questions: [{ id, asks }], ratified }) -> the DEF, or a refusal. */
export function declarePerspective(spec = {}) {
  if (!isObj(spec)) return refuse("no_perspective");
  if (!str(spec.by)) return refuse("unbylined_perspective", "a perspective is asked by someone");
  if (!str(spec.why)) return refuse("no_why", "a perspective says why it asks these questions");
  if (typeof spec.name !== "string" || !/^[A-Za-z0-9._-]+$/.test(spec.name)) return refuse("no_name", "a perspective has a plain-token name for its address");
  const q = spec.questions;
  if (!Array.isArray(q) || !q.length) return refuse("no_questions", "a perspective is at least one question");
  if (q.some((x) => !isObj(x) || typeof x.id !== "string" || !/^[A-Za-z0-9._-]+$/.test(x.id) || !str(x.asks) || (x.upos !== undefined && !str(x.upos)))) return refuse("bad_question", "each question has a plain-token id, the words it asks and, optionally, the class of row it asks about");
  if (spec.reweigh !== undefined && spec.reweigh !== RE_WEIGH) return refuse("unknown_reweigh", `this organ computes only: ${RE_WEIGH}`);
  if (new Set(q.map((x) => x.id)).size !== q.length) return refuse("repeated_question");
  return { schema: VANTAGE_SCHEMA, ok: true, perspective: true, name: spec.name, by: spec.by, why: spec.why, ratified: spec.ratified === true,
    questions: q.map((x) => ({ id: x.id, asks: x.asks, ...(x.upos ? { upos: x.upos } : {}) })), ...(spec.reweigh ? { reweigh: spec.reweigh } : {}) };
}
// REC's one revision of a perspective: the whole text re-weighs the part. An answer element a question asks for as class C is kept
// only if, across the whole text the answer came from, its dominant class is C (or the whole has no evidence about it).
export const RE_WEIGH = "dominant-class-in-whole";
export function dominantClass(counts) {
  if (!isObj(counts)) return null;
  const es = Object.entries(counts).filter(([, n]) => Number.isFinite(n) && n > 0).sort((x, y) => y[1] - x[1]);
  return es.length && (es.length === 1 || es[0][1] > es[1][1]) ? es[0][0] : null;
}
export const reweigh = (answer, q, table) => (!Array.isArray(answer) || !q.upos || !isObj(table)) ? answer
  : answer.filter((e) => { const d = dominantClass(table[e]); return d === null || d === q.upos; });
const isP = (p) => isObj(p) && p.ok === true && p.perspective === true;

const same = (x, y, licences) => String(x) === String(y) || licences.some((r) => KNOWN_LICENCE_RULES[r]?.same(x, y));
const answered = (a) => Array.isArray(a) && a.length > 0;

/** outcomeOf(answerA, answerB, licences) -> "same" | "differ" | "one-side" | "neither" */
export function outcomeOf(a, b, licences = []) {
  const A = answered(a), B = answered(b);
  if (!A && !B) return "neither";
  if (!A || !B) return "one-side";
  return a.some((x) => b.some((y) => same(x, y, licences))) ? "same" : "differ";
}
/** strictly the same set of answers, under the licences */
const equalSets = (a, b, licences) => a.every((x) => b.some((y) => same(x, y, licences))) && b.every((y) => a.some((x) => same(x, y, licences)));

/** judgeVantage({ perspective, a, b, licences }) -> { ok, verdict: "same"|"other"|"gap", questions, strict, why } | refusal.
 *  a, b: { <question id>: [answer elements] } as given by whoever answered each text. */
export const PROOF_SET = "set";   // sameness must be PROVEN: every answerable question answered as the same set on both sides
export function judgeVantage({ perspective, a: a0, b: b0, licences = [], classesA = null, classesB = null, proof = null } = {}) {
  let a = a0, b = b0;
  if (isP(perspective) && perspective.reweigh === RE_WEIGH && isObj(a0) && isObj(b0)) {
    const re = (ans, table) => Object.fromEntries(perspective.questions.map((q) => [q.id, reweigh(ans[q.id], q, table)]));
    a = re(a0, classesA); b = re(b0, classesB);
  }
  if (!isP(perspective)) return refuse("no_perspective", "a pair is judged only from a declared, bylined perspective");
  if (!isObj(a) || !isObj(b)) return refuse("no_answers");
  const bad = licences.find((r) => !KNOWN_LICENCE_RULES[r]);
  if (bad) return refuse("unknown_licence_rule", bad);
  const qs = perspective.questions.map((q) => {
    const outcome = outcomeOf(a[q.id], b[q.id], licences);
    return { id: q.id, outcome, ...(outcome === "same" ? { strict: equalSets(a[q.id], b[q.id], licences) } : {}) };
  });
  const answerable = qs.filter((x) => x.outcome !== "neither");
  const base = { schema: VANTAGE_SCHEMA, ok: true, perspective: { name: perspective.name, by: perspective.by, ratified: perspective.ratified }, questions: qs };
  if (!answerable.length) return { ...base, verdict: "gap", strict: false, why: "the perspective asks nothing that either text answers, so it cannot tell" };
  const off = answerable.filter((x) => x.outcome === "differ" || x.outcome === "one-side");
  if (off.length) return { ...base, verdict: "other", strict: false, why: `${off.map((x) => `${x.id}: ${x.outcome}`).join(", ")}` };
  const strict = answerable.every((x) => x.strict === true);
  if (proof === PROOF_SET && !strict) return { ...base, verdict: "other", strict, why: `not proven: ${answerable.filter((x) => x.strict !== true).map((x) => x.id).join(", ")} agree only by sharing an element; sameness is earned, so the default stands` };
  return { ...base, verdict: "same", strict, why: `every answerable question (${answerable.length}) agrees${strict ? ", and each as the same set" : ", sharing an element"}` };
}

// ---- marks for her own door ------------------------------------------------------------------------------------
export const KINDS = Object.freeze({
  perspective: { cell: "DEF·Ground", why: "a declared perspective: the questions a pair is asked from, bylined, with why; the questions come from outside" },
  "vantage-verdict": { cell: "EVA·Figure", why: "whether two texts are the same for a declared perspective: per question, same / differ / one-side / neither, then same, other or gap" },
});
export const perspectiveBody = (p) => ({ addr: `perspective:${p.name}`, body: { by: p.by, why: p.why, ratified: p.ratified, questions: p.questions } });
export const verdictBody = (pairSha, j) => ({ addr: `vantage:${pairSha}`, body: { verdict: j.verdict, strict: j.strict, why: j.why, perspective: j.perspective.name, ratified: j.perspective.ratified, questions: j.questions } });

// ---- REC: reopen what the verdicts left, from what the log can show --------------------------------------------------
/** nominate({ perspective, rows }) -> proposals. rows: [{ pair, verdict, questions: [{ id, outcome }], a, b, classesA, classesB }].
 *  Only one revision exists: re-weigh by the dominant class in the whole. It is nominated when a residue element (an element on
 *  one side of a differ / one-side question) is, in its own whole text, dominantly some other class than the question asks for:
 *  the part's reading is outvoted by the whole's. Nothing is nominated without such an element, and nothing twice. */
export function nominate({ perspective, rows } = {}) {
  if (!isP(perspective) || perspective.reweigh === RE_WEIGH) return [];
  const because = [];
  for (const r of rows ?? []) {
    if (r.verdict === "same") continue;
    for (const o of r.questions ?? []) {
      if (o.outcome !== "differ" && o.outcome !== "one-side") continue;
      const q = perspective.questions.find((x) => x.id === o.id);
      if (!q?.upos) continue;
      for (const [side, ans, table] of [["a", r.a?.[o.id], r.classesA], ["b", r.b?.[o.id], r.classesB]])
        for (const e of ans ?? []) {
          const d = dominantClass(table?.[e]);
          if (d !== null && d !== q.upos) because.push({ pair: r.pair, question: o.id, side, element: e, asked: q.upos, dominant: d, counts: table[e] });
        }
    }
  }
  return because.length ? [{ revision: RE_WEIGH, why: "residue elements are dominantly another class in their own whole text: the whole outvotes the part", because }] : [];
}

/** guardRevision({ before, after, share }) -> { accept, ... }. before / after: [{ pair, share: <geometry's coverage>, verdict }].
 *  Two independent organs must not be set against each other: a pair the geometry does NOT cover (share < bound) must not become
 *  "same" (a violation), and the pairs the geometry covers that the verdict still refuses (the disagreement) must not grow.
 *  A revision that moves no verdict is refused as a no-op. */
export function guardRevision({ before, after, share } = {}) {
  const viol = (rs) => rs.filter((r) => r.share < share && r.verdict === "same").map((r) => r.pair);
  const disagree = (rs) => rs.filter((r) => r.share >= share && r.verdict !== "same").map((r) => r.pair);
  const moved = after.filter((r) => before.find((b) => b.pair === r.pair)?.verdict !== r.verdict).map((r) => r.pair);
  const v0 = viol(before), v1 = viol(after), d0 = disagree(before), d1 = disagree(after);
  const accept = moved.length > 0 && v1.length <= v0.length && d1.length <= d0.length;
  return { accept, moved, violations: { before: v0, after: v1 }, disagreements: { before: d0, after: d1 },
    why: !moved.length ? "no verdict moved: a no-op is refused" : v1.length > v0.length ? "a pair the geometry does not cover became same: refused" : d1.length > d0.length ? "the disagreement with the geometry grew: refused" : `accepted: ${moved.length} verdict(s) moved, violations ${v0.length} to ${v1.length}, disagreements ${d0.length} to ${d1.length}` };
}
