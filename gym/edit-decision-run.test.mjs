// edit-decision-run.test.mjs — the runner as a separate process over a REAL pharos log. The janus entries are frozen real bodies (organs/fixtures/janus-edit-intents.fixture.jsonl) woven as janus would, at the cells and
// addresses of the contract; the edit-choice entries are written as a person's tool would (writer "asker-ui"); nothing of janus, khora or an editor is imported or involved. Skips with the typed `pharos-absent`
// reason when no pharos checkout is reachable (organs/kernel-reach.mjs). Pins: door off exits 1; the happy triad at one address, each `of` the previous; every refusal weaves nothing and names its reason; a second pass
// adds nothing; a revised choice is a REVISION that names what it replaces and retracts the old; a withdrawn choice retracts every live entry; she writes nothing but her three kinds (+ pharos' kind and retract).
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
const RUNNER = path.join(HERE, "edit-decision-run.mjs"), FIX = path.join(HERE, "..", "organs", "fixtures", "janus-edit-intents.fixture.jsonl");
let LIB = null, why = null;
try { LIB = kernelFile("pharos", "lib/pharos.mjs"); } catch (e) { why = e instanceof KernelAbsentError ? e.code : String(e?.message ?? e); }
const skip = LIB ? false : `${why}: set PHAROS_HOME or place a pharos checkout beside penelope`;
const P = LIB ? await import(pathToFileURL(LIB).href) : null;
const SHA = "66d46b917281d6e2", fixture = () => fs.readFileSync(FIX, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));

function world({ only = null } = {}) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "edit-decision-run-")), logDir = path.join(d, "log"); fs.mkdirSync(logDir);
  const ptr = path.join(d, "pharos.json"); fs.writeFileSync(ptr, JSON.stringify({ lib: LIB, sha256: crypto.createHash("sha256").update(fs.readFileSync(LIB)).digest("hex") }));
  const env = { ...process.env, PENELOPE_PHAROS_JSON: ptr, PHAROS: logDir, PHAROS_LOG: "fold", PHAROS_HOME: path.dirname(path.dirname(LIB)) };
  const open = (writer) => P.open("fold", { dir: logDir, writer });
  const janus = open("janus"), ui = open("asker-ui"), ids = new Map();
  const decl = (h, name, cell) => P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: `kind:${name}`, body: { name, cell, why: "proposal kind, declared by its writer (test)" } });
  decl(janus, "edit-intent", "CON·Figure"); decl(janus, "edit-proposal", "SEG·Figure"); decl(ui, "edit-choice", "INS·Figure");
  for (const f of fixture()) { if (only && !only.includes(f.addr)) continue; ids.set(f.addr, P.weave(janus, { cell: f.cell, kind: f.kind, addr: f.addr, body: f.body, of: f.ofAddr.map((a) => ids.get(a).id) })); }
  const choose = (i, n, body, addr = `choice:${SHA}#${i}`) => P.weave(ui, { cell: "INS·Figure", kind: "edit-choice", addr, body: Object.fromEntries(Object.entries({ giver: "asker:ana", proposal: `proposal:${SHA}#${i}:${n}`, tolerance: 0.25, ...body }).filter(([, v]) => v !== undefined)), of: ids.has(`proposal:${SHA}#${i}:${n}`) ? [ids.get(`proposal:${SHA}#${i}:${n}`).id] : [] });
  const run = () => { const r = spawnSync(process.execPath, [RUNNER, "--json"], { env, encoding: "utf8" }); let json = null; try { json = JSON.parse(r.stdout); } catch { /* not json */ } return { code: r.status, err: r.stderr, json }; };
  const rd = open("reader"), kind = (k) => P.fold(rd, { kind: k }).entries ?? [], current = (k) => P.current(rd, { kind: k }) ?? [];
  const retract = (e) => P.weave(ui, { cell: "NUL·Figure", kind: "retract", addr: `retract:${e.id}`, body: { why: "the asker withdrew the choice" }, of: [e.id] });
  return { d, logDir, env, run, ids, choose, kind, current, ptr, janus, ui, retract, rd, P };
}
const TRIAD = ["edit-def", "edit-eva", "edit-rec"], mine = (w) => TRIAD.flatMap((k) => w.kind(k));

test("the door off: no pointer, nothing read or written, exit 1", { skip }, () => {
  const w = world(); const r = spawnSync(process.execPath, [RUNNER], { env: { ...w.env, PENELOPE_PHAROS_JSON: path.join(w.d, "absent.json") }, encoding: "utf8" });
  assert.equal(r.status, 1); assert.match(r.stderr, /door is off/); assert.equal(fs.existsSync(path.join(w.logDir, "penelope.jsonl")), false);
});

test("the happy triad: one choice -> edit-def DEF·Figure, edit-eva EVA·Figure, edit-rec REC·Figure at ONE address edit:<sha16>#<i>, each `of` the previous (+ proposal, intent); the order does not apply", { skip }, () => {
  const w = world(), c = w.choose(0, 0, { spans: [{ from: 0.1, to: 1.1 }] }); assert.equal(w.kind("edit-choice").length, 1);
  const a = w.run(); assert.equal(a.code, 0, a.err); assert.deepEqual([a.json.woven, a.json.revised, a.json.retracted], [3, 0, 0]);
  const [def] = w.kind("edit-def"), [eva] = w.kind("edit-eva"), [rec] = w.kind("edit-rec"), prop = w.ids.get(`proposal:${SHA}#0:0`), intent = w.ids.get(`intent:${SHA}#0`);
  for (const [e, cell] of [[def, "DEF·Figure"], [eva, "EVA·Figure"], [rec, "REC·Figure"]]) { assert.equal(e.cell, cell); assert.equal(e.addr, `edit:${SHA}#0`); assert.equal(e.by, "penelope"); }
  assert.deepEqual([...def.of].sort(), [c.id, prop.id, intent.id].sort()); assert.ok(eva.of.includes(def.id) && eva.of.includes(prop.id) && eva.of.includes(intent.id)); assert.ok(rec.of.includes(eva.id) && rec.of.includes(def.id));
  assert.equal(def.body.giver, "asker:ana"); assert.deepEqual(def.body.spans, [{ from: 0.1, to: 1.1 }]); assert.equal(def.body.tolerance, 0.25); assert.equal(def.body.method, "trim_to_speech");
  assert.equal(eva.body.stands, true); assert.equal(eva.body.standing, "single"); assert.equal(eva.body.witnesses, 1); assert.ok(Math.abs(eva.body.max_difference - 0.1) < 1e-9, "the measured difference, floating point as measured");
  assert.deepEqual(rec.body, { schema: "EditDecision@1", rule: "ED3", primitive: "remove_span", clip: "clip-7", spans: [{ from: 0.1, to: 1.1 }], intent: `intent:${SHA}#0`, def: def.id, eva: eva.id, applies: false });
  assert.equal(a.json.decided.length, 1);
  for (const k of TRIAD) assert.equal(w.kind("kind").filter((x) => x.body.name === k).length, 1, `${k} declared once, at its cell`);
  const b = w.run(); assert.deepEqual([b.json.woven, b.json.revised, b.json.retracted, b.json.unchanged], [0, 0, 0, 3], "a second pass adds nothing"); assert.equal(mine(w).length, 3);
});

test("she writes nothing but her three kinds (+ pharos' own kind declaration and retract), and nothing at a cell that is not DEF, EVA or REC for the triad", { skip }, () => {
  const w = world(); w.choose(0, 0, {}); w.choose(1, 0, { tolerance: 0 }); w.run();
  const all = w.P.entries(w.rd).filter((e) => e.by === "penelope");
  assert.ok(all.length >= 6); const kinds = new Set(all.map((e) => e.kind)); assert.deepEqual([...kinds].filter((k) => !["kind", "retract", ...TRIAD].includes(k)), []);
  for (const e of all.filter((x) => TRIAD.includes(x.kind))) assert.ok(["DEF", "EVA", "REC"].includes(e.cell.split("·")[0]) && e.cell.endsWith("·Figure"), e.cell);
  for (const e of all.filter((x) => x.kind === "kind")) assert.ok(TRIAD.includes(e.body.name), "she declares only her own kinds");
  for (const k of ["edit-intent", "edit-proposal", "edit-choice"]) assert.equal(all.filter((e) => e.kind === k).length, 0, `she never writes ${k}`);
});

test("no choice, no entry: janus's nominations alone (and a choice's absence) decide nothing", { skip }, () => {
  const w = world(); const a = w.run(); assert.equal(a.code, 0, a.err); assert.equal(mine(w).length, 0); assert.deepEqual([a.json.woven, a.json.no_def.length], [0, 0]);
});

test("ambiguous intent -> no DEF; gap intent -> no DEF (the reason from its own gaps); no giver -> no DEF: reported `no_def:<reason>`, nothing woven, so no EVA and no REC can follow", { skip }, () => {
  const w = world();
  const amb = fixture().find((f) => f.addr === `intent:${SHA}#0`), ambAddr = `intent:${SHA}#3`, propAddr = `proposal:${SHA}#3:0`, prop = fixture().find((f) => f.addr === `proposal:${SHA}#0:0`);
  const ai = w.P.weave(w.janus, { cell: "CON·Figure", kind: "edit-intent", addr: ambAddr, body: { ...amb.body, sentence: 3, status: "ambiguous" }, of: [] });
  w.ids.set(propAddr, w.P.weave(w.janus, { cell: "SEG·Figure", kind: "edit-proposal", addr: propAddr, body: { ...prop.body, intent: ambAddr }, of: [ai.id] })); w.choose(3, 0, {});
  const gi = w.ids.get(`intent:${SHA}#2`), gp = w.P.weave(w.janus, { cell: "SEG·Figure", kind: "edit-proposal", addr: `proposal:${SHA}#2:0`, body: { ...prop.body, intent: `intent:${SHA}#2` }, of: [gi.id] }); w.ids.set(`proposal:${SHA}#2:0`, gp); w.choose(2, 0, { spans: [{ from: 0, to: 1 }] });
  w.choose(0, 0, { giver: undefined }); const a = w.run(); assert.equal(a.code, 0, a.err); assert.equal(mine(w).length, 0);
  const got = Object.fromEntries(a.json.no_def.map((g) => [g.addr, g.gap]));
  assert.deepEqual(got, { [`choice:${SHA}#0`]: "no_def:no_giver", [`choice:${SHA}#2`]: "no_def:intent_gap:referent_unresolved", [`choice:${SHA}#3`]: "no_def:intent_status:ambiguous" });
});

test("missing or zero tolerance -> the DEF stands (the standard is declared) but EVA ABSTAINS: no EVA, no REC", { skip }, () => {
  for (const tolerance of [undefined, 0, -0.5]) { const w = world(); w.choose(0, 0, { tolerance }); const a = w.run(); assert.equal(a.code, 0, a.err);
    assert.deepEqual([w.kind("edit-def").length, w.kind("edit-eva").length, w.kind("edit-rec").length], [1, 0, 0], `tolerance ${String(tolerance)}`); assert.equal(a.json.eva_abstained[0].gap, "eva_abstains:tolerance");
    assert.equal(w.kind("edit-def")[0].body.tolerance, tolerance === undefined ? null : tolerance); }
});

test("spans differing beyond the asker's tolerance -> EVA is written and does NOT stand (measured differences recorded) -> no REC", { skip }, () => {
  const w = world(); w.choose(0, 0, { spans: [{ from: 0.5, to: 1.5 }], tolerance: 0.25 }); const a = w.run(); assert.equal(a.code, 0, a.err);
  const [eva] = w.kind("edit-eva"); assert.equal(eva.body.stands, false); assert.deepEqual(eva.body.reasons, ["span_beyond_tolerance"]); assert.deepEqual(eva.body.differences, [{ index: 0, from: 0.5, to: 0.5 }]);
  assert.equal(w.kind("edit-rec").length, 0); assert.equal(a.json.not_standing[0].max_difference, 0.5); assert.equal(a.json.decided.length, 0);
  assert.equal(w.run().json.woven, 0, "and a second pass adds nothing");
});

test("a revised choice: a newer entry at the same address names the one it replaces (basis.revises) and every older live one is RETRACTED; a revision that stops standing retracts the REC", { skip }, () => {
  const w = world(); w.choose(0, 0, { spans: [{ from: 0.1, to: 1.1 }] }); w.run(); const before = Object.fromEntries(TRIAD.map((k) => [k, w.kind(k)[0]]));
  w.choose(0, 0, { spans: [{ from: 0.2, to: 1.0 }], tolerance: 0.5 }); const r = w.run(); assert.equal(r.code, 0, r.err); assert.deepEqual([r.json.revised, r.json.woven, r.json.retracted], [3, 0, 3]);
  for (const k of TRIAD) { const cur = w.current(k); assert.equal(cur.length, 1, k); assert.equal(cur[0].basis.revises, before[k].id, `${k} names what it replaces`); assert.notEqual(cur[0].id, before[k].id); assert.deepEqual(w.kind(k).map((e) => e.id), [cur[0].id], `${k}: the old one is retracted and does not resurface`); }
  assert.deepEqual(w.current("edit-rec")[0].body.spans, [{ from: 0.2, to: 1.0 }]); assert.ok(w.current("edit-rec")[0].of.includes(w.current("edit-eva")[0].id));
  { const q = w.run().json; assert.deepEqual([q.woven, q.revised, q.retracted], [0, 0, 0]); }
  w.choose(0, 0, { spans: [{ from: 3, to: 4 }], tolerance: 0.5 }); const x = w.run(); assert.equal(w.kind("edit-rec").length, 0, "the order is retracted when the evidence no longer stands"); assert.equal(w.current("edit-eva")[0].body.stands, false); assert.ok(x.json.retracted >= 1);
  assert.equal(w.current("edit-rec").length, 0, "the older REC does not come back");
});

test("a choice withdrawn (retracted) retracts every live triad entry at the address; none resurfaces; and a choice for another intent leaves this one alone", { skip }, () => {
  const w = world(), c0 = w.choose(0, 0, {}), c1 = w.choose(1, 0, {}); w.run(); assert.equal(mine(w).length, 6);
  w.retract(c0); const r = w.run(); assert.equal(r.code, 0, r.err); assert.equal(r.json.retracted, 3); assert.deepEqual(mine(w).map((e) => e.addr).sort(), [1, 1, 1].map((i) => `edit:${SHA}#${i}`));
  assert.equal(w.run().json.retracted, 0, "a retraction is not repeated"); assert.ok(c1.id);
});

test("a nomination that changes under the choice (a newer proposal at the same address) re-decides: DEF, EVA and REC are revised `of` the new proposal", { skip }, () => {
  const w = world(); w.choose(0, 0, { spans: [{ from: 0, to: 1 }], tolerance: 0.1 }); w.run(); const old = w.kind("edit-rec")[0];
  const f = fixture().find((x) => x.addr === `proposal:${SHA}#0:0`), np = w.P.weave(w.janus, { cell: "SEG·Figure", kind: "edit-proposal", addr: f.addr, body: { ...f.body, spans: [{ from: 0, to: 2 }] }, of: [w.ids.get(`intent:${SHA}#0`).id] });
  const r = w.run(); assert.equal(r.code, 0, r.err); assert.equal(r.json.revised, 2, "DEF and EVA, whose `of` names the proposal, are re-issued"); assert.equal(w.kind("edit-eva")[0].body.stands, false); assert.ok(w.kind("edit-eva")[0].of.includes(np.id));
  assert.equal(w.kind("edit-rec").length, 0, "the evidence no longer stands, so the order is retracted"); assert.ok(old.id);
});
