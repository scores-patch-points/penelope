# Bilingual Odysseus result (held-out acts 4-5, run once; PREREG dd6adb4e754eeb30 + ERRATUM-1)
English (modern) vs French (Guizot) speeches, zero shared content words, independent gold (length-DP alignment, no lexicon), licences induced from acts 1-3 by co-occurrence beating 50 seeded within-scene shuffles. No model.
Held-out n=147: true translation called same 34.0%; other speeches of the same scene called same 5.8%; BA 0.641; true pair top-scored in its scene 19.7%; "new_frame" (passes the null but a suitor also passes) 24.5%.
Dev (act 3): T_all BA 0.668 admitted; rare and mid tiers refused (lower BA). Erratum: the stamped "rare" tier was empty by construction.
Limits: 394 induction pairs is small; 4 of 541 gold pairs checked by eye; a prefix-5 tokenizer, no morphology; scene-mates are easy suitors in one play; not compared to a plain baseline (there is none that shares no words). Not tested: the hyperlexicon as a giver (its fr/de links are empty).
Reproduce: cd bilingual; python3 align.py; python3 judge.py dev; python3 judge.py held

## new_frame ladder (dev only; added after the held-out run, which stays spent)
Penelope organ `organs/frame-verdicts.mjs` (`judgeFrames`: same / other / new_frame, exhausted ladder = gap with trail; `admitLadder`). Here same requires that no scene-mate also passes the frame. Dev act 3, n=112:
- T_all alone: TP 0.080, FA 0.003, BA 0.539, undecided (gap) 0.304
- T_all > T_mid2: TP 0.143, FA 0.004, BA 0.569, gap 0.045
- T_all > T_mid > T_mid2: TP 0.152, FA 0.004, BA 0.574, gap 0.045
The extra frames cut undecided pairs from 30% to 4.5% and lift balanced accuracy, but false accepts rose 0.003 to 0.004 (about one suitor), so by the admission rule ("false accepts must not rise") the ladders are REFUSED as stated. Not scored on held-out. Strict discrimination costs recall against the earlier pass-the-null measure (BA 0.668), because there a suitor also passing was not counted against the claim.

## German replication (de/, PREREG-DE sha 57ad84be7a45ba28; held-out run once)
English vs Wieland German, zero shared words, same protocol, nothing tuned, 249 induction pairs (French had 394). Dev chose T_all (BA 0.572). Held-out n=144: true pair called same 27.1%, scene-mate suitors 6.7%, BA 0.602, P@1 0.153, new_frame 18.1%. Same shape as French (34.0 / 5.8 / 0.641 / 0.197) with about 37% less induction data and a prose translation of a different century: the effect is not a quirk of Guizot. Alignment was per act (26 German scenes vs 19), 4 pairs checked by eye. French and German were not pooled (different target languages). The corpus holds no further translated text, so more induction data would need a new source (a download I'd ask about first).
