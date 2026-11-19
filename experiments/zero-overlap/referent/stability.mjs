// node stability.mjs dev -- L2 (birth, not spelling) as IMPLEMENTED by a fresh read. EXPLORATORY, DEV (ledger row 34).
// For every third DEV article: read the first ~2/3 of the text (cut at a paragraph boundary) and the whole text, both through khora's one door,
// and follow each referent that has >= 2 mentions in the prefix into the full read by FACE.
// Theory prediction (L2): the id of a being does not move when more text arrives. Falsifier: any id changing for such referents (rate > 0.02).
// Also measured: faces lost, merges (two prefix faces absorbed by one full referent), and how many mentions each gained.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
process.env.KHORA_PRIORS_DIR ||= `${process.env.HOME}/Documents/janus/priors`;
const { readDocument } = await import("/Users/mlacy/Documents/khora-cast/khora/native/reading.js");
const set = process.argv[2] ?? "dev";
const files = fs.readdirSync(path.join(HERE, "data", set)).filter((f) => f.endsWith(".json")).sort().filter((_, i) => i % 3 === 0);
const rd = (t) => readDocument(t, { language: "eng", lexicon: false, referents: true, castIdentity: true });
const T = { docs: 0, followed: 0, sameId: 0, lost: 0, merged: 0, gain: [], srcDiffers: 0, rows: [] };
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(HERE, "data", set, f), "utf8"));
  const lines = d.text.split("\n"); let acc = 0, cut = 0; for (const l of lines) { if (acc + l.length + 1 > d.text.length * 0.667) break; acc += l.length + 1; cut = acc; }
  const pre = d.text.slice(0, cut), full = d.text; if (pre.length < 2000) continue;
  const a = await rd(pre), b = await rd(full); if (!a.referents || !b.referents) continue; T.docs++;
  if (a.referents.source !== b.referents.source) T.srcDiffers++;
  const byFace = new Map(b.referents.referents.map((r) => [r.face.toLowerCase(), r]));
  const fullHolding = (face) => b.referents.referents.filter((r) => r.forms.includes(face) || r.face.toLowerCase() === face);
  const seen = new Map();   // full referent id -> prefix faces mapped to it
  for (const r of a.referents.referents) {
    if ((r.mentions?.length ?? 0) < 2) continue; T.followed++;
    const face = r.face.toLowerCase(); const m = byFace.get(face) ?? fullHolding(face)[0];
    if (!m) { T.lost++; continue; }
    if (m.id === r.id) T.sameId++;
    T.gain.push((m.mentions?.length ?? 0) - (r.mentions?.length ?? 0));
    seen.set(m.id, [...(seen.get(m.id) ?? []), face]);
  }
  for (const [, faces] of seen) if (faces.length > 1) T.merged += faces.length - 1;
  T.rows.push({ title: d.title, prefixChars: pre.length, prefixRefs: a.referents.referents.length, fullRefs: b.referents.referents.length, sourceIdSame: a.referents.source === b.referents.source });
  console.log(d.title, "| prefix referents", a.referents.referents.length, "| full", b.referents.referents.length, "| same source id:", a.referents.source === b.referents.source);
}
fs.writeFileSync(path.join(HERE, `stability-${set}.json`), JSON.stringify(T, null, 1));
const med = (x) => (x.length ? x.slice().sort((p, q) => p - q)[Math.floor(x.length / 2)] : 0);
console.log(`\n== STABILITY (DEV, exploratory): ${T.docs} articles; referents with >=2 prefix mentions followed: ${T.followed}`);
console.log(`same id after more text: ${T.sameId}/${T.followed} = ${(T.sameId / Math.max(T.followed, 1)).toFixed(3)}; face lost: ${T.lost}; prefix faces merged into another referent: ${T.merged}; median mention gain ${med(T.gain)}`);
console.log(`articles where the read's source id differs between prefix and full: ${T.srcDiffers}/${T.docs}`);
