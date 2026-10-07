#!/usr/bin/env node
// gym/program-wired-demo.mjs — the express bug, healed by the WIRED path:
// the reason-gate classifies the intent, the hunt reaches the git field
// (mechanical, zero draws), and Gary + the snip stand ready for the residue.
//
//   node gym/program-wired-demo.mjs <express-repo>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { append, readLog, materialize, heal } from "../organs/generation/program.mjs";
import { wired, huntCommitted } from "../organs/generation/repair.mjs";
import { draw } from "../organs/generation/engine.mjs";

const W = process.argv[2];
const REL = "lib/response.js";
const NAME = "send";
const TEST = "npx mocha --require test/support/env test/res.send.js";

const logPath = path.join(os.tmpdir(), "express.program.log.jsonl");
fs.writeFileSync(logPath, "");
append(logPath, { seq: 0, kind: "file", path: REL, code: fs.readFileSync(path.join(W, REL), "utf8"), source: "working-tree" });

const repair = wired({
  dir: W, rel: REL, name: NAME,
  draw: (prompt) => draw(prompt, { maxTokens: 260, model: "qwen2.5-coder:1.5b", kind: "build" }),
  huntFns: [huntCommitted],
});
const { rounds, projection, claims } = await heal({ logPath, dir: W, testCommand: TEST, hunt: repair.hunt, invent: repair.invent, maxRounds: 4 });

console.log("=== THE WIRED HEAL — express, " + REL + " ===");
console.log("the reason-gate (intent, before any draw):");
for (const l of repair.report.lanes) console.log("  " + l.lane + (l.field ? " · field=" + l.field + " · " + l.address : ""));
if (repair.report.gary.length) for (const g of repair.report.gary) console.log("  gary findings:", g.findings.join(",") || "clean", "| refused:", g.refused.join(",") || "none");
console.log("the log:");
for (const c of claims) console.log(`  ${String(c.seq).padStart(2)} ${[c.kind, c.path ?? "", c.source ? "source=" + c.source : "", c.address ? "@" + c.address : "", c.model ? "model=" + c.model : "", c.ok !== undefined ? "ok=" + c.ok : "", c.reason ? "(" + c.reason + ")" : ""].filter(Boolean).join(" ")}`);
console.log("provenance:", projection.provenance.map((p) => p.path + " <- " + p.provenance.map((x) => x.act + (x.address ? " " + x.address : "")).join(" <- ")).join("  "));
console.log(`the real test: ${projection.verdict?.ok ? "PASS" : "FAIL"} · rounds ${rounds.length} · zero draws: ${!claims.some((c) => c.kind === "invent")}`);
