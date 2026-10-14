// penelope/organs/notes-ledger.mjs — THE KEEPER'S NOTES LEDGER (GL-EN-31, 2026-10-14).
//
// The khora perceives and produces ground; it keeps nothing (KHORA.md: THE-LOG-IS-THE-MEMORY → the EOT, "the memory is the keeper's,
// never the khora's"). The notes ledger is that memory: an append-only log of what a reading heard, with the current belief always a
// projection. This organ is the keeper's custody of it. It CALLS the khora's pure kernel (notes, commitments, measured-loop, the cube);
// it never copies or re-derives it. Persistence is the caller's: every door returns the new log and writes nothing.
//
//   openLedger({ question, giver })                       → a log with its frame (DEF · Ground) on the record
//   landContent(log, spans)                               → EVA: every span heard or turned away, with a named reason
//   landTurns(log, turns, { region, giver })              → the person at the door, as a channel in THIS log
//   runLoop({ log, slot, region, giver, question })       → DEF → EVA → REC, rounds bounded by measured-loop
//   terrainsOf(log)                                       → the record's nine registers (a projection of stamps already on entries)
//   recordTerrains(history, snapshot, opts)               → file the registers append-only, earned-only (status: candidate)
//
// THE WALLS (each a tested property; each a falsifying control in GL-EN-31):
//   - THE PERSON IS ONE SOURCE, NEVER A WITNESS OF THE RECORD. Their words land as notes with the end `the person at the door`; they
//     are never `hear`d as a second witness of a content note, because a witness is what `corroborated` counts. (The P30 shape with
//     the reader in the echo's place.)
//   - A CORRECTION IS A REC, NEVER A DELETION. `concede` on the note whose bytes the turn quotes, the turn verbatim as the trigger; the
//     note stays on the log and the fold stops projecting it. A correction that quotes nothing is `unanchored`: kept, typed, no effect.
//   - EVA IS A NULL, NEVER AN OPINION. A commitment is tested against a redealt commitment of the same shape; one that does not beat
//     every draw is REFUSED and the loop itself concedes it (REC). The ledger never marks anything earned: that is janus's bow.
//   - AN UNASKABLE SLOT IS TYPED. The kernel's void needs a known first end and a label; "who …?" has neither, so it is a gap, named.
import { makeNotes, noteId, sourceOfWitness, CUT_PREFIX } from "../../khora/native/kernel/notes.js";
import { makeCommitments, KINDS } from "../../khora/native/kernel/commitments.js";
import { makeMeasuredLoop } from "../../khora/native/kernel/measured-loop.js";
import { TERRAIN_BY_DOMAIN } from "../../khora/native/kernel/cube.js";
import { userTurnOperation } from "../../khora/native/adapters/chat/user-turns.js";
import { FIRST_PERSON, NEGATION_WORDS, ANAPHORIC_PRONOUNS, INTERROGATIVE_PRONOUNS } from "../../khora/native/adapters/text/priors.js";

export const LEDGER_RECORD_SCHEMA = "EONotesLedgerRecord@1";
export const GIVER = "the person at the door";
const freeze = Object.freeze;

/** The nine terrains of concepts, in cube order: domain-major (Existence, Structure, Interpretation), grain-minor (Ground, Figure, Pattern). */
export const TERRAINS = freeze(Object.values(TERRAIN_BY_DOMAIN).flatMap((row) => [row.Ground, row.Figure, row.Pattern]));

const N = makeNotes();
const C = makeCommitments();
const PRIORS = { firstPerson: FIRST_PERSON, negation: NEGATION_WORDS, anaphoric: ANAPHORIC_PRONOUNS, interrogatives: INTERROGATIVE_PRONOUNS };

const norm = (t) => String(t ?? "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
const sourceOfAddress = (a) => String(a ?? "").split("#")[0];
const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const contentWords = (t) => [...new Set(String(t ?? "").toLowerCase().match(/[\p{L}]{4,}/gu) ?? [])];

// ---- the ledger ------------------------------------------------------------------------------------------------------------------

export function openLedger({ question = null, giver = GIVER } = {}) {
  return N.createNotes({ frame: { forWhom: giver, question, keeper: "penelope/notes-ledger", schema: LEDGER_RECORD_SCHEMA } });
}

/** A region span ({ address, text, claim }) as the arrangement the door takes. A denial carries the bytes that deny it (`decider`). */
const arrangementOf = (s) => {
  const neg = s.claim?.polarity === "-";
  return { end1: s.claim?.subj, label: s.claim?.pred, end2: s.claim?.obj, spans: [{ at: s.address }], polarity: neg ? "-" : "+", ...(neg ? { decider: s.text } : {}) };
};

/** EVA: hear every span through the door (one witness per span: its own address, whose source is its page). Nothing is dropped silently. */
export function landContent(log, spans = []) {
  let next = log;
  const heard = [], turnedAway = [], contests = [], rezeroed = [];
  for (const s of spans) {
    const r = N.admit(next, [arrangementOf(s)], { witness: s.address });
    next = r.log;
    heard.push(...r.heard); turnedAway.push(...r.turnedAway.map((t) => ({ ...t, address: s.address }))); contests.push(...r.contests); rezeroed.push(...r.rezeroed);
  }
  return { log: next, heard, turnedAway, contests, rezeroed };
}

// ---- the person at the door -----------------------------------------------------------------------------------------------------

/**
 * The person's turns, landed in THIS log. An ask is a commitment DEF (it MATTERS, giver the person, purpose their own ask); an
 * assertion is a note whose first end is the person; a correction is a REC on the note whose bytes it quotes (else `unanchored`).
 */
export function landTurns(log, turns = [], { region = [], giver = GIVER } = {}) {
  let next = log;
  const landed = [], conceded = [], unanchored = [], gaps = [], asks = [];
  const personSource = `chat:${giver.replace(/\s+/g, "-")}`;
  const quoteIndex = region.map((s) => ({ s, t: norm(s.text), id: (s.claim?.polarity === "-" ? CUT_PREFIX : "") + noteId(s.claim?.subj, s.claim?.pred, s.claim?.obj) }));
  turns.forEach((turn, i) => {
    const out = userTurnOperation(turn, { index: i, ...PRIORS });
    if (out.gap) { gaps.push({ turn: i, ...out.gap }); return; }
    const text = out.claim;
    if (out.kind === "ask") {
      const d = C.declare(next, { kind: KINDS.MATTERS, members: [text], giver, purpose: `the ask the person at the door made at turn ${i}` });
      if (d.refused) gaps.push({ turn: i, type: d.refused.type, detail: d.refused.detail });
      else { next = d.log; asks.push({ turn: i, commitment: d.id ?? null, text }); landed.push({ turn: i, kind: "ask", id: d.id ?? null }); }
      return;
    }
    // assertion and correction both land the person's own words as a note whose first end is the person (the wall: never a witness of a content note)
    const label = out.kind === "correction" ? "corrects" : "says";
    const r = N.admit(next, [{ end1: giver, label, end2: text, spans: [{ ref: `turn:${i}`, start: 0, end: text.length }], polarity: "+" }], { witness: `${personSource}#turn-${i}` });
    next = r.log;
    landed.push({ turn: i, kind: out.kind, id: r.heard[0]?.id ?? null });
    if (out.kind === "correction") {
      const hay = ` ${norm(text)} `;
      const hits = quoteIndex.filter((q) => q.t && hay.includes(` ${q.t} `));
      if (!hits.length) { unanchored.push({ turn: i, text, why: "a correction pointing back at something no span's bytes name" }); return; }
      for (const h of hits) {
        const c = N.concede(next, h.id, { trigger: `the person at the door, turn ${i}: ${text}` });
        if (c.refused) gaps.push({ turn: i, type: c.refused.type, detail: c.refused.detail, noteId: h.id });
        else { next = c.log; if (!c.noop) conceded.push({ turn: i, note: h.id }); }
      }
    }
  });
  return { log: next, landed, conceded, unanchored, gaps, asks };
}

// ---- EVA as a null ---------------------------------------------------------------------------------------------------------------

/**
 * EVA on a commitment: does `MATTERS(the ask's own words)` do work on what this ledger HEARD? Observed = the live link notes whose ends
 * carry one of the ask's content words; the null redeals the same number of words from the ledger's own vocabulary (seeded draws).
 * It holds only if it beats EVERY draw; otherwise it is refused and conceded (REC), the trigger the numbers.
 *
 * ITS KNOWN CONSERVATISM, stated rather than tuned away: a word that appears in (nearly) every note can be redealt and tie a real signal,
 * and a ledger of a handful of notes has no power to separate an ask from its redraws. Either way the result is REFUSED, never a pass:
 * this EVA can only refuse (commitments.js: "a corpus can only refuse"), and the evidence carries `notes` and `exceeded` so a refusal
 * is read at its power (ledger L32).
 */
export function evaluateAsk(log, commitmentId, { terms, draws = 199, seed = 20261014 } = {}) {
  const notes = N.fold(log).filter((n) => !String(n.id).startsWith(CUT_PREFIX) && n.end1 !== GIVER);
  const text = (n) => `${n.end1} ${n.label} ${n.end2}`.toLowerCase();
  const wanted = [...new Set((terms ?? []).map((t) => String(t).toLowerCase()))].filter((t) => t.length >= 4);
  // the redealt commitment is drawn from the OTHER words of the ledger: a vocabulary that still held the ask's own terms would let a real
  // signal tie its own redraw (found by the first fixture: one term, p ~ 1/|vocab| of redrawing itself)
  const asked = new Set(wanted);
  const vocab = [...new Set(notes.flatMap((n) => contentWords(text(n))))].filter((w) => !asked.has(w));
  const count = (set) => notes.filter((n) => { const w = new Set(contentWords(text(n))); return set.some((t) => w.has(t)); }).length;
  const observed = count(wanted);
  const rnd = mulberry(seed);
  let exceeded = 0, sum = 0;
  for (let d = 0; d < draws && vocab.length; d++) {
    const pick = wanted.map(() => vocab[Math.floor(rnd() * vocab.length)]);
    const c = count(pick);
    sum += c;
    if (c >= observed) exceeded++;
  }
  const holds = observed > 0 && vocab.length > 0 && wanted.length > 0 && exceeded === 0;
  const evidence = { observed, nullMean: draws && vocab.length ? sum / draws : 0, exceeded, draws, seed, terms: wanted, notes: notes.length, p: (1 + exceeded) / (draws + 1) };
  const ev = C.evaluate(log, commitmentId, { verdict: holds ? "holds" : "refused", ground: "the live link notes this ledger heard", broken: `the ask's terms redealt from the ledger's own vocabulary (${draws} draws, seed ${seed})`, because: holds ? null : "did not beat every redealt draw", evidence: [evidence] });  // khora task-log reserves `evidence` as a list: an object throws (commitments.evaluate documents it as opaque)
  if (ev.refused) return { log, refused: ev.refused, evidence };
  let next = ev.log;
  let conceded = null;
  if (!holds) {
    const c = C.concede(next, commitmentId, { trigger: `EVA refused: observed ${observed} against a redealt mean ${evidence.nullMean.toFixed(2)}, exceeded by ${exceeded} of ${draws} draws` });
    if (!c.refused) { next = c.log; conceded = c.id ?? null; }
  }
  return { log: next, verdict: holds ? "holds" : "refused", evidence, conceded, refused: null };
}

// ---- the loop --------------------------------------------------------------------------------------------------------------------

/**
 * DEF → EVA → REC, one source per round, bounded by measured-loop over what is still unresolved (unread sources + open voids + live
 * contests). `slot` is { end1, label, end2? } for the question's void; without a known first end the slot is a typed gap, not a guess.
 * The ceiling is the number of sources (what exists), never a repeat count typed by hand.
 */
export function runLoop({ log, slot = null, region = [], giver = GIVER, question = "", askTerms = null } = {}) {
  let next = log;
  const gaps = [];
  const bySource = new Map();
  for (const s of region) { const k = sourceOfAddress(s.address); (bySource.get(k) ?? bySource.set(k, []).get(k)).push(s); }
  const order = [...bySource.entries()].sort((a, b) => Math.max(...b[1].map((s) => s.activation ?? 0)) - Math.max(...a[1].map((s) => s.activation ?? 0)));
  const sources = order.map(([k]) => k);

  // DEF · Ground: the void the question names, with the scope it was searched in
  let voidId = null;
  const declare = (read) => {
    if (!slot?.end1 || !slot?.label || slot.end1 === "?") return null;
    return N.declareVoid(next, { end1: slot.end1, label: slot.label, end2: slot.end2 ?? null, scope: { sources, total: sources.length, read }, because: question || giver });
  };
  if (!slot?.end1 || slot.end1 === "?" || !slot?.label) gaps.push({ type: "unaskable_slot", detail: "a void names a known first end and a label; a question whose subject is the unknown has neither, and is a gap, not a guess" });
  else {
    const d = declare(0);
    if (d?.refused) gaps.push({ type: d.refused.type, detail: d.refused.detail });
    else if (d) { next = d.log; voidId = d.id; }
  }

  // DEF · Figure: the ask's own commitment, giver the person at the door (the ask is also on the ledger as the person's channel when turns land)
  let commitment = null;
  if (askTerms?.length) {
    const c = C.declare(next, { kind: KINDS.MATTERS, members: [...askTerms], giver, purpose: `the ask: ${question}`.trim() });
    if (c.refused) gaps.push({ type: c.refused.type, detail: c.refused.detail });
    else { next = c.log; commitment = c.id; }
  }

  const unresolved = (unread) => {
    const openVoids = N.foldVoids(next).filter((v) => v.standing !== "filled").length;
    const contests = N.fold(next).filter((n) => (n.disputedBy ?? []).length > 0).length;
    return unread + openVoids + contests;
  };
  const ml = makeMeasuredLoop({ ceiling: Math.max(1, sources.length + 1) });
  const rounds = [];
  ml.push(unresolved(sources.length));
  let v = ml.verdict();
  let r = 0;
  while (v.continue && r < sources.length) {
    const src = sources[r];
    const landed = landContent(next, bySource.get(src));
    next = landed.log;
    r += 1;
    // keep the void's scope current (the same DEF, superseded by pointer) while it is still open
    if (voidId && N.foldVoids(next).some((x) => x.id === voidId && x.standing !== "filled")) {
      const d = declare(r);
      if (d && !d.refused) next = d.log;
    }
    ml.push(unresolved(sources.length - r));
    v = ml.verdict();
    rounds.push({ round: r, source: src, heard: landed.heard.length, turnedAway: landed.turnedAway.length, contests: landed.contests.length, rezeroed: landed.rezeroed.length, unresolved: ml.rounds.at(-1), verdict: v.verdict });
  }

  // EVA: test the ask's commitment against its redealt null; REC: concede it if it did no work
  let evaluation = null;
  if (commitment) {
    evaluation = evaluateAsk(next, commitment, { terms: askTerms });
    if (!evaluation.refused) next = evaluation.log;
  }
  return { log: next, rounds, stop: v, sources: sources.length, voidId, commitment, evaluation, gaps };
}

// ---- the nine registers ----------------------------------------------------------------------------------------------------------

/**
 * The record's nine registers: a projection of the stamps the ledger already puts on every entry (`cellFields`). An entry with no cell is
 * counted apart (`unstamped`), never filed under a guess; a terrain outside the nine is typed `unknownTerrain`.
 */
export function terrainsOf(log) {
  const registers = Object.fromEntries(TERRAINS.map((t) => [t, { count: 0, concepts: [], operators: {} }]));
  const unstamped = [], unknownTerrain = [];
  for (const e of log?.entries ?? []) {
    const t = e.terrain;
    if (!t) { unstamped.push({ seq: e.seq, operator: e.operator ?? null, why: e.cell_gap ?? "no cell" }); continue; }
    if (!registers[t]) { unknownTerrain.push({ seq: e.seq, terrain: t }); continue; }
    const reg = registers[t];
    reg.count += 1;
    reg.operators[e.operator] = (reg.operators[e.operator] ?? 0) + 1;
    if (e.task_id && !reg.concepts.includes(e.task_id)) reg.concepts.push(e.task_id);
  }
  return freeze({ schema: "EOTerrainRegisters@1", registers, unstamped: freeze(unstamped), unknownTerrain: freeze(unknownTerrain), entries: (log?.entries ?? []).length });
}

/**
 * File the registers on the record, append-only (GLAUCA-EOT's contract: pipeline, status, evidence, falsifying control; to revise,
 * supersede by pointer). The status is `candidate`: the ledger files; it never earns. A re-filed id is a typed refusal.
 */
export function recordTerrains(history = [], snapshot, { id = null, at = null, supersedes = null, evidence = null } = {}) {
  const when = at ?? new Date().toISOString();
  const entryId = id ?? `nl:terrains:${when}`;
  if (history.some((h) => h.id === entryId)) return { history, refused: { type: "re_filed", id: entryId, detail: "an entry is superseded by pointer, never re-filed under its own id" } };
  const entry = freeze({
    schema: LEDGER_RECORD_SCHEMA,
    id: entryId,
    pipeline: "notes-ledger",
    at: when,
    status: "candidate",
    registers: freeze(Object.fromEntries(TERRAINS.map((t) => [t, freeze({ count: snapshot.registers[t].count, concepts: freeze([...snapshot.registers[t].concepts]) })]))),
    unstamped: snapshot.unstamped.length,
    unknownTerrain: snapshot.unknownTerrain.length,
    evidence: evidence ?? null,
    falsifyingControl: "a concept filed earned by the ledger itself; an entry with no cell filed under a terrain; a correction that deleted a note; a user assertion counted as a witness of a content note",
    supersedes,
  });
  return { history: freeze([...history, entry]), refused: null, entry };
}

export { sourceOfWitness };
