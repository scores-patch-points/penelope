# PREREG — the 27-cell cube: is the grain alone sufficient, or do terrain and stance add information? (written 2026-11-20 BEFORE the run)

Owner's direction (2026-11-20): "see if there's something between 1 and 2 and what parallelization there is rather than serialization... more we haven't discovered." Reading: the cube (khora's cube.mjs, native/docs/THE-27-CELLS.md) has 3 grains (Ground/Figure/Pattern) × 3 terrains (Existence/Structure/Interpretation) × 3 stances (Differentiate/Relate/Generate) = 27 cells. The smell and the kāraka have been reading only one cell (Figure/Structure/Relate). This experiment tests whether the other 26 cells carry information the reader is missing.

Data: `en_ewt-ud-test.conllu` (UniversalDependencies/UD_English-EWT, commit 491be069, sha256 first 16 ebd876f586758249, ~1.9 MB, CC BY-SA 4.0). REUSED (the per-relation LAS and the parser eval read it; the GRAIN question is new). 21,998 in-scope tokens.

Method (declared, fixed before the run):
- For each held-out token, compute three axes from its UD row + sentence position:
  - **Grain**: Ground (upos in {NOUN, PROPN, NUM, X} — bare units), Figure (upos in {VERB, AUX, PRON, DET, ADP, ADV, INTJ, PART} — links), Pattern (upos in {NOUN, PROPN} with case feats, or any upos with VerbForm=Part — folds). Simplified: Ground = content words that are units; Figure = function words and verbs; Pattern = inflected forms.
  - **Terrain**: Existence (the token is a leaf — no dependents, no head of dependents), Structure (the token has dependents or is a dependent), Interpretation (the token's deprel is a semantic role: nsubj, obj, iobj, obl, nmod).
  - **Stance**: Differentiate (the token's deprel marks it as distinct: amod, det, nummod, appos), Relate (the token binds: nsubj, obj, obl, nmod, case), Generate (the token produces: root, conj, parataxis, compound).
- The smell is the emergent per-class smell (GL-SM-01, pinned model emergent-smell-eng.json, sha256 9c22cff32fe90b31). For each token, the smell nominates a class (the cluster's dominant UPOS). The gold is the token's actual UPOS.
- For each of the 27 cells, compute: n (tokens), smell accuracy (smell class == gold class), and the smell's "no voice" rate (fraction of tokens whose form is unnameable).

Claims:
- **C1 grain alone is sufficient.** The smell accuracy at the grain level (3 cells) does not differ significantly from the full 27-cell level. Falsified: any cell with accuracy more than 0.1 below the grain-level mean — that cell needs terrain/stance to be read correctly.
- **C2 terrain adds information.** At least one terrain within a grain has accuracy differing by more than 0.1 from the grain mean. Falsified: all terrains within each grain have accuracy within 0.1 of the grain mean.
- **C3 stance adds information.** At least one stance within a terrain has accuracy differing by more than 0.1 from the terrain mean. Falsified: all stances within each terrain have accuracy within 0.1 of the terrain mean.
- **C4 the no-voice rate varies by cell.** The fraction of unnameable tokens differs across cells by more than 0.1. Falsified: uniform no-voice rate.

Seed 20261120. Nothing here changes after the run except in an ERRATUM section below.
