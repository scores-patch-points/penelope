# ADDENDUM 1 to PREREG-G1-3-COMPOSER.md — the final files, hashed before the held-out run

Written 2026-10-28T03:04:45Z by `g1-3-composer`. Prereg sha256 36cecb11beaef6cd45cc1a0f73330b370bdcc7b3f8166f6e856366a024d0a77d; Amendment 1 sha256 d3af9d6e2669d7fbcf36f7a66b8a30a407a5dec4212fc7c724a05c19631bbf94.
The held-out window (chapters V to VIII) is run ONCE from exactly these files. A run that dies before printing a score for a cause outside the code (a missing path) may be repeated; any printed score counts. No composer, checker, frame or runner file changes after this hash.

## Code (penelope branch g1-3-composer, commit 0a3c0fd0e723b5f4ae69b7c289c34b7bfdf430b6)
- `organs/kin-telling.mjs` 170106f0b1442a7641b1a095e697cf4ef8f423343ec4fdfbb1d4801fddf64cbb
- `organs/kin-telling-check.mjs` 4a409c7871c6eb69860ac08b7c8a5844b9a5d541819835344e428973a15099c8
- `organs/kin-telling-frames.json` a5a7088bbf7a4e37d1bd503ee3630623aa0f86472555119a744f1f7aa9e3e67d
- `organs/generation/adapters/kin-telling.mjs` 696b6a77393c4886f3328971694d2e230eddcaca3d5cc2f496b38c308be28c9a
- `gym/kin-telling-run.mjs` 3022d1aa2e9aa80db64a2444c0b15572bdd83454ff8fec1236778a5027a8c7b5
- `gym/kin-telling-lib.mjs` 8d6a06fc6662312b3268f5bd4de0446a32d0dd42edfff55236ccaa1ae2485f9d
- `gym/kin-telling-mutants.mjs` d85e16ebaaf2038d8da94274d6900a3b7a8446dfe800bde09605e32937c3b78a
- `organs/kin-telling.test.mjs` 3003a6bdc2446945b5c51c70bab198d74ccd3d19acb7e22951871b6ab1d3a7ba

## Givers (janus at 9fe6d918858fc64f59c18d064632504713f37830)
- `priors/kin-lexicon.json` 693f23772d76fb5d582b76db7d5b40d88803eaa91cb47cf05a54b958a59a1737
- `priors/parallel-names-rus-eng.json` ba95430b4423a939ca84ef791fd14098dc761fcf1936f8dca1a0685f3ba6da86
- `priors/name-parts-ru.json` 96aae932beec3609a71d3e3e6214bcd43a3259e51f1d10a31889375992ba09c6
- `native/organs/kinship.js` 6f4b5131d9d267fb537b0104062f0acdb17f5bb9026b148c2894fce7156eb4ba

## Windows (hashes only; the held-out files have not been opened by this session beyond the registration's disclosure)
- `foldcode-answer/fold.json` bad43d2e7b95839c8d5fdccb5920c299d5a4750494a008c4381111c14d21f070
- `foldcode-answer/questions.json` a9ffd5d645f728882ce16c7418b049a90169d60d930d05f20f5a810336c98c60
- `foldcode-nomodel/out-dev/arm-P.reply.txt` 1af4b10039e0e7ad6f7bc1ed276cc594f5ffaac268ea2900550fb3d8fe701e54
- `Zenodotus/11-multi-language/war-and-peace/ru/voyna-i-mir_Tolstoy_wikisource.txt` 1b298906182db57b9c9435beff1882442e992786ac926cf70d3163461b7ec3f1
- `foldcode-answer-heldout/fold.json` dad8fb9aff97a912bd5a035c61bd9d9963c05b4fa7e2be62436bfd63257178c7
- `foldcode-answer-heldout/questions.json` 363d8eb1280c770e2e74dca1f5c6c135f161c144a76b0cf2c5670099f9f3194b
- `foldcode-nomodel/out-heldout/arm-P.reply.txt` d1288c9a62609f3290970e403dc8731da1243aca910a4dfbb7b0d6755f650ee4
- `foldcode-answer-heldout/heldout-text.txt` 55ab82f0272dcb8abb9e6c8eaec884cc690957ddb9457a362b7b8bbf603fc232

## The command
```
JANUS_HOME=<janus 9fe6d918> node gym/kin-telling-run.mjs --window heldout --janus <janus 9fe6d918> --frames-sha <sha256 of organs/kin-telling-frames.json above> --out <results dir>
```

## The development record at this freeze (window dev; not the held-out score)
B0 pass (tripwire 0 firings, probe tripped); B1 75 sentences, 0 checker failures, all addressed; B2 8/8 in-scope answerable composed (all answerable 8/14: the 6 speech questions are out of scope);
B3 10/10 expected-gap questions, 125/125 recorded gaps stated, 120/120 gap cells named; B4 S1 77 checker failures, 8/8 changed fact sentences rejected, S2 6/6;
B5 395/395 mutants killed; B6 identical; B7 recall composer 31/32 vs plain 25/32; B8 24/24 invariant; B9 18/18 field-settled under weave noModel; B10 7/7 synthetic documents, 7 answered cells, 14 recorded janus gaps inexpressible.
