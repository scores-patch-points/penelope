// EXPLORATORY proof-of-concept (no registration; hypotheses and falsifiers written BEFORE the run):
//   H1 a small model (qwen3:4b, temperature 0) with a FIXED 2048-token context, answering from a SLICE read out of marks in a pharos log (claims folded by operators, EOQL), beats the same model given the same 2048 tokens of the most recent chat (sliding window) on questions whose facts are far back.
//   H2 the marks arm stays near the oracle-slice arm (the model reads a perfect slice) if retrieval is the only loss; the gap between them is retrieval error, not model error.
//   F1 (hit if) marks does not beat sliding by 0.15 absolute on the far questions.  F2 (hit if) marks is below 0.5 of the oracle slice arm.  The full-history arm is a REFERENCE (its context grows), not a competitor.
// The marks are built with NO model: UD rows (khora's parser prior) -> claims (janus claims-from-rows) -> claim-links entries in a pharos log -> EOQL. The model only reads the slice and answers. This harness reaches sibling checkouts by path: verification only.
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
const KW = "/Users/mlacy/Documents/khora-pharos-reading/native", J = "/Users/mlacy/Documents/janus-claim-links/native/organs", PH = "/Users/mlacy/Documents/khora-cast/pharos";
const { grammarFor, readingRows } = await import(`${KW}/the-fold/pharos-reading.mjs`), { claimsFromRows } = await import(`${J}/claims-from-rows.mjs`), { weaveClaims } = await import(`${J}/claim-links.mjs`);
const P = await import(`${PH}/lib/pharos.mjs`), E = await import(`${PH}/eoql/src/index.mjs`);
const MODEL = process.env.MODEL ?? "qwen3:4b", SEED = +(process.env.SEED ?? 20261120), N = +(process.env.TURNS ?? 240);
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rng = mulberry(SEED), pick = (a) => a[Math.floor(rng() * a.length)], shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const PEOPLE = ["Maria", "Tom", "Anna", "Victor", "Lena", "Oscar", "Priya", "Jonas", "Clara", "Felix", "Nadia", "Hugo"], CITIES = ["Leeds", "York", "Bath", "Derby", "Oxford", "Lincoln", "Ely", "Hull"], FIRMS = ["Acme", "Borealis", "Cobalt", "Dynamo", "Ember"];
const FILLER = ["It rained all afternoon.", "Lunch was late today.", "The meeting ran long.", "Traffic was heavy this morning.", "The coffee machine broke again.", "Spring came early this year.", "The report is almost finished.", "Everyone was tired after the trip.", "The garden needs water.", "A package arrived yesterday.", "The train was delayed.", "The room felt cold."];
// ---- the world: facts with the turn they are said at ----
const people = shuffle([...PEOPLE]).slice(0, 10), lives = new Map(), works = new Map(), hired = [], neg = []; const events = [];   // events: {t, text, kind, ...}
for (const p of people) { events.push({ kind: "live", p, c: pick(CITIES) }); events.push({ kind: "work", p, f: pick(FIRMS) }); }
for (let i = 0; i < 5; i++) { const [a, b] = shuffle([...people]).slice(0, 2); if (!hired.some((h) => h.b === b)) { hired.push({ a, b }); events.push({ kind: "hire", a, b }); } }
for (let i = 0; i < 4; i++) { const p = pick(people), f = pick(FIRMS); events.push({ kind: "notwork", p, f }); }
const base = events.slice(); for (let i = 0; i < 5; i++) { const p = pick(people); events.push({ kind: "move", p, c: pick(CITIES), later: true }); }
// place events at increasing random turns (moves after the first statement of that person's residence)
const turns = Array.from({ length: N }, () => null), slots = shuffle(Array.from({ length: N }, (_, i) => i)).slice(0, events.length).sort((a, b) => a - b);
const early = events.filter((e) => !e.later), later = events.filter((e) => e.later); const order = [...shuffle(early), ...later];   // all moves come after every initial fact
order.forEach((e, i) => { e.t = slots[i]; });
for (const e of order) turns[e.t] = e;
const say = (e) => e.kind === "live" ? `${e.p} lives in ${e.c}.` : e.kind === "move" ? `${e.p} now lives in ${e.c}.` : e.kind === "work" ? `${e.p} works at ${e.f}.` : e.kind === "hire" ? `${e.a} hired ${e.b}.` : `${e.p} does not work at ${e.f}.`;
const chat = turns.map((e) => (e ? say(e) : pick(FILLER)));
// ---- ground truth at the end of the chat ----
const city = (p) => { let c = null; for (const e of order) if ((e.kind === "live" || e.kind === "move") && e.p === p) c = e.c; return c; }, firm = (p) => order.find((e) => e.kind === "work" && e.p === p)?.f ?? null;
const notworks = (p, f) => order.some((e) => e.kind === "notwork" && e.p === p && e.f === f);
const Q = [];
for (const p of shuffle([...people]).slice(0, 8)) Q.push({ type: "one-hop", q: `Where does ${p} live now?`, gold: city(p).toLowerCase(), far: true });
for (const p of shuffle([...people]).slice(0, 4)) Q.push({ type: "one-hop", q: `Which company does ${p} work at?`, gold: firm(p).toLowerCase(), far: true });
for (const h of hired.slice(0, 5)) Q.push({ type: "two-hop", q: `Where does the person ${h.a} hired live now?`, gold: city(h.b).toLowerCase(), far: true });
for (const e of order.filter((x) => x.kind === "notwork").slice(0, 3)) Q.push({ type: "negation", q: `Does ${e.p} work at ${e.f}?`, gold: "no", far: true });
for (const p of shuffle([...people]).slice(0, 2)) { const f = firm(p), g = FIRMS.find((x) => x !== f && !notworks(p, x)); Q.push({ type: "negation", q: `Does ${p} work at ${g}?`, gold: "no", far: true }); }
for (const p of shuffle([...people]).slice(0, 2)) Q.push({ type: "unknown", q: `What is ${p}'s favourite food?`, gold: "unknown", far: true });
// ---- marks: no model ----
const g = await grammarFor("eng"), text = chat.join(" "), rows = readingRows(g, text), cl = claimsFromRows(rows, { doc: "chat" });
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "chat-")), h = P.open("t", { dir, writer: "w" }); weaveClaims(P, h, cl.claims, {}, { where: cl.grounds.where }); const hh = E.open(`jsonl:${dir}/w.jsonl`);
const nm = (x) => (String(x).startsWith("being:") ? String(x).slice(6) : String(x));
const sliceFor = (names) => { const rowsOut = [], seen = new Set(); let frontier = names;
  for (let hop = 0; hop < 2; hop++) { const next = [];
    for (const n of frontier) { if (seen.has(n)) continue; seen.add(n);
      const rs = E.run(hh, `REC(EVA(CON(SEG(sources; kinds: ["bond"]); as: "a"; to: SEG(sources; kinds: ["claim"]); on: a.claim = b._addr; join: "inner"; to_as: "b"); where: a._addr = "being:${n}" OR a.to = "being:${n}"); set: {s: a._addr, v: a.to, rel: b.rel, pol: b.polarity, g: b.ground}; pick: ["s", "v", "rel", "pol", "g"])`, { params: {} }).rows ?? [];
      for (const r of rs) { rowsOut.push(r); next.push(nm(r.s), nm(r.v)); } }
    frontier = [...new Set(next)]; }
  const key = (r) => `${r.s}|${r.rel}|${r.v}|${r.pol}|${r.g}`, uniq = [...new Map(rowsOut.map((r) => [key(r), r])).values()];
  const turnOf = (r) => +String(r.g).replace("where:s", ""); return uniq.sort((a, b) => turnOf(a) - turnOf(b)).map((r) => `[turn ${turnOf(r) + 1}] ${nm(r.s)} ${r.pol === "-" ? "NOT " : ""}${r.rel} ${nm(r.v)}`); };
const namesIn = (q) => people.filter((p) => q.includes(p)).concat(CITIES.filter((c) => q.includes(c)), FIRMS.filter((f) => q.includes(f)));
// ---- the model ----
const ask = async (notes, q, numCtx) => { const sys = "Answer using ONLY the notes. Reply with a very short answer (a name, yes, no, or unknown). If the notes do not say, reply unknown. When a fact was updated later, use the latest.";
  const body = { model: MODEL, stream: false, think: false, options: { temperature: 0, num_ctx: numCtx, num_predict: 24 }, messages: [{ role: "system", content: sys }, { role: "user", content: `Notes:\n${notes}\n\nQuestion: ${q}` }] };
  const t0 = performance.now(), r = await fetch("http://localhost:11434/api/chat", { method: "POST", body: JSON.stringify(body) }), j = await r.json(); return { a: (j.message?.content ?? "").trim(), ms: performance.now() - t0, ptoks: j.prompt_eval_count ?? null }; };
const ok = (a, gold) => { const x = a.toLowerCase().replace(/<think>[\s\S]*?<\/think>/g, "").trim(); return gold === "no" ? x.startsWith("no") : gold === "unknown" ? x.includes("unknown") || x.includes("not say") || x.includes("no information") : x.includes(gold); };
const tokenEst = (s) => Math.ceil(s.length / 4);
const arms = { sliding: (q) => { const lines = []; let tk = 0; for (let i = chat.length - 1; i >= 0; i--) { const t = tokenEst(`[turn ${i + 1}] ${chat[i]}\n`); if (tk + t > 1300) break; tk += t; lines.unshift(`[turn ${i + 1}] ${chat[i]}`); } return { notes: lines.join("\n"), ctx: 2048 }; },
  marks: (q) => ({ notes: sliceFor(namesIn(q)).join("\n") || "(no marks)", ctx: 2048 }),
  oracle: (q, item) => ({ notes: item.goldNotes, ctx: 2048 }), full: () => ({ notes: chat.map((c, i) => `[turn ${i + 1}] ${c}`).join("\n"), ctx: 8192 }) };
// the oracle slice: the facts a perfect reader would hand over
for (const item of Q) { const ns = namesIn(item.q); const rel = order.filter((e) => ns.some((n) => [e.p, e.a, e.b, e.c, e.f].includes(n)) || (item.type === "two-hop" && [e.p, e.a, e.b].some((x) => ns.includes(x))));
  const extra = item.type === "two-hop" ? (() => { const b = hired.find((x) => item.q.includes(x.a))?.b; return order.filter((e) => e.p === b || e.b === b || e.a === b); })() : []; item.goldNotes = [...new Set([...rel, ...extra])].sort((a, b) => a.t - b.t).map((e) => `[turn ${e.t + 1}] ${say(e)}`).join("\n") || "(nothing stated)"; }
console.log(`chat: ${N} turns, ~${tokenEst(chat.join("\n"))} tokens | facts ${order.length} | marks: ${cl.claims.length} claims from ${rows.length} tokens (gaps: ${[...new Set(cl.gaps.map((x) => x.kind))].join(",") || "none"}) | questions ${Q.length} | model ${MODEL}`);
const res = {}; for (const a of Object.keys(arms)) res[a] = { ok: 0, n: 0, ms: 0, ptoks: 0, byType: {} };
const detail = [];
for (const item of Q) { const row = { q: item.q, gold: item.gold, type: item.type };
  for (const [name, f] of Object.entries(arms)) { const { notes, ctx } = f(item.q, item), r = await ask(notes, item.q, ctx), hit = ok(r.a, item.gold); const R = res[name]; R.n++; R.ok += hit; R.ms += r.ms; R.ptoks += r.ptoks ?? 0; (R.byType[item.type] ??= [0, 0]); R.byType[item.type][0] += hit; R.byType[item.type][1]++; row[name] = { a: r.a.slice(0, 40), hit, ptoks: r.ptoks }; }
  detail.push(row); }
for (const [a, R] of Object.entries(res)) console.log(`${a.padEnd(8)} correct ${R.ok}/${R.n} = ${(R.ok / R.n).toFixed(2)} | mean prompt tokens ${Math.round(R.ptoks / R.n)} | mean ${Math.round(R.ms / R.n)} ms/answer | by type ${Object.entries(R.byType).map(([t, v]) => `${t} ${v[0]}/${v[1]}`).join(", ")}`);
fs.writeFileSync(process.argv[2] ?? "chat-result.json", JSON.stringify({ model: MODEL, seed: SEED, turns: N, res, detail }, null, 1));
