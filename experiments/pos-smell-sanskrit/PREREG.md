# PREREG — smell every part of speech in Vedic Sanskrit (written 2026-11-20 BEFORE the run)

Owner's direction (2026-11-20): get the smell into Sanskrit. Sanskrit is the other great classical inflected language (Panini's, as Greek is Thrax's), and its grammar tradition cuts the parts of speech differently (subanta/tinanta/avyaya) — so it is a second home-language test alongside Greek. The smell is the fine-grain UPOS one of GL-SM-03: clusters named by their dominant UD tag, no Thrax collapse.

Data: `sa_vedic-ud-train.conllu` (UniversalDependencies/UD_Sanskrit-Vedic, commit 3ce6c31c379d4fc65a4f5073d126b1b24b45dadf, sha256 first 16 05829c606047956b, 23,873,734 bytes, CC BY-SA 4.0), fetched with the owner's yes. FRESH (never read). Vedic Sanskrit, the older liturgical language; Classical Sanskrit (UD_Sanskrit-UFAL) has no train split and is a named gap.

Method (identical to experiments/pos-smell-upos/PREREG.md, 86fe2f0c281ce357): sentences split mod 10 — {0,1} HELD-OUT (scored once), the rest TRAIN (clustering). Train types count >= 5; context = 200 most frequent train words as left and right neighbour (400 dims); positive PMI, smoothing 0.75, L2-normalised; spherical k-means k=64, 10 restarts, seed 20261120. A cluster is named by its dominant UPOS tag on train gold weighted by token count; a held-out token smells as its cluster's named tag; an unseen type is unnameable (null). Gold UPOS only scores and names clusters.

Claims, per UPOS tag X with both planted and noise on held-out:
- **S-X.** The smell-for-X balanced accuracy exceeds the maximum over 200 shuffles of the planted/noise labels. Falsified otherwise.
- **S-CARD reported, not claimed.** Laplace tpr/fpr/likelihood ratio with a 95% bootstrap interval.
- **S-SUM reported, not claimed.** Multi-class accuracy and its shuffle maximum; the unnameable share.

Seed 20261120. Nothing here changes after the run except in an ERRATUM section below.
