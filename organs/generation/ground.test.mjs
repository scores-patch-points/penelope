import test from "node:test";
import assert from "node:assert/strict";
import { groundFromRead } from "./ground.mjs";

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
  ],
  THR: 0.5,
  eot: { medium: "text", language: "eng" },
};

test("ground is computed from a khora read: cast, deeds, byte hunt", () => {
  const g = groundFromRead({ sourceText, sourceId: "t:src", topic: "War and Peace", read });
  assert.equal(g.schema, "Ground@1");
  assert.equal(g.bytes, Buffer.byteLength(sourceText, "utf8"));
  assert.ok(g.cast.includes("pierre") && g.cast.includes("natasha"));
  assert.ok(g.deeds.includes("spoke"));
  // only the clause with an object that beat the surprise floor is named to the mouth
  assert.equal(g.hunt.length, 1);
  assert.equal(g.hunt[0].at, 14); // the UTF-8 byte address of "Pierre" (ASCII here, char=byte)
  assert.equal(g.hunt[0].marker, "⟦t:src@14⟧");
  assert.ok(g.huntBytes.has(14));
});

test("an unadressed reader (no offsets) still finds sentence byte addresses in source", () => {
  const flat = { ...read, sents: read.sents.map(({ order, text }) => ({ order, text })) };
  const g = groundFromRead({ sourceText, sourceId: "t:src", read: flat });
  assert.ok(g.hunt.length >= 1);
  assert.ok(g.hunt[0].at === 14 || g.hunt[0].at === 36);
});

test("no read yields null ground (a typed gap, never a guess)", () => {
  assert.equal(groundFromRead({ sourceText, read: null }), null);
  assert.equal(groundFromRead({}), null);
});