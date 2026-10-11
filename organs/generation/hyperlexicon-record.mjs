// organs/generation/hyperlexicon-record.mjs — the keeper's append-only epoch record, made real.
//
// What this is NOT: a re-filing mechanism. A record organ that filters and replaces history entries is a
// half-rewrite — exactly what a keeper's ledger must never do. This organ enforces the first law of the
// record: NOTHING IS EVER REWRITTEN, ONLY SUPERSEDED.
//
//   recordEvent(record, event)      -> append; RE-FILING an existing id is a TYPED REFUSAL, never a rewrite
//   supersede(record, { id })       -> APPEND a superseding event by pointer; the old event stays on the record
//   epochsOf(record)                -> the events, in file order (a replayable fold, never a mutable store)
//   verdictsByStanding(record)      -> the retained mind: earned / withheld-candidate / defeated-preserved
//
// Convenient: `recordEvent` returns { ok:false, refused:true, why } when the id already exists — a caller
// can name the refusal ("append-only: supersede it by pointer, never re-file it") instead of silently
// rebinding. Every event carries its standing and its basis (the derived facts), and a superseding event
// points AT the older id — the falsification that forced the change stays on the record.
//
// Pure. No IO, no model, no clock (the caller stamps `at`). The record is an array of frozen events; the
// JSON shape is the source of truth and replays monotonically. (Provenance integration is a seam: stamp
// the event with the keeper's own ledger at the call site.)
export const HLR_SCHEMA = "HyperlexiconRecord@2";
export const STANDINGS = Object.freeze(["earned", "withheld-candidate", "defeated-preserved"]);

export const emptyRecord = () => ({ schema: HLR_SCHEMA, events: [] });

const isEvent = (e) => e && typeof e === "object";
const has = (r, id) => r && Array.isArray(r.events) && r.events.some((e) => isEvent(e) && e.id === id);

/** A strict append. Re-filing an existing id is refused — the only legal move on a held id is to supersede it. */
export function recordEvent(record, event, { now = null } = {}) {
  const rec = isEvent(record) ? record : emptyRecord();
  if (!isEvent(event) || !String(event.id || "").trim()) return { ok: false, refused: "no-id", why: "an epoch needs an id to be filed" };
  if (has(rec, event.id)) return { ok: false, refused: "re-file", why: "append-only: supersede it by pointer, never re-file it", id: event.id };
  const ev = Object.freeze({
    schema: HLR_SCHEMA + ".event",
    id: String(event.id),
    kind: event.kind || "epoch",
    standing: STANDINGS.includes(event.standing) ? event.standing : event.standing || "earned",
    basis: event.basis || null,               // the derived facts (janus's measure), never the mouth's opinion
    referent: event.referent || null,
    at: now || new Date().toISOString(),
    ...(event.reason ? { reason: event.reason } : {}),
    ...(event.supersedes ? { supersedes: String(event.supersedes) } : {}),
  });
  return { ok: true, record: { schema: rec.schema, events: [...(rec.events || []), ev] }, event: ev };
}

/** APPEND a superseding event by pointer: the older entry stays, the new one names it. A missing target is a typed gap. */
export function supersede(record, { id, by, reason }, { now = null } = {}) {
  if (!has(record, id)) return { ok: false, refused: "unknown-target", why: `no filed event "${id}" to supersede` };
  if (has(record, by)) return { ok: false, refused: "re-file", why: `"${by}" already holds a record; supersede by a NEW id` };
  return recordEvent(record, { id: by, kind: "superseded", standing: "earned", referent: "(:superseding)", basis: { supersedes: id, reason: reason || null }, reason });
}

/** The record in file order — a replayable fold. */
export const epochsOf = (record) => (record && Array.isArray(record.events) ? record.events : []);

/** The retained mind, partitioned by standing. `mindCount` = every earned referent that has not since been superseded. */
export function verdictsByStanding(record) {
  const events = epochsOf(record);
  const by = { earned: [], "withheld-candidate": [], "defeated-preserved": [] };
  const superseded = new Set();
  for (const e of events) { if (e && e.kind === "superseded" && e.basis && e.basis.supersedes) superseded.add(e.basis.supersedes); }
  for (const e of events) { if (!isEvent(e) || e.kind !== "epoch") continue; if (superseded.has(e.id)) continue; const k = STANDINGS.includes(e.standing) ? e.standing : "earned"; (by[k] || (by.earned = by.earned)).push(e.id); }
  return {
    schema: "RetainedMind@1",
    earned: by.earned, withheld: by["withheld-candidate"], defeated: by["defeated-preserved"],
    retainedMind: by.earned.length - by["defeated-preserved"].length,
  };
}

export default { emptyRecord, recordEvent, supersede, epochsOf, verdictsByStanding };