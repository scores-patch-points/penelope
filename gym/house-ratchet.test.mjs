// gym/house-ratchet.test.mjs — red may not grow; the baseline only appends.
// Run: node --test gym/house-ratchet.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { compare } from "./house-ratchet.mjs";
import { readBaseline, knownRed, appendRecords, SCHEMA } from "./house-baseline.mjs";

const cur = (...ids) => ids.map((id) => ({ id, line: id }));
const red = (id) => ({ schema: SCHEMA, op: "red", id, line: id });
const green = (id) => ({ schema: SCHEMA, op: "green", id });

test("a NEW red line is the gate's failure; a known one is carried; a fixed one is reported", () => {
  const c = compare(cur("a", "b", "new"), [red("a"), red("b"), red("fixed")]);
  assert.deepEqual(c.added.map((r) => r.id), ["new"]);
  assert.deepEqual(c.carried.map((r) => r.id), ["a", "b"]);
  assert.deepEqual(c.fixed, ["fixed"]);
});

test("negative control: with everything known, nothing is added", () => {
  assert.deepEqual(compare(cur("a", "b"), [red("a"), red("b")]).added, []);
  assert.deepEqual(compare([], [red("a")]).added, []);
});

test("the ratchet holds: a line fixed (green) and then regressed is NEW red again, not a known one", () => {
  const records = [red("x"), green("x")];
  assert.equal(knownRed(records).has("x"), false);
  assert.deepEqual(compare(cur("x"), records).added.map((r) => r.id), ["x"]);
  // and re-recorded after a conscious decision, it is known again
  assert.equal(knownRed([...records, red("x")]).has("x"), true);
});

test("the baseline file only APPENDS: earlier bytes are never rewritten, and a malformed line is an error, named", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "house-baseline-"));
  const file = path.join(dir, "b.jsonl");
  appendRecords([{ op: "red", id: "a", line: "a", at: "2026-10-14", why: "w" }], file);
  const first = fs.readFileSync(file, "utf8");
  appendRecords([{ op: "red", id: "b", line: "b", at: "2026-10-14", why: "w" }, { op: "green", id: "a", at: "2026-10-14", why: "fixed" }], file);
  const second = fs.readFileSync(file, "utf8");
  assert.ok(second.startsWith(first), "the first record's bytes are untouched");
  const { records, errors } = readBaseline(file);
  assert.equal(records.length, 3);
  assert.deepEqual(errors, []);
  assert.deepEqual([...knownRed(records)], ["b"]);
  fs.appendFileSync(file, "not json\n");
  assert.equal(readBaseline(file).errors.length, 1);
  assert.match(readBaseline(file).errors[0], /line 4/);
  assert.equal(appendRecords([], file), 0, "an empty append writes nothing");
});
