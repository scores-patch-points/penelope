// perspective-run.test.mjs — the perspective runner as a separate process over a log, through a stub pharos with the contract her door uses.
// Pins: the door off exits non-zero; a perspective is declared once and a different body at its name is refused; one pass judges every pair that has
// probe-answers (answers read by kind from different writers), a second pass adds nothing; one pair under two perspectives gets two verdicts; a perspective
// woven by another writer is reported and never judged under; a revision is admitted only when accuracy rises, false accepts do not and independence is measured.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.join(HERE, "perspective-run.mjs");
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
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "perspective-run-")), lib = path.join(d, "stub-pharos.mjs");
  fs.writeFileSync(lib, STUB);
  const ptr = path.join(d, "pharos.json");
  fs.writeFileSync(ptr, JSON.stringify({ lib: "./stub-pharos.mjs", sha256: crypto.createHash("sha256").update(fs.readFileSync(lib)).digest("hex") }));
  const logDir = path.join(d, "log"); fs.mkdirSync(logDir);
  const env = { ...process.env, PENELOPE_PHAROS_JSON: ptr, PHAROS: logDir, PHAROS_LOG: "perstest" };
  const run = (...args) => { const r = spawnSync(process.execPath, [RUNNER, ...args, "--json"], { env, encoding: "utf8" }); return { code: r.status, out: r.stdout, err: r.stderr, json: (() => { try { return JSON.parse(r.stdout); } catch { return null; } })() }; };
  // another writer's entries, appended as that writer would (n keeps one order across files)
  let n = 1000;
  const put = (writer, e) => { const x = { id: `${writer}-${n}`, n: n++, by: writer, of: [], ...e }; fs.appendFileSync(path.join(logDir, writer + ".jsonl"), JSON.stringify(x) + "\n"); return x; };
  const read = () => fs.readdirSync(logDir).flatMap((f) => fs.readFileSync(path.join(logDir, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)));
  return { run, put, read, env, d };
}

const GEO = { name: "geographer", by: "owner", why: "reads two leads as one place", terrain: "Lens", frame: "place",
  probes: [{ name: "area", lands: "Entity", power: 0.85, powerFrom: "ledger row 15", rule: "relative difference at most tol", tol: 0.25 }, { name: "region", lands: "Link", power: 0.4, powerFrom: "ledger row 18", rule: "strict equality" }] };
const DEMO = { name: "demographer", by: "owner", why: "reads two leads as one population", terrain: "Lens", frame: "people",
  probes: [{ name: "population", lands: "Entity", power: 0.3, powerFrom: "ledger row 15", rule: "relative difference at most tol", tol: 0.1 }] };
const file = (w, name, o) => { const f = path.join(w.d, name); fs.writeFileSync(f, JSON.stringify(o)); return f; };
const ans = (w, writer, sha, side, probe, value) => w.put(writer, { kind: "probe-answer", cell: "INS·Figure", addr: `answer:${sha}:${side}:${probe}`, body: { pair: `pair:${sha}`, side, probe, value } });
function seed(w) {
  for (const k of ["probe-answer"]) w.put("khora", { kind: "kind", addr: `kind:${k}`, body: { name: k, cell: "INS·Figure", why: "t" } });
  // P1: the same place (area close, same region); readings by two writers
  ans(w, "khora", "aaaaaaaaaaaaaaaa", "a", "area", 3232); ans(w, "janus", "aaaaaaaaaaaaaaaa", "b", "area", 3230);
  ans(w, "khora", "aaaaaaaaaaaaaaaa", "a", "region", "Q1273"); ans(w, "janus", "aaaaaaaaaaaaaaaa", "b", "region", "Q1273");
  ans(w, "khora", "aaaaaaaaaaaaaaaa", "a", "population", 340000); ans(w, "janus", "aaaaaaaaaaaaaaaa", "b", "population", 90000);
  // P2: a difference that makes a difference (area)
  ans(w, "khora", "bbbbbbbbbbbbbbbb", "a", "area", 100); ans(w, "janus", "bbbbbbbbbbbbbbbb", "b", "area", 900);
  // P3: only a probe the perspectives never declared: a hole
  ans(w, "khora", "cccccccccccccccc", "a", "wording", "formal"); ans(w, "janus", "cccccccccccccccc", "b", "wording", "plain");
}
const verdicts = (w) => w.read().filter((e) => e.kind === "equivalence-verdict");
const by = (w, sha, who) => verdicts(w).filter((e) => e.addr === `equivalence:${sha}:${who}`).at(-1);   // the later entry at an address wins (fold order)

test("the door off: no pointer, nothing read or written, exit non-zero", () => {
  const w = world();
  const r = spawnSync(process.execPath, [RUNNER], { env: { ...w.env, PENELOPE_PHAROS_JSON: path.join(w.d, "absent.json") }, encoding: "utf8" });
  assert.equal(r.status, 1); assert.match(r.stderr, /door is off/);
  assert.equal(fs.readdirSync(path.join(w.d, "log")).length, 0);
});

test("a perspective is declared once; a different body at its name is refused; a bad one is refused with a reason", () => {
  const w = world();
  let r = w.run("--declare", file(w, "geo.json", GEO)); assert.equal(r.code, 0); const first = r.json.id;
  r = w.run("--declare", file(w, "geo.json", GEO)); assert.equal(r.code, 0); assert.equal(r.json.id, first);
  assert.equal(w.read().filter((e) => e.kind === "perspective").length, 1);
  r = w.run("--declare", file(w, "geo2.json", { ...GEO, why: "another reason" })); assert.equal(r.code, 1); assert.match(r.err, /revise it/);
  r = w.run("--declare", file(w, "bad.json", { ...GEO, name: "bad", terrain: "Entity" })); assert.equal(r.code, 1); assert.match(r.err, /terrain_not_interpretation/);
  r = w.run("--declare", file(w, "bad2.json", { ...GEO, name: "bad2", probes: [{ ...GEO.probes[0], power: undefined }] })); assert.equal(r.code, 1); assert.match(r.err, /no_power/);
});

test("one pass judges every pair with answers (equivalent, different, gap), a second pass adds nothing", () => {
  const w = world(); seed(w); w.run("--declare", file(w, "geo.json", GEO));
  let r = w.run(); assert.equal(r.code, 0, r.err); assert.equal(r.json.verdicts, 3);
  assert.equal(by(w, "aaaaaaaaaaaaaaaa", "geographer").body.verdict, "equivalent");
  assert.equal(by(w, "bbbbbbbbbbbbbbbb", "geographer").body.verdict, "different");
  const hole = by(w, "cccccccccccccccc", "geographer"); assert.equal(hole.body.verdict, "gap"); assert.equal(hole.body.silent.length, 2);   // a hole is an entry
  const e = by(w, "aaaaaaaaaaaaaaaa", "geographer"); assert.ok(e.of.length >= 5);                                   // the perspective and the answers it read
  assert.ok(e.of.some((id) => w.read().find((x) => x.id === id && x.kind === "perspective")));
  r = w.run(); assert.equal(r.code, 0); assert.equal(r.json.verdicts, 0); assert.equal(r.json.alreadyJudged, 3);
});

test("one pair under two perspectives gets two verdicts: equivalent for the geographer, different for the demographer", () => {
  const w = world(); seed(w); w.run("--declare", file(w, "geo.json", GEO)); w.run("--declare", file(w, "demo.json", DEMO));
  const r = w.run(); assert.equal(r.code, 0, r.err);
  assert.equal(by(w, "aaaaaaaaaaaaaaaa", "geographer").body.verdict, "equivalent");
  assert.equal(by(w, "aaaaaaaaaaaaaaaa", "demographer").body.verdict, "different");
  assert.equal(by(w, "aaaaaaaaaaaaaaaa", "demographer").body.differences[0].probe, "population");
});

test("a perspective woven by another writer is reported, never judged under", () => {
  const w = world(); seed(w);
  w.put("janus", { kind: "kind", addr: "kind:perspective", body: { name: "perspective", cell: "DEF·Ground", why: "t" } });
  w.put("janus", { kind: "perspective", cell: "DEF·Ground", addr: "perspective:forged", body: { by: "janus", why: "x", terrain: "Lens", frame: "f", probes: GEO.probes } });
  const r = w.run(); assert.equal(r.code, 1); assert.ok(r.json.refused.some((x) => x.reason === "not_hers"));
  assert.equal(verdicts(w).length, 0);
});

test("a revision is admitted only if accuracy rises, false accepts do not and independence is measured; the old entry is retracted, nothing erased", () => {
  const w = world(); seed(w); w.run("--declare", file(w, "geo.json", GEO)); w.run();
  const better = { ...GEO, why: "adds a population probe", probes: [...GEO.probes, DEMO.probes[0]] };
  const before = { tp: 30, fn: 70, fa: 5, tn: 95 };
  let r = w.run("--revise", file(w, "r1.json", { name: "geographer", proposed: better, evidence: { before, after: { tp: 40, fn: 60, fa: 5, tn: 95 } } }));
  assert.equal(r.code, 1); assert.match(r.err, /not measured/);                                  // no k_eff: the added probe is not credited
  r = w.run("--revise", file(w, "r2.json", { name: "geographer", proposed: better, evidence: { before, after: { tp: 60, fn: 40, fa: 30, tn: 70 }, kEffBefore: 1.9, kEffAfter: 2.6 } }));
  assert.equal(r.code, 1); assert.match(r.err, /false accepts rose|did not rise/);
  assert.equal(w.read().filter((e) => e.kind === "perspective").length, 1);                      // nothing changed
  r = w.run("--revise", file(w, "r3.json", { name: "geographer", proposed: better, evidence: { before, after: { tp: 40, fn: 60, fa: 5, tn: 95 }, kEffBefore: 1.9, kEffAfter: 2.6 } }));
  assert.equal(r.code, 0, r.err); assert.equal(r.json.admitted, true);
  const all = w.read(), persp = all.filter((e) => e.kind === "perspective"); assert.equal(persp.length, 2);   // both on disk: nothing erased
  assert.ok(all.some((e) => e.kind === "retract" && e.of.includes(r.json.old)));
  r = w.run(); assert.equal(r.code, 0, r.err); assert.ok(r.json.verdicts >= 3);                  // re-judged under the new entry
  assert.equal(by(w, "aaaaaaaaaaaaaaaa", "geographer").body.verdict, "different");              // the new population probe finds the 340000 vs 90000 difference
});

test("a probe-answer flagged as a referent id is not compared by id equality: the runner weaves a gap that says why", () => {
  const w = world(); w.put("khora", { kind: "kind", addr: "kind:probe-answer", body: { name: "probe-answer", cell: "INS·Figure", why: "t" } });
  const geo = { ...GEO, name: "container", probes: [{ name: "under", lands: "Link", power: 0.5, powerFrom: "t", rule: "strict equality" }] };
  w.run("--declare", file(w, "c.json", geo));
  for (const side of ["a", "b"]) w.put("khora", { kind: "probe-answer", cell: "INS·Figure", addr: `answer:dddddddddddddddd:${side}:under`, body: { pair: "pair:dddddddddddddddd", side, probe: "under", value: "ref_77", referent: true } });
  const r = w.run(); assert.equal(r.code, 0, r.err);
  const v = by(w, "dddddddddddddddd", "container"); assert.equal(v.body.verdict, "gap"); assert.match(v.body.silent[0].why, /per document/);
});
