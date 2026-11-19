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
const headW = (x) => { const w = tok(x).filter((z) => !DET.has(z.toLowerCase()) && !PREPS.has(z.toLowerCase())); return (w[w.length - 1] ?? "").toLowerCase().replace(/[^\p{L}\p{N}-]/gu, ""); };
const occ = new Map(); // entity key -> [triple indices]
const keyOf = (t) => (VARIANT === "C" ? String(t.verb ?? "").toLowerCase() : headW(t.subject));
T.forEach((t, i) => { const k = keyOf(t); if (!k) return; if (!occ.has(k)) occ.set(k, []); occ.get(k).push(i); });
for (const [k, list] of [...occ]) if (list.length < 8) occ.delete(k);
for (const [k, list] of occ) for (const i of list) { const t = T[i], ref = `ent:${k}`, anchor = { start: t.subjectOffset ?? i, end: (t.objectOffset ?? i) + String(t.object ?? "").length };
  const ev = (f, v) => v && entries.push(terrainEvidence({ id: `ke-${++seq}`, entityRef: ref, featureKey: f, featureValue: v, sequencePosition: i, witness: `rel:${i}`, anchor }));
  if (VARIANT === "C") { ev("subjClass", subjClass(t.subject)); ev("objLead", objLead(t.object)); ev("objDigit", /\d/.test(t.object ?? "") ? "yes" : "no"); ev("objLen", lenBucket(tok(t.object).length)); ev("subjHead", headW(t.subject)); ev("objHead", headW(t.object)); }
  else { ev("predicate", String(t.verb ?? "").toLowerCase()); ev("objLead", objLead(t.object)); } }
const index = createTerrainInductionIndex(); indexTerrainInductionEntries(index, entries);
const t0 = Date.now();
const induced = induceEntityKindCandidates(index.entityFeatures, { population: "relations:wiki-div" });
const kinds = induced.candidates.map((c) => ({ key: c.kindKey, members: [...c.memberRefs].map((m) => m.replace(/^ent:/, "")), params: (c.distinguishingParameters ?? c.parameters ?? []).slice(0, 8).map((p) => `${p.featureKey ?? p.key}=${p.featureValue ?? p.value}`), p: c.cohesionNull?.pValue ?? null, passed: c.cohesionNull?.passed ?? null }));
console.log(JSON.stringify({ entities: occ.size, evidence: entries.length, seconds: (Date.now() - t0) / 1000, kinds: kinds.length, passed: kinds.filter((k) => k.passed).length, diagnostics: induced.diagnostics }, null, 1).slice(0, 1200));
const cellOfRel = (i) => { const t = T[i]; const v = classify({ end1: t.subject, label: t.verb, end2: t.object }); return v.cell && !v.cell.gap ? `${v.op}·${v.grain}` : v.standing === "contested" ? "contested" : "gap"; };
const out = kinds.sort((a, b) => b.members.length - a.members.length).map((k) => { const cells = {}; let occN = 0; for (const m of k.members) for (const i of occ.get(m) ?? []) { occN++; const c = cellOfRel(i); cells[c] = (cells[c] ?? 0) + 1; } return { key: k.key, n: k.members.length, occurrences: occN, p: k.p, passed: k.passed, params: k.params, cells, members: k.members.slice(0, 25) }; });
fs.writeFileSync(process.argv[4] ?? "kinds-out.json", JSON.stringify(out, null, 1));
for (const k of out.slice(0, 20)) console.log(`\n[${k.passed ? "PASS" : "fail"}] ${k.n} entities, ${k.occurrences} occurrences, p=${k.p}\n   params: ${k.params.join(", ")}\n   cells: ${JSON.stringify(k.cells)}\n   members: ${k.members.slice(0, 14).join(", ")}`);
