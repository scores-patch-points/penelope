#!/usr/bin/env node
// organs/generation/repair.mjs — THE WIRED REPAIR PATH.
//
// Joins four pieces that already exist, for a program's `heal`:
//   GARY      frames the draw (khora's prompting archon): a completion anchor of
//             facts, no prohibitions, the person's ask last — a small mouth
//             behaves without being told to.
//   SNIP      takes the atom out of whatever the mouth wraps it in.
//   THE GATE  classifies the intent BEFORE a draw: mechanical (the field holds
//             it — zero draws) → invent (the residue is the mouth's) → refuse.
//   THE HUNT  reaches real fields: GIT HISTORY (the committed version of the
//             unit is the known-good field), and the workspace.
//
// Nothing here is a new faculty; it is the wiring the log/program named as
// "wired but unreached".
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { makeGary } from "../../../khora/native/organs/gary.js";
import { snip } from "./adapters/code.mjs";

const gary = makeGary();

/** snipFunction(text, name) — the atom: the function, taken byte-mechanically
 *  from whatever the mouth wrapped it in. EXACT bytes (no rewrite) so the find
 *  always matches the source it came from. */
export function snipFunction(text, name) {
  const c = snip(String(text ?? ""), name);
  return c || null;
}

/** garyPrompt({ file, name, find, facts }) — Gary's bag, handed over: a
 *  completion anchor (real bytes to continue) with facts, not prohibitions, the
 *  person's ask last. Returns messages + Gary's findings. */
export function garyPrompt({ file, name, find, facts = [] }) {
  const messages = [
    { role: "system", content: `File: ${file}. Complete the function ${name}.` },
    { role: "user", content: `${facts.join("\n")}${facts.length ? "\n\n" : ""}${find}` },
  ];
  const handed = gary.hand(messages, { model: "qwen2.5-coder:1.5b", options: { num_predict: 200 } });
  return { messages: handed.messages, findings: handed.findings, gaps: handed.gaps, refused: handed.refused };
}

/** classifyIntent({ fieldFix, freeDraw }) — the reason-gate for code: which
 *  lane does this failure route to? Mechanical (field/box) before Invent. */
export function classifyIntent({ fieldFix = null, freeDraw = true } = {}) {
  if (fieldFix) return { lane: "mechanical", why: "the field holds the corrected bytes — the box computes, zero draws" };
  if (!freeDraw) return { lane: "refuse", why: "no field and no free draw — a named gap, never an invention" };
  return { lane: "invent", why: "the residue is the mouth's — a Gary-framed completion, then the snip" };
}

/** huntCommitted({ dir, rel, name }) — the git field: the committed version of
 *  the unit. Zero model. Returns { add, source:"git", address } | null. */
export function huntCommitted({ dir, rel, name }) {
  try {
    const head = execFileSync("git", ["-C", dir, "show", `HEAD:${rel}`], { encoding: "utf8", maxBuffer: 1e8 });
    const add = snipFunction(head, name);
    return add ? { add, source: "git", address: `HEAD#${rel}#${name}` } : null;
  } catch { return null; }
}

/** huntWorkspace({ name, roots }) — the workspace field: rg for a real
 *  implementation and snip it. Zero model. */
export function huntWorkspace({ name, roots = [] }) {
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    let hit = "";
    try { hit = execFileSync("sh", ["-c", `rg -l --no-messages "function ${name}\\(" ${JSON.stringify(root)} | head -1`], { encoding: "utf8" }).trim(); } catch { hit = ""; }
    if (!hit) continue;
    const add = snipFunction(fs.readFileSync(hit, "utf8"), name);
    if (add) return { add, source: "workspace", address: `${hit}#${name}` };
  }
  return null;
}

const latestFile = (claims, rel) => { const p = (claims ?? []).filter((c) => c.path === rel && typeof c.code === "string"); return p.length ? p[p.length - 1].code : ""; };

/** wired({ dir, rel, name, draw, huntFns }) — the repair config for one
 *  program: a `hunt` reaching the fields (mechanical, zero draws), and an
 *  `invent` that frames the draw with Gary and snips the atom. Returns
 *  { hunt, invent, report } to hand to program.heal. */
export function wired({ dir, rel, name, draw, huntFns = [] }) {
  const report = { lanes: [], gary: [] };
  const hunt = async ({ claims }) => {
    const code = latestFile(claims, rel);
    const find = snipFunction(code, name);
    if (find) {
      for (const fn of huntFns) {
        const hit = fn({ dir, rel, name, code });
        if (hit && hit.add && hit.add !== find) {
          report.lanes.push({ lane: "mechanical", field: hit.source, address: hit.address });
          return { path: rel, find, add: hit.add, source: hit.source, address: hit.address, reason: "the field holds the corrected bytes" };
        }
      }
    }
    report.lanes.push({ lane: "no-field" });
    return null;
  };
  const invent = async ({ claims, failure }) => {
    const find = snipFunction(latestFile(claims, rel), name);
    if (!find) return null;
    const line = String(failure ?? "").split("\n").find((l) => new RegExp(name).test(l) || /assert|expected|Error/.test(l));
    const facts = [`The real test fails: ${(line ?? "the assertion did not hold").trim().slice(0, 140)}`];
    const bag = garyPrompt({ file: rel, name, find, facts });
    report.gary.push({ findings: bag.findings.map((f) => f.rule), refused: bag.refused.map((f) => f.rule), facts });
    if (bag.refused.length) return null;
    const text = await draw(bag.messages.map((m) => `${m.role}: ${m.content}`).join("\n"));
    const add = snipFunction(text, name);
    return add ? { path: rel, find, add, model: "qwen2.5-coder:1.5b", reason: "invented (Gary-framed, snipped)" } : null;
  };
  return { hunt, invent, report };
}

export function selftest() {
  const checks = [];
  const atom = snipFunction("function f(){ return 1; }", "f");
  checks.push(["snip takes the exact atom", "function f(){ return 1; }".includes(atom)]);
  const bag = garyPrompt({ file: "a.js", name: "f", find: "function f(){ return 1; }", facts: ["The real test fails: expected 2"] });
  checks.push(["Gary's prompt carries no prohibition", !bag.findings.some((f) => f.rule === "information-not-prohibition")]);
  checks.push(["the ask is last", bag.messages.at(-1).role === "user"]);
  checks.push(["the gate is mechanical before invent", classifyIntent({ fieldFix: { add: "x" } }).lane === "mechanical"]);
  const failed = checks.filter(([, ok]) => !ok).map(([n]) => n);
  if (failed.length) throw new Error("repair selftest failed: " + failed.join("; "));
  return { ok: true, checks: checks.length };
}

export default { snipFunction, garyPrompt, classifyIntent, huntCommitted, huntWorkspace, wired, selftest };
