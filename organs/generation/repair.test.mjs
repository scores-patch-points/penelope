// organs/generation/repair.test.mjs — the wired repair path, shown.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { snipFunction, garyPrompt, classifyIntent, huntCommitted, wired } from "./repair.mjs";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "repair-"));

test("snipFunction takes the EXACT atom (no rewrite) so it matches its source", () => {
  const src = "res.send = function send(body) {\n  return body;\n}";
  const atom = snipFunction(src, "send");
  assert.ok(src.includes(atom), "the atom is a verbatim substring of its source");
});

test("garyPrompt is Gary-clean: facts, no prohibition, the ask last", async () => {
  const bag = garyPrompt({ file: "a.js", name: "f", find: "function f(){return 1;}", facts: ["The real test fails: expected 2"] });
  assert.equal(bag.messages.at(-1).role, "user");
  assert.ok(!bag.findings.some((f) => f.rule === "information-not-prohibition"), "no prohibition aimed at the mouth");
  assert.ok(!bag.refused.some((f) => f.rule === "no-json-ask"));
});

test("classifyIntent routes mechanical before invent before refuse", () => {
  assert.equal(classifyIntent({ fieldFix: { add: "x" } }).lane, "mechanical");
  assert.equal(classifyIntent({}).lane, "invent");
  assert.equal(classifyIntent({ freeDraw: false }).lane, "refuse");
});

test("huntCommitted returns the committed version of the unit", () => {
  const dir = tmp();
  execFileSync("git", ["init", "-q"], { cwd: dir });
  fs.writeFileSync(path.join(dir, "m.js"), "module.exports = function f(x){ return x * 2; };\n");
  execFileSync("git", ["-C", dir, "add", "-A"]); execFileSync("git", ["-C", dir, "-c", "user.email=a@b", "-c", "user.name=a", "commit", "-qm", "v"]);
  fs.writeFileSync(path.join(dir, "m.js"), "module.exports = function f(x){ return x + 2; };\n"); // the bug (uncommitted)
  const hit = huntCommitted({ dir, rel: "m.js", name: "f" });
  assert.ok(hit.add.includes("x * 2"), "the field holds the committed (correct) function");
});

test("wired.hunt returns a mechanical patch when the field differs; no-field otherwise", async () => {
  const claims = [{ seq: 0, kind: "file", path: "m.js", code: "function f(){ return 1; }" }];
  const w = wired({ dir: ".", rel: "m.js", name: "f", draw: async () => "", huntFns: [() => ({ add: "function f(){ return 2; }", source: "git", address: "HEAD#m.js#f" })] });
  const fix = await w.hunt({ claims });
  assert.equal(fix.source, "git");
  assert.equal(fix.find, "function f(){ return 1; }");
  assert.equal(fix.add, "function f(){ return 2; }");
  assert.equal(w.report.lanes.at(-1).lane, "mechanical");
  const w2 = wired({ dir: ".", rel: "m.js", name: "f", draw: async () => "", huntFns: [() => null] });
  assert.equal(await w2.hunt({ claims }), null);
  assert.equal(w2.report.lanes.at(-1).lane, "no-field");
});
