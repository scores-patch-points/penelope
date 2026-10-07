#!/usr/bin/env node
// gym/agentic-server.mjs — THE SIMPLIFIED AGENTIC MODE, back and visible.
// A tiny surface: pick a run, watch the real loop stream — the reason-gate's
// intent, the hunt, the draw, the append-only log, the projection, the test.
//
//   node gym/agentic-server.mjs [--port 8853]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const EXPRESS = "/var/folders/ck/tztwm60n4s9dxwrjfwlsmz3m0000gn/T/opencode/express";
const MINIJS = "/var/folders/ck/tztwm60n4s9dxwrjfwlsmz3m0000gn/T/opencode/minijs";
const port = Number((process.argv.find((a) => a.startsWith("--port=")) ?? "--port=8853").split("=")[1]);

const DEMOS = {
  calc: { label: "Build an expression evaluator — ZERO model draws", args: ["gym/build-calc-demo.mjs", "--nomodel"] },
  program: { label: "A program heals — hunt (field) + invent (mouth), append-only log", args: ["gym/program-demo.mjs"] },
  ...(fs.existsSync(EXPRESS) ? { express: { label: "Heal a real bug in express (214 files) — wired path, ZERO draws", args: ["gym/program-wired-demo.mjs", EXPRESS] } } : {}),
  ...(fs.existsSync(MINIJS) ? { minijs: { label: "A 1.5B writes a JavaScript evaluator (V8 is the judge)", args: ["gym/mini-js-ast.mjs", MINIJS] } } : {}),
};

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type" };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/") {
    res.writeHead(200, { "content-type": "text/html", ...CORS });
    res.end(fs.readFileSync(path.join(HERE, "agentic.html")));
    return;
  }
  if (u.pathname === "/api/demos") {
    res.writeHead(200, { "content-type": "application/json", ...CORS });
    res.end(JSON.stringify(DEMOS));
    return;
  }
  if (u.pathname === "/api/run") {
    const key = u.searchParams.get("demo");
    const demo = DEMOS[key];
    if (!demo) { res.writeHead(404, CORS); res.end("no such demo"); return; }
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "transfer-encoding": "chunked", ...CORS });
    const child = spawn(process.execPath, demo.args, { cwd: ROOT });
    child.stdout.on("data", (d) => res.write(d));
    child.stderr.on("data", (d) => res.write(d));
    child.on("close", (code) => res.end(`\n[exit ${code}]\n`));
    req.on("close", () => child.kill());
    return;
  }
  res.writeHead(404, CORS); res.end("not found");
});
server.listen(port, "127.0.0.1", () => console.log(`agentic mode on http://127.0.0.1:${port}/`));
