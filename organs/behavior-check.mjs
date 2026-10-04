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
// cases: [{ fn, args, want }] — want compared by JSON.
export const BEHAVIOR_CHECK_SCHEMA = "BehaviorCheck@1";

export function check(source, cases, { needs = [] } = {}) {
  const findings = [];
  const names = new Set([...source.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]));
  for (const n of needs) if (!names.has(n)) findings.push({ kind: "missing-factor", detail: n });
  if (findings.length) return { ok: false, findings };
  const fns = new Map();
  try {
    const loader = new Function(`${source}\nreturn { ${needs.join(", ")} };`);
    for (const [k, v] of Object.entries(loader())) fns.set(k, v);
  } catch (e) {
    return { ok: false, findings: [{ kind: "load", detail: String(e.message).slice(0, 160) }] };
  }
  for (const { fn, args, want } of cases) {
    try {
      const a = fns.get(fn)(...args);
      const b = fns.get(fn)(...args);
      if (JSON.stringify(a) !== JSON.stringify(b))
        findings.push({ kind: "impure", detail: fn });
      else if (JSON.stringify(a) !== JSON.stringify(want))
        findings.push({ kind: "wrong", detail: `${fn}: got ${JSON.stringify(a).slice(0, 120)} want ${JSON.stringify(want).slice(0, 120)}` });
    } catch (e) {
      findings.push({ kind: "throws", detail: `${fn}: ${String(e.message).slice(0, 120)}` });
    }
  }
  // DOM-touch sniff: factors must not reach for document/window/fetch
  for (const n of needs) {
    const body = (fns.get(n) ?? (() => "")).toString();
    if (/(document|window|fetch|localStorage)\b/.test(body))
      findings.push({ kind: "not-pure", detail: n + " touches DOM/IO" });
  }
  return findings.length ? { ok: false, findings } : { ok: true, findings: [] };
}

export function selftest() {
  const t = (n, c) => { if (!c) { console.error("FAIL", n); process.exitCode = 1; } else console.log("ok", n); };
  const src = `function filterLaunches(q, items){ q=q.toLowerCase(); return items.filter(x=>(x.mission+' '+x.site).toLowerCase().includes(q)); }
function resolveDetail(id, items){ return items.find(x=>x.id===id) || null; }
function drawnNothing(){ return 1; }`;
  const items = [{ id: "a", mission: "Crew-13", site: "Cape" }, { id: "b", mission: "Starlink", site: "Vandenberg" }];
  let r = check(src, [
    { fn: "filterLaunches", args: ["crew", items], want: [items[0]] },
    { fn: "resolveDetail", args: ["b", items], want: items[1] },
  ], { needs: ["filterLaunches", "resolveDetail"] });
  t("working factors pass", r.ok);
  r = check(src, [], { needs: ["sortButton"] });
  t("drawn control with no factor fails", !r.ok && r.findings[0].kind === "missing-factor");
  r = check(`function f(q){ return document.querySelector(q); }`, [{ fn: "f", args: ["x"], want: null }], { needs: ["f"] });
  t("DOM-touching factor fails", !r.ok);
}
