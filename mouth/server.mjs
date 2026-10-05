// mouth/server.mjs — the mouth as a server: the only door a draw enters.
//
// Every draw — penelope's own gym, eoreader7's native organs, and (next)
// the proxy doors — lands HERE first. The mouth applies its own admission
// (organs/mouth.mjs: ration per identity, typed 429/503 + Retry-After), picks
// the wire, then forwards to the BRIDGE (Heimdall's channel, 11434) which
// runs the AntiStrauss gate, the host picker and the upstream lanes. The
// mouth never draws itself; it decides and the bridge executes.
//
// Surfaces:
//   POST /v1/draw          — the mouth API (kind, model, prompt/messages)
//   POST /api/generate     — bridge wire (kind=probe, for native code draws)
//   POST /api/chat         — bridge wire (kind=chat)
//   POST /api/embed        — bridge wire (kind=embed, embeddings)
//   POST /v1/chat/completions, /v1/embeddings — wire aliases (default-deny body)
//   GET  /v1/mouth/status  — schema, house rules, lane availability
//   POST /api/weave        — THE GENERATION DOOR (2026-10-04): the fold's
//                            generate lane reaches penelope's generation here.
//                            The mouth decides draws; the weave orchestrates
//                            generation (read units → field/hunt → mouth →
//                            test → EOT). Both are penelope's — one server.
// Everything else: 404, never a silent pass.
//
// MOUNTABLE (2026-10-05): the request logic lives in createPenelopeHandlers(opts)
// — { name, handle(req,res)->Promise<boolean>, close() } — so the Fold can mount
// penelope in ONE process beside khora/janus/heimdall. handle() returns true iff
// it consumed the request and NEVER writes a 404 (the caller default-denies).
// Owned by default: /v1/draw, /v1/mouth/* (status, admit), /api/weave. The wire
// aliases (/api/chat, /api/generate, /api/embed*, /v1/chat/completions,
// /v1/embeddings) collide with heimdall's identical routes in a unified server,
// so they are opt-in (opts.wireRoutes); startMouth (standalone) turns them ON.
//
// Identity rides headers (x-er7-user / x-er7-caller), the house rule; a
// bridge-wire caller that sends none is admitted as "eoreader7-native" —
// one place in line, never anonymous.

import http from "node:http";
import { admit, route, modelForWire, MOUTH_SCHEMA, HOUSE, KIND_WIRE } from "../organs/mouth.mjs";
import { setMouthTransport } from "../organs/generation-door.mjs";

export const MOUTH_PORT = Number(process.env.PENELOPE_MOUTH_PORT ?? 11439);
const ID = { "x-er7-user": "penelope", "x-er7-caller": "penelope-mouth" };

const ROUTE_BY_PATH = {
  "/api/generate": "probe",
  "/api/chat": "chat",
  "/v1/chat/completions": "chat",
  "/api/embed": "embed",
  "/api/embeddings": "embed",
  "/v1/embeddings": "embed",
};

function json(res, status, obj, extra = {}) {
  res.writeHead(status, { "content-type": "application/json", "x-mouth": MOUTH_SCHEMA, ...extra });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Header-bag helpers: take a plain lowercase headers object, so the HTTP path
// (req.headers) and the in-process transport share one set of semantics.
const identityOf = (h) => String(h["x-er7-caller"] ?? h["x-er7-user"] ?? "eoreader7-native");
const hopOf = (h) => Number(h["x-heimdall-hop"] ?? 0);

const PASS_THROUGH_HEADERS = ["x-er7-user", "x-er7-caller", "x-er7-kind", "x-er7-priority", "x-heimdall-hop", "x-er7-session"];
function passHeaders(h) {
  const out = {};
  for (const k of PASS_THROUGH_HEADERS) if (h[k]) out[k] = h[k];
  return out;
}

/** The typed refusal shape — one place, so 429/503 never drifts between paths. */
const refusal = (admission) => ({
  status: admission.status,
  body: { error: admission.reason, retryAfterMs: admission.retryAfterMs },
  extra: { "retry-after": Math.ceil(admission.retryAfterMs / 1000) },
});

/** A thrown error becomes a typed JSON error for THAT request only. */
const errorResponse = (err) => ({ status: err?.status ?? 502, body: { error: err?.code ?? err?.message ?? "error" }, extra: {} });

function sendError(res, err) {
  if (res.headersSent) { try { res.end(); } catch { /* the caller left */ } return; }
  const r = errorResponse(err);
  json(res, r.status, r.body, r.extra);
}

/**
 * Build penelope's mountable handlers.
 *   opts.channel    bridge (Heimdall channel) base URL; default env ER7_CHANNEL_URL, else :11434
 *   opts.drawLog    the ration Map (identity -> [{ts,kind}]); default a fresh per-instance Map
 *   opts.wireRoutes claim the bridge-wire aliases (/api/chat, /api/generate, /api/embed*,
 *                   /v1/chat/completions, /v1/embeddings); default false (heimdall owns them in the Fold)
 *   opts.port       reported on /v1/mouth/status only (default MOUTH_PORT)
 *   opts.weave      weave(request) implementation for /api/weave (default organs/generation/api.mjs)
 *   opts.drawViaMouth  install this instance as the draw door's mouth transport (no self-HTTP hop);
 *                   restored on close(). Default false: the door POSTs to PENELOPE_MOUTH_URL.
 */
export function createPenelopeHandlers(opts = {}) {
  const channel = String(opts.channel ?? process.env.ER7_CHANNEL_URL ?? "http://127.0.0.1:11434").replace(/\/+$/, "");
  const drawLog = opts.drawLog ?? new Map();
  const wireRoutes = opts.wireRoutes === true;
  const port = opts.port ?? MOUTH_PORT;

  function logDraw(identity, kind) {
    const now = Date.now();
    const list = (drawLog.get(identity) ?? []).filter((d) => now - d.ts < HOUSE.windowMs);
    list.push({ ts: now, kind });
    drawLog.set(identity, list);
  }

  /** Forward one draw to the bridge with bounded backoff; a typed refusal on
   *  exhaustion — never a silent stop, never a wedge (the house rule).
   *  Identity/kind/hop headers ride through: the caller's x-er7-* and any
   *  x-heimdall-hop stay hers, so the box's fair-share round robin and the
   *  hop mark are never lost between the mouth and the bridge. */
  async function bridge(identity, { model, path, body, headers = {}, stream = false }) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), HOUSE.slaMs);
    try {
      const r = await fetch(`${channel}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", ...ID, "x-er7-priority": body.priority ?? "batch", ...headers },
        body: JSON.stringify(body.forward),
        signal: ac.signal,
      });
      if (r.status === 429 || r.status === 503) {
        const wait = Math.min(HOUSE.retryBackoffMaxMs, (Number(r.headers.get("retry-after")) || 20) * 1000);
        throw Object.assign(new Error(`bridge-refused (${r.status})`), { code: "ER7_BRIDGE_BUSY", status: r.status, retryAfterMs: wait });
      }
      if (!r.ok) throw Object.assign(new Error(`bridge-http-${r.status}`), { code: "ER7_BRIDGE_ERROR", status: r.status });
      if (stream) return { ok: true, stream: r.body, headers: r.headers };
      const j = await r.json();
      logDraw(identity, body.kind);
      return { ok: true, raw: j, text: j.response ?? j.message?.content ?? j.choices?.[0]?.message?.content ?? j.text ?? null, embed: j.embeddings ?? null, usage: j.prompt_eval_count ?? j.usage ?? null, model };
    } finally {
      clearTimeout(t);
    }
  }

  /** POST /v1/draw core: pure of http. Returns { status, body, extra }; may throw. */
  async function draw(headers, parsed) {
    const identity = identityOf(headers);
    const kind = String(parsed.kind ?? "chat");
    const requested = parsed.model ?? null;
    const rt = route(kind, requested);
    const admission = admit(identity, { log: drawLog.get(identity) ?? [], now: Date.now(), hop: hopOf(headers) });
    if (!admission.ok) return refusal(admission);
    const messages = Array.isArray(parsed.messages) && parsed.messages.length ? parsed.messages : [{ role: "user", content: String(parsed.prompt ?? "") }];
    const model = modelForWire(rt.wire, requested);
    // The generate wire takes a prompt; the chat wire takes messages — never
    // the one for the other.
    const forward = rt.wire === "/api/generate"
      ? { model, prompt: String(parsed.prompt ?? messages.map((m) => m.content ?? "").join("\n")), stream: false, options: { temperature: 0, ...(parsed.num_predict ? { num_predict: parsed.num_predict } : {}) } }
      : rt.kind === "embed"
        ? { model, input: parsed.input ?? parsed.prompt, stream: false }
        : { model, messages, stream: false, options: { temperature: 0, ...(parsed.num_predict ? { num_predict: parsed.num_predict } : {}) } };
    const priority = parsed.interactive ? "interactive" : rt.interactive ? "interactive" : "batch";
    const out = await bridge(identity, { kind: rt.kind, model, path: rt.wire, body: { forward, priority }, headers: passHeaders(headers) });
    if (!out.ok) return { status: out.status ?? 502, body: { error: out.error, retryAfterMs: out.retryAfterMs }, extra: {} };
    return { status: 200, body: { model, kind: rt.kind, text: out.text, ...(rt.kind === "embed" ? { embeddings: out.embed } : {}), usage: out.usage, mouth: MOUTH_SCHEMA, bridge: "eoreader7 channel" }, extra: {} };
  }

  /** Non-streaming wire core (admit + route + bridge). Returns { status, body, extra }; may throw. */
  async function wireOnce(headers, path, parsed) {
    const identity = identityOf(headers);
    const rt = route(ROUTE_BY_PATH[path], parsed.model ?? null);
    const admission = admit(identity, { log: drawLog.get(identity) ?? [], now: Date.now(), hop: hopOf(headers) });
    if (!admission.ok) return refusal(admission);
    const model = modelForWire(path, parsed.model ?? null);
    const forward = { ...parsed, model, stream: false };
    if (rt.wire === "/api/generate" && forward.options) forward.options = { temperature: 0, ...forward.options };
    const out = await bridge(identity, { kind: rt.kind, model, path, body: { forward, priority: rt.interactive ? "interactive" : "batch" }, headers: passHeaders(headers) });
    if (!out.ok) return { status: out.status ?? 502, body: { error: out.error, retryAfterMs: out.retryAfterMs }, extra: {} };
    // A wire route is a DROP-IN for the channel: the bridge's own payload goes
    // back verbatim (ollama shape on /api/*, openai shape on /v1/*), so a
    // caller that pointed at the channel needs no parsing change — only its
    // base URL points at the mouth. The mouth's admission already ran.
    return { status: 200, body: out.raw, extra: {} };
  }

  async function handleWireStream(req, res, path, parsed) {
    const headers = req.headers;
    const identity = identityOf(headers);
    const rt = route(ROUTE_BY_PATH[path], parsed.model ?? null);
    const admission = admit(identity, { log: drawLog.get(identity) ?? [], now: Date.now(), hop: hopOf(headers) });
    if (!admission.ok) { const r = refusal(admission); return json(res, r.status, r.body, r.extra); }
    const model = modelForWire(path, parsed.model ?? null);
    const forward = { ...parsed, model, stream: true };
    const out = await bridge(identity, { kind: rt.kind, model, path, body: { forward, priority: "interactive" }, headers: passHeaders(headers), stream: true });
    if (!out.ok) return json(res, out.status ?? 502, { error: out.error, retryAfterMs: out.retryAfterMs });
    res.writeHead(200, { "content-type": out.headers?.get("content-type") || "application/x-ndjson", "cache-control": "no-cache", connection: "keep-alive" });
    const reader = out.stream.getReader();
    const pump = async () => {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        logDraw(identity, rt.kind);
      } catch (e) { res.write(`data: ${JSON.stringify({ err: String(e.message ?? e) })}\n\n`); }
      res.end();
    };
    pump().catch(() => { try { res.end(); } catch { /* the caller left */ } });
  }

  async function parseJson(req, res) {
    let raw;
    try { raw = await readBody(req); } catch { json(res, 400, { error: "bad request" }); return null; }
    try { return JSON.parse(raw.toString() || "{}"); } catch { json(res, 400, { error: "bad json" }); return null; }
  }

  // Is this request ours? Pure of side effects: handle() must not touch res otherwise.
  function owns(method, path) {
    if (method === "GET") return path === "/v1/mouth/status";
    if (method !== "POST") return false;
    if (path === "/v1/mouth/admit" || path === "/api/weave" || path === "/v1/draw") return true;
    return wireRoutes && Boolean(ROUTE_BY_PATH[path]);
  }

  async function handle(req, res) {
    const path = (req.url ?? "/").split("?")[0];
    if (!owns(req.method, path)) return false;
    try {
      if (req.method === "GET") {
        json(res, 200, { schema: MOUTH_SCHEMA, port, bridge: channel, house: HOUSE, lanes: Object.keys(KIND_WIRE) });
        return true;
      }
      if (path === "/v1/mouth/admit") {
        // The verdict only — no draw. The bridge's own doors (Heimdall's
        // admission) call this before they draw, so every draw the engine
        // runs is hers before it is the bridge's. The draw itself stays on
        // the bridge (the machinery never forks).
        const identity = identityOf(req.headers);
        const admission = admit(identity, { log: drawLog.get(identity) ?? [], now: Date.now(), hop: hopOf(req.headers) });
        if (!admission.ok) { const r = refusal(admission); json(res, r.status, r.body, r.extra); return true; }
        json(res, 200, { ok: true, mouth: MOUTH_SCHEMA });
        return true;
      }
      // THE GENERATION DOOR: penelope's weave() over HTTP — the fold surfaces'
      // generate lane. The mouth's admission does not gate an ORCHESTRATION
      // (the weave owns its own retries and draws through the door below);
      // the weave's internal draws each enter the mouth as usual.
      if (path === "/api/weave") {
        const j = await parseJson(req, res);
        if (j === null) return true;
        const weave = opts.weave ?? (await import("../organs/generation/api.mjs")).weave;
        const result = await Promise.resolve(weave({
          intent: j.intent,
          artifact: j.artifact,
          constraints: j.constraints,
          context: j.context,
          verification: j.verification,
          model: j.model,
          noModel: j.noModel === true,
          output: j.output ?? null,
        })).catch((e) => ({ schema: "Weaving@1", ok: false, status: "error", error: String(e?.message ?? e).slice(0, 500) }));
        json(res, result.ok ? 200 : 422, result);
        return true;
      }
      const parsed = await parseJson(req, res);
      if (parsed === null) return true;
      if (path === "/v1/draw") {
        const r = await draw(req.headers, parsed);
        json(res, r.status, r.body, r.extra);
        return true;
      }
      if (parsed.stream) { await handleWireStream(req, res, path, parsed); return true; }
      const r = await wireOnce(req.headers, path, parsed);
      json(res, r.status, r.body, r.extra);
      return true;
    } catch (err) {
      sendError(res, err);
      return true;
    }
  }

  /** The in-process draw transport: the draw door's `fetch(`${MOUTH}/api/generate`)`
   *  without the self-HTTP hop. Same admission, route and bridge as the HTTP wire
   *  route (wireOnce), answered as a fetch-style Response so the door's loop is
   *  byte-for-byte the same code path. Works whether or not wireRoutes is on. */
  async function transport({ path = "/api/generate", headers = {}, body = {} } = {}) {
    const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)]));
    let r;
    try {
      if (!ROUTE_BY_PATH[path]) r = { status: 404, body: { error: `unknown mouth route ${path} — default-deny` }, extra: {} };
      else r = await wireOnce(h, path, body && typeof body === "object" ? body : {});
    } catch (err) { r = errorResponse(err); }
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { "content-type": "application/json", "x-mouth": MOUTH_SCHEMA, ...r.extra } });
  }

  let restore = null;
  if (opts.drawViaMouth === true) restore = setMouthTransport(transport);

  return {
    name: "penelope",
    channel,
    handle,
    transport,
    drawLog,
    async close() { if (restore) { restore(); restore = null; } },
  };
}

export function startMouth({ port = MOUTH_PORT, ...opts } = {}) {
  const penelope = createPenelopeHandlers({ ...opts, port, wireRoutes: true });
  const server = http.createServer(async (req, res) => {
    if (await penelope.handle(req, res)) return;
    const path = (req.url ?? "/").split("?")[0];
    json(res, 404, { error: req.method !== "POST" ? "default-deny" : `unknown mouth route ${path} — default-deny` });
  });
  server.on("close", () => { penelope.close(); });
  server.listen(port, () => console.log(`mouth: ${MOUTH_SCHEMA} on :${port}, bridge=${penelope.channel}`));
  return server;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) startMouth();
