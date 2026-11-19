# RESULT-ADV: the adversary arm, fr and de dev (PREREG-ADV sha a85610dc544241ae + ERRATUM-1). DEV ONLY. Code adv.py; logs adv-fr.log, adv-de.log.
FALSIFIER HIT. The seeded null does not model an informed adversary. Natural suitor FA of ladder A is 0.031 (fr) / 0.027 (de). With the claimant's text and the ladder in hand, one scene-mate text plus k appended tokens (never changing the suitor's own text):
| strategy | fr FA_adv k=3 / 10 / 30 | de FA_adv k=3 / 10 / 30 | price (smallest k with FA>0.5) fr / de |
| copy names | 0.41 / 0.57 / 0.57 | 0.40 / 0.58 / 0.60 | 10 / 10 |
| licensed partners | 0.13 / 0.31 / 0.42 | 0.09 / 0.36 / 0.46 | >30 / >30 |
| numerals | 0.73 / 0.73 / 0.73 | 0.66 / 0.66 / 0.66 | 3 / 3 |
| mix | 0.54 / 0.85 / 0.90 | 0.38 / 0.81 / 0.88 | 3 / 10 |
The true pair is hurt as well: with the adversary as one more rival, TP falls from 0.63 / 0.67 (k=0) to 0.03 / 0.02 (mix, k=30), because a forged candidate passing a frame makes it non-discriminating.
Reading: every surface frame (name overlap, the learned lexicon, numerals) can be forged by a handful of appended tokens; numerals cost 3 tokens. The learned lexicon is the most expensive to forge (price > 30), which is a point for usage frames over bare overlap, but still at FA 0.4+ at k=30.
Consequences: (1) admission must report the adversary FA beside the seeded-null FA and refuse on the larger; (2) commit-reveal is necessary but not sufficient here, since the attack is token-stuffing against known frames, not a leaked probe; (3) frames should be ranked by forging cost, not just accuracy.
Caveats: the attack is crude (stuffed tokens are not fluent text, and a text-sanity frame would catch it); the adversary knows the lexicon M and the ladder; one adversary per claimant; dev only; no Russian. ERRATUM-1: the first run had a closure bug (scored all claimants against the last), caught by a k=0 mismatch; its numbers are void.
Not claimed: that any ground/relations-type frame resists forging (untested); a held-out number.
