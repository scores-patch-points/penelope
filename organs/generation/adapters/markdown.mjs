// organs/generation/adapters/markdown.mjs — THE MARKDOWN FORM ADAPTER (2026-10-10).
//
// A markdown DOCUMENT is a Pattern cut over the Ground: the mouth phrases
// factual paragraphs while the hunt's citation markers ⟦source@abs⟧ stay
// verbatim in the prose, and the test admits only units whose every marker
// resolves to a byte address the hunt actually gave. The mouth never reasons
// (khora FOLD II.9): the spec hands it the facts the Ground already holds.
// Pure apart from the engine's draw; Node builtins only.
import { groundFromRead } from "../ground.mjs";

export const MARKDOWN_ADAPTER_SCHEMA = "MarkdownForm@1";
const MARKER = /⟦([^⟧]+)@(\d+)⟧/g;
const markersOf = (s) => [...String(s ?? "").matchAll(MARKER)].map((m) => ({ source: m[1], abs: Number(m[2]) }));

const groundOf = (ctx) => (ctx.ground ??= ctx?.read ? groundFromRead({ sourceText: ctx.sourceText, sourceId: ctx.sourceId ?? "fold:ground", topic: ctx.topic ?? "", read: ctx.read }) : null);

export const adapter = {
  kind: "markdown",
  ext: "md",
  mouthTokens: 320,

  readUnits(task, ctx) {
    const g = groundOf(ctx);
    if (!g) return [{ name: "document", spec: `write a markdown document about: ${task}` }];
    const units = [{ name: "lede", spec: `Phrase one markdown paragraph: the topic “${g.topic || task}” and its cast — ${g.cast.join(", ") || "none yet"} — citing at least one hunt marker verbatim.` }];
    for (let k = 0; k < Math.min(3, g.hunt.length); k += 1) {
      const h = g.hunt[k];
      units.push({ name: `paragraph-${k + 1}`, spec: `Phrase one markdown paragraph on how “${h.s}” ${h.v} ${h.o ?? "…"} — keep the marker ${h.marker} verbatim as this paragraph's quote.` });
    }
    if (g.cast.length) units.push({ name: "turn", spec: `Phrase one closing markdown paragraph naming the cast — ${g.cast.join(", ")} — as what the record returns to.` });
    return units;
  },

  mouthFragment(unit, atom) {
    return `You are the mouth of a fold. Speak ONLY what the ground holds; never reason, infer, or add a name the ground does not carry (khora FOLD II.9).\n\nWrite the single markdown unit “${unit.name}” as one paragraph:\n${unit.spec}\n\nKeep every citation marker exactly as given. Plain markdown only.`;
  },

  sharpen(unit, atom, why) { return String(atom ?? unit.spec); },

  snip(out) {
    const s = String(out ?? "").replace(/^```[a-z]*\n?|```$/gi, "").trim();
    return s || null;
  },

  probeUnit(fn, unit) {
    if (!fn) return { ok: false, detail: "the mouth drew nothing" };
    const n = markersOf(fn).length;
    return n >= 1 ? { ok: true, markers: n, detail: "at least one citation marker present" } : { ok: false, detail: "no citation marker — the paragraph cannot be grounded" };
  },

  testUnits(code, units, ctx) {
    const text = String(code ?? "");
    const g = groundOf(ctx);
    const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const unmarked = paragraphs.filter((p) => markersOf(p).length === 0);
    const all = paragraphs.flatMap((p) => markersOf(p));
    const invented = g ? all.filter((m) => !g.huntBytes.has(m.abs)) : [];
    const ok = paragraphs.length >= 1 && unmarked.length === 0 && invented.length === 0;
    return {
      ok,
      reason: ok ? `markdown grounded: ${paragraphs.length} paragraphs, ${all.length} markers resolved to hunt bytes`
        : `markdown refused: ${unmarked.length} paragraph${unmarked.length !== 1 ? "s" : ""} without a marker${invented.length ? `, ${invented.length} marker${invented.length !== 1 ? "s" : ""} at an address the hunt never gave` : ""}`,
      detail: { paragraphs: paragraphs.length, markers: all.length, invented: invented.map((m) => m.abs) },
    };
  },

  toDocument({ code, title }) {
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><body><pre>${esc(code)}</pre></body>`;
  },
};

export default adapter;