# Zero-overlap sameness: capability ledger (2026-11-18)

Every row is a claim with its split label, its stamp and a command that reproduces it. A row is only as good as its label: DEV, FRESH (a set read once under frozen rules) or EXPLORATORY. Negative results are rows. Data (Wikipedia leads, Gutenberg/Zenodotus texts, MRPC) is NOT committed; the fetch scripts regenerate it. Stamp = sha256 prefix of the pre-registration at filing; later addenda are appended in the same file.

| # | Capability / claim | Result (split) | Stamp | Reproduce (from the folder, data present) |
|---|---|---|---|---|
| 1 | Cross-language sameness, play text EN vs FR (usage lexicon vs seeded shuffle null) | HELD-OUT once: true pair same 34.0%, scene-mate suitors 5.8%, BA 0.641 | dd6adb4e754eeb30 | `python3 bilingual/judge.py held` |
| 2 | Same, EN vs DE | HELD-OUT once: 27.1% / 6.7% / BA 0.602 | 57ad84be7a45ba28 | `python3 bilingual/de/judge.py held` |
| 3 | Independent Wikipedia leads, Latin script (fr, de) | NEGATIVE: plain shared-token overlap beats the learned lexicon on every stratum | 457fec71f83cfb57 | `python3 wikipedia/judge.py held fr` |
| 4 | Frames are NOT independent (rate^k is false) | DEV: k_eff 1.94 (fr), ~2.2 (de) of 3; lifts 4.7-8.5 | 9dd3f25a8c36383f | `python3 wikipedia/indep.py fr` |
| 5 | Relations frame (shared ordered entity pairs) | DEV: REFUSED; the entity-count control matches it | ce09f79c7b415cac | `python3 wikipedia/rel.py fr` |
| 6 | Same-language paraphrase (MRPC) | HELD-OUT once: plain overlap BA 0.529; usage adds nothing on dev; hard suitors pass 87% | 0450742b27a3b55d | `python3 mrpc/mrpc.py dev` then `held` |
| 7 | Adversary arm (an impostor that has read the ladder) | DEV: informed impostor passes the 3-frame ladder 0.4-0.9 vs natural 0.03; seeded null not adversarial | a85610dc544241ae | `python3 wikipedia/adv.py fr` |
| 8 | Forging cost per frame | DEV: median tokens to forge: numerals 1, overlap/entities/relations 2, usage 5; accuracy and cost run opposite ways | 2611b9e97f2b751d | `python3 wikipedia/cost.py fr` |
| 9 | Difference-finder frame (user's equivalence definition), forms D and D2 | DEV: D forged at 0.98 (ratio dilution); D2 fails both falsifiers | c3f119b726a66078, 5044474cc68c62d6 | `python3 wikipedia/dmd.py fr [D2]` |
| 10 | Invariant claims: birth/death year from the lead | HELD-OUT once: true pairs 0 of 20 / 0 of 54 falsified; suitors with claims rejected 99.5%; coverage 6% fr / 17% de | a7841d82963dabe9 | `python3 wikipedia/claims.py fr held` |
| 11 | Fluent claim (population as of a year) with time and drift | coverage <3%; most covered pairs BLOCKED for missing year; referent errors | 58dc757d6c074c39 | `python3 wikipedia/fluent.py fr dev` |
| 12 | Inferred time as a carried dependency | DEV: launders junk claims into disputes (fr true pairs 10/13); organ default: inferred time cannot dispute | ba0c394ca18a63d2 | `python3 wikipedia/time.py fr` |
| 13 | Referent-aware extractor R2, fresh sets F1 (states/capitals) and F2 (divisions) | stated-time true pairs 0/15, 0/9 on F1; 5-7% disputed on F2 (interval upper 0.13-0.19), de suitor rejection 0.70: a stated year is not enough | 474e23828991e4fd, 2c656402da3f902c | `python3 wikipedia/fluent2.py fr fresh2-fr.json` |
| 14 | Subject-tie (T1 competitor rule, T2 role markers) | T1 collapsed coverage; T2 failed on fresh F3 (de 3/35 disputed, fr coverage 1.4%) | 7650f92f1297ae11, e1170c32c4d2711a | `python3 wikipedia/fluent3.py fr fresh3-fr.json` |
| 15 | Area as an identity-like invariant and as the tie | FRESH F4 once: true pairs agree 0.86-0.87, suitors agree by chance 0.05-0.06, area dispute rejects 0.84-0.85, 0/35 false falsifications (de); coverage fr 4.9% | 3ca64a2b015ef8ea, e246a1935451fd65 | `python3 wikipedia/corrob.py fr fresh4-fr.json` |
| 16 | Relation fold at three grains (ground same thing / figure same facts / pattern same kind) | EXPLORATORY on already-read F1-F4: ground 8-9% coincidental accepts, figure informative, pattern uninformative with four labels | 068ab7afa51b02ba | `node wikipedia/fold_run.mjs` after `python3 wikipedia/fold_dump.py` |
| 17 | khora binding layer (5b) on English leads | EXPLORATORY: 79 of 205 directed links clear all three nulls; entity register was a string stand-in (now ruled out by the referent rule) | khora-run/NOTE-BINDING.md | `node khora-run/run-binding.mjs <leads.txt> en` (needs khora checkout) |

## What the organs hold
`organs/frame-verdicts.mjs`, `organs/relation-fold.mjs` and `organs/vantage-verdicts.mjs` judge ladders, claims and folds GIVEN BY THE CALLER; the frames themselves (overlap, usage, numerals, area, ...) live in the scripts above, not in the organ. No organ here writes marks to a pharos log yet.

## Known limits
Fresh sets are small and fr/de only; held-out acts used by earlier frames were reused by later ones (disclosed per row); every extractor is regex; zero-overlap sameness with NO anchor at all (no number, no name, no area) is still unsolved: the fold returns "gap" there.
