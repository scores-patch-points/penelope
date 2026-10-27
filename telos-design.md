# The Telos — penelope's organ for intended change

*Design, 2026-10-27, session "Fold reading to reasoning pipeline architecture". **Standing: proposal; steps 1-2 are built** (`organs/telos.mjs`: `declareTelos`, `recordTelos`; `organs/telos.test.mjs` 13/13; GLAUCA-EOT GL-TL-01; tapestry thread TLS). Steps 3-5 (`foresee`, `weighTelos`, `precedents`) are not built. Checked against `penelope@59071fd` and `khora@d47865a2` (both in `Downloads/workspace`). Companion to `the-ground-essay.md`. Renamed from "aim" to "telos" by the user on 2026-10-27.*

## 1. Name

**`penelope/organs/telos.mjs`, "the Telos."** Schemas `EOTelos@1`, `EOTelosForesight@1`, `EOTelosOutcome@1`, `EOTelosRecord@1`.

Why not "intention" or "intent": `agenda-conduct.mjs` already exports `intentOf`, the *task* intent (a void's about + measured detail, "never invented"). That says *what to make*. The Telos says *what to do to whom*, and for the sake of what. A shared word would make every grep ambiguous. "Telos" completes the family of organ names (ethos, logos, pathos, nomos) and has no collision in penelope, khora or janus (checked). One caution: Aristotle's telos is an end a thing inherently has; ours is *declared by a giver and can miss*. That is the point of the organ, and the header of `telos.mjs` says so.

`check-spine.mjs` only enforces single ownership for the names in its `SINGULAR` list (`hyperlexicon`, `self-record`, `notes`), so `telos` needs no spine edit to be legal, but `THE-SPINE.md` should gain one line naming it, so the object ownership table stays honest.

## 2. What it is, in one paragraph

Khora's `pathos.js` answers *did this perceiver's ground survive that encounter?* The Telos answers the converse, on penelope's side of the seam: **before drawing, name who the change is for, what verdict-shaped change is meant, on whose authority, and from which part of the record it speaks; disclose a prediction; after delivery, weigh what actually happened; file the miss or the hit on the record; and let the record, not a style guide, be where "how to do that for others" comes from.** It is the house's weave/unweave applied to *effect*: the day (declare, foresee, draw) and the night (weigh, record, supersede).

## 3. How it imports khora's pathos

Exactly the way `minds-ledger.mjs` and `hyperlexicon-record.mjs` reach khora: **through `kernel-reach.mjs`, never by relative path, never by copy.**

```js
import { kernelImport } from "./kernel-reach.mjs";

const { pathosOf, reGroundCondition } = await kernelImport("khora", "native/organs/pathos.js");
const { requireExperiencer }          = await kernelImport("khora", "native/organs/experiencer.js");
const { deriveRelease }               = await kernelImport("khora", "native/kernel/dynamics.js");
```

Consequences, all already house law:
- **Absence is typed.** With no khora checkout, `KernelAbsentError { code: "khora-absent" }` names the exact path tried. Tests use `loadOrSkip` and SKIP with `khora-absent: <path>`; the rest of the gate runs.
- **Penelope never re-derives.** `pathosOf`, `reGroundCondition` and `requireExperiencer` are called, not wrapped into a second definition. The verdict set (`ground_holds | stale | collapse | contested`) is read from khora's output, never restated as a literal here except to *validate* an incoming `expect`. If khora adds a verdict, the Telos's validator is the one place that must follow, and a test pins the set to khora's.
- **The schema is checked at the boundary.** Every khora value the Telos accepts must carry `schema: "EOPathosRead@1"`; anything else throws, as `reGroundCondition` itself does.
- **`dynamics.js` is imported for `deriveRelease` only because `pathosOf` digests the curve to counts** (`operations`, `release: n`). A named-release check ("did *this* obligation release?") needs the raw `Release@1` rows with their `obligation` ids and `witness`es. Khora already returns them; the Telos just asks for them.
- **Nothing is added to khora.** If the Telos later needs a khora change (for example a `pathosOf` option to keep release ids), that is a khora PR with its own review, not an edit smuggled in from here.

## 4. The five doors (all pure; persistence is the caller's, append-only, as in `hyperlexicon-record.mjs`)

### 4.1 `declareTelos(spec) → EOTelos@1 | { refused, reason }`

```
EOTelos@1 {
  forWhom:    requireExperiencer(...)        // {who, read, revision?}; VERIFIED from provenance, never a label
  expect:     "ground_holds" | "re_ground:stale" | "re_ground:collapse" | "re_ground:contested"
  opens:      [address…]    // obligations this artifact is meant to open   (optional)
  releases:   [address…]    // obligations it is meant to release           (optional)
  speaksFrom: [address…]    // record addresses the artifact manifests      (REQUIRED, non-empty)
  giver:      string        // who authorized this change                    (REQUIRED)
  at, thread
}
```

Refusals, typed in the `minds-ledger` style (`REFUSALS` frozen object, never a thrown string):

| refusal | when |
|---|---|
| `no_for_whom` | missing experiencer (pathos's own law: a feeling for no one in particular is kitsch) |
| `unverified_for_whom` | `forWhom` came from a message label, not the turn's own record (GL-CH-06 law 2: the same text under two labels must give one experiencer) |
| `no_giver` | `reGround` already requires a giver; so does an intent to re-ground someone |
| `no_address` | `speaksFrom` empty: the mouth may manifest only what the ground kept |
| `no_expect` | no verdict named |
| `rating_aim` | `expect` is not one of the four verdicts (a score, a rating, a quality word, a number). Pathos "can say nothing else, no rating" |
| `unknown_field` | **as built:** the spec schema is closed, so no score or quality field can ride in beside a valid aim. This replaced the word list the first draft proposed, because the house law is no hand-typed word lists |
| `release_without_open` | a `releases` address that is neither already open in the supplied `beforeFold` nor listed in `opens` |

*Atman = brahman, as a rule:* `speaksFrom` is the inside; the artifact is the outside. An aim with no inside to manifest is refused.

### 4.2 `foresee(aim, { text, state, fold?, delta?, beforeFold? }) → EOTelosForesight@1`

Calls khora's `pathosOf` on the **draft** for `aim.forWhom`, then `reGroundCondition`. Returns `{ predicted, basis, measured: { rhythm, strain, curve }, telosHash }` where `measured.curve` is `false` unless a fold is supplied. **A prediction from an unmeasured curve can never predict `collapse`** (khora's own rule), and the Telos passes that gap through, typed, rather than papering over it.

**Registered first.** The foresight is appended to the record *before* the draw (ladder stage 6: "the bet is recorded before the result"). **Advisory only. It does not gate** (see §6).

### 4.3 `weighTelos(aim, foresight, observed) → EOTelosOutcome@1`

`observed = { read: EOPathosRead@1, delta?, beforeFold?, fold? }`, produced **by khora** over the perceiver's real next encounter (for chat turns, `pathosTurn`; for opencode work, `opencode-pathos.mjs`'s shadow pass). The Telos measures nothing about the perceiver itself.

Returns `outcome ∈ { met, missed, unmeasured }`:
- `met`: observed verdict equals `aim.expect`, **and** every address in `aim.releases` appears as the `obligation` of a `Release@1` row from `deriveRelease`.
- `missed`: otherwise, with the diff named: `{ expected, observed }` and `releases: { aimed, witnessed, unmet }`.
- `unmeasured`: no observed read exists, or the author of the observed turn cannot be verified, or the observed experiencer is not `aim.forWhom`. **A gap is never `met`** and never `missed`.

No score. Ever. "Missed" is a finding, not a number.

### 4.4 `recordTelos(history, entry) → history'`

Appends an `EOTelosRecord@1` in the GLAUCA-EOT contract, **the same shape `recordHyperlexiconEpoch` already uses**: `pipeline`, `status` (`earned | missed | unmeasured | superseded`), `evidence`, `falsifying_control`, `supersedes`. Append-only; to revise, supersede by pointer; "a tripped control IS the finding." Each row carries the aim, the foresight (with its `telosHash` and `at`, proving it preceded the draw), the swatch id of the draw, and the outcome once known.

### 4.5 `precedents(history, aim) → { constraints } | { gap: "no_precedent" }`

This is the "how to do that for others" half, and it is deliberately modest. Find **exact** prior matches (the repo's rule in `grain.js`: "exact, not similar"): `earned` records with the same `forWhom.read` and the same `expect`. From those, return only **mechanical facts the foresight measured**: for example "rhythm did not flatline", "strain stayed `report`", "opens preceded releases". These are constraints a composer can satisfy and check; they are not feelings and they are never phrased as cues. With no exact match the answer is the typed gap `no_precedent`. **It never interpolates from "similar" readers.** The instructions for generating a given change therefore start empty and fill in only as the record earns them.

## 5. Where it sits in penelope's spine

The house spine is `read → settle → fill → snip → probe → test → seal`.

| spine step | Aim door |
|---|---|
| before read/settle | `declareTelos` (no draw happens without one for a change-bearing artifact) |
| probe | `foresee` (prediction registered on the record) |
| test | the existing gate decides the **draft**; the Telos does not replace it |
| seal | `recordTelos` files the aim + foresight with the draw's swatch id |
| *the night, after delivery* | `weighTelos` on the perceiver's next encounter, then `recordTelos` again (earned/missed/unmeasured, or supersede) |

In cube terms (`resolver.mjs`, penelope's closed 27-cell taxonomy, already exists): `declareTelos` is Generate-mode at Interpretation (a `DEF` of what is to be made true of a perceiver), `weighTelos` is `EVA`, and `recordTelos` is `REC`, whose route the resolver already sends to `box/record`. **The Telos is the DEF → EVA → REC loop of `minds-ledger.mjs` with a perceiver instead of an interlocutor**, which is why `minds-ledger.mjs` and `hyperlexicon-record.mjs` are its two templates.

## 6. The laws it must keep (all already in the house; found in the code)

1. **Pathos never gates and never grades; it discloses** (`steersman.mjs:34`, `voice.mjs:29`). So `foresee` is disclosed and advisory; `weighTelos` never blocks a delivery after the fact. A `missed` aim becomes a finding to supersede, never a refusal of the artifact.
2. **The mouth is never cued with a name or a feeling** (`steersman.mjs`; `opencode-pathos.mjs`: "the code model never gets feelings; the only thing that can reach it is a mechanical fact"). `precedents` returns structural constraints only.
3. **Experiencer from provenance, not from a label** (GL-CH-06). The Telos refuses an unverified `forWhom` and `weighTelos` returns `unmeasured` when the observed turn's author cannot be verified.
4. **A gap is never a verdict.** Unmeasured curve ⇒ no `collapse` predicted or counted; no observation ⇒ `unmeasured`, not `met`.
5. **Append-only, superseded by pointer** (GLAUCA-EOT contract).
6. **Reach siblings only through `kernel-reach.mjs`.**

## 7. Honest limits

- **Human perceivers are only visible through what they do next.** Khora can read a person's next message or edit as an encounter against their fold; it cannot see inside them. So the Telos's "observed change" is *change in the record of their next acts*. That is the same limit khora's pathos already has, stated here so nobody reads `met` as "the person felt X".
- **In chat the curve is unmeasured today.** GL-CH-06 notes `collapse` cannot fire there, `strain` stays `report`, and `stale` is the one live register. So for chat turns the Telos can honestly aim at `ground_holds` or `re_ground:stale` only. Aiming at `collapse` or `contested` requires a measured fold (the opencode path has one).
- **`precedents` will return `no_precedent` for a long time.** That is the design working, not failing.
- **Everything here is a proposal.** I did not run any of it, and I read `aim`-adjacent code by header and by named lines, not every consumer.

## 8. Falsifying controls (to write before the code, per ladder stage 6)

- An aim is declared with a `forWhom` taken from a message label and is *accepted*.
- `foresee` returns `collapse` with `measured.curve === false`.
- `weighTelos` returns `met` when no observed read exists.
- `recordTelos` rewrites or deletes an earlier row.
- A `precedents` result is returned for a *similar* but not exact reader.
- A `rating_aim` (score/quality) is accepted.
- A khora verdict is added and the Telos's validator does not fail its pinned-set test.
- Any change in `rhythm`/`strain` is claimed from penelope's own computation instead of khora's `pathosOf`.

## 9. House duties to finish it (penelope `CLAUDE.md`)

A new organ is a process change, so: re-weave a thread of `TAPESTRY.md` and run `node gym/check-tapestry.mjs --stamp`; **append** a `GLAUCA-EOT.md` entry with a real `path:line` and a falsifying control (use §8); run `node gym/handmaidens.mjs` and address Eurycleia (thread named), Autonoe (every draw recorded on the swatch), Iphthime (every claim grounded), Telemachus (every draw inside the sanctioned door); `npm test` ends with `house-ratchet.mjs`, which fails only on a NEW red line.

## 10. Build order

1. `declareTelos` + `REFUSALS` + tests for each refusal (no khora needed beyond `requireExperiencer`).
2. `recordTelos`, copying the shape of `hyperlexicon-record.mjs`.
3. `foresee` (first real khora import via `kernelImport`; `loadOrSkip` tests).
4. `weighTelos`, reading `pathosTurn` output; include the named-release check through `deriveRelease`.
5. `precedents` (last, because it has nothing to read until step 2 has run in anger).
6. Tapestry thread, EOT entry, handmaidens, spine line.

## 11. Open decisions for Michael

1. **The name.** Decided: `telos` (user, 2026-10-27).
2. **Does every artifact need an aim,** or only artifacts that are *meant to change a perceiver* (a brief, an essay, a status report) as opposed to artifacts that are only *true* (a code fix)? I assumed the second kind declares nothing and the Telos stays out of the way.
3. **Who may be `giver`?** The user, an agent acting on the user's brief, the ladder's agenda? `reGround` only needs a non-empty name; the Telos probably wants a stricter rule (a named human or a named standing order).
4. **Whether a `missed` aim should be able to veto** a later reuse of the same moves in `precedents`. I assumed no: it simply isn't `earned`, so it's invisible to `precedents`, and the miss stays on the record as a finding.

## 12. Changes made while building steps 1-2

- **Closed schema instead of a word list** for rating-shaped aims (`unknown_field`; a non-verdict `expect` is `rating_aim`). The first draft's list of forbidden field names broke the house rule against hand-typed word lists.
- **`provenance` is a required spec field** ({source: "record", ref}); that is how `unverified_for_whom` is checkable without a hand-typed list of labels. Only `"record"` is accepted.
- **`VERDICTS` is a literal in `telos.mjs`, pinned by a test** to what khora's `reGroundCondition` returns, because khora exports no list to import.
- **`release_without_open` uses khora's `deriveTension`** (exported) to find the open obligations of a supplied `beforeFold`, so penelope does not reimplement what counts as open.
- **`recordTelos` refuses a result filed before its declaration,** which makes "registered first" a property of the record rather than a promise.
- **Open, carried by the house:** `node gym/check-tapestry.mjs --stamp` is blocked for everyone by two unrelated uncovered files (`organs/fold-note.mjs` and its test), so the two DRIFT lines for the telos files stay red until someone with that thread stamps.
- **Environment:** a root-owned `.fseventsd` directory in the repo root makes `check-tapestry.mjs` and `house-ratchet.mjs` crash with EACCES (they walk the whole tree). The checks were run in a clean clone instead.

## 13. Identity verdict, from the identity thread (2026-10-27; not built, not verified against its canon)

The session "Identity detection for content moderation" answered how an identity verdict would plug in: a verdict is **per frame**, so it must carry its frame and a telos entry must record it. Its shape, as reported: `{verdict: same|different|undecided|refused, tied?, excluded[], plateau{noise,dmd,width}, frame{cell, asof, whom{who,read,revision}, purpose}}`. `forWhom` here is only the `whom` part; `asof` and `purpose` are missing, and "no purpose means refused" on their side.

Consequences for the telos, all for steps 3-5 and none applied yet:
- `weighTelos` weighs only on `same`; `different` and `undecided` give `unmeasured`; `refused` refuses to weigh. A gap is never a hit.
- `precedents` asks identity instead of comparing `forWhom` strings; a tied set returns `no_precedent`.
- A REC that changes any frame field invalidates the old verdict; keep old and new side by side, as khora's `reGround` keeps the old ground's fingerprint.
- **Open decision for the user:** `declareTelos` has no `asof` or `purpose` today. Adding them changes the `EOTelos@1` schema (closed) and so its hash; do it before any telos is filed for real, or version the schema.
