# Generation organs — every form of generation, under Penelope

**Pulled in, not forked from scratch.** Portable modules are copied with
provenance (source commit below); coupled modules are referenced, never
copied — copying them would fork their kernel dependencies and rot.

## Resident (copied, dependency-free)

| organ | from | commit | why portable |
|---|---|---|---|
| `generation/engine.mjs` | `ai-code-harness/pipeline/engine.mjs` | 229b686 (diverged 2026-10-01, GL-RR-05) | node builtins only (the arrangement: read → spiral field/hunt/mouth → test → product → EOT). DIVERGED: draw() routes the mouth at PENELOPE_MOUTH_URL when set (identity + kind + bounded 429 defer); unset it is the ai-code-harness twin, byte-compatible |
| `generation/adapters/code.mjs` | `ai-code-harness/pipeline/adapters/code.mjs` | 229b686 | imports only ../engine.mjs + optional /tmp/crispr (try/catch) |
| `generation/adapters/prose.mjs` | `ai-code-harness/pipeline/adapters/prose.mjs` | 229b686 | imports only node:module + ../engine.mjs |
| `consensus-gate.mjs` | born here (quake/launch harvests) | penelope 44ca2f2 | no imports |
| `detail-fetch.mjs` | born here (R9–R10) | penelope founding | no imports |
| `behavior-check.mjs` | born here (R11) | penelope founding | no imports |
| `freshness.mjs` | born here (R12) | penelope founding | no imports |
| `window.mjs` | born here (council weave) | penelope 2026-10-01 | no imports — next-N dated records + countdown, any dated feed |
| `agenda-shape.mjs` | born here (council weave) | penelope 2026-10-01 | no imports — ordered action lists, own sequence, declared actions |
| `html-snip.mjs` | born here (GL-RS-01) | penelope 2026-10-01 | no imports — tag-aware, byte-addressed HTML fragment snip (GL-EN-09 for markup) |
| `resolver.mjs` | born here (GL-RS-01) | penelope 2026-10-01 | no imports — the closed 27-cell taxonomy: every task routed or a named void |
| `mouth.mjs` | born here (2026-10-01, the mouth is with Penelope) | penelope 2026-10-01 | no imports — the decision layer every draw enters: admission (ration per identity, typed 429/503 + Retry-After), kind→wire routing, priority; `route`/`admit`/`modelForWire`, 14 selftests |
| `mouth/server.mjs` | born here (2026-10-01) | penelope 2026-10-01 | imports only node:http + ../organs/mouth.mjs — the mouth as a server: `/v1/draw`, `/v1/mouth/admit`, and the bridge wires (`/api/generate`, `/api/chat`, `/api/embed`, `/v1/chat/completions`) that are drop-in for the channel; admits, then forwards to the bridge (Heimdall's channel 11434) — the machinery is never forked |
| `cube.mjs` | copy of `eoreader7/native/kernel/cube.js` + THE-27-CELLS.md | cube.js 6a11c1d (2026-09-17) | no imports; the coordinate system the tapestry is woven on (selftest 15 checks) |

## Referenced (coupled — read at source, do not copy)

| organ | home | commit | coupling (why not copied) |
|---|---|---|---|
| `code-build.js` (mechanical fan-out build) | `eoreader7/native/organs/code-build.js` | 14dc2c5 | imports eoreader7 `postprocess.mjs` validators |
| `talk-build.js` + `talk-reader.js` + `talk-reason.js` (conversation builds) | `eoreader7/native/organs/` | main | kernel `notes.js`, English parser, claim-acts |
| `belief-page.js` + `page/prose/music-medium.js` (renderers) | `eoreader7/native/adapters/build/` | main | fold types, license table, MIDI stack |
| `widget-build.mjs` (one-prompt widget driver) | `ai-code-harness/widget-build.mjs` | d080841 | imports `code-build.js` above |
| `look.js` (image→structure, mechanical + vision) | `eoreader7/native/organs/look.js` | main | OpenCV/Tesseract env + vision ladder + AntiStrauss gate |

## The mouth (2026-10-01)

Every referenced organ above, and every engine draw, enters through
`organs/mouth.mjs` + `mouth/server.mjs` (resident, above). `code-build.js`,
`look.js`, `corpus-resonance.js`/`prior-query.js` used to call ollama or
the daemon directly; they now address the mouth at
`eoreader7/native/kernel/mouth.js` (MOUTH_URL/MOUTH_IDENTITY) — her
admission, her wire, then the bridge executes. The bridge is never forked.

## Falsifying control

A generation task Penelope cannot route — to a resident organ, a
referenced organ, or an honest named gap — fails loudly at intake. If a
referenced organ's home moves, this file's commit pins go stale and the
stale pin itself is the finding (re-resolve, don't guess).

## Situated overview medium (2026-10-02)

`generation/overview.mjs` is a browser-portable materializer referencing the
canonical `eoreader7/native/organs/overview.js` byte/replay contract. The native
`generation/adapters/overview.mjs` adds ethos, logos and pathos at intake and
runs through `generation/api.mjs`; the public adapter is loaded lazily so code
builds still work in standalone Penelope checkouts. The browser module is
vendored unchanged by Holodeck. An export or source mutation accepted as verified
falsifies this medium (`gym/overview.test.mjs`).
