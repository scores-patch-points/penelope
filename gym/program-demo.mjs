#!/usr/bin/env node
// gym/program-demo.mjs — a PROGRAM is an append-only log. Two programs:
//   A heals by HUNT  — the fix lives in the field; snip it, append, project, test.
//   B heals by INVENT — no field holds it; the mouth draws it, append, project, test.
// Every act is one log claim; the file on disk is materialize(log); iterating is
// appending. The real test is the judge.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { append, readLog, materialize, projectTo, heal, iterate } from "../organs/generation/program.mjs";
import { snip } from "../organs/generation/adapters/code.mjs";
import { draw } from "../organs/generation/engine.mjs";

const MODEL = process.env.DEMO_MODEL ?? "qwen2.5-coder:1.5b";
const fnText = (src, name) => { const c = snip(src, name); return c ? (/^\s*export\s/.test(c) ? c : "export " + c) : null; };

const field = { // the HUNT's field: a reference corpus (real, addressed bytes)
  sumTo: { path: "field/reference.mjs", code: "export function sumTo(n) {\n  return (n * (n + 1)) / 2;\n}", address: "field://reference.mjs#sumTo" },
};

async function buildOne({ label, file, name, buggy, test, hunt }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "program-"));
  const logPath = path.join(dir, "program.log.jsonl");
  fs.writeFileSync(logPath, "");
  append(logPath, { seq: 0, kind: "file", path: file, code: buggy, source: "seed" });
  fs.mkdirSync(path.join(dir, "test"), { recursive: true });
  fs.writeFileSync(path.join(dir, "test", label + ".test.mjs"), test);
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "module", scripts: { test: "node --test" } }));

  const invent = hunt ? null : async ({ claims }) => {
    const proj = materialize(claims);
    const find = fnText(proj.files[file], name);
    const text = await draw(`file: ${file}\nThe real test fails; fix the function below so it passes. Output only the corrected function.\n\n${find}`, { maxTokens: 160, model: MODEL, kind: "build" });
    const fenced = (String(text).match(/```[a-zA-Z]*\n([\s\S]*?)```/) ?? [null, text])[1];
    const add = fnText(fenced, name);
    return add ? { path: file, find, add, model: MODEL, reason: "real test failure" } : null;
  };

  const { rounds, projection, claims } = await heal({ logPath, dir, testCommand: "npm test", hunt, invent, maxRounds: 3 });
  const replays = JSON.stringify(materialize(readLog(logPath)).files) === JSON.stringify(projection.files);

  console.log(`\n──────── ${label.toUpperCase()} ────────`);
  console.log("the log:");
  for (const c of claims) {
    const bits = [c.kind, c.path ?? "", c.source ? `source=${c.source}` : "", c.address ? `@${c.address}` : "", c.model ? `model=${c.model}` : "", c.ok !== undefined ? `ok=${c.ok}` : "", c.reason ? `(${c.reason})` : ""].filter(Boolean).join(" ");
    console.log(`  ${String(c.seq).padStart(2)} ${bits}`);
  }
  console.log("the projection (provenance):");
  for (const p of projection.provenance) console.log(`  ${p.path} <- ${p.provenance.map((x) => x.act + (x.address ? " " + x.address : "") + (x.model ? " " + x.model : "")).join(" <- ")}`);
  console.log("the file:\n" + projection.files[file].replace(/^/gm, "    "));
  console.log(`the real test: ${projection.verdict?.ok ? "PASS" : "FAIL"} · rounds ${rounds.length} · project(log)===materialize(log): ${replays ? "MATCH" : "MISMATCH"}`);
  return { dir, logPath, projection };
}

async function main() {
  // A — heal by HUNT (the field holds it)
  await buildOne({
    label: "hunt", file: "src/stats.mjs", name: "sumTo",
    buggy: "export function sumTo(n) {\n  return (n * (n + 1)) / 2 - 1;\n}\n",
    test: `import { test } from "node:test";\nimport assert from "node:assert/strict";\nimport { sumTo } from "../src/stats.mjs";\ntest("sumTo", () => assert.equal(sumTo(5), 15));\n`,
    hunt: ({ claims }) => {
      const proj = materialize(claims);
      const find = fnText(proj.files["src/stats.mjs"], "sumTo");
      const add = field.sumTo.code;
      return { path: "src/stats.mjs", find, add, source: "field", address: field.sumTo.address, reason: "sumTo wrong" };
    },
  });
  // B — heal by INVENT (no field holds it; the mouth draws it)
  await buildOne({
    label: "invent", file: "src/math.mjs", name: "clamp",
    buggy: "export function clamp(n, lo, hi) {\n  return Math.min(Math.max(n, lo), hi + 1);\n}\n",
    test: `import { test } from "node:test";\nimport assert from "node:assert/strict";\nimport { clamp } from "../src/math.mjs";\ntest("clamp", () => assert.equal(clamp(9, 0, 5), 5));\n`,
    hunt: null,
  });
}

main();
