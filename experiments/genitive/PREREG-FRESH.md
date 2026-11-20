# PREREG-FRESH — genitive frame with an EMERGENT-class judge (written 2026-11-20 BEFORE the run)

Owner's question (carried from GL-GN-01): the tagger is a trained judge; test the same frame with classes that emerge from our own token contexts, on a fresh English set. Split label: **FRESH** (UD English-EWT dev, never scored for this question).

Data: `en_ewt-ud-dev.conllu` (UniversalDependencies/UD_English-EWT, commit 491be069d36e378f67c29f183699eea88308ea42, sha256 first 16 ebd876f586758249, ~1.8 MB, CC BY-SA 4.0), fetched with the owner's yes. 2001 sentences, 123 occurrences of `'s`/`'s`, 67 gold possessive (PART/case) = planted, 56 noise. The file is FRESH for this question: it was not read before this protocol was stamped.

Judge (emergent, not the trained tagger): clusters are built on the TRAIN SPLIT (80% of the sentences, by the same split rule as experiments/emergent-pos/run.mjs: index % 10 in {0,1} held out) of this same file, using PPMI left/right neighbour vectors and spherical k-means, seed 20261120, k chosen from {4,8,16,32,64} by dev bits on the held-out 10%. A cluster is called NOMINAL when, on the training split, its dominant gold UPOS is NOUN or PROPN; this naming uses gold only to label clusters after they have formed, never to build them, and only on the training split. A neighbour token is nominal iff its lowercased form was seen in training and its cluster is nominal; an unseen or short neighbour counts as NOT nominal (no evidence is not a vote), as in the sniff rule.

Rule (declared before the run, not tuned): the smell FIRES when the LEFT neighbour token is nominal (left-only) and, separately, when LEFT AND RIGHT neighbours are both nominal (both). Gold labels (planted/noise) are used only to score, never to judge.

Claims, each with its falsifier:
- **E1 (left-only, pre-registered claim).** Emergent-judge left-only balanced accuracy exceeds the MAXIMUM over 200 shuffles of the planted/noise labels on the held-out sentences (the 20% not used for clustering). Falsified otherwise: the emergent classes do not smell the genitive through the left-neighbour frame.
- **E2 (both, reported).** Emergent-judge both-rule balanced accuracy on the same held-out sentences; reported with its shuffle maximum and its falsifier (does not exceed the maximum).
- **E3 (comparison, reported, not claimed).** Whether emergent left-only beats emergent both on this fresh set. This is the post-hoc lead from GL-GN-01 carried into a pre-registered claim (E1). If E1 holds and E2 does not, the lead survives; if both hold, report which is stronger; if neither, the lead is dropped.
- **E4 (reported, not claimed).** tpr, fpr, likelihood ratio with 95% bootstrap interval for each rule; overlap of errors with the tagger's frame (if the tagger were run on the same set, reported as a separate column, not a claim).

Named gaps (not covered): "of"-phrase genitives, possessive pronouns, plural possessives, Greek case. "of" genitives are a separate claim requiring their own protocol and planted truth; not scored here.

Seed 20261120. Nothing here changes after the run except in an ERRATUM section below.
