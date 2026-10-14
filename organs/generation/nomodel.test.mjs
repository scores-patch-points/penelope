// organs/generation/nomodel.test.mjs — noModel is a WALL on every lane, counted.
//
// The audit measured it leaking: weave({artifact:"code", noModel:true}) made 1
// model-door request (the code adapter's read stage passed no flag, so the
// engine's tripwire was never reached) and artifact:"code-agent" made 6 (swarm,
// read, four mouth draws) and returned a different schema that never read the
// flag; gym/server.mjs's /api/weave dropped it while mouth/server.mjs forwarded
// it. Here a request-COUNTING stub is every door's address — mouth, channel,
// swarm, search — so "0" means no model-door request of any kind left the process
// (the hunt's search, which noModel permits by contract, is counted apart).
// Run: node --test organs/generation/nomodel.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");

const hits = [];
const stub = http.createServer((req, res) => {
  let body = "";
  req.on("data", (d) => { body += d; });
  req.on("end", () => {
    hits.push(`${req.method} ${req.url}`);
    res.setHeader("content-type", "application/json");
    if (req.url.includes("/api/generate")) res.end(JSON.stringify({ response: '[{"name":"add","spec":"adds two numbers"}]', model: "stub" }));
    else if (req.url.includes("/api/web/search")) res.end(JSON.stringify({ results: [] }));
    else if (req.url.includes("chat/completions")) res.end(JSON.stringify({ choices: [{ message: { content: "function add(a,b){return a+b}" } }] }));
    else res.end(JSON.stringify({ routed: false }));
  });
});
await new Promise((r) => stub.listen(0, "127.0.0.1", r));
const URL0 = `http://127.0.0.1:${stub.address().port}`;
// every door's address, set BEFORE the modules read it at import
process.env.PENELOPE_MOUTH_URL = URL0;
process.env.HEIMDALL_CHANNEL_URL = URL0;
process.env.KHORA_SWARM_URL = URL0 + "/v1/swarm";
process.env.ER7_SEARCH_URL = URL0 + "/api/web/search";
process.env.ER7_OLLAMA_URL = URL0;
for (const k of ["KHORA_HOME", "ER7_HOME", "JANUS_HOME"]) { /* the resolver decides; this test sets none */ void k; }

const { weave } = await import("./api.mjs");
const { draw, arrange } = await import("./engine.mjs");
const { runDrawDoor } = await import("../generation-door.mjs");
const { loadOrSkip } = await import("../kernel-reach.mjs");
const { skip: pipelineSkip } = await loadOrSkip(() => import("../code-pipeline.mjs"));

const out = () => fs.mkdtempSync(path.join(os.tmpdir(), "nomodel-test-"));
const quiet = async (fn) => { const l = console.log; console.log = () => {}; try { return await fn(); } finally { console.log = l; } };
// n counts MODEL-door requests (mouth, channel, swarm). The hunt's search is not a
// model door and runs under noModel by contract ("field and hunt run as usual");
// it is counted apart so a leak on either side shows.
const SEARCH = "/api/web/search";
const counted = async (fn) => {
  hits.length = 0;
  const r = await quiet(fn);
  const model = hits.filter((h) => !h.includes(SEARCH));
  return { r, n: model.length, search: hits.length - model.length, hits: [...model] };
};

test("weave({artifact:'code', noModel:true}) makes 0 requests and refuses typed (the read stage is a mouth draw)", async () => {
  const { r, n, hits: h } = await counted(() => weave({ intent: "write an add function", artifact: "code", noModel: true, output: out() }));
  assert.equal(n, 0, `requests leaked: ${h.join(" | ")}`);
  assert.equal(r.ok, false);
  assert.equal(r.noModel, true);
  assert.equal(r.model, null);
  assert.equal(r.void?.kind, "reading-void", "an empty reading is named as the void");
  assert.match(String(r.void?.reason), /noModel/);
});

test("weave({artifact:'code-agent', noModel:true}) makes 0 requests, is not verified, and carries the flag", { skip: pipelineSkip }, async () => {
  const { r, n, hits: h } = await counted(() => weave({ intent: "write an add function", artifact: "code-agent", noModel: true }));
  assert.equal(n, 0, `requests leaked: ${h.join(" | ")}`);
  assert.equal(r.ok, false);
  assert.equal(r.status, "unverified");
  assert.equal(r.noModel, true);
  assert.equal(r.model, null);
  assert.equal(r.frontier.attempted, false, "no frontier escalation under noModel");
  assert.match(String(r.readGap), /noModel/);
});

test("code-agent under noModel with units from a prior: each unit reaches the mouth stage as model-required, still 0 requests", { skip: pipelineSkip }, async () => {
  const { r, n, search } = await counted(() => weave({
    intent: "make add faster", artifact: "code-agent", noModel: true,
    context: { prior: { code: "export function add(a, b) { return a + b; }\nexport function sub(a, b) { return a - b; }\n" } },
  }));
  assert.equal(n, 0);
  assert.ok(search <= 2, "the hunt may search once per unit; nothing else leaves");
  assert.equal(r.ok, false);
  assert.deepEqual(r.units.map((u) => u.name).sort(), ["add", "sub"]);
  assert.deepEqual(r.subAgents.dispositions.map((d) => d.agent), ["model-required", "model-required"]);
  assert.ok(r.evidence.outcomes.every((o) => o.stage === "model-required"));
});

test("positive control: the same weave WITHOUT noModel does reach the door (the counter is live; the wall is what held)", async () => {
  const { n } = await counted(() => weave({ intent: "write an add function", artifact: "code", output: out() }));
  assert.ok(n >= 1, "without noModel the read stage draws, so the stub must have been asked");
});

test("the wall is the run's, not the caller's: an adapter that draws without passing the flag is refused at the floor, typed", async () => {
  const sneaky = {
    kind: "sneaky",
    readUnits: async () => { const { draw: d } = await import("./engine.mjs"); return JSON.parse(await d("name the units")); },
    testUnits: () => ({ ok: true, reason: "ok" }),
    toDocument: () => "<html/>",
  };
  const { r, n } = await counted(() => weave({ intent: "x", artifact: sneaky, noModel: true, output: out() }));
  assert.equal(n, 0);
  assert.equal(r.ok, false);
  assert.equal(r.status, "gap");
  assert.equal(r.code, "model-refused");
  // and direct: draw() inside a walled arrange is refused, outside it is not
  let inside = null;
  await quiet(() => arrange({ task: "t", args: { out: out() }, context: { noModel: true }, adapter: { kind: "t", readUnits: async () => { try { await draw("p"); } catch (e) { inside = e; } return []; }, testUnits: () => ({ ok: true }), toDocument: () => "<html/>", snip: (v) => v, probeUnit: () => ({ ok: true }) } }));
  assert.equal(inside?.code, "model-refused");
});

test("runDrawDoor({noModel:true}) is a typed refusal with no request; the box's stance shape is not a model and is unaffected", async () => {
  const { r, n } = await counted(() => runDrawDoor({ prompt: "say OK", noModel: true }));
  assert.equal(n, 0);
  assert.equal(r.ok, false);
  assert.equal(r.code, "model-refused");
  const ctl = await counted(() => runDrawDoor({ prompt: "say OK" }));
  assert.equal(ctl.n, 1, "control: the same draw without the flag is one request");
  assert.equal(ctl.r.ok, true);
});

// ── the doors: both /api/weave doors forward the flag ────────────────────────
test("mouth server: POST /api/weave forwards noModel (0 requests, flag echoed)", async () => {
  const { startMouth } = await import("../../mouth/server.mjs");
  const server = startMouth({ port: 0 });
  await new Promise((r) => (server.listening ? r() : server.once("listening", r)));
  try {
    hits.length = 0;
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/weave`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent: "write an add function", artifact: "code", noModel: true, output: out() }),
    });
    const j = await res.json();
    assert.equal(j.noModel, true);
    assert.equal(hits.length, 0, `requests leaked: ${hits.join(" | ")}`);
  } finally { await new Promise((r) => server.close(r)); }
});

// gym/server.mjs binds :8137 at import, so it is held by its source: the
// /api/weave handler must hand noModel to weave(), and the check must be able
// to see its absence (falsifying control on a mutated copy).
const weaveCallOf = (src) => {
  const at = src.indexOf('u.pathname === "/api/weave"');
  const from = src.indexOf("await weave({", at);
  return src.slice(from, src.indexOf("})", from));
};
test("gym server: POST /api/weave hands noModel to weave() (was dropped)", () => {
  const src = fs.readFileSync(path.join(REPO, "gym", "server.mjs"), "utf8");
  assert.match(weaveCallOf(src), /noModel:\s*j\.noModel\s*===\s*true/);
  const mutated = src.replace(/\n\s*noModel: j\.noModel === true,/, "");
  assert.doesNotMatch(weaveCallOf(mutated), /noModel/, "falsifying control: the check sees a dropped flag");
});

test.after(() => { stub.close(); });
