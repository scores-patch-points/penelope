// text-verdicts-run.test.mjs — the runner as a separate process over a REAL pharos log (the khora entries are frozen fixtures, copied in as khora's own file). Skips with the typed `pharos-absent`
// reason when no pharos checkout is reachable (organs/kernel-reach.mjs); a last arm needs khora's reader of verdicts too and skips `khora-absent`. Pins: door off exits 1; one pass weaves the
// verdicts the rules give at the contract's kinds, cells and addresses; a second pass adds nothing; a newer nomination is a REVISION that names what it revises; a nomination the rule
// stops supporting is RETRACTED (the older verdict must not come back); khora's own readVerdicts applies them (effective.source === "verdict") when its checkout is there.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { kernelFile, KernelAbsentError } from "../organs/kernel-reach.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.join(HERE, "text-verdicts-run.mjs"), FIX = path.join(HERE, "..", "organs", "fixtures");
let LIB = null, why = null;
try { LIB = kernelFile("pharos", "lib/pharos.mjs"); } catch (e) { why = e instanceof KernelAbsentError ? e.code : String(e?.message ?? e); }
const skip = LIB ? false : `${why}: set PHAROS_HOME or place a pharos checkout beside penelope`;
const P = LIB ? await import(pathToFileURL(LIB).href) : null;

function world(fixture) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "text-verdicts-run-")), logDir = path.join(d, "log"); fs.mkdirSync(logDir);
  fs.copyFileSync(path.join(FIX, fixture), path.join(logDir, "khora.jsonl"));
  const ptr = path.join(d, "pharos.json"); fs.writeFileSync(ptr, JSON.stringify({ lib: LIB, sha256: crypto.createHash("sha256").update(fs.readFileSync(LIB)).digest("hex") }));
  const env = { ...process.env, PENELOPE_PHAROS_JSON: ptr, PHAROS: logDir, PHAROS_LOG: "fold", PHAROS_HOME: path.dirname(path.dirname(LIB)) };
  const run = (extraEnv = {}) => { const r = spawnSync(process.execPath, [RUNNER, "--json"], { env: { ...env, ...extraEnv }, encoding: "utf8" }); let json = null; try { json = JSON.parse(r.stdout); } catch { /* not json */ } return { code: r.status, err: r.stderr, json }; };
  const open = (writer) => P.open("fold", { dir: logDir, writer, frame: false });
  const kind = (k) => P.fold(open("reader"), { kind: k }).entries ?? [];
  const current = (k) => P.current(open("reader"), { kind: k }) ?? [];
  return { d, logDir, env, run, open, kind, current, ptr };
}

test("the door off: no pointer, nothing read or written, exit 1", { skip }, () => {
  const w = world("khora-framed-doc.fixture.jsonl");
  const r = spawnSync(process.execPath, [RUNNER], { env: { ...w.env, PENELOPE_PHAROS_JSON: path.join(w.d, "absent.json") }, encoding: "utf8" });
  assert.equal(r.status, 1); assert.match(r.stderr, /door is off/); assert.equal(fs.existsSync(path.join(w.logDir, "penelope.jsonl")), false);
});

test("frames: one pass weaves EVA·Figure frame-verdicts at frames:<sha16>#<i>, `of` the nomination, never at a null frame; a second pass adds nothing", { skip }, () => {
  const w = world("khora-framed-doc.fixture.jsonl"), nom = w.kind("text-frames")[0];
  const a = w.run(); assert.equal(a.code, 0, a.err);
  const vs = w.kind("frame-verdict"), n = nom.body.frames.filter((f) => f.reported !== null).length;
  assert.equal(a.json.woven, n); assert.equal(vs.length, n);
  for (const v of vs) { assert.equal(v.cell, "EVA·Figure"); assert.equal(v.by, "penelope"); assert.deepEqual(v.of, [nom.id]); assert.ok(v.addr.startsWith(`${nom.addr}#`)); assert.equal(v.body.reported, nom.body.frames[v.body.index].reported); }
  assert.equal(w.kind("kind").filter((k) => k.body.name === "frame-verdict").length, 1, "declared once");
  assert.ok(a.json.evaluations.some((e) => e.gap === "codec_disagrees"), "the codec disagreement is reported");
  assert.deepEqual(a.json.abstained.map((x) => x.kind), ["text-quotes"]);
  assert.equal(w.kind("quote-verdict").length, 0, "agrees:false: no span is judged, so no quote-verdict, and none is false");
  const b = w.run(); assert.equal(b.json.woven + b.json.revised + b.json.retracted, 0); assert.equal(b.json.unchanged, n); assert.equal(w.kind("frame-verdict").length, n);
});

test("quotes: DEF·Figure quote-verdicts, all true, where the codec agrees; the frames, whose detectors differ, are not judged", { skip }, () => {
  const w = world("khora-framed-pp.fixture.jsonl"), nom = w.kind("text-quotes")[0];
  const a = w.run(); assert.equal(a.code, 0, a.err);
  const vs = w.kind("quote-verdict"); assert.equal(vs.length, nom.body.spans.length);
  for (const v of vs) { assert.equal(v.cell, "DEF·Figure"); assert.equal(v.body.quotation, true); assert.deepEqual(v.of, [nom.id]); assert.equal(v.addr, `${nom.addr}#${v.body.index}`); }
  assert.equal(w.kind("frame-verdict").length, 0); assert.ok(a.json.evaluations.some((e) => e.gap === "detectors_disagree"));
});

test("REC and retraction: a newer nomination is judged again (a revision naming the one it replaces); one the rule stops supporting is retracted and the older verdict does not come back", { skip }, () => {
  const w = world("khora-framed-doc.fixture.jsonl"); w.run();
  const nom = w.kind("text-frames")[0], k = w.open("khora"), before = w.kind("frame-verdict");
  // khora re-reads and flips one frame (a newer entry at the same address, `of` the text): the old verdicts are `of` a superseded nomination
  const i = nom.body.frames.findIndex((f) => f.reported === false), flipped = { ...nom.body, frames: nom.body.frames.map((f, x) => (x === i ? { ...f, reported: true } : f)) };
  const nom2 = P.weave(k, { cell: nom.cell, kind: nom.kind, addr: nom.addr, body: flipped, of: nom.of });
  const r = w.run(); assert.equal(r.code, 0, r.err); assert.equal(r.json.revised, before.length, "every verdict is re-issued `of` the new nomination, naming the one it revises"); assert.equal(r.json.woven, 0);
  const latest = new Map(w.kind("frame-verdict").map((e) => [e.addr, e])); const at = [...latest.values()].find((e) => e.body.index === i);
  assert.equal(at.body.reported, true); assert.deepEqual(at.of, [nom2.id]); assert.ok(before.some((e) => e.id === at.basis.revises), "REC names the verdict it replaces"); assert.equal(at.basis.role, "REC");
  // now khora's detectors disagree on the newest nomination: nothing is supported, so every verdict of hers is retracted, older ones included
  const nom3 = P.weave(k, { cell: nom.cell, kind: nom.kind, addr: nom.addr, body: { ...flipped, crossCheck: { ...flipped.crossCheck, onlyTree: 1 } }, of: nom.of });
  const liveBefore = w.kind("frame-verdict").length, g = w.run(); assert.equal(g.json.retracted, liveBefore, "every live entry of hers at those addresses, the superseded ones too"); assert.equal(w.current("frame-verdict").length, 0, "no live verdict is left, the superseded ones do not resurface");
  assert.ok(nom3.id);
  assert.equal(w.run().json.retracted, 0, "a retraction is not repeated");
});

test("khora's own readVerdicts applies them: effective.source is \"verdict\" (run as a child process; nothing of khora is imported here)", { skip }, (t) => {
  let reader = null; try { reader = kernelFile("khora", "native/the-fold/pharos-verdicts.mjs"); } catch (e) { return t.skip(e instanceof KernelAbsentError ? `${e.code}: ${e.message}` : String(e)); }
  const doc = fixtureText("khora-framed-doc.fixture.jsonl"), pp = fixtureText("khora-framed-pp.fixture.jsonl");
  const probe = (fx, text) => { const w = world(fx); assert.equal(w.run().code, 0);
    const script = path.join(w.d, "readback.mjs"); fs.writeFileSync(script, `import { readVerdicts } from ${JSON.stringify(pathToFileURL(reader).href)}; const r = await readVerdicts(${JSON.stringify(text)}, { log: "fold", dir: ${JSON.stringify(w.logDir)} }); console.log(JSON.stringify({ gaps: r.gaps, frames: r.frames.map((f) => [f.reported, f.effective.reported, f.effective.source]), quotes: r.quotes.map((q) => q.quotation) }));`);
    const o = spawnSync(process.execPath, [script], { env: w.env, encoding: "utf8" }); assert.equal(o.status, 0, o.stderr); return JSON.parse(o.stdout); };
  const d = probe("khora-framed-doc.fixture.jsonl", doc); assert.deepEqual(d.gaps, []);
  assert.ok(d.frames.filter((f) => f[2] === "verdict").length >= 1); assert.ok(d.frames.every(([nomination, effective, source]) => (source === "verdict" ? effective === nomination : nomination === null)), "a verdict corroborates, it never contradicts");
  assert.ok(d.quotes.every((q) => q === null), "no verdict on the disagreeing codec: unknown, not false");
  const p = probe("khora-framed-pp.fixture.jsonl", pp); assert.deepEqual(p.gaps, []); assert.ok(p.quotes.length > 0 && p.quotes.every((q) => q === true)); assert.ok(p.frames.every((f) => f[2] === "nomination"));
});
function fixtureText(f) { return fs.readFileSync(path.join(FIX, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).find((e) => e.kind === "text").body.text; }
