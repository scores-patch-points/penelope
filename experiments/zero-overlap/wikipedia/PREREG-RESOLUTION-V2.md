# PREREG-RESOLUTION-V2 (filed 2026-11-19, before any code for it and before its set is fetched; ledger row 38 when scored)
Follows PREREG-RESOLUTION.md (row 37). Row 37 (EXPLORATORY, F2 re-fetched) found: Resolution to the capital (P36) explains 5 of 11 true-pair population disputes in de (0.455) and almost none of the impostor ones (0 of 206 fr, 68 of 1,599 de); the unexplained ones include holons P36, P131 and P17 do not cover (Delhi city, Hamburg metro) and numbers that look like an AREA read as population (Saxony 18,450). Widening the holons on F2 would be fitting to F2. This file widens them in advance and tests on a never-read set.

## The question
With the candidate holons widened as declared below, are the true-pair population disputes explained by Resolution (or by a misread dimension), clearly beyond what a random holon set explains by chance, on a never-read set?

## The set F8 (chosen by member COUNT only, declared now, not read)
Candidate English Wikipedia categories (none was used in F1 to F7): Departments of France, Oblasts of Russia, Republics of Russia, Provinces of Spain, States of Brazil, Districts of Nepal, Districts of Bangladesh, Districts of Malawi, Provinces of Cambodia, Districts of Serbia, Governorates of Yemen, Districts of Germany, Voivodeships of Poland, Regions of Finland, Departments of Paraguay. RULE: a candidate enters if it has at least 20 direct page members when fetched; at most the first 120 members in API order are taken; a category that does not exist or has under 20 members is dropped, by count only. Direct pages only; scene = category; fr and de counterparts by interlanguage links; plain-text leads truncated to 900 characters; pages already in any earlier set (F1 to F7 and the dev pairs) are dropped. The fetch uses a copy of `fetch_fresh2.py` with only CATS and the output names changed (`fetch_fresh8.py`, sha recorded at the freeze). I do not read the leads before the single scoring.

## Widened holons (fixed now)
For a dispute on a pair whose English article has Wikidata item I:
- H1, relation holons, one hop from I: P36 (capital), P131 (located in), P17 (country), P150 (contains, the first 40 values), P527 (has part, the first 40), P361 (part of), P1376 (capital of).
- H2, text holons: the Wikidata items of the wikilinks in the PROSE of the first 900 characters of the lead of the side whose number is judged (prose by the builder of `referent/lib.py`; link targets resolved to items by `referents.py`; the item I itself excluded).
A holon matches a number when the holon's population (P1082) matches within the frozen tolerance (relative difference at most 0.05 + 0.03 x the gap in years; the nearest dated value within 5 years of the claim's year; an undated claim: the latest dated value, the gap capped at 10 years). A holon with no population is no match and is counted in coverage.

## Classes (fixed now; first match wins in this order, a number matching both of the last two is AMBIGUOUS and counted separately)
OWN-EXPLAINED (the number matches I's own population: not the offending one), RESOLUTION-EXPLAINED (the offending number matches an H1 or H2 holon; recorded as H1-only, H2-only or both), MISREAD-AREA (the offending number matches I's own area, P2046 converted to km2 with the frozen unit table, within 0.05), UNEXPLAINED.
Instruments frozen and loaded unchanged: extractor R2 of `fluent2.py` (claim, cmp2, TOL 0.05, RATE 0.03, OBS 2026, W 5). Wikidata is the SCORER only.

## Controls (fixed now)
- C1 the impostor disputes (same-scene pairs R2 calls dispute or would-dispute), each side judged against its OWN item with the same rules: a disagreement where both numbers match their own item is a REAL CONFLICT.
- C2 RANDOM-HOLON: for each true-pair dispute, the item's H1 and H2 sets are replaced by those of another item from a different scene (seed 20261119, the same sizes) and the match test is repeated. This is the rate at which a candidate set of that size explains a number by chance.

## Reported (coverage beside every rate; Wilson 95% intervals; per language and pooled fr + de)
True-pair disputes (stated-both and untimed-involved), the class counts above, H1-only and H2-only shares, the C1 and C2 rates, and for each unexplained true-pair dispute its extracted numbers and the item's own population and area (for reading, not scoring).

## Falsifiers (pre-written)
- RC2 (judgeability): fewer than 30 pooled true-pair disputes with usable item data: RA2 and RB2 are UNJUDGEABLE, not negative; the counts are still reported.
- RA2: RESOLUTION-EXPLAINED (H1 or H2) below 0.50 of the true-pair disputes with usable item data (pooled): hit.
- RB2 (the control): RESOLUTION-EXPLAINED among true-pair disputes minus the C2 random-holon rate below 0.25 absolute, or minus the C1 impostor rate below 0.25 absolute: hit (the explanation is not informative).
- RE2: the explained share added by H2 over H1 alone is at most the C2 random-holon rate plus 0.05: H2 is uninformative and is dropped from the claim.
- RD2 (descriptive, no threshold): the MISREAD-AREA share among true-pair disputes not explained by Resolution; reported because the claim "reading errors, not differences between true claims" is a hypothesis (row 37).
Not claimed: anything outside administrative divisions and population, fr and de, English Wikipedia and Wikidata as they are on the fetch date; that Wikidata is right; any rate on any other set.

## Protocol
Order: this file is filed and stamped first; then `resolution_test2.py` and `fetch_fresh8.py` are written and run on the F2 files already on disk (dev role: debugging only); then they are FROZEN and their sha256 prefixes entered in the addendum; only then F8 is fetched and scored ONCE (a second scoring is REUSED). A change after seeing data goes in an erratum. Stamp: sha256 prefix of this file at filing, in `PREREG-RESOLUTION-V2.md.sha256short`.

## Addenda
(none yet)
