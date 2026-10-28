// organs/kin-telling.mjs — G1-3, THE ENGLISH COMPOSER for recorded kinship derivations (2026-10-28).
//
// English prose composed from a RECORDED DERIVATION with the model OFF: every sentence is a list of typed segments, and every segment is
// either a word from the closed frame set (organs/kin-telling-frames.json) inside a declared skeleton, or MATERIAL copied from a source
// with an address: a span of the Russian text (ru#a-b, UTF-8 bytes), a string of a giver row (the Wiktionary kin lexicon, ParallelNames@1),
// a string of the derivation record itself (a giver id, a standing), a span of the question (only for the absent-name sentence), or a
// number recomputed from the record. A sentence that states an absence or a count also carries the EXTENT address ru#0-N (the whole text).
// A typed gap is composed as information: the one missing fact and the giver that does not state it. No sentence states a claim that the
// derivation does not hold. What it is NOT: translation, paraphrase, or a model's prose. It is frames around addressed Russian quotations
// and names, plus giver glosses. Pre-registered: gym/kin-telling/PREREG-G1-3-COMPOSER.md (sha256 in its .sha256).
//
// PURE: node built-ins only (crypto); no file, clock, random, network or process access. The caller injects the parsed fold, the text bytes
// and the two giver files. The checker (organs/kin-telling-check.mjs) does not import this file.
//
//   makeKinContext({ fold, textBuf, lexicon, lexiconSha, parallel, parallelSha, window }) -> ctx
//   composeQuestion(ctx, question, { policy, control }) -> { id, kind, sentences, uncomposed, style }
//   composeBattery(ctx, refId, { policy, control })      -> the same, for the 20-term battery of one of the six beings
//   composeWindow(ctx, questions, opts)                  -> { schema, window, docs, batteries, ... }
//   render(doc) / renderTagged(doc)                      -> plain text / text with each sentence's addresses
import { createHash } from "node:crypto";
import frames from "./kin-telling-frames.json" with { type: "json" };

export const KIN_TELLING_SCHEMA = "KinTelling@1";
export const FRAME_SET = Object.freeze(new Set(frames.words));

// ── the declared skeletons (Appendix A of the pre-registration). `[ …]` is an optional clause present only when its slots are given.
export const SKELETONS = Object.freeze({
  REL: ["{ru} is the {term} of {ru}[ ({standing})].", "The text names {ru} as the {term} of {ru}[ ({standing})]."],
  "REL-D": ["{ru} is derived as the {term} of {ru} ({giver}, {standing}).", "The facts make {ru} the {term} of {ru} ({giver}, {standing})."],
  WIT: ["The text states {quote}.", "The text reads {quote}."],
  SEX: ["{ru} is {sex} ({giver}, {standing}).", "{giver} gives {ru} as {sex} ({standing})."],
  SURF: ["{ru} is also written {forms|and}.", "The text also writes {ru} as {forms|and}."],
  GLOSS: ["{ru} is {name} in the aligned edition ({standing}).", "The aligned edition gives {name} for {ru} ({standing})."],
  NONE: ["No {terms|or} of {ru} is derived.", "The facts derive no {terms|or} of {ru}."],
  MISS: ["The text states no {terms|or} of {ru}.", "No {terms|or} of {ru} is stated by the text."],
  "MISS-SEX": ["The text states neither {sex} nor {sex} for {ru}.", "Neither {sex} nor {sex} is stated for {ru} by the text."],
  "MISS-OPEN": ["No {term} of {ru} is stated to be {sex}; absence is not asserted."],
  UNB: ["Kin words in the text with an unbound end: {val}."],
  ABS: ["The reading of the text has no being written {ask}.", "No being written {ask} is in the reading of the text."],
});
const EXTENT_KINDS = new Set(["NONE", "MISS", "MISS-SEX", "MISS-OPEN", "UNB", "ABS"]);

// skeleton string -> parts: { f: frame text } | { s: slot, join?: "or"|"and" } | { opt: [parts] }
function parseSkeleton(str) {
  const out = [];
  let i = 0, buf = "";
  const flush = () => { if (buf) out.push({ f: buf }); buf = ""; };
  const slot = (inner) => { const [name, join] = inner.split("|"); return join ? { s: name, join } : { s: name }; };
  while (i < str.length) {
    const c = str[i];
    if (c === "{") { flush(); const j = str.indexOf("}", i); out.push(slot(str.slice(i + 1, j))); i = j + 1; }
    else if (c === "[") {
      flush(); const j = str.indexOf("]", i); const inner = [];
      let k = i + 1, b2 = "";
      const f2 = () => { if (b2) inner.push({ f: b2 }); b2 = ""; };
      while (k < j) { if (str[k] === "{") { f2(); const e = str.indexOf("}", k); inner.push(slot(str.slice(k + 1, e))); k = e + 1; } else { b2 += str[k]; k++; } }
      f2(); out.push({ opt: inner }); i = j + 1;
    } else { buf += c; i++; }
  }
  flush();
  return out;
}
const PARTS = Object.freeze(Object.fromEntries(Object.entries(SKELETONS).map(([k, v]) => [k, v.map(parseSkeleton)])));

// the frame words actually used by the skeletons must all be in the declared set (the set is a file, the skeletons are code: they must agree)
for (const [kind, variants] of Object.entries(PARTS)) {
  const frameText = (parts) => parts.flatMap((p) => (p.f !== undefined ? [p.f] : p.opt ? frameText(p.opt) : [])).join(" ");
  for (const parts of variants) for (const w of frameText(parts).toLowerCase().match(/[a-z]+/g) ?? []) {
    if (!FRAME_SET.has(w) && w !== "and" && w !== "or") throw new Error(`kin-telling: skeleton ${kind} uses "${w}", which is not in the declared frame set`);
  }
}

// ── segments
const F = (t) => ({ k: "f", t });
const mat = (k) => (t, a) => ({ k, t, a });
const RU = mat("ru"), ROW = mat("row"), REC = mat("rec"), ASK = mat("ask"), VAL = mat("val");
export const renderSeg = (s) => (s.k === "ru" || s.k === "ask" ? `«${s.t}»` : s.t);
export const norm = (s) => String(s).replace(/\s+/g, " ").trim();
const sha = (x) => createHash("sha256").update(x).digest("hex");

const SLOT_KIND = { ru: "ru", quote: "ru", term: "row", sex: "row", name: "row", giver: "rec", standing: "rec", ask: "ask", val: "val", terms: "row", forms: "ru" };

/** Fill a skeleton with segments. `fill` maps a slot name to an array of segments, consumed in order of appearance. */
function realize(kind, vi, fill) {
  const parts = PARTS[kind][Math.min(vi, PARTS[kind].length - 1)];
  const used = {};
  const take = (name) => { const arr = fill[name] ?? []; const i = used[name] ?? 0; used[name] = i + 1; return arr[i]; };
  const segs = [];
  const emit = (ps, optional) => {
    const out = [];
    for (const p of ps) {
      if (p.f !== undefined) out.push(F(p.f));
      else if (p.s && p.join) {
        const items = fill[p.s] ?? [];
        if (!items.length) throw new Error(`kin-telling: empty list for {${p.s}}`);
        used[p.s] = items.length;
        items.forEach((it, n) => {
          if (n > 0) out.push(F(items.length === 2 ? ` ${p.join} ` : n === items.length - 1 ? `, ${p.join} ` : ", "));
          out.push(it);
        });
      } else if (p.s) { const sg = take(p.s); if (!sg) { if (optional) return null; throw new Error(`kin-telling: slot {${p.s}} not filled in ${kind}`); } out.push(sg); }
      else if (p.opt) { const o = emit(p.opt, true); if (o) out.push(...o); }
    }
    return out;
  };
  segs.push(...emit(parts, false));
  // merge adjacent frame segments
  const merged = [];
  for (const s of segs) { const last = merged.at(-1); if (s.k === "f" && last?.k === "f") last.t += s.t; else merged.push({ ...s }); }
  return merged;
}
const textOf = (segs) => segs.map(renderSeg).join("");
const openerOf = (text) => (text.replace(/^[«"“(\s]+/u, "").match(/^[\p{L}\p{N}-]+/u) ?? [""])[0].toLowerCase();

// ── the context: the fold, the text, the givers, indexed once
export function makeKinContext({ fold, textBuf, lexicon, lexiconSha, parallel = null, parallelSha = null, window = "" }) {
  const text = textBuf.toString("utf8");
  const N = textBuf.length;
  const referents = Array.isArray(fold.referents) ? fold.referents : Object.values(fold.referents);
  const ref = new Map(referents.map((r) => [r.id, r]));
  const facts = (fold.kin?.facts ?? []).map((f, idx) => ({ ...f, idx }));
  const sexFacts = new Map();
  for (const f of facts) if (f.rel === "sex") (sexFacts.get(f.a) ?? sexFacts.set(f.a, []).get(f.a)).push(f);
  const atoms = Object.entries(lexicon.atoms).map(([key, a]) => ({ key, ...a, sex: a.sex ?? null }));
  const lexAddr = (path) => `kin-lexicon@${lexiconSha.slice(0, 8)}:${path}`;
  const parAddr = (path) => `parallel-names@${(parallelSha ?? "").slice(0, 8)}:${path}`;
  const cache = new Map();
  const locate = (surface) => {
    if (cache.has(surface)) return cache.get(surface);
    const esc = norm(surface).split(" ").map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
    const m = new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, "u").exec(text);
    let r = null;
    if (m) { const a = Buffer.byteLength(text.slice(0, m.index)); r = { a, b: a + Buffer.byteLength(m[0]), t: norm(m[0]) }; }
    cache.set(surface, r);
    return r;
  };
  return {
    window, fold, text, N, textSha: sha(textBuf), ref, facts, sexFacts, atoms, lexicon, parallel, locate, lexAddr, parAddr,
    unbound: (fold.kin?.unbound ?? []).length,
    battery: fold.derivation?.battery ?? [],
    byReferent: fold.derivation?.byReferent ?? {},
    extent: `ru#0-${N}`,
    slice: (a, b) => norm(textBuf.subarray(a, b).toString("utf8")),
    atomFor(rel, end, sex = null) { return atoms.find((a) => a.rel === rel && a.end === end && a.sex === sex) ?? null; },
    sexAtom(value) { return atoms.find((a) => a.sex === value) ?? null; },
  };
}

// ── material builders (each returns a segment or throws a typed refusal)
class Refusal extends Error { constructor(reason, detail = null) { super(`${reason}${detail ? `: ${detail}` : ""}`); this.reason = reason; this.detail = detail; } }

function nameSeg(ctx, id, control) {
  const real = control?.id ? control.id(id) : id;
  const r = ctx.ref.get(real);
  if (!r) throw new Refusal("being_not_in_reading", real);
  const loc = ctx.locate(r.display);
  if (!loc) throw new Refusal("name_not_addressable", r.display);
  return RU(loc.t, `ru#${loc.a}-${loc.b}`);
}
function formSeg(ctx, surface) {
  const loc = ctx.locate(surface);
  return loc ? RU(loc.t, `ru#${loc.a}-${loc.b}`) : null;
}
function witSeg(ctx, addr, control) {
  const real = control?.wit ? control.wit(addr) : addr;
  const m = /^ru#(\d+)-(\d+)$/.exec(real);
  if (!m) throw new Refusal("witness_not_a_byte_span", real);
  return RU(ctx.slice(+m[1], +m[2]), real);
}
function atomSeg(ctx, atom) {
  if (!atom) throw new Refusal("term_not_in_lexicon");
  return ROW(atom.key, ctx.lexAddr(`key:atoms/${atom.key}`));
}
function compositeSeg(ctx, term) {
  if (!ctx.lexicon.composites?.[term]) throw new Refusal("term_not_in_lexicon", term);
  return ROW(term, ctx.lexAddr(`key:composites/${term}`));
}
function sexSeg(ctx, value) {
  const a = ctx.sexAtom(value);
  if (!a) throw new Refusal("sex_value_not_in_lexicon", value);
  return ROW(value, ctx.lexAddr(`val:atoms/${a.key}/sex`));
}
const recSeg = (ctx, value, path) => REC(value, `fold:${path}`);
const factRec = (ctx, idx, field) => REC(ctx.facts[idx][field], `fold:kin/facts/${idx}/${field}`);
const standingOf = (ctx, idxs) => {
  const order = ["given", "candidate", "opinion"];
  let worst = 0, at = idxs[0];
  for (const i of idxs) { const s = Math.max(0, order.indexOf(ctx.facts[i].standing)); if (s > worst) { worst = s; at = i; } }
  return { standing: order[worst], at };
};

// ── the record builders (no extractor, no model): kin_of, term_of, identity, absent
function holders(ctx, atom, y) {
  const out = [], pending = [];
  const consider = (x, rf) => {
    if (atom.sex) {
      const sx = ctx.sexFacts.get(x) ?? [];
      if (!sx.length) { pending.push(x); return; }
      const hit = sx.find((f) => f.value === atom.sex);
      if (!hit) return;
      out.push({ x, facts: [rf, hit.idx] });
    } else out.push({ x, facts: [rf] });
  };
  for (const f of ctx.facts) {
    if (atom.rel === "parent_of" && f.rel === "parent_of") {
      if (atom.end === "a" && f.b === y) consider(f.a, f.idx);
      if (atom.end === "b" && f.a === y) consider(f.b, f.idx);
    } else if ((atom.rel === "sibling_of" || atom.rel === "spouse_of") && f.rel === atom.rel) {
      if (f.a === y) consider(f.b, f.idx); else if (f.b === y) consider(f.a, f.idx);
    }
  }
  return { out, pending };
}
const GAP_KIND = { parent_of: "no_parent_fact", sibling_of: "no_sibling_fact", spouse_of: "no_spouse_fact" };

export function recordKinOf(ctx, X) {
  const items = [], gaps = [], pendingSex = [];
  const seenGroups = new Set();
  for (const base of ctx.atoms.filter((a) => a.sex === null)) {
    const gkey = `${base.rel}|${base.end}`;
    if (seenGroups.has(gkey)) continue; seenGroups.add(gkey);
    const sexed = ctx.atoms.filter((a) => a.rel === base.rel && a.end === base.end && a.sex);
    const h = holders(ctx, base, X);
    if (!h.out.length) {
      gaps.push({ kind: GAP_KIND[base.rel], slot: base.rel === "parent_of" ? (base.end === "a" ? { rel: "parent_of", a: "?", b: X } : { rel: "parent_of", a: X, b: "?" }) : { rel: base.rel, a: "?", b: X }, relTerm: base.key });
      continue;
    }
    for (const it of h.out) {
      const sx = ctx.sexFacts.get(it.x) ?? [];
      const spec = sexed.find((a) => sx.some((f) => f.value === a.sex));
      if (spec) {
        const sf = sx.find((f) => f.value === spec.sex);
        items.push({ who: it.x, term: spec.key, facts: [...it.facts, sf.idx] });
      } else {
        items.push({ who: it.x, term: base.key, facts: it.facts });
        if (!sx.length && sexed.length) pendingSex.push(it.x);
      }
    }
  }
  items.sort((p, q) => Math.min(...p.facts) - Math.min(...q.facts) || (p.who < q.who ? -1 : 1));
  return { kind: "kin_of", subject: X, items, gaps, pendingSex: [...new Set(pendingSex)].sort() };
}

function recordTermOf(ctx, X, term) {
  const cell = ctx.byReferent[X]?.[term];
  if (!cell) throw new Refusal("no_recorded_cell", `${X}/${term}`);
  return { kind: "term_of", subject: X, term, cell, cellPath: `derivation/byReferent/${X}/${term}` };
}

// ── claims -> sentences
// A claim is { kind, fill, ... }. `fill` holds the segment arrays; EXTENT_KINDS carry the extent address.
const claim = (kind, fill, meta = {}) => ({ kind, fill, ...meta });

function relClaims(ctx, rec, control) {
  const claims = [], wits = [];
  const X = rec.subject;
  for (const it of rec.items) {
    const st = standingOf(ctx, it.facts);
    const atom = ctx.atoms.find((a) => a.key === it.term);
    const fill = { ru: [nameSeg(ctx, it.who, control), nameSeg(ctx, X, control)], term: [atomSeg(ctx, atom)] };
    if (st.standing !== "given") fill.standing = [factRec(ctx, st.at, "standing")];
    claims.push(claim("REL", fill, { who: it.who, term: it.term }));
    for (const fi of it.facts) {
      const w = ctx.facts[fi].witnesses?.[0] ?? ctx.facts[fi].witness;
      if (w && !wits.includes(w)) wits.push(w);
    }
  }
  return { claims, wits };
}
const witClaims = (ctx, wits, control) => wits.map((w) => claim("WIT", { quote: [witSeg(ctx, w, control)] }));

function missClaims(ctx, gaps, control, notes = []) {
  // group by subject: relation terms; sex gaps and open-world gaps separately. A gap is composed only when the sentence is TRUE of the facts the
  // composer holds; a recorded gap that the facts contradict is listed in `notes` (inexpressible), never composed.
  const bySubject = new Map(), sex = [], open = [];
  for (const g of gaps) {
    const s = g.slot ?? {};
    if (g.kind === "no_sex_fact") { if (!sex.includes(s.a) && !(ctx.sexFacts.get(s.a) ?? []).length) sex.push(s.a); else if ((ctx.sexFacts.get(s.a) ?? []).length) notes.push({ gap: g.kind, slot: s, why: "a_sex_fact_exists" }); continue; }
    if (g.kind === "open_world_empty") {
      const stated = ctx.facts.some((f) => f.rel === "sibling_of" && (f.a === s.b || f.b === s.b) && (ctx.sexFacts.get(f.a === s.b ? f.b : f.a) ?? []).some((x) => x.value === "male"));
      if (stated) notes.push({ gap: g.kind, slot: s, why: "a_male_sibling_is_stated" }); else if (!open.includes(s.b)) open.push(s.b);
      continue;
    }
    if (!GAP_KIND_SET.has(g.kind)) throw new Refusal("no_frame_for_gap_kind", g.kind);
    const subj = s.a === "?" ? s.b : s.a;
    const end = s.rel === "parent_of" ? (s.a === "?" ? "a" : "b") : "a";
    let atom = ctx.atomFor(s.rel, end, null);
    // the head slot of a composite's rule names the head ATOM (mother, not parent): the missing fact is the sexed one
    const comp = g.cellTerm ? ctx.lexicon.composites?.[g.cellTerm] : null;
    const head = comp ? ctx.atoms.find((a) => a.key === comp.head_of) : null;
    if (head && subj === g.cellSubject && head.rel === s.rel && head.end === end) atom = head;
    if (holders(ctx, atom, subj).out.length) { notes.push({ gap: g.kind, slot: s, why: "a_fact_states_it" }); continue; }
    const set = bySubject.get(subj) ?? bySubject.set(subj, new Set()).get(subj);
    set.add(atom.key);
  }
  const claims = [];
  const order = ctx.atoms.map((a) => a.key);
  for (const [subj, set] of bySubject) {
    const terms = order.filter((k) => set.has(k)).map((k) => atomSeg(ctx, ctx.atoms.find((a) => a.key === k)));
    claims.push(claim("MISS", { terms, ru: [nameSeg(ctx, subj, control)] }, { subject: subj }));
  }
  for (const z of sex) claims.push(claim("MISS-SEX", { sex: [sexSeg(ctx, "male"), sexSeg(ctx, "female")], ru: [nameSeg(ctx, z, control)] }, { subject: z }));
  for (const b of open) claims.push(claim("MISS-OPEN", { term: [atomSeg(ctx, ctx.atomFor("sibling_of", "a", null))], ru: [nameSeg(ctx, b, control)], sex: [sexSeg(ctx, "male")] }, { subject: b }));
  return claims;
}
const GAP_KIND_SET = new Set(Object.values(GAP_KIND));

function kinOfClaims(ctx, rec, control) {
  const { claims, wits } = relClaims(ctx, rec, control);
  const out = [...claims, ...witClaims(ctx, wits, control)];
  const gapRecs = [...rec.pendingSex.map((z) => ({ kind: "no_sex_fact", slot: { rel: "sex", a: z, value: "?" } })), ...rec.gaps];
  const miss = missClaims(ctx, gapRecs, control);
  out.push(...miss.filter((c) => c.kind === "MISS-SEX"), ...miss.filter((c) => c.kind === "MISS"));
  if (miss.some((c) => c.kind === "MISS") && ctx.unbound > 0) out.push(claim("UNB", { val: [VAL(String(ctx.unbound), "val:count(kin/unbound)")] }));
  return out;
}

function identityClaims(ctx, X, control) {
  const r = ctx.ref.get(X);
  if (!r) throw new Refusal("being_not_in_reading", X);
  const out = [];
  const forms = r.surfaces.filter((s) => s.text !== r.display).sort((p, q) => q.n - p.n);
  const formSegs = forms.map((s) => formSeg(ctx, s.text)).filter(Boolean);
  if (formSegs.length) out.push(claim("SURF", { ru: [nameSeg(ctx, X, control)], forms: formSegs }));
  const prow = ctx.parallel?.rows?.findIndex((row) => !row.collidesWith && row.forms.some((f) => r.surfaces.some((s) => s.text === f.form)));
  if (prow >= 0) {
    const row = ctx.parallel.rows[prow];
    out.push(claim("GLOSS", { ru: [nameSeg(ctx, X, control)], name: [ROW(row.english, ctx.parAddr(`val:rows/${prow}/english`))], standing: [ROW(row.standing, ctx.parAddr(`val:rows/${prow}/standing`))] }));
  }
  const seenSex = new Set();
  for (const f of ctx.sexFacts.get(X) ?? []) {
    const key = `${f.value}|${f.giver}|${f.standing}`;
    if (seenSex.has(key)) continue; seenSex.add(key);
    out.push(claim("SEX", { ru: [nameSeg(ctx, X, control)], sex: [sexSeg(ctx, f.value)], giver: [factRec(ctx, f.idx, "giver")], standing: [factRec(ctx, f.idx, "standing")] }, { witness: f.witnesses?.[0] }));
  }
  const rec = recordKinOf(ctx, X);
  out.push(...kinOfClaims(ctx, rec, control));
  return out;
}

// a recorded derivation cell (janus deriveKin, stored by the fold): answered items are REL-D, a gap cell is NONE plus the typed gaps
function termClaims(ctx, recs, control, notes = []) {
  const out = [], wits = [], noneByS = new Map(), gaps = [], seen = new Set();
  for (const rec of recs) {
    const { cell, subject: X, term } = rec;
    if (cell.state !== "gap" && cell.items?.length) {
      cell.items.forEach((it, i) => it.derivations.forEach((d, j) => {
        const ruleStepIdx = d.steps.findIndex((s) => s.kind === "rule");
        const ruleStep = d.steps[ruleStepIdx];
        const base = `${rec.cellPath}/items/${i}/derivations/${j}`;
        const key = `${it.who}|${term}|${ruleStep?.giver ?? "stated"}|${d.standing}`;
        if (!seen.has(key)) {
          seen.add(key);
          if (ruleStep) {
            out.push(claim("REL-D", {
              ru: [nameSeg(ctx, it.who, control), nameSeg(ctx, X, control)],
              term: [compositeSeg(ctx, term)],
              giver: [REC(ruleStep.giver, `fold:${base}/steps/${ruleStepIdx}/giver`)],
              standing: [REC(d.standing, `fold:${base}/standing`)],
            }, { who: it.who, term }));
          } else {
            // a composite term the text states outright (a `term` fact): a stated relation, no rule step
            const fill = { ru: [nameSeg(ctx, it.who, control), nameSeg(ctx, X, control)], term: [compositeSeg(ctx, term)] };
            if (d.standing !== "given") fill.standing = [REC(d.standing, `fold:${base}/standing`)];
            out.push(claim("REL", fill, { who: it.who, term }));
          }
        }
        for (const s of d.steps) if (s.kind === "fact" && s.witness && !wits.includes(s.witness)) wits.push(s.witness);
      }));
    }
    if (cell.state === "gap" || !cell.items?.length) {
      const set = noneByS.get(X) ?? noneByS.set(X, []).get(X);
      if (!set.includes(term)) set.push(term);
    }
    gaps.push(...(cell.gaps ?? []).map((g) => ({ ...g, cellTerm: term, cellSubject: X })));
  }
  out.push(...witClaims(ctx, wits, control));
  for (const [X, terms] of noneByS) out.push(claim("NONE", { terms: terms.map((t) => compositeSeg(ctx, t)), ru: [nameSeg(ctx, X, control)] }, { subject: X }));
  const miss = missClaims(ctx, gaps, control, notes);
  out.push(...miss.filter((c) => c.kind === "MISS-SEX"), ...miss.filter((c) => c.kind === "MISS"), ...miss.filter((c) => c.kind === "MISS-OPEN"));
  return out;
}

function absentClaims(ctx, question) {
  const name = norm(question.subject ?? "");
  const hit = [...ctx.ref.values()].find((r) => r.surfaces.some((s) => norm(s.text).toLowerCase() === name.toLowerCase()));
  if (hit) throw new Refusal("subject_has_a_referent", hit.id);
  const at = question.text.indexOf(name);
  if (!name || at < 0) throw new Refusal("name_not_in_question", name);
  return [claim("ABS", { ask: [ASK(name, `q:${question.id}#${at}-${at + name.length}`)] })];
}

// ── choosing the variants (cadence): among the LAWFUL skeletons, the first whose opening word differs from the previous sentence's.
// A variant is lawful when its sentence opens with a capital letter (or a quotation mark), ends with a full stop and its quotes and parentheses balance.
const lawfulText = (t) => {
  const first = (t.match(/\p{L}/u) ?? [""])[0];
  const open = /^[«“]/.test(t) || !first || first === first.toUpperCase();
  const bal = (a, b) => (t.match(a) ?? []).length === (t.match(b) ?? []).length;
  return open && /\.$/.test(t) && bal(/«/g, /»/g) && bal(/\(/g, /\)/g);
};
function assemble(ctx, claims, policy = "chosen") {
  const sentences = [], style = [];
  let prev = "";
  for (const c of claims) {
    const n = PARTS[c.kind].length;
    const built = [...Array(n).keys()].map((vi) => { const segs = realize(c.kind, vi, c.fill); return { vi, segs, text: textOf(segs) }; });
    const lawful = built.filter((b) => lawfulText(b.text));
    if (!lawful.length) throw new Refusal("no_lawful_variant", c.kind);
    let pick;
    if (policy === "first") pick = lawful[0];
    else if (policy === "second") pick = lawful.find((b) => b.vi === Math.min(1, n - 1)) ?? lawful[0];
    else { pick = lawful.find((b) => openerOf(b.text) !== prev); if (!pick) { pick = lawful[0]; style.push({ note: "opener_repeats", kind: c.kind }); } }
    prev = openerOf(pick.text);
    sentences.push({ claim: c.kind, variant: pick.vi, text: pick.text, segs: pick.segs, ...(EXTENT_KINDS.has(c.kind) ? { extent: ctx.extent } : {}) });
  }
  return { sentences, style };
}

/** Compose the answer to one question of the window. A question the composer cannot compose from a record carries a typed reason, never a sentence. */
export function composeQuestion(ctx, question, { policy = "chosen", control = null } = {}) {
  const doc = { id: question.id, template: question.template, text: question.text, kind: null, sentences: [], uncomposed: [], style: [], inexpressible: [] };
  try {
    let claims;
    if (question.template === "T-KIN") { doc.kind = "kin_of"; claims = kinOfClaims(ctx, recordKinOf(ctx, question.referent), control); }
    else if (question.template === "T-ID") { doc.kind = "identity"; claims = identityClaims(ctx, question.referent, control); }
    else if (question.template === "C-UNCLE") {
      doc.kind = "term_of";
      const term = /^Who is the (.+) of .+ in this text\?$/.exec(question.text)?.[1];
      if (!term) throw new Refusal("term_not_in_question");
      claims = termClaims(ctx, [recordTermOf(ctx, question.referent, term)], control, doc.inexpressible);
    } else if (question.template === "C-ABSENT") { doc.kind = "absent"; claims = absentClaims(ctx, question); }
    else { doc.kind = "unsupported"; throw new Refusal("no_record_for_question_kind", question.template); }
    const { sentences, style } = assemble(ctx, claims, policy);
    doc.sentences = sentences; doc.style = style;
  } catch (e) {
    if (!(e instanceof Refusal)) throw e;
    doc.uncomposed.push({ reason: e.reason, detail: e.detail });
  }
  return doc;
}

/** The whole recorded battery of one of the six beings (every term's cell), as one paragraph. */
export function composeBattery(ctx, refId, { policy = "chosen", control = null } = {}) {
  const doc = { id: `B:${refId}`, template: "BATTERY", text: `battery of ${refId}`, kind: "battery", sentences: [], uncomposed: [], style: [], inexpressible: [] };
  try {
    const recs = ctx.battery.map((t) => recordTermOf(ctx, refId, t));
    const { sentences, style } = assemble(ctx, termClaims(ctx, recs, control, doc.inexpressible), policy);
    doc.sentences = sentences; doc.style = style;
  } catch (e) {
    if (!(e instanceof Refusal)) throw e;
    doc.uncomposed.push({ reason: e.reason, detail: e.detail });
  }
  return doc;
}

export function composeWindow(ctx, questions, { policy = "chosen", control = null, battery = true } = {}) {
  const docs = questions.map((q) => composeQuestion(ctx, q, { policy, control }));
  const six = battery ? (ctx.fold.six ?? Object.keys(ctx.byReferent)) : [];
  const batteries = six.map((id) => composeBattery(ctx, id, { policy, control }));
  return { schema: KIN_TELLING_SCHEMA, window: ctx.window, textSha256: ctx.textSha, extent: ctx.extent, docs, batteries };
}

export const render = (doc) => doc.sentences.map((s) => s.text).join(" ");
export const renderTagged = (doc) => doc.sentences.map((s) => `${s.text} [${[...new Set([...s.segs.filter((g) => g.a).map((g) => g.a), ...(s.extent ? [s.extent] : [])])].join(" ")}]`).join("\n");

export const selftest = () => {
  const t = (n, c) => { if (!c) throw new Error(`kin-telling selftest failed: ${n}`); };
  t("frame set is declared", FRAME_SET.size === frames.words.length && FRAME_SET.has("text"));
  const segs = realize("REL", 0, { ru: [RU("Элен", "ru#0-8"), RU("князь Василий", "ru#9-30")], term: [ROW("daughter", "x")] });
  t("REL renders", textOf(segs) === "«Элен» is the daughter of «князь Василий».");
  const segs2 = realize("NONE", 0, { terms: [ROW("aunt", "x"), ROW("uncle", "y"), ROW("grandfather", "z")], ru: [RU("Пьер", "ru#1-2")] });
  t("a list joins with an Oxford or", textOf(segs2) === "No aunt, uncle, or grandfather of «Пьер» is derived.");
  return { ok: true };
};
