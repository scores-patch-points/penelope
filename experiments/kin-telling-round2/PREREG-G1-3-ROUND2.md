# PRE-REGISTRATION — G1-3 ROUND 2: the count sentence addressed to the spans it counts, scored once on FRESH chapters

Written 2026-10-28 by the session `g1-3-composer` BEFORE any round-2 code exists, before the fresh window's fold is built, and before any byte of the fresh window is read.
Its sha256 is written beside it (`PREREG-G1-3-ROUND2.sha256`) and quoted in the PIPELINE-LOG entry that registers it. Anything that changes after the hash is an
AMENDMENT (`AMENDMENT-R2-n.md`, hashed, reasoned). This file is never edited.

It is a DELTA on `PREREG-G1-3-COMPOSER.md` (sha256 36cecb11beaef6cd45cc1a0f73330b370bdcc7b3f8166f6e856366a024d0a77d) with its Amendment 1 (d3af9d6e2669d7fbcf36f7a66b8a30a407a5dec4212fc7c724a05c19631bbf94)
and Addenda 1 and 2 (4bb42d769803cfcb0ddf232055c5c612f61ac46ba4a2cdb52ee46852fa823ccb; 79a9b27d1e5b3dd6f717a5dc1bb1f479e08d452f14bd6d7f7363309f599ed41c), which stand in full wherever this file is silent:
the segment kinds, the closed frame set, the skeletons, the record builders, the checker's rules C1 to C6, the arms, the mutation battery, the weave path. The merged code is penelope main 3fd5eeb.

## 0. Why a round 2

Round 1 (held-out chapters V to VIII, scored once, merged as PR #11) passed every bar but B4, and Addendum 2 found, with khora's `seamReport`, what the sealed B1 had hidden: the count sentences
("Kin words in the text with an unbound end: N.", 12 of 55 held-out and 12 of 75 development sentences) have no addressed source segment; B1 counted them addressed only because they carry the whole-text extent `ru#0-N`,
an address of a domain, not a copied span. The fold already holds each unbound statement's own byte span (`kin.unbound[].byteSpan`). B4 had no kin fact in any paragraph to shuffle on the held-out. The user's aim (relayed by claude-ring):
push the acceptance checks as high as honestly possible, no bar lowered. Round 2 therefore RAISES B1 (the extent no longer counts as an address) and fixes B4's material, and is scored once on chapters nobody has used.

## 1. The only changes to the composer and the checker (everything else is as merged)

**C1. The count sentence lists what it counts.** UNB becomes `Kin words in the text with an unbound end: {forms|and}.`: one `ru` segment per entry of `fold.kin.unbound`, in the fold's order, its text the
whitespace-normalised bytes of the entry's `byteSpan` and its address `ru#a-b` (that span). No count is printed and no `val` segment is used; the number of spans is the number of unbound statements.
It is composed only in a paragraph that has a MISS sentence and only if `kin.unbound` is non-empty; an entry without a `byteSpan` makes the sentence uncomposable (a typed reason), never a guess. UNB no longer carries the extent.
The checker (its own table) parses the list and DERIVES: the multiset of the sentence's span addresses equals the multiset of `kin.unbound[].byteSpan` of the fold, and each span's bytes are a Russian kin word that the kin lexicon
maps (`russian_forms` or `russian`) to an English kin term.
**C2. Fact paragraphs.** For every stated kin fact of the window (a fact whose `rel` is `parent_of`, `sibling_of`, `spouse_of` or `term`), the composer also composes the `kin_of` paragraph of each end, once per being
(document ids `F:<referent id>`, template `T-KIN`, subject that being). They are checked, counted in every bar over sentences, and are the material of the shuffled controls together with the question paragraphs. They are not questions
and do not enter B2, B3a or B7.
**C3. The acceptance instrument.** The runner imports khora `native/organs/seam-ledger.js` (`seamReport`, identical at khora 30fe444d and 152cb07), read-only from a checkout, and types my segments STRICTLY: `ru` and `ask` are `source`
(with their address), `f` is `frame`, `row`, `rec` and `val` are `value`. A khora checkout that is absent makes R1(c) "not run", and a bar that is not run is not a pass.
**C4. Two mutants for C1.** M11 removes one entry from the UNB list; M12 replaces one entry by a Russian span of the text that is not an unbound statement. Each must be rejected.
**C5. A recall measurement repaired before the run.** B7's spellings are counted from every `ru` segment of the paragraph (round 1 counted only the subject and form slots, which missed a name that stands only as the object of a gap sentence).

## 2. The windows

- **Fresh window (decides).** The bytes of the full Russian text on disk (`Zenodotus/11-multi-language/war-and-peace/ru/full-wikisource-20261027/voyna-i-mir_Tolstoy_wikisource_full.txt`, sha256 b2afb2bd979b9ad84ab4534c34dcf0206321d28fc3bc00d95c6492d7b7b723d9)
  from the heading `IX.` (byte 148169, where the round-1 held-out ended) up to, not including, the heading `XV.` (byte 216979): 68,810 bytes. The rule, fixed before it was applied: "starting at the first heading after the
  held-out, as many whole chapters as keep the window no longer than the held-out (73,890 bytes)". Its sha256 is 5c3b1671f09f9eb3bd987b0c9939dbc8ae1e334b3ab5007daa19e629b610887c. It was cut by byte offsets and hashed; it has NOT been printed, read, folded or searched.
- **Development windows (spent, may be used freely):** the round-1 development window (chapters I to IV) and the round-1 held-out window (chapters V to VIII).
- No download: the full text was already on disk.

**Building the fresh window's fold and question set** (model-free, deterministic, no network): copies of `foldcode-answer-heldout/{build-fold.mjs, build-inputs.mjs, swap.mjs, lib.mjs}` with only `lib.mjs`'s `clones()` changed to PIN khora 30fe444dfecdd6f6e1a32018047eee9d8291514b and
janus 9fe6d918858fc64f59c18d064632504713f37830 (the commits that built both earlier windows) instead of requiring origin/main; the checkouts are laid out as siblings named `khora` and `janus` (the reader finds the janus priors beside khora; a first attempt with other names
degraded the read, and is recorded). The absent-name pool is the one the held-out used (`["Платон Каратаев","Алексей Аракчеев","Фёдор Ростопчин","Адам Чарторижский","Денис Давыдов","Тихон Щербатый","Михаил Кутузов","Василий Курагин"]`, the script keeps those absent from the window and draws three by the registered seed 20261027).
The plain baseline is `foldcode-nomodel/answer-plain.mjs` (unchanged, hashed in the addendum) over the window's `blocks.txt` and `questions.json`.
**Toolchain check, on spent data only:** the same scripts and pins rebuild the round-1 held-out fold from `heldout-text.txt`; the result is recorded in the addendum (byte-identical to the original `fold.json` or not, and if not, why). The fresh window is built only AFTER the addendum.

## 3. Arms and controls (as round 1, with C2)

P the plain baseline; C the composer (direct, and through `weave({noModel:true})`); S1 shuffled ends and S2 shuffled witnesses, each composed over the question paragraphs AND the fact paragraphs, judged by the checker against the unshuffled fold; the mutation battery M1 to M12; the tripwire.
Shift and derangement rules as round 1 (cyclic shift from sha256 of window name + tag; valid only if no shuffled fact is a true fact).

## 4. The bars (decided now; each mechanical; reported whichever way it falls; the fresh window decides)

- **R0 No model.** As B0: tripwire 0 firings and shown firing on a probe; the pure files import only `node:crypto` and local files; the khora seam-ledger is imported read-only by the RUNNER only.
- **R1 Addressed and clean (raised).** (a) checker failures = 0 over every composed sentence (question paragraphs, six-being batteries and fact paragraphs); (b) every sentence has at least one addressed SEGMENT of kind `ru` or `ask`; sentences whose only address is the extent = 0; the number whose only
  source is an `ask` (the absent-name sentences) is reported; (c) khora `seamReport` under the strict typing: mouthShare = 0, contract ok, sentences with no source segment = 0.
- **R2 In-scope answerable questions composed** (T-KIN, T-ID with a recorded derivation) = 100%; the share of all answerable questions is reported (the speech questions are out of scope).
- **R3 Typed gaps** as B3: expected-gap questions 100%; every recorded gap slot stated and every gap cell named = 100%.
- **R4 Controls fail (material guaranteed).** S1 and S2 each: checker failures >= 1 and every changed fact-stating sentence (REL, REL-D, SEX, WIT) rejected, with at least one changed fact-stating sentence. If the window states no kin fact at all the controls are reported not constructible there, which is not a pass.
- **R5 Mutation kill** = 100% over all non-equivalent mutants, each operator 100% (M1 to M12).
- **R6 Determinism**: two fresh runs identical (json and text sha256).
- **R7 Recall** of expected items, composer >= plain (the `linked` names excluded, reported).
- **R8 Variant invariance** = 100%. **R9 Weave path**: every composed question settles at the field stage under `noModel`, zero model-required, text identical.
- **R10 Count-sentence exactness.** For every paragraph with a count sentence, its span addresses equal the fold's `kin.unbound` byteSpans exactly (the checker's derivation) — reported as the number of paragraphs and spans; a mismatch is a checker failure.
- **R11 Growth (development, synthetic)** as B10, with the fixture's unbound entries given byte spans.

## 5. What was opened before this hash

Everything of round 1 (the sealed outputs). The fresh window: only the byte offsets of the chapter headings of the full text (`IX.` to `XV.`) and their sizes, and its hash. No word of it, no fold, no question, no reply.

## 6. Procedure

1. Write the code on a branch `g1-3-composer-r2` cut from penelope main, the changes of section 1 only; develop on the development windows; any change forced by a development run is an AMENDMENT (hashed) before the addendum.
2. The ADDENDUM hashes the final composer, checker, frames, adapter, runner, lib, mutants, the build copies of the foldcode scripts, answer-plain.mjs, the priors, the pinned commits, the result of the toolchain check, and the fresh window's text hash. Only after it: build the fresh window's fold, questions, blocks and plain replies; run the runner ONCE on it. A run that dies before a score for a cause outside the code may be repeated; any printed score counts.
3. Report every bar, the composed English beside the plain reply for all 24 questions, the seam numbers per question, and the fresh window's counts that bear on a bar. File a result entry whichever way the bars fall.
4. No model call, no download, no session started.

## 7. Not claimed

That the prose is translation or fluent; that a window of six chapters says anything about the novel; that the composed claims are TRUE (lawful is not correct: the checker certifies that each claim is licensed by the recorded derivation); that the kin binder's facts are in the fold (this build uses janus 9fe6d918, as the earlier windows; the binder's PR landed later).
