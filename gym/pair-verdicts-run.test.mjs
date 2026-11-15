// pair-verdicts-run.test.mjs — the runner as a separate process over a log, through a stub pharos with the contract
// her door uses (open by env PHAROS, every writer's file read, kinds declared, `of` checked, retracted left out).
// Pins: the door off exits non-zero; no bound or a bound not hers is refused; one pass weaves verdicts and
// requests; a second pass adds nothing; a witness turns a request into a verdict woven of it.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.join(HERE, "pair-verdicts-run.mjs");
const DRAFT = path.join(HERE, "..", "experiments", "pair-verdicts", "bound.draft.json");
const STUB = `
import fs from "node:fs"; import path from "node:path";
class E extends Error { constructor(code, m) { super(m); this.code = code; } }
export function open(name, { writer, dir }) { dir = dir || process.env.PHAROS; fs.mkdirSync(dir, { recursive: true }); return { name, dir, writer, file: path.join(dir, writer + ".jsonl") }; }
const all = (h) => fs.readdirSync(h.dir).filter((f) => f.endsWith(".jsonl")).sort().flatMap((f) => fs.readFileSync(path.join(h.dir, f), "utf8").split("\\n").filter(Boolean).map((l) => JSON.parse(l))).sort((a, b) => a.n - b.n);
const BOOT = new Set(["kind", "retract"]);
export function ground(h) { return { kinds: all(h).filter((e) => e.kind === "kind").map((e) => e.body) }; }
export function weave(h, input) {
  const es = all(h);
  if (!BOOT.has(input.kind) && !es.some((e) => e.kind === "kind" && e.body.name === input.kind)) throw new E("UNDECLARED_KIND", "undeclared " + input.kind);
  for (const id of input.of || []) if (!es.some((e) => e.id === id)) throw new E("UNKNOWN_OF", "of references unknown entry " + id);
  const e = { id: h.writer + es.length, n: es.length, by: h.writer, ...input, of: [...(input.of || [])].sort() }; fs.appendFileSync(h.file, JSON.stringify(e) + "\\n"); return e;
}
export function fold(h, { kind } = {}) { const es = all(h), gone = new Set(es.filter((e) => e.kind === "retract").flatMap((e) => e.of)); return { entries: es.filter((e) => e.kind !== "retract" && !gone.has(e.id) && (!kind || e.kind === kind)) }; }
`;

function world() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "pair-verdicts-run-")), lib = path.join(d, "stub-pharos.mjs");
  fs.writeFileSync(lib, STUB);
  const ptr = path.join(d, "pharos.json");
  fs.writeFileSync(ptr, JSON.stringify({ lib: "./stub-pharos.mjs", sha256: crypto.createHash("sha256").update(fs.readFileSync(lib)).digest("hex") }));
  const logDir = path.join(d, "log"); fs.mkdirSync(logDir);
  const env = { ...process.env, PENELOPE_PHAROS_JSON: ptr, PHAROS: logDir, PHAROS_LOG: "pairtest" };
  const run = (...args) => { const r = spawnSync(process.execPath, [RUNNER, ...args, "--json"], { env, encoding: "utf8" }); return { code: r.status, out: r.stdout, err: r.stderr, json: (() => { try { return JSON.parse(r.stdout); } catch { return null; } })() }; };
  // another writer's entries, appended as that writer would (n keeps one order across files)
  let n = 1000;
  const put = (writer, e) => { const x = { id: `${writer}-${n}`, n: n++, by: writer, of: [], ...e }; fs.appendFileSync(path.join(logDir, writer + ".jsonl"), JSON.stringify(x) + "\n"); return x; };
  const read = () => fs.readdirSync(logDir).flatMap((f) => fs.readFileSync(path.join(logDir, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)));
  return { run, put, read, env, d };
}
const fifty = Array.from({ length: 50 }, (_, k) => k);
const ev = (s) => ({ shared: s, empty: false, nulls: fifty, n: 50 });
const anchors = [[0, 0, true], [1, 1, true], [3, 3, true]];
function seed(w) {
  w.put("janus", { kind: "kind", addr: "kind:pair-diff", body: { name: "pair-diff", cell: "SEG·Figure", why: "t" } });
  w.put("janus", { kind: "kind", addr: "kind:pair-witness", body: { name: "pair-witness", cell: "CON·Figure", why: "t" } });
  w.put("janus", { kind: "pair-diff", cell: "SEG·Figure", addr: "diff:aaaaaaaaaaaaaaaa", body: { share: 0.75, lcs: 3, nA: 4, nB: 4, anchors, substitutions: [{ i: 2, j: 2, a: "buy", b: "sell", upos: ["VERB", "VERB"], contentA: true, evidence: { ab: ev(3), ba: ev(3) } }], orphans: [] } });
  w.put("janus", { kind: "pair-diff", cell: "SEG·Figure", addr: "diff:bbbbbbbbbbbbbbbb", body: { share: 0.75, lcs: 3, nA: 4, nB: 4, anchors, substitutions: [{ i: 2, j: 2, a: "buy", b: "purchase", upos: ["VERB", "VERB"], contentA: true, evidence: { ab: ev(48), ba: ev(49) } }], orphans: [] } });
}

test("the door off: no pointer, nothing read or written, exit non-zero", () => {
  const w = world();
  const r = spawnSync(process.execPath, [RUNNER], { env: { ...w.env, PENELOPE_PHAROS_JSON: path.join(w.d, "absent.json") }, encoding: "utf8" });
  assert.equal(r.status, 1); assert.match(r.stderr, /door is off/);
  assert.equal(fs.readdirSync(path.join(w.d, "log")).length, 0);
});

test("no bound, or a pair-bound woven by another writer: refused, nothing judged", () => {
  const w = world(); seed(w);
  let r = w.run(); assert.equal(r.code, 1); assert.match(r.err, /0 live pair-bound/);
  const body = JSON.parse(fs.readFileSync(DRAFT, "utf8")); delete body.note; delete body.name;
  w.put("janus", { kind: "kind", addr: "kind:pair-bound", body: { name: "pair-bound", cell: "DEF·Ground", why: "t" } });
  w.put("janus", { kind: "pair-bound", cell: "DEF·Ground", addr: "pair-bound:forged", body });
  r = w.run(); assert.equal(r.code, 1); assert.match(r.err, /not by penelope/);
  assert.equal(w.read().filter((e) => e.kind === "pair-verdict" || e.kind === "witness-request").length, 0);
});

test("one pass judges, a second adds nothing, a witness turns the request into a verdict of it", () => {
  const w = world(); seed(w);
  assert.equal(w.run("--declare", DRAFT).code, 0);
  assert.equal(w.run("--declare", DRAFT).code, 0, "declaring the same bound again is a no-op");
  const before = w.read().length;
  let r = w.run(); assert.equal(r.code, 0, r.err);
  assert.equal(r.json.verdicts, 1); assert.equal(r.json.requests, 1); assert.deepEqual(r.json.byVerdict, { "other by diff": 1 });
  const v = w.read().find((e) => e.kind === "pair-verdict");
  assert.equal(v.addr, "verdict:aaaaaaaaaaaaaaaa"); assert.deepEqual(v.body.reasons, ["unlicensed"]); assert.equal(v.of.length, 2);
  const req = w.read().find((e) => e.kind === "witness-request");
  assert.equal(req.addr, "witness-request:bbbbbbbbbbbbbbbb"); assert.equal(req.body.pair, "pair:bbbbbbbbbbbbbbbb");
  const afterOne = w.read().length; assert.ok(afterOne > before);
  r = w.run(); assert.equal(r.code, 0); assert.equal(r.json.verdicts + r.json.requests, 0); assert.equal(w.read().length, afterOne, "a rerun adds nothing");
  const wit = w.put("janus", { kind: "pair-witness", cell: "CON·Figure", addr: "witness:bbbbbbbbbbbbbbbb", of: [req.id], body: { model: "qwen3:8b", wordings: ["W1", "W2", "W3"], answers: { ab: ["yes", "yes", "yes"], ba: ["yes", "yes", "yes"] } } });
  r = w.run(); assert.equal(r.code, 0); assert.deepEqual(r.json.byVerdict, { "same by witness": 1 });
  const s = w.read().find((e) => e.kind === "pair-verdict" && e.addr === "verdict:bbbbbbbbbbbbbbbb");
  assert.ok(s.of.includes(wit.id)); assert.equal(s.of.length, 3);
  assert.deepEqual(Object.keys(s.body).sort(), ["by", "reasons", "verdict", "why"]);
  const n = w.read().length; r = w.run(); assert.equal(w.read().length, n);
  assert.equal(w.read().filter((e) => e.by === "penelope" && /text/.test(e.kind)).length, 0);
});

test("a second live bound makes the run refuse; declaring a different bound over a live one is refused", () => {
  const w = world(); seed(w);
  assert.equal(w.run("--declare", DRAFT).code, 0);
  const other = path.join(w.d, "other.json");
  fs.writeFileSync(other, JSON.stringify({ ...JSON.parse(fs.readFileSync(DRAFT, "utf8")), name: "other", share: 0.4 }));
  const r = w.run("--declare", other); assert.equal(r.code, 1); assert.match(r.err, /different pair-bound is live/);
});
