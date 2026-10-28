# Default behaviour is byte-identical (G1-3 PR)

Measured 2026-10-28 on a clean worktree of origin/main (e4057c3) and on this branch, both with no sibling checkout (khora, janus, heimdall absent: the house's typed SKIPs),
`npm test` run on each.

| | origin/main e4057c3 | branch g1-3-composer |
|---|---|---|
| node --test: tests / pass / fail / skipped | 83 / 74 / 0 / 9 | 103 / 92 / 0 / 11 |
| pre-existing test lines (name and verdict) that differ | | **0** (every one of the 83 is present with the same verdict) |
| tests added | | 20 (`organs/kin-telling.test.mjs`: 18 pass, 2 typed SKIPs without janus or the workspace folds) |
| selftest and SKIP lines of `run-checks --selftests` | | identical (plus `organs/kin-telling.mjs`'s own selftest, which passes) |
| `generationKinds()` | no `kin-telling` | no `kin-telling` (asserted by a test; the adapter is passed as an object to weave) |
| house ratchet red lines (`node gym/house-ratchet.mjs`) | 75, none recorded in the baseline | 85: the same 75 + 10 `DRIFT: <file> was added/changed since the weave` for the new code files, the README of gym/kin-telling and telemachus.mjs. No COVER, eurycleia, autonoe, iphthime or telemachus finding is added: thread KTL names the files, and the tripwire probe is sanctioned in telemachus.mjs. A `--stamp` would clear the 10, but it refuses while two files of other owners (organs/fold-note.mjs and its test) are named by no thread, as on origin/main. |

`npm test` exits 1 on origin/main already (the ratchet: 75 red lines the baseline does not carry, as claude-arch-13 reported); it exits 1 on this branch for the same reason. The repository has no CI (no .github/workflows).

Files changed against origin/main (`git diff --name-status origin/main`):

```
M	GLAUCA-EOT.md
M	README.md
M	TAPESTRY.md
A	experiments/kin-telling/ADDENDUM-1.md
A	experiments/kin-telling/ADDENDUM-1.sha256
A	experiments/kin-telling/AMENDMENT-1.md
A	experiments/kin-telling/AMENDMENT-1.sha256
A	experiments/kin-telling/PREREG-G1-3-COMPOSER.md
A	experiments/kin-telling/PREREG-G1-3-COMPOSER.sha256
A	experiments/kin-telling/README.md
A	experiments/kin-telling/results/addresses-dev.txt
A	experiments/kin-telling/results/addresses-heldout.txt
A	experiments/kin-telling/results/composed-dev.json
A	experiments/kin-telling/results/composed-dev.txt
A	experiments/kin-telling/results/composed-heldout.json
A	experiments/kin-telling/results/composed-heldout.txt
A	experiments/kin-telling/results/dev-run-console.txt
A	experiments/kin-telling/results/heldout-posthoc-controls.mjs
A	experiments/kin-telling/results/heldout-posthoc-controls.txt
A	experiments/kin-telling/results/heldout-run-console.txt
A	experiments/kin-telling/results/report-dev.json
A	experiments/kin-telling/results/report-heldout.json
A	experiments/kin-telling/results/side-by-side-dev.md
A	experiments/kin-telling/results/side-by-side-heldout.md
M	gym/handmaidens/telemachus.mjs
A	gym/kin-telling-lib.mjs
A	gym/kin-telling-mutants.mjs
A	gym/kin-telling-run.mjs
A	gym/kin-telling/README.md
M	gym/tapestry.html
M	gym/tapestry.spec.json
A	organs/generation/adapters/kin-telling.mjs
A	organs/kin-telling-check.mjs
A	organs/kin-telling-frames.json
A	organs/kin-telling.mjs
A	organs/kin-telling.test.mjs
M	package.json
```

Edits to existing files: `package.json` (the test and selftest lists, +1 each), `gym/handmaidens/telemachus.mjs` (+1 line: the tripwire probe of `gym/kin-telling-run.mjs` is a sanctioned address of a model door, which the wire refuses before any request leaves the process),
`gym/tapestry.spec.json` (+ thread KTL) and the three re-woven surfaces (`TAPESTRY.md`, `README.md`'s block, `gym/tapestry.html`), `GLAUCA-EOT.md` (+ GL-KT-01, appended). No organ, adapter, door, rung or the spine is edited.
