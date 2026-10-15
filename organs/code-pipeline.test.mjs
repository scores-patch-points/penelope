// organs/code-pipeline.test.mjs — the robust coding pipeline, scripted mouth
// (no model, no network). Pins the COMPOSITION, not the draws: law order
// (field → hunt → mouth), concurrency, escalation-at-the-wall gating, and the
// agentic record shape. The mouth is scripted; the gate is the real code
// adapter (node --check + spec-conformance).

import { test as _nodeTest } from "node:test";
import assert from "node:assert";
import { loadOrSkip } from "./kernel-reach.mjs";
import { createHash } from "node:crypto";

// This subject needs a sibling checkout (organs/kernel-reach.mjs). Absent, its
// tests SKIP with the typed reason named, rather than crash the file.
const { mod: _subject, skip: _skip } = await loadOrSkip(() => import("./code-pipeline.mjs"));
const { composeCodePipeline, fillUnit, fillParallel, escalateWalled, swarmTask, drawFrontier, deidentify, reidentify, unitsFromPrior, scarsOf } = _subject ?? {};
const test = (name, fn) => _nodeTest(name, { skip: _skip }, fn);


// ── scripted adapter: field holds `held`, hunt snips `snip`, mouth draws the
// rest. Every draw is recorded so the composition's order is provable.
function scriptedAdapter({ fieldName = "held", huntName = "snip", mouthName = "drawn" } = {}) {
  const calls = [];
  const units = [
    { name: fieldName, spec: "a unit the field already holds" },
    { name: huntName, spec: "a unit the hunt snips from the field" },
    { name: mouthName, spec: "a unit the mouth must draw" },
  ];
  return {
    calls,
    units,
    adapter: {
      kind: "code",
      readUnits: async () => units,
      autofill: (u) => (u.name === fieldName ? { code: "export const held = 1;\n", address: "corpus:held" } : null),
      hunt: async (u) => (u.name === huntName ? { code: "export const snip = 2;\n", url: "hunt:snip" } : null),
      mouthFragment: (u) => `draw ${u.name}`,
      snip: (code, name) => (code.includes(`export const ${name}`) ? code : "export const drawn = 3;\n"),
      probeUnit: () => ({ ok: true, detail: "" }),
      sharpen: (u, atom, why) => atom,
      testUnits: (code) => ({ ok: true, reason: "spec-conformant", detail: "" }),
      assemble: (body) => body,
      toDocument: () => "<html></html>",
    },
  };
}

test("fillUnit runs law order: field first, hunt second, mouth last", async () => {
  const { adapter } = scriptedAdapter();
  const field = await fillUnit({ name: "held", spec: "" }, adapter, {});
  assert.equal(field.agent, "field");
  assert.equal(field.address, "corpus:held");
  const hunt = await fillUnit({ name: "snip", spec: "" }, adapter, {});
  assert.equal(hunt.agent, "hunt");
  assert.equal(hunt.address, "hunt:snip");
  const mouth = await fillUnit({ name: "drawn", spec: "" }, adapter, {});
  assert.equal(mouth.agent, "mouth");
});

test("fillParallel fills every unit concurrently, one disposition each", async () => {
  const { units, adapter } = scriptedAdapter();
  const out = await fillParallel(units, adapter, {}, 3);
  assert.equal(out.length, 3);
  assert.deepEqual(out.map((o) => o.agent).sort(), ["field", "hunt", "mouth"]);
});

test("escalateWalled fires only with a configured frontier model", async () => {
  const walled = [{ unit: "drawn", attempts: [{ attempt: 1, why: "no function drawn" }] }];
  const adapter = { mouthFragment: (u) => `re-draw ${u.name}`, snip: (c) => c, probeUnit: () => ({ ok: true }), sharpen: (u, a) => a };
  const off = await escalateWalled(walled, adapter, {}, { model: null });
  assert.equal(off.attempted, false);
  assert.equal(off.outcomes.length, 0);
});

test("escalateWalled never fabricates a pass when the frontier gate refuses", async () => {
  const walled = [{ unit: "drawn", attempts: [{ attempt: 1, why: "no function drawn" }] }];
  const adapter = { mouthFragment: (u) => `re-draw ${u.name}`, snip: (c) => c, probeUnit: () => ({ ok: true }), sharpen: (u, a) => a };
  const out = await escalateWalled(walled, adapter, {}, {
    model: "claude-x",
    channel: "http://127.0.0.1:1", // unreachable: the gate refuses
  });
  assert.equal(out.attempted, true);
  assert.equal(out.outcomes[0].refused, true);
  assert.equal(out.outcomes[0].code, undefined); // no fabricated body
});

test("composeCodePipeline returns the agentic record with the swarm disclosed", async () => {
  const { units, adapter } = scriptedAdapter();
  const swarm = async () => ({ routed: true, meaning: { hard: true }, ants: 3 });
  const r = await composeCodePipeline({
    intent: "make a module",
    model: "qwen2.5-coder:1.5b",
    adapter,
    swarm,
    fill: async (us, ad, ctx, p) => fillParallel(us, ad, ctx, p),
    escalate: async () => ({ attempted: false, outcomes: [] }),
    channel: "http://127.0.0.1:1",
  });
  assert.equal(r.schema, "CodePipeline@1");
  assert.equal(r.swarm.routed, true);
  assert.equal(r.verification.verdict.ok, true);
  assert.equal(r.subAgents.dispositions.length, 3);
  assert.equal(r.subAgents.escalated, false);
  assert.equal(r.ok, true);
  assert.equal(r.artifact.value.includes("export const held"), true);
});

test("swarmTask discloses a gap when the swarm is unreachable, never a stop", async () => {
  const s = await swarmTask("make me a countdown clock", { url: "http://127.0.0.1:1/v1/swarm" });
  assert.equal(s.routed, false);
  assert.ok(s.gap);
});

test("drawFrontier always carries the sealed-external privacy label", async () => {
  let seen = null;
  const fetchImpl = async (url, init) => {
    seen = { url, body: JSON.parse(init.body) };
    return { ok: true, json: async () => ({ choices: [{ message: { content: "export const x = 1;\n" } }] }) };
  };
  const t = await drawFrontier("draw x", "claude-sonnet-4-6", { channel: "http://bridge", fetchImpl });
  assert.equal(seen.body.heimdall_privacy, "sealed-external");
  assert.equal(seen.body.model, "claude-sonnet-4-6");
  assert.equal(t.text.includes("export const x"), true);
});

test("deidentify scrubs real identities for the off-system send and reidentify restores", async () => {
  const real = "the project /Users/mlacy/code/countdown, author mlacy, email person@example.invalid, key sk-ant-api03-abcdef123456789";
  const { text, map } = deidentify(real);
  assert.ok(!text.includes("mlacy"));
  assert.ok(!text.includes("person@example.invalid"));
  assert.ok(!text.includes("sk-ant-api03-abcdef123456789"));
  assert.ok(text.includes("anon"));
  assert.ok(map.length >= 3);
  const back = reidentify(text, map);
  assert.ok(back.includes("/Users/mlacy/code/countdown"));
  assert.ok(back.includes("person@example.invalid"));
  assert.ok(back.includes("sk-ant-api03-abcdef123456789"));
});

test("unitsFromPrior anchors an iteration to the artifact's own declarations, JS or Python", async () => {
  const js = unitsFromPrior("function greet(name){ return `hi ${name}`; }\nexport { greet };\n", "make it formal");
  assert.deepEqual(js.map((u) => u.name), ["greet"]);
  assert.match(js[0].spec, /make it formal/);
  const py = unitsFromPrior('def greet(name):\n    return f"hi {name}"\n', "add a title arg");
  assert.deepEqual(py.map((u) => u.name), ["greet"]);
  assert.equal(unitsFromPrior("", "x").length, 0);
});
// ── the record's three duties (GL-BD-04 the dissent, GL-00 the ledger, no vacuous pass) ──
const sha = (v) => createHash("sha256").update(typeof v === "string" ? v : JSON.stringify(v)).digest("hex");
const noEscalation = async () => ({ attempted: false, outcomes: [] });
const noSwarm = async () => ({ routed: false, gap: "test" });

test("an empty reading is NOT verified: zero units is a typed empty artifact, never a vacuous pass", async () => {
  const { adapter } = scriptedAdapter();
  const empty = { ...adapter, readUnits: async () => [] };
  const r = await composeCodePipeline({ intent: "make a module", adapter: empty, swarm: noSwarm, escalate: noEscalation, channel: "http://127.0.0.1:1" });
  assert.equal(r.ok, false);
  assert.equal(r.status, "unverified");
  assert.equal(r.gap.kind, "empty-artifact");
  assert.equal(r.artifact.value.trim(), "");
  // negative control: the same pipeline with units that contribute is still verified
  const full = scriptedAdapter();
  const ok = await composeCodePipeline({ intent: "make a module", adapter: full.adapter, swarm: noSwarm, escalate: noEscalation, fill: async (us) => us.map((u) => ({ unit: u.name, agent: "field", code: `export const ${u.name} = 1;\n`, address: `corpus:${u.name}` })), channel: "http://127.0.0.1:1" });
  assert.equal(ok.status, "verified");
  assert.equal(ok.ok, true);
});

test("the dissent ships: one scar per failed attempt, and the digest binds artifact, scars and provenance", async () => {
  const { adapter } = scriptedAdapter();
  // two units: one drawn after 2 failed attempts, one walled after 3 failed attempts
  const fill = async () => ([
    { unit: "held", agent: "mouth", code: "export const held = 1;\n", address: null, source: "draw", attempts: 3, scars: [{ attempt: 1, why: "no function drawn" }, { attempt: 2, why: "used `this`" }], model: "m" },
    { unit: "drawn", agent: "mouth", walled: true, source: "draw", attempts: [{ attempt: 1, why: "a" }, { attempt: 2, why: "b" }, { attempt: 3, why: "c" }], scars: [{ attempt: 1, why: "a" }, { attempt: 2, why: "b" }, { attempt: 3, why: "c" }], model: "m" },
  ]);
  const r = await composeCodePipeline({ intent: "make a module", adapter, swarm: noSwarm, escalate: noEscalation, fill, channel: "http://127.0.0.1:1" });
  assert.equal(r.evidence.scars.length, 5, "scars == the failed attempts that happened (2 + 3)");
  assert.deepEqual(r.evidence.scars.filter((x) => x.unit === "drawn").map((x) => x.attempt), [1, 2, 3]);
  assert.ok(r.evidence.scars.every((x) => x.stage === "mouth" && typeof x.why === "string"));
  assert.equal(r.repair.scars.length, 5);
  assert.equal(r.repair.converged, false);
  // the digest
  assert.equal(r.digest.algorithm, "sha256");
  assert.equal(r.digest.artifact, sha(r.artifact.value));
  assert.equal(r.digest.scars, sha(r.evidence.scars));
  assert.equal(r.digest.provenance, sha(r.provenance));
  assert.equal(r.digest.record, sha([r.digest.artifact, r.digest.scars, r.digest.provenance].join(":")));
  // falsifying control: dropping one scar changes the record's own hash
  assert.notEqual(sha([r.digest.artifact, sha(r.evidence.scars.slice(1)), r.digest.provenance].join(":")), r.digest.record);
  // scarsOf is the pure derivation (and ships the model-required scar too)
  assert.deepEqual(scarsOf({ filled: [{ unit: "u", required: true }] }), [{ unit: "u", attempt: 0, why: "model-required (noModel:true)", stage: "mouth" }]);
});

test("the ledger of the making ships: Provenance@2, a contribution per held/hunted/drawn unit, byte ranges that tile the join", async () => {
  const { adapter } = scriptedAdapter();
  const fill = async () => ([
    { unit: "held", agent: "field", code: "export const held = 1;\n", address: "corpus:held" },
    { unit: "snip", agent: "hunt", code: "export const snip = 2;\n", address: "hunt:snip" },
    { unit: "drawn", agent: "mouth", code: "export const drawn = 3;\n", address: null, source: "draw", attempts: 1, scars: [], model: "m" },
  ]);
  const r = await composeCodePipeline({ intent: "make a module", adapter, swarm: noSwarm, escalate: noEscalation, fill, channel: "http://127.0.0.1:1" });
  const p = r.provenance;
  assert.equal(p.schema, "Provenance@2");
  const ids = new Set(p.sources.map((s) => s.source_id));
  assert.ok(p.events.every((e) => !e.source_id || ids.has(e.source_id)), "no event names a source that is not in the table");
  const contributions = p.events.filter((e) => e.range && e.unit);
  assert.deepEqual(contributions.map((e) => e.unit), ["held", "snip", "drawn"]);
  // the ranges tile the join: each starts two bytes after the previous ends
  contributions.forEach((e, i) => { if (i) assert.equal(e.range.start, contributions[i - 1].range.end + 2); });
  assert.equal(contributions.at(-1).range.end, Buffer.byteLength(["export const held = 1;\n", "export const snip = 2;\n", "export const drawn = 3;\n"].join("\n\n")));
  assert.ok(p.events.some((e) => e.stage === "verify"));
});
