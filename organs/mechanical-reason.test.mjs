import { test } from "node:test";
import assert from "node:assert/strict";
import { cellDistance, cellsOf, equivalence, relationsOf, cellStop } from "./mechanical-reason.mjs";

const HAVE = process.env.KHORA_HOME || (await (async () => { try { await import("./kernel-reach.mjs").then(m => m.kernelImport("khora", "native/reading-one.mjs")); return true; } catch { return false; } })());

test("cellDistance: identical is zero, disjoint is large", () => {
  assert.equal(cellDistance({ a: 3, b: 2 }, { a: 3, b: 2 }), 0);
  assert.ok(cellDistance({ a: 10 }, { x: 10 }) > 0);
});

test("cellDistance: symmetric", () => {
  const a = { x: 5, y: 3 }, b = { y: 4, z: 2 };
  assert.ok(Math.abs(cellDistance(a, b) - cellDistance(b, a)) < 1e-9);
});

test("cellsOf: reads a text to the cell layer (skips if khora absent)", { skip: !HAVE }, async () => {
  const c = await cellsOf("The cat sat on the mat. The dog ran in the park. The bird sang in the tree. The sun shone on the grass.".repeat(4), { language: "en" });
  assert.equal(c.gap, null);
  assert.ok(Object.keys(c.cells).length > 0, "cells were produced");
});

test("equivalence: a text is the same as itself", { skip: !HAVE }, async () => {
  const t = "The cat sat on the mat. The dog ran in the park. The bird sang in the tree. The sun shone on the grass.".repeat(4);
  const e = await equivalence(t, t, { language: "en" });
  assert.equal(e.verdict, "same");
});

test("relationsOf: extracts predicate/agent/patient triples", { skip: !HAVE }, async () => {
  const r = await relationsOf("The cat sat on the mat. The dog chased the ball. The bird flew over the tree.".repeat(4), { language: "en" });
  assert.ok(r.relations.length > 0);
  assert.ok(r.relations.some((x) => x.agents.includes("cat")), "cat is an agent");
});

test("cellStop: a stop the equivalence judge can read", { skip: !HAVE }, async () => {
  const t = "The cat sat on the mat. The dog ran in the park. The bird sang in the tree. The sun shone on the grass.".repeat(4);
  const stop = await cellStop(t, t, { language: "en" });
  assert.equal(stop.verdict4.value, "is");
  assert.equal(stop.rung, "cells");
});
