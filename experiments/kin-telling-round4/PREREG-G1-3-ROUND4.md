# PRE-REGISTRATION — G1-3 ROUND 4: a replication of the frozen round-3 code on the next fresh window that states a kin relation

Written 2026-10-28 by the session `g1-3-composer` BEFORE any byte of the candidate windows is read or folded. Its sha256 is written beside it (`PREREG-G1-3-ROUND4.sha256`) and quoted in the PIPELINE-LOG entry that registers it. This file is never edited; a change is an `AMENDMENT-R4-n.md`, hashed.

It is a DELTA on `PREREG-G1-3-ROUND3.md` (sha256 98f45beae8ab3d0bf6265ac4426310e54eb65c3e36eaa385d8faeff63279eaa6) with its Addendum R3-1 (82b5f8a4b39eced01ba7815cb97ee0a4beebc6df5cf1053fbbec30024e3cf7d1). **No code changes.** The code, the build scripts, the pins, the bars R0 to R11 are exactly those; the script checks the eight code files against Addendum R3-1's hashes before it scores and stops if one differs.

## 0. Why

Rounds 1 and 3 each failed exactly one bar for the same reason: the window's fold stated no kin relation in any paragraph, so the shuffled-witness control (R4) had nothing to shuffle, which the registration says is not a pass. A control that tests whether the checker rejects a false relation needs a relation to falsify. That is a property of the window, not of the composer, but a bar that cannot be evaluated is not a pass, and no bar is lowered here.

## 1. The window rule (fixed now, applied by the script)

Candidates, by round 3's rule applied in sequence from the end of round 3's window (byte 289406, the heading `XIX.`): as many whole chapters as keep each window no longer than the round-1 held-out (73,890 bytes):
- a: bytes 289406 to 337058 (headings XIX. to XXI.), 47,652 bytes, sha256 f5c993501b3399e326e222565d7ccca23affb94756f4825fd9b6594b19fa412c
- b: bytes 337058 to 396707 (XXII. to XXIV.), 59,649 bytes, sha256 ae03fe4c2579a5a4e160e371d98502f8c200b7f69e63629456169e054c89058a
- c: bytes 396707 to 466408 (XXV. and the two chapters after the next heading I.), 69,701 bytes, sha256 279248d6ab697c3895128a87295a12799de37d2fe4fbe98aa5bd9205eec9152f
(full text sha256 b2afb2bd979b9ad84ab4534c34dcf0206321d28fc3bc00d95c6492d7b7b723d9). Cut by byte offsets and hashed; not printed, read, folded or searched.

**Selection, decided before anything is built.** `run-round4.sh` builds the candidates in the order a, b, c with the unchanged pinned toolchain (the build does not run the composer and is not scored) and scores ONLY the first whose fold states at least one kin relation fact
(`rel` in `parent_of`, `sibling_of`, `spouse_of`, `term`). The selection looks at one count of the fold and at nothing the composer produces. If none of the three states one, window a is scored and R4 will fail again, which is then reported as the finding that it is.
The counts of every candidate that was built (relation facts, facts, unbound statements, beings) are reported, whether scored or not. The windows not scored are not scored.

## 2. The bars

R0 to R11 of `PREREG-G1-3-ROUND2.md` as carried by round 3, none lowered, evaluated on the one scored window (R11 on the development window). R4 requires at least one changed fact-stating sentence in each control; a window that supplies none fails it.

## 3. Procedure

1. Register (this file, `run-round4.sh`; both hashed now). 2. Run `run-round4.sh` once (the build of up to three windows, the code-hash check, the single scorer run). A run that dies before printing a score for a cause outside the code may be repeated. 3. Report every bar, the candidates' counts, the composed English beside the plain reply for all 24 questions; file the result whichever way it falls. 4. No model, no download, no session started; the PR #12 is not touched by this round except by a docs-only commit that adds its documents and result.

## 4. Not claimed

That choosing the window by the presence of a kin relation says anything about the novel; that four fresh windows (and a fifth, if this one is scored) establish accuracy against truth (lawful is not correct); that the controls' passing on a window with material proves the checker catches every false claim (the mutation battery and the claim derivations are its other evidence).
