# PRE-REGISTRATION — G1-3 ROUND 3: the checker's kin-word lookup folds Russian orthography; scored once on a NEW fresh window

Written 2026-10-28 by the session `g1-3-composer` BEFORE the round-3 change exists and before any byte of the new window is read. Its sha256 is written beside it
(`PREREG-G1-3-ROUND3.sha256`) and quoted in the PIPELINE-LOG entry that registers it. Anything that changes after the hash is an AMENDMENT (`AMENDMENT-R3-n.md`, hashed, reasoned). This file is never edited.

It is a DELTA on `PREREG-G1-3-ROUND2.md` (sha256 eb86c5d3983d9bccb798941d85f96513a274904cfd7a3413bacd8acad9284ba5) and its Addendum R2-1 (5aadda60b8015d376b86fe97277f59ad6ee6ac1698304938f1d3e74cf54e33ac), which stand in full wherever this file is silent:
the composer and checker of round 2 at penelope branch g1-3-composer-r2, commit 978efd943f1ae2cc545834f4125145a65ebab5b2; every bar R0 to R11; the pinned build; the arms and controls.

## 0. Why a round 3

Round 2 was scored once on the fresh bytes IX. to XV. (PIPELINE-LOG g1-3-composer-11): the address the round set out to close WAS closed (89 of 89 sentences have an addressed `ru` or `ask` segment, none addressed only by an extent,
seamReport mouthShare 0, no sentence without a source segment), but R1, R2, R3 and R10 FAILED, all from ONE checker failure code, `C3_UNB_a_listed_span_is_not_a_kin_word`, on every paragraph with a count sentence.
Cause, found after the run and CORRECTING the cause that entry gave ("the lexicon does not hold two forms"): the lexicon DOES hold those forms, spelled as Wiktionary spells them, with ё and stress marks («сестёр»); the text and the janus extractor write and compare
the same words after an orthographic fold (NFC, lower case, combining acute removed, ё to е: `foldRu` in `extract-kin.mjs`), which my checker did not apply, so it looked up `сестер` and `сестрам` as written and missed
the entries that the fold finds. The spent windows hold no entry spelled that way (0 of 35 and 0 of 57), so development could not show it. A check written to be independent of the extractor must not be independent of the orthography the text is written in.

## 1. The one change

**D1.** In the checker (`organs/kin-telling-check.mjs`), the lookup of a token in the kin lexicon (`russian_forms`, `russian`), used by the count-sentence derivation and by the witness-support test, is made on the ORTHOGRAPHIC FOLD of both sides:
`fold(s) = s.normalize("NFC").toLowerCase()` with the combining acute U+0301 removed and `ё` replaced by `е`; the token and every key and value of the lexicon tables are folded before comparison. Nothing else changes: no composer file, no skeleton,
no frame word, no runner or mutant file, no bar. A unit test pins it (a lexicon form spelled with ё and a stress mark is found by the plain spelling). The folded lookup finds 157 of 157 unbound entries of the three spent windows (the round-1 development, the round-1 held-out and the round-2 window), against 155 of 157 by the lower-case lookup.

## 2. The window

- **Fresh window (decides).** The bytes of the full Russian text on disk (sha256 b2afb2bd979b9ad84ab4534c34dcf0206321d28fc3bc00d95c6492d7b7b723d9) from the heading `XV.` (byte 216979, where round 2's window ended) up to, not including, the heading `XIX.` (byte 289406):
  72,427 bytes, sha256 bd2015657c89c4b8db0535d0e7fed44f19b1a468b62f4260d1323cac4413c11b. The rule is round 2's, fixed before it was applied: "starting at the first heading after the previous window, as many whole chapters as keep the window no longer than the round-1 held-out (73,890 bytes)".
  It was cut by byte offsets and hashed; it has NOT been printed, read, folded or searched. No download.
- **Spent (free to use):** the round-1 development window, the round-1 held-out window, and the round-2 window (chapters IX to XIV, whose score is filed).
- The build is round 2's, unchanged (the same copied scripts, the pinned khora 30fe444d and janus 9fe6d918 as siblings named `khora` and `janus`, the same absent-name pool, answer-plain.mjs).

## 3. The bars

Exactly R0 to R10 of `PREREG-G1-3-ROUND2.md`, none lowered, the fresh window decides. R11 (synthetic growth) is run on the development window as before. Because round 2 showed that one checker failure can cascade into R1, R2, R3 and R10, the report names the failure codes of any failing bar.
Round 2's M11 and M12 made 0 mutants for want of a clean baseline; in round 3 a paragraph with a count sentence must pass its own check for those mutants to be made, and R5 requires M11 and M12 to have made at least one mutant on the window (a mutation bar with no mutants of an operator it names is not a pass).

## 4. Procedure

1. Make D1 on a branch `g1-3-composer-r3` cut from the round-2 branch; unit test; run the round-2 runner on the three spent windows (every bar must pass there, in particular R10 on the round-2 window).
2. An ADDENDUM R3-1 hashes the final composer, checker, frames, adapter, runner, lib, mutants and tests, the unchanged build scripts, and the new window's text hash. Only after it: build the window's fold, questions, blocks and plain reply; run the runner ONCE.
3. Report every bar and the composed English beside the plain reply for all 24 questions; file the result whichever way it falls. A failed bar is a finding and a standing rule, not a retry on the same window.
4. No model call, no download, no session started. The final PR carries rounds 2 and 3 together; it is merged only on the user's explicit word.

## 5. What was opened before this hash

Everything of rounds 1 and 2 (the sealed outputs, the round-2 window and its fold). The new window: only its byte offsets, its size and its hash.

## 6. Not claimed

That the prose is translation or fluent; that the claims are TRUE (lawful is not correct); that a third window says anything about the novel; that the composer needs no further correction: a window that holds a spelling or a gap kind no earlier window held can fail a bar again, and that is what a fresh window is for.
