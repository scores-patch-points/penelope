import test from "node:test";
import assert from "node:assert/strict";
import { foldNote, derivationFor } from "./fold-note.mjs";

const topics = ["parser", "deploy", "billing", "search"];

test("the mechanical fold compresses DISTINCT asks to their threads, and is bounded", () => {
  const turns = Array.from({ length: 40 }, (_, i) => ({
    n: i + 1,
    ask: `work on the ${topics[i % 4]} item ${i}`,
    answer: `settled the ${topics[i % 4]} work for item ${i}`,
  }));
  const note = foldNote(turns, "what did we settle about the parser?");
  assert.ok(note.split("\n").filter((l) => l.startsWith("- [")).length <= 6, "threads, not 40 asks");
  assert.ok(note.length <= 2000, "the char budget holds");
  assert.match(note, /thread\(s\)/, "the note names its threads");
});

test("the fold composes a chain (BOX computes) and carries the thread", () => {
  const turns = [
    { n: 1, ask: "Define the base B.", answer: "B = 7." },
    { n: 2, ask: "Define the shard count S.", answer: "S = B * 3." },
  ];
  const note = foldNote(turns, "what is S?");
  assert.match(note, /derived/);
  assert.match(note, /S=21/);
  assert.equal(derivationFor(turns).get("S"), 21);
});

test("an empty session is a header, a miss is a typed gap — never a throw", () => {
  const note = foldNote([], "nothing yet");
  assert.match(note, /0 earlier ask\(s\)/);
  assert.doesNotMatch(note, /\bundefined\b|\bNaN\b/);
});

test("a repeated ask folds to its LATEST outcome (last-wins)", () => {
  const note = foldNote(
    [
      { n: 1, ask: "set the deployment window", answer: "03:00 UTC" },
      { n: 2, ask: "set the deployment window", answer: "04:00 UTC" },
    ],
    "what is the deployment window?",
  );
  assert.equal((note.match(/set the deployment window/g) ?? []).length, 1);
  assert.match(note, /04:00/);
  assert.doesNotMatch(note, /03:00/);
});
