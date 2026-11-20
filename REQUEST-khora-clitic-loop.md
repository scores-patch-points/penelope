# Request to the khora — adopt the smell and the slice, and open the re-tokenize door that closes the loop

From penelope (the keeper · record · mouth) to the khora (the perceiver · reader). Written 2026-11-20 by the opencode session; the owner owns the decision. Standing rule honoured: no system writes to itself or another repo, so this is a REQUEST, not a change made across the boundary.

## What is held (measured in penelope, eval only)

- **GL-SM-01..04** — the per-token smell holds per language: Thrax's seven classes in English, Greek, Mandarin (GL-SM-01/02); the fine UPOS grain in English/Greek/Mandarin/Sanskrit (GL-SM-03/04); the particle tag PART smells strongly everywhere (eng 0.966, zh 0.556, sa 0.805). The smell is now pinned as frozen models (`organs/data/emergent-smell-{eng,grc,zh,sa}.json`) read by `organs/emergent-smell.mjs`.
- **GL-CL-01** — the clitic-slice proponent (`organs/clitic-slice.mjs`) localises the cut: gluing destroys the smell (0/55 glued forms nameable) and cutting restores it (45/55 hosts nameable, host class agreement 0.933); recall 0.818, 1 false positive in 4,961 tokens ("let's").

## What penelope asks the khora to adopt (once each, in the khora)

1. **The smell as a settle layer.** `organs/emergent-smell.mjs` (or its khora equivalent) as the reader-side per-token smell, with the four pinned models. It answers one narrow question honestly: *is this form nameable, and as what?* — `smell(form) -> { cls, margin } | null`, null being the load-bearing answer.
2. **The slice as a snip proponent.** `organs/clitic-slice.mjs` proposes a cut only where a token ends with a giver-named marker AND the whole is unnameable AND the host is nameable. It is already wired to the ledger (`toEvidence`) and the tokenizer-rule judge (`nominate`).
3. **A re-tokenize door.** The one joint penelope cannot weld: the reader owns tokenization. The loop needs a door that accepts a PROPOSED cut (host | marker) and re-tokenizes the sentence, so the spine can settle → snip → re-tokenize → re-settle until the smell is stable. This is the recursion; without it the smell and the slice stay measurements and never act.

## What only the owner can give

The per-language clitic/particle givers. English has one (the UD English documentation, `organs/data/giver-ud-english-clitics.json`: 's, ', n't, 'll, 'm, 've, 'd; 're un-named). Greek enclitics, Sanskrit particles, and Mandarin PART have no declared giver yet — the slice cannot fire there until a standard or a person stands behind each marker set.

## Falsifying control

When the loop lands, it must be scored on the same FRESH/held-out sets (English EWT dev first): the loop's recovered segmentation must beat the glued baseline on the gold boundaries, and the smell must keep refusing the same 24-30% unnameable tokens without hallucinating a class. A loop that does not improve the cut is refuted, not shipped.
