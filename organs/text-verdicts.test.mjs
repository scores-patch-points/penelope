// text-verdicts.test.mjs — the rules QR1 and FR1 over REAL khora entries (organs/fixtures/*.fixture.jsonl: weaveFramedReading output, frozen; no sibling is imported).
// doc fixture: declared eng, the surprise fold found pcm (agrees false); the two frame detectors agree. pp fixture: codec agrees (eng); the detectors disagree (onlyTree 1).
// Each arm is a control for the other: a rule that said yes on both would fail one of them.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { judgeQuotes, judgeFrames, marksFor, shaOf, verdictAddr, KINDS, QUOTE_VERDICT, FRAME_VERDICT, quoteBody, frameBody } from "./text-verdicts.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const load = (n) => { const es = fs.readFileSync(path.join(HERE, "fixtures", n), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); const by = (k) => es.find((e) => e.kind === k); return { es, codec: by("text-codec"), quotes: by("text-quotes"), frames: by("text-frames") }; };
const doc = load("khora-framed-doc.fixture.jsonl"), pp = load("khora-framed-pp.fixture.jsonl");

test("fixtures are khora's own entries at khora's cells (a fixture that drifted from the contract fails here first)", () => {
  for (const f of [doc, pp]) { assert.equal(f.codec.cell, "SIG·Pattern"); assert.equal(f.quotes.cell, "SEG·Figure"); assert.equal(f.frames.cell, "CON·Figure"); assert.equal(f.quotes.by, "khora"); }
});

test("QR1: a codec that agrees corroborates every well-formed span, and the verdict is true, never false", () => {
  assert.equal(pp.codec.body.agrees, true);
  const j = judgeQuotes({ quotes: pp.quotes.body, codec: pp.codec.body });
  assert.equal(j.rule, "QR1"); assert.equal(j.verdicts.length, pp.quotes.body.spans.length); assert.equal(j.evaluation, null);
  assert.ok(j.verdicts.every((v, i) => v.index === i && v.quotation === true));
});
test("QR1 control: declared eng but found pcm is the EVALUATION codec_disagrees, and NO span is judged (neither true nor false)", () => {
  assert.equal(doc.codec.body.agrees, false);
  const j = judgeQuotes({ quotes: doc.quotes.body, codec: doc.codec.body });
  assert.deepEqual(j.verdicts, []); assert.equal(j.abstained, true); assert.equal(j.evaluation.gap, "codec_disagrees"); assert.equal(j.evaluation.chosen, "pcm"); assert.equal(j.evaluation.declared, "eng");
});
test("QR1 falsifier arms: one changed field flips the answer; each refusal names its reason", () => {
  const q = pp.quotes.body, c = pp.codec.body;
  assert.equal(judgeQuotes({ quotes: q, codec: { ...c, agrees: false } }).evaluation.gap, "codec_disagrees");
  assert.equal(judgeQuotes({ quotes: q, codec: { ...c, agrees: null } }).evaluation.gap, "codec_not_found");
  assert.equal(judgeQuotes({ quotes: q, codec: null }).evaluation.gap, "no_codec_entry");
  assert.equal(judgeQuotes({ quotes: null, codec: c }).evaluation.gap, "no_nomination");
  assert.equal(judgeQuotes({ quotes: { ...q, table: null }, codec: c }).evaluation.gap, "quote_layer_gap");
  assert.equal(judgeQuotes({ quotes: { ...q, gaps: ["no_quote_table"] }, codec: c }).evaluation.gap, "quote_layer_gap");
  assert.equal(judgeQuotes({ quotes: { ...q, table: { ...q.table, pairs: [["«", "»"]] } }, codec: c }).evaluation.gap, "table_not_the_codecs");
  const bad = judgeQuotes({ quotes: { ...q, spans: [q.spans[0], { open: 9, close: 3, depth: 0 }, { open: 1, close: 2, depth: -1 }] }, codec: c });
  assert.deepEqual(bad.verdicts.map((v) => v.index), [0]); assert.equal(bad.evaluation.gap, "span_malformed"); assert.deepEqual(bad.evaluation.indexes, [1, 2]);
});

test("FR1: where the speech-verb layer and the clause tree found the same sentences, each frame's nomination is corroborated; a null stays unknown", () => {
  const f = doc.frames.body; assert.equal(f.crossCheck.onlyLayer, 0); assert.equal(f.crossCheck.onlyTree, 0);
  const j = judgeFrames({ frames: f });
  assert.equal(j.rule, "FR1"); assert.equal(j.verdicts.length, f.frames.filter((x) => x.reported !== null).length);
  for (const v of j.verdicts) assert.equal(v.reported, f.frames[v.index].reported);
  assert.ok(j.verdicts.some((v) => v.reported === true) && j.verdicts.some((v) => v.reported === false));
  assert.equal(j.evaluation.gap, "frame_unknown"); assert.deepEqual(j.evaluation.indexes, f.frames.map((x, i) => (x.reported === null ? i : -1)).filter((i) => i >= 0));
});
test("FR1 control: detectors that differ (onlyTree 1) are the EVALUATION detectors_disagree and NO frame is judged", () => {
  assert.equal(pp.frames.body.crossCheck.onlyTree, 1);
  const j = judgeFrames({ frames: pp.frames.body });
  assert.deepEqual(j.verdicts, []); assert.equal(j.abstained, true); assert.equal(j.evaluation.gap, "detectors_disagree"); assert.equal(j.evaluation.onlyTree, 1);
});
test("FR1 falsifier arms: no cross-check, no nomination, a one-sided difference", () => {
  const f = doc.frames.body;
  assert.equal(judgeFrames({ frames: { ...f, crossCheck: null } }).evaluation.gap, "no_cross_check");
  assert.equal(judgeFrames({ frames: null }).evaluation.gap, "no_nomination");
  assert.equal(judgeFrames({ frames: { ...f, crossCheck: { ...f.crossCheck, onlyLayer: 1 } } }).evaluation.gap, "detectors_disagree");
  assert.equal(judgeFrames({ frames: { ...f, frames: f.frames.map((x) => ({ ...x, reported: null })) } }).abstained, true);
});

test("marks: the contract's addresses, cells and bodies; `of` is the nomination; a revision names what it revises; undeclared inputs make no mark", () => {
  const sha = shaOf(pp.quotes.addr, "quotes"); assert.equal(sha.length, 16); assert.equal(shaOf(`quotes:${sha}#0`, "quotes"), null); assert.equal(shaOf(pp.frames.addr, "quotes"), null);
  const j = judgeQuotes({ quotes: pp.quotes.body, codec: pp.codec.body });
  const ms = marksFor({ kind: QUOTE_VERDICT, sha, nominationId: pp.quotes.id, verdicts: j.verdicts, log: "t", revises: new Map([[1, "old"]]) });
  assert.equal(ms.length, j.verdicts.length);
  assert.equal(ms[0].cell, "DEF·Figure"); assert.equal(ms[0].addr, `quotes:${sha}#0`); assert.deepEqual(ms[0].of, [pp.quotes.id]); assert.deepEqual(ms[0].body, quoteBody(j.verdicts[0]));
  assert.equal(ms[0].body.quotation, true); assert.equal(ms[0].body.index, 0); assert.equal(ms[1].basis.revises, "old"); assert.equal(ms[1].basis.role, "REC"); assert.equal(ms[0].basis.revises, undefined);
  const fm = marksFor({ kind: FRAME_VERDICT, sha, nominationId: doc.frames.id, verdicts: judgeFrames({ frames: doc.frames.body }).verdicts, log: "t" });
  assert.equal(fm[0].cell, "EVA·Figure"); assert.equal(fm[0].addr, verdictAddr("frames", sha, 0)); assert.equal(typeof fm[0].body.reported, "boolean"); assert.deepEqual(fm[0].body, frameBody({ index: 0, reported: fm[0].body.reported, basis: fm[0].body.basis }));
  assert.deepEqual(marksFor({ kind: "nope", sha, nominationId: "x", verdicts: [], log: "t" }), []); assert.deepEqual(marksFor({ kind: QUOTE_VERDICT, sha, verdicts: j.verdicts, log: "t" }), []);
  for (const k of Object.values(KINDS)) assert.ok(["DEF", "EVA", "REC"].includes(k.cell.split("·")[0]), "a verdict kind lives at an Interpretation cell: khora refuses any other");
});
