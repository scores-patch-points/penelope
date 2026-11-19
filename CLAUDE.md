# Penelope — standing orders for any agent working here

<!-- nexus:begin (generated from scores-patch-points/scores-patch-points nexus/blocks; do not edit between the markers) -->
## The nexus: where this repo sits
You are in one repo of the **nexus** (`scores-patch-points`): an interconnected body with **no wrong door**. The map: https://github.com/scores-patch-points/scores-patch-points. This repo: level `L1`, Generate: the keeper, the record, the mouth. Default branch `main`.
- Doors:
  - `POST /api/weave`
  - `BRIEF.md (session brief)`
- Gate (run it before you finish): `npm test`
- Siblings: `khora`, `janus`, `Zenodotus`, `heimdall`, `pharos`
- Research rules and what is established: https://raw.githubusercontent.com/scores-patch-points/penelope/main/BRIEF.md.

Rules in every repo of the nexus:
1. Respect the boundary. If a repo's "Doesn't include" names your thing, it belongs in another holon: put it in the smallest holon whose boundary includes it.
2. A typed gap beats a guess. An unknown repo, door, gate, prior or dataset is stated as a gap. A missing sibling or prior is a refusal that says how to get it, never a silent degrade.
3. Start from the default branch of origin, not a stale branch, and say which commit you read.
4. Read and write through the repo's declared door. Do not build a second reader or a second door beside it.
5. Do not push, merge or change user-level configuration without the owner's yes. Commit only paths you can name.
6. Quote every number with its split (dev, fresh, held-out, reused, exploratory) and its stamp. A measure that changed is a new row or a recorded pin, never the same number under the same name.
7. A negative result is a finding: record it with its falsifier.
<!-- nexus:end -->

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
