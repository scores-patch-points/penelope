// gym/handmaidens/handmaidens.test.mjs — each member, shown on a constructed
// violation she must catch and a constructed non-violation she must not
// (GL-QA-01: a check that cannot be seen failing is a comment).
//
// Born of two measured false positives, not invented to fill a name:
//   · Iphthime reported the GAT and SWT threads as ghosts: she compared the
//     thread ids the EOT writes ("the GAT thread") with thread NAMES only.
//   · Autonoe reported gym/check-tapestry.mjs as an unrecorded draw: it holds
//     "/api/chat-stream" as a string in a selftest and makes no call at all.
// Run: node --test gym/handmaidens/handmaidens.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { audit as autonoe } from "./autonoe.mjs";
import { audit as iphthime } from "./iphthime.mjs";

const house = (files) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "house-"));
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
};

// ── Autonoe: every draw recorded ─────────────────────────────────────────────
test("autonoe catches a constructed leak: a fetch to a model door with no swatch (violation)", () => {
  const root = house({ "organs/leak.mjs": 'export const ask = (p) => fetch("http://127.0.0.1:11434/api/generate", { method: "POST", body: p });\n' });
  const r = autonoe({ root });
  assert.deepEqual(r.unrecorded, ["organs/leak.mjs"]);
  assert.equal(r.ok, false);
});

test("autonoe catches the injected-fetch form too (fetchImpl is how code-pipeline's frontier draw is written)", () => {
  const root = house({ "organs/frontier.mjs": 'export const go = (fetchImpl) => fetchImpl("http://bridge/v1/chat/completions", {});\n' });
  assert.deepEqual(autonoe({ root }).unrecorded, ["organs/frontier.mjs"]);
});

test("autonoe does NOT flag a file that only names a door as data (non-violation: a route string, a regex)", () => {
  const root = house({
    "gym/tapestry-check.mjs": 't("a route is caught", routes(spec, "x").some((p) => p.startsWith("ROUTE: /api/chat-stream")));\n',
    "organs/table.mjs": 'export const KIND_WIRE = { chat: "/api/chat", build: "/v1/chat/completions", port: 11434 };\n',
  });
  const r = autonoe({ root });
  assert.deepEqual(r.unrecorded, []);
  assert.equal(r.ok, true);
});

test("autonoe does NOT flag a draw that writes the swatch or goes through the door (non-violation: recorded)", () => {
  const root = house({
    "organs/recorded.mjs": 'import { swatch } from "./generation-door.mjs";\nexport const d = async () => { const r = await fetch("http://x:11439/api/generate"); swatch({ weave: "draw" }); return r; };\n',
    "organs/door-user.mjs": 'import { runDrawDoor } from "./generation-door.mjs";\nexport const d = () => runDrawDoor({ prompt: "x" }); // http://127.0.0.1:11439/api/generate\n',
  });
  assert.deepEqual(autonoe({ root }).unrecorded, []);
});

// ── Iphthime: every claim grounded ───────────────────────────────────────────
const spec = (threads) => JSON.stringify({ threads: threads.map((t) => ({ refs: [], ...t })) });
const eot = (...entries) => entries.map((e) => `### ${e.id} — t\n- pipeline: p\n- status: s\n- evidence: ${e.evidence ?? "organs/x.mjs:1"}\n${e.body ?? ""}\n`).join("\n");

test("iphthime: a thread the EOT calls by its ID (GAT) is not a ghost; one it invents (ZZZ) is (violation + non-violation)", () => {
  const root = house({
    "gym/tapestry.spec.json": spec([{ id: "GAT", name: "gates", refs: ["GL-EN-15"] }, { id: "SWT", name: "swatch", refs: ["GL-RT-01"] }]),
    "GLAUCA-EOT.md": eot(
      { id: "GL-EN-15", body: "- law: unwoven in Penelope (thread GAT); the GAT thread holds it. The SWT thread counts it.\n" },
      { id: "GL-RT-01", body: "- law: the ZZZ thread does not exist.\n" },
    ),
  });
  const r = iphthime({ root });
  assert.deepEqual(r.ghostThreads, ["ZZZ"]);
  assert.equal(r.ok, false);
  // control: with the invented thread gone, she is satisfied
  const clean = house({
    "gym/tapestry.spec.json": spec([{ id: "GAT", name: "gates", refs: ["GL-EN-15"] }]),
    "GLAUCA-EOT.md": eot({ id: "GL-EN-15", body: "- law: the GAT thread holds it.\n" }),
  });
  assert.deepEqual(iphthime({ root: clean }).ghostThreads, []);
  assert.equal(iphthime({ root: clean }).ok, true);
});

test("iphthime: the bare GL-00 / GL-01 laws are read (the narrow id grammar skipped them)", () => {
  const root = house({
    "gym/tapestry.spec.json": spec([{ id: "LAW", name: "law", refs: ["GL-01"] }]),
    "GLAUCA-EOT.md": eot({ id: "GL-00" }, { id: "GL-01" }),
  });
  const r = iphthime({ root });
  assert.equal(r.declared, 2);
  assert.deepEqual(r.uncited, ["GL-00"], "GL-00 is declared and cited by no thread; GL-01 is cited");
});

test("iphthime: a law with no evidence path is reported, and now fails her round", () => {
  const root = house({
    "gym/tapestry.spec.json": spec([{ id: "LAW", name: "law", refs: ["GL-EN-01"] }]),
    "GLAUCA-EOT.md": eot({ id: "GL-EN-01", evidence: "it is obviously so" }),
  });
  const r = iphthime({ root });
  assert.deepEqual(r.noPath, ["GL-EN-01"]);
  assert.equal(r.ok, false);
});
