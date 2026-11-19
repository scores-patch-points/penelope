// perspective-eva.mjs — EVA, said once: two things are EQUIVALENT, for this perspective, when there is no difference that makes a difference.
//
// Not a similarity score and not a count of matches. A PERSPECTIVE declares what it would use the texts for: a set of PROBES (a question it asks of
// each side: the area, the birth year, which region it sits under, who built what). A DIFFERENCE MAKES A DIFFERENCE for a perspective exactly when a
// probe the perspective declared gets different answers from the two sides. Differences in anything the perspective did not declare (wording, order,
// language, a fact it never asks) make none, and are ignored on purpose. That is what "for this perspective" means: the same two texts can be
// equivalent for one perspective and different for another.
//
// Honesty about silence. A probe a side cannot answer is SILENT (a typed hole, never agreement). A probe with no measured POWER (it has never been seen to
// differ between things known not to be equivalent: `power` = the measured rate, from a seeded null, at which it separates non-equivalent pairs) cannot
// support equivalence, because absence of a difference found by a probe that could not have found one is not evidence. So:
//   different   an answered probe differs (a difference that makes a difference was found; cite it with the addresses it was read from)
//   equivalent  no answered probe differs AND at least one answered probe has power > 0 (the attempt to find a difference could have succeeded and did not)
//   gap         otherwise (every probe silent, or only powerless probes answered): no verdict; the caller defaults to Other
//
//   judgeEquivalence({ perspective, a, b }) -> { verdict, for, differences, agreements, silent, powerless, why }
//   perspective  { name, terrain: Lens|Paradigm|Atmosphere, frame, probes: [{ name, lands: <terrain>, power, same?(x, y) }] }       probes are the DECLARED questions; `same` defaults to strict equality
//   a, b         { probeName: { value, addr? } | null }                  the answers each side's reading gave (null or missing = silent)
// WHERE A PERSPECTIVE LIVES (the cube, native/kernel/cube.js). A perspective is a thing of the third domain (Interpretation: what things mean), so it declares
// which of its three terrains it is at, by grain: "Lens" (a specific standpoint reading, a verdict), "Paradigm" (a standing system of what counts as a
// difference; changed only by REC) or "Atmosphere" (the ambient standard of meaning that makes some readings obvious: the FRAME). Its probes land on terrains
// of the other domains (area on Entity, region on Link, ...): `lands` names where. Two perspectives are comparable only at the same terrain AND under the same
// frame; otherwise there is no verdict, because a difference between a Lens and a Paradigm, or between standards of meaning, is a category mix-up, not a difference
// that makes a difference.
export const TERRAINS = Object.freeze(["Void", "Entity", "Kind", "Field", "Link", "Network", "Atmosphere", "Lens", "Paradigm"]);
export const INTERPRETATION = Object.freeze(["Atmosphere", "Lens", "Paradigm"]);
export const comparable = (p, q) => !!p?.terrain && p.terrain === q?.terrain && (p.frame ?? null) === (q.frame ?? null);
export function judgeEquivalence({ perspective, a = {}, b = {} } = {}) {
  const probes = perspective?.probes;
  if (perspective && !INTERPRETATION.includes(perspective.terrain)) return { verdict: "gap", for: perspective?.name ?? null, why: `a perspective must declare an Interpretation terrain (${INTERPRETATION.join(", ")}); got ${perspective.terrain ?? "none"}`, differences: [], agreements: [], silent: [], powerless: [] };
  const bad = (probes ?? []).find((p) => p.lands && !TERRAINS.includes(p.lands));
  if (bad) return { verdict: "gap", for: perspective.name, why: `probe ${bad.name} lands on an unknown terrain ${bad.lands}`, differences: [], agreements: [], silent: [], powerless: [] };
  if (!perspective?.name || !Array.isArray(probes) || !probes.length) return { verdict: "gap", for: perspective?.name ?? null, why: "no perspective or no declared probes: nothing could make a difference", differences: [], agreements: [], silent: [], powerless: [] };
  const differences = [], agreements = [], silent = [], powerless = [];
  for (const p of probes) {
    const x = a[p.name]?.value, y = b[p.name]?.value;
    if (x == null || y == null) { silent.push({ probe: p.name, side: x == null && y == null ? "both" : x == null ? "a" : "b" }); continue; }
    const same = typeof p.same === "function" ? p.same(x, y) : x === y;
    const row = { probe: p.name, a: x, b: y, addr: { a: a[p.name]?.addr ?? null, b: b[p.name]?.addr ?? null }, power: p.power ?? 0 };
    if (!same) { differences.push(row); continue; }
    if (!(p.power > 0)) { powerless.push(row); continue; }
    agreements.push(row);
  }
  if (differences.length) return { verdict: "different", for: perspective.name, differences, agreements, silent, powerless, why: `${differences.length} probe(s) the perspective declared found a difference that makes a difference` };
  if (agreements.length) return { verdict: "equivalent", for: perspective.name, differences, agreements, silent, powerless, why: `${agreements.length} probe(s) with power could have found a difference and did not` };
  return { verdict: "gap", for: perspective.name, differences, agreements, silent, powerless, why: silent.length === probes.length ? "every probe is silent" : "the only answered probes have no measured power" };
}
export const KINDS = Object.freeze({
  "equivalence-verdict": { cell: "EVA·Figure", why: "equivalent / different / gap for a declared perspective: no difference that makes a difference among the perspective's own probes; silent and powerless probes are listed, never counted as agreement" },
  "perspective": { cell: "DEF·Ground", why: "a declared perspective: its probes and their measured power, bylined and fixed before either side is read" },
});
