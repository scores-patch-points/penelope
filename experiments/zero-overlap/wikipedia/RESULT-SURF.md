# RESULT-SURF: can the asker criterion FIND the equivalent where mechanical string matching cannot? (PREREG-SURF sha 8d2aea6fa01ddc03). EXPLORATORY: fresh sets 1-7 pooled, all already read. surf_dump.py, surf_run.mjs (the organ is the ranker).
Task: rank the true other-language counterpart among up to 60 same-category candidates (mean pool 42.7); fr 2,364 articles, de 2,277.
STRING = plain shared-token count. STRUCTURE = the organ's verdict and residual for the identity askers (area; birth; death with born upstream). COMBINED = structure first, string within and beyond it.
## Where the criterion can see (the true counterpart states an area, a birth or a death year): fr 286 articles (12.1%), de 806 (35.4%)
- STRING P@1 0.811 fr / 0.783 de; STRUCTURE 0.895 / 0.800; COMBINED 0.944 / 0.947 (mean reciprocal rank 0.954 / 0.962).
- On low string overlap (1-3 shared tokens) with a judgeable truth: STRING 0.431 / 0.364; STRUCTURE 0.879 / 0.800; COMBINED 0.879 / 0.821. A gain of 0.44-0.45 where strings are weak.
- The cases that matter: where STRING puts the truth outside its top 5 and the criterion can judge it, STRUCTURE ranks it FIRST in 11 of 11 (fr) and 26 of 33 (de).
## Everywhere (all articles, judgeable or not)
STRING P@1 0.619 / 0.637; COMBINED 0.578 / 0.672: structure does not beat strings overall (fr -0.041, de +0.035). STRUCTURE alone: 0.136 / 0.301 (silent for most articles).
## Falsifiers (pre-written)
(1) STRUCTURE P@1 below 0.80 where the truth is judgeable: not hit (0.895 / 0.800). (2) advantage of 0.30 or more over STRING on low-overlap judgeable articles: not hit as a falsifier, met (0.45 / 0.44); the ZERO stratum has no judgeable truth (a pair that shares no token also states no area or year in either lead here), so "structure finds it when strings share nothing" is NOT shown. (3) COMBINED beats STRING by 0.05 overall: HIT (fr -0.041, de +0.035).
## Reading
Where it can see, structure finds the equivalent that string matching misses: 0.94-0.95 first-place against 0.78-0.81, and a gain of about 0.45 on low-overlap pairs. The binding limit is coverage (12-35% of articles) and the ordering rule: a candidate whose stated facts disagree with the true counterpart's (a land-versus-total area, a different edition's year) is demoted behind candidates that merely say nothing, which hurts overall retrieval in French. That ordering is the criterion's own logic (a strong disagreement is a difference that matters); changing it after seeing this would be tuning on the data.
Not shown: zero-overlap retrieval; links and containers as the structure (only three identity facts were used); a never-read set.
