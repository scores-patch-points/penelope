# SYSTEM OWNERSHIP MAP — how the repos work now, how they should, and the migration

## The three bodies (fixed)

| body | repo | role | the ONE thing it owns |
|---|---|---|---|
| **the khora** | `eoreader7` | the perceiver · ground-producer | **every organ, adapter, kernel module** — the source of truth |
| **penelope** | `penelope` | the keeper · record · mouth · judgment | **the generation spine** + the ledger; imports the khora, never re-derives |
| **the fold (surface)** | `the-fold` (holodeck) | the reading/research surface | **the browser page + its port**; runs the khora's organs in the tab |

## NOW — how it actually fits (and where we reinvent)

```
        eoreader7 (the khora)                        the-fold (surface)
 ┌─────────────────────────────┐          ┌──────────────────────────────────┐
 │ kernel/  cube, for-whom,     │          │ index.html (the app)             │
 │          eot-rich/realize,   │          │ holodeck-ask.js (the pipeline)   │
 │          gfp-claim, dmd      │          │ holodeck-reader.js ← PORT        │
 │ adapters/ english-parser,    │          │   (own STANCE_CLASS inline —      │
 │          relations-*,        │          │    reinvention #1)               │
 │          copula-claims       │          │ holodeck-summary.js              │
 │ organs/  stance.js ────────┐ │          │   (own STANCE_POS/NEG inline —   │
 │ the-fold/ referents,       │ │          │    reinvention #2)               │
 │          resolutions,       │ │          │ holodeck-lang.js (the back leg) │
 │          field-of-record    │ │          │ vendor/eoreader7 (1.6M) ←        │
 └─────────────┬───────────────┘ │          │   HAND-VENDORED COPY —          │
               │ ER7_HOME         │          │   re-copied per organ, drift    │
 ┌─────────────▼───────────────┐ │          │   by hand (reinvention #3)      │
 │ penelope (the keeper)        │ │          │ gfp-relations-composed.js       │
 │ generation/engine.mjs        │ │          │   (2nd copy — reinvention #4)   │
 │ adapters/prose.mjs           │─┘          └──────────────────────────────────┘
 │   computeSettles (the box)   │
 │   inUniverse (DMD gate)      │      eval/ + gym/ (measurement):
 │ mouth.mjs, GLAUCA-EOT.md     │      gfp-composed-falsify, box-vs-model,
 └─────────────────────────────┘      falsify-* — EXPERIMENTS that re-derive
                                       production organs (reinvention #5)
```

**The four named reinventions this session alone:**
1. stance defined 4× (khora organ, holodeck-reader inline, holodeck-summary inline, vendor copy).
2. composed reader 2× (khora + the-fold vendor).
3. the 1.6M vendor port hand-copied per organ (we vendored it by hand 3×).
4. the realizer eval (`native/eval/eot-realize.mjs`) re-derived the kernel realizer after a reset.
5. a standalone node:http chat was begun when the surface IS the holodeck.

## SHOULD — one owner per capability, nothing re-derived

```
   eoreader7 (the khora)  =  the ONLY place an organ/adapter/kernel module is defined
        │
        ├── penelope imports it via ER7_HOME (never a copy)
        │        generation spine: read → box-settle → hunt → mouth → test → seal
        │        organs that are PENELOPE's: mouth, engine, adapter seams, the ledger
        │
        └── the-fold imports via vendor/eoreader7, refreshed by ONE script
                 browser port (holodeck-reader.js) = the ONLY browser-specific code
                 the page (index.html + holodeck-ask.js) = the ONLY UI
        │
   live_priors  =  the received corpus, read as registers (never edited here)
```

## Guidelines — what goes where (the rule that kills the reinvention)

**A capability is defined exactly once, in the khora.** Before writing a function, grep the khora for it; if it exists, import it (penelope) or vendor it (the fold).

| if it is… | it belongs in… | rule |
|---|---|---|
| an organ (pure, tested, schema-tagged) | `eoreader7/native/organs/` | define ONCE; penelope/fold import, never re-write |
| a kernel module (cube, eot, gfp, dmd, for-whom) | `eoreader7/native/kernel/` | the khora's core; the other two read it |
| a language grammar (parser, relations, stance) | `eoreader7/native/adapters/text/` | the adapter owns the language; nothing else hardcodes English |
| a generation spine / mouth / ledger | `penelope/organs/generation/`, `organs/mouth.mjs` | penelope's own; delegates to the khora for reading |
| a browser page / port | `the-fold/` (index.html, holodeck-*.js) | the fold's own; the port imports the khora via vendor |
| an experiment / measurement | `*/eval/`, `penelope/gym/`, `the-fold/falsify-*.mjs` | **measurement, never ownership**; a result that works moves INTO the khora |
| a received corpus/prior | `live_priors/`, `eoreader7/native/priors/` | data, never logic; named giver on every prior |

**The one standing rule:** *an eval is a measurement, not an implementation. When an experiment holds, its real organ moves into the khora; the eval keeps only the numbers and the falsifier.*

## Migration — the order (do it together, kill the reinventions)

1. **Stance consolidation** — delete the inline STANCE_CLASS/STANCE_POS in `holodeck-reader.js` and `holodeck-summary.js`; import `organs/stance.js` (via vendor). One definition, the khora's.
2. **The vendor refresh script** — `the-fold/tools/vendor-er7.mjs`: copies the khora's `organs/adapters/kernel/the-fold/priors` into `the-fold/vendor/eoreader7`, deterministically, so the port is never hand-vendored again (the composed reader, for-whom, dmd all landed by hand this session).
3. **One composed reader** — keep `adapters/text/gfp-relations-composed.js` in the khora; penelope imports it (ER7_HOME), the fold vendors it (script). No second copy in the fold.
4. **Eval → khora** — the realizer already lives in `kernel/eot-realize.js`; the eval only measures it. The DMD universe (`inUniverse`) lives in penelope's prose adapter (it's a generation gate); `falsify-dmd-universe.mjs` stays as the instrument.
5. **Re-run all falsifiers after each move** — the fold's 20/20, penelope's box-vs-model, the khora's round-trip; a migration that changes a number is not done.

## The one law (unchanged)

> **The world folds at a point — an identity. Every assertion has a for-whom and is bounded by DMD saliency.** Grounded iff it sits inside the material's own coherent modes above its shuffled null, it found the material, and it makes a difference to the question. Measured, never assumed; refused rather than guessed.