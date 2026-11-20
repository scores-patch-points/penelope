#!/usr/bin/env node
// gym/identity-run.mjs --declare-prior <prior.json>        DEF at Pattern: weave a standing identity prior (once) through her door
// gym/identity-run.mjs --declare-identity <pair.json>      DEF at Figure: weave one per-pair declaration, citing the live prior and the evidence about that pair read BY KIND from the log (janus's merged-world, difference, agreement, hole, change, binding)
// Stigmergy: nothing here talks to another session. She reads the evidence the others left in the log and leaves her declaration in the log, citing it; they read it there. Same door as perspective-run (env PHAROS, PHAROS_LOG, PENELOPE_PHAROS_JSON).
// She declares only what a named person or standard declares (the file's `by` and `giver`); a prior with no giver is a CANDIDATE; a model never writes the DEF. A rerun over an unchanged log adds nothing.
import fs from "node:fs";
import { openLoom, weaveMark, marks, WEAVER } from "../organs/weave-mark.mjs";
import { declarePrior, declareIdentity, marksFor } from "../organs/identity-def.mjs";
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const asJson = process.argv.includes("--json"), log = process.env.PHAROS_LOG, priorFile = arg("--declare-prior"), pairFile = arg("--declare-identity");
if (!log || !process.env.PHAROS || (!priorFile && !pairFile)) { console.error("usage: PHAROS=<log dir> PHAROS_LOG=<name> node gym/identity-run.mjs (--declare-prior <prior.json> | --declare-identity <pair.json>) [--json]"); process.exit(2); }
const st = await openLoom({}); if (!st.on) { console.error(`penelope's pharos door is off: ${st.why}`); process.exit(1); }
const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(",")}]` : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(",")}}` : JSON.stringify(v));
const live = (kind) => marks({ log, kind }) ?? [];
const say = (o) => { if (asJson) console.log(JSON.stringify(o, null, 2)); };
const send = (m) => { const r = weaveMark(m); if (!r.ok) { console.error(`not woven: ${r.reason} ${r.detail ?? ""}`); process.exit(1); } return r.id; };
const spec = JSON.parse(fs.readFileSync(priorFile ?? pairFile, "utf8"));
if (priorFile) {
  const p = declarePrior(spec); if (!p.ok) { console.error(`prior refused: ${p.reason} ${p.detail ?? ""}`); process.exit(1); }
  const same = live("identity-prior").find((e) => e.addr === p.addr && e.by === WEAVER && canon(e.body) === canon(p.body));
  if (!same && live("identity-prior").some((e) => e.addr === p.addr)) { console.error(`a different prior is live at ${p.addr}; revise it (retract and redeclare), do not overwrite it`); process.exit(1); }
  const id = same ? same.id : send(marksFor({ prior: p, log, by: spec.by })[0]); say({ log, declared: p.addr, id, standing: p.body.standing, unchanged: !!same });
  if (!asJson) console.log(`${p.addr} is live in "${log}" as a ${p.body.standing} prior (${id})`); process.exit(0);
}
const prior = live("identity-prior").find((e) => e.addr === `identity-prior:${spec.asker}` || e.id === spec.prior);
if (!prior) { console.error(`no live identity-prior for ${spec.asker ?? spec.prior}: declare it first (--declare-prior)`); process.exit(1); }
const d = declareIdentity({ prior, a: spec.a, b: spec.b, entries: live(undefined), by: spec.by }); if (!d.ok) { console.error(`declaration refused: ${d.reason} ${d.detail ?? ""}`); process.exit(1); }
const same = live("identity-declaration").find((e) => e.addr === d.addr && e.by === WEAVER && canon(e.body) === canon(d.body));
const id = same ? same.id : send(marksFor({ declaration: d, log, by: spec.by })[0]);
say({ log, declared: d.addr, id, standing: d.body.standing, evidence: d.body.evidence, unchanged: !!same }); if (!asJson) console.log(`${d.addr} declared under ${prior.addr} (${d.body.standing}) citing ${d.body.evidence.length} evidence entr${d.body.evidence.length === 1 ? "y" : "ies"} (${id})`);
