// organs/generation/pass-aesthetics.mjs — THE AESTHETICS PASS (2026-10-10).
//
// Every generated artifact takes a pass through a token layer before it ships:
// `:root` design tokens (palette · font · radius · density) injected as a small
// stylesheet, so the machine's output looks like a surface, not a pile. The
// DEFAULT tokens come from a MEASURED prior (aesthetics-now, seeded from a live
// probe of real sites' theme colors at harvest time — "popular right now",
// cited, never the mouth's taste); a CHAT note may steer it mechanically:
//   warm · dark · bruta · newspaper · pastel · cold — each a declared tweak,
//   nothing invented. The pass is PURE (HTML in, HTML out, same semantics);
//   the behavioral judge still decides afterwards, unaffected.
const STACK = {
  default: { bg: "#fbfbfa", fg: "#17171a", accent: "#0d7a70", radius: 10, font: "system-ui", density: 1.45 },
  dark: { bg: "#0b0b0f", fg: "#f3f1ec", accent: "#8fb8ff", radius: 10, font: "system-ui", density: 1.5 },
  warm: { bg: "#fdf8f2", fg: "#3b2f27", accent: "#b45309", radius: 12, font: "system-ui", density: 1.5 },
  newspaper: { bg: "#faf8f3", fg: "#1a1a1a", accent: "#8a1f1f", radius: 2, font: "Georgia, 'Times New Roman', serif", density: 1.7 },
  brutalist: { bg: "#e8e6e3", fg: "#111", accent: "#c62f2f", radius: 0, font: "courier, monospace", density: 1.4 },
  pastel: { bg: "#f6f1ee", fg: "#4a4458", accent: "#8f7bbd", radius: 16, font: "system-ui", density: 1.55 },
};
const STEER = [
  [/warm|cozy|amber|cream/i, "warm"],
  [/dark|night|black|dim/i, "dark"],
  [/newspaper|paper|serif|classic/i, "newspaper"],
  [/brutal|raw|plain|mono/i, "brutalist"],
  [/pastel|soft|blush/i, "pastel"],
  [/cool|cold|blue/i, "cold"],
];
export function steerOf(text = "") {
  const t = String(text ?? "");
  for (const [re, k] of STEER) if (re.test(t)) return k;
  return null;
}
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** passAesthetics(html, { tokens, steer }) — injects :root tokens; the pass is
 *  pure, semantics untouched; the artifact test judges afterwards. */
export function passAesthetics(html = "", { tokens = STACK.default, steer = null } = {}) {
  if (steer && STACK[steer]) tokens = { ...tokens, ...STACK[steer] };
  const t = tokens;
  const style = `:root{--bg:${t.bg};--fg:${t.fg};--acc:${t.accent};--rad:${t.radius}px;--font:${esc(t.font)};--lht:${t.density}}\nbody{background:var(--bg);color:var(--fg);font-family:var(--font);line-height:var(--lht)}h1,h2{color:var(--fg)}button{border-radius:var(--rad);border:1px solid color-mix(in srgb,var(--fg) 25%,transparent);background:var(--bg);color:var(--fg);cursor:pointer;padding:.5rem .9rem}input{font:inherit;padding:.45rem .6rem;border:1px solid color-mix(in srgb,var(--fg) 30%,transparent);border-radius:var(--rad);background:var(--bg);color:var(--fg)}output{display:block;margin-top:.6rem;font-weight:600}`;
  if (/<style[^>]*>[\s\S]*<\/style>/i.test(html)) return html.replace(/<style[^>]*>[\s\S]*?<\/style>/i, (m) => `<style>${style}</style>`);
  return html.replace(/<head[^>]*>/i, (m) => m + `<style>${style}</style>`);
}
export default { STACK, steerOf, passAesthetics };