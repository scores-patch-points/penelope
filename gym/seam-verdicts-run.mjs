#!/usr/bin/env node
// gym/seam-verdicts-run.mjs --log <name> --bounds <file.json> [--json]
// Penelope reads the evidence other writers left in the shared log (by kind, never by author), judges it under
// DECLARED bounds, and weaves her verdicts back through her own mark door. No bounds file, no run: this script
// carries no default bound. A verdict whose body is unchanged is not woven again; one that changed is woven
// with a re-judgement `of` the earlier one.
import fs from "node:fs";
import { openLoom, weaveMark, marks, loomStatus } from "../organs/weave-mark.mjs";
import { declareWordBound, declareRunBound, declareStandingLadder, judgeWordFold, judgeRun, judgeStanding, rejudge, marksFor } from "../organs/seam-verdicts.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const log = arg("--log"), boundsFile = arg("--bounds");
if (!log || !boundsFile) { console.error("usage: node gym/seam-verdicts-run.mjs --log <name> --bounds <file.json> [--json]"); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(boundsFile, "utf8"));
const st = await openLoom({});
if (!st.on) { console.error(`the loom is off: ${st.why}`); process.exit(1); }

const tally = { bounds: 0, verdicts: 0, unchanged: 0, rejudged: 0, refused: [], byVerdict: {} };
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((y) => [y, x[y]])) : x));
const send = (m) => { const r = weaveMark(m); if (!r.ok) tally.refused.push({ kind: m.kind, addr: m.addr, reason: r.reason, detail: r.detail }); return r.ok ? r.id : null; };
const count = (k) => { tally.byVerdict[k] = (tally.byVerdict[k] ?? 0) + 1; };

function judgeAll(bound, evidence, judge, verdictKind, labelOf) {
  if (!bound.ok) { tally.refused.push({ kind: "seam-bound", reason: bound.reason, detail: bound.detail }); return; }
  const [bm] = marksFor({ bound, log });
  const boundId = send(bm); if (!boundId) return; tally.bounds += 1;
  const prior = new Map((marks({ log, kind: verdictKind }) ?? []).map((e) => [e.addr, e]));   // the latest live verdict per address
  for (const ev of evidence) {
    const j = judge(ev, bound);
    if (!j.ok) { tally.refused.push({ kind: verdictKind, reason: j.reason, detail: j.detail }); continue; }
    count(`${verdictKind}: ${labelOf(j)}`);
    const [vm] = marksFor({ judgement: j, log, ofBound: [boundId] });
    const was = prior.get(vm.addr);
    if (was && canon(was.body) === canon(vm.body)) { tally.unchanged += 1; continue; }
    const id = send(vm); if (!id) continue; tally.verdicts += 1;
    if (was) {
      const rec = rejudge({ ok: true, ...was.body }, j);
      if (rec.ok) { const [rm] = marksFor({ rec, log, ofPrev: [was.id, id] }); if (send(rm)) tally.rejudged += 1; }
    }
  }
}

judgeAll(declareWordBound(spec.word), marks({ log, kind: "word-fold" }) ?? [], judgeWordFold, "word-fold-verdict", (j) => j.limit.verdict);
judgeAll(declareRunBound(spec.run), marks({ log, kind: "reasoning-run" }) ?? [], judgeRun, "run-verdict", (j) => j.verdict);
// standing is of a unit: every statement at one address, judged together
const byUnit = new Map();
for (const e of marks({ log, kind: "reasoning-claim" }) ?? []) { if (!byUnit.has(e.addr)) byUnit.set(e.addr, []); byUnit.get(e.addr).push(e); }
judgeAll(declareStandingLadder(spec.standing), [...byUnit.values()], judgeStanding, "claim-standing", (j) => `holds up to ${j.holdsUpTo ?? "nothing"}`);

const out = { log, loom: loomStatus().why, ...tally };
if (process.argv.includes("--json")) console.log(JSON.stringify(out, null, 2));
else {
  console.log(`seam verdicts over pharos log "${log}": ${tally.bounds} bound(s), ${tally.verdicts} verdict(s) woven, ${tally.unchanged} unchanged, ${tally.rejudged} re-judged, ${tally.refused.length} refused`);
  for (const [k, n] of Object.entries(tally.byVerdict).sort()) console.log(`  ${k}: ${n}`);
  for (const r of tally.refused.slice(0, 5)) console.log(`  refused ${r.kind} ${r.addr ?? ""}: ${r.reason} ${r.detail ?? ""}`);
}
process.exit(tally.refused.length ? 1 : 0);
