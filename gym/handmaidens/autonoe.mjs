// gym/handmaidens/autonoe.mjs — THE SECOND: keeps every DRAW recorded.
//
// Autonoe, one of Penelope's faithful maids who kept the stores and knew
// what the house held. Her duty is the economy's honesty: every model draw
// must land on the swatch — a draw that spends tokens and writes no row is
// a leak, a duty the record forgot.
//
// THE DUTY: find every path in penelope that can spend model tokens (a
// fetch to a model door, a draw call, a completion) and check that it sits
// behind a swatch writer or is itself a swatch writer. A draw with no
// record is one of the suitors — forgetfulness wearing a working loom's
// face.
//
// THE SUITOR SHE HOLDS AT BAY: forgetfulness of duties — a draw path the
// economy never measures (the box-vs-model ablations POST straight to
// ollama with zero record; the door's own chat/rung/stream routes record
// only to ladder-live.jsonl).
//
// FALSIFYING CONTROL: a draw path that writes a swatch row reported as
// unrecorded; or a direct-ollama draw that spends tokens with no row
// reported as recorded — either proves her wrong.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");

// model doors that spend tokens — a fetch to any of these is a draw
const DOORS = [/11434/, /11435/, /11436/, /11439/, /\/api\/generate/, /\/api\/chat/, /\/v1\/(ask|code|build|messages)/, /\/chat\/completions/];

function filesUnder(rel) {
  const out = [];
  const walk = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (e.name.endsWith(".mjs") || e.name.endsWith(".js")) out.push(path.relative(ROOT, p));
    }
  };
  walk(path.join(ROOT, rel));
  return out;
}

// does this source write a swatch row, OR route through the door (which
// swatches)? A draw through runDrawDoor / the door URL is recorded there.
const swatches = (src) => /swatch\(/.test(src) || /swatch\.jsonl/.test(src) || /appendFileSync.*swatch/.test(src) || /runDrawDoor/.test(src) || /8137\/api\/generate/.test(src) || /generation-door/.test(src);
// does this source reach a model door?
const reachesDoor = (src) => DOORS.some((re) => re.test(src));

export function audit() {
  const files = [...filesUnder("organs"), ...filesUnder("gym")].filter((f) => !f.includes("handmaidens") && !f.includes("node_modules"));
  const unrecorded = [];
  for (const f of files) {
    let src;
    try { src = readFileSync(path.join(ROOT, f), "utf8"); } catch { continue; }
    if (!reachesDoor(src)) continue;       // not a draw path — not her business
    if (swatches(src)) continue;           // recorded — the duty is kept
    unrecorded.push(f);                    // draws and records nothing — a leak
  }
  return {
    schema: "Handmaiden@1",
    member: "autonoe",
    duty: "keep every draw on the record",
    suitor: "forgetfulness of duties",
    draws: files.filter((f) => { try { return reachesDoor(readFileSync(path.join(ROOT, f), "utf8")); } catch { return false; } }).length,
    unrecorded,
    ok: unrecorded.length === 0,
    falsifying: "a recorded draw reported as a leak, or a leak reported as recorded",
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const r = audit();
  console.log(JSON.stringify(r, null, 1));
  process.exit(r.ok ? 0 : 1);
}