// anaphor-run.test.mjs — the anaphor runner as a separate process over a log, through a stub pharos with the contract her door uses, and ONE round trip against the real pharos library.
// Pins: the door off exits non-zero; text-referents, text-reading, text-cuts and binding entries are read BY KIND from different writers; one pass weaves one anaphor-definition per pronoun
// (committed, held, or held with a typed gap), at DEF·Figure, addr anaphor:<sha16>:<offset>, `of` the entries read; a second pass adds nothing; new evidence re-judges (a later entry at the
// address); no spectrum is a typed gap; an evidence kind with no adapter is reported and removes nothing.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.join(HERE, "anaphor-run.mjs");
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
const REAL = process.env.PHAROS_LIB ?? "/Users/mlacy/Documents/khora-cast/pharos/lib/pharos.mjs";

function world(libSource = null) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "anaphor-run-")), lib = libSource ?? path.join(d, "stub-pharos.mjs");
  if (!libSource) fs.writeFileSync(lib, STUB);
  const ptr = path.join(d, "pharos.json");
  fs.writeFileSync(ptr, JSON.stringify({ lib: libSource ?? "./stub-pharos.mjs", sha256: crypto.createHash("sha256").update(fs.readFileSync(lib)).digest("hex") }));
  const logDir = path.join(d, "log"); fs.mkdirSync(logDir);
  const env = { ...process.env, PENELOPE_PHAROS_JSON: ptr, PHAROS: logDir, PHAROS_LOG: "anatest" };
  const run = (...args) => { const r = spawnSync(process.execPath, [RUNNER, ...args, "--json"], { env, encoding: "utf8" }); return { code: r.status, out: r.stdout, err: r.stderr, json: (() => { try { return JSON.parse(r.stdout); } catch { return null; } })() }; };
  let n = 1000, ids = new Map();
  const put = (writer, e) => { const x = { id: `${writer}-${n}`, n: n++, by: writer, of: [], ...e }; fs.appendFileSync(path.join(logDir, writer + ".jsonl"), JSON.stringify(x) + "\n"); return x; };
  const read = () => fs.readdirSync(logDir).filter((f) => f.endsWith(".jsonl")).flatMap((f) => fs.readFileSync(path.join(logDir, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)));
  return { run, put, read, env, d, logDir };
}

const SHA = "0123456789abcdef";
const HIM = "Case=Acc|Gender=Masc|Number=Sing|Person=3|PronType=Prs";
// "Bell defeated him. Greene fled."  offsets: Bell 0-4, defeated 5-13, him 14-17, . 17-18, Greene 19-25, fled 26-30
const ROWS = [
  { s: 0, id: 1, form: "Bell", lemma: "bell", upos: "PROPN", feats: "Number=Sing", head: 2, deprel: "nsubj", at: 0, end: 4 },
  { s: 0, id: 2, form: "defeated", lemma: "defeat", upos: "VERB", feats: "_", head: 0, deprel: "root", at: 5, end: 13 },
  { s: 0, id: 3, form: "him", lemma: "he", upos: "PRON", feats: HIM, head: 2, deprel: "obj", at: 14, end: 17 },
  { s: 0, id: 4, form: ".", lemma: ".", upos: "PUNCT", feats: "_", head: 2, deprel: "punct", at: 17, end: 18 },
  { s: 1, id: 1, form: "Greene", lemma: "greene", upos: "PROPN", feats: "Number=Sing", head: 2, deprel: "nsubj", at: 19, end: 25 },
  { s: 1, id: 2, form: "fled", lemma: "flee", upos: "VERB", feats: "_", head: 0, deprel: "root", at: 26, end: 30 },
];
const REFERENTS = { referents: [{ ref: "r:bell", face: "Bell", spans: [[0, 4]], pronouns: [] }, { ref: "r:greene", face: "Greene", spans: [[19, 25]], pronouns: [] }], held: [{ pronoun: "him", at: [14, 17], cands: [["r:bell", 3], ["r:greene", 0.1]], bound: "r:bell" }], faces: { "r:bell": "Bell", "r:greene": "Greene" } };
function seed(w, { rows = true, held = true, cuts = true } = {}) {
  for (const [k, c] of [["text", "INS·Ground"], ["text-reading", "INS·Figure"], ["text-referents", "INS·Figure"], ["text-cuts", "SEG·Figure"]]) w.put("khora", { kind: "kind", cell: "DEF·Figure", addr: `kind:${k}`, body: { name: k, cell: c, why: "t" } });
  w.put("janus", { kind: "kind", cell: "DEF·Figure", addr: "kind:binding", body: { name: "binding", cell: "CON·Figure", why: "t" } });
  const t = w.put("khora", { kind: "text", cell: "INS·Ground", addr: `text:${SHA}`, body: { text: "Bell defeated him. Greene fled.", language: "eng" } });
  const out = { t };
  if (cuts) out.c = w.put("khora", { kind: "text-cuts", cell: "SEG·Figure", addr: `cuts:${SHA}`, body: { cuts: [[0, 18], [19, 31]] }, of: [t.id] });
  if (rows) out.r = w.put("khora", { kind: "text-reading", cell: "INS·Figure", addr: `reading:${SHA}`, body: { rows: ROWS }, of: [t.id] });
  out.p = w.put("khora", { kind: "text-referents", cell: "INS·Figure", addr: `referents:${SHA}`, body: held ? REFERENTS : { referents: REFERENTS.referents, held: [], faces: {} }, of: [t.id] });
  return out;
}
const defs = (w) => w.read().filter((e) => e.kind === "anaphor-definition");
const lastDef = (w) => defs(w).at(-1);

test("the door off: no pointer, nothing read or written, exit non-zero", () => {
  const w = world(); const r = spawnSync(process.execPath, [RUNNER], { env: { ...w.env, PENELOPE_PHAROS_JSON: path.join(w.d, "absent.json") }, encoding: "utf8" });
  assert.equal(r.status, 1); assert.match(r.stderr, /door is off/); assert.equal(fs.readdirSync(w.logDir).length, 0);
});

test("one pass weaves one DEF·Figure per pronoun, committed to the referent the rows leave, citing what it read; a second pass adds nothing", () => {
  const w = world(), s = seed(w);
  let r = w.run(); assert.equal(r.code, 0, r.err); assert.equal(r.json.pronouns, 1); assert.equal(r.json.woven, 1); assert.deepEqual(r.json.byVerdict, { committed: 1 });
  const e = lastDef(w); assert.equal(e.cell, "DEF·Figure"); assert.equal(e.by, "penelope"); assert.equal(e.addr, `anaphor:${SHA}:14`);
  assert.equal(e.body.verdict, "committed"); assert.equal(e.body.defined, "r:greene"); assert.equal(e.body.face, "Greene"); assert.equal(e.body.pronoun, "him");
  assert.deepEqual(e.body.eliminated.map((x) => x.ref), ["r:bell"]); assert.deepEqual(e.body.survivors, ["r:greene"]);
  for (const id of [s.p.id, s.r.id, s.c.id]) assert.ok(e.of.includes(id));                       // the spectrum, the rows and the cuts
  assert.equal(e.body.read.referents, s.p.id); assert.equal(e.basis.witness.read.referents, s.p.id);
  assert.ok(w.read().some((x) => x.kind === "kind" && x.body.name === "anaphor-definition" && x.body.cell === "DEF·Figure"));   // the kind was declared first, with its cell and why
  r = w.run(); assert.equal(r.code, 0); assert.equal(r.json.woven, 0); assert.equal(r.json.alreadyDefined, 1); assert.equal(defs(w).length, 1);
});

test("khora's own choice (bound: r:bell) is carried as the spectrum, never as the verdict: the entry does not copy it", () => {
  const w = world(); seed(w); w.run(); assert.notEqual(lastDef(w).body.defined, REFERENTS.held[0].bound);
});

test("no rows: the pronoun is held with its typed gap (a hole is an entry); no spectrum: a typed gap in the report, nothing woven", () => {
  let w = world(); seed(w, { rows: false }); let r = w.run(); assert.equal(r.code, 0, r.err);
  assert.equal(lastDef(w).body.verdict, "held"); assert.deepEqual(lastDef(w).body.gaps, ["no_rows"]); assert.ok(r.json.gaps.some((g) => g.why === "no_rows"));
  w = world(); seed(w, { held: false }); r = w.run(); assert.equal(defs(w).length, 0); assert.ok(r.json.gaps.some((g) => g.why === "no_spectrum"));
  w = world(); r = w.run(); assert.ok(r.json.gaps.some((g) => g.why === "no_spectrum")); assert.equal(defs(w).length, 0);
});

test("a binding entry (janus, read by kind) is evidence: a gender mismatch for a candidate re-judges the pronoun; the later entry at the address wins and the first is kept", () => {
  const w = world(), s = seed(w); w.run();
  const b = { kind: "binding", cell: "CON·Figure", addr: "binding:xx", of: [s.r.id], body: { by: "janus.binding", doc: `text:${SHA}`, window: 3, anaphor: { kind: "pronoun", s: 0, id: 3, form: "him", at: 14, end: 17, role: "obj" }, candidates: [{ ref: { being: "r:bell" }, role: "nsubj", agreement: { number: "unknown", gender: "unknown", person: "unknown" }, clauseMate: true }, { ref: { being: "r:greene" }, role: "nsubj", agreement: { number: "unknown", gender: "mismatch", person: "unknown" }, clauseMate: false }], holes: [] } };
  const be = w.put("janus", b);
  const r = w.run(); assert.equal(r.code, 0, r.err); assert.equal(r.json.woven, 1); assert.equal(defs(w).length, 2);
  const e = lastDef(w); assert.equal(e.body.verdict, "held"); assert.deepEqual(e.body.survivors, []); assert.deepEqual(e.body.read.evidence, [{ kind: "binding", id: be.id }]); assert.ok(e.of.includes(be.id));
  assert.equal(w.run().json.woven, 0);
});

test("evidence of a kind she has no adapter for is reported as a typed gap and removes nothing", () => {
  const w = world(), s = seed(w); w.put("janus", { kind: "kind", cell: "DEF·Figure", addr: "kind:claim", body: { name: "claim", cell: "DEF·Pattern", why: "t" } });
  w.put("janus", { kind: "claim", cell: "DEF·Pattern", addr: "claim:1", body: { rel: "x" }, of: [s.r.id] });
  const r = w.run("--evidence", "claim"); assert.equal(r.code, 0, r.err); assert.ok(r.json.gaps.some((g) => g.why === "no_adapter" && g.kind === "claim")); assert.equal(lastDef(w).body.defined, "r:greene");
});

test("a pronoun the rows cannot find is held with its gap; one text's evidence is not another's", () => {
  const w = world(); seed(w); const p = w.read().find((e) => e.kind === "text-referents");
  fs.appendFileSync(path.join(w.logDir, "khora.jsonl"), JSON.stringify({ ...p, id: "khora-9000", n: 9000, addr: `referents:${SHA}`, body: { ...REFERENTS, held: [{ pronoun: "him", at: [900, 903], cands: [["r:bell", 1]], bound: null }] } }) + "\n");
  const r = w.run(); assert.equal(r.code, 0, r.err); assert.deepEqual(lastDef(w).body.gaps, ["no_row_for_pronoun"]);
});

test("ROUND TRIP against the real pharos library: declared kind, DEF·Figure entry, a second pass adds nothing", { skip: fs.existsSync(REAL) ? false : `pharos-absent: no library at ${REAL} (set PHAROS_LIB)` }, async () => {
  const w = world(REAL), P = await import(REAL), h = P.open("anatest", { writer: "khora", dir: w.logDir });
  const decl = (k, c) => P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: `kind:${k}`, body: { name: k, cell: c, why: "t" } });
  for (const [k, c] of [["text", "INS·Ground"], ["text-reading", "INS·Figure"], ["text-referents", "INS·Figure"], ["text-cuts", "SEG·Figure"]]) decl(k, c);
  const t = P.weave(h, { cell: "INS·Ground", kind: "text", addr: `text:${SHA}`, body: { text: "Bell defeated him. Greene fled.", language: "eng" } });
  P.weave(h, { cell: "SEG·Figure", kind: "text-cuts", addr: `cuts:${SHA}`, body: { cuts: [[0, 18], [19, 31]] }, of: [t.id] });
  P.weave(h, { cell: "INS·Figure", kind: "text-reading", addr: `reading:${SHA}`, body: { rows: ROWS }, of: [t.id] });
  P.weave(h, { cell: "INS·Figure", kind: "text-referents", addr: `referents:${SHA}`, body: REFERENTS, of: [t.id] });
  let r = w.run(); assert.equal(r.code, 0, r.err + r.out); assert.equal(r.json.woven, 1);
  const hp = P.open("anatest", { writer: "penelope", dir: w.logDir }), es = P.fold(hp, { kind: "anaphor-definition" }).entries;
  assert.equal(es.length, 1); assert.equal(es[0].cell, "DEF·Figure"); assert.equal(es[0].body.defined, "r:greene"); assert.equal(es[0].addr, `anaphor:${SHA}:14`);
  r = w.run(); assert.equal(r.code, 0); assert.equal(r.json.woven, 0); assert.equal(P.fold(hp, { kind: "anaphor-definition" }).entries.length, 1);
});
