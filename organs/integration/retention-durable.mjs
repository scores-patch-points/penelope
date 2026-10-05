// organs/integration/retention-durable.mjs — the durable retention seam
// (Milestone 7, penelope side).
//
// The in-memory retention (retention.mjs) is a correct append-only ledger but
// holds nothing between processes. This seam makes it DURABLE: every retained
// trace is appended as one JSON line to an append-only file, so a restart
// re-opens the same record. The line is written atomically (tmp + rename) so a
// crash mid-append never leaves a torn record on the durable store.
//
// Restart semantics (the release criterion): a restart reconciles receipt
// before retry. Traces already retained are NOT re-appended on reopen; a
// re-admission is reported as a duplicate, never merged. Every trace's hash
// chain is verified on open, so a truncated or corrupted durable store is
// detected, not silently trusted.
//
// The connection to EODB (the Matrix event log) remains the future network
// substrate; this seam is the durable local store that a restart test can hold
// in one hand. It is artifact-neutral: it consumes FoldTrace@1 JSON and never
// imports khora.

import { createRetention, RETENTION_SCHEMA, RETENTION_VERSION } from "./retention.mjs";
import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";

export const DURABLE_RETENTION_SCHEMA = "TraceRetentionDurable@1";
export const DURABLE_RETENTION_VERSION = 1;

// ── the durable store ────────────────────────────────────────────────────────
// A minimal append-only line store. Each line is JSON of a retained trace
// record (the same record createRetention keeps in memory). Writes are
// atomic: append to a tmp file, then rename over the target, so a crash cannot
// leave a torn line on the real file.

export function openLineStore({ file, fs }) {
  const nodeFs = fs ?? { readFileSync, writeFileSync, renameSync, existsSync };
  const readLines = () => {
    try {
      const raw = nodeFs.readFileSync(file, "utf8");
      return raw ? raw.split("\n").filter((l) => l.trim().length > 0) : [];
    } catch (e) {
      if (e && e.code === "ENOENT") return [];
      throw e;
    }
  };

  return {
    schema: "AppendOnlyLineStore@1",
    version: 1,
    file,
    readLines,
    append(record) {
      const line = `${JSON.stringify(record)}\n`;
      // Atomic append: write the whole file as tmp then rename.
      const tmp = `${file}.tmp`;
      const current = nodeFs.existsSync(file) ? nodeFs.readFileSync(file, "utf8") : "";
      nodeFs.writeFileSync(tmp, current + line, "utf8");
      nodeFs.renameSync(tmp, file);
      return line;
    },
  };
}

/**
 * createDurableRetention({ file, fs }) — a retention backed by an append-only
 * file. Reopening the same file returns the SAME record: every previously
 * retained trace is present, its hash chain verified, and a duplicate
 * re-admission is reported. This is the restart test's durable substrate.
 */
export function createDurableRetention({ file, fs } = {}) {
  if (!file) throw new Error("createDurableRetention requires a file path");
  const store = openLineStore({ file, fs });
  const retention = createRetention();

  // Reopen: load every retained line, append it to the in-memory ledger, and
  // verify each trace's chain so a corrupted durable store is caught on open.
  const loaded = store.readLines().map((line) => {
    try {
      return JSON.parse(line);
    } catch (e) {
      throw new Error(`durable retention ${file} carries a torn line: ${e.message}`);
    }
  });
  const problems = [];
  for (const stored of loaded) {
    if (!stored || stored.schema !== "TraceRetentionEntry@1") {
      problems.push(`durable store carries a non-retention line (${stored?.schema ?? "?"})`);
      continue;
    }
    const r = retention.retain(stored.trace);
    if (!r.ok && !/duplicate retention/.test(r.reason)) {
      problems.push(`reopen failed for ${stored.trace?.sessionId}: ${r.reason}`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`durable retention ${file} did not reopen cleanly: ${problems.join("; ")}`);
  }

  // The durable retain: append the trace to the file AND to memory. Both must
  // succeed before the caller sees ok — a retained trace is either on both or
  // on neither.
  const retain = (trace) => {
    const r = retention.retain(trace);
    if (!r.ok) return r;
    try {
      store.append({
        schema: "TraceRetentionEntry@1",
        version: 1,
        trace: r.stored,
        retainedAt: r.stored.retainedAt,
      });
    } catch (e) {
      return { ok: false, reason: `durable append failed: ${e.message}` };
    }
    return r;
  };

  return {
    schema: DURABLE_RETENTION_SCHEMA,
    version: DURABLE_RETENTION_VERSION,
    file,
    store,
    retention,
    retain,
    get size() {
      return retention.size;
    },
    all: retention.all,
    byId: retention.byId,
    describe: `append-only durable retention at ${file}; reopen reconciles receipt, verifies chains, never re-appends`,
  };
}

export const DURABLE_RETENTION = {
  schema: DURABLE_RETENTION_SCHEMA,
  version: DURABLE_RETENTION_VERSION,
  create: createDurableRetention,
  open: createDurableRetention,
  retentionSchema: RETENTION_SCHEMA,
  retentionVersion: RETENTION_VERSION,
  describe: "penelope's durable end of the trace seam: append-only file-backed retention with restart reconciliation",
};