#!/usr/bin/env node
// gym/anaphor-mutants.mjs — the falsifying control of organs/anaphor-commit.mjs: break each rule in a COPY of the organ and run organs/anaphor-commit.test.mjs against it
// (through $ANAPHOR_ORGAN). A mutant the tests still pass is SURVIVING: the test that should have caught it is missing. Exit 1 if any survives, or the unbroken organ fails.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, ".."), ORGAN = path.join(ROOT, "organs", "anaphor-commit.mjs"), TEST = path.join(ROOT, "organs", "anaphor-commit.test.mjs");
export const MUTANTS = [
  ["drop the gender-clash rule", 'if (clash) add(', 'if (false) add('],
  ["gender clash needs only one gender", 'vs.has("m") && vs.has("f")', 'vs.has("m") || vs.has("f")'],
  ["ignore the held.bound calls", 'for (const h of held) if (typeof h.bound === "string") note(h.bound, h.at);', ''],
  ["ignore the referents.pronouns calls", 'for (const sp of r.pronouns ?? []) note(r.ref, sp);', ''],
  ["drop the binding gender mismatch", 'if (g === "mismatch")', 'if (false)'],
  ["treat an unknown gender as a mismatch", 'if (g === "mismatch")', 'if (g === "mismatch" || g === "unknown")'],
  ["run the gender rules for every pronoun, not only he/she", 'if (cls) {', 'if (true) {'],
  ["drop the non-nominal rule", 'if (nominal(ref) === false)', 'if (false)'],
  ["treat a referent with no mention rows as non-nominal", 'if (nominal(ref) === false)', 'if (nominal(ref) !== true)'],
  ["non-nominal accepts any token, not noun or proper noun", 't.upos === "NOUN" || t.upos === "PROPN"', 'true'],
  ["drop disjoint reference (rows)", 'else if (cm === null) {', 'else if (false) {'],
  ["ignore the same-clause rule (any head)", 'l.head === myLift.head', 'true'],
  ["ignore the same-sentence rule", 'l.s === myLift.s &&', ''],
  ["let an oblique pronoun be a core argument", 'export const CORE = Object.freeze(["nsubj", "obj", "iobj"])', 'export const CORE = Object.freeze(["nsubj", "obj", "iobj", "obl"])'],
  ["apply disjointness to a possessive", '&& !possessive;', ';'],
  ["apply disjointness to a reflexive", '&& !reflexive && ', '&& '],
  ["do not follow coordination", '=== "conj"; n++', '=== "conjx"; n++'],
  ["trust clauseMate true whatever the role", 'cm === true && CORE.includes(depBase(jr.role ?? ""))', 'cm === true'],
  ["do not trust clauseMate false (fall to the rows)", 'else if (cm === null) {', 'else if (cm !== true) {'],
  ["drop the binding clauseMate evidence", 'if (cm === true && CORE', 'if (false && CORE'],
  ["commit on the top activation when several survive", 'out.survivors.length === 1', 'out.survivors.length >= 1'],
  ["commit when none survive", 'out.survivors.length === 1', 'out.survivors.length <= 1'],
  ["an empty spectrum is held, not new", 'out.verdict = "new"', 'out.verdict = "held"'],
  ["no adapter is silent, not a gap", 'why: "no_adapter"', 'why: "ignored"'],
  ["the empty-evidence gap is not said", 'if (!evidence.length) gaps.push', 'if (false) gaps.push'],
  ["no rows still decides", 'if (!haveRows) { out.rule', 'if (false) { out.rule'],
  ["a pronoun with no row is decided", 'if (!row) { out.rule', 'if (false) { out.rule'],
  ["no spectrum is silent", 'if (!Array.isArray(held) || !held.length) { gaps.push', 'if (!Array.isArray(held) || !held.length) { void ('],
  ["the face is dropped", 'p.face = p.defined ?', 'p.face = false ?'],
  ["the displayed spectrum is truncated to one", 'export const SHOWN = 8', 'export const SHOWN = 1'],
  ["Gender=Masc matched loosely", 'g === "Masc" ? "m"', 'g.startsWith("Masc") ? "m"'],
];
export function run() {
  const src = fs.readFileSync(ORGAN, "utf8"), dir = fs.mkdtempSync(path.join(os.tmpdir(), "anaphor-mut-")), res = [];
  const go = (file) => spawnSync(process.execPath, ["--test", TEST], { env: { ...process.env, ANAPHOR_ORGAN: file }, encoding: "utf8" }).status;
  const base = go(ORGAN);
  for (const [name, from, to] of MUTANTS) {
    const n = src.split(from).length - 1;
    if (n !== 1) { res.push({ name, status: `BAD MUTANT (the text to break occurs ${n} times)` }); continue; }
    const f = path.join(dir, `m${res.length}.mjs`); fs.writeFileSync(f, src.replace(from, () => to));
    res.push({ name, status: go(f) === 0 ? "SURVIVED" : "killed" });
  }
  return { base: base === 0, res };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const { base, res } = run();
  console.log(`unbroken organ passes: ${base}`);
  for (const r of res) console.log(`${r.status === "killed" ? "killed  " : "NOT KILLED"} ${r.name}${r.status === "killed" ? "" : ` -> ${r.status}`}`);
  const bad = res.filter((r) => r.status !== "killed");
  console.log(`${res.length - bad.length}/${res.length} mutants killed`);
  process.exit(base && !bad.length ? 0 : 1);
}
