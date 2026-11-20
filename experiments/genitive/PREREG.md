# PREREG — can we SMELL the genitive? A frame rule for the possessive 's, judged by two existing nominal-sensors (written 2026-11-20 BEFORE the run)

Owner's question (2026-11-20): "can't we smell genitive tho?" and the standing wish that an English possessor ("Oscar's") be encoded like the Ancient Greek genitive, the relation named by the case marker. Smell = a cheap, revisable pressure, never a verdict (as the sniff, GL-UD-09).

Data: the 109 occurrences of the token `'s` (or `’s`) in UD English-EWT `en_ewt-ud-test.conllu` (commit 491be069d3, sha256 first 16 `5b5df91ca2367734`; already read for GL-SN, so the FILE is REUSED, the question is new). Gold tokens as the treebank cut them (the clitic is already split: this tests the SMELL, not the tokenizer). PLANTED TRUTH = gold UPOS PART with deprel `case` (the possessive marker, 56); NOISE = every other `'s` (copula 42, auxiliary 8, verb 3 = 53). The gold is used only to label the occurrences for scoring; no sensor sees it. Split label: **EXPLORATORY / REUSED file**. Sentence text = gold tokens joined by one space; offsets exact; no regex or word list reads any text.

The rule (declared before the run, not tuned): the smell FIRES when the LEFT neighbour token AND the RIGHT neighbour token are both NOMINAL. "Nominal" is judged by one of two existing sensors, never by gold and never by a list:
- **R-tagger:** khora's English tagger on the whole gold-tokenised sentence; nominal = UPOS NOUN or PROPN.
- **R-sniff:** `organs/pos-sniff.mjs` (frozen sniff-eng2, GL-SN-01) voting on the neighbour token, original-case sentence; nominal = vote "nominal" (accept gating off, as when its card was derived). A neighbour the sniff was never trained for (not a word of 3 or more letters a-z once lower-cased, so punctuation and short words) counts as NOT nominal: no evidence is not a vote.

Claims, each with its falsifier:
- **G1 / G2 (each rule separately).** Its balanced accuracy (the mean of the fire rate on planted and the non-fire rate on noise) exceeds the MAXIMUM over 200 shuffles of the planted/noise labels. Falsified otherwise: that sensor does not smell the genitive through this frame.
- **G3 reported, not claimed.** For each rule: tpr, fpr, the Laplace likelihood ratio (as `calibrationCard`) with a 95% bootstrap interval (1000 resamples); the left-only and right-only variants; the share of the planted possessives each misses and what the misses look like (the right neighbour is an adjective, a determiner, a number); whether the two rules' errors overlap.
- **G4 the card.** The calibration card for the layer "possessive-frame" per rule, from the counts, for the ledger. With only 56 planted occurrences the interval will be wide and is quoted with every ratio.

Not covered, named as gaps: "of"-phrase genitives, possessive pronouns ("my", "its"), the plural possessive apostrophe, and Greek case (its own run on emergent case clusters).

Seed 20261120. Nothing here changes after the run except in an ERRATUM section below.
