import fs from "node:fs";
const K = "/Users/mlacy/Documents/khora-cast/khora/native";
const { createSession, admitChunked, sessionReferents } = await import(K + "/legacy-ported/packages/host/corpus.js");
const { detectCoArrivals, buildLink } = await import(K + "/legacy-ported/packages/engine/emergence/binding.js");
const { terrainEvidence, createTerrainInductionIndex, indexTerrainInductionEntries } = await import(K + "/kernel/terrain-induction.js");
const { induceEntityKindCandidates } = await import(K + "/kernel/entity-kind-induction.js");
const MODE = process.argv[3] ?? "real"; // real | cols | nbrs
const text = fs.readFileSync(process.argv[2], "utf8"), sourceId = "file:x";
const t0 = Date.now(), lap = (m) => console.error(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${m}`);
const session = createSession(); admitChunked(session, { text, sourceId, language: "en" });
const cast = sessionReferents(session, { sourceId, priors: [], limit: 3000 });
const sents = text.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÞÄÖÜ])|\n+/).filter((s) => s.trim()), art = []; { let a = 0; for (const blk of text.split("\n\n")) { const n = blk.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÞÄÖÜ])|\n+/).filter((s) => s.trim()).length; for (let i = 0; i < n; i++) art.push(a); a++; } }
const cache = "/Users/mlacy/Library/Application Support/Claude/scratch-workspaces/4bf59fed-b26b-4f7d-a90f-11d28a16ba25/1a7b49f0-7962-48a4-8bfc-8a3bc2e27d2d/scratch-2026-11-18-297985/khora-run/bind-links.json";
const ents = []; for (const r of cast.referents ?? []) { const arr = []; sents.forEach((s, i) => { if ([...new Set([...(r.surfaces ?? []), r.display])].some((x) => x && x.length > 2 && s.includes(x))) arr.push(i); }); if (arr.length >= 2) ents.push({ id: r.display, rid: r.id, arrivals: arr, ref: r }); }
lap(`${ents.length} referents, ${sents.length} sentences`);
let links;
if (fs.existsSync(cache)) links = JSON.parse(fs.readFileSync(cache, "utf8"));
else {
  const pairs = detectCoArrivals(ents, { window: 1 }).filter((p) => p.overlap >= 3); lap(`${pairs.length} candidate pairs with overlap >= 2`);
  links = pairs.map((p, i) => { const l = buildLink(p, { totalUnits: sents.length, draws: 100, seed: 20261118 + i * 13 }); return { a: p.a.id, b: p.b.id, overlap: l.overlap, direction: l.direction, strength: l.strength, pd: l.nulls.displacement.pValue, pr: l.nulls.reversal.pValue, ps: l.nulls.reseed.pValue }; });
  fs.writeFileSync(cache, JSON.stringify(links));
}
lap(`${links.length} links built`);
const sig = links.filter((l) => l.direction && l.pd < 0.05 && l.pr < 0.05 && l.ps < 0.05);
const edges = sig.map((l) => (l.direction === "a→b" ? { a: l.a, b: l.b, s: l.strength } : { a: l.b, b: l.a, s: l.strength }));
console.log(JSON.stringify({ referents: ents.length, candidatePairs: links.length, significantDirected: edges.length }));
const byId = new Map(ents.map((e) => [e.id, e])); const terc = (vals) => { const s = [...vals].sort((a, b) => a - b); const lo = s[Math.floor(s.length / 3)], hi = s[Math.floor((2 * s.length) / 3)]; return (v) => (v <= lo ? "low" : v <= hi ? "mid" : "high"); };
let nb = new Map(ents.map((e) => [e.id, { out: [], inn: [] }])); for (const e of edges) { nb.get(e.a)?.out.push(e.b); nb.get(e.b)?.inn.push(e.a); }
if (MODE === "nbrs") { const ids = ents.map((e) => e.id); let seed = 20261118; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296); const perm = [...ids]; for (let i = perm.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; } const m = new Map(ids.map((id, i) => [id, perm[i]])); nb = new Map(ids.map((id) => [id, { out: nb.get(m.get(id)).out, inn: nb.get(m.get(id)).inn }])); }
const deg = (id) => nb.get(id).out.length + nb.get(id).inn.length;
const strengthOf = new Map(); for (const e of edges) for (const id of [e.a, e.b]) { (strengthOf.get(id) ?? strengthOf.set(id, []).get(id)).push(e.s); }
const spread = (id) => new Set([...nb.get(id).out, ...nb.get(id).inn].flatMap((x) => byId.get(x)?.arrivals.map((i) => art[i]) ?? [])).size;
const Td = terc(ents.map((e) => deg(e.id))), To = terc(ents.map((e) => { const n = deg(e.id); return n ? nb.get(e.id).out.length / n : 0.5; })), Ts = terc(ents.map((e) => { const s = strengthOf.get(e.id) ?? []; return s.length ? s.reduce((a, b) => a + b, 0) / s.length : 0; })), Tp = terc(ents.map((e) => spread(e.id)));
const base = (e) => { const n = deg(e.id), s = strengthOf.get(e.id) ?? []; return { individuation: e.ref.individuation ?? "none", agency: terc(ents.map((x) => x.ref.agency ?? 0))(e.ref.agency ?? 0), coupling: terc(ents.map((x) => x.ref.coupling ?? 0))(e.ref.coupling ?? 0), degree: Td(n), outShare: To(n ? nb.get(e.id).out.length / n : 0.5), strength: Ts(s.length ? s.reduce((a, b) => a + b, 0) / s.length : 0), nbrSpread: Tp(spread(e.id)) }; };
let F1 = ents.map(base);
const shuffleCols = (F) => { let seed = 20261118; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296); for (const k of Object.keys(F[0])) { const col = F.map((f) => f[k]); for (let i = col.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [col[i], col[j]] = [col[j], col[i]]; } F = F.map((f, i) => ({ ...f, [k]: col[i] })); } return F; };
if (MODE === "cols") F1 = shuffleCols(F1);
const induce = (rows, extra) => { const entries = []; let seq = 0; rows.forEach((f, i) => { for (const [k, v] of Object.entries(f)) entries.push(terrainEvidence({ id: `ke-${++seq}`, entityRef: `rf:${i}`, featureKey: k, featureValue: v, sequencePosition: i, witness: `rf:${i}`, anchor: { start: i, end: i + 1 } })); (extra?.[i] ?? []).forEach((v) => entries.push(terrainEvidence({ id: `ke-${++seq}`, entityRef: `rf:${i}`, featureKey: "bindsTo", featureValue: v, sequencePosition: i, witness: `rf:${i}`, anchor: { start: i, end: i + 1 } }))); }); const idx = createTerrainInductionIndex(); indexTerrainInductionEntries(idx, entries); const out = induceEntityKindCandidates(idx.entityFeatures, { population: "referents:wiki-div:bind" }); return { kinds: out.candidates.map((c) => ({ members: [...c.memberRefs].map((m) => Number(m.slice(3))), params: (c.distinguishingParameters ?? c.parameters ?? []).slice(0, 8).map((p) => `${p.featureKey ?? p.key}=${p.featureValue ?? p.value}`), p: c.cohesionNull?.pValue ?? null, passed: c.cohesionNull?.passed ?? null })), diag: out.diagnostics }; };
const p1 = induce(F1); const kind1 = new Map(); p1.kinds.forEach((k, ki) => k.members.forEach((m) => kind1.set(ents[m].id, `k${ki}`)));
const extra = ents.map((e) => [...nb.get(e.id).out, ...nb.get(e.id).inn].map((x) => kind1.get(x) ?? "none"));
const p2 = induce(F1, extra); lap("pass 2 done");
const kindOf = new Map(); p2.kinds.forEach((k, ki) => k.members.forEach((m) => kindOf.set(ents[m].id, `k${ki}`)));
console.log(JSON.stringify({ mode: MODE, pass1Kinds: p1.kinds.length, pass2Kinds: p2.kinds.length, pass2Passed: p2.kinds.filter((k) => k.passed).length, diag: p2.diag }, null, 1).slice(0, 700));
if (MODE !== "real") process.exit(0);
const prom = (k) => { const m = k.members.map((i) => ents[i].ref); const avg = (f) => (m.reduce((a, r) => a + (r[f] ?? 0), 0) / m.length).toFixed(1); return `mentions ${avg("mentions")}, frames ${avg("frames")}`; };
for (const [ki, k] of p2.kinds.entries()) console.log(`\nkind k${ki} [${k.passed ? "PASS" : "fail"}] n=${k.members.length} p=${k.p}\n   params: ${k.params.join(", ")}\n   prominence (held out): ${prom(k)}\n   members: ${k.members.slice(0, 14).map((i) => ents[i].id).join(", ")}`);
const types = new Map(), ex = new Map(); for (const e of edges) { const ka = kindOf.get(e.a), kb = kindOf.get(e.b); if (!ka || !kb) continue; const key = `${ka} -> ${kb}`; types.set(key, (types.get(key) ?? 0) + 1); (ex.get(key) ?? ex.set(key, []).get(key)).length < 3 && ex.get(key).push(`${e.a} -> ${e.b}`); }
console.log(`\nrelationship types (${[...types.values()].reduce((a, b) => a + b, 0)} of ${edges.length} directed links have kinded ends):`);
for (const [k, n] of [...types].sort((a, b) => b[1] - a[1]).slice(0, 16)) { const [x, , y] = k.split(" "); console.log(`  ${String(n).padStart(4)}  ${k}   reverse ${types.get(`${y} -> ${x}`) ?? 0}   e.g. ${ex.get(k).join("; ")}`); }
fs.writeFileSync(process.argv[2].replace(/\.txt$/, ".bindkinds.json"), JSON.stringify({ kinds: p2.kinds.map((k) => ({ params: k.params, p: k.p, members: k.members.map((i) => ents[i].id) })), types: [...types], edges: edges.length }));
