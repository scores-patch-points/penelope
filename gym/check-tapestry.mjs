// gym/check-tapestry.mjs — keeps the tapestry true. The tapestry is spec →
// weave → cloth, and cloth → unweave → spec; this checks both directions, the
// legend, the references, the coverage of the repo, and drift.
//
//   node gym/check-tapestry.mjs           verify (exit 1 when anything is stale)
//   node gym/check-tapestry.mjs --stamp   after editing gym/tapestry.spec.json
//                                          or the legend: weave TAPESTRY.md and
//                                          LEGEND.md, sync the README block and
//                                          gym/tapestry.html, record the hashes
//   node gym/check-tapestry.mjs --selftest
//
// It fails when:
//   WEAVE    TAPESTRY.md or LEGEND.md is not exactly weave(spec, legend);
//   UNWEAVE  the cloth does not unweave to the spec (lossless), or the faces
//            disagree (organs/cube.mjs::coherent over each thread's Act, Site
//            and Stance placement), or the holon rows, the helix map or the
//            ring of 27 stations disagree with the threads;
//   README   the front page's cloth differs from TAPESTRY.md's;
//   LEGEND   a symbol on the cloth is not in the legend, a legend symbol is
//            never printed, a symbol is not measured one cell wide
//            (gym/glyph-ink.json), or an operator mark differs from cube.mjs;
//   REF      a thread names a file or an EOT entry that does not exist (house
//            files are checked when the sibling repo is here), or an unwoven
//            thread names no falsifier;
//   COVER    an organ, adapter, gym script, ladder file or apps/record.json is
//            named by no thread;
//   DRIFT    a watched file changed since the last stamp.
// Falsifying control: selftest() builds each violation and watches it fire; a
// check that cannot be seen failing is a comment (GL-QA-01).
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { weave, legendMd, tapestryMd, BEGIN, END, load as loadSpec } from "./weave.mjs";
import { unweave } from "./unweave.mjs";
import { MARK, GLYPH, OPERATORS } from "../organs/cube.mjs";

export const SCHEMA = "TapestryStamp@1";
export const GENERATED_PAGE = "gym/tapestry.html";
const SKIP = new Set([".git", "node_modules"]);

const walk = (root, dir = "") => {
  const out = [];
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(root, rel)); else out.push(rel);
  }
  return out;
};
const read = (root, f) => { try { return fs.readFileSync(path.join(root, f), "utf8"); } catch { return null; } };
const sha = (root, f) => createHash("sha256").update(fs.readFileSync(path.join(root, f))).digest("hex");

export const coverable = (files) => files.filter((f) =>
  /^organs\/[^/]+\.mjs$/.test(f) || /^organs\/generation\/.+\.mjs$/.test(f) ||
  (/^gym\/[^/]+\.(mjs|html)$/.test(f) && f !== GENERATED_PAGE) || /^ladder\/[^/]+$/.test(f) || f === "apps/record.json");
export const watched = (files) => files.filter((f) =>
  (/^(organs|gym|ladder)\//.test(f) && f !== "gym/check-tapestry.mjs" && !f.endsWith(".jsonl") && f !== GENERATED_PAGE && !/^gym\/(tapestry\.(spec|legend)\.json|server\.log)$/.test(f)) || f === "apps/record.json" || f === "LOOMS.md");

// the README carries the same cloth: the art in a fence, the key behind a fold
export const readmeBlock = ({ art, key }) => ["", "```text", ...art, "```", "", "<details><summary>⟨⟩</summary>", "", "```text", ...key, "```", "", "</details>", ""].join("\n");
const blockOf = (text) => { const a = text.indexOf(BEGIN), b = text.indexOf(END); return a < 0 || b < a ? null : text.slice(a + BEGIN.length, b); };

// legend, both directions
const symbolsOf = (legend) => {
  const s = new Set();
  for (const [g, v] of Object.entries(legend)) if (!["schema", "note", "terms"].includes(g)) for (const k of Object.keys(v)) for (const c of k) s.add(c);
  return s;
};
const nonAscii = (text) => new Set([...text].filter((c) => c.codePointAt(0) > 127));
export function legendProblems(cloth, legend, ink) {
  const out = [];
  const defined = symbolsOf(legend), printed = nonAscii(cloth);
  for (const c of printed) if (!defined.has(c)) out.push(`LEGEND: ${c} (U+${c.codePointAt(0).toString(16).toUpperCase()}) is printed but not defined`);
  for (const c of defined) if (c.codePointAt(0) > 127 && !printed.has(c)) out.push(`LEGEND: ${c} is defined but never printed`);
  const ops = Object.entries(legend.operator).map(([k, v]) => [v.is, k]);
  for (const [op, mark] of ops) {
    if (MARK[op] !== mark) out.push(`LEGEND: operator ${op} is ${mark} here but ${MARK[op]} in organs/cube.mjs`);
    if (legend.operator[mark].eo !== GLYPH[op]) out.push(`LEGEND: operator ${op} canon glyph ${legend.operator[mark].eo} differs from cube.mjs ${GLYPH[op]}`);
  }
  if (ops.length !== OPERATORS.length) out.push("LEGEND: not nine operators");
  const one = new Set([...(ink.oneCell ?? "")]), near = ink.nearOne ?? {};
  for (const c of defined) if (c.codePointAt(0) > 127 && !one.has(c) && !(c in near)) out.push(`LEGEND: ${c} is not measured one cell wide in gym/glyph-ink.json (re-measure before printing it)`);
  return out;
}

// references and coverage
const resolve = (spec, r) => {
  const pre = Object.keys(spec.prefixes).filter((p) => r.startsWith(p)).sort((a, b) => b.length - a.length)[0];
  return pre ? spec.prefixes[pre] + r.slice(pre.length) : r;
};
export function refProblems(spec, { exists, eotIds, sibling }) {
  const out = [];
  for (const t of spec.threads) for (const r of t.refs) {
    if (/^GL-[A-Z]+-\d+$|^GL-\d+$/.test(r)) { if (!eotIds.has(r)) out.push(`REF: ${t.id} cites ${r}, which is not in GLAUCA-EOT.md`); continue; }
    if (r.startsWith("/")) continue; // a route, not a file — checked by routeProblems
    const rel = resolve(spec, r);
    if (rel.startsWith("../") && !sibling(rel)) continue;   // sibling repo not on this machine: unverifiable, not wrong
    if (!exists(rel)) out.push(`REF: ${t.id} names ${r} (${rel}), which does not exist`);
  }
  for (const t of spec.threads) if (t.st === "·" && !t.ctl) out.push(`REF: ${t.id} is unwoven but names no falsifier (⇒✗)`);
  return out;
}
// The door thread is load-bearing both ways: a route on the cloth must be a
// real pathname in gym/server.mjs, and every server route must be named by
// some thread. A door neither pictures its routes nor keeps them honest.
// Pattern routes (pathname.startsWith) are matched as prefixes.
const ROUTE_EXACT = /pathname === "(\/[^"]+)"/g;
const ROUTE_PREFIX = /pathname\.startsWith\("(\/[^"]+)"\)/g;
export function routeProblems(spec, serverText) {
  const out = [];
  const declared = new Set(spec.threads.flatMap((t) => t.refs.filter((r) => r.startsWith("/"))));
  const exact = new Set([...(serverText ?? "").matchAll(ROUTE_EXACT)].map((m) => m[1]).filter((r) => r !== "/"));
  const prefixes = [...(serverText ?? "").matchAll(ROUTE_PREFIX)].map((m) => m[1]);
  const covered = (r) => exact.has(r) || prefixes.some((p) => r.startsWith(p));
  for (const r of declared) if (!covered(r)) out.push(`ROUTE: ${r} is on the cloth but not a route in gym/server.mjs`);
  for (const r of exact) if (!declared.has(r)) out.push(`ROUTE: ${r} is a route in gym/server.mjs but named by no thread`);
  for (const p of prefixes) if (![...declared].some((r) => r.startsWith(p))) out.push(`ROUTE: ${p}* is a route pattern in gym/server.mjs but named by no thread`);
  return out;
}
export function coverProblems(spec, files) {
  const named = new Set(spec.threads.flatMap((t) => t.refs.map((r) => resolve(spec, r))));
  return coverable(files).filter((f) => !named.has(f)).map((f) => `COVER: ${f} is named by no thread`);
}

export function inspect(root) {
  const problems = [];
  const { spec, legend } = loadSpec();
  const files = walk(root);
  const ink = JSON.parse(read(root, "gym/glyph-ink.json") ?? "{}");
  const w = weave(spec, legend);
  if (read(root, "TAPESTRY.md") !== tapestryMd(w)) problems.push("WEAVE: TAPESTRY.md is not weave(spec, legend) — run --stamp");
  if (read(root, "LEGEND.md") !== legendMd(legend)) problems.push("WEAVE: LEGEND.md is not generated from the legend — run --stamp");
  const back = unweave(read(root, "TAPESTRY.md") ?? "", legend);
  problems.push(...back.problems.map((p) => "UNWEAVE: " + p));
  if (JSON.stringify(back.spec) !== JSON.stringify(spec)) problems.push("UNWEAVE: the cloth does not unweave to the spec (lossy)");
  const readme = read(root, "README.md") ?? "";
  const rb = blockOf(readme);
  if (rb === null) problems.push("README: no tapestry block on the front page — run --stamp");
  else {
    if (rb !== readmeBlock(w)) problems.push("README: the front-page cloth differs from TAPESTRY.md — run --stamp");
    if (JSON.stringify(unweave(readme, legend).spec) !== JSON.stringify(spec)) problems.push("README: the front page does not unweave to the spec");
  }
  problems.push(...legendProblems([...w.art, ...w.key].join("\n"), legend, ink));
  const eot = read(root, "GLAUCA-EOT.md") ?? "";
  const eotIds = new Set([...eot.matchAll(/^### (GL-[A-Z]+-\d+|GL-\d+)\b/gm)].map((m) => m[1]));
  problems.push(...refProblems(spec, { exists: (rel) => fs.existsSync(path.resolve(root, rel)), eotIds, sibling: (rel) => fs.existsSync(path.resolve(root, "../" + rel.split("/")[1])) }));
  problems.push(...routeProblems(spec, read(root, "gym/server.mjs")));
  problems.push(...coverProblems(spec, files));
  const stampRaw = read(root, ".tapestry-stamp.json");
  if (stampRaw === null) problems.push("DRIFT: no stamp yet (run --stamp)");
  else {
    const stamp = JSON.parse(stampRaw), now = new Set(watched(files));
    for (const f of now) {
      if (!(f in stamp.files)) problems.push(`DRIFT: ${f} was added since the weave — re-weave, then --stamp`);
      else if (stamp.files[f] !== sha(root, f)) problems.push(`DRIFT: ${f} changed since the weave — re-weave that thread, then --stamp`);
    }
    for (const f of Object.keys(stamp.files)) if (!now.has(f)) problems.push(`DRIFT: ${f} was removed since the weave — re-weave, then --stamp`);
  }
  return { problems, spec, legend, w, files };
}

const pageOf = ({ art, key }) => {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Penelope Tapestry</title>
<!-- GENERATED by gym/check-tapestry.mjs --stamp from gym/tapestry.spec.json — do not edit -->
<style>:root{--bg:#f6f1e7;--fg:#2b2118}@media(prefers-color-scheme:dark){:root{--bg:#1c1712;--fg:#e8dcc6}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.25 ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px 16px}
pre{margin:0;overflow-x:auto;font-size:clamp(9px,1.9vw,15px);line-height:1.45}</style><pre>${esc(art.join("\n"))}</pre><pre>${esc(key.join("\n"))}</pre>
`;
};

export function stamp(root) {
  const { spec, legend } = loadSpec();
  const w = weave(spec, legend);
  fs.writeFileSync(path.join(root, "TAPESTRY.md"), tapestryMd(w));
  fs.writeFileSync(path.join(root, "LEGEND.md"), legendMd(legend));
  let readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  if (blockOf(readme) === null) return { ok: false, problems: ["README.md has no tapestry:begin/end markers to fill"] };
  readme = readme.slice(0, readme.indexOf(BEGIN) + BEGIN.length) + readmeBlock(w) + readme.slice(readme.indexOf(END));
  fs.writeFileSync(path.join(root, "README.md"), readme);
  fs.writeFileSync(path.join(root, GENERATED_PAGE), pageOf(w));
  const before = inspect(root);
  const hard = before.problems.filter((p) => !p.startsWith("DRIFT"));
  if (hard.length) return { ok: false, problems: hard };
  const files = Object.fromEntries(watched(before.files).sort().map((f) => [f, sha(root, f)]));
  fs.writeFileSync(path.join(root, ".tapestry-stamp.json"), JSON.stringify({ schema: SCHEMA, woven: spec.woven, files }, null, 2) + "\n");
  return { ok: true, problems: [], stamped: Object.keys(files).length, threads: spec.threads.length };
}

// selftest: every failure must fire on a constructed violation
export function selftest() {
  const { spec, legend } = loadSpec();
  const w = weave(spec, legend), cloth = tapestryMd(w), all = [...w.art, ...w.key].join("\n");
  const out = []; const t = (name, ok) => { out.push([name, ok]); if (!ok) throw new Error("tapestry selftest failed: " + name); };
  const swap = (text, a, b) => { if (!text.includes(a)) throw new Error("selftest fixture missing " + a); return text.replace(a, b); };
  const clean = unweave(cloth, legend);
  t("a woven cloth unweaves to its spec, lossless", clean.problems.length === 0 && JSON.stringify(clean.spec) === JSON.stringify(spec));
  t("weave is deterministic", tapestryMd(weave(spec, legend)) === cloth);
  t("a thread moved to another operator's cell on the ACT face is caught", unweave(swap(cloth, "│ ■RDU ■HNT ■MTH ■CHT", "│ ■RDU ■HNT ■SNP ■CHT"), legend).problems.some((p) => /SNP|MTH/.test(p)));
  t("a key cell that differs from the faces is caught", unweave(swap(cloth, "■MTH 0 ●◆ §", "■MTH 0 ●◈ §"), legend).problems.some((p) => p.startsWith("MTH") && /faces say/.test(p)));
  t("a holon row that differs from the key is caught", unweave(swap(cloth, "■MTH●◆", "■MTH●∘"), legend).problems.some((p) => p.startsWith("MTH") && /holon row/.test(p)));
  t("a helix cell that differs from the threads is caught", unweave(swap(cloth, "∅ ∩∃  ∘■", "∅ ∩∃  ∘▫"), legend).problems.some((p) => p.startsWith("helix")));
  t("a thread placed on the wrong face cell is caught by the guard", unweave(cloth.replace("■SPR ■BOX ·RSM ·DEM", "■SPR ■BOX ·RSM ·DEM ■TST"), legend).problems.some((p) => p.startsWith("TST")));
  const ring = unweave(cloth, legend).ring;
  t("the ring of 27 stations is read back from the cloth", ring && ring.read === 27 && ring.problems.length === 0);
  const lg = JSON.parse(JSON.stringify(legend)); delete lg.provenance["↻"];
  const ink = { oneCell: [...symbolsOf(legend)].filter((c) => c.codePointAt(0) > 127).join("") };
  t("a printed symbol missing from the legend is caught", legendProblems(all, lg, ink).some((p) => /↻/.test(p) && /not defined/.test(p)));
  const lg2 = JSON.parse(JSON.stringify(legend)); lg2.logic["⊕"] = { is: "x", means: "x" };
  t("a legend symbol never printed is caught", legendProblems(all, lg2, { oneCell: ink.oneCell + "⊕" }).some((p) => /⊕/.test(p) && /never printed/.test(p)));
  t("a symbol not measured one cell wide is caught", legendProblems(all, legend, { oneCell: "" }).some((p) => /not measured one cell/.test(p)));
  const lg3 = JSON.parse(JSON.stringify(legend)); lg3.operator["→"].is = "SYN";
  t("an operator mark that differs from cube.mjs is caught", legendProblems(all, lg3, ink).some((p) => p.startsWith("LEGEND: operator")));
  const bad = JSON.parse(JSON.stringify(spec)); bad.threads[0].refs.push("o/nope.mjs", "GL-ZZ-99");
  const rp = refProblems(bad, { exists: () => false, eotIds: new Set(), sibling: () => true });
  t("a ref to a file that does not exist is caught", rp.some((p) => /o\/nope\.mjs/.test(p)));
  t("a ref to an EOT entry that does not exist is caught", rp.some((p) => /GL-ZZ-99/.test(p)));
  const noCtl = JSON.parse(JSON.stringify(spec)); delete noCtl.threads.find((x) => x.st === "·").ctl;
  t("an unwoven thread with no falsifier is caught", refProblems(noCtl, { exists: () => true, eotIds: new Set(spec.threads.flatMap((x) => x.refs.filter((r) => /^GL-/.test(r)))), sibling: () => false }).some((p) => /no falsifier/.test(p)));
  t("an organ named by no thread is caught", coverProblems(spec, ["organs/stray.mjs", "organs/cube.mjs"]).some((p) => /organs\/stray\.mjs/.test(p)));
  t("a route on the cloth but not in the server is caught", routeProblems(spec, "no routes here").some((p) => p.startsWith("ROUTE: /api/chat-stream")));
  const noDoors = JSON.parse(JSON.stringify(spec)); noDoors.threads = [];
  t("a server route named by no thread is caught", routeProblems(noDoors, fs.readFileSync(path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), "gym/server.mjs"), "utf8")).some((p) => /\/api\/score/.test(p)));
  return { schema: SCHEMA, checks: out.length, ok: true };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const arg = process.argv[2];
  if (arg === "--selftest") console.log(JSON.stringify(selftest()));
  else if (arg === "--stamp") {
    const r = stamp(root);
    if (!r.ok) { console.error("cannot stamp:\n  " + r.problems.join("\n  ")); process.exit(1); }
    console.log(`woven and stamped: ${r.threads} threads, ${r.stamped} watched files; TAPESTRY.md LEGEND.md README block gym/tapestry.html in step`);
  } else {
    const { problems } = inspect(root);
    if (problems.length) { console.error("TAPESTRY IS STALE:\n  " + problems.join("\n  ") + "\n\nedit gym/tapestry.spec.json (or the legend), then: node gym/check-tapestry.mjs --stamp\nand APPEND the change to GLAUCA-EOT.md"); process.exit(1); }
    console.log("tapestry true to the repo");
  }
}
