// organs/mouth.test.mjs — the house numbers are the ones the mouth reads.
//
// HOUSE.familyCap and HOUSE.retryAttempts were declared, documented as bounds
// ("family cap 4 in flight"), exported over /v1/mouth/status, and read by
// nothing: the in-flight cap is the bridge's (khora's heimdall enforces it), so
// the mouth's copy stated a limit this server never held. A declared bound that
// nothing reads is a claim with nothing under it.
// Run: node --test organs/mouth.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HOUSE, selftest, admit } from "./mouth.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => fs.readFileSync(path.join(REPO, rel), "utf8");

// the keys of `HOUSE` that no `HOUSE.<key>` read names, in the given sources
export function unreadKeys(keys, sources) {
  const read = (k) => sources.some((s) => new RegExp(`\\bHOUSE\\.${k}\\b`).test(s));
  return keys.filter((k) => !read(k));
}
// strip the declaration itself, so a key's own `key: value,` is not a read
const withoutDeclaration = (s) => s.replace(/export const HOUSE = \{[\s\S]*?\n\};/, "");

test("every HOUSE number is read by the mouth's own code (a stated bound with no reader is a claim with nothing under it)", () => {
  const sources = [withoutDeclaration(src("organs/mouth.mjs")), src("mouth/server.mjs")];
  assert.deepEqual(unreadKeys(Object.keys(HOUSE), sources), []);
});

test("falsifying control: the check sees the two removed keys as unread when they are declared", () => {
  const sources = [withoutDeclaration(src("organs/mouth.mjs")), src("mouth/server.mjs")];
  assert.deepEqual(unreadKeys([...Object.keys(HOUSE), "familyCap", "retryAttempts"], sources), ["familyCap", "retryAttempts"]);
});

test("the mouth's own selftest holds, and the ration still bounds an identity", () => {
  const before = process.exitCode;
  const log = console.log;
  console.log = () => {};
  try { selftest(); } finally { console.log = log; }
  assert.equal(process.exitCode, before, "a selftest FAIL line sets process.exitCode");
  const now = 1_000_000;
  const full = Array.from({ length: HOUSE.ration }, (_, i) => ({ ts: now - i * 1000, kind: "code" }));
  assert.equal(admit("me", { log: full, now }).status, 429);
});
