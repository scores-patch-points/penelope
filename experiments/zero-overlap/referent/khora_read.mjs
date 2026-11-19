// node khora_read.mjs <set>  : read every data/<set>/*.json document through khora's ONE door (native/reading.js readDocument)
// and write data/<set>-khora.json = { pos: { referents:[{face,forms,mentions:[[u16start,u16end,kind]]}], gaps:[..] } }.
// Offsets are UTF-16 (khora's unit); score.py converts to sentences. Read-only use of khora.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const KH = process.env.KHORA_HOME || "/Users/mlacy/Documents/khora-cast/khora";
process.env.KHORA_PRIORS_DIR ||= `${process.env.HOME}/Documents/janus/priors`;
const { readDocument } = await import(`${KH}/native/reading.js`);
const set = process.argv[2];
const dir = path.join(HERE, "data", set);
const outPath = path.join(HERE, "data", `${set}-khora.json`);
const out = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : {};
for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith(".json")) continue;
  const doc = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const key = String(doc.pos);
  if (out[key]) continue;
  const t0 = Date.now();
  try {
    const e = await readDocument(doc.text, { language: "eng", lexicon: false, referents: true, castIdentity: true });
    const R = e.referents;
    if (!R) { out[key] = { none: true, gaps: (e.gaps || []).map((g) => g.gap) }; }
    else {
      const sp = new Map(R.spans.map((s) => [s.id, s]));
      out[key] = {
        referents: R.referents.map((r) => ({ face: r.face, forms: r.forms, standing: r.standing, mentions: (r.mentions || []).map((id) => sp.get(id)).filter(Boolean).map((s) => [s.at[0], s.at[1], s.kind]) })),
        gaps: (e.gaps || []).map((g) => g.gap),
      };
    }
  } catch (err) { out[key] = { err: String(err?.message || err).slice(0, 200) }; }
  fs.writeFileSync(outPath, JSON.stringify(out));
  console.log(key, doc.title, `${Date.now() - t0}ms`, out[key].referents ? out[key].referents.length + " referents" : JSON.stringify(out[key]).slice(0, 100));
}
