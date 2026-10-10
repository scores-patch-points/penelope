import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { weave, generationKinds, loadBuiltins } from "./api.mjs";

const sourceText = "  Preface.\n\n  Pierre was speaking.  Natasha was listening.\n";
const read = {
  sents: [
    { order: 0, text: "Pierre was speaking.", offset: 14 },
    { order: 1, text: "Natasha was listening.", offset: 36 },
  ],
  clauses: [
    { order: 0, subject: { head: "Pierre" }, verb: "was speaking", object: null, learning: 0.1 },
    { order: 1, subject: { head: "Natasha" }, verb: "was", object: null, learning: 0.2 },
    { order: 0, subject: { head: "Pierre" }, verb: "spoke", object: { head: "Natasha" }, learning: 0.9 },
    { order: 1, subject: { head: "Natasha" }, verb: "listened", object: { head: "Pierre" }, learning: 0.8 },
  ],
  THR: 0.5,
  eot: { medium: "text", language: "eng" },
};
const context = () => ({ read, sourceText, sourceId: "t:src", topic: "War and Peace" });
const outDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "fold-forms-test-"));

test("the four forms are registered alongside the existing kinds", async () => {
  await loadBuiltins();
  const kinds = generationKinds();
  for (const k of ["markdown", "page", "data", "talk", "code", "text"]) assert.ok(kinds.includes(k), k);
});

test("markdown phrases the residue and is grounded by the hunt's markers (WebLLM mouth via exec)", async () => {
  const mouth = async ({ prompt }) => ({ ok: true, text: `Pierre is the one the record keeps returning to. ⟦t:src@14⟧`, model: "webllm:llama3.2:1b" });
  const r = await weave({ intent: "write a markdown brief on Pierre", artifact: "markdown", context: { ...context(), mouth }, output: outDir() });
  assert.equal(r.ok, true, JSON.stringify(r.void ?? r.evidence?.outcomes));
  assert.match(String(r.artifact.value), /⟦t:src@14⟧/);
  const outcomes = (r.evidence?.outcomes ?? []).map((o) => o.stage).join(",");
  assert.ok(outcomes.includes("mouth")); // the prose WAS drawn
  assert.equal((r.repair?.scars ?? []).length, 0);
});

test("data is box-first: the record is computed from the Ground with ZERO mouth draws", async () => {
  const calls = { n: 0 };
  const mouth = async ({ prompt }) => { calls.n += 1; return { ok: true, text: "NEVER", model: "webllm:test" }; };
  const r = await weave({ intent: "the data record of this ground", artifact: "data", context: { ...context(), mouth }, output: outDir() });
  assert.equal(r.ok, true);
  assert.equal(calls.n, 0, "data computed the record, the mouth was never asked");
  const j = JSON.parse(String(r.artifact.value));
  assert.equal(j.schema, "GeneratedData@1");
  assert.ok(j.hunt.some((h) => h.marker === "⟦t:src@14⟧"));
  const stages = (r.evidence?.outcomes ?? []).map((o) => o.stage).join(",");
  assert.equal(stages, "field");
});

test("page shells the mouth's sections into a full grounded document", async () => {
  const mouth = async ({ prompt }) => ({ ok: true, text: `<section class="fold-unit"><h2>Pierre</h2><p>Pierre spoke. ⟦t:src@14⟧</p></section>`, model: "webllm:test" });
  const r = await weave({ intent: "a page on Pierre", artifact: "page", context: { ...context(), mouth }, output: outDir() });
  assert.equal(r.ok, true, JSON.stringify(r.void ?? r.verification?.verdict));
  const html = String(r.artifact.value);
  assert.match(html, /^<!doctype html>/i);
  assert.ok(html.includes("fold-unit"));
});

test("talk is the mouth's own form; with noModel it stops as model-required, never a silent pass", async () => {
  const r = await weave({ intent: "answer: who speaks and who listens", artifact: "talk", context: { ...context(), mouth: null }, noModel: true, output: outDir() });
  assert.equal(r.noModel, true);
  const stages = (r.evidence?.outcomes ?? []).map((o) => o.stage).join(",");
  assert.ok(stages.includes("model-required"), stages);
  assert.ok((r.repair?.scars ?? []).some((s) => s.stage === "mouth"));
});