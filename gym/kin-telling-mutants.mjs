// gym/kin-telling-mutants.mjs — the checker's self-test for G1-3 (pre-registration section 3, with Amendment 1): mutants of composed sentences,
// each of which the checker must reject. A check never seen firing is a comment.
//
// The generator has its OWN tiny truth table over the raw facts (`holds`), separate from the checker, so that a mutant which is still TRUE
// under the fold is skipped as equivalent instead of being counted as a survivor. Operators:
//   M1 remove an address        M2 change a byte of a Russian segment    M3 a frame word outside the set     M4 reverse the relation term (REL)
//   M5 swap the two names (REL) M6 a quoted witness of an unstated fact  M7 add a sentence stating an absent fact   M8 retype a segment self:model
//   M9 delete the extent        M10 move a gap sentence to a being that holds the fact (MISS)
import { norm } from "../organs/kin-telling.mjs";

const render = (g) => (g.k === "ru" || g.k === "ask" ? `«${g.t}»` : g.t);
const rebuild = (s, segs) => ({ ...s, segs, text: segs.map(render).join("") });
const clone = (s) => JSON.parse(JSON.stringify(s));

export function makeMutator({ fold, textBuf, lexicon, lexiconSha }) {
  const facts = fold.kin.facts;
  const referents = Array.isArray(fold.referents) ? fold.referents : Object.values(fold.referents);
  const atoms = Object.entries(lexicon.atoms).map(([key, a]) => ({ key, ...a, sex: a.sex ?? null }));
  const text = textBuf.toString("utf8");
  const idsOf = (t) => referents.filter((r) => r.surfaces.some((s) => norm(s.text) === t)).map((r) => r.id);
  // x is atom of y by stated facts (a separate, small implementation)
  const holds = (key, x, y) => {
    const a = atoms.find((z) => z.key === key);
    if (!a) return false;
    return facts.some((f) => {
      const rel = a.rel === "parent_of" ? (f.rel === "parent_of" && (a.end === "a" ? f.a === x && f.b === y : f.a === y && f.b === x)) : f.rel === a.rel && ((f.a === x && f.b === y) || (f.a === y && f.b === x));
      return rel && (!a.sex || facts.some((s) => s.rel === "sex" && s.a === x && s.value === a.sex));
    });
  };
  const holdsAny = (key, xs, ys) => xs.some((x) => ys.some((y) => holds(key, x, y)));
  const display = (id) => referents.find((r) => r.id === id).display;
  const locate = (surface) => {
    const esc = norm(surface).split(" ").map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
    const m = new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, "u").exec(text);
    if (!m) return null;
    const a = Buffer.byteLength(text.slice(0, m.index));
    return { t: norm(m[0]), a: `ru#${a}-${a + Buffer.byteLength(m[0])}` };
  };
  const witnesses = [...new Set(facts.flatMap((f) => f.witnesses ?? []))].sort();
  const sliceOf = (w) => { const m = /^ru#(\d+)-(\d+)$/.exec(w); return norm(textBuf.subarray(+m[1], +m[2]).toString("utf8")); };
  const lexAddr = (path) => `kin-lexicon@${lexiconSha.slice(0, 8)}:${path}`;

  // all mutants of one sentence: [{ op, sentence }]; `doc` supplies the witnesses it already quotes (for M6)
  function mutantsOf(s, doc) {
    const out = [];
    const mats = s.segs.map((g, i) => [g, i]).filter(([g]) => g.k !== "f");
    // M1
    if (mats.length) { const m = clone(s); delete m.segs[mats[0][1]].a; out.push({ op: "M1", sentence: m }); }
    // M2: change one letter of a ru segment
    const ru = s.segs.findIndex((g) => g.k === "ru");
    if (ru >= 0) { const m = clone(s); const t = m.segs[ru].t; const i = [...t].findIndex((c) => /\p{L}/u.test(c)); m.segs[ru].t = [...t].map((c, j) => (j === i ? (c === "я" ? "а" : "я") : c)).join(""); out.push({ op: "M2", sentence: rebuild(m, m.segs) }); }
    // M3: a frame word outside the set
    const fi = s.segs.findIndex((g) => g.k === "f" && /\p{L}{3,}/u.test(g.t));
    if (fi >= 0) { const m = clone(s); m.segs[fi].t = m.segs[fi].t.replace(/\p{L}{3,}/u, (w) => (w[0] === w[0].toUpperCase() ? "Zorb" : "zorb")); out.push({ op: "M3", sentence: rebuild(m, m.segs) }); }
    // M4: reverse the relation term of a REL (parent <-> child, father <-> son, ...), only if the reversed claim is false
    if (s.claim === "REL") {
      const tIdx = s.segs.findIndex((g) => g.k === "row");
      const rus = s.segs.filter((g) => g.k === "ru");
      const a = atoms.find((z) => z.key === s.segs[tIdx].t);
      const other = a && atoms.find((z) => z.rel === a.rel && z.end !== a.end && z.sex === null);
      if (other && other.key !== a.key) {
        const falseNow = !holdsAny(other.key, idsOf(rus[0].t), idsOf(rus[1].t));
        if (falseNow) { const m = clone(s); m.segs[tIdx] = { k: "row", t: other.key, a: lexAddr(`key:atoms/${other.key}`) }; out.push({ op: "M4", sentence: rebuild(m, m.segs) }); }
      }
      // M5: swap the two names, only if the swapped claim is false
      const ri = s.segs.map((g, i) => [g, i]).filter(([g]) => g.k === "ru").map(([, i]) => i);
      if (ri.length === 2 && !holdsAny(s.segs[tIdx].t, idsOf(rus[1].t), idsOf(rus[0].t))) {
        const m = clone(s); const [i, j] = ri; [m.segs[i], m.segs[j]] = [m.segs[j], m.segs[i]]; out.push({ op: "M5", sentence: rebuild(m, m.segs) });
      }
    }
    // M6: replace a quoted witness by a witness the paragraph does not quote (and so does not state)
    if (s.claim === "WIT") {
      const quoted = new Set(doc.sentences.filter((x) => x.claim === "WIT").map((x) => x.segs.find((g) => g.k === "ru").a));
      const repl = witnesses.find((w) => !quoted.has(w));
      if (repl) { const m = clone(s); const q = m.segs.findIndex((g) => g.k === "ru"); m.segs[q] = { k: "ru", t: sliceOf(repl), a: repl }; out.push({ op: "M6", sentence: rebuild(m, m.segs) }); }
    }
    // M8: retype the first material segment
    if (mats.length) { const m = clone(s); m.segs[mats[0][1]].k = "self:model"; out.push({ op: "M8", sentence: m }); }
    // M9: delete the extent
    if (s.extent) { const m = clone(s); delete m.extent; out.push({ op: "M9", sentence: m }); }
    // M10: a MISS about a being that holds the first listed term
    if (s.claim === "MISS") {
      const first = s.segs.find((g) => g.k === "row")?.t;
      const a = atoms.find((z) => z.key === first);
      const f = a && facts.find((x) => x.rel === a.rel && x.rel !== "sex");
      if (f) {
        const holder = a.rel === "parent_of" ? (a.end === "a" ? f.b : f.a) : f.a;
        const loc = locate(display(holder));
        const ri = s.segs.findIndex((g) => g.k === "ru");
        if (loc && ri >= 0 && loc.t !== s.segs[ri].t) { const m = clone(s); m.segs[ri] = { k: "ru", t: loc.t, a: loc.a }; out.push({ op: "M10", sentence: rebuild(m, m.segs) }); }
      }
    }
    return out.filter((x) => x.sentence.text !== s.text || x.op === "M1" || x.op === "M8" || x.op === "M9");
  }

  // M7: a sentence that states a relation no fact states, appended to the paragraph
  function absentFactSentence() {
    const parent = atoms.find((a) => a.key === "parent");
    for (const x of referents) for (const y of referents) {
      if (x.id === y.id || holdsAny("parent", [x.id], [y.id]) || holdsAny("parent", [y.id], [x.id]) || holdsAny("child", [x.id], [y.id])) continue;
      const lx = locate(x.display), ly = locate(y.display);
      if (!lx || !ly) continue;
      const segs = [{ k: "ru", t: lx.t, a: lx.a }, { k: "f", t: " is the " }, { k: "row", t: "parent", a: lexAddr("key:atoms/parent") }, { k: "f", t: " of " }, { k: "ru", t: ly.t, a: ly.a }, { k: "f", t: "." }];
      return { claim: "REL", variant: 0, text: segs.map(render).join(""), segs };
    }
    return null;
  }
  return { mutantsOf, absentFactSentence };
}
