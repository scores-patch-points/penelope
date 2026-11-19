# PREREG-RESOLUTION (filed 2026-11-19 before the script exists; EXPLORATORY, F2 re-fetched; ledger row 37)
Question: the four-kind classification of differences (THEORY-IDENTITY.md section 16) says a difference between two descriptions of one thing is a Conflict, a Silence, a Resolution (the value belongs to a holon that contains or is contained by the one described) or Accidental. Row 13 found true pairs disputed on a stated year (F2: fr 3 of 42, de 5 of 79) and named sub-entity numbers by hand (Groningen city against province). Are the true-pair population disputes EXPLAINED by Resolution, as the classification predicts, and does the same explanation NOT hold for impostor disputes?
Data: F2 (administrative divisions; Provinces of Italy, Prefectures of Japan, Cantons of Switzerland, States and union territories of India, Regions of France, Provinces of Argentina, States of Germany, Provinces of the Netherlands) re-fetched with `fetch_fresh2.py 900` (the lead length 900 is an ASSUMPTION: the original cut is not recorded beside the F2 fetch; the khora result says "900-character leads"). The set is already read (rows 13, 18, 25): EXPLORATORY, not FRESH. The re-fetched pairs can differ from the original (Wikipedia has changed); the counts are reported as they come out.
Instruments, frozen: the extractor R2 of `fluent2.py` (claim, cmp2, TOL 0.05, RATE 0.03, OBS 2026, W 5) is loaded unchanged. Wikidata is the SCORER only (rule 5): `wbgetentities` claims of the English article's item.
Operationalisation (fixed now):
- DISPUTE = a true pair or a same-scene impostor pair that R2 calls `dispute` (stated-both) or `would-dispute` (untimed-involved).
- For a dispute with extracted values `a` (English side) and `b` (other side), each compared with the item's own population (P1082 with its P585 year; the nearest dated value within 5 years; drift 0.03 per year, tolerance 0.05, as in row 25): the side that does NOT match the item's own population is the OFFENDING number.
- OWN-EXPLAINED: the offending number matches the item's own population: then the pair has a Conflict between the item's two sides only through extraction timing (not Resolution).
- RESOLUTION-EXPLAINED: the offending number matches, within the same tolerance, the population of the item's CAPITAL (P36), of its PARENT (P131, first value) or of its COUNTRY (P17), at the nearest dated value within 5 years.
- UNEXPLAINED: none of the above (extraction error, another sub-entity not in P36/P131/P17, an urban area, a missing value in Wikidata).
For the impostor disputes the same test is run on the impostor's own item (the English article of the pair that is NOT the true counterpart), because an impostor's disagreement should be a genuine Conflict.
Reported: counts per class, with Wilson 95% intervals, separately for the stated-both and untimed-involved disputes, per language; coverage (disputes whose item has the needed Wikidata values) beside every rate.
## Falsifiers (pre-written)
- RA: fewer than half of the true-pair disputes are RESOLUTION-EXPLAINED (among disputes with a usable item): the classification does not explain our own failures. Hit if so.
- RB (the control): among impostor disputes, RESOLUTION-EXPLAINED is as frequent as among true-pair disputes (difference below 0.20 with overlapping intervals): the explanation is uninformative (a random number matches some holon's population too often). Hit if so.
- RC: fewer than 10 true-pair disputes in a language: UNJUDGEABLE for that language, not negative.
Not claimed: any rate beyond F2 administrative divisions, fr and de, population only; that Wikidata is right; anything about FRESH.
## Protocol
Stamp: sha256 prefix of this file at filing (`PREREG-RESOLUTION.md.sha256short`). A change after seeing data goes in an erratum below.
## Addenda
(none yet)
