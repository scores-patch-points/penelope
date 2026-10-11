// penelope/organs/hyperlexicon-record.mjs — THE KEEPER'S LEDGER FOR THE
// HYPERLEXICON (2026-10-11). Penelope owns the record and the mouth. This
// organ files each epoch of the Hyperlexicon reading loop on the record in
// the GLAUCA-EOT contract (pipeline, status, evidence, falsifying control —
// append-only; to revise, supersede by pointer; a tripped control IS the
// finding) and renders the current judgment at the mouth.
//
// Three-body seam: khora settles (recordReading/routeReadingOutcome), janus
// derives (consequenceVerdict, EOConsequenceVerdict@1), penelope RECORDS the
// weave (CON/REC epochs that earned) and the unweave (DEF epochs that
// falsified) — every night, on the record — and the mouth says what stands.
//
// Two pure doors (no I/O; persistence is the caller's, append-only):
//   recordHyperlexiconEpoch(history, epoch) -> history with the entry appended
//   renderJudgment(state)                      -> the mouth's sentence

export const HL_RECORD_SCHEMA = "EOHyperlexiconRecord@1";

const freeze = (v) => Object.freeze(v);

/** The standing verb for an epoch, from khora's routing report. */
const statusOf = (acted) =>
  acted === "promoted_con" || acted === "corroborated" || acted === "promoted" ? "earned"
    : acted === "revised_rec" ? "superseded"
      : acted === "defeated_def" || acted === "refuted" ? "refuted"
        : acted === "refused_refuted" ? "refused_reroute"
          : "other";

/**
 * The record entry for one epoch: pipeline, status, evidence (the janus
 * verdict), and the falsifying control that would reverse it — the GLAUCA-EOT
 * contract, applied to the Hyperlexicon's own ledger.
 */
export function recordHyperlexiconEpoch(history = [], epoch = {}) {
  const at = epoch.at ?? new Date().toISOString();
  const verdict = epoch.verdict ?? null;
  const entry = freeze({
    schema: HL_RECORD_SCHEMA,
    id: epoch.id ?? `hl:epoch:${at}`,
    pipeline: "hyperlexicon",
    at,
    reading: epoch.reading ?? null,
    rowId: epoch.rowId ?? null,
    acted: epoch.acted ?? null,
    status: epoch.status ?? statusOf(epoch.acted),
    standing: epoch.standing ?? null,
    season: epoch.reason ?? null,
    evidence: verdict ? freeze({ method: verdict.method, success: verdict.success, effect: verdict.effect, pValue: verdict.pValue, witness: verdict.witness }) : null,
    falsifyingControl: epoch.falsifyingControl ?? "a held-out consequence that falls below the 0.15/0.05 bar reverses this entry's standing",
    supersedes: epoch.supersedes ?? null,
    retainedDefeats: Number.isFinite(epoch.retainedDefeats) ? epoch.retainedDefeats : null,
  });
  // APPEND-ONLY, ENFORCED (2026-10-11): an epoch id is never re-filed — no
  // filtering, no same-id replacement; supersede it by pointer instead. A
  // re-file attempt is a typed refusal, never a silent rewrite.
  if (history.some((h) => h.id === entry.id)) {
    throw new TypeError(`${entry.id} is already on the record — append-only: supersede it by pointer, never re-file it`);
  }
  return freeze([...history, entry]);
}

/**
 * renderJudgment — the mouth's verdict on the ledger: what stands (earned),
 * what is withheld (candidate), what is preserved-withdrawn (refuted), and the
 * retained prior the next reading experiences against.
 */
export function renderJudgment(state = {}) {
  const earned = (state.earned ?? []);
  const candidates = (state.candidates ?? []);
  const refuted = (state.refuted ?? []);
  const priorEntries = (state.priorEntries ?? []);
  const parts = [];
  if (earned.length) parts.push(`earned: ${earned.join(", ")}`);
  if (candidates.length) parts.push(`withheld-candidate: ${candidates.join(", ")}`);
  if (refuted.length) parts.push(`defeated-preserved: ${refuted.join(", ")}`);
  const mind = priorEntries.length
    ? `the retained mind holds ${priorEntries.length} referent${priorEntries.length === 1 ? "" : "s"}`
    : "the retained mind is empty";
  const line = parts.length ? parts.join(" · ") : "nothing on the ledger yet";
  return `${line} — ${mind}.`;
}

export default { HL_RECORD_SCHEMA, recordHyperlexiconEpoch, renderJudgment };