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

// the hook's status line: found by the git remote, a warning off the default branch or behind it, the gate read from CLAUDE.md, nothing elsewhere
const git = (cwd, ...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd, encoding: "utf8" });
const repoWith = (remote, name = "khora") => {
  const d = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "nx-")), name); fs.mkdirSync(d); git(d, "init", "-q", "-b", "main");
  fs.writeFileSync(path.join(d, "CLAUDE.md"), "# x\n- Gate (run it before you finish): `npm test`\n"); git(d, "add", "."); git(d, "commit", "-q", "-m", "one");
  git(d, "remote", "add", "origin", remote); const sha = git(d, "rev-parse", "HEAD").stdout.trim();
  git(d, "update-ref", "refs/remotes/origin/main", sha); git(d, "symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/main"); return d;
};
const run = (cwd) => hook(cwd, fs.mkdtempSync(path.join(os.tmpdir(), "hh-")), "file://" + path.join(ROOT, "BRIEF.md"));
test("hook: in a nexus repo (found by its remote, whatever the folder is called) it prints repo, branch, commit, the gate, and no warning when up to date on the default branch", () => {
  const d = repoWith("https://github.com/scores-patch-points/zzrepo.git", "folder-with-another-name"), out = run(d);
  assert.match(out, /^NEXUS: repo zzrepo · branch main @ [0-9a-f]{7} · 0 commit\(s\) behind origin\/main/);
  assert.match(out, /NEXUS: gate: `npm test`/); assert.doesNotMatch(out, /WARNING/); assert.match(out, /# SESSION BRIEF/);
});
test("hook: off the default branch it warns (the stale-branch trap), and an ssh remote is found too", () => {
  const d = repoWith("git@github.com:scores-patch-points/zzrepo.git"); git(d, "checkout", "-q", "-b", "cast-identity");
  assert.match(run(d), /NEXUS WARNING: you are on 'cast-identity', not 'main'/);
});
test("hook: behind the default branch it says how far", () => {
  const d = repoWith("https://github.com/scores-patch-points/zzrepo.git"); git(d, "checkout", "-q", "-b", "ahead"); fs.writeFileSync(path.join(d, "f"), "1"); git(d, "add", "."); git(d, "commit", "-q", "-m", "two");
  const ahead = git(d, "rev-parse", "HEAD").stdout.trim(); git(d, "update-ref", "refs/remotes/origin/main", ahead); git(d, "checkout", "-q", "main");
  const out = run(d); assert.match(out, /1 commit\(s\) behind origin\/main/); assert.match(out, /NEXUS WARNING: this checkout is 1 commit\(s\) behind/);
});
test("hook: a repo whose remote is not the nexus, in a folder that is not a Fold/EO folder, gets nothing", () => {
  const d = repoWith("https://github.com/someone-else/proj.git", "jobsearch"); assert.equal(run(d), "");
});

test("hook: a stale local origin/HEAD that points at a feature branch does not become the default; the kit's own Default-branch line wins", () => {
  const d = repoWith("https://github.com/scores-patch-points/zzrepo.git"); git(d, "checkout", "-q", "-b", "attention-binder");
  const sha = git(d, "rev-parse", "HEAD").stdout.trim(); git(d, "update-ref", "refs/remotes/origin/attention-binder", sha);
  git(d, "symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/attention-binder");
  assert.match(run(d), /behind origin\/main/); assert.doesNotMatch(run(d), /origin\/attention-binder/);
  fs.writeFileSync(path.join(d, "CLAUDE.md"), "# x\nLevel `L2`. Default branch `fold`.\n- Gate (run it before you finish): `npm test`\n");
  assert.match(run(d), /behind origin\/fold/, "the kit's line names the default");
});
