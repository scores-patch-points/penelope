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
const { declareTelos, recordTelos, identityStanding, REFUSALS, VERDICTS, IDENTITY_VERDICTS, STATUSES, TELOS_SCHEMA, TELOS_REFUSAL_SCHEMA, TELOS_RECORD_SCHEMA, pathos } = _subject ?? {};
const test = (name, fn) => _nodeTest(name, { skip: _skip }, fn);

const AT = "2026-10-27T15:00:00.000Z";
const good = (over = {}) => ({
  forWhom: { who: "person:michael", read: "penelope/README.md#front" },
  provenance: { source: "record", ref: "turn:41" },
  asof: "2026-10-27",
  purpose: "moderation: is this the same account holder",
  expect: "ground_holds",
  speaksFrom: ["record#12-30"],
  giver: "michael",
  at: AT,
  ...over,
});
// An identity verdict decided under the frame of telos `t` (or under an overridden frame).
const idv = (t, verdict = "same", frame = {}) => ({
  verdict,
  frame: { asof: t.frame.asof, purpose: t.frame.purpose, whom: { ...t.frame.whom }, ...frame },
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
  assert.ok(Object.isFrozen(t) && Object.isFrozen(t.forWhom) && Object.isFrozen(t.speaksFrom) && Object.isFrozen(t.frame));
  assert.equal(t.frame.asof, "2026-10-27");
  assert.equal(t.frame.purpose, "moderation: is this the same account holder");
  assert.deepEqual({ ...t.frame.whom }, { ...t.forWhom });
  assert.match(t.id, /^telos:[0-9a-f]{12}@2026-10-27/);
  // the same aim re-declared hashes the same; a different aim does not
  assert.equal(declareTelos(good({ at: "2026-10-28T00:00:00.000Z" })).hash, t.hash);
  assert.notEqual(declareTelos(good({ expect: "re_ground:stale" })).hash, t.hash);
  // the frame is part of what a telos says: the same aim under another purpose or as-of is another telos
  assert.notEqual(declareTelos(good({ purpose: "another purpose" })).hash, t.hash);
  assert.notEqual(declareTelos(good({ asof: "2026-11-01" })).hash, t.hash);
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

test("no asof and no purpose are refused: sameness of the perceiver is per frame, and no purpose means no telos", () => {
  refusedAs(declareTelos(good({ asof: undefined })), REFUSALS.NO_ASOF);
  refusedAs(declareTelos(good({ asof: " " })), REFUSALS.NO_ASOF);
  refusedAs(declareTelos(good({ purpose: undefined })), REFUSALS.NO_PURPOSE);
  refusedAs(declareTelos(good({ purpose: "" })), REFUSALS.NO_PURPOSE);
  refusedAs(declareTelos(good({ purpose: 3 })), REFUSALS.NO_PURPOSE);
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
  const h2 = recordTelos(h, { telos: t, status: "earned", evidence: "observed ground_holds at turn 42; no aimed releases", identity: idv(t), at: AT });
  assert.equal(h2.length, 2);
  assert.equal(h.length, 1, "the earlier history is not mutated");
  assert.ok(Object.isFrozen(h2) && Object.isFrozen(h2[1]));
  assert.notEqual(h2[0].id, h2[1].id);
});

test("a result cannot be filed before its telos was declared, and a claim needs evidence", () => {
  const t = declareTelos(good());
  assert.throws(() => recordTelos([], { telos: t, status: "earned", evidence: "x", identity: idv(t) }), /never declared/);
  const h = recordTelos([], { telos: t, status: "declared" });
  assert.throws(() => recordTelos(h, { telos: t, status: "missed", identity: idv(t) }), /needs evidence/);
  assert.throws(() => recordTelos(h, { telos: t, status: "missed", evidence: "   ", identity: idv(t) }), /needs evidence/);
  // a gap is its own standing, with its reason as the evidence, never `earned`
  const h2 = recordTelos(h, { telos: t, status: "unmeasured", evidence: "no observed turn by this experiencer" });
  assert.equal(h2[1].status, "unmeasured");
});

test("append-only: a re-declaration or a re-filed id throws; supersede by a pointer that exists", () => {
  const t = declareTelos(good());
  const h = recordTelos([], { telos: t, status: "declared", id: "telos:rec:1" });
  assert.throws(() => recordTelos(h, { telos: t, status: "declared" }), /already declared/);
  assert.throws(() => recordTelos(h, { telos: t, status: "earned", evidence: "e", identity: idv(t), id: "telos:rec:1" }), /already on the record/);
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

test("a weighing (earned or missed) is filed only under `same`, decided in THIS telos' frame; anything else is a gap, never a hit", () => {
  const t = declareTelos(good());
  const h = recordTelos([], { telos: t, status: "declared" });
  const weigh = (status, identity) => () => recordTelos(h, { telos: t, status, evidence: "observed", identity });
  // no verdict at all
  assert.throws(weigh("earned", undefined), /needs an identity verdict/);
  assert.throws(weigh("missed", undefined), /needs an identity verdict/);
  // different, undecided, refused each leave it unweighed
  for (const v of ["different", "undecided", "refused"]) {
    assert.throws(weigh("earned", idv(t, v)), new RegExp(`needs verdict "same"; "${v}"`));
  }
  // `same`, but decided under another asof, another purpose, or another whom
  assert.throws(weigh("earned", idv(t, "same", { asof: "2026-11-30" })), /different frame/);
  assert.throws(weigh("earned", idv(t, "same", { purpose: "marketing" })), /different frame/);
  assert.throws(weigh("missed", idv(t, "same", { whom: { who: "person:someone-else", read: t.frame.whom.read } })), /different frame/);
  // `same` in this frame weighs
  assert.equal(recordTelos(h, { telos: t, status: "earned", evidence: "observed", identity: idv(t) })[1].identity.verdict, "same");
  // the unmeasured standing accepts the gaps, with their verdict recorded
  for (const v of ["different", "undecided", "refused"]) {
    const r = recordTelos(h, { telos: t, status: "unmeasured", evidence: `identity ${v}`, identity: idv(t, v) });
    assert.equal(r[1].identity.verdict, v);
    assert.equal(r[1].status, "unmeasured");
  }
});

test("a verdict whose frame has no purpose can only be refused", () => {
  const t = declareTelos(good());
  const h = recordTelos([], { telos: t, status: "declared" });
  const noPurpose = (verdict) => ({ verdict, frame: { asof: t.frame.asof, whom: { ...t.frame.whom } } });
  for (const v of ["same", "different", "undecided"]) {
    assert.throws(() => recordTelos(h, { telos: t, status: "unmeasured", evidence: "e", identity: noPurpose(v) }), /no purpose can only be refused/);
  }
  const r = recordTelos(h, { telos: t, status: "unmeasured", evidence: "no purpose given", identity: noPurpose("refused") });
  assert.equal(r[1].identity.verdict, "refused");
  assert.equal(r[1].identity.frame.purpose, null);
});

test("an identity verdict carries its frame and one of the four verdicts, nothing else", () => {
  const t = declareTelos(good());
  const h = recordTelos([], { telos: t, status: "declared" });
  const file = (identity) => () => recordTelos(h, { telos: t, status: "unmeasured", evidence: "e", identity });
  assert.throws(file({ verdict: "maybe", frame: idv(t).frame }), /identity\.verdict must be one of/);
  assert.throws(file({ verdict: true, frame: idv(t).frame }), /identity\.verdict must be one of/);
  assert.throws(file({ verdict: "same" }), /carries its frame/);
  assert.throws(file({ verdict: "same", frame: { purpose: "p", whom: { who: "a", read: "b" } } }), /carries its frame/);
  assert.deepEqual([...IDENTITY_VERDICTS], ["same", "different", "undecided", "refused"]);
  // tied set, excluded and plateau ride along, frozen
  const r = recordTelos(h, { telos: t, status: "unmeasured", evidence: "tie", identity: { ...idv(t, "undecided"), tied: ["a", "b"], excluded: ["c"], plateau: { noise: 0.1, dmd: 0.2, width: 3 } } });
  assert.deepEqual([...r[1].identity.tied], ["a", "b"]);
  assert.ok(Object.isFrozen(r[1].identity) && Object.isFrozen(r[1].identity.frame));
});

test("a REC that changes any frame field invalidates the old verdict; old and new stay side by side, nothing is deleted", () => {
  const t = declareTelos(good());
  let h = recordTelos([], { telos: t, status: "declared", id: "r0" });
  // first verdict: undecided under the telos' frame
  h = recordTelos(h, { telos: t, status: "unmeasured", evidence: "two candidates tie", identity: idv(t, "undecided"), id: "r1" });
  // a REC re-frames (a later as-of, a new purpose) and decides `same`
  const reframed = { asof: "2026-12-01", purpose: "appeals review" };
  h = recordTelos(h, { telos: t, status: "superseded", evidence: "frame changed by a REC", identity: idv(t, "same", reframed), supersedes: "r1", id: "r2" });

  const s = identityStanding(h, t.id);
  assert.equal(s.sideBySide.length, 1);
  assert.equal(s.sideBySide[0].old.id, "r1");
  assert.equal(s.sideBySide[0].new.id, "r2");
  assert.deepEqual([...s.sideBySide[0].changed].sort(), ["asof", "purpose"]);
  assert.deepEqual(s.invalidated.map((e) => e.id), ["r1"]);
  assert.equal(s.current.id, "r2");
  // nothing deleted or edited: the old verdict is still on the record, unchanged
  assert.equal(h.find((e) => e.id === "r1").identity.verdict, "undecided");
  assert.equal(h.find((e) => e.id === "r1").identity.frame.asof, "2026-10-27");
  assert.equal(h.length, 3);
});

test("a superseding entry under the SAME frame re-asserts; it does not invalidate the old verdict", () => {
  const t = declareTelos(good());
  let h = recordTelos([], { telos: t, status: "declared", id: "r0" });
  h = recordTelos(h, { telos: t, status: "unmeasured", evidence: "e1", identity: idv(t, "different"), id: "r1" });
  h = recordTelos(h, { telos: t, status: "superseded", evidence: "re-read, same frame", identity: idv(t, "undecided"), supersedes: "r1", id: "r2" });
  const s = identityStanding(h, t.id);
  assert.equal(s.sideBySide.length, 0);
  assert.equal(s.invalidated.length, 0);
  assert.equal(s.current.id, "r2");
  // nothing to stand on yet
  assert.equal(identityStanding([], "telos:none").current, null);
});
