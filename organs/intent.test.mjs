import { test } from "node:test";
import assert from "node:assert/strict";
import { intentBindings, intentFromText } from "./intent.mjs";

test("agenthood: the referent the speaker makes the agent is the intended bind", () => {
  // "Mary" is the agent (kartṛ), "John" is not — so "she" should weight toward Mary
  const mentions = [
    { kind: "name", surface: "John", karaka: "karman" },
    { kind: "name", surface: "Mary", karaka: "kartṛ" },
    { kind: "pronoun", surface: "she", karaka: "kartṛ" },
    { kind: "name", surface: "Mary", karaka: "kartṛ" },
  ];
  const r = intentBindings(mentions);
  assert.equal(r.bindings[0].hindsight, "Mary", "agenthood outweighs a bare mention");
  assert.equal(r.bindings[0].verdict, "confirmed");
});

test("agenthood narrows the margin against a more-frequent non-agent", () => {
  // John recurs more, but Mary is the agent — the intent weighting should close the gap
  const mentions = [
    { kind: "name", surface: "John", karaka: "karman" },
    { kind: "name", surface: "John", karaka: "karman" },
    { kind: "name", surface: "Mary", karaka: "kartṛ" },
    { kind: "pronoun", surface: "she", karaka: "kartṛ" },
    { kind: "name", surface: "Mary", karaka: "kartṛ" },
  ];
  const r = intentBindings(mentions);
  assert.equal(r.bindings[0].hindsight, "Mary");
  assert.equal(r.bindings[0].verdict, "confirmed");
});

test("void: a pronoun with no admitted referent is still a gap", () => {
  const r = intentBindings([{ kind: "pronoun", surface: "it", karaka: "karman" }, { kind: "name", surface: "John", karaka: "kartṛ" }]);
  assert.equal(r.bindings[0].verdict, "void");
});

test("intentFromText: reads a text and binds by agenthood (skips if khora absent)", { skip: !process.env.KHORA_HOME }, async () => {
  const text = "Mary walked into the room. She sat down. Mary spoke to John. He listened. Mary left. ".repeat(4);
  const r = await intentFromText(text, { language: "en" });
  assert.equal(r.gap, undefined);
  assert.ok(r.bindings.length > 0, "pronouns were bound");
  assert.ok(r.referents.some((x) => x.surface === "Mary" && x.agent > 0), "Mary is read as the agent");
});
