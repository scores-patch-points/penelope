# Wikipedia across languages: result (held-out run once per language; PREREG sha 457fec71f83cfb57 + ERRATUM-1)
Independent articles on the same subject (interlanguage links as gold), first 120 words, suitors = same category. Induced on acts 1-3 (fr 1072 pairs, de 1019), held-out n = 325 (fr), 316 (de). Rung T_all chosen on dev.

| | loop TP | loop suitor-pass | loop BA | plain-overlap TP | overlap suitor-pass | overlap BA |
|---|---|---|---|---|---|---|
| fr ALL | 0.351 | 0.074 | 0.638 | 0.898 | 0.036 | 0.931 |
| fr LOW (<=3 shared tokens, n=91) | 0.275 | 0.084 | 0.596 | 0.813 | 0.029 | 0.892 |
| de ALL | 0.392 | 0.086 | 0.653 | 0.892 | 0.048 | 0.922 |
| de LOW (n=91) | 0.286 | 0.142 | 0.572 | 0.780 | 0.054 | 0.863 |

Verdict: the claim FAILS. On Wikipedia the plain shared-token count (names, dates written as words, cognates) beats the usage-lexicon loop on every stratum, including LOW, by about 0.3 in balanced accuracy and with fewer false accepts. The stamped falsifier ("loop must beat overlap on the zero-overlap stratum") cannot be met because the ZERO stratum is empty (fr 1 of 325, de 1 of 316 in held-out; 0 and 1 in dev): independent articles in Latin-script languages about the same subject almost always share tokens.
What this does and does not show: it does not show the usage lexicon is useless (Henry IV translations, which had no overlap, were recognised at 34% / 27% with 6-7% false accepts, and the baseline there was 0 by construction); it shows that where overlap exists, overlap wins, and that Latin-script Wikipedia is not a zero-overlap test. A truly zero-overlap independent test needs a different script (Russian, Arabic, Greek, Japanese, Chinese) where names and cognates do not match as tokens.
Limits: categories chosen by me and very unequal in size (one group has 470 members); loop is the stamped lexicon with a 5-prefix tokenizer, not tuned; 6 pairs checked by eye.
Reproduce: cd wikipedia; python3 make_pairs.py fr; python3 lowthr.py fr; python3 judge.py dev fr; python3 judge.py held fr (likewise de). fetch.py rebuilds articles.json.
