// organs/generation/program.test.mjs — the program log's properties, shown.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { append, readLog, materialize, projectTo, heal, iterate, selftest } from "./program.mjs";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "prog-"));
const log = (rows) => rows.map((c, i) => ({ seq: i, ...c }));

test("selftest holds", () => assert.equal(selftest().ok, true));

test("materialize is PURE — same log, same files (no clock leaks)", () => {
  const c = log([{ kind: "file", path: "a.js", code: "x" }, { kind: "patch", path: "a.js", find: "x", add: "y" }]);
  assert.equal(materialize(c).files["a.js"], "y");
  assert.equal(materialize(c.map((x) => ({ ...x, at: "2099" }))).files["a.js"], "y");
});

test("provenance: every act that shaped a file is on the record", () => {
  const p = materialize(log([
    { kind: "file", path: "a.js", code: "x", source: "seed" },
    { kind: "patch", path: "a.js", find: "x", add: "y", source: "field", address: "git#a" },
    { kind: "invent", path: "a.js", find: "y", add: "z", model: "qwen" },
  ]));
  assert.deepEqual(p.provenance[0].provenance.map((x) => [x.act, x.address, x.model]), [["file", null, null], ["patch", "git#a", null], ["invent", null, "qwen"]]);
});

test("a find whose bytes are absent is a REFUSAL, never applied", () => {
  const p = materialize(log([{ kind: "file", path: "a.js", code: "x" }, { kind: "patch", path: "a.js", find: "NOPE", add: "z" }]));
  assert.equal(p.files["a.js"], "x");
  assert.equal(p.refusals, 1);
});

test("a NO-OP (add === find) is a REFUSAL — a mouth echoing the anchor is not a heal", () => {
  const p = materialize(log([{ kind: "file", path: "a.js", code: "x" }, { kind: "invent", path: "a.js", find: "x", add: "x", model: "m" }]));
  assert.equal(p.files["a.js"], "x");
  assert.equal(p.refusals, 1);
  assert.equal(p.provenance[0].provenance.length, 1); // no invented act recorded
});

test("iterate is APPEND — the last act wins, prior projections are stable prefixes", () => {
  const dir = tmp(), logPath = path.join(dir, "p.jsonl");
  fs.writeFileSync(logPath, "");
  append(logPath, { seq: 0, kind: "file", path: "a.js", code: "1" });
  const p1 = materialize(readLog(logPath));
  const p2 = iterate({ logPath, act: { kind: "patch", path: "a.js", find: "1", add: "2" } });
  assert.equal(p1.files["a.js"], "1");
  assert.equal(p2.files["a.js"], "2");
});

test("heal by HUNT: file → test red → hunted patch → test green; projection reproducible", async () => {
  const dir = tmp(), logPath = path.join(dir, "p.jsonl");
  fs.writeFileSync(logPath, "");
  append(logPath, { seq: 0, kind: "file", path: "m.mjs", code: "export const v = 1;\n" });
  fs.writeFileSync(path.join(dir, "t.mjs"), `import assert from "node:assert/strict"; import { v } from "./m.mjs"; assert.equal(v, 2);\n`);
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "module", scripts: { test: "node t.mjs" } }));
  const { projection, rounds, claims } = await heal({
    logPath, dir, testCommand: "npm test",
    hunt: () => ({ path: "m.mjs", find: "v = 1", add: "v = 2", source: "field", address: "field://m#v" }),
  });
  assert.equal(projection.verdict.ok, true);
  assert.equal(rounds.length, 2);
  assert.deepEqual(claims.filter((c) => c.kind === "patch").map((c) => c.source), ["field"]);
  assert.equal(materialize(readLog(logPath)).files["m.mjs"], "export const v = 2;\n");
});

test("heal by INVENT: no field → the mouth draws it; a mouth that returns nothing is a refusal, not a crash", async () => {
  const dir = tmp(), logPath = path.join(dir, "p.jsonl");
  fs.writeFileSync(logPath, "");
  append(logPath, { seq: 0, kind: "file", path: "m.mjs", code: "export const v = 1;\n" });
  fs.writeFileSync(path.join(dir, "t.mjs"), `import assert from "node:assert/strict"; import { v } from "./m.mjs"; assert.equal(v, 3);\n`);
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "module", scripts: { test: "node t.mjs" } }));
  const { projection, claims } = await heal({
    logPath, dir, testCommand: "npm test",
    hunt: () => null,
    invent: () => ({ path: "m.mjs", find: "v = 1", add: "v = 3", model: "qwen" }),
  });
  assert.equal(projection.verdict.ok, true);
  assert.deepEqual(claims.filter((c) => c.kind === "invent").map((c) => c.model), ["qwen"]);
  // an empty mouth walls honestly
  const dir2 = tmp(), log2 = path.join(dir2, "p.jsonl");
  fs.writeFileSync(log2, "");
  append(log2, { seq: 0, kind: "file", path: "m.mjs", code: "x" });
  const r2 = await heal({ logPath: log2, dir: dir2, testCommand: "node -e 'process.exit(1)'", hunt: () => null, invent: () => null, maxRounds: 3 });
  assert.equal(r2.projection.verdict.ok, false);
  assert.ok(r2.claims.some((c) => c.kind === "refusal"));
});
