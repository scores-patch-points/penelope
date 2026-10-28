// gym/kin-telling-lib.mjs — loading the sources of a window for the G1-3 composer and its checker (shared by the runner and the tests).
// Reads files; the composer and the checker themselves never do.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { kernelPath } from "../organs/kernel-reach.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const FRAMES_PATH = path.join(HERE, "..", "organs", "kin-telling-frames.json");
export const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

/** The two windows the cell is scored on. Paths are the workspace's; an override can name another root. */
export function windowPaths(root = "/Users/mlacy/Downloads/workspace") {
  return {
    dev: { name: "dev", dir: `${root}/foldcode-answer`, plain: `${root}/foldcode-nomodel/out-dev/arm-P.reply.txt` },
    heldout: { name: "heldout", dir: `${root}/foldcode-answer-heldout`, plain: `${root}/foldcode-nomodel/out-heldout/arm-P.reply.txt` },
  };
}

/** Load a window's fold, text, questions and the givers. `janus` is a checkout root (default: kernel-reach's janus). */
export function loadWindow(win, { janus = null } = {}) {
  const priors = (f) => (janus ? path.join(janus, "priors", f) : kernelPath("janus", `priors/${f}`));
  const fold = readJson(path.join(win.dir, "fold.json"));
  const textBuf = fs.readFileSync(fold.inputs.text_ru.path.startsWith("/") ? fold.inputs.text_ru.path : path.join(win.dir, fold.inputs.text_ru.path));
  const lexBuf = fs.readFileSync(priors("kin-lexicon.json"));
  const parBuf = fs.readFileSync(priors("parallel-names-rus-eng.json"));
  const npBuf = fs.readFileSync(priors("name-parts-ru.json"));
  const framesBuf = fs.readFileSync(FRAMES_PATH);
  return {
    name: win.name, fold, textBuf,
    lexicon: JSON.parse(lexBuf), lexiconSha: sha256(lexBuf),
    parallel: JSON.parse(parBuf), parallelSha: sha256(parBuf),
    namePartsRu: JSON.parse(npBuf), namePartsSha: sha256(npBuf),
    frames: JSON.parse(framesBuf), framesSha: sha256(framesBuf),
    questionsDoc: readJson(path.join(win.dir, "questions.json")),
    questions: readJson(path.join(win.dir, "questions.json")).questions,
    plainText: win.plain && fs.existsSync(win.plain) ? fs.readFileSync(win.plain, "utf8") : null,
  };
}

/** The plain answerer's reply, one line per question ("Q7: ..."). */
export function plainLines(plainText) {
  const out = new Map();
  for (const line of String(plainText ?? "").split("\n")) { const m = /^(Q\d+): (.*)$/.exec(line); if (m) out.set(m[1], m[2]); }
  return out;
}

// ── the synthetic growth fixture (B10): facts the real fold lacks, answered by the REAL janus deriveKin, in the fold's own shape.
// Invented names and sentences; a fixture, not data. It shows that the composer and the checker take MORE FACTS without a change (the kin binder
// will add facts to the real fold). `K` is janus native/organs/kinship.js; `lexicon` is priors/kin-lexicon.json.
export function growthFixture(K, lexicon) {
  const lines = ["Пётр, сын Ивана.", "Андрей, сын Ивана.", "Алексей, сын Петра.", "Андрей, брат Петра.", "Иван, отец Петра.", "Иван, дед Алексея."];
  const text = lines.join("\n") + "\n";
  const textBuf = Buffer.from(text, "utf8");
  const span = (s) => { const a = Buffer.byteLength(text.slice(0, text.indexOf(s))); return `ru#${a}-${a + Buffer.byteLength(s)}`; };
  const R = { ivan: "ref_ivan", petr: "ref_petr", andrey: "ref_andrey", alexey: "ref_alexey" };
  const w = (s) => span(s.replace(/\.$/, ""));
  const g = "text:ru";
  const specs = [
    { rel: "parent_of", a: R.ivan, b: R.petr, giver: g, witness: w(lines[0]) }, { rel: "sex", a: R.petr, value: "male", giver: g, witness: w(lines[0]) },
    { rel: "parent_of", a: R.ivan, b: R.andrey, giver: g, witness: w(lines[1]) }, { rel: "sex", a: R.andrey, value: "male", giver: g, witness: w(lines[1]) },
    { rel: "parent_of", a: R.petr, b: R.alexey, giver: g, witness: w(lines[2]) }, { rel: "sex", a: R.alexey, value: "male", giver: g, witness: w(lines[2]) },
    { rel: "sibling_of", a: R.andrey, b: R.petr, giver: g, witness: w(lines[3]) },
    { rel: "parent_of", a: R.ivan, b: R.petr, giver: g, witness: w(lines[4]) }, { rel: "sex", a: R.ivan, value: "male", giver: g, witness: w(lines[4]) },
    { rel: "term", term: "grandfather", a: R.ivan, b: R.alexey, giver: g, witness: w(lines[5]) },
  ];
  const base = K.factBase(specs);
  const rules = K.rulesFromLexicon(lexicon);
  const battery = Object.keys(rules.composites).filter((t) => rules.composites[t].alternatives.some((a) => a.evaluable) && rules.atoms[rules.composites[t].headOf]).sort();
  const stepBrief = (s) => (s.kind === "rule" ? { kind: "rule", rule: s.rule, giver: s.giver, standing: s.standing } : { kind: "fact", rel: s.rel, a: s.a, b: s.b, value: s.value, giver: s.giver, witness: s.witness, standing: s.standing });
  const byReferent = {};
  for (const id of Object.values(R)) {
    byReferent[id] = {};
    for (const term of battery) {
      const a = K.deriveKin({ term, of: id }, { base, rules });
      byReferent[id][term] = { state: a.state, items: a.items.map((i) => ({ who: i.who, derivations: i.derivations.map((d) => ({ standing: d.standing, steps: d.steps.map(stepBrief) })) })), gaps: a.gaps.map((x) => ({ kind: x.kind, slot: x.slot, detail: x.detail ?? null })), ruleNotes: a.ruleNotes };
    }
  }
  const surf = (arr) => arr.map(([t, n], i) => ({ text: t, n, foldedBy: i === 0 ? "most_written" : "case_form_by_declension_table" }));
  const referents = [
    { id: R.ivan, display: "Иван", standing: "referent", surfaces: surf([["Иван", 2], ["Ивана", 2]]) },
    { id: R.petr, display: "Пётр", standing: "referent", surfaces: surf([["Пётр", 1], ["Петра", 2]]) },
    { id: R.andrey, display: "Андрей", standing: "referent", surfaces: surf([["Андрей", 2]]) },
    { id: R.alexey, display: "Алексей", standing: "referent", surfaces: surf([["Алексей", 1], ["Алексея", 1]]) },
  ];
  const facts = base.facts.map((f) => ({ id: f.id, rel: f.rel, a: f.a, b: f.b, value: f.value, term: f.term, giver: f.giver, standing: f.standing, witnesses: f.witnesses }));
  const fold = { schema: "FoldcodeAnswerFold@1", referents, six: Object.values(R), kin: { facts, unbound: [(() => { const a = Buffer.byteLength(text.slice(0, text.indexOf("дед"))); return { why: "both_ends_unbound", byteSpan: [a, a + Buffer.byteLength("дед")], text: "дед", term: "grandfather", cat: "N" }; })()], statements: [] }, derivation: { battery, byReferent } };
  return { fold, textBuf, refs: R, questions: [{ id: "G1", n: 1, template: "C-UNCLE", referent: R.alexey, text: "Who is the uncle of Алексей in this text?", subject: "Алексей", answerable: true, expected: "answer" }, { id: "G2", n: 2, template: "C-UNCLE", referent: R.alexey, text: "Who is the grandfather of Алексей in this text?", subject: "Алексей", answerable: true, expected: "answer" }, { id: "G3", n: 3, template: "T-KIN", referent: R.petr, text: "Which people in this text are Пётр's kin, and how?", subject: "Пётр", answerable: true, expected: "answer" }] };
}
