import fs from "node:fs";
const K = "/Users/mlacy/Documents/khora-cast/khora/native";
const { createSession, admitChunked, sessionReferents, sessionRelations } = await import(K + "/legacy-ported/packages/host/corpus.js");
const { terrainEvidence, createTerrainInductionIndex, indexTerrainInductionEntries } = await import(K + "/kernel/terrain-induction.js");
const { induceEntityKindCandidates } = await import(K + "/kernel/entity-kind-induction.js");
const { makePhasepost, COPULA_FORMS, LOCATIVE_PREPOSITIONS } = await import(K + "/adapters/text/phasepost.js");
const { cellOf } = await import(K + "/kernel/cube.js");
const pri = await import(K + "/adapters/text/priors.js");
const actPrior = JSON.parse(fs.readFileSync("/Users/mlacy/Documents/khora-cast/Zenodotus/derived-priors/act-priors/act-prior-en.json", "utf8"));
const { classify } = makePhasepost({ actPrior, cellOf, definiteDeterminers: pri.DEFINITE_DETERMINERS, indefiniteDeterminers: pri.INDEFINITE_DETERMINERS });
const SHUF = process.argv[3] === "shuffle";
const text = fs.readFileSync(process.argv[2], "utf8"), sourceId = "file:x";
const session = createSession(); admitChunked(session, { text, sourceId, language: "en" });
const cast = sessionReferents(session, { sourceId, priors: [], limit: 3000 });
const rel = sessionRelations(session, { sourceId }); const triples = rel?.relations ?? rel ?? [];
const refs = (cast.referents ?? []).filter((r) => (r.mentions ?? 0) >= 2);
// resolve a relation end (a string) to a referent: longest surface contained in it
const surfIdx = []; for (const r of cast.referents ?? []) for (const s of new Set([...(r.surfaces ?? []), r.display])) if (s && s.length > 2) surfIdx.push([s, r.id]);
surfIdx.sort((a, b) => b[0].length - a[0].length);
const resolve = (s) => { const t = String(s ?? ""); for (const [x, id] of surfIdx) if (t.includes(x)) return id; return null; };
const predClass = (v) => { const w = String(v ?? "").toLowerCase(); return COPULA_FORMS.has(w) ? "copula" : LOCATIVE_PREPOSITIONS.has(w) ? "loc-prep" : /^(of|for|with|by|to|as|about|between|after|before|against|among|around|per|than|like|via)$/.test(w) ? "prep" : "verb"; };
const edges = []; triples.forEach((t, i) => { const a = resolve(t.subject), b = resolve(t.object); if (a && b && a !== b) edges.push({ i, a, b, pc: predClass(t.verb) }); });
const prof = new Map(refs.map((r) => [r.id, { out: 0, inn: 0, pc: {} }]));
for (const e of edges) { if (prof.has(e.a)) { prof.get(e.a).out++; prof.get(e.a).pc[e.pc] = (prof.get(e.a).pc[e.pc] ?? 0) + 1; } if (prof.has(e.b)) { prof.get(e.b).inn++; prof.get(e.b).pc[e.pc] = (prof.get(e.b).pc[e.pc] ?? 0) + 1; } }
const terc = (vals) => { const s = [...vals].sort((a, b) => a - b); const lo = s[Math.floor(s.length / 3)], hi = s[Math.floor((2 * s.length) / 3)]; return (v) => (v <= lo ? "low" : v <= hi ? "mid" : "high"); };
const T = { agency: terc(refs.map((r) => r.agency ?? 0)), coupling: terc(refs.map((r) => r.coupling ?? 0)), mentions: terc(refs.map((r) => r.mentions ?? 0)), frames: terc(refs.map((r) => r.frames ?? 0)), share: terc(refs.map((r) => r.namingSentenceShare ?? 0)), span: terc(refs.map((r) => (r.lastFrame ?? 0) - (r.firstFrame ?? 0))), relN: terc(refs.map((r) => (prof.get(r.id).out + prof.get(r.id).inn))), outShare: terc(refs.map((r) => { const p = prof.get(r.id), n = p.out + p.inn; return n ? p.out / n : 0.5; })) };
let F = refs.map((r) => { const p = prof.get(r.id), n = p.out + p.inn; const dom = Object.entries(p.pc).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none"; return { individuation: r.individuation ?? "none", agency: T.agency(r.agency ?? 0), coupling: T.coupling(r.coupling ?? 0), mentions: T.mentions(r.mentions ?? 0), frames: T.frames(r.frames ?? 0), nameShare: T.share(r.namingSentenceShare ?? 0), span: T.span((r.lastFrame ?? 0) - (r.firstFrame ?? 0)), relN: T.relN(n), outShare: T.outShare(n ? p.out / n : 0.5), domPred: dom }; });
if (SHUF) { let seed = 20261118; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296); for (const k of Object.keys(F[0])) { const col = F.map((f) => f[k]); for (let i = col.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [col[i], col[j]] = [col[j], col[i]]; } F = F.map((f, i) => ({ ...f, [k]: col[i] })); } }
const entries = []; let seq = 0;
F.forEach((f, i) => { for (const [k, v] of Object.entries(f)) entries.push(terrainEvidence({ id: `ke-${++seq}`, entityRef: `rf:${i}`, featureKey: k, featureValue: v, sequencePosition: i, witness: `rf:${i}`, anchor: { start: i, end: i + 1 } })); });
const index = createTerrainInductionIndex(); indexTerrainInductionEntries(index, entries);
const induced = induceEntityKindCandidates(index.entityFeatures, { population: "referents:wiki-div" });
const kinds = induced.candidates.map((c) => ({ key: c.kindKey, members: [...c.memberRefs].map((m) => Number(m.slice(3))), params: (c.distinguishingParameters ?? c.parameters ?? []).slice(0, 8).map((p) => `${p.featureKey ?? p.key}=${p.featureValue ?? p.value}`), p: c.cohesionNull?.pValue ?? null, passed: c.cohesionNull?.passed ?? null }));
console.log(JSON.stringify({ shuffled: SHUF, referents: refs.length, allReferents: (cast.referents ?? []).length, relations: triples.length, resolvedEdges: edges.length, evidence: entries.length, kinds: kinds.length, passed: kinds.filter((k) => k.passed).length, diagnostics: induced.diagnostics }, null, 1).slice(0, 1200));
if (SHUF) process.exit(0);
const kindOf = new Map(); kinds.forEach((k, ki) => k.members.forEach((m) => kindOf.set(refs[m].id, ki)));
for (const [ki, k] of kinds.entries()) console.log(`\nkind k${ki} [${k.passed ? "PASS" : "fail"}] n=${k.members.length} p=${k.p}\n   params: ${k.params.join(", ")}\n   members: ${k.members.slice(0, 16).map((m) => refs[m].display).join(", ")}`);
const types = new Map(), ex = new Map();
for (const e of edges) { const ka = kindOf.get(e.a), kb = kindOf.get(e.b); if (ka == null || kb == null) continue; const key = `k${ka} -${e.pc}-> k${kb}`; types.set(key, (types.get(key) ?? 0) + 1); if (!ex.has(key) || ex.get(key).length < 3) { const t = triples[e.i]; (ex.get(key) ?? ex.set(key, []).get(key)).push(`${t.subject} | ${t.verb} | ${t.object}`); } }
console.log(`\nrelationship types between kinded referents (${[...types.values()].reduce((a, b) => a + b, 0)} of ${edges.length} resolved edges):`);
for (const [k, n] of [...types].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`  ${String(n).padStart(4)}  ${k}   e.g. ${ex.get(k).slice(0, 2).join("  ||  ")}`);
fs.writeFileSync(process.argv[2].replace(/\.txt$/, ".refkinds.json"), JSON.stringify({ kinds: kinds.map((k) => ({ params: k.params, p: k.p, passed: k.passed, members: k.members.map((m) => refs[m].display) })), types: [...types] }));
