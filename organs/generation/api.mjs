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

// The built-in kinds load LAZILY, one kind at a time, so a missing sibling
// (khora/janus, organs/kernel-reach.mjs) breaks only the kind that needs it and
// breaks it TYPED. Before this, one eager loadBuiltins() imported code-fix, which
// imports janus, so a standalone checkout threw for every artifact kind.
const BUILTIN = {
  // Loads the sibling reader only when this medium is requested.
  overview: async () => ({
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
  }),
  code: async () => (await import("./adapters/code.mjs")).default,
  "code-fix": async () => (await import("./adapters/code-fix.mjs")).default,
  text: async () => (await import("./adapters/prose.mjs")).default,
};
// "prose" remains an internal compatibility alias; the public artifact kind is text.
const ALIAS = { prose: "text" };

export function generationAdapter(kind) {
  const k = String(kind ?? "");
  return adapters.get(ALIAS[k] ?? k) ?? null;
}

/** Every kind a caller may name: the registered ones plus the lazily loadable
 *  built-ins (naming a built-in does not load it). */
export function generationKinds() {
  return [...new Set([...adapters.keys(), ...Object.keys(BUILTIN), ...Object.keys(ALIAS)])].sort();
}

/** Load ONE built-in kind (idempotent). A kind whose sibling is absent rejects
 *  with the kernel's typed KernelAbsentError ({code: "janus-absent"|...}); the
 *  other kinds are unaffected. Unknown kinds resolve null. */
export async function loadBuiltin(kind) {
  const name = ALIAS[String(kind ?? "")] ?? String(kind ?? "");
  if (adapters.has(name)) return adapters.get(name);
  if (!Object.hasOwn(BUILTIN, name)) return null;
  const adapter = await BUILTIN[name]();
  if (!adapters.has(name)) registerGenerationAdapter(name, adapter);
  return adapters.get(name);
}

// A caller-visible typed refusal for a kind whose sibling is not there.
const absentGap = (kind, e, task) => ({
  schema: "Weaving@1", ok: false, status: "gap", intent: task,
  error: String(e.message), code: e.code, looked: e.looked, artifactKind: kind,
  availableArtifacts: generationKinds(),
});

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
    let composeCodePipeline;
    try { ({ composeCodePipeline } = await import("../code-pipeline.mjs")); } catch (e) {
      if (e?.name === "KernelAbsentError") return absentGap("code-agent", e, task);
      throw e;
    }
    const r = await composeCodePipeline({ intent: task, model: noModel === true ? null : model, constraints, verification, context, output, noModel: noModel === true }).catch((e) => ({
      schema: "CodePipeline@1", ok: false, status: e?.code === "model-refused" ? "gap" : "error", ...(e?.code ? { code: e.code } : {}), error: String(e?.message ?? e).slice(0, 500), intent: task,
    }));
    return r;
  }

  const kind = typeof artifact === "string" ? artifact : artifact?.kind;
  if (typeof artifact !== "object" || !artifact?.readUnits) {
    try { await loadBuiltin(kind); } catch (e) {
      if (e?.name === "KernelAbsentError") return absentGap(kind, e, task);
      throw e;
    }
  }
  const adapter = typeof artifact === "object" && artifact?.readUnits ? artifact : generationAdapter(ALIAS[kind] ?? kind);
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

  // A sibling that is absent AT DEPTH (an adapter importing its organ lazily
  // mid-read) is the same typed refusal as one absent at load: a gap that names
  // the path, never a thrown module-not-found.
  let result;
  try {
    result = await arrange({
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
  } catch (e) {
    if (e?.name === "KernelAbsentError") return absentGap(kind ?? adapter.kind, e, task);
    // A model was required and noModel forbids it: the typed refusal, not a throw.
    if (e?.code === "model-refused") return { schema: "Weaving@1", ok: false, status: "gap", intent: task, error: String(e.message), code: "model-refused", artifactKind: kind ?? adapter.kind, noModel: true, model: null };
    throw e;
  }

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
  // Each built-in loads on its own. A kind whose sibling is absent is reported
  // typed (`absent`), never thrown: the selftest of a standalone checkout passes
  // for the kinds that stand alone and NAMES the ones that cannot.
  const absent = {};
  for (const kind of Object.keys(BUILTIN)) {
    try { await loadBuiltin(kind); } catch (e) {
      if (e?.name !== "KernelAbsentError") throw e;
      absent[kind] = e.code;
    }
  }
  const before = generationKinds();
  const invalid = { kind: "selftest", readUnits() { return []; }, testUnits() { return { ok: true }; } };
  registerGenerationAdapter("selftest", invalid);
  const registered = generationAdapter("selftest") === invalid && generationKinds().includes("selftest");
  adapters.delete("selftest");
  const empty = await weave({ intent: "   ", artifact: "code" });
  const textReady = !!generationAdapter("text") && generationAdapter("text") === generationAdapter("prose");
  // A kind whose sibling is absent refuses typed through weave(), never throws.
  for (const kind of Object.keys(absent)) {
    const r = await weave({ intent: "absent-kind selftest", artifact: kind, noModel: true });
    if (!(r.ok === false && r.status === "gap" && r.code === absent[kind])) throw new Error(`absent kind ${kind} did not refuse typed (${r.code ?? "no code"}, status ${r.status})`);
  }
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
  return { ok: true, checks: 5, absent };
}

export default { weave, registerGenerationAdapter, generationAdapter, generationKinds };
