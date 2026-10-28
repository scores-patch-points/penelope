# ADDENDUM R3-1 to PREREG-G1-3-ROUND3.md — the final files, hashed BEFORE the new window is built or read

Written 2026-10-28T06:09:21Z by `g1-3-composer`. Round-3 prereg sha256 98f45beae8ab3d0bf6265ac4426310e54eb65c3e36eaa385d8faeff63279eaa6; round-2 prereg eb86c5d3983d9bccb798941d85f96513a274904cfd7a3413bacd8acad9284ba5. No amendment was needed.
The new window (bytes 216979 to 289406 of the full text: heading XV. to before heading XIX.) is built and scored ONCE from exactly these files. A run that dies before printing a score for a cause outside the code may be repeated; any printed score counts. No file below changes after this hash.

## Code (penelope branch g1-3-composer-r3, commit 521fc4895befbda28d217c5b55e686d2153dea64, on g1-3-composer-r2 978efd9, on main 3fd5eeb; the only change since round 2 is organs/kin-telling-check.mjs and its test)
- `organs/kin-telling.mjs` d528deeac6335996328e86c5f10579e132dcc55d9941097474c790a52b4daa1c
- `organs/kin-telling-check.mjs` 24b03d76110dd68a1e76a7aae9eaa6a6712038c5629c77668f85b69e883b3e69
- `organs/kin-telling-frames.json` a5a7088bbf7a4e37d1bd503ee3630623aa0f86472555119a744f1f7aa9e3e67d
- `organs/generation/adapters/kin-telling.mjs` 696b6a77393c4886f3328971694d2e230eddcaca3d5cc2f496b38c308be28c9a
- `gym/kin-telling-run.mjs` 10c9f13a5c8ecf6348ff7100ac61131f6610a91697852b0fdf79c7b3bf18be41
- `gym/kin-telling-lib.mjs` f1d21772ca0f5ae118991719e4e04389efa6f5c113728f41a1c60b655782e527
- `gym/kin-telling-mutants.mjs` 2e68bf2317442c16dc0b344e4a03459e612239b03693ac3bb83609388095eade
- `organs/kin-telling.test.mjs` c5e4bbc56382aed3653f3853c18168d05a79f15a3be5f325c24c4da9eee36ba6

## Build and plain-baseline scripts (g1-3-composer-v2/window-xv-on/; byte-identical copies of round 2's)
- `build-fold.mjs` f31c577b7720f0347cc863f245580ab494f8bb16306e10df6ad18031a596dc34
- `build-inputs.mjs` 1126262a68a8e0cef37ccc5504b5bd4ab29fc8d304a2aa44694f99591dd7bc32
- `swap.mjs` b323e91dac87a764070c62644d1b1057d6c5cefff70797f85f80b50fcb9f7b1a
- `lib.mjs` ad0159ac86d17af2500b4ba801a5be6f3033d6bec796e716679c9107f023577e
- `run-fresh.sh` f5c994daf2c6d31c6886e2ca2257123c90ae77f53acb6a56d0b1ee5c7a0ff281
- `window-text.txt` bd2015657c89c4b8db0535d0e7fed44f19b1a468b62f4260d1323cac4413c11b
- `foldcode-nomodel/answer-plain.mjs` aaf88b9f8b749fb3df197b0592d433648180812af40fcb29241eb6662f12a838
- the pins are round 2's: khora 30fe444dfecdd6f6e1a32018047eee9d8291514b (seam-ledger.js 3e80940ad94a077296b772c34d7e69f77e0e9f1d7e90c56256284c0fbfe80b0c), janus 9fe6d918858fc64f59c18d064632504713f37830

## The window
bytes 216979 to 289406 of the full text (sha256 b2afb2bd979b9ad84ab4534c34dcf0206321d28fc3bc00d95c6492d7b7b723d9), 72,427 bytes, window-text.txt sha256 bd2015657c89c4b8db0535d0e7fed44f19b1a468b62f4260d1323cac4413c11b. Not printed, read, folded or searched.

## The development record at this freeze (round-3 code on the three SPENT windows; not the new score)
- every bar R0 to R11 passes on the round-1 development window (91 sentences; R5 512 of 512; R10 15 of 15), on the round-1 held-out (64 sentences; R5 368 of 368; R10 14 of 14) and on the round-2 window, where round 2 failed (89 sentences; checker failures 0; R1 pass; R2 7 of 7; R3 11 of 11; R4 S1 10 of 10 and S2 8 of 8; R5 510 of 510 with M11 18 of 18 and M12 18 of 18; R7 23 of 24 against plain 22 of 24; R8 30 of 30; R9 18 of 18; R10 18 of 18 listing exactly the 65 unbound statements).
- unit tests: 25 tests, 25 pass with janus and khora beside (23 pass and 2 typed skips without).

## The commands
```
sh g1-3-composer-v2/window-xv-on/run-fresh.sh
JANUS_HOME=<pins/janus> KHORA_HOME=<pins/khora> node gym/kin-telling-run.mjs --window fresh-xv-xviii --dir g1-3-composer-v2/window-xv-on --plain g1-3-composer-v2/window-xv-on/plain-reply.txt --janus <pins/janus> --frames-sha <sha256 of organs/kin-telling-frames.json above> --out <results>
```
