import fs from "node:fs";
import { loadModel, smell } from "/Users/mlacy/Downloads/workspace/khora-clone/native/adapters/text/emergent-smell.mjs";
const model = loadModel("eng");
const sm = (form) => { try { return smell({ model, form }); } catch { return null; } };

const sents = []; let cur = [];
for (const line of fs.readFileSync("/tmp/ud/UD_English-EWT/en_ewt-ud-test.conllu", "utf8").split("\n")) {
  if (!line.trim()) { if (cur.length) sents.push(cur); cur = []; continue; }
  if (line.startsWith("#")) continue;
  const c = line.split("\t");
  if (c.length === 10 && /^\d+$/.test(c[0])) cur.push({ form: c[1], upos: c[3], feats: c[5], deprel: c[7], head: c[6] });
  if (cur.length && line.trim() === "") { sents.push(cur); cur = []; }
}
if (cur.length) sents.push(cur);

const GRAIN = (u) => {
  if (["NOUN", "PROPN", "NUM", "X"].includes(u)) return "Ground";
  if (["VERB", "AUX", "PRON", "DET", "ADP", "ADV", "INTJ", "PART"].includes(u)) return "Figure";
  return "Pattern";
};
const TERRAIN = (upos, deprel, hasChildren) => {
  const semantic = ["nsubj", "obj", "iobj", "obl", "nmod", "nsubj:pass", "obl:agent", "obl:patient"].includes(deprel.split(":")[0]);
  if (semantic) return "Interpretation";
  if (hasChildren) return "Structure";
  return "Existence";
};
const STANCE = (deprel) => {
  const d = deprel.split(":")[0];
  if (["amod", "det", "nummod", "appos", "acl", "acl:relcl"].includes(d)) return "Differentiate";
  if (["nsubj", "obj", "iobj", "obl", "nmod", "case", "cc", "conj", "parataxis"].includes(d)) return "Relate";
  if (["root", "compound", "flat", "fixed", "goeswith"].includes(d)) return "Generate";
  return "Relate";
};

const cells = {};
let total = 0;
for (const s of sents) {
  const children = new Map();
  for (let i = 0; i < s.length; i++) children.set(i, []);
  s.forEach((t, i) => { const h = parseInt(t.head); if (!isNaN(h) && h > 0 && h <= s.length) children.get(h - 1)?.push(i); });
  for (let i = 0; i < s.length; i++) {
    const t = s[i];
    if (t.upos === "PUNCT") continue;
    const grain = GRAIN(t.upos);
    const terrain = TERRAIN(t.upos, t.deprel, (children.get(i)?.length ?? 0) > 0);
    const stance = STANCE(t.deprel);
    const cell = grain + "/" + terrain + "/" + stance;
    const v = sm(t.form);
    const nameable = v !== null;
    const hit = nameable && v.cls === t.upos;
    if (!cells[cell]) cells[cell] = { n: 0, hits: 0, noVoice: 0 };
    cells[cell].n++;
    if (hit) cells[cell].hits++;
    if (!nameable) cells[cell].noVoice++;
    total++;
  }
}

console.log("Total tokens:", total);
console.log("\n=== 27-cell cube: smell accuracy by (grain/terrain/stance) ===");
console.log("cell".padEnd(35) + "n".padStart(6) + " acc".padStart(7) + " noVoice".padStart(9));
for (const [cell, d] of Object.entries(cells).sort((a, b) => b[1].n - a[1].n)) {
  const acc = d.n ? (d.hits / d.n).toFixed(3) : "n/a";
  const nv = d.n ? (d.noVoice / d.n).toFixed(3) : "n/a";
  console.log(cell.padEnd(35) + String(d.n).padStart(6) + (" " + acc).padStart(7) + (" " + nv).padStart(9));
}

const grainCells = {};
for (const [cell, d] of Object.entries(cells)) {
  const g = cell.split("/")[0];
  if (!grainCells[g]) grainCells[g] = { n: 0, hits: 0, noVoice: 0 };
  grainCells[g].n += d.n; grainCells[g].hits += d.hits; grainCells[g].noVoice += d.noVoice;
}
console.log("\n=== Grain-level (3 cells) ===");
for (const [g, d] of Object.entries(grainCells)) console.log("  " + g + ": n=" + d.n + ", acc=" + (d.hits/d.n).toFixed(3) + ", noVoice=" + (d.noVoice/d.n).toFixed(3));

const terrainCells = {};
for (const [cell, d] of Object.entries(cells)) {
  const parts = cell.split("/");
  const key = parts[0] + "/" + parts[1];
  if (!terrainCells[key]) terrainCells[key] = { n: 0, hits: 0, noVoice: 0 };
  terrainCells[key].n += d.n; terrainCells[key].hits += d.hits; terrainCells[key].noVoice += d.noVoice;
}
console.log("\n=== Terrain-level (within each grain) ===");
for (const [k, d] of Object.entries(terrainCells).sort()) console.log("  " + k + ": n=" + d.n + ", acc=" + (d.hits/d.n).toFixed(3) + ", noVoice=" + (d.noVoice/d.n).toFixed(3));

const allHits = Object.values(cells).reduce((a, d) => a + d.hits, 0);
const allN = Object.values(cells).reduce((a, d) => a + d.n, 0);
const allNV = Object.values(cells).reduce((a, d) => a + d.noVoice, 0);
console.log("\n=== Overall ===");
console.log("  total: " + allN + ", acc=" + (allHits/allN).toFixed(3) + ", noVoice=" + (allNV/allN).toFixed(3));

const out = { prereg: "5dcd757aa2f75563", stamp: "EXPLORATORY", total, cells, grainCells, terrainCells, summary: { acc: +(allHits/allN).toFixed(4), noVoice: +(allNV/allN).toFixed(4) } };
fs.writeFileSync(new URL("result.json", import.meta.url), JSON.stringify(out, null, 1));
