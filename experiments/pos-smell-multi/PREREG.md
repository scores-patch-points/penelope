# PREREG — the emergent per-class smell in Thrax's own language (Ancient Greek) and a held-out control (Mandarin) (written 2026-11-20 BEFORE the run)

Owner's direction (2026-11-20): wire the smell in, then try it on Ancient Greek and Mandarin. This run generalises GL-SM-01 (the per-token smell for each of Thrax's eight classes) from English to two languages the English smell never saw: Ancient Greek (Thrax's home, inflected) and Mandarin (isolating, no articles/inflection). The slice is NOT run here (the giver naming Greek/Mandarin clitics does not exist yet): it is a named gap.

Data: two UD treebanks, fetched with the owner's yes (file, source, size, commit, sha256):
- `grc_proiel-ud-train.conllu` (UD_Ancient_Greek-PROIEL, commit 67c85ccd0db2cf19106a20691e4475b8e1e88047, sha256 first 16 216ad9f521adc823, 21,135,121 bytes, CC BY-SA 4.0). REUSED (the emergent-pos run already read this file; the per-class SMELL question is new).
- `zh_gsd-ud-train.conllu` (UD_Chinese-GSD, commit d01c0c04c7de341c85212f30c184d9b16a516ccc, sha256 first 16 e49c17c615b34920, 9,318,344 bytes, CC BY-SA 4.0). FRESH (never read before).

Method (identical to experiments/pos-smell/PREREG.md, d3d76418a01fffbe, per language separately): sentences split by index — mod 10 in {0,1} = HELD-OUT (scored once), the rest TRAIN (clustering). Train types with count >= 5; context = the 200 most frequent train words as left and right neighbour (400 dims); positive PMI, context smoothing 0.75, L2-normalised; spherical k-means k=64 (fixed), 10 restarts, seed 20261120. A cluster is named by its dominant Thrax class on train gold weighted by token count; a held-out token smells as its cluster's named class; an unseen type is unnameable (null). THRAX_MAP copied verbatim from khora wordclass.js (commit fd76adae9a5a13feb3f47a6956b4bf3bf8f315d8): noun (NOUN/PROPN), verb (VERB/AUX), pronoun (PRON), article (DET), preposition (ADP), conjunction (CCONJ/SCONJ), adverb (ADV), interjection (INTJ); ADJ/PART/NUM/PUNCT/SYM/X out of scope.

Claims, per language and per class X (each with its falsifier):
- **S-X per class.** The smell-for-X balanced accuracy on held-out tokens exceeds the maximum over 200 shuffles of the planted/noise labels. Falsified otherwise: our tokens do not smell class X in that language.
- **S-SUM reported, not claimed.** Multi-class accuracy and its shuffle maximum; per-class precision/recall/F1.
- **S-CARD reported, not claimed.** Calibration card (Laplace tpr/fpr/LR with 95% bootstrap interval) per class.

Named gaps: the clitic/particle slice (no giver for Greek enclitics or Mandarin particles); ADJ/PART/NUM/PUNCT/SYM/X; the participle (no UD tag); a class that does not exist in a language (e.g. Mandarin has no article) is reported as absent, never forced.

Seed 20261120. Nothing here changes after the run except in an ERRATUM section below.
