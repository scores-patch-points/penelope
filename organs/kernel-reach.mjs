// organs/kernel-reach.mjs — THE ONE PLACE penelope reaches a sibling checkout.
//
// Penelope's organs read the kernel (khora), the lint judge (janus), the
// priors/corpora (Zenodotus) and the channel (heimdall). Those are separate
// checkouts, not npm dependencies, and nothing pins them. Before this module
// the reach was 55 relative-path sites in 19 files, in three dialects, and a
// missing sibling killed 10 of 45 modules with a bare module-not-found.
//
// Now: every site names (repo, path-inside-repo) and this module resolves it.
//
//   resolution order, per repo:
//     1. an env override naming the checkout ROOT
//          khora      KHORA_HOME  (legacy alias ER7_HOME, same layout)
//          janus      JANUS_HOME
//          Zenodotus  ZENODOTUS_HOME
//          heimdall   HEIMDALL_HOME
//     2. the sibling directory next to this checkout (../<repo>)
//
//   absence is TYPED, never a bare module-not-found:
//     KernelAbsentError { code: "khora-absent" | "janus-absent" | ..., repo,
//                         home, looked, reason: "home-missing" | "file-missing" }
//   `looked` is the exact path that was tried. A caller that can degrade
//   catches this class; a caller that cannot lets it propagate and the
//   failure names the path.
//
// This module imports nothing outside node:*, so it loads in a checkout with
// no sibling at all. That is the point.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
/** This checkout's root (the penelope repo). */
export const REPO_ROOT = path.resolve(HERE, "..");
/** The directory the sibling checkouts live in (PENELOPE_WORKSPACE overrides,
 *  for a checkout that is not laid out beside its siblings). */
export const WORKSPACE_ROOT = process.env.PENELOPE_WORKSPACE ? path.resolve(process.env.PENELOPE_WORKSPACE) : path.resolve(REPO_ROOT, "..");

/** A path inside the workspace (a sibling that is not one of the four kernels,
 *  e.g. a corpus directory). No existence check. */
export const workspacePath = (...rel) => path.join(WORKSPACE_ROOT, ...rel);

/** repo key -> { env: [override names, first wins], dir: sibling dir name } */
export const KERNELS = Object.freeze({
  khora: Object.freeze({ env: ["KHORA_HOME", "ER7_HOME"], dir: "khora" }),
  janus: Object.freeze({ env: ["JANUS_HOME"], dir: "janus" }),
  zenodotus: Object.freeze({ env: ["ZENODOTUS_HOME"], dir: "Zenodotus" }),
  heimdall: Object.freeze({ env: ["HEIMDALL_HOME"], dir: "heimdall" }),
});

export class KernelAbsentError extends Error {
  constructor({ repo, home, looked, reason, cause = null }) {
    super(`${repo}-absent: ${reason === "home-missing" ? "no checkout" : "file missing"} — looked at ${looked}` +
      (reason === "file-missing" ? ` (checkout root ${home})` : ` (set ${KERNELS[repo].env[0]} or place a checkout at ../${KERNELS[repo].dir})`));
    this.name = "KernelAbsentError";
    this.code = `${repo}-absent`;
    this.repo = repo;
    this.home = home;
    this.looked = looked;
    this.reason = reason;
    if (cause) this.cause = cause;
  }
}

const known = (repo) => {
  const k = KERNELS[String(repo).toLowerCase()];
  if (!k) throw new TypeError(`kernel-reach: unknown repo "${repo}" (known: ${Object.keys(KERNELS).join(", ")})`);
  return [String(repo).toLowerCase(), k];
};

/** The checkout root for `repo` (env override, else the sibling directory).
 *  Not checked for existence; use kernelHas / kernelFile for that. */
export function kernelHome(repo) {
  const [, k] = known(repo);
  for (const name of k.env) if (process.env[name]) return path.resolve(process.env[name]);
  return path.join(WORKSPACE_ROOT, k.dir);
}

/** Absolute path of `rel` inside `repo`'s checkout (no existence check). */
export function kernelPath(repo, rel = "") {
  return path.join(kernelHome(repo), String(rel));
}

/** True when `rel` exists inside `repo`'s checkout. */
export function kernelHas(repo, rel = "") {
  try { return fs.existsSync(kernelPath(repo, rel)); } catch { return false; }
}

/** The absolute path of `rel` inside `repo`, or a typed KernelAbsentError that
 *  names the path it looked at. */
export function kernelFile(repo, rel = "") {
  const [key] = known(repo);
  const home = kernelHome(key);
  if (!fs.existsSync(home)) throw new KernelAbsentError({ repo: key, home, looked: home, reason: "home-missing" });
  const file = path.join(home, String(rel));
  if (!fs.existsSync(file)) throw new KernelAbsentError({ repo: key, home, looked: file, reason: "file-missing" });
  return file;
}

/** file:// URL of `rel` inside `repo`, typed-absent when it is not there. */
export function kernelUrl(repo, rel) {
  return pathToFileURL(kernelFile(repo, rel)).href;
}

// A module that exists can still fail because ITS OWN reach is absent (khora
// importing a janus file, say). Re-type that, naming the missing path.
function retype(err) {
  if (err instanceof KernelAbsentError) return err;
  if (err?.code !== "ERR_MODULE_NOT_FOUND" && err?.code !== "MODULE_NOT_FOUND") return err;
  const m = /Cannot find (?:module|package) '([^']+)'/.exec(String(err.message));
  const missing = m?.[1];
  if (!missing || !path.isAbsolute(missing)) return err;
  // The most specific checkout the missing path sits in (a nested home wins).
  let best = null;
  for (const [repo, k] of Object.entries(KERNELS)) {
    const home = kernelHome(repo);
    for (const root of [home, path.join(WORKSPACE_ROOT, k.dir)]) {
      if ((missing === root || missing.startsWith(root + path.sep)) && (!best || root.length > best.root.length)) best = { repo, home, root };
    }
  }
  if (best) return new KernelAbsentError({ repo: best.repo, home: best.home, looked: missing, reason: fs.existsSync(best.home) ? "file-missing" : "home-missing", cause: err });
  return err;
}

/** import() of `rel` inside `repo`. Absent -> KernelAbsentError (typed). */
export async function kernelImport(repo, rel) {
  const url = kernelUrl(repo, rel);
  try { return await import(url); } catch (e) { throw retype(e); }
}

/** kernelImport that returns `fallback` (default null) instead of throwing a
 *  KernelAbsentError. Any other failure still throws: a present module that is
 *  broken is a bug, not an absence. */
export async function kernelImportOr(repo, rel, fallback = null) {
  try { return await kernelImport(repo, rel); } catch (e) {
    if (e instanceof KernelAbsentError) return fallback;
    throw e;
  }
}

/** For tests whose subject needs a sibling: load it, and if a sibling is absent
 *  return a typed skip reason instead of a crash.
 *    const { mod, skip } = await loadOrSkip(() => import("./x.mjs"));
 *  `skip` is false when the module loaded, else "<repo>-absent: <path looked at>".
 *  Only a KernelAbsentError becomes a skip; any other failure still throws. */
export async function loadOrSkip(load) {
  try { return { mod: await load(), skip: false }; } catch (e) {
    if (e?.name === "KernelAbsentError") return { mod: null, skip: `${e.code}: ${e.looked}` };
    throw e;
  }
}

/** Plain-data description of where each kernel resolves and whether it is
 *  there. For gates, selftests and `gym` diagnostics. */
export function kernelStatus() {
  return Object.fromEntries(Object.keys(KERNELS).map((repo) => {
    const home = kernelHome(repo);
    return [repo, { home, present: fs.existsSync(home) }];
  }));
}

export default { KERNELS, WORKSPACE_ROOT, workspacePath, KernelAbsentError, kernelHome, kernelPath, kernelHas, kernelFile, kernelUrl, kernelImport, kernelImportOr, loadOrSkip, kernelStatus };
