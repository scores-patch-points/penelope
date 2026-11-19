// log.mjs — the append-only log under compare.mjs, with understanding that runs backward (THEORY-IDENTITY.md section 17).
// Entries have the pharos shape {cell, kind, addr, body, of, basis, seen, by, at, id}; id = sha256 of the canonical entry; `seen` is computed (the heads), `at` is a DECLARED tag, never a clock.
// A later identity event (a witnessed merge, a cannot-link) may change what an earlier verdict should have been; the earlier entry is never rewritten. khora's hindsight kernel
// (native/kernel/hindsight.js: "understood backwards and lived forwards") finds which earlier verdicts rest on the re-addressed ids, ranked against a null; each is re-run under the
// identity known at the event; a changed verdict is a REVISION entry. A revision is only ADMITTED by a foresight gate (hindsight proposes, foresight tests); a witnessed Other is revoked
// only by retracting a witness. standingAt(log, n) projects the standing as of the first n entries, so the same log answers "what did we think at cursor n".
import { compareStatements, sha, canon } from "./compare.mjs";
const KH = process.env.KHORA_HOME ?? "/Users/mlacy/Documents/khora-cast/khora";
const { hindsight } = await import(`${KH}/native/kernel/hindsight.js`);

export const CELLS = Object.freeze({ verdict: "EVA·Figure", merge: "REC·Figure", apart: "DEF·Figure", revision: "REC·Figure", admit: "EVA·Figure", retract: "NUL·Figure" });
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
/** identity known at a cursor: merges are must-links and aparts cannot-links, neither retracted */
export function identityAt(log, upTo = log.entries.length) {
  const gone = retractedIds(log, upTo), ids = { merges: [], aparts: [], entryIds: [] };
  log.entries.slice(0, upTo).forEach((e) => { if (gone.has(e.id)) return; if (e.kind === "merge") { ids.merges.push([e.body.a, e.body.b]); ids.entryIds.push(e.id); } if (e.kind === "apart") { ids.aparts.push([e.body.a, e.body.b]); ids.entryIds.push(e.id); } });
  return ids;
}
/** append a witnessed identity event; "only a witnessed identity decision is a Merge" */
export function identityEvent(log, { kind, a, b, witnesses, by, at }) {
  if (kind !== "merge" && kind !== "apart") return { refused: "identity events are merge or apart" };
  if (!witnesses?.length) return { refused: "no_witness: only a witnessed identity decision is recorded" };
  return log.append({ kind, addr: `identity:${a}|${b}`, body: { a, b, touched: [a, b], witnesses }, basis: { rule: "a witnessed identity event; a must-link component that holds a cannot-link pair is held whole" }, by, at });
}
export function addVerdict(log, result, { by, at, of = [] }) {
  if (!result?.entry) return { refused: result?.reason ?? "no_verdict_entry" };
  const e = result.entry, body = { ...e.body, identity_witnesses: e.body.declare?.identity?.entryIds ?? [] };
  return log.append({ kind: "verdict", addr: e.addr, body, of, basis: e.basis, by, at });
}
/** the registry that lets an address be re-opened: doc sha256 -> { id, text } */
export const docRegistry = (docs) => new Map(docs.map((d) => [sha(Buffer.from(d.text, "utf8")), d]));
const spanOf = (text, a) => { const tb = Buffer.from(text, "utf8"); return [tb.subarray(0, a.b0).toString("utf8").length, tb.subarray(0, a.b1).toString("utf8").length]; };

/** the understanding at a cursor: each verdict with its revisions applied, pending, or held */
export function standingAt(log, n = log.entries.length) {
  const E = log.entries.slice(0, n), gone = retractedIds(log, n), out = new Map();
  for (const e of E) if (e.kind === "verdict") out.set(e.id, { id: e.id, verdict: e.body.verdict, base: e.body.verdict, applied: [], pending: [], retracted: gone.has(e.id), becauseOf: e.body.identity_witnesses ?? [] });
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
