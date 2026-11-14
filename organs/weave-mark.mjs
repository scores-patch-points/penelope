// organs/weave-mark.mjs — Penelope weaves MARKS into the shared log (pharos), and unweaves them.
// Handle: Penelope — she wove the cloth by day and unwove by night. A mark another organ wants in the
// cloth is handed to her; she admits it or refuses it with a reason, and she is the only hand that
// writes it. What later fails to verify she unweaves, which in pharos is a retraction entry and never
// an erase.
//
// WHY ONE WEAVER. Wilson's trail deposits (khora kernel/stigmergy.js), the Fort ants' record
// (fold-obsidian) and any later organ's marks would otherwise each open the log themselves, each with
// its own idea of what may be written. Here the rule is in one place:
//   - a mark is BYLINED (who asks), or it is refused;
//   - a mark states its WITNESS (how the asker knows: what was observed or verified), or it is refused.
//     Penelope does not re-verify the witness; she records it in the entry's basis so a reader can;
//   - a mark's kind is DECLARED as an entry, with its cell and why, before the first mark of that kind.
//     A kind not yet declared and sent with no declaration is refused, never guessed;
//   - `of` may only name entries already in the log (pharos enforces this; the refusal is passed on).
//
// SHE KNOWS PHAROS ONLY BY A POINTER, the file the pharos door writes: { lib, sha256 }.
//   pointer = $PENELOPE_PHAROS_JSON, else <this checkout>/pharos.json. No pointer, or a lib whose bytes
//   do not match the pin: the loom is OFF and every mark is refused with that reason (503), so a caller
//   keeps its mark and counts it. She never writes a mark anywhere else.
// Writer name "penelope": one file per log, one writer. A log is named by the asker (its own holon's
// log); the name is a plain token, never a path.
//
// PURE of the network (node builtins). The HTTP door is mouth/server.mjs (/v1/weave/*).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

export const MARK_SCHEMA = "WeaveMark@1";
export const WEAVER = "penelope";
const TOKEN = /^[A-Za-z0-9._-]+$/;
const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const refuse = (status, reason, detail) => ({ ok: false, schema: MARK_SCHEMA, status, reason, ...(detail ? { detail: String(detail).slice(0, 300) } : {}) });

const loom = { on: false, why: "not opened", P: null, dir: null, handles: new Map(), woven: 0, unwoven: 0, refused: 0 };

/** openLoom({ pointer, dir }) -> status. `dir` overrides where logs live (tests); else pharos decides. */
export async function openLoom({ pointer = null, dir = null } = {}) {
  Object.assign(loom, { on: false, why: "not opened", P: null, dir, handles: new Map() });
  try {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const ptrPath = pointer ?? process.env.PENELOPE_PHAROS_JSON ?? path.join(root, "pharos.json");
    if (!fs.existsSync(ptrPath)) { loom.why = `no pharos pointer at ${ptrPath}`; return loomStatus(); }
    const ptr = JSON.parse(fs.readFileSync(ptrPath, "utf8"));
    const lib = path.resolve(path.dirname(ptrPath), String(ptr.lib));
    const got = crypto.createHash("sha256").update(fs.readFileSync(lib)).digest("hex");
    if (got !== ptr.sha256) { loom.why = `pharos lib at ${lib} is not the pinned one (${got.slice(0, 12)} vs ${String(ptr.sha256).slice(0, 12)})`; return loomStatus(); }
    loom.P = await import(pathToFileURL(lib).href);
    Object.assign(loom, { on: true, why: "open" });
  } catch (e) { loom.P = null; loom.why = `could not open pharos: ${e?.message ?? e}`; }
  return loomStatus();
}

export const loomStatus = () => ({ schema: MARK_SCHEMA, on: loom.on, why: loom.why, weaver: WEAVER, logs: [...loom.handles.keys()], woven: loom.woven, unwoven: loom.unwoven, refused: loom.refused });

function handleFor(log) {
  if (loom.handles.has(log)) return loom.handles.get(log);
  const h = loom.P.open(log, { writer: WEAVER, ...(loom.dir ? { dir: path.join(loom.dir, log) } : {}) });
  loom.handles.set(log, h);
  return h;
}

/** admitMark(mark) -> { ok: true } | refusal. Pure: the shape rules only, before the log is touched. */
export function admitMark(mark) {
  if (!isObj(mark)) return refuse(400, "not_a_mark");
  if (typeof mark.by !== "string" || !TOKEN.test(mark.by)) return refuse(400, "unbylined", "by must name the asking organ ([A-Za-z0-9._-]+)");
  if (typeof mark.log !== "string" || !TOKEN.test(mark.log)) return refuse(400, "no_log", "log must be a plain token naming the asker's log");
  if (!isObj(mark.witness) || typeof mark.witness.how !== "string" || !mark.witness.how.trim()) return refuse(400, "no_witness", "witness.how must say how the asker knows what the mark says");
  for (const k of ["kind", "cell", "addr"]) if (typeof mark[k] !== "string" || !mark[k]) return refuse(400, `no_${k}`);
  if (!("body" in mark) || mark.body === undefined) return refuse(400, "no_body");
  if (mark.of !== undefined && !(Array.isArray(mark.of) && mark.of.every((x) => typeof x === "string"))) return refuse(400, "bad_of");
  if (mark.declare !== undefined && !(isObj(mark.declare) && typeof mark.declare.why === "string" && mark.declare.why.trim())) return refuse(400, "bad_declaration", "declare needs { why }");
  return { ok: true };
}

/** weaveMark(mark) -> { ok, id, log, declared } | refusal.
 *  mark: { by, log, kind, cell, addr, body, of?, basis?, witness: { how, ... }, declare?: { why } } */
export function weaveMark(mark) {
  const a = admitMark(mark);
  if (!a.ok) { loom.refused += 1; return a; }
  if (!loom.on) { loom.refused += 1; return refuse(503, "loom_off", loom.why); }
  try {
    const h = handleFor(mark.log), P = loom.P;
    let declared = false;
    const known = P.ground(h).kinds.find((k) => k.name === mark.kind);
    if (!known) {
      if (!mark.declare) { loom.refused += 1; return refuse(422, "undeclared_kind", `kind ${mark.kind} is not declared in log ${mark.log}; send declare: { why }`); }
      P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: `kind:${mark.kind}`, body: { name: mark.kind, cell: mark.cell, why: mark.declare.why, declared_by: mark.by } });
      declared = true;
    }
    const e = P.weave(h, { cell: mark.cell, kind: mark.kind, addr: mark.addr, body: mark.body, of: mark.of ?? [], basis: { ...(isObj(mark.basis) ? mark.basis : {}), via: WEAVER, asked_by: mark.by, witness: mark.witness } });
    loom.woven += 1;
    return { ok: true, schema: MARK_SCHEMA, id: e.id, log: mark.log, declared };
  } catch (e) { loom.refused += 1; return refuse(422, e?.code ? String(e.code).toLowerCase() : "pharos_refused", e?.message ?? e); }
}

/** unweave({ by, log, ids, why }) -> { ok, id } | refusal. A retraction entry `of` the ids; nothing is erased. */
export function unweave(req) {
  if (!isObj(req)) { loom.refused += 1; return refuse(400, "not_a_request"); }
  if (typeof req.by !== "string" || !TOKEN.test(req.by)) { loom.refused += 1; return refuse(400, "unbylined"); }
  if (typeof req.log !== "string" || !TOKEN.test(req.log)) { loom.refused += 1; return refuse(400, "no_log"); }
  if (!(Array.isArray(req.ids) && req.ids.length && req.ids.every((x) => typeof x === "string"))) { loom.refused += 1; return refuse(400, "no_ids"); }
  if (typeof req.why !== "string" || !req.why.trim()) { loom.refused += 1; return refuse(400, "no_why", "an unweaving states why the mark did not hold"); }
  if (!loom.on) { loom.refused += 1; return refuse(503, "loom_off", loom.why); }
  try {
    const h = handleFor(req.log), ids = [...new Set(req.ids)].sort();
    const e = loom.P.weave(h, { cell: "NUL·Figure", kind: "retract", addr: "retract:" + ids.join(","), body: { why: req.why, asked_by: req.by }, of: ids, basis: { via: WEAVER } });
    loom.unwoven += 1;
    return { ok: true, schema: MARK_SCHEMA, id: e.id, log: req.log, retracted: ids };
  } catch (e) { loom.refused += 1; return refuse(422, e?.code ? String(e.code).toLowerCase() : "pharos_refused", e?.message ?? e); }
}

/** marks({ log, kind }) -> live entries of a kind (retracted ones are left out by pharos' fold). Null when off. */
export function marks({ log, kind } = {}) {
  if (!loom.on || typeof log !== "string" || !TOKEN.test(log)) return null;
  return loom.P.fold(handleFor(log), kind ? { kind } : {}).entries;
}

// ---- MERGE: another node's entries, woven in whole ------------------------------------------------
// Two pharos nodes (a person's phone and laptop) approach each other by union. The entries are already
// woven, each with its own id, by, seen and at, so they are COPIED verbatim, never re-woven: pharos'
// own merge appends them to her file. She is still the only hand that writes it.
//
// AUTHORSHIP OF MERGED ENTRIES RESTS ON THE ASKER'S WITNESS ALONE. An id is a hash of content, not a
// signature: any caller can build an entry bylined as anyone with a valid id. A mark cannot do that (she
// writes it as herself and records asked_by); a merge can. So she makes what came in visible instead of
// vouching for it: the `merged` entry and the result list every distinct `by` that came in, and the
// added set is recoverable (a sha256 over the sorted added ids, and the ids themselves when few).
// Who may merge is decided by the asker (the pharos surface checks Matrix cross-signing) and stated in
// its witness; she cannot check it.
//
// What she checks or leaves out, each reported, never silent:
//   - not_an_entry / not_json / id_mismatch   refused (the rest go in)
//   - kind_redeclared  a `kind` entry naming a kind this log (or an earlier incoming entry) declares at
//                      another cell; weave refuses KIND_REDECLARED and pharos merge would not
//   - left_out_sig     entries at a SIG cell: a trail is local traffic, kept apart so it can be dropped
//                      whole (ruling 2026-11-14), so it never crosses a merge
//   - dangling         `of`/`seen` ids pointing at neither this log nor the offer (counted, not refused:
//                      the merge's version of an incomplete pass)
// Nothing is resolved: entries that disagree stay as both, and the fold reports them.
export const MERGE_SCHEMA = "WeaveMerge@1";
const MERGED_KIND = { name: "merged", cell: "SYN·Pattern", why: "another node's entries were joined into this log by union; nothing was overruled" };
// The `merged` body lists the added ids themselves up to this many; beyond it only their hash, so one
// merge of a whole log cannot make one entry the size of the log.
const ADDED_IDS_LISTED_UP_TO = 256;
const isSig = (cell) => typeof cell === "string" && cell.startsWith("SIG·");

// GAP (DEF x VOID, ruled 2026-11-14, not built): a node that has not applied a void will offer the voided
// payload again, and its id still verifies. Once tombstones exist, an incoming id with a local tombstone
// must be refused here as `voided`. Until then this always answers false.
const tombstoned = (_h, _id) => false;

export function mergeEntries(req) {
  const bad = (status, reason, detail) => { loom.refused += 1; return { ...refuse(status, reason, detail), schema: MERGE_SCHEMA }; };
  if (!isObj(req)) return bad(400, "not_a_request");
  if (typeof req.by !== "string" || !TOKEN.test(req.by)) return bad(400, "unbylined");
  if (typeof req.log !== "string" || !TOKEN.test(req.log)) return bad(400, "no_log");
  if (typeof req.from !== "string" || !TOKEN.test(req.from)) return bad(400, "no_from", "from must name the other node with a plain token");
  if (!isObj(req.witness) || typeof req.witness.how !== "string" || !req.witness.how.trim()) return bad(400, "no_witness");
  if (!Array.isArray(req.entries)) return bad(400, "no_entries");
  if (!loom.on) return bad(503, "loom_off", loom.why);
  const P = loom.P;
  if (typeof P.merge !== "function" || typeof P.entryId !== "function") return bad(501, "pharos_has_no_merge");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "penelope-merge-"));
  try {
    const h = handleFor(req.log);
    const local = P.entries(h), before = new Set(local.map((e) => e.id));
    const declared = new Map(P.ground(h).kinds.map((k) => [k.name, k.cell]));
    const refused = [], leftOut = [], ok = [];
    for (const e of req.entries) {
      if (!isObj(e) || typeof e.id !== "string") { refused.push({ id: null, reason: "not_an_entry" }); continue; }
      let id; try { id = P.entryId(e); } catch { refused.push({ id: e.id, reason: "not_json" }); continue; }
      if (id !== e.id) { refused.push({ id: e.id, reason: "id_mismatch" }); continue; }
      if (tombstoned(h, e.id)) { refused.push({ id: e.id, reason: "voided" }); continue; }
      if (isSig(e.cell)) { leftOut.push({ id: e.id, reason: "left_out_sig" }); continue; }
      if (e.kind === "kind" && isObj(e.body) && typeof e.body.name === "string") {
        const have = declared.get(e.body.name);
        if (have && have !== e.body.cell) { refused.push({ id: e.id, reason: "kind_redeclared", detail: `${e.body.name} is ${have} here, ${e.body.cell} in the offer` }); continue; }
        if (!have) declared.set(e.body.name, e.body.cell);
      }
      ok.push(e);
    }
    const known = new Set([...before, ...ok.map((e) => e.id)]);
    let dangling = 0;
    for (const e of ok) for (const x of [...(e.of || []), ...(e.seen || [])]) if (!known.has(x)) dangling++;

    fs.writeFileSync(path.join(tmp, "incoming.jsonl"), ok.map((e) => P.canonical(e)).join("\n") + (ok.length ? "\n" : ""));
    const hb = P.open("incoming", { dir: tmp, writer: "incoming", frame: false });
    const { added } = P.merge(h, hb);
    const addedIds = [...new Set(ok.map((e) => e.id))].filter((x) => !before.has(x)).sort();
    const addedBy = [...new Set(ok.filter((e) => !before.has(e.id)).map((e) => e.by))].sort();
    const addedIdsSha256 = crypto.createHash("sha256").update(addedIds.join("\n")).digest("hex");
    let id = null;
    if (added) {
      if (!P.ground(h).kinds.find((k) => k.name === MERGED_KIND.name)) P.weave(h, { cell: "DEF·Figure", kind: "kind", addr: `kind:${MERGED_KIND.name}`, body: { name: MERGED_KIND.name, cell: MERGED_KIND.cell, why: MERGED_KIND.why, declared_by: WEAVER } });
      const referenced = new Set(ok.flatMap((e) => [...(e.seen || []), ...(e.of || [])]));
      const heads = addedIds.filter((x) => !referenced.has(x));
      const body = {
        from: req.from, offered: req.entries.length, added, refused: refused.length, leftOutSig: leftOut.length, dangling,
        addedBy, addedIdsSha256, ...(addedIds.length <= ADDED_IDS_LISTED_UP_TO ? { addedIds } : {}),
        authorship: "rests on the asker's witness alone",
      };
      const m = P.weave(h, { cell: MERGED_KIND.cell, kind: MERGED_KIND.name, addr: `merge:${req.from}`, body, of: heads, basis: { via: WEAVER, asked_by: req.by, witness: req.witness } });
      id = m.id;
    }
    loom.woven += added;
    return { ok: true, schema: MERGE_SCHEMA, log: req.log, offered: req.entries.length, added, refused, leftOut, dangling, addedBy, addedIdsSha256, id };
  } catch (e) { return bad(422, e?.code ? String(e.code).toLowerCase() : "pharos_refused", e?.message ?? e); }
  finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

/** entriesOf({ log }) -> every entry of a log (declarations and retractions included), for a merge on the
 *  other side. A read never writes: a log with no frame yet is not created, and the answer is null. */
export function entriesOf({ log } = {}) {
  if (!loom.on || typeof log !== "string" || !TOKEN.test(log)) return null;
  const dir = loom.dir ? path.join(loom.dir, log) : null;
  if (dir && !loom.handles.has(log) && !fs.existsSync(dir)) return null;
  const h = loom.handles.get(log) ?? loom.P.open(log, { writer: WEAVER, frame: false, ...(dir ? { dir } : {}) });
  const all = loom.P.entries(h);
  return all.some((e) => e.kind === "frame") ? all : null;
}
