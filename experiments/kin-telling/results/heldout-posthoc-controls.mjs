// POST-HOC DIAGNOSTIC (not the registered B4, which already FAILED for want of material): the held-out window's one kin fact is in no question's paragraph,
// so the registered shuffled-witness control had nothing to shuffle. Here the kin paragraph of each end of that fact is composed, then shuffled (S1 ends, S2 witnesses)
// and judged by the checker against the unshuffled fold. Labelled post-hoc; it does not change any registered bar.
import { loadWindow, windowPaths } from "../../../gym/kin-telling-lib.mjs";
import { makeKinContext, composeQuestion } from "../../../organs/kin-telling.mjs";
import { makeChecker } from "../../../organs/kin-telling-check.mjs";
const S = loadWindow(windowPaths().heldout, { janus: process.env.JANUS_HOME });
const ctx = () => makeKinContext({ fold: S.fold, textBuf: S.textBuf, lexicon: S.lexicon, lexiconSha: S.lexiconSha, parallel: S.parallel, parallelSha: S.parallelSha, window: "heldout-posthoc" });
const chk = makeChecker({ fold: S.fold, textBuf: S.textBuf, lexicon: S.lexicon, lexiconSha: S.lexiconSha, parallel: S.parallel, parallelSha: S.parallelSha, namePartsRu: S.namePartsRu, frames: S.frames, framesSha: S.framesSha });
const fact = S.fold.kin.facts.find((f) => f.rel === "parent_of");
const ids = Object.values(S.fold.referents).map((r) => r.id).sort();
const wits = [...new Set(S.fold.kin.facts.flatMap((f) => f.witnesses))].sort((p, q) => Number(p.split("#")[1].split("-")[0]) - Number(q.split("#")[1].split("-")[0]));
const tau = new Map(wits.map((w, i) => [w, wits[(i + 1) % wits.length]]));
const sigma = new Map(ids.map((id, i) => [id, ids[(i + 7) % ids.length]]));
for (const who of [fact.a, fact.b]) {
  const q = { id: "P" + who.slice(4, 8), n: 99, template: "T-KIN", referent: who, text: "post hoc", subject: "x" };
  const base = composeQuestion(ctx(), q), vb = chk.checkDoc(base, q);
  const s2 = composeQuestion(ctx(), q, { control: { wit: (w) => tau.get(w) ?? w } }), v2 = chk.checkDoc(s2, q);
  const s1 = composeQuestion(ctx(), q, { control: { id: (x) => sigma.get(x) ?? x } }), v1 = chk.checkDoc(s1, q);
  console.log(`\n${who}: unshuffled ok=${vb.ok} (${base.sentences.length} sentences)`); base.sentences.slice(0, 3).forEach((s) => console.log("   ", s.text));
  console.log(`  S2 shuffled witnesses: ${v2.failures.length} failures`, [...new Set(v2.failures.map((f) => f.code))].join(", "));
  console.log(`  S1 shuffled ends:      ${v1.failures.length} failures`, [...new Set(v1.failures.map((f) => f.code))].join(", "));
}
