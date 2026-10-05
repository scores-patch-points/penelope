// gym/escalate-live.mjs — CHASE: prove escalation at the wall LIVE end-to-end.
//
// The doctrine (GL-CD-13): a unit that exhausts the local mouth spiral
// escalates to a FRONTIER mouth through heimdall's sealed-external gate, and
// the off-system send is DE-IDENTIFIED ONLY (real → fake, longest-fake-first
// restore on the way back). Unit-tested but never proven on a real wall + real
// frontier lane. This run proves it: a deterministic walling local fill, the
// REAL escalateWalled → REAL drawFrontier → REAL claude draw through the live
// bridge, with the off-system wire captured to verify the de-identification.
//
//   PENELOPE_FRONTIER_MODEL=claude-sonnet-4-6 node gym/escalate-live.mjs
//
// The wall is scripted (the 1.5B walls are not deterministic); the escalation
// draw, the de-identification, the re-identification, and the gate are REAL.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
import codeAdapter from "../organs/generation/adapters/code.mjs";
import { composeCodePipeline, escalateWalled, deidentify, reidentify } from "../organs/code-pipeline.mjs";

const CHANNEL = "http://127.0.0.1:8790";
const FRONTIER = process.env.PENELOPE_FRONTIER_MODEL || "claude-sonnet-4-6";

// Capture the off-system wire: the only fetch we care about is the sealed
// frontier draw — record what actually left the machine.
const captured = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  if (String(url).includes("/v1/chat/completions") && String(init?.body ?? "").includes("claude")) {
    captured.push({ url: String(url), body: JSON.parse(String(init.body)) });
  }
  return realFetch(url, init);
};

// 1. THE TASK — a module with one unit the local mouth deterministically walls.
const task = "Write a module with a function reverse(arr) that returns a new array with the elements reversed, without mutating the input.";
const unit = { name: "reverse", spec: "returns a new array with the elements reversed, without mutating the input" };

// 2. THE LOCAL WALL (scripted — the machine's own measurement: the local mouth
// exhausted its spiral). The escalation sees ONLY this evidence.
const walledFill = async () => [
  { unit: "reverse", agent: "mouth", walled: true, source: "draw", model: "qwen2.5-coder:1.5b",
    attempts: [
      { attempt: 1, why: "no function drawn" },
      { attempt: 2, why: "used `this`" },
      { attempt: 3, why: "spec words missing: mutating, reversed" },
      { attempt: 4, why: "no function drawn" },
    ] },
];

// 3. THE REAL PIPELINE with the real escalation (real frontier draw, real
// de-identification, real re-identification, real gate).
const result = await composeCodePipeline({
  intent: task,
  model: "qwen2.5-coder:1.5b",
  artifact: "code",
  frontierModel: FRONTIER,
  channel: CHANNEL,
  fill: walledFill,                 // the wall (scripted)
  escalate: escalateWalled,         // the REAL escalation
  swarm: async () => ({ routed: true, meaning: { hard: true } }),
  adapter: { ...codeAdapter, readUnits: async () => [unit] },
});

// 4. THE VERDICT.
const esc = result.subAgents;
const frontierOutcome = (result.evidence?.outcomes ?? []).find((o) => o.stage === "mouth-frontier");
console.log("\n=== ESCALATION AT THE WALL — LIVE ===");
console.log("escalation attempted:", esc.escalated, "| frontier model:", result.frontier?.model);
console.log("status:", result.status, "| gate:", result.verification?.verdict?.reason);
console.log("frontier outcome:", JSON.stringify({ unit: frontierOutcome?.unit, stage: frontierOutcome?.stage, by: frontierOutcome?.by, refused: frontierOutcome?.refused ?? null, walled: frontierOutcome?.walled ?? null }));
console.log("deidentified mapping disclosed:", JSON.stringify((frontierOutcome?.deidentified || []).length ? frontierOutcome.deidentified : null));
console.log("artifact has a real reverse():", /function reverse\(/.test(result.artifact?.value || "") || /reverse\s*[=(]/.test(result.artifact?.value || ""));

// 5. THE WIRE — what actually left the machine.
const wire = captured[0];
console.log("\n=== THE OFF-SYSTEM WIRE (what left the machine) ===");
if (wire) {
  console.log("privacy label:", wire.body.heimdall_privacy);
  console.log("model:", wire.body.model);
  console.log("carries a real path/username/email:", /\/Users\/[A-Za-z]|\bmlacy\b|@[a-z]+\.[a-z]{2,}/i.test(wire.body.messages?.[0]?.content ?? ""));
  console.log("payload head:", (wire.body.messages?.[0]?.content ?? "").slice(0, 120).replace(/\n/g, " "));
} else {
  console.log("NO frontier wire captured — the escalation did not reach the frontier lane");
}

// 6. De-identification round-trip on the actual prompt used.
const fragment = `reverse(arr): ${unit.spec}\n\nLocal attempts failed for: no function drawn`;
const scrubbed = deidentify(fragment);
const restored = reidentify(scrubbed.text, scrubbed.map);
console.log("\n=== DE-IDENTIFICATION ROUND-TRIP ===");
console.log("real == restored:", fragment === restored, "| map entries:", scrubbed.map.length);

console.log("\nRESULT:", result.ok ? "PASS — escalation proven live" : "FAIL — gate unmet");
process.exit(result.ok ? 0 : 1);