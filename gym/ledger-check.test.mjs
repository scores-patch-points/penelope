import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseLedger, checkLedger, checkFiles, parsePins, pinsToWrite, latestPin } from "./ledger-check.mjs";

const SPLITS = { a: { what: "x", regenerate: "r" }, b: { what: "y", regenerate: "r" } };
const row = (n, label, splits, { result = "a number", stamp = "0123456789abcdef", repro = "`python3 s.py`" } = {}) => `| ${n} | claim | ${result} | ${label} | ${splits} | ${stamp} | ${repro} |`;
const check = (lines, o = {}) => checkLedger({ rows: parseLedger(lines.join("\n")), splits: o.splits ?? SPLITS, exists: o.exists ?? (() => true) });

test("a ledger whose labels match its roles and whose held-out is read once passes", () => {
  assert.deepEqual(check([row(1, "HELD-OUT", "a:held"), row(2, "DEV + REUSED", "a:reused, b:dev"), row(3, "EXPLORATORY", "b:explore", { stamp: "n/a" })]), []);
});
test("a held-out scored a second time as held-out is flagged: it is reused, not held-out", () => {
  const p = check([row(1, "HELD-OUT", "a:held"), row(2, "HELD-OUT", "a:held, b:dev".replace(", b:dev", "")), row(3, "DEV", "b:dev")]);
  assert.equal(p.length, 1); assert.match(p[0], /ROW 2: scores split a as held, but row 1 already scored it/);
});
test("a fresh set scored as fresh after an earlier dev use is flagged", () => {
  assert.match(check([row(1, "DEV", "b:dev"), row(2, "FRESH", "b:fresh")])[0], /ROW 2: scores split b as fresh, but row 1 already scored it/);
});
test("a label that is not the labels of its roles is flagged (both directions)", () => {
  assert.match(check([row(1, "HELD-OUT", "a:dev")])[0], /label "HELD-OUT" is not the labels of its roles \(DEV\)/);
  assert.match(check([row(1, "DEV", "a:dev, b:held")])[0], /not the labels of its roles \(DEV \+ HELD-OUT\)/);
});
test("the prose may not outrun the label: a DEV row whose result says HELD-OUT is flagged", () => {
  assert.match(check([row(1, "DEV", "a:dev", { result: "HELD-OUT once: 0.9" })])[0], /the Result text says HELD-OUT but the row's label is "DEV"/);
});
test("a row that is not purely exploratory needs a stamp; an exploratory row does not", () => {
  assert.match(check([row(1, "DEV", "a:dev", { stamp: "none" })])[0], /no stamp/);
  assert.deepEqual(check([row(1, "EXPLORATORY", "a:explore", { stamp: "see note" }), row(2, "DEV", "b:dev")]), []);
});
test("a json file named in Reproduce is not mistaken for a js script", () => {
  const seen = [];
  check([row(1, "DEV", "a:dev, b:dev", { repro: "`python3 x.py fresh2-fr.json`" })], { exists: (rel) => { seen.push(rel); return true; } });
  assert.deepEqual(seen, ["x.py"]);
});
test("a named script that does not exist, an unknown split and an unused split are flagged", () => {
  assert.match(check([row(1, "DEV", "a:dev, b:dev", { repro: "`python3 gone.py`" })], { exists: () => false })[0], /gone\.py, which does not exist/);
  assert.match(check([row(1, "DEV", "zzz:dev")])[0], /split zzz is not in splits.json/);
  assert.ok(check([row(1, "DEV", "a:dev")]).some((x) => /SPLIT b: no row uses it/.test(x)));
});
test("a malformed row is flagged, never skipped", () => {
  assert.match(check(["| 1 | only | three |"])[0], /ROW 1: malformed/);
});
test("the real zero-overlap ledger's labels hold", () => {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "experiments", "zero-overlap");
  assert.deepEqual(checkFiles(dir), []);
});

const pin = (row, file, sha, why = "initial", at = "2026-11-18") => ({ schema: "MeasurePin@1", row, file, sha256: sha, at, why });
const withPins = (pins, sha) => checkLedger({ rows: parseLedger([row(1, "DEV", "a:dev, b:dev", { repro: "`python3 s.py`" })].join("\n")), splits: SPLITS, exists: () => true, pins, shaOf: () => sha });
test("a measure that is not pinned is flagged; a pinned one whose bytes are unchanged passes", () => {
  assert.match(withPins([], "aaa")[0], /s\.py is not pinned/);
  assert.deepEqual(withPins([pin(1, "s.py", "aaa")], "aaa"), []);
});
test("a measure CHANGED under its name is flagged with its pin and reason, until the change is recorded", () => {
  const p = withPins([pin(1, "s.py", "aaa", "first")], "bbb");
  assert.equal(p.length, 1); assert.match(p[0], /the measure s\.py changed since its pin of 2026-11-18 \(first\)/);
  assert.deepEqual(withPins([pin(1, "s.py", "aaa", "first"), pin(1, "s.py", "bbb", "the null was redrawn; numbers re-run in row 18")], "bbb"), []);
});
test("pinsToWrite appends only the missing or changed pins, with the reason", () => {
  const rows = parseLedger([row(1, "DEV", "a:dev", { repro: "`python3 s.py` `python3 t.py`" })].join("\n"));
  const out = pinsToWrite({ rows, pins: [pin(1, "s.py", "aaa")], shaOf: (f) => (f === "s.py" ? "aaa" : "ccc"), exists: () => true, why: "new script", at: "2026-11-19" });
  assert.deepEqual(out.map((x) => [x.file, x.sha256, x.why]), [["t.py", "ccc", "new script"]]);
});
test("a malformed pin line is reported, never skipped", () => {
  const parsed = parsePins(JSON.stringify(pin(1, "s.py", "aaa")) + "\nnot json\n" + JSON.stringify({ schema: "MeasurePin@1", row: 1 }));
  assert.equal(parsed.filter((x) => x.bad).length, 2); assert.equal(latestPin(parsed.filter((x) => !x.bad), 1, "s.py").sha256, "aaa");
});
