# ◇ legend

Every non-ASCII symbol the tapestry prints is defined here, and every symbol defined here is printed there (gym/check-tapestry.mjs, both directions). The tapestry carries symbols; this file carries the words. One cell each: measured 2026-10-01 in the GitHub code font (gym/glyph-ink.json). Operator glyphs follow organs/cube.mjs: the canon is ∅ ○ ● ｜ ⋈ △ ⊢ ⊨ ↬; ｜ ⋈ ⊢ measure 1.66 / 1.28 / 1.25 cells and would break a framed column, so they print as | → = (the EOT surface marks for cut, bond, define).

The tapestry carries symbols; this file carries the words. Generated from [`gym/tapestry.legend.json`](gym/tapestry.legend.json) by `gym/weave.mjs`.

## operator

| symbol | is | means |
|---|---|---|
| `∅` | NUL | hold the void: declare absence, draw the null, name the gap |
| `○` | SIG | attend: register a difference, sign an origin |
| `●` | INS | birth: make an enduring instance |
| `|` | SEG (EO canon `｜`) | cut: draw or dissolve a boundary |
| `→` | CON (EO canon `⋈`) | bond: join across a boundary |
| `△` | SYN | compose: an emergent whole from parts |
| `=` | DEF (EO canon `⊢`) | define: what holds within a frame |
| `⊨` | EVA | judge: test against the definition |
| `↬` | REC | restructure the frame when judgment breaks it |

## grain

| symbol | is | means |
|---|---|---|
| `∘` | Ground | Void · the hub · 0 · the ambient a figure is read against |
| `◆` | Figure | Beings · the spokes · n · one difference from its ground |
| `◈` | Pattern | Fold · the rim · 1 · the difference a figure made to the next ground |

## mode

| symbol | is | means |
|---|---|---|
| `∩` | Differentiate | cut something apart from something |
| `≈` | Relate | put something beside something |
| `∪` | Generate | bring something into being |

## domain

| symbol | is | means |
|---|---|---|
| `∃` | Existence | what exists: NUL SIG INS |
| `⊞` | Structure | how things hang together: SEG CON SYN |
| `∀` | Interpretation | what the reader holds: DEF EVA REC |

## face

| symbol | is | means |
|---|---|---|
| `◀` | ACT | WHAT is done: mode × domain = the operator |
| `▲` | SITE | WHERE it lands: domain × grain = the terrain |
| `▶` | STANCE | HOW it is done: mode × grain = the stance |

## status

| symbol | is | means |
|---|---|---|
| `■` | woven | resident in Penelope, checked against the repo |
| `□` | referenced | lives in the house, read at home, never forked |
| `·` | unwoven | a named void: nothing is claimed, only a gap and the control that would falsify it |

## typing

| symbol | is | means |
|---|---|---|
| `§` | registered | the cell typing is in the house's own documents (THE-27-CELLS.md) |
| `‡` | nominated | this tapestry's own typing of the act; a pointing, never a proof |

## flow

| symbol | is | means |
|---|---|---|
| `›` | then | next in the pipeline |
| `∨` | or | alternatives; in the pipeline, in order, the first that answers wins |
| `↺` | spiral | name why, sharpen, re-draw; bounded by a budget |
| `↑` | possibility | LOW gate: the level below sets what the level above may be |
| `↓` | probability | HIGH gate: the level above sets how likely the level below is |

## provenance

| symbol | is | means |
|---|---|---|
| `≡` | field | matched in the corpus, by frame, snipped with an address |
| `↻` | hunt | fetched, extracted, frame-checked, cited |
| `✗` | refused | typed refusal, shipped as dissent |

## logic

| symbol | is | means |
|---|---|---|
| `⇒✗` | falsified-if | the condition written before it, once observed, kills the thread |
| `∧` | and | both |
| `¬` | not | absent |
| `≠` | differs | not equal |
| `≥` | at-least | greater or equal |
| `≤` | at-most | less or equal |
| `∈` | in | member of |
| `∉` | not-in | not a member of |
| `Δ` | change | difference between two runs |
| `∞` | unbounded | no budget |
| `⇒` | implies | if then |
| `∑` | count | how many |

## frame

| symbol | is | means |
|---|---|---|
| `╔` | frame | corner |
| `╗` | frame | corner |
| `╚` | frame | corner |
| `╝` | frame | corner |
| `═` | frame | edge |
| `║` | frame | edge |
| `╠` | zone | zone rule |
| `╣` | zone | zone rule |
| `┌` | panel | corner |
| `┐` | panel | corner |
| `└` | panel | corner |
| `┘` | panel | corner |
| `├` | panel | tee |
| `┤` | panel | tee |
| `┬` | panel | tee |
| `┴` | panel | tee |
| `─` | panel | rule |
| `│` | panel | rule |
| `┼` | panel | cross |
| `░` | selvedge | the woven edge: light |
| `▒` | selvedge | the woven edge: mid |
| `▓` | selvedge | the woven edge: dense |
| `╱` | braid | strand |
| `╲` | braid | strand |
| `╳` | braid | crossing: the operator sits here |
| `◇` | gem | the hub jewel; Indra's net: every thread is mirrored on the faces, the holons, the helix and the ring |
| `▫` | void | an empty cell: declared, not yet filled |
| `⟨` | key | opens the key panel |
| `⟩` | key | closes the key panel |
| `◦` | ring | the path of one turn of the wheel: Ground (hub), Figure (spokes), Pattern (rim) |

## measure

| symbol | is | means |
|---|---|---|
| `≣` | order test | the spine's Kendall t against the helix; p over n seeded shuffles of the same stages (a budget, disclosed) |

## terms

- **key row**: every thread, addressed: <status><code> <level> <op><grain> <typing> <name>, then refs, then a condition ⇒✗ for an unwoven thread
- **levels**: `0` atom: one framed fragment · `1` unit: one named part, its own void cell · `2` artifact: the sealed whole · `3` loom: chat, build, notebook · `4` house: ladder, standing rules, the record
- **prefixes**: o/ organs/ · g/ gym/ · l/ ladder/ · a/ apps/ · E7/ ../khora/native/ · SP/ ../khora-screenshot-pipeline/native/ · ER7/ ../khora/ · LP/ ../ethos/ · FOLD/ ../the-fold/
