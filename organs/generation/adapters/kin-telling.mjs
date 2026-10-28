// organs/generation/adapters/kin-telling.mjs — THE KIN-TELLING ADAPTER (G1-3, 2026-10-28): the English composer as a generation medium.
//
// Not registered as a built-in kind: a caller passes it as an adapter OBJECT (weave already accepts one), so the default behaviour of
// weave(), generationKinds() and every existing adapter is untouched. With `noModel: true` this is the proof of "mouth off": each SENTENCE is
// a unit, the FIELD stage (autofill) settles every unit from the recorded derivation with its Russian-span addresses, there is no hunt and no
// mouth, and a unit that cannot be settled stops as `model-required` (it is never drawn). testUnits runs the independent checker
// (organs/kin-telling-check.mjs) over the folded paragraph.
//
//   weave({ intent, artifact: kinTellingAdapter, noModel: true, output: dir,
//           context: { kin: { composeCtx, checker, question } } })
//
// `composeCtx` is organs/kin-telling.mjs makeKinContext(...); `checker` is organs/kin-telling-check.mjs makeChecker(...); `question` a question of the window.
import { composeQuestion } from "../../kin-telling.mjs";

const addressesOf = (s) => [...new Set([...s.segs.filter((g) => g.a).map((g) => g.a), ...(s.extent ? [s.extent] : [])])];

const adapter = {
  kind: "kin-telling",
  ext: "txt",
  // read: the question's recorded derivation becomes one unit per composed sentence (the composer is the box, not a mouth)
  readUnits(_task, ctx) {
    const k = ctx.kin;
    if (!k?.composeCtx || !k?.question) return [];
    ctx.kinDoc = composeQuestion(k.composeCtx, k.question, { policy: k.policy ?? "chosen" });
    return ctx.kinDoc.sentences.map((s, i) => ({ name: `s${String(i + 1).padStart(2, "0")}`, spec: s.claim }));
  },
  // the field stage: the sentence with its addresses (the engine records them as the unit's source anchor)
  autofill(unit, ctx) {
    const i = Number(unit.name.slice(1)) - 1;
    const s = ctx.kinDoc?.sentences?.[i];
    return s ? { code: s.text, address: addressesOf(s).join(" ") } : null;
  },
  snip: (v) => v,
  probeUnit: () => ({ ok: true, detail: "" }),
  // the verdict is the independent checker's, over the paragraph the engine folded
  testUnits(code, _units, ctx) {
    const doc = ctx.kinDoc;
    if (!doc || !ctx.kin?.checker) return { ok: false, reason: "no-derivation", detail: "no recorded derivation for this question" };
    const folded = code.replace(/\n$/, "").split("\n\n").join(" ");
    const joined = doc.sentences.map((s) => s.text).join(" ");
    if (folded !== joined) return { ok: false, reason: "folded-text-differs", detail: "the folded paragraph is not the composed sentences" };
    const v = ctx.kin.checker.checkDoc(doc, ctx.kin.question);
    return v.ok ? { ok: true, reason: `checker: ${doc.sentences.length} sentences, 0 failures` } : { ok: false, reason: "checker-failed", detail: JSON.stringify(v.failures.slice(0, 5)) };
  },
  toDocument: ({ code }) => code,
};

export default adapter;
