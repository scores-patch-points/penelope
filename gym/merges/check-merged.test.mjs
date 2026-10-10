// gym/merges/check-merged.test.mjs — MERGED by widget-merge-github-demo.mjs.
// Reads the merged artifact (two real GitHub widgets in one page) back from
// disk and holds it: tip contract (derived from BASE A's real line) and the
// two real kernels merged from BASE B (celsiusToFahrenheit, celsiusToKelvin).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { judgePage } from "../../organs/behavior-check.mjs";
const HERE = path.dirname(fileURLToPath(import.meta.url));
test("the merged page holds: derived tip contract + BASE B's real kernels", () => {
  const html = fs.readFileSync(path.join(HERE, "tip-temp-merged.html"), "utf8");
  const r = judgePage(html, {
    needs: ["tipComponents", "celsiusToFahrenheit", "celsiusToKelvin"],
    cases: [
      { fn: "tipComponents", args: [100, 20], compute: { kind: "tip", amount: 100, percent: 20 } },
      { fn: "celsiusToFahrenheit", args: [100], compute: { expression: "c*9/5+32", bind: { c: 100 } } },
      { fn: "celsiusToKelvin", args: [0], compute: { expression: "c+273.15", bind: { c: 0 } } },
    ],
  });
  assert.equal(r.ok, true, r.findings.map((f) => f.detail).join("; "));
  assert.ok(r.observations.every((o) => o.cell && o.cell.op), "every act carries a cube cell");
});
