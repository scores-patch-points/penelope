#!/usr/bin/env node
// gym/edit-decision-run.mjs [--json]     decide every edit a named asker chose: the triad edit-def -> edit-eva -> edit-rec at edit:<sha16>#<i>
//
// Penelope's part of "a decision to edit is a significant triad Penelope activity" (owner, 2026-11-27); organs/edit-decision.mjs holds the rules ED1-ED3. The log is named by env PHAROS_LOG and lives in env PHAROS; she opens it
// only by her pointer (env PENELOPE_PHAROS_JSON, else <checkout>/pharos.json) through organs/weave-mark.mjs, the one door. No pointer: the door is off, nothing is read or written, exit 1.
//
// One pass, then exit; a rerun over an unchanged log adds nothing. She reads edit-choice, edit-proposal and edit-intent BY KIND (the latest live at each address, never by author). For each address `choice:<sha16>#<i>`
// (and each `edit:<sha16>#<i>` she already holds, so a withdrawn choice is seen):
//   - DEF: written when ED1 gives a standard; EVA when ED2 gives a verdict (stands or not); REC only when the EVA stands. Each is `of` the previous (plus the proposal and the intent).
//   - an entry whose body or `of` chain changed is a NEWER entry at the same address naming the one it replaces (basis.revises); the earlier live entries of that kind at the address are then RETRACTED (unweave), so they do not resurface;
//   - an entry the rules no longer give (choice withdrawn, intent no longer definable, EVA no longer standing, tolerance gone) is RETRACTED, every live one at the address, never erased;
//   - what cannot be decided is REPORTED in the tally (`no_def:<reason>` from the intent's own gaps, `eva_abstains:tolerance`), not woven: no kind is declared for it.
// She writes only edit-def, edit-eva, edit-rec (+ pharos' own `kind` declaration and `retract`); she never reads a text, never calls khora or janus, never edits a timeline.
import { openLoom, weaveMark, unweave, marks, loomStatus, WEAVER } from "../organs/weave-mark.mjs";
import { READS, DEF_KIND, EVA_KIND, REC_KIND, parseAddr, editAddr, choiceAddrOf, defOf, evaOf, recOf, marksFor, sameBody, sameSet } from "../organs/edit-decision.mjs";

const asJson = process.argv.includes("--json");
const log = process.env.PHAROS_LOG;
if (!log || !process.env.PHAROS) { console.error("usage: PHAROS=<log dir> PHAROS_LOG=<name> node gym/edit-decision-run.mjs [--json]"); process.exit(2); }
const st = await openLoom({});
if (!st.on) { console.error(`penelope's pharos door is off: ${st.why}`); process.exit(1); }

const tally = { log, woven: 0, revised: 0, retracted: 0, unchanged: 0, decided: [], no_def: [], eva_abstained: [], not_standing: [], refused: [], door: loomStatus().why };
const live = (kind) => marks({ log, kind }) ?? [];
const latestByAddr = (es) => { const m = new Map(); for (const e of es) m.set(e.addr, e); return m; };   // log order: the later wins

const intents = latestByAddr(live(READS.intent)), proposals = latestByAddr(live(READS.proposal)), choices = latestByAddr(live(READS.choice));
const mine = {}; for (const k of [DEF_KIND, EVA_KIND, REC_KIND]) mine[k] = live(k).filter((e) => e.by === WEAVER);

const retract = (es, why) => { if (!es.length) return; const r = unweave({ by: "penelope.edit", log, ids: es.map((e) => e.id), why }); if (r.ok) tally.retracted += es.length; else tally.refused.push({ reason: r.reason, detail: r.detail, why }); };

/** ensure one link of the chain at the address: want = { body, of, prev } or null. Returns the id of the live entry, null when nothing is wanted, undefined when a weave was refused (the chain stops). */
function ensure(kind, sha, i, want) {
  const addr = editAddr(sha, i), here = mine[kind].filter((e) => e.addr === addr), latest = here.at(-1) ?? null;
  if (!want) { retract(here, `rule ${kind} no longer gives an entry at ${addr}`); return null; }
  if (latest && sameSet(latest.of, want.of) && sameBody(latest.body, want.body)) { tally.unchanged += 1; retract(here.slice(0, -1), `superseded entries of ${kind} at ${addr}`); return latest.id; }
  const [m] = marksFor({ kind, sha, i, body: want.body, prev: want.prev, of: want.of, log, revises: latest?.id ?? null });
  if (!m) { tally.refused.push({ kind, addr, reason: "chain_not_whole" }); return undefined; }
  const r = weaveMark(m);
  if (!r.ok) { tally.refused.push({ kind, addr, reason: r.reason, detail: r.detail }); return undefined; }
  if (latest) tally.revised += 1; else tally.woven += 1;
  retract(here, `${kind} at ${addr} replaced by ${r.id}`);
  return r.id;
}

const addrs = new Set(choices.keys());
for (const k of [DEF_KIND, EVA_KIND, REC_KIND]) for (const e of mine[k]) { const c = choiceAddrOf(e.addr); if (c) addrs.add(c); }
for (const caddr of [...addrs].sort()) {
  const p = parseAddr(caddr, "choice"); if (!p) { tally.refused.push({ kind: READS.choice, addr: caddr, reason: "bad_address" }); continue; }
  const { sha, i } = p, choice = choices.get(caddr) ?? null, proposal = choice ? proposals.get(choice.body?.proposal) ?? null : null, intent = proposal ? intents.get(proposal.body?.intent) ?? null : null;
  const d = defOf({ intent, proposal, choice });
  if (!d.body) tally.no_def.push({ addr: caddr, gap: d.gap, why: d.why });
  const defId = ensure(DEF_KIND, sha, i, d.body ? { body: d.body, prev: choice.id, of: [choice.id, proposal.id, intent.id] } : null);
  if (defId === undefined) continue;
  const e = defId ? evaOf({ def: d.body, proposal }) : { body: null, gap: "no_eva:no_def" };
  if (defId && !e.body) tally.eva_abstained.push({ addr: caddr, gap: e.gap, why: e.why });
  const evaId = ensure(EVA_KIND, sha, i, e.body ? { body: e.body, prev: defId, of: [defId, proposal.id, intent.id] } : null);
  if (evaId === undefined) continue;
  if (evaId && !e.body.stands) tally.not_standing.push({ addr: caddr, reasons: e.body.reasons, max_difference: e.body.max_difference, tolerance: e.body.tolerance });
  const r = evaId ? recOf({ def: d.body, eva: e.body, defId, evaId }) : { body: null };
  const recId = ensure(REC_KIND, sha, i, r.body ? { body: r.body, prev: evaId, of: [evaId, defId, proposal.id, intent.id] } : null);
  if (recId) tally.decided.push({ addr: editAddr(sha, i), rec: recId });
}

if (asJson) console.log(JSON.stringify(tally, null, 2));
else {
  console.log(`edit decisions over pharos log "${log}": ${tally.woven} woven, ${tally.revised} revised, ${tally.retracted} retracted, ${tally.unchanged} unchanged, ${tally.decided.length} order(s) standing`);
  for (const g of tally.no_def) console.log(`  ${g.addr}: ${g.gap} ${g.why}`);
  for (const g of tally.eva_abstained) console.log(`  ${g.addr}: ${g.gap} ${g.why}`);
  for (const g of tally.not_standing) console.log(`  ${g.addr}: evidence does not stand (${g.reasons.join(",")}; max difference ${g.max_difference}, tolerance ${g.tolerance})`);
  for (const r of tally.refused.slice(0, 5)) console.log(`  refused ${r.kind ?? ""} ${r.addr ?? ""}: ${r.reason} ${r.detail ?? ""}`);
}
process.exit(tally.refused.length ? 1 : 0);
