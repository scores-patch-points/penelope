# PRIMITIVES-IN-EOT: the identity theory's primitives, built up from the nine operators
Draft 1, 2026-11-19. Theory construction. Nothing here is measured and there are no data numbers. The only numbers are counts the checker printed about the construction itself. Everything is a hypothesis to refute unless a line cites a file.

Files (all in this folder): `primitives.eot` (the assembly chain), `check_eot.mjs` (the checker), `negatives.eot` (assemblies the checker must refuse, several being my hypotheses written literally), this note.

Short names for citations: **CUBE** = `/Users/mlacy/Documents/khora-cast/penelope/organs/cube.mjs`. **SPEC** = `/Users/mlacy/Documents/khora-cast/pharos/SPEC.md`. **PH** = `/Users/mlacy/Documents/khora-cast/pharos/lib/pharos.mjs`. **SIGA** = `/Users/mlacy/Documents/khora-cast/pharos/eoql/SIG-ANSWER.md`. **OWN** = `/Users/mlacy/Documents/khora-cast/pharos/eoql/prior/owner-surf-sniff-sig-2026-11-14.md`. **JC** = `/Users/mlacy/Documents/janus/native/organs/identity/CUBE.md`. **27** = `/Users/mlacy/Documents/khora-cast/khora/native/docs/THE-27-CELLS.md`. **ADDR** = `/Users/mlacy/Documents/khora-cast/khora/native/docs/THE-ADDRESS.md`. **ISTH** = `/Users/mlacy/Documents/khora-cast/khora/native/docs/THE-ISTHMUS.md`. **TH** = `/Users/mlacy/Documents/khora-cast/penelope/experiments/zero-overlap/referent/THEORY-IDENTITY.md`. I did not re-read THE-HOLOGRAPH.md in full; I cite it only through ADDR and TH.

## 0. The method in five lines
1. Cells come from CUBE (`cellOf`, `coherent`). Where CUBE and the skill's examples disagree, CUBE wins (CUBE:9-12): DEF at Lens is Dissecting, EVA at Lens is Binding.
2. A construction is a chain of assemblies in dependency order. Each has a contract `{ops, terrains, stances}` and is closed by `!EVA`.
3. My one extension to the skill's surface: `!OP(Site, Stance) subject reads .. points .. returns ..`. The skill has `!OP target` and `OP(Site, Stance)` separately; I joined them so every event names its cell.
4. The rule I use for "helix order": a thing may only READ things born by an operator at or before its own in `NUL SIG INS SEG CON SYN DEF EVA REC` (CUBE:37). `points` (SIG only) is a pointer and carries no dependency. `returns` (NUL only) is the wrap: what a later operator made re-enters the next turn as an encounter. This rule is mine. It is checked, but it is a choice, not canon.
5. The SIG law is encoded as a rule: nothing but SIG reads a thing born by SIG. That is SIGA:65 ("No claim may name a mark ... so the whole stream can be dropped without changing any id or answer"), turned into a check.

## 1. What the floor is
The floor is what primitives.eot declares `: assumed`, plus one NUL event (the world hands over bytes). Nothing else in the chain is assumed.

| floor item | why it cannot be built from the operators | could it shrink? |
|---|---|---|
| `world`, `bytes` | NUL holds something; something must be delivered. An encounter needs a thing encountered. | No. This is the Void (CUBE:54: Ground is the hub). |
| `sha256` | Content addressing needs a collision-resistant function. EOT has no arithmetic. | Only by changing the theory to non-content ids. |
| `canon_form` | One canonical serialisation, so two writers hash the same entry the same way (SPEC:32). | No. |
| `store` | A write-once place that keeps entries and lets a writer list what is there. The checker proves tamper-EVIDENCE (ids match content). Nothing in EOT makes a medium refuse overwrite: tamper-PROOFING is assumed. | No. |
| `grid` | The 27-cell cube and `coherent` are the language itself. Assuming them is assuming EOT. | No, by definition. SPEC:13 and CUBE agree the cells are data. |
| `names` | Declared strings: tags, writer names, versions, tolerance values. A declared tag is never a clock (SPEC:13, `at` computed in the pharos library; the theory wants it declared). | No. These are the asker's and writer's inputs. |
| `region_decode` | The medium's own decoder to canonical bytes (pixels in a box, a time range). An address hashes DECODED bytes (TH:151-166). | Material-specific; external. |
| `codec_program` | The per-material decoder into EOT claims (ISTH:21-24). The theory constructs the DECLARATION of a codec, not the parser. | External by the isthmus charter. |
| `nominator_program` | An embedder or string search. | External by design: it only nominates (OWN:20). |
| `protocol_kinds` | `frame`, `kind`, `holon`, `retract` with their cells are valid before any declaration (PH:14). The first `kind` entry cannot be declared by a kind that is not yet declared. | Yes in principle, by writing them as the log's first entries (PH:11 says `open()` does). I left them assumed. |

Also assumed and not listed in the file: sets, finite sequences and string equality (used by `of`, `seen`, lists), and Node itself (the checker).

Not constructed at all, and not claimed: signatures (`by` is unsigned in pharos: PH:15 lists `by` as computed, SPEC:31 calls it provenance); the concurrent-order tie-break (SPEC:55); the fold algorithm that applies retractions; any numeric strength, knee or tolerance value; the outcome logic of a verdict (Other/Same/Hold). The checker checks dependencies, not meanings.

## 2. The construction table
Cells are `OP(Site, Stance)` as the checker verified them with `coherent()`. "Helix deps" are the operators read, in order. Status words: DERIVED (fits as hypothesised), DERIVED WITH A GAP (fits only after a change or an assumption), DOES NOT FIT (the hypothesis as stated is refused; what fits instead is given).

| primitive | construction in primitives.eot | helix deps | still assumes | status | falsifier |
|---|---|---|---|---|---|
| **cell** (entry field) | `DEF(Lens, Dissecting) f_cell` reading `grid`. The entry is a reified event; its `cell` is the cell of this very act. | grid -> DEF | the grid | DERIVED WITH A GAP (the grid is floor) | an entry whose `cell` is not the cell of the act that wrote it, or not in the 27 |
| **kind** | `DEF(Lens, Dissecting) kind_decl` then `f_kind`; PH:14 gives `kind` the cell DEF·Figure | names -> DEF | the four protocol kinds | DERIVED WITH A GAP (bootstrap) | a kind used with no declaring entry that is not protocol |
| **addr** (entry field) | `SEG(Link, Dissecting) region`, `DEF(Lens, Dissecting) seal` (hash of decoded bytes), `DEF addr_value`, `EVA(Lens, Binding) reopen`. SIG only locates (`locator`). | SEG -> DEF -> EVA | sha256, region_decode | **DOES NOT FIT** as "addr = SIG". The stored address carries a hash, a value. SIGA:59 says SIG is a pointer with no value. SIG finds; DEF records. | an address that re-opens to other bytes (TH L12/L17 falsifier) |
| **body** | `NUL(Entity, Dissecting) payload` | world/wrap -> NUL | world | DERIVED. Everything that enters the log enters as a NUL hold, from the world or by the wrap. | a body that did not pass through a hold |
| **of** | `DEF f_of` fixes the declared ids before the id exists; `CON(Link, Binding) bond_of` makes the edge in R after the entry is minted | NUL -> DEF ... INS -> SEG -> CON | | DERIVED WITH A GAP: two placements. The field is a DEF; the bond is a CON. Content addressing forces the field to be fixed before the thing it points from exists. | an `of` id naming an entry not present at weave |
| **seen** | `SEG(Network, Unraveling) frontier` (the heads), `DEF f_seen` freezes it; `SIG(Void, Tending) look` is the writer's attention | NUL -> SEG -> DEF | store | **DOES NOT FIT** as "SIG attention state". The stored `seen` is ids, hashed into the id, so it persists. SIGA:65 forbids a persisting field to be a mark. SIG is the looking (read by nothing: checked); SEG is the cut; DEF freezes it. | a `seen` that differs from the true maximal set at weave |
| **by** | `DEF f_by` reading a declared name | names -> DEF | names; no signature | **DOES NOT FIT** as "signed origin (SIG)". pharos does not sign (SPEC:31, PH:15). A signature is a new floor item (public-key signing) the theory does not yet have. | an entry whose `by` can be forged by another writer, if the owner wants non-forgeable provenance |
| **at** | `DEF f_at` reading a declared tag | names -> DEF | names | DERIVED | an `at` copied from the engine clock |
| **basis** (not in my hypothesis list) | `DEF f_basis` | names -> DEF | names | DERIVED | |
| **id** | `INS(Entity, Making) entry` reading `candidate` (an encounter with the finished, checked draft), `sha256`, `canon_form` | ... DEF -> EVA -> (wrap) NUL -> INS | sha256, canon_form | DERIVED WITH A GAP. "id = INS" is right in kind, wrong in place: the id hashes `kind`, `at`, `seen` (all DEF) so INS cannot come first. It comes after DEF and EVA, through the wrap. Written literally it is refused (negatives: `h_id_is_ins`). | two entries with equal content and different ids, or the reverse |
| **R** | `SEG(Link, Dissecting) cut_entry`, `CON(Link, Binding) bond_of / bond_seen`, `SYN(Network, Composing) r`, `EVA(Lens, Binding) r_checked` (ids match content, cells known, prior kept) | INS -> SEG -> CON -> SYN -> EVA | store, sha256, canon_form | DERIVED WITH A GAP. R is what one turn of the helix leaves: R(n+1) = turn(R(n)). The checkpoint EVA is exactly the hypothesised close. The growth is INS, not REC (see below). | an entry in R whose id is not sha256 of its canon, or a prior entry missing from a later R |
| **append-only change = REC** | an ordinary append is INS by the wrap. REC fires only when an EVA has broken a frame (`merge`, `reassignment`, `tightening`, `codec_widen`). | EVA -> REC | | **DOES NOT FIT** as "all change is REC". Checker rule: REC must read an EVA-born thing; an append with no EVA before it is refused (negatives: `h_append_is_rec`). SIGA:66-67 (item 10) also puts "a hot path sticks" at REC, not every write. | an ordinary append that needed a prior EVA of the frame |
| **retraction** | `NUL(Entity, Dissecting) retraction` (the retract kind's cell in PH:14), `DEF retract_notice`; the notice re-enters by the wrap | wrap -> NUL -> DEF | the fold that applies it (SPEC:34, PH:377) | DERIVED WITH A GAP. Fits pharos exactly. The view change (the fold hiding the retracted entry) is not constructed. | a retraction that erased bytes |
| **address** | see addr | | | see addr | |
| **being** | `NUL first_seen` (a first admission, received by wrap) then `INS(Entity, Making) being`. A being IS the id of its birth entry, kept. | wrap -> NUL -> INS | | DERIVED WITH A GAP. Stable because the entry is immutable and never re-minted, not because of its content. Whether a refreshed read births a NEW being is not decided by hashing; it is decided by a verdict (TH row 34 found 0 of 850 ids survived a fresh read, per TH:125; I cite it, I did not re-measure). ADDR:210 (A2, birth not spelling) is consistent. | a being whose id changes between two appends |
| **mention** | `CON(Link, Binding) mention_a reads region, being` | INS, SEG -> CON | | DERIVED | a mention bond whose region does not re-open |
| **standing** | `SEG(Network, Unraveling) as_of`, `SYN(Network, Composing) mention_net`, `DEF(Lens, Dissecting) standing` over the net and the claim | SEG -> SYN -> DEF | | **DOES NOT FIT** as "SYN of mentions and claims". SYN is before DEF in the helix; a claim is a DEF; SYN cannot read it (negatives: `h_standing`). Fits as: SYN of mentions (JC:17 places a class of aligned nodes at SYN·Pattern), then a DEF that says what the record currently holds. | a standing that cannot be recomputed from R up to its cut |
| **standpoint** | `DEF concerns`, `DEF tolerance`, `DEF(Atmosphere, Clearing) scope_ground`, `DEF standpoint` reading `as_of`; its concern region is a `filter` with a `contract` and a `within` | grid, names -> DEF | names (tolerance values are the asker's) | DERIVED WITH A GAP. It is a CONTRACT-shaped value: a region of the cube. But a contract is three lists, which is a product; an arbitrary set of cells is not always a product, so the smallest contract holding it can be wider (slack, section 3). Ground is DEF at Ground, an empty cell (27:449-461). Time is a causal CUT of R (SEG), not a clock. | an asker whose concerns cannot be written as a contract without silent width |
| **claim** | `SEG(Field, Clearing) holon_ground`; `CON(Link, Binding) arg0, arg1`; `DEF(Paradigm, Unraveling) relation` (with polarity, from the codec); `DEF(Lens, Dissecting) claim`. One grain each: Ground, Figure, Pattern. | SEG -> CON -> DEF | codec_program | DERIVED WITH A GAP. The decoded content (relation, polarity) is the codec's output, which is floor. | a claim whose roles are not bonds to mentions |
| **nomination** | `SIG(Entity, Binding) nominee points ..` then `NUL(Entity, Dissecting) candidate_held returns nominee` | SIG; wrap -> NUL | nominator_program | **DOES NOT FIT** as "nomination = NUL". The nomination is a pointer (SIG); the NUL is the later look. SIGA:80 (proposed wording, not a ruling): "a nomination is SIG when removing it changes no answer at equal completeness". The checker shows nothing reads the pointer. | a verdict that changes when every nomination is removed at equal completeness (TH L3) |
| **discernment** | `SIG notice` (ephemeral), `DEF difference` (witnessed: both claims), `EVA(Lens, Binding) discernment` (above tolerance, inside the concerns) | SIG; DEF -> EVA | | **DOES NOT FIT** as "a discernment is a SIG mark". An Other must stay until its witnesses are retracted (TH:19-24, def 6), so the witness must persist; SIG does not (SIGA:59-65). OWN:14 says SIG "records a mark only if something actually differs". That wording and SIGA:65 conflict (open question 1). Fits as: SIG notices, DEF writes the difference, EVA keeps it. | a persisted discernment that was only a SIG notice |
| **hunger list** | `SIG(Void, Tending) wanted points holes` (the asking); `DEF holes`; `DEF hunger_list` (the recorded list in a Hold) | DEF -> SIG; DEF | | DERIVED WITH A GAP. SIG at Ground is right for the act (JC:12 places "which missing evidence would settle it" at SIG·Ground). The recorded list is DEF, because a Hold entry must carry it. | a Hold whose list names a fact whose fetch could not decide the pair |
| **license** | `CON(Link, Binding) tie` (a candidate bond) -> `EVA(Lens, Binding) license` reading `tie`, `null`, `standpoint` -> the established bond is a CON in the NEXT turn (`same_bond`), the standing change is a REC | CON -> EVA; wrap -> CON; EVA -> REC | | **DOES NOT FIT** as "CON gated by an EVA". The gate (EVA, 7) is after the bond (CON, 4) in the helix; a CON reading its own gate is refused (negatives: `h_license`). What fits: propose the bond, evaluate it, apply it by REC after the wrap. | a bond that exists in R before its gate |
| **null** | `DEF(Atmosphere, Clearing) null` reading the ground view | NUL -> DEF | | DERIVED WITH A GAP. JC:18 puts the rewiring null at "Ground". DEF at Ground is one of the three cells 27:449-461 lists as having no organ. This is a use of an empty cell, a lead (27:407-413), not a proof it is right. | a null that must be a Figure object to be computed |
| **verdict** | `EVA(Lens, Binding) verdict` reading `license`, `discernment`, `hunger_list`, `standpoint`; it returns to the log by `NUL payload returns verdict` | DEF, EVA -> EVA; wrap | | DERIVED WITH A GAP. An EVA event returned to the log: yes, by the wrap. The three values Other / Same / Hold are not typed in EOT; the checker does not check them. | a verdict recorded with no standpoint stamp (TH L7) |
| **merge** | `NUL accepted returns verdict`, `CON same_bond`, `SYN closure`, `EVA closure_ok` (does the closure contradict a discernment), `REC merge` | wrap; CON -> SYN -> EVA -> REC | | DERIVED WITH A GAP. Gate then apply is helix-natural: EVA then REC. The component-hold rule's logic (TH:122) is not encoded. | a merge applied over a witnessed discernment |
| **reassignment** | `REC(Lens, Making) reassignment` reading `discernment` | EVA -> REC | | DERIVED | a reassignment with no discernment behind it |
| **tolerance tightening** | `REC(Lens, Making) tightening` reading `verdict`, `tolerance` | EVA -> REC | | DERIVED | a tightened rung applied with no EVA |
| **codec** | `DEF codec_decl`, `DEF(Atmosphere, Clearing) invariances`, `DEF loss`, `EVA codec_check`, `REC codec_widen` | DEF -> EVA -> REC | codec_program, region_decode | DERIVED WITH A GAP. The declaration, its accidental set, its disclosed loss, its check and its widening all fit. The round-trip check (TH L26) is "proposed, untested" and only language has an encoder; the checker checks the check's dependencies, not that a round trip holds. Invariances are DEF at Ground again (second use of an empty cell). | a codec change applied with no recorded check |

## 3. What the checker checked (real output)
Command: `node check_eot.mjs primitives.eot`, run 2026-11-19. It first runs CUBE's own `selftest()`.

```
file: primitives.eot
assemblies: 16   assumed floor names: 11

PASS  floor       room  events  1  region  1 cells  slack 0
PASS  encounter   room  events  1  region  1 cells  slack 0
PASS  address     room  events  6  region  4 cells  slack 0
PASS  codec       room  events  5  region  4 cells  slack 0
PASS  weft        room  events 18  region  8 cells  slack 1 [SIG·Figure]
PASS  record      room  events  5  region  4 cells  slack 0
PASS  being       room  events  6  region  3 cells  slack 0
PASS  claim       room  events  5  region  5 cells  slack 1 [SEG·Figure]
PASS  standing    room  events  3  region  3 cells  slack 0
PASS  standpoint  room  events  4  region  2 cells  slack 0
PASS  nomination  room  events  2  region  2 cells  slack 0
PASS  discernment room  events  3  region  3 cells  slack 0
PASS  verdict     room  events  7  region  6 cells  slack 1 [EVA·Ground]
PASS  judgment    space events  0  region  9 cells  envelope slack 1 [NUL·Ground]
PASS  change      room  events  9  region  7 cells  slack 1 [SYN·Figure]
PASS  theory      space events  0  region 19 cells  envelope slack 2 [CON·Ground REC·Pattern]

SIG-born things: locator, look, nominee, notice, wanted
  locator: read by nothing
  look: read by nothing
  nominee: read by nothing
  notice: read by nothing
  wanted: read by nothing

wraps (NUL receives what a later operator made): 14
  weft:ground_view <- r_checked (EVA)
  weft:payload <- verdict (EVA)
  weft:payload <- discernment (EVA)
  weft:payload <- merge (REC)
  weft:payload <- reassignment (REC)
  weft:payload <- tightening (REC)
  weft:payload <- retract_notice (DEF)
  weft:payload <- codec_widen (REC)
  weft:candidate <- draft_checked (EVA)
  being:first_seen <- entry (INS)
  being:second_seen <- entry (INS)
  nomination:candidate_held <- nominee (SIG)
  change:accepted <- verdict (EVA)
  change:retraction <- entry (INS)

events on the three cells THE-27-CELLS.md lists as empty (leads, not errors): 3
  codec:invariances DEF·Ground
  standpoint:scope_ground DEF·Ground
  verdict:null DEF·Ground

distinct cells fired: 15 of 27

RESULT: PASS (16/16 assemblies clean)
```

Command: `node check_eot.mjs --negatives negatives.eot`.

```
file: negatives.eot
assemblies: 13   assumed floor names: 4

PASS  base             (no expectation; must be clean) 
REFUSED-AS-EXPECTED  h_id_is_ins      expect dependency           got [dependency,closure-violation]
      INS (helix 2) reads kind_decl, born by DEF (helix 6): dependency runs backward
REFUSED-AS-EXPECTED  h_addr_is_sig    expect sig-law              got [sig-law,closure-violation]
      DEF reads ptr, born by SIG: erasing SIG would change addr_field
REFUSED-AS-EXPECTED  h_license        expect dependency           got [dependency,closure-violation]
      CON (helix 4) reads gate, born by EVA (helix 7): dependency runs backward
REFUSED-AS-EXPECTED  h_standing       expect dependency           got [dependency,closure-violation]
      SYN (helix 5) reads kind_decl, born by DEF (helix 6): dependency runs backward
REFUSED-AS-EXPECTED  h_append_is_rec  expect prerequisite         got [prerequisite,closure-violation]
      REC append reads no EVA-born thing (a frame is restructured only after an evaluation)
REFUSED-AS-EXPECTED  verdict_no_wrap  expect dependency           got [dependency,closure-violation]
      INS (helix 2) reads v, born by EVA (helix 7): dependency runs backward
REFUSED-AS-EXPECTED  mixed            expect grain-mixed          got [grain-mixed,closure-violation]
      grain-mixed: Void is Ground, Making is Figure
REFUSED-AS-EXPECTED  desert           expect desert-cell          got [desert-cell,dependency,closure-violation]
      contract region contains SYN at Ground
REFUSED-AS-EXPECTED  outside          expect contract-violation   got [contract-violation,closure-violation]
      DEF(Lens, Dissecting) = DEF·Figure is outside outside's contract region
REFUSED-AS-EXPECTED  tempus           expect unassembled          got [unassembled,closure-violation]
      tempus has no closing !EVA
REFUSED-AS-EXPECTED  narrow_space     expect narrowing-violation  got [narrowing-violation,closure-violation]
      part base is not inside narrow_space's contract
REFUSED-AS-EXPECTED  wide_space       expect width-violation      got [width-violation]
      wide_space.contract.ops has REC, which no part has

RESULT: PASS (negatives: every expected refusal observed)
```

What this does and does not show.
- It checked: every event is coherent under CUBE; no desert cell in any event or contract region; every event is inside its assembly's contract region; every read is of a defined thing born at or before the reader's operator (the only backward edges are the listed wraps); REC reads an EVA-born thing; EVA reads a DEF-born thing; CON and SYN read at least two things; nothing but SIG reads a SIG-born thing; every assembly is closed by its own `!EVA`; each part of a space is inside the space's contract; each space's lists are exactly the union of its parts' lists (two spaces, `judgment` and `theory`); the filter `asker` is inside `theory`.
- It did not check: that any construction MEANS what I say; the three verdict values; that a round trip holds; anything about data.
- Defects in my own assembly: **the checker found none on its first run of primitives.eot.** I designed the assemblies against its rules before running it, so a clean first run is weak evidence. The negatives are the test that the rules bite: all twelve refusals were observed, and two single-line mutations of primitives.eot (one space contract narrowed; `entry` changed to read `draft` instead of `candidate`) each came back FAIL with the expected code. Where my first drafts of the hypotheses would have failed, I corrected them on paper and they appear in the negatives (`h_*`), not in the chain.
- The negatives also print a `closure-violation` (room in no space). That is noise from the test file having no top space; it is not the expected code.
- Slack, reported not failed: `weft` SIG·Figure, `claim` SEG·Figure, `verdict` EVA·Ground, `change` SYN·Figure, `judgment` NUL·Ground, `theory` CON·Ground and REC·Pattern. Each is a cell the three-list contract admits by product and no event uses. This is the checked form of "a contract is a product, not an arbitrary region".
- Checked fact on SIG: five things are born by SIG (`locator`, `look`, `nominee`, `notice`, `wanted`). Nothing reads any of them. By the SIG law, removing every one changes nothing built here. (`nominee` is received by a NUL wrap, which is the allowed "steer": more looking.)

## 4. Where the hypotheses failed
Each is stated as given, then what fits.
1. **addr = SIG.** Fails. The stored address carries a sha256, a value. SIG carries none (SIGA:59). Fits: SIG locates, SEG cuts, DEF seals, EVA re-opens.
2. **seen = SIG attention state.** Fails as a field; holds as the act. Fits: SIG looks, SEG finds the heads, DEF freezes them into the entry.
3. **by = signed origin (SIG).** Fails twice. pharos does not sign (SPEC:31; PH:15). And a persisted origin cannot be a SIG mark. Fits: DEF of a declared name. A signature would need a new floor item.
4. **id = INS.** Fits in kind, fails in place. INS cannot precede the DEF fields it hashes. Fits: INS after DEF and EVA, entered through a NUL wrap.
5. **of = CON.** Half. The edge is a CON. The field that pins it is a DEF, fixed before the id exists.
6. **Append-only change only by REC.** Fails. Ordinary growth is INS. REC is for a frame broken by an EVA. Retraction is NUL at Figure, as pharos has it (PH:14).
7. **Nomination = NUL.** Fails. The nomination is a SIG pointer (SIGA:80). The look it causes is NUL. This matches the owner's loop: sniff to aim, then surf (OWN:7-14).
8. **Discernment = SIG mark.** Fails against SIGA:59-65. Fits: SIG notices (ephemeral), DEF writes the witnessed difference, EVA keeps it. OWN:14 reads the other way; this is for the owner.
9. **Hunger list = SIG at Ground.** Half. The asking is SIG at Ground (JC:12). The list a Hold carries is DEF.
10. **License = CON gated by EVA against a null.** Fails on order. Fits: CON proposes, EVA gates, REC applies after the wrap.
11. **Standing = SYN of mentions and claims.** Fails on order. SYN folds mentions; a DEF reads the fold and the claims.
12. **Standpoint = a contract.** Holds, with a flaw: a three-list contract is a product, so some concern sets cost silent width.
13. **Helix gives "upstream of a concern" and the arrow of time for free.** Mostly no. Analysis, not checked except where stated:
   - Helix is an order on OPERATORS (CUBE:37). "Upstream of a concern" in TH:15 (def 2) is an order on CLAIMS (the destroy test). The first gives a necessary condition: a difference at cell X cannot be upstream of a concern at cell Y if X's operator is after Y's, within one turn. It is not sufficient.
   - The condition holds only inside a turn. The checker counted 14 wraps; each is an edge from a later operator to the next turn's first. Across a wrap "upstream" turns round. So the order is a cycle, and "upstream" needs a turn index.
   - The arrow of time does not come from the helix. It comes from content addressing: an entry can only name ids that already exist, so `of` cannot form a cycle (an argument from the hash, not checked). Helix gives the order of KINDS of act within one entry's weaving. Across entries the order is R's causal order (SPEC:55).
   - One thing the helix does give for free: the tie-break among concurrent entries. SPEC:55 orders concurrent entries by cell `rank`; `cells.json` ranks run in helix order, NUL·Ground at 0 (`/Users/mlacy/Documents/khora-cast/pharos/cells.json`, first cells).
14. **A new finding the hypotheses did not name:** the helix is a cycle in use. Every product of Interpretation (verdict, discernment, merge, retraction, widening) re-enters through a NUL. 14 of the wraps in primitives.eot. The log is where the helix closes.

## 5. Open questions for the owner
1. SIG and discernment: OWN:14 says SIG records a mark; SIGA:59-65 says SIG never persists. I resolved it as SIG notices, DEF/EVA record. Confirm, or say which of the two sources moves.
2. The wrap: may every product re-enter only as a NUL hold? The checker allows `returns` on NUL alone.
3. DEF at Ground is used three times (the null, the standpoint's ground, a codec's invariances). It is an empty cell (27:449-461). Is that a lead worth taking, or a sign the Ground is placed wrong?
4. `by`: do you want signed provenance? That adds a floor item and changes the hash.
5. Contracts as three lists cannot say some regions. Should a standpoint's concerns be a list of cells instead?
6. Should `id` be called INS, or should the content hash be a DEF seal and INS be the entry? The construction works either way; the names differ.
7. Who ratifies the four protocol kinds, so the floor can drop them?
