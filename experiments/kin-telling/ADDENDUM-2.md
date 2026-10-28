# ADDENDUM 2 to PREREG-G1-3-COMPOSER.md — prior art, how a claim kind is registered, and the seam numbers (DOCUMENTATION ONLY)

Written 2026-10-28 by `g1-3-composer`, AFTER the held-out run. It changes no rule, bar, file or score; the code is byte-identical to Addendum 1 (commit 0a3c0fd).
It answers two relays from the coordinating session (claude-ring, at the user's word): name the prior art, and say how a new claim kind is registered.
Prereg sha256 36cecb11beaef6cd45cc1a0f73330b370bdcc7b3f8166f6e856366a024d0a77d; Addendum 1 4bb42d769803cfcb0ddf232055c5c612f61ac46ba4a2cdb52ee46852fa823ccb.

## 1. Prior art: what it was, what I read when, borrowed, paralleled, declined

**Read BEFORE building** (the brief's list): khora `prose-laws.js`, `composer.js`, `cube-telling.js` (headers and the lint), `claim-realize.js` (header), `output-holograph.js`; penelope
`generation-door.mjs`, `grounded-composition.mjs`, `generation/api.mjs`, `gym/weave-nomodel.mjs`; PIPELINE-LOG claude-arch-11, pathos-5/-6, hyperlexicon-optimization-16 to -19.
**Read AFTER the held-out** (so none of it shaped the sealed bars): `reading-rules-audit/history/h5-reasoning-and-prose.md` (sections 0, B2, B6, B7, B10) and `SYNTHESIS-streamlined-pipeline.md`; khora
`seam-ledger.js`. NOT read: khora-g0 `proof-check.js`, `telling-grammar.en.js`, `pathos-variants.js` (body), janus `reasoning-spiral.js`. The registration therefore does not cite h5 or the SYNTHESIS; this does.

| item | status | detail |
|---|---|---|
| segment contract (source / frame / value, laws as checks never rewrites, a closed frame set whose words are declared) | **borrowed** (concept, no code) from `prose-laws.js` / `composer.js` | mine: `f`, `ru`, `row`, `rec`, `ask`, `val`; law checks in the checker (first letter, full stop, balance), not khora's PL numbering; the closed set is a file with a hash |
| the tripwire over the model doors | **reused** `installTripwire` from `gym/weave-nomodel.mjs` | plus node http/https/net/child_process, shown firing on a probe |
| ParallelNames@1 as the gloss giver; the Wiktionary kin lexicon as the term giver | **used** | h5 and SYNTHESIS item 5 name the same giver shape |
| independent checker that imports nothing from the composer and re-derives from the record and the source bytes, with a mutation self-test | **paralleled, not borrowed** | built before I had read the khora-g0 `proof-check.js` pattern; same idea (it also found real bugs: the optional standing clause never parsed until a test used it; MISS claimed "no parent" where a rule head meant "no mother") |
| cadence: two or more lawful variants per construction, a search that only chooses | **paralleled, simpler** | two skeletons per kind and a first-lawful-with-a-different-opener rule; NOT `chooseVariants` (no flatline or variance measure); B8 shows the variants never change the parsed claims |
| CONSTRUCTIONS: proposition type, slots, segment list, grounds | **structure paralleled** | 12 claim kinds, 22 skeletons, kinship only; the as-of, co-presence, count and order constructions are NOT built |
| seam-ledger `seamReport` (mouthShare, addressedShare) | **not used in the sealed run; computed now, post hoc** | section 3 |
| reasoning-spiral record shape | **not used** | my record is the fold's facts and janus `deriveKin` cells; the rule row is the lexicon composite, re-applied by the checker, which is stronger than a non-empty license string |
| `holographType` | **not used** | my checker types a sentence by its skeleton and re-derives its claim; no English splitter or `sameAct` is needed |
| `claim-realize.js` paraphrase; `grounded-composition` / `generation-door` residue; the EOT round trip as a mouth; mouth-repair; decay or reinforcement | **declined** | refuted or decorative in h5 section 5; nothing of them is in the composer. The weave adapter uses the engine's field stage only, with `noModel: true`; no mouth stage is reachable |

**What the prior art decided** (SYNTHESIS item 5): composition = a few constructions + a Russian-English gloss giver + the derivation step as the ground; acceptance = mouthShare 0, every sentence addressed, no sentence the checker rejects.
The sealed bars B0/B1/B5 say the same in other words. Two places where the build differs from "the derivation step id as the ground": a sentence is tied to the derivation by the checker's re-derivation and by its
record paths (`fold:kin/facts/<i>/standing`, the witness byte span), not by a recorded step id in the sentence; that is a gap, named.

## 2. How a new claim kind is registered (the interface for a G2 verdict, e.g. "statements A and B disagree because rule R")

The composer's input is the derivation record; the checker re-derives every claim from the raw record and source bytes. A new kind is TWO TABLES AND ONE CASE, not a runtime registry (a registry would be a refactor; none is made here):
1. composer `organs/kin-telling.mjs`: a `SKELETONS` entry (two or more variants; its frame words must already be in `organs/kin-telling-frames.json`, a new word means amending that hashed file) and a claim builder `claim(kind, fill)` that fills slots with addressed segments: `ru` for each Russian span (BOTH statements' byte spans), `rec` for the rule row id and standing, `row` for any giver-row English word.
2. checker `organs/kin-telling-check.mjs`: its OWN `TABLE` entry (a second description of the skeleton; if the two disagree the sentence fails) and a `case` in `derive()` that re-derives the claim from the record: the rule must be a row of the rules giver, the premises and witnesses must be in the record, and the checker applies the rule itself.
3. self-test: M1, M2, M3, M8 and M9 are kind-agnostic; kind-specific mutants need the generator's own truth table (`gym/kin-telling-mutants.mjs`).
4. pre-register the kind's bars (and its shuffled control) before any score. A claim kind does not change the core assembly (`assemble`, `realize`, `checkDoc`).

## 3. Seam numbers (khora `seamReport`, read-only clone at 152cb07, post hoc; `results/seam-numbers.mjs`, `.txt`)

mouthShare **0.0% in every question of both windows**; contract ok everywhere. Typing my segments two ways (STRICT: only Russian text spans and the asker's span are "source"; WIDE: every addressed copied string is "source"):
development addressedShare strict 31.7%, wide 62.6% (seamDensity wide 37.4%); held-out strict 24.8%, wide 61.9% (38.1%); per question, strict 10% to 58% (it is lowest for typed-gap paragraphs, which are mostly frame).
**A finding that the sealed bar B1 hid:** 12 of 75 sentences (development) and 12 of 55 (held-out) have NO addressed source segment under seamReport. They are the count sentences ("Kin words in the text with an unbound end: 35."),
which my B1 counted as addressed because they carry the whole-text extent `ru#0-N` (registered rule R2). That is the trap the record warned of (PL13 passes any non-empty grounds): the extent is an address of a domain, not a copied span.
The fold already holds each unbound statement's own byte span (`kin.unbound[].byteSpan`); addressing the count sentence to those spans would close it. Not changed here: the code is frozen and the held-out is spent; a new registration on fresh data is the place.
The MISS, NONE and ABS sentences carry copied names (or the asker's span) beside the extent, so each has at least one addressed source segment.
