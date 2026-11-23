import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { coherenceJudgment } from "./coherence-judgment.mjs";

test("coherenceJudgment: reads bindings, writes the attested bundle and the coherence verdict (skips if khora absent)", { skip: !process.env.KHORA_HOME, timeout: 60000 }, async () => {
  const pharosDir = fs.mkdtempSync(path.join(os.tmpdir(), "cj-pharos-"));
  process.env.PHAROS = pharosDir;
  const { read } = await import(path.join(process.env.KHORA_HOME, "native/reading-one.mjs"));
  // a text whose pronouns bind to masculine beings — no within-read contradiction expected
  const text = "Jonathan wondered at the castle. He thought the place was strange. Mina followed him. She carried a lantern. ".repeat(3);
  await read(text, { rows: true, allowDegraded: true, language: "en", admitNominals: true, speakers: true });

  const j = await coherenceJudgment({ pharosDir, writer: "penelope" });
  assert.equal(j.gap, null);
  assert.ok(j.referents > 0, "attested bundles were computed per referent");
  assert.ok(j.bindings > 0, "the judgment read the read's bindings");

  const { open, entries } = await import(path.join(path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "pharos"), "lib", "pharos.mjs"));
  const h = open("khora", { dir: pharosDir, writer: "penelope", frame: false });
  const all = entries(h);
  const attested = all.filter((e) => e.kind === "attested");
  const coherence = all.filter((e) => e.kind === "coherence");
  assert.ok(attested.length > 0, "attested entries were woven");
  assert.equal(coherence.length, j.bindings, "one coherence verdict per binding");
  delete process.env.PHAROS;
});
