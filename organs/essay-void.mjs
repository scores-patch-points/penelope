// organs/essay-void.mjs — the closing loop (2026-10-01).
//
// The essay is a REVISABLE VOID, not a filled template: it declares the bars
// (what makes a house essay good), the run is evaluated against them, the
// failures become PERMANENT lessons (red rungs become standing rules, never
// retries), and the next void is seeded with the accumulated lessons — so the
// system gets better every time and never starts from scratch.
//
// The bars, mechanical: meta-voice (the mouth writes IN the essay, never about
// it), grounded (load-bearing claims carry ⟦source@address⟧ markers for the box
// to snip — the mouth never grounds itself, GL-BD-18), houses (the essay names
// its real things), coherent (no attractor repetition). The lessons ledger is
// append-only — the stigmergic trace across runs.
//
// PURE (node builtins). Selftest:
//   node --input-type=module -e "import('./organs/essay-void.mjs').then(m=>m.selftest())"
import fs from "node:fs";

export const VOID_SCHEMA = "EssayVoid@1";

const META = /(this\s+(passage|essay|section|paragraph|concept)\s+(explores|describes|discusses|highlights|emphasizes|suggests|reveals|demonstrates))/i;

/** The bars — mechanical judges of a house essay. Each returns true when the
 *  section passes. */
export const BARS = {
  voice: (t) => !META.test(t),
  grounded: (t) => /⟦[^⟧]+@\d+⟧/.test(t),
  houses: (t) => /khora|penelope|surface|fold|shroud|record|seam|republic|research|mouth|box/i.test(t),
};

/** Evaluate a run's sections against the bars. Returns per-section failures. */
export function evaluate(sections, texts) {
  const per = texts.map((t, i) => {
    const fail = [];
    if (!BARS.voice(t)) fail.push("meta-voice");
    if (!BARS.grounded(t)) fail.push("ungrounded");
    if (!BARS.houses(t)) fail.push("no-house-names");
    return { n: i + 1, section: sections[i] ?? `§${i + 1}`, fail };
  });
  const grams = (s, n) => { const o = new Set(); const w = s.toLowerCase().split(/\s+/); for (let i = 0; i <= w.length - n; i++) o.add(w.slice(i, i + n).join(" ")); return o; };
  const seen = new Set(); let rep = 0;
  for (const t of texts) for (const g of grams(t, 6)) { if (seen.has(g)) rep++; seen.add(g); }
  return { per, coherent: rep === 0, totalFailures: per.reduce((a, p) => a + p.fail.length, 0) };
}

/** Learn permanently: append a lesson to the ledger (append-only, the stigmergic
 *  trace across runs). `why` is the failure, `lesson` is the standing rule. */
export function learn(ledgerPath, { round, fails, lesson }) {
  const row = JSON.stringify({ schema: "EssayLesson@1", ts: new Date().toISOString(), round, fails, lesson }) + "\n";
  fs.appendFileSync(ledgerPath, row);
  return { ok: true, ledgerPath };
}

/** Revise the void: seed the next run's prompt with the accumulated lessons —
 *  information, not prohibition (Gary). */
export function revise(baseVoid, lessons) {
  const rules = lessons.map((l) => `- ${l.lesson}`).join("\n");
  return `${baseVoid}\n\nSTANDING RULES from prior runs (the lessons are permanent):\n${rules}`;
}

export function selftest() {
  const t = (n, c) => { if (!c) { console.error("FAIL", n); process.exitCode = 1; } else console.log("ok", n); };
  const meta = evaluate(["§1"], ["This passage explores the nature of memory and describes its limits."]);
  t("meta-voice is caught", meta.per[0].fail.includes("meta-voice"));
  const good = evaluate(["§1"], ["Khora reads, penelope weaves ⟦republic@522168⟧, the fold holds."]);
  t("a house-voice grounded section passes", good.per[0].fail.length === 0 && good.coherent);
  const rep = evaluate(["§1", "§2"], ["the wax hardens and the wax crowds", "the wax hardens and the wax crowds again"]);
  t("attractor repetition is caught", !rep.coherent);
  const tmp = "/tmp/essay-lessons-test.jsonl";
  fs.rmSync(tmp, { force: true });
  learn(tmp, { round: 1, fails: ["meta-voice"], lesson: "the void's bar is essay-voice, enforced by a completion anchor, never a prohibition." });
  learn(tmp, { round: 1, fails: ["ungrounded"], lesson: "the box places the citation; the mouth never emits it." });
  t("lessons are permanent and append-only", fs.readFileSync(tmp, "utf8").trim().split("\n").length === 2);
  const revised = revise("write the essay", [JSON.parse(fs.readFileSync(tmp, "utf8").trim().split("\n")[1])]);
  t("the next void is seeded with the lessons", revised.includes("the box places the citation"));
}