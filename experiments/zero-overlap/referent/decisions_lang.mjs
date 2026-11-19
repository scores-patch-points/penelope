// node decisions_lang.mjs -- E3 for ledger row 35: is the language the material DECLARES the language khora HEARS? Local only. DEV, exploratory.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)); const KH = "/Users/mlacy/Documents/khora-cast/khora";
process.env.KHORA_PRIORS_DIR ||= `${process.env.HOME}/Documents/janus/priors`;
const { languageContextFor } = await import(`${KH}/native/the-fold/language-context.js`);
const { readDocument } = await import(`${KH}/native/reading.js`);
const docs = fs.readdirSync(path.join(HERE, "data", "dev")).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(fs.readFileSync(path.join(HERE, "data", "dev", f), "utf8")));
const tally = {}, ptally = {}; let paras = 0; const foreign = [];
for (const d of docs) {
  const h = languageContextFor(d.text, {}).language ?? "none"; tally[h] = (tally[h] ?? 0) + 1;
  for (const p of d.text.split("\n").filter((x) => x.length >= 150)) { paras++; const l = languageContextFor(p, {}).language ?? "none"; ptally[l] = (ptally[l] ?? 0) + 1; if (l !== "eng" && foreign.length < 4) foreign.push({ title: d.title, heard: l, text: p.slice(0, 110) }); }
}
console.log("E3 language: whole articles heard as", JSON.stringify(tally), "of", docs.length, "| paragraphs (>=150 chars) heard as", JSON.stringify(ptally), "of", paras);
console.log("examples heard as non-English:", JSON.stringify(foreign, null, 1).slice(0, 700));
const fr = "Le Premier Brigade provisoire des Marines a été formé en 1912 pour une mission à Cuba, et elle a été dissoute en 1950 après cinq brèves activations.";
for (const lang of ["eng", "fra"]) { try { const e = await readDocument(fr, { language: lang, lexicon: false, referents: true, castIdentity: true, minCharacters: 0 }); console.log(`French sentence read with language=${lang}: gaps =`, (e.gaps ?? []).map((g) => g.gap).join(", ") || "none", "| referents", (e.referents?.referents ?? []).map((r) => r.face).join("; ") || "none"); } catch (err) { console.log(`language=${lang}:`, String(err.message).slice(0, 160)); } }
