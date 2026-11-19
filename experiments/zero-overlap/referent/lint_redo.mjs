// node lint_redo.mjs dev  -- PREREG-LINT-REDO.md (DEV, exploratory). Reads through khora's one door; claims by kernel/gfp-claim.js; lint = organs/reasoning-lint.js lintGfp.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)); const KH = "/Users/mlacy/Documents/khora-cast/khora";
process.env.KHORA_PRIORS_DIR ||= `${process.env.HOME}/Documents/janus/priors`;
const { readDocument } = await import(`${KH}/native/reading.js`);
const { gfpClaim, claimKey } = await import(`${KH}/native/kernel/gfp-claim.js`);
const { lintGfp } = await import(`${KH}/native/organs/reasoning-lint.js`);
const set = process.argv[2] ?? "dev"; const MAXPAR = 15;
const ACYCLIC = ["defeat", "beat", "kill", "succeed", "replace", "found", "command", "appoint", "capture", "invade", "precede", "follow"];
const mul = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; const R = mul(20261119);
const AUX = /\b(was|were|is|are|had|has|have|did|would|could|will|can)\b/;
async function read(text) { try { return await readDocument(text, { language: "eng", lexicon: false, referents: true, castIdentity: true, minCharacters: 0 }); } catch { return null; } }
// claims from a read. mode REF: face of the referent mentioned inside the span, else a clause-unique filler. mode HEAD: lowercased head word.
function claimsOf(e, groundOf, mode = "REF") {
  const out = []; if (!e) return out;
  const spans = new Map((e.referents?.spans ?? []).map((s) => [s.id, s]));
  const ments = []; for (const r of e.referents?.referents ?? []) for (const id of r.mentions ?? []) { const s = spans.get(id); if (s) ments.push({ a: s.at[0], b: s.at[1], ref: r }); }
  const fill = (arg, ci, role) => {
    if (!arg) return null;
    if (mode === "HEAD") return String(arg.head ?? arg.text ?? "").toLowerCase() || null;
    let best = null, bo = 0; for (const m of ments) { const o = Math.min(arg.end, m.b) - Math.max(arg.start, m.a); if (o > bo && m.a >= arg.start && m.b <= arg.end) { bo = o; best = m; } }
    return best ? best.ref.face : `u:${ci}:${role}:${arg.head}`;
  };
  (e.clauses ?? []).forEach((c, ci) => {
    if (!c.subject || !c.predicate?.lemma) return;
    const roles = { ARG0: fill(c.subject, ci, "0") }; const o = fill(c.object, ci, "1"); if (o) roles.ARG1 = o;
    try { out.push({ claim: gfpClaim({ ground: groundOf(c), rel: c.predicate.lemma.toLowerCase(), roles, polarity: c.polarity === "-" ? "-" : "+", id: `c${ci}` }), clause: c, ci }); } catch {}
  });
  return out;
}
const lint = (cs) => { try { return lintGfp(cs.map((x) => x.claim), { acyclic: ACYCLIC, strictness: "standard" }); } catch (err) { return { err: String(err).slice(0, 120), findings: [] }; } };
const errs = (r) => (r.findings ?? []).filter((f) => f.severity === "error"); const kinds = (xs) => xs.reduce((m, f) => (m[f.kind] = (m[f.kind] ?? 0) + 1, m), {});
const bound = (v) => v && !String(v).startsWith("u:");
const S = { articles: 0, artWithErr: 0, artKinds: {}, artHEAD: 0, paras: 0, parWithErr: 0, claimsTotal: 0, trials: 0, noClaimTrials: 0, V: { NEG: { n: 0, catchable: 0, caught: 0, caughtAll: 0 }, SWAP: { n: 0, catchable: 0, caught: 0, caughtAll: 0, decl: 0, declCatchable: 0, declCaught: 0 }, DUP: { n: 0, flagged: 0 }, YEAR: { n: 0 } }, examples: [] };
const docs = fs.readdirSync(path.join(HERE, "data", set)).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(fs.readFileSync(path.join(HERE, "data", set, f), "utf8")));
for (const d of docs) {
  const lines = d.text.split("\n"); const offs = []; let p = 0; for (const l of lines) { offs.push(p); p += l.length + 1; }
  const paraOf = (pos) => { let k = 0; while (k + 1 < offs.length && offs[k + 1] <= pos) k++; return k; };
  // N: whole article, paragraph holons
  const e = await read(d.text); S.articles++;
  const cs = claimsOf(e, (c) => `/p${paraOf(c.own?.start ?? 0)}`); S.claimsTotal += cs.length;
  const r = lint(cs); const er = errs(r); if (er.length) { S.artWithErr++; Object.entries(kinds(er)).forEach(([k, v]) => (S.artKinds[k] = (S.artKinds[k] ?? 0) + v)); if (S.examples.length < 6) S.examples.push({ title: d.title, f: er.slice(0, 2).map((f) => ({ kind: f.kind, msg: String(f.message ?? f.note ?? "").slice(0, 200) })) }); }
  if (errs(lint(claimsOf(e, (c) => `/p${paraOf(c.own?.start ?? 0)}`, "HEAD"))).length) S.artHEAD++;
  // N-par and P: seeded paragraph sample
  const cand = lines.map((l, i) => i).filter((i) => lines[i].length >= 150 && /[.!?]\s+[A-Z]/.test(lines[i]));
  for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
  for (const pi of cand.slice(0, MAXPAR)) {
    const P = lines[pi]; const e0 = await read(P); const c0 = claimsOf(e0, () => "/p"); const l0 = lint(c0); const k0 = kinds(errs(l0)); S.paras++; if (errs(l0).length) S.parWithErr++;
    const pick = c0.filter((x) => x.clause.polarity !== "-" && bound(x.claim.roles.ARG0) && x.clause.own); if (!pick.length) { S.noClaimTrials++; continue; }
    const x = pick[Math.floor(R() * pick.length)], c = x.clause; S.trials++;
    const ct = P.slice(c.own.start, c.own.end); const cap = (s) => s.replace(/\s+/g, " ").trim().replace(/[.;,:]+$/, "").replace(/^./, (m) => m.toUpperCase()) + ".";
    const variants = [];
    const neg = AUX.test(ct) ? ct.replace(AUX, (m) => m + " not") : (c.predicate.text && ct.includes(c.predicate.text) ? ct.replace(c.predicate.text, `did not ${c.predicate.lemma}`) : null);
    if (neg && neg !== ct) variants.push(["NEG", cap(neg), { rel: x.claim.rel, roles: x.claim.roles, pol: "-" }]);
    if (c.object && c.subject.end <= c.object.start) { const s0 = c.subject.start - c.own.start, s1 = c.subject.end - c.own.start, o0 = c.object.start - c.own.start, o1 = c.object.end - c.own.start; if (s0 >= 0 && o1 <= ct.length) { const sw = ct.slice(0, s0) + ct.slice(o0, o1) + ct.slice(s1, o0) + ct.slice(s0, s1) + ct.slice(o1); const sr = x.claim.roles; if (sr.ARG1 && bound(sr.ARG1)) variants.push(["SWAP", cap(sw), { rel: x.claim.rel, roles: { ARG0: sr.ARG1, ARG1: sr.ARG0 }, pol: "+" }]); } }
    variants.push(["DUP", cap(ct), { rel: x.claim.rel, roles: x.claim.roles, pol: "+" }]);
    if (/\b(1[0-9]{3}|20[0-9]{2})\b/.test(ct)) S.V.YEAR.n++;
    for (const [kind, vt, want] of variants) {
      const Pv = P + " " + vt; const e1 = await read(Pv); const c1 = claimsOf(e1, () => "/p"); const l1 = lint(c1); const k1 = kinds(errs(l1));
      const more = Object.keys(k1).some((k) => (k1[k] ?? 0) > (k0[k] ?? 0));
      const vcl = c1.filter((y) => y.clause.own && y.clause.own.start >= P.length);
      const catchable = vcl.some((y) => y.claim.rel === want.rel && y.claim.polarity === want.pol && JSON.stringify(y.claim.roles) === JSON.stringify(want.roles));
      const V = S.V[kind]; V.n++;
      if (kind === "DUP") { V.flagged += more; continue; }
      V.catchable += catchable; V.caught += catchable && more; V.caughtAll += more;
      if (kind === "SWAP" && ACYCLIC.includes(want.rel)) { V.decl++; V.declCatchable += catchable; V.declCaught += catchable && more; }
    }
  }
  console.log(d.title, "| claims", cs.length, "| article ERROR findings", er.length, "| trials so far", S.trials, flush());
}
function flush() { return ""; }
fs.writeFileSync(path.join(HERE, `lint-redo-${set}.json`), JSON.stringify(S, null, 1));
const f = (a, b) => (b ? (a / b).toFixed(3) : "n/a");
console.log("\n== LINT REDO (DEV, exploratory)");
console.log(`natural, whole articles: ERROR findings in ${S.artWithErr}/${S.articles} (${f(S.artWithErr, S.articles)}); kinds ${JSON.stringify(S.artKinds)}; HEAD-identity arm ${S.artHEAD}/${S.articles}; claims built ${S.claimsTotal}`);
console.log(`natural, paragraphs: ERROR findings in ${S.parWithErr}/${S.paras} (${f(S.parWithErr, S.paras)})`);
console.log(`trials (paragraphs with a bound-subject clause) ${S.trials}; paragraphs with none ${S.noClaimTrials}`);
for (const k of ["NEG", "SWAP"]) { const V = S.V[k]; console.log(`${k}: variants ${V.n}; catchable ${V.catchable} (${f(V.catchable, V.n)}); caught among catchable ${V.caught}/${V.catchable} (${f(V.caught, V.catchable)}); flagged among all ${V.caughtAll}/${V.n} (${f(V.caughtAll, V.n)})`); }
const W = S.V.SWAP; console.log(`SWAP, declared-asymmetric relations only: variants ${W.decl}; catchable ${W.declCatchable}; caught ${W.declCaught}`);
console.log(`DUP control flagged ${S.V.DUP.flagged}/${S.V.DUP.n}; YEAR plants possible ${S.V.YEAR.n} (no value claim: typed gap)`);
console.log("examples of natural ERROR findings:", JSON.stringify(S.examples, null, 1).slice(0, 1800));
