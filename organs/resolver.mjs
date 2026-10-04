// resolver.mjs — Organ 7: the taxonomically-complete resolver.
//
// The house's law (no hardcoded numbers, named gaps never invented lists) and
// the cube (closed: 9 operations × 3 grains = 27 cells, one declared void)
// make the taxonomy of "any arbitrary generation task" COMPLETE not by
// enumeration but by closure: every task lands in exactly one cell of the
// closed cube, and each cell routes (box / measure / field / hunt / mouth) or
// IS a named void. A task that lands in an unrouteable cell fails loudly
// naming the cell (GL-OG-08) — never a silent pass, never an invented list.
//
// Pure. No model. No DOM. Dependency-free.
export const RESOLVER_SCHEMA = "Resolver@1";

export const OPERATIONS = ["NUL", "SIG", "INS", "SEG", "CON", "SYN", "DEF", "EVA", "REC"];
export const GRAINS = ["Ground", "Figure", "Pattern"];

// The verbs and materials that NAME an operation / grain / modality. The
// classifier reads the task's own words (frame), it never pattern-guesses a
// rigid format (Kleenup's law: a decoder parses a structure, never a regex
// over the model's echo).
const OP_WORDS = {
  NUL: ["void", "gap", "empty", "missing", "absent", "nothing", "lack"],
  SIG: ["read", "point", "locate", "address", "find", "scan", "look", "ocr", "measure"],
  INS: ["draw", "generate", "seed", "invent", "write", "new", "invent"],
  SEG: ["cut", "snip", "extract", "slice", "segment", "trim", "scrape", "reuse"],
  CON: ["match", "connect", "field", "library", "lookup", "reuse", "map"],
  SYN: ["assemble", "render", "build", "compose", "page", "app", "html", "weave", "widget"],
  DEF: ["define", "settle", "spec", "declare", "classify", "name", "schedule"],
  EVA: ["test", "gate", "check", "verify", "probe", "judge", "falsify", "grade"],
  REC: ["record", "log", "eot", "stamp", "swatch", "history", "write-down", "ledger"],
};
const GRAIN_WORDS = {
  Ground: ["data", "feed", "bytes", "raw", "material", "source", "json", "api"],
  Figure: ["function", "unit", "item", "part", "element", "module", "method"],
  Pattern: ["page", "app", "layout", "shape", "template", "system", "screen", "widget"],
};
const MODALITY_WORDS = {
  image: ["png", "jpg", "jpeg", "gif", "webp", "screenshot", "drawing", "image", "sketch"],
  html: ["html", "markup", "page", "doctype", "tag"],
  code: ["js", "py", "module", "function", "code", "javascript", "python"],
  data: ["feed", "json", "api", "csv", "list", "meeting", "launch"],
  prose: ["essay", "prose", "paragraph", "story", "explain", "write about"],
};

const esc = (s) => String(s ?? "").toLowerCase().replace(/\W+/g, " ");
function score(text, map) {
  const t = esc(text);
  let best = null, bestN = 0;
  for (const [k, words] of Object.entries(map)) {
    const n = words.reduce((a, w) => a + (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t) ? 1 : 0), 0);
    if (n > bestN) { best = k; bestN = n; }
  }
  return { best, n: bestN };
}

export function classify(task, { attachment = null } = {}) {
  const t = String(task ?? "");
  const a = String(attachment ?? "").toLowerCase();
  const op = score(t, OP_WORDS);
  const grain = score(t, GRAIN_WORDS);
  const mod = (a ? (MODALITY_WORDS.image.includes(a.split(".").pop()) ? "image" : score(a, MODALITY_WORDS).best) : score(t, MODALITY_WORDS).best) ?? "prose";
  const cell = {
    op: op.best && op.n > 0 ? op.best : "SYN",
    grain: grain.best && grain.n > 0 ? grain.best : "Pattern",
    modality: mod,
  };
  return { cell, route: routeOf(cell), op: { ...op }, grain: { ...grain }, modality: mod };
}

// The closed routing table: every (op, grain) cell routes or is a named void.
// DEF·Ground is the house's declared empty cell ("no workable specimen yet").
export function routeOf({ op, grain, modality }) {
  if (op === "DEF" && grain === "Ground") return { route: "void", gap: "DEF·Ground — the house's declared empty cell, no workable specimen yet" };
  if (modality === "image") return { route: "measure" };                       // image→page: look.js, no model
  if (modality === "html") return { route: "box", executor: "html:snip" };     // reuse markup at its address
  if (modality === "data") return { route: "box", executor: "feed" };          // feed→list: window+agenda organs
  if (modality === "code") {
    if (op === "SEG" || op === "CON") return { route: "box", executor: "html:snip" };
    return { route: "engine" };                                                // discrete module: /v1/ask → /v1/code
  }
  if (op === "SYN" || op === "INS") return { route: "engine" };
  if (op === "REC") return { route: "box", executor: "record" };
  if (op === "EVA") return { route: "box", executor: "probe" };
  return { route: "mouth" };                                                   // the irreducible residue, last
}

export function selftest() {
  const t = (n, c) => { if (!c) { console.error("FAIL", n); process.exitCode = 1; } else console.log("ok", n); };
  // closure: all 27 cells enumerated, each routed or a declared void
  const all = [];
  for (const op of OPERATIONS) for (const g of GRAINS) {
    const r = routeOf({ op, grain: g, modality: "prose" });
    t(`${op}·${g} routed or void`, !!r.route && (r.route === "void" ? !!r.gap : true));
    all.push(`${op}·${g}:${r.route}`);
  }
  const voids = all.filter((x) => x.endsWith(":void"));
  t("exactly one declared void", voids.length === 1 && voids[0].startsWith("DEF·Ground"));
  // routing by material
  t("image → measure", classify("turn this screenshot into a page", { attachment: "sketch.png" }).route.route === "measure");
  t("html → box:snip", classify("extract the #launches block of that html page", { attachment: "page.html" }).route.executor === "html:snip");
  t("data feed → box:feed", classify("show upcoming council meetings as a feed", { attachment: "events.json" }).route.executor === "feed");
  t("code module → engine", classify("write a module with two functions parseDate and fmtDuration", { attachment: "x.js" }).route.route === "engine");
  t("DEF·Ground is the void, loudly", classify("define the raw material spec for the new apparatus").route.route === "void");
  t("prose INS routes to the engine (the mouth draws only residue)", classify("invent a new poem about the sea").route.route === "engine");
}