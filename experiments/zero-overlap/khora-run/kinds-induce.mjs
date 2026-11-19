import fs from "node:fs";
const K = "/Users/mlacy/Documents/khora-cast/khora/native";
const { terrainEvidence, createTerrainInductionIndex, indexTerrainInductionEntries } = await import(K + "/kernel/terrain-induction.js");
const { induceEntityKindCandidates } = await import(K + "/kernel/entity-kind-induction.js");
const { makePhasepost, COPULA_FORMS, LOCATIVE_PREPOSITIONS } = await import(K + "/adapters/text/phasepost.js");
const { cellOf } = await import(K + "/kernel/cube.js");
const pri = await import(K + "/adapters/text/priors.js");
const actPrior = JSON.parse(fs.readFileSync("/Users/mlacy/Documents/khora-cast/Zenodotus/derived-priors/act-priors/act-prior-en.json", "utf8"));
const { classify } = makePhasepost({ actPrior, cellOf, definiteDeterminers: pri.DEFINITE_DETERMINERS, indefiniteDeterminers: pri.INDEFINITE_DETERMINERS });
const triples = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const limit = Number(process.argv[3] ?? triples.length), VARIANT = process.argv[5] ?? "A";
let seedv = 20261118; const rnd = () => ((seedv = (seedv * 1664525 + 1013904223) % 4294967296) / 4294967296);
const idx = triples.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
const T = idx.slice(0, limit).map((i) => triples[i]);
const PREPS = new Set(["of", "for", "with", "by", "to", "as", "about", "between", "after", "before", "against", "among", "around", "per", "than", "like", "via"]);
const DET = new Set(["a", "an", "the", "this", "that", "these", "those", "its", "his", "her", "their", "some", "many", "most", "several", "one"]);
const tok = (s) => String(s ?? "").trim().split(/\s+/).filter(Boolean);
const lenBucket = (n) => (n <= 1 ? "1" : n === 2 ? "2" : n <= 4 ? "3-4" : "5+");
const subjClass = (s) => { const t = tok(s); if (!t.length) return "none"; if (/^(he|she|it|they|there|this|that|which|who)$/i.test(t[0])) return "pronoun"; if (/^\d/.test(t[0])) return "numeral"; return /^[A-ZÀ-Þ]/.test(t[0]) ? "name" : "common"; };
const objLead = (o) => { const t = tok(o); if (!t.length) return "none"; const w = t[0].toLowerCase(); if (LOCATIVE_PREPOSITIONS.has(w)) return "loc-prep"; if (PREPS.has(w)) return "prep"; if (DET.has(w)) return "det"; if (/^\d/.test(w)) return "numeral"; return /^[A-ZÀ-Þ]/.test(t[0]) ? "name" : "lower"; };
const predClass = (v) => { const w = String(v ?? "").toLowerCase(); return COPULA_FORMS.has(w) ? "copula" : LOCATIVE_PREPOSITIONS.has(w) ? "loc-prep" : PREPS.has(w) ? "prep" : "verb"; };
const entries = []; let seq = 0;
T.forEach((t, i) => {
  const ref = `rel:${i}`, anchor = { start: t.subjectOffset ?? t.offset ?? i, end: (t.objectOffset ?? t.offset ?? i) + String(t.object ?? "").length };
  const ev = (k, v) => entries.push(terrainEvidence({ id: `ke-${++seq}`, entityRef: ref, featureKey: k, featureValue: v, sequencePosition: i, witness: ref, anchor }));
  ev("predicate", String(t.verb ?? "").toLowerCase()); ev("predClass", predClass(t.verb)); ev("objLead", objLead(t.object));
  ev("objDigit", /\d/.test(t.object ?? "") ? "yes" : "no"); ev("objLen", lenBucket(tok(t.object).length)); ev("subjClass", subjClass(t.subject)); if (VARIANT === "A") ev("polarity", t.polarity ?? "+");
  if (VARIANT === "B") { const head = (x) => { const w = tok(x).filter((z) => !DET.has(z.toLowerCase()) && !PREPS.has(z.toLowerCase())); return (w[w.length - 1] ?? "").toLowerCase().replace(/[^\p{L}\p{N}-]/gu, ""); }; const sh = head(t.subject), oh = head(t.object); if (sh) ev("subjHead", sh); if (oh) ev("objHead", oh); }
});
const index = createTerrainInductionIndex(); indexTerrainInductionEntries(index, entries);
const t0 = Date.now();
const induced = induceEntityKindCandidates(index.entityFeatures, { population: "relations:wiki-div" });
const kinds = induced.candidates.map((c) => ({ key: c.kindKey, n: c.memberRefs.size ?? c.memberRefs.length, members: [...c.memberRefs], params: (c.distinguishingParameters ?? c.parameters ?? []).slice(0, 8).map((p) => `${p.featureKey ?? p.key}=${p.featureValue ?? p.value}`), p: c.cohesionNull?.pValue ?? null, passed: c.cohesionNull?.passed ?? null }));
console.log(JSON.stringify({ relations: T.length, evidence: entries.length, seconds: (Date.now() - t0) / 1000, kinds: kinds.length, passed: kinds.filter((k) => k.passed).length, diagnostics: induced.diagnostics }, null, 1).slice(0, 1500));
// classify every member into a phasepost cell
const cellOfRel = (i) => { const t = T[i]; const v = classify({ end1: t.subject, label: t.verb, end2: t.object }); return v.cell && !v.cell.gap ? `${v.op}·${v.grain}` : v.standing === "contested" ? "contested" : "gap"; };
const out = kinds.sort((a, b) => b.n - a.n).map((k) => { const cells = {}; for (const m of k.members) { const c = cellOfRel(Number(m.split(":")[1])); cells[c] = (cells[c] ?? 0) + 1; } const ex = k.members.slice(0, 5).map((m) => { const t = T[Number(m.split(":")[1])]; return `${t.subject} | ${t.verb} | ${t.object}`; }); return { key: k.key, n: k.n, p: k.p, passed: k.passed, params: k.params, cells, examples: ex }; });
fs.writeFileSync(process.argv[4] ?? "kinds-out.json", JSON.stringify(out, null, 1));
for (const k of out.slice(0, 25)) console.log(`\n[${k.passed ? "PASS" : "fail"}] n=${k.n} p=${k.p} ${k.key}\n   params: ${k.params.join(", ")}\n   cells: ${JSON.stringify(k.cells)}\n   e.g. ${k.examples.slice(0, 3).join("  ||  ")}`);
