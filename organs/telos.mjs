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
//   · append-only, superseded by pointer (the GLAUCA-EOT contract; hyperlexicon-record.mjs is the template). A weighing may
//     not be filed before the telos it weighs, so the prediction can never be written after the result.
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
const SPEC_FIELDS = freeze(["forWhom", "provenance", "expect", "opens", "releases", "speaksFrom", "giver", "beforeFold", "at", "thread"]);

/** The refusal codes, typed (the minds-ledger.mjs shape). */
export const REFUSALS = freeze({
  NO_FOR_WHOM: "no_for_whom",
  UNVERIFIED_FOR_WHOM: "unverified_for_whom",
  NO_GIVER: "no_giver",
  NO_ADDRESS: "no_address",
  NO_EXPECT: "no_expect",
  RATING_AIM: "rating_aim",
  RELEASE_WITHOUT_OPEN: "release_without_open",
  UNKNOWN_FIELD: "unknown_field",
});

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
    expect: spec.expect,
    opens,
    releases,
    speaksFrom: uniq(spec.speaksFrom),
    giver: spec.giver,
    at,
    thread: spec.thread ?? null,
  });
}

/**
 * recordTelos(history, entry) -> history with the entry appended. Pure; persistence is the caller's, append-only.
 * entry: { telos: EOTelos@1, status, evidence?, falsifyingControl?, supersedes?, id?, at? }
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
    falsifyingControl: entry.falsifyingControl ?? "a delivered artifact whose measured perceiver verdict differs from this telos' expect, or whose aimed releases are not witnessed, concedes this entry",
    supersedes: entry.supersedes ?? null,
  });
  return freeze([...history, filed]);
}

export default { TELOS_SCHEMA, TELOS_REFUSAL_SCHEMA, TELOS_RECORD_SCHEMA, VERDICTS, REFUSALS, STATUSES, declareTelos, recordTelos };
