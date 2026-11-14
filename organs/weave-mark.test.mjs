// weave-mark.test.mjs — Penelope's mark weaver. The stub arm always runs; the real arm needs
// PENELOPE_PHAROS_TEST_JSON (a pharos pointer file) and skips with that typed reason otherwise.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import http from "node:http";
import { openLoom, admitMark, weaveMark, unweave, marks, loomStatus, WEAVER } from "./weave-mark.mjs";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "weave-mark-"));
// a stub with pharos' contract as weave-mark uses it: open, ground, weave (undeclared kind and unknown `of` refused), fold (retracted left out)
const STUB = `
import fs from "node:fs"; import path from "node:path";
class E extends Error { constructor(code, m) { super(m); this.code = code; } }
export function open(name, { writer, dir }) { dir = dir || path.join(process.env.PHAROS, name); fs.mkdirSync(dir, { recursive: true }); return { name, dir, writer, file: path.join(dir, writer + ".jsonl") }; }
const all = (h) => fs.existsSync(h.file) ? fs.readFileSync(h.file, "utf8").split("\\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
const BOOT = new Set(["kind", "retract"]);
export function ground(h) { return { kinds: all(h).filter((e) => e.kind === "kind").map((e) => e.body) }; }
export function weave(h, input) {
  const es = all(h);
  if (!BOOT.has(input.kind) && !es.some((e) => e.kind === "kind" && e.body.name === input.kind)) throw new E("UNDECLARED_KIND", "undeclared " + input.kind);
  for (const id of input.of || []) if (!es.some((e) => e.id === id)) throw new E("UNKNOWN_OF", "of references unknown entry " + id);
  const e = { id: "e" + es.length, by: h.writer, ...input }; fs.appendFileSync(h.file, JSON.stringify(e) + "\\n"); return e;
}
export function fold(h, { kind } = {}) { const es = all(h), gone = new Set(es.filter((e) => e.kind === "retract").flatMap((e) => e.of)); return { entries: es.filter((e) => e.kind !== "retract" && !gone.has(e.id) && (!kind || e.kind === kind)) }; }
`;
function stubPointer({ badSha = false } = {}) {
  const d = tmp(), lib = path.join(d, "stub-pharos.mjs"); fs.writeFileSync(lib, STUB);
  const sha = crypto.createHash("sha256").update(fs.readFileSync(lib)).digest("hex");
  const ptr = path.join(d, "pharos.json"); fs.writeFileSync(ptr, JSON.stringify({ lib: "./stub-pharos.mjs", sha256: badSha ? "0".repeat(64) : sha }));
  return { ptr, dir: path.join(d, "logs") };
}
const MARK = () => ({ by: "khora.hard-read", log: "khora-test", kind: "trail-deposit", cell: "SIG·Ground", addr: "trail:mayor", body: { head: "mayor", route: "wiki", ok: true, ms: 40, at: 1000 }, witness: { how: "observed: the route was tried and its outcome read" }, declare: { why: "one resolution attempt left in the environment" } });

test("admission: unbylined, no witness, no log, a path as a log name and a bad declaration are each refused with a reason", () => {
  assert.equal(admitMark(MARK()).ok, true);
  assert.equal(admitMark({ ...MARK(), by: undefined }).reason, "unbylined");
  assert.equal(admitMark({ ...MARK(), witness: {} }).reason, "no_witness");
  assert.equal(admitMark({ ...MARK(), witness: { how: "  " } }).reason, "no_witness");
  assert.equal(admitMark({ ...MARK(), log: "../etc" }).reason, "no_log");
  assert.equal(admitMark({ ...MARK(), body: undefined }).reason, "no_body");
  assert.equal(admitMark({ ...MARK(), declare: {} }).reason, "bad_declaration");
  assert.equal(admitMark(null).reason, "not_a_mark");
});

test("loom off: with no pointer every mark is refused 503 with the reason, and nothing is written anywhere", async () => {
  const s = await openLoom({ pointer: path.join(tmp(), "absent.json") });
  assert.equal(s.on, false); assert.match(s.why, /no pharos pointer/);
  const r = weaveMark(MARK());
  assert.equal(r.ok, false); assert.equal(r.status, 503); assert.equal(r.reason, "loom_off");
  assert.equal(marks({ log: "khora-test" }), null);
});

test("a lib that does not match its pin keeps the loom off", async () => {
  const { ptr, dir } = stubPointer({ badSha: true });
  const s = await openLoom({ pointer: ptr, dir });
  assert.equal(s.on, false); assert.match(s.why, /not the pinned one/);
});

test("weave: the kind is declared once with its why, the mark is written by penelope with the asker and witness in its basis", async () => {
  const { ptr, dir } = stubPointer();
  assert.equal((await openLoom({ pointer: ptr, dir })).on, true);
  const a = weaveMark(MARK()), b = weaveMark({ ...MARK(), declare: undefined, addr: "trail:president" });
  assert.equal(a.ok, true); assert.equal(a.declared, true); assert.equal(b.ok, true); assert.equal(b.declared, false);
  const lines = fs.readFileSync(path.join(dir, "khora-test", WEAVER + ".jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(lines.filter((e) => e.kind === "kind").length, 1);
  assert.equal(lines.find((e) => e.kind === "kind").body.declared_by, "khora.hard-read");
  const m = lines.find((e) => e.id === a.id);
  assert.equal(m.by, WEAVER); assert.equal(m.basis.via, WEAVER); assert.equal(m.basis.asked_by, "khora.hard-read"); assert.match(m.basis.witness.how, /observed/);
  assert.equal(marks({ log: "khora-test", kind: "trail-deposit" }).length, 2);
});

test("an undeclared kind sent with no declaration is refused, never guessed; an unknown `of` is refused by the log", async () => {
  const { ptr, dir } = stubPointer(); await openLoom({ pointer: ptr, dir });
  const r = weaveMark({ ...MARK(), declare: undefined });
  assert.equal(r.ok, false); assert.equal(r.reason, "undeclared_kind");
  const o = weaveMark({ ...MARK(), of: ["nope"] });
  assert.equal(o.ok, false); assert.equal(o.reason, "unknown_of");
});

test("unweave: a retraction entry of the ids, with its why; the mark leaves the live fold and stays in the file", async () => {
  const { ptr, dir } = stubPointer(); await openLoom({ pointer: ptr, dir });
  const a = weaveMark(MARK());
  assert.equal(unweave({ by: "khora.hard-read", log: "khora-test", ids: [a.id] }).reason, "no_why");
  const u = unweave({ by: "khora.hard-read", log: "khora-test", ids: [a.id], why: "the hint failed verification" });
  assert.equal(u.ok, true); assert.deepEqual(u.retracted, [a.id]);
  assert.equal(marks({ log: "khora-test", kind: "trail-deposit" }).length, 0);
  const raw = fs.readFileSync(path.join(dir, "khora-test", WEAVER + ".jsonl"), "utf8");
  assert.ok(raw.includes(`"id":"${a.id}"`)); // nothing erased
  assert.equal(loomStatus().unwoven, 1);
});

test("the door: POST /v1/weave/mark and /v1/weave/unweave over HTTP, typed statuses, unknown weave route denied", async () => {
  const { ptr, dir } = stubPointer();
  process.env.PENELOPE_PHAROS_JSON = ptr; process.env.PHAROS = path.join(dir, "door"); process.env.HEIMDALL_HOME = path.join(tmp(), "absent");
  const { startMouth } = await import("../mouth/server.mjs");
  const server = startMouth({ port: 0 }); await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (p, body) => { const r = await fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return { status: r.status, j: await r.json() }; };
  try {
    const st = await (await fetch(base + "/v1/weave/status")).json();
    assert.equal(st.on, true, st.why);
    const ok = await post("/v1/weave/mark", MARK());
    assert.equal(ok.status, 200); assert.equal(ok.j.ok, true);
    const bad = await post("/v1/weave/mark", { ...MARK(), witness: undefined });
    assert.equal(bad.status, 400); assert.equal(bad.j.reason, "no_witness");
    const un = await post("/v1/weave/unweave", { by: "t", log: "khora-test", ids: [ok.j.id], why: "test" });
    assert.equal(un.status, 200);
    assert.equal((await post("/v1/weave/other", {})).status, 404);
  } finally { server.close(); delete process.env.PENELOPE_PHAROS_JSON; delete process.env.PHAROS; }
});

const REAL = process.env.PENELOPE_PHAROS_TEST_JSON;
test("real pharos: declare, weave, of-link, unweave, and the live fold", { skip: REAL ? false : "PENELOPE_PHAROS_TEST_JSON is not set (pharos-absent)" }, async () => {
  const dir = path.join(tmp(), "logs");
  const s = await openLoom({ pointer: REAL, dir });
  assert.equal(s.on, true, s.why);
  const a = weaveMark(MARK()); assert.equal(a.ok, true, JSON.stringify(a));
  const b = weaveMark({ ...MARK(), declare: undefined, addr: "trail:president", of: [a.id] }); assert.equal(b.ok, true, JSON.stringify(b));
  assert.equal(weaveMark({ ...MARK(), declare: undefined, cell: "EVA·Figure" }).ok, false); // the kind's declared cell holds
  assert.equal(marks({ log: "khora-test", kind: "trail-deposit" }).length, 2);
  assert.equal(unweave({ by: "t", log: "khora-test", ids: [b.id], why: "did not hold" }).ok, true);
  const live = marks({ log: "khora-test", kind: "trail-deposit" });
  assert.equal(live.length, 1); assert.equal(live[0].by, WEAVER); assert.equal(live[0].basis.asked_by, "khora.hard-read");
});
