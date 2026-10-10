// organs/generation/adapters/talk.mjs — THE TALK FORM ADAPTER (2026-10-10).
//
// TALK is the mouth's own form: a spoken turn is irreducible residue by
// construction (a reply is not in the corpus). With a khora read supplied,
// the turn is framed OVER the Ground — the cast, the deeds, the hunt markers
// — so the mouth phrases what the record holds and never reasons past it
// (khora FOLD II.9). Sealing a talk turn is the SEAL organ's job (verified-byte-
// snips / essay-seam), never this adapter's: this test only refuses a
// nothing-drawn.
import { groundFromRead } from "../ground.mjs";

export const TALK_ADAPTER_SCHEMA = "TalkForm@1";

const groundOf = (ctx) => (ctx.ground ??= ctx?.read ? groundFromRead({ sourceText: ctx.sourceText, sourceId: ctx.sourceId ?? "fold:ground", topic: ctx.topic ?? "", read: ctx.read }) : null);

export const adapter = {
  kind: "talk",
  ext: "txt",
  mouthTokens: 260,

  readUnits(task, ctx) {
    const g = groundOf(ctx);
    const frame = g
      ? `Speak one turn answering “${task}”. You may phrase only what the record holds: cast ${g.cast.join(", ") || "(none yet)"}, deeds ${g.deeds.join(", ") || "(none yet)"}, and these quotable markers you may cite verbatim: ${g.hunt.map((h) => h.marker).join(" ")}. Never reason to a conclusion the record does not carry; a gap is said to be a gap.`
      : `Speak one turn answering “${task}”, honestly: if you have no ground for a claim, say it is ungrounded rather than invent one.`;
    return [{ name: "turn", spec: frame }];
  },

  mouthFragment(unit, atom) {
    return `You are the mouth of a fold. Speak ONLY what the ground holds; never reason or invent (khora FOLD II.9).\n\n${String(atom ?? unit.spec)}\n\nKeep citation markers exactly as given.`;
  },

  sharpen(unit, atom) { return String(atom ?? unit.spec); },

  snip(out) { const s = String(out ?? "").trim(); return s || null; },

  probeUnit(fn) {
    if (!fn) return { ok: false, detail: "the mouth drew nothing" };
    const s = String(fn);
    if (/\bi('?m| am) not (qualified|able to)|i cannot|i can'?t assist/i.test(s)) return { ok: false, detail: "the mouth refused — disclosed, not a pipeline failure" };
    return { ok: true, detail: "a spoken turn drawn" };
  },

  testUnits(code) {
    const text = String(code ?? "").trim();
    return { ok: text.length > 0, reason: text.length > 0 ? "a full turn; sealing is the seal organ's, not this adapter's" : "no turn was drawn", detail: { chars: text.length } };
  },

  toDocument({ code, title }) {
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><body><p>${esc(code).replace(/\n/g, "<br>")}</p></body>`;
  },
};

export default adapter;