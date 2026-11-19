# RESULT-CORROB: corroboration by a second quantity (area), and area as the tie. PREREG-CORROB sha e246a1935451fd65 (ERRATUM-1, ADDENDUM-1). corrob.py, fetch_fresh4.py; corrob-f4-fr.log, corrob-f4-de.log.
ERRATUM-1 (dev): the first area extractor was wrong, not the articles: "7,007.54 square kilometres" read as 54, German "35.751,65 km²" as 751, thin and other Unicode spaces split numbers, so 18 of 56 (fr) / 40 of 121 (de) true pairs looked like area disputes. After the parser fix (checked on the failing strings) dev showed true-pair area agree 0.964 (fr) / 0.975 (de).
DEV (pooled F1-F3, fr 685 / de 622 pairs): both-area coverage 0.082 / 0.195. Suitor coincidence (area agrees by chance) 0.091 / 0.096; suitor area dispute 0.744 / 0.746. Population-dispute x area-dispute lift among suitors 1.08 / 1.10. All 6 true-pair population disputes were rescued by an area agreement.
STAGE B, FRESH F4, run once (12 categories: Philippines, Kenya, Afghanistan, Indonesia, Colombia, Mexico, Peru, Ukraine, Ghana, Senegal, Norway, Cuba; fr 306 / de 337 pairs):
| | fr | de |
| both-area coverage | 15/306 = 0.049 | 35/337 = 0.104 |
| true pairs: area agree | 13/15 = 0.867 [0.62, 0.96] | 30/35 = 0.857 [0.71, 0.94] |
| true pairs: area dispute | 1/15 [0.01, 0.30] | 0/35 [0, 0.099] |
| suitors: area agree (coincidence) | 0.049 [0.032, 0.074] | 0.062 [0.051, 0.075] |
| suitors: area dispute | 0.853 | 0.841 |
| population x area dispute lift (suitors) | 1.02 | 0.94 |
| suitors falsified by pop AND area | 0.432 | 0.391 |
| true pairs with a population dispute | 0 | 0 |
FALSIFIERS on F4: (1) true-pair area dispute upper end > 0.10 with n >= 30: not hit (de 0.099; fr n = 15, too small to judge). (2) true-pair area agree < 0.80: not hit (0.87 / 0.86). (3) suitor coincidence > 0.10: not hit. (4) both-area coverage < 0.10: HIT in French (0.049); de just clears (0.104).
Reading: area behaves like an identity invariant: among similar divisions only 5-6% agree by chance, true pairs agree 86-87%, impostors are rejected 84-85% on an area dispute, and the false-falsification rate on true pairs is 0/35 (de). The two quantities (population, area) fail close to independently among impostors (lift 0.94-1.02), so requiring both to dispute would multiply down the false-falsification rate, but it also cuts the power to 39-43% because population is stated and timed in few leads. Area alone is the stronger and wider falsifier; population adds little where it can be checked. On dev, area agreement rescued every true pair that a population dispute would have falsified (6 of 6): area works as the tie that a text window could not provide. Not testable on F4 (no true-pair population disputes).
Limits: coverage is narrow (area appears in 5-10% of French leads, 10-20% of German): the frame is silent elsewhere; French true-pair n = 15; the 10%/25% thresholds were declared and not tuned but the "unclear" band holds land vs total area differences (North Holland, Flevoland, Tehran); administrative divisions only; fr/de; regex; the dev pool was reused (disclosed).
