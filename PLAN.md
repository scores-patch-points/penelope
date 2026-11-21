# The Plan: how the khora reads, what equivalence means, and how it grows

## One sentence
The khora reads anything into one river (EOT marks); equivalence is two things producing the same marks; the system grows by measuring the deltas between tributaries, never by rewriting the codecs.

---

## 1. The river (one destination, many tributaries)

Every codec — text, image, video, audio, code, math, notation — folds its material into the **same EOT mark stream**. No thing gets its own river. What differs is the **tributary**: the transformation the material needs to reach the river, folded on demand, never borrowed from the nearest language.

- Text: tokens → POS → case → dependency → EOT marks (referents in roles)
- Image: pixels → regions → concepts → EOT marks
- Video: frames → motion → objects → EOT marks
- Audio: samples → features → events → EOT marks
- Code: tokens → structure → relations → EOT marks
- Math: notation → objects → relations → EOT marks

The single API: `read(input, opts)` — one input, one output to pharos. Text is wired (with slice). Other modalities route through their adapters. The pharos is the river.

## 2. The grain (which tributary)

Every thing has a **grain** — the way its meaning rides:

- **Ground** (Void, hub, 0): isolating, meaning in bare units. Mandarin.
- **Figure** (Beings, spokes, n): configurational, meaning in arrangement and relations. English.
- **Pattern** (Fold, rim, 1): generative, meaning in the inflectional/derivational fold. Sanskrit, Greek, Latin.

A thing may mix grains; each grain takes a different tributary into the same river. Thrax's eight parts of speech is ITSELF a Pattern-language grammar (Greek is inflected; the participle is the Pattern fold) — so it is a tributary, never the river.

The grain is determined FIRST, before any POS lens is applied. The smell (emergent classes) identifies the grain; the POS (Thrax/UD) is a secondary fold.

## 3. The read (the spine)

Every read follows the same spine, regardless of modality:

```
read → settle → fill → snip → probe → test → seal
```

- **read**: the raw material enters. For text: the tokenizer produces tokens.
- **settle**: the smell (per-token class pressure). Low = possibility (the smell nominates).
- **fill**: the frames (relations between neighbour classes). The genitive frame, the kāraka frame.
- **snip**: the proponent proposes cuts (clitic-slice, sandhi-split). Only where the smell can name the host but not the glued whole.
- **probe**: the evidence ledger (calibration cards, posterior, harm = veto).
- **test**: the house ratchet + handmaidens. Every red line is an id.
- **seal**: the EOT marks are written to pharos.

The mechanical layers NOMINATE (possibility). The gate/gold/falsifier SELECTS (probability). The model is the mouth, not the voice.

## 4. The codec (static, folded on demand)

Codecs are STATIC — never rewritten to chase a number. They are superseded by pointer only when a measured falsifier demands it. Each codec is FOLDED ON DEMAND for the thing being read:

- English (Figure): word-order codec (transition parser, 84.5 UAS)
- Sanskrit (Pattern): derivational codec (stem + case, 80.3%)
- Mandarin (Ground): bare-unit codec (particles, units)
- Greek (Pattern): derivational codec (case endings)

The codec's job is to carry the thing's grain into the river. A Figure codec carries arrangement. A Pattern codec carries derivation. A Ground codec carries bare units.

## 5. The river (EOT marks)

EOT marks are the one store. Every codec empties here. No thing gets its own river.

An EOT mark is a **referent in a role** (a kāraka: kartṛ, karman, karaṇa, sampradāna, apādāna, adhikaraṇa). The referent is not a point — it is the **entire universe** of its connections (synonyms, associations, related concepts), bounded only by DMDs (a connection that doesn't change anything is filtered, not recorded).

The DMD gate is the falsifier: if adding a connection doesn't change the referent's behavior (its activation, its role, its EOT mark), the connection is filtered. The network grows only where it makes a difference.

## 6. Equivalence (the question the whole system answers)

**Two paraphrases sharing no words have no meaningful difference iff their EOT marks align** — same referents, same kārakas, same case. The words don't matter; the words are just the tributary. The meaning is the river.

The equivalence is established at the EOT level, not the surface level. The reader extracts referents in roles; the EOT marks carry them. Two texts with the same EOT marks are equivalent, even if they share no words.

The measurement: the ZERO stratum (no shared word) scores 0.000 for surface matching. But the EOT-level signal is there — it's just hard to extract when there's no lexical bridge. The smell/slice/parser work improves the reader's ability to extract EOT marks. The kāraka system (Panini) is the upstream: semantic roles that all languages instantiate.

## 7. The delta (the learning)

Where two tributaries read the same material, the delta between their EOT marks is the learning. Recorded, never erased. A tributary that lands far from the gold is a poor path for that thing. The ledger keeps the measurement.

The calibration cards (EvidenceLedger) carry the delta: tpr, fpr, likelihood ratio, 95% bootstrap interval. The posterior from `combine()` is the next input to the diagnose step.

## 8. The loop (recursive self-improvement)

```
measure → hunt → re-train → re-pin → ship → measure again
```

1. **Diagnose**: read the ledger's calibration cards. The weakest layer is the one whose LR interval includes 1, or whose class has "no voice."
2. **Hunt**: the fix is more planted truth, never more model. Fetch a held-out treebank or fold a new codec on demand.
3. **Re-train + re-pin**: re-train the pinned model, write with a new sha256. The old model is superseded by pointer.
4. **Re-measure once**: a fresh/held-out set is read ONCE; a second scoring is REUSED.
5. **Ship only what beats the falsifier**: `ledger-check` + `house-ratchet`. A change that doesn't clear its null is refused.

The loop is recursive because each iteration's measurement names the next weak point. The fuel is new held-out data. The gate is the falsifier. The human boundary: giver declarations and new data fetches.

## 9. The governing rules

1. **Static codecs, competency only.** Codecs are frozen — never rewritten to chase a number. Competency (cards, givers, pinned models, held-out results) grows. This kills the re-derivation loop.
2. **Low sets possibility, high sets probability.** The mechanical layer (smell, codec) NOMINATES candidates. The gate/gold/falsifier SELECTS which survive.
3. **Higher judgments re-evaluate lower readings.** A better-informed judgment changes what an earlier reading meant — as a NEW row, never an edit. The delta is the learning.
4. **Keep the delta as learning.** The disagreement between lower and higher is recorded, not erased. A corrected reading is "the lower said X, the higher says Y, and the X→Y delta is a measured fact."
5. **One input, one output to pharos.** The single `read` API reads and writes to pharos. No second door, no second normalisation.
6. **No system writes to itself or another repo.** Cross-repo changes are typed request-notes, not direct edits.
7. **Read organs live in the khora.** Penelope imports them, never re-derives. The read-organ guard (`gym/read-organ-guard.mjs`) enforces this as a failing gate.
8. **The DMD gate bounds everything.** A connection that doesn't make a difference is filtered. The network grows only where it makes a difference.

## 10. The honest state (2026-11-20)

| system | status |
|---|---|
| Single read API (text → EOT marks → pharos) | Wired and verified |
| Clitic-slice (English) | Wired, 9.7 UAS points recovered |
| Per-language givers (sa, zh, grc) | Declared (CANDIDATE status) |
| Smell models (4 languages, pinned) | Frozen in khora |
| Parser (4 languages) | Measured: eng 84.5, grc 74.6, zh 68.2, sa 66.2 UAS |
| Graph parser (architecture) | Built, falsified at first cut (57.9) |
| Generative parse (Sanskrit) | Measured: 80.3% vs 66.2% dependency |
| Grain typology (GL-RV-01) | Recorded, tested (per-relation LAS confirms) |
| Self-improvement loop | Designed, not running (needs API account) |
| Equivalence (zero-overlap) | Theory sound, measurement weak (0.000 name, 0.010 chain) |

The answer to "do two paraphrases sharing no words have no meaningful difference" is: **yes, if their EOT marks align — same referents, same kārakas, same case. The words are the tributary; the referent-network is the river.** The theory is sound. The machinery for establishing that alignment at zero lexical overlap is still weak. The kāraka system (Panini) is the upstream that makes it possible.


## 11. Ground-heavy languages: the open frontier

The plan's three grains (Ground/Figure/Pattern) are not equally explored. Figure (English) and Pattern (Sanskrit, Greek) have been measured; Ground (Mandarin) has only been touched (smell: 10/16 tags hold, 0.433 multi-class accuracy, but the parser was never built for it). The Ground grain may need a fundamentally different codec, and the current pipeline's Figure-first assumptions (tokenize by whitespace, POS-tag by form, parse by adjacency) may fail on it the way they fail on Sanskrit — but for different reasons.

What "Ground" means for reading:
- **No inflection.** No case endings, no conjugation. Meaning is carried by word order and particles, not by morphological endings.
- **No spaces.** Chinese, Thai, Lao, Khmer, Burmese — the word boundary is not written. The tokenizer must find it (dictionary-based or model-based word breaker), not split on whitespace.
- **Particles as the grammar.** 的 (possessive/attributive), 了 (perfective), 着 (progressive), 吗 (interrogative), 呢 (topical) — these are the grammatical relations, carried by standalone particles, not by case endings or word order alone.
- **The "clitic" problem is different.** Mandarin particles are separate words, not fused suffixes. The clitic-slice proponent (which splits glued forms) does not fire on Mandarin. The slice needs a different mechanism: sandhi-decomposition for Sanskrit, word-breaking for Mandarin.
- **The kāraka system maps differently.** In Pattern languages, kārakas are carried by case endings (vibhakti). In Ground languages, they are carried by particles (的 marks genitive, 把 marks accusative, 被 marks passive). The KARAKA_MAP from UD to kārakas still holds, but the surface signal is different.

The open questions for Ground languages:
1. Does the parser need a word-breaker before it can read? (Yes — the khora's own docs note "a Cyrillic or CJK corpus must fold to its words and not to nothing.")
2. Does the smell work on character-level features instead of word-level? (The current smell uses word types with count >= 5; character n-grams might be more appropriate for isolating languages.)
3. Does the kāraka system need a different surface mapping? (Probably — particles carry roles that case endings carry in Pattern languages.)
4. Is the "one river" principle still valid? (Yes — the EOT marks are still referents in roles. The tributary is different, but the river is the same.)

The plan: spend the next measurement cycle on Ground-heavy languages. Start with Mandarin (already fetched, already has a smell result). Build a word-breaker, re-measure the smell at character level, and see if the kāraka frame works on particle-marked roles. The delta between Ground and Pattern tributaries is the learning.


## 12. The kāraka map: Panini's six semantic roles as the upstream

`native/adapters/text/karaka-map.mjs` in the khora maps UD case tags + deprels → Panini's six kārakas (kartṛ, karman, karaṇa, sampradāna, apādāna, adhikaraṇa). Genitive and vocative are relations, not roles. Ground particles carry kārakas (把=karman, 被=karman, 以=karaṇa, 在=adhikaraṇa, etc.).

Coverage on held-out test sets:
- Sanskrit: 58.2% (all six kārakas well-represented)
- English: 27.0% (mostly adhikaraṇa, kartṛ, karman)
- Mandarin: 38.3% (mostly adhikaraṇa, kartṛ, karman)

The kāraka is the upstream of Thrax's 8 — the semantic roles that all languages instantiate, regardless of surface form. This is the "one river" principle made code: the kāraka is the same across all languages; the surface signal (case endings, word order, particles) differs. The delta between surface signals is the learning.

The kāraka map is a DECLARED translation (like THRAX_MAP), not a measured one. It is falsifiable: a language where the mapping fails would refute it.


## 13. The triple helix: 27 cells, 3 intertwined axes, and the dependency chain

The cube has 27 cells = 3 grains (Ground/Figure/Pattern) × 3 terrains (Existence/Structure/Interpretation) × 3 stances (Differentiate/Relate/Generate). The "triple helix" is the three axes intertwined: each axis is a helix (Ground=Void hub 0, Figure=Beings spokes n, Pattern=Fold rim 1), and the 27 cells are the intersection points.

The 9 operators (NUL→SIG→INS→SEG→CON→SYN→DEF→EVA→REC) define the dependency chain through all 27 cells. Each operator is (mode, domain) and touches 3 cells (one per grain). The chain is serial (NUL must precede SIG, SIG must precede INS, etc.) but within each operator, the 3 grains are read in parallel.

The "something between 1 and 2" (referent-network → kāraka) is the **terrain** (Existence/Structure/Interpretation):
- A referent that merely exists (Existence) has no kāraka.
- A referent that is structurally connected (Structure) has one.
- A referent that is interpretable (Interpretation) carries it.

The "something more" is the **stance** (Differentiate/Relate/Generate):
- A referent being distinguished (Differentiate) is named.
- A referent being bound (Relate) is linked.
- A referent being produced (Generate) is derived.

The DMD gate is grain-dependent:
- Ground: present vs absent
- Figure: linked vs unlinked
- Pattern: licensed vs unlicensed

The smell must read at all 27 cells, not just the grain level. GL-CB-01 showed that the smell's accuracy varies 2.9x within a single grain (Figure/Existence/Differentiate 0.906 vs Figure/Structure/Relate 0.312). The other 26 cells are unexplored.

The "parallelization" is the ant-swarm: 3 ants (one per grain), each reading the material independently, converging on the EOT marks. Within each grain, the terrain and stance are also independent readings. The grain classification IS the convergence point, not a serial gate.

What we haven't measured:
1. Whether the terrain and stance improve the smell (GL-CB-01 tested this: yes, they do)
2. Whether the kāraka assignment improves with terrain/stance knowledge (untested)
3. Whether the DMD gate needs to be grain-dependent (untested)
4. Whether the 27 cells are the RIGHT 27 cells (untested)
5. Whether the helix order is the right order (untested)

Next experiments:
1. Add terrain and stance features to the smell's context vector and re-measure
2. Test the kāraka assignment with terrain/stance knowledge
3. Test the DMD gate with grain-dependent thresholds
4. Test on Sanskrit and Mandarin (not just English)

## Falsifier

This plan is falsified if:
- A codec is rewritten to chase a number (violates rule 1)
- A read organ is re-derived in penelope (violates rule 7)
- A "fresh" set is scored twice without the REUSED label (violates rule 3)
- A change ships without beating its held-out null (violates rule 8)
- The base function is deleted from git history (the 99% cut, the recurring loss)
