// penelope/organs/minds-ledger.mjs — READING WITH MULTIPLE MINDS (GL-EN-33, 2026-10-14).
//
// A dialogue is many minds over one text. Here a speaker is a MIND: one source (a witness is `mind:<speaker>#<address>`, whose source
// is the speaker, so two utterances by one mind are one perspective) and one commitment giver. A definition is a commitment
// (`same-as(concept, definiens)`, giver the speaker); another mind's counterexample is an EVA against it; only the giver may concede
// (REC); a concession is followed by the next DEF. That is the elenchus as the DEF → EVA → REC loop, with a real contest: each round's
// finding feeds the next, which the essays' read-all loop (GL-EN-32 law 6) never had.
//
// Pure doors over the khora kernel; persistence is the caller's. Speakers are SURFACES: "Socrates" and "I" are two minds until a
// resolver outside this organ says otherwise; this file never merges two surfaces by guess.
//
//   defineBy(log, { speaker, concept, definiens, text, at })         DEF  (+ the heard link note, witnessed by that mind)
//   testBy(log, { tester, target, counterexample, at })               EVA  (the cut lands the contest; the commitment is refused)
//   concedeBy(log, { speaker, target, trigger, at })                  REC  (only the giver; the trigger verbatim; nothing deleted)
//   assertBy(log, { speaker, subj, pred, obj, polarity, text, at })   a mind's own claim, heard under its witness
//   runDialogue(log, turns)                                           episodes, each bounded by measured-loop
//   mindsOf(log)                                                      the standing of each mind's commitments
import { kernelImport } from "./kernel-reach.mjs";

// The kernel is reached through organs/kernel-reach.mjs (typed khora-absent when the sibling is not there).
const { makeNotes, noteId } = await kernelImport("khora", "native/kernel/notes.js");
const { makeCommitments, KINDS, STANDINGS } = await kernelImport("khora", "native/kernel/commitments.js");
const { makeMeasuredLoop } = await kernelImport("khora", "native/kernel/measured-loop.js");

const N = makeNotes();
const C = makeCommitments();
const freeze = Object.freeze;

export const REFUSALS = freeze({
  NOT_THE_GIVER: "not_the_giver",
  SELF_TEST: "self_test",
  UNKNOWN_DEFINITION: "unknown_definition",
  NO_WORDS: "no_words",
});

const slug = (s) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, "-");
/** The witness of a mind at an address. Its SOURCE (sourceOfWitness) is the speaker alone. */
export const mindWitness = (speaker, at) => `mind:${slug(speaker)}#${at}`;
const words = (t) => String(t ?? "").trim();

const standingsOf = (log) => C.standings(log);
/** A definition by its id. The kernel's id carries the giver; a legacy members-only id still names it when one giver holds it. */
const defOf = (log, id) => {
  const all = standingsOf(log);
  return all.find((s) => s.id === id) ?? all.find((s) => s.legacy_id === id && all.filter((t) => t.legacy_id === id).length === 1) ?? null;
};
const sameMembers = (a, b) => a.length === b.length && a.every((m) => b.includes(m));

/** The heard link note for a definition: the note whose two ends are the commitment's two members, in either order. */
const linkNoteOf = (log, members) => {
  const set = new Set(members.map((m) => m.toLowerCase()));
  return N.fold(log).find((n) => !String(n.id).startsWith("cut:") && set.has(String(n.end1).toLowerCase()) && set.has(String(n.end2).toLowerCase())) ?? null;
};

// ---- DEF ------------------------------------------------------------------------------------------------------------------------

export function defineBy(log, { speaker, concept, definiens, text = null, at, purpose = null, because = null } = {}) {
  if (!words(speaker) || !words(concept) || !words(definiens)) return { log, refused: { type: REFUSALS.NO_WORDS, detail: "a definition names a speaker, a concept and a definiens" } };
  const probe = C.declare(log, { kind: KINDS.SAME_AS, members: [concept, definiens], giver: words(speaker), purpose: purpose ?? `what ${concept} is, as ${speaker} puts it`, because });
  if (probe.refused) return { log, refused: probe.refused };
  // The kernel's id carries the giver (khora 3607ceca): a second mind declaring the same two members gets ITS OWN commitment and the
  // first mind's is untouched, so the pre-flight that refused the takeover is gone. The shared heard link note stays shared.
  let next = probe.log;
  const heard = N.admit(next, [{ end1: concept, label: "is", end2: definiens, spans: [{ at }], polarity: "+" }], { witness: mindWitness(speaker, at) });
  next = heard.log;
  return { log: next, id: probe.id, refused: null, noteId: heard.heard[0]?.id ?? noteId(concept, "is", definiens), text };
}

// ---- EVA ------------------------------------------------------------------------------------------------------------------------

export function testBy(log, { tester, target, counterexample, at } = {}) {
  const def = defOf(log, target);
  if (!def) return { log, refused: { type: REFUSALS.UNKNOWN_DEFINITION, detail: `no commitment ${target} on this log` } };
  if (!words(tester) || !words(counterexample)) return { log, refused: { type: REFUSALS.NO_WORDS, detail: "a test names a tester and the counterexample's own words" } };
  if (slug(tester) === slug(def.giver)) return { log, refused: { type: REFUSALS.SELF_TEST, detail: "a mind does not test its own commitment; another mind's counterexample is the EVA" } };
  const link = linkNoteOf(log, def.members);
  let next = log;
  let contest = null;
  if (link) {
    // the denial, in the tester's words, over the SAME ends: the door lands the contest (CON · Figure) against the link
    const r = N.admit(next, [{ end1: link.end1, label: link.label, end2: link.end2, spans: [{ at }], polarity: "-", decider: words(counterexample) }], { witness: mindWitness(tester, at) });
    next = r.log;
    contest = r.contests[0] ?? null;
  }
  const ev = C.evaluate(next, target, {
    verdict: "refused",
    ground: `${def.members.join(" = ")} (${def.giver})`,
    broken: `${words(counterexample)} (${slug(tester)} at ${at})`,
    because: words(counterexample),
    evidence: [{ by: slug(tester), at }],
  });
  if (ev.refused) return { log, refused: ev.refused };
  return { log: ev.log, refused: null, contest, by: slug(tester) };
}

// ---- REC ------------------------------------------------------------------------------------------------------------------------

export function concedeBy(log, { speaker, target, trigger, at } = {}) {
  const def = defOf(log, target);
  if (!def) return { log, refused: { type: REFUSALS.UNKNOWN_DEFINITION, detail: `no commitment ${target} on this log` } };
  if (slug(speaker) !== slug(def.giver)) return { log, refused: { type: REFUSALS.NOT_THE_GIVER, detail: `${target} is ${def.giver}'s; only its giver may take it back`, giver: def.giver } };
  if (!words(trigger)) return { log, refused: { type: REFUSALS.NO_WORDS, detail: "a concession records its own reason, verbatim" } };
  const c = C.concede(log, target, { trigger: `${slug(speaker)} at ${at}: ${words(trigger)}` });
  if (c.refused) return { log, refused: c.refused };
  let next = c.log;
  // the heard link note is taken back too (REC on the note: it stays on the log and the fold stops projecting it), but only when no
  // OTHER mind still stands on it: the note is shared by every giver of the same two members.
  const link = linkNoteOf(log, def.members);
  const stillHeld = standingsOf(log).some((s) => s.kind === KINDS.SAME_AS && s.id !== def.id && sameMembers(s.members, def.members) && s.standing !== STANDINGS.CONCEDED);
  if (link && !stillHeld) {
    const n = N.concede(next, link.id, { trigger: `${slug(speaker)} at ${at}: ${words(trigger)}` });
    if (!n.refused) next = n.log;
  }
  return { log: next, refused: null, id: c.id ?? null };
}

// ---- a mind's own claim -----------------------------------------------------------------------------------------------------------

export function assertBy(log, { speaker, subj, pred, obj, polarity = "+", text = null, at } = {}) {
  if (!words(speaker) || !words(subj) || !words(pred) || !words(obj)) return { log, refused: { type: REFUSALS.NO_WORDS, detail: "an assertion names a speaker and two ends and a label" } };
  const r = N.admit(log, [{ end1: subj, label: pred, end2: obj, spans: [{ at }], polarity: polarity === "-" ? "-" : "+", ...(polarity === "-" ? { decider: text ?? `${subj} ${pred} ${obj}` } : {}) }], { witness: mindWitness(speaker, at) });
  return { log: r.log, refused: r.turnedAway[0] ? { type: r.turnedAway[0].reason, detail: r.turnedAway[0].detail } : null, contests: r.contests };
}

// ---- the dialogue -----------------------------------------------------------------------------------------------------------------

const unresolvedOf = (log) => {
  const open = standingsOf(log).filter((s) => s.kind === KINDS.SAME_AS && (s.standing === STANDINGS.WISH || s.standing === STANDINGS.REFUSED)).length;
  const contests = N.fold(log).filter((n) => (n.disputedBy ?? []).length > 0).length;
  return { open, contests, total: open + contests };
};

/**
 * Walk typed turns ({ speaker, act: define | test | concede | assert, ...payload, at }). Each DEF opens an EPISODE bounded by its own
 * measured-loop over what is unresolved; a concession by the giver closes it, and the next DEF by that mind carries `because` pointing at
 * the one it replaces, so a finding feeds the next round. An episode still open at the end is typed `open_at_end`, never a verdict.
 */
export function runDialogue(log, turns = []) {
  let next = log;
  const episodes = [];
  const refusals = [];
  const byDef = new Map();      // definition id -> episode
  const lastConceded = new Map(); // speaker -> definition id they most recently conceded
  const push = (ep) => { const u = unresolvedOf(next); ep.loop.push(u.total); ep.rounds.push({ turn: ep.rounds.length + 1, ...u, verdict: ep.loop.verdict().verdict }); };

  turns.forEach((t, i) => {
    const act = t.act;
    if (act === "define") {
      const because = lastConceded.get(slug(t.speaker)) ? `replaces ${lastConceded.get(slug(t.speaker))}: a finding of the last round` : null;
      const r = defineBy(next, { ...t, because });
      if (r.refused) { refusals.push({ turn: i, act, ...r.refused }); return; }
      next = r.log;
      const ep = { definition: r.id, giver: slug(t.speaker), opened: i, replaces: lastConceded.get(slug(t.speaker)) ?? null, rounds: [], loop: makeMeasuredLoop({ ceiling: turns.length + 1 }), closed: null };
      byDef.set(r.id, ep); episodes.push(ep);
      push(ep);
    } else if (act === "test") {
      const r = testBy(next, { ...t, tester: t.speaker });
      if (r.refused) { refusals.push({ turn: i, act, ...r.refused }); return; }
      next = r.log;
      const ep = byDef.get(t.target);
      if (ep) push(ep);
    } else if (act === "concede") {
      const r = concedeBy(next, t);
      if (r.refused) { refusals.push({ turn: i, act, ...r.refused }); return; }
      next = r.log;
      lastConceded.set(slug(t.speaker), t.target);
      const ep = byDef.get(t.target);
      if (ep) { push(ep); ep.closed = { by: slug(t.speaker), turn: i }; }
    } else if (act === "assert") {
      const r = assertBy(next, t);
      if (r.refused) refusals.push({ turn: i, act, ...r.refused });
      else next = r.log;
    } else refusals.push({ turn: i, act, type: "unknown_act", detail: "a turn is define, test, concede or assert" });
  });

  const out = episodes.map((ep) => {
    const v = ep.loop.verdict();
    return freeze({ definition: ep.definition, giver: ep.giver, replaces: ep.replaces, opened: ep.opened, closed: ep.closed, rounds: freeze(ep.rounds), stop: ep.closed ? v : freeze({ continue: true, verdict: "open_at_end", rounds: ep.rounds.length }) });
  });
  return { log: next, episodes: freeze(out), refusals: freeze(refusals), unresolved: unresolvedOf(next) };
}

// ---- reading with the minds --------------------------------------------------------------------------------------------------------

/** Each mind's commitments by their standing now (a projection of the log), and who tested what. */
export function mindsOf(log) {
  const minds = {};
  const at = (m) => (minds[m] ??= { defined: [], held: [], refused: [], conceded: [], wishes: [], tested: [] });
  for (const s of standingsOf(log)) {
    if (s.kind !== KINDS.SAME_AS) continue;
    const m = at(slug(s.giver));
    m.defined.push(s.id);
    if (s.standing === STANDINGS.CONCEDED) m.conceded.push(s.id);
    else if (s.standing === STANDINGS.REFUSED) m.refused.push(s.id);
    else if (s.standing === STANDINGS.TESTIMONY) m.held.push(s.id);
    else m.wishes.push(s.id);
  }
  for (const e of log?.entries ?? []) {
    if (e.operator === "EVA" && Array.isArray(e.evidence) && e.evidence[0]?.by) at(e.evidence[0].by).tested.push(e.task_id);
  }
  return freeze(minds);
}
