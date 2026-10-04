// organs/stigmergy.mjs — the pheromone trail (2026-10-01).
//
// Scaling a long work with a small mouth: the leafs run in parallel, and they
// coordinate by a PHEROMONE TRAIL — a compact signature per laid claim that
// indicates the whole (where the weave has been, its extent and direction)
// without carrying the whole. No agent knows the essay; each reads only the
// trail and lays one more thread. The trail is the stigmergic substrate: work
// leaves traces, and the next work is drawn against the traces, never against
// a shared anchor (the anchor induced the attractor loops) and never against a
// blank slate.
//
// PURE (node builtins). Selftest:
//   node --input-type=module -e "import('./organs/stigmergy.mjs').then(m=>m.selftest())"

export const STIG_SCHEMA = "Stigmergy@1";

const STOP = new Set(["the", "and", "that", "with", "this", "from", "have", "been", "which", "what", "there", "for", "in", "of", "to", "a", "an", "is", "are", "it", "as", "on", "at", "by", "its", "their", "not", "but"]);
export const scentOf = (s) => String(s).split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w.toLowerCase())).slice(0, 6).join(" ");

/** Lay a thread: append a compact signature to the trail (deduped by source+address). */
export function lay(trail, { sentence, src, abs }) {
  const key = src + "@" + abs;
  if (trail.some((t) => t.key === key)) return { ok: false, dup: true };
  trail.push({ key, scent: scentOf(sentence), src, abs });
  return { ok: true, trail };
}

/** Read the trail — the compact pheromone a draw sees (never the whole). */
export function read(trail, { max = 12 } = {}) {
  return trail.slice(-max).map((t) => `  ⁂ ${t.scent} · ${t.src}@${t.abs}`).join("\n");
}

/** Has a claim already been laid? (dedupe — two leafs never weave the same thread.) */
export const claimed = (trail, key) => trail.some((t) => t.key === key);

export function selftest() {
  const t = (n, c) => { if (!c) { console.error("FAIL", n); process.exitCode = 1; } else console.log("ok", n); };
  const trail = [];
  lay(trail, { sentence: "The waxen tablet of the memory which was once capable of receiving true thoughts", src: "republic", abs: 522168 });
  lay(trail, { sentence: "Persistent activity in the prefrontal cortex during working memory", src: "research", abs: 29638 });
  t("a laid thread leaves a compact pheromone", trail.length === 2 && trail[0].scent.includes("waxen") && trail[0].key === "republic@522168");
  t("a duplicate thread is refused", !lay(trail, { sentence: "another sentence", src: "republic", abs: 522168 }).ok);
  t("the read is compact — it indicates the whole without carrying it", read(trail).split("\n").length === 2 && read(trail).length < 200);
  t("claimed detects a laid thread", claimed(trail, "research@29638") && !claimed(trail, "republic@1"));
}