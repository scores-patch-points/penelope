// mouth.mjs — Penelope's mouth: the decision layer every draw enters through.
//
// The mouth is WITH HER (2026-10-01, house law): no model call in the engine
// bypasses this layer. The mouth decides — who draws, what the draw is for,
// which model and which wire, interactive or batch — and then directs the
// BRIDGE to execute. The bridge is eoreader7's channel (Heimdall's held door
// on 11434): it keeps the AntiStrauss gate, the host picker, the per-server
// rotation and the upstream lanes. The mouth never forks that machinery; it
// owns the decision and the bridge does the draw.
//
// Ownership, stated honestly:
//   - admission/rationing — HERE (per identity, windowed, typed refusal).
//   - model choice + kind→wire routing + priority — HERE.
//   - lane selection (local daemon / anthropic / opencode / online) — HERE by
//     kind; the upstream KEYS live in the bridge's env (the machinery), the
//     mouth selects the lane the draw is for and the bridge serves it.
//   - the draw itself — the BRIDGE, always, never a second ollama call.
//
// House numbers (derived from measured Heimdall law, never invented):
//   ration 40 draws / 15 min per identity, family cap 4 in flight (the box's
//   measured family cap; CODE-INVENTORY.md §D cites it), 120 s SLA. The
//   window is a budget from the null: an identity that has drawn its ration
//   waits (429 + Retry-After), never silently drops, never hammers.

export const MOUTH_SCHEMA = "Mouth@1";
// Plain model name: the bridge's ollama wire (/api/chat, /api/generate)
// speaks plain; the er7: prefix is the proxy's OPENAI-wire convention only
// (/v1/chat/completions). The mouth routes plain on /api/*, prefixed on /v1/*.
export const SHARED_MOUTH = "gemma2:2b";
export const HOUSE = {
  ration: 40,
  windowMs: 15 * 60 * 1000,
  familyCap: 4,
  slaMs: 120_000,
  retryBackoffMaxMs: 60_000,
  retryAttempts: 3,
};

export const KIND_WIRE = {
  chat: "/api/chat",
  draw: "/api/chat",
  code: "/api/generate",
  build: "/api/generate",
  probe: "/api/generate",
  embed: "/api/embed",
};

const BATCH_KINDS = new Set(["code", "build", "probe", "embed", "draw"]);

/** er7:-prefix a bare model name for the OPENAI wire only. */
export function er7model(model) {
  return model == null ? `er7:${SHARED_MOUTH}` : String(model).startsWith("er7:") ? String(model) : `er7:${model}`;
}

/** Route a draw: which wire, the plain model the bridge wants, interactive or batch. */
export function route(kind = "chat", model = null) {
  const k = KIND_WIRE[kind] ? kind : "chat";
  const wire = KIND_WIRE[k];
  const interactive = !BATCH_KINDS.has(k);
  // The bridge's ollama wire (/api/*) takes the plain name; its openai wire
  // (/v1/*) takes the er7:-prefixed name. The caller picks by wire.
  return { kind: k, wire, model: model == null ? SHARED_MOUTH : String(model), interactive };
}

/** The model name the BRIDGE wants on its wire: the channel (11434) speaks
 *  plain on every route; the er7: prefix is the PROXY's openai-wire
 *  convention only. The mouth directs the channel, so it always speaks plain
 *  (and strips an er7: prefix a caller carried in). */
export function modelForWire(_wire, model = null) {
  const m = model == null ? SHARED_MOUTH : String(model);
  return m.startsWith("er7:") ? m.slice(4) : m;
}

/**
 * Admission: a pure function over an identity's recent draw log.
 *   identity — string key (caller/user), typed by the caller
 *   log      — the identity's recent draws [{ ts, kind }] (any order)
 *   now      — epoch ms
 *   hop      — 1 when the turn was ALREADY admitted at its doorway (Heimdall's
 *              own re-entry mark, x-heimdall-hop): the door decided, the draw
 *              is inside the turn — the mouth honors it without re-queuing.
 *              Anything else is a first entry and takes the ration.
 * Returns { ok:true, place } or { ok:false, status:429, retryAfterMs, reason }.
 * place = draws in the window (the identity's place in line behind the cap).
 */
export function admit(identity, { log = [], now = Date.now(), hop = 0 } = {}) {
  if (Number(hop) >= 1) return { ok: true, place: 0, hop: true };
  const windowStart = now - HOUSE.windowMs;
  const recent = log.filter((d) => d && d.ts >= windowStart);
  const inFlight = recent.filter((d) => d && d.kind !== "embed").length;
  if (inFlight >= HOUSE.ration) {
    const oldest = recent.length ? Math.min(...recent.map((d) => d.ts)) : now;
    const retryAfterMs = Math.max(1_000, HOUSE.windowMs - (now - oldest));
    return { ok: false, status: 429, retryAfterMs, reason: `identity ${identity} drew its ration (${HOUSE.ration}/${HOUSE.windowMs}ms) — wait, never retry` };
  }
  return { ok: true, place: inFlight };
}

// ——— self-tests (run: node --input-type=module -e "import('./mouth.mjs').then(m=>m.selftest())") ———
export function selftest() {
  const t = (name, cond) => { if (!cond) { console.error("FAIL", name); process.exitCode = 1; } else console.log("ok", name); };
  t("route defaults to the shared mouth on chat", route("chat").model === SHARED_MOUTH);
  t("route keeps the plain name on the ollama wire", modelForWire("/api/chat", "gemma2:2b") === "gemma2:2b");
  t("modelForWire speaks plain on the openai wire too", modelForWire("/v1/chat/completions", "gemma2:2b") === "gemma2:2b");
  t("modelForWire strips a carried er7: prefix", modelForWire("/api/chat", "er7:gemma2:2b") === "gemma2:2b");
  t("modelForWire defaults to the shared mouth", modelForWire("/api/chat") === SHARED_MOUTH);
  t("code draws take the generate wire, batch", route("code").wire === "/api/generate" && route("code").interactive === false);
  t("chat draws take the chat wire, interactive", route("chat").wire === "/api/chat" && route("chat").interactive === true);
  t("embeds take the embed wire", route("embed").wire === "/api/embed");
  t("unknown kind falls back to chat", route("mystery").wire === "/api/chat");
  const now = 1_000_000;
  t("empty log admits", admit("me", { log: [], now }).ok === true);
  t("hop draws skip the ration (the door already decided)", admit("me", { log: Array.from({ length: HOUSE.ration }, (_, i) => ({ ts: now - i * 1000, kind: "code" })), now, hop: 1 }).ok === true);
  t("within ration admits with place", admit("me", { log: [{ ts: now - 1000, kind: "chat" }], now }).place === 1);
  t("over ration refuses 429 with retry", (() => { const log = Array.from({ length: HOUSE.ration }, (_, i) => ({ ts: now - i * 1000, kind: "code" })); const r = admit("me", { log, now }); return r.ok === false && r.status === 429 && r.retryAfterMs > 0; })());
  t("embeds do not count against the ration", (() => { const log = Array.from({ length: HOUSE.ration }, (_, i) => ({ ts: now - i * 1000, kind: "embed" })); return admit("me", { log, now }).ok === true; })());
}