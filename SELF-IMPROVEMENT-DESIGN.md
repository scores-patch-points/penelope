# Recursive self-improvement — a running loop, not another shadow plan

Written 2026-11-20 after the parser measurement and the two diagnosis ants. Grounded in what already exists; names real files. The rule that governs the whole document: **a design that is not RUN is a shadow plan — the thing that has been going wrong (MEANING-PLAN is "in shadow", the 2026-10-04 99% cut orphaned the base function, and 5,121 "typed gap / not wired / absent" markers have accumulated).**

## The loop (each step is an existing file or a one-command action)

1. **Diagnose** — read the ledger's calibration cards (`organs/evidence-ledger.mjs`, the `GL-*` entries in `GLAUCA-EOT.md`). The weakest layer is the one whose LR interval includes 1, or whose class has "no voice". This is mechanical, not an opinion.
2. **Hunt** — the fix for a weak layer is more planted truth, never more model (hunt-first, mouth-last). Fetch a held-out treebank or fold a new codec on demand (`organs/emergent-smell.mjs` already folds per-language models; `graph-parser.mjs` folds per-language arc codecs).
3. **Re-train + re-pin** — `experiments/pos-smell/train-pinned.mjs` and the khora `native/scripts/train-ud-parser.mjs` re-train and write a model with a new sha256. The old model is superseded by pointer, never overwritten.
4. **Re-measure once** — a fresh/held-out set is read ONCE; a second scoring is REUSED (the PREREG discipline in `BRIEF.md` rules 3-4).
5. **Ship only what beats the falsifier** — `node gym/ledger-check.mjs` + `node gym/house-ratchet.mjs`; a change that does not clear its null is refused. When it holds, it moves into the khora (SYSTEM-MAP's eval→khora rule); the eval keeps the numbers + falsifier.

## The fuel and the gate

- **Fuel = new held-out data.** Without it the loop starves: a "fresh" set read twice is REUSED forever. The loop is recursive because each iteration's measurement names the next weak point (the posterior from `combine()` is the input to the next diagnose step).
- **Gate = the falsifier.** `combine({candidates, prior, evidence})` never reports certainty; a harm term is a veto; an uncalibrated layer is shown, not counted.

## The human boundary (cannot be autonomous)

1. **A giver declaration** — a rule needs a named giver (`tokenizer-rule-def.mjs` refuses otherwise). Greek/Sanskrit/Mandarin clitic givers still don't exist.
2. **The fetch** — new data is downloaded only with the owner's yes, naming file/source/size (standing rule).

## The anti-shadow gate (the part MEANING-PLAN lacked)

Two concrete checks, runnable, that fail if the loop is only being *documented*:
1. **A "loop ran" heartbeat** — the loop appends one row per iteration to `state/improvement-log.jsonl` (date, weakest-layer-id, action, new sha256, held-out result). A gate (`node gym/ledger-check.mjs` extended, or a tiny `gym/loop-ran.mjs`) fails if the newest row is older than a declared horizon. No row = the loop is dead, loudly.
2. **A "no 99% cut" invariant** — a `gym/no-sever.mjs` check that the parser/tokenizer/reader history is append-only: the base-function files (`ud-parser.js`, `english-parser.js`, `read-core.mjs`, `graph-parser.mjs`) and their eval/goldens are never deleted from git history (a `git log --diff-filter=D` scan of those paths). A deletion of base function is the failure that lost the work three times; this gate makes it impossible to do silently.

## Falsifying controls for the design itself

- If the heartbeat runs but the base-function UAS/LAS never improves over N iterations, the loop is spinning, not learning — the diagnose step is naming the wrong weak point.
- If the base-function files disappear from history again, `no-sever` fires — the design failed at its one job.
- If a "loop ran" row appears with no new sha256 or no held-out number, it is a fabricated heartbeat — refused the same way a fabricated test pass is refused.

## Current state the loop starts from (measured this session)

- English: UAS 84.5 / LAS 81.2. Sanskrit: UAS 66.2 / LAS 56.3 (transition parser).
- Sanskrit error decomposition (oracle, measured): perfect tags only lift UAS to 68.4 — so the tagger costs ~2 pts and the parser's word-order architecture costs ~32 pts.
- The one lever left: make `graph-parser.mjs` competitive (rich Zhang&Nivre features + structured training) — the transition parser is at its ceiling.
- Hard constraint: the subagent/ant budget is exhausted (3 ants failed "insufficient balance"), so the loop runs on the main session until topped up.
