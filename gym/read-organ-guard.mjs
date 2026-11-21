// gym/read-organ-guard.mjs — the "grep the khora first" rule, made a failing gate.
// A READ capability is defined exactly once, in the khora (SYSTEM-MAP): the khora
// is the perceiver and owns every organ/adapter/kernel module; penelope imports
// it, never re-derives. This guard fails when a read organ the khora already owns
// is re-defined under penelope's own organs/ or experiments/. It is the fence that
// turns the 2026-11-20 mistake (emergent-smell and clitic-slice built in penelope
// beside the khora's ablation-grain-pressure / pos-smell / ud-tokenizer / segments)
// into a test that cannot pass.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// capabilities the khora's reader owns (native/adapters/text/): a same-named file in
// penelope is a re-derivation, not a tributary (tributaries also live in the khora).
const KHORA_READ_CAPS = [
  "emergent-smell", "clitic-slice", "pos-smell", "static-smell",
  "ablation-grain-pressure", "grain-typing", "declension", "case-marked-language",
  "ud-tokenizer", "ud-tokenize", "relations-case-marked", "segments", "script-segment",
];
const offenders = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (!e.name.startsWith(".")) walk(f); continue; }
    if (!/\.(mjs|js)$/.test(e.name)) continue; // regex-ok: a file-extension match on a path, not language
    const base = e.name.replace(/\.test\.(mjs|js)$/, "").replace(/\.(mjs|js)$/, ""); // regex-ok: stripping a file extension/suffix on a path, not language
    if (KHORA_READ_CAPS.includes(base)) offenders.push(path.relative(ROOT, f));
  }
};
walk(path.join(ROOT, "organs"));
walk(path.join(ROOT, "experiments"));
if (offenders.length) {
  console.error("READ-ORGAN GUARD FAIL: these read capabilities belong in the khora, not penelope (SYSTEM-MAP: a capability is defined once, in the khora; penelope imports it):\n  - " + offenders.join("\n  - "));
  process.exit(1);
}
console.log("read-organ guard: clean — penelope re-defines none of " + KHORA_READ_CAPS.length + " khora read capabilities");
