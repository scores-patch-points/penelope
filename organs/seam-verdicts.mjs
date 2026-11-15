// organs/seam-verdicts.mjs — the verdicts that cross a seam: DEF, EVA, REC over what other writers left in the log.
// Handle: Penelope. Ruling (the person, 2026-11-15): pharos is only a log; the calculus lives here. A holon's
// judgements about its own work stay inside it; a bound, a verdict or a re-judgement that others will stand on
// is hers. So the other writers leave COUNTS and SHAPES in the log, and this organ reads them and says what
// they come to, under a bound somebody declared.
//
// Three kinds of evidence are read, each by its kind in the log, never by its author:
//   word-fold        how many nodes two words' folds share along a channel, with a null's counts, per radius
//   reasoning-run    one reasoning run: its count of error findings and its denominators
//   reasoning-claim  one statement of a unit in a run (the unit is the entry's address)
//
//   DEF   a BOUND, declared and bylined, with its why. No bound, no judgement. This file types no tolerance:
//         the quantile a count must clear, the error count a run may carry, the floor of a standing rung and
//         which citation verdicts count as grounded are all the declarer's.
//   EVA   the comparison of the evidence with the bound. Never a bare "same" or "true": always "beyond the
//         null at q", "stands under <bound>", "holds up to <rung>".
//   REC   a re-judgement of the same address under another bound or with more evidence, `of` the earlier one,
//         saying what held and what changed.
//
// What cannot be decided is UNDECIDED, with its reason, never filled in: an empty ball, a null too small to
// resolve the declared quantile, a reading that still changes at the last radius, a run with no count.
// PURE: no imports, no clock, no randomness, no log access. marksFor() builds marks for her own mark door.

export const SEAM_SCHEMA = "SeamVerdict@1";
export const STANDING_RUNGS = Object.freeze(["restated", "grounded", "independent"]);
const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const refuse = (reason, detail) => ({ schema: SEAM_SCHEMA, ok: false, verdict: "refused", reason, ...(detail ? { detail } : {}) });
const bylined = (spec) => (!isObj(spec) ? refuse("no_bound") : typeof spec.by !== "string" || !spec.by.trim() ? refuse("unbylined_bound", "a bound is declared by someone") : typeof spec.why !== "string" || !spec.why.trim() ? refuse("no_why", "a bound says why it is this bound") : null);

// ---- DEF -----------------------------------------------------------------------------------------------

/** declareWordBound({ quantile, by, why }) -> the bound a shared count must clear: above that quantile of its null. */
export function declareWordBound(spec = {}) {
  const r = bylined(spec); if (r) return r;
  const q = spec.quantile;
  if (typeof q !== "number" || !(q > 0 && q < 1)) return refuse("no_quantile", "the quantile of the null is declared, a number strictly between 0 and 1");
  return { schema: SEAM_SCHEMA, ok: true, bound: "word-fold", quantile: q, by: spec.by, why: spec.why, ratified: spec.ratified === true };
}

/** declareRunBound({ maxErrorFindings, by, why }) -> how many error findings a run may carry and still stand. */
export function declareRunBound(spec = {}) {
  const r = bylined(spec); if (r) return r;
  const m = spec.maxErrorFindings;
  if (!Number.isInteger(m) || m < 0) return refuse("no_max", "maxErrorFindings is declared, an integer of 0 or more");
  return { schema: SEAM_SCHEMA, ok: true, bound: "reasoning-run", maxErrorFindings: m, by: spec.by, why: spec.why, ratified: spec.ratified === true };
}

/** declareStandingLadder({ rungs, floor, grounded, by, why }) -> rungs loosest first, from STANDING_RUNGS;
 *  floor = how many a rung needs; grounded = the citation verdicts that count as grounded. */
export function declareStandingLadder(spec = {}) {
  const r = bylined(spec); if (r) return r;
  const rungs = spec.rungs;
  if (!Array.isArray(rungs) || !rungs.length || rungs.some((x) => !STANDING_RUNGS.includes(x))) return refuse("bad_rungs", `rungs are drawn from ${STANDING_RUNGS.join(", ")}`);
  if (new Set(rungs).size !== rungs.length) return refuse("repeated_rung");
  if (!Number.isInteger(spec.floor) || spec.floor < 1) return refuse("no_floor", "the floor (how many a rung needs) is declared, an integer of 1 or more");
  if (rungs.includes("grounded") && !(Array.isArray(spec.grounded) && spec.grounded.length && spec.grounded.every((x) => typeof x === "string" && x))) return refuse("no_grounded", "a ladder with the grounded rung declares which citation verdicts count as grounded");
  return { schema: SEAM_SCHEMA, ok: true, bound: "claim-standing", rungs: Object.freeze([...rungs]), floor: spec.floor, grounded: Object.freeze([...(spec.grounded ?? [])]), by: spec.by, why: spec.why, ratified: spec.ratified === true };
}

// ---- EVA -----------------------------------------------------------------------------------------------

/** How many null counts the declared quantile needs before "above it" means anything: the smallest n with
 *  a rank strictly inside the sample. Arithmetic on the declared quantile, not a tolerance of this file. */
export const nullsNeeded = (q) => Math.ceil(1 / (1 - q));
const quantileOf = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)];

/** judgeWordFold(entry, bound) -> the fold's verdict as a function of the radius, with its limit.
 *  entry: a word-fold log entry ({ id, body: { a, b, channel, per: [{ radius, shared, empty, null: { counts } }] } }). */
export function judgeWordFold(entry, bound) {
  if (!isObj(bound) || bound.ok !== true || bound.bound !== "word-fold") return refuse("no_bound", "a word fold is judged only under a declared word bound");
  const b = entry?.body;
  if (!isObj(b) || !Array.isArray(b.per) || !b.per.length) return refuse("not_a_word_fold");
  const need = nullsNeeded(bound.quantile);
  const radii = b.per.map((p) => {
    const counts = Array.isArray(p?.null?.counts) ? [...p.null.counts].sort((x, y) => x - y) : [];
    if (p.empty) return { radius: p.radius, verdict: "undecided", why: "one of the two words has an empty ball on this channel" };
    if (counts.length < need) return { radius: p.radius, verdict: "undecided", why: `the null has ${counts.length} counts; the declared quantile ${bound.quantile} needs ${need}` };
    const cut = quantileOf(counts, bound.quantile);
    return { radius: p.radius, verdict: p.shared > cut ? "beyond-null" : "within-null", shared: p.shared, cut, nulls: counts.length, ...(p.capped ? { capped: true } : {}) };
  });
  // the limit: the verdict at the last radius, if the radius before it (when there is one) says the same. A
  // reading that still changes at the last radius has not settled, and is undecided, not the last value.
  const last = radii[radii.length - 1], prev = radii[radii.length - 2];
  const settled = last.verdict !== "undecided" && (!prev || prev.verdict === last.verdict);
  let from = null;
  if (settled) { from = last.radius; for (let i = radii.length - 2; i >= 0 && radii[i].verdict === last.verdict; i--) from = radii[i].radius; }
  return {
    schema: SEAM_SCHEMA, ok: true, kind: "word-fold", addr: entry.addr ?? null, of: entry.id ? [entry.id] : [],
    a: b.a, b: b.b, channel: b.channel, radii,
    limit: settled ? { verdict: last.verdict, from } : { verdict: "undecided", why: last.verdict === "undecided" ? last.why : `the verdict changes between radius ${prev.radius} and ${last.radius}` },
    bound: { quantile: bound.quantile, by: bound.by, ratified: bound.ratified },
  };
}

/** judgeRun(entry, bound) -> whether a reasoning run stands under the declared count of error findings. */
export function judgeRun(entry, bound) {
  if (!isObj(bound) || bound.ok !== true || bound.bound !== "reasoning-run") return refuse("no_bound", "a run is judged only under a declared run bound");
  const b = entry?.body;
  if (!isObj(b)) return refuse("not_a_run");
  const n = b.errorFindings;
  const verdict = !Number.isInteger(n) ? "undecided" : n <= bound.maxErrorFindings ? "stands" : "does-not-stand";
  return {
    schema: SEAM_SCHEMA, ok: true, kind: "reasoning-run", addr: entry.addr ?? null, of: entry.id ? [entry.id] : [],
    verdict, errorFindings: Number.isInteger(n) ? n : null, denominators: b.denominators ?? null,
    ...(verdict === "undecided" ? { why: "the run entry carries no count of error findings" } : {}),
    bound: { maxErrorFindings: bound.maxErrorFindings, by: bound.by, ratified: bound.ratified },
  };
}

/** judgeStanding(entries, ladder) -> one unit's standing as a function of the rung.
 *  entries: every reasoning-claim entry at ONE address (one unit). Counted, per rung:
 *    restated     distinct runs that state it
 *    grounded     distinct runs that state it with a citation verdict the ladder counts as grounded
 *    independent  distinct instruments that state it (a statement with no instrument named is not counted) */
export function judgeStanding(entries, ladder) {
  if (!isObj(ladder) || ladder.ok !== true || ladder.bound !== "claim-standing") return refuse("no_bound", "standing is judged only under a declared standing ladder");
  const es = (entries ?? []).filter((e) => isObj(e?.body));
  if (!es.length) return refuse("no_statements");
  const addrs = new Set(es.map((e) => e.addr));
  if (addrs.size !== 1) return refuse("several_units", "one judgement is of one unit (one address)");
  const runs = (xs) => new Set(xs.map((e) => e.body.run ?? e.id)).size;
  const counts = {
    restated: runs(es),
    grounded: runs(es.filter((e) => ladder.grounded.includes(e.body.verdict))),
    independent: new Set(es.map((e) => e.body.instrument).filter((x) => typeof x === "string" && x)).size,
  };
  const unnamed = es.filter((e) => !(typeof e.body.instrument === "string" && e.body.instrument)).length;
  const rungs = ladder.rungs.map((rung) => {
    if (rung === "independent" && counts.independent === 0) return { rung, verdict: "undecided", count: 0, why: "no statement names its instrument" };
    return { rung, verdict: counts[rung] >= ladder.floor ? "holds" : "does-not-hold", count: counts[rung] };
  });
  let upTo = null;
  for (const r of rungs) { if (r.verdict === "holds") upTo = r.rung; else break; }
  const firstFail = rungs.find((r) => r.verdict !== "holds") ?? null;
  return {
    schema: SEAM_SCHEMA, ok: true, kind: "claim-standing", addr: es[0].addr, of: es.map((e) => e.id).filter(Boolean).sort(),
    unit: es[0].body.unit ?? null, statements: es.length, unnamedInstrument: unnamed, rungs,
    holdsUpTo: upTo, stopsAt: firstFail ? { rung: firstFail.rung, verdict: firstFail.verdict } : null,
    bound: { rungs: ladder.rungs, floor: ladder.floor, grounded: ladder.grounded, by: ladder.by, ratified: ladder.ratified },
  };
}

// ---- REC -----------------------------------------------------------------------------------------------

const verdictMap = (j) => (j.kind === "word-fold" ? new Map([...j.radii.map((r) => [`radius ${r.radius}`, r.verdict]), ["limit", j.limit.verdict]])
  : j.kind === "reasoning-run" ? new Map([["run", j.verdict]])
  : new Map(j.rungs.map((r) => [r.rung, r.verdict])));

/** rejudge(prev, next) -> the REC: what held and what changed between two judgements of one address. */
export function rejudge(prev, next) {
  if (!isObj(prev) || prev.ok !== true || !isObj(next) || next.ok !== true) return refuse("needs_two_judgements");
  if (prev.kind !== next.kind || prev.addr !== next.addr) return refuse("different_subjects", "a re-judgement is of the same kind at the same address");
  const before = verdictMap(prev), after = verdictMap(next), held = [], changed = [], added = [];
  for (const [k, v] of after) { if (!before.has(k)) added.push({ at: k, verdict: v }); else if (before.get(k) === v) held.push(k); else changed.push({ at: k, was: before.get(k), becomes: v }); }
  const dropped = [...before.keys()].filter((k) => !after.has(k));
  return { schema: SEAM_SCHEMA, ok: true, kind: next.kind, addr: next.addr, held, changed, added, dropped, sticks: changed.length === 0, boundWas: prev.bound, boundIs: next.bound };
}

// ---- marks for her own door ------------------------------------------------------------------------------

const KINDS = {
  "word-fold": { verdict: "word-fold-verdict", why: "whether two words' shared fold clears a declared quantile of its null, per radius, with its limit" },
  "reasoning-run": { verdict: "run-verdict", why: "whether a reasoning run stands under a declared count of error findings" },
  "claim-standing": { verdict: "claim-standing", why: "a unit's standing as a function of the rung: restated, grounded, independent" },
};

/** marksFor({ bound, judgement, rec, log, by, ofPrev, ofBound }) -> WeaveMark@1 marks (organs/weave-mark.mjs).
 *  Cells are this file's proposal: a bound DEF·Ground, a verdict EVA·Figure, a re-judgement REC·Figure.
 *  A verdict is woven `of` the evidence entries it read (and of its bound, when that entry's id is given). */
export function marksFor({ bound = null, judgement = null, rec = null, log, by = "penelope.seam", ofPrev = [], ofBound = [] } = {}) {
  const out = [], witness = (how) => ({ how });
  if (bound?.ok) {
    const { schema, ok, ...body } = bound;
    out.push({ by, log, kind: "seam-bound", cell: "DEF·Ground", addr: `bound:${bound.bound}:${bound.by}`, body,
      witness: witness("declared by its byline; not derived from any data"), declare: { why: "a declared bound under which evidence in the log is judged" } });
  }
  if (judgement?.ok) {
    const k = KINDS[judgement.kind], { schema, ok, of, ...body } = judgement;
    out.push({ by, log, kind: k.verdict, cell: "EVA·Figure", addr: `verdict:${judgement.addr}`, of: [...of, ...ofBound], body,
      basis: { schema: SEAM_SCHEMA }, witness: witness("computed from the evidence entries named in `of`, read from the log by kind; no text read, no model called"), declare: { why: k.why } });
  }
  if (rec?.ok) {
    const { schema, ok, ...body } = rec;
    out.push({ by, log, kind: "seam-rejudgement", cell: "REC·Figure", addr: `verdict:${rec.addr}`, of: ofPrev, body,
      witness: witness("two judgements of the same address compared"), declare: { why: "what held and what changed when evidence in the log was judged again" } });
  }
  return out;
}
