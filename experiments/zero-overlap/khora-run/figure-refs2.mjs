import fs from "node:fs";
const K = "/Users/mlacy/Documents/khora-cast/khora/native";
const { createSession, admitChunked, sessionRelations } = await import(K + "/legacy-ported/packages/host/corpus.js");
const { terrainEvidence, createTerrainInductionIndex, indexTerrainInductionEntries } = await import(K + "/kernel/terrain-induction.js");
const { induceEntityKindCandidates } = await import(K + "/kernel/entity-kind-induction.js");
const { makePhasepost, COPULA_FORMS, LOCATIVE_PREPOSITIONS } = await import(K + "/adapters/text/phasepost.js");
const { cellOf } = await import(K + "/kernel/cube.js");
const pri = await import(K + "/adapters/text/priors.js");
const actPrior = JSON.parse(fs.readFileSync("/Users/mlacy/Documents/khora-cast/Zenodotus/derived-priors/act-priors/act-prior-en.json", "utf8"));
const { grainOf } = makePhasepost({ actPrior, cellOf, definiteDeterminers: pri.DEFINITE_DETERMINERS, indefiniteDeterminers: pri.INDEFINITE_DETERMINERS });
const SHUF = process.argv[3] === "shuffle";
const LEX = JSON.parse(fs.readFileSync("/private/tmp/claude-501/-Users-mlacy-Library-Application-Support-Claude-scratch-workspaces-4bf59fed-b26b-4f7d-a90f-11d28a16ba25-1a7b49f0-7962-48a4-8bfc-8a3bc2e27d2d-scratch-2026-11-18-297985/42c7580b-6f78-4d1c-a782-63163c05398a/scratchpad/priors-en/pos-eng-lexicon.json", "utf8")).classes; const NOUNISH = new Set([...LEX["NOUN"], ...LEX["NOUN|VERB"]]);
const lemma = (h) => { if (h.endsWith("ies") && NOUNISH.has(h.slice(0, -3) + "y")) return h.slice(0, -3) + "y"; if (h.endsWith("es") && NOUNISH.has(h.slice(0, -2))) return h.slice(0, -2); if (h.endsWith("s") && NOUNISH.has(h.slice(0, -1))) return h.slice(0, -1); return h; };
const rows = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const regs = [...new Set(rows.map((r) => r.register))];
const STOP = new Set("a an the this that these those its his her their our your my some any each every all no of in on at by for with from to into onto over under about between among through during before after against within without upon toward towards and or but not is are was were be been being it he she they we you i who which what there here".split(" "));
const tok = (s) => String(s ?? "").trim().split(/\s+/).filter(Boolean);
const headOf = (s) => { const w = tok(s).map((x) => x.toLowerCase().replace(/[^\p{L}\p{N}'-]/gu, "")).filter((x) => x && !STOP.has(x)); return w.length ? w[w.length - 1] : null; };
const refs = new Map(); const dropped = { pronounOrEmpty: 0, noRelation: 0 }; const perClause = new Map(); let nRel = 0;
for (const reg of regs) {
  const cl = rows.map((r, i) => ({ r, i })).filter((x) => x.r.register === reg);
  let text = "", starts = []; for (const x of cl) { starts.push(text.length); text += x.r.clause + "\n\n"; }
  const session = createSession(); admitChunked(session, { text, sourceId: "file:" + reg, language: "en" });
  const rel = sessionRelations(session, { sourceId: "file:" + reg }); const trip = rel?.relations ?? rel ?? [];
  const clauseOf = (off) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= off) lo = mid; else hi = mid - 1; } return cl[lo].i; };
  for (const t of trip) {
    nRel++; const copula = COPULA_FORMS.has(String(t.verb ?? "").toLowerCase()); const o = tok(t.object);
    const locObj = o.length && LOCATIVE_PREPOSITIONS.has(o[0].toLowerCase());
    const useEnd1 = copula || !o.length || locObj; const figure = useEnd1 ? t.subject : t.object; let head = headOf(figure); if (head && !NOUNISH.has(head) && !NOUNISH.has(lemma(head))) { dropped.notNoun = (dropped.notNoun ?? 0) + 1; head = null; } else if (head) head = lemma(head);
    if (!head || head.length < 2) { if (!dropped.notNoun || true) dropped.pronounOrEmpty++; continue; }
    const ci = clauseOf(t.offset ?? t.subjectOffset ?? 0); const key = reg + "|" + head;
    if (!refs.has(key)) refs.set(key, { reg, head, n: 0, clauses: new Set(), cop: 0, end1: 0, pc: {}, grain: {}, q2: [], q3: [] });
    const R = refs.get(key); R.n++; R.clauses.add(ci); if (copula) R.cop++; if (useEnd1) R.end1++;
    const pc = copula ? "copula" : LOCATIVE_PREPOSITIONS.has(String(t.verb).toLowerCase()) ? "loc-prep" : /^(of|for|with|by|to|as|about|between|after|before|against|among|around|per|than|like|via)$/i.test(t.verb) ? "prep" : "verb"; R.pc[pc] = (R.pc[pc] ?? 0) + 1;
    const g = grainOf({ end1: t.subject, end2: t.object }).grain; R.grain[g] = (R.grain[g] ?? 0) + 1;
    R.q2.push(rows[ci].claude[1]); R.q3.push(rows[ci].claude[2]); perClause.set(ci, key);
  }
}
const cover = perClause.size / rows.length;
const ents = [...refs.values()].filter((r) => r.n >= 2);
console.log(JSON.stringify({ relations: nRel, dropped, clausesWithFigureReferent: +cover.toFixed(3), referents: refs.size, entitiesGE2: ents.length, byRegister: Object.fromEntries(regs.map((g) => [g, ents.filter((e) => e.reg === g).length])) }));
const terc = (vals) => { const s = [...vals].sort((a, b) => a - b); const lo = s[Math.floor(s.length / 3)], hi = s[Math.floor((2 * s.length) / 3)]; return (v) => (v <= lo ? "low" : v <= hi ? "mid" : "high"); };
const dom = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none"; const Tc = terc(ents.map((e) => e.clauses.size)); const share = (x, n) => (x / n < 1 / 3 ? "low" : x / n < 2 / 3 ? "mid" : "high");
let F = ents.map((e) => ({ copula: share(e.cop, e.n), pos1: share(e.end1, e.n), domPred: dom(e.pc), domGrain: dom(e.grain), clausesN: Tc(e.clauses.size) }));
if (SHUF) { let seed = 20261118; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296); for (const k of Object.keys(F[0])) { const col = F.map((f) => f[k]); for (let i = col.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [col[i], col[j]] = [col[j], col[i]]; } F = F.map((f, i) => ({ ...f, [k]: col[i] })); } }
const entries = []; let seq = 0; F.forEach((f, i) => { for (const [k, v] of Object.entries(f)) entries.push(terrainEvidence({ id: `ke-${++seq}`, entityRef: `fr:${i}`, featureKey: k, featureValue: v, sequencePosition: i, witness: `fr:${i}`, anchor: { start: i, end: i + 1 } })); });
const idx = createTerrainInductionIndex(); indexTerrainInductionEntries(idx, entries); const out = induceEntityKindCandidates(idx.entityFeatures, { population: "figure-referents:lexan" });
const kinds = out.candidates.map((c) => ({ members: [...c.memberRefs].map((m) => Number(m.slice(3))), params: (c.distinguishingParameters ?? c.parameters ?? []).slice(0, 8).map((p) => `${p.featureKey ?? p.key}=${p.featureValue ?? p.value}`), p: c.cohesionNull?.pValue ?? null, passed: c.cohesionNull?.passed ?? null }));
console.log(JSON.stringify({ shuffled: SHUF, kinds: kinds.length, passed: kinds.filter((k) => k.passed).length, diag: out.diagnostics }).slice(0, 500));
if (SHUF) process.exit(0);
const group = new Array(ents.length).fill("none"); kinds.forEach((k, ki) => k.members.forEach((m) => (group[m] = `k${ki}`)));
const maj = (a) => { const c = {}; a.forEach((x) => (c[x] = (c[x] ?? 0) + 1)); return dom(c); };
const nmi = (a, b) => { const n = a.length, ca = new Map(), cb = new Map(), cab = new Map(); for (let i = 0; i < n; i++) { ca.set(a[i], (ca.get(a[i]) ?? 0) + 1); cb.set(b[i], (cb.get(b[i]) ?? 0) + 1); const k = a[i] + "\u0000" + b[i]; cab.set(k, (cab.get(k) ?? 0) + 1); } let mi = 0; for (const [k, v] of cab) { const [x, y] = k.split("\u0000"); mi += (v / n) * Math.log((v * n) / (ca.get(x) * cb.get(y))); } const H = (m) => -[...m.values()].reduce((s, v) => s + (v / n) * Math.log(v / n), 0); const d = Math.sqrt(H(ca) * H(cb)); return d ? mi / d : 0; };
let seed = 20261118; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const thr = (a, b) => { const bb = [...b], v = []; for (let t = 0; t < 1000; t++) { for (let i = bb.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [bb[i], bb[j]] = [bb[j], bb[i]]; } v.push(nmi(a, bb)); } v.sort((x, y) => x - y); return v[Math.floor(0.95 * v.length)]; };
for (const [name, lab] of [["Claude Q3 majority", ents.map((e) => maj(e.q3))], ["Claude Q2 majority", ents.map((e) => maj(e.q2))], ["register (control)", ents.map((e) => e.reg)]]) { const o = nmi(group, lab), t = thr(group, lab); console.log(`   NMI(kinds, ${name.padEnd(20)}) = ${o.toFixed(4)}  null95 ${t.toFixed(4)}  ${o > t ? "ABOVE chance" : "within chance"}`); }
for (const [ki, k] of kinds.entries()) { const q3 = {}; k.members.forEach((m) => { const v = maj(ents[m].q3); q3[v] = (q3[v] ?? 0) + 1; }); console.log(`\nkind k${ki} [${k.passed ? "PASS" : "fail"}] n=${k.members.length} p=${k.p}\n   params: ${k.params.join(", ")}\n   Q3 majority mix: ${JSON.stringify(q3)}\n   heads: ${k.members.slice(0, 16).map((m) => ents[m].head).join(", ")}`); }
