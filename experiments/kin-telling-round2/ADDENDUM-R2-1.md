# ADDENDUM R2-1 to PREREG-G1-3-ROUND2.md — the final files and the toolchain check, hashed BEFORE the fresh window is built or read

Written 2026-10-28T06:00:31Z by `g1-3-composer`. Round-2 prereg sha256 eb86c5d3983d9bccb798941d85f96513a274904cfd7a3413bacd8acad9284ba5. No amendment was needed: every development result is consistent with the registration as written.
The fresh window (the bytes of the full Russian text from the heading IX. to before the heading XV.) is built and scored ONCE from exactly these files. A run that dies before printing a score for a cause outside the code may be repeated; any printed score counts. No composer, checker, runner, build or frame file changes after this hash.

## Code (penelope branch g1-3-composer-r2, commit 978efd943f1ae2cc545834f4125145a65ebab5b2, on main 3fd5eeb)
- `organs/kin-telling.mjs` d528deeac6335996328e86c5f10579e132dcc55d9941097474c790a52b4daa1c
- `organs/kin-telling-check.mjs` 18f9e135b42f30a3b883da1adfa3b6b508ddb53f3b9f15f03f8f5a2918ff1f4f
- `organs/kin-telling-frames.json` a5a7088bbf7a4e37d1bd503ee3630623aa0f86472555119a744f1f7aa9e3e67d
- `organs/generation/adapters/kin-telling.mjs` 696b6a77393c4886f3328971694d2e230eddcaca3d5cc2f496b38c308be28c9a
- `gym/kin-telling-run.mjs` 10c9f13a5c8ecf6348ff7100ac61131f6610a91697852b0fdf79c7b3bf18be41
- `gym/kin-telling-lib.mjs` f1d21772ca0f5ae118991719e4e04389efa6f5c113728f41a1c60b655782e527
- `gym/kin-telling-mutants.mjs` 2e68bf2317442c16dc0b344e4a03459e612239b03693ac3bb83609388095eade
- `organs/kin-telling.test.mjs` 99c327d347940b55928655ed24e6eff5e88f1ae03fa87253ce3dd0eb4eac7242

## Build and plain-baseline scripts (g1-3-composer-v2/window-ix-xiv/; copies of foldcode-answer-heldout/* with only lib.mjs clones() pinned)
- `build-fold.mjs` f31c577b7720f0347cc863f245580ab494f8bb16306e10df6ad18031a596dc34
- `build-inputs.mjs` 1126262a68a8e0cef37ccc5504b5bd4ab29fc8d304a2aa44694f99591dd7bc32
- `swap.mjs` b323e91dac87a764070c62644d1b1057d6c5cefff70797f85f80b50fcb9f7b1a
- `lib.mjs` ad0159ac86d17af2500b4ba801a5be6f3033d6bec796e716679c9107f023577e
- `run-fresh.sh` f5c994daf2c6d31c6886e2ca2257123c90ae77f53acb6a56d0b1ee5c7a0ff281
- `window-text.txt` 5c3b1671f09f9eb3bd987b0c9939dbc8ae1e334b3ab5007daa19e629b610887c
- `foldcode-nomodel/answer-plain.mjs` aaf88b9f8b749fb3df197b0592d433648180812af40fcb29241eb6662f12a838

## Pinned checkouts (siblings named khora and janus under clones/pins)
- khora 30fe444dfecdd6f6e1a32018047eee9d8291514b; `native/organs/seam-ledger.js` 3e80940ad94a077296b772c34d7e69f77e0e9f1d7e90c56256284c0fbfe80b0c (the acceptance instrument; identical at 152cb07)
- janus 9fe6d918858fc64f59c18d064632504713f37830
- janus `priors/kin-lexicon.json` 693f23772d76fb5d582b76db7d5b40d88803eaa91cb47cf05a54b958a59a1737
- janus `priors/parallel-names-rus-eng.json` ba95430b4423a939ca84ef791fd14098dc761fcf1936f8dca1a0685f3ba6da86
- janus `priors/name-parts-ru.json` 96aae932beec3609a71d3e3e6214bcd43a3259e51f1d10a31889375992ba09c6
- janus `native/organs/kinship.js` 6f4b5131d9d267fb537b0104062f0acdb17f5bb9026b148c2894fce7156eb4ba

## The window
- full text `Zenodotus/11-multi-language/war-and-peace/ru/full-wikisource-20261027/voyna-i-mir_Tolstoy_wikisource_full.txt` sha256 b2afb2bd979b9ad84ab4534c34dcf0206321d28fc3bc00d95c6492d7b7b723d9; bytes 148169 to 216979 (heading IX. to before heading XV.), 68,810 bytes, window-text.txt sha256 5c3b1671f09f9eb3bd987b0c9939dbc8ae1e334b3ab5007daa19e629b610887c. Not printed, read, folded or searched.

## The toolchain check, on SPENT data only (g1-3-composer-v2/toolchain-check/)
- build-fold.mjs on the round-1 held-out text with the pinned checkouts laid out as siblings named khora and janus: **byte-identical to foldcode-answer-heldout/fold.json except the text file path** (63 beings, 10 facts, 57 unbound, the same ledger and the same six).
- A FIRST attempt with the checkouts named khora-pin and janus-pin did not reproduce it (90 beings, 14 facts, readerGaps unknown_language, no_declension_prior): khora finds the janus priors as a sibling named janus. Recorded as fold.json.first-attempt; the build script now lives only in the right layout.
- build-inputs.mjs with the held-out's absent-name pool: **questions.json and blocks.txt byte-identical** to foldcode-answer-heldout's; answer-plain.mjs reproduces foldcode-nomodel/out-heldout/arm-P.reply.txt byte for byte.

## The development record at this freeze (round-2 code; not the fresh score)
- development window (chapters I to IV): 91 sentences (24 questions, 6 batteries, 3 fact paragraphs); R0 pass; R1 pass: 0 checker failures, 91 of 91 sentences have an addressed ru or ask segment, 0 extent-only, 3 ask-only (the absent-name sentences), seamReport mouthShare 0, contract ok, 0 sentences without a source segment, strict addressedShare 65.8%; R2 8/8; R3 10/10, 125/125, 120/120; R4 S1 94 failures and 12 of 12 changed fact sentences rejected, S2 10 of 10; R5 512/512 mutants (M1 to M12); R6 identical; R7 31/32 vs plain 25/32; R8 27/27; R9 18/18; R10 15/15 paragraphs list exactly the 35 unbound statements; R11 7/7 documents, 7 answered cells.
- the spent round-1 held-out (V to VIII), used as development data: 64 sentences; R1 pass (strict addressedShare 73.9%); R4 S1 59 failures, 3 of 3 changed fact sentences rejected, S2 2 of 2; R5 368/368; R7 26/26 vs plain 21/26; R10 14/14 paragraphs list exactly the 57 unbound statements; every bar passes.

## The commands
```
sh g1-3-composer-v2/window-ix-xiv/run-fresh.sh        # builds fold.json, questions.json, blocks.txt, plain-reply.txt in that folder (no model, no network)
JANUS_HOME=<pins/janus> KHORA_HOME=<pins/khora> node gym/kin-telling-run.mjs --window fresh-ix-xiv --dir g1-3-composer-v2/window-ix-xiv --plain g1-3-composer-v2/window-ix-xiv/plain-reply.txt --janus <pins/janus> --frames-sha <sha256 of organs/kin-telling-frames.json above> --out <results>
```
