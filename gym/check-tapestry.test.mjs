// gym/check-tapestry.test.mjs — the tapestry's references, tested.
//
// A thread's ref that names a kernel file must name a file the kernel has. The
// checker only reports this when the sibling is present, and nothing ran it by
// default, so KIN named kernel/kind-induction.js after khora renamed the organ
// to kernel/terrain-induction.js and nothing noticed. This test makes the
// reference a held fact: when the sibling checkout is on this machine every
// kernel ref resolves; when it is not, the test SKIPS typed (never passes
// blind).
// Run: node --test gym/check-tapestry.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { load } from "./weave.mjs";
import { kernelHome, kernelPath } from "../organs/kernel-reach.mjs";

const { spec } = load();

// prefix -> the kernel repo it points at (the spec's own prefixes table)
const KERNEL_PREFIX = { "E7/": ["khora", "native/"], "ER7/": ["khora", ""], "LP/": ["zenodotus", ""] };

function kernelRefs() {
  const out = [];
  for (const t of spec.threads) for (const r of t.refs) {
    for (const [pre, [repo, base]] of Object.entries(KERNEL_PREFIX)) {
      if (r.startsWith(pre)) out.push({ thread: t.id, ref: r, repo, rel: base + r.slice(pre.length) });
    }
  }
  return out;
}

test("every thread ref into the kernel names a file the kernel has (skips typed when the sibling is absent)", (t) => {
  const refs = kernelRefs();
  assert.ok(refs.length > 10, "the spec names kernel files");
  const absent = new Set(["khora", "zenodotus"].filter((r) => !fs.existsSync(kernelHome(r))));
  const present = refs.filter((r) => !absent.has(r.repo));
  if (!present.length) { t.skip(`khora-absent: looked at ${kernelHome("khora")}`); return; }
  const dead = present.filter((r) => !fs.existsSync(kernelPath(r.repo, r.rel))).map((r) => `${r.thread}: ${r.ref} -> ${kernelPath(r.repo, r.rel)}`);
  assert.deepEqual(dead, [], "thread refs naming kernel files that do not exist");
});

test("KIN names the organ where it lives now (terrain-induction), not the renamed-away kind-induction", () => {
  const kin = spec.threads.find((x) => x.id === "KIN");
  assert.ok(kin, "KIN is on the cloth");
  assert.ok(kin.refs.includes("E7/kernel/terrain-induction.js"));
  assert.ok(!kin.refs.includes("E7/kernel/kind-induction.js"));
});
