import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { loadModel, sniffAt, toEvidence, deltaAt, SniffGap, MODEL_SHA256 } from "./pos-sniff.mjs";
const tiny = { centroids: { nominal: [1, 0], other: [0, 1] }, suffix: { t: { 1: {}, 2: {}, 3: {} }, prior: 0 }, ctx: { prev: { t: {}, prior: 0 }, next: { t: {}, prior: 0 } }, weights: [1, 0, 0, 0, 0], threshold: 5 };
const text = "the cat sat", toks = [{ start: 0, end: 3 }, { start: 4, end: 7 }, { start: 8, end: 11 }];
const seen = []; const embedTo = (dir) => async (xs) => { seen.push(xs); return [[dir[0] + 1, dir[1] + 1], [1, 1]]; };
const unknown = () => false;
test("the mask is spliced at the reader's offsets and the delta points where the embedder says", async () => {
  seen.length = 0; const v = await sniffAt({ model: tiny, text, tokens: toks, index: 1, embed: embedTo([1, 0]), known: unknown });
  assert.deepEqual(seen[0], ["the cat sat", "the ___ sat"]); assert.equal(v.word, "cat"); assert.equal(v.cls, "nominal"); assert.equal(v.accept, true); assert.equal(v.source, "sniff"); assert.equal(v.revisable, true);
  const o = await sniffAt({ model: tiny, text, tokens: toks, index: 1, embed: embedTo([0, 1]), known: unknown }); assert.equal(o.cls, "other");
});
test("offsets, not a pattern: a repeated word is masked at ITS token, not the first match", async () => {
  seen.length = 0; const t = "cat and cat", k = [{ start: 0, end: 3 }, { start: 4, end: 7 }, { start: 8, end: 11 }];
  await sniffAt({ model: tiny, text: t, tokens: k, index: 2, embed: embedTo([1, 0]), known: unknown }); assert.equal(seen[0][1], "cat and ___");
});
test("a word the prior knows is refused, no prior is a typed gap, another language is a typed gap, a bad token is refused", async () => {
  const base = { model: tiny, text, tokens: toks, index: 1, embed: embedTo([1, 0]) };
  await assert.rejects(sniffAt({ ...base, known: () => true }), (e) => e instanceof SniffGap && e.code === "known_word");
  await assert.rejects(sniffAt({ ...base }), (e) => e.code === "no_prior");
  await assert.rejects(sniffAt({ ...base, known: unknown, language: "pcm" }), (e) => e.code === "no_codec_for_language");
  await assert.rejects(sniffAt({ ...base, known: unknown, index: 9 }), (e) => e.code === "bad_token");
  await assert.rejects(sniffAt({ ...base, known: unknown, tokens: [{ start: 0, end: 99 }], index: 0 }), (e) => e.code === "bad_token");
});
test("neighbours are the adjacent tokens the reader cut, with edges marked; a model that reads them changes the vote", async () => {
  const m = { ...tiny, weights: [0, 0, 1, 1, 0], ctx: { prev: { t: { the: [9, 0] }, prior: 0 }, next: { t: { "</s>": [0, 9] }, prior: 0 } } };
  const v = await sniffAt({ model: m, text, tokens: toks, index: 0, embed: embedTo([1, 0]), known: unknown }); // prev "<s>" unseen -> 0, next "cat" unseen -> 0
  assert.equal(v.score, 0); const w = await sniffAt({ model: m, text, tokens: toks, index: 1, embed: embedTo([1, 0]), known: unknown }); assert.ok(w.score > 0, "prev 'the' favours nominal");
  const x = await sniffAt({ model: m, text, tokens: toks, index: 2, embed: embedTo([1, 0]), known: unknown }); assert.ok(x.score < 0, "next is the right edge and favours other");
});
test("the evidence fires only on a nominal vote and carries the caller's card", () => {
  const card = { lrGood: 3 }; assert.equal(toEvidence({ cls: "nominal" }, card).outcome, "good"); assert.equal(toEvidence({ cls: "other" }, card).outcome, "not_good"); assert.equal(toEvidence({ cls: "nominal" }, card).card, card);
});
test("the pinned model loads, and a changed file is refused with a typed pin error", () => {
  const m = loadModel(); assert.equal(m.classes.length, 2); assert.equal(m.weights.length, 5); assert.match(MODEL_SHA256, /^[0-9a-f]{64}$/);
  const tmp = new URL("./data/.pos-sniff-tampered.json", import.meta.url); fs.writeFileSync(tmp, JSON.stringify({ ...m, threshold: 0 })); try { assert.throws(() => loadModel(tmp), (e) => e.code === "bad_model_pin"); } finally { fs.unlinkSync(tmp); }
});
