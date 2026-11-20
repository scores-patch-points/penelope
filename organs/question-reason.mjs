// organs/question-reason.mjs — THE REASONING STAGE for a parsed question (Penelope's act: standing is an EVA, judging is hers).
// Order, and why: (1) the question was read into EOT and every goal judged MECHANICALLY (janus's reader-side organs, injected): lookup, supersession, contradiction under a declared prior, composition, nesting. The model has not been called.
// (2) THINKING IS THE FOLD'S OWN: a THOUGHT is the machine's derivation trace for a goal (an existent, INS·Figure, written by the interpreter, citing the goal): what was read, which marks and which priors (with their givers) it used, which rule applied, what the result was. Every goal has one, settled or not. A thought is never a claim and never evidence.
// Only a goal left a HOLE or a GAP goes to the model, and only to NOMINATE: it writes a short note about that one sub-question over a bounded slice of the marks, and the note is a source of proposals, not a thought. (3) what the model NOMINATES about the sub-question is read back through the READER into claims; each is a PROPOSAL and is TESTED against the marks by the machine:
//   restates      it is already on record (material), so it proposes nothing
//   contradicted  it disagrees with a mark under a single-value prior a giver declared: REJECTED, and the reason is kept
//   new_being     it names a being the material never mentions: a proposal about nothing the text said
//   silent        the marks neither say nor deny it: it stays a CANDIDATE, by `model:`, unverified
// A goal whose only help is a silent proposal gets the standing `candidate` (not `stands`); the reply must label it a proposal. A model never writes a DEF, a verdict or a fact (the 2026-11-19 ruling).
// No regex and no word list: the reader does the reading (injected `claimsOf`), the machine does the comparing. Every dependency is injected, so this loads and tests with no sibling checkout.
export const STANDINGS = Object.freeze(["stands", "contradicted", "hole", "judgement", "gap", "candidate"]);
const lemmaOf = (rel) => String(rel).split("_")[0];
const turnOf = (c) => +String(c.at ?? "s0").slice(1) + 1;
/** the marks a sub-question may read: those about the beings it names, one hop out (bounded: `limit` lines, latest first by turn) */
export function sliceFor(names, marks, { limit = 24 } = {}) {
  const seen = new Set(), out = []; let frontier = [...new Set(names)];
  for (let hop = 0; hop < 2; hop++) { const next = []; for (const n of frontier) { if (seen.has(n)) continue; seen.add(n); for (const m of marks) if (m.polarity !== "-" && (m.a === n || m.b === n)) { out.push(m); next.push(m.a, m.b); } } frontier = [...new Set(next)]; }
  return [...new Map(out.map((m) => [`${m.a}|${m.rel}|${m.b}|${m.at}`, m])).values()].sort((x, y) => turnOf(x) - turnOf(y)).slice(-limit);
}
/** one proposed claim, tested against the marks */
export function testProposal(c, marks, { functional = [] } = {}) {
  const beings = new Set(marks.flatMap((m) => [m.a, m.b])), same = marks.filter((m) => m.polarity !== "-" && m.a === c.a && lemmaOf(m.rel) === lemmaOf(c.rel));
  if (same.some((m) => m.b === c.b)) return { status: "restates", why: `already on record (turn ${turnOf(same.find((m) => m.b === c.b))})` };
  if (functional.includes(lemmaOf(c.rel)) && same.length) { const last = [...same].sort((x, y) => turnOf(y) - turnOf(x))[0]; return { status: "contradicted", why: `${c.a} ${last.rel.split("_").join(" ")} ${last.b} (turn ${turnOf(last)}), and ${lemmaOf(c.rel)} is declared single-valued` }; }
  const fresh = [c.a, c.b].filter((x) => !beings.has(x)); if (fresh.length) return { status: "new_being", why: `names ${fresh.join(", ")}, which the material never mentions` };
  return { status: "silent", why: "the marks neither say nor deny it" };
}

/** the machine's reasoning for one goal, as steps (what it read, what it used, which rule, the result), from what the mechanical organs recorded. Pure: nothing here calls a model. */
export function traceOf(n) {
  const b = n.basis ?? { material: [], priors: [] }, steps = [{ step: "read", rule: "the reader's rows -> a pattern", out: `${n.kind ?? "unread"}${n.role ? ` (${n.role}${n.lead ? `: ${n.lead}` : ""})` : ""}` }];
  if ((b.material ?? []).length) steps.push({ step: "material", rule: "marks present in what was said", out: b.material.join(", ") });
  for (const p of b.priors ?? []) steps.push({ step: "prior", rule: `${p.kind}${p.rel ? ` (${p.rel})` : ""}`, out: `given by ${p.giver ?? "no giver"}` });
  steps.push({ step: "rule", rule: n.standing === "stands" ? "found on record" : n.standing === "contradicted" ? "disagrees with a mark under a declared prior" : n.standing === "judgement" ? "a recommendation: no mark can ground it" : n.standing === "gap" ? "the reader could not read it" : "the marks neither say nor deny it", out: n.finding ?? n.note ?? "" });
  return steps;
}
const promptFor = (node, lines) => ({
  system: "You NOMINATE what could be true about ONE sub-question, using only the notes: at most two short sentences saying what the notes support or let you infer. If nothing follows from the notes, say that nothing follows. Do not answer anything else.",
  user: `Notes:\n${lines.length ? lines.join("\n") : "(no marks about this)"}\n\nSub-question: ${node.text}\nThe machine could not settle it because: ${node.note ?? node.finding ?? "no mechanical answer"}`,
});
/** reasonOver(nodes, { marks, namesOf, claimsOf, model, functional, by }) -> the nodes, each goal left hole/gap now carrying { thought, proposals } and, if a silent proposal helps, standing `candidate`.
 *  `namesOf(text)` -> the names the sub-question mentions (the reader's proper nouns); `claimsOf(text)` -> claims the reader finds in a sentence; `model.think({ system, user })` -> { thinking, content }. */
export async function reasonOver(nodes, { marks, namesOf, claimsOf, model, functional = [], by = "model", onNode = null }) {
  const out = [], emit = async (d) => { out.push(d); if (onNode) await onNode(d); };
  for (const n of nodes) {
    if (!n.text || !n.standing) { out.push(n); continue; }
    const base = { ...n, thought: { by: "penelope", steps: traceOf(n) } };
    if (!["hole", "gap"].includes(n.standing) || !model) { await emit(base); continue; }   // the machine settled it (or it is not the model's to nominate on)
    const lines = sliceFor(namesOf(n.text), marks).map((m) => `[turn ${turnOf(m)}] ${m.a} ${m.rel.split("_").join(" ")} ${m.b}`);
    if (!lines.length) { base.thought.steps.push({ step: "outside", rule: "no mark bears on any being this sub-question names", out: "the model was not asked: it could only invent" }); await emit({ ...base, standing: "hole", note: `outside_material: no mark bears on any being this sub-question names (${n.note ?? n.finding ?? "no mechanical answer"}); the model was not asked`, outside: true }); continue; }
    const r = await model.think(promptFor(n, lines)), proposals = (claimsOf(r.content ?? "") ?? []).map((c) => ({ claim: { a: c.a, rel: c.rel, b: c.b }, ...testProposal(c, marks, { functional }) })), helps = proposals.filter((p) => p.status === "silent");
    base.thought.steps.push({ step: "nominated", rule: `a note by ${by} over ${lines.length} marks`, out: r.content ?? "" }, ...proposals.map((p) => ({ step: "tested", rule: p.status, out: `${p.claim.a} ${p.claim.rel.split("_").join(" ")} ${p.claim.b}: ${p.why}` })));
    await emit({ ...base, nominated: { by, said: r.content ?? "", read: lines }, proposals, ...(helps.length ? { standing: "candidate", finding: `PROPOSED by the model, not on record: ${helps.map((p) => `${p.claim.a} ${p.claim.rel.split("_").join(" ")} ${p.claim.b}`).join("; ")}`, basis: { material: [], priors: [], proposals: helps.map((p) => p.claim) } } : {}) });
  }
  return out;
}
/** weaveReasoning(P, h, nodes, ids, { by }): the thoughts (INS·Figure, by the interpreter, of the goal: the derivation trace) and the proposals (SEG·Pattern, by the model, of the thought: only what it nominated) become marks; the tested status is Penelope's EVA·Figure of the proposal. `ids` maps node id -> its goal entry id (question-tree.weave). */
export function weaveReasoning(P, h, nodes, ids, { by = "model" } = {}) {
  const K = { thought: "INS·Figure", proposal: "SEG·Pattern", verdict: "EVA·Figure" };
  for (const [name, cell] of Object.entries(K)) { try { P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: `kind:${name}`, body: { name, cell } }); } catch { /* declared */ } }
  let n = 0;
  for (const nd of nodes) {
    if (!nd.thought) continue;
    const t = P.weave(h, { cell: K.thought, kind: "thought", addr: `thought:${nd.id}`, body: { by: nd.thought.by, goal: nd.id, steps: nd.thought.steps }, of: [ids.get(nd.id)] });
    for (const p of nd.proposals ?? []) { const pr = P.weave(h, { cell: K.proposal, kind: "proposal", addr: `proposal:${nd.id}:${n++}`, body: { by, said: nd.nominated?.said ?? "", ...p.claim }, of: [t.id] }); P.weave(h, { cell: K.verdict, kind: "verdict", addr: `proposal:${nd.id}:${n - 1}`, body: { status: p.status, why: p.why }, of: [pr.id] }); }
  }
}
