# THEORY-IDENTITY: identity as a fold from a standpoint, with change in its essence
Draft 1, 2026-11-19. A theory, not a result. Every law carries a status (ESTABLISHED = measured in the ledger or khora; EXPLORATORY; CONJECTURE; OPEN) and a falsifier. Sources: penelope BRIEF.md and LEDGER.md rows 1-30; organs/asker-dmd.mjs; khora identity/ (IDENTITY-RESULTS, STOPRULE-RESULTS, LEARNING-ABOUT-LEARNING), native/docs/THE-ADDRESS.md and THE-HOLOGRAPH.md; pharos eoql/prior/owner-surf-sniff-sig and SIG-ANSWER; eodb facade/SIG.md. Nothing here is new data.

## 0. In plain words
Two things are the same, for someone, when no difference between them makes a difference to that person, however closely you look. You get there by folding in more of the record, outward from where they stand, until another step changes nothing. A thing keeps its identity across change because its identity is its birth address, not its spelling, and what changes is its standing: what the record currently says about it. A model that merely finds passages "close in meaning" can nominate; it cannot say they are the same. Only a check that can fail can, and where the check cannot decide, the answer is "hold", which is not "same".

## 1. Primitives (nothing else is assumed)
- **R**, the record: an append-only, content-addressed log of entries `{cell, kind, addr, body, of, seen, by, at, id}`, `id = sha256(entry)` (pharos). Everything below is derived from R; derived things are caches and can be deleted without changing an answer.
- **Address** `a = (doc, b0, b1, sha)`: a byte span with the hash of exactly those bytes. `reopen(a)` returns the bytes or refuses on drift.
- **Standpoint** `P = (C, T, G, t)`: concerns C (facts the asker wants answered), tolerance ladder `T = τ0 > τ1 > ... > τn`, ground G (scope in force), time position t. Declared and bylined BEFORE reading. (asker-dmd `declareAsker`)
- **Being** `b`: a birth id minted at first admission. Never a function of content or spelling.

## 2. Definitions
1. **Standing** `S_t(b)`: the fold of R up to t onto b: the addressed mentions and claims currently attributed to b, each with its evidence and strength. Standing changes; the birth id does not.
2. **Fold** `F_P(x, k)`: the claims of x within reach k, kept only if (a) upstream of a concern of P in the dependency order (the destroy test) and (b) not later in time than what depends on them (the arrow of time). A dependency pointing backward in time is refused as malformed.
3. **Difference that makes a difference at τ**: a pair of claims on one dimension, both strong, both tied to their subjects, consistently timed, differing by more than τ (after allowed drift, capped), upstream of a concern. Anything weak, one-sided, untied or mixed in timing is a **hole**, never a vote.
4. **Discernment**: such a difference together with the entry ids that witness it.
5. **Agreement strength** `s(x,y) = sum over distinct agreeing keys of log10(1 / f(v))`, where f is the frequency of the value in a background that LEAVES THE PAIR OUT. **Knee** `κ = log10(1 / prior odds of coreference)`.
6. **Verdict** `V_P(x, y; τ)` is one of:
   - **Other**: a discernment exists at τ.
   - **Same**: no discernment at τ, `s(x,y) >= κ`, and no concern of P is a hole.
   - **Hold**: otherwise, with a **hunger list** H, the facts whose fetch would decide the pair.
   For retrieval, Hold is not returned. "Default Other" is the RETRIEVAL POLICY (nothing is returned without Same), not a fourth verdict: a Hold is recorded as Hold and may later become Same; an Other is revised only by retracting its witnesses (a recorded entry).
7. **Approach** `A_P(x, y)`: the finest τ_i such that V is Same at every τ_j >= τ_i, with its certificate (the agreeing keys, their strength, H empty). The limit τ -> 0 is never claimed.
8. **Same-being** `x ~_P y`: a witnessed merge entry, computed from V = Same, relative to P and t. A merge is applied transitively only if the closure creates no discernment; a closure that would merge a pair with a witnessed discernment is refused and held (the reviewer's counterexample).
9. **Holographic projection** of a being: a returned part carries `(birth id, grain, ground, act, address)`, so the record, never the consumer, can re-expand it to the bytes and to the neighbourhood.
10. **Change**: an append. New evidence adds entries; standings and verdicts revise by appended `Reassignment` or `Retraction` entries; nothing is erased; the birth id is invariant.
11. **Nominator** N: any process that orders attention (string search, stem, recency chain, khora's cast, an embedder). Its output is a list of candidates and nothing else.
12. **Cut** (the DMD fold): the fold extends outward from P until one more step changes no verdict at P's τ; the reach is the shallowest depth at which dropping everything beyond it changes no conclusion.

## 3. Laws
| # | Law | Status | Falsifier |
|---|---|---|---|
| L1 | Default Other; silence is a hole, never a vote | ESTABLISHED (GL-FV-01, GL-PV-01) | a verdict of Same resting on absence |
| L2 | Birth, not spelling: the address survives rename and refresh | ESTABLISHED in khora: under founder-rule naming 4 beings' addresses oscillated and 25 superseded addresses kept mentions, under birth-rule 0 and 1 | an address that moves when only the spelling moves |
| L3 | Nominate, then license: N never enters V as evidence of sameness; removing every nominator changes no verdict reached from the same evidence | ESTABLISHED as design (owner 2026-11-14; SIG-ANSWER); NOT YET MEASURED for passages | a verdict that changes when N is removed at equal completeness |
| L4 | Asymmetry: an Other is exactly as stable as its witnesses (it changes only by retracting a witness, as a recorded entry); Same is provisional | SYNTHETIC WORLDS ONLY: `different` wrong on 0 of 4,506 same-entity pairs when facts are true; with 10% wrong facts, 4.1% of truly-same pairs called different. Extracted facts are not guaranteed true, so on real text this is not established | an Other that changes without a witness being retracted |
| L5 | Coincidence: agreement counts only above the knee, with leave-pair-out rarity | POST HOC and FAILED AS PREREGISTERED (the stop rule failed S1 and its prior estimate failed S4); see section 8 for passages. What holds: bare agreement is not a merge (74-93% of bare-agreement `same` were distinct things); strength above about 1.3 decades gave false-merge 0.000 at recall 1.00 on a rich world; the stop rule was NOT SHIPPED (S1 failed: recall 0.787 against 0.90, self-counting); leave-pair-out post hoc gave false-merge 0.015, recall 1.00 | a Same above the knee that is a distinct pair at more than the declared rate |
| L6 | Capacity: if the most strength the declared relations could ever supply is below κ, never merge (the poor world); report Hold | CONJECTURE (post hoc on synthetic worlds; the capacity check is unbuilt) | a poor world in which the rule merges and is right |
| L7 | Relativity: V depends on P; two askers may differ on one pair; every verdict is stamped with its P | ESTABLISHED as design (asker-dmd, eodb standpoint-tagged answers) | a verdict returned without its P |
| L8 | Agreement across standpoints: where two standpoints both see, they agree on what they both see, within a shuffle null | WEAKLY SUPPORTED (a different claim: destroy-set agreement above a shuffle null, not agreement on verdicts), EXPLORATORY: dependency grouping survives translation with no shared names, agreement 0.668 fr against null 0.417, 0.590 de against 0.345 (row 18) | two standpoints at the same τ disagreeing on true pairs beyond noise |
| L9 | Forgery: a verdict resting only on forgeable dimensions carries the informed-adversary rate and is capped at Hold wherever an adversary is possible | ESTABLISHED for birth and death (row 27, REUSED: judged equivalent 1.000); land area was forged at 0.94 fr / 0.92 de on 3% coverage with too few true pairs to judge (row 26) | an informed impostor failing against a surface-only verdict |
| L10 | Leibniz limit: indiscernible on every available observable is Hold, not Same; identity is never claimed at the limit, only "stands at τ with this certificate" | DESIGN (identity results: indiscernible pairs held) | a world where holding such pairs loses recall the asker needed and merging them was right |
| L11 | Cut: surf and fold stop on SIG yield, not on a fetch count | EXPLORATORY (the reader's window is measured; retrieval cut untested) | more fetches past the cut that still change a verdict |
| L12 | Verbatim: every returned part re-opens to its exact bytes and refuses on drift | ESTABLISHED (row 30: 82,221 of 82,221 re-open; drift refused 180 of 180 by document and by span) | one part that re-opens to other bytes |

## 4. The retrieval claim (the target the theory must close on)
Given a document D, a being b (birth id), a standpoint P and a nominator N:
`Ret(D, b, P) = { p in N(D, b) : V_P(p, F_P(b); τ) = Same, with certificate }`, each p returned as an address under b's birth id with its verdict entry.
- **Soundness (claimed):** Ret contains no passage with a witnessed discernment against b at P's τ.
- **Completeness (NOT claimed):** recall is reported with coverage; holes and Hold are counted beside every rate.
- **Verbatim (claimed):** every element re-opens (L12).
- **Stability (claimed, untested):** adding evidence revises standings by appended entries and moves no birth address.
Where the reader supplies no fold for p (a pronoun-only sentence with no referent built), V is Hold and p is not returned.

## 5. Where it is closed and where it is open
| Term | Defined by | Status |
|---|---|---|
| Standpoint, tolerance, concerns, holes | asker-dmd | BUILT, 18 tests |
| Fold with the destroy test and the arrow of time | asker-dmd | BUILT (numeric nodes only) |
| Verdicts Other / Same / Hold, hunger list | khora identity-warrant | BUILT on synthetic worlds; stop rule not shipped |
| Leave-pair-out rarity, capacity check | L5, L6 | NOT BUILT |
| Birth address, reassignment, witnessed merge | khora referent ledger | BUILT for names; no noun-phrase or pronoun referents |
| Nominators | row 30 | BUILT and scored |
| Passage fold F_P(p) from a sentence | the reader | OPEN: this is the binding constraint (10% of 3,590 clauses hold two named referents) |
| Facts an impostor cannot write | L9 | OPEN |
| Stability under refresh for passages | L2, 4 | UNMEASURED |
The theory is closed at the level of definitions: every term in section 4 is defined from the primitives. It is NOT closed at the level of evidence: the passage fold and the unforgeable facts are open, and a verdict that needs them returns Hold until they exist.

## 6. What the theory forbids
- A similarity score deciding Same.
- A verdict with no standpoint.
- Counting a pair's own claims toward how common their value is.
- Reading "no mark" as "nothing here".
- Claiming identity at the limit.
- An address that names two things, or a rename that moves a birth id.

## 7. Order of tests (each cheap, each can fail)
1. **Soundness on gold:** among nominated passages, those the license returns contain no passage the link gold marks as another referent; report Hold and refusal rates.
2. **Planted contradictions** (owner's test): near-identical wording with negation flipped, roles swapped or a date changed; count how many the embedder merges and how many the fold catches.
3. **Leave-pair-out rarity:** repeat the row-30 nominations with the coincidence strength computed with and without the pair, and report the shift.
4. **Stability under refresh:** read a document in two thirds then in full; count birth addresses that move (target: zero) and standings that revise.
5. **Cross-standpoint agreement** on passages (L8).
Anything that fails goes in the ledger as a row with its falsifier.

## 8. Falsification attempt 1 (2026-11-19; DEV, EXPLORATORY; `falsify.py`, `falsify-dev.txt`; ledger row 31)
Two attacks: a read-only hostile review of this file, and three runs on the 30 DEV articles. A fourth (stability under refresh, section 7 test 4) was NOT run.
**What survived.** L3's premise: the embedder cannot see what the theory says only structure can. A planted contradiction with the wording almost unchanged (negation flipped, a year changed, two names swapped) was the nearest neighbour of its original in 1,717 of 1,718 cases (negation 724/724, year 302/302, swap 691/692; mean cosine 0.95-0.98). Vectors merge contradictions, as the owner's note says. (The rule-based catch of a planted change is by construction, so it is not evidence.)
**What failed.**
1. **A sentence-level difference check is unsound.** The naive check (year sets disjoint, polarity differs) fires on TRUE same-referent pairs: a year conflict in 16 of 24 pairs with years on both sides (0.667; random pairs 0.938, 15 of 16), polarity differs 0.129 (random 0.163). Two sentences about one being usually describe different events, so a difference means nothing without a tie to the same claim. The theory already says an untied difference is a hole; this shows holes are nearly all of it, because the reader supplies no tie. So Other is rarely licensed to fire, and Same is rarely reachable.
2. **The coincidence-strength license does not license.** Among 3,850 name-free EMBED-N nominations (96 gold, precision 0.025), strength with leave-document-out rarity and a leave-document-out prior licensed 71.6% of them, with precision 0.028: no lift. The same nominations scored against ANOTHER target's fold passed 64.2%. AUC of strength, gold against non-gold nominations: 0.630 over 824 pairs. Of 10 ZERO-stratum gold nominations 7 were licensed, but because nearly everything was.
3. **Soundness is vacuous as stated** (reviewer): "no returned passage has a witnessed discernment" is true of any set, including the empty one. The claim needs a floor: report |Ret| and recall on the gold, and call soundness vacuous if recall is near zero.
**Status changes made above.** L4 restated and downgraded to synthetic-only; L5 downgraded; L9's land-area figure moved to its true row (row 26; I had cited row 27); L8 relabelled; "default Other" made a policy, not a verdict; merge closure restricted. Still true and now stated: Same is unreachable until the reader supplies tied claims for a passage, so the verdict function returns Hold on almost everything.
**Verdict.** The retrieval claim of section 4 is NOT supported. Of its three steps (nominate, check difference, license by strength) the first works (row 30), the second needs a tie the reader does not give, and the third did not discriminate on DEV. This is DEV and exploratory: the strength used rare shared words with a small background of 30 articles, and a better-built strength (entities only, a larger background) might do better, but tuning it on DEV and claiming it would be the mistake this ledger exists to prevent; a new never-read set is needed. Not shown either way: stability under refresh, cross-standpoint agreement on passages, planted-contradiction catch on natural (unplanted) pairs.
**Reviewer points kept open:** L3's falsifier (equal completeness without any nominator) is unmeasurable as written; L10's "recall the asker needed" is asker-declared; L6's capacity check is unbuilt; the 1.3-decade knee is a reading of one rich world, not a measurement.

## 9. Adherence constraints (2026-11-19): what janus already forces, and the literature it matches
**From janus (`native/organs/identity/` README, STATUS, CUBE; `nomos.js`; `consequence-verdict.js`; the seam contract).** These are laws about how parameters must follow patterns. A license that breaks one is refused, not tuned.
1. **A threshold is derived from the ground's own variation, and each quantity owes its own null.** The fold's depth null (median one-hop change) and the displacement null (a quantile of the ground's own displacements) must never be swapped: using the fold null for displacement made `Same` degenerate to "everything different". `land(cell, input)` throws on a null the cell does not owe.
2. **A control that admits anything means the claim does not resolve** (`control_survived`); a null with too few draws for its quantile is refused as underpowered (30 draws cannot resolve a 0.99 quantile).
3. **No lens, no verdict.** A missing lens is a refusal, never `false`. A threshold lens ("mostly the same") is never collapsed into an identity relation; a Theseus-style fission is reported with its givers, not ranked.
4. **Identity needs a discrete ground.** If the ground's displacements barely vary (a continuous ground), there are no figures and so no identities in it; refuse.
5. **Stop at the DMD window**, the shallowest step whose conclusion equals the fixed point, with a typed gap (`reach_exceeds_steps`) when it is not reached. A stop set by a median null reached only about 66% of planted differences; a hub linked to everything blinds shell profiles (KNOWN LIMIT).
6. **A claim is earned only if its premises are**; defeats are preserved on the record, never deleted (`premise_not_supported`, earned / withheld / defeated).
7. **A rule is GIVEN, EXTRACTED with witnesses, or a candidate; never revealed.** `licenseRows` refuses anything claiming more than its provenance.
8. **Order on the cube cannot be skipped**: Structure licenses Existence (`correspond` supplies, `resolve` decides). The seam returns `{settled, reason?, derivation?}` or `{settled: false}`, never a model's conclusion.
9. **Parsers refuse rather than guess** and identity keys are declared, not assumed.
**What this does to my section 8 result.** The coincidence-strength license of attack A3 breaks rules 1 and 2: its threshold came from a prior, not from the ground's own distribution, and its control (another target's fold) passed 64.2% against 71.6% for the true one, which is `control_survived`. By janus's own law the license claim does NOT resolve. The sentence-level discernment of A2 breaks rule 3 and the tie requirement: no lens fixes which claim two sentences are about.
**Literature that matches (pasted by the owner; I have not opened the links, and rough sets and Fellegi-Sunter are from my own background).**
- **Fellegi-Sunter record linkage** is L1, L5, L6 and the three verdicts: frequency-weighted agreement, upper and lower thresholds set by error bounds, a clerical band held for review, provably optimal at fixed bounds. Use it as the yardstick: how much Hold does our rule produce at a given false-merge rate against the optimum? Its known weakness is our L5's weakness: summing agreeing keys assumes the keys are independent. Tokens in a sentence are not, so A3's over-licensing (71.6% of nominations passed) may be correlated keys counted as independent. That is a hypothesis to test, not a finding.
- **Three-way decisions and rough sets** give Hold a cost basis (thresholds from expected loss) and indiscernibility relative to a chosen attribute set, which is our discernment at tolerance.
- **Relative identity (Geach)**: "same" is indexed to a kind or standpoint, so L7. Not every equivalence relation satisfies Leibniz's Law, so L10.
- **sameAs studies**: estimated 2.8% to 20% of `owl:sameAs` links are wrong, and transitive closure over them collapses distinct beings. That is the failure Definition 8's guarded closure addresses; test it.
- **OntoClean**: identity criteria are carried per sortal and rigid properties hold through an instance's life: our birth against standing, and a hint that the tolerance ladder may need one per sortal (person, organisation, passage).
- Reading order proposed: Fellegi-Sunter and Winkler, Raad and Beek on contextual identity and closure, Yao on three-way decisions, Guarino and Welty on per-kind criteria.
