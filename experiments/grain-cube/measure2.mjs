// Experiment 2+3: terrain/stance for kāraka disambiguation + DMD gate grain-dependence
// REUSED: en_ewt-ud-test.conllu (21,998 in-scope tokens)
import fs from "node:fs";
import { karakaOf } from "/Users/mlacy/Downloads/workspace/khora-clone/native/adapters/text/karaka-map.mjs";

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

// Experiment 2: kāraka disambiguation
// For "obl" tokens (which map to adhikaraṇa by default), check if terrain/stance
// correlate with a different kāraka
console.log("=== Experiment 2: kāraka disambiguation by terrain/stance ===");
const oblCells = {};
for (const s of sents) {
  const children = new Map();
  for (let i = 0; i < s.length; i++) children.set(i, []);
  s.forEach((t, i) => { const h = parseInt(t.head); if (!isNaN(h) && h > 0 && h <= s.length) children.get(h - 1)?.push(i); });
  for (let i = 0; i < s.length; i++) {
    const t = s[i];
    if (t.upos === "PUNCT" || t.deprel.split(":")[0] !== "obl") continue;
    const terrain = TERRAIN(t.upos, t.deprel, (children.get(i)?.length ?? 0) > 0);
    const stance = STANCE(t.deprel);
    const grain = GRAIN(t.upos);
    const k = karakaOf(t);
    const key = grain + "/" + terrain + "/" + stance;
    if (!oblCells[key]) oblCells[key] = {};
    oblCells[key][k ?? "null"] = (oblCells[key][k ?? "null"] ?? 0) + 1;
  }
}
for (const [cell, counts] of Object.entries(oblCells).sort()) {
  const total = Object.values(counts).reduce((a,b) => a+b, 0);
  const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  const purity = (top[1] / total).toFixed(2);
  console.log(`  ${cell}: n=${total}, top=${top[0]} (${purity}), ${JSON.stringify(counts)}`);
}

// Experiment 3: DMD gate grain-dependence
// For each grain, compute the distribution of kāraka-carrying vs non-kāraka tokens
console.log("\n=== Experiment 3: DMD gate grain-dependence ===");
const grainStats = {};
for (const s of sents) {
  const children = new Map();
  for (let i = 0; i < s.length; i++) children.set(i, []);
  s.forEach((t, i) => { const h = parseInt(t.head); if (!isNaN(h) && h > 0 && h <= s.length) children.get(h - 1)?.push(i); });
  for (let i = 0; i < s.length; i++) {
    const t = s[i];
    if (t.upos === "PUNCT") continue;
    const grain = GRAIN(t.upos);
    const k = karakaOf(t);
    if (!grainStats[grain]) grainStats[grain] = { n: 0, karaka: 0, noKaraka: 0 };
    grainStats[grain].n++;
    if (k) grainStats[grain].karaka++; else grainStats[grain].noKaraka++;
  }
}
for (const [g, d] of Object.entries(grainStats)) {
  console.log(`  ${g}: n=${d.n}, karaka=${d.karaka} (${(100*d.karaka/d.n).toFixed(1)}%), noKaraka=${d.noKaraka} (${(100*d.noKaraka/d.n).toFixed(1)}%)`);
}

// Also: kāraka consistency within cells
console.log("\n=== kāraka consistency: does the same cell always produce the same kāraka? ===");
const cellKaraka = {};
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
    const k = karakaOf(t);
    if (!cellKaraka[cell]) cellKaraka[cell] = {};
    cellKaraka[cell][k ?? "null"] = (cellKaraka[cell][k ?? "null"] ?? 0) + 1;
  }
}
// Report cells where a single kāraka dominates (>80%)
let pure = 0, mixed = 0;
for (const [cell, counts] of Object.entries(cellKaraka)) {
  const total = Object.values(counts).reduce((a,b) => a+b, 0);
  if (total < 5) continue;
  const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  const purity = top[1] / total;
  if (purity > 0.8) pure++; else mixed++;
}
console.log(`  Cells with a dominant kāraka (>80%): ${pure}`);
console.log(`  Cells with mixed kārakas: ${mixed}`);
