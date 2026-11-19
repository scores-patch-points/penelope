# RESULT-RATIFY: the frozen extractors scored at the referent level against each article's Wikidata item (PREREG-RATIFY sha e974c72568caa6b5). EXPLORATORY: every set was already read. Wikidata is the SCORER only; no frame used it. ratify.py, ratify-result.log.
Resolution: all 2,614 English titles resolved to a Wikidata item (pairs: 2,388 fr, 2,294 de). The French/German side of a pair is scored against its English article's item (true pairs map to the same item 99.0% fr / 99.9% de, ledger row 20).
Referent error = 1 - match of the extracted number with the item's own value (area within 0.10; years exact; population with a stated year within 0.05 + 0.03 x years apart to the nearest dated value within 5 years; an untimed population against the latest dated value with drift capped at 10 years).
- Land area belongs to the article's own referent: error 0.038 / 0.034 (fr, en side / other side), 0.042 / 0.035 (de). Upper ends 0.062-0.078.
- Birth and death years match the item on every covered claim: error 0.000 on 376 / 140 (fr) and 370 / 364 (de) claims (upper 0.010-0.027).
- Population is the wrong referent about 1 time in 6-7: error 0.15-0.19 overall.
- THE TIE RULE TRACKS THE REFERENT: untied population claims err 0.64-0.67 (en) and 0.46-0.57 (other side) against 0.13-0.17 for tied claims (all counts n = 13-18 untied; n = 171-366 tied).
- A STATED YEAR DOES NOT: stated 0.156-0.168 (en) and 0.140-0.186 (other) against untimed 0.146-0.148 (en) and 0.182-0.200 (other): no lower. Stated time matters for comparing a fluent, not for whether the number belongs to the subject.
- Tied population still errs 0.13-0.17: a text-window tie is necessary, not sufficient (rows 13, 14 again, now measured against the referent itself).
Falsifiers (PREREG-RATIFY): (1) tied no lower than untied: not hit; (2) area error > 0.10 on any side: not hit; (3) life-span years below 0.95 match: not hit.
Not claimed: that Wikidata is right (it has splits and stale values); results are on already-read sets.
