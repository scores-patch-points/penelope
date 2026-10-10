// behavior-check.test.mjs — the behavioral judge, cube-tied: every act on one
// of the 27 cells; the want is settled by the box, never drawn.
import { test } from "node:test";
import assert from "node:assert/strict";
import { check, judgePage, wantOf, actCell, scriptOf, settleExpression, BEHAVIOR_CHECK_SCHEMA } from "./behavior-check.mjs";

const coherent = (o) => {
  const { op, terrain, stance } = o.cell;
  return actCell(Object.keys({ hunt: 1, purity: 1, case: 1, want: 1, absent: 1, empty: 1 }).find((k) => actCell(k).op === op && actCell(k).terrain === terrain && actCell(k).stance === stance) ?? "empty");
};

test("hunt is SIG·Figure = Entity · Binding", () => {
  const c = actCell("hunt");
  assert.deepEqual([c.op, c.mode, c.domain, c.grain, c.terrain, c.stance], ["SIG", "Relate", "Existence", "Figure", "Entity", "Binding"]);
});

test("purity stands across two witnesses at EVA·Pattern = Paradigm · Tracing", () => {
  const c = actCell("purity");
  assert.deepEqual([c.op, c.terrain, c.stance], ["EVA", "Paradigm", "Tracing"]);
});

test("a declared case lands at EVA·Figure = Lens · Binding", () => {
  const c = actCell("case");
  assert.deepEqual([c.op, c.terrain, c.stance], ["EVA", "Lens", "Binding"]);
});

test("an absent factor is NUL·Figure = Entity · Dissecting; no script is NUL·Ground = Void · Clearing", () => {
  const a = actCell("absent"), e = actCell("empty");
  assert.equal(a.op, "NUL"); assert.equal(a.terrain, "Entity"); assert.equal(a.stance, "Dissecting");
  assert.equal(e.op, "NUL"); assert.equal(e.terrain, "Void"); assert.equal(e.stance, "Clearing");
});

test("the box settles a tip want, never the mouth (DEF·Pattern = Paradigm · Unraveling)", () => {
  const w = wantOf({ kind: "tip", amount: 36.5, percent: 20 });
  assert.equal(w.computable, true);
  assert.deepEqual(w.value, { tip: 7.3, total: 43.8 });
  assert.deepEqual([w.cell.op, w.cell.terrain, w.cell.stance], ["DEF", "Paradigm", "Unraveling"]);
  assert.equal(wantOf({ kind: "mystery" }).computable, false);
  assert.equal(wantOf({ expression: "x + 1" }).computable, false); // an unbound name is unsettleable
  assert.deepEqual(wantOf({ expression: "2 * 21" }).value, 42);
  // the box settles a BMI want over bound names, and refuses a division by zero
  assert.equal(wantOf({ expression: "kg/(m*m)", bind: { kg: 70, m: 1.75 } }).value, 22.86);
  assert.equal(wantOf({ expression: "1/(x-x)", bind: { x: 3 } }).computable, false);
  assert.equal(settleExpression("(1 + 2) * 3", {}), 9);
  assert.equal(settleExpression("total*(1+tip/100)/people", { total: 120, tip: 20, people: 4 }), 36);
});

test("a tip-calculator page is judged end to end by its factor — click contracts computed by the box", () => {
  const page = `<!doctype html><html><body>
<input id="bill" value="100">
<button onclick="var r=computeTip(Number(bill.value),20);out.textContent=r.tip+' total '+r.total;">20%</button>
<output id="out"></output>
<script>function computeTip(amount, percent){ var tip = Math.round(amount*percent)/100; return { tip: tip, total: Math.round((amount+tip)*100)/100 }; }</script>
</body></html>`;
  const r = judgePage(page, {
    needs: ["computeTip"],
    cases: [
      { fn: "computeTip", args: [100, 20], compute: { kind: "tip", amount: 100, percent: 20 } },
      { fn: "computeTip", args: [50, 15], compute: { kind: "tip", amount: 50, percent: 15 } },
      { fn: "computeTip", args: [36.5, 20], compute: { kind: "tip", amount: 36.5, percent: 20 } },
    ],
  });
  assert.equal(r.schema, BEHAVIOR_CHECK_SCHEMA);
  assert.equal(r.ok, true);
  // every observation carries a coherent cube address
  for (const o of r.observations) {
    assert.ok(o.cell.op && o.cell.grain && o.cell.terrain && o.cell.stance, "observation has a full cell");
  }
  const wants = r.observations.filter((o) => o.action === "want");
  assert.ok(wants.length >= 3, "the box settled every want");
  assert.ok(wants.every((o) => o.ok === true), "every want was box-settled, none drawn");
});

test("a wrong factor is refused at the case's lens, with the got/want disclosed", () => {
  const r = judgePage(`<script>function computeTip(a,p){ return { tip: 0, total: a }; }</script>`, {
    needs: ["computeTip"],
    cases: [{ fn: "computeTip", args: [100, 20], compute: { kind: "tip", amount: 100, percent: 20 } }],
  });
  assert.equal(r.ok, false);
  assert.equal(r.findings[0].kind, "wrong");
  assert.equal(r.findings[0].cell.op, "EVA");
  assert.equal(r.findings[0].cell.terrain, "Lens");
});

test("a control with no factor is a typed NUL, and an untouched-DOM probe of the factor stays outside the page's opinion", () => {
  const r = judgePage(`<button onclick="bogus()">go</button><script>function freeFn(){ return 1; }</script>`, { needs: ["bogus"], cases: [] });
  assert.equal(r.ok, false);
  assert.equal(r.findings[0].kind, "missing-factor");
  assert.equal(r.findings[0].cell.op, "NUL");
  assert.equal(r.findings[0].cell.terrain, "Entity");
});

test("scriptOf takes only inline scripts — a shell page with no script is a typed refusal", () => {
  const r = judgePage(`<html><body>no behavior here</body></html>`, { cases: [] });
  assert.equal(r.ok, false);
  assert.equal(r.findings[0].kind, "no-script");
  assert.equal(r.findings[0].cell.op, "NUL");
  assert.equal(r.findings[0].cell.terrain, "Void");
  assert.equal(scriptOf(`<script src="x.js"></script>`), "");
  assert.ok(scriptOf(`<script>function f(){}</script>`).includes("function f"));
});
test("the wiring gate: a correct kernel behind a button that calls nothing real is refused — the hole that WAS the judge (faligned 2026-10-10)", () => {
  const good = `<html><body><button onclick="perPerson(100)">go</button><script>function perPerson(a){ return a; }</script></body></html>`;
  const hostile = `<html><body><button onclick="bogus(100)">go</button><script>function perPerson(a){ return a; }</script></body></html>`;
  const want = [{ fn: "perPerson", args: [2], want: 2 }];
  assert.equal(judgePage(good, { needs: ["perPerson"], cases: want, wiring: false }).ok, true, "factor alone passes");
  assert.equal(judgePage(hostile, { needs: ["perPerson"], cases: want, wiring: false }).ok, true, "FALSIFIED: the factor judge admits the unwired page");
  const gated = judgePage(hostile, { needs: ["perPerson"], cases: want, wiring: true });
  assert.equal(gated.ok, false);
  assert.equal(gated.findings[0].kind, "unwired-factor");
  assert.equal(gated.findings[0].cell.op, "NUL");
  assert.equal(gated.findings[0].cell.terrain, "Entity");
  assert.equal(judgePage(good, { needs: ["perPerson"], cases: want, wiring: true }).ok, true, "a control that reaches the kernel passes");
});
