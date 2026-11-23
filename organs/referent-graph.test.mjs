import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { referentGraph } from "./referent-graph.mjs";

test("referentGraph: the fold reads the pharos and folds beings/edges/bindings (skips if khora/pharos absent)", { skip: !process.env.KHORA_HOME, timeout: 60000 }, async () => {
  const pharosDir = fs.mkdtempSync(path.join(os.tmpdir(), "rg-pharos-"));
  process.env.PHAROS = pharosDir;
  // read a text through khora — the read writes its full parse (beings, kāraka edges, bindings) to the pharos
  const { read } = await import(path.join(process.env.KHORA_HOME, "native/reading-one.mjs"));
  const text = "Jonathan wondered at the castle. He thought the place was strange. Mina followed him and she carried a lantern. ".repeat(3);
  await read(text, { rows: true, allowDegraded: true, language: "en", admitNominals: true, speakers: true });

  const g = await referentGraph({ pharosDir, writer: "khora" });
  assert.equal(g.gap, null, "the pharos was folded, not read again");
  assert.ok(g.beings > 0, "beings were folded from INS·Figure entries");
  assert.ok(g.claims > 0, "kāraka edges were folded from SYN·Pattern entries");
  assert.ok(g.edges.size > 0, "the relations folded into edges between referent nodes");
  assert.ok(g.nodeCount <= g.surfaceCount, "pronouns fold into their referent, so nodes <= surfaces");
  delete process.env.PHAROS;
});

test("foldFromPharos feeds sameFold / patternOf / holarchy (the unused fold machinery, now on the pharos)", { skip: !process.env.KHORA_HOME, timeout: 60000 }, async () => {
  const { foldFromPharos } = await import("./referent-graph.mjs");
  const { sameFold, patternOf, holarchy } = await import("./relation-fold.mjs");
  const pharosDir = fs.mkdtempSync(path.join(os.tmpdir(), "ffp-pharos-"));
  process.env.PHAROS = pharosDir;
  const { read } = await import(path.join(process.env.KHORA_HOME, "native/reading-one.mjs"));
  const text = "Jonathan gave the book to Mina in the courtyard. She thanked him. He went to the castle. ".repeat(3);
  await read(text, { rows: true, allowDegraded: true, language: "en", admitNominals: true, speakers: true });

  const f = await foldFromPharos({ pharosDir, writer: "khora" });
  assert.equal(f.gap, null);
  const pat = patternOf(f.fold);
  assert.ok(typeof pat === "string" && pat.length > 0, "the fold has a pattern (the labelled graph's canonical form)");
  const cmp = sameFold(f.fold, f.fold, { roles: { kartṛ: "root", karman: "leaf", sampradāna: "leaf", adhikaraṇa: "leaf" } });
  assert.equal(cmp.root, "same", "a fold compared to itself is the same thing");
  const h = holarchy(f.fold);
  assert.ok(h && typeof h === "object" && "nodes" in h, "holarchy runs on the fold ({ nodes, parts, wholes })");
  delete process.env.PHAROS;
});
