// compare.mjs — the human procedure for "do these two statements, nested in two documents, say the same thing relevant to the question?"
// Steps (THEORY-IDENTITY.md sections 14-16): (1) the question is declared first; (2) UNWRAP each statement in its context (the paragraph holon; language declared AND heard);
// (3) BIND who and what (khora referents; unbound fillers can never match); (4) REDUCE to comparable claims (relation, ARG0/ARG1, polarity; saturated = both roles bound);
// (5) CLASSIFY every difference: Conflict, Silence, Resolution, Accidental, or HOLE (untied, unsaturated, undeclared); only differences on the question's concerns count;
// (6) VERDICT Other / Same / Hold with a hunger list (a Hold names what would settle it); (7) the TRAIL: byte addresses that re-open, and the verdict as a pharos-shaped entry.
// No model judges: the reader is khora (one door), the rest is rules. Anything the reader does not supply is a typed gap, never a guess.
// Cross-document comparison is a DECLARED act (the question names the referent), not ground overlap: grounds of different documents are siblings and never meet.
import crypto from "node:crypto";
const KH = process.env.KHORA_HOME ?? "/Users/mlacy/Documents/khora-cast/khora";
process.env.KHORA_PRIORS_DIR ||= `${process.env.HOME}/Documents/janus/priors`;
const { readDocument } = await import(`${KH}/native/reading.js`);
const { languageContextFor } = await import(`${KH}/native/the-fold/language-context.js`);

export const sha = (x) => crypto.createHash("sha256").update(x).digest("hex");
export const canon = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : 1))) : v));
export const norm = (s) => String(s ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();            // the text codec's accidental set: compatibility forms and spacing; CASE KEPT
const toks = (s) => norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
/** the same name: equal after the accidental set, or one name's tokens inside the other's (an alias), case kept, the shorter holding a capitalised token */
export function sameName(a, b) {
  if (!a || !b || String(a).startsWith("u:") || String(b).startsWith("u:")) return false;
  if (norm(a) === norm(b)) return true;
  const A = toks(a), B = toks(b), [s, l] = A.length <= B.length ? [A, B] : [B, A];
  return s.length > 0 && s.every((t) => l.includes(t)) && s.some((t) => /^\p{Lu}/u.test(t));
}
/** an address: a byte span of the document text with the sha256 of exactly those bytes and of the whole text */
export function address(text, c0, c1) {
  const tb = Buffer.from(text, "utf8"), b0 = Buffer.byteLength(text.slice(0, c0)), b1 = Buffer.byteLength(text.slice(0, c1));
  return { doc: sha(tb), b0, b1, sha256: sha(tb.subarray(b0, b1)) };
}
export function reopen(text, addr) {
  const tb = Buffer.from(text, "utf8");
  if (sha(tb) !== addr.doc) return { ok: false, reason: "document drifted" };
  const piece = tb.subarray(addr.b0, addr.b1);
  if (sha(piece) !== addr.sha256) return { ok: false, reason: "span drifted" };
  return { ok: true, text: piece.toString("utf8") };
}
const gap = (g, detail) => ({ gap: g, detail });
const refuse = (reason, gaps) => ({ verdict: "refused", reason, gaps });

const READS = new Map();       // a read is a function of (text, language): keep it for the process, derived and deletable
const readOnce = (text, language) => { const k = `${language}\u0000${text}`; if (!READS.has(k)) READS.set(k, readDocument(text, { language, lexicon: false, referents: true, castIdentity: true, minCharacters: 0 })); return READS.get(k); };

/** UNWRAP + BIND + REDUCE one statement. S = { doc: {id, text}, span: [c0, c1] }. */
async function unwrap(S, declare) {
  const text = S.doc.text, [c0, c1] = S.span, gaps = [];
  if (!(c0 >= 0 && c1 > c0 && c1 <= text.length)) return { refused: refuse("bad_span", [gap("bad_span", S.doc.id)]) };
  const lines = text.split("\n"), offs = []; let p = 0; for (const l of lines) { offs.push(p); p += l.length + 1; }
  let k = 0; while (k + 1 < offs.length && offs[k + 1] <= c0) k++;
  const para = lines[k], sc0 = c0 - offs[k], sc1 = Math.min(c1 - offs[k], para.length);
  if (c1 - offs[k] > para.length) gaps.push(gap("statement_crosses_paragraph", "the paragraph holding the start is read; the rest is not"));
  const heard = languageContextFor(para, {}).language ?? "none";
  if (heard !== declare.language) return { refused: refuse("language_mismatch", [gap("language_mismatch", `declared ${declare.language}, heard ${heard} (${S.doc.id})`)]) };
  // SCOPE: "paragraph" (the default) reads the statement's paragraph alone, so a pronoun whose antecedent is in an earlier paragraph stays unbound; "document" reads the whole document once (cached) so khora's coreference reaches across paragraphs.
  const wholeDoc = declare.scope === "document", src = wholeDoc ? text : para, s0 = wholeDoc ? c0 : sc0, s1 = wholeDoc ? c1 : sc1;
  const e = await readOnce(src, declare.language);
  const spans = new Map((e.referents?.spans ?? []).map((s) => [s.id, s])), ments = [];
  for (const r of e.referents?.referents ?? []) for (const id of r.mentions ?? []) { const s = spans.get(id); if (s) ments.push({ a: s.at[0], b: s.at[1], face: r.face }); }
  const fill = (arg, ci, role) => {
    if (!arg) return null; let best = null, bo = 0;
    for (const m of ments) { const o = Math.min(arg.end, m.b) - Math.max(arg.start, m.a); if (o > bo && m.a >= arg.start && m.b <= arg.end) { bo = o; best = m; } }
    return best ? best.face : `u:${ci}:${role}:${arg.head ?? arg.text}`;
  };
  const claims = [];
  (e.clauses ?? []).forEach((c, ci) => {
    if (!c.subject || !c.predicate?.lemma || !c.own) return;
    if (Math.min(c.own.end, s1) - Math.max(c.own.start, s0) <= 0) return;                         // the clause is not inside the statement
    const A0 = fill(c.subject, ci, "0"), A1 = fill(c.object, ci, "1");
    claims.push({ rel: c.predicate.lemma.toLowerCase(), ARG0: A0, ARG1: A1, polarity: c.polarity === "-" ? "-" : "+", saturated: !!A0 && !!A1 && !A0.startsWith("u:") && !A1.startsWith("u:"), text: src.slice(c.own.start, c.own.end), clause: ci });
  });
  gaps.push(gap("attribution_not_run", "who is speaking (reported speech, hypotheticals) is not read; every statement is taken as asserted by its document"), gap("time_not_wired", "tense as anaphora is built in khora but not wired into claims; only years written in the text are noted"));
  return { doc: S.doc.id, para: k, ground: `/${S.doc.id}/p${k}`, statement: text.slice(c0, c1), claims, years: [...text.slice(c0, c1).matchAll(/(?<!\d)(1[0-9]{3}|20[0-9]{2})(?!\d)/g)].map((m) => m[0]), address: address(text, c0, c1), gaps };
}
/** the identity relation from witnessed events: merges are must-links, aparts are cannot-links; a must-link component that holds a cannot-link pair is held whole (order-independent) */
export function makeSame(identity = {}) {
  const merges = identity.merges ?? [], aparts = identity.aparts ?? [], parent = new Map();
  const find = (x) => { let r = x; while (parent.has(r) && parent.get(r) !== r) r = parent.get(r); return r; };
  for (const [a, b] of merges) { const A = norm(a), B = norm(b); if (!parent.has(A)) parent.set(A, A); if (!parent.has(B)) parent.set(B, B); const ra = find(A), rb = find(B); if (ra !== rb) parent.set(ra, rb); }
  const comps = new Map(); for (const k of parent.keys()) { const r = find(k); if (!comps.has(r)) comps.set(r, []); comps.get(r).push(k); }
  const inClass = (name, members) => members.some((m) => sameName(name, m));          // a merge applies to every name that is an alias of a member (the reader says "Bell" for "Marshall Bell")
  const heldRoots = new Set();
  for (const [r, members] of comps) if (aparts.some(([x, y]) => inClass(x, members) && inClass(y, members))) heldRoots.add(r);   // a must-link component holding a cannot-link pair is held whole (order-independent)
  const apart = (a, b) => aparts.some(([x, y]) => (sameName(a, x) && sameName(b, y)) || (sameName(a, y) && sameName(b, x)));
  return (a, b) => {
    if (!a || !b || String(a).startsWith("u:") || String(b).startsWith("u:")) return false;
    if (apart(a, b)) return false;
    for (const [r, members] of comps) if (!heldRoots.has(r) && inClass(a, members) && inClass(b, members)) return true;
    return sameName(a, b);
  };
}
const about = (c, name, same) => same(c.ARG0, name) || same(c.ARG1, name);
const label = (c) => `${c.polarity === "-" ? "not " : ""}${c.rel}(${c.ARG0 ?? "-"}, ${c.ARG1 ?? "-"})`;
const rolesEq = (x, y, same) => same(x.ARG0, y.ARG0) && ((!x.ARG1 && !y.ARG1) || same(x.ARG1, y.ARG1));
const swapped = (x, y, same) => x.ARG1 && y.ARG1 && same(x.ARG0, y.ARG1) && same(x.ARG1, y.ARG0);
function contains(containers, big, small) {            // containers: child -> parent (declared by a giver); transitive
  let cur = norm(small), seen = 0; while (containers[cur] && seen++ < 20) { cur = norm(containers[cur]); if (cur === norm(big)) return true; } return false;
}
/** CLASSIFY the differences between the claims about the referent in A and in B. */
function classify(ca, cb, declare, same) {
  const out = []; const acyclic = new Set(declare.acyclic ?? []), functional = new Set(declare.functional ?? []), cont = declare.containers ?? {};
  const seenB = new Set();
  for (const a of ca) {
    let matched = false;
    for (const b of cb) {
      if (a.rel !== b.rel) continue;
      if (rolesEq(a, b, same)) {
        matched = true; seenB.add(b);
        if (a.polarity === b.polarity) out.push({ kind: "AGREE", rel: a.rel, strong: a.saturated && b.saturated, a: label(a), b: label(b) });
        else if (a.saturated && b.saturated) out.push({ kind: "CONFLICT", rel: a.rel, a: label(a), b: label(b), why: "the same relation between the same bound referents, opposite polarity" });
        else out.push({ kind: "HOLE", rel: a.rel, a: label(a), b: label(b), why: "opposite polarity but a role is unbound: an unsaturated claim cannot convict" });
      } else if (swapped(a, b, same) && a.saturated && b.saturated) {
        matched = true; seenB.add(b);
        if (acyclic.has(a.rel) && a.polarity === "+" && b.polarity === "+") out.push({ kind: "CONFLICT", rel: a.rel, a: label(a), b: label(b), why: `roles swapped on a relation declared asymmetric (${a.rel})` });
        else out.push({ kind: "HOLE", rel: a.rel, a: label(a), b: label(b), why: `roles swapped but ${a.rel} is not declared asymmetric` });
      } else if (same(a.ARG0, b.ARG0) && a.ARG1 && b.ARG1) {
        matched = true; seenB.add(b);
        if (norm(a.ARG1) === norm(b.ARG1) || same(a.ARG1, b.ARG1)) continue;
        if (contains(cont, a.ARG1, b.ARG1) || contains(cont, b.ARG1, a.ARG1)) {
          const coarse = declare.grain === "coarse";
          out.push({ kind: "RESOLUTION", rel: a.rel, a: label(a), b: label(b), grain: coarse ? "coarse" : "fine", strong: coarse && a.saturated && b.saturated, why: coarse ? "one value contains the other; at the asked grain they agree" : "one value contains the other; at the finer grain the coarser side is silent" });
        } else if (functional.has(a.rel) && a.saturated && b.saturated && a.polarity === "+" && b.polarity === "+") out.push({ kind: "CONFLICT", rel: a.rel, a: label(a), b: label(b), why: `${a.rel} is declared one-valued and the values differ` });
        else out.push({ kind: "HOLE", rel: a.rel, a: label(a), b: label(b), why: "different objects of a relation not declared one-valued: possibly two different events" });
      } else if (same(a.ARG0, b.ARG0) && (!a.ARG1 || !b.ARG1)) {
        matched = true; seenB.add(b); out.push({ kind: "HOLE", rel: a.rel, a: label(a), b: label(b), why: "a claim is unsaturated (a role missing): it can support but not convict" });
      }
    }
    if (!matched) out.push({ kind: "SILENCE", rel: a.rel, side: "B", a: label(a), why: "A states it about the referent; B has no claim of that relation" });
  }
  for (const b of cb) if (!seenB.has(b) && !ca.some((a) => a.rel === b.rel)) out.push({ kind: "SILENCE", rel: b.rel, side: "A", b: label(b), why: "B states it about the referent; A has no claim of that relation" });
  return out;
}
/** compareStatements({ A, B, question: { about, concerns }, declare: { language, by, at, acyclic, functional, containers, grain } }) */
export async function compareStatements({ A, B, question, declare }) {
  if (!question?.about) return refuse("no_question", [gap("no_question", "the question names the referent it asks about")]);
  if (!declare?.by || !declare?.at || !declare?.language) return refuse("not_declared", [gap("not_declared", "by, at and language are declared, never defaulted")]);
  const ua = await unwrap(A, declare); if (ua.refused) return ua.refused;
  const ub = await unwrap(B, declare); if (ub.refused) return ub.refused;
  const same = makeSame(declare.identity);
  const ca = ua.claims.filter((c) => about(c, question.about, same)), cb = ub.claims.filter((c) => about(c, question.about, same));
  const all = classify(ca, cb, declare, same);
  const concerns = question.concerns?.length ? new Set(question.concerns) : new Set(all.map((d) => d.rel));
  for (const r of question.concerns ?? []) if (![...ca, ...cb].some((c) => c.rel === r)) all.push({ kind: "SILENCE", rel: r, side: "both", why: `neither statement has a ${r} claim about the referent: the concern is unanswered` });
  const mine = all.filter((d) => concerns.has(d.rel)), other = all.filter((d) => !concerns.has(d.rel));
  const conflicts = mine.filter((d) => d.kind === "CONFLICT"), strong = mine.filter((d) => (d.kind === "AGREE" || d.kind === "RESOLUTION") && d.strong);
  const holes = mine.filter((d) => d.kind === "HOLE" || d.kind === "SILENCE" || (d.kind === "RESOLUTION" && !d.strong));
  const rels = [...concerns]; const unanswered = rels.filter((r) => !mine.some((d) => d.rel === r && ((d.kind === "AGREE" || d.kind === "RESOLUTION") && d.strong || d.kind === "CONFLICT")));
  let verdict = conflicts.length ? "Other" : strong.length && !holes.length && !unanswered.length ? "Same" : "Hold";
  const hunger = verdict === "Hold" ? [...new Set([...holes.map((d) => d.why + (d.rel ? ` [${d.rel}]` : "")), ...unanswered.map((r) => `a saturated claim of relation ${r} about the referent on both sides`)])] : [];
  const trail = { A: { addr: ua.address, doc: ua.doc, ground: ua.ground, statement: ua.statement }, B: { addr: ub.address, doc: ub.doc, ground: ub.ground, statement: ub.statement } };
  trail.A.reopens = reopen(A.doc.text, ua.address).ok; trail.B.reopens = reopen(B.doc.text, ub.address).ok;
  const refs = [...new Set([question.about, ...[...ca, ...cb].flatMap((c) => [c.ARG0, c.ARG1]).filter((x) => x && !String(x).startsWith("u:"))])];
  const { containers, acyclic, functional, grain, language, by, at, identity } = declare;
  const body = { verdict, question, concerns: rels, differences: mine, outside_concerns: other.length, hunger, witnesses: { A: ua.address, B: ub.address }, refs, declare: { containers, acyclic, functional, grain, language, by, at, identity: identity ?? { merges: [], aparts: [] } } };
  const entry = { cell: "EVA·Figure", kind: "verdict", addr: `pair:${ua.address.sha256.slice(0, 16)}:${ub.address.sha256.slice(0, 16)}`, body, of: [], basis: { reader: "khora readDocument (one door)", language: declare.language, heard: declare.language, rules: "compare.mjs: classify then verdict; default Other is the retrieval policy, Hold is recorded as Hold" }, by: declare.by, at: declare.at };
  entry.id = sha(canon(entry));
  return { verdict, differences: mine, outsideConcerns: other, hunger, trail, entry, coverage: { claimsA: ua.claims.length, claimsB: ub.claims.length, aboutA: ca.length, aboutB: cb.length, saturatedA: ca.filter((c) => c.saturated).length, saturatedB: cb.filter((c) => c.saturated).length }, gaps: [...ua.gaps, ...ub.gaps], years: { A: ua.years, B: ub.years } };
}
export { unwrap as unwrapStatement };
