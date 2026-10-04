// organs/generation/adapters/code-fix.mjs — the code-fix adapter (2026-10-04).
//
// A single-module improvement task (fix/improve/harden this module) rides the
// SAME Weave spine as a build, with a medium-specific twist: there is one unit
// ("module"), and the FALSIFYING GATE is the probe — so a draft that fails the
// gate is refused by the engine's own spiral, sharpened by the reason lint
// (janus lintGfp + the khora's code-goal-lint), and re-drawn. Nothing here is
// a second orchestration engine; the engine owns the order, the retries, the
// scars, the EOT.
//
// The gate contract rides `context.verification.gate`: a falsifier script
// path (`node <gate> <candidate-module>`, the eval shape). A unit passes only
// when the gate exits 0. `context.source` is the current (defective) module;
// `context.goals` is the goal sheet ({end1,label,end2}) the reason lint judges
// the drafts against.

import { buildFixPrompt, extractModule, reasonLint, runGateScriptSync } from "../../code-fix.mjs";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

/** The gate on one candidate module — SYNC (the engine's probeUnit/testUnits
 *  contract is sync; a Promise here would leak into the provenance EOT). Runs
 *  the falsifier script, or `node --check` when no gate is declared. */
function gateCode(candidate, context = {}) {
  const gate = context.verification?.gate;
  const dir = mkdtempSync(path.join(tmpdir(), "code-fix-adapter-"));
  try {
    const file = `${dir}/candidate.mjs`;
    writeFileSync(file, String(candidate ?? ""), "utf8");
    if (!gate) {
      try {
        execFileSync(process.execPath, ["--check", file], { timeout: 30_000, stdio: "pipe" });
        return { ok: true, reason: "syntax", detail: "exit 0" };
      } catch (e) {
        return { ok: false, reason: "syntax", detail: String(e?.stderr || e?.message || e).slice(0, 220) };
      }
    }
    const r = runGateScriptSync(gate, file);
    return { ok: r.ok, reason: r.ok ? "gate-pass" : "gate-fail", detail: r.why };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The pass claim the gate refused, read off its own words — never invented.
 *  The structured assertion fields (actual / expected) name got and want;
 *  the call regex never spans a line, so a frame trace cannot swallow it. */
function passClaimFromWhy(why = "", goals = []) {
  const text = String(why ?? "");
  const call = text.match(/([A-Za-z_]\w*\s*\([^)\n]*\))/);
  const got = text.match(/actual:\s*(-?\d+(?:\.\d+)?)/i) ?? text.match(/(-?\d+(?:\.\d+)?)/);
  const want = text.match(/expected:\s*(-?\d+(?:\.\d+)?)/i) ?? text.match(/(?:want|expected|must be)\s+(-?\d+(?:\.\d+)?)/i);
  const end1 = call?.[1] ?? goals?.[0]?.end1 ?? null;
  return { end1, label: "returns", end2: got?.[1] ?? want?.[1] ?? null };
}

const codeFixAdapter = {
  kind: "code-fix",
  ext: "mjs",
  mouthTokens: 1024,

  async readUnits(task) {
    return [{ name: "module", spec: String(task ?? "") }];
  },

  autofill() {
    return null;
  },

  hunt() {
    return null;
  },

  mouthFragment(unit, atom, context = {}) {
    const sharpened = atom && atom !== unit.spec;
    return buildFixPrompt({ brief: unit.spec, target: context.source ?? "", gateHints: sharpened ? [atom] : [] });
  },

  snip(value) {
    return extractModule(value);
  },

  probeUnit(code, _unit, context = {}) {
    return gateCode(code, context);
  },

  sharpen(unit, _atom, why, context = {}) {
    const pass = passClaimFromWhy(why, context.goals ?? []);
    const r = reasonLint({ goals: context.goals ?? [], pass });
    const clauses = r.clauses.length ? r.clauses : r.findings.map((f) => f.detail).slice(0, 2);
    return clauses.join("; ") || String(why ?? "").slice(0, 200);
  },

  assemble(code) {
    return code;
  },

  testUnits(code, _units, context = {}) {
    return gateCode(code, context);
  },

  toDocument({ code, title }) {
    const src = JSON.stringify(String(code ?? ""));
    return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title ?? "code-fix"}</title></head>
<body>
<h1>${title ?? "code-fix"}</h1>
<pre id="out" style="font:12px monospace;white-space:pre-wrap;padding:12px;border:1px solid #ccc;border-radius:6px"></pre>
<script>
document.getElementById("out").textContent = ${src};
</script>
</body></html>`;
  },
};

export default codeFixAdapter;