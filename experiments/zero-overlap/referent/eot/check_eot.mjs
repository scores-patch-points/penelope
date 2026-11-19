#!/usr/bin/env node
// check_eot.mjs -- a small PURE checker for the EOT subset used in primitives.eot.
// Imports only node: and penelope/organs/cube.mjs. No network, no writes.
//
//   node check_eot.mjs primitives.eot                 check one file, exit 1 on any failure
//   node check_eot.mjs --negatives negatives.eot      each assembly carries `# expect: <code>`;
//                                                     the file passes only if every one fails with that code
//
// SUBSET PARSED (lines; `#` starts a comment):
//   name : room | space | filter | assumed
//   name.contract.ops|terrains|stances = A, B       name.parts = a, b      name.within = X
//   !OP(Site, Stance) subject [reads a,b] [points c] [returns d]      (extension of mine, see primitives.eot)
//   !EVA name                                        (the closing checkpoint of assembly `name`)
//
// WHAT IS CHECKED (error codes):
//   parse                 a line outside the subset
//   unknown-name          an operator, terrain or stance in a contract that cube.mjs does not know
//   grain-mixed           cube.mjs coherent() refuses the event (grain, domain or mode disagree)
//   desert-cell           SYN at Ground, as an event or inside a contract's region
//   contract-violation    an event whose cell is outside its assembly's contract region
//   dependency            reads: unknown name; forward reference; or a thing born by a LATER operator in the helix
//   sig-law               a thing born by SIG read by anything but SIG (SIG-ANSWER item 7: erasing SIG changes nothing)
//   points-misuse         `points` on a non-SIG event, or to an unknown name
//   wrap-misuse           `returns` on a non-NUL event, an unknown target, or a target not born by a later operator
//   prerequisite          REC reading no EVA-born thing; EVA reading no DEF-born thing; CON/SYN reading fewer than two; no inputs
//   narrowing-violation   a part, or a filter's `within`, whose region/lists are not inside its container's
//   width-violation       a space declaring a list entry that no part has (not the envelope of its parts)
//   closure-violation     a space part that is not a declared earlier assembly; an assembly in no space (except the last)
//   unassembled           an assembly with no closing !EVA, a closing !EVA naming another assembly, lines after the close
//
// NOT CHECKED: that the semantics of any construction is right; the helix rule is a dependency rule on what an event
// READS, not a proof about what it means. Slack (contract region cells never used) is reported, not failed.
import { readFileSync } from "node:fs";
import { cellOf, coherent, OPERATORS, GRAINS, TERRAIN_BY_DOMAIN, STANCE_BY_MODE, selftest } from "../../../../organs/cube.mjs";

const IDX = Object.fromEntries(OPERATORS.map((o, i) => [o, i]));
const TERRAINS = new Set(Object.values(TERRAIN_BY_DOMAIN).flatMap((t) => Object.values(t)));
const STANCES = new Set(Object.values(STANCE_BY_MODE).flatMap((t) => Object.values(t)));
// The three Ground-grain cells THE-27-CELLS.md section 4 lists as having no registered organ (leads, not prohibitions).
const EMPTY = new Set(["INS·Ground", "CON·Ground", "DEF·Ground"]);
const cid = (c) => `${c.op}·${c.grain}`;

// ---------------------------------------------------------------- parse
function parse(text) {
  const asms = [], assumed = new Map(), errs = [];
  let cur = null, closed = false;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const ln = i + 1; let s = lines[i];
    const ex = /^\s*#\s*expect:\s*(\S+)/.exec(s);
    if (ex && cur) { cur.expect = ex[1]; continue; }
    s = s.replace(/(^|\s)#.*$/, "").trim();
    if (!s) continue;
    let m;
    if ((m = /^(\w+)\s*:\s*(room|space|filter|assumed)$/.exec(s))) {
      const [, name, type] = m;
      if (type === "assumed") { assumed.set(name, { line: ln }); continue; }
      if (type === "filter") { if (!cur) { errs.push({ ln, code: "parse", msg: "filter outside an assembly" }); continue; } cur.filters[name] = { contract: {}, within: null, line: ln }; continue; }
      cur = { name, type, line: ln, contract: {}, parts: [], within: null, events: [], filters: {}, closedBy: null, closeLine: null, expect: null, errs: [] };
      asms.push(cur); closed = false; continue;
    }
    if (!cur) { errs.push({ ln, code: "parse", msg: `line outside any assembly: ${s}` }); continue; }
    if ((m = /^!EVA\s+(\w+)$/.exec(s))) { cur.closedBy = m[1]; cur.closeLine = ln; closed = true; continue; }
    if (closed) { cur.errs.push({ ln, code: "unassembled", msg: `line after the closing !EVA: ${s}` }); continue; }
    if ((m = /^(\w+)\.contract\.(ops|terrains|stances)\s*=\s*(.+)$/.exec(s))) {
      const tgt = m[1] === cur.name ? cur : cur.filters[m[1]];
      if (!tgt) { cur.errs.push({ ln, code: "parse", msg: `contract for unknown ${m[1]}` }); continue; }
      tgt.contract[m[2]] = m[3].split(",").map((x) => x.trim()).filter(Boolean); continue;
    }
    if ((m = /^(\w+)\.(parts|within)\s*=\s*(.+)$/.exec(s))) {
      const tgt = m[1] === cur.name ? cur : cur.filters[m[1]];
      if (!tgt) { cur.errs.push({ ln, code: "parse", msg: `${m[2]} for unknown ${m[1]}` }); continue; }
      if (m[2] === "parts") tgt.parts = m[3].split(",").map((x) => x.trim()); else tgt.within = m[3].trim();
      continue;
    }
    if ((m = /^!(NUL|SIG|INS|SEG|CON|SYN|DEF|EVA|REC)\(\s*(\w+)\s*,\s*(\w+)\s*\)\s+(\w+)(.*)$/.exec(s))) {
      const ev = { ln, op: m[1], site: m[2], stance: m[3], subject: m[4], reads: [], points: [], returns: [] };
      const rest = m[5].trim();
      const re = /\b(reads|points|returns)\s+([\w,\s]+?)(?=\s+(?:reads|points|returns)\b|$)/g; let k, used = "";
      while ((k = re.exec(rest))) { ev[k[1]] = k[2].split(",").map((x) => x.trim()).filter(Boolean); used += k[0]; }
      if (rest.replace(/\s+/g, "") !== used.replace(/\s+/g, "")) cur.errs.push({ ln, code: "parse", msg: `unparsed tail: ${rest}` });
      cur.events.push(ev); continue;
    }
    cur.errs.push({ ln, code: "parse", msg: `outside the subset: ${s}` });
  }
  return { asms, assumed, errs };
}

// ---------------------------------------------------------------- contracts as regions of the cube
function region(c) {
  const cells = new Map();
  for (const op of c.ops || []) for (const g of GRAINS) {
    const cell = cellOf(op, g); if (cell.gap) continue;
    if ((c.terrains || []).includes(cell.terrain) && (c.stances || []).includes(cell.stance)) cells.set(cid(cell), cell);
  }
  return cells;
}
const subset = (a, b) => [...a.keys()].every((k) => b.has(k));
const listSubset = (a, b) => ["ops", "terrains", "stances"].every((f) => (a[f] || []).every((x) => (b[f] || []).includes(x)));

// ---------------------------------------------------------------- check
function check(P, { quiet } = {}) {
  const { asms, assumed } = P;
  const byName = new Map(asms.map((a) => [a.name, a]));
  const things = new Map(); // name -> { idx, op, asm, line }
  for (const [n] of assumed) things.set(n, { idx: -1, op: "(floor)", asm: "(assumed)", line: 0 });
  // first textual definition of every subject, to tell a forward reference from an unknown name
  const later = new Map();
  for (const a of asms) for (const e of a.events) if (!later.has(e.subject)) later.set(e.subject, { asm: a.name, line: e.ln });
  const wraps = [], readers = new Map(), cellsUsed = new Map(), emptyUsed = [], pending = [];
  const err = (a, ln, code, msg) => a.errs.push({ ln, code, msg });

  for (const a of asms) {
    const used = new Map();
    // contract names and desert
    for (const f of ["ops", "terrains", "stances"]) {
      if (a.type === "room" && !(a.contract[f] || []).length) err(a, a.line, "parse", `no contract.${f}`);
      for (const x of a.contract[f] || []) if (!(f === "ops" ? OPERATORS.includes(x) : f === "terrains" ? TERRAINS.has(x) : STANCES.has(x))) err(a, a.line, "unknown-name", `contract.${f} names ${x}`);
    }
    const reg = region(a.contract);
    if (reg.has("SYN·Ground")) err(a, a.line, "desert-cell", "contract region contains SYN at Ground");
    for (const e of a.events) {
      const co = coherent({ op: e.op, site: e.site, stance: e.stance });
      if (!co.ok) { err(a, e.ln, "grain-mixed", co.why); continue; }
      const cell = co.cell, id = cid(cell);
      if (e.op === "SYN" && cell.grain === "Ground") err(a, e.ln, "desert-cell", "SYN at Ground");
      if (!reg.has(id)) err(a, e.ln, "contract-violation", `${e.op}(${e.site}, ${e.stance}) = ${id} is outside ${a.name}'s contract region`);
      used.set(id, cell); cellsUsed.set(id, (cellsUsed.get(id) || 0) + 1);
      if (EMPTY.has(id)) emptyUsed.push(`${a.name}:${e.subject} ${id}`);
      const oi = IDX[e.op];
      for (const r of e.reads) {
        const t = things.get(r);
        if (!t) { const l = later.get(r); err(a, e.ln, "dependency", l ? `${e.subject} reads ${r}, defined later (${l.asm}:${l.line}); a forward reference needs a NUL wrap (returns)` : `${e.subject} reads unknown ${r}`); continue; }
        if (t.idx > oi) err(a, e.ln, "dependency", `${e.op} (helix ${oi}) reads ${r}, born by ${t.op} (helix ${t.idx}): dependency runs backward`);
        if (t.op === "SIG" && e.op !== "SIG") err(a, e.ln, "sig-law", `${e.op} reads ${r}, born by SIG: erasing SIG would change ${e.subject}`);
        (readers.get(r) || readers.set(r, []).get(r)).push(`${e.op}:${e.subject}`);
      }
      for (const p of e.points) {
        if (e.op !== "SIG") err(a, e.ln, "points-misuse", `points on ${e.op}; only SIG points`);
        else if (!things.has(p)) err(a, e.ln, "points-misuse", `points at unknown ${p}`);
      }
      for (const r of e.returns) {
        if (e.op !== "NUL") err(a, e.ln, "wrap-misuse", `returns on ${e.op}; only NUL receives what comes round`);
        else pending.push({ a, e, r });
      }
      if (e.op === "REC" && !e.reads.some((r) => things.get(r)?.op === "EVA")) err(a, e.ln, "prerequisite", `REC ${e.subject} reads no EVA-born thing (a frame is restructured only after an evaluation)`);
      if (e.op === "EVA" && !e.reads.some((r) => things.get(r)?.op === "DEF")) err(a, e.ln, "prerequisite", `EVA ${e.subject} reads no DEF-born thing (nothing to test against)`);
      if ((e.op === "CON" || e.op === "SYN") && e.reads.length < 2) err(a, e.ln, "prerequisite", `${e.op} ${e.subject} reads fewer than two things`);
      if (!e.reads.length && !e.points.length && !e.returns.length) err(a, e.ln, "prerequisite", `${e.subject} has no inputs`);
      if (!things.has(e.subject)) things.set(e.subject, { idx: oi, op: e.op, asm: a.name, line: e.ln });
    }
    a.used = used; a.reg = reg;
    if (!a.closedBy) err(a, a.line, "unassembled", `${a.name} has no closing !EVA`);
    else if (a.closedBy !== a.name) err(a, a.closeLine, "unassembled", `closing !EVA names ${a.closedBy}, not ${a.name}`);
  }
  // wraps resolve once every subject is known
  for (const { a, e, r } of pending) {
    const t = things.get(r);
    if (!t) err(a, e.ln, "wrap-misuse", `returns unknown ${r}`);
    else if (t.idx <= IDX.NUL) err(a, e.ln, "wrap-misuse", `${e.subject} returns ${r}, which is not born by a later operator (use reads)`);
    else { wraps.push(`${a.name}:${e.subject} <- ${r} (${t.op})`); if (t.op === "SIG" && false) { /* steer allowed */ } }
  }
  // spaces and filters: narrowing downward, envelope upward
  const inSpace = new Set();
  for (const a of asms) {
    if (a.type === "space") {
      const union = { ops: new Set(), terrains: new Set(), stances: new Set() };
      for (const pn of a.parts) {
        const p = byName.get(pn);
        if (!p || asms.indexOf(p) >= asms.indexOf(a)) { err(a, a.line, "closure-violation", `part ${pn} is not a declared earlier assembly`); continue; }
        inSpace.add(pn);
        for (const f of Object.keys(union)) for (const x of p.contract[f] || []) union[f].add(x);
        if (!listSubset(p.contract, a.contract) || !subset(p.reg, a.reg)) err(a, a.line, "narrowing-violation", `part ${pn} is not inside ${a.name}'s contract`);
      }
      for (const f of Object.keys(union)) for (const x of a.contract[f] || []) if (!union[f].has(x)) err(a, a.line, "width-violation", `${a.name}.contract.${f} has ${x}, which no part has`);
      const partCells = new Set(a.parts.flatMap((pn) => [...(byName.get(pn)?.reg.keys() || [])]));
      a.envSlack = [...a.reg.keys()].filter((k) => !partCells.has(k));
    }
    for (const [fname, f] of Object.entries(a.filters)) {
      const c = byName.get(f.within); f.reg = region(f.contract);
      if (!f.within || !c) err(a, f.line, "narrowing-violation", `filter ${fname} has no declared container (within)`);
      else if (!listSubset(f.contract, c.contract) || !subset(f.reg, c.reg)) err(a, f.line, "narrowing-violation", `filter ${fname} is not inside ${f.within}`);
      if (f.reg.has("SYN·Ground")) err(a, f.line, "desert-cell", `filter ${fname} contains SYN at Ground`);
    }
  }
  const top = asms[asms.length - 1];
  for (const a of asms) if (a !== top && a.type !== "assumed" && !inSpace.has(a.name) && asms.some((x) => x.type === "space")) err(a, a.line, "closure-violation", `${a.name} is a part of no space`);
  return { things, wraps, readers, cellsUsed, emptyUsed };
}

// ---------------------------------------------------------------- run
const args = process.argv.slice(2);
const neg = args[0] === "--negatives";
const file = neg ? args[1] : args[0];
if (!file) { console.error("usage: node check_eot.mjs <file.eot> | --negatives <file.eot>"); process.exit(2); }
selftest(); // cube.mjs's own pins must hold before any verdict means anything
const P = parse(readFileSync(file, "utf8"));
const R = check(P);
let fail = 0;
for (const e of P.errs) { console.log(`PARSE-ERR line ${e.ln}: ${e.msg}`); fail++; }
console.log(`file: ${file}\nassemblies: ${P.asms.length}   assumed floor names: ${P.assumed.size}\n`);
if (!neg) {
  for (const a of P.asms) {
    const ok = a.errs.length === 0; if (!ok) fail++;
    const slack = a.type === "space" ? (a.envSlack || []) : [...a.reg.keys()].filter((k) => !a.used.has(k));
    console.log(`${ok ? "PASS" : "FAIL"}  ${a.name.padEnd(11)} ${a.type.padEnd(5)} events ${String(a.events.length).padStart(2)}  region ${String(a.reg.size).padStart(2)} cells${a.type === "space" ? `  envelope slack ${slack.length}` : `  slack ${slack.length}`}${slack.length ? " [" + slack.join(" ") + "]" : ""}`);
    for (const e of a.errs) console.log(`      line ${e.ln} ${e.code}: ${e.msg}`);
  }
  const sigBorn = [...R.things].filter(([, t]) => t.op === "SIG").map(([n]) => n);
  console.log(`\nSIG-born things: ${sigBorn.join(", ")}`);
  for (const n of sigBorn) console.log(`  ${n}: read by ${(R.readers.get(n) || []).join(", ") || "nothing"}`);
  console.log(`\nwraps (NUL receives what a later operator made): ${R.wraps.length}`);
  for (const w of R.wraps) console.log(`  ${w}`);
  console.log(`\nevents on the three cells THE-27-CELLS.md lists as empty (leads, not errors): ${R.emptyUsed.length}`);
  for (const w of R.emptyUsed) console.log(`  ${w}`);
  console.log(`\ndistinct cells fired: ${R.cellsUsed.size} of 27`);
  console.log(`\nRESULT: ${fail ? "FAIL" : "PASS"} (${P.asms.filter((a) => !a.errs.length).length}/${P.asms.length} assemblies clean)`);
} else {
  for (const a of P.asms) {
    const codes = [...new Set(a.errs.map((e) => e.code))];
    if (!a.expect) { const ok = !a.errs.length; if (!ok) fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${a.name.padEnd(16)} (no expectation; must be clean) ${codes.join(",")}`); continue; }
    const ok = codes.includes(a.expect); if (!ok) fail++;
    console.log(`${ok ? "REFUSED-AS-EXPECTED" : "NOT-REFUSED"}  ${a.name.padEnd(16)} expect ${a.expect.padEnd(20)} got [${codes.join(",") || "nothing"}]`);
    if (ok) { const e = a.errs.find((x) => x.code === a.expect); console.log(`      ${e.msg}`); }
  }
  console.log(`\nRESULT: ${fail ? "FAIL" : "PASS"} (negatives: every expected refusal ${fail ? "NOT " : ""}observed)`);
}
process.exit(fail ? 1 : 0);
