# GL-DF-01 — the percentile cut in `dmdFold` is saturated; the exact rule replaces it

Date 2026-11-23T20:24Z. Probe: `experiments/dmd-fold/probe.mjs` (sha256 d8057e6676b1e225), output `probe-output.txt`. Reproduce: `node experiments/dmd-fold/probe.mjs` (no corpus, nothing downloaded; seeded LCG 12345).
Label for every number below: **EXPLORATORY**. The known cases were authored by the same hand that saw the old rule fail on them, so "new 9/9" is a regression table, not a held-out measure. No real reader output has been run through either rule.

## What was claimed, and what the code does

The essay says: other iff Δ(F_a, F_b) ≥ τ or the polarity differs, τ = the 95th percentile of Δ over 60 shuffles of the entities. As coded (`organs/relation-fold.mjs`, `dmdFold`) that is true, and it does not do what the sentence promises.

A shuffle of participants almost never reproduces an edge of the other fold, so most shuffled deltas equal the largest possible delta (|A| + |B|), and the 95th percentile is that maximum. `actual >= p95` then holds only when the two root sets share (almost) nothing. "Other" reduces to "no shared root edge".

## Measured

Known cases (9), old rule against the answer a reader would give (the old rule has no gap, so for a gap either "other" is accepted):

| case | want | old | new |
|---|---|---|---|
| agent/patient reversed, recipient kept | other | **same** | other |
| 5 root edges, 1 agent changed | other | **same** | other |
| 5 root edges, 4 changed | other | **same** | other |
| one identical entity, identical folds | same | **other** | same |
| identical / dative alternation / partial description | same | same | same |
| different event, or no root edge at all | gap | other | gap |

Old 5 of 9, new 9 of 9. The old rule is not unstable: seeds 1..200 and swapping the pair give 0 verdict flips on the 9 cases. The 60 shuffles and the seed were not the problem; the cut sat on a saturated tail.

Random unrelated folds (N = 400, three root edges each, 8 entities, one event; truth is "same" only if all three edges are shared):

| shared edges | pairs | old said same | new same | new other |
|---|---|---|---|---|
| 0 | 289 | 0 | 0 | 289 |
| 1 | 93 | **93** | 0 | 93 |
| 2 | 17 | **17** | 0 | 17 |
| 3 | 1 | 1 | 1 | 0 |

The old rule called every pair that shared one or two edges "same" (110 of 110 pairs; 111 with the identical pair). Caveat: every pair in this set fills the same three slots, so the new rule's column follows by construction (a different filler is a dispute). The set measures the old rule's failure, not the new rule's strength; holes, symmetry and coincidence are covered by the unit tests, not by data.

## The replacement (`dmdFoldExact`, `sameOrOtherExact`)

No percentile, no trial count, no seed. A slot (the kartṛ of an event) filled with disjoint fillers is a dispute: other, no null. A slot filled on one side is a hole, never a vote. Agreement is evidence of sameness only if no relabeling of the entities that moves the agreeing edges agrees as much (the destroy test on identities); the null is enumerated exactly, so there is nothing to sample. Where the pair sits in the null (`evidence.p`) is reported and not cut.

## Still declared (not derived), and named so

- `roots` / `inverse`: which labels are identity-bearing and hold one filler per event. Default the four kāraka roots, giver Pāṇini. Not measured here.
- `budget` = 362880 (9!): the largest exact null enumerated (9 agents of one event took 268 ms). A compute guard: over it the answer is the typed gap `null_too_large`, never a sample.
- Polarity: a negation or modality difference decides "other" even over identical edges. A policy, unchanged from `sameOrOther`.
- No numeric tolerance is offered: equal values are the only agreement.

## Limits kept

1. **The gap rate on real pairs is unmeasured, and may be high.** A shared slot needs the same event end2 on both sides. Two texts that say "gave" and "handed" share no slot unless the reader anchors both to one event; then the answer is gap, not same. `dmdFold` / `sameOrOther` are not wired to any runner, so no real fold has been through either rule.
2. A pair that shares one edge among several is now a gap (coincidence the vocabulary can produce), where the old rule said same. The caller defaults a gap to Other; whether that is the right default for a retrieval use is not measured.
3. A symmetric fold (two agents x, y) against a one-agent fold cannot say which agent is which: gap. That is the honest answer for the structure alone; the anchors, which are given identities, are not used to break the tie.

## Falsifying control

A pair whose root slots are filled with different fillers returned as `same`; a pair sharing one edge among three, with a relabeling that moves the edge and agrees as much, returned as `same`; identical folds with no spread in the null returned as `other`; a verdict that changes when the pair is swapped, when every entity is renamed, or when the seed changes (there is none). Each of these is a test in `organs/relation-fold.test.mjs`, and each was checked by mutating the implementation (six mutants, all caught). A real-pair run in which the gap rate is so high that the rule decides almost nothing would refute "the replacement is usable", not "the old rule was wrong".
