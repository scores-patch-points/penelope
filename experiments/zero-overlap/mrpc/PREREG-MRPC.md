# PREREG-MRPC: same-language paraphrase with independent gold (filed before any scoring)
Data: MRPC (nyu-mll/glue parquet, Hugging Face): train 3668 pairs (2474 same / 1194 not), test 1725 (1147 / 578). train.parquet sha256 prefix 61fd41301e0e244b, test.parquet a623ed1cbdf445b1. Gold = the corpus's own human labels; no lexicon or model built it. Source: news sentence pairs, English only, lexically close (mean Jaccard of same pairs 0.567, not-same 0.418; same pairs with Jaccard < 0.3: 93 train, 35 test).
Splits: induction = first 2/3 of train by idx (label-1 pairs only); DEV = last 1/3 of train. HELD-OUT = MRPC test, run ONCE after dev chooses the rung, induced on all of train.
Tokens: lowercase words of 3+ letters, first 5 characters; the 50 most frequent token types in the induction sentences removed (declared). 
Rungs: R0 plain overlap (baseline); R1 usage only (no identical token: x != y); R2 overlap + usage. Usage lexicon: co-occurrence of (x in s1, y in s2) across induction same-pairs >= 2 and above the max of 50 seeded shuffles of s2 over induction pairs (seed 20261118). Nothing hand-set.
Pass: score above the max score of 50 length-matched random sentence2 candidates (seed 20261118; length within max(5, 30%)) and >= 1.
Trials: TP = label-1 pair passes; FA_hard = label-0 pair passes (the corpus's own near-twin impostor); FA_rand = a label-1 claimant against 10 other pairs' sentence2. Strata: ALL, LOW (R0 jaccard < 0.3).
Admission (stamped): R2 is admitted over R0 only if balanced accuracy (TP vs FA_hard) rises and FA_hard does not. Chosen on dev; held-out once. R1 is reported, not chosen.
Falsifier: if R0 (plain overlap) is not beaten at equal or lower FA_hard, the induced usage lexicon adds nothing on same-language paraphrase, and the earlier cross-language lift does not transfer.
Also reported: k_eff is not computed (two frames only).
Not claimed: anything about zero-overlap sameness (only 35 test pairs are below Jaccard 0.3), or other genres.
