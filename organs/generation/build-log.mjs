#!/usr/bin/env node
// organs/generation/build-log.mjs — THE APPEND-ONLY BUILD LOG + THE PROJECTOR.
//
// The doctrine this makes real (code-loop.js:793): "the codebase IS the fold of
// that log — the log is the truth, the files are its current materialization."
// Here the log is the ONLY source of truth, and the artifact is a PURE
// PROJECTION of it: no file is written except by folding the log.
//
// The movement is the house law, made mechanical:
//   HUNT-FIRST — for each unit, the FIELD (the corpus) and the HUNT (the web /
//                a real address) are consulted before the MOUTH. Most bytes are
//                real code, snipped by ADDRESS, appended with PROVENANCE.
//   MOUTH-LAST — the mouth draws only the irreducible residue: a unit neither
//                the field nor the hunt held.
//   FALSIFY    — a candidate that fails the real gate is appended as a REFUSAL
//                and never enters the projection; the artifact carries its
//                verdict and its refusals.
//
// Two properties this module guarantees and its tests pin:
//   1. materialize(claims) is PURE — same log, same bytes (byte-equal replay).
//   2. resume is append — projecting after appending == projecting, then adding.
//
// A claim is one line: { seq, kind, ... }.
//   kind: "unit"    { phase:"define", unit, spec }      — the void, defined
//   kind: "fill"    { unit, source, address, code, model }  — a byte that enters
//   kind: "refusal" { unit, source, address, reason }   — a byte that does not
//   kind: "fold"    { bytes, units }                    — the projection event
//   kind: "verdict" { ok, reason }                      — the real test, recorded
//
// `source` is "field" | "hunt" | "draw" (the provenance of every byte).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const BUILD_LOG_SCHEMA = "BuildLog@1";
export const PROJECTION_SCHEMA = "BuildProjection@1";

/** append(logPath, claim) -> claim — one atomic JSONL line. The only writer. */
export function append(logPath, claim) {
  const row = { schema: BUILD_LOG_SCHEMA, ...claim };
  fs.appendFileSync(logPath, JSON.stringify(row) + "\n");
  return row;
}

/** readLog(logPath) -> claim[] — the log, in order. A missing log is empty. */
export function readLog(logPath) {
  try {
    return fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

const bySeq = (a, b) => (a.seq ?? 0) - (b.seq ?? 0);

/** materialize(claims, { assemble, delimiter }) -> the artifact, PURE.
 *  The unit order is the order of its own `define` claims; each unit takes its
 *  LAST applied `fill` (so a repair supersedes by appending); `assemble` (if
 *  given) turns the joined bytes into the shipped artifact. No clock, no IO —
 *  the same log always folds to the same bytes. */
export function materialize(claims, { assemble = null, delimiter = "\n\n" } = {}) {
  const rows = [...(claims ?? [])];
  const order = rows.filter((c) => c.kind === "unit" && c.phase === "define").sort(bySeq).map((c) => c.unit);
  const units = [];
  for (const name of order) {
    const fills = rows.filter((c) => c.kind === "fill" && c.unit === name && c.applied !== false).sort(bySeq);
    const last = fills[fills.length - 1];
    if (last) units.push({ unit: name, code: last.code, source: last.source ?? "draw", address: last.address ?? null, model: last.model ?? null, bytes: Buffer.byteLength(String(last.code ?? "")) });
  }
  const joined = units.map((u) => u.code).join(delimiter);
  const code = typeof assemble === "function" ? assemble(joined, order, units) : joined;
  const verdicts = rows.filter((c) => c.kind === "verdict").sort(bySeq);
  const refusals = rows.filter((c) => c.kind === "refusal");
  return {
    schema: PROJECTION_SCHEMA,
    code,
    order,
    units,
    provenance: units.map((u) => ({ unit: u.unit, source: u.source, address: u.address, model: u.model, bytes: u.bytes })),
    verdict: verdicts.length ? verdicts[verdicts.length - 1] : null,
    refusals: refusals.length,
    complete: units.length === order.length,
  };
}

/** project(logPath, opts) -> materialize(readLog(logPath)). The file is never
 *  read or written here — only the log is. */
export function project(logPath, opts = {}) {
  return materialize(readLog(logPath), opts);
}

/** nextSeq(logPath) -> the seq a new claim takes (the log's own length). */
export function nextSeq(logPath) {
  return readLog(logPath).length;
}

// ── THE BUILD: hunt-first, mouth-last, every byte logged ────────────────────
/** runBuild({ units, logPath, field, hunt, draw, gate, assemble, test, order })
 *  — fill each unit from field → hunt → mouth; append a fill or a refusal for
 *  every candidate; fold; run the real test; append the verdict. Returns the
 *  projection and the full log. A candidate that fails `gate` is a refusal
 *  (never appended as a fill); a unit nothing satisfies is left unfilled (a
 *  named gap), never invented.
 *    field(unit) -> { code, address } | null      (the corpus)
 *    hunt(unit)  -> { code, address } | null      (the web / an address)
 *    draw(unit)  -> { text, model } | null        (the mouth, residue only)
 *    gate(unit, code) -> { ok, reason }
 *    assemble(joined, order, units) -> code | null
 *    test(code, units) -> { ok, reason }
 */
export async function runBuild({ units = [], logPath, field = null, hunt = null, draw = null, gate = () => ({ ok: true, reason: "ungated" }), assemble = null, test = null } = {}) {
  if (!logPath) throw new Error("runBuild: logPath is required");
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, ""); // a build starts a fresh log (the log IS the truth)
  const A = (claim) => append(logPath, { seq: nextSeq(logPath), ...claim });

  for (const u of units) A({ kind: "unit", phase: "define", unit: u.name, spec: u.spec ?? null });

  for (const u of units) {
    let filled = false;
    for (const [source, fn] of [["field", field], ["hunt", hunt]]) {
      if (filled || typeof fn !== "function") continue;
      const cand = await fn(u);
      if (!cand) continue;
      const g = gate(u, cand.code);
      if (g.ok) { A({ kind: "fill", unit: u.name, source, address: cand.address ?? null, code: cand.code, model: null, applied: true }); filled = true; }
      else A({ kind: "refusal", unit: u.name, source, address: cand.address ?? null, reason: g.reason });
    }
    if (!filled && typeof draw === "function") {
      const d = await draw(u);
      const code = d?.code ?? d?.text ?? "";
      const g = gate(u, code);
      if (d && g.ok) { A({ kind: "fill", unit: u.name, source: "draw", address: null, code, model: d.model ?? null, applied: true }); filled = true; }
      else A({ kind: "refusal", unit: u.name, source: "draw", reason: g.reason || "empty draw" });
    }
    if (!filled) A({ kind: "unfilled", unit: u.name, reason: "field, hunt and mouth all came back without a passing byte — a named gap" });
  }

  const artifact = materialize(readLog(logPath), { assemble });
  A({ kind: "fold", bytes: Buffer.byteLength(artifact.code), units: artifact.units.length });
  const verdict = typeof test === "function" ? test(artifact.code, units) : { ok: null, reason: "no test declared" };
  A({ kind: "verdict", ok: verdict.ok === true, reason: verdict.reason ?? null });
  return { artifact: materialize(readLog(logPath), { assemble }), verdict, log: readLog(logPath) };
}

// ── selftest: both properties SHOWN, including the one that must fail ────────
export function selftest() {
  const checks = [];
  const mk = (arr) => arr.map((c, i) => ({ seq: i, ...c }));
  const base = mk([
    { kind: "unit", phase: "define", unit: "a", spec: "returns A" },
    { kind: "unit", phase: "define", unit: "b", spec: "returns B" },
    { kind: "fill", unit: "a", source: "field", address: "corpus://a", code: "const a = () => 'A';" },
  ]);
  // 1. purity: same log -> same bytes
  checks.push(["materialize is pure (same log, same bytes)", materialize(base).code === materialize(base).code]);
  // 2. provenance: a field byte carries its address
  const p = materialize(base);
  checks.push(["provenance carries source+address", p.units[0].source === "field" && p.units[0].address === "corpus://a"]);
  // 3. a refused fill never enters the projection; an unfilled unit is incomplete
  const refused = mk([...base, { kind: "refusal", unit: "b", source: "draw", reason: "did not parse" }]);
  const pr = materialize(refused);
  checks.push(["a refusal is excluded; the unit stays unfilled", !pr.code.includes("b") && pr.units.length === 1 && pr.complete === false]);
  // 4. resume is append: a later fill supersedes and completes the projection
  const resumed = mk([...base, { kind: "fill", unit: "b", source: "hunt", address: "https://x/b.js", code: "const b = () => 'B';" }]);
  const pres = materialize(resumed);
  checks.push(["append supersedes (resume)", pres.complete === true && pres.code.includes("'B'") && pres.units[1].source === "hunt"]);
  // 5. byte-equal replay across a real file round-trip
  const lp = path.join(os.tmpdir(), `build-log-selftest-${process.pid}.jsonl`);
  fs.writeFileSync(lp, resumed.map((c) => JSON.stringify(c)).join("\n") + "\n");
  checks.push(["project(file) == materialize(claims)", project(lp).code === pres.code]);
  try { fs.unlinkSync(lp); } catch {}
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  if (failed.length) throw new Error("build-log selftest failed: " + failed.join("; "));
  return { ok: true, checks: checks.length };
}

export default { BUILD_LOG_SCHEMA, PROJECTION_SCHEMA, append, readLog, materialize, project, nextSeq, runBuild, selftest };
