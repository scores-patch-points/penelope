import fs from "node:fs";
import { createSession, admitChunked, sessionReferents } from "/Users/mlacy/Documents/khora-cast/khora/native/legacy-ported/packages/host/corpus.js";
import { readLinks } from "/Users/mlacy/Documents/khora-cast/khora/native/legacy-ported/packages/engine/emergence/binding.js";
const path = process.argv[2], text = fs.readFileSync(path, "utf8");
const session = createSession(); admitChunked(session, { text, sourceId: "file:x", language: "en" });
const cast = sessionReferents(session, { sourceId: "file:x", priors: [], limit: 400 });
const split = (t) => t.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÞÄÖÜ])|\n+/).filter((s) => s.trim());
const arts = text.split("\n\n"); const sents = [], art = [];
arts.forEach((a, ai) => split(a).forEach((s) => { sents.push(s); art.push(ai); }));
const entities = [];
for (const r of cast.referents ?? []) { const arr = []; sents.forEach((s, i) => { if ((r.surfaces ?? [r.display]).some((x) => x.length > 2 && s.toLowerCase().includes(x.toLowerCase()))) arr.push(i); }); if (arr.length >= 2) entities.push({ id: r.display, arrivals: arr }); }
const links = readLinks(entities, { window: 1, draws: 1000, seed: 20261118, totalUnits: sents.length });
const dir = links.filter((l) => l.direction), sig = (l) => l.nulls.displacement.pValue < 0.05 && l.nulls.reseed.pValue < 0.05 && l.nulls.reversal.pValue < 0.05;
console.log("links", links.length, "directed", dir.length, "directed AND all three p<0.05", dir.filter(sig).length, "all three p<0.05 (any)", links.filter(sig).length);
const same = (l) => l.arrivals.a.some((i) => l.arrivals.b.some((j) => Math.abs(i - j) <= 1 && art[i] === art[j]));
console.log("directed links with entities co-arriving inside one article:", dir.filter(same).length, "| cross-article only:", dir.filter((l) => !same(l)).length);
for (const l of dir.filter(sig).sort((x, y) => y.strength - x.strength).slice(0, 12)) console.log(`  ${l.direction} ${l.a.id} -> ${l.b.id}  overlap ${l.overlap} strength ${l.strength.toFixed(4)} p(disp ${l.nulls.displacement.pValue}, rev ${l.nulls.reversal.pValue}, reseed ${l.nulls.reseed.pValue})`);
for (const l of links.filter((x) => !x.direction && x.nulls.displacement.pValue < 0.05).slice(0, 5)) console.log(`  undirected ${l.a.id} / ${l.b.id} overlap ${l.overlap} p(disp ${l.nulls.displacement.pValue})`);
