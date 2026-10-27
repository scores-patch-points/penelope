// penelope/organs/telos.mjs — THE TELOS: the end an artifact is made for, declared before the draw and weighed after it.
//
// Khora's pathos MEASURES what an encounter did to a perceiver (pathosOf, reGroundCondition: a verdict on whether an
// experiencer's ground survived it, never a rating). The telos is its converse, on the generating side of the seam: before a
// draw, name WHO the change is for, WHICH verdict-shaped change is meant, on whose authority (a giver), and from WHICH part of
// the record the artifact speaks. Generation is a manifestation of what the ground kept (the mouth may never originate a fact),
// so a telos with nothing to speak from is refused. A telos declares; it never gates and never grades (steersman.mjs:34,
// voice.mjs:29): the weighing that follows delivery files a hit or a miss on the record, and a miss is a finding, not a veto.
//
// THIS FILE IS STEPS 1-2 OF telos-design.md (repo root): the two doors that need only requireExperiencer and deriveTension
// from the kernel.
//   declareTelos(spec)            -> EOTelos@1 | EOTelosRefusal@1   (typed refusals, never a default, never a thrown string)
//   recordTelos(history, entry)   -> history with the entry appended (EOTelosRecord@1; append-only; a re-filed id throws)
// NOT HERE YET (they need a real khora read and an observed encounter, and are owed their own measured runs): foresee (predict
// the verdict of a draft with pathosOf), weighTelos (compare the observed verdict and the named releases), precedents (exact
// prior matches only).
//
// THE KERNEL IS REACHED ONLY THROUGH organs/kernel-reach.mjs (typed khora-absent when the sibling is not there). Nothing is
// copied from khora: requireExperiencer validates the for-whom; deriveTension (kernel/dynamics.js) says which obligations of a
// supplied fold are open, so a telos that aims to RELEASE an obligation can be refused when nothing of the kind is open.
//
// THE LAW IT CARRIES (each already the house's own):
//   · a feeling for no one in particular is kitsch: no for-whom, no telos (pathos.js:23).
//   · the for-whom comes from the turn's own RECORD, never a label (GL-CH-06): the caller proves it with provenance.source
//     "record" and a ref; anything else is unverified_for_whom.
//   · a recorded act names its actor: no giver, no telos (pathos.js reGround requires one).
//   · a telos is VERDICT-shaped. The set of verdicts is pinned to khora's reGroundCondition by the test, so a rating, a score or
//     a quality word is not a smaller verdict, it is a non-verdict: refused as rating_aim. The schema is CLOSED, so no field
//     can smuggle one in; no word list is kept here.
//   · a telos is declared IN A FRAME: `asof` (the as-of the perceiver is read at) and `purpose` (what the sameness of the
//     perceiver is for). An identity verdict is per frame (the identity thread, PIPELINE-LOG), so a telos with no asof or no
//     purpose is refused, and a weighing is filed only under a verdict of `same` decided in THIS telos' frame; `different` and
//     `undecided` leave it `unmeasured`, `refused` weighs nothing. A gap is never a hit.
//   · append-only, superseded by pointer (the GLAUCA-EOT contract; hyperlexicon-record.mjs is the template). A weighing may
//     not be filed before the telos it weighs, so the prediction can never be written after the result. A REC that changes any
//     frame field invalidates the old verdict; the old and the new stay side by side (identityStanding), as khora's reGround
//     keeps the old ground's fingerprint beside the new.
import { createHash } from "node:crypto";
import { kernelImport } from "./kernel-reach.mjs";

// The kernel is reached through organs/kernel-reach.mjs (typed khora-absent when the sibling is not there).
const { requireExperiencer } = await kernelImport("khora", "native/organs/experiencer.js");
const { deriveTension } = await kernelImport("khora", "native/kernel/dynamics.js");

const freeze = Object.freeze;

export const TELOS_SCHEMA = "EOTelos@1";
export const TELOS_REFUSAL_SCHEMA = "EOTelosRefusal@1";
export const TELOS_RECORD_SCHEMA = "EOTelosRecord@1";

/** The verdict a telos may aim at: khora's reGroundCondition kinds, with the three re-grounds named as such. The test PINS this
 *  set to what reGroundCondition actually returns; if khora gains a verdict, that test fails and this is the one place to follow. */
export const VERDICTS = freeze(["ground_holds", "re_ground:stale", "re_ground:collapse", "re_ground:contested"]);

/** The closed schema of a telos spec. Anything else is refused (unknown_field): there is no field to hide a rating in. */
const SPEC_FIELDS = freeze(["forWhom", "provenance", "asof", "purpose", "expect", "opens", "releases", "speaksFrom", "giver", "beforeFold", "at", "thread"]);

/** The refusal codes, typed (the minds-ledger.mjs shape). */
export const REFUSALS = freeze({
  NO_FOR_WHOM: "no_for_whom",
  UNVERIFIED_FOR_WHOM: "unverified_for_whom",
  NO_GIVER: "no_giver",
  NO_ADDRESS: "no_address",
  NO_ASOF: "no_asof",
  NO_PURPOSE: "no_purpose",
  NO_EXPECT: "no_expect",
  RATING_AIM: "rating_aim",
  RELEASE_WITHOUT_OPEN: "release_without_open",
  UNKNOWN_FIELD: "unknown_field",
});

/** The identity verdicts, as the identity thread reports them (PIPELINE-LOG, "Identity detection for content moderation",
 *  2026-10-27): not yet pinned to that thread's code, which this repo does not import. */
export const IDENTITY_VERDICTS = freeze(["same", "different", "undecided", "refused"]);

/** The standings an entry on the record can carry. `declared` is the registration, filed before the draw. */
export const STATUSES = freeze(["declared", "earned", "missed", "unmeasured", "superseded"]);

const refuse = (refused, reason, detail = null) =>
  freeze({ schema: TELOS_REFUSAL_SCHEMA, refused, reason, ...(detail ? { detail: freeze(detail) } : {}) });

const isText = (v) => typeof v === "string" && v.trim() !== "";
const addressList = (v) => Array.isArray(v) && v.every(isText);
const uniq = (list) => freeze([...new Set(list)]);

/** The content hash of what a telos SAYS (not when it was said): the same aim re-declared hashes the same. */
const hashOf = (body) => createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 12);

/**
 * declareTelos(spec) -> EOTelos@1 | EOTelosRefusal@1
 *
 *   forWhom     {who, read, revision?}  required; validated by khora's requireExperiencer (never defaulted)
 *   provenance  {source: "record", ref} required; the for-whom was read from the turn's own record, not from a label
 *   asof        string                  required; the as-of the perceiver is read at (a declared identifier, never a clock read here)
 *   purpose     string                  required; what the perceiver's identity is decided FOR (no purpose, no telos)
 *   expect      one of VERDICTS         required; the change is meant to leave the perceiver's ground in this verdict
 *   speaksFrom  [address, ...]          required, non-empty; the record the artifact manifests (the mouth originates nothing)
 *   giver       string                  required; who authorized the change
 *   opens       [address, ...]          optional; obligations the artifact is meant to open
 *   releases    [address, ...]          optional; obligations it is meant to release. Each must be open in `beforeFold` or in `opens`
 *   beforeFold  a fold                  optional; the perceiver's fold before the encounter (what makes a release checkable)
 *   at, thread  optional
 */
export function declareTelos(spec = {}) {
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
    return refuse(REFUSALS.NO_FOR_WHOM, "a telos is a spec object naming who it is for");
  }
  const unknown = Object.keys(spec).filter((k) => !SPEC_FIELDS.includes(k));
  if (unknown.length) {
    return refuse(REFUSALS.UNKNOWN_FIELD, "the schema is closed: a telos carries only its declared fields, so no rating can ride in as a field", { unknown });
  }

  let forWhom;
  try {
    forWhom = requireExperiencer(spec.forWhom);
  } catch (e) {
    return refuse(REFUSALS.NO_FOR_WHOM, e.message);
  }
  const p = spec.provenance;
  if (!p || typeof p !== "object" || p.source !== "record" || !isText(p.ref)) {
    return refuse(REFUSALS.UNVERIFIED_FOR_WHOM, "the for-whom must be read from the turn's own record (provenance {source: \"record\", ref}); a label on a message changes nothing (GL-CH-06)");
  }
  if (!isText(spec.giver)) {
    return refuse(REFUSALS.NO_GIVER, "a recorded act names its actor: who authorized this change?");
  }
  if (!addressList(spec.speaksFrom) || spec.speaksFrom.length === 0) {
    return refuse(REFUSALS.NO_ADDRESS, "speaksFrom is empty: the artifact may manifest only what the ground kept, so it must name where");
  }
  if (!isText(spec.asof)) {
    return refuse(REFUSALS.NO_ASOF, "sameness of the perceiver is per frame: say as of when the for-whom is read");
  }
  if (!isText(spec.purpose)) {
    return refuse(REFUSALS.NO_PURPOSE, "sameness of the perceiver is per frame: say what the identity is decided for. No purpose means no telos (and an identity verdict without one is refused)");
  }
  if (spec.expect == null) {
    return refuse(REFUSALS.NO_EXPECT, "a telos names the verdict it aims at");
  }
  if (typeof spec.expect !== "string" || !VERDICTS.includes(spec.expect)) {
    return refuse(REFUSALS.RATING_AIM, "expect must be a verdict (what the encounter leaves of the perceiver's ground), never a score, rating or quality", { expect: spec.expect, verdicts: VERDICTS });
  }
  for (const key of ["opens", "releases"]) {
    if (spec[key] != null && !addressList(spec[key])) {
      return refuse(REFUSALS.NO_ADDRESS, `${key} must be a list of obligation addresses`);
    }
  }

  const opens = uniq(spec.opens ?? []);
  const releases = uniq(spec.releases ?? []);
  const openBefore = new Set(spec.beforeFold ? deriveTension(spec.beforeFold).obligations.map((o) => String(o.id)) : []);
  const unreleasable = releases.filter((r) => !openBefore.has(r) && !opens.includes(r));
  if (unreleasable.length) {
    return refuse(REFUSALS.RELEASE_WITHOUT_OPEN, "a release must name an obligation that is open in the supplied beforeFold or that this telos opens", { unreleasable });
  }

  const body = {
    forWhom: { who: forWhom.who, read: forWhom.read, revision: forWhom.revision },
    asof: spec.asof,
    purpose: spec.purpose,
    expect: spec.expect,
    opens: [...opens],
    releases: [...releases],
    speaksFrom: [...uniq(spec.speaksFrom)],
    giver: spec.giver,
  };
  const hash = hashOf(body);
  const at = spec.at ?? new Date().toISOString();
  return freeze({
    schema: TELOS_SCHEMA,
    id: `telos:${hash}@${at}`,
    hash,
    forWhom,
    provenance: freeze({ source: "record", ref: p.ref }),
    asof: spec.asof,
    purpose: spec.purpose,
    frame: freeze({ asof: spec.asof, purpose: spec.purpose, whom: forWhom }),
    expect: spec.expect,
    opens,
    releases,
    speaksFrom: uniq(spec.speaksFrom),
    giver: spec.giver,
    at,
    thread: spec.thread ?? null,
  });
}

const sameWhom = (a, b) => a?.who === b?.who && a?.read === b?.read && (a?.revision ?? null) === (b?.revision ?? null);

/** Validate an identity verdict and its frame against the telos it is filed under. Returns it frozen, or null when absent. */
function checkIdentity(identity, telos, status) {
  const weighs = status === "earned" || status === "missed";
  if (identity == null) {
    if (weighs) throw new TypeError(`a ${status} entry is a weighing: it needs an identity verdict of "same" for the perceiver, decided in this telos' frame`);
    return null;
  }
  if (typeof identity !== "object" || !IDENTITY_VERDICTS.includes(identity.verdict)) {
    throw new TypeError(`identity.verdict must be one of ${IDENTITY_VERDICTS.join(", ")}`);
  }
  const f = identity.frame;
  if (!f || typeof f !== "object" || !f.whom || !isText(f.whom.who) || !isText(f.whom.read) || !isText(f.asof)) {
    throw new TypeError("an identity verdict carries its frame: { asof, purpose, whom: {who, read} } — sameness is per frame");
  }
  if (!isText(f.purpose) && identity.verdict !== "refused") {
    throw new TypeError("a frame with no purpose can only be refused: an identity verdict without a purpose is not a verdict");
  }
  if (weighs) {
    if (identity.verdict !== "same") {
      throw new TypeError(`a ${status} entry needs verdict "same"; "${identity.verdict}" leaves the telos unmeasured (a gap is never a hit)`);
    }
    if (f.asof !== telos.frame.asof || f.purpose !== telos.frame.purpose || !sameWhom(f.whom, telos.frame.whom)) {
      throw new TypeError("the identity verdict was decided under a different frame than this telos' (asof, purpose, whom): it does not license this weighing");
    }
  }
  return freeze({
    verdict: identity.verdict,
    tied: identity.tied == null ? null : freeze([...identity.tied]),
    excluded: identity.excluded == null ? null : freeze([...identity.excluded]),
    plateau: identity.plateau == null ? null : freeze({ ...identity.plateau }),
    frame: freeze({ asof: f.asof, purpose: f.purpose ?? null, whom: freeze({ who: f.whom.who, read: f.whom.read, revision: f.whom.revision ?? null }) }),
  });
}

/** The frame fields that differ between two identity frames. */
const frameDiff = (a, b) => [
  ...(a.asof !== b.asof ? ["asof"] : []),
  ...((a.purpose ?? null) !== (b.purpose ?? null) ? ["purpose"] : []),
  ...(a.whom.who !== b.whom.who ? ["whom.who"] : []),
  ...(a.whom.read !== b.whom.read ? ["whom.read"] : []),
  ...((a.whom.revision ?? null) !== (b.whom.revision ?? null) ? ["whom.revision"] : []),
];

/**
 * identityStanding(history, telosId) -> { current, invalidated, sideBySide }
 * A REC (an entry that supersedes another) that changes any frame field INVALIDATES the old verdict; nothing is deleted, the
 * old and the new are returned side by side with the fields that changed. A superseding entry under the SAME frame leaves the
 * old verdict standing (it was re-asserted, not re-framed). Pure.
 */
export function identityStanding(history = [], telosId) {
  const ofTelos = history.filter((h) => h.telosId === telosId && h.identity);
  const byId = new Map(history.map((h) => [h.id, h]));
  const sideBySide = [];
  const invalid = new Set();
  for (const h of ofTelos) {
    const old = h.supersedes ? byId.get(h.supersedes) : null;
    if (!old?.identity) continue;
    const changed = frameDiff(old.identity.frame, h.identity.frame);
    if (changed.length) {
      invalid.add(old.id);
      sideBySide.push(freeze({ old, new: h, changed: freeze(changed) }));
    }
  }
  const standing = ofTelos.filter((h) => !invalid.has(h.id));
  return freeze({ current: standing.at(-1) ?? null, invalidated: freeze(ofTelos.filter((h) => invalid.has(h.id))), sideBySide: freeze(sideBySide) });
}

/**
 * recordTelos(history, entry) -> history with the entry appended. Pure; persistence is the caller's, append-only.
 * entry: { telos: EOTelos@1, status, evidence?, identity?, falsifyingControl?, supersedes?, id?, at? }
 *
 * `identity` is the identity verdict for the perceiver, with the FRAME it was decided under (per frame, never stable across
 * frames): { verdict: same|different|undecided|refused, tied?, excluded?, plateau?, frame: { asof, purpose, whom: {who, read,
 * revision?} } }. A weighing (earned / missed) is filed only under `same` decided in THIS telos' frame. Any verdict whose frame
 * has no purpose can only be `refused`.
 *
 * `declared` is the registration and is filed first. Every later standing (earned / missed / unmeasured / superseded) needs a
 * `declared` entry for the same telos already on the record and evidence for its claim (Iphthime: no ungrounded claim).
 * A gap is not a hit: `unmeasured` is its own standing, never earned.
 */
export function recordTelos(history = [], entry = {}) {
  const telos = entry.telos;
  if (!telos || telos.schema !== TELOS_SCHEMA) {
    throw new TypeError("recordTelos requires an EOTelos@1 from declareTelos — a refusal is not filed as a telos");
  }
  if (!STATUSES.includes(entry.status)) {
    throw new TypeError(`status must be one of ${STATUSES.join(", ")}`);
  }
  const declaredBefore = history.some((h) => h.telosId === telos.id && h.status === "declared");
  if (entry.status === "declared") {
    if (declaredBefore) throw new TypeError(`${telos.id} is already declared — append-only: supersede it by pointer, never re-declare it`);
  } else {
    if (!declaredBefore) throw new TypeError(`${telos.id} was never declared on this record — the telos is filed before the draw, and a result cannot be filed ahead of it`);
    if (entry.evidence == null || (typeof entry.evidence === "string" && !entry.evidence.trim())) {
      throw new TypeError(`a ${entry.status} entry needs evidence — no claim is filed ungrounded`);
    }
  }
  if (entry.supersedes != null && !history.some((h) => h.id === entry.supersedes)) {
    throw new TypeError(`supersedes ${entry.supersedes}, which is not on the record`);
  }
  const identity = checkIdentity(entry.identity, telos, entry.status);

  const at = entry.at ?? new Date().toISOString();
  const id = entry.id ?? `${telos.id}/${history.filter((h) => h.telosId === telos.id).length}`;
  if (history.some((h) => h.id === id)) {
    throw new TypeError(`${id} is already on the record — append-only: supersede it by pointer, never re-file it`);
  }
  const filed = freeze({
    schema: TELOS_RECORD_SCHEMA,
    id,
    pipeline: "telos",
    at,
    telosId: telos.id,
    telosHash: telos.hash,
    forWhom: telos.forWhom,
    expect: telos.expect,
    giver: telos.giver,
    status: entry.status,
    evidence: entry.evidence ?? null,
    frame: telos.frame,
    identity,
    falsifyingControl: entry.falsifyingControl ?? "a delivered artifact whose measured perceiver verdict differs from this telos' expect, or whose aimed releases are not witnessed, concedes this entry",
    supersedes: entry.supersedes ?? null,
  });
  return freeze([...history, filed]);
}

export default { TELOS_SCHEMA, TELOS_REFUSAL_SCHEMA, TELOS_RECORD_SCHEMA, VERDICTS, IDENTITY_VERDICTS, REFUSALS, STATUSES, declareTelos, recordTelos, identityStanding };
