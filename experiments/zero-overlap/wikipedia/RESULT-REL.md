# RESULT-REL: relations frame, fr and de dev (PREREG-REL sha ce09f79c7b415cac). DEV ONLY, no held-out (consumed earlier).
REFUSED in both languages. Logs: rel-fr.log, rel-de.log; code rel.py.
- R alone: TP 0.638 (fr) / 0.640 (de), suitor-pass 0.002 / 0.004 (more precise than the old frames).
- Falsifier hit 1: the control R_set (shared entity count, no order or pairing) does as well or better: TP 0.934 / 0.937, BA 0.959 / 0.959 vs R 0.818 / 0.818. The relation adds nothing over entity overlap.
- Falsifier hit 2: R is not independent. Pairwise lifts of R with overlap/usage/numerals: 25 / 5 / 25 (fr), 24 / 4 / 9 (de); mean 18.6 / 12.3, against 6.1 / 4.0 among the old three. R is a near-twin of overlap and numerals (the same entities and years).
- Ladder B (R first or last): BA 0.819 -> 0.897 (fr), 0.839 -> 0.904 (de), but false accepts 0.010 -> 0.012 / 0.010 -> 0.011: gate refused (FA not allowed to rise), independence refused.
- Not tested: the zero-overlap strata (the frame is built from named entities, which Cyrillic/Latin transliteration breaks); sentence order across languages; a relation not made of the same entities.
- Side finding (dev, all strata): plain shared-entity count (R_set) has BA 0.959, above the whole ladder A (0.819). On ordinary pairs, entities carry; the hard cases remain the zero-overlap ones.
