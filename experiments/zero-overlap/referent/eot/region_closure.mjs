// Which sets of cells can be written EXACTLY as a three-list contract {ops, terrains, stances}? (cube.mjs geometry; no data)
import { OPERATORS, GRAINS, TERRAIN_BY_DOMAIN, STANCE_BY_MODE, actOf } from "/Users/mlacy/Documents/khora-cast/penelope/organs/cube.mjs";
const cells = []; for (const op of OPERATORS) for (const g of GRAINS) { const a = actOf(op); cells.push({ op, g, dom: a.domain, mode: a.mode }); }
const terr = (dom, g) => TERRAIN_BY_DOMAIN[dom][GRAINS.indexOf(g)] ?? TERRAIN_BY_DOMAIN[dom][g];
const stan = (mode, g) => STANCE_BY_MODE[mode][GRAINS.indexOf(g)] ?? STANCE_BY_MODE[mode][g];
const key = (c) => c.op + "." + c.g;
function closure(X) {
  const O = new Set(X.map((c) => c.op)), T = new Set(X.map((c) => terr(c.dom, c.g))), S = new Set(X.map((c) => stan(c.mode, c.g)));
  return cells.filter((c) => O.has(c.op) && T.has(terr(c.dom, c.g)) && S.has(stan(c.mode, c.g)));
}
console.log("sample terrain(Existence,Ground) =", terr("Existence", "Ground"), "| stance(Relate,Figure) =", stan("Relate", "Figure"));
// the reviewer's counterexample
const ex = ["SEG.Figure", "SIG.Figure", "CON.Pattern"].map((k) => cells.find((c) => key(c) === k)); const cl = closure(ex);
console.log("X = {SEG.Figure, SIG.Figure, CON.Pattern}; the three-list contract that covers X also admits:", cl.filter((c) => !ex.includes(c)).map(key).join(", ") || "nothing");
// random subsets: how many are exactly expressible?
let seed = 20261119; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
for (const k of [2, 3, 4, 6, 9, 14]) { let closed = 0, extra = 0; const N = 20000; for (let i = 0; i < N; i++) { const pick = [...cells].sort(() => rnd() - 0.5).slice(0, k); const c = closure(pick); if (c.length === k) closed++; extra += c.length - k; } console.log(`random sets of ${String(k).padStart(2)} cells: exactly expressible as a three-list contract ${(closed / N).toFixed(3)}; mean extra cells admitted ${(extra / N).toFixed(2)}`); }
