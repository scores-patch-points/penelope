# Default behaviour for this PR (rounds 2 and 3)

`npm test` on a clean worktree of main 3fd5eeb and on this head (no sibling checkout beside: the house's typed SKIPs), 2026-10-28:

| | main 3fd5eeb | this head |
|---|---|---|
| node --test: tests / pass / fail / skipped | 103 / 92 / 0 / 11 | 108 / 97 / 0 / 11 (the 5 added tests are `organs/kin-telling.test.mjs`; the 2 typed SKIPs there need janus or the workspace) |
| house ratchet red lines | 85 | 85, **the same set** (compared line by line: none new, none gone) |

The set stays equal because thread KTL cites both GL-KT-01 and GL-KT-02 in the tapestry spec (a first version of the EOT entry without that citation added one iphthime line, which the re-weave removed).
The ratchet's 85 lines on main are the 75 that were already red when PR #11 was opened plus the 10 `DRIFT` lines for the kin-telling files PR #11 added; a `--stamp` is refused by two other owners' unnamed files, as on main.

Files changed against main (`git diff --name-status origin/main`), the new ones under `experiments/` aside:

```
M	GLAUCA-EOT.md
M	experiments/kin-telling/README.md
M	gym/kin-telling-lib.mjs
M	gym/kin-telling-mutants.mjs
M	gym/kin-telling-run.mjs
M	organs/kin-telling-check.mjs
M	organs/kin-telling.mjs
M	organs/kin-telling.test.mjs
M	GLAUCA-EOT.md
M	README.md
M	TAPESTRY.md
M	experiments/kin-telling/README.md
M	gym/kin-telling-lib.mjs
M	gym/kin-telling-mutants.mjs
M	gym/kin-telling-run.mjs
M	gym/tapestry.html
M	gym/tapestry.spec.json
M	organs/kin-telling-check.mjs
M	organs/kin-telling.mjs
M	organs/kin-telling.test.mjs
```

No organ, adapter, door, rung or the spine of penelope is edited; the only code files touched are the kin-telling files PR #11 added. `generationKinds()` still does not list `kin-telling`.
A pre-existing test is flaky on this machine, independent of this change: `organs/generation/nomodel.test.mjs` "runDrawDoor({noModel:true}) ... control: the same draw without the flag is one request" failed in 2 of 6 isolated runs on a pristine worktree of e4057c3 (and passes when run alone by name).
