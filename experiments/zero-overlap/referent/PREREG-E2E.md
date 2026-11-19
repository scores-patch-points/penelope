# PREREG-E2E (filed 2026-11-19, before any code for it exists and before its set is fetched)
Question: with the nominate-then-license design (THEORY-IDENTITY.md sections 14-15, WEAVE-REFERENT.md), does licensing a nominated passage from evidence beat the nominations themselves, on a never-read set, with the control arm required? And if not, what is the smaller product that survives?

## The design under test (fixed now)
Per document D and query (a referent b, its NAME, from the Wikipedia link gold as in PREREG-REFERENT-RETRIEVAL.md; standpoint P declared and bylined: "the asker wants the passages of D that are about b"; concerns = b's roles; tolerance none numeric):
1. **Nominate** (SIG pointer, a mark beside the log): EMBED-N, the all-MiniLM-L6-v2 cosine of the NAME against each sentence, the top 20 sentences that do NOT contain the full NAME. The sentences that DO contain the NAME are b's FOLD (the reference passages). The embedder is a nominator only.
2. **Claims**: each paragraph read through khora `readDocument` (language declared by the source and HEARD by khora's language context; a mismatch refuses the read), claims by `gfpClaim` (rel = predicate lemma; ARG0, ARG1 = referent faces; polarity from the clause; ground = the paragraph holon). A claim is SATURATED iff ARG0 and ARG1 are both bound to referents (law L13; no word lists).
3. **Veto** (an Other): `lintGfp` (acyclic relations declared as in PREREG-LINT-REDO.md) over saturated claims only; a nominated passage whose saturated claim is in an ERROR finding with a claim of b's fold in the same paragraph holon is OTHER. A veto witness is recorded (DEF) and the verdict (EVA) names it.
4. **License** (a Same): two-sided Fellegi-Sunter weight `w(x, b) = sum over shared tokens of log10(m/u) + sum over fold-only tokens of log10((1-m)/(1-u))`, `u` the leave-document-out sentence frequency and `m` the leave-document-out rate at which a token of b's fold appears in a gold name-free passage, by power-of-two frequency bin. NULL, the house recipe: for each of 39 seeded draws replace every fold token by a random token from the same frequency bin without the token itself (leave-one-out) and recompute `w`; the threshold is the max over draws; TWO independent seeds (20261119, 20261120) must both be exceeded (the intersection), and the dissent (passed one seed only) is counted, never dropped. A passage is SAME iff `w` exceeds both thresholds and there is no veto. Anything else is HOLD (with the hunger list: the nearest name-bearing sentence and the missing role). Only SAME is returned; OTHER and HOLD are counted.
5. **Return and record**: each returned passage as an address (document sha256, byte span, sha256) re-opened and verified; each verdict written as an entry in the pharos shape `{cell, kind, addr, body, of, basis, by, at, id}` with `id = sha256(canonical)` recomputed at scoring (INS after a DEF seal and an EVA, per section 14); `at` a declared tag, not a clock.
Arms: A0 the nominations alone; A1 nominations + veto; A2 nominations + veto + license (the design); C1 control: the same pipeline scored against ANOTHER target's fold in the same document (seeded); context: NAME and STEM from PREREG-REFERENT-RETRIEVAL.md.

## Sets (by count only)
DEV for building and tuning = the 30 articles of `referent-dev` (already read, rows 30-36; its role is dev). NEW FRESH2 = Category:Featured articles, API order, positions p with p mod 50 = 41, first 60, declared here, fetched ONLY after the code is frozen and its sha256 prefixes entered in an addendum, scored ONCE (a second scoring is REUSED). Queries as before (a target with at least 2 prose anchors, at most 25 per article). Gold: sentences holding the target's link anchors; strata SAME, PARTIAL, DIFFERENT, ZERO, NAMEFREE as before. Known bias, repeated: gold is first-mention-biased, so precision is a lower bound. The hyperlexicon door is not in the loop (it was down) and khora's descriptor lane is not run: neither is part of this test.

## Metrics (coverage beside every rate; bootstrap over DOCUMENTS, 2,000 draws, seed 20261119)
Per arm: |Ret| per query (median, and the share of queries with at least one SAME), precision of the returned set against the gold, recall on NAMEFREE and ZERO, counts of OTHER, HOLD and dissent, and the control arm's SAME rate. Planted arm (N2): for 1 seeded saturated claim per sampled paragraph, a NEG variant appended as a new sentence (as PREREG-LINT-REDO.md), counted among nominations; the duplicate is the control. Verbatim: every returned passage re-opens and every verdict entry's id recomputes.

## Go / no-go (pre-written)
GO for "retrieval by licensed referent" requires ALL of:
- G1 precision: A2 precision at least A0 precision plus 0.10 absolute, and the interval of the difference above 0.
- G2 not vacuous: the share of queries with at least one SAME is at least 0.30, and A2 recall on NAMEFREE is at least half of A0 recall on NAMEFREE.
- G3 control: the control arm's SAME rate is at most half of the true fold's SAME rate.
- G4 verbatim: 100% of returned passages re-open and 100% of verdict entry ids recompute.
Any failure is NO-GO, and the finding is stated as such. On NO-GO the surviving product is: nominate, return verbatim with proof, veto where a saturated claim exists, say Hold elsewhere. That product's own claims are the N-tests below.
- N1 (the veto with saturation): natural false alarms below 0.05 of articles and below 0.02 of paragraphs; planted NEG caught in at least 0.80 of catchable variants; DUP flags 0.
- N2: among planted contradictions, the veto lowers the rate at which a contradiction stays in the returned set to at most 0.2 of its A0 rate, among catchable variants.
- N3: the two-sided weight reaches AUC at least 0.70 and control separation at least 0.75 on at least 300 gold nominations (top-30 for power).
- N4 (stability under append: no earlier Other revoked, no birth id moved) is NOT part of this run: it needs the persistent log of section 14 and is registered as a later test.
- Unjudgeable, not negative: a stratum under 30 gold passages; coverage under 0.25 of queries with any saturated claim is reported as the limit of the veto whatever else holds.

## Not claimed
Anything about languages other than English, about images or audio, about pronoun-only mentions, or about the hyperlexicon. Rates quoted without their set label and stamp are not claims.

## Protocol
Stamp = sha256 prefix of this file at filing, in `PREREG-E2E.md.sha256short`. A change after seeing data goes in an erratum below. The code freeze and the FRESH2 fetch are recorded in an addendum.

## Addenda
(none yet)
