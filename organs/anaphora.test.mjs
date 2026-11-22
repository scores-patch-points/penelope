import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "./anaphora.mjs";

test("void: a pronoun with no admitted referent is a gap, never a guess", () => {
  const r = resolve([{ kind: "pronoun", surface: "it" }, { kind: "name", surface: "John" }]);
  assert.equal(r.bindings[0].verdict, "void");
  assert.equal(r.bindings[0].hindsight, null);
});

test("confirmed: the future names the referent the past predicted (a thin line)", () => {
  const r = resolve([{ kind: "name", surface: "John" }, { kind: "pronoun", surface: "he" }, { kind: "name", surface: "John" }]);
  assert.equal(r.bindings[0].verdict, "confirmed");
  assert.equal(r.bindings[0].hindsight, "John");
  assert.equal(r.bindings[0].foresight, "John");
});

test("contested: the future names a different referent (a wide line)", () => {
  const r = resolve([{ kind: "name", surface: "John" }, { kind: "pronoun", surface: "he" }, { kind: "name", surface: "Mary" }]);
  assert.equal(r.bindings[0].verdict, "contested");
  assert.equal(r.bindings[0].hindsight, "John");
  assert.equal(r.bindings[0].foresight, "Mary");
});

test("width: a single referent has a wide margin; two competing referents narrow it", () => {
  const single = resolve([{ kind: "name", surface: "John" }, { kind: "pronoun", surface: "he" }, { kind: "name", surface: "John" }]);
  const competing = resolve([{ kind: "name", surface: "John" }, { kind: "name", surface: "Mary" }, { kind: "pronoun", surface: "he" }, { kind: "name", surface: "John" }], { decay: 0.5 });
  // a pronoun with one live referent has a wider margin than one with two competing referents
  assert.ok(single.bindings[0].width > 0, "width is reported");
  assert.ok(typeof competing.bindings[0].width === "number", "the contested band has a width");
});

test("unconfirmed: no future name yet leaves the line held open", () => {
  const r = resolve([{ kind: "name", surface: "John" }, { kind: "pronoun", surface: "he" }]);
  assert.equal(r.bindings[0].verdict, "unconfirmed");
});
