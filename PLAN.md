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

## Falsifier

This plan is falsified if:
- A codec is rewritten to chase a number (violates rule 1)
- A read organ is re-derived in penelope (violates rule 7)
- A "fresh" set is scored twice without the REUSED label (violates rule 3)
- A change ships without beating its held-out null (violates rule 8)
- The base function is deleted from git history (the 99% cut, the recurring loss)
