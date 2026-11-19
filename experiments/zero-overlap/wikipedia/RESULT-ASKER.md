# RESULT-ASKER: equivalence as "the difference, for the asker, is below the asker's difference-that-makes-a-difference" (PREREG-ASKER sha cfd90223896e8cc0). EXPLORATORY. Every set was already read by earlier frames; nothing here is held-out or fresh.
Code: asker.py (survival over a six-level tolerance ladder), asker2.py (per-dimension curves, silent share, base rate, precision), asker_head.py (loads the frozen extractors). Log: asker-result.log.

## What was measured
For each article pair (an article and its other-language counterpart) and each impostor (the article against up to 30 other-language leads of the same category), the difference per dimension (land area, relative; birth and death year, absolute; population with a stated year on both sides, relative after allowing 0.03 per year of drift) is compared with a tolerance swept down a declared ladder (relative 0.50, 0.25, 0.10, 0.05, 0.02, 0.01; years 50, 20, 5, 2, 1, 0). Two askers: identity (area, birth, death) and size (population).

## Numbers (fr / de)
- Identity asker, true pairs surviving at loosest to tightest level: 1.000 to 0.870 (fr), 0.995 to 0.909 (de); impostors 0.554 to 0.004 (fr), 0.606 to 0.005 (de). Largest gap between the curves 0.957 / 0.936, reached at level 3 and then falling.
- Size asker: true 0.952 to 0.821 (fr), 0.913 to 0.883 (de); impostors 0.515 to 0.080 (fr), 0.509 to 0.098 (de).
- Per dimension at the tightest level (asker2.py): birth year true 1.000 / 1.000 (flat at every level, so no approach), impostors 0.009 / 0.008; died year 1.000 / 1.000 vs 0.003 / 0.007; area true 0.763 / 0.791 vs 0.007 / 0.008; population true 0.821 / 0.883 vs 0.080 / 0.098.
- Silent share: no identity verdict for 2,211 of 2,388 true pairs (92.6%) in fr and 1,887 of 2,294 (82.3%) in de; population verdicts cover 84 and 103 pairs.
- Base rate and precision at the tightest level (true : impostor trials about 1 : 26): area 0.82 / 0.80; born 0.79 / 0.82; died 0.93 / 0.87; population 0.34 / 0.28.

## What a hostile review found (kept, because it changes what this can claim)
1. The "asymptote" is partly by construction: the equivalence test is a max over dimensions and the ladder only tightens, so survival is monotone non-increasing. What is empirical is only the level of the two curves.
2. True-pair decay is entirely area (fr 74 of 97 survive at the tightest level, de 140 of 177); birth and death years match exactly on every covered true pair. The gap peaks at level 3, which is not an approach toward identity.
3. The identity result largely repeats the ledger's earlier birth/death-year and area rows on 7.4% (fr) and 17.7% (de) of pairs.
4. There is no adversary arm: an impostor that copies the target's year and area is not tried, and tightening toward zero makes forging easier, not harder (two integers to copy).
5. The ladder is the experimenter's sweep, not any asker's declaration; the masks are fixed by the script.
6. The weakest pre-written falsifiers were met at the loosest levels; the size asker's impostors keep 0.08-0.10 at the tightest level and no falsifier covers that.

## What it supports today
Where both leads state a birth or death year, or an area, the figures agree exactly or nearly exactly for true pairs and rarely for same-category impostors, on 7-18% of pairs. It does not show an asymptotic approach or a law.

## What changed in the design because of this (organs/asker-dmd.mjs)
The asker no longer gets a flat mask and tolerance fixed by a script. The asker declares what they care about (concerns: nodes of the dependency order); a difference makes a difference only if its node is UPSTREAM of a concern in that order, ordered by the arrow of time (a dependency pointing forward in time is refused). Strong and tied nodes may veto; weak, untied, untimed or one-sided nodes are holes. Drift is allowed for in fluents. See the organ header and test file.

## Before anyone calls this evidence for a law
(1) A never-read set, with the dependency-order concerns and tolerances declared before the data is read. (2) An informed-adversary arm. (3) Per-dimension curves, silent share, base rate and precision reported (the last four now are above). (4) Falsifiers that bite: the gap must still grow at the last two levels, and impostors must be rejected against same-year, same-area hard cases.
