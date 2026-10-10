// organs/generation/adapters/page.mjs — THE PAGE FORM ADAPTER (2026-10-10).
//
// An HTML PAGE is a Pattern: the mouth phrases one self-contained element per
// unit (a <section class="fold-unit">), the snip keeps each element balanced
// at its byte span via the html-snip organ, and ASSEMBLY shells the drawn
// fragments into a full document. The test admits only sections whose quote
// markers resolve to the hunt's own byte addresses (mouth-last: reuse what the
// Ground already holds; the mouth writes only the swept prose around it).
import { groundFromRead } from "../ground.mjs";
import { tokens, span } from "../../html-snip.mjs";

export const PAGE_ADAPTER_SCHEMA = "PageForm@1";
const MARKER = /⟦([^⟧]+)@(\d+)⟧/g;
const markersOf = (s) => [...String(s ?? "").matchAll(MARKER)].map((m) => ({ source: m[1], abs: Number(m[2]) }));

const groundOf = (ctx) => (ctx.ground ??= ctx?.read ? groundFromRead({ sourceText: ctx.sourceText, sourceId: ctx.sourceId ?? "fold:ground", topic: ctx.topic ?? "", read: ctx.read }) : null);

/** The first top-level element of a drawn HTML unit, kept balanced to its close. */
function firstElement(html) {
  const toks = tokens(html);
  const open = toks.findIndex((t) => t.type === "tag" && !t.closing);
  if (open < 0) return { ok: false, gap: "no element in the draw" };
  const s = span(toks, open);
  if (!s.ok) return { ok: false, gap: s.gap };
  const raw = String(html ?? "").slice(s.start, s.end);
  return { ok: true, fragment: raw.trim(), name: toks[open].name, toks };
}

export const adapter = {
  kind: "page",
  ext: "html",
  mouthTokens: 320,

  readUnits(task, ctx) {
    const g = groundOf(ctx);
    if (!g) return [{ name: "section", spec: `emit one <section> element for: ${task}` }];
    const units = [{ name: "page-lede", spec: `Emit one <section class="fold-unit"><h2>…</h2><p>…</p></section> on “${g.topic || task}” naming the cast — ${g.cast.join(", ") || "none yet"} — with one hunt marker verbatim in the paragraph.` }];
    for (let k = 0; k < Math.min(3, g.hunt.length); k += 1) {
      const h = g.hunt[k];
      units.push({ name: `section-${k + 1}`, spec: `Emit one <section class="fold-unit"><h2>…</h2><p>…</p></section> on how “${h.s}” ${h.v} ${h.o ?? "…"} — keep the marker ${h.marker} verbatim in the paragraph.` });
    }
    return units;
  },

  mouthFragment(unit, atom) {
    return `You are the mouth of a fold. Speak ONLY what the ground holds; never reason or invent a name (khora FOLD II.9).\n\nEmit the single HTML unit “${unit.name}”: ${unit.spec}\n\nOutput ONLY the element, no fenced block, no explanation. Keep the citation marker exactly as given.`;
  },

  sharpen(unit, atom) { return String(atom ?? unit.spec); },

  snip(out) {
    const s = String(out ?? "").trim();
    if (!s) return null;
    const el = firstElement(s);
    if (!el.ok) return null; // unclosed or missing element: the gate refuses, not this snip
    return el.fragment;
  },

  probeUnit(fn, unit) {
    if (!fn) return { ok: false, detail: "the mouth drew nothing" };
    const m = markersOf(fn).length;
    return m >= 1 ? { ok: true, markers: m, detail: "a marked section" } : { ok: false, detail: "no hunt marker in the section — it cannot be grounded" };
  },

  assemble(drawn, units) {
    const body = String(drawn ?? "").trim();
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fold page</title></head><body>${body}</body></html>`;
  },

  testUnits(code, units, ctx) {
    const html = String(code ?? "");
    const g = groundOf(ctx);
    const sections = (html.match(/<section[^>]*>[\s\S]*?<\/section>/gi) || []);
    if (!/^<!doctype html>/i.test(html.trim()) || sections.length === 0) {
      return { ok: false, reason: "no full page shell or no sections", detail: { sections: sections.length } };
    }
    const unmarked = sections.filter((s) => markersOf(s).length === 0);
    const all = sections.flatMap((s) => markersOf(s));
    const invented = g ? all.filter((m) => !g.huntBytes.has(m.abs)) : [];
    const ok = unmarked.length === 0 && invented.length === 0;
    return {
      ok,
      reason: ok ? `page grounded: ${sections.length} sections, ${all.length} markers resolved to hunt bytes`
        : `page refused: ${unmarked.length} unmarked section${unmarked.length !== 1 ? "s" : ""}${invented.length ? `, ${invented.length} marker${invented.length !== 1 ? "s" : ""} outside the hunt` : ""}`,
      detail: { sections: sections.length, markers: all.length, invented: invented.map((m) => m.abs) },
    };
  },

  toDocument({ code, title }) {
    const html = String(code ?? "");
    if (/^<!doctype html>/i.test(html.trim())) return html;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${String(title ?? "Fold page").replace(/</g, "&lt;")}</title></head><body>${html}</body></html>`;
  },
};

export default adapter;