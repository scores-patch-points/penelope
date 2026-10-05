// organs/generation/api.mjs — THE PUBLIC GENERATION CONTRACT.
// One orchestration API for arbitrary artifacts. The engine owns the lifecycle;
// an artifact adapter owns only what is genuinely medium-specific.
//
// Contract:
//   weave({ intent, artifact, constraints, context, verification, ... })
//
// The result separates artifact, materialization, verification, evidence, and
// repair. Adding a medium means registering an adapter, not another engine.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { arrange } from "./engine.mjs";

const adapters = new Map();

export function registerGenerationAdapter(kind, adapter) {
  const name = String(kind ?? "").trim();
  if (!name) throw new Error("generation adapter kind is required");
  if (!adapter || typeof adapter.readUnits !== "function" || typeof adapter.testUnits !== "function") {
    throw new Error("generation adapter " + name + " must provide readUnits() and testUnits()");
  }
  adapters.set(name, adapter);
  return adapter;
}

export function generationAdapter(kind) {
  return adapters.get(String(kind ?? "")) ?? null;
}

export function generationKinds() {
  return [...adapters.keys()].sort();
}

async function loadBuiltins() {
  // Load the sibling reader only when this medium is requested. Code generation
  // must remain usable in a standalone Penelope checkout.
  if (!adapters.has("overview")) registerGenerationAdapter("overview", {
    kind: "overview", ext: "json",
    async readUnits(task, ctx) {
      ctx.overviewAdapter = (await import("./adapters/overview.mjs")).default;
      return ctx.overviewAdapter.readUnits(task, ctx);
    },
    autofill: (u, ctx) => ctx.overviewAdapter.autofill(u, ctx),
    snip: (v, name, ctx) => ctx.overviewAdapter.snip(v, name, ctx),
    probeUnit: (v, u, ctx) => ctx.overviewAdapter.probeUnit(v, u, ctx),
    testUnits: (v, units, ctx) => ctx.overviewAdapter.testUnits(v, units, ctx),
    toDocument: (v, ctx) => ctx.overviewAdapter.toDocument(v, ctx),
  });
  if (!adapters.has("code")) registerGenerationAdapter("code", (await import("./adapters/code.mjs")).default);
  if (!adapters.has("code-fix")) registerGenerationAdapter("code-fix", (await import("./adapters/code-fix.mjs")).default);
  if (!adapters.has("text")) registerGenerationAdapter("text", (await import("./adapters/prose.mjs")).default);
  // "prose" remains an internal compatibility alias; the public artifact kind is text.
  if (!adapters.has("prose")) registerGenerationAdapter("prose", generationAdapter("text"));
  return adapters;
}

function normalizeArtifact(result, kind) {
  return {
    kind,
    value: result.code ?? result.html ?? result.result?.code ?? result.result?.html ?? null,
  };
}

/**
 * Generate an artifact through the single Penelope orchestration contract.
 *
 * artifact may be a registered kind or an adapter object. A missing/unknown
 * kind is a named gap; Penelope never guesses the medium from prose.
 */
export async function weave({
  intent,
  artifact,
  constraints = {},
  context = {},
  verification = {},
  model = null,
  noModel = false,
  output = null,
} = {}) {
  const task = String(intent ?? "").trim();
  if (!task) return { schema: "Weaving@1", ok: false, status: "gap", error: "generation intent is required" };

  // THE ROBUST CODING PIPELINE (organs/code-pipeline.mjs, 2026-10-04): the
  // code-agent artifact composes the code spine as sub-agents — swarm the
  // task, field → hunt → mouth in parallel, escalate to a frontier mouth at
  // the wall (sealed-external), gate with the real test + janus lint. It
  // returns its own CodePipeline@1 record; the weave door is the entry.
  if (String(artifact ?? "") === "code-agent") {
    const { composeCodePipeline } = await import("../code-pipeline.mjs");
    const r = await composeCodePipeline({ intent: task, model, constraints, verification, context, output }).catch((e) => ({
      schema: "CodePipeline@1", ok: false, status: "error", error: String(e?.message ?? e).slice(0, 500), intent: task,
    }));
    return r;
  }

  await loadBuiltins();
  const kind = typeof artifact === "string" ? artifact : artifact?.kind;
  const adapter = typeof artifact === "object" && artifact?.readUnits ? artifact : generationAdapter(kind);
  if (!adapter) {
    return {
      schema: "Weaving@1",
      ok: false,
      status: "gap",
      error: kind
        ? "no generation adapter registered for artifact kind " + kind
        : "artifact kind is required — name the medium or register an adapter",
      availableArtifacts: generationKinds(),
    };
  }

  // noModel:true is the explicit model-free mode: field and hunt run as usual,
  // and any unit that reaches the mouth stage is recorded as model-required and
  // left unresolved. No draw is ever made, and no substitute model is used.
  const ctx = { ...context, constraints, verification, model: noModel ? null : model, noModel: noModel === true, artifact: kind ?? adapter.kind };
  const args = { out: output ?? undefined };
  if (context?.example !== undefined) args.example = JSON.stringify(context.example);

  const result = await arrange({
    task,
    args,
    context: ctx,
    adapter: {
      ...adapter,
      readUnits: (t) => adapter.readUnits(t, ctx),
      computeSettles: adapter.computeSettles ? (units, example) => adapter.computeSettles(units, example, ctx) : undefined,
      autofill: adapter.autofill ? (unit) => adapter.autofill(unit, ctx) : undefined,
      hunt: adapter.hunt ? (unit) => adapter.hunt(unit, ctx) : undefined,
      mouthFragment: adapter.mouthFragment ? (unit, atom) => adapter.mouthFragment(unit, atom, ctx) : undefined,
      snip: (value, name) => adapter.snip(value, name, ctx),
      probeUnit: (value, unit) => adapter.probeUnit(value, unit, ctx),
      testUnits: (value, units) => adapter.testUnits(value, units, ctx),
      toDocument: (value) => adapter.toDocument(value, ctx),
      sharpen: adapter.sharpen ? (unit, atom, why) => adapter.sharpen(unit, atom, why, ctx) : undefined,
    },
  });

  const verified = result.verdict?.ok === true && result.void?.kind !== "reading-void";
  return {
    schema: "Weaving@1",
    ok: verified,
    status: verified ? "verified" : result.void?.kind === "hunt-defined" ? "void-resolved" : result.void ? "void" : "unverified",
    intent: task,
    artifact: normalizeArtifact(result, kind ?? adapter.kind),
    void: result.void ?? null,
    materialization: {
      widget: result.eot?.product?.widget ?? null,
      folded: result.eot?.product?.folded ?? null,
      slug: result.slug ?? null,
    },
    verification: {
      ok: verified,
      contract: verification,
      verdict: result.verdict ?? null,
    },
    evidence: {
      provenance: result.provenance ?? {
        schema: "Provenance@2",
        sources: [],
        events: [],
        addressSpace: { artifact: "folded-bytes", unit: "byte", encoding: "utf8" },
      },
      eot: result.eot ?? null,
      // Flat per-unit disposition: field | hunt | mouth | model-required | unsatisfied.
      outcomes: result.outcomes ?? [],
      units: (result.units ?? []).map((u) => ({ name: u.name, spec: u.spec })),
    },
    repair: {
      scars: result.scars ?? [],
      converged: (result.scars ?? []).length === 0 && verified,
    },
    model: noModel ? null : (model ?? process.env.ER7_BUILD_MODEL ?? "qwen2.5-coder:1.5b"),
    noModel: noModel === true,
  };
}

export async function selftest() {
  await loadBuiltins();
  const before = generationKinds();
  const invalid = { kind: "selftest", readUnits() { return []; }, testUnits() { return { ok: true }; } };
  registerGenerationAdapter("selftest", invalid);
  const registered = generationAdapter("selftest") === invalid && generationKinds().includes("selftest");
  adapters.delete("selftest");
  const empty = await weave({ intent: "   ", artifact: "code" });
  const textReady = generationAdapter("text") === generationAdapter("prose");
  // noModel: a unit field and hunt cannot satisfy stops at the mouth stage as
  // `model-required`; the mouth (and so any model door) is never reached.
  const mouth = { calls: 0 };
  const noModelAdapter = {
    kind: "selftest-nomodel",
    readUnits: () => [{ name: "a", spec: "field-held" }, { name: "b", spec: "hunt-held" }, { name: "c", spec: "nobody-holds" }],
    autofill: (u) => (u.name === "a" ? { code: "alpha from the field", address: "field:a" } : null),
    hunt: async (u) => (u.name === "b" ? { code: "beta from the hunt", url: "hunt:b" } : null),
    mouthFragment: () => { mouth.calls += 1; return "never asked"; },
    snip: (v) => v,
    probeUnit: () => ({ ok: true, detail: "" }),
    testUnits: () => ({ ok: true, reason: "ok" }),
    toDocument: () => "<html></html>",
  };
  const quiet = console.log;
  console.log = () => {};
  let nm;
  try {
    nm = await weave({ intent: "no-model selftest", artifact: noModelAdapter, noModel: true, output: fs.mkdtempSync(path.join(os.tmpdir(), "weave-nomodel-")) });
  } finally { console.log = quiet; }
  const stages = (nm.evidence?.outcomes ?? []).map((o) => o.stage).join(",");
  const noModelOk = mouth.calls === 0 && nm.noModel === true && nm.model === null && stages === "field,hunt,model-required" && (nm.repair?.scars ?? []).some((x) => x.stage === "mouth");
  const ok = registered && textReady && empty.ok === false && empty.status === "gap" && generationKinds().join("|") === before.join("|") && noModelOk;
  if (!ok) throw new Error("unified generation API selftest failed" + (noModelOk ? "" : " (noModel: mouth calls=" + mouth.calls + ", stages=" + stages + ")"));
  return { ok: true, checks: 5 };
}

export default { weave, registerGenerationAdapter, generationAdapter, generationKinds };
