// lib.mjs — shared, deterministic helpers for the foldcode-answer inputs (PREREG-FOLDCODE-ANSWER.md).
// No model is called anywhere in this folder. Nothing here writes outside OUT.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const OUT = HERE;

export const PREREG = "/Users/mlacy/Downloads/workspace/reading-rules-audit/PREREG-FOLDCODE-ANSWER.md";
export const PREREG_SHA256 = "1369f87a87b6770e496c38729ac4bf272bec5c2eaf00b31c535b47b399a49125";
export const TEXT_RU = process.env.TEXT_RU_OVERRIDE ?? "/Users/mlacy/Downloads/workspace/Zenodotus/11-multi-language/war-and-peace/ru/voyna-i-mir_Tolstoy_wikisource.txt";
export const TEXT_EN = "/Users/mlacy/Downloads/workspace/Zenodotus/11-multi-language/war-and-peace/aligned/en/pg2600-ch1-3-aligned.txt";
export const FOLDCODE_PLAN = "/Users/mlacy/Downloads/workspace/FOLDCODE-CONTEXT-PLAN.md";

export const sha256 = (x) => crypto.createHash("sha256").update(x).digest("hex");
export const sha256File = (p) => sha256(fs.readFileSync(p));

/** Stable JSON: object keys sorted at every level, arrays kept in order, two-space indent, trailing newline. */
export function stable(x) {
  const norm = (v) => Array.isArray(v) ? v.map(norm) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, norm(v[k])])) : v;
  return `${JSON.stringify(norm(x), null, 2)}\n`;
}
export const writeStable = (file, x) => fs.writeFileSync(path.join(OUT, file), stable(x));
export const writeText = (file, s) => fs.writeFileSync(path.join(OUT, file), s.endsWith("\n") ? s : `${s}\n`);
export const readJson = (file) => JSON.parse(fs.readFileSync(path.join(OUT, file), "utf8"));

/** The registered seed (the date of the registration, as in the janus measurements) and a small seeded PRNG. */
export const SEED = 20261027;
export const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export function arg(name, dflt = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : (process.env[name.toUpperCase().replace(/-/g, "_")] ?? dflt);
}

/** The two clones: --khora / --janus (or KHORA / JANUS in the environment). Refuses a clone that is not at a clean origin/main-equal commit unless --allow-dirty. */
export function clones() {
  // v2 copy: the clones are PINNED to the commits that built the earlier windows (khora 30fe444d, janus 9fe6d918), not required to equal origin/main
  const khora = arg("khora"), janus = arg("janus");
  if (!khora || !janus) { console.error("usage: node <script> --khora <khora clone> --janus <janus clone>"); process.exit(2); }
  const PIN = { khora: "30fe444dfecdd6f6e1a32018047eee9d8291514b", janus: "9fe6d918858fc64f59c18d064632504713f37830" };
  const info = (dir) => {
    const git = (...a) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8" }).trim();
    return { dir, commit: git("rev-parse", "HEAD"), dirty: git("status", "--porcelain").length > 0 };
  };
  const k = info(khora), j = info(janus);
  if (k.commit !== PIN.khora) throw new Error(`khora clone is at ${k.commit}, pinned ${PIN.khora}`);
  if (j.commit !== PIN.janus) throw new Error(`janus clone is at ${j.commit}, pinned ${PIN.janus}`);
  for (const [n, c] of [["khora", k], ["janus", j]]) if (c.dirty && !process.argv.includes("--allow-dirty")) throw new Error(`${n} clone has local changes`);
  return { khora: k, janus: j };
}

export const importFrom = (dir, rel) => import(pathToFileURL(path.join(dir, rel)).href);

/** Stop unless the registered prereg is the file on disk. */
export function assertPrereg() {
  const h = sha256File(PREREG);
  if (h !== PREREG_SHA256) { console.error(`STOP: PREREG-FOLDCODE-ANSWER.md sha256 is ${h}, registered ${PREREG_SHA256}`); process.exit(3); }
  return h;
}

export const foldRu = (s) => s.normalize("NFC").toLowerCase().replace(/́/g, "").replace(/ё/g, "е");
export const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const utf8len = (s) => Buffer.byteLength(s, "utf8");

/** byte <-> UTF-16 character offsets of a text (the kin extractor speaks bytes, the ledger speaks characters). */
export function offsetMaps(text, buf) {
  const byteAt = new Int32Array(text.length + 1);
  let b = 0;
  for (let i = 0; i < text.length; i++) {
    byteAt[i] = b;
    const c = text.charCodeAt(i);
    if (c < 0x80) b += 1; else if (c < 0x800) b += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) { byteAt[i + 1] = b; b += 4; i++; }
    else b += 3;
  }
  byteAt[text.length] = b;
  if (b !== buf.length) throw new Error(`byte map is off: ${b} vs ${buf.length}`);
  const charAtByte = (x) => { let lo = 0, hi = text.length; while (lo < hi) { const m = (lo + hi) >> 1; if (byteAt[m] < x) lo = m + 1; else hi = m; } return lo; };
  return { byteAt, charAtByte };
}
