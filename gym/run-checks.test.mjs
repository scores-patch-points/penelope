// gym/run-checks.test.mjs — the gate's runner fails on a test that is not there.
// (The phantom: package.json listed organs/generation/provenance.test.mjs, which
// never existed, and node --test skipped it and exited 0.)
// Run: node --test gym/run-checks.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { missing, runTests, runSelftests } from "./run-checks.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "run-checks-"));
fs.writeFileSync(path.join(root, "present.test.mjs"), 'import { test } from "node:test"; test("present", () => {});\n');
fs.writeFileSync(path.join(root, "failing.test.mjs"), 'import { test } from "node:test"; import assert from "node:assert"; test("fails", () => assert.equal(1, 2));\n');
fs.mkdirSync(path.join(root, "dir.test.mjs"));
fs.writeFileSync(path.join(root, "st-ok.mjs"), "export const selftest = () => ({ ok: true });\n");
fs.writeFileSync(path.join(root, "st-false.mjs"), "export const selftest = () => ({ ok: false });\n");
fs.writeFileSync(path.join(root, "st-absent.mjs"), 'export const selftest = () => { const e = new Error("khora-absent: x"); e.name = "KernelAbsentError"; e.code = "khora-absent"; e.looked = "/nowhere"; throw e; };\n');
fs.writeFileSync(path.join(root, "st-throws.mjs"), 'export const selftest = () => { throw new Error("boom"); };\n');

test("missing(): a listed file that is not a file is named", () => {
  assert.deepEqual(missing(["present.test.mjs", "gone.test.mjs", "dir.test.mjs"], root), ["gone.test.mjs", "dir.test.mjs"]);
});

test("a listed test that does not exist FAILS the run, named (was: silently skipped, exit 0)", () => {
  const r = runTests(["present.test.mjs", "provenance.test.mjs"], { root, stdio: "ignore" });
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing, ["provenance.test.mjs"]);
  assert.match(r.error, /provenance\.test\.mjs/);
});

test("control: present tests pass; a failing test fails; an empty list is refused", () => {
  assert.equal(runTests(["present.test.mjs"], { root, stdio: "ignore" }).ok, true);
  assert.equal(runTests(["failing.test.mjs"], { root, stdio: "ignore" }).ok, false);
  assert.equal(runTests([], { root, stdio: "ignore" }).ok, false);
});

test("selftests: ok passes, ok:false and a throw fail, a typed sibling absence is a named skip (not a pass, not a failure)", async () => {
  const quiet = { log: () => {}, err: () => {} };
  assert.equal((await runSelftests(["st-ok.mjs"], { root, ...quiet })).ok, true);
  assert.equal((await runSelftests(["st-false.mjs"], { root, ...quiet })).ok, false);
  assert.equal((await runSelftests(["st-throws.mjs"], { root, ...quiet })).ok, false);
  const skipped = await runSelftests(["st-ok.mjs", "st-absent.mjs"], { root, ...quiet });
  assert.equal(skipped.ok, true);
  assert.deepEqual(skipped.passed, ["st-ok.mjs"]);
  assert.deepEqual(skipped.skipped.map((s) => [s.mod, s.code]), [["st-absent.mjs", "khora-absent"]]);
  assert.equal((await runSelftests(["gone.mjs"], { root, ...quiet })).ok, false);
});
