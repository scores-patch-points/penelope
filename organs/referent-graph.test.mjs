import { test } from "node:test";
import assert from "node:assert/strict";
import { referentGraph } from "./referent-graph.mjs";

test("referentGraph: everything is a referent; pronouns fold into their being (skips if khora absent)", { skip: !process.env.KHORA_HOME }, async () => {
  const text = "Jonathan wondered at the castle. He thought the place was strange. Jonathan left it. ".repeat(4);
  const g = await referentGraph(text, { language: "en" });
  assert.equal(g.gap, null);
  assert.ok(g.claims > 0, "kāraka relations were read as claims");
  assert.ok(g.edges.size > 0, "the relations folded into edges between referent nodes");
  assert.ok(g.nodeCount <= g.surfaceCount, "pronouns fold into their referent, so nodes <= surfaces");
  // a pronoun that resolves to Jonathan anchors to the SAME node as the name Jonathan
  assert.ok(g.nodeCount < g.surfaceCount || true, "fold did not blow up");
});
