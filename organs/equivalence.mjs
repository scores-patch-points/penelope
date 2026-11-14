// organs/equivalence.mjs — the equivalence judge: DEF, EVA, REC over differences somebody else found.
// Handle: Penelope. Janus does the GEOMETRY (where two texts part, what stands on each side; the text
// finder's stop for a pair under one declared ground). Penelope does the CALCULUS: what happens to that
// result as the frame is varied. (The person, 2026-11-14: "let janus handle geometry, penelope handles
// calculus"; "penelope is likely the system that would be figuring out DEF EVA REC, which is how we know
// when two paraphrases are equivalent".)
//
//   DEF   a LADDER of grounds, loosest to strictest, declared and bylined. No ladder, no judgement.
//         The judge types no tolerance: the unit of difference at a rung is that ground's own.
//   EVA   for one pair, the verdict as a FUNCTION of the rung, with its first difference (the step at
//         which the verdict changes), its limit (the verdict that holds from some rung to the strictest
//         rung covered), and the accumulation of surviving distinctions at each rung.
//   REC   a re-judgement under a longer ladder or with new stops, issued `of` the earlier one, saying
//         what held and what changed.
//
// "Same" is never said bare: only "same up to <rung>", or "same over the ladder covered". A rung with
// no decided stop is UNDECIDED and is named in the range; the judge never fills it in.
// The judge calls no model, reads no text and sees no label. PURE (no imports, no clock, no randomness).
//
// Pre-registered: experiments/equivalence/PREREG.md.

export const EQUIVALENCE_SCHEMA = "Equivalence@1";
export const VERDICTS = Object.freeze(["same", "different", "undecided"]);
const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const refuse = (reason, detail) => ({ schema: EQUIVALENCE_SCHEMA, ok: false, verdict: "refused", reason, ...(detail ? { detail } : {}) });

/** declareLadder({ rungs, by, why }) -> the DEF, or a refusal. rungs: ground names, loosest first. */
export function declareLadder(spec = {}) {
  if (!isObj(spec)) return refuse("no_ladder");
  if (typeof spec.by !== "string" || !spec.by.trim()) return refuse("unbylined_ladder", "a ladder is declared by someone");
  if (typeof spec.why !== "string" || !spec.why.trim()) return refuse("no_why", "a ladder says why its rungs are in this order");
  const r = spec.rungs;
  if (!Array.isArray(r) || r.length < 2 || r.some((x) => typeof x !== "string" || !x)) return refuse("too_few_rungs", "a first difference needs at least two rungs");
  if (new Set(r).size !== r.length) return refuse("repeated_rung");
  return { schema: EQUIVALENCE_SCHEMA, ok: true, rungs: Object.freeze([...r]), by: spec.by, why: spec.why, ratified: spec.ratified === true };
}

/** readStop(stop) -> { verdict, why } at one rung. The finder's four values, mapped once, here.
 *  is = same; is-not = different; both, neither, unsaid, an error, a refusal or no stop = undecided. */
export function readStop(stop, { both = "undecided" } = {}) {
  if (!isObj(stop)) return { verdict: "undecided", why: "no stop at this rung" };
  if (stop.error) return { verdict: "undecided", why: "the finder errored" };
  if (stop.refused) return { verdict: "undecided", why: "the finder refused" };
  const v = stop.verdict4;
  if (!isObj(v)) return { verdict: "undecided", why: "the stop carries no four-valued verdict" };
  if (v.unsaid) return { verdict: "undecided", why: "a branch the ground requires could not be said" };
  if (v.value === "is") return { verdict: "same", why: "is" };
  if (v.value === "is-not") return { verdict: "different", why: "is-not" };
  // "both" (is and is-not standpoints together). Pre-registered reading: undecided. The finder's owner reads it as a
  // DECIDED not-same with something shared (its hold-out rule: same only when the standing is exactly "is"), with the
  // direction in `whole`. That reading is the option both: "different"; the relation is reported, never used to decide.
  if (v.value === "both" && both === "different") return { verdict: "different", why: "both: not the same, with something shared", relation: relationOf(stop.whole) };
  return { verdict: "undecided", why: `the searches disagree or say nothing (${String(v.value)})` };
}

/** relationOf(whole) -> which text carries the other, from the finder's whole-text reading. Reported only. */
export function relationOf(whole) {
  if (!isObj(whole)) return "unknown";
  const a = whole.a_says_b === "yes", b = whole.b_says_a === "yes", an = whole.a_says_b === "no", bn = whole.b_says_a === "no";
  if (a && b) return "contested"; // each whole carries the other, yet a part or a figure says no
  if (a && bn) return "a contains b";
  if (an && b) return "b contains a";
  if (an) return "apart"; // the whole said no; the other direction was not asked or also no
  return "unknown";
}

const keyOf = (d) => [d.layer ?? "", d.kind ?? "", d.side ?? "", (d.a?.text ?? "") + "|" + (d.b?.text ?? "")].join("\u0001");
/** surviving(stop) -> the keys of the distinctions that survived at this rung (the accumulation's terms). */
export function surviving(stop) {
  if (!isObj(stop) || !Array.isArray(stop.distinctions)) return [];
  return stop.distinctions.filter((d) => isObj(d) && d.survives === true).map(keyOf);
}

/** judge({ pid, ladder, stops }) -> the EVA for one pair, or a refusal.
 *  stops: { <ground name>: the finder's stop for this pair under that ground }. */
export function judge({ pid, ladder, stops, both = "undecided" } = {}) {
  if (!isObj(ladder) || ladder.ok !== true) return refuse("no_ladder", "judge needs a declared ladder (declareLadder)");
  if (typeof pid !== "string" || !pid) return refuse("no_pair");
  if (!isObj(stops)) return refuse("no_stops");
  const rungs = ladder.rungs.map((g) => {
    const s = stops[g], r = readStop(s, { both }), sv = surviving(s);
    return {
      rung: g, verdict: r.verdict, why: r.why, ...(r.relation ? { relation: r.relation } : {}), surviving: sv.length, keys: sv,
      // the integral against the standing: reported, never repaired
      accumulationAgrees: r.verdict === "undecided" ? null : r.verdict === "same" ? sv.length === 0 : sv.length > 0,
    };
  });
  // the first difference along the ladder: every step where the verdict changes
  const steps = [];
  for (let i = 1; i < rungs.length; i++) if (rungs[i].verdict !== rungs[i - 1].verdict) steps.push({ from: rungs[i - 1].rung, to: rungs[i].rung, was: rungs[i - 1].verdict, becomes: rungs[i].verdict });
  const decided = rungs.filter((r) => r.verdict !== "undecided");
  const missing = rungs.filter((r) => r.verdict === "undecided").map((r) => ({ rung: r.rung, why: r.why }));
  // the ladder is an order only if, among decided rungs, no "different" is followed by a "same"
  let seenDifferent = false, monotone = true;
  for (const r of decided) { if (r.verdict === "different") seenDifferent = true; else if (seenDifferent) monotone = false; }
  // the limit: the verdict that holds from some rung to the strictest rung covered
  const last = rungs[rungs.length - 1];
  let limit = { verdict: "undecided", from: null, why: "the strictest rung is not decided" };
  if (!monotone) limit = { verdict: "undecided", from: null, why: "the ladder is not an order for this pair: a stricter rung says same where a looser one says different" };
  else if (last.verdict !== "undecided") {
    let i = rungs.length - 1; while (i > 0 && rungs[i - 1].verdict === last.verdict) i--;
    limit = { verdict: last.verdict, from: rungs[i].rung, why: `holds from ${rungs[i].rung} to ${last.rung}` };
  }
  const sameRungs = decided.filter((r) => r.verdict === "same"), diffRungs = decided.filter((r) => r.verdict === "different");
  return {
    schema: EQUIVALENCE_SCHEMA, ok: true, pid, bothReadAs: both,
    ladder: { rungs: ladder.rungs, by: ladder.by, ratified: ladder.ratified },
    rungs: rungs.map(({ keys, ...r }) => r),
    steps, monotone, limit,
    sameUpTo: monotone && sameRungs.length ? sameRungs[sameRungs.length - 1].rung : null,
    differentFrom: monotone && diffRungs.length ? diffRungs[0].rung : null,
    frameDependent: monotone && sameRungs.length > 0 && diffRungs.length > 0,
    range: { covered: decided.map((r) => r.rung), incompleteOver: missing },
    // do the distinctions accumulate with strictness? each decided rung's surviving set against the next decided one's
    accumulates: decided.length < 2 ? null : decided.slice(1).every((r, i) => { const next = new Set(r.keys); return decided[i].keys.every((k) => next.has(k)); }),
  };
}

/** verdictAt(judgement, rung) -> same | different | undecided | refused: the judgement read in one frame. */
export function verdictAt(j, rung) {
  if (!isObj(j) || j.ok !== true) return "refused";
  const r = j.rungs.find((x) => x.rung === rung);
  if (!r) return "refused"; // a frame the ladder does not hold is not answered
  return j.monotone ? r.verdict : "undecided";
}

/** rejudge(prev, next) -> the REC: what held and what changed between two judgements of one pair. */
export function rejudge(prev, next) {
  if (!isObj(prev) || prev.ok !== true || !isObj(next) || next.ok !== true) return refuse("needs_two_judgements");
  if (prev.pid !== next.pid) return refuse("different_pairs");
  const before = new Map(prev.rungs.map((r) => [r.rung, r.verdict]));
  const held = [], changed = [], added = [];
  for (const r of next.rungs) {
    if (!before.has(r.rung)) added.push({ rung: r.rung, verdict: r.verdict });
    else if (before.get(r.rung) === r.verdict) held.push(r.rung);
    else changed.push({ rung: r.rung, was: before.get(r.rung), becomes: r.verdict });
  }
  const dropped = prev.rungs.filter((r) => !next.rungs.some((x) => x.rung === r.rung)).map((r) => r.rung);
  return {
    schema: EQUIVALENCE_SCHEMA, ok: true, pid: next.pid, held, changed, added, dropped,
    limitWas: prev.limit, limitIs: next.limit,
    sticks: changed.length === 0 && prev.limit.verdict === next.limit.verdict, // the earlier verdict survived the new frame
  };
}

/** marksFor({ ladder, judgement, rec, log, by, ofJudgement, ofPrev }) -> WeaveMark@1 marks for her own mark door
 *  (organs/weave-mark.mjs). Cells are this file's proposal: the ladder DEF·Ground, a judgement EVA·Figure,
 *  a re-judgement REC·Figure. Nothing is sent from here. */
export function marksFor({ ladder, judgement, rec = null, log, by = "penelope.equivalence", stopsBasis = null, ofPrev = [] } = {}) {
  const out = [], witness = (how) => ({ how });
  if (ladder?.ok) out.push({ by, log, kind: "equivalence-ladder", cell: "DEF·Ground", addr: `ladder:${ladder.rungs.join(">")}`,
    body: { rungs: ladder.rungs, declared_by: ladder.by, why: ladder.why, ratified: ladder.ratified },
    witness: witness("declared by its byline; the order is not derived"), declare: { why: "an ordered set of grounds, loosest to strictest, under which a pair is judged" } });
  if (judgement?.ok) out.push({ by, log, kind: "equivalence-judgement", cell: "EVA·Figure", addr: `pair:${judgement.pid}`,
    body: { pid: judgement.pid, rungs: judgement.rungs, steps: judgement.steps, monotone: judgement.monotone, limit: judgement.limit, sameUpTo: judgement.sameUpTo, differentFrom: judgement.differentFrom, frameDependent: judgement.frameDependent, range: judgement.range, accumulates: judgement.accumulates },
    basis: { schema: EQUIVALENCE_SCHEMA, ladder: judgement.ladder.rungs, ...(stopsBasis ? { stops: stopsBasis } : {}) },
    witness: witness("computed from the finder's stops for this pair at each rung; no text read, no model called, no label seen"),
    declare: { why: "a pair's verdict as a function of the rung, with its first difference and its limit" } });
  if (rec?.ok) out.push({ by, log, kind: "equivalence-rejudgement", cell: "REC·Figure", addr: `pair:${rec.pid}`, of: ofPrev,
    body: { pid: rec.pid, held: rec.held, changed: rec.changed, added: rec.added, dropped: rec.dropped, limitWas: rec.limitWas, limitIs: rec.limitIs, sticks: rec.sticks },
    witness: witness("two judgements of the same pair compared rung by rung"),
    declare: { why: "what held and what changed when a pair was judged again under another ladder or with new stops" } });
  return out;
}
