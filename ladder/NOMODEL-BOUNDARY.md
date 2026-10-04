# Where the no-model limit of Weave appears — Borodino, 2026-10-01

Question: with **zero model draws**, how far does `weave()` get on a grounded essay request before a
model is genuinely necessary — and which stage stops it first?

Machine record: `ladder/nomodel-borodino.json` (`NoModelBoundary@1`). Reproduce:

```
node gym/weave-nomodel.mjs --intent "Write a {words}-word essay about the Battle of Borodino." \
     --field <eoreader7>/native/eval/the-fold/fixtures/wikipedia-battle-of-borodino.html \
     --hunt shim|shipped|off [--topic "Battle of Borodino" --topic-pages 8] --out <dir>
node gym/nomodel-summary.mjs <dir>/report.json
```

Model-free is enforced three ways and measured: the engine's `noModel` path never calls `draw()`;
`draw()` throws under `noModel`; a fetch tripwire fails the run on any model door, and `gym/swatch.jsonl`
(where every real draw lands) must not grow. Result in all four conditions × five targets:
**model-door calls = 0, swatch growth = 0.** No substitute model, no cached prose.

## Conditions

| | field | hunt |
|---|---|---|
| A | 1 retained Wikipedia page (13,763 words) | shipped hunt code, search transport = shim |
| B | empty | shipped hunt code, search transport = shim |
| C | empty | shipped hunt, endpoint down (`localhost:8812`, as in this checkout) |
| D | 1 retained page | off |

The shim answers the hunt's own `{query} → {results:[{url,title}]}` contract from Wikipedia's search API;
the production endpoint (the-fold `explore-server`) cannot boot here (legacy eoreader submodule absent).
Page fetches are real. "c/v" = engine-claimed / verified (distinct text, adapter's own `probeUnit` passes,
not markup).

## Model-free Weave boundary (rows were byte-identical at every target — hash-checked)

| target | units | field c/v | hunt c/v | mouth-needed (engine) | unresolved | fold (shipped verification) | fold (given its own contract) |
|---|---|---|---|---|---|---|---|
| **A** 1k–12k | 12 | 12 / 0 | 0 / 0 | 0 | 12 | no — 24/24 refused `fold_invented_referent`, 0 admitted | no — 2 admitted, 22 `repeated_claim`, 10/12 beats gap |
| **B** 1k–12k | 12 | 0 / 0 | 4 / 0 | 8 | 12 | no — 1 residual (HTML markup), 5/5 beats gap | no — 12/12 beats gap |
| **C** 1k–12k | 12 | 0 / 0 | 0 / 0 | 12 | 12 | no — 0 text | no — 12/12 beats gap |
| **D** 1k–12k | 12 | 12 / 0 | 0 / 0 | 0 | 12 | same as A | same as A |

"mouth-needed (engine)" is what the engine recorded; A/D's 0 is the field's false hits (verified unit evidence says ≥ 7, below).

Materialized: A/D 312 words (12 copies of one 26-word pair — page chrome and a disambiguation hatnote);
B 52 words (4 copies of one HTML doctype preamble); C 0. Elapsed 9–42 ms warm; B's first row 15.8 s (real fetch).

## What stops it, in pipeline order

1. **READ — target-blind, scaffold-only, capacity below the smallest target.** `readUnits` returns the same
   12 units for every word count (`prose.mjs:38-45`; 1k and 12k artifacts hash-identical). 9 of 12 are
   shape-instrument cells (`essay:false`: "how many answers does the essay hold — DECLARED") that
   `document-ledger.js` says are never a reader-facing section; the adapter filters only on `relevant`.
   The 3 content cells ask scope/referent/extent, none asks what happened. Hard cap read off the adapter
   source: `autofill` cuts `{maxSnips: 2, maxChars: 220}` (`prose.mjs:54`) → 12 × 441 chars = 5,292 chars ≈
   **865 words** (6.12 chars/word, measured on the field's own snips) — below even the 1k target.
2. **FIELD — over-accepts, starves the hunt.** `autofill` is source-level: any source sharing ≥2 content
   words with a unit's spec is "a hit", and it returns that source's *first two qualifying sentences* — not
   ranked by the unit. All 12 units got the identical pair; the hunt was never consulted (0 network calls in A).
3. **HUNT — when reached, returns nothing usable.** Query is the unit's full meta-question; only `results[0]`
   is used; the body kept is `html.replace(/\s+/g," ").slice(0,400)` (`prose.mjs:73`) = the same
   `<!DOCTYPE html>…` preamble for every page (4 units, 3 different pages, **1** distinct text, 4/4 markup).
   0/3 pages pass the adapter's own `relevantSources` for the task (History of Europe, Paris Commune,
   Charles de Gaulle). A dead endpoint is indistinguishable from "searched, found nothing" (C: no scar).
4. **FOLD / VERIFY — shipped verification cannot accept a grounded, named sentence.** `testUnits` folds
   with `ground: ""` and the river-specific default beats (`prose.mjs:116-117`), so every sentence carrying a
   name is `fold_invented_referent` — 24/24, including verbatim lines of the retained page. Handed what its
   own header says it uses (whole retained ground, the void's cells as beats) the fold admits and dedupes
   correctly: refusals become `repeated_claim`, and over the page's whole snip supply it admits **179 of 188**.
   The fold is not the intrinsic limit; its wiring is.
5. **MOUTH.** Reached only when field and hunt both yield nothing: B 8/12, C 12/12 → `model-required`,
   left unresolved. In A the field's false hits mean the mouth is never reached.

## The three limits you asked about

- **Evidence limit** — present but *not first*. The retained page supplies **188 snips / 3,234 words, 179
  fold-admitted / 3,080 words** (45 snips carry citation/bibliography markers — reported, not subtracted).
  An 8-page topic-query probe (not the shipped hunt's query) sums to ≤ **9,143** fold-admitted words
  (upper bound: no cross-page dedupe, includes loosely related pages). So volume would bind between ~3k
  (core page) and ~9k, i.e. 4k+ targets — *if* structure scaled, which it does not. Per unit: with the
  adapter's lenient `probeUnit`, only **5 of 12** units have any sentence in the whole field that clears it
  (best coverage 15–38% vs a 30% bar); the hunted pages' own best for their units was 9–22%.
- **Folding/verification limit** — present at every target: shipped verdict can never be `ok` for a
  text that names anything. Not binding when the fold is given its ground.
- **Generation limit** — not isolated. ≥ **7 of 12** units (NUL·Ground 29%, INS·Pattern, SEG·Ground,
  SYN·Pattern, DEF·Ground, DEF·Figure, EVA·Figure) have no clearing evidence in the field or the hunted
  pages and would reach the mouth in any non-defective run; 5 of those 7 are declaration cells that no source
  holds by construction (whether a non-model declarative organ could answer them was not tested). For the
  5 units that clear, evidence suffices and the artifact is verbatim snips with no connective prose — whether
  that is a "coherent essay" cannot be judged mechanically here.

```
FIRST BOUNDARY:        READ → ARRANGE (structure), before any of the three limits.
FIRST UNSATISFIED UNIT NUL·Ground (field coverage 29% vs the adapter's 30% bar — borderline);
                       first clearly unsatisfiable: INS·Pattern (best 15%).
WHY                    12 target-blind units, 9 not reader-facing, capacity ≈ 865 words < 1k;
                       then field over-acceptance feeds all 12 the same 26-word pair and the hunt never runs.
MODEL-FREE CAPACITY    as shipped: 26 distinct words (page chrome), 0 verified, shipped verdict never ok.
                       ceilings if the defects were repaired: structure ≤ 865 w; evidence 3,080 w (core
                       page) … ≤ 9,143 w (8-page upper bound); ≥ 7/12 units still need a mouth.
```

## Provenance (`Provenance@2`) — audited, not trusted

Fixed (measured before/after): byte anchors were **one byte early for every contribution after the first**
(`offset = byteLength(join + "\n")`, should be `+2`): misaligned **11/12 → 0/12**; the verification source
was missing from the source table (snapshot taken before verify): dangling **1 → 0**. Round trip now exact:
12/12 ranges slice back to the contribution → event → unit source → corpus source.
Not fixed, reported: lineage edges `read→unit` (0/12), `contributions→fold`, `fold→verify`,
`verify→materialize` are absent; a contribution's source anchor is the page, never a sub-page span
(0/1); a contribution spanning two sources is addressed only to the first (`address: snips[0].url`,
verified on a constructed two-source case); `eot.corpus.snipped/hunted/drawn` read the Provenance@1 `refs`
field and were always empty (now derived from events); over `/api/weave` a JSON `context.shadow` cannot be a
`Map` and a plain object throws, so the field is unreachable through the door.

## Limits of this experiment

One topic, one retained page, one run per condition (rows are deterministic; targets differ only in a
constraint the structure ignores). The hunt transport is a shim. `probeUnit` is a weak, lenient proxy
(topic words alone can clear it), so "clears" counts are upper bounds. Ceilings are bounds, not shipped
behavior. No model ran, so the generation limit is a lower bound, not a measurement.
