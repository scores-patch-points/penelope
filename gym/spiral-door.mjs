#!/usr/bin/env node
// gym/spiral-door.mjs — THE SPINE DOOR (2026-10-10).
//
// The thin client's door into the machine spine that gym/spiral-proof.mjs
// proved: a build is arrange() over the widget adapter (field first, box
// holds the residue), every act is judged by the cube-tied behavioral judge
// with box-settled wants, and an EDIT is one patch claim appended to the
// session's program log — re-projected, re-judged, never a rewrite.
//
// Doors (local, CORS-open — a local page is the client):
//   POST /v1/widget/build  { task }   -> { ok, session, html, verdict,
//                                          cells, log, refusals }
//   POST /v1/widget/edit   { session, edit }
//                                     -> the same shape after the ONE-unit
//                                        patch; a transform the box cannot
//                                        settle is a typed refusal, never a
//                                        mouth call.
//   GET  /health
//
// The task registry is MECHANICAL (the reason-gate's mechanical lane): known
// widget families declare their factor; an unknown task is a typed gap, never
// a draw. The formatter, when the real base holds it, is SNIPPED from
// the-fold/fold-blocks.js and frame-probed (formatValue(5,"money") → "£5.00").
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { arrange } from "../organs/generation/engine.mjs";
import { adapter as widget, factorCode } from "../organs/generation/adapters/widget.mjs";
import { judgePage, wantOf } from "../organs/behavior-check.mjs";
import { append, readLog, materialize, projectTo } from "../organs/generation/program.mjs";
import { murmurOver } from "../../Zenodotus/derived-priors/code-pattern-priors/murmur.mjs";
import { passAesthetics, steerOf, STACK } from "../organs/generation/pass-aesthetics.mjs";
import { execFileSync } from "node:child_process";
import { snipFunction } from "../organs/generation/repair.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PENELOPE = path.resolve(HERE, "..");
const V3 = path.resolve(PENELOPE, "..");
const PORT = Number(process.env.SPINE_PORT ?? 8878);
const SESSIONS = path.join(os.tmpdir(), "pen-spine");
fs.mkdirSync(SESSIONS, { recursive: true });

// ── the mechanical task registry (the box holds what it can) ──
const TASKS = [
  { re: /tip calculator/, F: { name: "tipAmount", expr: "bill*pct/100", args: ["bill", "pct"], title: "Tip calculator", format: "money", labels: { bill: "Bill", pct: "Tip %" }, start: { bill: 100, pct: 20 }, examples: [[100, 20], [50, 15]] } },
  { re: /bill splitter|split( the| this)? bill|per person/, F: { name: "perPerson", expr: "total*(1+tip/100)/people", args: ["total", "tip", "people"], title: "Bill splitter", format: "money", labels: { total: "Bill", tip: "Tip %", people: "People" }, start: { total: 100, tip: 20, people: 4 }, examples: [[100, 20, 4], [200, 15, 5]] } },
  { re: /bmi|body mass index/, F: { name: "bmi", expr: "kg/(m*m)", args: ["kg", "m"], title: "BMI calculator", format: "number", labels: { kg: "Weight (kg)", m: "Height (m)" }, start: { kg: 70, m: 1.75 }, examples: [[70, 1.75], [90, 1.8]] } },
];
const taskFor = (t) => TASKS.find((x) => x.re.test(t))?.F ?? null;
const wantsOf = (F, expr) => F.examples.map((args) => ({ fn: F.name, args, compute: { expression: expr, bind: Object.fromEntries(F.args.map((a, i) => [a, args[i]])) } }));
const judgeArgs = (F, expr) => ({ needs: [F.name], cases: wantsOf(F, expr), wiring: true });

// the real formatter, snipped and frame-probed (by frame, never by name)
function formatterOf() {
  try {
    const src = fs.readFileSync(path.join(V3, "the-fold", "fold-blocks.js"), "utf8");
    const atom = snipFunction(src, "formatValue")?.replace(/^export\s+/, "");
    if (atom && new Function(`return (${atom});`)()(5, "money") === "£5.00") {
      return { name: "formatValue", code: atom, address: `the-fold/fold-blocks.js#${src.indexOf(atom)}` };
    }
  } catch { /* the snip is optional; the widget stands on the box formatter */ }
  return null;
}
const FORMATTER = formatterOf();

async function build(task) {
  const F = taskFor(task);
  if (!F) return { ok: false, reason: "the box does not hold this task's factor — a named gap, never a draw", typed: "no-task-factor" };
  const session = "sp-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const logPath = path.join(SESSIONS, session + ".log.jsonl");
  const ctx = { factor: F, formatter: FORMATTER, factorHunt: null };
  const r = await arrange({ task, args: { out: path.join(SESSIONS, "out-" + session) }, adapter: widget, context: ctx });
  const est = passAesthetics(r.html); // THE DEFAULT PASS — tokens from the prior, the judge still decides
  append(logPath, { seq: 0, kind: "file", path: "widget.html", code: est, source: FORMATTER ? "box+field" : "box", address: `box:${F.expr}` });
  const j = judgePage(est, judgeArgs(F, F.expr));
  append(logPath, { seq: 1, kind: "test", command: "judgePage (wiring, box wants)", ok: j.ok, output: j.ok ? "holds" : j.findings.map((f) => f.detail).join("; ") });
  if (!j.ok) return { ok: false, reason: j.findings.map((f) => f.detail).join("; "), session, typed: "build-refused" };
  return respond(logPath, est, session);
}
async function edit(session, editText) {
  const logPath = path.join(SESSIONS, session + ".log.jsonl");
  if (!fs.existsSync(logPath)) return { ok: false, reason: "no such session — the machine has no record of this widget", typed: "no-session" };
  const proj = materialize(readLog(logPath));
  const html = proj.files["widget.html"] ?? "";
  const steer = steerOf(editText);
  if (steer) {
    const repassed = passAesthetics(html, { steer });
    const FF = TASKS.find((t) => t.F.expr === (readLog(logPath).find((c) => c.kind === "file")?.address ?? "box:").slice(4))?.F ?? null;
    if (FF) { const jj = judgePage(repassed, judgeArgs(FF, (readLog(logPath).find((c) => c.kind === "file")?.address ?? "box:").slice(4))); append(logPath, { seq: readLog(logPath).length, kind: "test", command: "aesthetic re-pass", ok: jj.ok, output: `re-pass ${steer} — verdict ${jj.ok ? "held" : "refused"}` }); }
    return respond(logPath, repassed, session);
  }
  // the factor's current expression, read from the record's own claim
  const fileClaim = readLog(logPath).find((c) => c.kind === "file");
  if (!fileClaim?.address || !fileClaim.address.startsWith("box:")) return { ok: false, reason: "the record does not name the factor the box holds", typed: "no-factor-record" };
  const E = fileClaim.address.slice(4);
  if (!html.includes(E)) return { ok: false, reason: "the factor's bytes are not in the projection — the edit cannot find its anchor", typed: "anchor-absent" };
  // THE MECHANICAL TRANSFORM (never the mouth): a declared fee, expressed over the current factor
  const fee = /(?:service fee|fee) of (\d+(?:\.\d+)?)%/.exec(editText) || /add a (\d+(?:\.\d+)?)% (?:service )?fee/.exec(editText);
  let patch = null;
  if (fee) patch = { kind: "patch", path: "widget.html", find: E, add: `(${E})*(1+${Number(fee[1]) / 100})`, source: "box", reason: `fee transform: +${fee[1]}%` };
  if (!patch) return { ok: false, reason: `the box does not hold an edit named "${editText.slice(0, 60)}" — a named gap, never a mouth call`, typed: "edit-unsettleable" };
  patch.seq = readLog(logPath).length;
  append(logPath, patch);
  projectTo(logPath, SESSIONS);
  // re-derive the factor family from the ORIGINAL task registry (the session's task is the first file claim's source)
  const F = TASKS.find((t) => t.F.expr === E)?.F ?? null;
  if (!F) return { ok: false, reason: "task family lost", typed: "no-family" };
  const newE = patch.add;
  const j = judgePage(fs.readFileSync(path.join(SESSIONS, "widget.html"), "utf8"), judgeArgs(F, newE));
  append(logPath, { seq: readLog(logPath).length, kind: "test", command: "judgePage after edit", ok: j.ok, output: j.ok ? "holds against the edited contract" : j.findings.map((f) => f.detail).join("; ") });
  const now = fs.readFileSync(path.join(SESSIONS, "widget.html"), "utf8");
  return respond(logPath, now, session);
}
function importRepo(url) {
  const dir = path.join(os.tmpdir(), "pen-repo-" + Date.now().toString(36));
  fs.mkdirSync(dir, { recursive: true });
  try { execFileSync("git", ["clone", "--depth", "1", "--", url, dir], { timeout: 90000, stdio: "pipe" }); }
  catch (e) { return { ok: false, typed: "clone-failed", reason: String(e.message ?? e).slice(0, 140) }; }
  const files = {};
  const text = new Set([".js", ".mjs", ".ts", ".json", ".md", ".css", ".html", ".txt", ".py", ".yml", ".yaml", ".sh"]);
  const walk = (d) => { let es; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/^\.|node_modules/.test(e.name)) walk(p); }
      else { const ext = path.extname(e.name); if (!text.has(ext) || fs.statSync(p).size > 400000) continue; const rel = path.relative(dir, p); try { files[rel] = fs.readFileSync(p, "utf8"); } catch {} } } };
  walk(dir); fs.rmSync(dir, { recursive: true, force: true });
  if (!Object.keys(files).length) return { ok: false, typed: "nothing-text", reason: "clone fetched but no text files of our kinds" };
  return { ok: true, origin: url, files, note: "shallow clone, bounded to text files, this machine fetched it — the tab stayed thin" };
}
function respond(logPath, html, session) {
  const claims = readLog(logPath);
  const proj = materialize(claims);
  const cells = [];
  const j = judgePage(html, judgeArgs(TASKS.find((t) => t.F.expr === (claims.find((c) => c.kind === "file")?.address ?? "box:").slice(4))?.F, (claims.find((c) => c.kind === "file")?.address ?? "box:").slice(4)));
  for (const o of j.observations) { const k = `${o.cell.op}·${o.cell.grain} ${o.cell.terrain} · ${o.cell.stance}`; cells.push(k); }
  const factorEntry = TASKS.find((t) => t.F.expr === (claims.find((c) => c.kind === "file")?.address ?? "box:").slice(4))?.F ?? null;
  let whispers = [];
  if (factorEntry) {
    const expr = (claims.find((c) => c.kind === "file")?.address ?? "box:").slice(4);
    whispers = murmurOver([
      { unit: factorEntry.name, kind: "prior", code: factorCode(factorEntry), samples: wantsOf(factorEntry, expr).map((c) => ({ args: c.args, want: wantOf(c.compute).value })), address: "box:" + expr },
      { unit: "formatValue", kind: "frame", code: FORMATTER?.code ?? "", samples: [{ args: [5, "money"], want: "£5.00" }], address: FORMATTER?.address ?? "the-fold/fold-blocks.js#formatValue" },
    ]).whispers;
  }
  return {
    ok: (proj.verdict?.ok ?? false), session, typed: "ok", whispers,
    html, cells: [...new Set(cells)],
    log: claims.map((c) => ({ kind: c.kind, ok: c.ok ?? null, reason: c.reason ?? c.output ?? null, source: c.source ?? null, address: c.address ?? null, model: c.model ?? null })),
    refusals: proj.refusals, verdict: proj.verdict?.ok ? true : false,
  };
}

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" };
const send = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json", ...CORS }); res.end(JSON.stringify(obj)); };
http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { status: "ok", spine: "penelope", sessions: fs.readdirSync(SESSIONS).length });
  if (req.method === "POST" && req.url === "/v1/import-repo") {
    let body = ""; for await (const c of req) body += c;
    const url = String((JSON.parse(body || "{}").url ?? "").trim());
    if (!/^https?:\/\//.test(url)) return send(res, 400, { ok: false, typed: "bad-repo-url", reason: "only https repo links" });
    const back = await importRepo(url);
    return send(res, 200, back);
  }
  if (req.method === "POST" && req.url === "/v1/widget/build") {
    let body = ""; for await (const c of req) body += c;
    try { return send(res, 200, await build(JSON.parse(body || "{}").task ?? "")); } catch (e) { return send(res, 500, { ok: false, typed: "door-error", reason: String(e?.message ?? e) }); }
  }
  if (req.method === "POST" && req.url === "/v1/widget/edit") {
    let body = ""; for await (const c of req) body += c;
    const b = JSON.parse(body || "{}");
    try { return send(res, 200, await edit(String(b.session ?? ""), String(b.edit ?? ""))); } catch (e) { return send(res, 500, { ok: false, typed: "door-error", reason: String(e?.message ?? e) }); }
  }
  return send(res, 404, { ok: false, typed: "no-route", reason: req.method + " " + req.url });
}).listen(PORT, () => console.log(`spine door: http://127.0.0.1:${PORT}/ (penelope organs, sessions ${SESSIONS})`));