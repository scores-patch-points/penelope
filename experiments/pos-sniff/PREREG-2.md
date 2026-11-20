# PREREG-2 — the sniff against khora's tagger on words the tagger does not know, on a FRESH set (written 2026-11-20 BEFORE the file is scored)

Split label: **FRESH, read ONCE** (a second scoring is REUSED). Data: `en_ewt-ud-test.conllu` of UD English-EWT, commit 491be069d3, 1,901,339 bytes, sha256 first 16 `5b5df91ca2367734`, CC BY-SA 4.0, fetched 2026-11-20 with the owner's yes. The sniff model was learned from the EWT TRAIN file's word-disjoint 70% split (GL-UD-09), so this test file was never trained on or scored by it. Whether khora's tagger was trained on the EWT train file only is NOT verified here (khora tests reference the test file, so it may have been evaluated on it); if the tagger ever saw this test file the comparison favours the tagger, which is recorded as a caveat, not a correction.

Why this set: ADDENDUM-1 of PREREG.md saw a post-hoc lead on creole words the tagger's lexicon lacks (Singlish 158 of 200). That lead needs a set not used to find it. English is the sniff's own language, so this is the fairest place for it; it does not test creoles.

Occurrences: as PREREG.md (words of 3 or more letters a-z, NOUN/PROPN against VERB ADJ ADV AUX NUM PRON ADP DET CCONJ PART SCONJ, sentences of 6 to 40 tokens, at most 3 per word), restricted to words whose lower-cased form the tagger's lexicon does NOT carry (any key `form|UPOS` of `parser.lexicon.form`): the sniff is applied only where its own rule allows (`known` gate on). Sentence text = gold tokens joined by one space; no regex or word list reads any text.

Claims, each with its falsifier:
- **F1 (the lead).** On these unknown-word occurrences the sniff's nominal-vs-other accuracy beats the tagger's (UPOS mapped to the same two classes) in at least 190 of 200 paired bootstrap resamples. Falsified by fewer: then the Singlish lead did not generalise and the sniff is not better than the tagger where it was designed to be used.
- **F2 (power).** The set has at least 200 occurrences; with fewer, F1 is reported as UNDERPOWERED, neither confirmed nor falsified.
- **F3 (reported, not claimed).** Accuracy of each by the tagger's margin third; the hybrid (sniff where the tagger's margin is in the bottom third); whether their errors overlap (the share of sniff-wrong occurrences that the tagger also gets wrong), which tells whether they can count as independent layers in the ledger.
- **F4.** The calibration card for "pos-sniff-nominal" and for the tagger's nominal reading from this fresh run, derived by `calibrationCard`.

Seed 20261120, B = 200. Nothing here changes after the run except in an ERRATUM section below.
