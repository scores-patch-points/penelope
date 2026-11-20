# PREREG-CALIBRATION (EXPLORATORY): is the colony's per-program bar calibrated, and does replication across batches fix what it is not?
Written 2026-11-20 BEFORE any run of calibrate.mjs. Prompted by the mind runs (PREREG-MIND*, runs b2/b3/c2): about half of each mind was single uppercase letters or content fragments, and a bar of "positive and beyond the maximum of 30 random-cut draws" over ~1000 candidates should admit about 30 false positives per batch. This tests that directly, with text whose truth I control.
## The bar under test
A candidate word-final cut is GOOD on a batch when its mean tagger-margin change over a sample of the sentences it changes (up to 40) is positive and larger than every one of 30 null draws (random same-length cuts of random words, same text). Under pure noise the chance a candidate beats the null's maximum is 1/(30+1), and it must also be positive; so the expected rate is AT MOST 1/31 = 3.2% per evaluable candidate. REPLICATED means GOOD on at least two independent batches (different documents); under independence the expected rate is at most (1/31)^2 = 0.10%.
## Conditions (the same eight-batch split of the informal training text as mind.mjs; the first four batches, seed 20261120)
A NOISE: every token's characters shuffled (lengths and spacing kept), so no real suffix structure remains. Truth: nothing is good.
B PLANTED: the real text with five FUNCTION WORDS glued onto their predecessor with probability 0.5 wherever they occur (a missing-space typo, the commonest informal error). The five are DERIVED, not chosen: the five most frequent purely alphabetic lowercase tokens of three letters in the first batch. Truth: cutting each planted word back off is the right program.
C PLANTED RARE: the made-up suffix `zq` glued onto three tokens of batch 1 ONLY. Truth: a content idiosyncrasy of one batch; it must not replicate.
Each condition evaluates EVERY candidate of every batch (no early stop), with a null made from that same batch's text per cut length.
## Predictions and falsifiers
PA1 (the bar is calibrated): on A the share of evaluable candidates called GOOD is at most 1/31 within sampling error, and the REPLICATED share at most (1/31)^2 within sampling error. FA1: the GOOD share exceeds 2/31, or the REPLICATED share exceeds 5 x (1/31)^2 (the bar is weaker than it claims), or the GOOD share is below 0.5/31 (the bar is too harsh).
PB1 (it can find what is there): on B at least four of the five planted words are GOOD in at least two batches. FB1: fewer than three are.
PB2 (replication removes noise): on B the number of non-planted REPLICATED programs is smaller than the number of non-planted GOOD-in-one-batch programs by at least a factor of five. FB2: it is not.
PC1: `zq` is GOOD in batch 1 or not (reported) and is NOT replicated. FC1: replicated.
## Not claimed
Planted text is not natural text; the tagger is one model; a calibrated bar on planted truth says nothing about whether a real cut is linguistically right. The number of batches (four) is a run-time bound for time.
