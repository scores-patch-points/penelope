# RESULT: Penelope's equivalence judge, first run (2026-11-14)

Pre-registration: `PREREG.md`, sha256 731a8ef7…, stamped 2026-11-14T22:30:27Z, before the judge's code and before any pair was seen under both grounds. Numbers: `RESULT.json` (written by `gym/equivalence-run.mjs`). Development data only: the text finder's own dev run, 56 pairs, ladder [casual, strict]. The judge read the finder's stops and nothing else; labels were joined afterwards.

## The main finding was not one of the predictions
Only 21 of 56 pairs are decided at both rungs. Undecided at casual: 13. Undecided at strict: 32 (24 where the finder's own searches disagree and it reports "both", 4 where a required branch could not be said, 4 with no strict row at all). So on this data the ladder mostly does not produce a first difference from same to different. It produces a first difference from same to UNDECIDED: 20 pairs are same at casual and undecided at strict.
Of those 20, 14 are labelled OTHER and 6 SAME (types: N 11, P 6, D 3). Not pre-registered, so an observation only: the place where the stricter frame cannot decide is mostly where the looser frame said "same" about a pair the labellers call different.

## Predictions
| | claim | result |
|---|---|---|
| P1 | the ladder is an order: no pair same at strict and different at casual | PASS, 0 of 21 decided at both |
| P2 | a contradiction is different in every frame | PASS on the 4 of 10 CONTRADICTS pairs decided at both; the other 6 are undecided at one rung or both, so the claim is untested on them |
| P3 | flips (same at casual, different at strict) are not mostly paraphrases | TOO FEW TO JUDGE: 1 flip (labelled OTHER, type D). Not a pass |
| P4 | accumulation against the standing (reported) | 0 pairs same with a surviving distinction, 0 different with none, at either rung |
| P5 | casual's surviving distinctions are a subset of strict's (reported) | 17 of 21 |

## Against the split itself
The pre-registration said: if every pair has the same verdict at both rungs, the calculus adds nothing here. One pair has a decided first difference. In the sense that was pre-registered, the calculus adds almost nothing to the geometry on this data. What it does add is the range: for 35 of 56 pairs it says which rung the verdict is incomplete over, where a single-ground reading would have returned one answer.

## Classes (casual > strict), by label
same > same: 16 (SAME 13, OTHER 3). same > undecided: 20 (SAME 6, OTHER 14). same > different: 1 (OTHER). different > different: 4 (CONTRADICTS). different > undecided: 2 (CONTRADICTS). undecided > different: 3 (OTHER). undecided > undecided: 10 (OTHER 4, SAME 2, CONTRADICTS 4).

## What is and is not shown
Shown: the judge runs on real stops, refuses without a declared ladder, never says "same" without a rung, and reports its range. Its three marks pass her own door's admission (`organs/equivalence.test.mjs`, 10 of 10).
Not shown: that it tells paraphrases from non-paraphrases. It cannot be better than the finder's stops, and 3 pairs labelled OTHER are same at both rungs. Two rungs give one step; a limit over two rungs is not a limit. The ladder's order is this session's declaration and both grounds are unratified drafts. "both" was mapped to undecided before the run; mapping it otherwise would change every count above. Nothing was run on unseen pairs, and the finder's frozen hold-out was not read.

## What it would take to say more
A ladder with more rungs, declared by the person; the finder's strict ground deciding more pairs (or its "both" being split by layer, which the stops already carry); and a set where labellers disagree, to test whether frame-dependence tracks human disagreement.

## Addendum, same day, AFTER the run: the finder owner's reading of "both" (post hoc, not pre-registered)
The text-finder session, which owns the stops, answered three questions after seeing the result above.
1. **"both" is a decided not-same, not undecided.** Its frozen hold-out rule is: same only when the standing is exactly "is". "both" means not the same with something shared, and the direction is in the stop's `whole` field. Undecided is only `unsaid`.
2. **It intends NO order between casual and strict.** The two grounds differ in two respects at once: the reader (quick against deliberate) and when it walks into the parts (casual always, strict only when the whole says no). Casual is looser in its reader and stricter in its coverage. So "casual < strict" is this session's declaration and an observation on this set, not a property of the grounds. A ladder with a limit needs rungs that differ in one declared respect.
3. **The four pairs with no strict row are unfinished runs**, not refusals.

The pre-registered reading stays the result of record. The same stops under the owner's reading (`--both different`, `RESULT-both-different.json`), side by side:

| | pre-registered ("both" = undecided) | owner's reading ("both" = different) |
|---|---|---|
| decided at both rungs | 21 of 56 | 48 of 56 |
| undecided at casual / strict | 13 / 32 | 0 / 8 |
| same at casual, different at strict | 1 (OTHER 1) | 18 (OTHER 13, SAME 5; types N 11, P 5, D 2) |
| same at both | 16 (SAME 13, OTHER 3) | 16 (SAME 13, OTHER 3) |
| different at both | 4 (CONTRADICTS 4) | 14 (CONTRADICTS 6, OTHER 6, SAME 2) |
| P1 order violations | 0 of 21 | 0 of 48 |
| P2 contradictions different at both | 4 of 4 decided | 6 of 6 decided (4 of the 10 are undecided at strict) |
| P3 share of flips labelled SAME (bar: at most 37.5 percent) | too few (1 flip) | 5 of 18 = 27.8 percent |
| P5 casual's distinctions a subset of strict's | 17 of 21 | 42 of 48 |

Under the owner's reading the first difference is no longer rare: 18 pairs are same under casual and different under strict, 13 of them pairs the labellers call OTHER. That is the finder's known trade seen pair by pair (strict catches changed pairs and loses some paraphrases: 5 SAME pairs flip, 2 more are different at both). The relation the strict stop reports for its 24 "both" rows: apart 14 (OTHER 9, SAME 3, CONTRADICTS 2), a contains b 6 (OTHER 5, SAME 1), contested 4 (SAME 3, OTHER 1).

**How much weight this carries:** little. The mapping was changed after seeing the first result, on the owner's word, so P3 "passing" here is not a pre-registered pass. And with no intended order between the two grounds, the "first difference" is a difference between two readers and two coverage rules at once, not a step along one dimension. What it does show is that the judge's output depends heavily on a reading the judge does not own, which is a reason for that reading to be a declared, bylined input (it now is: `both`), and for the next ladder to be built from grounds that differ in one respect.
