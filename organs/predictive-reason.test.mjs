import { test } from "node:test";
import assert from "node:assert/strict";
import { defineVision, evaluate, converge, cycle, errorSignal, search } from "./predictive-reason.mjs";

test("converge: surprise falls toward the vision and the vision is zero", async () => {
  const vision = await defineVision("The children played in the garden while the dog ran across the wide green field. The sun shone over the house and the birds sang in the trees.".repeat(2));
  assert.ok(Object.keys(vision.cells).length > 0);
  const candidates = [
    "The company reported strong earnings this quarter and revenue grew by twenty percent. The board approved a new dividend for the shareholders.".repeat(2),
    "The children played in the garden while the dog ran across the wide green field. The sun shone over the house and the birds sang in the trees.".repeat(2),
  ];
  const r = await converge(vision, candidates, { language: "en" });
  assert.equal(r.converged, true);
  assert.equal(r.finalSurprise, 0, "the vision itself is the zero-surprise attractor");
});

test("evaluate: a mismatched candidate is more surprising than the vision", async () => {
  const vision = await defineVision("The cat sat on the mat. The dog ran in the park. The bird sang in the tree.".repeat(4));
  const same = await evaluate("The cat sat on the mat. The dog ran in the park. The bird sang in the tree.".repeat(4), vision, { language: "en" });
  const diff = await evaluate("The board approved the dividend and the stock rose sharply today. The company reported strong earnings and grew by twenty percent.".repeat(4), vision, { language: "en" });
  assert.ok(same.surprise < diff.surprise);
});

test("cycle: names the three operators DEF EVA REC", async () => {
  const vision = await defineVision("The cat sat on the mat. The dog ran in the park. The bird sang in the tree.".repeat(4));
  const c = await cycle(vision, "The cat sat on the mat. The dog ran in the park. The bird sang in the tree.".repeat(4), { language: "en" });
  assert.ok(c.DEF && c.EVA && c.REC);
  assert.equal(c.REC.toward, "shape-reached");
});

test("errorSignal: decomposes the surprise into per-cell corrections", async () => {
  const vision = await defineVision("The children played in the garden while the dog ran across the wide green field. The sun shone over the house and the birds sang in the trees.".repeat(2));
  const candidate = "The company reported strong earnings this quarter and revenue grew by twenty percent. The board approved a new dividend for the shareholders.".repeat(2);
  const sig = await errorSignal(vision, candidate, { language: "en" });
  assert.ok(sig.terms.length > 0, "cells were decomposed");
  assert.ok(sig.underRepresented.length > 0, "the candidate under-represents some cells");
});

test("search: the shape-matching passage ranks first", async () => {
  const passages = [
    "Rama gave the book to Sita in the courtyard yesterday afternoon. Rama gave the book to Sita in the courtyard yesterday afternoon.".repeat(2),
    "The company reported strong earnings this quarter and the board approved a new dividend for the shareholders. The company reported strong earnings this quarter.".repeat(2),
    "The dog chased the ball across the wide green field and the children laughed and played in the garden. The dog chased the ball across the field.".repeat(2),
  ];
  const q = "Who gave the book to Sita in the courtyard yesterday afternoon. Who gave the book to Sita in the courtyard.".repeat(2);
  const r = await search(q, passages, { language: "en" });
  assert.ok(r.ranked[0].text.includes("Rama gave the book to Sita"), "the matching passage ranks first");
  assert.ok(r.ranked[0].surprise < r.ranked[1].surprise);
});
