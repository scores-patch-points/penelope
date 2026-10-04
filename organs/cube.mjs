// organs/cube.mjs — the EO cube, as Penelope's coordinate system. PURE: no
// imports, no model, no DOM. Schema CubeAddress@1.
//
// Provenance (GL-OG-07: portable, so copied with its pin): the grid below is
// eoreader7/native/kernel/cube.js (last touched 6a11c1d, 2026-09-17) — MODES,
// DOMAINS, GRAINS, OP_MODE, OP_DOMAIN, TERRAIN_BY_DOMAIN, STANCE_BY_MODE and
// cellOf, verbatim in meaning. The cell vocabulary and the three empty
// Ground cells are native/docs/THE-27-CELLS.md. Where cube.js and the
// writing-code-in-eo skill's worked examples disagree (the skill writes
// DEF(Lens, Making) and EVA(Lens, Dissecting); cube.js makes DEF a
// Differentiate operator whose Lens stance is Dissecting, and EVA a Relate
// operator whose Lens stance is Binding), cube.js wins, and selftest() pins it.
//
// THE GEOMETRY. 27 cells = 9 operators x 3 grains; nothing else is free.
//   operator = (mode, domain);  stance = (mode, grain);  terrain = (domain, grain)
// The three FACES are the three shadows of the one cube:
//   ACT    (mode x domain)  — the operator itself, WHAT is done
//   SITE   (domain x grain) — the terrain,         WHERE it lands
//   STANCE (mode x grain)   — the stance,          HOW it is done
// Each face carries two of the three axes, so a thing placed on all three
// faces is placed TWICE over on every axis: the faces must agree, and that
// agreement is the guard (coherent(), below) — a checksum, not a convention.
// The grains are the wheel: Ground = Void (hub, 0), Figure = Beings (spokes, n),
// Pattern = Fold (rim, 1) — native/docs/THE-WHEEL.md.
//
// Falsifying control: a tapestry thread whose three faces disagree on an axis
// must come back incoherent (selftest builds each violation and watches it
// fire); a grid that is not 27 distinct addresses, or an operator pair
// (mode, domain) that repeats, is a copy that has drifted from cube.js.

export const SCHEMA = "CubeAddress@1";
export const MODES = Object.freeze(["Differentiate", "Relate", "Generate"]);
export const DOMAINS = Object.freeze(["Existence", "Structure", "Interpretation"]);
export const GRAINS = Object.freeze(["Ground", "Figure", "Pattern"]);

// The helix: the one dependency order of the nine (NUL → … → REC).
export const OPERATORS = Object.freeze(["NUL", "SIG", "INS", "SEG", "CON", "SYN", "DEF", "EVA", "REC"]);

const OP_MODE = Object.freeze({ NUL: "Differentiate", SIG: "Relate", INS: "Generate", SEG: "Differentiate", CON: "Relate", SYN: "Generate", DEF: "Differentiate", EVA: "Relate", REC: "Generate" });
const OP_DOMAIN = Object.freeze({ NUL: "Existence", SIG: "Existence", INS: "Existence", SEG: "Structure", CON: "Structure", SYN: "Structure", DEF: "Interpretation", EVA: "Interpretation", REC: "Interpretation" });

export const TERRAIN_BY_DOMAIN = Object.freeze({
  Existence: Object.freeze({ Ground: "Void", Figure: "Entity", Pattern: "Kind" }),
  Structure: Object.freeze({ Ground: "Field", Figure: "Link", Pattern: "Network" }),
  Interpretation: Object.freeze({ Ground: "Atmosphere", Figure: "Lens", Pattern: "Paradigm" }),
});
export const STANCE_BY_MODE = Object.freeze({
  Differentiate: Object.freeze({ Ground: "Clearing", Figure: "Dissecting", Pattern: "Unraveling" }),
  Relate: Object.freeze({ Ground: "Tending", Figure: "Binding", Pattern: "Tracing" }),
  Generate: Object.freeze({ Ground: "Cultivating", Figure: "Making", Pattern: "Composing" }),
});

// The wheel's names for the three grains, and its arithmetic 0 / n / 1.
export const WHEEL = Object.freeze({ Ground: Object.freeze({ name: "Void", at: "hub", n: "0" }), Figure: Object.freeze({ name: "Beings", at: "spokes", n: "n" }), Pattern: Object.freeze({ name: "Fold", at: "rim", n: "1" }) });

// Marks. The EO glyph for each operator is the canon (∅ ○ ● ｜ ⋈ △ ⊢ ⊨ ↬); the
// MARK is what a tapestry prints. Measured 2026-10-01 in the GitHub code font
// (gym/glyph-ink.json): ∅ ○ ● △ ↬ are exactly one cell, ⊨ is 1.036, but ⋈ is
// 1.283, ⊢ 1.247 and ｜ 1.661 cells — they would break a framed column — so SEG,
// CON and DEF print as one-cell stand-ins (| → =), the EOT surface marks for
// the same acts (`->` bonds, `.x =` defines). The table keeps both, honestly.
export const GLYPH = Object.freeze({ NUL: "∅", SIG: "○", INS: "●", SEG: "｜", CON: "⋈", SYN: "△", DEF: "⊢", EVA: "⊨", REC: "↬" });
export const MARK = Object.freeze({ NUL: "∅", SIG: "○", INS: "●", SEG: "|", CON: "→", SYN: "△", DEF: "=", EVA: "⊨", REC: "↬" });

export const GRAIN3 = Object.freeze({ Ground: "Gnd", Figure: "Fig", Pattern: "Pat" });
export const GRAIN_OF3 = Object.freeze({ Gnd: "Ground", Fig: "Figure", Pat: "Pattern" });
export const MODE3 = Object.freeze({ Differentiate: "Dif", Relate: "Rel", Generate: "Gen" });
export const DOMAIN3 = Object.freeze({ Existence: "Exi", Structure: "Str", Interpretation: "Int" });

const gap = (type, detail = {}) => Object.freeze({ gap: type, ...detail });

/** cellOf(op, grain) → the whole address, every face derived, nothing chosen. */
export function cellOf(op, grain) {
  if (!OP_MODE[op]) return gap("unknown_spec", { reason: `no such operator: ${op}`, known: OPERATORS });
  if (!GRAINS.includes(grain)) return gap("unknown_spec", { reason: `no such grain: ${grain}`, known: GRAINS });
  const mode = OP_MODE[op], domain = OP_DOMAIN[op];
  return Object.freeze({ schema: SCHEMA, op, grain, mode, domain, terrain: TERRAIN_BY_DOMAIN[domain][grain], stance: STANCE_BY_MODE[mode][grain] });
}

/** The 27, in helix order then grain order. */
export const addresses = () => Object.freeze(OPERATORS.flatMap((op) => GRAINS.map((g) => cellOf(op, g))));

/** The mode/domain an operator sits at on the ACT face. */
export const actOf = (op) => (OP_MODE[op] ? { mode: OP_MODE[op], domain: OP_DOMAIN[op] } : null);

/**
 * coherent({ op, site, stance }) — the event `operator(Site, Stance)`: do the
 * three faces agree? They must share one grain; the operator's domain must be
 * the site's domain; the operator's mode must be the stance's mode.
 * Returns { ok, cell } or { ok: false, why } — never throws.
 */
export function coherent({ op, site, stance } = {}) {
  if (!OP_MODE[op]) return { ok: false, why: `unknown operator ${op}` };
  const siteAt = [];
  for (const d of DOMAINS) for (const g of GRAINS) if (TERRAIN_BY_DOMAIN[d][g] === site) siteAt.push({ domain: d, grain: g });
  const stanceAt = [];
  for (const m of MODES) for (const g of GRAINS) if (STANCE_BY_MODE[m][g] === stance) stanceAt.push({ mode: m, grain: g });
  if (!siteAt.length) return { ok: false, why: `unknown terrain ${site}` };
  if (!stanceAt.length) return { ok: false, why: `unknown stance ${stance}` };
  const s = siteAt[0], t = stanceAt[0];
  if (s.grain !== t.grain) return { ok: false, why: `grain-mixed: ${site} is ${s.grain}, ${stance} is ${t.grain}` };
  if (OP_DOMAIN[op] !== s.domain) return { ok: false, why: `domain: ${op} acts in ${OP_DOMAIN[op]}, ${site} lies in ${s.domain}` };
  if (OP_MODE[op] !== t.mode) return { ok: false, why: `mode: ${op} is ${OP_MODE[op]}, ${stance} is ${t.mode}` };
  return { ok: true, cell: cellOf(op, s.grain) };
}

export function selftest() {
  const out = [];
  const t = (name, ok) => { out.push([name, ok]); if (!ok) throw new Error("cube selftest failed: " + name); };
  const all = addresses();
  t("27 distinct addresses", all.length === 27 && new Set(all.map((c) => `${c.op}.${c.grain}`)).size === 27);
  t("9 operators are 9 distinct (mode, domain) pairs", new Set(OPERATORS.map((o) => `${OP_MODE[o]}/${OP_DOMAIN[o]}`)).size === 9);
  t("27 distinct terrain·stance pairs per grain-row (each terrain 3 cells, each stance 3 cells)", DOMAINS.every((d) => GRAINS.every((g) => all.filter((c) => c.domain === d && c.grain === g).length === 3)));
  const ins = cellOf("INS", "Figure");
  t("INS·Figure is Entity · Making (the mouth's cell)", ins.terrain === "Entity" && ins.stance === "Making");
  const eva = cellOf("EVA", "Pattern");
  t("EVA·Pattern is Paradigm · Tracing (standing across witnesses)", eva.terrain === "Paradigm" && eva.stance === "Tracing");
  t("the helix is NUL…REC in dependency order", OPERATORS.join("") === "NULSIGINSSEGCONSYNDEFEVAREC");
  t("an unknown operator is a typed gap, not a crash", cellOf("ALT", "Figure").gap === "unknown_spec");
  t("INS(Entity, Making) is coherent", coherent({ op: "INS", site: "Entity", stance: "Making" }).ok);
  t("CON(Link, Binding) is coherent", coherent({ op: "CON", site: "Link", stance: "Binding" }).ok);
  t("grain-mixed INS(Void, Making) is refused", /grain-mixed/.test(coherent({ op: "INS", site: "Void", stance: "Making" }).why));
  t("domain violation INS(Atmosphere, Cultivating) is refused", /domain/.test(coherent({ op: "INS", site: "Atmosphere", stance: "Cultivating" }).why));
  t("mode violation INS(Entity, Binding) is refused", /mode/.test(coherent({ op: "INS", site: "Entity", stance: "Binding" }).why));
  t("cube.js, not the skill's examples: DEF(Lens, Making) is refused", coherent({ op: "DEF", site: "Lens", stance: "Making" }).ok === false && coherent({ op: "DEF", site: "Lens", stance: "Dissecting" }).ok);
  t("EVA(Lens, Dissecting) is refused; EVA(Lens, Binding) holds", coherent({ op: "EVA", site: "Lens", stance: "Dissecting" }).ok === false && coherent({ op: "EVA", site: "Lens", stance: "Binding" }).ok);
  t("every mark is one character", OPERATORS.every((o) => [...MARK[o]].length === 1));
  return { schema: SCHEMA, checks: out.length, ok: true };
}
