// organs/generation/adapters/widget.mjs — THE WIDGET FORM ADAPTER (2026-10-10).
//
// A WIDGET is a small interactive page: inputs, a control, and an output wired
// to a pure FACTOR. The factor is the mechanical lane: the caller's declaration
// (`ctx.factor` — name, expression over its argument names, labels, examples)
// lets the BOX compute the function, so a solveable widget is built with ZERO
// draws. The interface is templated from the factor's own signature, and the
// test is the BEHAVIORAL JUDGE (behavior-check.mjs judgePage): the page's own
// factors are driven with cases whose wants the box settled — a widget that
// renders but computes wrong is refused, and every act of that judgement sits
// on one of the 27 cube cells.
//
// MOUTH-LAST: the factor and the interface, when the box can settle them, are
// autofilled (stage `field`, address `box:…`); the mouth is never consulted for
// what the box holds. A factor the box cannot settle is the CALLER's typed gap
// (readUnits returns no units → the engine's void path), never an invention.
import { judgePage } from "../../behavior-check.mjs";

export const WIDGET_ADAPTER_SCHEMA = "WidgetForm@1";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** The factor, computed by the box: a pure function over its named args, under
 *  the box's DISCLOSED rounding convention (2 decimals — the same convention
 *  wantOf settles the expected value with, so artifact and judge agree). */
export function factorCode(f) {
  const r = Number.isInteger(f.round) ? f.round : 2;
  const p = 10 ** r;
  return `function ${f.name}(${f.args.join(", ")}) { return Math.round((${f.expr}) * ${p}) / ${p}; }`;
}
/** The interface, templated from the factor's signature: one number input per
 *  arg, a button, an output — the click contract is the factor. When a real
 *  formatter was SNIPPED from existing work (ctx.formatter: name + code + a
 *  real address), the output is shown through it; otherwise the box's own
 *  rounding stands. */
export function interfaceHtml(f, fmt = null) {
  const rows = f.args.map((a) => `<label>${esc((f.labels && f.labels[a]) || a)}<input id="in_${esc(a)}" type="number" value="${esc((f.start && f.start[a]) ?? 0)}"></label>`).join("\n    ");
  const call = `${f.name}(${f.args.map((a) => `Number(document.getElementById("in_${a}").value)`).join(", ")})`;
  const show = fmt ? `${fmt.name}(r, "${f.format || "number"}")` : `((typeof r === 'number') ? (Math.round(r*100)/100) : JSON.stringify(r))`;
  return `<section class="widget">
    <h2>${esc(f.title || f.name)}</h2>
    ${rows}
    <button onclick="var r=${call}; document.getElementById('out').textContent = ${show};">Compute</button>
    <output id="out"></output>
  </section>`;
}
const shell = (factor, iface, fmt = null) => `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>widget</title></head>\n<body>\n${iface}\n<script>\n${factor}${fmt ? "\n" + fmt.code : ""}\n</script>\n</body></html>`;

export const adapter = {
  kind: "widget",
  ext: "html",

  readUnits(task, ctx) {
    const f = ctx && ctx.factor;
    if (!f || !f.name || !f.expr || !Array.isArray(f.args) || !f.args.length) return [];
    const units = [
      { name: "factor", spec: `the box computes ${f.name}(${f.args.join(", ")}) = ${f.expr}` },
      { name: "interface", spec: `inputs for ${f.args.join(", ")}, a Compute control, and an output wired to ${f.name}` },
    ];
    if (ctx.formatter?.code) units.splice(1, 0, { name: "format", spec: `show the result through the formatter snipped from ${ctx.formatter.address}` });
    return units;
  },

  autofill(u, ctx) {
    const f = ctx.factor;
    // HUNT-FIRST: a real implementation of the unit, when the caller's own
    // forage found one, is used with its ADDRESS — the box only holds what the
    // real codebases did not.
    if (u.name === "factor") return ctx.factorHunt ? { code: ctx.factorHunt.code, address: ctx.factorHunt.address } : { code: factorCode(f), address: `box:${f.expr}` };
    if (u.name === "format" && ctx.formatter?.code) return { code: ctx.formatter.code, address: ctx.formatter.address };
    if (u.name === "interface") return { code: interfaceHtml(f, ctx.formatter || null), address: ctx.formatter ? `box:form+${ctx.formatter.name}` : "box:form" };
    return null;
  },

  mouthFragment(u, atom) {
    return `Write only the HTML for: ${u.spec}\nOutput the HTML, nothing else.`;
  },

  snip(out) { return String(out ?? "").trim(); },

  probeUnit(code, u, ctx) {
    if (u.name === "factor") {
      const f = ctx.factor;
      try { new Function(`${code}\nreturn ${f.name};`)(); } catch (e) { return { ok: false, detail: `the box's factor does not compile: ${e.message}` }; }
      if (/(document|window|fetch|localStorage)\b/.test(code)) return { ok: false, detail: "the factor touches DOM/IO — not pure" };
      return { ok: true, detail: "a pure factor over its named args" };
    }
    if (u.name === "interface") {
      if (!/<input\b/i.test(code) || !/<button\b/i.test(code) || !/<output\b/i.test(code)) return { ok: false, detail: "the interface lacks an input, a control or an output" };
      return { ok: true, detail: "inputs, a control, an output" };
    }
    if (u.name === "format") {
      if (!/function\s+\w+\s*\(/.test(code)) return { ok: false, detail: "the snipped formatter is not a function" };
      return { ok: true, detail: "a formatter snipped from existing work" };
    }
    return { ok: false, detail: "unknown unit" };
  },

  assemble(drawn, units, ctx) {
    const f = ctx.factor;
    const factor = ctx.factorHunt?.code || factorCode(f);   // the snipe wins; the box holds only the residue
    return shell(factor, interfaceHtml(f, ctx.formatter || null), ctx.formatter || null);
  },

  testUnits(code, units, ctx) {
    const f = ctx.factor;
    const cases = (f.examples || []).map((args) => ({ fn: f.name, args, compute: { expression: f.expr, bind: Object.fromEntries(f.args.map((a, i) => [a, args[i]])) } }));
    const b = judgePage(code, { needs: [f.name], cases });
    return {
      ok: b.ok,
      reason: b.ok ? `widget held: ${b.observations.length} cube-tied acts, ${cases.length} box-settled case(s)` : `widget refused: ${b.findings.slice(0, 3).map((x) => `${x.kind}${x.detail ? " · " + x.detail : ""}`).join("; ")}`,
      detail: { findings: b.findings, observations: b.observations },
    };
  },

  toDocument({ code }) { return code; },
};

export default adapter;