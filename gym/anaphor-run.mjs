#!/usr/bin/env node
// gym/anaphor-run.mjs [--evidence binding,...] [--json]     DEF: commit or hold every pronoun spectrum in the log
//
// Penelope's loop over the log, by the same door as perspective-run (organs/weave-mark.mjs; env PHAROS, PHAROS_LOG, her pointer PENELOPE_PHAROS_JSON). She reads `text-referents`
// (the held spectra), `text-reading` (the dependency rows), `text-cuts` (cited) and the evidence kinds she is told about (--evidence, default `binding`) BY KIND, never by author; she
// never reads a text and never imports khora or janus. One pass, then exit; a rerun over an unchanged log adds nothing:
//   - for every pronoun in every live text-referents entry: one `anaphor-definition` at DEF·Figure, addr anaphor:<sha16 of the text>:<offset>, verdict committed | held | new
//     (a hole is an entry: no rows, or a pronoun with no row, is woven held with its gap named), `of` the text-referents entry, the text-reading entry, the cuts and the evidence read;
//   - an entry already live at the address with the same body is not woven again; with different evidence the new entry follows it and the later one wins (re-judging, not rewriting);
//   - a log with no spectrum is reported as the typed gap no_spectrum, never as silence.
import { openLoom, weaveMark, marks, loomStatus } from "../organs/weave-mark.mjs";
import { decide, bodyOf, KIND, CELL } from "../organs/anaphor-commit.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const asJson = process.argv.includes("--json");
const log = process.env.PHAROS_LOG, evKinds = (arg("--evidence") ?? "binding").split(",").filter(Boolean);
if (!log || !process.env.PHAROS) { console.error("usage: PHAROS=<log dir> PHAROS_LOG=<name> node gym/anaphor-run.mjs [--evidence binding,...] [--json]"); process.exit(2); }
const st = await openLoom({});
if (!st.on) { console.error(`penelope's pharos door is off: ${st.why}`); process.exit(1); }

const WHY = "a pronoun is held as a spectrum and committed to one referent only when the evidence leaves exactly one; this is her assertion (DEF), khora and janus only leave evidence";
const tally = { log, texts: 0, pronouns: 0, woven: 0, alreadyDefined: 0, byVerdict: {}, gaps: [], refused: [] };
const live = (kind) => marks({ log, kind }) ?? [];
const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(",")}]` : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(",")}}` : JSON.stringify(v));
const lastAt = (es) => { const m = new Map(); for (const e of es) m.set(e.addr, e); return m; };    // the later entry at an address wins (fold order)

const refEs = [...lastAt(live("text-referents")).values()], readings = lastAt(live("text-reading")), cuts = lastAt(live("text-cuts"));
const evidence = evKinds.flatMap((k) => live(k));
const already = lastAt(live(KIND));
if (!refEs.length) tally.gaps.push({ why: "no_spectrum", note: "no text-referents entry in this log" });
for (const re of refEs) {
  const sha = String(re.addr).startsWith("referents:") ? String(re.addr).slice("referents:".length) : null;
  if (!sha) { tally.gaps.push({ addr: re.addr, why: "bad_address" }); continue; }
  tally.texts += 1;
  const rd = readings.get(`reading:${sha}`) ?? null, ct = cuts.get(`cuts:${sha}`) ?? null;
  const mine = evidence.filter((e) => e.body?.doc === `text:${sha}` || (e.of ?? []).includes(rd?.id));
  const d = decide({ held: re.body?.held, referents: re.body?.referents, faces: re.body?.faces, rows: rd?.body?.rows ?? null, evidence: mine });
  for (const g of d.gaps) tally.gaps.push({ text: sha, ...g });
  const readIds = [re.id, rd?.id, ct?.id, ...d.evidenceRead.map((x) => x.id)].filter(Boolean);
  for (const p of d.pronouns) {
    tally.pronouns += 1;
    const body = bodyOf(p, { referents: re.id, reading: rd?.id ?? null, cuts: ct?.id ?? null, evidence: d.evidenceRead });
    const addr = `anaphor:${sha}:${p.at?.[0]}`, have = already.get(addr);
    if (have && canon(have.body) === canon(body)) { tally.alreadyDefined += 1; continue; }
    const r = weaveMark({ by: "penelope.anaphor", log, kind: KIND, cell: CELL, addr, body, of: readIds,
      witness: { how: "decided from the text-referents entry (the held spectrum), the text-reading rows and the evidence entries named in `of`, read from the log by kind; the sentence index of the rows is khora's nomination from the cuts entry; no text read, no model called, activation never decides", read: body.read },
      declare: { why: WHY } });
    if (!r.ok) { tally.refused.push({ addr, reason: r.reason, detail: r.detail }); continue; }
    tally.woven += 1; tally.byVerdict[p.verdict] = (tally.byVerdict[p.verdict] ?? 0) + 1;
  }
}
const out = { ...tally, door: loomStatus().why };
if (asJson) console.log(JSON.stringify(out, null, 2));
else {
  console.log(`anaphors over pharos log "${log}": ${tally.texts} text(s), ${tally.pronouns} pronoun(s), ${tally.woven} woven, ${tally.alreadyDefined} already defined`);
  for (const [k, n] of Object.entries(tally.byVerdict).sort()) console.log(`  ${k}: ${n}`);
  for (const g of tally.gaps.slice(0, 6)) console.log(`  gap ${g.why}: ${g.note ?? ""}`);
  for (const r of tally.refused.slice(0, 5)) console.log(`  refused ${r.addr}: ${r.reason} ${r.detail ?? ""}`);
}
process.exit(tally.refused.length ? 1 : 0);
