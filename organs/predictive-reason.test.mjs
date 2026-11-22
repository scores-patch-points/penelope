import { test } from "node:test";
import assert from "node:assert/strict";
import { defineVision, evaluate, converge, cycle } from "./predictive-reason.mjs";

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
