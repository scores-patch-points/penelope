// penelope/organs/voice.mjs — the MOE routing composer: archons checked in
// before the reasoning fires, the prompt composed last.
//
// The shape, in order:
//   1. THE ROUTER (the steersman) reads the shadow and names the relevant
//      archons for the turn — the envelope. This is the unconscious
//      check-in: no archon is told it was checked in with, and nothing in
//      the eventual prompt names them.
//   2. LOGOS fires untouched — the reasoning engine (the fold, the
//      arrangement engine) is exactly what it was; this organ changes
//      nothing about how claims are read, folded, or tested.
//   3. THE LOCAL MODEL is given a prompt LAST — composed from the routed
//      archons' jurisdictions (deep roles) and their dwelling regions (the
//      byte-addressed places where each canon is densest in its own
//      vocabulary). The POV conditions the FRAME of the answer — what
//      counts as mattering for whom — not its sentences.
//
// WHAT THIS ORGAN DOES NOT DO: it does not demand verbatim quotation. The
// route→logos→prompt order (2026-10-01, the operator's direction) puts the
// POV in the frame, not in the quotes. Grounding is the fold's business
// when logos runs; here the gates are exactly two:
//   rejectfab  a quotation the organ cannot locate in the offered material
//              is fabrication, not style — one regeneration, cut and named
//   the veil   no name in the model's own prose — a name token is a proper
//              noun (capitalized) outside the grounded quotes; one
//              regeneration with the defect named, never a silent strip
//   aporia     an envelope with aporia=true is NOT drawn at all
//
// THE LAW: pathos never gates and never grades; the record names the
// routed archons, the response carries no name; logos is untouched.
import { loadManifest, loadVoice, loadRole, askOllama } from "./pythia.mjs";
import { verifyQuotes } from "../../khora/native/organs/quotes.js";
import { readFileSync } from "node:fs";
import path from "node:path";

const MODEL = process.env.PYTHIA_MODEL ?? "gemma2:2b";
const TEMP = Number(process.env.PYTHIA_TEMP ?? 0.6);
const ROOT = "/Users/mlacy/Documents/3.0";

// the mixture-of-experts convention, disclosed: the routed expert set is
// the top-k of the strong (shadow) lane
const MOE_K = 4;

let _cast = null;
function loadCastLazy() {
  if (!_cast) _cast = loadManifest();
  return _cast;
}
/** The cast (the archon manifest map) — what composePrompt/speakEnvelope
 *  need as `cast`. A caller with no cast of its own (the generation door)
 *  must pass this, never null: composePrompt does `cast.get(...)`. */
export function loadCast() { return loadCastLazy(); }

// ── the dwelling regions (byte-addressed, from the concern field) ──────────
// Budget: up to DWELL_SLICES slices of DWELL_PAD chars per archon,
// disclosed. The project's own wrapper is stripped (the e2e caught the
// model quoting the Gutenberg header — grounded, worthless).
const DWELL_SLICES = 4;
const DWELL_PAD = 400;
const DWELL_MIN = 40;
const GUTENBERG_WRAP = /Projekt Gutenberg|Project Gutenberg|gutenberg2000|ETEXT|prepared by [a-z@.]+|START OF THE PROJECT|END OF THE PROJECT|Satz von |html2txt|This file was produced/i;

export function dwellingMaterial(srcPath, addresses) {
  const src = String(srcPath ?? "");
  if (!src || !Array.isArray(addresses) || !addresses.length) return null;
  let text = null;
  try { text = readFileSync(src, "utf8"); } catch { return null; }
  const out = [];
  const seen = new Set();
  for (const a of addresses) {
    const start = typeof a?.start === "number" ? a.start : null;
    if (start === null || seen.has(start)) continue;
    seen.add(start);
    const from = Math.max(0, start - DWELL_PAD);
    const to = Math.min(text.length, start + DWELL_PAD);
    if (to - from < DWELL_MIN) continue;
    const slice = text.slice(from, to);
    if (GUTENBERG_WRAP.test(slice)) continue;
    out.push(slice);
    if (out.length >= DWELL_SLICES) break;
  }
  return out.length ? out.join("\n") : null;
}

// ── the veil (no name in the model's own prose) ─────────────────────────────
// Identity tokens: handle + giver words that (a) the OFFERED MATERIAL does
// not itself use, and (b) are not common across the cast's other canons —
// the "beat the population" shape. A NAME is a proper noun: it wears its
// capital. "recorded" — an ordinary word of an identity record — is not a
// name even when the response uses it (falsified on the Ramakrishna draw).
export function veilTokens(rec, excerpt, otherExcerpts = []) {
  const words = `${rec.handle ?? ""} ${rec.giver ?? ""}`.toLowerCase().match(/\p{L}{4,}/gu) ?? [];
  const inMaterial = new Set(String(excerpt ?? "").toLowerCase().match(/\p{L}{4,}/gu) ?? []);
  const uniq = [...new Set(words)];
  const half = otherExcerpts.length / 2;
  return uniq.filter((t) => {
    if (inMaterial.has(t)) return false;
    if (!otherExcerpts.length) return true;
    let common = 0;
    for (const other of otherExcerpts) if (other.includes(t)) common += 1;
    return common <= half;
  });
}

export function otherExcerpts(rec, cast) {
  const out = [];
  for (const [key, other] of cast) {
    if (key === String(rec.handle ?? "").toLowerCase()) continue;
    if (!other?.source?.path) continue;
    const v = loadVoice(other);
    if (v?.excerpt) out.push(v.excerpt.toLowerCase());
  }
  return out;
}

// ── the router's output → the prompt, composed LAST ─────────────────────────
export function routedExperts(env) {
  const strong = [
    ...env.activation.filter((a) => a.lane === "shadow").slice(0, MOE_K),
    ...(env.jurisdiction ?? []).slice(0, MOE_K),
  ].slice(0, MOE_K);
  const weak = env.activation.filter((a) => a.lane === "metadata").slice(0, MOE_K);
  return { strong, weak };
}

export function composePrompt(experts, cast, turn, { priorTurn = null } = {}) {
  const roles = [];
  const slices = [];
  const routed = [];
  for (const a of experts.strong) {
    const rec = cast.get(a.handle.toLowerCase());
    if (!rec) continue;
    if (!rec.source?.path) continue; // a silent archon has no canon and no
    // verified words — named and refused, never drawn (the house law)
    routed.push({ handle: rec.handle, role: loadRole(rec), grounds: (a.grounds ?? []).map((g) => ({ term: g.term, address: g.address })) });
    roles.push(loadRole(rec));
    const addresses = (a.grounds ?? []).map((g) => g.address).filter(Boolean);
    const full = path.join(ROOT, rec.source.path);
    const m = dwellingMaterial(full, addresses) ?? loadVoice(rec)?.excerpt;
    if (m) slices.push(m);
  }
  if (!routed.length) return { refused: "no_strong_routing" };
  const system = [
    "The question below is asked through the ways of holding questions recorded in the material — their jurisdictions:",
    ...roles.map((r) => `  · ${r}`),
    "",
    "Answer from the material and its way of holding questions. State what it supports, plainly. A gap is an answer: what is not in the material, say plainly.",
    "Where your answer rests on the words, the words are the authority — never fabricate a quotation. Where the matter is after their age, reason from their teaching and say that you reason from teaching, not from experience.",
    "Do not name any of the ones whose words these are; the material is the authority.",
    "",
    "MATERIAL — the only text you may quote. Everything above this marker is instruction, never to be quoted:",
    ...(slices.length ? slices : ["(no material)"]),
  ].join("\n");
  const user = [priorTurn ? `The one asking just said: "${String(priorTurn).slice(0, 400)}" — take it up.` : null, turn].filter(Boolean).join("\n\n");
  return { system, user, routed, materialKind: slices.length ? "dwelling-regions" : "anchor-window" };
}

// ── the draw: composed prompt → local model → the two gates → the record ────
export async function drawRouted(comp, turn, { onNote = null } = {}) {
  const messages = [
    { role: "system", content: comp.system },
    { role: "user", content: comp.user },
  ];
  const regenerations = [];
  let text = await askOllama(messages, (t) => process.stdout.write(t));
  process.stdout.write("\n");

  // rejectfab: a quotation the organ cannot locate in the offered material
  // is fabrication — the remedy is the bounded loop, never a one-shot
  // re-run (GL-WV-12): each round names the fabrication, the file is not
  // re-drawn whole but re-cued with the defect named; bounded by
  // REJECTFAB_ROUNDS, disclosed, never silent
  const REJECTFAB_ROUNDS = 2;
  const material = comp.system.split("MATERIAL —")[1] ?? "";
  const offered = material.trim() ? [{ text: material, source: "composed-material", ref: comp.routed.map((r) => r.handle).join("+") }] : [];
  let report = offered.length ? verifyQuotes(text, offered) : { quotes: [] };
  for (let round = 0; round < REJECTFAB_ROUNDS; round += 1) {
    const fabricated = report.quotes.filter((q) => q.status === "unlocated");
    if (!fabricated.length) break;
    const cutList = fabricated.map((q) => `"${q.text}"`).join(", ");
    regenerations.push({ kind: "rejectfab", round: round + 1, detail: cutList.slice(0, 200) });
    onNote?.(`⟂ voice (${round + 1}/${REJECTFAB_ROUNDS}): ${fabricated.length} quotation(s) not found in the material (${cutList.slice(0, 80)}) — regenerating.\n`);
    const retry = [...messages, { role: "assistant", content: text }, {
      role: "user",
      content: `Your previous answer quoted words not found in the material: ${cutList}. These are the questioner's own words, not the material's — remove them. Quote or restate only what the material after the MATERIAL marker actually says, or say plainly what it does not say.`,
    }];
    text = await askOllama(retry, (t) => process.stdout.write(t));
    process.stdout.write("\n");
    report = offered.length ? verifyQuotes(text, offered) : { quotes: [] };
  }

  // the veil: a proper-noun name token in the model's own prose (outside
  // the grounded quotes) is a leak — one regeneration, never a silent strip
  const leaked = [];
  for (const r of comp.routed) {
    const rec = loadCastLazy().get(r.handle.toLowerCase());
    if (!rec) continue;
    const tokens = veilTokens(rec, material, otherExcerpts(rec, loadCastLazy()));
    const groundedQuotes = report.quotes.filter((q) => q.status === "verbatim" || q.status === "drifted").map((q) => String(q.text ?? "").toLowerCase());
    const outside = groundedQuotes.reduce((t, q) => t.replaceAll(q, ""), text.toLowerCase());
    const outsideOriginal = groundedQuotes.reduce((t, q) => t.replaceAll(q, ""), text);
    for (const t of tokens) {
      if (!outside.includes(t)) continue;
      const cap = t[0].toUpperCase() + t.slice(1);
      if (outsideOriginal.includes(cap)) leaked.push(t);
    }
  }
  const uniqueLeaks = [...new Set(leaked)];
  if (uniqueLeaks.length) {
    regenerations.push({ kind: "veil", detail: uniqueLeaks.join(", ") });
    onNote?.(`⟂ voice: the response named who speaks (${uniqueLeaks.join(", ")}) — regenerating without the name.\n`);
    const retry = [...messages, { role: "assistant", content: text }, {
      role: "user",
      content: `Your previous answer named people (${uniqueLeaks.join(", ")}). Name NO person at all — not the author, not the recorder, not any disciple or figure, not anyone. Speak from the words alone.`,
    }];
    text = await askOllama(retry, (t) => process.stdout.write(t));
    process.stdout.write("\n");
  }

  const grounded = report.quotes.filter((q) => q.status === "verbatim" || q.status === "drifted");
  return {
    text,
    record: {
      schema: "VoiceTurn@1",
      mode: "voice",
      routed: comp.routed.map((r) => ({ handle: r.handle, role: r.role })),
      materialKind: comp.materialKind,
      model: MODEL,
      temp: TEMP,
      regenerations,
      grounding: { quotesSupported: grounded.length, quotesTotal: report.quotes.length, fabricatedAfterRepair: report.quotes.filter((q) => q.status === "unlocated").length },
      disclosure: "pathos: the routed archons' jurisdictions frame the answer; no name reaches the model or the response; logos is untouched",
    },
  };
}

export async function speakEnvelope(env, cast, { turn, onNote = null } = {}) {
  if (env.aporia || !env.activation.length) {
    return {
      text: "I do not know — nothing in the words I hold answers to that. A gap is an answer.",
      record: {
        schema: "VoiceTurn@1",
        mode: "aporia",
        aporia: true,
        aporiaReasons: env.aporiaReasons,
        model: MODEL,
        drawn: false,
      },
    };
  }
  const experts = routedExperts(env);
  if (!experts.strong.length) {
    // only weak pointers: named in the record, never a ground to speak from
    return {
      text: "I do not know — only pointers to other records were found, and a pointer is not a ground. A gap is an answer.",
      record: {
        schema: "VoiceTurn@1",
        mode: "weak-pointer",
        pointers: experts.weak.map((a) => a.handle),
        model: MODEL,
        drawn: false,
      },
    };
  }
  const comp = composePrompt(experts, cast, turn, { priorTurn: env.consumption?.consumed ? env.consumption.of : null });
  if (comp.refused) return { refused: comp.refused };
  return drawRouted(comp, turn, { onNote });
}