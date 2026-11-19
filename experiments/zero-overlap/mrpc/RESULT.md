# RESULT-MRPC (PREREG-MRPC sha 0450742b27a3b55d). Code mrpc.py; held-out run once (held-result.txt).
Data: MRPC from Hugging Face nyu-mll/glue parquet (train 649,281 B, test 308,441 B), human labels as gold.
DEV (n 864 same / 359 not-same): plain overlap R0 TP 0.929, FA_hard 0.872, BA 0.529. R2 (overlap + usage) BA 0.526, FA_hard 0.872: REFUSED, R0 chosen.
HELD-OUT once (1147 same / 578 not-same): R0 TP 0.930, FA_hard 0.872, BA 0.529. R2 (not chosen) 0.951 / 0.841 / 0.555; LOW stratum n=32 same, too small to read.
Findings:
1. MRPC's not-same pairs are near-twins: plain overlap passes 87% of them. The corpus is a hard-suitor test that overlap cannot win (BA 0.53, little above chance). Against random suitors, overlap rejects 99.5% (FA_rand 0.005).
2. The usage lexicon added nothing on dev. On held-out R2 was higher (0.555) but dev had refused it; I do not promote it (that would pick the rung after seeing the held-out).
3. Falsifier hit: R0 was not beaten at equal or lower FA_hard on dev, so the cross-language lift of the usage frame did not transfer to same-language English paraphrase in this domain.
4. Not tested: zero-overlap sameness (32-36 LOW pairs); the usage lexicon here was learned on MRPC itself (news), not on Wikipedia.
5. Consequence: MRPC cannot separate a paraphrase from a near-twin by word overlap or usage; deciding those pairs needs the facts (who did what, numbers, negation), i.e. the leaf/agree-dispute question, not the root.
