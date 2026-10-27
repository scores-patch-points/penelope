// penelope/organs/telos.test.mjs — the telos declares before the draw and files append-only; each refusal is typed and each
// is a control that must be SEEN to fire (a check never seen firing is a comment).
import _nodeTest from "node:test";
import assert from "node:assert/strict";
import { loadOrSkip, kernelImport } from "./kernel-reach.mjs";

// This subject needs a sibling checkout (organs/kernel-reach.mjs). Absent, its tests SKIP with the typed reason named.
const { mod: _subject, skip: _skip } = await loadOrSkip(async () => ({
  ...(await import("./telos.mjs")),
  pathos: await kernelImport("khora", "native/organs/pathos.js"),
}));
const { declareTelos, recordTelos, REFUSALS, VERDICTS, STATUSES, TELOS_SCHEMA, TELOS_REFUSAL_SCHEMA, TELOS_RECORD_SCHEMA, pathos } = _subject ?? {};
const test = (name, fn) => _nodeTest(name, { skip: _skip }, fn);

const AT = "2026-10-27T15:00:00.000Z";
const good = (over = {}) => ({
  forWhom: { who: "person:michael", read: "penelope/README.md#front" },
  provenance: { source: "record", ref: "turn:41" },
  expect: "ground_holds",
  speaksFrom: ["record#12-30"],
  giver: "michael",
  at: AT,
  ...over,
});
const refusedAs = (r, code) => {
  assert.equal(r.schema, TELOS_REFUSAL_SCHEMA, `expected a refusal, got ${JSON.stringify(r)}`);
  assert.equal(r.refused, code);
};

test("a complete telos is declared, frozen, content-addressed and carries the validated for-whom", () => {
  const t = declareTelos(good());
  assert.equal(t.schema, TELOS_SCHEMA);
  assert.equal(t.expect, "ground_holds");
  assert.deepEqual({ ...t.forWhom }, { who: "person:michael", read: "penelope/README.md#front", revision: null });
  assert.ok(Object.isFrozen(t) && Object.isFrozen(t.forWhom) && Object.isFrozen(t.speaksFrom));
  assert.match(t.id, /^telos:[0-9a-f]{12}@2026-10-27/);
  // the same aim re-declared hashes the same; a different aim does not
  assert.equal(declareTelos(good({ at: "2026-10-28T00:00:00.000Z" })).hash, t.hash);
  assert.notEqual(declareTelos(good({ expect: "re_ground:stale" })).hash, t.hash);
});

test("no for-whom, and a for-whom missing who or read, is refused (kitsch: a feeling for no one in particular)", () => {
  refusedAs(declareTelos(good({ forWhom: undefined })), REFUSALS.NO_FOR_WHOM);
  refusedAs(declareTelos(good({ forWhom: { read: "x" } })), REFUSALS.NO_FOR_WHOM);
  refusedAs(declareTelos(good({ forWhom: { who: "p" } })), REFUSALS.NO_FOR_WHOM);
  refusedAs(declareTelos(null), REFUSALS.NO_FOR_WHOM);
});

test("a for-whom taken from a label rather than the turn's record is refused (GL-CH-06)", () => {
  refusedAs(declareTelos(good({ provenance: undefined })), REFUSALS.UNVERIFIED_FOR_WHOM);
  refusedAs(declareTelos(good({ provenance: { source: "label", ref: "message.holder" } })), REFUSALS.UNVERIFIED_FOR_WHOM);
  refusedAs(declareTelos(good({ provenance: { source: "record" } })), REFUSALS.UNVERIFIED_FOR_WHOM);
});

test("no giver is refused", () => {
  refusedAs(declareTelos(good({ giver: undefined })), REFUSALS.NO_GIVER);
  refusedAs(declareTelos(good({ giver: "  " })), REFUSALS.NO_GIVER);
});

test("an artifact that speaks from nothing is refused (the mouth originates no fact)", () => {
  refusedAs(declareTelos(good({ speaksFrom: [] })), REFUSALS.NO_ADDRESS);
  refusedAs(declareTelos(good({ speaksFrom: undefined })), REFUSALS.NO_ADDRESS);
  refusedAs(declareTelos(good({ speaksFrom: ["ok", ""] })), REFUSALS.NO_ADDRESS);
  refusedAs(declareTelos(good({ opens: "not-a-list" })), REFUSALS.NO_ADDRESS);
});

test("an aim that is not a verdict is refused as rating_aim, whatever it is dressed as", () => {
  refusedAs(declareTelos(good({ expect: undefined })), REFUSALS.NO_EXPECT);
  for (const e of [0.9, "0.9", "delightful", "ground_holds_more", "RE_GROUND:stale", { verdict: "ground_holds" }]) {
    refusedAs(declareTelos(good({ expect: e })), REFUSALS.RATING_AIM);
  }
});

test("the schema is closed: a score or any unknown field cannot ride in beside a valid aim", () => {
  const r = declareTelos(good({ score: 0.9 }));
  refusedAs(r, REFUSALS.UNKNOWN_FIELD);
  assert.deepEqual([...r.detail.unknown], ["score"]);
  refusedAs(declareTelos(good({ engagement: "high", quality: 1 })), REFUSALS.UNKNOWN_FIELD);
});

test("a release must be open in the supplied beforeFold or opened by this telos", () => {
  const beforeFold = { sequence: 3, obligations: [{ id: "ob:1", state: "open" }, { id: "ob:2", state: "fulfilled" }] };
  // nothing to release without a fold or an opens
  refusedAs(declareTelos(good({ releases: ["ob:1"] })), REFUSALS.RELEASE_WITHOUT_OPEN);
  // open in beforeFold: allowed
  const ok = declareTelos(good({ releases: ["ob:1"], beforeFold }));
  assert.equal(ok.schema, TELOS_SCHEMA);
  // already resolved in beforeFold: refused
  const r = declareTelos(good({ releases: ["ob:2"], beforeFold }));
  refusedAs(r, REFUSALS.RELEASE_WITHOUT_OPEN);
  assert.deepEqual([...r.detail.unreleasable], ["ob:2"]);
  // opened by this telos: allowed
  assert.equal(declareTelos(good({ opens: ["ob:9"], releases: ["ob:9"] })).schema, TELOS_SCHEMA);
});

test("VERDICTS is pinned to what khora's reGroundCondition can return (a new khora verdict fails here)", () => {
  const kinds = new Set();
  const read = (over) => ({ schema: "EOPathosRead@1", strain: "report", rhythm: { flatline: false, blinks: 1 }, curve: { measured: false, surprise: null, release: null }, ...over });
  kinds.add(pathos.reGroundCondition(read({ strain: "strict" })).kind);
  kinds.add(pathos.reGroundCondition(read({ rhythm: { flatline: true, blinks: 0 } })).kind);
  kinds.add(pathos.reGroundCondition(read({ curve: { measured: true, surprise: { operations: 2 }, release: 0 } })).kind);
  kinds.add(pathos.reGroundCondition(read()).kind);
  const expected = [...kinds].map((k) => (k === "ground_holds" ? k : `re_ground:${k}`)).sort();
  assert.deepEqual(expected, [...VERDICTS].sort());
  // and a REAL pathosOf read is accepted by the same gate (the schema string we rely on is khora's)
  const real = pathos.pathosOf({ text: "One. Two words here. A much longer sentence follows, with a clause or two to carry it along.", experiencer: { who: "person:michael", read: "x" } });
  assert.equal(real.schema, "EOPathosRead@1");
  assert.ok(VERDICTS.some((v) => v.endsWith(pathos.reGroundCondition(real).kind)));
});

test("recordTelos files the declaration, then a result, append-only and frozen", () => {
  const t = declareTelos(good());
  let h = [];
  h = recordTelos(h, { telos: t, status: "declared", at: AT });
  assert.equal(h.length, 1);
  assert.equal(h[0].schema, TELOS_RECORD_SCHEMA);
  assert.equal(h[0].pipeline, "telos");
  assert.equal(h[0].status, "declared");
  assert.equal(h[0].telosId, t.id);
  assert.match(h[0].falsifyingControl, /differs from this telos/);
  const h2 = recordTelos(h, { telos: t, status: "earned", evidence: "observed ground_holds at turn 42; no aimed releases", at: AT });
  assert.equal(h2.length, 2);
  assert.equal(h.length, 1, "the earlier history is not mutated");
  assert.ok(Object.isFrozen(h2) && Object.isFrozen(h2[1]));
  assert.notEqual(h2[0].id, h2[1].id);
});

test("a result cannot be filed before its telos was declared, and a claim needs evidence", () => {
  const t = declareTelos(good());
  assert.throws(() => recordTelos([], { telos: t, status: "earned", evidence: "x" }), /never declared/);
  const h = recordTelos([], { telos: t, status: "declared" });
  assert.throws(() => recordTelos(h, { telos: t, status: "missed" }), /needs evidence/);
  assert.throws(() => recordTelos(h, { telos: t, status: "missed", evidence: "   " }), /needs evidence/);
  // a gap is its own standing, with its reason as the evidence, never `earned`
  const h2 = recordTelos(h, { telos: t, status: "unmeasured", evidence: "no observed turn by this experiencer" });
  assert.equal(h2[1].status, "unmeasured");
});

test("append-only: a re-declaration or a re-filed id throws; supersede by a pointer that exists", () => {
  const t = declareTelos(good());
  const h = recordTelos([], { telos: t, status: "declared", id: "telos:rec:1" });
  assert.throws(() => recordTelos(h, { telos: t, status: "declared" }), /already declared/);
  assert.throws(() => recordTelos(h, { telos: t, status: "earned", evidence: "e", id: "telos:rec:1" }), /already on the record/);
  assert.throws(() => recordTelos(h, { telos: t, status: "superseded", evidence: "e", supersedes: "telos:rec:nope" }), /not on the record/);
  const h2 = recordTelos(h, { telos: t, status: "superseded", evidence: "the aim was re-scoped", supersedes: "telos:rec:1" });
  assert.equal(h2[1].supersedes, "telos:rec:1");
  assert.equal(h2[0].status, "declared", "the superseded entry is still there, unedited");
});

test("a refusal is not a telos: it cannot be filed", () => {
  const r = declareTelos(good({ giver: "" }));
  assert.throws(() => recordTelos([], { telos: r, status: "declared" }), /requires an EOTelos@1/);
  assert.throws(() => recordTelos([], { telos: declareTelos(good()), status: "approved" }), /status must be one of/);
  assert.deepEqual([...STATUSES], ["declared", "earned", "missed", "unmeasured", "superseded"]);
});
