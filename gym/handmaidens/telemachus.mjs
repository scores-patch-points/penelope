// gym/handmaidens/telemachus.mjs — THE FOURTH: the watcher who holds the
// loom honest at the threshold.
//
// Telemachus is Penelope's son, not a handmaid — but his whole duty is to
// keep the suitors out of the house while his mother weaves, and that is
// the fourth thread: the DRAW must reach the model through the sanctioned
// door (the mouth → Heimdall's channel), never straight past her. A draw
// that bypasses the mouth is a suitor in the house — it spends tokens,
// evades the ration, and records nothing where the record can see it.
//
// THE DUTY: the swatch's own law — "every draw lands on the swatch"
// (generation-door.mjs:9) and the door's law — "never ollama direct"
// (gym/server.mjs:33-35). Telemachus holds the threshold: a direct fetch
// to a model door that is not the mouth, in a path that is not an
// acknowledged bypass, is a breach.
//
// THE SUITOR HE HOLDS AT BAY: forgetfulness of duties — the draw that
// forgets its own door.
//
// FALSIFYING CONTROL: a direct-to-ollama draw that is a sanctioned,
// disclosed bypass (an eval, a named exception) reported as a breach; or a
// breach that is recorded as clean — either proves him wrong.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");

// sanctioned bypasses — eval harnesses, disclosed direct draws, the no-model
// tripwire — named, so Telemachus does not cry wolf at the sanctioned door.
// The box-vs-model ablations were breaches until 2026-10-04, when they were
// wired through the generation door (gym/box-draw.mjs); they are no longer
// flagged. voice.mjs's own drawRouted goes direct (disclosed GL-WV-12); the
// door wraps it, so a direct voice call is the sanctioned exception.
const SANCTIONED = [
  "voice.e2e.mjs", "weave-nomodel.mjs", "nomodel-prose.mjs", "nomodel-summary.mjs",
  "voice.mjs", // the voice's own drawRouted goes direct (disclosed GL-WV-12); the door wraps it
  "box-vs-model-casual.mjs", "box-vs-model-experiment.mjs", "box-settle-vs-model.mjs", "box-settle-live-hunt.mjs", // wired through the door 2026-10-04 (box-draw.mjs)
];
const DIRECT = [/fetch\([^)]*1143[456]/, /fetch\([^)]*11435/, /askOllama/];

function filesUnder(rel) {
  const out = [];
  const walk = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name.startsWith(".") || e.name === "handmaidens") continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (e.name.endsWith(".mjs") || e.name.endsWith(".js")) out.push(path.relative(ROOT, p));
    }
  };
  walk(path.join(ROOT, rel));
  return out;
}

export function audit() {
  const files = [...filesUnder("organs"), ...filesUnder("gym")];
  const breaches = [];
  for (const f of files) {
    if (SANCTIONED.some((s) => f.endsWith(s))) continue;
    let src;
    try { src = readFileSync(path.join(ROOT, f), "utf8"); } catch { continue; }
    // a direct fetch to 1143x that is NOT the mouth's own /api/generate path,
    // and not a swatch write — a draw past the door
    if (DIRECT.some((re) => re.test(src)) && !/11439/.test(src)) {
      breaches.push(f);
    }
  }
  return {
    schema: "Handmaiden@1",
    member: "telemachus",
    duty: "keep every draw inside the sanctioned door",
    suitor: "forgetfulness of duties — the draw that forgets its door",
    directDrawers: files.filter((f) => { try { return DIRECT.some((re) => re.test(readFileSync(path.join(ROOT, f), "utf8"))); } catch { return false; } }).length,
    breaches,
    ok: breaches.length === 0,
    falsifying: "a sanctioned, disclosed bypass reported as a breach, or a breach reported clean",
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const r = audit();
  console.log(JSON.stringify(r, null, 1));
  process.exit(r.ok ? 0 : 1);
}