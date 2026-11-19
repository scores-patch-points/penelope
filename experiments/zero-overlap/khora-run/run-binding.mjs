import fs from "node:fs";
import { createSession, admitChunked, sessionReferents } from "/Users/mlacy/Documents/khora-cast/khora/native/legacy-ported/packages/host/corpus.js";
import { readLinks } from "/Users/mlacy/Documents/khora-cast/khora/native/legacy-ported/packages/engine/emergence/binding.js";
const [,, path, language = "en"] = process.argv;
const text = fs.readFileSync(path, "utf8"), sourceId = "file:" + path.split("/").pop();
const session = createSession(); admitChunked(session, { text, sourceId, language });
const cast = sessionReferents(session, { sourceId, priors: [], limit: 400 });
const sents = text.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÞÄÖÜ])|\n+/).filter((s) => s.trim());
const norm = (s) => s.toLowerCase();
const entities = [];
for (const r of cast.referents ?? []) {
  const arrivals = [];
  sents.forEach((s, i) => { const ls = norm(s); if ((r.surfaces ?? [r.display]).some((x) => x.length > 2 && ls.includes(norm(x)))) arrivals.push(i); });
  if (arrivals.length >= 2) entities.push({ id: r.display, arrivals });
}
const links = readLinks(entities, { window: 1, draws: 1000, seed: 20261118, totalUnits: sents.length });
const summary = links.map((l) => ({ a: l.a.id, b: l.b.id, overlap: l.overlap, direction: l.direction, polarity: l.polarity, keys: undefined, p: l.coArrivalP ?? l.pValue ?? l.p ?? null, raw: undefined }));
console.log(JSON.stringify({ sentences: sents.length, entities: entities.length, links: links.length, directed: links.filter((l) => l.direction).length, linkKeys: links[0] ? Object.keys(links[0]) : [] }, null, 1));
console.log(JSON.stringify(links.slice(0, 6).map((l) => { const o = {}; for (const k of Object.keys(l)) o[k] = (typeof l[k] === "object" && l[k] && l[k].id) ? l[k].id : l[k]; return o; }), (k, v) => (Array.isArray(v) && v.length > 6 ? `[${v.length} items]` : v), 1).slice(0, 2500));
fs.writeFileSync(path.replace(/\.txt$/, ".links.json"), JSON.stringify(links.map((l) => ({ a: l.a.id, b: l.b.id, overlap: l.overlap, direction: l.direction, polarity: l.polarity, ...Object.fromEntries(Object.entries(l).filter(([k, v]) => typeof v === "number" || typeof v === "string")) }))));
