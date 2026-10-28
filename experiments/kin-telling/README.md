# G1-3 — the English composer for recorded kinship derivations

Cell G1-3 of the Fold pipeline (PIPELINE-LOG; the plan is claude-arch-11): **English prose composed from a recorded derivation by lawful composition,
the model off, every sentence addressed to Russian spans; any model-written sentence is a failure.**

## What the prose is, and is not

Each sentence is a list of typed segments: English **frame words from a closed set of 41** (`organs/kin-telling-frames.json`) inside one of 22 declared
skeletons, plus material **copied with an address**: a Russian span of the text (`ru#a-b`, UTF-8 bytes), an English kin term or name copied from a giver row
(Wiktionary kin lexicon; ParallelNames@1, chapters I to III), a giver id or standing copied from the record, the asker's own span (only in the "no being
written X" sentence), or a recomputed count. A sentence that states an absence or a count also carries the extent `ru#0-N`.

A typed gap is composed as information: the one missing fact and the giver that does not state it ("The text states no parent, child, sibling, or spouse of
«Анна Павловна». Kin words in the text with an unbound end: 35."). It is not a refusal and not "the person has no parent".

It is **annotation of a derivation, not translation, not paraphrase, and not fluent**. It does not make Russian sentences English; it says, in a fixed
frame, what the recorded derivation holds and quotes the Russian that is its witness. A fold fault is composed faithfully (a form list that contains «Пьер сел»;
a being shown by its genitive): lawful is not correct. "The text states no X" means no fact the extractor bound from the text states it.

## Files

| file | role |
|---|---|
| `organs/kin-telling.mjs` | the composer (pure; imports only `node:crypto`) |
| `organs/kin-telling-check.mjs` | the checker; **does not import the composer**; own skeleton table; re-derives each claim from the raw fold |
| `organs/kin-telling-frames.json` | the closed frame set |
| `organs/generation/adapters/kin-telling.mjs` | a weave adapter passed as an **object** (not a registered kind): `weave({artifact: adapter, noModel: true, context: {kin: {...}}})` settles each sentence at the field stage |
| `gym/kin-telling-run.mjs` | the runner: tripwires, plain arm, shuffled controls, mutation battery, bars, side-by-side print |
| `gym/kin-telling-mutants.mjs`, `gym/kin-telling-lib.mjs` | the checker's self-test and the loaders / synthetic growth fixture |
| `organs/kin-telling.test.mjs` | 20 tests (2 typed SKIPs without janus or the workspace's folds) |

Default behaviour is untouched: every new file is new; the only edits to existing files are the test list in `package.json`, a one-line sanction for the
tripwire probe in `gym/handmaidens/telemachus.mjs`, the KTL thread (spec and re-woven tapestry) and the GL-KT-01 entry. `generationKinds()` does not list `kin-telling`.

## Run

```
JANUS_HOME=<janus 9fe6d918> node gym/kin-telling-run.mjs --window dev     --janus <janus> --out <dir>
JANUS_HOME=<janus 9fe6d918> node gym/kin-telling-run.mjs --window heldout --janus <janus> --out <dir> --frames-sha <sha256 of organs/kin-telling-frames.json>
node --test organs/kin-telling.test.mjs
```
The windows are the workspace's `foldcode-answer` and `foldcode-answer-heldout` (paths in `gym/kin-telling-lib.mjs`, `--root` overrides).

## Pre-registration and results (this folder)

`PREREG-G1-3-COMPOSER.md` (+ `.sha256`), `AMENDMENT-1.md`, `ADDENDUM-1.md` (the final files' hashes, written before the held-out run), `ADDENDUM-2.md` (written after: the prior art borrowed, paralleled and declined; how a new claim kind is registered; the seam numbers, including that 12 count sentences per window are addressed only by the whole-text extent); `results/` holds the
reports and `side-by-side-{dev,heldout}.md` (the composed English beside the plain baseline's reply for all 24 questions, with each sentence's addresses).

| bar | development (chapters I to IV) | held-out (V to VIII, run once) |
|---|---|---|
| B0 no model (tripwire, static scan) | pass, 0 firings | pass, 0 firings |
| B1 every sentence addressed, 0 checker failures | pass: 75 sentences | pass: 55 sentences |
| B2 in-scope answerable questions composed | 8 of 8 (8 of 14 of all answerable) | 6 of 6 (6 of 12 of all answerable) |
| B3 typed gaps composed | 10 of 10 questions; 125 of 125 gaps; 120 of 120 cells | 12 of 12 questions; 120 of 120 gaps; 120 of 120 cells |
| B4 shuffled controls fail the checker | pass (S1 77 failures; S2 6 of 6) | **FAIL**: S1 passes; S2 had no kin fact in any paragraph to shuffle (the registration says that is not a pass) |
| B5 mutants killed | 395 of 395 | 291 of 291 |
| B6 determinism | pass | pass |
| B7 recall of expected items, composer vs plain | 31 of 32 vs 25 of 32 | 25 of 26 vs 21 of 26 |
| B8 claim invariant across skeleton variants | 24 of 24 | 24 of 24 |
| B9 weave `noModel`, field-settled | 18 of 18 | 18 of 18 |
| B10 synthetic growth (janus deriveKin answers) | 7 of 7 documents | (development only) |

The 6 speech questions of each window are not composed: the fold types no speech relation, so there is no derivation to compose from.

## Rounds 2 and 3 (later registrations on fresh chapters)

Round 1's `seamReport` check (Addendum 2) found that the count sentence was addressed only by the whole-text extent. Two further rounds, each pre-registered and hashed before its code and
before its window was built or read, scored on chapters nobody had used (the full Russian text was already on disk): `experiments/kin-telling-round2/` (chapters IX to XIV) and
`experiments/kin-telling-round3/` (chapters XV to XVIII).

| window | scored | result |
|---|---|---|
| held-out V to VIII (round 1) | once | every bar but B4 (no kin relation in any paragraph to shuffle) |
| IX to XIV (round 2) | once | R0, R4 to R9 pass; **R1, R2, R3, R10 FAIL**, all from one checker code: the lexicon spells «сестёр» with ё and a stress mark, the checker compared words as written (an orthography fault, not a missing giver row; first misdiagnosed, corrected in the log) |
| XV to XVIII (round 3) | once | R0 to R3, R5 to R10 pass (54 sentences, 0 checker failures, all addressed by an `ru` or `ask` segment, `seamReport` mouthShare 0); **R4 FAILS**: the window states no kin relation, so the shuffled-witness control had nothing to shuffle |

What changed: the count sentence lists the fold's unbound kin words, each a copied span with its own byte range (the extent no longer counts as an address); the shuffled controls also run over the
paragraphs of every stated kin fact; khora `seamReport` is the acceptance instrument; the checker folds Russian orthography on both sides. The round-3 code passes every bar on all three spent windows.
R4 needs a kin relation in the fold; the plain extractor binds both ends of 2 of 37, 1 of 58, 3 of 68 and 0 of 31 statements in the four windows (the kin binder, janus PR #32, failed its own precision bar and is not used).
