# PREREG — smell every part of speech that really occurs, not just Thrax's eight (written 2026-11-20 BEFORE the run)

Owner's direction (2026-11-20): find the smell of ALL the parts of speech that really exist in Ancient Greek and Mandarin. This removes the Thrax lens from the cluster naming: a cluster is named by its dominant UD UPOS tag (the treebank's own tag, weighted by train token count), so every tag that occurs is smelled, including the ones GL-SM-01/02 set out of scope (ADJ, NUM, PART, PUNCT, SYM, X).

Data: the same three files already fetched and pinned (CC BY-SA 4.0):
- `grc_proiel-ud-train.conllu` (commit 67c85ccd, sha256 first 16 216ad9f521adc823) — REUSED.
- `zh_gsd-ud-train.conllu` (commit d01c0c04, sha256 first 16 e49c17c615b34920) — REUSED (GL-SM-02 read it; this is a new question at a finer grain).
- `en_ewt-ud-dev.conllu` (commit 491be069, sha256 first 16 ebd876f586758249) — REUSED (GL-SM-01/02 and GL-CL-01 read it).

Method (identical clustering to GL-SM-01, one change): sentences split mod 10 — {0,1} HELD-OUT, the rest TRAIN. Train types count >= 5; context = 200 most frequent train words as left and right neighbour (400 dims); positive PMI, smoothing 0.75, L2-normalised; spherical k-means k=64, 10 restarts, seed 20261120. A cluster is named by its dominant UPOS TAG on train gold weighted by token count (NOT collapsed through THRAX_MAP). A held-out token smells as its cluster's named UPOS tag; an unseen type is unnameable (null). Gold UPOS only scores and names clusters; it is never an input to clustering.

Claims, per language and per UPOS tag X that has BOTH planted and noise on held-out:
- **S-X.** The smell-for-X balanced accuracy on held-out tokens exceeds the maximum over 200 shuffles of the planted/noise labels. Falsified otherwise.
- **S-CARD reported, not claimed.** Laplace tpr/fpr/likelihood ratio with a 95% bootstrap interval.
- **S-SUM reported, not claimed.** Multi-class accuracy (smelled tag == gold tag, all held-out tokens) and its shuffle maximum; and the share of held-out tokens that are unnameable (a type the clusters never saw).
A tag with no planted occurrence is reported as ABSENT (a gap), never forced.

Note (named, from khora wordclass.js fd76ada): NUM/PUNCT/SYM/X are not parts of speech in the grammatical sense; they are smelled here for completeness and reported, not claimed as grammatical classes.

Seed 20261120. Nothing here changes after the run except in an ERRATUM section below.
