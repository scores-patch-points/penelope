// gym/run-checks.mjs — the default gate's runner: what `npm test` actually runs.
//
//   node gym/run-checks.mjs --tests  <file>...        node --test over the files
//   node gym/run-checks.mjs --selftests <module>...   each module's selftest()
//
// Two failures the old inline script could not name:
//   · a test file that is LISTED but not there. `node --test missing.mjs
//     present.mjs` silently skips the missing path and exits 0, so the gate was
//     green over two tests that never existed. Here a listed file that is not
//     on disk is an error, named, before anything runs.
//   · a selftest that cannot run because a sibling checkout is absent. That is
//     a typed SKIP (`<repo>-absent: <path looked at>`), not a crash and not a
//     pass; any other failure is a failure.
// Falsifying control: gym/run-checks.test.mjs lists a missing file and watches
// the runner fail, lists a present one and watches it pass.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The listed paths that are not files under `root`. */
export function missing(files, root = ROOT) {
  return files.filter((f) => !fs.existsSync(path.resolve(root, f)) || !fs.statSync(path.resolve(root, f)).isFile());
}

/** Run node --test over `files` after proving every one exists. */
export function runTests(files, { root = ROOT, node = process.execPath, stdio = "inherit" } = {}) {
  if (!files.length) return { ok: false, status: 2, error: "no test files listed" };
  const gone = missing(files, root);
  if (gone.length) return { ok: false, status: 1, missing: gone, error: `listed test file(s) do not exist: ${gone.join(", ")}` };
  // a runner started from inside a test must not inherit the parent test context
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(node, ["--test", ...files], { cwd: root, stdio, env });
  return { ok: r.status === 0, status: r.status ?? 1 };
}

/** Run each module's selftest(). KernelAbsentError -> a named skip. */
export async function runSelftests(mods, { root = ROOT, log = console.log, err = console.error } = {}) {
  const gone = missing(mods, root);
  if (gone.length) return { ok: false, failed: gone.map((m) => ({ mod: m, error: "module does not exist" })), skipped: [], passed: [] };
  const passed = [], skipped = [], failed = [];
  for (const m of mods) {
    try {
      const x = await import(pathToFileURL(path.resolve(root, m)).href);
      const r = await x.selftest();
      if (r?.ok === false) throw new Error("selftest returned false");
      passed.push(m);
    } catch (e) {
      if (e?.name === "KernelAbsentError") { skipped.push({ mod: m, code: e.code, looked: e.looked }); log(`SKIP ${m} — ${e.code}: looked at ${e.looked}`); }
      else { failed.push({ mod: m, error: String(e?.message ?? e) }); err("LOAD-FAIL", m, String(e?.message ?? e)); }
    }
  }
  return { ok: failed.length === 0, passed, skipped, failed };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [mode, ...rest] = process.argv.slice(2);
  if (mode === "--tests") {
    const r = runTests(rest);
    if (r.error) console.error("RUN-FAIL", r.error);
    process.exit(r.ok ? 0 : (r.status || 1));
  } else if (mode === "--selftests") {
    const r = await runSelftests(rest);
    process.exit(r.ok ? 0 : 1);
  } else {
    console.error("usage: run-checks.mjs --tests <file>... | --selftests <module>...");
    process.exit(2);
  }
}
