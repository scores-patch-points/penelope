#!/usr/bin/env node
// gym/text-verdicts-run.mjs [--json]     judge every khora nomination of quotations and reported speech in the log
//
// Penelope's part of "the reading is stored in the pharos" (organs/text-verdicts.mjs holds the rules QR1 and FR1). The log is named by env PHAROS_LOG and lives in env PHAROS; she opens it only by
// her pointer (env PENELOPE_PHAROS_JSON, else <checkout>/pharos.json) through organs/weave-mark.mjs, the one door. No pointer: the door is off, nothing is read or written, exit 1.
//
// One pass, then exit; a rerun over an unchanged log adds nothing. For each text-quotes / text-frames entry (the latest at each address; read by KIND, never by author):
//   - a verdict the rule gives, with no live verdict of the same body `of` this nomination at its address -> weaved (a NEWER entry at an address that already has one is a revision, REC, and says what it revises);
//   - a live verdict of hers at an address of this text the rule no longer gives -> retracted (unweave), never erased;
//   - a nomination the rule cannot judge gets nothing; the reason (the EVALUATION, e.g. codec_disagrees, detectors_disagree) is reported in the tally and not woven: no kind is declared for it.
// She never reads a text, never calls khora or janus.
import { openLoom, weaveMark, unweave, marks, loomStatus, WEAVER } from "../organs/weave-mark.mjs";
import { KINDS, READS, QUOTE_VERDICT, FRAME_VERDICT, shaOf, verdictAddr, judgeQuotes, judgeFrames, quoteBody, frameBody, sameBody, marksFor } from "../organs/text-verdicts.mjs";

const asJson = process.argv.includes("--json");
const log = process.env.PHAROS_LOG;
if (!log || !process.env.PHAROS) { console.error("usage: PHAROS=<log dir> PHAROS_LOG=<name> node gym/text-verdicts-run.mjs [--json]"); process.exit(2); }
const st = await openLoom({});
if (!st.on) { console.error(`penelope's pharos door is off: ${st.why}`); process.exit(1); }

const tally = { log, woven: 0, revised: 0, retracted: 0, unchanged: 0, abstained: [], evaluations: [], refused: [], door: loomStatus().why };
const live = (kind) => marks({ log, kind }) ?? [];
const latestByAddr = (es) => { const m = new Map(); for (const e of es) m.set(e.addr, e); return m; };   // log order: the later wins

const codecs = latestByAddr(live(READS.codec));
const lanes = [
  { read: READS.quotes, prefix: "quotes", kind: QUOTE_VERDICT, body: quoteBody, judge: (nom, sha) => judgeQuotes({ quotes: nom.body, codec: codecs.get(`codec:${sha}`)?.body ?? null }) },
  { read: READS.frames, prefix: "frames", kind: FRAME_VERDICT, body: frameBody, judge: (nom) => judgeFrames({ frames: nom.body }) },
];

for (const lane of lanes) {
  const mine = live(lane.kind).filter((e) => e.by === WEAVER);
  for (const [addr, nom] of latestByAddr(live(lane.read))) {
    const sha = shaOf(addr, lane.prefix);
    if (!sha) { tally.refused.push({ kind: lane.read, addr, reason: "bad_address" }); continue; }
    const j = lane.judge(nom, sha);
    if (j.evaluation) tally.evaluations.push({ kind: lane.read, addr, rule: j.rule, ...j.evaluation });
    if (j.abstained) tally.abstained.push({ kind: lane.read, addr, rule: j.rule, gap: j.evaluation?.gap ?? null });
    const here = mine.filter((e) => e.addr.startsWith(`${lane.prefix}:${sha}#`));
    const want = new Map(j.verdicts.map((v) => [verdictAddr(lane.prefix, sha, v.index), v]));
    // retract what she said and the rule no longer says (every live entry at the address: an earlier one would otherwise come back as the latest)
    const byAddr = new Map(); for (const e of here) byAddr.set(e.addr, [...(byAddr.get(e.addr) ?? []), e]);
    for (const [a, es] of byAddr) {
      if (want.has(a)) continue;
      const r = unweave({ by: "penelope.text", log, ids: es.map((e) => e.id), why: `rule ${j.rule} no longer gives a verdict for ${a}: ${j.evaluation?.gap ?? "the nomination changed"}` });
      if (r.ok) tally.retracted += es.length; else tally.refused.push({ kind: lane.kind, addr: a, reason: r.reason, detail: r.detail });
    }
    const todo = [], revises = new Map();
    for (const v of j.verdicts) {
      const a = verdictAddr(lane.prefix, sha, v.index), latest = latestByAddr(here.filter((e) => e.addr === a)).get(a) ?? null;
      if (latest && (latest.of ?? []).includes(nom.id) && sameBody(latest.body, lane.body(v, j.rule))) { tally.unchanged += 1; continue; }
      if (latest) revises.set(v.index, latest.id);
      todo.push(v);
    }
    for (const m of marksFor({ kind: lane.kind, sha, nominationId: nom.id, verdicts: todo, log, revises })) {
      const r = weaveMark(m);
      if (!r.ok) { tally.refused.push({ kind: m.kind, addr: m.addr, reason: r.reason, detail: r.detail }); continue; }
      if (m.basis.revises) tally.revised += 1; else tally.woven += 1;
    }
  }
}

if (asJson) console.log(JSON.stringify(tally, null, 2));
else {
  console.log(`text verdicts over pharos log "${log}": ${tally.woven} woven, ${tally.revised} revised, ${tally.retracted} retracted, ${tally.unchanged} unchanged, ${tally.abstained.length} nomination(s) not judged`);
  for (const e of tally.evaluations) console.log(`  evaluation ${e.kind} ${e.addr}: ${e.gap} (${e.rule}) ${e.why}`);
  for (const r of tally.refused.slice(0, 5)) console.log(`  refused ${r.kind} ${r.addr ?? ""}: ${r.reason} ${r.detail ?? ""}`);
}
process.exit(tally.refused.length ? 1 : 0);
