import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { brief, generate, load } from "./session-brief.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const row = (n, label, claim, result) => ({ n, label, claim, result });

test("the committed BRIEF.md is exactly what the rules and the ledger generate (it cannot rot)", () => {
  assert.equal(fs.readFileSync(path.join(ROOT, "BRIEF.md"), "utf8"), generate(ROOT), "run: node gym/session-brief.mjs --write");
});
test("the real brief carries every rule, every ledger row, a start-of-session step and is short", () => {
  const { rules, rows } = load(ROOT), text = generate(ROOT);
  for (const r of rules) assert.ok(text.includes(r.rule), `rule missing: ${r.rule.slice(0, 40)}`);
  for (const r of rows) assert.ok(text.includes(`#${r.n} [`), `ledger row ${r.n} missing`);
  assert.match(text, /git fetch/); assert.match(text, /ONE door/);
  assert.ok(text.split("\n").length <= 80, `the brief is ${text.split("\n").length} lines; a brief nobody reads is no brief`);
});
test("a new ledger row changes the brief, and a refused result lands under TRIED AND REFUSED", () => {
  const a = brief({ rules: [], rows: [row(1, "DEV", "frame a", "worked: 0.9")] });
  const b = brief({ rules: [], rows: [row(1, "DEV", "frame a", "worked: 0.9"), row(2, "DEV", "frame b", "REFUSED: the control matches it")] });
  assert.notEqual(a, b);
  assert.match(b.split("## Tried and refused")[1], /#2 frame b/); assert.doesNotMatch(a.split("## Tried and refused")[1], /#1 frame a/);
});
test("long results are clipped and no row is dropped", () => {
  const t = brief({ rules: [], rows: [row(1, "DEV", "c", "x".repeat(400))] });
  assert.ok(t.split("\n").find((l) => l.startsWith("- #1")).length < 260);
});

// the hook: gated by project, says plainly when it has no brief, prints the brief when it has one, falls back to its cache
const HOOK = path.join(ROOT, "gym", "session-brief-hook.sh");
const hook = (cwd, home, url) => spawnSync("sh", [HOOK], { cwd, encoding: "utf8", env: { PATH: process.env.PATH, HOME: home, BRIEF_URL: url } }).stdout;
test("the hook prints nothing in an unrelated project, a plain notice with no brief and no cache, the brief when it can fetch, and the cache when it cannot", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "hook-home-")), proj = fs.mkdtempSync(path.join(os.tmpdir(), "hook-")), khora = path.join(proj, "khora"), jobs = path.join(proj, "jobs");
  fs.mkdirSync(khora); fs.mkdirSync(jobs);
  assert.equal(hook(jobs, home, "file:///nonexistent"), "", "an unrelated project gets nothing");
  assert.match(hook(khora, home, "file:///nonexistent"), /SESSION BRIEF UNAVAILABLE/, "no brief and no cache says so");
  assert.match(hook(khora, home, "file://" + path.join(ROOT, "BRIEF.md")), /^# SESSION BRIEF/, "fetched");
  assert.match(hook(khora, home, "file:///nonexistent"), /^# SESSION BRIEF/, "the cache answers when the source is gone");
});
