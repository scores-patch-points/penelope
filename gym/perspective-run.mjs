#!/usr/bin/env node
// gym/perspective-run.mjs [--json]                      judge every pair that has probe-answers, under every live perspective of hers
// gym/perspective-run.mjs --declare <perspective.json>  DEF: weave a perspective (once) through her door
// gym/perspective-run.mjs --revise <revision.json>      REC: replace a live perspective, only if the revision is ADMITTED
//
// EVA, said once (organs/perspective-eva.mjs): two things are equivalent, for this perspective, when there is no difference that makes a difference.
// Penelope's loop over the log, by the same door as pair-verdicts-run (env PHAROS, PHAROS_LOG, her pointer PENELOPE_PHAROS_JSON): she reads `perspective`
// and `probe-answer` entries by KIND, never by author; she never reads a text and never calls Khora or Janus. One pass, then exit; a rerun over an unchanged
// log adds nothing:
//   - for every live perspective she wove, and every pair that has probe-answers, with no equivalence-verdict under this perspective: one verdict is woven
//     (equivalent, different or gap: a hole is an entry), of [perspective, the answers it read];
//   - a perspective woven by someone else is reported, never judged under; two perspectives over one pair give two verdicts (the point of a perspective);
//   - --revise: { name, proposed: <perspective spec>, evidence: { before, after: { tp, fn, fa, tn }, kEffBefore, kEffAfter } }. The revision is admitted only if
//     balanced accuracy rises, false accepts do not and the effective number of independent probes rose and was MEASURED (frame-verdicts.admitWithIndependence);
//     then the old entry is retracted (nothing is erased) and the proposed one is woven of it. Refused: nothing changes.
import fs from "node:fs";
import { openLoom, weaveMark, unweave, marks, loomStatus, WEAVER } from "../organs/weave-mark.mjs";
import { declarePerspective, perspectiveFromEntry, perspectiveBody, answersOf, judgeFromAnswers, marksFor } from "../organs/perspective-eva.mjs";
import { admitWithIndependence } from "../organs/frame-verdicts.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const asJson = process.argv.includes("--json");
const log = process.env.PHAROS_LOG, declareFile = arg("--declare"), reviseFile = arg("--revise");
if (!log || !process.env.PHAROS) { console.error("usage: PHAROS=<log dir> PHAROS_LOG=<name> node gym/perspective-run.mjs [--declare <perspective.json> | --revise <revision.json>] [--json]"); process.exit(2); }
const st = await openLoom({});
if (!st.on) { console.error(`penelope's pharos door is off: ${st.why}`); process.exit(1); }

const tally = { log, perspectives: [], verdicts: 0, alreadyJudged: 0, byVerdict: {}, refused: [] };
const say = (o) => { if (asJson) console.log(JSON.stringify(o, null, 2)); };
const send = (m) => { const r = weaveMark(m); if (!r.ok) tally.refused.push({ kind: m.kind, addr: m.addr, reason: r.reason, detail: r.detail }); return r.ok ? r.id : null; };
const live = (kind) => marks({ log, kind }) ?? [];
const canon = JSON.stringify;
const mine = () => live("perspective").filter((e) => e.by === WEAVER);

// ---- DEF ---------------------------------------------------------------------------------------------------
if (declareFile) {
  const p = declarePerspective(JSON.parse(fs.readFileSync(declareFile, "utf8")));
  if (!p.ok) { console.error(`perspective refused: ${p.reason} ${p.detail ?? ""}`); process.exit(1); }
  const { addr, body } = perspectiveBody(p), here = live("perspective").filter((e) => e.addr === addr);
  const same = here.find((e) => e.by === WEAVER && canon(perspectiveBody(perspectiveFromEntry(e)).body) === canon(body));
  if (here.length && !same) { console.error(`a different perspective is live at ${addr}; revise it (--revise), do not redeclare it`); process.exit(1); }
  const id = same ? same.id : send(marksFor({ perspective: p, log })[0]);
  if (!id) { console.error(`not woven: ${canon(tally.refused[0])}`); process.exit(1); }
  say({ log, declared: addr, id }); if (!asJson) console.log(`perspective ${addr} is live in "${log}" (${id})`);
  process.exit(0);
}

// ---- REC ---------------------------------------------------------------------------------------------------
if (reviseFile) {
  const r = JSON.parse(fs.readFileSync(reviseFile, "utf8"));
  const cur = mine().find((e) => e.addr === `perspective:${r.name}`);
  if (!cur) { console.error(`no live perspective of hers named ${r.name}`); process.exit(1); }
  const p = declarePerspective({ ...r.proposed, name: r.name });
  if (!p.ok) { console.error(`revision refused: ${p.reason} ${p.detail ?? ""}`); process.exit(1); }
  const a = admitWithIndependence({ before: r.evidence?.before, after: r.evidence?.after, kEffBefore: r.evidence?.kEffBefore, kEffAfter: r.evidence?.kEffAfter });
  if (!a.accept) { say({ log, admitted: false, why: a.why }); console.error(`revision NOT admitted: ${a.why}`); process.exit(1); }
  const un = unweave({ by: WEAVER, log, ids: [cur.id], why: `revised by ${p.by}: ${a.why}` });
  if (!un.ok) { console.error(`could not retract the old perspective: ${un.reason} ${un.detail ?? ""}`); process.exit(1); }
  const id = send(marksFor({ perspective: p, supersedes: cur.id, log })[0]);
  if (!id) { console.error(`not woven: ${canon(tally.refused[0])}`); process.exit(1); }
  say({ log, admitted: true, why: a.why, old: cur.id, id }); if (!asJson) console.log(`perspective:${r.name} revised and admitted (${a.why}); the old entry ${cur.id} is retracted, the new one is ${id}`);
  process.exit(0);
}

// ---- EVA ---------------------------------------------------------------------------------------------------
const persp = [];
for (const e of live("perspective")) {
  if (e.by !== WEAVER) { tally.refused.push({ kind: "perspective", addr: e.addr, reason: "not_hers", detail: `woven by "${e.by}", not by ${WEAVER}: a perspective others stand on is hers to judge under` }); continue; }
  const p = perspectiveFromEntry(e);
  if (!p.ok) { tally.refused.push({ kind: "perspective", addr: e.addr, reason: p.reason, detail: p.detail }); continue; }
  persp.push({ p, id: e.id }); tally.perspectives.push(e.addr);
}
const groups = answersOf(live("probe-answer"));
const judged = new Set(live("equivalence-verdict").flatMap((e) => (e.of ?? []).map((id) => `${id}|${e.addr}`)));
for (const { p, id } of persp) {
  for (const [pair, g] of Object.entries(groups).sort(([x], [y]) => (x < y ? -1 : 1))) {
    const j = judgeFromAnswers(p, g), m = marksFor({ perspective: p, pair, judgement: j, perspectiveId: id, answerIds: g.ids, log })[0];
    if (!m) { tally.refused.push({ kind: "equivalence-verdict", addr: pair, reason: "bad_pair", detail: "a pair is addressed pair:<sha>" }); continue; }
    if (judged.has(`${id}|${m.addr}`)) { tally.alreadyJudged += 1; continue; }
    if (send(m)) { tally.verdicts += 1; const k = `${j.verdict} for ${p.name}`; tally.byVerdict[k] = (tally.byVerdict[k] ?? 0) + 1; }
  }
}
const out = { ...tally, door: loomStatus().why };
if (asJson) say(out);
else {
  console.log(`equivalence over pharos log "${log}" under ${tally.perspectives.length} perspective(s): ${tally.verdicts} verdict(s) woven, ${tally.alreadyJudged} already judged`);
  for (const [k, n] of Object.entries(tally.byVerdict).sort()) console.log(`  ${k}: ${n}`);
  for (const r of tally.refused.slice(0, 5)) console.log(`  refused ${r.kind} ${r.addr ?? ""}: ${r.reason} ${r.detail ?? ""}`);
}
process.exit(tally.refused.length ? 1 : 0);
