// organs/generation-door.test.mjs — the draw door's failure edge is typed and on the record.
//
// GL-RT-03 / GL-WV-08: a refused draw is typed, never a wedge. The door's fetch
// was outside any try: a refused connection escaped as a bare TypeError, wrote
// 0 swatch rows (Autonoe's duty: every draw recorded), and the engine had no
// catch. Here the door's mouth address is a closed port and a stub that 500s.
// Run: node --test organs/generation-door.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "door-test-"));
const swatchFile = path.join(dir, "swatch.jsonl");
process.env.PENELOPE_SWATCH = swatchFile; // the house swatch is not this test's to grow

// a port that refuses: bind, note the port, close
const closed = await new Promise((resolve) => {
  const s = http.createServer().listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); });
});
process.env.PENELOPE_MOUTH_URL = `http://127.0.0.1:${closed}`;

const { runDrawDoor } = await import("./generation-door.mjs");
const { draw } = await import("./generation/engine.mjs");
const rows = () => (fs.existsSync(swatchFile) ? fs.readFileSync(swatchFile, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const quiet = async (fn) => { const l = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = l; } };

test("a refused connection is a typed door-unreachable refusal with exactly one swatch row (was: bare TypeError, 0 rows)", async () => {
  const before = rows().length;
  const r = await quiet(() => runDrawDoor({ prompt: "say OK", kind: "build" }));
  assert.equal(r.ok, false);
  assert.equal(r.code, "door-unreachable");
  assert.match(r.error, /unreachable/);
  const after = rows();
  assert.equal(after.length - before, 1, "the failed draw is on the swatch");
  const row = after[after.length - 1];
  assert.equal(row.schema, "Swatch@1");
  assert.equal(row.class, "draw");
  assert.equal(row.verdict, "unreachable");
  assert.equal(row.mouthCalls, 0, "no call reached a mouth");
  assert.match(row.error, /unreachable/);
});

test("engine.draw on an unreachable door returns empty at once: no 3s/6s/9s/12s sleeps for a door that is not there", async () => {
  const t0 = Date.now();
  const text = await quiet(() => draw("say OK", { kind: "build" }));
  assert.equal(text, "");
  assert.ok(Date.now() - t0 < 2500, `took ${Date.now() - t0}ms`);
});

test("negative control: a mouth that answers 500 is still a typed door-refused, one row, one call", async () => {
  const stub = http.createServer((req, res) => { req.resume(); req.on("end", () => { res.writeHead(500, { "content-type": "application/json" }); res.end("{}"); }); });
  await new Promise((r) => stub.listen(0, "127.0.0.1", r));
  // the door reads the mouth address at import; a second copy of the module with its own address
  const prior = process.env.PENELOPE_MOUTH_URL;
  process.env.PENELOPE_MOUTH_URL = `http://127.0.0.1:${stub.address().port}`;
  try {
    const fresh = await import(`./generation-door.mjs?refuse=${Date.now()}`);
    const before = rows().length;
    const r = await quiet(() => fresh.runDrawDoor({ prompt: "say OK", kind: "build" }));
    assert.equal(r.ok, false);
    assert.equal(r.code, "door-refused");
    const after = rows();
    assert.equal(after.length - before, 1);
    assert.equal(after[after.length - 1].verdict, "refused");
    assert.equal(after[after.length - 1].mouthCalls, 1);
  } finally { process.env.PENELOPE_MOUTH_URL = prior; await new Promise((r) => stub.close(r)); }
});

test("positive control: an answering mouth is ok, one mouth row", async () => {
  const stub = http.createServer((req, res) => { req.resume(); req.on("end", () => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ response: "OK", model: "stub" })); }); });
  await new Promise((r) => stub.listen(0, "127.0.0.1", r));
  const prior = process.env.PENELOPE_MOUTH_URL;
  process.env.PENELOPE_MOUTH_URL = `http://127.0.0.1:${stub.address().port}`;
  try {
    const fresh = await import(`./generation-door.mjs?ok=${Date.now()}`);
    const before = rows().length;
    const r = await fresh.runDrawDoor({ prompt: "say OK", kind: "build" });
    assert.equal(r.ok, true);
    assert.equal(r.text, "OK");
    assert.equal(rows().length - before, 1);
    assert.equal(rows().at(-1).verdict, "mouth");
  } finally { process.env.PENELOPE_MOUTH_URL = prior; await new Promise((r) => stub.close(r)); }
});
