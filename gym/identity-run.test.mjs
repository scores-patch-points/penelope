// identity-run.test.mjs — the identity DEF runner as a separate process over a log, through a stub pharos with the contract her door uses.
// Pins: a prior with a named giver is GIVEN, without one a CANDIDATE; asker and tolerance are never defaulted; a model writer or giver is refused (exact prefix, "modeler" is not a model); one declaration per pair cites the prior and the
// janus evidence about THAT pair read by kind (merged-world, difference, agreement, hole, change, binding), never another pair's, never an unrelated kind; a rerun adds nothing; a different prior at the same address is refused.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { declarePrior, declareIdentity, evidenceFor, EVIDENCE_KINDS } from "../organs/identity-def.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.join(HERE, "identity-run.mjs");
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
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "identity-run-")), lib = path.join(d, "stub-pharos.mjs");
  fs.writeFileSync(lib, STUB);
  const ptr = path.join(d, "pharos.json");
  fs.writeFileSync(ptr, JSON.stringify({ lib: "./stub-pharos.mjs", sha256: crypto.createHash("sha256").update(fs.readFileSync(lib)).digest("hex") }));
  const logDir = path.join(d, "log"); fs.mkdirSync(logDir);
  const env = { ...process.env, PENELOPE_PHAROS_JSON: ptr, PHAROS: logDir, PHAROS_LOG: "idtest" };
  const run = (...args) => { const r = spawnSync(process.execPath, [RUNNER, ...args, "--json"], { env, encoding: "utf8" }); return { code: r.status, out: r.stdout, err: r.stderr, json: (() => { try { return JSON.parse(r.stdout); } catch { return null; } })() }; };
  // another writer's entries, appended as that writer would (n keeps one order across files)
  let n = 1000;
  const put = (writer, e) => { const x = { id: `${writer}-${n}`, n: n++, by: writer, of: [], ...e }; fs.appendFileSync(path.join(logDir, writer + ".jsonl"), JSON.stringify(x) + "\n"); return x; };
  const read = () => fs.readdirSync(logDir).flatMap((f) => fs.readFileSync(path.join(logDir, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)));
  return { run, put, read, env, d };
}

const file = (w, name, obj) => { const p = path.join(w.d, name); fs.writeFileSync(p, JSON.stringify(obj)); return p; };
const janus = (w, kind, cell, body) => w.put("janus", { kind, cell, addr: `${kind}:${body.pair?.join("|") ?? "x"}`, body });
test("a prior with a named giver is GIVEN, without a giver a CANDIDATE; asker and tolerance are never defaulted; a model never writes it", () => {
  assert.equal(declarePrior({ asker: "a", tolerance: 0.05, giver: "the UD treebank", by: "michael" }).body.standing, "given");
  assert.equal(declarePrior({ asker: "a", tolerance: 0.05, by: "michael" }).body.standing, "candidate");
  for (const bad of [{ tolerance: 0.05 }, { asker: "a" }, { asker: "a", tolerance: "" }, { asker: "a", tolerance: NaN }, { asker: "a", tolerance: 0.05, by: "" }]) assert.equal(declarePrior({ by: "michael", ...bad }).ok, false, JSON.stringify(bad));
  assert.equal(declarePrior({ asker: "a", tolerance: 0.05, by: "model:claude" }).reason, "model_cannot_declare"); assert.equal(declarePrior({ asker: "a", tolerance: 0.05, giver: "self:model:x", by: "michael" }).reason, "model_cannot_declare");
  assert.equal(declarePrior({ asker: "a", tolerance: 0.05, by: "modeler" }).ok, true, "a name that merely starts with model is not a model writer");
});
test("evidence is read by kind and by pair, either order, and nothing else is cited", () => {
  const E = [{ id: "j1", kind: "merged-world", by: "janus", body: { pair: ["Bell", "Jack"] } }, { id: "j2", kind: "difference", by: "janus", body: { pair: ["Jack", "Bell"] } }, { id: "j3", kind: "difference", by: "janus", body: { pair: ["Bell", "Moore"] } },
    { id: "j4", kind: "probe-answer", by: "janus", body: { pair: ["Bell", "Jack"] } }, { id: "j5", kind: "hole", by: "janus", body: { pair: "Bell|Jack" } }, { id: "j6", kind: "binding", by: "janus", body: { pair: ["Bell", "Jack", "He"] } }];
  assert.deepEqual(evidenceFor(E, "Bell", "Jack").map((x) => x.id), ["j1", "j2", "j6"], "the other pair, another kind, and a malformed pair are not cited"); assert.deepEqual(EVIDENCE_KINDS.slice().sort(), ["agreement", "binding", "change", "difference", "hole", "merged-world"]);
});
test("a declaration needs a live prior, two different referents and a byline; it inherits the prior's standing; it is the same for the pair in either order", () => {
  const prior = { id: "P1", kind: "identity-prior", body: { standing: "given", giver: "the asker", tolerance: 0.05 } };
  assert.equal(declareIdentity({ prior: null, a: "A", b: "B", by: "m" }).reason, "no_prior"); assert.equal(declareIdentity({ prior: { id: "J1", kind: "difference", body: { standing: "given" } }, a: "A", b: "B", by: "m" }).reason, "no_prior", "only an identity-prior entry is a prior"); assert.equal(declareIdentity({ prior, a: "A", b: "A", by: "m" }).reason, "no_pair"); assert.equal(declareIdentity({ prior, a: "A", b: "B" }).reason, "unbylined");
  assert.equal(declareIdentity({ prior, a: "A", b: "B", by: "model:x" }).reason, "model_cannot_declare");
  const d1 = declareIdentity({ prior, a: "B", b: "A", by: "m" }), d2 = declareIdentity({ prior, a: "A", b: "B", by: "m" }); assert.equal(d1.addr, d2.addr); assert.equal(d1.body.standing, "given"); assert.deepEqual(d1.of, ["P1"]);
});
test("the runner: declares a prior once, a different body at the same address is refused, and a declaration cites the prior and the janus evidence about the pair", () => {
  const w = world();
  const p1 = file(w, "prior.json", { asker: "michael", tolerance: 0.05, giver: "the asker", priors: ["declared"], by: "michael" });
  const r1 = w.run("--declare-prior", p1); assert.equal(r1.code, 0, r1.err); assert.equal(r1.json.standing, "given"); assert.equal(w.run("--declare-prior", p1).json.unchanged, true, "a rerun adds nothing");
  assert.equal(w.run("--declare-prior", file(w, "p2.json", { asker: "michael", tolerance: 0.1, giver: "the asker", by: "michael" })).code, 1, "a different prior at the same address is refused");
  assert.equal(w.run("--declare-prior", file(w, "p3.json", { asker: "x", tolerance: 0.05, by: "model:claude" })).code, 1);
  const e1 = janus(w, "merged-world", "SYN·Pattern", { pair: ["Black Jack", "Marshall Bell"] }), e2 = janus(w, "difference", "CON·Figure", { pair: ["Marshall Bell", "Black Jack"], rel: "age" }), other = janus(w, "difference", "CON·Figure", { pair: ["Bell", "Moore"] }), noise = janus(w, "probe-answer", "INS·Figure", { pair: ["Black Jack", "Marshall Bell"] });
  const pr = file(w, "pair.json", { asker: "michael", a: "Marshall Bell", b: "Black Jack", by: "michael" }), r2 = w.run("--declare-identity", pr); assert.equal(r2.code, 0, r2.err);
  assert.deepEqual(r2.json.evidence.map((x) => x.id).sort(), [e1.id, e2.id].sort(), "only the evidence about this pair, of the evidence kinds"); assert.equal(r2.json.standing, "given");
  const decl = w.read().find((e) => e.kind === "identity-declaration"); assert.equal(decl.cell, "DEF·Figure"); assert.ok(decl.of.includes(e1.id) && decl.of.includes(e2.id)); assert.ok(!decl.of.includes(other.id) && !decl.of.includes(noise.id));
  assert.equal(w.run("--declare-identity", pr).json.unchanged, true, "a rerun adds nothing");
  assert.equal(w.read().filter((e) => e.kind === "identity-declaration").length, 1);
  const prior = w.read().find((e) => e.kind === "identity-prior"); assert.equal(prior.cell, "DEF·Pattern"); assert.ok(decl.of.includes(prior.id));
});
test("a declaration with no live prior is refused; a candidate prior makes a candidate declaration; the door off exits non-zero", () => {
  const w = world(); assert.equal(w.run("--declare-identity", file(w, "pair.json", { asker: "nobody", a: "A", b: "B", by: "michael" })).code, 1);
  w.run("--declare-prior", file(w, "c.json", { asker: "corpus", tolerance: 0.05, priors: ["a corpus"], by: "michael" })); const r = w.run("--declare-identity", file(w, "q.json", { asker: "corpus", a: "A", b: "B", by: "michael" })); assert.equal(r.code, 0, r.err); assert.equal(r.json.standing, "candidate");
  const off = spawnSync(process.execPath, [RUNNER, "--declare-prior", file(w, "c.json", {}), "--json"], { env: { ...w.env, PENELOPE_PHAROS_JSON: path.join(w.d, "none.json") }, encoding: "utf8" }); assert.notEqual(off.status, 0);
});
