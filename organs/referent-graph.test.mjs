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
