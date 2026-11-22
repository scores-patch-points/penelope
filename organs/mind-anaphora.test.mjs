import { test } from "node:test";
import assert from "node:assert/strict";
import { mindAnaphora } from "./mind-anaphora.mjs";

test("mindAnaphora: reads a text and binds pronouns by theory-of-mind standing (skips if khora absent)", { skip: !process.env.KHORA_HOME }, async () => {
  const text = "Mary walked into the room. She sat down. Mary spoke to John. He listened. Mary left. ".repeat(4);
  const r = await mindAnaphora(text, { language: "en" });
  assert.equal(r.gap, undefined);
  assert.ok(r.bindings.length > 0, "pronouns were bound");
  assert.ok(r.referents > 0, "referents were admitted");
  for (const b of r.bindings) assert.ok(b.standing >= 1, "every binding carries a standing (turn/spoken/memory/seen)");
});
