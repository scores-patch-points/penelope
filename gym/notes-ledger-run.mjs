#!/usr/bin/env node
// gym/notes-ledger-run.mjs — GL-EN-31's run: the full DEF → EVA → REC loop on the keeper's notes ledger, over a directory of the caller's own text,
// with the person at the door as a channel in the same log, and the record filed per terrain (candidate only). No model.
//
//   node gym/notes-ledger-run.mjs --essays <dir of .md files> [--only a.md,b.md] [--author "Name"] --khora <a khora checkout with the reader organs> --out <results.json>
//
// The reader organs (callimachus, grain's spansFromRecord, the ladder, the claim lint) live on khora's callimachus/whom-standings
// branch; this script imports them from --khora and the ledger from ../organs. Committed BEFORE it is run.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { openLedger, landTurns, runLoop, terrainsOf, recordTerrains, TERRAINS, GIVER } from "../organs/notes-ledger.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ESSAYS = resolve(opt("--essays") ?? "");
const KHORA = resolve(opt("--khora") ?? "");
const OUT = resolve(opt("--out") ?? "");
if (!opt("--essays") || !opt("--khora") || !opt("--out")) { console.error("usage: notes-ledger-run.mjs --essays <dir> --khora <dir> --out <results.json>"); process.exit(2); }
const imp = (p) => import(pathToFileURL(join(KHORA, "native", p)).href);
const { makePinax, makeSpan, quoteOf, parseAddress } = await imp("organs/pinax.js");
const { readCorpus } = await imp("organs/callimachus.js");
const { candidatesOf, witnesses, scoreWith } = await imp("organs/answer-ladder.js");
const { questionVoid } = await imp("organs/question-void.js");
const { spansFromRecord } = await imp("organs/grain.js");
const { lintClaims } = await imp("organs/claim-lint.js");
const { loadModel } = await imp("adapters/text/english-parser.js");
const qg = (await imp("adapters/text/question-grammar.en.js")).default;
const posPrior = JSON.parse(readFileSync(join(KHORA, "native/priors/pos-en.json"), "utf8"));
const sha = (b) => createHash("sha256").update(b).digest("hex");

const ONLY = opt("--only") ? opt("--only").split(",").map((x) => x.trim()).filter(Boolean) : null;
const AUTHOR = opt("--author") ?? "Local Author"; // the byline the ladder needs to cite a claim; a neutral default, never a real name
const FILES = readdirSync(ESSAYS).filter((f) => f.endsWith(".md")).filter((f) => !ONLY || ONLY.includes(f)).sort();
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const store = {}, recs = [];
for (const f of FILES) {
  const text = readFileSync(join(ESSAYS, f), "utf8");
  const raw = `<html><head><title>${f}</title><meta name="author" content="${AUTHOR}"></head><body><pre>${esc(text)}</pre></body></html>`;
  const rec = await makePinax({ url: `https://corpus.local/${f}`, raw: new Uint8Array(Buffer.from(raw)), text, extractor: { name: "local text: the text layer is the file" } });
  rec.declared = { role: "source" };
  store[rec.entry.id] = rec; recs.push(rec);
}
const slice = async (a) => { const p = parseAddress(a); const r = store[p.pinax]; if (!r) return null; const sp = await makeSpan(r, p.layer, p.start, p.end); if (sp.ok === false) return null; const q = await quoteOf(sp, r); return q.ok ? q.text : null; };
const model = loadModel(JSON.parse(readFileSync(join(KHORA, "native/priors/parser-eng-ewt.json"), "utf8")));
const QUESTION = "What does the fold do with a reader?";

const record = readCorpus(recs, { question: QUESTION, absences: [] });
const qv = questionVoid(qg.readQuestion(QUESTION, { model }), record);
const cands = candidatesOf(record, {});
const p1 = scoreWith(witnesses(cands, { question: qv, record }), ["perception"], cands.length);
const activation = new Map(cands.map((a, i) => [a.id, p1.s[i]]));
const all = (await spansFromRecord(record, { slice, activation })).filter((s) => s.activation > 0);
const region = lintClaims(all, { posPrior }).sound.sort((a, b) => b.activation - a.activation);
const terms = [...new Set(QUESTION.toLowerCase().match(/[\p{L}]{4,}/gu) ?? [])].filter((w) => !["what", "with", "does"].includes(w) || true);

// a declarable slot derived mechanically: the most active span's subject and predicate, with its object left open
const top = region[0];
const slot = { end1: top.claim.subj, label: top.claim.pred, end2: null };
// a real conversation's order: the person asks; the system reads (the loop); the person then corrects and asserts
const before = [QUESTION];
const after = [`Not so, that's wrong: ${region[1].text}`, "Not so, that's wrong.", region[2].text];

const run = (withTurns, slotIn) => {
  let log = openLedger({ question: QUESTION });
  let first = null;
  if (withTurns) { first = landTurns(log, before, { region }); log = first.log; }
  const out = runLoop({ log, slot: slotIn, region, question: QUESTION, askTerms: withTurns ? terms : null });
  let landed = first;
  if (withTurns) {
    const later = landTurns(out.log, after, { region });
    out.log = later.log;
    landed = { log: later.log, landed: [...first.landed, ...later.landed], conceded: later.conceded, unanchored: later.unanchored, gaps: [...first.gaps, ...later.gaps], asks: first.asks };
  }
  return { out, landed };
};
const A = run(true, slot);
const B = run(false, slot);
const C = run(true, { end1: "?", label: "do" });
const ops = (log) => [...new Set(log.entries.map((e) => e.operator))].sort();
const regionAddrs = new Set(region.map((s) => s.address));
const spanAts = A.out.log.entries.flatMap((e) => (e.spans ?? []).filter((s) => !String(s.at).startsWith("turn:")).map((s) => s.at));
const terrains = terrainsOf(A.out.log);
const terrainsNo = terrainsOf(B.out.log);
const rec1 = recordTerrains([], terrains, { id: "nl:run:with-turns", at: new Date(0).toISOString(), evidence: { question: QUESTION, sources: A.out.sources, region: region.length } });
const out = {
  ladder: { region: region.length, sourcesPinned: recs.length, slot, termsOfAsk: terms },
  loop: { rounds: A.out.rounds, stop: A.out.stop, sources: A.out.sources, voidId: A.out.voidId, gaps: A.out.gaps, evaluation: A.out.evaluation ? { verdict: A.out.evaluation.verdict, evidence: A.out.evaluation.evidence } : null },
  closure: { operators: ops(A.out.log), hasDEF: ops(A.out.log).includes("DEF"), hasEVA: ops(A.out.log).includes("EVA"), hasREC: ops(A.out.log).includes("REC") },
  grounded: { spans: spanAts.length, allInRegion: spanAts.every((a) => regionAddrs.has(a)) },
  channel: { landed: A.landed.landed.map((l) => l.kind), conceded: A.landed.conceded.length, unanchored: A.landed.unanchored.length, gaps: A.landed.gaps, entriesWith: A.out.log.entries.length, entriesWithout: B.out.log.entries.length, evaluationWith: !!A.out.evaluation, evaluationWithout: !!B.out.evaluation, lensWith: terrains.registers.Lens.count, lensWithout: terrainsNo.registers.Lens.count },
  wall: { contentEntriesWithChatWitness: A.out.log.entries.filter((e) => e.end1 && e.end1 !== GIVER && (e.witnesses ?? []).some((w) => String(w).startsWith("chat:"))).length },
  trail: { concededNoteStillOnLog: A.landed.conceded.every((c) => A.out.log.entries.some((e) => e.task_id === c.note)), concessions: A.out.log.entries.filter((e) => e.concedes).length },
  unaskable: { gaps: C.out.gaps.map((g) => g.type), voidId: C.out.voidId, rounds: C.out.rounds.length },
  registers: Object.fromEntries(TERRAINS.map((t) => [t, { count: terrains.registers[t].count, concepts: terrains.registers[t].concepts.length, operators: terrains.registers[t].operators }])),
  unstamped: terrains.unstamped.length, unknownTerrain: terrains.unknownTerrain.length, entries: terrains.entries,
  record: { status: rec1.entry.status, id: rec1.entry.id, refile: recordTerrains(rec1.history, terrains, { id: "nl:run:with-turns" }).refused?.type ?? null },
};
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
