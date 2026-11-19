# PREREG-LINT-REDO (filed 2026-11-19 before the script exists; DEV, EXPLORATORY; ledger row 33)
Question: with the tie in place (claims at a holon ground, compared only where grounds overlap, roles keyed by ARG0/ARG1), does khora's own lint catch planted contradictions that the embedder merges (row 31 A1: 1,717 of 1,718) and avoid firing on true text (row 31 A2: naive check fired on true pairs)?
Data: the 30 DEV articles (referent-dev; already read: labelled DEV, not FRESH; nothing here is a claim). Read through khora native/reading.js `readDocument` (one door; priors from janus; `lexicon:false`, `referents:true`, `castIdentity:true`, `minCharacters:0`). Lint: khora native/organs/reasoning-lint.js `lintGfp`, strictness "standard". Claims: kernel/gfp-claim.js `gfpClaim`/`claimFromTriple`.

## Claim construction (fixed now)
One claim per reader clause that has a subject: rel = predicate lemma; ARG0 = subject, ARG1 = object when present; polarity = the clause's polarity ("+"/"-"); force "default"; ground = "/p<k>" for the paragraph (line) holding the clause. A role filler is the FACE of the referent one of whose mentions lies inside the subject/object span (largest overlap), else an unbound filler unique to that clause (so it can never conflict). Identity = exact on those fillers. Alternative arm HEAD: fillers are the lowercased head words of the spans (string identity), reported beside REF and not preferred.
Declared relation properties (giver: the experimenter, fixed before scoring; this is a declaration, not a finding): ACYCLIC (asymmetric) = defeat, beat, kill, succeed, replace, found, command, appoint, capture, invade, precede, follow. No relation is declared functional or symmetric.

## Runs
- N (natural, doc level): each of the 30 DEV articles read whole; claims grounded at paragraph holons; lint once per article.
- N-par (natural, paragraph level): a seeded sample (seed 20261119) of up to 15 paragraphs per article with at least 2 sentences, each read alone and linted.
- P (planted): for each sampled paragraph, one seeded clause with a subject, polarity "+" and a bound ARG0 referent; variants appended as a new sentence at the end of the paragraph, then re-read and linted: NEG (negation inserted: "not" after an auxiliary, else "did not <lemma>"), SWAP (subject and object texts exchanged; only clauses with both), DUP (an unchanged copy: the false-alarm control), YEAR (a year in the clause shifted).
- Catch = the planted paragraph has more ERROR findings (by kind) than the same paragraph unplanted. Catchable = the variant yields a claim with the same rel and the same figure (same roles, SWAP: swapped roles) as a claim of the original, so a contradiction is representable at all. Rates are given among catchable AND among all variants, with coverage beside them.

## Falsifiers (pre-written)
- R1: natural false alarms. Hit if ERROR findings occur in more than 5% of articles (N) or more than 2% of paragraphs (N-par).
- R2: NEG caught in fewer than 0.80 of catchable variants: hit.
- R3: SWAP caught in fewer than 0.80 of catchable variants whose relation is declared acyclic: hit. (A swap of an undeclared relation is expected to be missed and is reported, not scored.)
- R4: coverage: if fewer than 0.25 of the sampled clauses give a catchable NEG variant, the lint is blind to most of the text; stated as the main limit whatever the catch rate.
- R5: DUP flagged in any case: hit (the control must flag 0).
- R6: YEAR: the reader emits no value claim, so no year change is representable; counted as a typed gap, not scored.
Not claimed: anything about FRESH or about recall on retrieval; role of the embedder; a number from this run beyond DEV.
