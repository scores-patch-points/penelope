// log.mjs — the append-only log under compare.mjs, with understanding that runs backward (THEORY-IDENTITY.md section 17).
// Entries have the pharos shape {cell, kind, addr, body, of, basis, seen, by, at, id}; id = sha256 of the canonical entry; `seen` is computed (the heads), `at` is a DECLARED tag, never a clock.
// A later identity event (a witnessed merge, a cannot-link) may change what an earlier verdict should have been; the earlier entry is never rewritten. khora's hindsight kernel
// (native/kernel/hindsight.js: "understood backwards and lived forwards") finds which earlier verdicts rest on the re-addressed ids, ranked against a null; each is re-run under the
// identity known at the event; a changed verdict is a REVISION entry. A revision is only ADMITTED by a foresight gate (hindsight proposes, foresight tests); a witnessed Other is revoked
// only by retracting a witness. standingAt(log, n) projects the standing as of the first n entries, so the same log answers "what did we think at cursor n".
import { compareStatements, sha, canon } from "./compare.mjs";
const KH = process.env.KHORA_HOME ?? "/Users/mlacy/Documents/khora-cast/khora";
const { hindsight } = await import(`${KH}/native/kernel/hindsight.js`);

// THE IDENTITY IS A DEFINITION (the owner's ruling of 2026-11-19, THEORY-IDENTITY.md erratum to Definition 8). "There is no difference that makes a difference between these two folds" is a UNIVERSAL over the fold: it is declared, resting on priors, naming its asker,
// its tolerance and its giver, at a categorically higher level of assertion than any instance. By khora's grain theorem a corpus can REFUTE such a universal and never earn it, so a corpus alone yields at most a CANDIDATE; a GIVEN names a giver (the asker, a treebank, a standard).
//   identity-prior        DEF·Pattern  the standing prior: asker, tolerance, giver, the priors it rests on (a candidate without a giver)
//   identity-declaration  DEF·Figure   one pair, citing the prior (of) and the evidence it was declared on (janus's cuts, bonds, merged world, bindings: stigmergy, by address)
//   verdict               EVA·Figure   the evidence STANDS under the declaration, at its tolerance, only ever "up to"; silence is a hole
//   merge                 REC·Figure   applies a GIVEN identity (or revises it); a candidate never applies a merge
// A model may hold the fold and report differences with witnesses; it never writes the identity DEF or the verdict.
export const CELLS = Object.freeze({ "identity-prior": "DEF·Pattern", "identity-declaration": "DEF·Figure", verdict: "EVA·Figure", merge: "REC·Figure", apart: "DEF·Figure", revision: "REC·Figure", admit: "EVA·Figure", retract: "NUL·Figure" });
const isModel = (by) => { const x = String(by ?? ""); return x.startsWith("model:") || x.startsWith("self:model:"); };
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const withoutId = (e) => { const { id, ...rest } = e; return rest; };

export class Log {
  constructor(entries = []) { this.entries = []; this.heads = []; for (const e of entries) this.#load(e); }
  #load(e) {
    if (sha(canon(withoutId(e))) !== e.id) throw new Error(`log refused: entry ${e.id} does not hash to its own content (drift)`);
    if (!CELLS[e.kind] || CELLS[e.kind] !== e.cell) throw new Error(`log refused: kind ${e.kind} at cell ${e.cell} is not declared`);
    this.entries.push(e); this.heads = [e.id];
  }
  append({ kind, addr, body, of = [], basis = {}, by, at }) {
    if (!CELLS[kind]) throw new Error(`unknown kind ${kind}`);
    if (!by || !at) throw new Error("by and at are declared, never defaulted");
    const e = { cell: CELLS[kind], kind, addr, body, of, basis, seen: [...this.heads], by, at };
    e.id = sha(canon(e)); this.entries.push(e); this.heads = [e.id]; return e;
  }
  toJSONL() { return this.entries.map((e) => JSON.stringify(e)).join("\n"); }
  static fromJSONL(text) { return new Log(text.split("\n").filter(Boolean).map((l) => JSON.parse(l))); }
}
const refsOf = (e) => e?.body?.refs ?? e?.body?.touched ?? [];
const retractedIds = (log, upTo = log.entries.length) => new Set(log.entries.slice(0, upTo).filter((e) => e.kind === "retract").flatMap((e) => e.of));
/** identity known at a cursor: GIVEN merges are must-links and aparts cannot-links, neither retracted; a merge whose declaration was retracted is revoked (REC revises the DEF); candidates are listed and apply nothing */
export function identityAt(log, upTo = log.entries.length) {
  const gone = retractedIds(log, upTo), ids = { merges: [], aparts: [], entryIds: [], candidates: [] };
  log.entries.slice(0, upTo).forEach((e) => {
    if (gone.has(e.id)) return;
    if (e.kind === "merge") { if (e.body.declaration && gone.has(e.body.declaration)) return; ids.merges.push([e.body.a, e.body.b]); ids.entryIds.push(e.id); }
    if (e.kind === "apart") { ids.aparts.push([e.body.a, e.body.b]); ids.entryIds.push(e.id); }
    if (e.kind === "identity-declaration" && e.body.standing === "candidate") ids.candidates.push([e.body.a, e.body.b]);
  });
  return ids;
}
const liveOf = (log, id, kind) => { const e = log.entries.find((x) => x.id === id); return e && e.kind === kind && !retractedIds(log).has(id) ? e : null; };
/** the standing prior: a universal over the fold, declared by an asker at a tolerance; with a named giver it is GIVEN, without one it is at most a CANDIDATE (a corpus can refute it and never earn it) */
export function declarePrior(log, { asker, tolerance, giver = null, priors = [], concerns = null, by, at }) {
  if (isModel(by) || isModel(giver)) return { refused: "a model never writes the identity DEF: it may hold the fold and report differences with witnesses" };
  if (!asker || !(typeof tolerance === "number" || typeof tolerance === "string") || tolerance === "") return { refused: "asker and tolerance are declared, never defaulted: the identity holds for someone, up to something" };
  const standing = giver ? "given" : "candidate";
  return log.append({ kind: "identity-prior", addr: `identity-prior:${asker}`, body: { asker, tolerance, giver, priors, concerns, standing, statement: "no difference that makes a difference between two folds, for these concerns, up to the tolerance" }, basis: { rule: "a universal over the fold is a DEF; a corpus alone yields at most a candidate (grain theorem); a given names its giver" }, by, at });
}
/** one pair declared the same under a standing prior; `evidence` are the ids of the entries it was declared on (cited by address, written by anyone: janus's cuts, bonds, merged world, bindings) */
export function declareIdentity(log, { prior, a, b, evidence = [], by, at }) {
  if (isModel(by)) return { refused: "a model never writes the identity DEF" };
  const p = liveOf(log, prior, "identity-prior"); if (!p) return { refused: "no_prior: a declaration cites a live standing prior" };
  if (!a || !b) return { refused: "a declaration names the pair" };
  return log.append({ kind: "identity-declaration", addr: `identity-declaration:${a}|${b}`, body: { a, b, prior, standing: p.body.standing, giver: p.body.giver, tolerance: p.body.tolerance }, of: [prior, ...evidence], basis: { rule: "a per-pair declaration under a standing prior; the evidence cited is evidence, not a verdict" }, by, at });
}
/** append a witnessed identity event; "only a witnessed identity decision is a Merge", and a merge APPLIES a declared, GIVEN identity */
export function identityEvent(log, { kind, a, b, witnesses, declaration = null, by, at }) {
  if (kind !== "merge" && kind !== "apart") return { refused: "identity events are merge or apart" };
  if (!witnesses?.length) return { refused: "no_witness: only a witnessed identity decision is recorded" };
  if (kind === "merge") {
    const d = declaration ? liveOf(log, declaration, "identity-declaration") : null;
    if (!d) return { refused: "no_declaration: a merge applies a declared identity (REC applies a DEF), cite a live identity-declaration" };
    if (d.body.standing !== "given") return { refused: "candidate_cannot_merge: a corpus alone yields at most a candidate, which may raise a conflict and never applies a merge; a given names its giver" };
    if (!((d.body.a === a && d.body.b === b) || (d.body.a === b && d.body.b === a))) return { refused: "declaration_is_for_another_pair" };
    return log.append({ kind, addr: `identity:${a}|${b}`, body: { a, b, touched: [a, b], witnesses, declaration, giver: d.body.giver }, of: [declaration], basis: { rule: "REC applies a given identity; a witnessed event; a must-link component that holds a cannot-link pair is held whole" }, by, at });
  }
  return log.append({ kind, addr: `identity:${a}|${b}`, body: { a, b, touched: [a, b], witnesses }, basis: { rule: "a witnessed identity event; a must-link component that holds a cannot-link pair is held whole" }, by, at });
}
/** the verdict: EVA asserts that the evidence STANDS under the identity prior(s) `under`, at their tolerance, only ever "up to" (silence is a hole). A model never writes it. */
export function addVerdict(log, result, { by, at, of = [], under = [] }) {
  if (isModel(by)) return { refused: "a model never writes the verdict" };
  if (!result?.entry) return { refused: result?.reason ?? "no_verdict_entry" };
  const priors = under.map((id) => liveOf(log, id, "identity-prior")); if (priors.some((p) => !p)) return { refused: "no_prior: a verdict stands under a live standing prior" };
  const e = result.entry, body = { ...e.body, identity_witnesses: e.body.declare?.identity?.entryIds ?? [], ...(priors.length ? { under, up_to: priors.map((p) => p.body.tolerance) } : {}) };
  return log.append({ kind: "verdict", addr: e.addr, body, of: [...of, ...under], basis: e.basis, by, at });
}
/** the registry that lets an address be re-opened: doc sha256 -> { id, text } */
export const docRegistry = (docs) => new Map(docs.map((d) => [sha(Buffer.from(d.text, "utf8")), d]));
const spanOf = (text, a) => { const tb = Buffer.from(text, "utf8"); return [tb.subarray(0, a.b0).toString("utf8").length, tb.subarray(0, a.b1).toString("utf8").length]; };

/** the understanding at a cursor: each verdict with its revisions applied, pending, or held */
export function standingAt(log, n = log.entries.length) {
  const E = log.entries.slice(0, n), gone = retractedIds(log, n), out = new Map();
  for (const e of E) if (e.kind === "verdict") out.set(e.id, { id: e.id, verdict: e.body.verdict, base: e.body.verdict, applied: [], pending: [], retracted: gone.has(e.id), becauseOf: e.body.identity_witnesses ?? [], under: e.body.under ?? [], upTo: e.body.up_to ?? null });
  const admitted = new Set(E.filter((e) => e.kind === "admit" && e.body.admitted).map((e) => e.of[0]));
  for (const r of E.filter((e) => e.kind === "revision")) {
    const s = out.get(r.body.of); if (!s || gone.has(r.id)) continue;
    if (!(r.body.status === "admitted" || admitted.has(r.id))) { s.pending.push({ id: r.id, why: "proposed: no foresight gate passed" }); continue; }
    if (s.verdict === "Other" && r.body.to !== "Other") {                              // a witnessed Other is revoked only by retracting a witness
      const witnesses = [s.id, ...(s.becauseOf ?? [])];
      if (!witnesses.some((w) => gone.has(w))) { s.pending.push({ id: r.id, why: "held-by-witness: an Other changes only when a witness is retracted" }); continue; }
    }
    s.verdict = r.body.to; s.applied.push(r.id);
  }
  // stale: an identity event on a ref this verdict rests on, after the verdict, with no revision proposed since
  E.forEach((e, ei) => { if (e.kind !== "merge" && e.kind !== "apart") return; E.forEach((v, vi) => { if (v.kind !== "verdict" || vi > ei || !(v.body.refs ?? []).some((r) => e.body.touched.includes(r))) return;
    if (!E.some((x, xi) => x.kind === "revision" && x.body.of === v.id && xi > ei)) out.get(v.id).stale = true; }); });
  return out;
}
/** after an identity event at eventIndex: find the earlier verdicts that rest on the re-addressed ids (hindsight), re-run each under the identity now known, log what changed.
 *  foresight (optional): async (revision) => { bits, nullMean }; a revision is admitted only if bits > nullMean and bits > 0. Without it a revision is only PROPOSED. */
export async function reconsider(log, eventIndex, { docs, by, at, foresight = null, trials = 200, seed = 20261119 }) {
  const ev = log.entries[eventIndex]; if (!ev || !(ev.kind === "merge" || ev.kind === "apart")) return { gap: "not_an_identity_event" };
  const h = hindsight(log.entries, eventIndex, { touched: ev.body.touched, refsOf, idOf: (e) => e.id, trials, rng: mulberry(seed) });
  const reg = docRegistry(docs), results = [], ident = identityAt(log, eventIndex + 1), gone = retractedIds(log);
  if (h.gap) return { hindsight: h, results };
  for (const row of h.rows) {
    const old = log.entries[row.index]; if (old.kind !== "verdict" || gone.has(old.id)) continue;
    const { witnesses, question, declare } = old.body, dA = reg.get(witnesses.A.doc), dB = reg.get(witnesses.B.doc);
    if (!dA || !dB) { results.push({ id: old.id, gap: "document_not_in_registry" }); continue; }
    const A = { doc: dA, span: spanOf(dA.text, witnesses.A) }, B = { doc: dB, span: spanOf(dB.text, witnesses.B) };
    const fresh = await compareStatements({ A, B, question, declare: { ...declare, by, at, identity: { merges: ident.merges, aparts: ident.aparts, entryIds: ident.entryIds } } });
    if (!fresh.entry || fresh.verdict === old.body.verdict) { results.push({ id: old.id, unchanged: true, verdict: old.body.verdict, distance: row.distance }); continue; }
    const nv = addVerdict(log, fresh, { by, at, of: [old.id, ev.id] });
    const from = old.body.verdict, to = fresh.verdict;
    const rev = log.append({ kind: "revision", addr: `revision:${old.id.slice(0, 16)}`, body: { of: old.id, from, to, via: [ev.id], newVerdict: nv.id, break: from === "Same" && to !== "Same", status: "proposed", distance: row.distance, hindsightRank: h.rank }, of: [old.id, ev.id, nv.id], basis: { rule: "hindsight proposes, foresight tests: admitted only by a passing gate; an Other changes only when a witness is retracted" }, by, at });
    let admitted = false, gate = null;
    if (foresight) { gate = await foresight(rev); admitted = !!gate && gate.bits > 0 && gate.bits > (gate.nullMean ?? 0); log.append({ kind: "admit", addr: `admit:${rev.id.slice(0, 16)}`, body: { admitted, foresight: gate }, of: [rev.id], basis: {}, by, at }); }
    results.push({ id: old.id, from, to, break: rev.body.break, revision: rev.id, newVerdict: nv.id, admitted, gate, distance: row.distance });
  }
  return { hindsight: { reached: h.reached, rank: h.rank, trials: h.trials, basis: h.basis }, results };
}
