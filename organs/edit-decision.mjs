// organs/edit-decision.mjs — Penelope's DECISION TO EDIT: the triad edit-def (DEF) -> edit-eva (EVA) -> edit-rec (REC), at one address, each `of` the previous.
// Handle: Penelope. The owner's ruling (2026-11-27): "A decision to edit should be a significant triad Penelope activity." Deciding to edit a timeline is therefore neither janus's nor an editor's: janus NOMINATES
// (edit-intent CON·Figure, edit-proposal SEG·Figure), a person's tool OBSERVES that a named asker chose (edit-choice INS·Figure: "observing is not defining", REFERENT-FIRST rule 6), and only she DEFINES, TESTS and ORDERS.
// She reads those three BY KIND AND CELL, never by author (all three kinds are PROPOSALS: whoever writes a kind declares it with its cell; pharos fixes a kind's cell), and writes three kinds of her own:
//
//   kind       cell        addr                 body                                                                                   of
//   edit-def   DEF·Figure  edit:<sha16>#<i>     the declared standard { giver, intent, proposal, primitive, clip, method, spans, tolerance, declared_from }   [edit-choice, edit-proposal, edit-intent]
//   edit-eva   EVA·Figure  edit:<sha16>#<i>     { stands, standing: "single", witnesses: 1, reasons, differences, ... }                [the edit-def, + proposal, intent]
//   edit-rec   REC·Figure  edit:<sha16>#<i>     the order the editor reads { primitive, clip, spans, intent, def, eva, applies: false }  [the edit-eva, + def, proposal, intent]
//
// THE RULES (stated so they can be falsified; no number is hand-set, no model is called, no text is read: only fields of the entries; the tolerance is the ASKER's, declared in the choice):
//   ED1 (DEF)  a DEF is written only when ALL hold: (a) a LIVE edit-choice names a `giver` (a non-empty string; no giver = no DEF, ever); (b) it names a LIVE edit-proposal whose own `intent` names a LIVE edit-intent and the three
//              addresses are the same `<sha16>#<i>`; (c) the intent's status is `ready` or `needs_params` (an `ambiguous` or `gap` intent gets NO DEF: the reason is taken from the intent's own `gaps` and `status`);
//              (d) every name in the intent's `params_missing` is supplied by the choice: 'span' is supplied by the asker's own `spans` or, if the asker gave none, by adopting the chosen proposal's spans
//              (the body says which: `declared_from`); any other missing param is not suppliable by a choice and is a typed gap; (e) the spans are well formed (finite from < to); (f) the proposal names a primitive (NOT checked against the intent's own `primitives`: janus's real pacing intent says change_state_to and its proposal says remove_span, the realisation of it; a check would refuse real data).
//              The DEF body is the standard the asker declared: the asker's spans if given else the proposal's, the asker's tolerance (null if not given), the primitive, the clip, and the METHOD of the proposal chosen.
//   ED2 (EVA)  with a DEF, the evidence STANDS iff: the proposal's method, primitive and clip are the DEF's, the span counts are equal, and each span (sorted by from, then to) has from and to within the ASKER's tolerance of the declared
//              span (|difference| <= tolerance). Otherwise it does NOT stand, with the measured differences recorded. If the tolerance is missing or not a positive finite number, EVA ABSTAINS: no entry, the reason is reported.
//              One proposal from one method is ONE witness: `standing: "single"`, `witnesses: 1`. A single witness is never called agreement (janus DESIGN-EVA-PATTERN-STANDING); `stands` is about the asker's declared spans,
//              the asker's declaration is the standard and the proposal the evidence. When the asker gave no spans (declared_from "proposal") the evidence is the standard itself: `independent: false`, the test is tautological.
//   ED3 (REC)  only when an EVA stands: the ORDER the editor reads { primitive, clip, spans, intent, def, eva, applies: false }. She writes the order and never edits a timeline; `applies` stays false until an editor writes its own observation.
//   A revision is a NEWER entry at the same address with basis.revises = the entry it replaces (same `of` chain). A choice that is withdrawn or changed retracts every live earlier triad entry at that address, so older ones do not resurface.
//   REC without a standing EVA, EVA without a DEF, DEF without a choice are IMPOSSIBLE: each builder below returns null (and the marks builder refuses) when its predecessor is absent.
// NOT MEASURED: whether any real asker, editor or timeline is involved (none is); the rules pin behaviour, not accuracy or usefulness. Tolerance comparison is exact floating point (<=), no epsilon, none being hand-set.
// PURE: no imports, no clock, no log access, no text read. gym/edit-decision-run.mjs does the log; marksFor() builds marks for her own door (organs/weave-mark.mjs).

export const EDIT_SCHEMA = "EditDecision@1";
export const DEF_KIND = "edit-def", EVA_KIND = "edit-eva", REC_KIND = "edit-rec";
export const KINDS = Object.freeze({
  [DEF_KIND]: { cell: "DEF·Figure", prefix: "edit", why: "the standard under which an edit is decided: the named asker's choice of a nominated proposal, with the asker's own spans and tolerance, under rule ED1; written only for a ready or needs_params intent with a named giver" },
  [EVA_KIND]: { cell: "EVA·Figure", prefix: "edit", why: "whether the nominated proposal stands under the declared edit standard to the asker's tolerance, under rule ED2; one witness is `single`, never agreement; abstains without a positive tolerance" },
  [REC_KIND]: { cell: "REC·Figure", prefix: "edit", why: "the order an editor reads once the evidence stands (primitive, clip, spans); applies stays false, she never edits a timeline; under rule ED3" },
});
export const READS = Object.freeze({ intent: "edit-intent", proposal: "edit-proposal", choice: "edit-choice" });
export const RULES = Object.freeze({ [DEF_KIND]: "ED1", [EVA_KIND]: "ED2", [REC_KIND]: "ED3" });
/** The statuses of an intent a DEF may stand on. `ambiguous` is NOT among them: the choice would be between readings of the sentence, and an observation of a choice among proposals cannot settle that. */
export const DEFINABLE = Object.freeze(["ready", "needs_params"]);

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const canon = (v) => JSON.stringify(v, (_, x) => (isObj(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const isIdx = (s) => typeof s === "string" && s !== "" && String(Number(s)) === s && Number(s) >= 0;
export const sameBody = (a, b) => canon(a) === canon(b);
export const sameSet = (a, b) => { const x = [...new Set(a ?? [])].sort(), y = [...new Set(b ?? [])].sort(); return x.length === y.length && x.every((v, i) => v === y[i]); };

/** parseAddr("intent:<sha16>#<i>", "intent") -> { sha, i } ; the proposal form "proposal:<sha16>#<i>:<n>" also gives n. Null for any other shape (an address is an id, never text). */
export function parseAddr(addr, prefix) {
  if (typeof addr !== "string" || !addr.startsWith(`${prefix}:`)) return null;
  const rest = addr.slice(prefix.length + 1), h = rest.indexOf("#"); if (h < 1) return null;
  const sha = rest.slice(0, h), tail = rest.slice(h + 1).split(":"), i = tail[0];
  if (!isIdx(i) || tail.length > 2 || (tail.length === 2 && !isIdx(tail[1]))) return null;
  return { sha, i: Number(i), ...(tail.length === 2 ? { n: Number(tail[1]) } : {}) };
}
export const editAddr = (sha, i) => `edit:${sha}#${i}`;
/** The address of the choice that decides the triad at edit:<sha16>#<i>. */
export const choiceAddrOf = (editAddress) => { const p = parseAddr(editAddress, "edit"); return p ? `choice:${p.sha}#${p.i}` : null; };

const wellSpans = (s) => Array.isArray(s) && s.length > 0 && s.every((x) => isObj(x) && isNum(x.from) && isNum(x.to) && x.from < x.to);
const byFrom = (s) => [...s].sort((a, b) => a.from - b.from || a.to - b.to).map((x) => ({ from: x.from, to: x.to }));
const none = (gap, why, extra = {}) => ({ body: null, gap, why, ...extra });

/** defOf({ intent, proposal, choice }) -> { body, gap, why }. Each argument is an ENTRY ({ id, addr, body }) of the kind, the latest live one at its address, or null. body is the edit-def body, or null with the typed reason `no_def:<reason>`. */
export function defOf({ intent, proposal, choice } = {}) {
  const no = (reason, why, extra) => none(`no_def:${reason}`, why, extra);
  if (!isObj(choice) || !isObj(choice.body)) return no("no_choice", "no live edit-choice: observing nothing defines nothing");
  const giver = choice.body.giver;
  if (typeof giver !== "string" || !giver.trim()) return no("no_giver", "the choice names no asker: no giver, no DEF, ever");
  const ca = parseAddr(choice.addr, "choice"); if (!ca) return no("bad_address", `choice address ${String(choice.addr)} is not choice:<sha16>#<i>`);
  if (typeof choice.body.proposal !== "string") return no("no_proposal_named", "the choice names no proposal");
  if (!isObj(proposal) || !isObj(proposal.body) || proposal.addr !== choice.body.proposal) return no("proposal_not_live", `no live edit-proposal at ${String(choice.body.proposal)}`);
  const pa = parseAddr(proposal.addr, "proposal"); if (!pa || pa.sha !== ca.sha || pa.i !== ca.i) return no("address_mismatch", "the choice and the proposal are not at the same <sha16>#<i>");
  if (!isObj(intent) || !isObj(intent.body) || intent.addr !== proposal.body.intent) return no("intent_not_live", `no live edit-intent at ${String(proposal.body.intent)}`);
  const ia = parseAddr(intent.addr, "intent"); if (!ia || ia.sha !== ca.sha || ia.i !== ca.i) return no("address_mismatch", "the choice and the intent are not at the same <sha16>#<i>");
  const st = intent.body.status, gaps = (intent.body.gaps ?? []).map((g) => g?.gap).filter((g) => typeof g === "string");
  if (!DEFINABLE.includes(st)) return no(gaps.length ? `intent_gap:${gaps.join(",")}` : `intent_status:${String(st)}`, `the intent is ${String(st)}${gaps.length ? ` (its own gaps: ${gaps.join(", ")})` : ""}: nothing to decide yet`, { status: st, gaps, alternatives: intent.body.alternatives?.length ?? 0 });
  if (typeof proposal.body.primitive !== "string" || !proposal.body.primitive) return no("no_primitive", "the proposal names no primitive");
  if (!wellSpans(proposal.body.spans)) return no("proposal_spans_malformed", "the proposal's spans are not finite from < to");
  const own = choice.body.spans !== undefined && choice.body.spans !== null;
  if (own && !wellSpans(choice.body.spans)) return no("spans_malformed", "the choice's own spans are not finite from < to");
  for (const p of intent.body.params_missing ?? []) if (p !== "span") return no(`param_unsupplied:${String(p)}`, `the intent still lacks '${String(p)}' and an edit-choice carries only spans and a tolerance`, { param: p });
  const tol = isNum(choice.body.tolerance) ? choice.body.tolerance : null;
  return { body: { schema: EDIT_SCHEMA, rule: RULES[DEF_KIND], giver: giver.trim(), intent: intent.addr, proposal: proposal.addr, primitive: proposal.body.primitive, clip: proposal.body.clip ?? null, method: proposal.body.method ?? null,
    spans: byFrom(own ? choice.body.spans : proposal.body.spans), tolerance: tol, declared_from: own ? "asker" : "proposal" }, gap: null, why: null };
}

/** evaOf({ def, proposal }) -> { body, gap, why }. def: the edit-def BODY; proposal: the proposal ENTRY (live, latest). body is the edit-eva body (stands true or false) or null: no DEF, or the tolerance is not positive (ABSTAINS). */
export function evaOf({ def, proposal } = {}) {
  const no = (gap, why) => none(gap, why);
  if (!isObj(def) || def.schema !== EDIT_SCHEMA || def.rule !== RULES[DEF_KIND] || typeof def.giver !== "string" || !wellSpans(def.spans)) return no("no_eva:no_def", "an EVA asserts the evidence stands under a DEF: there is none");
  if (!isObj(proposal) || !isObj(proposal.body)) return no("no_eva:no_proposal", "the evidence (the nominated proposal) is not live");
  const tol = def.tolerance;
  if (!isNum(tol) || tol <= 0) return no("eva_abstains:tolerance", "the asker declared no positive tolerance: whether the evidence stands cannot be asserted, and no entry is written");
  const pb = proposal.body, reasons = [];
  if (pb.method !== def.method) reasons.push("method"); if (pb.primitive !== def.primitive) reasons.push("primitive"); if ((pb.clip ?? null) !== def.clip) reasons.push("clip");
  const prop = wellSpans(pb.spans) ? byFrom(pb.spans) : null, differences = [];
  if (!prop) reasons.push("proposal_spans_malformed");
  else if (prop.length !== def.spans.length) reasons.push("span_count");
  else def.spans.forEach((d, index) => { const df = Math.abs(prop[index].from - d.from), dt = Math.abs(prop[index].to - d.to); if (df > tol || dt > tol) reasons.push("span_beyond_tolerance"); differences.push({ index, from: df, to: dt }); });
  const stands = reasons.length === 0;
  return { body: { schema: EDIT_SCHEMA, rule: RULES[EVA_KIND], stands, standing: "single", witnesses: 1, reasons: [...new Set(reasons)], tolerance: tol, method: { declared: def.method, proposed: pb.method ?? null }, spans: { declared: def.spans.length, proposed: prop ? prop.length : null },
    differences, max_difference: differences.length ? Math.max(...differences.flatMap((d) => [d.from, d.to])) : null, declared_from: def.declared_from, independent: def.declared_from === "asker",
    note: "one proposal from one method is ONE witness; `stands` is about the asker's declared spans only" }, gap: null, why: null };
}

/** recOf({ def, eva, defId, evaId }) -> { body, gap, why }. def, eva: the BODIES; ids: the entries' ids. body is the order, only when the EVA stands. */
export function recOf({ def, eva, defId, evaId } = {}) {
  const no = (gap, why) => none(gap, why);
  if (!isObj(def) || def.schema !== EDIT_SCHEMA || def.rule !== RULES[DEF_KIND]) return no("no_rec:no_def", "an order rests on a DEF");
  if (!isObj(eva) || eva.rule !== RULES[EVA_KIND]) return no("no_rec:no_eva", "an order rests on an EVA");
  if (eva.stands !== true) return no("no_rec:eva_not_standing", "the EVA does not stand: there is nothing to order");
  if (typeof defId !== "string" || typeof evaId !== "string") return no("no_rec:no_ids", "the order names the entries it rests on");
  return { body: { schema: EDIT_SCHEMA, rule: RULES[REC_KIND], primitive: def.primitive, clip: def.clip, spans: def.spans, intent: def.intent, def: defId, eva: evaId, applies: false }, gap: null, why: null };
}

/** marksFor({ kind, sha, i, body, prev, of, log, by, revises }) -> [WeaveMark@1] for organs/weave-mark.mjs, or [] when the body is missing or the chain is not whole. `prev` is the id of the entry this one follows (DEF: the edit-choice;
 *  EVA: the edit-def; REC: the edit-eva) and `of` must contain it. A REC mark must be an order from a standing EVA (its body.eva is prev, applies false); an EVA mark's body must be an EVA verdict; any other kind makes no mark. */
export function marksFor({ kind, sha, i, body, prev, of, log, by = "penelope.edit", revises = null } = {}) {
  const spec = KINDS[kind];
  if (!spec || !sha || !Number.isInteger(i) || !isObj(body) || typeof prev !== "string" || !Array.isArray(of) || !of.includes(prev) || !log) return [];
  if (kind === DEF_KIND && !(body.rule === RULES[DEF_KIND] && typeof body.giver === "string" && body.giver)) return [];
  if (kind === EVA_KIND && !(body.rule === RULES[EVA_KIND] && typeof body.stands === "boolean")) return [];
  if (kind === REC_KIND && !(body.rule === RULES[REC_KIND] && body.applies === false && body.eva === prev && typeof body.def === "string" && of.includes(body.def))) return [];
  const how = "computed from the fields of the entries named in `of` (the edit-choice, edit-proposal and edit-intent read from the log by kind); no text read, no model called, the tolerance is the asker's";
  return [{ by, log, kind, cell: spec.cell, addr: editAddr(sha, i), body, of, basis: { schema: EDIT_SCHEMA, rule: RULES[kind], ...(revises ? { revises, role: "REC" } : {}) }, witness: { how }, declare: { why: spec.why } }];
}
