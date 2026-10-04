// gym/unweave.mjs — the tapestry, read back. From the text of the tapestry
// ALONE (TAPESTRY.md, or the block on the README's front page) it recovers the
// whole spec: every thread, its cube cell, its level, its references, the
// pipeline's order — and it checks the cube's own guard on the way, because
// every thread stands on three faces and each axis is therefore stated twice.
//
//   node gym/unweave.mjs [file]      prints the recovered spec (JSON); exit 1 on a broken weave
//   node gym/unweave.mjs --problems  prints only the problems
//
// What it reads, independently (each is a checksum on the others):
//   ⟨⟩ key rows ........ id, name, status, level, cell, typing, refs, falsifier
//   ◀ ACT panel ........ the operator of each thread        (mode × domain)
//   ▲ SITE panel ....... the terrain of each thread         (domain × grain)
//   ▶ STANCE panel ..... the stance of each thread          (mode × grain)
//   ↑ ↓ holon rows ..... the level, and op+grain, of each thread
//   helix rows ......... the strongest status per cell, the spine's codes
// A thread whose faces disagree is grain-mixed (organs/cube.mjs::coherent).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { OPERATORS, GRAINS, MODES, DOMAINS, TERRAIN_BY_DOMAIN, STANCE_BY_MODE, actOf, coherent, cellOf } from "../organs/cube.mjs";
import { BEGIN, END, ZONES, marksOf, cellStatus, ringLayout, RING } from "./weave.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CODE = /[■□·][A-Z]{3}/g;

const inner = (l) => l.replace(/^║/, "").replace(/║$/, "");
const fenced = (text) => {
  const a = text.indexOf(BEGIN), b = text.indexOf(END);
  const body = a >= 0 && b > a ? text.slice(a + BEGIN.length, b) : text;
  const out = []; let on = false;
  for (const l of body.split("\n")) { if (l.startsWith("```")) { on = !on; continue; } if (on) out.push(l); }
  return out;
};

export function unweave(text, legend = JSON.parse(fs.readFileSync(path.join(HERE, "tapestry.legend.json"), "utf8"))) {
  const problems = [];
  const M = marksOf(legend);
  const opOf = Object.fromEntries(Object.entries(M.op).map(([k, v]) => [v, k]));
  const grainOf = Object.fromEntries(Object.entries(M.grain).map(([k, v]) => [v, k]));
  const modeOf = Object.fromEntries(Object.entries(M.mode).map(([k, v]) => [v, k]));
  const domainOf = Object.fromEntries(Object.entries(M.domain).map(([k, v]) => [v, k]));
  const lines = fenced(text);
  const zoneAt = (z) => lines.findIndex((l) => l.startsWith("╠═[ " + ZONES[z] + " ]") || l.startsWith("╔═[ " + ZONES[z] + " ]"));
  const zi = Object.fromEntries(Object.keys(ZONES).map((z) => [z, zoneAt(z)]));
  for (const [z, i] of Object.entries(zi)) if (i < 0) problems.push(`zone ${ZONES[z]} not found`);
  const slice = (z, nextZ) => lines.slice(zi[z] + 1, nextZ === null ? lines.length : zi[nextZ] >= 0 ? zi[nextZ] : lines.length);

  // title and date
  const head = lines.slice(0, zi.wheel < 0 ? 12 : zi.wheel).join("\n");
  const title = (head.match(/[A-Z](?: [A-Z])+/) ?? [""])[0].replace(/ /g, "");
  const woven = (head.match(/◇ (\d{4}-\d{2}-\d{2}) ◇/) ?? [])[1] ?? "";

  // ⟨⟩ key: prefixes, then threads
  const keyLines = zi.key >= 0 ? lines.slice(zi.key + 1).map(inner) : [];
  const prefixes = {};
  const threads = [];
  let cur = null;
  for (const raw of keyLines) {
    const l = raw.replace(/\s+$/, "");
    if (!l.trim() || /^[■□·] [░▒▓]/.test(l) || l.startsWith("╚")) continue;
    const rec = l.match(/^([■□·])([A-Z]{3}) (\d) (\S)(\S) (\S) (.+)$/);
    if (rec) {
      const [, st, id, lvl, om, gm, ty, name] = rec;
      cur = { id, name, st, lvl: Number(lvl), op: opOf[om], grain: grainOf[gm], typing: ty, refs: [] };
      if (!cur.op || !cur.grain) problems.push(`key ${id}: unknown mark ${om}${gm}`);
      threads.push(cur); continue;
    }
    if (l.startsWith("     @ ") && cur) { cur.refs.push(...l.slice(7).split(/\s+/).filter(Boolean)); continue; }
    if (l.startsWith("     ") && l.endsWith(" ⇒✗") && cur) { cur.ctl = l.trim().slice(0, -3).trim(); continue; }
    if (!cur) for (const tok of l.split(/\s+/).filter(Boolean)) { const m = tok.match(/^(\S+\/)=(\S+)$/); if (m) prefixes[m[1]] = m[2]; }
  }
  // spine
  const spineLine = (slice("helix", "faces").map(inner).find((l) => l.includes(" › ")) ?? "").trim();

  // ◀ ▲ ▶ faces: parse each panel into code → (row mark, column mark)
  const facesLines = slice("faces", "holons").map(inner);
  const panels = [];
  let P = null, rowMarks = [], colMarks = [], row = -1;
  for (const l of facesLines) {
    if (l.includes("┌")) { P = { cells: new Map() }; colMarks = []; rowMarks = []; row = -1; panels.push(P); continue; }
    if (!P) continue;
    const parts = l.split("│");
    if (l.includes("├") || l.includes("└")) { if (l.includes("├")) row++; continue; }
    if (parts.length < 6) continue;
    const label = parts[1].trim();
    if (row < 0) { P.face = label; colMarks = parts.slice(2, 5).map((s) => s.trim()); continue; }
    if (label) rowMarks[row] = label;
    parts.slice(2, 5).forEach((cellText, c) => { for (const code of cellText.match(CODE) ?? []) P.cells.set(code.slice(1), { row: rowMarks[row], col: colMarks[c], st: code[0] }); });
  }
  const face = (mark) => panels.find((p) => p.face === mark);
  const act = face(M.face.ACT), site = face(M.face.SITE), stance = face(M.face.STANCE);
  if (!act || !site || !stance) problems.push("a face panel is missing");

  // ↑ ↓ holons
  const holon = new Map();
  let lvl = null;
  for (const l of slice("holons", "voids").map(inner)) {
    const m = l.match(/^ [↑↓│] (\d)? ?(.*)$/);
    if (!m) continue;
    if (m[1] !== undefined) lvl = Number(m[1]);
    for (const t of m[2].matchAll(/([■□·])([A-Z]{3})(\S)(\S)/g)) holon.set(t[2], { lvl, st: t[1], op: opOf[t[3]], grain: grainOf[t[4]] });
  }
  // helix cell map: op mark → per-grain status
  const helix = new Map();
  for (const l of slice("helix", "faces").map(inner)) {
    const m = l.match(/ (\S) (\S)(\S)  ∘(\S) ◆(\S) ◈(\S)/);
    if (m && opOf[m[1]]) helix.set(opOf[m[1]], { Ground: m[4], Figure: m[5], Pattern: m[6] });
  }

  // the guard: three faces, each axis twice
  for (const t of threads) {
    const a = act?.cells.get(t.id), s = site?.cells.get(t.id), k = stance?.cells.get(t.id), h = holon.get(t.id);
    if (!a || !s || !k) { problems.push(`${t.id}: not on all three faces`); continue; }
    const aOp = (() => { const m = modeOf[a.col], d = domainOf[a.row]; return OPERATORS.find((o) => actOf(o).mode === m && actOf(o).domain === d); })();
    const sDomain = domainOf[s.row], sGrain = grainOf[s.col], kMode = modeOf[k.row], kGrain = grainOf[k.col];
    const verdict = coherent({ op: aOp, site: TERRAIN_BY_DOMAIN[sDomain]?.[sGrain], stance: STANCE_BY_MODE[kMode]?.[kGrain] });
    if (!verdict.ok) problems.push(`${t.id}: faces disagree — ${verdict.why}`);
    else if (verdict.cell.op !== t.op || verdict.cell.grain !== t.grain) problems.push(`${t.id}: faces say ${verdict.cell.op}·${verdict.cell.grain}, key says ${t.op}·${t.grain}`);
    if (a.st !== t.st || s.st !== t.st || k.st !== t.st) problems.push(`${t.id}: status differs between faces and key`);
    if (!h) problems.push(`${t.id}: missing from the holon rows`);
    else if (h.lvl !== t.lvl || h.op !== t.op || h.grain !== t.grain || h.st !== t.st) problems.push(`${t.id}: holon row says L${h.lvl} ${h.op}·${h.grain}, key says L${t.lvl} ${t.op}·${t.grain}`);
  }
  for (const code of act?.cells.keys() ?? []) if (!threads.some((t) => t.id === code)) problems.push(`${code}: on a face but not in the key`);
  for (const op of OPERATORS) for (const g of GRAINS) {
    const want = cellStatus(threads, op, g, M), got = helix.get(op)?.[g];
    if (got !== want) problems.push(`helix ${op}·${g}: shows ${got ?? "nothing"}, threads give ${want}`);
  }

  // ∘ ◆ ◈ the ring: 27 stations read back at their coordinates
  const ringProblems = [];
  let ringRead = 0;
  {
    const region = slice("wheel", "helix").map(inner);
    const L = ringLayout();
    for (const s of L.stations) {
      const got = region[s.r]?.[s.c], want = cellStatus(threads, OPERATORS[s.k], GRAINS[s.g], M);
      ringRead++;
      if (got !== want) ringProblems.push(`ring ${OPERATORS[s.k]}·${GRAINS[s.g]}: shows ${got ?? "nothing"}, threads give ${want}`);
    }
    for (const l of L.labels) { const got = region[l.r]?.[l.c]; if (got !== M.op[OPERATORS[l.k]]) ringProblems.push(`ring label ${OPERATORS[l.k]}: shows ${got ?? "nothing"}`); }
    if (region.length !== RING.rows) ringProblems.push(`ring: ${region.length} rows, expected ${RING.rows}`);
  }
  problems.push(...ringProblems);
  const spec = { schema: "TapestrySpec@1", woven, title, prefixes, spine: spineLine, threads };
  return { spec, problems, ring: { read: ringRead, problems: ringProblems } };
}

export const unweaveFile = (file) => unweave(fs.readFileSync(file, "utf8"));

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const arg = process.argv[2];
  const file = !arg || arg.startsWith("--") ? path.join(path.dirname(HERE), "TAPESTRY.md") : arg;
  const { spec, problems } = unweaveFile(file);
  if (arg === "--problems") console.log(problems.length ? problems.join("\n") : "faces agree: the tapestry unweaves clean");
  else console.log(JSON.stringify(spec, null, 1));
  if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
}
