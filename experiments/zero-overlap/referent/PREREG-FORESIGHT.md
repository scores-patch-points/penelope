# PREREG-FORESIGHT (filed 2026-11-19, before the evaluation code exists and before its set is fetched; ledger row when scored)
Question: on real documents, does the foresight gate of THEORY-IDENTITY.md section 18 (`compare/foresight.mjs`) separate true aliases from random merges, and does it add anything beyond hindsight alone?

## A revision of the gate, made BEFORE any real-data run (erratum to section 18, to be entered in the theory when the code is changed)
Section 18 admits an event when foresight exceeds median(null) + 1.4826 x MAD(null). That threshold is one robust unit, about one standard deviation, so a random merge exceeds it about 16% of the time by construction. That contradicts the house standing alpha of 0.05 (Zenodotus concern-priors: the null is the text's own population, the floor is the MAX over seeded draws, resolution 1/40 = 0.025, and a second independent seed must also be beaten, the intersection, with the dissent counted). The gate is therefore REVISED to: draw 39 random merges with seed 20261119 and 39 with seed 20261120 (the same kind, between other beings of the same document, over the same cut); ADMIT iff foresight > 0 AND foresight exceeds the MAX of the first null AND the MAX of the second (the intersection); an event that beats exactly one is a DISSENT, counted and not admitted. The other rules of section 18 (at least 3 later mentions, at least 30 candidate random merges, typed gaps, merge only) are unchanged. Expected false admission of a random merge: at most about 0.025 per seed if the null is exchangeable with the control.

## Gold (independent of the run; Wikipedia link markup)
For each document, the reader's referents (khora `readDocument`, language declared as English by the source and also HEARD by khora's language context; a mismatch refuses the document and is counted) are mapped to link TARGETS: a referent maps to target T when the majority of its mentions that overlap a link anchor (at least half of the mention inside the anchor) point to T; a referent with no linked mention, or a tie, is not mapped. GOLD TRUE ALIAS = two DISTINCT referents, written as different spellings, that map to the same target T, and that the base alias rule (token subset, case kept) does not already call the same. Targets are the redirect-resolved titles saved by `fetch_docs.py`. Links are gold only, never an input to any sense or to the gate.
ELIGIBLE: a true alias whose two referents have at least 3 mentions after the CUT together, where the cut is the end of the later of the two referents' first mentions (the earliest point at which a merge of the two can be proposed).

## The events and the controls (fixed now)
- Real event: a merge of the two written spellings, cut as above, gated on its document.
- Control events: for each eligible true alias, up to 5 random pairs of distinct referents of the same document that are not gold aliases and not alias-by-name, matched on the power-of-two bin of each referent's mention count, with at least 3 mentions after the same cut; if fewer than 3 matched pairs exist the unmatched fallback is used and counted.
- Hindsight-only gate (the comparison): admit iff the event's HINDSIGHT (surprise removed at or before the cut) is > 0 and exceeds the max of the same two nulls computed on the hindsight region.

## Sets (by count only)
DEV for debugging the evaluation code only: the 30 articles of `referent-dev` (already read; nothing from it is a claim). The scored set F9: English Wikipedia Category:Featured articles in API order, positions p with p mod 50 = 31, the first 60, declared now; disjoint by construction from referent-dev (p mod 50 = 7) and referent-fresh (p mod 50 = 23); the set reserved for PREREG-E2E (p mod 50 = 41) is NOT used here. Fetched by `fetch_docs.py` (a mod-31 rule added at the freeze) only after the code is frozen and stamped, read and scored ONCE.

## Measures (coverage beside every rate; bootstrap over DOCUMENTS, 2,000 draws, seed 20261119)
Admission rate of eligible true aliases; admission rate of control pairs (foresight gate and hindsight-only gate); the dissent counts; median foresight and hindsight of true aliases against controls; Spearman between hindsight and foresight across true aliases (reported, no threshold: khora's K3); counts of documents, referents, gold pairs, eligible pairs, typed gaps and language refusals.

## Falsifiers (pre-written)
- F1 (power): fewer than 30 eligible true aliases pooled: every other falsifier is UNJUDGEABLE, not negative; the counts are still reported.
- F2: the foresight gate admits fewer than 0.50 of the eligible true aliases: hit.
- F3: the foresight gate admits more than 0.05 of the control pairs: hit (the null is not exchangeable with the controls).
- F4: the bootstrap interval of (median foresight of true aliases minus median foresight of controls) has a lower bound at or below 0: hit.
- F5 (hindsight alone): the hindsight-only gate's admission rate on controls is not above the foresight gate's by at least 0.05 absolute: hit (foresight adds nothing over hindsight; "never admit on hindsight alone" would be unsupported).
Not claimed: anything about pronouns or descriptions (named referents only), other languages, cross-document merges, cannot-links, or whether foresight tracks the correctness of a verdict as opposed to an alias.

## Protocol
Order: this file is filed and stamped first; then the revised gate and `foresight_eval` are written, tested (the existing 6 foresight tests updated to the revised rule) and run on the 30 DEV articles (debugging); then FROZEN, their sha256 prefixes entered in the addendum; only then F9 is fetched and scored ONCE (a second scoring is REUSED). A change after seeing data goes in an erratum. Stamp: sha256 prefix of this file at filing, in `PREREG-FORESIGHT.md.sha256short`.

## Addenda
(none yet)
