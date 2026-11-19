// perspective-eva.mjs — EVA, said once: two things are EQUIVALENT, for this perspective, when there is no difference that makes a difference.
//
// Not a similarity score and not a count of matches. A PERSPECTIVE declares what it would use the texts for: a set of PROBES (a question it asks of
// each side: the area, the birth year, which region it sits under, who built what). A DIFFERENCE MAKES A DIFFERENCE for a perspective exactly when a
// probe the perspective declared gets different answers from the two sides. Differences in anything the perspective did not declare (wording, order,
// language, a fact it never asks) make none, and are ignored on purpose. That is what "for this perspective" means: the same two texts can be
// equivalent for one perspective and different for another.
//
// Honesty about silence. A probe a side cannot answer is SILENT (a typed hole, never agreement). A probe with no measured POWER (it has never been seen to
// differ between things known not to be equivalent: `power` = the measured rate, from a seeded null, at which it separates non-equivalent pairs) cannot
// support equivalence, because absence of a difference found by a probe that could not have found one is not evidence. So:
//   different   an answered probe differs (a difference that makes a difference was found; cite it with the addresses it was read from)
//   equivalent  no answered probe differs AND at least one answered probe has power > 0 (the attempt to find a difference could have succeeded and did not)
//   gap         otherwise (every probe silent, or only powerless probes answered): no verdict; the caller defaults to Other
//
//   judgeEquivalence({ perspective, a, b }) -> { verdict, for, differences, agreements, silent, powerless, why }
//   perspective  { name, terrain: Lens|Paradigm|Atmosphere, frame, probes: [{ name, lands: <terrain>, power, same?(x, y) }] }       probes are the DECLARED questions; `same` defaults to strict equality
//   a, b         { probeName: { value, addr?, referent? } | null }   referent: true = the value is a per-document referent id (compared only through `bridge`)
//   bridge       (probeName, x, y) -> true | false | null   a licensed bridge between two documents' referents; absent or null = silent                  the answers each side's reading gave (null or missing = silent)
// WHERE A PERSPECTIVE LIVES (the cube, native/kernel/cube.js). A perspective is a thing of the third domain (Interpretation: what things mean), so it declares
// which of its three terrains it is at, by grain: "Lens" (a specific standpoint reading, a verdict), "Paradigm" (a standing system of what counts as a
// difference; changed only by REC) or "Atmosphere" (the ambient standard of meaning that makes some readings obvious: the FRAME). Its probes land on terrains
// of the other domains (area on Entity, region on Link, ...): `lands` names where. Two perspectives are comparable only at the same terrain AND under the same
// frame; otherwise there is no verdict, because a difference between a Lens and a Paradigm, or between standards of meaning, is a category mix-up, not a difference
// that makes a difference.
export const TERRAINS = Object.freeze(["Void", "Entity", "Kind", "Field", "Link", "Network", "Atmosphere", "Lens", "Paradigm"]);
export const INTERPRETATION = Object.freeze(["Atmosphere", "Lens", "Paradigm"]);
export const comparable = (p, q) => !!p?.terrain && p.terrain === q?.terrain && (p.frame ?? null) === (q.frame ?? null);
export function judgeEquivalence({ perspective, a = {}, b = {}, bridge = null } = {}) {
  const probes = perspective?.probes;
  if (perspective && !INTERPRETATION.includes(perspective.terrain)) return { verdict: "gap", for: perspective?.name ?? null, why: `a perspective must declare an Interpretation terrain (${INTERPRETATION.join(", ")}); got ${perspective.terrain ?? "none"}`, differences: [], agreements: [], silent: [], powerless: [] };
  const bad = (probes ?? []).find((p) => p.lands && !TERRAINS.includes(p.lands));
  if (bad) return { verdict: "gap", for: perspective.name, why: `probe ${bad.name} lands on an unknown terrain ${bad.lands}`, differences: [], agreements: [], silent: [], powerless: [] };
  if (!perspective?.name || !Array.isArray(probes) || !probes.length) return { verdict: "gap", for: perspective?.name ?? null, why: "no perspective or no declared probes: nothing could make a difference", differences: [], agreements: [], silent: [], powerless: [] };
  const differences = [], agreements = [], silent = [], powerless = [];
  for (const p of probes) {
    const x = a[p.name]?.value, y = b[p.name]?.value;
    if (x == null || y == null) { silent.push({ probe: p.name, side: x == null && y == null ? "both" : x == null ? "a" : "b" }); continue; }
    // REFERENTS ARE PER DOCUMENT (khora's cast ids are never shared between two readings): an answer flagged `referent: true` is compared only through a bridge the
    // caller supplies (licensed by usage), never by id equality; with no bridge, or a bridge that cannot say, the probe is SILENT, not agreement and not a difference.
    const isRef = a[p.name]?.referent === true || b[p.name]?.referent === true;
    let same;
    if (isRef) {
      const bx = typeof bridge === "function" ? bridge(p.name, x, y) : null;
      if (bx !== true && bx !== false) { silent.push({ probe: p.name, side: "both", why: "referent ids are per document; no licensed bridge says whether they are the same referent" }); continue; }
      same = bx;
    } else same = typeof p.same === "function" ? p.same(x, y) : x === y;
    if (same === null) { silent.push({ probe: p.name, side: "both", why: "the probe's same-rule cannot read these values (they are not numbers it can compare): undecidable, not a difference and not agreement" }); continue; }
    const row = { probe: p.name, a: x, b: y, addr: { a: a[p.name]?.addr ?? null, b: b[p.name]?.addr ?? null }, power: p.power ?? 0 };
    if (!same) { differences.push(row); continue; }
    if (!(p.power > 0)) { powerless.push(row); continue; }
    agreements.push(row);
  }
  if (differences.length) return { verdict: "different", for: perspective.name, differences, agreements, silent, powerless, why: `${differences.length} probe(s) the perspective declared found a difference that makes a difference` };
  if (agreements.length) return { verdict: "equivalent", for: perspective.name, differences, agreements, silent, powerless, why: `${agreements.length} probe(s) with power could have found a difference and did not` };
  return { verdict: "gap", for: perspective.name, differences, agreements, silent, powerless, why: silent.length === probes.length ? "every probe is silent" : "the only answered probes have no measured power" };
}
// ---- DEF: a perspective declared, bylined, with the measured power of every probe ---------------------------------------------------------------
// The wiring contract (gym/perspective-run.mjs, Penelope's door). She reads by KIND, never by author: `probe-answer` entries (a reading's answer to a declared
// probe, written by whoever read: khora, janus, a script) and her own `perspective` entries; she writes `equivalence-verdict` entries. She reads no text and
// calls no other organ. Nothing is defaulted: every number a perspective uses (a probe's power, a tolerance) is declared, bylined, and cites where it was measured.
export const PERSPECTIVE_SCHEMA = "Perspective@1";
const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const str = (x) => typeof x === "string" && x.trim().length > 0;
const refuse = (reason, detail) => ({ schema: PERSPECTIVE_SCHEMA, ok: false, verdict: "refused", reason, ...(detail ? { detail } : {}) });
/** Rules a probe may name for "these two answers are the same", by their declared text. Each is a computation, not a hidden tolerance: a tolerance is the probe's own `tol`. */
/** a numeric literal read STRUCTURALLY (no pattern matching): a finite number, or a string that is an optional minus, digits and at most one point with a digit around it, nothing else; anything else is not a number (null). The pipeline writes literals as strings ("30"). */
export const numericLiteral = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const s = v.trim(); let i = 0, digits = 0, points = 0;
  if (s[0] === "-") i = 1;
  for (; i < s.length; i++) { const c = s[i]; if (c >= "0" && c <= "9") digits++; else if (c === "." && points === 0 && digits > 0) points++; else return null; }
  return digits > 0 && s[s.length - 1] !== "." ? Number(s) : null;
};
/** same(x, y) answers true, false, or NULL = the rule cannot read these values (undecidable: silent, never a difference) */
export const KNOWN_SAME_RULES = Object.freeze({
  "strict equality": { needsTol: false, same: (x, y) => x === y },
  "relative difference at most tol": { needsTol: true, same: (x, y, tol) => { const a = numericLiteral(x), b = numericLiteral(y); return a === null || b === null ? null : Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-9) <= tol; } },
});
/** declarePerspective({ name, by, why, terrain, frame, probes: [{ name, lands, power, powerFrom, rule, tol? }], ratified }) -> the perspective or a refusal. */
export function declarePerspective(spec = {}) {
  if (!isObj(spec)) return refuse("no_perspective");
  if (!str(spec.by)) return refuse("unbylined_perspective", "a perspective is declared by someone");
  if (!str(spec.why)) return refuse("no_why", "a perspective says why it is this perspective");
  if (typeof spec.name !== "string" || !/^[A-Za-z0-9._-]+$/.test(spec.name)) return refuse("no_name", "a perspective has a name, a plain token, for its address perspective:<name>");
  if (!INTERPRETATION.includes(spec.terrain)) return refuse("terrain_not_interpretation", `a perspective lives at ${INTERPRETATION.join(", ")}; got ${spec.terrain ?? "none"}`);
  if (!str(spec.frame)) return refuse("no_frame", "the standard of meaning (the frame) is declared");
  if (!Array.isArray(spec.probes) || !spec.probes.length) return refuse("no_probes", "nothing could make a difference");
  const probes = [];
  for (const p of spec.probes) {
    if (!isObj(p) || typeof p.name !== "string" || !/^[A-Za-z0-9._-]+$/.test(p.name)) return refuse("bad_probe", "a probe has a plain-token name");
    if (!TERRAINS.includes(p.lands)) return refuse("probe_lands_nowhere", `probe ${p.name} lands on a terrain: ${TERRAINS.join(", ")}`);
    if (typeof p.power !== "number" || !Number.isFinite(p.power) || p.power < 0 || p.power > 1) return refuse("no_power", `probe ${p.name}: power is declared, a number from 0 to 1 (0 = never seen to separate non-equivalent things)`);
    if (!str(p.powerFrom)) return refuse("power_unsourced", `probe ${p.name}: say where its power was measured (a ledger row, a stamp)`);
    const R = KNOWN_SAME_RULES[p.rule];
    if (!R) return refuse("unknown_same_rule", `this organ computes only: ${Object.keys(KNOWN_SAME_RULES).join(" | ")}`);
    if (R.needsTol && !(typeof p.tol === "number" && p.tol > 0 && p.tol < 1)) return refuse("no_tol", `probe ${p.name}: the rule "${p.rule}" needs its tol declared, a number strictly between 0 and 1`);
    probes.push({ name: p.name, lands: p.lands, power: p.power, powerFrom: p.powerFrom, rule: p.rule, ...(R.needsTol ? { tol: p.tol } : {}) });
  }
  if (new Set(probes.map((p) => p.name)).size !== probes.length) return refuse("duplicate_probe", "probe names are unique");
  return { schema: PERSPECTIVE_SCHEMA, ok: true, name: spec.name, by: spec.by, why: spec.why, ratified: spec.ratified === true, terrain: spec.terrain, frame: spec.frame, probes };
}
/** the runnable form for judgeEquivalence: each probe's declared rule becomes its `same` */
export const runnable = (p) => ({ name: p.name, terrain: p.terrain, frame: p.frame, probes: p.probes.map((q) => ({ name: q.name, lands: q.lands, power: q.power, same: (x, y) => KNOWN_SAME_RULES[q.rule].same(x, y, q.tol) })) });
/** perspectiveFromEntry(entry) -> the perspective a `perspective` log entry declares (its name is its address) */
export function perspectiveFromEntry(entry) {
  const addr = typeof entry?.addr === "string" ? entry.addr : "";
  if (!addr.startsWith("perspective:") || !isObj(entry.body)) return refuse("not_a_perspective");
  return declarePerspective({ ...entry.body, name: addr.slice("perspective:".length) });
}
export const perspectiveBody = (p) => ({ addr: `perspective:${p.name}`, body: { by: p.by, why: p.why, ratified: p.ratified, terrain: p.terrain, frame: p.frame, probes: p.probes } });

// ---- EVA over the log's answers -----------------------------------------------------------------------------------------------------------------
/** answersOf(entries) -> { [pair]: { a: { probe: { value, addr } }, b: {...}, ids: [entry ids] } }, the latest entry at each address winning (fold order). Read by kind, never by author. */
export function answersOf(entries = []) {
  const latest = new Map();
  for (const e of entries) if (e?.kind === "probe-answer" && isObj(e.body) && typeof e.body.pair === "string" && (e.body.side === "a" || e.body.side === "b") && typeof e.body.probe === "string") latest.set(e.addr, e);
  const out = {};
  for (const e of latest.values()) {
    const g = (out[e.body.pair] ||= { a: {}, b: {}, ids: [] });
    g[e.body.side][e.body.probe] = { value: e.body.value ?? null, addr: e.body.addr ?? e.addr, ...(e.body.referent === true ? { referent: true } : {}) };
    g.ids.push(e.id);
  }
  return out;
}
/** judgeFromAnswers(perspective, group) -> the judgement: the perspective's own probes read from the pair's answers; answers to probes it never declared are ignored */
export const judgeFromAnswers = (perspective, group) => judgeEquivalence({ perspective: runnable(perspective), a: group.a, b: group.b });
const shaOfPair = (pair) => (typeof pair === "string" && pair.startsWith("pair:") ? pair.slice(5) : null);
export const equivalenceBody = (pair, perspective, j) => ({ addr: `equivalence:${shaOfPair(pair)}:${perspective.name}`, body: { pair, for: perspective.name, terrain: perspective.terrain, frame: perspective.frame, verdict: j.verdict, why: j.why, differences: j.differences, agreements: j.agreements, silent: j.silent, powerless: j.powerless } });
export const KINDS = Object.freeze({
  "equivalence-verdict": { cell: "EVA·Figure", why: "equivalent / different / gap for a declared perspective: no difference that makes a difference among the perspective's own probes; silent and powerless probes are listed, never counted as agreement; a hole is an entry" },
  "perspective": { cell: "DEF·Ground", why: "a declared perspective at an Interpretation terrain: its frame, its probes with their measured power, the terrain each lands on; bylined and fixed before either side is read" },
  "probe-answer": { cell: "INS·Figure", why: "the answer one reading gave to one declared probe of one pair, with the address it was read from; written by whoever read, read by Penelope by kind" },
});
/** marksFor({ perspective, pair, judgement, perspectiveId, answerIds, log, by }) -> WeaveMark@1 marks for organs/weave-mark.mjs */
export function marksFor({ perspective = null, pair = null, judgement = null, perspectiveId = null, answerIds = [], supersedes = null, log, by = "penelope.perspective" } = {}) {
  const out = [];
  if (perspective?.ok && !judgement) {
    const { addr, body } = perspectiveBody(perspective);
    out.push({ by, log, kind: "perspective", cell: KINDS.perspective.cell, addr, body, of: supersedes ? [supersedes] : [], witness: { how: "declared by its byline; not derived from any data" }, declare: { why: KINDS.perspective.why } });
  }
  if (perspective?.ok && judgement && shaOfPair(pair)) {
    const { addr, body } = equivalenceBody(pair, perspective, judgement);
    out.push({ by, log, kind: "equivalence-verdict", cell: KINDS["equivalence-verdict"].cell, addr, body, of: [perspectiveId, ...answerIds].filter(Boolean),
      basis: { schema: PERSPECTIVE_SCHEMA }, witness: { how: "computed from the perspective and the probe-answer entries named in `of`, read from the log by kind; no text read, no model called" }, declare: { why: KINDS["equivalence-verdict"].why } });
  }
  return out;
}
