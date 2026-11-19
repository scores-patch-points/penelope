# Penelope's recognition as a design for DEF / EVA / REC (same / other / new frame)

Sources: Ayo, "The Recognition of Penelope: When, How, and Why" (1987); Murnaghan, "Penelope's Agnoia" (2009, scan, OCR'd); Sorrentino et al., PENELOPE atomicity-violation tester (namesake, see below). Labels: [P] from the paper, [I] my mapping.

## What the papers give
1. **Three questions, not one** [P, Ayo]. When (before or after the contest), how (which external clues she had), why (how she weighed them). [I] Sameness is not one bit. EVA should record: at which probe the claimant first passed (when), which probes carried it (how), and why those probes are hard to fake (why).
2. **Recognition is a series of rehearsals, "is and is not a recognition"** [P, Van Nortwick via Ayo]. The beggar interview is a half-credence that the bed finally confirms. [I] This is a third verdict. Not same, not other, not a gap: **new frame**. When the current perspective neither confirms nor refutes, Penelope does not guess; REC opens a different perspective (a harder probe) and judges again. A gap says "I could not see"; a new frame says "this probe cannot decide, here is the next one".
3. **Agnoia is strategic** [P, Murnaghan]. Not-knowing is a stance she holds while she tests. [I] Default Other is the same stance: she withholds recognition on purpose, and the withholding is a reasoned act, logged as such.
4. **Many clues, each weighed, none decisive** [P, Ayo: omens, dreams, prophecies, the scar]. The disguise held against all but one clue (the scar for Eurycleia). [I] Each probe is a separate witness with its own weight; one probe passing (scar) can recognize for one reader and not another, so EVA must say which probe.
5. **The bed token is private and unimitable** [P]. [I] DEF chooses probes whose answer only the real claimant holds: facts of the shared record that a paraphraser cannot reach by surface copying. A probe an impostor can pass by copying words is not a probe.
6. **Disguise by a goddess is a null model** [P]. Athene's disguise is "impenetrable to all mortals" until a probe the disguise does not cover. [I] A paraphrase that survives every surface check (zero shared words) is the disguise; the bed is the deep probe (same effect on the reader).
7. **Mixed audience** [P, Ayo]. Handmaidens are in the room, so she speaks in a code only Odysseus reads. [I] The perspective is part of the test: the same pair can be same for one asker and other for another. The verdict is always "from a perspective".

## The namesake paper (PENELOPE, atomicity violations)
Sorrentino et al.: do not run all interleavings; from one observed execution, mine a small set of alternate schedules that violate atomicity, rerun, verify. [I] Use: **do not try all probes**. From the one reading of the pair, mine a small set of probes that would break the "same" claim (the ones where the two sides could differ), run those, and verify. Probe selection is predicted from the observed structure, not enumerated. That is DEF done cheaply and REC as targeted re-execution.

## Resulting contract (to build next)
- DEF: declare perspective + a small mined set of hard probes before the claimant answers.
- EVA: verdict in {same, other, new_frame}. same only if every probe passes the same way across wordings AND no impostor shape (ant, coord, hypo/hyper, derived, random) passes the same rule. other if any probe fails. new_frame if probes neither pass nor fail (answers are one-side or neither).
- REC: on new_frame, open the next frame from the ladder (new probe family, new licence channel); admit a revision only if accuracy rises and false accepts do not.

## Honest record of today's synonym test (`odysseus.mjs`)
- Result: rule L1 (synonym in either direction) scored BA 1.000, FA 0.000 on 91 pairs. **This is not evidence.** The gold ("same") was made from the same synonym channel that licenses it, so it is circular. A rule that reads the channel always agrees with a gold built from it.
- The "same" pairs are often not same to a reader ("largely store" for "big house", "ennoble" for "lord", "obscurancy" for "night"): the giver's synonym lists include wrong senses. By a reader's eye many of the 25 are false accepts. So the real false-accept rate on the Odysseus side is high and unmeasured.
- Mutual synonymy (L2) licensed nothing: the store's synonym rows are not symmetric. The null rule (L3) therefore never ran.
- English-to-French/German translation links in the store are nearly empty (0 of 10 sampled English words reach the expected French lemma), so cross-language zero-overlap sameness cannot be licensed from this store.
- Not claimed: that the hyperlexicon can license sameness. Needed: independent gold (aligned translations or human-written paraphrases, not built from the giver) and a usage null (co-occurrence in a corpus), then the same ladder.
