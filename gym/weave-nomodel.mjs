#!/usr/bin/env node
// gym/weave-nomodel.mjs — THE NO-MODEL WEAVE DIAGNOSTIC (general, reusable).
//
// Question it answers: with ZERO model draws, how far does the Weave lifecycle
// (intent -> prior -> read -> field -> hunt -> arrange -> fold -> verify ->
// materialize) get before a model is genuinely necessary — and WHICH stage is
// the first one that stops it?
//
// It runs the real public operation, weave({ noModel: true }). A unit that
// reaches the mouth stage is recorded as `model-required` and left unresolved;
// nothing is drawn, nothing is substituted, nothing is faked. Three independent
// walls make "zero draws" a measured fact rather than a claim:
//   1. the engine's own noModel path never calls draw();
//   2. draw() itself throws if reached with noModel:true;
//   3. a fetch tripwire here fails the run if ANY model door is addressed
//      (the draw door's channel, /api/generate, /api/chat) and the swatch file
//      (gym/swatch.jsonl, where every real draw lands) must be byte-identical.
//
// What it reports is per target, per stage — never a score:
//   units, field/hunt claimed vs verified, model-required, unresolved,
//   source reuse, fold gaps/refused/residual, verification, provenance integrity,
//   elapsed. Provenance is AUDITED, not trusted: dangling links, byte ranges that
//   do not slice back to the contribution, and lineage edges that are absent.
//
// Artifact kinds other than text can plug a `diagnose` module the way
// gym/nomodel-prose.mjs does; the core below knows nothing about prose.
//
//   node gym/weave-nomodel.mjs --intent "Write a ... essay about X" \
//        --targets 1000,2000,4000,8000,12000 --field a.html,b.txt \
//        --hunt shim|shipped|off --out /tmp/nomodel-run
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const SWATCH = path.join(HERE, "swatch.jsonl");
const words = (s) => String(s ?? "").split(/\s+/).filter(Boolean).length;
const sha = (s) => crypto.createHash("sha1").update(String(s)).digest("hex").slice(0, 12);

// ── the tripwire ────────────────────────────────────────────────────────────
const MODEL_DOORS = [/:11434(\/|$)/, /\/api\/(generate|chat)(\?|$)/, /\/v1\/(chat|completions|ask|build)/];
export function installTripwire({ cacheDir = null } = {}) {
  const real = globalThis.fetch;
  const log = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input?.url ?? input);
    const method = String(init?.method ?? input?.method ?? "GET").toUpperCase();
    const row = { url, method, model_door: MODEL_DOORS.some((r) => r.test(url)), cached: false };
    log.push(row);
    if (row.model_door) throw new Error("NO-MODEL TRIPWIRE: a model door was addressed: " + url);
    // external page GETs are cached on disk so five target runs do not hit the
    // same page five times. The first fetch is real; a cache hit is logged.
    const external = method === "GET" && /^https?:\/\//.test(url) && !/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url);
    const f = cacheDir && external ? path.join(cacheDir, "page-" + sha(url) + ".json") : null;
    if (f && fs.existsSync(f)) {
      const j = JSON.parse(fs.readFileSync(f, "utf8"));
      row.cached = true;
      return new Response(j.body, { status: j.status, headers: { "content-type": j.type } });
    }
    const r = await real(input, init);
    if (f && r.ok) {
      const body = await r.clone().text();
      fs.writeFileSync(f, JSON.stringify({ status: r.status, type: r.headers.get("content-type") ?? "text/plain", body }));
    }
    return r;
  };
  return { log, restore: () => { globalThis.fetch = real; }, modelDoorCalls: () => log.filter((r) => r.model_door) };
}

// ── provenance audit: integrity is checked, never trusted ───────────────────
export function auditProvenance(code, prov, units = []) {
  const buf = Buffer.from(code ?? "", "utf8");
  const sources = new Map((prov.sources ?? []).map((s) => [s.source_id, s]));
  const events = prov.events ?? [];
  const evById = new Map(events.map((e) => [e.event_id, e]));

  // 1. dangling references (source_id / parent that resolve to nothing)
  const dangling = [];
  for (const e of events) {
    if (e.source_id && !sources.has(e.source_id)) dangling.push({ stage: e.stage, field: "source_id" });
    if (e.parent && !sources.has(e.parent) && !evById.has(e.parent)) dangling.push({ stage: e.stage, field: "parent" });
    if (e.ibid && !evById.has(e.ibid)) dangling.push({ stage: e.stage, field: "ibid" });
  }

  // 2. byte anchors: every ranged event must slice the artifact on a seam
  //    (contributions are joined by "\n\n"; the artifact ends in "\n")
  const ranged = events.filter((e) => e.range && (e.stage === "ground" || e.stage === "draw"));
  let misaligned = 0, outOfBounds = 0, emptySlices = 0;
  ranged.forEach((e, i) => {
    const { start, end } = e.range;
    if (end > buf.length || start < 0) { outOfBounds += 1; return; }
    if (end === start) { emptySlices += 1; return; }
    const before = i === 0 ? "" : buf.subarray(Math.max(0, start - 2), start).toString("utf8");
    const after = buf.subarray(end, end + 2).toString("utf8");
    const startOk = i === 0 ? start === 0 : before === "\n\n";
    const endOk = after === "\n\n" || (after === "\n" && end + 1 === buf.length);
    if (!startOk || !endOk) misaligned += 1;
  });

  // 3. lineage: the chain intent -> prior -> read -> unit -> source -> artifact -> verification
  const byStage = (st) => events.filter((e) => e.stage === st);
  const intent = byStage("intent")[0], prior = byStage("prior")[0], read = byStage("read")[0];
  const fold = byStage("fold")[0], verify = byStage("verify")[0], materialize = byStage("materialize")[0];
  const unitSrc = new Map([...sources.values()].filter((s) => s.kind === "unit").map((s) => [s.locator?.name, s.source_id]));
  const arrange = byStage("arrange");
  const contributions = events.filter((e) => e.stage === "ground" || e.stage === "draw");
  const lineage = {
    "intent->prior": !!(prior && intent && prior.parent === intent.source_id),
    "prior->read": !!(read && prior && read.parent === prior.source_id),
    "read->unit": { linked: arrange.filter((e) => e.parent).length, of: arrange.length },
    "unit->contribution": { linked: contributions.filter((e) => e.parent && [...unitSrc.values()].includes(e.parent)).length, of: contributions.length },
    "contributions->fold": !!(fold && (fold.parent || fold.ibid)),
    "fold->verify": !!(verify && (verify.parent || verify.ibid)),
    "verify->materialize": !!(materialize && (materialize.parent || materialize.ibid)),
    "verification source in table": !!(verify && sources.has(verify.source_id)),
  };

  // 4. source identity: one source per (kind, locator); reuse is by reference
  const byIdentity = new Map();
  for (const s of sources.values()) {
    const k = JSON.stringify([s.kind, s.locator]);
    byIdentity.set(k, (byIdentity.get(k) ?? 0) + 1);
  }
  const refsPer = new Map();
  for (const e of contributions) refsPer.set(e.source_id, (refsPer.get(e.source_id) ?? 0) + 1);
  const kinds = {};
  for (const s of sources.values()) kinds[s.kind] = (kinds[s.kind] ?? 0) + 1;

  // 5. granularity: does a contribution's source carry an anchor finer than a page?
  const contributionSources = [...new Set(contributions.map((e) => e.source_id))].map((id) => sources.get(id)).filter(Boolean);
  const anchored = contributionSources.filter((s) => s.anchor && /#|:\d+-\d+|\bbytes?=|\brange=/.test(String(s.anchor)));

  return {
    schema: prov.schema,
    events: events.length,
    sources: sources.size,
    sourceKinds: kinds,
    jsonBytes: Buffer.byteLength(JSON.stringify(prov)),
    dangling: { count: dangling.length, byField: dangling.reduce((a, d) => ((a[d.stage + "." + d.field] = (a[d.stage + "." + d.field] ?? 0) + 1), a), {}) },
    byteRanges: { ranged: ranged.length, misaligned, outOfBounds, emptySlices },
    lineage,
    duplicateSourceIdentities: [...byIdentity.values()].filter((n) => n > 1).length,
    sourcesReusedByMultipleContributions: [...refsPer.values()].filter((n) => n > 1).length,
    contributionSources: contributionSources.length,
    contributionSourcesWithSubPageAnchor: anchored.length,
  };
}

// ── one run ─────────────────────────────────────────────────────────────────
export async function runOne({ weave, intent, artifact, target, shadow, outDir, diagnose = null, extra = {} }) {
  const swatchBefore = fs.existsSync(SWATCH) ? fs.statSync(SWATCH).size : 0;
  const realLog = console.log;
  console.log = () => {};
  const t0 = performance.now();
  let res;
  try {
    res = await weave({ intent, artifact, constraints: { words: target }, context: { shadow }, noModel: true, output: outDir, ...extra });
  } finally {
    console.log = realLog;
  }
  const elapsedMs = Math.round(performance.now() - t0);
  const swatchAfter = fs.existsSync(SWATCH) ? fs.statSync(SWATCH).size : 0;
  const code = res.artifact?.value ?? "";
  const outcomes = res.evidence?.outcomes ?? [];
  const units = res.evidence?.units ?? [];
  const count = (st) => outcomes.filter((o) => o.stage === st).length;
  const row = {
    target,
    status: res.status,
    ok: res.ok,
    noModel: res.noModel,
    modelReported: res.model,
    units: units.length,
    engineClaimed: { field: count("field"), hunt: count("hunt"), mouth: count("mouth"), modelRequired: count("model-required"), unsatisfied: count("unsatisfied") },
    materializedWords: words(code),
    materializedBytes: Buffer.byteLength(code),
    distinctContributions: new Set(outcomes.filter((o) => o.text).map((o) => o.text)).size,
    verdict: res.verification?.verdict ? { ok: res.verification.verdict.ok, reason: res.verification.verdict.reason, detail: res.verification.verdict.detail } : null,
    scars: res.repair?.scars?.length ?? 0,
    swatchGrewBytes: swatchAfter - swatchBefore,
    elapsedMs,
    outcomeVector: sha(JSON.stringify(outcomes.map((o) => [o.unit, o.stage, o.bytes]))),
    artifactHash: sha(code),
  };
  row.provenance = auditProvenance(code, res.evidence?.provenance ?? { sources: [], events: [] }, units);
  if (diagnose) row.diagnosis = await diagnose({ res, code, units, outcomes, shadow, row });
  return { row, res };
}

// ── report ──────────────────────────────────────────────────────────────────
export function table(rows, cols) {
  const w = cols.map((c) => Math.max(c.h.length, ...rows.map((r) => String(c.f(r)).length)));
  const line = (cells) => cells.map((v, i) => String(v).padEnd(w[i])).join("  ");
  return [line(cols.map((c) => c.h)), line(w.map((n) => "-".repeat(n))), ...rows.map((r) => line(cols.map((c) => c.f(r))))].join("\n");
}

// ── selftest: the walls must be SEEN failing (a check that cannot fail is a comment) ──
export async function selftest() {
  const { weave } = await import(pathToFileURL(path.join(ROOT, "organs/generation/api.mjs")).href);
  const { draw } = await import(pathToFileURL(path.join(ROOT, "organs/generation/engine.mjs")).href);
  const mouth = { calls: 0 };
  const adapter = {
    kind: "selftest-nomodel-harness",
    readUnits: () => ["u1", "u2", "u3", "u4"].map((n) => ({ name: n, spec: "spec " + n })),
    autofill: (u) => (u.name === "u1" || u.name === "u3" ? { code: "field " + u.name + " \u00e9\u00e8 multibyte", address: "field:" + u.name } : null),
    hunt: async (u) => (u.name === "u2" ? { code: "hunt " + u.name, url: "hunt:" + u.name } : null),
    mouthFragment: () => { mouth.calls += 1; return "x"; },
    snip: (v) => v, probeUnit: () => ({ ok: true, detail: "" }), testUnits: () => ({ ok: true, reason: "ok" }), toDocument: () => "<html></html>",
  };
  const trip = installTripwire();
  const checks = [];
  try {
    // 1. the tripwire fires on a model door and records it
    let fired = false;
    try { await fetch("http://127.0.0.1:11434/api/generate", { method: "POST", body: "{}" }); } catch (e) { fired = /NO-MODEL TRIPWIRE/.test(String(e.message)); }
    checks.push(["tripwire fires on a model door", fired && trip.modelDoorCalls().length === 1]);
    // 2. draw() itself refuses under noModel
    let drawRefused = false;
    try { await draw("p", { noModel: true }); } catch (e) { drawRefused = /noModel:true/.test(String(e.message)); }
    checks.push(["draw() throws under noModel", drawRefused]);
    // 3. a real noModel weave: stage accounting, zero mouth, provenance audited
    const { row } = await runOne({ weave, intent: "harness selftest", artifact: adapter, target: 1000, shadow: new Map(), outDir: fs.mkdtempSync(path.join(os.tmpdir(), "weave-nomodel-h-")) });
    checks.push(["stages field/hunt/model-required", JSON.stringify(row.engineClaimed) === JSON.stringify({ field: 2, hunt: 1, mouth: 0, modelRequired: 1, unsatisfied: 0 })]);
    checks.push(["mouth never called", mouth.calls === 0 && row.noModel === true && row.modelReported === null]);
    checks.push(["no swatch growth", row.swatchGrewBytes === 0]);
    // 4. the byte-anchor regression: 3 contributions, one multibyte — every range must slice on a seam
    checks.push(["byte ranges align (off-by-one regression)", row.provenance.byteRanges.ranged === 3 && row.provenance.byteRanges.misaligned === 0]);
    checks.push(["no dangling sources (verification is in the table)", row.provenance.dangling.count === 0]);
    // 5. the audit itself must be able to FAIL: shift a range by one byte and a hole opens
    const code = "aaa\n\nbbb\n";
    const prov = { sources: [], events: [{ stage: "ground", unit: "a", range: { start: 0, end: 3 } }, { stage: "ground", unit: "b", range: { start: 5, end: 8 } }] };
    const good = auditProvenance(code, prov).byteRanges.misaligned === 0;
    prov.events[1].range = { start: 4, end: 7 };
    const bad = auditProvenance(code, prov).byteRanges.misaligned > 0;
    checks.push(["audit detects a one-byte shift", good && bad]);
  } finally { trip.restore(); }
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  if (failed.length) throw new Error("weave-nomodel selftest failed: " + failed.join("; "));
  return { ok: true, checks: checks.length };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
async function main(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i += 1) if (argv[i].startsWith("--")) a[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
  const intent = a.intent;
  if (!intent) { console.error("--intent is required"); process.exit(2); }
  const targets = String(a.targets ?? "1000,2000,4000,8000,12000").split(",").map(Number);
  const out = path.resolve(a.out ?? path.join(os.tmpdir(), "nomodel-" + Date.now()));
  fs.mkdirSync(out, { recursive: true });
  const cacheDir = path.join(out, "cache");
  fs.mkdirSync(cacheDir, { recursive: true });
  const huntMode = String(a.hunt ?? "shim");
  process.env.ER7_HOME = process.env.ER7_HOME ?? a.er7 ?? "/home/user/eoreader7";

  const prose = await import("./nomodel-prose.mjs");
  const shim = huntMode === "shim" ? await prose.startSearchShim({ cacheDir }) : null;
  if (shim) process.env.ER7_SEARCH_URL = shim.url; // the engine reads this at import
  const trip = installTripwire({ cacheDir });
  const { weave } = await import(pathToFileURL(path.join(ROOT, "organs/generation/api.mjs")).href);
  const proseAdapter = (await import(pathToFileURL(path.join(ROOT, "organs/generation/adapters/prose.mjs")).href)).default;
  const artifact = huntMode === "off" ? { ...proseAdapter, kind: "text", hunt: undefined } : "text";
  const field = String(a.field ?? "").split(",").filter(Boolean);
  const baseShadow = await prose.loadField(field);

  const rows = [];
  for (const target of targets) {
    const shadow = new Map(baseShadow); // a fresh copy per run: hunts must not leak between runs
    const { row } = await runOne({
      weave, intent: intent.replace(/\{words\}/g, String(target)), artifact, target, shadow, outDir: path.join(out, "t" + target),
      diagnose: (ctx) => prose.diagnoseProse({ ...ctx, adapter: proseAdapter, fieldKeys: new Set(baseShadow.keys()), intent: intent.replace(/\{words\}/g, String(target)) }),
    });
    rows.push(row);
  }
  // Write what we have BEFORE the heavy step: the rows are the experiment.
  const outFile = path.join(out, "report.json");
  const partial = { schema: "NoModelWeave@1", intent, hunt: huntMode, field, modelDoorCalls: trip.modelDoorCalls().length, anySwatchGrowth: rows.some((r) => r.swatchGrewBytes > 0), rows, network: trip.log.filter((r) => !r.model_door).map((r) => ({ url: r.url.slice(0, 120), cached: r.cached })), searchShim: shim?.log ?? null };
  fs.writeFileSync(outFile, JSON.stringify(partial, null, 2));

  // EVIDENCE CEILING (independent of structure): everything the retained field can
  // supply. Then the hunted pages, kept as READABLE text (what the hunt could keep if
  // it kept more than its 400-byte snip) — but ONLY those the adapter's own relevance
  // gate (relevantSources: >=2 shared content words with the task) would keep.
  // These are bounds, not shipped behavior.
  const o = await prose.loadOrgans();
  const ceiling = { field: await prose.evidenceCeiling({ shadow: baseShadow }) };
  const prior = a["hunted-from"] ? JSON.parse(fs.readFileSync(a["hunted-from"], "utf8")) : null;
  const huntedUrls = [...new Set([...(rows.at(-1)?.diagnosis?.huntedPages ?? []), ...(prior?.rows?.at(-1)?.diagnosis?.huntedPages ?? [])])];
  if (huntedUrls.length) {
    const relevant = new Map(), dropped = [];
    for (const u of huntedUrls) {
      const r = await fetch(u).catch(() => null);
      if (!r?.ok) { dropped.push({ url: u, why: "fetch failed" }); continue; }
      const text = String(o.extractReadable(await r.text()).text ?? "");
      const kept = o.relevantSources(new Map([[u, text]]), intent.replace(/\{words\}/g, ""));
      if (kept.kept.size) relevant.set(u, text); else dropped.push({ url: u, why: "off-topic (relevantSources)", words: words(text) });
    }
    ceiling.huntedPages = huntedUrls.length;
    ceiling.huntedRelevant = [...relevant.keys()];
    ceiling.huntedDropped = dropped;
    if (relevant.size) ceiling.fieldPlusRelevantHunted = await prose.evidenceCeiling({ shadow: new Map([...baseShadow, ...relevant]) });
  }
  const adapterSource = fs.readFileSync(path.join(ROOT, "organs/generation/adapters/prose.mjs"), "utf8");
  ceiling.structure = prose.structuralCap({ units: rows[0].diagnosis?.perUnit ?? [], adapterSource, charsPerWord: ceiling.field?.snipWords ? ceiling.field.snipChars / ceiling.field.snipWords : null });
  if (a.topic && shim) ceiling.topicHunt = await prose.topicHuntCapacity({ topic: String(a.topic), searchUrl: shim.url, intent: intent.replace(/\{words\}/g, ""), pages: Number(a["topic-pages"] ?? 3) });
  const modelDoor = trip.modelDoorCalls().length;
  trip.restore();
  if (shim) await shim.stop();
  const report = { ...partial, modelDoorCalls: modelDoor, ceiling };
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ out, modelDoorCalls: modelDoor, rows: rows.length }, null, 2));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main(process.argv.slice(2));
