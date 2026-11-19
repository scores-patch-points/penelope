# Bilingual Odysseus test (stamped before any scoring)
Question: can Penelope call an English speech and its French translation (Guizot) the same, with zero shared words, using only usage evidence beaten against a seeded null, while rejecting the other speeches of the same scene (suitors)?
Gold: speech i of scene s in the modern English file is the translation of speech i of scene s in the Guizot file, for scenes whose speech counts are equal (independent of any lexicon; length ratio checked, 30 pairs eyeballed is not done here: disclosed).
Splits: induction + dev = acts 1-3 (induce on acts 1-2, choose on act 3); held-out = acts 4-5, run once, induced on acts 1-3.
Tokens: lowercase letters, 5-char prefix; stop = the 50 most document-frequent types per language in the induction set (declared N=50, not tuned).
Licence of a pair (e,f): co-occurrence count c>=2 and c > max over 50 within-scene shuffles of the French side (seed 20261118). No model, no dictionary.
Verdict per (EN, FR) pair: probes = EN content types in the declared tier; score = probes with a licensed French partner present; same iff score > max score of the EN speech against 50 seeded random FR speeches of matched length bucket; otherwise other. new_frame = passes the null but a suitor (another FR speech in the same scene) also passes: REC then climbs to the next tier.
Ladder (DEF): T_all (all content types), T_rare (types with df <= median df), T_rare2 (rare AND score >= 2). Admit a rung only if balanced accuracy rises and suitor-pass rate does not.
Metrics: TP rate (true pair called same), suitor-pass rate (FA), P@1 (true FR speech has the top score among its scene), BA.
