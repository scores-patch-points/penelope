// EXPLORATORY comparison, protocol frozen in PREREG-BETTER-THAN-OLD.md (sha256 first 16: 8cb2db9745970838, amended before any run). Arms: old (register + recent window), new (marks + reasoning stack), full (whole chat, reference).
import fs from "node:fs";
const KW = "/Users/mlacy/Documents/khora-pharos-reading/native", J = "/Users/mlacy/Documents/janus-claim-links/native/organs", PEN = "/Users/mlacy/Documents/khora-cast/penelope/organs";
const { grammarFor, readingRows } = await import(`${KW}/the-fold/pharos-reading.mjs`), { claimsFromRows } = await import(`${J}/claims-from-rows.mjs`), QT = await import(`${J}/question-tree.mjs`), QR = await import(`${PEN}/question-reason.mjs`), R = await import("/Users/mlacy/Documents/khora/opencode-register.mjs");
const SEED = +(process.env.SEED ?? 20261120), TURNS = +(process.env.TURNS ?? 900), ONLY = (process.env.ARMS ?? "old,new,full").split(",");
const mul = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rng = mul(SEED), pick = (a) => a[Math.floor(rng() * a.length)], shuf = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const PEOPLE = shuf(["Maria", "Tom", "Anna", "Victor", "Lena", "Oscar", "Priya", "Jonas", "Clara", "Felix", "Nadia", "Hugo"]).slice(0, 10), CITIES = ["Leeds", "York", "Bath", "Derby", "Oxford", "Lincoln", "Ely", "Hull"], FIRMS = ["Acme", "Borealis", "Cobalt", "Dynamo", "Ember"];
const FILL = ["It rained all afternoon.", "Lunch was late today.", "The meeting ran long.", "Traffic was heavy this morning.", "The coffee machine broke again.", "Spring came early this year.", "The report is almost finished.", "Everyone was tired after the trip.", "The garden needs water.", "A package arrived yesterday.", "The train was delayed.", "The room felt cold."];
// ---- the world ----
const city = {}, firm = {}, hist = {}, ev = [];   // ev: { phase, text }
for (const p of PEOPLE) { city[p] = pick(CITIES); firm[p] = pick(FIRMS); hist[p] = [city[p]]; ev.push({ ph: 0, t: `${p} lives in ${city[p]}.` }, { ph: 0, t: `${p} works at ${firm[p]}.` }); }
const hirers = shuf([...PEOPLE]).slice(0, 5), hired = {}; for (const a of hirers) { const b = pick(PEOPLE.filter((x) => x !== a && !Object.values(hired).includes(x))); hired[a] = b; ev.push({ ph: 0, t: `${a} hired ${b}.` }); }
ev.push({ ph: 0, t: "The mascot service is called Orbit." }, { ph: 0, t: "The deploy time is 14:30." });
for (const p of shuf([...PEOPLE]).slice(0, 6)) { const c = pick(CITIES.filter((x) => x !== city[p])); city[p] = c; hist[p].push(c); ev.push({ ph: 1, t: `${p} now lives in ${c}.` }); }
ev.push({ ph: 1, t: "The deploy time is 15:45." });
const slots = shuf(Array.from({ length: TURNS }, (_, i) => i)).slice(0, ev.length), early = slots.slice(0, ev.filter((e) => e.ph === 0).length).sort((a, b) => a - b), late = slots.slice(early.length).sort((a, b) => a - b), cut = Math.max(...early);
const lateOK = Array.from({ length: TURNS }, (_, i) => i).filter((i) => i > cut); const lateSlots = shuf(lateOK).slice(0, late.length).sort((a, b) => a - b);
const chat = Array.from({ length: TURNS }, () => pick(FILL)); ev.filter((e) => e.ph === 0).forEach((e, i) => { chat[early[i]] = e.t; }); ev.filter((e) => e.ph === 1).forEach((e, i) => { chat[lateSlots[i]] = e.t; });
const movers = PEOPLE.filter((p) => hist[p].length > 1);
const Q = []; const add = (type, q, gold, extra = {}) => Q.push({ type, q, gold, ...extra });
for (const p of shuf([...PEOPLE]).slice(0, 8)) add("city", `Where does ${p} live now?`, [city[p]]);
for (const p of shuf([...PEOPLE]).slice(0, 4)) add("firm", `Where does ${p} work?`, [firm[p]]);
for (const p of movers.slice(0, 3)) add("previous", `Where did ${p} live before?`, [hist[p][hist[p].length - 2]]);
for (const c of shuf([...CITIES]).filter((c) => PEOPLE.some((p) => city[p] === c)).slice(0, 3)) add("inverse", `Who lives in ${c}?`, PEOPLE.filter((p) => city[p] === c));
for (const a of hirers.slice(0, 3)) add("nested", `Where does the person ${a} hired live now?`, [city[hired[a]]]);
for (const p of shuf([...PEOPLE]).slice(0, 3)) add("falsepremise", `${p} lives in ${pick(CITIES.filter((c) => c !== city[p]))}, right?`, [city[p]]);
add("unanswerable", `What is ${PEOPLE[0]}'s favourite food?`, null); add("unanswerable", `How far is ${PEOPLE[1]}'s flight from where ${PEOPLE[1]} lives?`, null); add("unanswerable", `In what year was ${FIRMS[0]} founded?`, null);
add("register", "What is the deploy time?", ["15:45"]); add("register", "What was the deploy time before?", ["14:30"]); add("register", "What is the mascot service called?", ["Orbit"]);
for (const q of Q) q.near = false;
// ---- models ----
const OLLAMA = "http://localhost:11434/api/chat", stats = {}, MODEL = process.env.MODEL ?? "qwen3:8b";   // run 2 (gemma2:2b in every role): the only change, see the addendum
async function llm(arm, model, messages, { think = false, np = 80, ctx = 2048 } = {}) { model = MODEL; const t0 = performance.now(), r = await fetch(OLLAMA, { method: "POST", body: JSON.stringify({ model, stream: false, ...(MODEL.startsWith("qwen3") ? { think } : {}), options: { temperature: 0, num_ctx: ctx, num_predict: np }, messages }) }), j = await r.json(); const s = (stats[arm] ??= { calls: 0, ptoks: 0, ms: 0 }); s.calls++; s.ptoks += j.prompt_eval_count ?? 0; s.ms += performance.now() - t0; return { content: (j.message?.content ?? "").trim(), thinking: (j.message?.thinking ?? "").trim() }; }
const STATE = (finding) => `The machine already found the answer: ${finding}\nState it in one short sentence.`, NOTES = "Answer using ONLY the notes. Reply very briefly. If the notes do not say, reply: unknown.";
const g = await grammarFor("eng"), rd = (t) => readingRows(g, t, { predicate: true }), text = chat.join(" ");
const marks = claimsFromRows(rd(text), { doc: "chat" }).claims, mem = R.ingest(chat.map((t, i) => ({ role: "user", text: t, n: i + 1 })));
console.log(`chat ${TURNS} turns ~${Math.round(text.length / 4)} tokens | marks ${marks.length} | questions ${Q.length} | people ${PEOPLE.join(",")}`);
const namesOf = (t) => rd(t).filter((r) => r.upos === "PROPN").map((r) => r.form), claimsOf = (t) => claimsFromRows(rd(t), { doc: "model" }).claims;
const window2k = () => { const out = []; let tk = 0; for (let i = chat.length - 1; i >= 0; i--) { const l = `[turn ${i + 1}] ${chat[i]}`, t = Math.ceil(l.length / 4); if (tk + t > 1300) break; tk += t; out.unshift(l); } return out.join("\n"); };
const reg = (q) => { const a = R.answer(q, mem); return a && !R.isGap(a) ? `${a.subject ? a.subject + (a.mode === "superseded" ? " (before)" : "") + ": " : ""}${R.renderAnswer(a)}` : null; };
const arms = {
  async old(item) { const f = reg(item.q); if (f) return { a: (await llm("old", "qwen3:8b", [{ role: "system", content: STATE(f) }, { role: "user", content: item.q }])).content, route: "register" }; return { a: (await llm("old", "qwen3:8b", [{ role: "system", content: NOTES }, { role: "user", content: `Notes:\n${window2k()}\n\nQuestion: ${item.q}` }])).content, route: "window" }; },
  async full(item) { return { a: (await llm("full", "qwen3:8b", [{ role: "system", content: NOTES }, { role: "user", content: `Notes:\n${chat.map((c, i) => `[turn ${i + 1}] ${c}`).join("\n")}\n\nQuestion: ${item.q}` }], { ctx: 8192 })).content, route: "full" }; },
  async new(item) {
    const f = reg(item.q); if (f) return { a: (await llm("new", "qwen3:8b", [{ role: "system", content: STATE(f) }, { role: "user", content: item.q }])).content, route: "register" };
    const rows = rd(item.q), nodes = QT.build(item.q, rows, { read: rd, marks, functional: ["live"] }), goals = nodes.filter((n) => n.parent && n.parent !== "g0");
    if (!goals.length) return { a: (await llm("new", "qwen3:8b", [{ role: "system", content: NOTES }, { role: "user", content: `Notes:\n(no marks)\n\nQuestion: ${item.q}` }])).content, route: "unread" };
    const thinker = { async think({ system, user }) { const r = await llm("new-think", "qwen3:8b", [{ role: "system", content: system }, { role: "user", content: user }], { think: false, np: 140 }); return { thinking: r.content, content: r.content }; } };
    const reasoned = await QR.reasonOver(nodes, { marks, namesOf, claimsOf, model: thinker, functional: ["live"], by: `model:${MODEL}` }), thought = reasoned.some((n) => n.thought);
    const lines = reasoned.filter((n) => n.standing).map((n) => `- "${n.text}" -> ${n.standing}: ${n.finding ?? n.note}${n.standing === "candidate" ? " (a PROPOSAL by the model, not on record)" : ""}`).join("\n");
    return { a: (await llm("new", "qwen3:8b", [{ role: "system", content: `The machine checked each part of the question against what was said, and found:\n${lines}\nAnswer the question using these findings. Say plainly what is contradicted, what is not on record, and what is only a proposal. Do not add facts that are not in the findings.` }, { role: "user", content: item.q }], { np: 200 })).content, route: thought ? "reasoned+model" : "mechanical" };
  },
};
const low = (s) => s.toLowerCase(), digits = (s) => [...s].some((c) => c >= "0" && c <= "9"), names = [...CITIES, ...FIRMS], DECLINE = ["unknown", "not on record", "no information", "cannot", "can't", "don't know", "not say", "no mark", "not stated", "nothing"];
const score = (item, a) => { const x = low(a); if (item.gold === null) { const fab = names.some((n) => x.includes(low(n))) || digits(a), declined = DECLINE.some((d) => x.includes(d)); return { correct: declined && !fab, fab }; } return { correct: item.gold.every((v) => x.includes(low(v))), fab: false }; };
const res = {}; for (const arm of ONLY) { res[arm] = []; for (const item of Q) { const t0 = performance.now(), r = await arms[arm](item), sc = score(item, r.a); res[arm].push({ type: item.type, q: item.q, gold: item.gold, a: r.a.slice(0, 160), route: r.route, ...sc, ms: Math.round(performance.now() - t0) }); process.stdout.write(`${arm[0]}${sc.correct ? "+" : "-"}${sc.fab ? "F" : ""} `); } console.log(`\n${arm} done`); }
const summary = {}; for (const arm of ONLY) { const rs = res[arm], by = {}; for (const r of rs) { (by[r.type] ??= { n: 0, ok: 0, fab: 0 }); by[r.type].n++; by[r.type].ok += r.correct; by[r.type].fab += r.fab; } const s = stats[arm] ?? { calls: 0, ptoks: 0, ms: 0 }; summary[arm] = { correct: `${rs.filter((r) => r.correct).length}/${rs.length}`, fabricated: rs.filter((r) => r.fab).length, byType: by, meanPromptTokens: Math.round(s.ptoks / rs.length), modelCallsPerQ: +(s.calls / rs.length).toFixed(2), meanMsPerQ: Math.round(rs.reduce((a, r) => a + r.ms, 0) / rs.length), routes: rs.reduce((a, r) => (a[r.route] = (a[r.route] ?? 0) + 1, a), {}) }; }
summary.thinkModel = stats["new-think"] ?? null;
fs.writeFileSync(process.argv[2] ?? "bench-result.json", JSON.stringify({ prereg: "8cb2db9745970838", addendum: MODEL === "qwen3:8b" ? null : "RUN2-GEMMA", model: MODEL, seed: SEED, turns: TURNS, summary, res }, null, 1)); console.log(JSON.stringify(summary, null, 1));
