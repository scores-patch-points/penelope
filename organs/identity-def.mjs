// identity-def.mjs — the IDENTITY as a DEFINITION, Penelope's side, through the pharos (THEORY-IDENTITY.md section 19, GL-ID-01). Pure: no model, no file IO, no network, no regular expression.
// A standing prior is a DEF at Pattern (asker, tolerance, giver, the priors it rests on); a per-pair declaration is a DEF at Figure that cites the prior and the EVIDENCE it was declared on.
// The evidence is read from the log BY KIND, written by anyone (janus: merged-world, difference, agreement, hole, change, binding): stigmergy, no session talks to another, a trace in the log is the message.
// She declares only what a named person or standard declares (the file's byline and giver); a corpus alone is a CANDIDATE and a model never writes the DEF.
export const EVIDENCE_KINDS = Object.freeze(["merged-world", "difference", "agreement", "hole", "change", "binding"]);
export const KINDS = Object.freeze({
  "identity-prior": { cell: "DEF·Pattern", why: "a standing prior: no difference that makes a difference between two folds, for these concerns, up to a tolerance, declared by an asker and resting on priors; given only with a named giver, otherwise a candidate" },
  "identity-declaration": { cell: "DEF·Figure", why: "one pair declared the same under a standing prior, citing the prior and the evidence (cuts, bonds, merged worlds, bindings, differences) it was declared on" },
});
const isModel = (x) => { const s = String(x ?? ""); return s.startsWith("model:") || s.startsWith("self:model:"); };
const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
/** declarePrior(spec) -> { ok, addr, body } | { ok: false, reason }. spec: { asker, tolerance, giver?, priors?, concerns?, by } */
export function declarePrior(spec = {}) {
  if (!isObj(spec)) return { ok: false, reason: "no_prior" };
  if (isModel(spec.by) || isModel(spec.giver)) return { ok: false, reason: "model_cannot_declare", detail: "a model never writes the identity DEF" };
  if (typeof spec.by !== "string" || !spec.by) return { ok: false, reason: "unbylined", detail: "a definition is declared by someone" };
  if (typeof spec.asker !== "string" || !spec.asker) return { ok: false, reason: "no_asker", detail: "the identity holds for someone" };
  if (!(typeof spec.tolerance === "number" ? Number.isFinite(spec.tolerance) : typeof spec.tolerance === "string" && spec.tolerance !== "")) return { ok: false, reason: "no_tolerance", detail: "up to something: declared, never defaulted" };
  const giver = typeof spec.giver === "string" && spec.giver ? spec.giver : null;
  return { ok: true, addr: `identity-prior:${spec.asker}`, body: { asker: spec.asker, tolerance: spec.tolerance, giver, priors: Array.isArray(spec.priors) ? spec.priors : [], concerns: spec.concerns ?? null, standing: giver ? "given" : "candidate", declared_by: spec.by, statement: "no difference that makes a difference between two folds, for these concerns, up to the tolerance" } };
}
/** the evidence about a pair: live entries of the evidence kinds, in log order. Most carry body.pair (the two names, either order); a `binding` is one entry per anaphor with its candidates inside, so it is evidence for a pair when BOTH names are among its candidate beings (the anaphor could bind to either: the ambiguity is the evidence). */
const beingsOfBinding = (e) => (Array.isArray(e.body?.candidates) ? e.body.candidates.map((c) => c?.ref?.being).filter((x) => typeof x === "string") : []);
export function evidenceFor(entries, a, b) {
  return (entries ?? []).filter((e) => {
    if (!EVIDENCE_KINDS.includes(e?.kind)) return false;
    if (e.kind === "binding") { const bs = beingsOfBinding(e); return bs.includes(a) && bs.includes(b); }
    return Array.isArray(e.body?.pair) && e.body.pair.includes(a) && e.body.pair.includes(b);
  }).map((e) => ({ id: e.id, kind: e.kind, by: e.by }));
}
/** declareIdentity({ prior (a live identity-prior entry), a, b, entries (the log's live entries), by }) -> { ok, addr, body, of } | { ok: false, reason } */
export function declareIdentity({ prior, a, b, entries = [], by } = {}) {
  if (isModel(by)) return { ok: false, reason: "model_cannot_declare", detail: "a model never writes the identity DEF" };
  if (typeof by !== "string" || !by) return { ok: false, reason: "unbylined" };
  if (!prior || prior.kind !== "identity-prior") return { ok: false, reason: "no_prior", detail: "a declaration cites a live standing prior" };
  if (typeof a !== "string" || typeof b !== "string" || !a || !b || a === b) return { ok: false, reason: "no_pair", detail: "a declaration names two different referents" };
  const evidence = evidenceFor(entries, a, b), key = [a, b].sort().join("|");
  return { ok: true, addr: `identity-declaration:${key}`, body: { a: [a, b].sort()[0], b: [a, b].sort()[1], prior: prior.id, standing: prior.body.standing, giver: prior.body.giver, tolerance: prior.body.tolerance, evidence, declared_by: by }, of: [prior.id, ...evidence.map((x) => x.id)] };
}
export function marksFor({ declaration = null, prior = null, log, by }) {
  const out = [];
  if (prior?.ok) out.push({ by, log, kind: "identity-prior", cell: KINDS["identity-prior"].cell, addr: prior.addr, body: prior.body, of: [], witness: { how: "declared by its byline and named giver; not derived from any data" }, declare: { why: KINDS["identity-prior"].why } });
  if (declaration?.ok) out.push({ by, log, kind: "identity-declaration", cell: KINDS["identity-declaration"].cell, addr: declaration.addr, body: declaration.body, of: declaration.of, witness: { how: "declared by its byline under the cited standing prior; the evidence entries named in `of` were read from the log by kind, never judged here" }, declare: { why: KINDS["identity-declaration"].why } });
  return out;
}
