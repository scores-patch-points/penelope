import test from "node:test";
import assert from "node:assert/strict";
import { runDrawDoor } from "../generation-door.mjs";

test("an injected exec is the draw executor — box still answers first, record names the mouth", async () => {
  const seen = [];
  const exec = async ({ prompt, maxTokens, temperature, model, kind }) => { seen.push({ prompt, maxTokens, temperature, model, kind }); return { ok: true, text: "  the page mouth answered. ", model: "webllm:test" }; };
  const r = await runDrawDoor({ prompt: "Say OK", model: "gemma2:2b", kind: "chat", maxTokens: 99, exec });
  assert.equal(r.ok, true);
  assert.equal(r.text, "the page mouth answered.");
  assert.equal(r.winner, "mouth(exec)");
  assert.equal(r.box.answered, false);
  assert.equal(r.exec, true);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].maxTokens, 99);
  assert.equal(seen[0].kind, "chat");
});

test("an exec that returns nothing is a typed refusal, never a silent pass", async () => {
  const r = await runDrawDoor({ prompt: "Say OK", exec: async () => ({ ok: false, error: "the webllm mouth was not loaded" }) });
  assert.equal(r.ok, false);
  assert.match(r.error, /webllm mouth was not loaded/);
});

test("an exec that throws is a typed refusal carrying the error", async () => {
  const r = await runDrawDoor({ prompt: "Say OK", exec: async () => { throw new Error("gpu gone"); } });
  assert.equal(r.ok, false);
  assert.match(r.error, /gpu gone/);
});