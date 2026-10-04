#!/usr/bin/env node
// VENDORED 2026-10-04 from eo-teachings (clovenbradshaw-ctrl), byte-pinned provenance — the migration Step 4 Decision 1a: the legacy sibling is delinked; this loader rides.
// eo-teachings/pythia.mjs — the delphic oracle.
//
// Pythia speaks as any archon of this project's ethos corpus: the givers
// behind eoreader7's organs (Solon, Bukhari, Mozi, Nagarjuna, Xunzi,
// Tarski, Abhinavagupta, ...), each one recorded with verified words in
// eo-teachings/manifest/ and the raw source text in eo-teachings/sources/.
//
// Activation is the corpus, never a name: an archon's own verified words
// (a window of their source text around the manifest's anchored quote) are
// the raw material the model speaks through. An archon with no verified
// words is named and refused, never ventriloquized.
//
//   node pythia.mjs --list                    the speakable cast
//   node pythia.mjs "question"                auto-picks the archon
//   node pythia.mjs --archon Solon "question" one archon speaks
//   node pythia.mjs --council "question"      ethos · logos · pathos
//   node pythia.mjs --repl                    speak back and forth
//
// Model: local Ollama (PYTHIA_OLLAMA_URL, default http://localhost:11434),
// model PYTHIA_MODEL (default gemma2:2b), temperature PYTHIA_TEMP.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { stackDigest } from "./stack-digest.mjs";
import { verifyQuotes } from "../../khora/native/organs/quotes.js";

const ROOT = "/Users/mlacy/Documents/3.0";
const MANIFEST_DIR = path.join(ROOT, "eo-teachings/manifest");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SYNO_DIR = path.join(HERE, "synod");
const OLLAMA_URL = process.env.PYTHIA_OLLAMA_URL ?? "http://localhost:11434";
let MODEL = process.env.PYTHIA_MODEL ?? "gemma2:2b";
const TEMP = Number(process.env.PYTHIA_TEMP ?? 0.6);

// widewindow gene — archon-swarm.mjs measured this against the seed (2500)
// and admitted it as part of the genotype that cleared the seed's own noise
// floor (fitness 0.5 vs 0, falsify/results/archon-swarm-genealogy.jsonl,
// 2026-09-18). Only the direct-question path was tested; synod's window is
// untouched below since the swarm never ran the synod question.
const VOICE_BEFORE = 5000;
const VOICE_AFTER = 5000;
const VOICE_BEFORE_SYNO = 1500;
const VOICE_AFTER_SYNO = 1500;
const HISTORY_KEEP = 6;
const HISTORY_MAX_CHARS = 8000;

const SPEAKABLE = new Set(["verified", "verified_local_archive_pending"]);

// ethos · logos · pathos — the three legs of the composition fold.
const COUNCIL = ["solon", "bukhari", "abhinavagupta"];

// The synod's one question: critique the setup of the system and its goals,
// in the archon's own voice, from its own teaching.
const SYNO_QUESTION =
  "You have been shown the whole code stack of this project and its governance, read by eoreader7's own self-model. " +
  "Critique the setup of the system and its goals. Judge from your own teaching and your own words: what is well-built, " +
  "what is hollow, what is missing, and what you would refuse. Speak in your own voice — never abandon it for the one asking.";

const DIGEST = (() => { try { return stackDigest({ readDate: null }); } catch { return null; } })();

function loadManifest() {
  const byKey = new Map();
  for (const f of fs.readdirSync(MANIFEST_DIR)) {
    if (!f.endsWith(".json")) continue;
    let r;
    try { r = JSON.parse(fs.readFileSync(path.join(MANIFEST_DIR, f), "utf8")); } catch { continue; }
    const key = String(r.handle ?? "").toLowerCase();
    if (!key || !r.giver) continue;
    const speakable = SPEAKABLE.has(r.status) && typeof r.quote === "string" && Number.isInteger(r.c0) && Number.isInteger(r.c1) && typeof r.source?.path === "string";
    const prev = byKey.get(key);
    if (!prev) byKey.set(key, { ...r, speakable });
    else if (speakable && !prev.speakable) byKey.set(key, { ...r, speakable });
  }
  return byKey;
}

function loadVoice(rec, { before = VOICE_BEFORE, after = VOICE_AFTER } = {}) {
  const src = path.join(ROOT, rec.source.path);
  if (!fs.existsSync(src)) return null;
  const text = fs.readFileSync(src, "utf8");
  const a = Math.max(0, rec.c0 - before);
  const b = Math.min(text.length, rec.c1 + after);
  return { excerpt: text.slice(a, b), anchor: `${rec.source.path}#${rec.c0}-${rec.c1}` };
}

function loadRole(rec) {
  const f = path.join(ROOT, rec.handleFile);
  if (!fs.existsSync(f)) return rec.work ?? rec.giver;
  const head = fs.readFileSync(f, "utf8").slice(0, 2000);
  const m = head.match(/Handle:\s*[^\n]+?[—-]\s+([^\n]+)/);
  if (!m) return rec.work ?? rec.giver;
  return m[1].trim().replace(/\s*Amendment XVII\.?\s*$/i, "").replace(/\s*\*\/?\s*$/, "").trim();
}

function buildSystem(rec, { synod = false } = {}) {
  const voice = loadVoice(rec, synod ? { before: VOICE_BEFORE_SYNO, after: VOICE_AFTER_SYNO } : {});
  const role = loadRole(rec);
  const srcPath = rec.source.path;
  // nopersona + multiquote genes (archon-swarm.mjs) — measured against the
  // "speak as yourself" / single-quote wording below and found to raise
  // groundedness (falsify-swap: that wording made the identity label
  // dominate the injected excerpt more than real archons differ from each
  // other; falsify-claim-provenance: only 1/4 archons majority-quoted).
  // Synod keeps the old wording — SYNO_QUESTION itself asks the archon to
  // "speak in your own voice," and the swarm never ran that question.
  const personaLine = synod
    ? "Speak as yourself — your native voice, your idiom, your way of reasoning. Never abandon it for the one asking."
    : "Answer the question using ONLY the material below. Do not perform a character or adopt a tone — state what the material supports, plainly.";
  const quoteLine = synod
    ? "Whenever your answer rests on your own teaching, quote the exact words from \"your own words\" below that support it, in quotation marks."
    : "Support your answer with AT LEAST TWO separate direct quotations from \"your own words\" below, each in quotation marks.";
  const lines = [
    `You are ${rec.giver}, as recorded in ${rec.work} (trans. ${rec.translator ?? "unknown"}). Your words below are taken from ${srcPath}.`,
    `The role this project casts you in: ${role}`,
    "",
    personaLine,
    "You testify only from the words before you. A gap is an answer: what is not in your record, say plainly. You quote only what is written below.",
    quoteLine,
    "You do not pretend to knowledge of machines or times you cannot have known; where the matter is after your age, answer from what your own discipline would teach, and say that you reason from your teaching, not from experience.",
    "",
    ...(DIGEST ? ["THE SYSTEM YOU ARE BEING ASKED ABOUT — the whole code stack, read by eoreader7:", DIGEST, ""] : []),
    voice ? `Your own words:\n${voice.excerpt}` : "(no verified words available)",
  ].join("\n");
  return { system: lines, anchor: voice?.anchor ?? null, excerpt: voice?.excerpt ?? null };
}

async function askOllama(messages, onToken) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, stream: true, options: { temperature: TEMP } }),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ollama ${res.status}: ${detail.slice(0, 300)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let out = "";
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let j;
      try { j = JSON.parse(line); } catch { continue; }
      const tok = j.message?.content;
      if (tok) { onToken?.(tok); out += tok; }
    }
  }
  return out;
}

function tokenize(s) {
  return (s.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? []).filter((t) => t.length > 2);
}

function autoPick(question, cast) {
  const terms = new Set(tokenize(question));
  let best = null;
  let bestScore = 0;
  for (const [key, rec] of cast) {
    if (!rec.speakable) continue;
    const hay = `${rec.giver} ${rec.work ?? ""} ${rec.role ?? ""} ${rec.quote ?? ""}`.toLowerCase();
    let score = 0;
    for (const t of terms) if (hay.includes(t)) score += 1;
    if (score > bestScore) { bestScore = score; best = key; }
  }
  return best;
}

function footer(rec, anchor) {
  const ref = anchor ? ` · ${anchor}` : "";
  return `\n── ${rec.giver} · ${rec.work}${ref} · via ${MODEL}\n`;
}

function trimHistory(history) {
  let msgs = history.slice(-HISTORY_KEEP * 2);
  let chars = msgs.reduce((n, m) => n + String(m.content).length, 0);
  while (msgs.length > 2 && chars > HISTORY_MAX_CHARS) {
    msgs = msgs.slice(2);
    chars = msgs.reduce((n, m) => n + String(m.content).length, 0);
  }
  return msgs;
}

// rejectfab gene (archon-swarm.mjs) — run the real verifyQuotes organ against
// what was actually offered as "your own words"; a quote it cannot locate in
// that material is fabrication, not style, and gets one regeneration with the
// fabrication named and cut. Never silently swallowed: the correction is
// printed, not hidden, since a caught fabrication is itself informative.
async function checkAndRepair(rec, excerpt, messages, text) {
  if (!excerpt) return text;
  const offered = [{ text: excerpt, source: rec.source.path, ref: rec.handle }];
  const report = verifyQuotes(text, offered);
  const fabricated = report.quotes.filter((q) => q.status === "unlocated");
  if (!fabricated.length) return text;
  const cutList = fabricated.map((q) => `"${q.text}"`).join(", ");
  process.stdout.write(
    `\n  ⟂ pythia: ${fabricated.length} quote(s) not found in ${rec.giver}'s offered words (${cutList}) — regenerating.\n\n`
  );
  const retryMessages = [
    ...messages,
    { role: "assistant", content: text },
    {
      role: "user",
      content:
        `Your previous answer quoted words not found in the source: ${cutList}. ` +
        `Cut these — quote only words that are actually written above, or say plainly that you have none to quote.`,
    },
  ];
  return askOllama(retryMessages, (t) => process.stdout.write(t));
}

// ── the one question → one answer path, shared by every mode ─────────────
async function speak(cast, key, question, history, { synod = false } = {}) {
  const rec = cast.get(key);
  const { system, anchor, excerpt } = buildSystem(rec, { synod });
  const messages = [
    { role: "system", content: system },
    ...(history ?? []).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: question },
  ];
  let text = await askOllama(messages, (t) => process.stdout.write(t));
  if (!synod) text = await checkAndRepair(rec, excerpt, messages, text);
  if (!synod) process.stdout.write("\n");
  return { text, rec, anchor, messages };
}

function printCast(cast) {
  const speakable = [...cast.values()].filter((r) => r.speakable).sort((a, b) => a.handle.localeCompare(b.handle));
  const silent = [...cast.values()].filter((r) => !r.speakable).sort((a, b) => a.handle.localeCompare(b.handle));
  console.log(`\nPythia — the delphic oracle of this project's ethos corpus`);
  console.log(`  ${speakable.length} archons with verified words to speak with · model ${MODEL}\n`);
  for (const r of speakable) {
    console.log(`  ${r.handle.padEnd(20)} ${(r.giver ?? "").slice(0, 34).padEnd(34)} ${(r.work ?? "").slice(0, 44)}`);
  }
  if (silent.length) {
    console.log(`\n  ${silent.length} archons with no verified words — named, not ventriloquized:`);
    console.log(`  ${silent.map((r) => r.handle).join(", ")}`);
  }
  console.log("");
}

// ── REPL: speak back and forth ────────────────────────────────────────────
async function repl(cast, initial) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdout.isTTY });
  const histories = new Map();
  const state = { current: initial ?? "solon" };
  const question = async (line) => {
    const keys = state.current === "council" ? COUNCIL : [state.current];
    for (const key of keys) {
      const rec = cast.get(key);
      if (!rec || !rec.speakable) {
        console.log(`\n  Pythia: I have no verified words of that one — I will not ventriloquize them.\n`);
        continue;
      }
      const hk = state.current === "council" ? `council:${key}` : key;
      const history = histories.get(hk) ?? [];
      const role = state.current === "council" ? `\n── ${rec.giver} — ${rec.work}\n` : "";
      if (role) console.log(role);
      const { anchor } = buildSystem(rec);
      const res = await speak(cast, key, line, history);
      history.push({ role: "user", content: line }, { role: "assistant", content: res.text });
      histories.set(hk, trimHistory(history));
      console.log(footer(rec, anchor));
    }
  };
  const prompt = () => `pythia${state.current === "council" ? "@council" : `@${state.current}`}> `;
  rl.setPrompt(prompt());
  rl.prompt();
  let busy = Promise.resolve();
  const handleLine = async (raw) => {
    const line = raw.trim();
    if (!line) return;
    if (line === "/quit" || line === "@quit" || line === "exit") { rl.close(); return; }
    if (line === "@list") { printCast(cast); return; }
    if (line === "@help") {
      console.log(`  ask anything — each archon keeps its own thread, so you can speak back and forth.`);
      console.log(`  @<name>    turn to that archon (e.g. @solon, @nagarjuna, @ibn khaldun, @kurt vonnegut)`);
      console.log(`  @council   turn to the council (${COUNCIL.join(", ")})`);
      console.log(`  @list      the speakable cast   @model <m>  switch model   @clear  forget this thread`);
      console.log(`  /quit      leave`);
      return;
    }
    if (line === "@council") { state.current = "council"; return; }
    if (line === "@clear") { histories.delete(state.current === "council" ? "council" : state.current); console.log("  thread forgotten."); return; }
    if (line.startsWith("@model ")) {
      const m = line.slice(7).trim();
      if (m) { MODEL = m; console.log(`  speaking through ${m}`); }
      return;
    }
    if (line.startsWith("@")) {
      const want = line.slice(1).trim().toLowerCase();
      if (cast.has(want)) { state.current = want; return; }
      console.log(`  no archon named ${want}. @list shows who can speak.`);
      return;
    }
    await question(line);
  };
  rl.on("line", (raw) => {
    busy = busy.then(() => handleLine(raw)).catch((e) => console.error(`\n  pythia error: ${e.message}\n`));
    busy = busy.then(() => { if (!rl.closed) { rl.setPrompt(prompt()); rl.prompt(); } });
  });
  rl.on("close", () => busy.then(() => process.exit(0)));
}

// ── synod: every archon critiques the system, in its own voice ───────────
async function synod(cast, { limit = null, names = null } = {}) {
  fs.mkdirSync(SYNO_DIR, { recursive: true });
  const queue = [...cast.values()].filter((r) => r.speakable).sort((a, b) => a.handle.localeCompare(b.handle));
  const want = names?.length ? new Set(names.map((n) => n.toLowerCase())) : null;
  const selected = want ? queue.filter((r) => want.has(r.handle.toLowerCase())) : queue;
  const total = selected.length;
  let done = 0;
  let skipped = 0;
  for (const rec of selected) {
    const key = rec.handle.toLowerCase();
    const out = path.join(SYNO_DIR, `${key}.txt`);
    if (fs.existsSync(out)) { skipped += 1; continue; }
    if (limit !== null && done >= limit) break;
    process.stdout.write(`\n── ${rec.handle} (${done + 1}/${total}) — ${rec.work}\n`);
    let text;
    try {
      const res = await speak(cast, key, SYNO_QUESTION, [], { synod: true });
      text = res.text.trim();
    } catch (e) {
      console.error(`\n  pythia error on ${rec.handle}: ${e.message}\n`);
      continue;
    }
    if (!text) { console.error(`  empty response for ${rec.handle}, skipping save\n`); continue; }
    fs.writeFileSync(out, `# ${rec.handle} — ${rec.giver}\n# ${rec.work}\n# source ${rec.source.path}\n\n${text}\n`);
    console.log(`  saved ${key}.txt (${text.length} chars)`);
    done += 1;
  }
  console.log(`\nsynod: ${done} spoken · ${skipped} already saved · queue ${total}`);
}

// ── CLI ───────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const cast = loadManifest();
  const modelIdx = args.indexOf("--model");
  if (modelIdx >= 0) {
    const m = args[modelIdx + 1];
    if (m) { MODEL = m; args.splice(modelIdx, 2); }
  }

  if (args.includes("--list") || args.includes("-l")) { printCast(cast); return; }

  const synodIdx = args.indexOf("--synod");
  if (synodIdx >= 0) {
    args.splice(synodIdx, 1);
    const limitIdx = args.indexOf("--synod-limit");
    let limit = null;
    if (limitIdx >= 0) { limit = Number(args[limitIdx + 1]); args.splice(limitIdx, 2); }
    const namesIdx = args.indexOf("--synod-names");
    let names = null;
    if (namesIdx >= 0) { names = args[namesIdx + 1]?.split(",").filter(Boolean) ?? null; args.splice(namesIdx, 2); }
    await synod(cast, { limit, names });
    return;
  }

  const archonIdx = args.indexOf("--archon");
  const wantArchon = archonIdx >= 0 ? args[archonIdx + 1]?.toLowerCase() : null;
  if (archonIdx >= 0 && wantArchon) args.splice(archonIdx, 2);

  const council = args.includes("--council");
  if (council) args.splice(args.indexOf("--council"), 1);

  const replMode = args.includes("--repl") || args.length === 0;
  if (replMode) { await repl(cast, wantArchon ?? "solon"); return; }

  const question = args.join(" ").trim();
  if (!question) { await repl(cast, wantArchon ?? "solon"); return; }

  if (council) {
    for (const key of COUNCIL) {
      const rec = cast.get(key);
      if (!rec?.speakable) continue;
      console.log(`\n── ${rec.giver} — ${rec.work}`);
      const { anchor } = buildSystem(rec);
      await speak(cast, key, question, []);
      console.log(footer(rec, anchor));
    }
    return;
  }

  const key = wantArchon ?? autoPick(question, cast);
  if (!key || !cast.get(key)?.speakable) {
    console.log(`\n  Pythia: no archon's verified words answer to that — I will not invent one. Try --list.\n`);
    process.exit(1);
  }
  const rec = cast.get(key);
  const { anchor } = buildSystem(rec);
  await speak(cast, key, question, []);
  console.log(footer(rec, anchor));
}

const isMain = (() => { try { return import.meta.url === `file://${path.resolve(process.argv[1] ?? "")}`; } catch { return false; } })();
if (isMain) {
  main().catch((e) => {
    console.error(`\n  pythia error: ${e.message}\n`);
    process.exit(1);
  });
}

export { loadManifest, loadVoice, loadRole, buildSystem, speak, askOllama, checkAndRepair, autoPick, footer, COUNCIL, MANIFEST_DIR, ROOT };