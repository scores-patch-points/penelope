// organs/generation/ground.mjs — THE GROUND CONTRACT (2026-10-10).
//
// A khora read is the GROUND of every generation form: the material's own
// bytes, cast, deeds, company edges and quotable byte addresses. This pure
// organ turns a read record into the field the form adapters draw from.
// Mouth-last holds structurally, because the mouth never invents a fact — it
// phrases what the Ground already holds, exactly as the GFP reader's label is
// the text between two recurring figures. Pure. No model. No DOM.
// Node builtins only (Buffer for the UTF-8 byte addresses).
export const GROUND_SCHEMA = "Ground@1";

const normalize = (x) => x == null ? null : String(x).trim().toLowerCase() || null;
const byteOf = (sourceText, charAt) => Buffer.byteLength(String(sourceText ?? "").slice(0, Math.max(0, charAt)));

/** The Ground a khora read produces: { schema, sourceId, topic, bytes, cast,
 *  deeds, hunt, events }. `hunt` is the set of quotable byte addresses the
 *  mouth may cite — an address the hunt never gave is a refused marker. */
export function groundFromRead({ sourceText, sourceId = "fold:ground", topic = "", read = null } = {}) {
  if (!read || typeof read !== "object") return null;
  const sents = Array.isArray(read.sents) ? read.sents : [];
  const clauses = Array.isArray(read.clauses) ? read.clauses : [];
  // The sentence byte address, from the reader's own char offset when it gave
  // one; otherwise recovered by a progressive index search over the source
  // (the reader's own law: a sentence is found at its source position).
  const sentByte = new Map();
  let cursor = 0;
  for (const s of sents) {
    if (!s || typeof s !== "object") continue;
    const text = typeof s.text === "string" ? s.text : "";
    let at = Number.isInteger(s.offset) ? s.offset : -1;
    if (at < 0 && typeof sourceText === "string") { at = sourceText.indexOf(text, cursor); if (at >= 0) cursor = at + text.length; }
    if (at >= 0) sentByte.set(s.order, byteOf(sourceText, at));
  }
  const cast = new Map();
  const deeds = new Map();
  const company = new Map();
  const events = [];
  const subjOf = (c) => normalize(typeof read.subjectRefOf === "function" ? read.subjectRefOf(c) : c?.subject?.head);
  const objOf = (c) => normalize(typeof read.objectRefOf === "function" ? read.objectRefOf(c) : c?.object?.head);
  for (const c of clauses) {
    if (!c || typeof c !== "object") continue;
    const s = subjOf(c);
    const v = normalize(c.verb);
    const o = objOf(c);
    if (!s || !v) continue;
    cast.set(s, (cast.get(s) ?? 0) + 1);
    deeds.set(v, (deeds.get(v) ?? 0) + 1);
    if (o && o !== s) {
      if (!company.has(s)) company.set(s, new Map());
      if (!company.has(o)) company.set(o, new Map());
      company.get(s).set(o, (company.get(s).get(o) ?? 0) + 1);
      company.get(o).set(s, (company.get(o).get(s) ?? 0) + 1);
    }
    events.push({ s, v, o, at: sentByte.get(c.order) ?? -1, delta: Number(c.learning ?? 0) });
  }
  // THE HUNT — only events that a witness survived the surprise floor.
  const floor = Number(read.THR ?? 0);
  const hunt = events
    .filter((e) => e.o && e.at >= 0 && e.delta >= floor)
    .slice(0, 14)
    .map((e) => ({ s: e.s, v: e.v, o: e.o, at: e.at, marker: `⟦${sourceId}@${e.at}⟧` }));
  const topCast = [...cast].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 14).map(([name]) => name);
  const topDeeds = [...deeds].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([verb]) => verb);
  return {
    schema: GROUND_SCHEMA,
    sourceId,
    topic: topic || "",
    bytes: Buffer.byteLength(String(sourceText ?? ""), "utf8"),
    cast: topCast,
    deeds: topDeeds,
    hunt,
    huntBytes: new Set(hunt.map((h) => h.at)),
    events: events.length,
  };
}