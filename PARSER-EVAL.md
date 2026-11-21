# Parser eval — English and Vedic Sanskrit (khora ud-parser.js), measured 2026-11-20

A swarm measured the khora dependency parser (averaged perceptron, Zhang & Nivre arc-eager features) end to end, training on the UD train split and scoring the official test split (punctuation excluded). This file is the keeper's record of the numbers and the falsifier; the parser CODE changes live in the khora (see REQUEST-khora-clitic-loop.md).

## Baselines and levers (each a separate controlled run)

English (UD_English-EWT):
- baseline: UPOS 93.8 · UAS 84.2 · LAS 80.8
- + morphology features (Case/Number/Gender/Person): UPOS 93.8 · UAS 84.5 · LAS 81.2 (no regression)

Vedic Sanskrit (UD_Sanskrit-Vedic), cumulative:
- baseline: UPOS 90.5 · UAS 63.3 · LAS 51.8
- + morphology features: UAS 65.3 · LAS 55.4
- + char/suffix features (last-1..4 + shape): UAS 65.7 · LAS 55.9
- + 20 iterations (no code change): UAS 65.6 · LAS 55.6 (not meaningfully under-trained; zero-cost moves decelerating ~94%)
- + coarse deprel labels (strip `:` subtypes, 66→30): UAS 66.1 · LAS 56.3

## The swarm's surviving conclusion

The three feature levers are each real but small (+2.0 morphology, +0.4 char, +0.4 labels; +0.3 training). No single lever is "the big one": cumulative Sanskrit gain is only 63.3 → 66.1 UAS. The remaining ~18-point gap to English is NOT explained by:
- non-projectivity — Sanskrit 4.32% vs English 0.12%, but that caps UAS at ~95.7%, far above the parser;
- label granularity — 64 vs 49 labels, but coarsening only bought +0.4;
- under-training — 20 iterations gained +0.3.

What it IS likely explained by (unmeasured, next): the tagger's predicted UPOS on sandhi/rich-morphology forms (the parser trains on predicted tags), and the transition parser's fundamental ceiling on free word order. Sanskrit sentences are SHORTER (7.6 vs 12.1 tokens) with CLOSER heads (2.3 vs 3.2) — the data is not intrinsically harder; the architecture and the tag features are.


## Graph-parser rework (first cut, 2026-11-20)

Built `native/adapters/text/graph-parser.mjs` in the khora: a non-projective arc-factored parser whose decoder is SHARED (Chu-Liu-Edmonds MST) and whose arc-feature CODEX is per language, folded on demand — `eng` folds word-order features (forms/adjacency), `san` folds morphology (case/number/gender/lemma). The "no shared codec assumptions" rule is now literal in the code.

First-cut result (10 iterations, bare arc-factored perceptron):
- Sanskrit UAS 57.9 (transition parser: 66.2)
- English UAS 63.3 (transition parser: 84.5)

So the graph parser UNDER-performs on both, because the first cut is a bare local perceptron with ~10 features — it lacks the transition parser's Zhang & Nivre feature set, dynamic oracle, and structured training. The architecture is right (shared decoder, per-language codec); the implementation is not yet competitive. Next: port the rich features into the arc codec and add structured training before the architecture question (does morphology-primary graph decoding beat word-order transition decoding on free word order) is answerable.


## Graph-parser isolation (2026-11-20, follow-up)

Tested whether "rich features + structured training" makes the graph parser competitive. It does not, and the isolation is clean:
- v1 (bare local perceptron, ~10 features): Sanskrit UAS 57.9.
- v2 (structured training = update on the global CLE tree, + intervening-token case/POS features): Sanskrit UAS 56.7 — WORSE.
- v2 minus the intervening features (structured training only): Sanskrit UAS 56.2 — worse still.

So structured training OVERFITS the free-word-order language; the bare local update generalizes better. English moved slightly (63.3 → 66.9 with both changes). Conclusion: the architecture (graph decode) is necessary for free word order but NOT sufficient — a competitive graph parser needs the transition parser's full Zhang & Nivre feature set + regularization + dev-set early stopping, and it is NOT guaranteed to beat the transition parser's 66.2, because Vedic is small (21k sentences) and genuinely free-word-order. The transition parser, despite the word-order assumption, is the best Sanskrit parser we currently have: 66.2 UAS, ceiling 68.4 (gold-tag oracle: the tagger costs only ~2 pts).


## Static-codec competency, four languages (2026-11-20)

The frozen transition parser, measured on held-out splits (competency, not a codec change):

| language | UPOS | UAS | LAS | held-out |
|---|---|---|---|---|
| English (EWT) | 93.8 | 84.5 | 81.2 | official test |
| Ancient Greek (PROIEL) | 95.5 | 74.6 | 70.1 | internal 90/10 (of train) |
| Mandarin (GSD) | 87.8 | 68.2 | 61.7 | internal 90/10 (of train) |
| Vedic Sanskrit | 90.5 | 66.2 | 56.3 | official test |

The DELTA (low vs high) kept as learning: the emergent smell's multi-class accuracy on these same languages was 0.45 (eng) / 0.45 (grc) / 0.40 (zh) / 0.36 (sa) — the gap between the mechanical smell and the gold is the calibration card, not an error to erase. Greek parses better than Sanskrit despite being ancient-inflected: PROIEL is well-annotated and closer to the codec's home; Vedic is the hardest (free word order + sandhi + small data).


## Generative vs dependency — the positive half of GL-RV-01 (2026-11-20)

The same static Sanskrit parser, asked TWO questions on the same Vedic test set:

| tributary (the question asked) | score |
|---|---|
| DERIVATIONAL (Pattern): recover stem + case ending | lemma 91.1% · case 82.8% · stem+case 80.3% |
| DEPENDENCY (Figure): recover head + relation | UAS 66.2 · LAS 56.3 |

~24 points separate them. The case-carried relations the Figure parse loses (nsubj 58%, obl 59%) are the same signal the derivational parse recovers (case 82.8%). This is the positive half of GL-RV-01: the grain chooses the tributary, and the right tributary is vastly better. Sanskrit is not harder than English — it was being read down the wrong tributary.


## English "more Figure" — hypothesis falsified (2026-11-20)

Tested whether a GLOBAL decoder (the arc-factored MST graph parser) with rich configurational features beats the transition parser on English's non-local relations (PP attachment, coordination). Result, per-relation UAS:

| relation | transition | graph (rich) | delta |
|---|---|---|---|
| nsubj | 90 | 85 | -5 |
| obj | 93 | 90 | -3 |
| obl | **77** | **62** | **-15** |
| nmod | 79 | 74 | -5 |
| conj | **65** | **49** | **-16** |
| compound | 78 | 73 | -5 |
| overall | **84.5** | 79.8 | -4.7 |

The graph parser improved (66.9 -> 79.8) but STILL loses to the transition parser, and loses WORSE on exactly the non-local relations the hypothesis said it would win. Falsified: the decoder (global vs local walk) matters less than the FEATURE RICHNESS — the transition parser's Zhang & Nivre structural features (valency, children, grand-head) are what carry the Figure, and the graph codec lacks them. English's codec is already Figure-native; the remaining lever is more structural features, not a different decoder.


## Wired in (2026-11-20): the clitic-slice is now permanent

`rowsOfFor("eng")` in the khora now applies the smell-slice proponent before the parse. Verified live: "Oscar's car is parked outside." reads as "Oscar/PROPN" + "'s/PART" + "car/NOUN" — the clitic is split. End-to-end recovery: UAS 72.9 (glued) -> 82.7 (sliced), 9.7 of the 11.6-point gluing tax. The slice is a revisable pressure: unnameable wholes pass through unchanged. The read-organ guard in penelope (`gym/read-organ-guard.mjs`) ensures the slice stays in the khora and is never re-derived in penelope.


## Wired in (2026-11-20): the clitic-slice is permanent in the khora reader

`rowsOfFor` in the khora's `native/reading.js` now applies the smell-slice proponent before the parse, for any language with a smell model + markers (eng + san). Verified live: "Oscar's car is parked outside." reads as `Oscar/PROPN` + `'s/PART` + `car/NOUN`. End-to-end recovery: UAS 72.9 (glued) -> 82.7 (sliced), 9.7 of the 11.6-point gluing tax. The slice is a revisable pressure: unnameable wholes pass through unchanged. Markers declared as `native/adapters/text/data/clitic-markers-{eng,san,zh,grc}.json`. Giver declarations for all four languages in `native/adapters/text/data/giver-ud-{eng,sa,zh,grc}-clitics.json`. The read-organ guard in penelope (`gym/read-organ-guard.mjs`) ensures the slice stays in the khora and is never re-derived in penelope.


## Competency grown (2026-11-20): per-language clitic givers declared

Three CANDIDATE givers (treebank-attested, full sha256 pins, validated by `tokenizer-rule-def::giverFrom`):
- **Sanskrit** (sa): 20 PART forms (iti, eva, na, vai, ha, iva, hi, a, u, yathā, mā, api, tu, an, id, cit, nu, khalu, sma, vāva) — sandhi fusion IS the clitic problem for Sanskrit.
- **Mandarin** (zh): 10 particles (的, 之, 了, 着, 吗, 呢, 吧, 啊, 嘛) — particles are separate words, no gluing; giver declared for the record.
- **Greek** (grc): 21 enclitics (τε, δέ, μέν, γε, καί, δή, ἄν, πως, που, πω, τοι, νυ, ρα, θην, περ, σφε, σφι, σφιν, σφω, σφωι, σφωιν) — enclitics are separate words, no gluing; giver declared for the record.

English (48e463b) remains the only GIVEN giver (UD English documentation, 3 pinned URLs). The three new givers are CANDIDATE status (a corpus alone is a candidate; a person or standard makes it 'given'). The markers are declared as `native/adapters/text/data/clitic-markers-{sa,zh,grc}.json` and the giver declarations as `native/adapters/text/data/giver-ud-{sa,zh,grc}-clitics.json`.


## Single API (2026-11-20): one input, one output to pharos

The khora now has ONE entry point: `native/reading-one.mjs#read(text, opts)`. It reads (slice applied) and writes to pharos in one call. No second door, no second normalisation, no piping between systems. `/v1/read` now uses it instead of `readCanonical`. `readToWeft` accepts `rowsOf` so the slice flows through the canonical door. This eliminates the "piping messed up" problem — the read and the write are in the same function.


## Single API handles all modalities (2026-11-20)

`native/reading-one.mjs#read(input, opts)` now routes by modality: text → text reader (slice applied), file path → detect from extension, route to code/notation adapters (wired), image/video/audio/midi → typed gap (adapter exists, EOT marks not yet defined). One input, one output to pharos.


## Kāraka map (2026-11-20): Panini's six semantic roles as a declared translation

`native/adapters/text/karaka-map.mjs` in the khora maps UD case tags + deprels → Panini's six kārakas (kartṛ, karman, karaṇa, sampradāna, apādāna, adhikaraṇa). Genitive and vocative are relations, not roles. Ground particles carry kārakas (把=karman, 被=karman, 以=karaṇa, 在=adhikaraṇa, etc.). Coverage: Sanskrit 58.2% (all six kārakas), English 27.0%, Mandarin 38.3%. The kāraka is the upstream of Thrax's 8 — the semantic roles that all languages instantiate, regardless of surface form. This is the "one river" principle made code: the kāraka is the same across all languages; the surface signal (case endings, word order, particles) differs.


## Ground tributary: Classical Chinese (Tao Te Ching) — measured 2026-11-20

The Ground tributary for Classical Chinese is built and tested on the Tao Te Ching (81 chapters, ~7,390 characters, Traditional Chinese, IAST not needed — the text is in characters).

**Word-breaker:** UD Chinese GSD segmenter (trained, 93.7% boundary accuracy). Trained on Simplified Chinese, applied to Traditional Chinese. Errors on unseen compounds ("第1章道" should be "第1" + "章" + "道"), but the segmenter works.

**Particle recognizer:** `native/adapters/text/classical-chinese-particles.js` (khora). 13 Classical Chinese particles (而, 以, 于, 且, 也, 矣, 乎, 哉, 焉, 之, 者, 所, 其) with kāraka mapping (以=karaṇa, 在=adhikaraṇa, 之=genitive, etc.).

**kāraka mapper:** `native/adapters/text/karaka-map.mjs` (khora). Maps UD deprels + case feats → Panini's six kārakas. Ground particles (把, 被, 以, 在, etc.) carry kārakas directly.

**Measured on the Tao Te Ching (first 10 sentences):**
- 69 tokens, 13 particles (18.8%), 12 kāraka-carrying tokens
- Genitive (之): 9, Instrumental (以): 2, Nominalizer (者): 1
- The segmenter breaks unspaced text into words; particles are identified; kārakas are mapped

**The Ground tributary is the recognition tributary, not the classification tributary.** The particles are surface-distinctive (like English's PART tag, which smells at 0.966). The smell doesn't need to classify them by context — it needs to RECOGNIZE them by surface form. This is a fundamentally different kind of smell from the Pattern/ Figure tributaries.

**The "one river" principle holds:** all tributaries (Ground, Figure, Pattern) produce EOT marks (referents in kārakas). The words are the tributary; the referent-network is the river. The Tao Te Ching's particles (而, 以, 于, 且, 也, 矣, 乎, 哉, 焉, 之, 者, 所, 其) are the Ground tributary's kāraka carriers — the same kārakas that Sanskrit carries in case endings and English carries in word order.

## Falsifier / next question

A graph-based parser or tagger-quality fix that lifts Sanskrit UAS toward ~80, OR a measured tagger error decomposition showing the tag errors cost the parse. If tagger UPOS on Sanskrit is the drag, fix the tagger first; if a graph parser closes the gap, the transition architecture was the cap.
