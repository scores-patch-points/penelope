// organs/kernel-reach.test.mjs — the kernel dependency, typed.
//
// Before organs/kernel-reach.mjs: 55 undeclared `../../khora/...` reach sites in
// 19 files. In a checkout with no sibling, 10 of 45 modules died with a bare
// ERR_MODULE_NOT_FOUND and weave() / api.selftest() threw for EVERY artifact kind
// (api.mjs's eager loadBuiltins imported code-fix, which imports janus).
//
// These tests hold:
//   1. a clean checkout (this repo's organs/ copied to a directory with NO
//      sibling): every module loads or fails with a typed `<repo>-absent` error;
//      weave() never throws; a kind whose sibling is absent refuses TYPED and
//      the other kinds still run; api.selftest() passes.
//   2. no source file reaches a sibling around the resolver (the 55 sites).
//   3. the resolver itself: env override, default sibling path, typed absence
//      naming the path it looked at.
// Run: node --test organs/kernel-reach.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");

// A child-process environment with every override cleared, so "absent" means absent.
const cleanEnv = () => {
  const env = { ...process.env };
  for (const k of ["KHORA_HOME", "ER7_HOME", "JANUS_HOME", "ZENODOTUS_HOME", "HEIMDALL_HOME", "PENELOPE_WORKSPACE", "HEIMDALL_EMBED"]) delete env[k];
  return env;
};

// ── 1. the clean checkout ────────────────────────────────────────────────────
function cleanCheckout() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "penelope-clean-"));
  const repo = path.join(root, "penelope"); // siblings would be root/khora, root/janus ... (none exist)
  fs.cpSync(path.join(REPO, "organs"), path.join(repo, "organs"), {
    recursive: true,
    filter: (src) => !/[\\/](arrangement-out|node_modules)([\\/]|$)/.test(src),
  });
  fs.mkdirSync(path.join(repo, "gym"), { recursive: true }); // the door's swatch lives here
  fs.copyFileSync(path.join(REPO, "package.json"), path.join(repo, "package.json"));
  for (const f of ["handlers.mjs"]) if (fs.existsSync(path.join(REPO, f))) fs.copyFileSync(path.join(REPO, f), path.join(repo, f));
  return { root, repo };
}

const PROBE = `
import fs from "node:fs"; import path from "node:path"; import { pathToFileURL } from "node:url";
const repo = process.argv[2];
const list = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name);
  if (e.isDirectory()) { if (e.name !== "arrangement-out" && e.name !== "node_modules") walk(p); }
  else if (/\\.mjs$/.test(e.name) && !/\\.test\\.mjs$/.test(e.name)) list.push(p); } };
walk(path.join(repo, "organs"));
const out = { modules: [], weave: {} };
const log = console.log, err = console.error, warn = console.warn;
console.log = console.error = console.warn = () => {};
for (const f of list.sort()) {
  try { await import(pathToFileURL(f).href); out.modules.push({ file: path.relative(repo, f), ok: true }); }
  catch (e) { out.modules.push({ file: path.relative(repo, f), ok: false, name: e.name, code: e.code ?? null, message: String(e.message).split("\\n")[0] }); }
}
const api = await import(pathToFileURL(path.join(repo, "organs/generation/api.mjs")).href);
const tmp = fs.mkdtempSync(path.join(repo, "w-"));
for (const kind of ["code", "code-fix", "code-agent", "text", "overview"]) {
  try {
    const r = await api.weave({ intent: "write an add function", artifact: kind, noModel: true, output: tmp });
    out.weave[kind] = { threw: false, schema: r.schema, status: r.status, ok: r.ok, code: r.code ?? null, looked: r.looked ?? null };
  } catch (e) { out.weave[kind] = { threw: true, name: e.name, code: e.code ?? null, message: String(e.message).split("\\n")[0] }; }
}
try { const r = await api.selftest(); out.selftest = { ok: r?.ok === true, absent: r?.absent ?? null }; }
catch (e) { out.selftest = { ok: false, name: e.name, code: e.code ?? null, message: String(e.message).split("\\n")[0] }; }
console.log = log;
console.log(JSON.stringify(out));
process.exit(0);
`;

// A stub for every door the probe could reach, so the test is hermetic: a real
// mouth / channel / search on this machine is never asked. It answers an empty
// reading and counts what it was asked.
function stubDoors() {
  const hits = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (d) => { body += d; });
    req.on("end", () => {
      hits.push(`${req.method} ${req.url}`);
      res.setHeader("content-type", "application/json");
      if (req.url.includes("/api/generate")) res.end(JSON.stringify({ response: "[]", model: "stub" }));
      else if (req.url.includes("/api/web/search")) res.end(JSON.stringify({ results: [] }));
      else if (req.url.includes("chat/completions")) res.end(JSON.stringify({ choices: [{ message: { content: "" } }] }));
      else res.end(JSON.stringify({ routed: false }));
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${server.address().port}`;
    resolve({ url, hits, close: () => new Promise((r) => server.close(r)) });
  }));
}

const run = (file, args, env) => new Promise((resolve, reject) => {
  execFile(process.execPath, [file, ...args], { encoding: "utf8", env, timeout: 120000, maxBuffer: 16 << 20 }, (err, stdout, stderr) => (err ? reject(Object.assign(err, { stderr })) : resolve(stdout)));
});

test("clean checkout (no sibling): every module loads or fails with a typed <repo>-absent error", async () => {
  const { root, repo } = cleanCheckout();
  const stub = await stubDoors();
  try {
    const probe = path.join(root, "probe.mjs");
    fs.writeFileSync(probe, PROBE);
    const env = { ...cleanEnv(), PENELOPE_MOUTH_URL: stub.url, HEIMDALL_CHANNEL_URL: stub.url, KHORA_SWARM_URL: stub.url + "/v1/swarm", ER7_SEARCH_URL: stub.url + "/api/web/search", ER7_OLLAMA_URL: stub.url, NODE_TEST_CONTEXT: "" };
    delete env.NODE_TEST_CONTEXT;
    const out = JSON.parse((await run(probe, [repo], env)).trim().split("\n").pop());
    const failed = out.modules.filter((m) => !m.ok);
    const untyped = failed.filter((m) => !/^(khora|janus|zenodotus|heimdall)-absent$/.test(String(m.code)));
    assert.deepEqual(untyped.map((m) => `${m.file}: ${m.name} ${m.code} ${m.message}`), [], "a module failed with something other than a typed sibling-absent error");
    // the standalone organs still load (the typed failures are the sibling-bound ones only)
    for (const f of ["organs/generation/api.mjs", "organs/generation/engine.mjs", "organs/generation/adapters/code.mjs", "organs/generation-door.mjs", "organs/kernel-reach.mjs"]) {
      assert.ok(out.modules.find((m) => m.file === f)?.ok, `${f} must load with no sibling`);
    }
    // weave() never throws, for any kind
    for (const [kind, w] of Object.entries(out.weave)) assert.equal(w.threw, false, `weave(${kind}) threw: ${w.name} ${w.code} ${w.message}`);
    // a kind that needs janus is a typed gap, naming the path it looked at
    assert.equal(out.weave["code-fix"].status, "gap");
    assert.equal(out.weave["code-fix"].code, "janus-absent");
    assert.match(String(out.weave["code-fix"].looked), /janus/);
    assert.equal(out.weave["code-agent"].status, "gap");
    assert.match(String(out.weave["code-agent"].code), /-absent$/);
    // the kinds that stand alone are NOT broken by it
    assert.notEqual(out.weave.code.status, "gap", "weave(code) must not be taken down by an absent janus");
    assert.equal(out.weave.code.schema, "Weaving@1");
    assert.equal(out.selftest.ok, true, `api.selftest() must pass standalone: ${out.selftest.message ?? ""}`);
    // negative control: the typed refusal names an absent kind; it is not a silent pass
    assert.ok(out.selftest.absent && out.selftest.absent["code-fix"] === "janus-absent", "selftest names the absent kind");
  } finally { await stub.close(); fs.rmSync(root, { recursive: true, force: true }); }
});

// ── 2. no reach around the resolver ──────────────────────────────────────────
const SOURCE = /\.(m?js|cjs)$/;
const SKIP_DIR = /(^|[\\/])(node_modules|\.git|arrangement-out|apps|wt)([\\/]|$)/;
function sources(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (SKIP_DIR.test(p.slice(REPO.length))) continue;
    if (e.isDirectory()) sources(p, out);
    else if (SOURCE.test(e.name)) out.push(p);
  }
  return out;
}

// A reach is a path that climbs OUT of this checkout toward a sibling repo, or
// names the retired/absolute home. (`..\/..\/organs\/x` inside the repo is not one.)
const SIBLING = "(?:khora|janus|Zenodotus|heimdall|eoreader7|eoreader8)";
const REACHES = [
  new RegExp(`(?:\\.\\./)+${SIBLING}\\b`),                       // "../../khora/native/..."
  new RegExp(`["'\`]\\.\\.["'\`]\\s*,\\s*["'\`]${SIBLING}["'\`]`), // path.join(ROOT, "..", "khora")
  /["'`]\/Users\/[^"'`]*\/Documents\/3\.0/,                      // an absolute workspace path
  /["'`]\/home\/user\/eoreader7/,                                // a ghost default home
  /process\.env\.ER7_HOME/,                                      // the env dialect; resolver owns it
];

test("no source reaches a sibling checkout around organs/kernel-reach.mjs", () => {
  const offenders = [];
  for (const file of sources(REPO)) {
    const rel = path.relative(REPO, file);
    if (rel === path.join("organs", "kernel-reach.mjs") || rel === path.join("organs", "kernel-reach.test.mjs")) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((ln, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(ln)) return; // comments describe, they do not reach
      for (const re of REACHES) if (re.test(ln)) { offenders.push(`${rel}:${i + 1}: ${ln.trim().slice(0, 120)}`); break; }
    });
  }
  assert.deepEqual(offenders, [], "reach sites that bypass the resolver");
});

// ── 3. the resolver ──────────────────────────────────────────────────────────
async function freshResolver() {
  return import(`./kernel-reach.mjs?${Math.random().toString(36).slice(2)}`);
}

test("resolver: env override wins; typed absence names the path it looked at; present resolves", async () => {
  const fake = fs.mkdtempSync(path.join(os.tmpdir(), "fake-khora-"));
  fs.mkdirSync(path.join(fake, "native"), { recursive: true });
  fs.writeFileSync(path.join(fake, "native", "x.js"), "export const answer = 42;\n");
  const saved = { KHORA_HOME: process.env.KHORA_HOME, ER7_HOME: process.env.ER7_HOME, JANUS_HOME: process.env.JANUS_HOME, PENELOPE_WORKSPACE: process.env.PENELOPE_WORKSPACE };
  try {
    delete process.env.ER7_HOME; delete process.env.PENELOPE_WORKSPACE;
    process.env.KHORA_HOME = fake;
    process.env.JANUS_HOME = path.join(fake, "no-such-janus");
    const R = await freshResolver();
    assert.equal(R.kernelHome("khora"), fake);
    assert.equal((await R.kernelImport("khora", "native/x.js")).answer, 42);
    assert.equal(R.kernelHas("khora", "native/x.js"), true);
    // file missing inside a present checkout: typed, names the file
    await assert.rejects(() => R.kernelImport("khora", "native/gone.js"), (e) => e instanceof R.KernelAbsentError && e.code === "khora-absent" && e.reason === "file-missing" && e.looked === path.join(fake, "native", "gone.js"));
    // checkout missing: typed, names the home it looked at
    await assert.rejects(() => R.kernelImport("janus", "native/organs/reasoning-lint.js"), (e) => e.code === "janus-absent" && e.reason === "home-missing" && e.looked === path.join(fake, "no-such-janus"));
    // kernelImportOr: absence -> fallback; a BROKEN present module still throws
    assert.equal(await R.kernelImportOr("janus", "x.js", "fb"), "fb");
    fs.writeFileSync(path.join(fake, "native", "broken.js"), "export const x = ;\n");
    await assert.rejects(() => R.kernelImportOr("khora", "native/broken.js"), (e) => !(e instanceof R.KernelAbsentError));
    // a present module whose OWN sibling reach is missing is re-typed, not left as a bare module-not-found
    fs.writeFileSync(path.join(fake, "native", "chain.js"), `import "${path.join(fake, "no-such-janus", "native", "organs", "lint.js").replace(/\\/g, "/")}";\n`);
    await assert.rejects(() => R.kernelImport("khora", "native/chain.js"), (e) => e.code === "janus-absent");
    // unknown repo: a TypeError, never a guessed path
    assert.throws(() => R.kernelHome("heimdal"), TypeError);
  } finally {
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    fs.rmSync(fake, { recursive: true, force: true });
  }
});

test("resolver: default is the sibling directory; ER7_HOME is a legacy alias for khora only", async () => {
  const names = ["KHORA_HOME", "ER7_HOME", "JANUS_HOME", "ZENODOTUS_HOME", "HEIMDALL_HOME", "PENELOPE_WORKSPACE"];
  const saved = Object.fromEntries(names.map((k) => [k, process.env[k]]));
  try {
    for (const k of names) delete process.env[k];
    const R = await freshResolver();
    assert.equal(R.kernelHome("khora"), path.join(path.dirname(REPO), "khora"));
    assert.equal(R.kernelHome("zenodotus"), path.join(path.dirname(REPO), "Zenodotus"));
    process.env.ER7_HOME = "/legacy/er7";
    assert.equal(R.kernelHome("khora"), path.resolve("/legacy/er7"));
    assert.equal(R.kernelHome("janus"), path.join(path.dirname(REPO), "janus"));
    process.env.KHORA_HOME = "/new/khora";
    assert.equal(R.kernelHome("khora"), path.resolve("/new/khora"), "KHORA_HOME outranks ER7_HOME");
  } finally {
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
});
