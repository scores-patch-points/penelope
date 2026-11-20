# better-than-old: does the marks-and-reasoning stack beat the older fold version on a long chat?

**Status: EXPLORATORY.** One synthetic world, one seed (20261120), small local models, temperature 0. This is an engineering comparison, not a ledger row: nothing here is FRESH or HELD-OUT, and the protocol was amended several times, each time in response to results that had been seen (every amendment is a dated addendum written before the next run; none was written after the run it governs). Read the history below before quoting any number.

## What is compared
All arms get the same ~900-turn chat (about 6,000 tokens), the same 30 questions, the same model in every role.
- **OLD**: khora's register (copular facts, supersession, provenance) answers what it can and the model states it; anything else gets the model plus a recent window (2048-token context). No marks, no reasoning stage.
- **NEW**: the chat read into claims (khora reader, janus claim organs), each question read into a tree of goals, each goal judged mechanically (lookup, supersession, contradiction under declared priors, nesting); only a hole or a gap goes to the model, which only NOMINATES (a short note read back as proposals, each tested against the marks); the model states the findings.
- **FULL** (reference only): the whole chat in context.

## Files
- `prereg/` the frozen protocol and five dated addenda. Hashes (sha256, first 16) as recorded in each result file: protocol `8cb2db9745970838`; run-2 (Gemma) addendum `13a60616011c5297`; addendum 2 (measure V2) `40ae23f3d6fe5e92`; addendum 3 (measure V3) `b1edeb7cb843c77d`; addendum 4 (mouth) `a60b56b8cd21fdb7`; addendum 5 (holes) `698d81c3a4e4a843`. `MANIFEST.sha256` lists every file.
- `harness/bench.mjs` the current harness (V1, V2 and V3 scoring side by side, near/far split). `harness/bench-v1.mjs` the harness as it was for runs 1 to 2's first scoring. Both use absolute paths to sibling checkouts (khora worktree, janus claim organs, khora register) and to this repo's `organs/`; edit the constants at the top or set the checkouts beside this one.
- `results/` the result files (`summary` + one row per question and arm, with the reply and every claim the checker read).
- `toy/` the live demo (`live.mjs` + `live.html`, port 7461) and the first exploratory chat harness (`long_chat.mjs`). Not part of the comparison.

## Runs (what produced each result file)
| file | model | arms | measure | code state | notes |
|---|---|---|---|---|---|
| results/bench-result-1.json | qwen3:8b (thinking off) | old, new, full | V1 | before the punctuation fix | V1 only stored a 160-character reply |
| results/bench-result-1b.json | qwen3:8b | old, new | V1 + **V2** | same | reproduces run 1 exactly under V1 (temperature 0). V2 as first built tripped its own falsifiers and is WITHDRAWN: kept under its own name, not used for any conclusion |
| results/bench-result-2.json | gemma2:2b | old, new, full | V1 + V2 | same | |
| results/bench-result-3g.json | gemma2:2b | old, new | V1 + V3 | + sentence-final punctuation kept in the last fragment; claims carry `aUpos`/`bUpos` | NEW V3 flagged 9 fabricated, 8 of them false alarms (F10'): the mouth wrote meta-analysis |
| results/bench-result-4g.json | gemma2:2b | old, new | V1 + V3 | + addendum 4 mouth prompts, self-relation guard | false alarms fixed (V3 fabricated 1) but accuracy fell 23 -> 17 (F15 hit): holes were stated as a missing prior, and a tag question became a goal |
| results/bench-result-5g.json | gemma2:2b | **new only** | V1 + V3 | + addendum 5: tag question is not a goal, a hole carrying marks is stated as what the marks say | OLD for comparison is taken from run 4 (unchanged code) |
Run 3 on qwen3:8b was started and never finished (no file).

## What the runs showed (EXPLORATORY; quote with this label)
Run 5, gemma2:2b: NEW V1 correct 23/30, V3 correct 24/30; OLD (run 4) V1 12/30, V3 8/30. NEW mean prompt tokens 61 against OLD's 1,693; 1.5 s per question against 3.4. Near/far (V3): NEW 8/13 near, 13/14 far; OLD 5/13 and 0/14 (so the gain is not only recall of the far past). The qwen3:8b runs gave NEW 20/30 and OLD 12/30 under V1 (V3 was not yet built). A 1.6 GB non-thinking model did the stack's job as well as the 8B one (V1 NEW 21-23/30 against 20/30).
Falsifiers hit at some point and what they led to: F2/F8 under V1 (NEW fabricated 1, OLD 0; V1 is word-presence and its one flag is a harmless reply that names a firm, so V1 is wrong there); F10 (V2: 16 false alarms, withdrawn); F10' (V3 run 3: 8 false alarms, fixed by the mouth prompts); F15 (run 4: accuracy cost, fixed in run 5).

## Known limits (do not skip)
- The measure changed three times (V1 word-presence, V2 claim-level, V3 claim-level with world-claims-only, quoted mentions cut and hole-filling). Each is reported under its own name; V3 is not validated: it flagged 3 of OLD's V1-correct answers and one correct NEW inverse answer as fabricated, and I have not read the OLD cases.
- The remaining NEW misses are reader defects: unseen sentence-initial names tagged ADV/INTJ (Oscar, Hugo), the possessive glued by the tokenizer (the codec session owns that fix), and incomplete inverse answers.
- One seed, one generated world with 10 people, 12 name choices; no confidence interval is claimed.
- The protocol was changed after seeing results (honestly, in addenda); this is development evidence, not a test of a frozen claim. A frozen test needs a NEW world and seed and the final protocol, run once.
- The harness depends on sibling checkouts at specific commits (janus claim organs at `63b4510` or later; khora reader with the opt-in predicate repair; the khora register); results depend on them.

## Reproduce
```bash
# prerequisites: ollama with gemma2:2b (1.6 GB) and/or qwen3:8b; KHORA_PRIORS_DIR pointing at janus/priors; the sibling checkouts named at the top of harness/bench.mjs
cd experiments/better-than-old/harness
KHORA_PRIORS_DIR=<janus>/priors MODEL=gemma2:2b ARMS=old,new node bench.mjs ../results/rerun.json
```
