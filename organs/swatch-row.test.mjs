import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("a draw lands one Swatch@1 row, refused draws included, and the real swatch is untouched", async () => {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "swatch-")), "swatch.jsonl");
  process.env.SWATCH_PATH = tmp;
  const { swatch } = await import("./swatch-row.mjs");
  swatch({ weave: "draw:test", engine: "test", model: "m", ok: true });
  swatch({ weave: "draw:test", engine: "test", model: "m", ok: false });
  const rows = fs.readFileSync(tmp, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.verdict), ["drawn", "refused"]);
  assert.ok(rows.every((r) => r.schema === "Swatch@1" && r.class === "draw" && r.mouthCalls === 1));
  delete process.env.SWATCH_PATH;
});
