# PREREG — the clitic slice: gluing destroys the smell, cutting restores it (written 2026-11-20 BEFORE the run)

Owner's direction (2026-11-20): we cannot slice mechanically before we smell; the gluing tokenizer is the open root cause ("Oscar's", "isn't"). This run PROVES what the smell can do now: that a glued clitic token is unnameable by the emergent per-class smell while its split host is nameable with a clean class, so the cut is localised by where the smell clears up.

Data: `en_ewt-ud-dev.conllu` (UniversalDependencies/UD_English-EWT, commit 491be069d36e378f67c29f183699eea88308ea42, sha256 first 16 ebd876f586758249, ~1.8 MB, CC BY-SA 4.0). 2001 sentences split by index: mod 10 in {0,1} = HELD-OUT (scored once), the rest TRAIN (clustering). FRESH for this question.

Smell (emergent, no tagger): identical to experiments/pos-smell/PREREG.md (d3d76418a01fffbe): PPMI neighbour vectors, spherical k-means k=64, seed 20261120, clusters named by their dominant Thrax class on train gold, weighted by token count. A token's smell is its cluster's soft class distribution: `cls` = the dominant class, `margin` = the dominant share minus the second share. A form not clustered (unseen, or count < 5) is unnameable (`null`): no evidence is not a vote.

Markers (the giver's names, from organs/data/giver-ud-english-clitics.json, injected as data): `'s`, `'`, `n't`, `'ll`, `'m`, `'ve`, `'d` (and `'re`, which the giver leaves un-named and is reported separately as a candidate, never assumed).

The proponent (organs/clitic-slice.mjs): a token is a candidate iff its surface ends with a named marker AND the whole form is unnameable AND the host (surface minus the marker) is nameable. The cut is PROPOSED at the longest named marker. A form the smell already names is left alone. This is a nomination, never a verdict.

Ground truth for scoring: the treebank's own gold tokenization. A clitic attachment is two adjacent gold tokens (host, marker) where the marker's form is in the giver's names; the gold boundary between them is the planted cut. The glued form is synthesised as host+marker (as the gluing tokenizer would produce it). Gold labels only score; no sensor sees them.

Claims, each with its falsifier:
- **C1 gluing destroys the smell.** Over all clitic attachments in held-out, the share of synthesised glued forms that the smell CAN name is (much) lower than the share of split hosts it CAN name. Falsified otherwise (glued forms are as nameable as hosts): the smell gives no signal to cut.
- **C2 cutting restores a clean class.** For split hosts, the smelled class equals the host's gold Thrax class at a rate above the label-shuffle maximum, and the mean host margin is reported. Falsified by a rate at or below the shuffle maximum.
- **C3 the proponent localises the cut.** The proponent, given only the synthesised glued token, proposes the gold cut for a large share of attachments (recall), and proposes no cut on held-out single tokens that gold did not split (precision on the non-clitic population). Reported with recall and the false-positive count; precision against a truly adversarial glued-noise population is a named gap.

Named gaps: a truly adversarial glued-noise population (single words that end in a marker suffix but must not cut); `'re` (unnamed by the giver, reported separately); possessive vs copula `'s` (the frame, GL-GN-01, is the separate question); ADJ/PART/NUM out of scope; non-English.

Seed 20261120. Nothing here changes after the run except in an ERRATUM section below.
