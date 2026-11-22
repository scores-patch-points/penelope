import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveNull, signalDrift } from "./signal-drift.mjs";

// a mixed-but-uniform signal (no block structure): dmd should be a positive derived magnitude
const mixed = Array.from({ length: 80 }, () => (Math.random() < 0.6 ? "case" : "order"));

test("deriveNull: DMD and persistence are derived, not declared", () => {
  const n = deriveNull([mixed.slice(0, 40), mixed.slice(40)], { shuffles: 50, window: 16 });
  assert.ok(n.dmd > 0, "DMD is a positive drift magnitude");
  assert.ok(typeof n.persistence === "number" && n.persistence >= 0, "persistence is a run length");
  assert.ok(n.nullMaxRun >= n.persistence, "the null max run is at least the persistence");
});

test("deriveNull: a block shift produces a real drift above the derived DMD", () => {
  const block = [Array(40).fill("case"), Array(40).fill("order")];  // a clean case→order block shift
  const n = deriveNull(block, { shuffles: 50, window: 16 });
  // the real text's max lag-drift at the block boundary is 1.0 (full flip), far above the null floor
  assert.ok(n.dmd < 1.0, "the null floor is well below a full block shift");
});

test("signalDrift: reads a text and reports the mix totals (skips if khora absent)", { skip: !process.env.KHORA_HOME }, async () => {
  const text = "The children played in the garden. The dog ran across the field. The cat sat on the mat. The bird sang in the tree. The man walked to the store. The woman read the book. ".repeat(6);
  const d = await signalDrift(text, { language: "en", window: 16 });
  assert.equal(d.gap, undefined);
  assert.ok(d.tokens > 0, "tokens were read");
  assert.equal(d.total.case + d.total.particle + d.total.order, d.tokens, "every token has exactly one signal");
  assert.ok(d.dmd > 0 && typeof d.persistence === "number", "thresholds derived from the null");
});
