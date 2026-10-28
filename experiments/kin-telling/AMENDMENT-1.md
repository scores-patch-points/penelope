# AMENDMENT 1 to PREREG-G1-3-COMPOSER.md (sha256 36cecb11beaef6cd45cc1a0f73330b370bdcc7b3f8166f6e856366a024d0a77d)

Written 2026-10-28 by `g1-3-composer`, after development runs on the DEVELOPMENT window and on a synthetic growth fixture, BEFORE any
held-out run (the held-out text, fold values, questions and replies are still unopened beyond what the registration discloses). Each item is
a change forced by what a development run showed. Bars, thresholds, arms and controls are unchanged. The registration file is not edited.

1. **GLOSS standing is a `row` string.** In the GLOSS skeletons the `{standing}` slot is the `standing` field of the ParallelNames row (a giver-file string,
   address `parallel-names@<sha8>:val:rows/<i>/standing`), not a `rec` string. Appendix A said "record string" for every `{standing}`; this one is a row.
2. **Lawful variants only (R9).** The composer takes only variants whose sentence satisfies the checker's laws L1 to L3 (opens with a capital letter or a quotation mark,
   ends with a full stop, quotes and parentheses balance); among them the first whose opening word differs from the previous sentence's. Found on development: SEX
   variant 2 opens with a giver id that begins lower-case (`text:ru gives …`) and failed L1. A forced variant policy (B8) takes the nearest lawful variant.
3. **C5 relevance reaches two steps.** A claim is relevant if it is about the question's subject or a being within two steps of it over the stated kin facts
   (parent, sibling, spouse, term). Found on development: the recorded gaps name a sibling slot of a derived sibling, which is two steps from the subject.
4. **A composite term the text states outright** (a `term` fact; a derivation with no rule step) is composed as REL with the composite term, not REL-D, and the
   checker accepts it when a `term` fact between exactly those two beings has the standing shown. Identical claims from several derivations are composed once.
   Found by the growth fixture: the first version crashed on such a derivation.
5. **MISS names the head atom, and is composed only when true.** The head slot of a composite's rule is recorded by janus without the sex (a `no_parent_fact` for
   `maternal uncle` is "no mother"): the composer states the head ATOM of the cell's rule (mother, not parent). A MISS or MISS-OPEN sentence is composed only if it is true
   of the facts the composer holds; a recorded gap the facts contradict (janus emits `open_world_empty` whenever a sibling exists, though its detail says "confirmed
   male") is listed in the document's `inexpressible` notes and reported, never composed. Found by the growth fixture. The checker accepts a sexed atom in MISS (no holder of that atom exists).
6. **Mutants (B5).** M4 is the reversal of the relation term of a REL (parent to child), M5 swaps the two names of a REL, M10 moves a MISS to a being that holds the
   first listed term; each is generated only if the mutated claim is FALSE under the generator's own small truth table, which is separate from the checker; a mutant still
   true under the fold is equivalent and skipped (the generator reports the counts). The pre-registered "replace a kin term by another lexicon term" could not be
   decided without such a table.
7. **Patronymic support (C4)** tolerates case endings: a token supports a name-parts sex candidate if it ends with a patronymic suffix of the prior or with its stem
   followed by at most three letters (-овны, -овне, -овной). Development has no case where it matters; it is a robustness fix made before the held-out.
8. **B3(b) audit** counts a recorded gap as stated when a MISS names any lexicon atom of the slot's relation and end (parent, father or mother for a missing parent),
   the checker having verified the sentence true.
9. **Count correction.** The registered frame set has 41 words (the PIPELINE-LOG entry that registered it said 42; the file is the authority).
10. **Reading notes fixed before the held-out:** the composer states kin from the other person's side only ("X is the parent of Y" in Y's paragraph, not "Y is the child of X"); on development this
    costs 1 of 32 recall items (Q20); it is reported, not fixed. "The text states no …" means "no fact the extractor bound from the text states it"; the UNB sentence counts the kin words it could not bind.
11. **B10** is built by `growthFixture` in gym/kin-telling-lib.mjs (invented names; janus `deriveKin` at 9fe6d918 answers; the real kin lexicon) and is run in the unit tests and reported with the development window.
