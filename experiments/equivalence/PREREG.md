# PREREG: Penelope's equivalence judge, first run (calculus over Janus's geometry)

Written 2026-11-14 BEFORE the judge's code exists and before I have looked at any pair's verdicts across grounds.

## Where this comes from
The person, 2026-11-14: "penelope is likely the system that would be figuring out DEF EVA REC, which is how we know when two paraphrases are equivalent", then "let janus handle geometry, penelope handles calculus". Standing rulings this follows: a tolerance is "a DEF of an EVA" (EVA gives the exact difference, DEF measures it in a declared unit); "neighborhoods are bounded by differences that make a difference" (found by widening, never declared); sameness is per frame (GL-TL-02).

## The split, as built here
- GEOMETRY is Janus's and is not redone here: where two texts part, and what stands on each side. The text finder (`ledgers/finder-text`, ported as janus#39) returns, for a pair under ONE declared ground, a stop: a standing, its distinctions (each with layer, kind, place, survives), and what it searched.
- CALCULUS is Penelope's: what happens to that result as the frame is varied.
  - DEF: a LADDER of grounds, ordered loosest to strictest, declared and bylined. The judge is refused without one. It types no tolerance of its own: the unit of difference is each ground's own.
  - EVA: for one pair, the verdict as a FUNCTION of the rung, plus its first difference along the ladder (the step at which the verdict changes).
  - The limit: the verdict that holds from some rung to the strictest rung covered. "Same" is only ever said up to a named rung.
  - The integral: the surviving distinctions accumulated per rung, checked against the standing (a standing of "is" with surviving distinctions, or "is-not" with none, is reported, never repaired).
  - REC: when a longer ladder or a new stop arrives, a new verdict is issued `of` the old one, saying what held and what changed.
- The judge calls no model, reads no text, and never looks at a label. It reads Janus's stops only.

## Data (real, development only)
`ledgers/finder-text/dev/`: `information.casual.jsonl` (56 rows) and `information.strict.jsonl` (52 rows), the finder's own development run on the 56 pairs of `dev/pairs.json` (labels: 21 SAME, 25 OTHER, 10 CONTRADICTS, two labellers who agree on all 56; types P 21, N 19, D 8, C 8). This set is already spent for the finder. The finder's frozen hold-out (`holdout/`, `out/`) is NOT read here.
Ladder declared for this run: [casual, strict], by this session, from the grounds' own descriptions (strict is "an auditor's baseline"). Both grounds are drafts not ratified by the person. Two rungs is the thinnest possible ladder: a first difference exists, a second does not.
Mapping from the finder's four values, fixed now: `is` and not unsaid = same; `is-not` and not unsaid = different; `both`, `neither`, unsaid, an error, a refusal, or a missing row = undecided at that rung.

## What I already know (disclosed)
Aggregate finder results on another development set (84 pairs): under strict it kept 16 of 21 paraphrases and caught 27 of 31; under casual 20 of 21 and 17 of 35. I have seen one row of the 56-pair strict file (AW001: is-not; labelled OTHER). I have not seen any pair's verdict under both grounds, any count of flips, or any breakdown by type.

## Predictions (bars fixed now; each can fail)
- P1 THE LADDER IS AN ORDER. No pair is same at strict and different at casual. Bar: 0 such pairs among pairs decided at both rungs. One or more: the declared order is wrong for these grounds, and the judge's DEF fails.
- P2 A CONTRADICTION MAKES A DIFFERENCE IN EVERY FRAME. Among the 10 pairs labelled CONTRADICTS that are decided at both rungs, 0 change verdict along the ladder, and all are different. One or more flips or sames: fails.
- P3 FLIPS ARE SMALL DIFFERENCES, NOT PARAPHRASES. Among pairs that are same at casual and different at strict, the share labelled SAME is at most the share of SAME in the set (21/56 = 37.5 percent). Higher: fails (the strict rung is then mostly breaking paraphrases, and the first difference is noise, not a tolerance). If fewer than 5 pairs flip, P3 is reported as too few to judge, not as a pass.
- P4 ACCUMULATION AGREES WITH THE STANDING. Reported, no bar: per rung, how many pairs are same with at least one surviving distinction, and how many are different with none.
- P5 DISTINCTIONS ACCUMULATE WITH STRICTNESS. Reported, no bar: for pairs decided at both rungs, how often the casual rung's surviving distinctions (keyed by layer, kind and side text) are a subset of the strict rung's.

## What would count against the split itself
If P1 fails, or if every pair has the same verdict at both rungs (no first difference anywhere), then on this data the calculus adds nothing to the geometry, and that is the finding.

## Limits
Development data, two rungs, one question shape (information), English, 56 pairs, labels by two AI labellers who never disagree (so frame-dependence cannot be tested against human disagreement here). The verdicts inherit every limit of the finder's readers. Nothing here shows the judge works on unseen pairs.
