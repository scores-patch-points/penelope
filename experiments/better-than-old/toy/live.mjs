// live view: a chat whose model context never grows; the logic is marks in a pharos log (no model writes them). EXPLORATORY demo.
import http from "node:http"; import fs from "node:fs"; import os from "node:os"; import path from "node:path";
const KW="/Users/mlacy/Documents/khora-pharos-reading/native", J="/Users/mlacy/Documents/janus-claim-links/native/organs", PH="/Users/mlacy/Documents/khora-cast/pharos";
const { grammarFor, readingRows } = await import(`${KW}/the-fold/pharos-reading.mjs`), { claimsFromRows } = await import(`${J}/claims-from-rows.mjs`), { weaveClaims } = await import(`${J}/claim-links.mjs`);
const P = await import(`${PH}/lib/pharos.mjs`), E = await import(`${PH}/eoql/src/index.mjs`);
const MODEL = process.env.MODEL ?? "qwen3:4b", NUMCTX = 2048;
const QF = await import("/Users/mlacy/Documents/janus-claim-links/native/organs/question-from-rows.mjs"); const FUNCTIONAL = ["live"];   // a prior GIVEN by the asker (a named giver): where one lives is single-valued. `work` is deliberately NOT declared.
const QT = await import("/Users/mlacy/Documents/janus-claim-links/native/organs/question-tree.mjs"); const trees = [];
const QR = await import("/Users/mlacy/Documents/khora-cast/penelope/organs/question-reason.mjs");
const R = await import("/Users/mlacy/Documents/khora/opencode-register.mjs");
const g = await grammarFor("eng"); const thoughts = [], said = []; const chat = []; let marks = [], hh = null, claims = [];
const nm = (x) => (String(x).startsWith("being:") ? String(x).slice(6) : String(x));
function rebuild() { const text = chat.map((c) => c.text).join(" "); const cl = claimsFromRows(readingRows(g, text, { predicate: true }), { doc: "chat" }); claims = cl.claims;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "live-")), h = P.open("t", { dir, writer: "w" }); lastH = h; weaveClaims(P, h, cl.claims, {}, { where: cl.grounds.where }); for (const k of ["ask","goal","part_of","standing"]) { try { P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: `kind:${k}`, body: { name: k, cell: { ask: "INS·Figure", goal: "SEG·Pattern", part_of: "CON·Figure", standing: "EVA·Figure" }[k] } }); } catch {} }
  try { P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: "kind:utterance", body: { name: "utterance", cell: "INS·Figure" } }); } catch {}
  try { P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: "kind:thought", body: { name: "thought", cell: "INS·Figure" } }); } catch {}
  for (const t of thoughts) P.weave(h, { cell: "INS·Figure", kind: "thought", addr: `thought:${t.n}`, body: { by: `model:${MODEL}`, turn: t.n, question: t.q, read: t.read, text: t.text } });
  for (const u of said) P.weave(h, { cell: "INS·Figure", kind: "utterance", addr: `utterance:${u.n}`, body: { by: `model:${MODEL}`, turn: u.n, to: "user", text: u.text, grounded: u.grounded } });
  for (const t of trees) { const ids = QT.weave(P, h, t.nodes, { kinds: false }); QR.weaveReasoning(P, h, t.nodes, ids, { by: `model:${process.env.MODEL ?? "qwen3:8b"}` }); }
  hh = E.open(`jsonl:${dir}/w.jsonl`); }
const q1 = (n) => { try { return E.run(hh, `REC(EVA(CON(SEG(sources; kinds: ["bond"]); as: "a"; to: SEG(sources; kinds: ["claim"]); on: a.claim = b._addr; join: "inner"; to_as: "b"); where: a._addr = "being:${n}" OR a.to = "being:${n}"); set: {s: a._addr, v: a.to, rel: b.rel, pol: b.polarity, g: b.source}; pick: ["s", "v", "rel", "pol", "g"])`, { params: {} }).rows ?? []; } catch { return []; } };
function slice(q) { const caps = [...new Set(readingRows(g, q).filter((r) => r.upos === "PROPN").map((r) => r.form))], seen = new Set(), out = []; let fr = caps;
  for (let hop = 0; hop < 2; hop++) { const nx = []; for (const n of fr) { if (seen.has(n)) continue; seen.add(n); for (const r of q1(n)) { out.push(r); nx.push(nm(r.s), nm(r.v)); } } fr = [...new Set(nx)]; }
  const key = (r) => `${r.s}|${r.rel}|${r.v}|${r.pol}|${r.g}`, u = [...new Map(out.map((r) => [key(r), r])).values()], t = (r) => +String(r.g).replace("s", "");
  return u.sort((a, b) => t(a) - t(b)).map((r) => `[turn ${t(r) + 1}] ${nm(r.s)} ${r.pol === "-" ? "NOT " : ""}${r.rel} ${nm(r.v)}`); }
// MACHINE FIRST (foldcode FOLD-MECHANICAL): the register (copular facts, supersession, provenance, contradiction), then a mechanical lookup over the claims; a gap goes to the model.
const PEOPLE_SEEN = () => [...new Set(claims.flatMap((c) => [c.a].filter((x) => x && /^[A-Z]/.test(x))))];
const latest = (rows, who, relRe) => rows.filter((r) => nm(r.s) === who && relRe.test(r.rel) && r.pol !== "-").sort((a, b) => +String(b.g).replace("where:s", "") - +String(a.g).replace("where:s", ""))[0];
function resolve(q) { const said = chat.filter((c) => !c.q).map((c, i) => ({ role: "user", text: c.text, n: chat.indexOf(c) + 1 })); const mem = R.ingest(said), a = R.answer(q, mem);
  if (a && !R.isGap(a)) return { by: "register", competency: a.competency, finding: `${a.subject ? a.subject + (a.mode === "superseded" ? " (before)" : "") + ": " : ""}${R.renderAnswer(a)}` };
  const rd = (t) => readingRows(g, t, { predicate: true }), j = QT.judge(rd(q), claims, { functional: FUNCTIONAL, text: q, read: rd });
  if (j.standing === "stands" || j.standing === "contradicted") return { by: "claims", competency: j.kind, finding: j.finding, basis: j.basis };
  return { by: null, gap: `${j.kind}/${j.standing}`, note: j.note ?? j.finding }; }
const SYS = "Answer using ONLY the notes. Reply very briefly. If the notes do not say, reply: unknown. When a fact was updated later, use the latest.";
async function ask(notes, q, stating = false) { const model = stating ? "qwen3:8b" : MODEL; const t0 = performance.now(), r = await fetch("http://localhost:11434/api/chat", { method: "POST", body: JSON.stringify({ model, stream: false, think: !stating, options: { temperature: 0, num_ctx: NUMCTX, num_predict: stating ? 60 : 1200 }, messages: stating ? [{ role: "system", content: `The machine already found the answer: ${notes}\nState it in one short sentence.` }, { role: "user", content: q }] : [{ role: "system", content: SYS }, { role: "user", content: `Notes:\n${notes}\n\nQuestion: ${q}` }] }) }), j = await r.json(); return { a: (j.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim(), thinking: (j.message?.thinking ?? "").trim(), ms: Math.round(performance.now() - t0), ptoks: j.prompt_eval_count }; }
let lastH = null; const h0 = () => lastH;
async function askTable(lines, q) { const t0 = performance.now(), r = await fetch("http://localhost:11434/api/chat", { method: "POST", body: JSON.stringify({ model: process.env.MODEL ?? "qwen3:8b", stream: false, ...((process.env.MODEL ?? "qwen3:8b").startsWith("qwen3") ? { think: false } : {}), options: { temperature: 0, num_ctx: NUMCTX, num_predict: 400 }, messages: [{ role: "system", content: `The machine checked each part of the question against what was said, and found:\n${lines}\nAnswer the question part by part using these findings. Say plainly what is contradicted, what is not on record, what is a judgement, and what could not be read. Do not add facts that are not in the findings.` }, { role: "user", content: q }] }) }), j = await r.json(); return { a: (j.message?.content ?? "").trim(), ms: Math.round(performance.now() - t0), ptoks: j.prompt_eval_count }; }
const thinkModel = { async think({ system, user }) { const r = await fetch("http://localhost:11434/api/chat", { method: "POST", body: JSON.stringify({ model: process.env.MODEL ?? "qwen3:8b", stream: false, ...((process.env.MODEL ?? "qwen3:8b").startsWith("qwen3") ? { think: false } : {}), options: { temperature: 0, num_ctx: 2048, num_predict: 140 }, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) }), j = await r.json(), c = (j.message?.content ?? "").trim(); return { thinking: c, content: c }; } };   // no thinking channel: the model's short note IS the thought and the source of its proposals
const namesOf = (t) => readingRows(g, t, { predicate: true }).filter((r) => r.upos === "PROPN").map((r) => r.form), claimsOf = (t) => claimsFromRows(readingRows(g, t, { predicate: true }), { doc: "model" }).claims;
const events = []; const clients = new Set(); const emit = (e) => { e.i = events.length; events.push(e); for (const c of clients) c.write(`data: ${JSON.stringify(e)}\n\n`); };
async function turn(text) { const trows = readingRows(g, text, { predicate: true }), isQ = trows.at(-1)?.form === "?"; chat.push({ text, q: isQ });
  if (!isQ) { rebuild(); emit({ kind: "say", n: chat.length, text, claims: claims.length, historyChars: chat.reduce((s, c) => s + c.text.length, 0) }); return; }
  const reg = isQ ? resolve(text) : null;
  if (isQ && reg.by !== "register") {
    const nodesT = QT.build(text, trows, { read: (t) => readingRows(g, t, { predicate: true }), marks: claims, functional: FUNCTIONAL }), goals = nodesT.filter((n) => n.parent && n.parent !== "g0");
    if (goals.length) {
      emit({ kind: "tree", n: chat.length, text, phase: "mechanical", nodes: nodesT, claims: claims.length, historyChars: chat.reduce((s, c) => s + c.text.length, 0) });
      const reasoned = await QR.reasonOver(nodesT, { marks: claims, namesOf, claimsOf, model: thinkModel, functional: FUNCTIONAL, by: `model:${process.env.MODEL ?? "qwen3:8b"}`, onNode: (nd) => emit({ kind: "think", id: nd.id, standing: nd.standing, finding: nd.finding, thought: nd.thought, nominated: nd.nominated, proposals: nd.proposals }) });
      trees.push({ n: chat.length, nodes: reasoned }); rebuild();
      const lines = reasoned.filter((n) => n.standing).map((n) => `- "${n.text}" -> ${n.standing}: ${n.finding ?? n.note}${n.standing === "candidate" ? " (a PROPOSAL by the model, not on record)" : ""}`).join("\n"), r2 = await askTable(lines, text);
      said.push({ n: chat.length, text: r2.a, grounded: null }); rebuild();
      emit({ kind: "final", n: chat.length, text, answer: r2.a, table: lines, ms: r2.ms, ptoks: r2.ptoks, entries: P.entries(h0()).length }); return;
    }
  }
  const route = reg ?? resolve(text), notes = slice(text) || []; const body = route.by ? route.finding : notes.join("\n") || "(no marks)"; const r = await ask(body, text, !!route.by); if (r.thinking) { thoughts.push({ n: chat.length, q: text, read: notes, text: r.thinking }); rebuild(); } const rc = claimsFromRows(readingRows(g, r.a), { doc: "reply" }).claims, mine = (c) => claims.some((m) => m.a === c.a && m.b === c.b && (m.rel === c.rel || m.rel.split("_")[0] === c.rel.split("_")[0])), grounded = r.a === "" ? false : (route.by && /^unknown\b/i.test(r.a)) ? false : rc.length === 0 ? null : rc.every(mine); said.push({ n: chat.length, text: r.a, grounded }); rebuild(); emit({ kind: "ask", route: route.by ?? "model", competency: route.competency ?? route.gap, finding: route.finding, register: (R.registerLines(R.ingest(chat.filter((c) => !c.q).map((c, i) => ({ role: "user", text: c.text, n: i + 1 }))).register) ?? []), grounded, n: chat.length, text, slice: notes, answer: r.a, thinking: r.thinking, thoughtsInLog: thoughts.length, ptoks: r.ptoks, ms: r.ms, claims: claims.length, historyChars: chat.reduce((s, c) => s + c.text.length, 0) }); }
let busy = Promise.resolve(); const enqueue = (t) => (busy = busy.then(() => turn(t)).catch((e) => emit({ kind: "err", text: String(e) })));
// the scripted long chat
const PEOPLE = ["Maria","Tom","Anna","Victor","Lena","Oscar","Priya","Jonas"], CITIES = ["Leeds","York","Bath","Derby","Oxford","Lincoln"], FIRMS = ["Acme","Borealis","Cobalt","Dynamo"], FILL = ["It rained all afternoon.","Lunch was late today.","The meeting ran long.","Traffic was heavy this morning.","The coffee machine broke again.","The report is almost finished.","The garden needs water.","The train was delayed."];
let s = 7; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296), pk = (a) => a[Math.floor(rnd() * a.length)];
function script(N = 90) { const out = [], city = {}, said = []; for (const p of PEOPLE) { city[p] = pk(CITIES); said.push(`${p} lives in ${city[p]}.`, `${p} works at ${pk(FIRMS)}.`); }
  let k = 0; const facts = said.sort(() => rnd() - 0.5), moves = [PEOPLE[1], PEOPLE[4], PEOPLE[2]].map((p) => { const c = pk(CITIES.filter((x) => x !== city[p])); city[p] = c; return `${p} now lives in ${c}.`; }), hire = [`${PEOPLE[0]} hired ${PEOPLE[3]}.`];
  const all = [...facts, "The mascot service is called Orbit.", "The deploy time is 14:30.", ...hire, ...moves, "The deploy time is 15:45."]; for (let i = 0; i < N; i++) { if (i % 5 === 2 && k < all.length) out.push(all[k++]); else out.push(pk(FILL)); }
  while (k < all.length) out.push(all[k++]);
  out.push("Who lives in Leeds?", `Where did ${PEOPLE[1]} live before?`, `${PEOPLE[1]} lives in Zurich, right?`, `Does ${PEOPLE[2]} work at Zebra?`, `Where does the person ${PEOPLE[0]} hired live now?`, `Could ${PEOPLE[0]} and ${PEOPLE[3]} have met through work?`, "What is the deploy time?", "What was the deploy time before?", "What is the mascot service called?", `Where does ${PEOPLE[1]} live now?`, `Where does the person ${PEOPLE[0]} hired live now?`, `Does ${PEOPLE[2]} work at Zebra?`, `What is ${PEOPLE[5]}'s favourite food?`, `Where does ${PEOPLE[4]} live now?`); return { out, city }; }
let playing = false; async function play(factsOnly) { if (playing) return; playing = true; const { out: all } = script(); const out = factsOnly ? all.filter((t) => !t.endsWith("?")) : all; for (const t of out) { await enqueue(t); await new Promise((r) => setTimeout(r, 120)); } playing = false; emit({ kind: "done" }); }
const PAGE = fs.readFileSync(new URL("./live.html", import.meta.url), "utf8");
http.createServer(async (req, res) => { const u = new URL(req.url, "http://x");
  if (u.pathname === "/") { res.setHeader("content-type", "text/html"); return res.end(PAGE); }
  if (u.pathname === "/events") { res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" }); for (const e of events) res.write(`data: ${JSON.stringify(e)}\n\n`); clients.add(res); req.on("close", () => clients.delete(res)); return; }
  if (u.pathname === "/say") { enqueue(u.searchParams.get("t") ?? ""); return res.end("ok"); }
  if (u.pathname === "/play") { play(u.searchParams.get("facts") === "1"); return res.end("ok"); }
  res.statusCode = 404; res.end(); }).listen(7461, () => console.log("live on http://localhost:7461 model", MODEL));
