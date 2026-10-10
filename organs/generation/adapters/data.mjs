// organs/generation/adapters/data.mjs — THE DATA FORM ADAPTER (2026-10-10).
//
// A JSON DATA record is the Ground itself, box-first: when a khora read is
// supplied, the record is COMPUTED from it (cast, deeds, hunt, events) with
// zero mouth draws — data → box:feed is already the resolver's own routing
// for the data modality. Only when no Ground exists does the record ask the
// mouth for the residue, and a field-owned record is dropped rather than kept
// if the mouth drifts from what the Ground could carry.
import { groundFromRead } from "../ground.mjs";

export const DATA_ADAPTER_SCHEMA = "DataForm@1";

const groundOf = (ctx) => (ctx.ground ??= ctx?.read ? groundFromRead({ sourceText: ctx.sourceText, sourceId: ctx.sourceId ?? "fold:ground", topic: ctx.topic ?? "", read: ctx.read }) : null);

const recordOf = (task, g) => g
  ? { schema: "GeneratedData@1", sourceId: g.sourceId, topic: g.topic || task, bytes: g.bytes, cast: g.cast, deeds: g.deeds, events: g.events, hunt: g.hunt.map((h) => ({ marker: h.marker, s: h.s, v: h.v, o: h.o })) }
  : { schema: "GeneratedData@1", intent: String(task ?? "").trim() };

export const adapter = {
  kind: "data",
  ext: "json",

  readUnits(task, ctx) {
    const g = groundOf(ctx);
    return [{ name: "record", spec: g ? "the record of this ground — cast, deeds, hunt, events" : `the JSON record of: ${task}` }];
  },

  autofill(unit, ctx) {
    const g = groundOf(ctx);
    if (!g) return null; // no Ground: the mouth draws the residue
    return { code: JSON.stringify(recordOf(ctx.topic ?? "", g), null, 2), address: `ground:${g.sourceId}` };
  },

  mouthFragment(unit, atom) {
    return `You are the mouth of a fold. Emit ONLY a JSON object with keys schema, intent, and any named fields the ask needs. Never reason; emit data. Ask: ${unit.spec}`;
  },

  sharpen(unit, atom) { return String(atom ?? unit.spec); },

  snip(out) {
    const s = String(out ?? "").replace(/^````?json\b|````?$/gi, "").trim();
    if (!s) return null;
    try { return JSON.stringify(JSON.parse(s)); } catch { return s; }
  },

  probeUnit(fn) {
    if (fn == null) return { ok: false, detail: "nothing drawn" };
    try { JSON.parse(fn); return { ok: true, detail: "the record parses as JSON" }; }
    catch (e) { return { ok: false, detail: "not valid JSON: " + String(e?.message ?? e).slice(0, 80) }; }
  },

  testUnits(code) {
    try {
      const j = JSON.parse(String(code ?? ""));
      const required = ["schema"];
      const missing = required.filter((k) => !(k in j));
      const ok = missing.length === 0;
      return { ok, reason: ok ? `data record valid (schema ${j.schema})` : `record missing keys: ${missing.join(", ")}`, detail: { keys: Object.keys(j) } };
    } catch (e) {
      return { ok: false, reason: "the record is not valid JSON: " + String(e?.message ?? e).slice(0, 120) };
    }
  },

  toDocument({ code, title }) {
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><body><pre>${esc(code)}</pre></body>`;
  },
};

export default adapter;