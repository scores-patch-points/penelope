// organs/generation/multitask.mjs — THE MULTITASKED DRAW (2026-10-10).
//
// The small model's proper multitasking: ONE context holds the manifest of K
// INDEPENDENT unit anchors (signature + spec, each small enough for Gary's
// law), the model runs one generation that WEAVES through all of them, and the
// box CUTS each unit's bytes out by its fence boundary. K tasks, one
// generation budget, time-split by framing — not K processes, not K queues.
// The tasks are INDEPENDENT by declaration: nothing here sequences them, so a
// poisoned unit is cut as a refusal and never contaminates a sibling.
//
// CUBE: the scheduler's acts sit on cells like every other act:
//   manifest            SEG·Pattern (Network · Unraveling — the fan unfolded)
//   draw                INS·Figure  (Entity · Making — the mouth's own cell)
//   extract (per unit)  SIG·Figure  (Entity · Binding — the bytes bound to their name)
//   probe   (per unit)  EVA·Figure  (Lens · Binding — one verdict at one lens)
// A unit whose fence is absent is a typed NUL·Figure gap, never invented.
import { cellOf } from "../cube.mjs";

export const MULTITASK_SCHEMA = "Multitask@1";
const FENCE = (n) => `// ===unit:${n}===`;
const END = "// ===end===";
const cell = (op, grain) => { const c = cellOf(op, grain); return { op: c.op, grain: c.grain, mode: c.mode, domain: c.domain, terrain: c.terrain, stance: c.stance }; };

/** multitaskManifest(units) — ONE prompt: the fan unfolded. Each unit is an
 *  anchor (its signature line), its spec, and the fence it must be emitted
 *  under. Pure. */
export function multitaskManifest(units = []) {
  const lines = [
    "You are filling K independent function bodies. Each has its signature (already correct) and its spec. Output ONLY the functions, each complete and self-contained, in this exact order, under its own marker line.",
  ];
  units.forEach((u, i) => {
    lines.push(`\n[${i + 1}] ${u.name}: ${u.spec}\n${FENCE(u.name)}\n${u.anchor}\n${END}`);
  });
  lines.push("\nReplace the anchor line in each fence with the COMPLETE function — the signature must stay byte-identical; the body must implement the spec. Do not reorder. Do not add functions. Do not write prose.");
  return lines.join("\n");
}

/** extractManifestUnits(text, names) — the boundary snip: each unit's bytes
 *  between its own fences, ABSENT fences are named gaps (NUL·Figure), never
 *  invented. A draw that emitted every function it saw is fine — the fence
 *  decides what belongs to whom. Pure. */
export function extractManifestUnits(text, names = []) {
  const out = [];
  const t = String(text ?? "");
  for (const n of names) {
    const open = t.indexOf(FENCE(n));
    const close = t.indexOf(END, open < 0 ? 0 : open);
    if (open < 0 || close < 0) { out.push({ unit: n, ok: false, gap: "fence-absent", cell: cell("NUL", "Figure") }); continue; }
    let body = t.slice(open + FENCE(n).length, close);
    // keep the anchor line the model was told to keep, then trim trailing junk
    body = body.split("\n").map((l) => l.replace(/\s+$/g, "")).join("\n").trim();
    out.push({ unit: n, ok: !!body, code: body || null, cell: cell("SIG", "Figure") });
  }
  return out;
}

/** probeUnits(extracted, probes) — EVA·Figure per cut: run the declared
 *  samples through the cut bytes and compare, JSON-equal. Pure (execution is
 *  the caller's; here the verdict is). */
export function probeUnits(extracted, probes = {}) {
  return extracted.map((x) => {
    if (!x.ok) return { ...x, verdict: "refused" };
    const p = probes[x.unit];
    if (!p || !Array.isArray(p.samples)) return { ...x, verdict: "unproven", cell: cell("EVA", "Figure") };
    for (const { args, want } of p.samples) {
      try {
        const fn = new Function(`return (${x.code});`)();
        const got = fn(...args);
        if (JSON.stringify(got) !== JSON.stringify(want)) return { ...x, verdict: "wrong", got, want, cell: cell("EVA", "Figure") };
      } catch (e) { return { ...x, verdict: "throws", error: e.message, cell: cell("EVA", "Figure") }; }
    }
    return { ...x, verdict: "held", cell: cell("EVA", "Figure") };
  });
}

export function selftest() {
  const t = (n, c) => { if (!c) { console.error("FAIL", n); process.exitCode = 1; } else console.log("ok", n); };
  const units = [{ name: "square", anchor: "function square(n) {", spec: "return n*n" }, { name: "double", anchor: "function double(n) {", spec: "return n*2" }];
  const m = multitaskManifest(units);
  t("manifest carries both anchors and both fences", m.includes("function square(n) {") && m.includes("// ===unit:double==="));
  const text = `${FENCE("square")}\nfunction square(n) {\n  return n * n;\n}\n${END}\n${FENCE("double")}\nfunction double(n) {\n  return n + n;\n}\n${END}`;
  const ex = extractManifestUnits(text, ["square", "double"]);
  t("boundary snip: each unit cut by its own fence", ex[0].ok && ex[0].code.includes("n * n") && ex[1].code.includes("n + n"));
  const pr = probeUnits(ex, { square: { samples: [{ args: [4], want: 16 }] }, double: { samples: [{ args: [4], want: 8 }] } });
  t("the probes hold on their own cuts", pr.every((x) => x.verdict === "held"));
  t("an absent fence is a named gap (NUL·Figure)", extractManifestUnits(text, ["ghost"])[0].verdict === undefined && extractManifestUnits(text, ["ghost"])[0].gap === "fence-absent");
  t("the manifest act sits on SEG·Pattern", cell("SEG", "Pattern").terrain === "Network");
}

export default { MULTITASK_SCHEMA, multitaskManifest, extractManifestUnits, probeUnits, cell, selftest };