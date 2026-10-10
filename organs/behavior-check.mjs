// behavior-check.mjs — Organ 2: controls that do things, without a browser.
//
// There is no screenshot path and no DOM here, so behavior is checked at
// the layer the app FACTORS it: the app must expose its interactive logic
// as named pure functions on the page (filterLaunches(q, items),
// resolveDetail(id, items), ...). This organ (a) checks the factors exist
// and are pure (same input twice => same output, no DOM touched), and
// (b) executes declared cases against them. A drawn control with no
// factor fails — that is the open gap from ONE-PIPELINE, now caught.
//
// source: JS text of the page's <script> (or the factored module).
// cases: [{ fn, args, want }] — want compared by JSON. A case may instead
//        carry `compute` ({kind:"tip", amount, percent} | {expression}) —
//        the BOX then settles the expected value (wantOf), never the mouth.
//
// CUBE TIED (2026-10-10, GL-recorded): every action sits on one of the 27
// cells (organs/cube.mjs). Nothing acts off the cube — each observation
// carries its full address (op · grain · mode · domain · terrain · stance).
//   SIG·Figure  Entity · Binding      the factor hunt (the artifact's beings)
//   EVA·Pattern Paradigm · Tracing    the purity probe (same input twice = two witnesses)
//   EVA·Figure  Lens · Binding        a declared case run (one verification at one lens)
//   DEF·Pattern Paradigm · Unraveling the box computes the expected value (wantOf)
//   REC·Figure  Lens · Making         every observation is set down at its lens
//   NUL·Figure  Entity · Dissecting   a being (factor/control) is absent
//   NUL·Ground  Void · Clearing       nothing could run (no source at all)
// A want the box cannot settle is a typed refusal at DEF·Pattern — it is
// never sent to the mouth for an answer. Falsifying control: a case judged
// "ok" whose want was not box-settled, or an observation whose three faces
// disagree on an axis, concedes the rule.
import { cellOf, coherent } from "./cube.mjs";

export const BEHAVIOR_CHECK_SCHEMA = "BehaviorCheck@1";
export const ACT_CELL = Object.freeze({
  hunt: "SIG",
  purity: "EVA",
  case: "EVA",
  want: "DEF",
  record: "REC",
  absent: "NUL",
  empty: "NUL",
});
export const ACT_GRAIN = Object.freeze({
  hunt: "Figure", purity: "Pattern", case: "Figure", want: "Pattern", record: "Figure", absent: "Figure", empty: "Ground",
});
export const actCell = (kind) => cellOf(ACT_CELL[kind], ACT_GRAIN[kind]);
const line = (c) => `${c.mode} · ${c.terrain} · ${c.stance} (${c.op}·${c.grain})`;
const cellOfRow = (c) => ({ schema: c.schema, op: c.op, grain: c.grain, mode: c.mode, domain: c.domain, terrain: c.terrain, stance: c.stance });

/** The thoughts off the artifact: its script text (inline <script> bodies). Pure. */
export function scriptOf(html) {
  return [...String(html ?? "").matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join("\n");
}

/** The box settles the expected value. Settleable families only; anything else
 *  is a typed refusal at DEF·Pattern — never sent to the mouth. Pure. */
const round2 = (x) => Math.round(x * 100) / 100;
export function wantOf(spec) {
  const s = spec || {};
  if (s.kind === "tip" && Number.isFinite(s.amount) && Number.isFinite(s.percent)) {
    const tip = round2(s.amount * s.percent / 100);
    return { schema: BEHAVIOR_CHECK_SCHEMA, computable: true, want: "box", cell: cellOfRow(actCell("want")), value: { tip, total: round2(s.amount + tip) } };
  }
  if (typeof s.expression === "string") {
    const v = settleExpression(s.expression, s.bind || {});
    if (v !== null) return { schema: BEHAVIOR_CHECK_SCHEMA, computable: true, want: "box", cell: cellOfRow(actCell("want")), value: round2(v) };
  }
  return { schema: BEHAVIOR_CHECK_SCHEMA, computable: false, want: null, cell: cellOfRow(actCell("want")), why: "the box cannot settle this expectation — refused, never drawn" };
}

/** settleExpression(expr, bind) — a tiny, SAFE arithmetic evaluator: numbers,
 *  + - * / and parentheses, with named numbers from `bind`. No properties, no
 *  calls, no eval. Returns a finite number or null (an unsettleable expression
 *  is a typed refusal downstream, never a draw; a zero divisor is a null, not
 *  Infinity). Pure. */
export function settleExpression(expr, bind = {}) {
  const t = String(expr ?? "").replace(/\s+/g, "");
  let i = 0;
  const peek = () => t[i];
  const num = () => { const m = t.slice(i).match(/^\d+(?:\.\d+)?/); if (!m) return null; i += m[0].length; return +m[0]; };
  const prim = () => {
    if (peek() === "(") { i++; const v = expr0(); if (v === null || peek() !== ")") return null; i++; return v; }
    if (peek() === "-") { i++; const v = prim(); return v === null ? null : -v; }
    if (peek() === "+") { i++; return prim(); }
    const nm = t.slice(i).match(/^[A-Za-z_]\w*/);
    if (nm) { i += nm[0].length; return Object.prototype.hasOwnProperty.call(bind, nm[0]) && Number.isFinite(+bind[nm[0]]) ? +bind[nm[0]] : null; }
    return num();
  };
  const term = () => {
    let v = prim(); if (v === null) return null;
    for (;;) { const c = peek(); if (c !== "*" && c !== "/") break; i++; const r = prim(); if (r === null) return null; if (c === "*") v *= r; else { if (r === 0) return null; v /= r; } }
    return v;
  };
  const expr0 = () => {
    let v = term(); if (v === null) return null;
    for (;;) { const c = peek(); if (c !== "+" && c !== "-") break; i++; const r = term(); if (r === null) return null; v = c === "+" ? v + r : v - r; }
    return v;
  };
  const v = expr0();
  return v !== null && i === t.length && Number.isFinite(v) ? v : null;
}

export function check(source, cases, { needs = [] } = {}) {
  const findings = [];
  const observations = [];
  const record = (opts) => {
    const o = { schema: BEHAVIOR_CHECK_SCHEMA, action: opts.action, cell: cellOfRow(opts.cell), target: opts.target ?? null, detail: opts.detail ?? null, ok: !!opts.ok };
    observations.push(o);
    return o;
  };
  const names = new Set([...source.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]));
  for (const n of needs) {
    if (!names.has(n)) {
      const cell = actCell("absent");
      findings.push({ kind: "missing-factor", detail: n, op: cell.op, cell: cellOfRow(cell) });
      record({ action: "hunt", cell, target: n, detail: "no such function", ok: false });
    }
  }
  if (findings.length) return { schema: BEHAVIOR_CHECK_SCHEMA, ok: false, findings, observations };
  let fns;
  try {
    const loader = new Function(`${source}\nreturn { ${needs.join(", ")} };`);
    fns = new Map(Object.entries(loader()));
    for (const n of needs) record({ action: "hunt", cell: actCell("hunt"), target: n, detail: "found", ok: true });
  } catch (e) {
    const cell = actCell("empty");
    findings.push({ kind: "load", detail: String(e.message).slice(0, 160), op: cell.op, cell: cellOfRow(cell) });
    record({ action: "hunt", cell, detail: String(e.message).slice(0, 160), ok: false });
    return { schema: BEHAVIOR_CHECK_SCHEMA, ok: false, findings, observations };
  }
  const domRe = /(document|window|fetch|localStorage)\b/;
  for (const n of needs) {
    const body = (fns.get(n) ?? (() => "")).toString();
    if (domRe.test(body)) {
      const cell = actCell("purity");
      findings.push({ kind: "not-pure", detail: n + " touches DOM/IO", op: cell.op, cell: cellOfRow(cell) });
      record({ action: "purity", cell, target: n, detail: "DOM/IO in body", ok: false });
    }
  }
  if (findings.length) return { schema: BEHAVIOR_CHECK_SCHEMA, ok: false, findings, observations };
  for (const c of cases) {
    const hasWant = Object.prototype.hasOwnProperty.call(c, "want");
    let want, wantCell = actCell("want");
    if (hasWant) want = c.want;
    else {
      const w = c.compute ? wantOf(c.compute) : null;
      if (w && w.computable) { want = w.value; record({ action: "want", cell: actCell("want"), target: c.fn, detail: `box-settled: ${JSON.stringify(want)}`, ok: true }); }
      else {
        const cell = actCell("want");
        findings.push({ kind: "want-unsettleable", detail: `${c.fn}: ${(w && w.why) || "no compute spec"}`, op: cell.op, cell: cellOfRow(cell) });
        record({ action: "want", cell, target: c.fn, detail: "the box cannot settle this want", ok: false });
        continue;
      }
    }
    try {
      const a = fns.get(c.fn)(...c.args);
      const b = fns.get(c.fn)(...c.args);
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        const cell = actCell("purity");
        findings.push({ kind: "impure", detail: c.fn, op: cell.op, cell: cellOfRow(cell) });
        record({ action: "purity", cell, target: c.fn, detail: `run 1 ≠ run 2 (${JSON.stringify(a).slice(0, 80)} vs ${JSON.stringify(b).slice(0, 80)})`, ok: false });
      } else if (JSON.stringify(a) !== JSON.stringify(want)) {
        const cell = actCell("case");
        findings.push({ kind: "wrong", detail: `${c.fn}: got ${JSON.stringify(a).slice(0, 120)} want ${JSON.stringify(want).slice(0, 120)}`, op: cell.op, cell: cellOfRow(cell) });
        record({ action: "case", cell, target: c.fn, detail: `got ${JSON.stringify(a).slice(0, 120)} want ${JSON.stringify(want).slice(0, 120)}`, ok: false });
      } else {
        record({ action: "case", cell: actCell("case"), target: c.fn, detail: `case held: ${JSON.stringify(a).slice(0, 120)}`, ok: true });
      }
    } catch (e) {
      const cell = actCell("case");
      findings.push({ kind: "throws", detail: `${c.fn}: ${String(e.message).slice(0, 120)}`, op: cell.op, cell: cellOfRow(cell) });
      record({ action: "case", cell, target: c.fn, detail: String(e.message).slice(0, 120), ok: false });
    }
  }
  return { schema: BEHAVIOR_CHECK_SCHEMA, ok: findings.length === 0, findings, observations, wantsAreBoxSettled: cases.every((c) => Object.prototype.hasOwnProperty.call(c, "want") || c.compute) };
}

/** judgePage(html, { cases, needs, wiring }) — the full behavioral judge for a page:
 *  its inline script is the source; every act is cube-addressed. Pure.
 *  With `wiring: true` (the default for a WIDGET judge; FALSIFIED 2026-10-10 —
 *  a factor judge that never looks at the controls admits a page whose correct
 *  kernel is hidden behind a button that calls something else), every `needs`
 *  kernel must also be REACHABLE from the page's controls (onclick/oninput/
 *  onsubmit/addEventListener) — an unwired kernel is refused at NUL·Figure, a
 *  being the interface never binds. */
export function judgePage(html, { cases = [], needs = [], wiring = true } = {}) {
  const src = scriptOf(html);
  if (!src.trim()) {
    const cell = actCell("empty");
    const findings = [{ kind: "no-script", detail: "the artifact carries no inline script to judge", op: cell.op, cell: cellOfRow(cell) }];
    return { schema: BEHAVIOR_CHECK_SCHEMA, ok: false, findings, observations: [] };
  }
  const r = check(src, cases, { needs });
  if (r.ok && wiring) {
    const bound = wiringNamesOf(html);
    for (const n of needs) {
      if (bound.has(n)) continue;
      const cell = actCell("absent");
      r.findings.push({ kind: "unwired-factor", detail: `${n} is never reached by a control — a kernel the interface does not bind`, op: cell.op, cell: cellOfRow(cell) });
      r.observations.push({ schema: BEHAVIOR_CHECK_SCHEMA, action: "hunt", cell: cellOfRow(cell), target: n, detail: "no control reaches it", ok: false });
    }
    r.ok = r.findings.length === 0;
  }
  return r;
}

/** wiringNamesOf(html) — the kernel NAMES the controls actually reach:
 *  onclick/oninput/onchange/onsubmit attribute bodies and addEventListener
 *  handler calls. A factor is only as real as the control that binds it. Pure. */
export function wiringNamesOf(html) {
  const out = new Set();
  const h = String(html ?? "");
  for (const m of h.matchAll(/\b(?:onclick|oninput|onchange|onsubmit|onkeyup)=["']([^"']*)["']/gi)) {
    for (const c of m[1].matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) out.add(c[1]);
  }
  for (const m of h.matchAll(/addEventListener\s*\(\s*["'][^"']*["']\s*,\s*([A-Za-z_$][\w$]*)/g)) out.add(m[1]);
  return out;
}

export function selftest() {
  const t = (n, c) => { if (!c) { console.error("FAIL", n); process.exitCode = 1; } else console.log("ok", n); };
  const items = [{ id: "a", mission: "Crew-13", site: "Cape" }, { id: "b", mission: "Starlink", site: "Vandenberg" }];
  const src = `function filterLaunches(q, items){ q=q.toLowerCase(); return items.filter(x=>(x.mission+' '+x.site).toLowerCase().includes(q)); }
function resolveDetail(id, items){ return items.find(x=>x.id===id) || null; }
function drawnNothing(){ return 1; }`;
  let r = check(src, [
    { fn: "filterLaunches", args: ["crew", items], want: [items[0]] },
    { fn: "resolveDetail", args: ["b", items], want: items[1] },
  ], { needs: ["filterLaunches", "resolveDetail"] });
  t("working factors pass", r.ok);
  r = check(src, [], { needs: ["sortButton"] });
  t("drawn control with no factor fails", !r.ok && r.findings[0].kind === "missing-factor");
  r = check(`function f(q){ return document.querySelector(q); }`, [{ fn: "f", args: ["x"], want: null }], { needs: ["f"] });
  t("DOM-touching factor fails", !r.ok);
  // cube tying
  t("every wrapped cell is coherent (three faces agree)", observationsEveryCoherent(r));
  t("hunt sits at Entity · Binding", actCell("hunt").terrain === "Entity" && actCell("hunt").stance === "Binding" && actCell("hunt").op === "SIG");
  t("purity stands at Paradigm · Tracing (two witnesses)", actCell("purity").op === "EVA" && actCell("purity").terrain === "Paradigm" && actCell("purity").stance === "Tracing");
  t("a case lands at Lens · Binding", actCell("case").op === "EVA" && actCell("case").terrain === "Lens" && actCell("case").stance === "Binding");
  t("the box's want unfolds at Paradigm · Unraveling", actCell("want").op === "DEF" && actCell("want").terrain === "Paradigm" && actCell("want").stance === "Unraveling");
  t("an absent being is NUL at Entity · Dissecting", actCell("absent").op === "NUL" && actCell("absent").terrain === "Entity" && actCell("absent").stance === "Dissecting");
  // the box settles, never the mouth
  const w = wantOf({ kind: "tip", amount: 100, percent: 20 });
  t("the box settles 20% of 100 = tip 20, total 120", w.computable && w.value.tip === 20 && w.value.total === 120);
  t("an unsettleable want is refused, never drawn", !wantOf({ kind: "mystery" }).computable);
  // a real tip-calculator page judged end to end
  const page = `<html><body><input id="bill" value="100"><button onclick="var r=computeTip(Number(bill.value),20);out.textContent=r.tip+' total '+r.total;">20%</button><output id="out"></output>
<script>function computeTip(amount, percent){ var tip = Math.round(amount*percent)/100; return { tip: tip, total: Math.round((amount+tip)*100)/100 }; }</script></body></html>`;
  const j = judgePage(page, { cases: [{ fn: "computeTip", args: [100, 20], compute: { kind: "tip", amount: 100, percent: 20 } }], needs: ["computeTip"] });
  t("judgePage: the page's factor is judged by box-settled want", j.ok === true);
}
function observationsEveryCoherent(r) {
  for (const o of r.observations || []) {
    const c = coherent({ op: o.cell.op, site: o.cell.terrain, stance: o.cell.stance });
    if (!c.ok) { console.error("incoherent observation:", o, c.why); return false; }
  }
  return true;
}

export default { BEHAVIOR_CHECK_SCHEMA, ACT_CELL, actCell, scriptOf, wantOf, check, judgePage, selftest };