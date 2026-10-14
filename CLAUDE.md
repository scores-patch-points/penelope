# Penelope — standing orders for any agent working here

Penelope is written by several hands at once (agents and people). Law: library →
box → hunt → mouth; no hardcoded numbers; named gaps, never invented lists; red
rungs become standing rules, never retries. See README.md.

## When you change a generation process, the record changes with it

A process change = an organ, adapter, door/route, rung, or the order of the
spine (read → settle → fill → snip → probe → test → seal).

1. Re-weave the affected thread of `TAPESTRY.md` (ASCII, 78 wide), then run
   `node gym/check-tapestry.mjs --stamp`. It verifies coverage, copies the block
   to the README's front page, and records hashes. `node gym/check-tapestry.mjs`
   (no flag) must pass before you commit.
2. APPEND to `GLAUCA-EOT.md`: a new entry, or a `supersedes: <id>` entry. Never
   rewrite what an entry says; edit in place only to sharpen (add a falsifying
   control, fix a citation). Every entry needs a real `path:line` or measured
   run as evidence, and a falsifying control.
3. A run that trips an entry's falsifying control IS the finding: supersede it.
4. **The house round (the handmaidens)** — `node gym/handmaidens.mjs` must be
   run after a process change, and each member's finding addressed before
   commit: Eurycleia (every generation thread named), Autonoe (every draw
   recorded on the swatch), Iphthime (every claim grounded — no uncited law,
   no ghost thread), Telemachus (every draw inside the sanctioned door). A
   member that reports a suitor means the change is not finished — the suitors
   are forgetfulness of duties and hallucinations that creep in. The round
   failing is the honest state; the suitors it names are the work left undone.

## The default gate carries the house duties (the ratchet)

`npm test` ends with `node gym/house-ratchet.mjs`: check-tapestry and the four
handmaidens are read and every red line is an id. The red the house already
carries is recorded, append-only, in `gym/house-baseline.jsonl`; the gate fails
only on a NEW red line (and a line that was fixed and returns is new again).
Fix the finding; or, if you knowingly carry it, `node gym/house-ratchet.mjs
--record --why "..."` and commit the appended baseline. After you fix a line,
`--tighten --why "..."` appends the green mark. A partial stamp,
`node gym/check-tapestry.mjs --stamp --only <files you re-wove>`, blesses
exactly those files so drift you did not re-weave stays visible.
Sibling checkouts (khora, janus, Zenodotus, heimdall) are reached only through
`organs/kernel-reach.mjs`; with one absent, tests that need it SKIP with the
typed `<repo>-absent` reason and the rest of the gate runs.

## Concurrent writers

Append to the EOT with a single atomic append. Commit only paths you can name
(`git diff --cached --stat` first); never a bare `git commit`.
