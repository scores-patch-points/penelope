#!/usr/bin/env node
// gym/kin-telling-run.mjs — the G1-3 runner: compose the English for a window's questions, judge it with the independent checker, run the arms and
// controls, evaluate the pre-registered bars (gym/kin-telling/PREREG-G1-3-COMPOSER.md) and print the composed English beside the plain baseline.
//
//   node gym/kin-telling-run.mjs --window dev|heldout --out <dir> [--janus <janus checkout>] [--root <workspace root>] [--frames-sha <hex>] [--no-weave]
//   node gym/kin-telling-run.mjs --window <name> --dir <folder with fold.json, questions.json> --plain <plain reply file> --out <dir> ...   (round 2: a fresh window)
//
// Zero model calls: a tripwire is armed over fetch, http/https, net and child_process for the whole run (and is shown firing once on a probe).
// Nothing here edits an existing file or changes a default; the composer, the checker and the adapter are new files.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import childProcess from "node:child_process";
import { createRequire } from "node:module";
import { syncBuiltinESMExports } from "node:module";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadWindow, windowPaths, plainLines, sha256, growthFixture } from "./kin-telling-lib.mjs";
import { makeKinContext, composeWindow, composeQuestion, render, renderTagged, norm } from "../organs/kin-telling.mjs";
import { makeChecker, typeProse } from "../organs/kin-telling-check.mjs";
import { makeMutator } from "./kin-telling-mutants.mjs";
import { installTripwire } from "./weave-nomodel.mjs";
import { kernelImport } from "../organs/kernel-reach.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FACT_KINDS = new Set(["REL", "REL-D", "SEX", "WIT"]);
const GAP_SENTENCE = new Set(["MISS", "NONE", "ABS", "MISS-SEX", "MISS-OPEN"]);
const STATING = new Set(["REL", "REL-D", "SEX"]);
const arg = (k, d = null) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(`--${k}`);
const share = (n, d) => (d ? n / d : null);
const hashOf = (x) => sha256(typeof x === "string" ? x : JSON.stringify(x));

// ── the tripwires (B0): the model doors and every route out of the process
export function armTripwires() {
  const fetchWire = installTripwire({});
  const fired = [];
  const originals = [];
  const wrap = (obj, name, label) => { const real = obj[name]; originals.push([obj, name, real]); obj[name] = function (...a) { fired.push(label); throw new Error(`NO-MODEL TRIPWIRE: ${label}`); }; };
  wrap(http, "request", "http.request"); wrap(http, "get", "http.get"); wrap(https, "request", "https.request"); wrap(https, "get", "https.get");
  wrap(net.Socket.prototype, "connect", "net.Socket.connect"); wrap(net, "connect", "net.connect"); wrap(net, "createConnection", "net.createConnection");
  for (const n of ["spawn", "exec", "execFile", "fork", "execSync", "spawnSync", "execFileSync"]) wrap(childProcess, n, `child_process.${n}`);
  syncBuiltinESMExports();
  return {
    // the wire is shown to fire once, so a zero count is not a comment
    probe() {
      const before = fired.length + fetchWire.log.length;
      let tripped = false;
      try { childProcess.spawn("true"); } catch { tripped = true; }
      return fetch("http://127.0.0.1:11434/api/generate").then(() => false, () => true).then((f) => ({ spawnTripped: tripped, fetchTripped: f, before }));
    },
    count: () => ({ fired: fired.length, fetchModelDoor: fetchWire.modelDoorCalls().length, fetchCalls: fetchWire.log.length }),
    restore() { for (const [obj, name, real] of originals) obj[name] = real; fetchWire.restore(); syncBuiltinESMExports(); },
    resetCounts() { fired.length = 0; fetchWire.log.length = 0; },
  };
}

// ── static scan of the pure files: only node: built-ins and local files; no clock, random, environment, network or process access
export function staticScan(file) {
  const src = fs.readFileSync(file, "utf8");
  const code = src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/"(?:[^"\\\n]|\\.)*"/g, '""').replace(/`(?:[^`\\]|\\.)*`/g, "``");
  const imports = [...src.matchAll(/^import\s.*?from\s+"([^"]+)"/gm)].map((m) => m[1]);
  const bad = imports.filter((i) => !(i.startsWith("node:") || i.startsWith("./") || i.startsWith("../")));
  const banned = [...new Set(code.match(/\b(fetch|XMLHttpRequest|WebSocket|child_process|Math\.random|Date\.now|new Date|process\.env|process\.argv|readFileSync|writeFileSync|require\()/g) ?? [])];
  const nodeImports = imports.filter((i) => i.startsWith("node:"));
  return { file: path.basename(file), imports, nonNodeNonLocalImports: bad, nodeImports, banned, ok: bad.length === 0 && banned.length === 0 && nodeImports.every((i) => i === "node:crypto") };
}

// ── a deterministic derangement by a cyclic shift (no random source): shift = 1 + sha256(window + tag) mod (n-1)
function shiftFor(window, tag, n) { return 1 + (parseInt(sha256(`${window}:${tag}`).slice(0, 12), 16) % Math.max(1, n - 1)); }

export async function runWindow(S, { noWeave = false, registeredFramesSha = null, janusDir = null } = {}) {
  const wire = armTripwires();
  const probe = await wire.probe();
  wire.resetCounts();
  const T0 = Date.now();
  const mk = () => makeKinContext({ fold: S.fold, textBuf: S.textBuf, lexicon: S.lexicon, lexiconSha: S.lexiconSha, parallel: S.parallel, parallelSha: S.parallelSha, window: S.name });
  const chk = makeChecker({ fold: S.fold, textBuf: S.textBuf, lexicon: S.lexicon, lexiconSha: S.lexiconSha, parallel: S.parallel, parallelSha: S.parallelSha, namePartsRu: S.namePartsRu, frames: S.frames, framesSha: S.framesSha, registeredFramesSha });
  const qById = Object.fromEntries(S.questions.map((q) => [q.id, q]));
  const plain = plainLines(S.plainText);

  // ── C: the composer (two fresh runs for determinism; forced variants for B8)
  const ctx = mk();
  const outC = composeWindow(ctx, S.questions, { policy: "chosen" });
  const outC2 = composeWindow(mk(), S.questions, { policy: "chosen" });
  const outFirst = composeWindow(mk(), S.questions, { policy: "first" });
  const outSecond = composeWindow(mk(), S.questions, { policy: "second" });
  const allDocs = (o) => [...o.docs, ...o.batteries, ...(o.facts ?? [])]; // round 2: + the fact paragraphs
  const verdict = (doc) => chk.checkDoc(doc, qById[doc.id] ?? null);
  const V = new Map(allDocs(outC).map((d) => [d.id, verdict(d)]));

  // R1 (round 2): (a) checker failures 0; (b) every sentence has an addressed SEGMENT of kind ru or ask (the extent does not count); (c) khora seamReport, strict typing
  const sentences = allDocs(outC).flatMap((d) => d.sentences.map((s) => ({ d, s })));
  const failures = [...V].flatMap(([id, v]) => v.failures.map((f) => ({ doc: id, ...f })));
  const hasSource = (s) => s.segs.some((g) => (g.k === "ru" || g.k === "ask") && g.a);
  const withSource = sentences.filter(({ s }) => hasSource(s)).length;
  const extentOnly = sentences.filter(({ s }) => !hasSource(s) && s.extent).length;
  const askOnly = sentences.filter(({ s }) => hasSource(s) && !s.segs.some((g) => g.k === "ru")).length;
  const selfModel = sentences.filter(({ s }) => s.segs.some((g) => String(g.k).startsWith("self:model"))).length;
  let seam = { notRun: true, reason: "khora seam-ledger not reachable" };
  try {
    const { seamReport } = await kernelImport("khora", "native/organs/seam-ledger.js");
    const strict = (g) => { const t = g.k === "ru" || g.k === "ask" ? `«${g.t}»` : g.t; return g.k === "f" ? { kind: "frame", t } : g.k === "ru" || g.k === "ask" ? { kind: "source", t, address: g.a } : { kind: "value", t }; };
    const rep = seamReport(sentences.map(({ s }) => ({ segs: s.segs.map(strict) })));
    seam = { mouthShare: rep.mouthShare, addressedShare: rep.addressedShare, seamDensity: rep.seamDensity, contractOk: rep.contract.ok, violations: rep.contract.violations.length, sentencesWithoutSource: sentences.filter(({ s }) => !hasSource(s)).length, notRun: false };
  } catch (e) { seam = { notRun: true, reason: String(e.message).slice(0, 160) }; }
  const B1 = { sentences: sentences.length, checkerFailures: failures.length, withAddressedSource: withSource, extentOnly, askOnly, selfModel, seam,
    pass: failures.length === 0 && withSource === sentences.length && extentOnly === 0 && selfModel === 0 && seam.notRun === false && seam.mouthShare === 0 && seam.contractOk === true && seam.sentencesWithoutSource === 0 };

  // B2 / B3a
  const composedOk = (d) => d.sentences.length > 0 && d.uncomposed.length === 0 && V.get(d.id).ok;
  const answerable = S.questions.filter((q) => q.answerable);
  const inScope = answerable.filter((q) => q.template === "T-KIN" || q.template === "T-ID");
  const docOf = (id) => outC.docs.find((d) => d.id === id);
  const B2 = {
    inScopeAnswerable: inScope.length, inScopeComposed: inScope.filter((q) => composedOk(docOf(q.id))).length,
    allAnswerable: answerable.length, allAnswerableComposed: answerable.filter((q) => composedOk(docOf(q.id))).length,
    notComposed: answerable.filter((q) => !composedOk(docOf(q.id))).map((q) => ({ id: q.id, template: q.template, reasons: docOf(q.id).uncomposed.map((u) => u.reason) })),
  };
  B2.pass = B2.inScopeComposed === B2.inScopeAnswerable;
  B2.share = share(B2.inScopeComposed, B2.inScopeAnswerable);
  B2.allShare = share(B2.allAnswerableComposed, B2.allAnswerable);
  const gapQs = S.questions.filter((q) => q.expected === "gap");
  const gapOk = (q) => { const d = docOf(q.id); return composedOk(d) && d.sentences.some((s) => GAP_SENTENCE.has(s.claim)) && !d.sentences.some((s) => STATING.has(s.claim)); };
  const B3a = { expectedGapQuestions: gapQs.length, composedAsGap: gapQs.filter(gapOk).length, byTemplate: Object.fromEntries([...new Set(gapQs.map((q) => q.template))].map((t) => [t, [gapQs.filter((q) => q.template === t && gapOk(q)).length, gapQs.filter((q) => q.template === t).length]])) };

  // B3b: every gap recorded in derivation.byReferent is stated by a sentence the checker parses and re-derives; every gap cell is named by a NONE
  const claimsOf = (doc) => V.get(doc.id).sentences.filter((v) => v.ok && v.bind).map((v) => ({ kind: v.claim, bind: v.bind }));
  let gapsTotal = 0, gapsStated = 0, gapsInexpressible = 0, cellsGap = 0, cellsNamed = 0;
  const uncovered = [];
  for (const doc of outC.batteries) {
    const X = doc.id.slice(2), cl = claimsOf(doc), inexpr = doc.inexpressible ?? [];
    // a MISS sentence names the slot's relation: any lexicon atom of the slot's relation and end (parent, father, mother for a missing parent)
    const atomsOf = (rel, end) => Object.entries(S.lexicon.atoms).filter(([, a]) => a.rel === rel && (rel !== "parent_of" || a.end === end)).map(([k]) => k);
    const miss = (kind, id, terms) => cl.some((c) => c.kind === kind && (c.bind.B ? chk.beings(c.bind.B.t).includes(id) : false) && (terms ? (c.bind.L ?? [c.bind.T]).some((g) => terms.includes(g.t)) : true));
    for (const [term, cell] of Object.entries(S.fold.derivation.byReferent[X] ?? {})) {
      if (cell.state === "gap") { cellsGap++; if (miss("NONE", X, term)) cellsNamed++; else uncovered.push({ X, term, what: "NONE" }); }
      for (const g of cell.gaps ?? []) {
        gapsTotal++;
        const s = g.slot ?? {};
        const ok = g.kind === "no_sex_fact" ? miss("MISS-SEX", s.a, null)
          : g.kind === "open_world_empty" ? miss("MISS-OPEN", s.b, null)
          : g.kind === "no_parent_fact" ? (s.a === "?" ? miss("MISS", s.b, atomsOf("parent_of", "a")) : miss("MISS", s.a, atomsOf("parent_of", "b")))
          : g.kind === "no_sibling_fact" ? miss("MISS", s.b, atomsOf("sibling_of"))
          : g.kind === "no_spouse_fact" ? miss("MISS", s.b, atomsOf("spouse_of")) : false;
        if (ok) gapsStated++; else if (inexpr.some((n) => n.gap === g.kind && JSON.stringify(n.slot) === JSON.stringify(s))) gapsInexpressible++; else uncovered.push({ X, term, gap: g.kind, slot: s });
      }
    }
  }
  const B3b = { gaps: gapsTotal, stated: gapsStated, inexpressible: gapsInexpressible, share: share(gapsStated, gapsTotal), gapCells: cellsGap, named: cellsNamed, cellShare: share(cellsNamed, cellsGap), uncovered: uncovered.slice(0, 10) };
  const B3 = { a: B3a, b: B3b, pass: B3a.composedAsGap === B3a.expectedGapQuestions && gapsStated === gapsTotal && cellsNamed === cellsGap };
  B3.inexpressibleDocs = allDocs(outC).flatMap((d) => (d.inexpressible ?? []).map((n) => ({ doc: d.id, ...n }))).slice(0, 10);

  // ── B4 controls
  const ids = [...ctx.ref.keys()].sort();
  const factIsTrue = (rel, a, b) => ctx.facts.some((f) => f.rel === rel && ((f.a === a && f.b === b) || ((rel === "sibling_of" || rel === "spouse_of") && f.a === b && f.b === a)));
  const sexTrue = (a, v) => ctx.facts.some((f) => f.rel === "sex" && f.a === a && f.value === v);
  let s1 = null;
  for (let k0 = shiftFor(S.name, "ends", ids.length), t = 0; t < ids.length - 1; t++) {
    const k = ((k0 - 1 + t) % (ids.length - 1)) + 1;
    const sigma = new Map(ids.map((id, i) => [id, ids[(i + k) % ids.length]]));
    const valid = ctx.facts.every((f) => (f.rel === "sex" ? !sexTrue(sigma.get(f.a), f.value) : !factIsTrue(f.rel, sigma.get(f.a), sigma.get(f.b))));
    if (valid) { s1 = { k, sigma }; break; }
  }
  const wits = [...new Set(ctx.facts.flatMap((f) => f.witnesses ?? []))].sort((p, q) => Number(p.split("#")[1].split("-")[0]) - Number(q.split("#")[1].split("-")[0]));
  const tau = wits.length >= 2 ? new Map(wits.map((w, i) => [w, wits[(i + 1) % wits.length]])) : null;
  const controlStats = (name, control) => {
    if (!control) return { name, constructible: false };
    const out = composeWindow(mk(), S.questions, { policy: "chosen", control });
    const base = new Map(allDocs(outC).map((d) => [d.id, new Set(d.sentences.map((s) => s.text))]));
    let changedFact = 0, rejectedFact = 0, changedGap = 0, rejectedGap = 0, totalFail = 0;
    const reasons = {};
    for (const d of allDocs(out)) {
      const v = chk.checkDoc(d, qById[d.id] ?? null);
      totalFail += v.failures.length;
      for (const f of v.failures) reasons[f.code] = (reasons[f.code] ?? 0) + 1;
      d.sentences.forEach((s, i) => {
        if (base.get(d.id)?.has(s.text)) return;
        const bad = v.sentences[i].failures.length > 0;
        if (FACT_KINDS.has(s.claim)) { changedFact++; if (bad) rejectedFact++; } else if (GAP_SENTENCE.has(s.claim)) { changedGap++; if (bad) rejectedGap++; }
      });
    }
    return { name, constructible: true, checkerFailures: totalFail, changedFactSentences: changedFact, rejectedFactSentences: rejectedFact, changedGapSentences: changedGap, rejectedGapSentences: rejectedGap, reasons, pass: totalFail >= 1 && changedFact > 0 && rejectedFact === changedFact };
  };
  const S1 = controlStats("S1 shuffled ends", s1 && { id: (x) => s1.sigma.get(x) ?? x });
  if (s1) S1.shift = s1.k;
  const S2 = controlStats("S2 shuffled witnesses", tau && { wit: (w) => tau.get(w) ?? w });
  const B4 = { S1, S2, pass: S1.pass === true && S2.pass === true };

  // ── B5 mutation kill
  const mut = makeMutator({ fold: S.fold, textBuf: S.textBuf, lexicon: S.lexicon, lexiconSha: S.lexiconSha });
  const ops = {};
  const survivors = [];
  const note = (op, killed, info) => { ops[op] ??= { made: 0, killed: 0 }; ops[op].made++; if (killed) ops[op].killed++; else survivors.push({ op, ...info }); };
  for (const doc of allDocs(outC)) {
    if (!V.get(doc.id).ok || !doc.sentences.length) continue;
    const q = qById[doc.id] ?? null;
    doc.sentences.forEach((s, i) => {
      for (const { op, sentence } of mut.mutantsOf(s, doc)) {
        const m = { ...doc, sentences: doc.sentences.map((x, j) => (j === i ? sentence : x)) };
        note(op, !chk.checkDoc(m, q).ok, { doc: doc.id, sentence: s.text.slice(0, 80) });
      }
    });
    const add = mut.absentFactSentence();
    if (add && doc.template !== "C-ABSENT") note("M7", !chk.checkDoc({ ...doc, sentences: [...doc.sentences, add] }, q).ok, { doc: doc.id });
  }
  const madeAll = Object.values(ops).reduce((a, o) => a + o.made, 0), killedAll = Object.values(ops).reduce((a, o) => a + o.killed, 0);
  const B5 = { made: madeAll, killed: killedAll, killRate: share(killedAll, madeAll), byOperator: ops, survivors: survivors.slice(0, 10), pass: madeAll > 0 && killedAll === madeAll };

  // ── B6 determinism (in process; the CLI re-run is compared by the caller)
  const textOf = (o) => allDocs(o).map((d) => `${d.id}\n${render(d)}`).join("\n\n");
  const B6 = { jsonEqual: hashOf(outC) === hashOf(outC2), textEqual: hashOf(textOf(outC)) === hashOf(textOf(outC2)), jsonSha256: hashOf(outC), textSha256: hashOf(textOf(outC)) };
  B6.pass = B6.jsonEqual && B6.textEqual;

  // ── B7 recall beside the plain arm (expected items from questions.json; `linked` excluded and reported)
  const claimsFull = (doc) => V.get(doc.id).sentences.filter((v) => v.bind).map((v) => ({ kind: v.claim, bind: v.bind }));
  const recall = { composer: [0, 0], plain: [0, 0], plainLinked: [0, 0] };
  const recallMisses = { composer: [], plain: [] };
  const perQ = [];
  for (const q of inScope) {
    const e = q.expected, d = docOf(q.id), cl = claimsFull(d), line = plain.get(q.id) ?? "";
    let items = [];
    if (e.type === "kin") for (const k of e.kin) items.push({ kind: "kin", k });
    if (e.type === "identity") { for (const f of e.facts) items.push({ kind: "fact", f }); for (const sp of e.spellings) items.push({ kind: "spelling", sp }); }
    for (const it of items) {
      let c = false, p = false;
      if (it.kind === "kin") {
        c = cl.some((x) => x.kind === "REL" && chk.beings(x.bind.A.t).includes(it.k.whoId) && q.referent && chk.beings(x.bind.B.t).includes(q.referent));
        p = line.includes(it.k.who) && it.k.terms.some((t) => new RegExp(`\\b${t}\\b`).test(line));
      } else if (it.kind === "fact") {
        let m;
        if ((m = /^(.+?) is the (\w+) of (.+?)\. giver:/.exec(it.f))) {
          c = cl.some((x) => x.kind === "REL" && x.bind.A.t === m[1] && x.bind.T.t === m[2] && x.bind.B.t === m[3]);
          p = line.includes(m[1]) && line.includes(m[3]) && new RegExp(`\\b${m[2]}\\b`).test(line);
        } else if ((m = /^(.+?) is (female|male)\. giver:/.exec(it.f))) {
          c = cl.some((x) => x.kind === "SEX" && x.bind.A.t === m[1] && x.bind.X.t === m[2]);
          p = line.includes(m[1]) && new RegExp(`\\b${m[2]}\\b`).test(line);
        }
      } else if (it.kind === "spelling") {
        const forms = new Set(d.sentences.flatMap((s) => s.segs.filter((g) => g.k === "ru").map((g) => g.t)));
        c = forms.has(it.sp); p = line.includes(`«${it.sp}»`);
      }
      recall.composer[1]++; recall.plain[1]++; if (c) recall.composer[0]++; else recallMisses.composer.push({ q: q.id, item: it }); if (p) recall.plain[0]++; else recallMisses.plain.push({ q: q.id, item: it.kind === "kin" ? it.k.who : it.f ?? it.sp });
    }
    if (e.type === "identity") for (const n of e.linked ?? []) { recall.plainLinked[1]++; if (line.includes(n)) recall.plainLinked[0]++; }
    perQ.push({ id: q.id, items: items.length });
  }
  const B7 = { composer: share(...recall.composer), plain: share(...recall.plain), items: recall.composer[1], composerHits: recall.composer[0], plainHits: recall.plain[0], plainLinkedRecall: share(...recall.plainLinked), plainLinkedItems: recall.plainLinked[1], misses: recallMisses, pass: recall.composer[1] > 0 && recall.composer[0] >= recall.plain[0] };

  // ── B8 variant invariance: the checker's parsed claim multiset, per document, across first / second / chosen
  const keys = (o, d) => { const doc = allDocs(o).find((x) => x.id === d.id); const v = chk.checkDoc(doc, qById[doc.id] ?? null); return v.claimKeys.filter(Boolean).sort().join("\n"); };
  let invariant = 0, comparable = 0;
  const variantBreaks = [];
  for (const d of allDocs(outC)) {
    if (!d.sentences.length) continue;
    comparable++;
    const a = keys(outC, d), b = keys(outFirst, d), c = keys(outSecond, d);
    if (a === b && b === c) invariant++; else variantBreaks.push(d.id);
  }
  const B8 = { documents: comparable, invariant, share: share(invariant, comparable), breaks: variantBreaks, pass: invariant === comparable };

  // ── B9 the weave path (noModel): field-settled units, zero model-required, same text, zero tripwire hits
  let B9 = { skipped: true, reason: noWeave ? "--no-weave" : "not run" };
  if (!noWeave) {
    try {
      const { weave } = await import("../organs/generation/api.mjs");
      const adapter = (await import("../organs/generation/adapters/kin-telling.mjs")).default;
      const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "kin-telling-weave-"));
      const quiet = console.log; console.log = () => {};
      const rows = [];
      try {
        for (const q of S.questions.filter((x) => composedOk(docOf(x.id)))) {
          const r = await weave({ intent: q.text, artifact: adapter, noModel: true, output: outDir, context: { kin: { composeCtx: ctx, checker: chk, question: q } } });
          const doc = docOf(q.id);
          const stages = (r.evidence?.outcomes ?? []).map((o) => o.stage);
          rows.push({ id: q.id, ok: r.ok, units: stages.length, allField: stages.every((s) => s === "field"), modelRequired: stages.filter((s) => s === "model-required").length, mouth: stages.filter((s) => s === "mouth").length, sameText: r.artifact?.value === doc.sentences.map((s) => s.text).join("\n\n") + "\n", noModel: r.noModel === true && r.model === null });
        }
      } finally { console.log = quiet; }
      fs.rmSync(outDir, { recursive: true, force: true });
      B9 = { questions: rows.length, allFieldSettled: rows.filter((r) => r.allField).length, modelRequired: rows.reduce((a, r) => a + r.modelRequired, 0), mouth: rows.reduce((a, r) => a + r.mouth, 0), sameText: rows.filter((r) => r.sameText).length, ok: rows.filter((r) => r.ok).length, rows: rows.filter((r) => !(r.allField && r.sameText && r.ok)) };
      B9.pass = rows.length > 0 && B9.allFieldSettled === rows.length && B9.modelRequired === 0 && B9.mouth === 0 && B9.sameText === rows.length && B9.ok === rows.length;
    } catch (e) { B9 = { skipped: true, reason: `weave unavailable: ${String(e.message).slice(0, 200)}`, code: e.code ?? null }; }
  }

  // ── R10 the count sentence lists exactly the fold's unbound statements (the checker derives it; here the tally)
  const unbDocs = allDocs(outC).filter((d) => d.sentences.some((x) => x.claim === "UNB"));
  const unbOk = unbDocs.filter((d) => { const v = V.get(d.id); return v.ok || !v.sentences.some((sv) => sv.claim === "UNB" && !sv.ok); }).length;
  const R10 = { paragraphsWithCount: unbDocs.length, exact: unbOk, spansPerParagraph: unbDocs.length ? unbDocs[0].sentences.find((x) => x.claim === "UNB").segs.filter((g) => g.k === "ru").length : 0, foldUnbound: S.fold.kin.unbound.length, pass: unbOk === unbDocs.length };

  // ── B0
  const wireCounts = wire.count();
  const swatch = path.join(HERE, "swatch.jsonl");
  const B0 = { probe, wire: wireCounts, swatchPresent: fs.existsSync(swatch), scan: [path.join(HERE, "..", "organs", "kin-telling.mjs"), path.join(HERE, "..", "organs", "kin-telling-check.mjs"), path.join(HERE, "..", "organs", "generation", "adapters", "kin-telling.mjs")].map(staticScan), setup: chk.setup };
  B0.pass = probe.spawnTripped && probe.fetchTripped && wireCounts.fired === 0 && wireCounts.fetchModelDoor === 0 && B0.scan.every((x) => x.ok) && chk.setup.length === 0;
  wire.restore();

  // ── the plain arm under the same checker
  const plainArm = { questions: 0, sentences: 0, addressed: 0, failures: 0 };
  for (const q of S.questions) { const line = plain.get(q.id); if (line == null) continue; const t = typeProse(line); plainArm.questions++; plainArm.sentences += t.sentences; plainArm.failures += t.failures.length; }
  plainArm.addressedShare = share(plainArm.sentences - plainArm.failures, plainArm.sentences);

  const report = {
    schema: "KinTellingReport@1", window: S.name, ms: Date.now() - T0,
    hashes: { text: sha256(S.textBuf), foldSha: sha256(JSON.stringify(S.fold)), lexicon: S.lexiconSha, parallel: S.parallelSha, namePartsRu: S.namePartsSha, frames: S.framesSha },
    bars: { R0: B0, R1: B1, R2: B2, R3: B3, R4: B4, R5: B5, R6: B6, R7: B7, R8: B8, R9: B9, R10 },
    plainArm,
    composer: { questions: S.questions.length, docs: outC.docs.length, batteries: outC.batteries.length, factParagraphs: (outC.facts ?? []).length, sentences: sentences.length, styleNotes: allDocs(outC).flatMap((d) => d.style).length, uncomposed: allDocs(outC).filter((d) => d.uncomposed.length).map((d) => ({ id: d.id, reasons: d.uncomposed })) },
    failures: failures.slice(0, 30),
  };
  return { report, outC, V, plain, qById, ctx };
}


// ── B10 (development, synthetic): more facts than the real fold has, answered by the real janus deriveKin, through the unchanged composer and checker
export async function runGrowth(S, janusDir) {
  const K = await import(pathToFileURL(path.join(janusDir, "native", "organs", "kinship.js")).href);
  const fx = growthFixture(K, S.lexicon);
  const ctx = makeKinContext({ fold: fx.fold, textBuf: fx.textBuf, lexicon: S.lexicon, lexiconSha: S.lexiconSha, window: "growth" });
  const chk = makeChecker({ fold: fx.fold, textBuf: fx.textBuf, lexicon: S.lexicon, lexiconSha: S.lexiconSha, namePartsRu: S.namePartsRu, frames: S.frames, framesSha: S.framesSha });
  const out = composeWindow(ctx, fx.questions);
  const qs = Object.fromEntries(fx.questions.map((q) => [q.id, q]));
  const docs = [...out.docs, ...out.batteries];
  const verdicts = docs.map((d) => chk.checkDoc(d, qs[d.id] ?? null));
  const cells = Object.values(fx.fold.derivation.byReferent).flatMap((c) => Object.values(c));
  const R = { documents: docs.length, passing: verdicts.filter((v) => v.ok).length, sentences: docs.reduce((a, d) => a + d.sentences.length, 0), answeredCells: cells.filter((c) => c.state !== "gap").length, gapCells: cells.filter((c) => c.state === "gap").length, uncomposed: docs.flatMap((d) => d.uncomposed), inexpressibleGaps: docs.reduce((a, d) => a + (d.inexpressible?.length ?? 0), 0), failures: verdicts.flatMap((v) => v.failures).slice(0, 5) };
  R.pass = R.passing === R.documents && R.uncomposed.length === 0 && R.answeredCells > 0;
  return R;
}

// ── printing: the composed English beside the plain baseline's reply
export function sideBySide(S, run) {
  const L = [];
  L.push(`# Composed English beside the plain baseline — ${S.name} window\n`);
  L.push(`The composer's prose is frames (a closed word set) around Russian quotations and names copied from the text, plus kin terms and English names copied from giver rows. It is annotation of a recorded derivation, not translation. Each composed sentence is followed by the addresses it is bound to (Russian byte spans \`ru#a-b\`, giver rows, the record).\n`);
  for (const q of S.questions) {
    const d = run.outC.docs.find((x) => x.id === q.id);
    const v = run.V.get(q.id);
    L.push(`## ${q.id} [${q.template}] ${q.text}`);
    L.push(`- **plain baseline:** ${run.plain.get(q.id) ?? "(none)"}`);
    if (d.sentences.length) {
      L.push(`- **composer** (checker: ${v.ok ? "all sentences pass" : `${v.failures.length} failure(s)`}):`);
      d.sentences.forEach((s) => L.push(`  - ${s.text}  \n    \`${[...new Set([...s.segs.filter((g) => g.a).map((g) => g.a), ...(s.extent ? [s.extent] : [])])].join("  ")}\``));
    } else L.push(`- **composer:** not composed — ${d.uncomposed.map((u) => `${u.reason}${u.detail ? ` (${u.detail})` : ""}`).join("; ")}`);
    L.push("");
  }
  if ((run.outC.facts ?? []).length) {
    L.push(`## Fact paragraphs (the kin paragraph of each end of every stated kin fact; the material of the shuffled controls)\n`);
    for (const d of run.outC.facts) L.push(`- ${d.id}: ${d.sentences.map((x) => x.text).join(" ")}`);
    L.push("");
  }
  return L.join("\n");
}

async function main() {
  const wins = windowPaths(arg("root") ?? undefined);
  const name = arg("window", "dev");
  // round 2: a window can be named by a folder (--dir holds fold.json and questions.json; --plain is the plain answerer's reply file)
  const win = arg("dir") ? { name, dir: arg("dir"), plain: arg("plain") } : wins[name];
  if (!win) throw new Error(`--window dev|heldout, or --window <name> --dir <folder> --plain <reply file>`);
  const S = loadWindow(win, { janus: arg("janus") });
  const out = arg("out");
  const run = await runWindow(S, { noWeave: has("no-weave"), registeredFramesSha: arg("frames-sha") });
  const md = sideBySide(S, run);
  if (name === "dev" && arg("janus")) run.report.bars.R11 = await runGrowth(S, arg("janus"));
  if (out) {
    fs.mkdirSync(out, { recursive: true });
    const compact = { ...run.outC, docs: run.outC.docs, batteries: run.outC.batteries };
    fs.writeFileSync(path.join(out, `composed-${name}.json`), JSON.stringify(compact, null, 1) + "\n");
    fs.writeFileSync(path.join(out, `composed-${name}.txt`), [...run.outC.docs, ...run.outC.batteries].map((d) => `${d.id}\n${render(d)}`).join("\n\n") + "\n");
    fs.writeFileSync(path.join(out, `addresses-${name}.txt`), [...run.outC.docs, ...run.outC.batteries].map((d) => `${d.id}\n${renderTagged(d)}`).join("\n\n") + "\n");
    fs.writeFileSync(path.join(out, `side-by-side-${name}.md`), md + "\n");
    fs.writeFileSync(path.join(out, `report-${name}.json`), JSON.stringify(run.report, null, 1) + "\n");
  }
  const b = run.report.bars;
  const line = (id, ok, txt) => console.log(`${id} ${ok === true ? "PASS" : ok === false ? "FAIL" : "----"}  ${txt}`);
  console.log(`window ${name}: ${run.report.composer.sentences} sentences, ${run.report.composer.questions} questions, ${run.report.composer.batteries} batteries, ${run.report.composer.factParagraphs} fact paragraphs`);
  line("R0", b.R0.pass, `tripwire fired ${b.R0.wire.fired + b.R0.wire.fetchModelDoor} (probe tripped: spawn ${b.R0.probe.spawnTripped}, fetch ${b.R0.probe.fetchTripped}); static scan ${b.R0.scan.map((s) => `${s.file}:${s.ok ? "ok" : "BAD"}`).join(" ")}`);
  const sm = b.R1.seam;
  line("R1", b.R1.pass, `${b.R1.sentences} sentences, checker failures ${b.R1.checkerFailures}, with an addressed ru/ask segment ${b.R1.withAddressedSource}, extent-only ${b.R1.extentOnly}, ask-only ${b.R1.askOnly}, self:model ${b.R1.selfModel}; seamReport ${sm.notRun ? `NOT RUN (${sm.reason})` : `mouthShare ${sm.mouthShare}, contract ${sm.contractOk}, sentences without a source segment ${sm.sentencesWithoutSource}, addressedShare(strict) ${(100 * sm.addressedShare).toFixed(1)}%`}`);
  line("R2", b.R2.pass, `in-scope answerable ${b.R2.inScopeComposed}/${b.R2.inScopeAnswerable}; ALL answerable ${b.R2.allAnswerableComposed}/${b.R2.allAnswerable} (${b.R2.allShare?.toFixed(3)})`);
  line("R3", b.R3.pass, `expected-gap questions ${b.R3.a.composedAsGap}/${b.R3.a.expectedGapQuestions}; recorded gaps stated ${b.R3.b.stated}/${b.R3.b.gaps}; gap cells named ${b.R3.b.named}/${b.R3.b.gapCells}`);
  line("R4", b.R4.pass, `S1 ${JSON.stringify({ f: b.R4.S1.checkerFailures, ch: b.R4.S1.changedFactSentences, rej: b.R4.S1.rejectedFactSentences })}; S2 ${JSON.stringify({ f: b.R4.S2.checkerFailures, ch: b.R4.S2.changedFactSentences, rej: b.R4.S2.rejectedFactSentences, constructible: b.R4.S2.constructible })}`);
  line("R5", b.R5.pass, `mutants ${b.R5.killed}/${b.R5.made} killed (${Object.entries(b.R5.byOperator).map(([k, o]) => `${k} ${o.killed}/${o.made}`).join(", ")})`);
  line("R6", b.R6.pass, `json ${b.R6.jsonSha256.slice(0, 12)} text ${b.R6.textSha256.slice(0, 12)}`);
  line("R7", b.R7.pass, `recall composer ${b.R7.composerHits}/${b.R7.items} vs plain ${b.R7.plainHits}/${b.R7.items}; plain linked-name recall ${b.R7.plainLinkedRecall} over ${b.R7.plainLinkedItems}`);
  line("R8", b.R8.pass, `${b.R8.invariant}/${b.R8.documents} documents claim-invariant across variants`);
  line("R9", b.R9.skipped ? null : b.R9.pass, b.R9.skipped ? b.R9.reason : `${b.R9.allFieldSettled}/${b.R9.questions} field-settled, model-required ${b.R9.modelRequired}, same text ${b.R9.sameText}`);
  line("R10", b.R10.pass, `${b.R10.exact}/${b.R10.paragraphsWithCount} paragraphs with a count sentence list exactly the fold's ${b.R10.foldUnbound} unbound statements`);
  if (b.R11) line("R11", b.R11.pass, `synthetic growth: ${b.R11.passing}/${b.R11.documents} documents pass, ${b.R11.answeredCells} answered cells, ${b.R11.gapCells} gap cells, uncomposed ${b.R11.uncomposed.length}, inexpressible janus gaps ${b.R11.inexpressibleGaps}`);
  console.log(`plain arm under the same checker: ${run.report.plainArm.sentences} sentences, addressed share ${run.report.plainArm.addressedShare}`);
  if (!out) console.log("\n" + md);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main().catch((e) => { console.error(e); process.exit(1); });
