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

## Falsifier / next question

A graph-based parser or tagger-quality fix that lifts Sanskrit UAS toward ~80, OR a measured tagger error decomposition showing the tag errors cost the parse. If tagger UPOS on Sanskrit is the drag, fix the tagger first; if a graph parser closes the gap, the transition architecture was the cap.
