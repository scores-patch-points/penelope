#!/usr/bin/env node
// organs/generation/program.mjs — A PROGRAM IS AN APPEND-ONLY LOG.
//
// The vision, made mechanical: a program is built on the fly and can HEAL,
// PATCH, and INVENT. Every act only APPENDS one claim; the program's files are
// a PURE PROJECTION of the log. The workspace on disk is written only by
// projecting the log — the log is the truth, the files are its current
// materialization (code-loop.js:793). Iterating is appending and re-projecting;
// replaying the log reproduces the program byte-for-byte.
//
// claim kinds (JSONL, one per act):
//   { kind:"file",   path, code, source, address }      the program's base bytes
//   { kind:"patch",  path, find, add, source, address, reason }  a HUNTED edit
//   { kind:"invent", path, find, add, model, reason }   a MOUTH-drawn edit
//   { kind:"refusal",path, reason, by }                 an act that did not enter
//   { kind:"test",   command, ok, output }              the real test's verdict
//
// materialize(claims) is PURE: same log, same files. A single pass folds the
// base `file` claims and applies `patch`/`invent` edits in seq order; a find
// whose bytes are absent is a REFUSAL and never changes a file. The projection
// carries, per file, the provenance of every byte that shaped it.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export const PROGRAM_SCHEMA = "ProgramLog@1";
export const PROJECTION_SCHEMA = "ProgramProjection@1";

/** append(logPath, claim) — the ONLY writer. One atomic JSONL line. */
export function append(logPath, claim) {
  const row = { schema: PROGRAM_SCHEMA, ...claim };
  fs.appendFileSync(logPath, JSON.stringify(row) + "\n");
  return row;
}

/** readLog(logPath) — the log, in order. */
export function readLog(logPath) {
  try { return fs.readFileSync(logPath, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; }
}

/** materialize(claims) — the program, PURE (no clock, no IO). */
export function materialize(claims) {
  const rows = [...(claims ?? [])].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  const files = new Map();
  const order = [];
  const refused = [];
  for (const c of rows) {
    if (c.kind === "file") {
      if (!files.has(c.path)) order.push(c.path);
      files.set(c.path, { code: c.code, provenance: [{ act: "file", source: c.source ?? null, address: c.address ?? null, model: null }] });
      continue;
    }
    if (c.kind === "refusal") { refused.push({ path: c.path ?? null, reason: c.reason ?? "refused", by: c.by ?? null }); continue; }
    if (c.kind === "patch" || c.kind === "invent") {
      const f = files.get(c.path);
      if (!f) { refused.push({ path: c.path, reason: "no base file", by: c.kind }); continue; }
      if (typeof c.find !== "string" || !f.code.includes(c.find)) { refused.push({ path: c.path, reason: "find bytes absent in the projection", by: c.kind }); continue; }
      f.code = f.code.replace(c.find, c.add);
      f.provenance.push({ act: c.kind, source: c.source ?? null, address: c.address ?? null, model: c.model ?? null, reason: c.reason ?? null });
    }
  }
  const tests = rows.filter((c) => c.kind === "test");
  const filesObj = {};
  const provenance = [];
  for (const p of order) { filesObj[p] = files.get(p).code; provenance.push({ path: p, provenance: files.get(p).provenance }); }
  return {
    schema: PROJECTION_SCHEMA,
    files: filesObj,
    provenance,
    verdict: tests.length ? tests[tests.length - 1] : null,
    refusals: refused.length,
    refused,
  };
}

/** projectTo(logPath, dir) — write the program's files to disk (the ONLY writer of files). */
export function projectTo(logPath, dir) {
  const p = materialize(readLog(logPath));
  fs.mkdirSync(dir, { recursive: true });
  for (const [rel, code] of Object.entries(p.files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, code);
  }
  return p;
}

function runTest(command, cwd) {
  try { return { ok: true, output: execSync(command, { cwd, encoding: "utf8", stdio: "pipe" }) }; }
  catch (e) { return { ok: false, output: String(e.stdout ?? "") + String(e.stderr ?? "") }; }
}

/** heal({ logPath, dir, testCommand, hunt, invent, maxRounds }) — the healing
 *  loop. Each round: project the log to disk, run the REAL test (append the
 *  verdict), and if red, ask the HUNT (the field) then the MOUTH (invent) for an
 *  edit; append the edit, re-project, re-test. Bounded. A fix whose find bytes
 *  are not in the projection is a REFUSAL, never applied. Returns the projection
 *  and the rounds. hunt/invent: async ({ failure, dir, claims }) -> { path, find, add, source, address, model, reason } | null. */
export async function heal({ logPath, dir, testCommand, hunt = null, invent = null, maxRounds = 6 } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const A = (c) => append(logPath, { seq: readLog(logPath).length, ...c });
  const rounds = [];
  for (let round = 0; round <= maxRounds; round += 1) {
    projectTo(logPath, dir);
    const t = runTest(testCommand, dir);
    A({ kind: "test", command: testCommand, ok: t.ok, output: t.output.slice(-400) });
    rounds.push({ round, ok: t.ok });
    if (t.ok || round === maxRounds) break;
    let fix = null, by = null;
    if (typeof hunt === "function") { fix = await hunt({ failure: t.output, dir, claims: readLog(logPath) }); if (fix) by = "patch"; }
    if (!fix && typeof invent === "function") { fix = await invent({ failure: t.output, dir, claims: readLog(logPath) }); if (fix) by = "invent"; }
    if (!fix) { A({ kind: "refusal", reason: "no fix from hunt or invent", failure: t.output.slice(-160) }); break; }
    const proj = materialize(readLog(logPath));
    if (!proj.files[fix.path] || !proj.files[fix.path].includes(fix.find)) {
      A({ kind: "refusal", path: fix.path, reason: "find bytes absent in the projection", by });
      continue;
    }
    A({ kind: by, path: fix.path, find: fix.find, add: fix.add, source: fix.source ?? null, address: fix.address ?? null, model: fix.model ?? null, reason: fix.reason ?? null });
  }
  const claims = readLog(logPath);
  return { rounds, projection: materialize(claims), claims };
}

/** iterate({ logPath, dir, testCommand, act }) — append one more act to a
 *  program and re-project. Iterating a program is appending, never rewriting. */
export function iterate({ logPath, act }) {
  append(logPath, { seq: readLog(logPath).length, ...act });
  return materialize(readLog(logPath));
}

// ── selftest ────────────────────────────────────────────────────────────────
export function selftest() {
  const checks = [];
  const log = (rows) => rows.map((c, i) => ({ seq: i, ...c }));
  const base = log([{ kind: "file", path: "a.js", code: "const x = 1;", source: "seed" }]);
  checks.push(["materialize is pure (same log, same files)", materialize(base).files["a.js"] === materialize(base).files["a.js"]]);
  const patched = log([...base, { kind: "patch", path: "a.js", find: "1", add: "2", source: "hunt", address: "git#a" }]);
  const p = materialize(patched);
  checks.push(["a patch edits the projection", p.files["a.js"] === "const x = 2;"]);
  checks.push(["provenance carries the edit's source", p.provenance[0].provenance.some((x) => x.act === "patch" && x.address === "git#a")]);
  const refused = log([...base, { kind: "patch", path: "a.js", find: "NOPE", add: "x", source: "hunt" }]);
  checks.push(["a find whose bytes are absent is a refusal, never applied", materialize(refused).refusals === 1 && materialize(refused).files["a.js"] === "const x = 1;"]);
  const resumed = log([...patched, { kind: "invent", path: "a.js", find: "2", add: "3", model: "m" }]);
  checks.push(["iterate is append (last act wins)", materialize(resumed).files["a.js"] === "const x = 3;"]);
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  if (failed.length) throw new Error("program selftest failed: " + failed.join("; "));
  return { ok: true, checks: checks.length };
}

export default { PROGRAM_SCHEMA, PROJECTION_SCHEMA, append, readLog, materialize, projectTo, heal, iterate, selftest };
