// gym/weave-build.mjs — THE REAL BUILD LOOM: Penelope orchestrates, eoreader7
// engines. The seam (GL-00): material crosses only as addressed record.
//
//   node gym/weave-build.mjs --ask "<task>" [--testCommand "<cmd>"] [--out <path>]
//   node gym/weave-build.mjs --class council      (banked class: re-verify live)
//
// Two engine paths, decided by the class (never by the loom's mood):
//   banked — the shape class resolves from the library (organs + feed door +
//            sealed artifact): live bytes fetched through the door, organs run,
//            probe verdict, 0 draws. The mouth is not consulted (GL-LD-04/05).
//   new    — the class is not held: eoreader7's /v1/build is the engine. It
//            plans the independent units, draws each from its own mouth
//            concurrently, assembles and validates mechanically; the
//            testCommand gates. The loom never draws directly — every draw
//            routes through the engine (GL-WV-07).
// Every run appends a swatch row (gym/swatch.jsonl) — the economy is measured,
// never asserted (GL-WV-05).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.dirname(HERE);
const PROXY = "http://127.0.0.1:11436";
const GYM = "http://127.0.0.1:8137";
const SWATCH = path.join(HERE, "swatch.jsonl");

const BANKS = {
  council: {
    class: "council/agenda",
    organs: ["organs/window.mjs (Window@1)", "organs/agenda-shape.mjs (AgendaShape@1)", "organs/detail-fetch.mjs (DetailFetch@1)", "organs/freshness.mjs (Freshness@1)"],
    feedDoor: "/api/council/events",
    artifact: "apps/council.html (+ control + facing + record)",
    probe: "gym/probe-council.mjs (sort + own-sequence on live bytes)",
    standing: "GL-WV-01, GL-WV-06",
  },
};

const swatch = (row) => fs.appendFileSync(SWATCH, JSON.stringify({ schema: "Swatch@1", ts: new Date().toISOString(), ...row }) + "\n");

// ── banked: the library holds the class; verify against live bytes ──
export async function bankedRun(cls) {
  const bank = BANKS[cls];
  if (!bank) return { ok: false, error: `no banked class ${cls} — name one of: ${Object.keys(BANKS).join(", ")}` };
  const { window } = await import(`../organs/window.mjs`);
  const { shapeItems } = await import(`../organs/agenda-shape.mjs`);
  const r = await fetch(GYM + bank.feedDoor, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`feed door HTTP ${r.status}`);
  const events = await r.json();
  const { rows, gaps } = window(events.map((x) => ({ id: x.EventId, body: x.EventBodyName, date: x.EventDate, time: x.EventTime, loc: x.EventLocation })), { dateOf: "date", timeOf: "time", now: Date.now(), n: 8 });
  if (!rows.length) throw new Error("window empty — no upcoming meetings (named gap, nothing invented)");
  const sorted = rows.every((x, i) => i === 0 || rows[i - 1].at <= x.at);
  const ir = await fetch(`${GYM}${bank.feedDoor.replace("/events", "")}/events/${rows[0].rec.id}/items`, { signal: AbortSignal.timeout(20000) });
  const items = await ir.json();
  const shaped = shapeItems(items);
  const inOrder = shaped.rows.every((x, i) => i === 0 || (x.seq ?? Infinity) >= (shaped.rows[i - 1].seq ?? Infinity));
  const verdict = { sorted, agendaOwnOrder: inOrder, windowed: rows.length, gapped: gaps.length, itemGaps: shaped.gaps.length };
  const okVerdict = sorted && inOrder && rows.length > 0;
  swatch({ weave: "banked:" + cls, class: bank.class, engine: "library (organs + feed door)", mouthCalls: 0, mouthBytes: 0, corpusBytes: 0, huntBytes: events.length, boxBytes: 0, verdict: okVerdict ? "pass" : "fail", evidence: "GL-WV-01/06/07" });
  return { ok: okVerdict, class: bank.class, engine: "library (organs + feed door)", artifact: bank.artifact, verdict, probe: bank.probe, mouthCalls: 0, organs: bank.organs, standing: bank.standing };
}

// ── new: the class is not held — eoreader7 is the engine, through the REAL
// pipeline: POST /v1/ask (the plain doorway every surface uses) carries the
// task; the proxy's own build detection routes a discrete multi-unit task to
// buildCodeTask — mechanical decomposition, Gary-shaped concurrent draws,
// assembly, and the testCommand gates. If the gate fails, the loom hands the
// workspace + testCommand to /v1/code — Thea's bounded repair loop (revert +
// grounded failure into the next round, maxRounds) — never a one-shot re-run
// (GL-WV-07, GL-WV-12). Every draw routes through the door, never the loom.
// Thea paces: 429 retry-after is honored with a bounded defer, never spun
// (GL-WV-10).
// ONE IDENTITY (2026-10-01): the loom speaks as penelope, the same person key
// every other door uses — one app, one place in line — and declares its kind
// so Heimdall's fair-share round robin sees the build work as builds.
const HDRS = { "content-type": "application/json", "x-er7-user": "penelope", "x-er7-caller": "penelope-loom", "x-er7-priority": "batch", "x-er7-kind": "build" };
async function pacedPost(url, body, { timeoutMs = 900000, maxDefer = 6 } = {}) {
  for (let d = 0; d < maxDefer; d += 1) {
    const r = await fetch(url, { method: "POST", headers: HDRS, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
    if (r.status === 429) {
      const wait = Math.min(120000, (Number(r.headers.get("retry-after")) || 20) * 1000);
      await new Promise((res) => setTimeout(res, wait)); // Thea: defer, never spin
      continue;
    }
    return r;
  }
  return new Response(JSON.stringify({ error: "the box stayed busy past the defer budget — Thea says pace, retry later" }), { status: 429 });
}

// ── THE BUILD STREAM (GL-EN-17): /v1/ask streams the build as it works when
// the door supports it (`buildStream: true` — NDJSON event lines, then the
// result). An older door answers plain JSON and the trace prints from the
// provenance instead, as before. The consumer is exported so the wall can
// feed it a fake stream with no proxy, no model.
export function humanBuildEvent(e) {
  switch (e.event) {
    case "units": return `    units: ${(e.units ?? []).join(", ")}`;
    case "box": return `    ${e.unit} ← box (computed${e.shape ? `, ${e.shape}` : ""}, ${e.bytes} B)`;
    case "draw:start": return `    ${e.unit} — drawing (${e.model})…`;
    case "draw:done": return e.error ? `    ${e.unit} — draw failed: ${String(e.error).slice(0, 100)}` : `    ${e.unit} — draw returned (${e.tokens ?? 0} tok)`;
    case "mouth": return `    ${e.unit} ← mouth (${e.bytes} B)`;
    case "gap": return `    ${e.unit} — gap: ${String(e.error ?? "nothing extractable").slice(0, 100)}`;
    case "verify": return `    verify: ${e.verified === true ? "passed" : e.verified === "syntax_only" ? "syntax only (no test given)" : "FAILED"}`;
    case "refuse": return `    refused: ${String(e.error ?? "").slice(0, 120)}`;
    case "seal": return `    seal: ${e.bytes} B, ${e.draws} draw(s), box ${e.boxBytes ?? 0} B + mouth ${e.mouthBytes ?? 0} B`;
    default: return `    · ${e.event}`;
  }
}

export async function consumeBuildStream(res) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let build = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let e;
      try { e = JSON.parse(line); } catch { continue; }
      if (e.type === "event") console.log(humanBuildEvent(e));
      else if (e.type === "result" || e.type === "refused") build = e;
    }
  }
  return build ?? { ok: false, error: "the build stream ended without a result — a named gap, never a silent success" };
}

export async function engineRun({ ask, testCommand, out, model }) {
  // The seam is an address (GL-BD-10): a relative --out is resolved by the
  // PROXY's own cwd, never Penelope's. Resolve here, against the ROOT, so the
  // write lands where the loom can seal it and the remedy's workspace exists.
  const absOut = out ? path.resolve(ROOT, out) : null;
  // The gate's argv is part of the testCommand (GL-BD-11): buildCodeTask runs
  // execSync(testCommand) with NO argv, and the house gates read the module at
  // process.argv[2]. Compose the absolute module path in when it is absent, and
  // resolve a relative `node <script>` against the ROOT — buildCodeTask runs
  // from the PROXY's cwd and the remedy from its own workspace, neither of
  // which can see a penelope-root-relative script.
  const withOutArg = (cmd) => {
    let s = String(cmd ?? "").trim();
    if (!s || !absOut) return s;
    // any declared interpreter — node, python3, ... the script resolves against
    // the ROOT (buildCodeTask runs from the PROXY's cwd, the remedy from its
    // own workspace; neither sees a penelope-root-relative script), and the
    // module path rides last (GL-BD-11, generalized across medium).
    const m = /^(node|nodejs|python3|python)\s+(\S+)/i.exec(s);
    if (m && !m[2].startsWith("/")) s = `${m[1]} ${JSON.stringify(path.resolve(ROOT, m[2]))}${s.slice(m[0].length)}`;
    if (s.includes(absOut)) return s;
    return `${s} ${JSON.stringify(absOut)}`;
  };
  const gate = withOutArg(testCommand);
  // The build mouth is MEASURED, never assumed (GL-BD-09): with the fenced JS
  // completion anchor, gemma2:2b holds JS on the resident box (3/3 probed);
  // qwen2.5-coder:1.5b answered the same anchor with prose-Python every time.
  // The operator may still name a model; the standing default is the mouth
  // that held the anchor.
  const buildModel = model ?? "gemma2:2b";
  const buildRes = await pacedPost(`${PROXY}/v1/ask`, { task: ask, testCommand: gate || null, out: absOut, model: buildModel, buildStream: true });
  const streamed = String(buildRes.headers.get("content-type") ?? "").includes("application/x-ndjson");
  const build = streamed ? await consumeBuildStream(buildRes) : await buildRes.json();
  let j = build;
  if (build.kind !== "mechanical-code-build") {
    swatch({ weave: "engine:" + String(ask).slice(0, 40), class: "new (engine-held)", engine: "eoreader7 /v1/ask (build refused)", model: buildModel, mouthCalls: 0, mouthBytes: 0, corpusBytes: 0, huntBytes: 0, boxBytes: 0, verdict: build.error ? "refused (named gap)" : "turn", evidence: "GL-WV-07/08, GL-BD-09" });
    return { ok: false, error: build.error ?? `the door answered a turn, not a build (kind ${build.kind ?? "?"}) — ${String(build.answer ?? "").slice(0, 200)}` };
  }
  const mouthCalls = build.draws ?? 0;
  // The provenance is the economy's own record (GL-BD-12): a priori units the
  // box computed (boxBytes) versus the irreducible residue the mouth drew
  // (mouthBytes). The swatch must equal it, never assert its own numbers.
  const prov = Array.isArray(build.provenance) ? build.provenance : [];
  const boxBytes = prov.filter((p) => p.source === "box").reduce((a, p) => a + (p.bytes ?? 0), 0);
  const mouthBytes = prov.filter((p) => p.source === "mouth").reduce((a, p) => a + (p.bytes ?? 0), 0);
  // THE TRACE, WITHOUT A MODEL CALL (GL-EN-17): the per-unit provenance is
  // the readable trace — printed here and sealed into the facing holograph +
  // an NDJSON file. Its control: the per-unit sums must equal the ENGINE's own
  // reported box/mouth totals (never the loom's restatement of them).
  const traceRows = prov.map((p) => ({ unit: p.unit, source: p.source, bytes: p.bytes ?? 0, ...(p.shape ? { shape: p.shape } : {}), ...(p.lang ? { lang: p.lang } : {}) }));
  const boxSum = traceRows.filter((r) => r.source === "box").reduce((a, r) => a + r.bytes, 0);
  const mouthSum = traceRows.filter((r) => r.source === "mouth").reduce((a, r) => a + r.bytes, 0);
  const hasTotals = Number.isFinite(build.boxBytes) && Number.isFinite(build.mouthBytes);
  const traceCheck = {
    ok: hasTotals ? boxSum === build.boxBytes && mouthSum === build.mouthBytes : traceRows.length > 0,
    detail: `box ${boxSum}${hasTotals ? `/${build.boxBytes}` : ""} B · mouth ${mouthSum}${hasTotals ? `/${build.mouthBytes}` : ""} B`,
  };
  if (!traceCheck.ok) console.error(`[weave] TRACE RECONCILE FAILED: ${traceCheck.detail} — the trace is decoration (GL-EN-17)`);
  if (traceRows.length && !streamed) {
    console.log(`  provenance (per unit — the trace, no model call):`);
    for (const r of traceRows) console.log(`    ${r.unit} ← ${r.source} (${r.bytes} B${r.shape ? `, ${r.shape}` : ""})`);
  }
  // Thea's remedy: a gate that fails is handed to the bounded loop, not re-run.
  if (build.verified !== true && absOut && gate) {
    const remedy = await (await pacedPost(`${PROXY}/v1/code`, {
      task: `${ask}. The gate failed: ${String(build.verifyError ?? "").slice(0, 400)}. Make the testCommand pass.`,
      workspace: path.dirname(absOut), testCommand: gate, model: model ?? "gemma2:2b", maxRounds: 3,
    })).json();
    const finalCode = fs.existsSync(absOut) ? fs.readFileSync(absOut, "utf8") : (remedy.code ?? build.code ?? "");
    const remedyDraws = Array.isArray(remedy.rounds) ? remedy.rounds.length : (remedy.draws ?? 0);
    swatch({ weave: "engine:" + (build.units ?? []).join("+") + "+remedy", class: "new (engine-held)", engine: "eoreader7 /v1/ask → /v1/code (Thea's loop)", model: buildModel, mouthCalls: mouthCalls + remedyDraws, mouthBytes: mouthBytes + (remedy.code?.length ?? 0), corpusBytes: 0, huntBytes: 0, boxBytes, verdict: remedy.done ? "pass (remedy loop)" : String(remedy.error ?? "budget spent"), trace: traceCheck.ok ? "reconciled" : "FAILED", evidence: "GL-WV-07/10/12" });
    return { ok: !!remedy.done, engine: "eoreader7 /v1/ask → /v1/code (Thea's loop)", units: build.units ?? [], draws: mouthCalls + remedyDraws, mouthCalls, boxUnits: build.boxUnits ?? [], boxBytes, mouthBytes, verified: !!remedy.done, remedy: remedy.done ? "loop converged" : String(remedy.error ?? remedy.status ?? "budget spent"), out: absOut, code: finalCode, disclosure: build.disclosure ?? null, trace: traceRows, traceCheck };
  }
  swatch({ weave: "engine:" + (build.units ?? []).join("+"), class: "new (engine-held)", engine: "eoreader7 /v1/ask → buildCodeTask", model: buildModel, mouthCalls, mouthBytes, corpusBytes: 0, huntBytes: 0, boxBytes, verdict: build.verified === true ? "pass (testCommand)" : String(build.verified ?? "unverified"), trace: traceCheck.ok ? "reconciled" : "FAILED", evidence: "GL-WV-07/08/09" });
  return { ok: build.verified === true, engine: "eoreader7 /v1/ask → buildCodeTask", units: build.units ?? [], draws: mouthCalls, mouthCalls, boxUnits: build.boxUnits ?? [], boxBytes, mouthBytes, tokens: build.tokens ?? 0, verified: build.verified ?? null, verifyError: build.verifyError ?? null, out: absOut, code: build.code ?? null, provenance: prov, disclosure: build.disclosure ?? null, trace: traceRows, traceCheck };
}

export async function runWeave({ ask, testCommand, out, banked, model, html, sel, image, attachment }) {
  // explicit class overrides the resolver; otherwise the closed cube routes
  if (banked === "html:snip") return seal(await htmlSnipRun({ html, sel }));
  if (banked === "image:page") return seal(await imagePageRun({ image }));
  if (banked) return seal(await bankedRun(banked));
  if (!ask) return { ok: false, error: "an ask (or --class council / html:snip / image:page) is required" };
  const { classify } = await import(`../organs/resolver.mjs`);
  const { cell, route } = classify(ask, { attachment });
  const base = { cell, route: route.route, executor: route.executor ?? null, gap: route.gap ?? null };
  let res;
  if (route.route === "void") res = { ok: false, ...base, error: route.gap };
  else if (route.route === "measure") res = await imagePageRun({ image });
  else if (route.route === "box" && route.executor === "html:snip") res = await htmlSnipRun({ html, sel });
  else if (route.route === "box" && route.executor === "feed") res = await bankedRun("council");
  else res = await engineRun({ ask, testCommand, out, model });
  return seal({ ...base, ...res });
}

// The holograph of the run: SOURCES (addressed bytes), RESPONSE (the artifact,
// tagged), NOTES (verdict, standing, falsifier) — no cloth without the ledger.
export function seal(result) {
  const slug = "weave-" + Date.now();
  const src = [];
  if (result.image) src.push({ ref: "image", addr: result.image, bytes: result.chars ?? null });
  if (result.start != null) src.push({ ref: "snip", addr: `html bytes ${result.start}..${result.end}`, bytes: result.bytes });
  if (result.class === "council/agenda" || result.class?.includes("feed")) src.push({ ref: "feed", addr: "webapi.legistar.com/v1/nashville/Events (via the gym door)", bytes: result.verdict?.windowed ?? null });
  if (result.engine) src.push({ ref: "engine", addr: result.engine });
  const response = result.ok
    ? (result.html ?? result.fragment ?? result.code ?? "assembled") .slice(0, 4000)
    : String(result.error ?? result.gap ?? "failed");
  const notes = [
    `route: ${result.route ?? result.class ?? "?"} · executor: ${result.executor ?? "box/engine"} · cell: ${result.cell ? JSON.stringify(result.cell) : "?"}`,
    `mouthCalls: ${result.mouthCalls ?? result.draws ?? 0} · verdict: ${result.verified ?? (result.ok ? "pass" : "fail")}`,
    result.standing ? `standing: ${result.standing}` : null,
    `falsifier: the swatch must equal this run's EOT provenance (mouth bytes vs measured/box bytes), never asserted`,
  ].filter(Boolean);
  // THE RUN'S TRACE (GL-EN-17): the per-unit provenance sealed beside the
  // holograph — the same events, no model call. A trace that failed
  // reconciliation is named, never smoothed.
  let traceFile = null;
  if (Array.isArray(result.trace) && result.trace.length) {
    traceFile = path.join(ROOT, "apps", "weaves", `${slug}.trace.jsonl`);
    fs.writeFileSync(traceFile, result.trace.map((r) => JSON.stringify({ schema: "GenerationTrace@1", ts: new Date().toISOString(), run: slug, event: "unit", ...r })).join("\n") + "\n");
    notes.push(`trace: ${result.trace.length} unit(s) → ${path.basename(traceFile)}${result.traceCheck ? ` (${result.traceCheck.ok ? "reconciled" : "RECONCILE FAILED: " + result.traceCheck.detail})` : ""}`);
    for (const r of result.trace) notes.push(`  ${r.unit} ← ${r.source} (${r.bytes} B${r.shape ? `, ${r.shape}` : ""})`);
  }
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const facing = `<!doctype html><meta charset="utf-8"><title>holograph ${slug}</title>
<style>body{font:14px/1.5 ui-monospace,Menlo,monospace;max-width:760px;margin:0 auto;padding:24px;background:#faf7f0;color:#241d15}h1{font-size:17px}.src{border-left:3px solid #7a6a4f;padding:4px 10px;margin:6px 0;background:#f1eadb;color:#4a3f2a}.resp{white-space:pre-wrap;border:1px solid #c9bda0;border-radius:6px;padding:12px;background:#fff}.tag{color:#8a2f2f;font-weight:700}.note{color:#5b4a2f;margin:4px 0}</style>
<h1>◇ holograph — ${esc(slug)}</h1>
<h2>SOURCES</h2>${src.length ? src.map((s) => `<div class="src">[S#] <b>${esc(s.ref)}</b> @ ${esc(s.addr)} · ${s.bytes != null ? s.bytes + " bytes" : "addressed"}</div>`).join("") : `<div class="src">(none — box-computed, no external bytes)</div>`}
<h2>RESPONSE</h2><div class="resp">${esc(response)}</div>
<h2>NOTES</h2>${notes.map((n) => `<div class="note">· ${esc(n)}</div>`).join("")}`;
  const p = path.join(ROOT, "apps", "weaves", `${slug}-facing.html`);
  fs.writeFileSync(p, facing);
  return { ...result, holograph: p, slug, traceFile };
}

// ── html:snip — reuse the markup that already exists, never regenerate it ──
export async function htmlSnipRun({ html, sel }) {
  const { snip } = await import(`../organs/html-snip.mjs`);
  const selObj = {};
  if (String(sel ?? "").startsWith("#")) selObj.id = sel.slice(1);
  else if (String(sel ?? "").startsWith(".")) selObj.cls = sel.slice(1);
  else if (sel && /^\d+$/.test(String(sel))) selObj.at = Number(sel);
  else if (sel) selObj.name = sel;
  const r = snip(String(html ?? ""), selObj);
  if (!r.ok) return { ok: false, class: "html:snip", gap: r.gap };
  swatch({ weave: "snip:" + r.name, class: "html:snip", engine: "box (organs/html-snip.mjs)", mouthCalls: 0, mouthBytes: 0, corpusBytes: r.bytes, huntBytes: 0, boxBytes: 0, verdict: "pass", evidence: "GL-WV-13" });
  return { ok: true, class: "html:snip", fragment: r.fragment, start: r.start, end: r.end, bytes: r.bytes, name: r.name, mouthCalls: 0 };
}

// ── image:page — measure the image (look.js, tesseract, no model) → HTML ──
// Referenced at source (GL-OG-07: coupled organs are read at home, never
// copied): look.js is the merged eye. The mechanical OCR path runs on this
// box (tesseract present); the region-structure path needs VISUAL_DETECT_PYTHON
// or the unmerged screenshot pipeline — disclosed, never faked (GL-IM-01/05).
export async function imagePageRun({ image }) {
  if (!image) return { ok: false, error: "image:page needs an image path" };
  // THE MEASURED SCREEN READ FIRST (GL-IM-01): eoreader7's screenshot pipeline
  // (adapters/image/screen-read.js -> screen-sidecar.js) reads the pixels into a
  // measured model — flat regions, rules, image regions, OCR text — with NO
  // vision model (ffmpeg + tesseract), and htmlOf regenerates the page from that
  // model. This is the structure the OCR-only path below cannot see. Falls back
  // to OCR only when the image is not a screen (the gate's own number named).
  const ER7 = process.env.ER7_HOME || path.resolve(HERE, "..", "..", "eoreader7");
  let notScreen = null;
  try {
    const { lookAtScreen } = await import(pathToFileURL(path.join(ER7, "native/organs/look-screen.js")).href);
    const { htmlOf } = await import(pathToFileURL(path.join(ER7, "native/adapters/image/screen-sidecar.js")).href);
    const r = await lookAtScreen(image, { name: path.basename(image) });
    if (r.screen) {
      const page = htmlOf(r.sidecar, { mode: "flex", title: "measured page" });
      swatch({ weave: "image:" + String(image).slice(-24), class: "image:page", engine: "box (screen-read.js -> htmlOf, no vision model)", mouthCalls: 0, mouthBytes: 0, corpusBytes: 0, huntBytes: 0, boxBytes: page.length, verdict: "pass", evidence: "GL-IM-01, GL-WV-13" });
      return {
        ok: true, class: "image:page", html: page, standing: r.standing, mouthCalls: 0, measured: true,
        elements: r.sidecar.elements.length, tokens: { background: r.sidecar.tokens.background?.hex, accent: r.sidecar.tokens.accent?.hex },
        gaps: (r.sidecar.gaps ?? []).map((g) => g.kind),
      };
    }
    notScreen = r.reason + (r.gate ? ` (flatShare ${r.gate.flatShare} < floor ${r.gate.floor})` : "") + (r.detail ? `: ${String(r.detail).slice(0, 100)}` : "");
  } catch (e) {
    notScreen = `screen pipeline unavailable: ${String(e.message).slice(0, 100)}`;
  }
  // FALLBACK: not a measured screen — OCR text only, the reason named, never silent.
  const LOOK = process.env.ER7_HOME ? `${process.env.ER7_HOME}/native/organs/look.js` : decodeURIComponent(new URL("../../khora/native/organs/look.js", import.meta.url).pathname);
  let look = null;
  try { look = await import(LOOK); } catch (e) { return { ok: false, error: `look.js not loadable: ${String(e.message).slice(0, 120)}` }; }
  let text;
  try { text = look.ocrFullImage(image); } catch (e) { return { ok: false, error: `OCR failed (${String(e.message).slice(0, 120)})` }; }
  const paras = String(text ?? "").split(/\n{2,}/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const regionNote = `not read as a screen (${notScreen ?? "unknown"}) — OCR-measured text only`;
  const page = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>measured page</title>
<style>body{font:16px/1.55 system-ui,serif;max-width:720px;margin:0 auto;padding:24px} .note{font:12px monospace;color:#666;border-top:1px solid #ccc;margin-top:20px;padding-top:8px}</style>
<main>${paras.length ? paras.map((p) => `<p>${esc(p)}</p>`).join("\n") : `<p>(no measurable text — unread is a gap, not a guess)</p>`}</main>
<div class="note">measured from ${esc(image)} · ${esc(regionNote)} · one witness, not applied as fact (GL-IM-03)</div>`;
  swatch({ weave: "image:" + String(image).slice(-24), class: "image:page", engine: "box (look.js ocrFullImage, tesseract)", mouthCalls: 0, mouthBytes: 0, corpusBytes: text.length, huntBytes: 0, boxBytes: page.length, verdict: paras.length ? "pass" : "gap", evidence: "GL-WV-13, GL-IM-01" });
  return { ok: true, class: "image:page", html: page, words: paras.length, chars: text.length, standing: regionNote, mouthCalls: 0, measured: false };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
  const res = await runWeave({ ask: opt("--ask"), testCommand: opt("--testCommand"), out: opt("--out"), banked: opt("--class"), model: opt("--model") });
  console.log(JSON.stringify(res, null, 1));
  process.exit(res.ok ? 0 : 1);
}