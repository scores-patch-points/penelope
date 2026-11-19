// node --test foresight.fast.test.mjs : the incremental merge scorer must equal the full replay (to 1e-9) on every merge tried.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import { streamOf, effect, effectMerge, effectFast, candidatePairs, mulberry } from "./foresight.mjs";
const HERE = path.dirname(fileURLToPath(import.meta.url)), NO = { merges: [], aparts: [] };
const same = (a, b, what) => { for (const k of ["hindsight", "foresight"]) assert.ok(Math.abs(a[k] - b[k]) < 1e-9, `${what}: ${k} fast ${a[k]} vs replay ${b[k]}`); assert.equal(a.later, b.later, `${what}: later`); };
const others = ["Arthur Greene", "Henry Dunn", "Olivia Park", "Thomas Reed", "Rita Cole", "Victor Hale", "Cuba", "Madrid"];
const synth = () => { const early = [], late = []; let k = 0; for (let i = 0; i < 16; i++) early.push(`${others[k++ % others.length]} met ${others[(k * 3 + 1) % others.length]} near the river.`);
  for (let i = 0; i < 20; i++) late.push(`${i % 2 ? "Black Jack" : "Marshall Bell"} wrote to ${others[(i * 5 + 2) % others.length]} about Bell and the siege.`); return { id: "s", text: `Notes.\n${early.join(" ")}\n${late.join(" ")}` }; };

test("fast merge score equals the full replay on a synthetic stream: random merges, alias-class merges, names absent from the text, and pairs already the same", async () => {
  const ev = await streamOf(synth()), faces = [...new Set(ev.map((e) => e.face))], cut = ev[Math.floor(ev.length / 2)].pos, rng = mulberry(7), pairs = candidatePairs(faces, NO, []);
  let n = 0; for (let k = 0; k < 40; k++) { const [a, b] = pairs[Math.floor(rng() * pairs.length)]; same(effectMerge(ev, cut, NO, [a, b]), effect(ev, cut, NO, { merges: [[a, b]], aparts: [] }), `${a}|${b}`); n++; }
  for (const pr of [["Marshall Bell", "Black Jack"], ["Bell", "Jack"], ["Marshall Bell", "Bell"], ["Nobody Here", "Black Jack"], ["Nobody Here", "Also Absent"]]) same(effectMerge(ev, cut, NO, pr), effect(ev, cut, NO, { merges: [pr], aparts: [] }), pr.join("|"));
  for (const c of [0, ev[3].pos, ev[ev.length - 1].pos]) same(effectMerge(ev, c, NO, ["Marshall Bell", "Black Jack"]), effect(ev, c, NO, { merges: [["Marshall Bell", "Black Jack"]], aparts: [] }), `cut ${c}`);
  assert.ok(n === 40);
});
test("fast merge score equals the full replay on a REAL article (240 referents): random merges at two cuts", async () => {
  const d = JSON.parse(fs.readFileSync(path.join(HERE, "..", "data", "dev", fs.readdirSync(path.join(HERE, "..", "data", "dev")).sort()[0]), "utf8"));
  const ev = await streamOf({ id: d.title, text: d.text }), faces = [...new Set(ev.map((e) => e.face))], rng = mulberry(11), pairs = candidatePairs(faces, NO, []);
  let tFast = 0, tSlow = 0;
  for (const frac of [0.4, 0.75]) { const cut = ev[Math.floor(ev.length * frac)].pos;
    for (let k = 0; k < 6; k++) { const [a, b] = pairs[Math.floor(rng() * pairs.length)]; let t0 = performance.now(); const f = effectFast(ev, cut, NO, { merges: [[a, b]], aparts: [] }); tFast += performance.now() - t0; t0 = performance.now(); const r = effect(ev, cut, NO, { merges: [[a, b]], aparts: [] }); tSlow += performance.now() - t0; same(f, r, `${d.title}: ${a}|${b} at ${frac}`); } }
  console.log(`   real article: ${ev.length} mention events, ${faces.length} faces; fast ${tFast.toFixed(0)} ms vs replay ${tSlow.toFixed(0)} ms for the same 12 merges (${(tSlow / tFast).toFixed(0)}x)`);
});
test("a merge that already holds (one class) changes nothing, and a cannot-link still takes the replay path", async () => {
  const ev = await streamOf(synth()), cut = ev[10].pos;
  assert.deepEqual(effectMerge(ev, cut, NO, ["Marshall Bell", "Bell"]).foresight, 0);
  const id1 = { merges: [["Marshall Bell", "Black Jack"]], aparts: [["Marshall Bell", "Black Jack"]] }; same(effectFast(ev, cut, NO, id1), effect(ev, cut, NO, id1), "apart");
});

test("through pharos's fold layer: the memo hits only at the exact position, probes run, and removing every shortcut changes no answer", async () => {
  const { effectFast, effect, SIG } = await import("./foresight.mjs");
  assert.ok(SIG.fold, `pharos fold layer present (absent: ${SIG.absent})`); const S = SIG.fold.stats;
  const faces = ["Ann Roe", "Bo Lim", "Cy Fox", "Di Lee", "Ann Roe", "Bo Lim", "Cy Fox", "Di Lee", "Ann Roe", "Cy Fox", "Bo Lim", "Di Lee"];
  const ev = faces.map((face, i) => ({ pos: i * 10, end: i * 10 + 5, face, ref: face, t: i })), id0 = { merges: [], aparts: [] }, id = (a, b) => ({ merges: [[a, b]], aparts: [] });
  for (let i = 0; i < 12; i++) effectFast(ev, 60 + i, id0, id("Cy Fox", "Di Lee"));        // enough distinct calls for the held-out promotion check
  const m0 = S.mismatches; assert.ok(S.probes >= 1); const a = effectFast(ev, 60, id0, id("Ann Roe", "Bo Lim")); const h0 = S.memoHits; effectFast(ev, 60, id0, id("Ann Roe", "Bo Lim")); assert.equal(S.memoHits, h0 + 1);
  effectFast(ev, 70, id0, id("Ann Roe", "Bo Lim")); assert.equal(S.memoHits, h0 + 1, "another cut is another call: a miss");
  process.env.PHAROS_NO_SIG = "1"; let b; try { b = effectFast(ev, 60, id0, id("Ann Roe", "Bo Lim")); } finally { delete process.env.PHAROS_NO_SIG; }
  assert.ok(Math.abs(a.foresight - b.foresight) < 1e-9 && Math.abs(a.hindsight - b.hindsight) < 1e-9); assert.equal(S.mismatches, m0);
});
