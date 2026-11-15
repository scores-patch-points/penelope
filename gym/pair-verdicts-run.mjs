#!/usr/bin/env node
// gym/pair-verdicts-run.mjs [--json]                    judge every pair-diff in the log
// gym/pair-verdicts-run.mjs --declare <bound.json>      weave the pair-bound (once) through her door
//
// The paraphrase seam, Penelope's part (organs/pair-verdicts.mjs). The log is named by env PHAROS_LOG and lives
// in env PHAROS (pharos reads that variable itself); she opens it only by her pointer (env PENELOPE_PHAROS_JSON,
// else <checkout>/pharos.json). No pointer: the door is off, nothing is read or written, exit 1.
//
// One pass, then exit; a rerun over an unchanged log adds nothing:
//   - the bound is read by kind pair-bound: exactly one live entry, woven by her; anything else is refused;
//   - for every pair-diff (the latest at each address) with no pair-verdict under this bound:
//       the diff settles it            -> a pair-verdict of [diff, bound]
//       it does not, a witness exists  -> a pair-verdict of [diff, bound, witness]
//       it does not, no witness yet    -> a witness-request of [diff, bound], once per pair
//   - a pair-witness with no pair-diff at its pair is reported, never judged.
// She reads pair-diff and pair-witness entries by kind, never by author; she never reads a text and never
// calls Khora or Janus.
import fs from "node:fs";
import { openLoom, weaveMark, marks, loomStatus, WEAVER } from "../organs/weave-mark.mjs";
import { declarePairBound, boundFromEntry, boundBody, judge, marksFor } from "../organs/pair-verdicts.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const asJson = process.argv.includes("--json");
const log = process.env.PHAROS_LOG, declareFile = arg("--declare");
if (!log || !process.env.PHAROS) { console.error("usage: PHAROS=<log dir> PHAROS_LOG=<name> node gym/pair-verdicts-run.mjs [--declare <bound.json>] [--json]"); process.exit(2); }
const st = await openLoom({});
if (!st.on) { console.error(`penelope's pharos door is off: ${st.why}`); process.exit(1); }

const tally = { log, bound: null, verdicts: 0, requests: 0, alreadyJudged: 0, alreadyAsked: 0, byVerdict: {}, refused: [] };
const say = (o) => { if (asJson) console.log(JSON.stringify(o, null, 2)); };
const send = (m) => { const r = weaveMark(m); if (!r.ok) tally.refused.push({ kind: m.kind, addr: m.addr, reason: r.reason, detail: r.detail }); return r.ok ? r.id : null; };
const live = (kind) => marks({ log, kind }) ?? [];
const latestByAddr = (es) => { const m = new Map(); for (const e of es) m.set(e.addr, e); return m; };   // fold order: the later wins

// ---- declare ---------------------------------------------------------------------------------------------
if (declareFile) {
  const b = declarePairBound(JSON.parse(fs.readFileSync(declareFile, "utf8")));
  if (!b.ok) { console.error(`bound refused: ${b.reason} ${b.detail ?? ""}`); process.exit(1); }
  const { addr, body } = boundBody(b), canon = JSON.stringify;
  const same = (e) => { const x = boundFromEntry(e); return e.by === WEAVER && e.addr === addr && x.ok && canon(boundBody(x).body) === canon(body); };
  const lives = live("pair-bound"), others = lives.filter((e) => !same(e));
  if (others.length) { console.error(`a different pair-bound is live (${others.map((e) => e.addr).join(", ")}); retract it before declaring another`); process.exit(1); }
  const [m] = marksFor({ bound: b, log });
  const id = lives.length ? lives[0].id : send(m);   // the same bound already live: nothing is woven again
  if (!id) { console.error(`not woven: ${JSON.stringify(tally.refused[0])}`); process.exit(1); }
  say({ log, declared: addr, id }); if (!asJson) console.log(`pair-bound ${addr} is live in "${log}" (${id})`);
  process.exit(0);
}

// ---- judge -----------------------------------------------------------------------------------------------
const bounds = live("pair-bound");
if (bounds.length !== 1) { console.error(`refused: ${bounds.length} live pair-bound entries in "${log}"; exactly one is judged under`); process.exit(1); }
const bEntry = bounds[0];
if (bEntry.by !== WEAVER) { console.error(`refused: the live pair-bound ${bEntry.addr} was woven by "${bEntry.by}", not by ${WEAVER}; a bound others stand on is hers`); process.exit(1); }
const bound = boundFromEntry(bEntry);
if (!bound.ok) { console.error(`refused: the live pair-bound ${bEntry.addr} does not declare a bound: ${bound.reason} ${bound.detail ?? ""}`); process.exit(1); }
tally.bound = { addr: bEntry.addr, id: bEntry.id, by: bound.by, ratified: bound.ratified };

const diffs = latestByAddr(live("pair-diff")), witnesses = latestByAddr(live("pair-witness"));
const verdicts = live("pair-verdict"), requests = new Set(live("witness-request").map((e) => e.addr));
const judged = new Set(verdicts.filter((e) => (e.of ?? []).includes(bEntry.id)).map((e) => e.addr));
const shaOf = (addr, prefix) => (addr.startsWith(prefix) ? addr.slice(prefix.length) : null);

for (const [addr, d] of diffs) {
  const sha = shaOf(addr, "diff:");
  if (!sha) { tally.refused.push({ kind: "pair-diff", addr, reason: "bad_address" }); continue; }
  if (judged.has(`verdict:${sha}`)) { tally.alreadyJudged += 1; continue; }
  const w = witnesses.get(`witness:${sha}`) ?? null;
  const j = judge(d.body, w ? w.body : null, bound);
  if (!j.ok) { tally.refused.push({ kind: "pair-verdict", addr: `verdict:${sha}`, reason: j.reason, detail: j.detail }); continue; }
  if (j.verdict === "need-witness" && requests.has(`witness-request:${sha}`)) { tally.alreadyAsked += 1; continue; }
  const [m] = marksFor({ judgement: j, diff: d, boundId: bEntry.id, witnessId: w?.id ?? null, log });
  if (!send(m)) continue;
  if (j.verdict === "need-witness") tally.requests += 1;
  else { tally.verdicts += 1; const k = `${j.verdict} by ${j.by}`; tally.byVerdict[k] = (tally.byVerdict[k] ?? 0) + 1; }
}
for (const addr of witnesses.keys()) {
  const sha = shaOf(addr, "witness:");
  if (!sha || !diffs.has(`diff:${sha}`)) tally.refused.push({ kind: "pair-witness", addr, reason: "no_diff", detail: "a witness with no pair-diff at its pair is not judged" });
}

const out = { ...tally, door: loomStatus().why };
if (asJson) say(out);
else {
  console.log(`pair verdicts over pharos log "${log}" under ${tally.bound.addr} (by ${tally.bound.by}${tally.bound.ratified ? ", ratified" : ", unratified"}): ${tally.verdicts} verdict(s) and ${tally.requests} witness-request(s) woven; ${tally.alreadyJudged} already judged, ${tally.alreadyAsked} waiting on a witness; ${tally.refused.length} refused`);
  for (const [k, n] of Object.entries(tally.byVerdict).sort()) console.log(`  ${k}: ${n}`);
  for (const r of tally.refused.slice(0, 5)) console.log(`  refused ${r.kind} ${r.addr ?? ""}: ${r.reason} ${r.detail ?? ""}`);
}
process.exit(tally.refused.length ? 1 : 0);
