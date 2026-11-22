import { test } from "node:test";
import assert from "node:assert/strict";
import { produceNext, reason, reasonFromText } from "./thought-producer.mjs";

test("produceNext: moves over-represented cells down and under-represented up, surprise falls", () => {
  const vision = { cells: { a: 10, b: 10, c: 10 } };
  const seed = { cells: { a: 20, b: 0, x: 5 } };
  const p = produceNext(vision, seed);
  assert.equal(p.movedToward, true);
  assert.ok(p.surpriseAfter < p.surpriseBefore);
  assert.equal(p.edits.find((e) => e.cell === "a").over, true, "a is over-represented");
  assert.equal(p.edits.find((e) => e.cell === "b").over, false, "b is under-represented");
  assert.ok(p.thought.a > 10 && p.thought.a < 20, "a shrank toward the vision");
  assert.ok(p.thought.b > 0 && p.thought.b < 10, "b grew toward the vision");
});

test("produceNext: identical vision and seed produce no edits and no movement", () => {
  const v = { a: 3, b: 2 };
  const p = produceNext({ cells: v }, { cells: v });
  assert.equal(p.edits.length, 0);
  assert.equal(p.movedToward, false, "already at the vision, nothing to improve");
});

test("reason: a trajectory of thoughts that converges (surprise falls toward zero)", () => {
  const vision = { cells: { a: 5, b: 5, c: 5 } };
  const seed = { cells: { x: 10, y: 10, z: 10 } };
  const r = reason(vision, seed);
  assert.equal(r.converged, true);
  assert.ok(r.thoughts > 1, "a trajectory of thoughts, not a single step");
  assert.ok(r.finalSurprise < r.steps[0].surprise, "the last thought is less surprising than the seed");
});

test("reason: a seed that already matches stops immediately as exact", () => {
  const vision = { cells: { a: 5, b: 5 } };
  const r = reason(vision, { cells: { a: 5, b: 5 } });
  assert.equal(r.why, "exact");
  assert.equal(r.thoughts, 1);
});

test("reasonFromText: reads vision and seed through janus, then reasons (skips if khora absent)", { skip: !process.env.KHORA_HOME }, async () => {
  const vision = "The children played in the garden while the dog ran across the field. The sun shone and the birds sang.".repeat(3);
  const seed = "The company reported strong earnings and the board approved a dividend. Revenue grew by twenty percent.".repeat(3);
  const r = await reasonFromText(vision, seed);
  assert.equal(r.gap, undefined);
  assert.ok(r.steps.length > 0, "the loop ran over real read cells");
  assert.ok(r.steps[0].surprise > 0, "the seed is not already the vision");
});
