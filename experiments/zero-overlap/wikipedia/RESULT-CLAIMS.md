# RESULT-CLAIMS: invariant claims (born_year, died_year) from leads, compareClaims as the falsification attempt. PREREG-CLAIMS sha a7841d82963dabe9 + ERRATUM-1/1b. claims.py; claims-held-fr.log, claims-held-de.log.
Rules frozen after the dev read-through (7 true-pair "disputes", all extraction bugs, fixed in two erratum steps; dev then 0 disputes). Held-out (acts>=4) run once.
HELD-OUT: fr 325 pairs, de 316 pairs.
- Coverage (both sides give a shared claim kind): fr 20/325 = 0.062, de 54/316 = 0.171. The frame only speaks for people with a life span in the lead.
- True pairs among covered: survive 20/20 (fr), 54/54 (de); falsified 0 (falsifier 1 not hit).
- Suitor pairs with claims on both sides: falsified 0.995 (fr, n=380) / 0.995 (de, n=2756); survive by coincidence 0.005. When the claims exist, an impostor is rejected 99.5% of the time and a true pair is never rejected.
- Falsifier 2 read literally (suitor pairs of covered claimants, holes counted): fr 0.363 falsified, 0.635 NONE (the suitor's lead has no life span, so nothing can be said), de 0.995. So in French the frame is silent on 63.5% of suitors; HIT under the literal reading, not under the "claims on both sides" reading. I report both.
- Falsifier 3 (coverage < 0.05): fr 0.062 and de 0.171, narrowly not hit; a stark limit.
Reading: an invariant claim is a clean falsifier (your definition: a meaningful difference, found in a frame, defeats equivalence) and a token-stuffing adversary cannot move it because it cannot change the lead's own first parenthesis. But it only reaches a small corner (biographies), and silence is a hole, not a vote.
Not tested: fluents (population, offices, locations at times: no extraction yet); non-person invariants (founding, area); a rewriting adversary (fabricating a biography is the open attack); Russian; whether true pairs without life spans can be settled.
Disclosure: the held-out acts were used by earlier, different frames; this frame learned nothing from them, rules were frozen first, and it ran once.
