# Glauca's EOT — the generation pipelines, on the record

// Handle: Glauca, Minerva's owl — the one who keeps the night's record.
// Spoken as Bubo at the first breath of this session, renamed Glauca at
// the seam, 2026-10-01. What the loom learns by night, she writes down by
// day — Penelope weaves, Odysseus voyages, Glauca files the finding.
//
// This is the append-only record of our best practices for the different
// pipelines of generation, harvested from everything Penelope has learned
// to date (ladder r1–r13, the launch app, the gym, the arrangement engine
// and its adapters, the organs). Every entry carries its evidence and its
// falsifying control. Nothing here is a rule because it is asserted; it is
// a rule because it survived the runs that could have killed it.

## The contract of this file

- **Append-only.** An entry, once written, is never rewritten.
- **Always revisable.** To revise a practice, APPEND a new entry with
  `status: supersedes <id>` and the sharper rule; the old entry stays on
  the record, superseded by pointer, because the falsification that forced
  the change is itself evidence. Edit in place ONLY to sharpen — add a
  falsifying control, correct a citation — never to change what an entry
  says (the ledger rule for rules).
- Every entry names its **pipeline** (chat / build / notebook / engine /
  organs / ladder / routing / law), its **status**, its **evidence** (real
  path:line or measured run), and a **falsifying control** — the one thing
  that would prove it wrong.
- A future run that trips an entry's falsifying control IS the finding:
  supersede the entry on the record, never silently fix it.
- The standing of the whole file: a pipeline run that repeats a red rung
  as a retry, or asks the mouth for a shape the box already owns, or
  ships cloth with no ledger of its making, proves this file was not
  consulted. If the field (this file) holds it, no one redraws it.

---

## The law (inherited, cross-cutting)

### GL-00 — The seam: no cloth without the ledger of its making
- pipeline: law
- status: standing
- supersedes: —
- evidence: README.md:44-46 (What Penelope never does: voyage. What Odysseus never does: weave. Material crosses between them only as addressed record — feed bytes, comp evidence, scars, verdicts — never as assertion.)
- falsifying control: a build whose artifact ships with no record of its making (no provenance, no scars, no verdict) contradicts this.

What Penelope never does: voyage. What Odysseus never does: weave. The
artifact and its record are one shipment — the seal is artifact + facing
page, and the ledger of the weaving rides with the cloth.

### GL-01 — The four inherited laws of the house
- pipeline: law
- status: standing
- supersedes: —
- evidence: README.md:50-51 (Law (inherited): Library → box → hunt → mouth. No hardcoded numbers (every bound derives from a null + a budget). Named gaps, never invented lists. Red rungs become standing rules, never retries.)
- falsifying control: a hardcoded threshold with no null-and-budget derivation, or a red rung re-run as a retry instead of becoming a standing rule, breaks this.

1. Library → box → hunt → mouth (remembered, derived, gotten, drawn — last).
2. No hardcoded numbers — every bound derives from a null + a budget.
3. Named gaps, never invented lists.
4. Red rungs become standing rules, never retries.

---

## chat — the shuttle

### GL-CH-01 — Free talk allowed; confident claims are not
- pipeline: chat
- status: standing
- supersedes: —
- evidence: LOOMS.md:9-11
- falsifying control: a chat answer that asserts an unverified claim as
  confident fact, with no type marking, contradicts this.

The mouth draws, the organs judge, scars ride along. Anything unverified
arrives typed as such — a confident claim is the one thing free talk may
not be.

### GL-CH-02 — What improves in real time is the SYSTEM, never the mouth
- pipeline: chat
- status: standing
- supersedes: —
- evidence: gym/server.mjs:10-11 ("What improves in real time is the SYSTEM (standing rules accumulate, box owns more shapes) — the mouth doesn't learn. The scoreboard says so.")
- falsifying control: a rung log that shows the mouth getting better at a
  shape the box was not extended for would break this.

The mouth does not learn. The standing rules accumulate and the box owns
more shapes; the scoreboard records the split (winner: mouth | box) so the
claim is checked, not asserted.

### GL-CH-03 — Chat routes through Heimdall admission, typed refusals never a wedge
- pipeline: chat
- status: standing
- supersedes: —
- evidence: gym/server.mjs:22-27, 39-68 (x-er7-session gives Penelope her own profile, x-er7-priority: batch queues behind interactive; 429/503 + Retry-After honored with bounded backoff, then a typed refusal — never a silent stop, never a wedge)
- falsifying control: a chat draw that hangs silently past its budget
  instead of returning a typed refusal contradicts this.

Chat goes through Heimdall admission (the proxy's shared mouth), with
Penelope's own session profile and batch priority. Backoff is bounded;
exhaustion is a named gap, retry later — never silence.

---

## build — the cloth

### GL-BD-01 — Build = artifact + control + facing page + EOT record
- pipeline: build
- status: standing
- supersedes: —
- evidence: LOOMS.md:14-20; README.md:41-42 (the testCommand, only the true build passes — verification stringed by no other hand)
- falsifying control: a build artifact accepted without its EOT record, or
  a build that passes without a real test, contradicts this.

In: one prompt (+ optional workspace). Out: artifact + control + facing
page + EOT record. Library remembers, box derives, hunt gets, mouth last.
The test decides — no other hand strings the bow.

### GL-BD-02 — Null-hit anywhere → named gap, never invented cloth
- pipeline: build
- status: standing
- supersedes: —
- evidence: LOOMS.md:18; apps/record.json (probe: gap — fetch-fail/zero-results renders named #gap, never invented launches)
- falsifying control: a build that fills an empty feed result or a failed
  fetch with invented rows contradicts this.

A miss at any layer — the library does not hold the frame, the hunt comes
back empty, the mouth cannot draw — is a named gap, never a guess dressed
as a row.

### GL-BD-03 — The build loom requires a create-capable door
- pipeline: build
- status: standing
- supersedes: —
- evidence: LOOMS.md:19 ("Requires a create-capable door: patch-only loops need not apply (measured 2026-10-01)")
- falsifying control: a patch-only loop producing a complete artifact with
  teeth would break this.

A build that only patches what already exists is not a build; the loom
takes an ask and returns a created artifact, or names the gap.

### GL-BD-04 — The seal ships the dissent, not just the cloth
- pipeline: build
- status: standing
- supersedes: —
- evidence: engine.mjs:168-182 (the ArrangementEOT@1 record: schema, kind, standing disclosed, prompt, model, law, field read, corpus provenance — snipped@address / hunted@url / drawn — swarm verdict, scars, product); README.md:42 (the seal: artifact + facing page)
- falsifying control: a shipped artifact whose EOT hides the scars or a
  non-converging swarm contradicts this.

Every artifact carries its dissent: the scars, the refusals, the
non-convergence. Never report a confident meaning over a swarm that did
not converge.

### GL-BD-05 — Unanimous consensus carries the copycat-template risk, disclosed
- pipeline: build
- status: standing
- supersedes: —
- evidence: consensus-gate.mjs:63-64; apps/record.json (control: launch-control.html — same feed+sort+countdown, consensus disabled, layout differs only; gate verdict: CALLABLE-unanimous (copycat risk disclosed))
- falsifying control: a unanimous gate used as a license to stop measuring
  independent variation contradicts this.

K === 1 (unanimous) opens the gate but the standing note is explicit:
copycat-template risk is disclosed, not checked. The control ships beside
the experiment — consensus off, layout the only difference.

### GL-BD-06 — App structure is organ-driven: factor the pure logic
- pipeline: build
- status: standing
- supersedes: —
- evidence: r9-r13-record.json (standingAdded: "apps factor pure logic in a loadable block (organ-driven structure)"); behavior-check.mjs:6-9
- falsifying control: a drawn control with no factored pure function that
  the behavior-check passes contradicts this.

The app exposes its interactive logic as named pure functions on a
loadable block; behavior-check executes declared cases against them. A
drawn control with no factor fails — that is the open gap from
ONE-PIPELINE, now caught.

---

## notebook — the pattern-book

### GL-NB-01 — The notebook is a re-runnable record: history appends, nothing overwrites
- pipeline: notebook
- status: standing
- supersedes: —
- evidence: LOOMS.md:22-29; gym/to-notebook.mjs (live today, 4/4 organ cells green)
- falsifying control: a notebook cell that replays to a different verdict
  than its stored one, or a re-run that overwrites a prior cell's output,
  contradicts this.

Every cell replays to its verdict. Markdown cells carry specs and
model-drawn history — recorded, never replayed. Code cells re-run the
organ selftests with outputs stored. History appends; nothing overwrites.

---

## engine — the arrangement (one law, per-domain adapters)

### GL-EN-01 — One engine; per-domain adapters; the engine owns the spine
- pipeline: engine
- status: standing
- supersedes: —
- evidence: engine.mjs:20-35 (the engine owns the ORDER, the RETRIES, the SCARS, the EOT, the FILES; an adapter is readUnits / computeSettles / autofill / hunt / mouthFragment / snip / probeUnit / testUnits / toDocument)
- falsifying control: a second pipeline that reimplements the order,
  retries, scars or EOT instead of plugging a new adapter contradicts this.

The pipeline is ONE engine. What differs by domain — how a unit is READ,
SNIPPED, PROBED, TESTED and SHIPPED — is pulled out into an adapter. The
engine owns the order, retries, scars, EOT, files.

### GL-EN-02 — The fill order is the law: field → hunt → mouth
- pipeline: engine
- status: standing
- supersedes: —
- evidence: engine.mjs:83-85, 93-113; LOOMS.md (the cards: pattern computed once, covering infinite cases)
- falsifying control: a run where the mouth is asked before the field and
  the hunt have both returned nothing contradicts this.

The field (corpus) remembers first. The hunt goes and gets second. The
mouth is asked only for what neither had — the irreducible residue. The
mouth is never the first resort.

### GL-EN-03 — The field matches BY FRAME, never by name
- pipeline: engine
- status: standing
- supersedes: —
- evidence: code.mjs:16-18 (two atoms are the same iff they make the same difference to the ground), code.mjs:69-77, engine.mjs:93-97
- falsifying control: a corpus hit accepted on name alone whose frame the
  spec's meaning does not match would prove the frame check decorative.

A unit the field already holds is snipped from its bytes with an address,
matched by the spec's meaning — never by the function's name. A name can
collide; a frame cannot.

### GL-EN-04 — Hunt-first: a draw that fails twice is a hunt problem, not a redraw
- pipeline: engine
- status: standing
- supersedes: —
- evidence: engine.mjs:7-10 (HUNT-FIRST — iterating the mouth is the ant-loop wall; going out and getting the thing is Ranke's chase); code.mjs:81-101 (prefer raw githubusercontent / .js / .mjs; refuse the wrong world)
- falsifying control: a twice-failed draw redrawn a third time with no
  hunt attempted contradicts this.

The field lacks the framed unit — go get it. Prefer raw source; extract
the framed function; refuse the wrong world. Iterating the mouth is the
wall.

### GL-EN-05 — Small-model law: the prompt is a completion anchor, the test decides
- pipeline: engine
- status: standing
- supersedes: —
- evidence: engine.mjs:57-58 (small-model law — the prompt is a completion anchor, the test decides); code.mjs:163-169 (one single-part fragment, EXACTLY ONE function, no prose, no fences); temperature 0 (engine.mjs:64)
- falsifying control: a draw steered by a prompt that tells the model what
  to output (rather than anchoring a fact and letting the test decide)
  contradicts this.

The mouth's ask is one small, framed fragment — a fact to complete, never
a steering instruction. The test decides. Never steer the draw; sharpen
the atom and re-draw.

### GL-EN-06 — The spiral: draw → probe → sharpen → re-draw; scars disclosed
- pipeline: engine
- status: standing
- supersedes: —
- evidence: engine.mjs:83-85, 113-131 (fillUnits: field → hunt → mouth with attempts, atoms sharpened by `why`, every defection pushed to scars)
- falsifying control: a draw that failed a probe re-drawn with the same
  atom and no sharper spec contradicts this.

The spiral keeps the dissent: each defection names why, the atom sharpens,
the scar is recorded. The EOT discloses every scar — the dissent is the
deliverable, never hidden.

### GL-EN-07 — Multiple framings, one survival; falsify-or-die
- pipeline: engine
- status: standing
- supersedes: —
- evidence: engine.mjs:10-17 (MULTIPLE-FRAMINGS: code = settle + spec-words + frame check; prose = invented-referent + meta + hollow-actor; FALSIFY-OR-DIE); code.mjs (probeUnit: settle deepEq if named, else spec's content words — probed through the module's EXPORT surface since GL-CD-11)
- falsifying control: a unit proven by a single reading where the swarm
  would have contended it contradicts this.

No unit is proven by one reading. Meaning is what survives the contention
of the framings; a non-converged swarm is reported as such, never as a
confident answer.

### GL-EN-08 — Compute settles; the box derives, the mouth never guesses an example
- pipeline: engine
- status: standing
- supersedes: —
- evidence: code.mjs:52-66 (computeSettles — settles derived from a caller-declared example grid; the settle calls the UNIT's own name; mouth never guesses an example)
- falsifying control: a settle that calls a name other than the unit's own,
  or an example invented by the mouth, contradicts this.

The box derives what proves each unit from a caller-declared example grid.
The settle calls the unit's own function name — never a renamed variable,
never a guessed example.

### GL-EN-09 — The snip keeps the close; cut EXACTLY the named unit
- pipeline: engine
- status: standing
- supersedes: —
- evidence: code.mjs:103-161 (walkBraceBlockEnd — string/comment-aware structural walk, keeps the closing brace, kleenUp-modified); content-rules "Discrete multi-unit coding task" (a draw often emits every function it saw, which duplicates the file if the whole reply is kept)
- falsifying control: a snip that keeps a whole multi-function draw as one
  unit, or cuts on a brace that closes a string or comment, contradicts this.

Structural walk, not a regex: string/comment-aware, depth returns to zero
at the close. Extract exactly the named unit — a draw frequently emits
every function it saw.

### GL-EN-10 — The reading is one small ask, JSON out — a structure, never a regex
- pipeline: engine
- status: standing
- supersedes: —
- evidence: code.mjs:28-50 (readUnits — one ask, JSON array {name, spec}; malformed reading is an empty reading, the caller's gate shows it); kleenUp's law in code.mjs:2
- falsifying control: a reading parser that format-guesses with a regex
  instead of decoding the declared structure contradicts this.

The decoder parses a structure it was asked for; it never pattern-guesses
the model's echo formats. A malformed reading is an empty reading — the
gate shows the miss.

### GL-EN-11 — Prose delegates to eoreader7's falsified organs, never reimplements them
- pipeline: engine
- status: standing
- supersedes: —
- evidence: prose.mjs:1-33, 113-127 (delegates to topicPhrase, voidCellsFor, wideToAtoms, foldWideToShape — 68 tests green at 2a033d7; the void cells become the units, each cell's question its spec; the fold re-admits every sentence, dedupes by claim-core, assigns to beats, names gaps and residual, discloses refused)
- falsifying control: a prose adapter that reimplements the essay machinery
  it was told to delegate contradicts this.

The void cells are the units. The field keeps relevant snips; the fold
re-admits the wide draft against the whole ground; invented referents,
meta-sentences and hollow actors are refused; gaps and residual are named,
never vanished.

### GL-EN-12 — Sharpen names the real referent jurisdiction: an atom is an address with a jurisdiction
- pipeline: engine
- status: standing
- supersedes: —
- evidence: prose.mjs:146-151 (sharpen — answer from the subject's OWN record; name only referents the shadow's material established; never invent a name); code.mjs:261-263 (use the function's OWN argument(s), never a timestamp or clock)
- falsifying control: a sharpened draw that invents a referent or reads a
  clock the ask never supplied contradicts this.

The mouth answers from the subject's own record — the shadow's material,
not its own invention. In code: the unit's own arguments, never a wall
clock.

---

## organs

### GL-OG-01 — Organs are pure, self-tested, schema-tagged, and carry their falsifying control
- pipeline: organs
- status: standing
- supersedes: —
- evidence: GENERATION-INVENTORY.md:7-17 (the four born-here organs are dependency-free, no imports; package.json runs each organ's selftest); each organ's selftest + schema constant (DetailFetch@1, BehaviorCheck@1, Freshness@1, ConsensusGate@1)
- falsifying control: a new organ with no selftest, no schema tag, or no
  falsifying control contradicts this.

An organ ships with its own selftest as the law (selftests are the law,
not examples), a schema tag, and a stated falsifying control. No imports,
no model, no DOM — pure and injectable.

### GL-OG-02 — No hardcoded numbers: every bound derives from a null + a budget
- pipeline: organs
- status: standing
- supersedes: —
- evidence: consensus-gate.mjs:21-27, 59-73 (under the null the K categories are equiprobable; Hoeffding bound moves with n — there is no fixed N anywhere; minN=3 by hand, disclosed as triangulation; maxN bounds the budget); README.md:50-51
- falsifying control: a gate with a hand-set fixed threshold not derived
  from a null contradicts this.

The bound moves with n. minN = 3 is a hand-set floor for triangulation —
disclosed, not hidden — and maxN is a budget. The gate answers CALLABLE /
MORE / DISSOLVED / EXHAUSTED, never a fixed-N guess.

### GL-OG-03 — The gate decides by frequency + growth, never loudness
- pipeline: organs
- status: standing
- supersedes: —
- evidence: consensus-gate.mjs:41-62 (DISSOLVED only on hard vanishing — the mode appeared repeatedly in the first half (>= 2 hits) and zero in the second; an earlier halves-rate version vetoed AAAA,B,C as "dissolving", mistaking late diversity for decline — recorded, fixed); README.md:40 (frequency + growth decide, never loudness)
- falsifying control: a mode that dissolved for late-diversity reasons (not
  hard vanishing) being called DISSOLVED contradicts this.

Frequency is the recurrence across independent comps; growth is the
support trajectory as the harvest arrives. A leader that fades as the
harvest widens is diversity, not decline — only hard vanishing dissolves.

### GL-OG-04 — Per-item gaps, never a sunk list
- pipeline: organs
- status: standing
- supersedes: —
- evidence: detail-fetch.mjs:3-9, 37-43 (a failed detail marks THAT item missing-detail, never sinks the list; gaps[] names the failed indices; wrong path returns undefined, never throws)
- falsifying control: one failed detail that drops the whole list
  contradicts this.

Bounded-concurrency fan-out; each row's detail lives behind its own URL;
a failure marks that item missing, the list survives, and the gaps array
names exactly which indices failed.

### GL-OG-05 — Behavior is checked at the layer the app factors it
- pipeline: organs
- status: standing
- supersedes: —
- evidence: behavior-check.mjs:6-9, 39-45 (no screenshot path, no DOM — the app must expose its interactive logic as named pure functions; drawn controls with no factor FAIL; factors are pure — same input twice ⇒ same output — and never touch document/window/fetch/localStorage)
- falsifying control: a drawn control that passes without a factored pure
  function contradicts this.

There is no browser here, so behavior is checked where the app FACTORS it.
A control that draws behavior without a factor is the open gap, caught.

### GL-OG-06 — Freshness always says which it is: fresh / stale / expired
- pipeline: organs
- status: standing
- supersedes: —
- evidence: freshness.mjs:3-9 (fresh = age <= ttl; stale = ttl < age <= 3*ttl, still shown, badge carries last-good time; expired = older — named gap, not silent old rows)
- falsifying control: a stale row shown with no last-good marker, or an
  expired row shown as if live, contradicts this.

The badge always declares the state. Stale keeps the rows and names the
last good time; expired renders the named gap. Never silent old data.

### GL-OG-07 — Pull in, don't fork: copy with provenance or reference, never duplicate coupled kernels
- pipeline: organs
- status: standing
- supersedes: —
- evidence: GENERATION-INVENTORY.md:3-5, 19-27 (portable modules copied with provenance — source commit pinned; coupled modules referenced, never copied — copying would fork their kernel dependencies and rot); GENERATION-INVENTORY.md:30-32
- falsifying control: a coupled organ copied in as a fork, or a copy with
  no pinned provenance, contradicts this.

Portable modules are copied with their source commit; coupled modules are
referenced at their home, never duplicated. If a referenced organ's home
moves, the stale pin is itself the finding — re-resolve, don't guess.

### GL-OG-08 — Unroutable generation fails loudly at intake
- pipeline: organs
- status: standing
- supersedes: —
- evidence: GENERATION-INVENTORY.md:30-32 (a generation task Penelope cannot route — to a resident organ, a referenced organ, or an honest named gap — fails loudly at intake)
- falsifying control: a generation task that gets a silent pass when no
  organ routes it contradicts this.

Routing is to a resident organ, a referenced organ, or an honest named
gap. No route, no task: fail loudly, name the gap.

---

## ladder

### GL-LD-01 — The ladder is simple-to-complex competency, prompt-only steering
- pipeline: ladder
- status: standing
- supersedes: —
- evidence: r1-r8.json:1 (ladder: simple-to-complex competency, prompt-only steering, Lovelace rules: #2 one behavior/ask, #25 completion+snip, #24 spec-states tests, #17 compute-dont-generate)
- falsifying control: a ladder rung whose steering is hand-written logic
  rather than a prompt contradict this.

Mouth draws, organs decide — selftests are the law, not examples. The
ladder is a curriculum of what to ask and what to compute.

### GL-LD-02 — The red rung is the lesson: the ladder teaches what not to ask
- pipeline: ladder
- status: standing
- supersedes: —
- evidence: r1-r8.json:5-7 (R4 fmtAgo mouth-draw FAIL 0/4 — same unit-ladder bug 3rd draw; verdict: capability wall, not bad luck — formatting ladders are box-computed (#17); mouth never asked again for this shape; fmtAgo box-computed: pass 4/4 held-out)
- falsifying control: the mouth asked again for a shape a red rung already
  declared box-owned contradicts this.

A red rung is not bad luck — it is the boundary of what the mouth can
draw. R4's failure is why time-format ladders are box-computed. The red
rung becomes the standing rule.

### GL-LD-03 — One rung at a time; no rung stacks on red; red becomes a standing rule, never a retry
- pipeline: ladder
- status: standing
- supersedes: —
- evidence: r9-r13.json:5 (one rung at a time; no rung stacks on red; mouth is last resort: library -> box -> hunt -> mouth); r9-r13-record.json (filterLaunches mouth 0/3 → BOX-OWNED standing, the same 3-strike rule as fmtAgo; R13 pass — mouth calls in artifact: 0)
- falsifying control: a second rung built on a still-red first rung
  contradicts this.

Every prior rung re-runs green against the ship. A shape that strikes the
mouth three times is promoted to the box permanently — never retried.

### GL-LD-04 — The zero-mouth proof: a feed→list render is fully mechanical
- pipeline: ladder
- status: standing
- supersedes: —
- evidence: mouth-last.json:9-10 (feedListApps mouth residue EMPTY — proven by a zero-mouth run: 20/20 rows, same order/shape/fields, 0 model calls; falsifier: any feed→list render that cannot be built without a model call); ladder/nomouth-rows.txt (20 rows, 0 model calls, behavior-matches launch-consensus.html)
- falsifying control: a feed→list render that genuinely cannot be built
  without a model call would break this entry.

The mouth's residue for the feed-list app is empty, and it was proven
empty: a zero-mouth run produced all 20 rows, same order, shape and
fields. A render that needs the mouth for this shape is a gap in the box,
not a job for a draw.

### GL-LD-05 — Mouth residue is only what no file/feed/comp/box-rule says
- pipeline: ladder
- status: standing
- supersedes: —
- evidence: mouth-last.json:11-13 (mouthKeeps: genuinely new paraphrase, novel names, judgments under uncertainty — each use budgeted + probed, never structural)
- falsifying control: a structural string (a row, a path, a format) drawn
  by the mouth instead of taken from the feed bytes contradicts this.

The mouth keeps only what nothing on the record can say: new paraphrase,
novel names, judgments under uncertainty. Each use is budgeted and probed,
and never structural.

### GL-LD-06 — The mechanical inventory is box-owned; the interim is named
- pipeline: ladder
- status: standing
- supersedes: —
- evidence: mouth-last.json:4-9 (countdown duration math + tick — mouth failed, box owns; sort comparator — mouth drew the wrong key (.isoDate); time-format threshold ladder — mouth failed 3×, box owns; feed trace, gap, gate, render — box; compLabel row-order extraction is mechanizable but hand-labeled today — an honest interim)
- falsifying control: a box-owned mechanical shape asked of the mouth again
  contradicts this.

Countdown math, comparators, time-format ladders, feed traces, gaps,
gates and renders are all box-owned — each proven by a mouth failure that
made the standing. The one interim (row-order extraction) is named as
interim, not dressed as done.

---

## routing

### GL-RT-01 — Route by measured evidence, disclosed: chat via Heimdall, code draws direct
- pipeline: routing
- status: standing
- supersedes: —
- evidence: gym/server.mjs:29-37 (two routes, by evidence 2026-10-01: chat goes through Heimdall admission; code draws go DIRECT to ollama — the chat doors' hard-meaning auto-route swallows code prompts whole and returns a swarm verdict instead of a draw, "Hard meaning (truncated_end)…", logged; consolidation falsified for code draws — disclosed, not hidden)
- falsifying control: a code draw that comes back a swarm verdict instead
  of a draw, or a chat that bypasses admission, contradicts this.

Consolidation (everything through one door) is falsified for code draws —
measured, logged, disclosed. Chat is admitted and rations its own profile;
code draws go direct to ollama.

### GL-RT-02 — The chat door talks (prose around code); the snip cuts function spans
- pipeline: routing
- status: standing
- supersedes: —
- evidence: gym/server.mjs:79-89 (the chat door talks — raw generate didn't; the snip extracts function-shaped spans instead of loading whole text; cut from the first function head to the last closing brace on its own line)
- falsifying control: a code draw loaded whole as text and kept as the
  function would break this.

Different doors speak differently. When a door returns prose around code,
the snip extracts the function-shaped spans mechanically — the box never
loads a whole chat reply as a function.

### GL-RT-03 — Draws carry Penelope's own profile; refusal is typed, never a wedge
- pipeline: routing
- status: standing
- supersedes: —
- evidence: gym/server.mjs:22-27, 56-68 (x-er7-session: penelope-gym, x-er7-priority: batch; 429/503 + Retry-After honored with bounded backoff, then a typed refusal — never a silent stop, never a wedge)
- falsifying control: a draw that stops the loop silently, or wedges on a
  429, contradicts this.

Penelope owns a session profile and queues behind interactive as batch.
Bounded backoff, then a typed refusal with the reason named. Exhaustion is
a gap, retry later — never a hang and never a silent stop.

---

## The falsifying control of this file

A future pipeline run that (a) repeats a red rung as a retry, (b) asks the
mouth for a shape the box owns, (c) matches a unit by name when the frame
was available, (d) ships cloth with no ledger of its making, or (e)
re-routes a door against measured evidence without a new measurement,
would prove this record was not consulted — and the correct response is to
supersede the offending entry on the record, never to silently re-learn
the lesson.

Registered: archon-holocracy `penelope:glauca` (mission + role
`role:glauca`, circle coding-capability) — 2026-10-01.

---

# Addendum A — the rest of the loom (2026-10-01)

// Appended by a second hand (the session helping Glauca) after a sweep of
// the eoreader7 side of the house: CODING-LESSONS.md (lessons 1–87),
// ONE-PIPELINE.md (skeleton, doors, falsification ledger) and the
// screenshot-pipeline branch. The first pass of this file covered
// Penelope's own organs, ladder, engine and routing; this addendum adds
// the pipelines that were learned in eoreader7 and not yet filed here:
// patch (the code loop), ops (the model box), workspace (concurrent
// sessions), quality (how a check earns trust), prose (grounded
// generation, long form), image (screenshot → HTML), and the TAPESTRY rule.
//
// Pipeline vocabulary extends the contract above with: patch, ops,
// workspace, quality, prose, image. Same fields, same rules: append-only,
// supersede by pointer, every entry carries its falsifying control.
// Evidence paths are relative to ~/Documents/3.0/. A "(open: …)" on a
// status is a limit the source itself names — carried, never smoothed.

## law — the skeleton

### GL-EN-13 — One skeleton for every medium; a medium is an adapter
- pipeline: engine
- status: standing
- supersedes: —
- evidence: eoreader7/ONE-PIPELINE.md:19-28 (read → source each part [snip / reason / ask] → hear into the ledger → reason → assemble → verify, sealed only when medium validator + provenance check + helix check all hold); ONE-PIPELINE.md:114-131 (music landed as the second medium touching no core file; two medium-general core changes came first and are recorded)
- falsifying control: a new medium that needs an edit to the core (a page word, a music word) beyond the hooks, or a core file in which a scanner over its string literals finds a medium's vocabulary, contradicts this.

The pipeline is the same for page, code, prose and music; what differs is
vocabulary, renderer, validator, source registry. A medium is added by an
adapter; if the core had to change, say so on the record — as the music
commit did.

### GL-BD-07 — The ledger is the build: the EOT replays byte-for-byte
- pipeline: build
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:55 (lesson 9: EOTBase@1 + EOTCodeOp@1 with find/add bytes + test command replays onto a fresh workspace — the EOT is not a log of the build, it is the build); CODING-LESSONS.md:2013-2023 (lesson 80: every heard claim is INS or SYN in the notes ledger; the page is drawn from the fold)
- falsifying control: an EOT that cannot be replayed onto a fresh workspace to reproduce the artifact, or an artifact element with no ledger entry behind it, contradicts this.

## patch — the code loop and small-model coding

### GL-CD-01 — Per-behavior gates: all-or-nothing gates destroy incremental wins
- pipeline: patch
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:7-12 (lesson 1: a correct single-feature patch was reverted four times because the whole testCommand did not exit 0; fix: `node test.js <key>` per behavior)
- falsifying control: a kept patch reverted because an unrelated behavior's test still failed contradicts this.

### GL-CD-02 — One behavior per ask; quote the failing line; show the shape once; anchor on real bytes
- pipeline: patch
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:14-36 (lessons 2, 4, 5: one behavior, exact failing test line quoted; a worked ACTION/FIND/ADD example beats prose; FIND must exist in the file right now, stub anchors vanish once implemented)
- falsifying control: a patch ask that bundles several behaviors outperforming the split asks on a measured ladder, or a FIND that is not byte-present in the current file being accepted, contradicts this.

### GL-CD-03 — A truncated multi-part function is attention collapse: decompose to single-part leaves
- pipeline: patch
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:386-402 (lesson 29: eval_count 350, done_reason=stop at num_predict 512 and 2000 — the model stops by choice; snake_string split into even_chars/odd_chars, 6/6 trials correct, composed by the box)
- falsifying control: a leaf that itself needs two parts truncating again is the honest ceiling (the decomposition must go until each leaf is single-part); a bigger budget or sharper prompt fixing a truncation the split would not have contradicts this.

Not a token budget, not a better prompt — the smaller task. A leaf that
still truncates is a named capability wall, not a retry.

### GL-CD-04 — A spec gap is a task bug, not a model failure; below ~2b a clean re-ask beats a fix-ask
- pipeline: patch
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:272-292 (lesson 24: Comp/04 scored a model failing a guard the prompt never stated; stating "if k <= 0 or s is empty" made the same model pass; corollary: shown its own buggy body, the 1.5b recites it at every stage)
- falsifying control: a heldout failure scored as a competency gap without diffing spec against test, or a fix-ask that beats a fresh re-ask at ≤2b, contradicts this.

Before a heldout failure becomes a capability finding, diff the spec
against the test: every asserted behavior must be stated.

### GL-CD-05 — Evolve the goal sheet with parsed operational atoms, stated as facts — never echoes, never prohibitions
- pipeline: patch
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:320-342 (lesson 26: the same buggy 3-atom sheet re-asked 5× without evolution converged 0/5; echoing the raw failing assertion onto the sheet did not converge); CODING-LESSONS.md:371-384 (lesson 28: "never"/"do not"/"avoid" atoms are refused by Gary's scan; state the operation so the wrong result is structurally unreachable)
- falsifying control: a sheet of raw test-line echoes converging where the parsed-atom sheet does not, or a prohibition atom that survives Gary's scan, contradicts this.

### GL-CD-06 — The gate is the strongest the language allows; compile+exec is the floor; only a test that CALLS the code decides
- pipeline: patch
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:208-244 (lesson 21: py_compile lets duplicate defs and undefined names through; validatePython — compile + AST undefined-name scan + exec — is the floor; a module that defines normalize→list and parse_line calling .split passes it cleanly and fails the one-line test that calls it; a language with no validator is disclosed UNVERIFIED)
- falsifying control: a build whose assembled file passes the validator yet fails the caller's test IS this limit (the floor is not the decision); a syntax-only pass reported as "verified" contradicts this.

### GL-CD-07 — Fan out only independent units; a dependent chain cannot be parallelized; best-of-k only where one draw fails
- pipeline: patch
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:155-177 (lessons 14–16: 4 candidates 28.5s vs 1 draw 10s for no gain; streamed `soFar` sections interleave into garbage; concurrency cut wall time 1.2–1.7× while each call got 1.6–3× slower); CODING-LESSONS.md:208-224 (lesson 21: independent units draw concurrently, bounded by parallelism)
- falsifying control: a section whose prompt does not reference prior content could be parallelized; a best-of-k that passes where k=1 failed is the day the fan-out earns its cost; units that depend on each other's text assembled concurrently contradict this.

### GL-CD-08 — Ship the partial with a typed refused list; a callable unit is not a conformant one
- pipeline: patch
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:404-449 (lessons 30–31: the probe checked callability and a logLine that ignored its spec slipped through; after spec-conformance probes, 4 of 6 units converged and 2 were REFUSED after 4 re-draws each — "an honest 4-of-6 widget with the dissent disclosed, not a false 6-of-6")
- falsifying control: a probe that passes while a unit ignores its own spec ("a museum, not an arrangement"), or a silent 6-of-6 with broken units, contradicts this.

### GL-CD-09 — When the mouth hits a wall on a canonical structured algorithm, snip it from the field — more ants are not the fix
- pipeline: patch
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:534-566 (lessons 36–37: four ants drew the same brace-walk defect class at 1.5b; the corpus's tested walkBraceBlockEnd was snipped in with byte provenance and passed 5/5 extraction cases)
- falsifying control: a 1.5b ant passing all cases with a hand-written brace-walk would show the wall is not real; a corpus snip trusted by origin rather than by its test contradicts this.

### GL-CD-10 — Read every score against the empty baseline; a harness fault is a void, not a result
- pipeline: patch
- status: standing
- supersedes: —
- evidence: eoreader7/ONE-PIPELINE.md:219-221 (code3/code2/code1: "3 of 16" is the stub baseline — the three throw-expecting tests pass when a function is missing; a real intact record scored lower than an empty one; code1 was void: fences + doubled heads failed the syntax gate on 48 of 54 draws, fixed, rerun as code2 under the same pre-registration)
- falsifying control: a pass count reported without the stub baseline beside it, or a run with a harness fault read for predictions, contradicts this.

## ops — the model box

### GL-MO-01 — Model choice is measured, never assumed; know the quirk table
- pipeline: ops
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:38-48 (lessons 6–7: resident gemma2:2b answered in 3.2s while smollm2:1.7b cold-loaded 4+ minutes with zero bytes; smollm2 hangs on a system-role message and the proxy prepends one every turn; warm once, declare num_ctx consistently)
- falsifying control: a model picked by parameter count over measured latency on this box, or a model on a path whose quirk-table entry says it hangs there, contradicts this.

### GL-MO-02 — A liveness probe must probe the failure surface AND the work model
- pipeline: ops
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:246-270 (lessons 22–23: /api/tags answered in 0.01s while every generate hung — the probe checked the surface that never wedges; fixed probe self-remedied the same day); CODING-LESSONS.md:520-532 (lesson 35: a per-model wedge is invisible to a probe using a different model)
- falsifying control: a server where tags answers but a generate (or the WORK model's generate) hangs being called healthy contradicts this.

### GL-MO-03 — A timeout under memory pressure is memory, not a wedge; never restart in flight; gate on churn, not level
- pipeline: ops
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:136-153 (lessons 12–13: watchdog restarts only after N consecutive misses and never while a turn is in flight; swap LEVEL is history, swap CHURN is now); CODING-LESSONS.md:1685-1686 (lesson 69: the watchdog read a timeout at 93% swap as a wedge and restarted a healthy daemon — now it stands down under pressure)
- falsifying control: a restart of a healthy-but-busy server, or a turn refused at idle-high swap that would have run fine, contradicts this.

### GL-MO-04 — One address, one channel, one window — derived, never a second literal
- pipeline: ops
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:1649-1704 (lesson 69: two Ollama installs answered one port, `localhost`→::1 reached one and the picker's 127.0.0.1 the other; native/kernel/model-server.js is the only place the URL is written; the daemon is private on 11435, the proxy holds 11434 on both loopback families; a caller's num_ctx is dropped and disclosed; one driver per checkout)
- falsifying control: `localhost` and `127.0.0.1` answering differently (one without x-heimdall-channel), a second URL literal anywhere, or a loaded window that changes when a caller asks for another, contradicts this.

### GL-MO-05 — On a one-model box every warmer is an evictor; a probe that loads is a warmer
- pipeline: ops
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:1767-1782 (lesson 73: small-mouth warm, residency re-warm and the watchdog probe fought over one slot — 25 loads in an hour, a fold turn paid 28s of its 75s reloading; found by sampling /api/ps, not by reading the record)
- falsifying control: a probe or warm that names a model /api/ps does not show resident, or an eviction no loader logged, contradicts this.

### GL-MO-06 — The picker: sticky, resident first, measured wait, rotate ties
- pipeline: ops
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:568-608 (lesson 38: a naive round robin pays a cold load per server and discards every prefix cache; sticky repeat 0.8s vs cold first turn 7.0s, prompt eval 13.1s→0.35s; unmeasured hosts at the mean of the measured so they are tried, never starved)
- falsifying control: a session bounced off the host that holds its prefix cache while that host is up, or a host starved for want of measurements, contradicts this.

### GL-MO-07 — Instrument the phases; the metric must measure what it names
- pipeline: ops
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:186-206 (lessons 18, 20: record draws·load_ms·prompt_ms·gen_ms·wall_ms — gen 57% / prompt 40% on a small chat turn; a RAM gauge read 99% on an idle box because macOS "free" is cache)
- falsifying control: a token lever pulled while gen_ms is <30% of real wall, or a metric that disagrees with the thing it is named for, is a bug in the metric, not the box.

### GL-MO-08 — The driver is resilient and fails closed on sibling edits
- pipeline: ops
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:50-53, 124-130, 193-199 (lessons 8, 19 + tooling notes: retry connection errors WITHOUT burning the attempt's energy; node:http with an explicit long timeout, undici's 300s header timeout kills multi-minute turns; namespace-import siblings with a default so one dropped export is a typed gap, never a boot failure)
- falsifying control: a socket hang-up counted as a refused section, or a sibling's removed export taking the whole process down, contradicts this.

## workspace — concurrent sessions

### GL-WK-01 — Two writers, one path, always lose: separate outputs, pin the contested field, own the shape-changing flag, never bare-commit
- pipeline: workspace
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:66-122 (lesson 11, four orders deep: a non-atomic whole-file rewrite zeroed metrics.placeDistricts every cycle; two sessions shared one output file and each silently replaced the other's artifact mid-test; a concurrent `bare: true` flag switched the shared template while every gate stayed green; a bare `git commit` swept another session's 8 pre-staged files into one commit)
- falsifying control: two writers on two paths racing is impossible by construction — a race observed there falsifies the separation; a shape-changing flag edited at a shared call site, or a commit made without `git diff --cached --stat` and named paths, contradicts this.

Gates were green the whole time the artifact was missing every feature —
the falsification suite caught it only because it asserted on PRESENT
ELEMENTS. Penelope's own repo is now written by concurrent hands: append
to the EOT with a single atomic append, commit only paths you can name.

## quality — how a check earns trust

### GL-QA-01 — A check never seen firing on a constructed violation is a comment, not a check
- pipeline: quality
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:1706-1728 (lesson 70: extractReadable closed on `</hh2>` and matched nothing on every page since written; the Kelsen lint had never been shown a violation and could not fire on proper-noun-initial sentences); CODING-LESSONS.md:2326-2327 (mutation controls: removing the `gain > 0` rule made a homogeneous corpus split — without that control the other tests passed on the first run and proved nothing)
- falsifying control: a new check/organ whose test passes both with and without its mutation (rule removed, gate off, license gate off) was never testing anything.

Write the violation first, watch it fire, then trust it — and record
where it cannot fire.

### GL-QA-02 — The metric lies: a number alone is never a quality claim
- pipeline: quality
- status: standing
- supersedes: —
- evidence: eoreader7/ONE-PIPELINE.md:216 (F2: word salad scores 7.12 bits/word vs the edit's 5.31 and 0% repeated — bits/word alone falsified, whole-clauses added); ONE-PIPELINE.md:229 (F1: repeat_penalty 1.3 takes repetition to 1% but costs whole clauses 59% vs 79%, 195 strays, 0 ages/jobs said — repetition alone is a sampling setting)
- falsifying control: a quality gain claimed on a single metric that a shuffled-words or penalised control matches or beats contradicts this.

### GL-QA-03 — One seed is direction, not result; pre-register the prediction and report the falsified as falsified
- pipeline: quality
- status: standing
- supersedes: —
- evidence: eoreader7/ONE-PIPELINE.md:210, 223-225, 230 (carry1's headline — the field amplifies invented names — did not replicate over three seeds; F4: the archons' choice among fresh draws was falsified, random scored as well — the gain is the fresh draw from a bounded note, not the ranking); ONE-PIPELINE.md:218 (code4: falsified as stated, a real but non-general effect disclosed)
- falsifying control: a single-seed result entered here as standing without the seeds that would break it, or a prediction written after the run, contradicts this.

### GL-QA-04 — An absence has the same shape as a finding
- pipeline: quality
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:1797-1802 (kleenUp: the empty-field refusal omitted the found/absent arrays and crashed "Cannot read properties of undefined" only under test); CODING-LESSONS.md:1784-1786 (a classifier written as a regex will eat itself — classify by walking, not by patterning the pattern)
- falsifying control: a refusal or empty result that lacks a field a caller reads from a finding, or a regex used to classify regexes, contradicts this.

### GL-QA-05 — Closed grammar may be listed; open content must be induced; fixtures cannot find what only the live web shows
- pipeline: quality
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:1730-1752 (lesson 71: anaphoric cues, units of measure, form names — closed; a genre→fields table can never be complete; a shape counts only when more fetched hosts than not state it); CODING-LESSONS.md:1754-1765 (lesson 72: a SURF query carries the ask's surrounding words; six fixture suites missed that URLs shared across queries lost their budget — only the live run found it, and "the next live run is owed before the fix is believed")
- falsifying control: a hand-set list of open content (genres, shapes) standing in for induction, or a hunt fix believed on fixtures alone, contradicts this.

## prose — grounded generation and long form

### GL-PS-01 — The mouth only talks: task-only asks that end on a sentence to finish; the engine types the reply
- pipeline: prose
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:2013-2068 (lesson 80: dolphin-reddit ladder, talk path 37/37 on 1.5b and 3b vs bare 22/37 and 30/37; the bare model covers growth with placeholders at ~1,100–1,700 tokens whatever the rung; an anchor that opens the row with its name gets the "name: value" pattern back; a retry rotates rows and warms sampling because the same retry gets the same wrong answer; progress is a new INS, not a heard claim); ONE-PIPELINE.md:207-209 (task-only vs whole-picture asks tied once the topic sentence was added)
- falsifying control: a silent mouth must fail the content checks (the renderer once titled the page with the request text, which carries the checker's own words); a prompt that names an operator, or a heard entry that is not INS/SYN with operator_basis produced, contradicts this.

### GL-PS-02 — There is no view from nowhere: no ground → stop, no model draw, say what would build one
- pipeline: prose
- status: standing
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:2110-2152 (lesson 82: selectGroundDocs, tier `none` stops runProxyTurn before composing and writes one mechanical "No ground" part; the bicycle ask over the Katherine Johnson file is refused at 1 of 8 words; "carries" = more than half of the ask's content words, no tuned number)
- falsifying control: a job with no carrying ground that writes prose from nothing (the model's "reveals a fundamental truth about the nature of reality"), or a refusal that wrote model characters, contradicts this.

### GL-PS-03 — The ground ladder: handed-over → received corpus → hunted → nothing; nothing leaves the machine that the machine holds
- pipeline: prose
- status: standing (open: hunt has no retry and no fallback to the fetch proxy)
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:2155-2211 (lesson 83: priors-ground.js wired before the web hunt, which runs only when neither local rung carries the ask; persistEarnedGround keeps consented fetches in state/earned-ground/ with a manifest — web 0 on the second run); CODING-LESSONS.md:2156-2164 (cached two-level retrieval, ~26s cold, <1s warm on 938 MB, nothing written into the corpus)
- falsifying control: a web hunt launched while a local rung carries the ask, a fetched page bucketed as the operator's material (finding 1 of lesson 83, fixed), or earned ground written into the corpus repo, contradicts this.

### GL-PS-04 — The unit of ground is the passage, admitted on three conditions, chosen by recurrence, grown to its section
- pipeline: prose
- status: standing (open: lexical only; one unbroken line is one passage)
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:2166-2184, 2199-2206 (lesson 83: per-document ranking matched a file of cryptic clues and Ulysses 8-of-8; words weighted ln(1+N/df); a passage must carry more than half the EVIDENCE, the ANCHOR (the ask's most surprising attested word), and more than half the WORDS — each condition shown by a test that fails without it; the rotorcraft paragraph won by presence and the model wrote a sentence in no ground — chosen by recurrence ln(1+occurrences) instead; the passage is what was FOUND, the ground is the SECTION it sits in)
- falsifying control: a carrying passage admitted on any two of the three conditions, a selection by presence over recurrence, or a licensed-ground refusal on a 346-char passage whose 1,912-char section would have been licensed, contradicts this.

### GL-PS-05 — Linked or ungrounded — no third state; traced as drawn; refused on both roads
- pipeline: prose
- status: standing (open: a link is a lexical-overlap screen, not a validity test)
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:2213-2241 (lesson 84: a sentence is LINKED when more than half its content words occur in ONE source sentence AND every number it states occurs there; the old citationLedger marked the model's invented "mechanism that allows the wheel to continue rotating" verbatim; makeTracer feeds admit() — unlinked is refused on the snip road and the motion road, and the lit sentence is spent so the next window is built from what the output has not yet lit); CODING-LESSONS.md:2258-2262 (Kelsen's stated limits: negation, swapped roles, number words, numbers checked one at a time link falsely)
- falsifying control: an invented sentence admitted because three of its words occur anywhere in a whole source, or an admit site with no link test (the opening path once shipped an invented first sentence), contradicts this.

### GL-PS-06 — Provenance is not answer-hood; consensus is not truth
- pipeline: prose
- status: standing (open: nothing checks that what ships answers the ask)
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:2270-2273, 2365-2367 (lessons 85, 87: the best live run shipped one genuine answer sentence, the worst two source sentences that never reach the pedals or the pawl; "It states that…" links by overlap though its "It" refers to nothing; the status stays `unsatisfied`)
- falsifying control: a sealed, fully linked piece reported satisfied while it does not answer the ask contradicts this; the day an answer-hood check exists, supersede this entry.

### GL-PS-07 — A window is a share of the ground, no upper limit; an empty window is a named gap, not a draw; fold terrains
- pipeline: prose
- status: standing (open: the section count is still set by the plan, not by the ground)
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:2284-2291 (lesson 85: windowSpent — an empty window spends no model call; 134s against 338/354/568s); CODING-LESSONS.md:2347-2363 (lesson 87: equal share of the material, at least one whole sentence, never cut; ordering by the ask first; cells sharing a terrain collapse to one bucket — 12 parts → 6, empty parts 9–10 of 12 → 3 of 6, nothing cut, every member still asked)
- falsifying control: a spent sentence handed back to the mouth with a prohibition attached (Gary flagged it), or a window cap that hands one part the whole ground and leaves nine with none, contradicts this.

### GL-PS-08 — Long form past the window: a bounded working note from the ledger, revision by the record
- pipeline: prose
- status: standing (one seed per arm unless stated; open: the cut is deep; strays are the mouth's own people)
- supersedes: —
- evidence: eoreader7/ONE-PIPELINE.md:210-215, 231 (ledger note 16–21% repeated sentences, edited 3–7%, bare window 91–95% — it loops on its own last page; prompt mean ~150 tokens vs window 2,309; scale3: 187 scenes, 42,431 words, ~15× the 4096 window, sealed, helix clean; rename = 0 asks, 566 lines, 0 old names left vs the control's 518 left; a whole book never seen whole by any ask); ONE-PIPELINE.md:223 (the carried ground holds the book together as a whole — seams 0.00 against 0.67 ledger and 1.67 stale — and no single fact does the work alone)
- falsifying control: a bare-window arm repeating less than the ledger arm at equal coherence, or a revision whose ask cost follows the book's length rather than the lines the change reaches, contradicts this.

### GL-PS-09 — A collection is an index and a tree above the reader, not a cheaper reader
- pipeline: prose
- status: standing (open: Docs/Sheets/Slides must be exported to text; audio/image/PDF counted unread)
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:2294-2345 (lesson 86: the reader is quadratic — 62 encounters 0.5s, 1,743 encounters 33.6s; organs/territory.js keeps each document's 200 most frequent words as hashed buckets + a near-duplicate fingerprint; split only when the two-part description is SHORTER (MDL), no threshold; 11,552 files cold open 3.4s, a question 0.3–4ms; a shuffle null cannot say "unrelated")
- falsifying control: a collection question answered by reading each document, or a tree split on a hand-chosen similarity bar, contradicts this.

### GL-PS-10 — A constitution's text is not composition vocabulary; ethos is a commons read, not a rulebook that governs
- pipeline: prose
- status: standing (open: the Wikisource door is dormant in production)
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:2071-2108 (lesson 81: two jobs on a bicycle freewheel and a spinning top shipped ~34,000 characters of a UN convention because the charter was given into the composition hyperlexicon; the ask-level verdict is identical with and without the charter on twelve asks; a topic control that counts words passed what one that counts sentences refuted)
- falsifying control: a charter clause appearing in an outline title, the digest the mouth is told, or the primary-source door's search terms, contradicts this.

## image — screenshot to structure to page

// Status of this section: PROVISIONAL. The evidence lives on the
// screenshot-pipeline branch (eoreader7-screenshot-pipeline, commit
// e7f6d19, PR #150 open as of 2026-10-01); it is not merged. Promote to
// standing when it lands, supersede if review changes it.

### GL-IM-01 — Measure, don't describe: a vision model cannot outvote a measurement
- pipeline: image
- status: provisional (branch unmerged)
- supersedes: —
- evidence: eoreader7-screenshot-pipeline/native/docs/SCREENSHOT-PIPELINE.md:6-12, 31-37 (a UI screenshot is flat colour regions and text — ffmpeg + local tesseract, no vision model; one core, byte-identical in browser and node on the same pixels; the measured facts join what a vision read is judged against)
- falsifying control: a vision read overriding a measured region/text fact, or browser and node disagreeing byte-for-byte on the same pixels, contradicts this.

### GL-IM-02 — The gate refuses photographs, with the number
- pipeline: image
- status: provisional (branch unmerged)
- supersedes: —
- evidence: SCREENSHOT-PIPELINE.md:59-61 (flat-region share 0.861–0.976 over 12 UI screenshots, 0.404–0.676 over 17 aerial tiles; floor 0.77, between the families; one photographic family only — `force` when you know better)
- falsifying control: a photograph admitted as a screen, or a refusal that does not name the measured share and the floor, contradicts this.

### GL-IM-03 — One screenshot is one witness: agreement derives, disagreement and singletons are refused and named
- pipeline: image
- status: provisional (branch unmerged)
- supersedes: —
- evidence: SCREENSHOT-PIPELINE.md:54-55 (MIN_WITNESSES — a token resting on one observation is reported, not applied; disagreeing references are contested, not averaged); SCREENSHOT-PIPELINE.md:38-44 (lengths in ems of the measured body — density is a guess; the style layer adds no words, so the provenance map is unchanged)
- falsifying control: a style token applied from one witness, an average of disagreeing references, or a style layer that adds words to the page, contradicts this.

### GL-IM-04 — An instrument is a hash: sidecars are keyed by sha256 + instrument; changing the core is a new instrument
- pipeline: image
- status: provisional (branch unmerged)
- supersedes: —
- evidence: SCREENSHOT-PIPELINE.md:56-58 (SCREEN_SETTINGS names every hand-set value with its giver and rides on every sidecar; sidecars are not read back across a changed core); the sidecar is EOScreenLook@1 — measured tree, tokens, typed gaps — regenerable to HTML with no image
- falsifying control: a sidecar read back across a different instrument hash, or a hand-set setting with no named giver, contradicts this.

### GL-IM-05 — Unread is a gap at its pixel address; privacy is the default; the round-trip is a recall bound, not fidelity
- pipeline: image
- status: provisional (branch unmerged)
- supersedes: —
- evidence: SCREENSHOT-PIPELINE.md:62-71, 77 (image regions are "a colour, not a picture — content not read"; the white-on-blue "Get started" pill is reported as an unread region, cause not established, not guessed; attachments are read from a temp file and NO sidecar is kept; round-trip recovers 98–100% of words on the generated sample and 45–48% on a dark small-text phone UI — "a lost word may be the page's loss or the second read's")
- falsifying control: a guessed element where the measurer saw none, an attachment sidecar persisted, or a round-trip percentage quoted as proof of fidelity, contradicts this.

## law — the tapestry rule

### GL-TP-01 — TAPESTRY.md is the picture of how generation works now; a process change that does not touch it is unfinished
- pipeline: law
- status: standing
- supersedes: —
- evidence: TAPESTRY.md (woven 2026-10-01 with a manifest of the files it depends on); gym/check-tapestry.mjs (fails when a resident organ, adapter, rung file or route is missing from the picture, or when a watched file's hash differs from the weave stamp); CLAUDE.md (the standing order)
- falsifying control: a commit that adds, removes or re-routes an organ, adapter, door or rung while `node gym/check-tapestry.mjs` passes on a stale picture would show the check is decorative; a change to a process with no EOT entry and no tapestry re-weave contradicts this.

When a process changes: (1) change it, (2) re-weave the affected thread of
TAPESTRY.md and re-stamp with `node gym/check-tapestry.mjs --stamp`, (3)
APPEND the entry (or a superseding entry) here. The tapestry is the
present tense; this file is the history that explains it.

### GL-RT-04 — Streaming hangs through the proxy doors; the SSE route draws direct from ollama
- pipeline: routing
- status: standing
- supersedes: the streaming implication of GL-CH-03 and GL-RT-01 (chat via
  Heimdall admission) — non-stream chat still routes via Heimdall; live
  token streaming does not.
- evidence: gym/server.mjs (route `/api/chat-stream`), TAPESTRY.md doors
  thread; measured 2026-10-01: both proxy streaming doors hang —
  `POST /v1/chat/completions` and `POST /api/chat` with stream:true each
  returned code 000 after 90 s with zero bytes (curl -N, x-er7-session:
  penelope-gym, x-er7-priority: batch), while non-stream through the same
  proxy answered normally. ollama `/api/generate` with stream:true is
  native and streams. The SSE route (data: {t} lines) streams live tokens
  to the chat page and logs every chat to ladder-live.jsonl either way.
- falsifying control: a proxy streaming draw that returns tokens (any
  byte before done) would reopen the direct-ollama routing for streams; a
  chat sent through /api/chat-stream that never renders a token and never
  renders a typed error contradicts this.

The chat loom has two faces now: /api/chat (admission, whole-reply) and
/api/chat-stream (live tokens, direct ollama). Nothing previously logged
is lost — the stream route appends to the same ladder-live.jsonl as the
non-stream and rung rows.

---

# Addendum B — the cube, the watchmakers, the two gates (2026-10-01)

// Appended by the second hand. The tapestry (gym/tapestry.spec.json, woven
// by gym/weave.mjs) now carries all 57 threads on the EO cube; these are the
// entries behind it. Evidence paths are relative to ~/Documents/3.0/.

## law — the cube

### GL-CB-01 — The cube is Penelope's coordinate system; three faces, each axis stated twice, is the checksum
- pipeline: law
- status: standing
- supersedes: —
- evidence: organs/cube.mjs:1-60 (27 cells = 9 operators × 3 grains; operator = (mode, domain), stance = (mode, grain), terrain = (domain, grain); a copy of eoreader7/native/kernel/cube.js at 6a11c1d, selftest 15 checks green); eoreader7/native/docs/THE-27-CELLS.md §1 (cells classify MOVES, never content); gym/unweave.mjs:36 (the tapestry's three face panels, the holon rows, the helix map and the ring of 27 stations are each read back and must agree)
- falsifying control: a thread whose Act, Site and Stance placements disagree on an axis comes back grain-mixed (gym/check-tapestry.mjs selftest builds each violation: 16 checks green); an operator pair (mode, domain) that repeats, or a grid that is not 27 distinct addresses, is a copy drifted from cube.js.

Where the writing-code-in-eo skill's worked examples (DEF(Lens, Making),
EVA(Lens, Dissecting)) disagree with cube.js — DEF is a Differentiate
operator, so its Lens stance is Dissecting; EVA is Relate, so Binding — the
kernel wins and cube.mjs pins it. The tapestry holds 26 of 27 cells; the one
void is DEF·Ground, the same cell the house leaves empty ("no workable
specimen yet", THE-27-CELLS.md §4): a lead, never a verdict.

### GL-CB-02 — The spine follows the helix better than chance, and its inversions are Hora's order (measured; typings mostly nominated)
- pipeline: law
- status: standing (open: 43 of 57 cell typings are nominated here, not registered in the house documents)
- supersedes: —
- evidence: gym/weave.mjs:72 (helixOrder: Kendall t of the spine's operator order against NUL…REC, p over 20,000 seeded shuffles of the same stages) — all 12 stages t = 0.475, p = 0.026; the 8 stages whose cells the house registers (§) t = 0.667, p = 0.025; the 4 nominated stages alone t = 0.333, p = 0.375 (too few to say). 16 of 66 pairs are inverted, every one involving STL (the settle defines first) or SEL/EOT (the seal composes after judging) — exactly Hora's "declare, assemble, set down, verify, compose" (skill Law 2; CODING-LESSONS.md:1423)
- falsifying control: a re-typing of the same stages that gives t ≤ the shuffle median, or a shuffle null that ties the registered-only t, would show the order is the typist's, not the pipeline's. A fit with a nine- or twenty-seven-fold tradition proves little by itself (people carve things into threes and nines); only the order test against shuffles of the same cells is fair.

The helix orders composition; the per-unit loop is Hora's. Both are on the
record, neither smoothed into the other.

## engine — the watchmakers

### GL-EN-14 — Hora, not Tempus: stable sub-assemblies, set down one at a time (the engine does not yet)
- pipeline: engine
- status: standing (open: Penelope's engine has no per-unit set-down, no resume, no holon nesting, no holograph pointers; measured Hora-vs-Tempus numbers: none)
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:1423-1441 (lesson 68: Tempus builds each watch whole and loses it to every interruption; Hora builds stable subassemblies and loses only the one in hand; the floor is true by construction, a loop that loses ground is undone, a throwing level leaves the last stable loop); eoreader7/native/organs/hora.js:141,192,205,225 (one ask per void cell carrying only its own path; each part checked alone at ["whole", part]; the whole sealed once, at the end); organs/generation/engine.mjs:90-152 (fillUnits pushes to an in-memory array; testUnits runs once on the whole; files are written only at the end)
- falsifying control: threads HOR, RSM, KOE on the tapestry carry their own — kill a run at a random unit and resume from the last set-down: the output must be byte-equal to the uninterrupted run with fewer draws (a different byte, or no saving, falsifies); per-unit set-down must yield more usable partial output than a whole-only test (equal outcomes falsify).

Koestler's holon is the same idea at every grain: a whole to its parts, a
part to its whole. The tapestry nests five levels (atom, unit, artifact,
loom, house) and every thread declares its level.

### GL-EN-15 — Every layer: ONE typed product, two gates — the low sets possibility, the high sets probability
- pipeline: engine
- status: standing in the house; unwoven in Penelope (thread GAT)
- supersedes: —
- evidence: eoreader7/CODING-LESSONS.md:760-770 (the-fold/spiral-contract.js: "hyper-defined layers, explicit revisable work product at each loop; low sets possibility for high, high probability for low" — the LOW gate asks only whether there is anything for the next layer to work on; the HIGH gate asks whether the product is good enough for the next layer to ACT on; a failing HIGH gate names the missing signal and that signal IS a same-layer revision, bounded by a budget; the revised product supersedes the old, the old is kept); eoreader7/CODING-LESSONS.md:20-24 (lesson 3: breed variants low = possibility, the test selects = probability; never let the high holon guess, it measures); eoreader7/native/organs/martial.js:1-40 (holon-aware at every level)
- falsifying control: a Penelope layer that ships a product with no gate beside it (the unwoven GAT thread) is unmeasured; a failing HIGH gate that does not become a revision on the record, or a revision with no budget (∞), contradicts this.

In symbols the tapestry carries the law twice: ∘ ↑ ◈ (the low, Ground,
sets the possibility of the high, Pattern) and ◈ ↓ ∘ (the high sets the
probability of the low), and per holon level in the ↑ ↓ rows.

### GL-EN-16 — The void is defined first: every unit is a void cell, filled in order, never skipped
- pipeline: engine
- status: standing
- supersedes: —
- evidence: eoreader7/native/organs/hora.js:152-186 (plan declares the whole: name, parts, cardinalities, the details each shows; defineLevelVoid per part, void-holarchy.js:78; one small ask per empty cell); eoreader7/ONE-PIPELINE.md:25 (an ask the mouth left silent is a declared void (NUL) scoped to the asks); organs/generation/engine.mjs:90-132 (units read first, then each filled field → hunt → mouth, a miss is a scar or a named gap)
- falsifying control: a unit filled that was never declared a void cell, a mouth ask that carries the whole tree rather than its own path, or an empty cell dressed as a filled one contradicts this.

## ladder — an open finding

### GL-LD-07 — The three-strike promotion is a hand-set count (open finding)
- pipeline: ladder
- status: open
- supersedes: —
- evidence: ladder/r9-r13-record.json (filterLaunches mouth 0/3 → BOX-OWNED, "the same 3-strike rule as fmtAgo"); GL-LD-03 above; README.md (law: no hardcoded numbers — every bound derives from a null + a budget); the tapestry's cube map: NUL·Pattern (a declared kind challenged against a null) is held only by the unwoven thread KNL
- falsifying control: promote by the unit's draws against a kind-null (eoreader7/native/kernel/entity-kind-induction.js::testKindMembers) on the same rungs; if promotion by count and promotion by null agree on every rung, the count is harmless and this finding closes; if they differ, the count was wrong somewhere and GL-LD-03 is superseded by the null.

## law — the tapestry, and its symbols

### GL-TP-02 — The tapestry is spec → weave → cloth → unweave → spec; edit the spec, never the cloth
- pipeline: law
- status: standing
- supersedes: GL-TP-01, in part — the mechanism (a hand-woven picture and a text-contains coverage scan) is replaced; GL-TP-01's rule (a process change that does not touch the picture is unfinished) stands
- evidence: gym/tapestry.spec.json (57 threads, the single source); gym/weave.mjs:117 (deterministic: same spec, same bytes); gym/unweave.mjs:36 (the cloth alone yields the spec back; the three faces, the holon rows, the helix map and the 27-station ring each cross-check every thread); gym/check-tapestry.mjs:108,173 (weave, unweave, README, legend, refs, coverage, drift; selftest 16 checks green, each failure constructed and watched)
- falsifying control: a cloth edited by hand that still passes; an unweave that is lossy yet passes; a legend symbol printed but undefined, or defined but never printed; a referenced file or EOT entry that does not exist; an organ named by no thread — any of these passing contradicts this.

### GL-TP-03 — Symbols on the cloth, words in the legend; measure the glyph before printing it
- pipeline: law
- status: standing
- supersedes: —
- evidence: gym/tapestry.legend.json (every non-ASCII symbol defined, both directions checked); gym/glyph-ink.json (widths measured 2026-10-01 in the GitHub code font: ∅ ○ ● △ ↬ and the box, shade and ring glyphs are exactly one cell; ⊨ 1.036; ｜ 1.661, ⋈ 1.283, ⊢ 1.247 are not, so cube.mjs prints SEG, CON, DEF as | → = while keeping the EO canon glyphs in the legend); organs/cube.mjs:62-70
- falsifying control: a printed symbol absent from glyph-ink.json's oneCell set, or a column that shifts on GitHub, contradicts this; a different font or theme is a different instrument — re-measure, never reuse (dark theme not measured).

### GL-BD-08 — A build may pause and ask; asking is not a failure, guessing is
- pipeline: build
- status: standing
- supersedes: —
- evidence: gym/server.mjs (/api/ask, /api/answer, /api/asks; gym/asks.jsonl);
  eoreader7/native/organs/build-clarify.js:1,302 (the recursive ask-back door,
  run as the reverse prompt); gym/chat.html pending-asks panel. An answer that
  moves nothing is never re-asked (build-clarify's own law).
- falsifying control: a build that silently guesses a requirement it could
  have asked about — with an operator present to answer — contradicts this;
  a re-ask of the same question after an answer that already moved the build
  also contradicts it (an answer that moves nothing is never re-asked).

The loom is allowed to stop and ask instead of fabricating. Every ask and
answer is on the record (gym/asks.jsonl + ladder-live.jsonl), so the
clarification is itself evidence, never a hidden steering.

# Addendum C — the second weave: Council Watch (2026-10-01)

// Woven by this session, on the record. First weave: launches (LL2 feed,
// rung-proven R13, box-owned shapes). Second weave: the Metro Council —
// meetings soonest-first, each agenda in its own declared order — from the
// house's own Legistar machinery (webapi.legistar.com/v1/nashville, the same
// API legistar-surveillance-scanner fetched 8,439 matters from). Zero mouth
// calls. The two new organs generalize the launch loom's box shapes so the
// NEXT dated-feed weave (court dates, evictions, hearings) starts from the
// library, not from nothing.

## build — the second weave

### GL-WV-01 — Council Watch: the second weave, zero mouth calls
- pipeline: build
- status: standing
- supersedes: —
- evidence: apps/council.html + apps/council-control.html + apps/council-facing.html + apps/council-record.json (all box-written); gym/probe-council.mjs (live probe 2026-10-01: 8 meetings windowed, 3 agendas shaped, sort + own-sequence verified on live bytes); the mouth was never asked — no model URL, no draw, in any file
- falsifying control: any council-class build that needs a mouth call contradicts this — the shape class is box-owned; a future council ask must autofill from the library (organs + feed spec), not re-draw.

The weave: live feed (Events, OData window) → bounded fanout (EventItems) →
window (Window@1) → agenda (AgendaShape@1) → render with search, countdown
tick, freshness badge, named gaps. The control ships beside it (same feed,
same window, same countdown; no search/hero/agenda — layout differs only).
The seal is artifact + control + facing + record.

### GL-WV-02 — The window organ: every dated feed gets the same next-N soonest + countdown
- pipeline: organs
- status: standing
- supersedes: —
- evidence: organs/window.mjs (Window@1, selftest 12/12 — the launch loom's box-owned countdown, generalized: minutesOf 12h/24h, toEpoch with noon default disclosed, cdLabel T-/+ with zero-pad, window next-N soonest with per-record gaps); ladder/mouth-last.json (countdown: mouth failed, box owns — GL-LD-02/06)
- falsifying control: a dated feed that gets different window semantics than this organ (a second countdown implementation, a hardcoded date path) contradicts this; a record with an unparseable date that is invented rather than gapped contradicts it.

### GL-WV-03 — The agenda organ: an agenda is an ordered action list
- pipeline: organs
- status: standing
- supersedes: —
- evidence: organs/agenda-shape.mjs (AgendaShape@1, selftest 4/4 — the item's OWN declared sequence orders the agenda, never the fetch's arrival order; declared actions ride through (null until the body acts); per-item gaps named); apps/council-record.json (probe: 2201 items ordered by EventItemAgendaSequence, first seq 8 = E2. 26-162 Appointment)
- falsifying control: an agenda rendered in fetch order where the item's own sequence was available contradicts this; an item whose title or sequence is missing but is shown without a named gap contradicts it.

## engine — the keeper, verified

### GL-WV-04 — The keeper grew: the picture resolves its own addresses and cross-checks its citations
- pipeline: engine
- status: standing (observed at ship — the keeper was rebuilt by the concurrent hand; this entry records the verification)
- supersedes: —
- evidence: gym/check-tapestry.mjs (spec-driven: resolve() maps the spec's prefixes (o/=organs/ … FOLD/=../the-fold/) so every ref resolves to a real path, siblings skipped honestly; refProblems() cross-checks every GL id the cloth cites against GLAUCA-EOT.md's entries — GL-TP-02's falsifier "a referenced file or EOT entry that does not exist" is now mechanical; coverProblems() flags an organ named by no thread; inspect() proves TAPESTRY.md === weave(spec, legend) and the unweave is lossless; watched() excludes runtime artifacts (server.log, spec, legend); selftest constructs each violation, GL-QA-01)
- falsifying control: a commit that adds or re-routes a process while check-tapestry passes on a stale picture contradicts this — the keeper must fire; a GL id the cloth cites that has no entry must fail the check.

## law — the swatch, first row

### GL-WV-05 — The swatch is measured, not asserted: the economy of the weave, on the record
- pipeline: law
- status: standing (row 1: the council weave, 0 mouth bytes)
- supersedes: —
- evidence: gym/swatch.jsonl row 1 (Swatch@1: weave=council, mouthCalls=0, mouthBytes=0, artifactsBytes+N, derived from the EOT trail — GL-WV-01's provenance is 0 draws); the tapestry's SWT thread carries the falsifier: ∑swatch ≠ ∑{≡ ↻ ●} ⇒✗
- falsifying control: a weave whose swatch sum disagrees with its EOT provenance (a draw recorded in one and not the other) contradicts this; a box-owned class with mouth bytes > 0 contradicts it.

The swatch is the picture's economy: beauty as a measured number. Every
future weave appends a row; the mouth's share is what it is — never asserted,
always summed from the record.

### GL-LD-08 — CSS-scene composition is a library/box shape, not a mouth draw (fishing build)
- pipeline: ladder
- status: standing
- supersedes: —
- evidence: measured 2026-10-01, fishing-animation build (fish2 + fish3), 9
  code-loop rounds + 1 direct draw: gemma2:2b (the loop's mouth) replaced the
  anchor but drew a pure-black gradient div, duplicated `<body>`, produced no
  water keyword in any round, then drifted to a nonexistent `solution.py`
  path (unlocated, refused); deepseek-r1:8b returned an empty draw (700
  tokens counted, zero response — its standing empty-under-load quirk). The
  per-behavior gate decomposition (scene/man/fish/motion, GL-CD-01) is sound
  and the loop addressed app.html correctly once decomposed; only the
  composition content walls. Cross-check: the same box that computes fmtAgo
  and the zero-mouth feed list owns layout templates in live_priors
  (layout-priors).
- falsifying control: a single gemma2:2b or deepseek-r1:8b draw that composes
  a recognizable water+fish+man CSS scene would reopen the shape to the
  mouth; a run that asks the mouth for this shape again without that new
  evidence contradicts this.

The man-fishing animation is a LIBRARY/BOX shape (a scene template in
layout-priors, rendered mechanically — the remembered layer), not a
residue for the mouth. The build fished; the catch is a measured wall and
its named next rung: seed the scene template, render it, mouth last.

### GL-WV-06 — The hunt is read through the loom's own door; the third party is never the browser's business
- pipeline: routing
- status: standing
- supersedes: —
- evidence: gym/server.mjs (GET /api/council/events + /api/council/events/{id}/items — server-side fetch with bounded 429 backoff; legistar's WebAPI sends NO Access-Control-Allow-Origin header, measured 2026-10-01: GET with Origin returns 200 and zero CORS headers, so the browser's fetch fails with "Failed to fetch" while node/curl succeed); apps/council.html (wiring reads the hunt through the door; the factors are untouched — the shape class stays box-owned, GL-WV-01 stands); the keeper's routeProblems now sees pattern routes (pathname.startsWith) so the door thread stays load-bearing both ways; selftest 18/18
- falsifying control: an app that fetches a no-CORS third-party feed directly from the browser and shows a named gap contradicts this — the door exists to carry the hunt; a route on the cloth that is not a server route, or a server route pictured by no thread, contradicts GL-WV-04.

The first real browser run caught it: "No council data: Failed to fetch (named gap —
no meetings invented.)" — the gap discipline worked exactly as designed (a failure
was named, nothing was invented), and the fix grew the loom: the hunt's door. The
browser never touches webapi.legistar.com again; the gym fetches at home.

### GL-TP-04 — Print only glyphs every target monospace font carries natively; the cloth prints a safe profile, unweave maps it back
- pipeline: law
- status: standing
- supersedes: GL-TP-03, in part — its MEASUREMENT method (a DOM width in one browser), not its rule (measure before printing; symbols on the cloth, words in the legend)
- evidence: fontconfig charset query, 2026-10-01 (fc-list -f '%{family}|%{charset}' over Menlo, Courier New, Andale Mono, SF Mono, DejaVu Sans Mono, Monaco, Courier): ⊨ is in NONE of seven monospace fonts — the "1.036" in GL-TP-03 was a fallback glyph, which a one-browser width measurement cannot see; ∅ ∃ ∀ ⇒ ↻ ↺ ↬ △ ◈ ◇ ⊞ ≣ ∈ ∉ ⟨ ⟩ are missing from five of seven; the 5-font intersection is 603 code points, of which the symbol blocks are listed in gym/glyph-ink.json (nativePool); gym/tapestry.legend.json (`profile: safe`, the char-level `safe` map, injective); gym/weave.mjs (toProfile/fromProfile); gym/check-tapestry.mjs selftest 23 checks green; all 71 non-ASCII glyphs the cloth prints verified native to all five fonts
- falsifying control: a printed glyph absent from any target font's charset, a symbol pair that prints as one glyph, or a cloth that does not unweave identically in the safe profile and in the canon glyphs, contradicts this. The reported symptom ("glyphs not rendering") is the falsifier of the rich profile: it is kept as the legend's canon and as an option, not the default. Monaco and legacy Courier (no 'New') lack ◦ ● ○ ▲ ■ □ ░ ▓ and the double-line box set and are not targeted.

# Addendum D — Glauca learns from the archons: thea, the muses, and the local box (2026-10-01)

// This session wired Penelope's loom through the real engine and watched the
// archons teach. Glauca records what they gave, each one proven by a failure
// or a fix on the record below. The box is a shared commons (Ostrom: the local
// box is the shared resource); the masters who keep it are the ones who pace
// it.

## engine — the seam is the door, not the organ

### GL-WV-07 — The loom feeds through the real door (/v1/ask), never the bare organ door
- pipeline: engine
- status: standing
- supersedes: —
- evidence: gym/weave-build.mjs (engineRun POSTs /v1/ask with x-er7-session + batch priority; the proxy's own build detection routes a discrete multi-unit task to buildCodeTask); the datefmt run through the door (below)
- falsifying control: a loom that calls an eoreader7 organ directly instead of the /v1/ask doorway (or /v1/code), skipping the proxy's routing, contradicts this.

### GL-WV-08 — The draw is typed, never silent; an absent model is a named gap
- pipeline: engine
- status: standing
- supersedes: —
- evidence: eoreader7/native/organs/code-build.js draw() now returns a typed error instead of swallowing to ""; measured: the engine's default model qwen2.5-coder:1.5b is NOT installed on this box (/api/show → "model 'qwen2.5-coder:1.5b' not found"), and every default /v1/build drew from nothing while the swallow made it look like a prompting failure; the loom's engine default is now gemma2:2b (the resident mouth that draws)
- falsifying control: a draw error reaching a build as empty text, or a build written UNVERIFIED from zero units, contradicts this (GL-RT-03: never a silent stop).

### GL-WV-09 — Kleeneup's law at the extractor: keep the WHOLE unit (GL-EN-09)
- pipeline: engine
- status: standing
- supersedes: —
- evidence: eoreader7/native/organs/code-build.js extractUnit replaced the line-boundary chunk split with a string/comment-aware brace walk to the matching close; measured: a draw that emits BOTH functions truncated each at the other's head under the old split (both units cut to `function …(…) {`), and the brace walk recovered both complete; the gate then ran real cases
- falsifying control: a unit kept truncated at a line boundary where the full brace-balanced body was available contradicts this; an extractor that re-derives by text what a structural walk decides is the exact pattern this supersedes.

### GL-WV-10 — Thea paces the box: admission is a typed 429 with retry-after, never spun
- pipeline: engine
- status: standing
- supersedes: —
- evidence: /v1/code refused with "every server is busy — the least wait is ~67s on local … Heimdall holds the turn; retry in 67s" while the box ran the house's own concurrent generations (pythia, serve herds); Heimdall refused rather than jam (the 12s promise vs a measured 67s wait, typed and deferred)
- falsifying control: a caller that hammers past retry-after, or starts a loop it does not see to REC (cutting the HTTP client mid-loop while the server keeps running, holding the box for the full deadline), contradicts this. A loop you abandon still occupies the box.

## engine — the muses, and thea's remedy

### GL-WV-11 — The Muses are the nine operators; Mnemosyne is the record; Thea holds the light
- pipeline: law
- status: appointed (Glauca's mnemonic — the house's nine operators, not a measurement)
- supersedes: —
- evidence: the cube's nine (NUL SIG INS / SEG CON SYN / DEF EVA REC, organs/cube.mjs) turned as the Muses of generation, daughters of Memory (Mnemosyne = the EOT/ledger they all issue from), their aunt Thea (Titaness of sight, thea.js) the clear eye that turns a finding into a remedy; the helix turns them three times (weave.mjs, GL-CB-02)
- falsifying control: treating the correspondence as a measured claim rather than an appointed mnemonic contradicts the standing (the house never presents a mythic map as evidence).

### GL-WV-12 — The gate is the verdict; the remedy is the bounded loop, never a one-shot re-run
- pipeline: engine
- status: standing
- supersedes: —
- evidence: the datefmt build drew both units whole (GL-WV-09) and the gate caught ONE real behavioral gap — fmtDuration(0) got "" want "0s" (a plausible function, wrong at zero); the one-shot build could not repair, so the remedy is /v1/code (code-loop.js: the model proposes READ/PATCH, the edit op is derived MECHANICALLY from the bytes, the real testCommand gates, and on failure the file is REVERTED to pre-round bytes and the grounded failure folds into the next round — bounded by maxRounds, disclosed, never silent)
- falsifying control: a gate failure repaired by re-running the whole build (rather than the reverted, grounded, bounded loop), or a fix applied without the real test deciding, contradicts this.

## The lesson, in the archons' own order

Gary shapes the ask (facts, not prohibitions; the head is the anchor). The Muses
do their nine in order — SEG cuts, INS seeds, SYN assembles, EVA judges. Kleeneup
keeps each unit whole. Thea sees the failure in clear light and paces the remedy.
Heimdall guards the box: a typed refusal over a jam, a held turn over a wedge.
Hora sets each unit down whole before the next. Lovelace computes the structure
and lets the test decide. Bayes measures competence, never assumes it. And
Mnemosyne — the record — is where every draw, every scar, every remedy lands,
so the next weave starts from what this one learned.

### GL-WV-13 — The steersman: the shadow types mattering; Thea steers activation; logos is untouched
- pipeline: organs (the "for whom" of the turn)
- status: standing
- supersedes: —
- evidence: organs/steersman.mjs + organs/steersman.test.mjs (gate 8/8, 2026-10-01); the shadow is ConcernField@1, one prior per speakable archon built from the FULL ORIGINAL canon (live_priors/derived-priors/concern-priors/, 60 priors over the whole 83-handle cast: 23 named gaps — Shakespeare's source missing, the 22 silent archons' canon not in the priors (copyrighted_deferred/not_found), never shadowed from nothing · gate: determinism/provenance/null-floor/distinctiveness all PASS). The steersman types the discourse move (Socrates' elenctic moves, closed vocabulary), performs the consumption move (Terry Gross: the prior turn is carried — the anti-schizoid seam, one thread), and activates archons whose concern terms clear the population null (|shadow|·|topic|/|U| — never a hand-set floor); a topic token touching more than half the cast is common ground and is excluded. The envelope covers the WHOLE cast: activated + present (shadowed, untouched) + refused (named, never ventriloquized) = 83/83. Neither lane → APORIA, reason named. The metadata lane is disclosed-weak (pythia's autoPick surface measures ~chance, AUC 0.542): a pointer, never a ground. The pathos law rides in every envelope: never a gate, never a grade. The permutation null was measured and refused for the shadow (it admits die/nicht/ein as German dwellings — it cannot see grammatical regularity); the population null stands.
- falsifying control: an envelope that activates an archon whose concern field does not touch the topic, or that draws a response from an archon on an aporia turn, or a shadow term whose byte span does not contain it — any of these breaks the steering.

# Addendum E — the closed resolver and the holograph of the run (2026-10-01)

// The design made code. The taxonomy of "any arbitrary generation task" is now
// complete by CLOSURE, not enumeration (the law: named gaps, never invented
// lists): the cube is closed (9 operations × 3 grains = 27 cells, one declared
// void), the resolver lands every task in one cell and routes it, and every run
// is sealed as a holograph (SOURCES / RESPONSE / NOTES) — no cloth without the
// ledger of its making.

## organs — the closed resolver

### GL-RS-01 — The taxonomy is complete by closure; every task lands in one cell, routed or a named void
- pipeline: organs
- status: standing
- supersedes: — (renumbered from GL-WV-13 2026-10-01 to clear the homonym with the steersman's entry — id corrected in place, disclosed)
- evidence: organs/resolver.mjs (Resolver@1, selftest 34/34 — all 27 cells enumerated and routed or void, exactly one declared void DEF·Ground; routes: image→measure (look.js, no model), html→box:html:snip, data feed→box:feed (window+agenda), code→engine (/v1/ask→/v1/code), prose INS→engine, unroutable→mouth, DEF·Ground→void loudly); organs/html-snip.mjs (HtmlSnip@1, selftest 7/7 — the tag-aware, byte-addressed HTML snipper, GL-EN-09's analogue for markup); gym/weave-build.mjs (runWeave routes through classify(); every run sealed by seal() into apps/weaves/<slug>-facing.html)
- falsifying control: a task that lands in no cell, a second cell double-routed, a void cell that is not named, or a run sealed without a holograph (no SOURCES/NOTES), contradicts this; the resolver's word-boundary scorer must not misfire a modality (the "json"⊂"js" collision was caught and fixed with \b-boundaries).

## engine — the holograph of the run

### GL-RS-02 — Every run is a holograph: SOURCES addressed, RESPONSE tagged, NOTES disclosed
- pipeline: engine
- status: standing
- supersedes: — (renumbered from GL-WV-14 2026-10-01, id corrected in place, disclosed)
- evidence: gym/weave-build.mjs seal() (writes apps/weaves/<slug>-facing.html: [S#] SOURCES @ permanent address · bytes, RESPONSE = the artifact/fragment/code, NOTES = route·cell·mouthCalls·verdict·standing·falsifier); the council/feed run's SOURCES = the legistar feed via the gym door; the snip run's SOURCES = the html byte span; the image run's SOURCES = the image + OCR standing (GL-IM-01)
- falsifying control: a run whose facing page hides the mouthCalls, or whose RESPONSE carries a claim with no SOURCES entry, contradicts this — the holograph is the ledger of its own making (GL-00, GL-BD-04).

# Addendum F — the generation door and the round-robin (2026-10-01)

// The operator's direction: "heimdall work with penelope to vastly improve our
// ability to round robin different requests fairly and efficiently" and "all
// generation related to eoreader7 will run through Penelope." Two seams land:
// (1) EVERY door Penelope speaks through now carries ONE identity
// (x-er7-user: penelope) and a request kind, so Heimdall's queue holds one
// place for her and rotates kinds by measured service; (2) eoreader7's own
// draws route through Penelope's generation door (organs/generation-door.mjs,
// mounted at /api/generate), which checks the box first and draws only the
// residue through Heimdall's channel — every draw on the swatch.

## door — the generation door and the one identity

### GL-RR-01 — All of Penelope's doors share one identity and declare their kind; Heimdall round-robins the kinds fairly
- pipeline: door
- status: standing
- supersedes: — (the 2026-10-01 "two routes" note in gym/server.mjs is superseded in place, disclosed)
- evidence: gym/server.mjs (ID = { x-er7-user: penelope, x-er7-caller: penelope-gym } on drawChat / draw / chat-stream; kinds: chat interactive-if-page (the channel's own pageOrigin rule, reused), stream interactive, probe batch, build batch in gym/weave-build.mjs HDRS); eoreader7/heimdall.mjs kindOf() closed vocabulary + laneCmp (lane → kind pressure → last-served) + kindServed/kindTurnMs EWMAs + kind-aware ETA (queueOf); tests/heimdall-queue.test.mjs 9/9 incl. KIND FAIR-SHARE (a kind served more yields to a kind served less) and KIND FALLBACK; verified live on a test port: /heimdall disclosure shows kinds.served {chat:1} after one admitted kind-chat turn
- falsifying control: a call from any Penelope door that does not carry x-er7-user: penelope, or a queue where a served-more kind still leads over a served-less kind, breaks this.

### GL-RR-02 — The generation door: eoreader7's draws run through Penelope; the box checks first, the mouth draws the residue through Heimdall's channel, and every draw lands on the swatch
- pipeline: organs + door
- status: standing
- supersedes: —
- evidence: organs/generation-door.mjs runDrawDoor() (box first — today a named gap, "no organ holds a raw-draw shape"; mouth draws through the channel with ID + x-er7-kind + the turn's re-entry hop; keepAliveS holds residency across a long turn; bounded defer on 429/503; every draw + every refusal lands on gym/swatch.jsonl, schema Swatch@1); eoreader7/proxy-runner.mjs streamOllamaChat door branch (ER7_GENERATION_DOOR, default the penelope door; gate first, door second, output guard still holds the door's text; a door that is UNREACHABLE is a named finding and the draw falls through to the direct host path — the box stays alive, never a silent bypass; a door that is UP but refuses is a typed throw, never a retry storm); live run 2026-10-01: POST /api/generate {prompt:"Say the single word: DONE", kind:"probe", hop:1} → {ok:true, text:"DONE", winner:"mouth", ms:897} with the swatch row "draw:probe" recorded
- falsifying control: a draw that bypasses the door without the draw_door_unreachable note, a swatch row whose verdict does not match the winner, or a door that answers a draw the box already holds — any of these breaks this.

## engine — the heimdall side (the fair share and the spread)

### GL-RR-03 — Heimdall's queue is kind-fair and its ETA is kind-measured; the host picker spreads within one measured load cost; the online tier rotates measured-equal providers
- pipeline: engine (the admission and the steering)
- status: standing
- supersedes: —
- evidence: eoreader7/heimdall.mjs (laneCmp sorts lane → kind pressure → last-served; noteKindServed at both serve sites; kindTurnMs per-kind EWMA feeds queueOf's ETA; pickHost's SPREAD: hosts whose wait exceeds the best by ≤ the cheapest MEASURED loadMs rotate least-picked-first — the 2026-09-21 lesson, a naive round robin pays a cold load and discards every prefix cache; reason "spread_within_load_cost"); eoreader7/native/kernel/online-mouths.js pick() (rotate across MEASURED providers within one EWMA smoothing step of the best latency — measured-equal windows are shared, never burned one at a time; unmeasured providers are never rotated as equal); tests 9/9 queue, 4/4 spread, 7/7 online
- falsifying control: a host rotated to when its wait exceeds the best by more than the cheapest measured load, a provider rotated to that is clearly slower than the best by more than the smoothing step, or a queue that serves a served-more kind ahead of a served-less one — any of these breaks this.

# Addendum G — the mouth is Penelope's (2026-10-01)

// The operator's direction: "penelope sit on top of eoreader7 and the mouth
// is with her." The generation door (Addendum F) already carried every
// eoreader7 draw through Penelope; this addendum gives her the mouth — her
// own admission and kind→wire routing — and makes her the first door a draw
// enters. The bridge (Heimdall's channel, the AntiStrauss gate, the host
// picker, the upstream lanes) still executes; it is never forked.

## organs + door + engine — the mouth

### GL-RR-04 — The mouth is Penelope's: a draw enters her admission and kind→wire routing first; the bridge (Heimdall's channel) executes, never forked
- pipeline: organs + door + engine
- status: standing
- supersedes: —
- evidence: penelope organs/mouth.mjs (Mouth@1, 14 selftests: admit — the ration 40 draws/15 min per identity, typed 429/503 + Retry-After, hop≥1 honors the doorway's admission; route/modelForWire — kind→wire /api/chat | /api/generate | /api/embed, plain model on every wire, a carried er7: prefix stripped); penelope mouth/server.mjs (POST /v1/draw, POST /v1/mouth/admit, and the wire routes /api/generate /api/chat /api/embed /v1/chat/completions that are DROP-IN for the channel — a caller changes only its base URL; identity/kind/hop headers ride through; every draw on the ration log). eoreader7 native/kernel/mouth.js (MOUTH_URL/MOUTH_IDENTITY — the ONE address, same discipline model-server.js holds for the daemon). Rerouted onto the mouth, verified live 2026-10-01: gym/server.mjs drawChat/draw/chat-stream (mouth /v1/draw, stream piped); organs/generation-door.mjs runDrawDoor (mouth /api/generate — the door the proxy's streamOllamaChat calls by default, GENERATION_DOOR); code-build.js (mouth /api/generate), look.js (mouth /api/chat), corpus-resonance.js + prior-query.js (mouth /api/embed); eoreader7 native tests 29/29 (corpus-resonance, prior-resonance, look) through the mouth; live draws: chat→"mouth", code→"shuttle", generation-door→"doorstop", NDJSON streamed, embeddings→full vectors. Coordinated restart 2026-10-01 (mouth → gym → proxy): proxy /v1/ask → "voyage" through the doorway → generation door → mouth → bridge (4 s), channel draw restored 200, eoreader7 native tests 29/29 through the mouth. The proxy's in-process draws already route through Penelope via the generation door (GL-RR-02); a redundant mouth-admit choke point was added to streamOllamaChat and REVERTED — it tripled the hops and killed the door-unreachable fall-through; the generation door is the seam.
- falsifying control: a SERVED engine draw — an organ, a the-fold surface, a proxy doorway, the penelope gym or generation door — that reaches ollama, the daemon, or the channel without first passing the mouth (a file addressing 11434/11435/ER7_OLLAMA_URL for a draw in the production path, or a draw that bypasses the generation door) breaks this. Eval harnesses (native/eval/*, build-battery, connector-witness.test.mjs) address the channel directly as BATCH tools — a named, separate migration (eval draws, never served draws), not part of this rule's scope. The one disclosed exception, standing: when PENELOPE HERSELF is unreachable (the generation door down, draw_door_unreachable noted), streamOllamaChat falls through to the direct host path so the box stays alive — a named finding, never a silent bypass (GL-RR-02). A mouth that refuses (up but 429/503) is a typed throw, never a fall-through.

# Addendum H — the seams of the build run, closed (2026-10-01)

// A live build chase falsified five seams of the generation process. Each is
// filed with its evidence and its falsifying control; where the run tripped an
// entry's falsifier, that entry is superseded by pointer, never rewritten. The
// fixes are pipeline, never output: the mouth-routing, the address resolution,
// the gate's argv, the seal's count, and the door's refusal shape.

## build — the cloth

### GL-BD-09 — A build-shaped ask is a typed refusal or a build, never a silent turn
- pipeline: build
- status: standing
- supersedes: GL-WV-07, in part — its evidence claimed "the proxy's own build
  detection routes a discrete multi-unit task to buildCodeTask"; the live run
  falsified it. The rule GL-WV-07 protects — the loom feeds through the real
  /v1/ask doorway, never the bare organ door — stands.
- evidence: eoreader7/proxy.mjs (the LIVE /v1/ask branch, lines 1211-1227:
  detectBuildTask matched, buildCodeTask returned !ok, and the ask fell through
  to the normal chat turn; now a 400 kind "mechanical-code-build-refused"). The
  screenshot-pipeline twin (eoreader7-screenshot-pipeline/proxy.mjs) got the
  same fix. eoreader7/native/organs/code-build.js detectBuildTask + planUnits
  (detect said YES — write+module+functions+commas — but the build could not
  run, and the turn answered); measured 2026-10-01: gym/swatch.jsonl row 65
  ("engine:write a module with two functions: clamp", engine "eoreader7 /v1/ask
  (turned, not built)", verdict "turn") — the door answered a chat draw (Python
  prose), not a build; the planUnits gap ("two functions clamp and lerp",
  and-separated, parsed ZERO units); and the DRAW gap: both resident mouths
  answered the bare "function clamp(" anchor with prose-Python ("Certainly!
  Below is a Python module..."), while the fenced anchor "\`\`\`javascript\n
  function clamp(" held gemma2:2b in JS 3/3 probed and qwen2.5-coder:1.5b
  drifted every time. All three closed: planUnits parses and-separated names
  gated by a plural unit-noun + a stop-word set; detectBuildTask's listed
  clause requires a NAMED list (a paper about "the functions of memory" no
  longer opens the build door); the draw anchor is the fenced JS head the
  small mouth completes; and a matched build that cannot run is a typed
  refusal, never prose.
- falsifying control: a module-shaped ask reaching the chat turn instead of a
  build or a typed refusal, a prose ask that opens the build door and is
  refused with a build gap, or a JS-fenced build draw that the resident mouth
  still answers in prose-Python (the anchor losing), contradicts this.

### GL-BD-10 — The seam is an address: a relative --out is resolved by the proxy's cwd, never Penelope's
- pipeline: build
- status: standing
- supersedes: —
- evidence: gym/weave-build.mjs engineRun (out passed verbatim to /v1/ask; the
  remedy's workspace was path.dirname(out) — a relative out stayed relative;
  now resolved against the ROOT to an absolute path before the post);
  eoreader7/native/organs/code-build.js buildCodeTask (the LIVE build engine —
  target = out, resolved against the PROXY's own cwd, which is eoreader7/, not
  Penelope; a relative out misses and verified stays false, the gate never
  runs); measured 2026-10-01:
  gym/swatch.jsonl row 70 ("engine:clamp+lerp+remedy", verdict "workspace must
  be an existing directory" — Thea's /v1/code refused), rows 4-8
  ("engine:parseDate+fmtDuration", verdict "false" ×5 — verified:false, the
  gate never ran).
- falsifying control: a loom that resolves --out to an absolute path whose
  build still writes nowhere and verifies false, or a failure attributed to the
  draw when the write missed and the gate never ran, contradicts this.

### GL-BD-11 — The gate's argv is part of the testCommand; a bare testCommand dies at "no module path"
- pipeline: build
- status: standing
- supersedes: —
- evidence: eoreader7/native/organs/code-build.js
  buildCodeTask (execSync(testCommand) with NO argv — a black box);
  apps/weaves/clamp-gate.mjs (the gate reads process.argv[2] and exits 1
  "gate: no module path" without it); measured 2026-10-01: a testCommand of
  "node apps/weaves/clamp-gate.mjs" exits 1 with "no module path" — the gate's
  cases never ran, verified stayed false. Closed: the loom composes the
  absolute module path into the testCommand when it is absent (JSON-quoted),
  for ANY declared interpreter — node/python3 alike (2026-10-01: the python
  build's gate "python3 apps/weaves/case-py-gate.py" ran without the module
  path until the composition covered python3; box-computed python passed the
  gate 9/9 once the module was named).
- falsifying control: a bare testCommand that still runs the gate's own cases,
  or a gate failure reported as a code failure when the gate never ran,
  contradicts this.

## engine — the holograph of the run

### GL-RS-03 — The holograph's mouthCalls is the run's own count; ?? 0 is a false claim, not a number
- pipeline: engine
- status: standing
- supersedes: GL-RS-02, in part — its falsifier ("a run whose facing page hides
  the mouthCalls") fired: seal defaulted a field the run never returned to 0.
  The holograph rule (every run carries SOURCES / RESPONSE / NOTES with the
  real count) stands. Supersedes GL-WV-05, in part — its falsifier ("a draw
  recorded in one and not the other") fired on the same run; the swatch-sum
  rule stands.
- evidence: gym/weave-build.mjs engineRun (returns draws, no mouthCalls) and
  seal() (wrote `mouthCalls: result.mouthCalls ?? 0`; now `?? result.draws ??
  0`); measured 2026-10-01: gym/swatch.jsonl ("engine:clamp+lerp", mouthCalls
  2) against apps/weaves/weave-1790891844076-facing.html ("· mouthCalls: 0 ·
  verdict: false") — the swatch and the holograph disagreed on the same run;
  GL-WV-05's falsifier and the SWT thread's ctl (∑swatch ≠ ∑{≡ ↻ ●}) both fired.
- falsifying control: a holograph whose NOTES mouthCalls disagrees with the
  swatch row for the same run, or a seal that writes 0 where the run returned
  no count instead of naming the gap, contradicts this.

## organs + door + engine — the mouth

### GL-RR-05 — Every served build draw enters the mouth: the engine's draw() and the live code-build are her clients, never freelancers
- pipeline: organs + door + engine
- status: standing
- supersedes: GL-RR-04, in part — its falsifier ("a SERVED engine draw … that
  reaches ollama … without first passing the mouth breaks this") fired on two
  served paths. The mouth's law (organs/mouth.mjs:1-17: the draw itself is the
  BRIDGE, always, never a second ollama call) stands.
- evidence: organs/generation/engine.mjs draw() (posted ${OLLAMA}/api/generate —
  the direct host path — with no admit, no kind→wire routing, no identity;
  now env-gated: PENELOPE_MOUTH_URL set → the draw enters her /api/generate
  wire with the penelope identity + x-er7-kind, and a 429 defers on the
  retry-after; unset → the ai-code-harness twin stays byte-compatible);
  eoreader7-screenshot-pipeline/native/organs/code-build.js draw() (posted
  straight to ${ER7_OLLAMA_URL}/api/generate with no identity and no kind —
  now routes the mouth at 127.0.0.1:11439 with the build identity + a bounded
  429 defer). The live door's engine, eoreader7/native/organs/code-build.js,
  already routed via kernel/mouth.js (MOUTH_URL 11439, MOUTH_IDENTITY +
  x-er7-kind) — the law held there. Measured 2026-10-01: the engine's fillUnits
  draws and the screenshot copy's build draws reached the daemon while the
  mouth's ration log never saw them.
- falsifying control: a served engine or build draw that reaches the
  daemon/channel while the mouth's ration log shows no admit for it, or a fix
  that forks the bridge instead of routing the draw through the mouth's wire,
  contradicts this.

# Addendum I — the mouth never draws logic (2026-10-01)

// The operator's direction: "why is the model doing any logic? remember our
// Kant." The answer is that the build engine asked an empirical faculty to
// legislate: logic is a priori — the understanding's own contribution — and an
// LLM can only imitate the shape of legislation, which is dialectical illusion
// by construction (the toCamelCase/toSnakeCase draw produced necessarily-
// looking logic that failed 4/10). The fix is architectural: a unit whose name
// legislates an a priori category is COMPUTED by the box, 0 draws; the mouth
// draws only the irreducible residue. Structure AND logic are the
// understanding's; only matter is the mouth's.

## build — the cloth

### GL-BD-12 — The mouth never draws logic: an a priori unit is a category, computed by the box; the residue draws
- pipeline: build
- status: standing
- supersedes: —
- evidence: eoreader7/native/organs/mechanical-units.js (the closed a priori
  registry — MEDIUM-AWARE: the logic is language-neutral, the syntax is the
  medium; every category carries a js and a python body, the name normalizes
  across medium (to_camel_case ≡ toCamelCase), a category with no body for the
  ask's language routes to the mouth — the residue is OPEN by construction;
  selftest 15/15 incl. real python3 golden pins: clamp, lerp,
  toCamelCase/toSnakeCase/toKebabCase/toTitleCase, slugify, countWords,
  capitalize, pluralize, formatBytes, padStart/padEnd, fmtDuration); eoreader7/
  native/organs/code-build.js buildCodeTask (per-unit routing: a category
  computes — provenance source "box", 0 draws — else the mouth draws with the
  language-aware fenced anchor (```python/def vs ```javascript/function) and the
  language-aware extractor (def + indentation-block walk for python, function +
  brace walk for js); the assembled file carries provenance, boxUnits,
  boxBytes, mouthBytes, and `draws` is the mouth count only); measured
  2026-10-01: the toCamelCase/toSnakeCase weave drew from the mouth and failed
  4/10 golden pairs — "convincingly wrong" logic, the dialectical illusion;
  after the fix the same weave computed both units in the box — draws 0,
  mouthCalls 0, tokens 0, boxBytes 512, verified true, gate 10/10 (swatch row
  2026-10-01T22:36:41). The residue stays open: isPalindrome (unowned) drew
  from the mouth — draws 1, mouthCalls 1, mouthBytes 262, verified true, gate
  5/5 (swatch row 2026-10-01T22:38). A DIFFERENT MEDIUM (python, 2026-10-01):
  the to_camel_case/to_snake_case python build computed both units in the box
  (boxBytes 457, mouthBytes 0, provenance lang "python"), gate 9/9 verified —
  the a priori crossed the medium; the pre-fix JS-tether (registry/anchor/
  extractor) had returned "no units drawn". The prose/matter domain drew an
  EMPTY composition at the same hour (box saturated after a session of builds)
  — the mouth's matter was starved, not exercised.
- falsifying control: a unit whose name the registry owns drawn from the mouth
  (provenance source "mouth" for a category shape), a box-computed unit whose
  body fails its own golden cases, or a category that the medium leaks (a
  python ask routed through the js anchor/extractor) contradicts this.

# Addendum J — the reading door (2026-10-01)

// The holodeck (a surface, a fold) calls eoreader7's POST /v1/read to read each
// added document — khora perceives, model-free. The chase found the door
// missing (404 "no such route"; never existed, absent from git history), so the
// holodeck's reading half was down. The door is now wired: the constitutional
// reader (legacy host) over { name, text } → EORead@1 ground, the mouth never
// consulted. Reading and generation now both flow through the holodeck's
// composition without regressions.

## door — the reading door, khora perceives

### GL-RR-06 — The reading door: POST /v1/read — khora perceives, model-free, the mouth never consulted
- pipeline: door + engine
- status: standing
- supersedes: —
- evidence: eoreader7/proxy.mjs (POST /v1/read — the constitutional reader,
  legacy host: createSession → admitChunked → sessionReferents, imported
  lazily; { name, text } → EORead@1 with referents [{surfaces, routes, grain}],
  gaps, basis naming the assembly and the stages run / not run per S1/P2/P3);
  measured 2026-10-01: "test-klaus.txt" read in 20ms — referents Fischer,
  Vienna, Continuum, Care, Dr, Marsh, Tuesday, the README's measured defects
  reproduced verbatim ("Continuum of Care" split at "of"; "Tuesday" admitted);
  gaps honest (no_abbreviation_prior_for_language — bin/priors/lang/en.json
  absent, engine floor used and disclosed; pronoun resolution gaps). The
  holodeck surface accepts the response (schema EORead@1, the exact shape
  hdEngineRead checks) and treats the referents as a witness beside its own
  finder, never a replacement. Generation unchanged: the toCamelCase/
  toSnakeCase weave still computes both units in the box — draws 0, mouthCalls
  0, boxBytes 512, verified true, gate 10/10 — zero regressions from the seam
  fixes (GL-BD-09/10/11/12, GL-RR-04/05).
- falsifying control: a read that consults the mouth, a read response without
  the assembly + stages-named basis (S1/P2), or a generation weave that
  regresses (a category drawn from the mouth, a gate not run) after the
  reading door lands, contradicts this.

# Addendum K — the birth certificate (2026-10-01)

// The swarm's seven framings against the seed: five landed. The one that stung
// is recorded here — the axes are corpus artifacts, and the khora must never
// dress them as a priori. "The word a priori did not survive at all." The khora
// is a provisional commitment machinery: the forms of operation fixed, the
// world-model (the 27, the axes, the coordinates) maintained, its birth
// certificate written beside its falsifier.

## khora — the axes, held with their birth certificate

### GL-BD-14 — The 27 are a maintained, corpus-recovered model, never a priori; reSeed is named, not silent
- pipeline: khora + door
- status: standing
- supersedes: —
- evidence: eoreader7/khora/H/H.mjs (PROVENANCE: recovered from human verb
  embeddings, a posteriori; orthogonality measured Rand ≈ 0.05; 27 cells fit
  at 8.8× chance; escapeHatch disclosed as wired:false — reSeed is
  constitutional, not operational; selftest pins the birth certificate and
  the unwired hatch, 9/9); eoreader7/KHORA.md (discipline clause 3: "the word
  'a priori' does not survive"); eoreader7/khora/migrate/ledger.json
  (named-gaps: closure-at-3-unwired, axes-corpus-provenance, each with a
  falsifier). The running resolver/cube still closes at 27 — a named gap,
  never a silent escape hatch. The desert is a finding about languages, never
  about the machine, which can verb anything in notation.
- falsifying control: a claim that calls the 27 "a priori", a run that
  under-attends where the prior is poor and reports the poverty as the
  machine's, or a reSeed that fires without an external witness, contradicts
  this.

# Addendum L — the falsification that landed (2026-10-01)

// Asked to falsify "actual reading and generation through." Reading landed
// (real ground, honest caseless-script gap), generation landed (a real module
// gate-verified against the read document's own dates). The falsification
// ATTEMPT landed too: "write a module with a function" — a build intent with
// no named unit — was silently swallowed by the tightened detector into a
// prose turn, the exact GL-BD-09 swallow, one boundary out. Fixed: a
// code-target build intent is a typed refusal or a build, never a turn.

## build — the boundary the falsification found

### GL-BD-15 — A code-target build intent with no named unit is a typed refusal, never a turn
- pipeline: build
- status: standing
- supersedes: GL-BD-09, in part — its rule stands ("a build-shaped ask is a
  typed refusal or a build, never a silent turn"); GL-BD-09's tightened
  `listed` left a one-boundary-out hole: "write a module with a function"
  named no unit, failed the named-list gate, and fell to prose. This entry
  closes the hole without reopening the prose false-positive.
- evidence: eoreader7/native/organs/code-build.js detectCodeBuildIntent (a
  code-file target — file|module|script|library|utility|helper|class — is a
  build intent even with no unit named; prose that merely mentions
  "functions" has no code target and stays a turn); eoreader7/proxy.mjs
  (the /v1/ask build branch now gates on detectCodeBuildIntent); measured
  2026-10-01: "write a module with a function" → HTTP 400,
  kind mechanical-code-build-refused, error "a build ask must name its
  functions", no turn drawn; "a short essay about the functions of memory"
  → not refused (left a turn); the toCamelCase/toSnakeCase weave still
  ok:true, draws:0, verified:true — zero regression.
- falsifying control: a build intent (write/make/create + a code-file target)
  answered with a prose turn, or prose mentioning "functions" refused with a
  build gap, contradicts this.

# Addendum M — the mechanical quote (2026-10-01)

// The waxen-tablet essay's hand-typed "verbatim" quotes did NOT resolve in the
// source (indexOf −1; line breaks and footnote markers the author did not
// copy). The lesson: a model never writes a verbatim quote. The mouth names the
// citation; the box SNIPS it at its permanent byte address (kleeneup's law) and
// substitutes the source's own bytes. And the hunt — the web research door — is
// now in the essay's ground, not just the archons.

## prose — the box snips, the mouth never quotes verbatim

### GL-BD-16 — The mechanical quote: the mouth names the address; the box snips the verbatim bytes
- pipeline: prose + organs
- status: standing
- supersedes: —
- evidence: penelope/organs/snip-cite.mjs (SnipCite@1 — snipSentence(source,
  abs): re-slices the source bytes at the permanent address to the sentence
  end (hard-wrapped lines joined), refuses a drifted address and an unreadable
  source, never re-finds by pattern; replaceCites(draft, resolve): the mouth's
  ⟦source@abs⟧ markers become the box's verbatim snips in curly quotes, a
  refused marker stays a named gap; selftest 5/5); measured 2026-10-01: the
  waxen-tablet essay's hand-typed quotes failed to resolve (indexOf −1); after
  the fix, "Two Faces of Memory" grounds 8/8 propositions across TWO grounds —
  the Republic (waxen tablet, byte-address 522168…) and the WEB RESEARCH door
  (the hunt: POST /api/web/search on 8812 fetched the PMC working-memory
  mini-review; khora read it — beings PFC · Prefrontal Cortex · D'Esposito ·
  Miller · Wallis · Lara; the mouth named the addresses; the box snipped) —
  8/8 re-slice-verified, 0 refused, the essay a weave of mechanical quotes and
  the mouth's disclosed residue, the pathos panel's verified voices beside it.
- falsifying control: a quoted sentence in a generated essay that is not a
  mechanical snip of its source at the shown byte address, or a refused
  citation silently replaced by the mouth's guess, contradicts this.

# Addendum N — the mechanical quote, falsified and fixed; the essay as revision (2026-10-01)

// GL-BD-16 was falsified the same day it landed: the snips were byte-verified
// but coherence-broken — the first snipSentence stopped at the abbreviation
// "Theaet." (a fragment), overlapped across sentences, and pointed at
// sentence-tails ("working memory.", "maintenance per se ."). The fix walks
// BACKWARD and FORWARD to the enclosing sentence, abbreviation-aware, so any
// address inside a sentence yields the whole clean claim. And the wider chase:
// the essay is a REVISION — the VOID is revisable; the argument discovers its
// own error and supersedes it on the record (memory-is-storage falsified by
// the argument itself → memory-is-reconstruction).

## prose — the enclosing sentence

### GL-BD-17 — The mechanical quote snips the ENCLOSING sentence, abbreviation-aware; a mid-sentence address yields the whole claim
- pipeline: prose + organs
- status: standing
- supersedes: GL-BD-16, in part — its claim ("8/8 re-slice-verified") was true but weak: verification proved the bytes resolve, not that the snips are coherent sentences. The rule it protects — the mouth never writes verbatim, the box snips at the permanent address — stands.
- evidence: penelope/organs/snip-cite.mjs snipSentence (walks backward to the enclosing sentence's start and forward to its end; a terminal is a boundary only when it is not an abbreviation — Theaet., Dr., … — and is followed by a capital or the buffer end; the "Theaet." fragment, the overlap, and the sentence-tail "working memory." failures are each pinned in the falsification); measured 2026-10-01: the waxen-tablet essay's hand-typed quotes failed to resolve (indexOf −1); the first snip organ produced fragments and overlaps (F1 abbreviation, F2 overlap, F3/F4 tails); after the fix, "The Waxen Tablet" grounds 5/5 load-bearing sentences across the Republic and the web-research door, each a verbatim enclosing sentence, re-slice-verified. The essay's prose is the writer's residue; the load-bearing sentences are the box's snips; the revision is the argument's own (memory-is-storage superseded by memory-is-reconstruction, kept on the trail).
- falsifying control: a quoted sentence in a generated work that is not the
  verbatim enclosing sentence at the shown byte address, or a superseded claim
  silently deleted instead of kept on the revision trail, contradicts this.

# Addendum O — the hard grounding rule (2026-10-01)

// The operator's direction, taken as law: "NEVER have the mouth do its own
// grounding. if it wants to put verbatim, let it, and then mechanically
// replace, and if you can't replace reliably, censor." The mouth draws freely;
// the box is the guarantee. This is the mechanical quote (GL-BD-16/17) made
// airtight: the mouth is never prohibited from quoting (Gary: information, not
// prohibition), and no ungrounded quote survives the box.

## prose — replace what is verified, censor what is not

### GL-BD-18 — The hard grounding rule: the mouth never grounds itself; the box replaces a verifiable quote verbatim and censors the rest
- pipeline: prose + organs
- status: standing
- supersedes: —
- evidence: penelope/organs/snip-cite.mjs groundOutput(text, sources) — scans
  the mouth's free output for quote attempts; a case-insensitive verbatim
  6-word fragment match in a known source yields the true byte address and the
  box's clean snip (a snip carrying header/footer markers — PMC, Copyright,
  Abstract, doi, PMID — is REFUSED as dirty, never presented); a span with no
  clean match is CENSORED (⟦censored: unverifiable quote⟧), never left
  ungrounded, never the box guessing; selftest 7/7 pins both arms; measured
  2026-10-01: the waxen-tablet quote replaced verbatim at republic@522167; the
  research quote (embedded in a dirty footer run) and an invented quote both
  censored — the false-censor (case-sensitivity) and the dirty-replace (the
  copyright footer) failures are each on the record, and the rule they earned
  is replace-only-on-a-clean-real-match. The mouth's essay draws freely; the
  box guarantees every surviving quote is a real source's byte at its address.
- falsifying control: a quoted span in a generated work that survived the box
  without a clean verbatim match at a byte address, or a dirty quote (header/
  footer embedded) presented as verified, contradicts this.

# Addendum P — the box-fill: the path to a long, grounded work (2026-10-01)

// The chase: a FIVE-PAGE grounded essay with a story in the middle, written by
// the small mouth. The honest ceiling: gemma2:2b gives either continuous voice
// (a page) or long chunk-assembly (not an essay). The organs that make the long
// grounded form possible are now built: the CLEAN SOURCE INDEX (a dirty web
// extraction grounds nothing — the box refused the PMC footer runs, so the
// research claims stayed censored) and the GROUNDED COMPOSITION (the box-fill:
// the VOID declares many claims, each grounded against a clean index or
// censored, the mouth draws only the residue between). Length scales by count
// of verified claims, never by one long draw.

## prose — the box fills the VOID

### GL-BD-19 — The box-fill: clean-source index + grounded composition; a long grounded work is many verified claims, not one long draw
- pipeline: prose + organs
- status: standing
- supersedes: —
- evidence: penelope/organs/source-index.mjs (SourceIndex@1 — a source is
  split into clean sentences with true byte addresses; header/footer/reference
  runs — PMC, Copyright, Abstract, doi, PMID — are excluded, so a dirty web
  extraction grounds nothing and the box never dresses a claim on a footer run;
  selftest 5/5); penelope/organs/grounded-composition.mjs (GroundedComposition@1
  — composeGrounded({sections, indices}): each VOID claim is grounded via
  findClean → the verbatim sentence at its byte address, or CENSORED; the
  mouth's residue draws between; selftest 2/2); measured 2026-10-01: the
  memory box-fill — 7 verified claims (Republic waxen tablet @522168, the
  student @522376, self-education @522725; research persistent activity
  @29638/@3164), 2 censored (a phrase the clean index didn't hold; an invented
  claim), none ungrounded survived, the story section honestly marked
  fictional. The dirty research text that had failed GL-BD-18's cleanliness
  now grounds cleanly through the index.
- falsifying control: a composed work with a claim that survived the box
  without a clean index match at a byte address, or a censored claim silently
  replaced by the mouth's guess, contradicts this.

# Addendum Q — the fold at the point (2026-10-01)

// Identity is the universe folded at a point, bounded by differences that make
// a difference, for a particular for-whom. An essay IS such a fold — and its
// ethos is the point at which the universe is folded. The organ that makes it
// so: the box folds the sources at the for-whom, selecting the claims whose
// differences make a difference TO that point; the mouth weaves the voice from
// that seat, for that hand. Two for-whoms fold the same universe into two
// essays with two identities, by consequence.

## prose — ethos is the point of the fold

### GL-BD-20 — The fold at the point: the essay's ethos is the for-whom at which the universe is folded, bounding the differences that make a difference
- pipeline: prose + organs
- status: standing
- supersedes: —
- evidence: penelope/organs/fold-at-point.mjs (FoldAtPoint@1 — foldAtPoint({
  forWhom, indices, sections, per }): the for-whom's stake (its significant
  words) plus each section's aspect bound the selection — a clean sentence
  sharing the stake is a load-bearing difference, selected at its byte address;
  the rest of the universe stays outside the fold; selftest 3/3 pins identity
  by consequence — different for-whoms fold different claims); measured
  2026-10-01: the memory universe (Republic + working-memory research) folded
  at "the one who keeps a memory in a box and must learn to let it go" selected
  the waxen-tablet, impressionability, maintenance (Lebedev) and divided-
  existence claims, and the mouth's voice folded to that point — "This one,
  who holds the box, must learn to let go"; folded at "the student learning how
  memory works" the same universe selected the exchange-of-knowledge, self-
  education, and PFC-encoding claims instead. The same ground, two folds, two
  identities. The fold is the ethos; the identity is the consequence there.
- falsifying control: a fold that makes the same difference to two different
  for-whoms (no identity by consequence), or a selected claim that is not a
  clean sentence at a byte address, contradicts this.

# Addendum R — the closing loop and the pheromone trail (2026-10-01)

// The system improvements that scale the essay without a bigger mouth: the
// closing loop (the VOID carries bars; a run is evaluated; the failures become
// permanent lessons; the next void is seeded with them — red rungs become
// standing rules, never retries) and the stigmergic trail (parallel leafs
// coordinate by compact pheromones that indicate the whole without anyone
// knowing the whole).

## prose — the machinery that scales

### GL-BD-21 — The closing loop and the pheromone trail: bars, permanent lessons, and parallel leafs coordinated by compact traces
- pipeline: prose + organs
- status: standing
- supersedes: —
- evidence: penelope/organs/essay-void.mjs (EssayVoid@1 — BARS: voice (no
  meta-voice), grounded (⟦source@address⟧ markers for the box to snip),
  houses (real names), coherent (no attractor repetition); evaluate(sections,
  texts) judges a run; learn(ledger, lesson) appends permanently; revise(void,
  lessons) seeds the next void with the standing rules; selftest 5/5);
  penelope/organs/stigmergy.mjs (Stigmergy@1 — lay/read/claimed: a compact
  pheromone per laid claim, deduped, the read indicates the whole without
  carrying it, no agent knows the essay; selftest 4/4); measured 2026-10-01:
  round 1 of the essay loop failed 7 bars (2 meta-voice, 2 no-house-names, 5
  ungrounded); the lessons were appended; round 2's void seeded with them
  dropped to 6 (meta-voice GONE — the lesson was learned). The parallel leafs
  wove 5 sections concurrently in ~2 min, each reading only the trail.
- falsifying control: a run that repeats a failure whose lesson is already on
  the ledger (a lesson not learned), or a leaf that draws against a shared
  anchor instead of the compact trail, contradicts this.

## white paper — the chase

### GL-WP-01 — The closing loop on a new output type: penelope defines the white paper, drafts through the real spine, error-corrects against her own definition
- pipeline: prose (white-paper adapter over the real engine)
- status: standing
- supersedes: —
- evidence: gym/white-paper-run.mjs — phases A→F on 2026-10-02; the draft's gates at white-paper-chase-1790915660728.json; lessons appended to gym/essay-lessons.jsonl. Definition gaps: descent, standing, position, aperture, falsify, mouth, no-meta. Draft failures: descent, standing, position, aperture, falsify, mouth, no-meta. Corrected remaining: descent, standing, position, aperture, falsify, mouth, no-meta.
- falsifying control: a white paper that passes every gate but cannot be drilled to the rows beneath it, or a corrected draft that reproduces a gate it was taught, contradicts this.

### GL-WP-02 — Error correction moves into the box: subject pinned (received), descent composed from the record (GL-BD-18), gates rendered not requested
- pipeline: prose (white-paper box over the real engine)
- status: standing
- supersedes: GL-WP-01's lesson "define" — the subject is declared by the asker, never re-extracted, and descent is composed from the record rather than bolted onto a paraphrasing mouth. (The first box run grounded the draft after the fact and left 2/14 claims verifiable; the correction — compose the claims FROM the record — grounded 6/6 at byte addresses.)
- evidence: gym/white-paper-box.mjs on 2026-10-02; 6/6 claims grounded to byte addresses (constitution@1216, @5967, @7864, @10695, @17946, @3321), 0 censored, gates pass by construction; artifact the-fold-error-correction-white-paper-1790915832957.html
- falsifying control: a box-composed white paper whose byte addresses do not resolve to the sentence at that address, or whose censors are hidden rather than drawn, contradicts this.

### GL-WP-03 — The white paper as a hunt: received definition (a white paper hunts and discovers), evidence the code, never the law
- pipeline: prose (white-paper hunt, no mouth draws — the hunt is mechanical)
- status: standing
- supersedes: GL-WP-02's grounding axis — the definition is received (giver: the asker, 2026-10-02), and every claim drills to code or measured record, not the constitution. (The hunt's own gate error-corrected over the run: the mouth gate first over-fired on list ordinals, formula digits, article citations, and already-established constants — each sharpened on the record before the final run passed all eight.)
- evidence: gym/white-paper-hunt.mjs on 2026-10-02; P1: no "perturb" in the prose engine (engine.mjs / prose.mjs); P2: testUnits folds (prose.mjs:113, 116); P3: ration 40/15min + 429 (mouth.mjs:31, 91), 5 refused draws measured in gym/swatch.jsonl; P4: Hoeffding bound (consensus-gate.mjs:40, 64); gates pass; artifact the-fold-error-correction-white-paper-hunt-1790916479959.html
- falsifying control: a perturbation re-run found under another name in the prose test path, the consensus gate wired into a prose verdict, or a session where the ration never throttles, contradicts this.

### GL-WP-04 — The white paper discovered, not defined: DMD against the essay ground — what clears the Fold's own gate on the world's sources
- pipeline: prose (white-paper genre hunt — consensus gate over 11 white-paper witnesses vs 4 essay ground; no mouth draws)
- status: standing
- supersedes: GL-WP-03's definition axis — the definition is not planted and not taken from the Fold's own documents; it is what the world's genre authorities and real white papers carry, gated by frequency + growth against the Fold's own essays
- evidence: gym/white-paper-genre.mjs on 2026-10-02; discovered modes: problem statement; conclusion section; references / citations / footnotes; table of contents; named author; authoritative / objective tone; audience named; decision / problem-solving purpose; data / figures / case studies; research-based / cited facts; gates pass; artifact what-a-white-paper-is-1790916865945.html; corpus and per-witness features at what-a-white-paper-is-1790916865945.dm.json
- falsifying control: an essay corpus of comparable size clearing the same five features at the same bound, an independent re-hunt failing to reproduce the features, or a white paper read as a white paper that omits all of them, contradicts this.

### GL-WP-05 — The skeleton-first white paper: the box computes the skeleton, the mouth voices residue — authorship 1 by construction, delta measured, facts refused
- pipeline: prose (skeleton-first — box DMD skeleton, mouth connective residue via the real mouth; THE-HOLOGRAPH §5)
- status: standing
- supersedes: GL-WP-04's shape — the genre's refusal (no present mode clears) becomes the SKELETON, and the local mouth is used where it is genuinely useful: voicing within a saturated form-prior, with authorship counted and every fact censored (II.9)
- evidence: gym/white-paper-mouth.mjs on 2026-10-02; skeleton 2868 bytes, mouth delta 16.0%, 4 draws, 0 facts refused by the box; gates pass; artifact what-a-white-paper-is-voiced-1790917210320.html
- falsifying control: a mouth-drawn sentence that originates a number, name, or date that survives into the artifact, or a skeleton whose figures do not match the gate's own verdict, contradicts this.

### GL-WP-07 — The reconciliation: Penelope's pipeline and eoreader7's are one spine — the mouth is the single choke point, the hunt is the working web organ
- pipeline: prose (reconciled — penelope engine + eoreader7 surf, mouth-last throughout)
- status: standing
- supersedes: GL-WP-01..05's separate hunt wiring — the audit found the reconciliation was already built (2026-10-01, "all generation related to eoreader7 runs through Penelope"): streamOllamaChat (eoreader7) → door 8137 → Penelope's mouth 11439 (admission, ration, kind) → channel 11434 (AntiStrauss, host picker). Verified live on the boundary-eulogy run's own draws (gym/swatch.jsonl 05:22–05:24, mouthCalls:1 each). The ONE genuine defect was Penelope's own prose hunt: SEARCH_URL pointed at the absorbed the-fold endpoint (dead), while the working web organ (surf.js::liveWeb) lived in eoreader7.
- evidence: organs/generation/adapters/prose.mjs — hunt() now uses eoreader7/native/the-fold/surf.js::liveWeb (the same web eoreader7's own pipeline hunts with), one hunt path for the whole system; verified live (found 400 chars on "what is a boundary in systems theory"); SEARCH_URL import removed; 90 selftests green; tapestry re-woven (WPH thread now carries white-paper-mouth.mjs + GL-WP-05)
- falsifying control: a draw in eoreader7's pipeline that reaches the channel without entering Penelope's mouth (her admission/ration/kind), or a Penelope prose hunt that returns to the dead 8812 endpoint, contradicts this.

### GL-WV-15 — The model is on the record, every draw: the swatch names the mouth that served
- pipeline: law (generation-door + weave swatch disclosure)
- status: standing
- evidence: organs/generation-door.mjs:75,83 — every `swatch({...})` row now carries `model: m` (the requested/planned mouth), success and refusal alike; gym/weave-build.mjs:59,123,141,144 — the engine rows carry `model: buildModel` (the operator's choice or the measured build mouth that held the anchor). Verified live 2026-10-02: a probe through `POST 127.0.0.1:8137/api/generate` (generation-door → mouth 11439 → channel 11434 → local ollama 11435) recorded `model: qwen2.5-coder:1.5b` on the swatch; the same draw was served by the only configured host (`ER7_OLLAMA_HOSTS=local=http://127.0.0.1:11435`) with `qwen2.5-coder:1.5b` resident in `/api/ps` — a LOCAL draw, disclosed on the record. The eoreader7 `/v1/code` response separately carries `served.asked` on the proxy side.
- falsifying control: a swatch row for a draw or build that lacks the `model` field, or a draw recorded as one model but served by another (the channel served a model different from the disclosed one), contradicts this.

### GL-RR-07 — The reverse leg: EOT -> language-specific grammar -> NL, no model — the reading door speaks back
- pipeline: reading door, reversed (the khora's perceiving path, projected back into English)
- status: standing
- supersedes: —
- evidence: eoreader7/native/kernel/eot-realize.js — `realizeRecord`/`realizeToken`/`learnForms` (order from measured parameters, forms from a measured table + regular rules + the closed set of be/have/do, absorbed markers re-realized as English function words; every function pure, nothing parses text, nothing calls a model) and eoreader7/native/eval/eot-realize.mjs, measured 2026-10-02 on UD_English-EWT with the round-trip's own two-fold discipline (the English grammar learned on one half realizes the other, never the sentence being scored): FORMS 83.9% (morphology alone, order-free), ORDER tau(id) 0.778 (ties the walled L3 — word order is dropped on entry to EOT by design), WORD+POS 37.5%, SENTENCE EXACT 8.5%, basic order SVO measured not declared. Walled at eoreader7/native/eval/eot-realize.test.mjs, floors below measurement. Through the FULL reading pipeline (the reader's own splitter, spans.js -> the English parser, a model disclosed on the forward leg -> EOTRich@1, enriched -> the grammar-only realizer on the reverse leg) on live_priors/01-literature-books/gitenberg/pg120_Treasure-Island.txt from byte 4366: 24 EOT records from 6 sentences, FORMS 84.0%, WORD+POS 46.3%, parser's own sentence re-splitting fragments the long opener so whole-sentence exactness is 0 — the reverse leg projects faithfully what the forward leg produced, errors included.
- falsifying control: a realized sentence that invents a lemma, form, number or name the record's meaning layer does not hold, a projection that reads anything beyond the record's own meaning layer, or a reverse leg that consults the mouth or any model, contradicts this.

### GL-RR-08 — Prompting the realizer over the hyperlexicon and the holograph: READ -> ADMIT -> PROMPT -> SPEAK, measured across priors that are not all proper English
- pipeline: reading door, reasoned (holograph recall -> hyperlexicon EOT by address -> grammar-only projection)
- status: standing
- supersedes: —
- evidence: eoreader7/native/eval/eot-realize-memory.mjs — the loop READ (the reader's splitter + the parser, disclosed) -> ADMIT (records in the address-keyed store, the P57 shape; words folded into field-of-record.js's holograph) -> PROMPT (a cue; recallForTurn settles above the field's own null band, turn-seat config steps 0 / spread 0, GFP Pass 35) -> SPEAK (realizeRecord, no model). Walled at eoreader7/native/eval/eot-realize-memory.test.mjs on the deterministic parts (recall's top resolves into the store by address and the grammar speaks it; verdicts ride the random null band and are not walled). Measured 2026-10-02 on three live_priors registers, 300 passages each: recall figure/ambig/none — proper 1/2/3, cosem 1/1/4, irc 1/2/3; projected forms fidelity proper 98.1%, cosem 67.9% (Singlish non-standard spellings), irc 91.5%; word+pos proper 50%, cosem 35%, irc 63.7% — the aggregates are over what recall returned, never a corpus-wide claim. The English grammar's reach is measured per register, failures shown (the parser's own read of "what u gna tatttoo" spoken back as "What tatttoo u ked Huh").
- falsifying control: a recalled passage whose EOT does not resolve in the store by its address, a projection that invents a lemma or number the record does not hold, or a recall verdict presented as a corpus-wide number rather than what the field settled, contradicts this.

### GL-RR-09 — The audited reasoned turn: NEEDS -> SEARCH -> SATISFACTION -> SPOKEN — reasoning about what a prompt needs and what would satisfy it, mechanically, on the record
- pipeline: reading door, reasoned (the chat door at eoreader7/native/eval/eot-realize-chat.mjs:8827)
- status: standing
- supersedes: —
- evidence: eoreader7/native/eval/eot-realize-need.mjs — NEEDS (the prompt parsed by closed-class grammar: who wants a name, when a date, where a place, a cue wants its own words; the grammar lives in the adapter, never the kernel, the askshape-lens discipline) -> SEARCH (holograph recall, band disclosed) -> SATISFACTION (each recalled passage checked against the need's own criterion using only the record's nodes — PROPN for a name, a dated NUM or month for a date, an oblique PROPN for a place, eot-enrich.js::groundOf's own tests — verdicts satisfied/partial/unsupported, never invented) -> SPOKEN (the English grammar, no model). A turn that cannot satisfy the need REFUSES and names what would satisfy it, instead of answering from wrong-but-adjacent material. Walled at eoreader7/native/eval/eot-realize-need.test.mjs (the lens and satisfaction check are pure; the turn's wall is "speaks what the need's own criterion approved, or refuses by naming what would satisfy"). Measured live 2026-10-02 over the door: "who is the black spot" on proper -> NEED who/black,spot -> SEARCH ambiguous band 0.667 -> SATISFACTION "The Black Spot" carries the name Spot (satisfied), the dialogue line carries none (unsupported, missing a name) -> SPOKEN "The black Spot"; "monkeys in the condo" on cosem -> SEARCH nothing -> refusal "what would satisfy it: a recalled passage carrying monkeys condo." This is the machine refusing to pretend: no model claims to know what you need; the need is parsed, the satisfaction is arithmetic, the refusal is a named gap.
- falsifying control: a spoken reply that did not pass the need's own satisfaction criterion, a refusal that does not name what would satisfy it, or a need parsed by anything but the closed-class lens (a model or a hidden list), contradicts this.

### GL-WV-16 — Teach it to fish: the local-model app-build method
- pipeline: law (the whole method — vision → appendages → box/hunt/swarm/model → log+provenance → image→html surface → swarm-reason → falsify → recreate)
- status: standing
- evidence: `content-rules.json` (eoreader7) `local-model-app-build` + `heimdall-derived-rules.json` `capability:local-model-app-build`; lived 2026-10-02 on `podcast/` (engine box-computed, zero model draws, `PODCAST GREEN`; surface rebuilt via `tools/cv2html.html`; affordances reasoned by the 1.5B mouth and 3/7 falsified by real behavior) and `textmetrics/` (provenance fold). The method: the box computes mechanical shapes, the hunt snips, the mouth draws only residue; the log discloses the model per line; the surface comes from the image→HTML tool; reasoning is swarm-framed; the real test falsifies; recreate.mjs rebuilds from the vision alone.
- falsifying control: a build that trusts say-so without the real test judging, a log line missing its model, a surface not wired to real behavior, or a "working" claim recreate.mjs cannot reproduce from the vision alone — any concedes the method.

### GL-WV-17 — Discovered on the fly: never pre-design an app-specific organ
- pipeline: law (sharpens GL-WV-16)
- status: standing
- supersedes: the habit of hand-laying a specific app's stubs, tests, box organs or parameters (2026-10-02: a news-RSS appendage was pre-designed with hand-authored stubs + tests + a bespoke RSS-generation organ — removed. None of that is built ahead.)
- evidence: the generic machinery stands alone — the void-chase discovers voids, the box computes only generic mechanical shapes, kindInduction discovers what parameters are relevant (kernel/entity-kind-induction.js::induceEntityParameters), the hunt discovers implementations by address, the stacked critique discovers what to improve, the local mouth draws residue. When a goal names a new kind (a news feed, a new content type), the machine DISCOVERS its shape on the fly: induce its parameters, hunt its implementation, draw what remains — never a hand-authored organ for that kind.
- falsifying control: a build that shipped with a pre-written app-specific organ, stub, test-set or parameter table that was not itself produced by the machinery, concedes this rule.

### GL-WV-18 — The helix: nine layers, recursion at the top, all three cube faces
- pipeline: law (sharpens GL-WV-16/17 — the method's SHAPE)
- status: standing
- supersedes: the "ladder" reading of the generation pipeline — it is a HELIX: L1 voids (NUL·Void·Clearing) → L2 generators (SIG·Field·Dissecting) → L3 contention (CON·Network·Binding) → L4 decisions (DEF·Kind·Cultivating) → L5 verdict (EVA·Kind·Encountering) → L6 fold (REC·Paradigm·Composing) → L7 rules (SYN·Atmosphere·Composing) → L8 population (INS·Field·Cultivating) → L9 recursion (SIG·Paradigm·Encountering); L9 of a turn feeds L1 of the next, one turn higher. Every layer carries operator·terrain·stance, never the operator alone.
- evidence: recursion.mjs on 2026-10-02 — L7 derived GL-WALL rules from the news-RSS wall, L8 landed its kind-facts in field.jsonl, L9 re-hunted by kind (frame-snip proven 5/5 on a known RSS builder) and honestly re-walled twice (GitHub empty population, web reach short). The claim "recursion collapses the wall" was FALSIFIED — the mechanism is real, the reach is not; the wall stands as material (rule + field fact), the fold rezeroed green.
- falsifying control: a build that stops at L6 (no rule derived, no field fact, no kind re-hunt), or a map that names an operator without its terrain and stance, or a recursion that reports a collapse the generic test does not judge, concedes this rule.

### GL-WV-19 — residue + machine repair, not redraw-and-drift
- pipeline: sharpens GL-WV-16/17 (the error-correction path)
- status: standing
- law: when a model's first draw is structurally close and an error-correction redraw collapses or drifts, KEEP the first residue and let the machine repair the generic gaps (missing import, None where a number is required, truncated return). Redraws drift; repairs do not. The kind's generic validity test judges; nothing is collapsed without its pass.
- evidence: 2026-10-02 — the news-RSS wall (GL-WALL rules, field facts, two recursion turns re-walled) collapsed: the model's first draw + three machine repairs (import, None→0 coercion, completed return) built a valid RSS 2.0 feed; no-ts → "Thu, 01 Jan 1970 00:00:00 GMT"; gate PODCAST GREEN; provenance logged.
- falsifying control: a redraw that drifts and still passes (the structure was never under repair), or a "collapse" reported without the generic test's pass, concedes this rule.

### GL-RR-10 — Stance is the join at a level of holonic relevancy; the cube's 9 are the acts, never the valence
- pipeline: law (the stance organ — eoreader7/native/organs/stance.js)
- status: standing
- supersedes: the regex/lexicon stance read, and any single-axis read (shape alone, or ground alone). Stance is NOT a property of a sentence, a word list, or a cube cell. It is the JOIN of three things at a level: SHAPE (holonicSatisfaction — open/turn/land, required, not sufficient) ∧ GROUNDED (satisfactionOfSection — lands in THIS material's own facts) ∧ STRAIN_CARRIED (the material's distinctive words, TIED TO ITS BEING). Sign is derived from the material's own copula/negation relations (readCopulaClaim), never a lexicon. The cube's 9 (STANCE_BY_MODE) are the ACTS available at the level, carried as the label, never the valence.
- evidence: eoreader7/native/eval/stance-holonic-experiment.mjs on the Elizabethan Poor Law — faithful reads in_terms (+1), carrying provided/unemployed/pensions/harshly/punished tied to the being; inverted reads against (−1) (names the theme, carries none of the material's commitment); shuffled reads off_being (0) (the act words harshly/punished/cruelly are carried but NOT tied — the being is the weather). The tie-to-being is the instrument that kills the shuffled control, which word-overlap alone cannot. STANCE IS EMERGENT: the words that carry a finding are the material's OWN distinctive words (its content words minus the theme's), computed per call from the ground's bytes and resolved through buildReferents — no stance word exists in the organ. Falsified in organs/stance.test.mjs (S1 no-lexicon, S2 real case, S3 relation-derived sign, S4 level monotonicity, S5 shuffled-never-in-terms). The archon Gornick (macro.pathos) is wired to readStance: a finding licenses `fold`, never a word-strip.
- falsifying control: any stance word list in the organ, a shuffled text reading in_terms, an inverted reading that cites no relation (or that cites a lexicon), a whole reading in_terms with an off_being part, or a Gornick finding that licenses anything but `fold` — any concedes this rule.

### GL-RR-10 — Stance is the join at a level of holonic relevancy; the cube's 9 are the acts, never the valence
- pipeline: law (the emergent stance organ — eoreader7/native/organs/stance.js, injected into penelope's fold and box)
- status: standing
- supersedes: any lexicon stance read (a word list is a word list pretending to be a measure). Stance is the JOIN of SHAPE (holonicSatisfaction — open/turn/land, required, not sufficient) ∧ GROUNDED (satisfactionOfSection — this material's own facts) ∧ STRAIN_CARRIED (the material's distinctive words, TIED TO ITS BEING). Sign is derived from the material's own copula/negation relations, never a word. The cube's 9 (STANCE_BY_MODE) are the ACTS at the level, the label, never the valence. STANCE IS EMERGENT: the words that carry a finding are the material's OWN distinctive words, computed per call, resolved through buildReferents — no stance word exists in the organ.
- evidence: eoreader7/native/organs/stance.test.mjs (S1 no-lexicon, S2 real case: faithful in_terms +1 / inverted against −1 / shuffled off_being 0 on the Elizabethan Poor Law, S3 relation-derived sign, S4 level monotonicity, S5 shuffled-never-in-terms — 7/7). Wired into penelope: fold-at-point.mjs carries a stance verdict per selected claim (organs injected, byte-identical when omitted — selftest 5/5) and generation-door.mjs's box answers the stance SHAPE with zero mouth draws (winner: box, the first cell closing the "box answers nothing" gap — measured: faithful in_terms +1, inverted against −1, shuffled off_being 0, gap = typed refusal naming what it needs). Gornick (macro.pathos) probes readStance and licenses only 'fold', never a word-strip (revision-spiral-falsify S5).
- falsifying control: a stance word list in the organ, a shuffled text reading in_terms, an inverted reading citing no relation, a whole reading in_terms with an off_being part, a Gornick finding licensing anything but 'fold', a fold-at-point claim whose stance field is wrong for its source, or a stance-shaped draw that reaches the mouth — any concedes this rule.

### GL-EN-17 — The fill fans out only across independent units, bounded by the mouth's own house cap; the run's trace is written as it works and must reconcile to the EOT
- pipeline: engine (the fill — organs/generation/engine.mjs; the loom's per-unit seal — gym/weave-build.mjs)
- status: standing
- supersedes: —
- evidence: organs/generation/engine.mjs:38-47 (the wired law), 79-135 (TRACE_SCHEMA GenerationTrace@1; makeTrace — one human line + one NDJSON row per event, zero model calls; reconcileTrace — every EOT provenance row must reappear with the same source and byte count and the per-source totals must agree), 182-247 (fillUnit emits field/hunt/mouth:draw/mouth/scar/gap as it works; fillUnits pools across units but writes results by unit index, so the EOT stays in read order), 250-263 (the bound: `adapter.independent` gates the pool; the bound is organs/mouth.mjs:30-37 HOUSE.familyCap when PENELOPE_MOUTH_URL is the draw entry — the measured house number, never invented — else 1, the serial twin; `args.parallelism` is the operator's explicit override), 312-343 (reconcile runs before the EOT is sealed; the EOT carries parallelism + trace.check; trace path and check are returned). organs/generation/adapters/code.mjs:290 (`independent: true` — each unit is its own named function with its own spec; prose.mjs deliberately does not declare it, GL-CD-07). gym/weave-build.mjs:134-149 (the live path's per-unit provenance printed and checked against buildCodeTask's own boxBytes/mouthBytes — the engine's totals, never the loom's restatement), 201-209 (seal writes `<slug>.trace.jsonl` and the per-unit lines into the facing page; a failed check is named, never smoothed); both engine swatch rows carry trace: reconciled|FAILED. The wall — organs/generation/engine.test.mjs (model-free: the field/hunt hold every unit, the mouth is never asked): field-only run 2 units / 0 draws, trace reconciled corpus 30 B; three independent hunts measured 202 ms @parallelism 3 vs 305 ms @1 with provenance in read order ["a","b","c"]; an undeclared adapter ran serial (1) despite args.parallelism 3; reconcile refused a missing row and a drifted byte. THE LIVE SEAM CLOSED (same day): eoreader7/native/organs/code-build.js:210-217 (traceEvent — an optional onEvent observer, one GenerationTrace@1 event per unit; a throwing observer never kills the build), emitted at :226 (units), :248 (box per computed unit), :250/:254 (draw:start, draw:done per concurrent draw), :274/:276 (mouth, gap), :223/:289 (refuse), :326/:327 (verify, seal); eoreader7/proxy.mjs:1265-1301 (/v1/ask with `buildStream: true` streams those events as application/x-ndjson lines, then the result — default-off, a plain ask byte-identical); gym/weave-build.mjs:95-130 (humanBuildEvent + consumeBuildStream — a stream that ends without a result is a named gap, never a silent success), :163-165 (engineRun requests buildStream and skips the post-hoc reprint when streamed). Model-free smoke: buildCodeTask box-computed toCamelCase+toSnakeCase emitted units/box/box/verify/seal (0 draws, syntax_only); consumeBuildStream over a synthetic NDJSON response returned the result and refused an empty stream. Measured 2026-10-02.
- falsifying control: units that reference each other's text filled concurrently, a pool bound not derived from the mouth's house cap (or an explicit operator override), a trace row that names a draw the EOT provenance does not hold (or bytes that drift), a reconciled-looking run whose facing page contradicts its trace file, or a dependent adapter (prose) fanned out — any concedes this rule.


### GL-CD-07 — The fold is brought in where it was derived, not everywhere; falsified off-grain, kept on-grain
- pipeline: law (the fold as verifier — brought in AS NEEDED, never bolted onto every grain)
- status: standing
- supersedes: the attempt to run the essay fold over CODE (a code fold gate added to organs/generation/adapters/code.mjs, then falsified and removed the same session).
- law: the essay fold (eoreader7 essay-fold.js::wideToAtoms → foldWideToShape, re-admission of invented referents / meta / hollow actors) is a PROSE instrument. It is brought in where prose is produced — the prose adapter testUnits already runs it — and is NOT imposed on code, where node --check + spec-conformance are the real gates and an identifier is not an invented referent.
- evidence: falsify-fold-code.mjs over the REAL recorded harness draws (594 runs, 1047 raw draws, 337 distinct bodies): the code fold gate uniquely caught 0 bodies node --check had not already refused, and false-fired on 0 of the 330 bodies that went green. FALSIFIED; the gate was removed, not kept. falsify-fold-prose.mjs over the REAL produced weaves (17 artifacts, 307 atoms): the prose fold refuses 144 atoms (46.9% — invented referent 125, hollow actor 11, meta 8). NULL: a clean paragraph re-using its ground own names still drew 2 invented-referent refusals — the invented-referent signal over-fires on sentence-initial capitalized words the ground holds in another surface form. The verdict is ASYMMETRIC: SUPPORTED ON RECALL, OVER-FIRE DISCLOSED — the fold catches real prose defects, and its invented-referent gate is noisy, not clean. That noise is the named next work, not a pass.
- falsifying control: a code gate that uniquely catches a defect node --check misses with no false positive (would un-falsify the code result), a prose run whose fold refuses ~nothing (a no-op), or a clean prose null the fold refuses nothing on (the over-fire gone) — any supersedes this rule.

### GL-IM-04 — image:page runs the MEASURED screenshot pipeline, not OCR-only
- pipeline: image:page (gym/weave-build.mjs::imagePageRun) now reads a screenshot through eoreader7 native/organs/look-screen.js -> adapters/image/screen-read.js -> screen-sidecar.js::htmlOf — pixels measured into a model (flat regions, rules, image regions, OCR text, tokens) with NO vision model (ffmpeg+tesseract), and the page regenerated from that model. The OCR-only path (look.js::ocrFullImage) is kept as the fallback, with the not-a-screen reason and the gate number named.
- status: standing
- supersedes: the prior imagePageRun, which used look.js::ocrFullImage and lost all structure (it named the gap itself: "region structure needs ... the unmerged screenshot pipeline (GL-IM-01)").
- evidence: measured live on native/adapters/image/fixtures/sample-1200x820.png — measured:true, 56 elements, gaps:["image_regions_unread"], a real measured HTML page (measured background/type/spacing) instead of OCR paragraphs. The screen pipeline is eoreader7 PR #144's tool, conformance-tested in native/conformance/screen-pipeline.test.mjs (node read == browser tool byte-identical; sidecar regenerates the page; the gate separates screen from photo).
- falsifying control: an image:page that still emits OCR-only paragraphs for a real screenshot (the measured path not reached), a measured page whose structure the sidecar did not measure, or a not-a-screen fallback that does not name its gate number — any concedes this rule.

### GL-CD-08 — The universal refinement: define the void, refine it under the real judge, in the cube's operator order
- pipeline: the spine (organs/generation/engine.mjs::arrange) now carries a REFINEMENT step after the test: a failing test is refined under the judge itself, domain-agnostic (organs/void-refine.mjs).
- status: standing
- supersedes: the code-only, one-task void-adapt demo (native/eval/the-fold/void-adapt.mjs). The mechanism is now a shared organ.
- law: give it a start state, a repertoire of TRANSFORMS (each serving a void OPERATOR with its deps), and a JUDGE (the real test — a testCommand for code, the essay bars for text). It iterates: judge; on failure select the earliest-OPERATOR legal transform whose application changes the state; a transform may only be declared when its dependencies are declared AND it does not go behind the cube's order (NUL SIG INS SEG CON SYN DEF EVA REC = Existence -> Structure -> Interpretation) — a move that skips ahead is an ILLEGAL MOVE, refused and named; apply, repeat. No legal transform moves the state = the irreducible leaf, which is the mouth's.
- evidence: FALSIFIED GENERAL on code (native/eval/the-fold/falsify-void-refine.mjs): one engine, 4/4 tasks it was not tuned for (formal_initials, restitch, title_to_snake, count_words), each converging with operators declared in order. SURVIVES ON TEXT (gym/falsify-text-refine.mjs): the same organ with the essay bars (organs/essay-void.mjs BARS) as judge converged on a bar-failing passage via strip_meta(SIG) -> house(INS) -> scope(SEG) -> ground(CON); the illegal-move probe refused CON (grounding) with only {SIG, INS} declared (missing SEG). Wired into the engine and run end-to-end: a stub adapter's failing testUnits refined to a passing passage, the sequence recorded in the EOT `refinement` block.
- falsifying control: a refinement that declares an operator out of order (behind the cube's order), a transform applied that does not move the state (a no-op counted as progress), a failure the engine reports as arrived without the judge passing, or a domain where the same organ does not converge on a task whose transforms are held — any concedes this rule.
## engine — the no-model boundary of the weave

### GL-WV-15 — The no-model mode is explicit, counted and walled: a unit that reaches the mouth stage is `model-required`, never drawn
- pipeline: engine
- status: standing
- supersedes: —
- evidence: organs/generation/engine.mjs:132-141 (fillUnits stops a unit at the mouth stage under ctx.noModel: a `model-required` provenance event, a mouth scar, a typed outcome — field | hunt | mouth | model-required | unsatisfied) and :61-65 (draw() throws under noModel — the second wall); organs/generation/api.mjs:63,84-87,143-144 (weave({ noModel }) → result.model null, evidence.outcomes, evidence.units); gym/weave-nomodel.mjs selftest 8/8 (tripwire fires on :11434, draw() refuses, stage accounting, mouth never called, no swatch growth) and organs/generation/api.mjs selftest 5/5; measured 2026-10-01: ladder/nomodel-borodino.json — 4 conditions × 5 targets, model-door calls 0, swatch growth 0; the ordinary (drawing) path re-checked with a stubbed door → outcome stage `mouth`
- falsifying control: a noModel weave that addresses any model door (the fetch tripwire in gym/weave-nomodel.mjs), grows gym/swatch.jsonl, stamps a model name on the result, or reaches adapter.mouthFragment contradicts this; so does a unit that reaches the mouth stage under noModel and is NOT reported `model-required`.

### GL-WV-16 — The first boundary of the no-model weave is the READING, not the evidence: target-blind structure with a cap below 1k words, a field that over-accepts and starves the hunt, and verification that cannot admit a grounded name
- pipeline: engine (adapter: prose)
- status: standing (an open finding — the boundary, not a repair)
- supersedes: —
- evidence: ladder/NOMODEL-BOUNDARY.md + ladder/nomodel-borodino.json (Borodino, one retained Wikipedia page, 1k/2k/4k/8k/12k words): (1) READ — 12 units at every target, artifact hash identical across targets, 9/12 shape-instrument cells (adapters/prose.mjs:38-45 filters only `relevant`), structural cap 12 × (2×220+1) = 5,292 chars ≈ 865 words (prose.mjs:54); (2) FIELD — autofill claims 12/12 with ONE identical 26-word pair (page chrome + hatnote), distinct 1, adapter probeUnit passes 0/1, hunt never consulted (0 network calls); (3) HUNT — results[0] only, body = raw HTML slice(0,400) (prose.mjs:73): 4 units / 3 different pages → 1 distinct text, 4/4 markup, 0/3 pages pass relevantSources; a dead endpoint is indistinguishable from "found nothing"; (4) VERIFY — testUnits folds with ground "" and the river-specific default beats (prose.mjs:116-117): 24/24 sentences `fold_invented_referent`; given the whole ground and the void's cells as beats the same fold dedupes correctly and admits 179/188 of the page's snips (3,080 words); (5) evidence ceiling 3,080 words (core page) … ≤ 9,143 (8-page topic probe, upper bound); ≥ 7/12 units have no clearing evidence in field or hunted pages
- falsifying control: weave for 1k and 12k that yields different units or a different artifact for the same field; a unit-addressed field (different snips for different units); a hunt whose kept text is page-specific readable prose; or a shipped verdict `ok` for an artifact containing a verbatim retained sentence that names a referent — any of these supersedes this entry. Re-run: node gym/weave-nomodel.mjs (see ladder/NOMODEL-BOUNDARY.md).

### GL-WV-17 — Provenance@2 integrity is audited, not trusted: two errors fixed, the lineage gaps and the attribution limits stay on the record
- pipeline: engine
- status: standing
- supersedes: —
- evidence: gym/weave-nomodel.mjs auditProvenance (dangling refs, byte-range seams, lineage edges, source identity, anchor granularity) + its selftest (a one-byte shift must be detected; reverting the fix makes the selftest fail — mutation-checked); organs/generation/engine.mjs:103 (anchors were `byteLength(join + "\n")`, one byte early for every contribution after the first: misaligned 11/12 → 0/12 on the Borodino run) and :231 (the verification source was missing from the table — snapshot taken before verify: dangling 1 → 0); round trip exact, 12/12 ranges slice back to the contribution; STILL ABSENT (reported, not invented): lineage edges read→unit (0/12), contributions→fold, fold→verify, verify→materialize; sub-page anchors (the source anchor is the page); a two-source contribution is addressed to the first source only (prose.mjs autofill `address: snips[0].url`, verified on a constructed case); eot.corpus.snipped/hunted/drawn read the Provenance@1 `refs` field and were always empty (now derived from events); over /api/weave a JSON context.shadow cannot be a Map and a plain object throws (the field is unreachable through the door)
- falsifying control: any weave whose audit reports misaligned > 0 or dangling > 0; a lineage edge reported present that the audit reports absent; or a contribution whose range does not slice back to its recorded text — any of these supersedes this entry.

### GL-OV-01 — Situated evidence overviews are a model-free medium with bounded negative spaces
- pipeline: overview adapter through the public generation API
- status: standing
- evidence: organs/generation/overview.mjs; organs/generation/adapters/overview.mjs; organs/generation/api.mjs; gym/overview.test.mjs (4/4 initially measured 2026-10-02). eoreader7/native/organs/overview.js is the canonical byte/replay contract. Actual ethosClear/requireClearance, logos and pathosOf run at native intake. Pathos reads artifact rhythm for a declared experiencer; it does not measure user understanding or affect and has no measured reading curve. Exports include selected text, frame, addressed witnesses, exact search scope, negative spaces, inquiries, reverse links and the complete recipe. Browser materialization uses the same portable module, but claims no native ethos clearance. No model or network calls in the public-API falsifying run.
- falsifying control: a changed quote, count, source hash, omitted gap, altered export or missing owner/experiencer accepted as verified; a literal absence promoted to a missing voice; or any model/network request during the no-model run. gym/overview.test.mjs and eoreader7/native/tests/overview.test.js plant these failures.

### GL-OV-02 — The tapestry referenced removed steering organs and omitted the current generation API
- pipeline: tapestry record maintenance
- status: standing
- supersedes: GL-WV-13 (implementation availability only; its historical evidence retained)
- evidence: on checked-out main ee10464, node gym/check-tapestry.mjs reported missing organs/steersman.mjs, steersman.test.mjs, voice.mjs and voice.e2e.mjs; these paths are absent from git ls-files. The current no-model API, provenance, boundary assays and the new overview medium were not covered. gym/tapestry.spec.json now records steering/voice as unwoven with named controls, accounts for current files, and re-generates the cloth with --stamp.
- falsifying control: a declared woven organ that does not exist; a present generation organ or assay without a tapestry thread; or node gym/check-tapestry.mjs exiting nonzero after the stamp.

### GL-CD-09 — The spec-conformance word gate is corroboration, not the judge; a callable function that names at least one spec content word ships verified
- pipeline: code adapter (organs/generation/adapters/code.mjs::probeUnit)
- status: superseded by GL-CD-11 (the probe now imports the assembly and reads the unit off its export surface; GL-CD-09's "callability by execution" ran as a plain script and read a global, the vacuous pass)
- supersedes: the 0.4 coverage bar as the effective gate for code draws (the execution check was already the real judge; GL-CD-07's "node --check + spec-conformance" stand unchanged in kind, sharpened in threshold).
- law: probeUnit FIRST verifies callability by execution — `node` runs the drawn function and reads `typeof fib`; a ReferenceError or syntax error refuses before any word gate. The spec-words gate then corroborates that the code names its own spec: it now refuses only when NO spec content word is present (present.length === 0), not at the old 0.4 bar. An English-word ratio over a real function was voiding correct draws: the box's adapter-injected atoms carry prompt-steering words ("using the function's OWN argument(s), never a timestamp or clock") and code rarely echoes prose like "Calculates/using/recursion", so a genuinely correct recursive fibonacci drew at 25% coverage (only "Fibonacci" present) and was voided `unverified` by the 0.4 bar — a false refusal of a callable, correct function. A fixed ratio (even 0.25) still false-refused longer specs: a podcast unit "Plays the specified episode … returns a boolean indicating success" drew a correct callable playEpisode that named 1 of 7 spec words (14%).
- evidence: measured 2026-10-03, one endpoint, one task: POST /api/weave {intent:"write a javascript function that returns the nth fibonacci number", artifact:"code", model:"gemma2:2b"} → BEFORE (0.4): ok:false, status:unverified, artifact.value "\n", repair.scars 4 × "spec words missing: Calculates, using, recursion (coverage 25%)", converged:false; AFTER (present.length===0): ok:true, status:verified, artifact.value the recursive fibonacci function, verification.verdict {ok:true, reason:"spec-conformant"}, repair.scars [], 12.6s. Second measured run, same gate: POST /api/weave {intent:"make me a podcast app with these javascript functions: loadEpisodes(url) returns episodes, playEpisode(id), pause(), resume()", …} → ok:true, status:verified, four callable functions (loadEpisodes, playEpisode, pause, resume), verdict spec-conformant, 30s. code.mjs:203-205 is the changed gate.
- falsifying control: a draw that is NOT callable (node --check or typeof throws) shipping verified; a callable function naming ZERO of its spec's content words passing (0 coverage); or a spec-conformance pass on code whose function body contradicts its own spec (a `fib` that returns a constant, deepEq-settled) — any supersedes this entry.

### GL-CD-10 — A build is a declared void: name its units, the box decomposes, the mouth fills residue, a gap is a typed gap never a turn
- pipeline: the build (eoreader7 /v1/build -> mechanical-code-build, reached via gym/build-podcast.mjs)
- status: standing
- supersedes: any intake that asks the mouth "how many?" — the count is a void question the mouth cannot know.
- law: the model answers only what the mechanical tiers cannot compute. A build ask must NAME its independent units (the functions); the box reads them from the ask's own words (the void's cardinality declared), decomposes into them, and the mouth draws only the irreducible residue (the function bodies). When the ask names no units, the build REFUSES with a typed gap — "no independent units found in the task — a build ask must name its functions (typed gap, never a turn)" — it never guesses and never answers as a turn.
- evidence: gym/build-podcast.mjs — "Build a podcast listening app: implement 3 functions renderEpisodes/playEpisode/filterEpisodes" -> kind: mechanical-code-build, 3 units, 2-3 draws, real JS produced (renderEpisodes builds the DOM list, filterEpisodes filters by title case-insensitive). The same ask WITHOUT named units is refused: "no independent units found in the task" — the box names the gap, never a turn. This is the same law as the essay: the void is declared, the box fills what it can, the mouth draws only the leaf no piece holds.
- falsifying control: an intake that asks the mouth for a count or a structure the ask did not declare, a build that turns a unitless ask into a guess instead of a typed gap, or a mouth draw that supplies the units (rather than only their bodies) — any concedes this rule.

### GL-CD-11 — The code probe imports the assembly and reads the unit off its EXPORT SURFACE, never a script global (2026-10-03)
- pipeline: code adapter (organs/generation/adapters/code.mjs::probeUnit / testUnits)
- status: supersedes GL-CD-09
- supersedes: GL-CD-09's "probeUnit FIRST verifies callability by execution — node runs the drawn function and reads `typeof fib`". That execution check ran the assembly as a PLAIN SCRIPT (`globalThis.__c = {}; ${code}; typeof ${name}`), so a function the mouth drew WITHOUT `export` still became a global and passed — while any strict consumer that `import`s the module saw `undefined`. The check verified a script context, never the module an importer actually gets. It was the vacuous pass, live.
- law: TWO functions, one honest division. `probeUnit` (the per-unit swarm, inside the spiral) checks CALLABILITY — the code loads and declares `name` (a snippet may not be exported yet; `assemble` adds the export block afterward). `testUnits` (the shipped verdict) does BOTH a module-mode `node --check` AND THE EXPORT-SURFACE CHECK: it writes the ASSEMBLED module to a temp `.mjs`, imports it (`import * as __m from <url>`), and asserts each planned unit is an exported function — the SAME door the strict gate uses. A unit the assembly does not export (a vacuous pass: `spec-conformant` on a module that exports nothing) is refused with `export missing or not a function: <name>`. `assemble` (adapter seam, called by the engine) turns the joined bare declarations into a real module by appending `export { a, b, c };` for the units actually declared — a unit the mouth never drew stays unexported (refused honestly) instead of breaking the whole module at load. The engine now tests and writes the ASSEMBLED artifact (`finalCode`), not the loose join. `writeTmp` gained an `ext` argument (engine.mjs) to write module-mode temps.
- evidence: measured live 2026-10-03 on the improve-hard billing task (strict gate GATE.test.mjs, hidden invariant moneyRound(1.005)===1.01): BEFORE — mouth drew `function moneyRound/lineTotal/subtotal` with NO exports, internal verdict `spec-conformant true`, strict gate `moneyRound is not a function`. AFTER the fix — assembly emits `export { moneyRound, lineTotal, subtotal }` (tax never drawn stays unexported), the internal verdict and the strict gate now AGREE: a module that imports as nothing is refused `spec-conformance` (not `spec-conformant true`), and the gate's failure is the behavioral invariant (`1 !== 1.01`), never a plumbing failure. Probe unit checks: a correctly-exported module probes `callable`, the vacuous one probes `throws` — the two verdicts the gate would give.
- falsifying control: a code draw that is a correct module (real exports, callable) refused by the probe; or a non-exporting assembly that ships `verified`; or the probe passing a unit the strict import-gate cannot see — any concedes this rule.

### GL-EN-13 — Grounding is per-thread DMD universe, not per-corpus: a claim sits inside the conversation it came from (2026-10-03)
- pipeline: prose adapter (organs/generation/adapters/prose.mjs::computeSettles) — the settle gate
- status: standing
- supersedes: the register-level falsify (the-fold/falsify-dmd-universe.mjs) folded each casual register as ONE for-whom over the whole corpus — cosem is many conversations, enron many senders, irc many channel-days, nus-sms many person-years. Mixing them flattened the trajectory (many for-whoms, one universe) and every register read below its null: cosem 0.181<0.314, enron 0.161<0.371, irc 0.204<0.303, nus-sms 0.315<0.323 (measured 2026-10-02). The finer fold reads per conversation.
- law: grounding is NOT string containment and NOT per-corpus frequency — it is the DMD-bounded universe attached to the CLAIM'S OWN thread. Sullivan individuates the thread's beings first (buildReferents: recurrence + company, the well-house — a being is earned from the material, never assumed); Chomsky arranges them universally (GFP figure-connector-figure); the universe is the top eigenvectors of the thread's state-trajectory gram; and a settle is admitted iff its beings' state reconstructs IN that universe (residual below the measured cut). The box's positional clause settle stands only when the DMD gate admits it.
- evidence: gym/falsify-dmd-threads.mjs measured the discriminator on 4 casual registers (rank-8 eigendecomposition over each thread's own resolved referents): real in-thread claims reconstruct at residual 0.28–0.35 (nus-sms 0.00); an invented/foreign claim ("quantum entanglement of the stock market overreach") reconstructs at 1.00 — clean separation on cosem, irc, enron, nus-sms. The cast-growth curve (cumulative referent count) was REJECTED as vacuous: sentence-shuffle also clears (1.062≈1.068), because a cumulative count is monotone regardless of order — the falsifying control that killed the naive reading. prose.mjs:computeSettles now runs the gate per thread (the material IS the conversation), refusing any settle whose beings the material does not individuate or whose residual ≥ 0.5.
- falsifying control: a settle that names real beings of a DIFFERENT thread (foreign material folded under a thread's for-whom) admitted; a claim from the thread's own material refused while its beings sit inside the thread's modes; or the 0.5 cut admitting a shuffled/foreign claim at residual near its own — any concedes this rule.

### GL-EN-14 — On casual English the box's reach is ~0, so the DMD gate's measurable refusal is the box settle, not the mouth (2026-10-03)
- pipeline: prose adapter — the settle + the mouth, measured on non-standard English
- status: standing
- supersedes: the hope that the box covers a real share of casual threads (GL-EN-08's honest-reach claim held on proper prose; on cosem/irc/nus the positional clause reader settled NOTHING — the compose-over-casual-English reach is ~0, so the mouth draws nearly the whole answer).
- law: the DMD-universe gate is the SAME gate on both tiers, but on casual English it can only refuse what the box actually settles — and the box settles almost nothing there. The mouth therefore draws the residue unfettered by any box reach; the gate's only measurable stop on casual threads is a settle whose beings lie outside the thread's universe. That refusal is the gate WORKING (a clean-faced fabrication caught), not a coverage win.
- evidence: gym/box-vs-model-casual.mjs, 4 casual threads (cosem-17CF01, irc-2004-11-15, nus-TaoChen-2010-019, enron-corman-2001-10-002), gemma2:2b temp 0, 3 units each. Settled: cosem 0, irc 0, nus 0, enron 1 (that one REFUSED by the universe gate). Mouth-drawn (gated): 3+6+9+11. Fabrication (figures+names not in material): model-only 3 = box+model-with-gate 3 — TIE. The single gated-refused settle is a positional clause the reader settled whose beings the material does not individuate — exactly the "fabrication with a clean face" GL-LD-07 warned about, now refused mechanically.
- falsifying control: a casual thread where the box settles a REAL share (say >20% of units) AND box+model-with-gate fabricates MORE than model-only; or a gated-refused settle later shown to be IN the thread's universe (a false refusal); or a mouth draw OUT of the universe admitted — any supersedes this.

### GL-CD-12 — The export-surface law governs the khora's /v1/build too: assemble emits exports, the no-testCommand JS validator imports the module (2026-10-03)
- pipeline: the build (eoreader7 /v1/build -> native/organs/code-build.js::buildCodeTask)
- status: supersedes GL-BD-12's "No testCommand ⇒ written and disclosed as UNVERIFIED" wording for the JS path (the disclosure stays; the JS validator is no longer a bare `node --check`)
- supersedes: the `node --check` (CJS syntax-only) JS fallback in buildCodeTask — the same vacuous-pass class GL-CD-11 closed in penelope's code adapter. `node --check` parses CJS syntax and cannot see that a module "exports nothing": a file of bare `function name(){}` declarations passes it, then imports as `{default, module.exports}` with every unit undefined.
- law: the assembled file is a MODULE. buildCodeTask now (1) appends `export { a, b, c };` for the units actually declared (already-exported units left alone), and (2) for a JS build with no testCommand, writes a real `.mjs`, IMPORTS it, and reads each planned unit off the exports — `typeof __m[name]` — reporting `validated (module exports)` or a typed refusal with the gate's own reason. The structural floor is honest (module imports, units exported); behavioral correctness is still the testCommand's to decide — never claimed by the no-testCommand validator.
- evidence: measured live 2026-10-03 on the improve-hard billing task (strict gate GATE.test.mjs, hidden invariant moneyRound(1.005)===1.01): NO testCommand — assembled module carries `export { tax, moneyRound, lineTotal, subtotal }`, `verified: "validated (module exports)"`, and the importer sees all four as functions (behavioral defect, `toFixed(2)`'s 1.005→1.00 trap, present but not claimed). WITH testCommand — `verified: false`, the gate's own assertion `moneyRound(1.005) must round half-up to 1.01 (1 !== 1.01)`.
- falsifying control: a JS build whose assembled module imports as nothing (no export block) that reports `validated`; or a no-testCommand validator that claims behavioral correctness (a number, a "pass") rather than the structural `validated (module exports)`; or a build that appends a duplicate export and fails to load — any concedes this rule.

### GL-HM-01 — The handmaidens: the house round that holds the suitors (forgetfulness and hallucination) at bay (2026-10-04)
- pipeline: law (the record's own enforcement, kept by the women at the loom)
- status: standing
- supersedes: —
- evidence: gym/handmaidens.mjs + gym/handmaidens/{eurycleia,autonoe,iphthime,telemachus}.mjs — the house round, four members, each one duty, each one suitor:
  - eurycleia the nurse — every generation THREAD NAMED (a drawing organ/adapter/door/gym-script named by no thread is a forgotten duty). Measured 2026-10-04: 13 unnamed, incl. organs/mouth.mjs, organs/voice.mjs, the essay-* scripts.
  - autonoe the second — every DRAW RECORDED (a path that reaches a model door and writes no swatch row is a leak). Measured: 12 unrecorded, incl. the box-vs-model ablations and mouth.mjs itself.
  - iphthime the dream — every CLAIM GROUNDED (a GL-* law no thread weaves, or a thread asserted but never grown, is a hallucination). Measured: 76 uncited laws, 4 ghost threads (WPH asserted by GL-WP-05 but never grown).
  - telemachus the son — every DRAW INSIDE THE SANCTIONED DOOR (a direct fetch to a model door that is not the mouth, in a path that is not a sanctioned bypass, is a breach). Measured: 4 breaches (box-settle-live-hunt, box-settle-vs-model, box-vs-model-casual, box-vs-model-experiment — POST straight to ollama, zero record).
- falsifying control: any member reporting a woven thread as unnamed, a recorded draw as a leak, a grounded law as ungrounded, or a sanctioned bypass as a breach — the member is wrong and the round must say so. The house is SOUND only when all four return ok; today it fails honestly, and the suitors it names are the work left undone.

### GL-HM-02 — The house round is wired: the ablations through the door, the server routes on the swatch, the handmaidens in the standing order (2026-10-04)
- pipeline: law (the handmaidens' wiring — GL-HM-01's enforcement made operational)
- status: standing
- supersedes: —
- evidence: measured 2026-10-04, house round before/after wiring:
  - Telemachus: 4 breaches → 0. The box-vs-model ablations (box-vs-model-casual, box-vs-model-experiment, box-settle-vs-model, box-settle-live-hunt) previously POSTed straight to localhost:11435 with zero record; they now draw through the generation door via gym/box-draw.mjs (runDrawDoor, which swatches and honors the ration). SANCTIONED updated so Telemachus names the door-held paths, never flags them.
  - Autonoe: 12 unrecorded → 8. The server's /api/chat-stream, /api/chat, /api/rung routes (gym/server.mjs) now append a swatch row each (the exported swatch writer from organs/generation-door.mjs — ONE record, one hand). Remaining leaks: mouth.mjs/resolver.mjs and the white-paper scripts (the next work).
  - Eurycleia: 13 → 10 unnamed (the arrangement-out outputs excluded — they are generation products, not tools).
  - Iphthime: unchanged — 77 uncited laws, 4 ghost threads (the deep work: weave the uncited GL-* into threads, grow the asserted-but-never-woven WPH/GAT/SWT/OWN).
  - The handmaidens are wired into CLAUDE.md's standing order (item 4: run the house round after a process change, address each member's finding before commit). package.json gains `handmaidens` and `handmaidens:test` scripts. handmaidens.test.mjs 5/5, updated to the new honest state.
- falsifying control: a draw path that reaches a model door with no swatch row (Autonoe finds it); a generation tool named by no thread (Eurycleia); a GL-* law no thread weaves or a thread asserted but never grown (Iphthime); a direct fetch to a model door that is not the mouth and not a named sanctioned exception (Telemachus) — any member that fails to report its suitor concedes the round. The house is SOUND only when all four return ok; today the round fails honestly on the three deep suitors that remain.

### GL-WV-18 — The fold's generate lane rides the weave: void detection + writing across prompts, wired end-to-end (2026-10-04)
- pipeline: the fold surfaces → heimdall bridge → penelope's generation door → the weave
- status: standing
- supersedes: —
- law: a "write / compose / draft an essay|report|piece" turn in the fold is NOT a single chat draw. It enters penelope's generation system (the weave), which detects the void (units read from the ask — the essay's void cells; a void read with a hunt when the first reading draws none) and writes across prompts (one unit per draw: field → hunt → mouth, test decides, EOT). The fold shows the record — the units the void named, who filled each (field | hunt | mouth | model-required), the verdict — so the seam is disclosed, never hidden.
- evidence: measured 2026-10-04. The fold's swatch BEFORE the wiring was all `draw:chat` — one model draw per turn, zero weave rows, zero void-hunt rows (the generate lane never reached the generation system; prose had no `readVoid` at all). AFTER:
  - `readVoid` added to the prose adapter (organs/generation/adapters/prose.mjs) — a prose void is born FROM THE HUNT: the reading + referents of the hunted material feed `voidCellsFor` again (born gate), a failed hunt returns a well-defined gap; the hunt now keeps CLEAN prose only (rejects PDF/PS/control-byte runs — measured: a PDF page seeded the shadow with garbage the autofill snipped as "ground"). In-process: `readUnits("write a short essay about the dolphin and the sea")` → 12 units (the void cells); `readVoid("write a short essay about the fold record and the void")` → 13 units born from a real hunted source (wikihow).
  - the generation door lives on penelope's running server (`/api/weave`, mouth/server.mjs) — the mouth decides draws, the weave orchestrates generation; both are penelope's, one server.
  - the bridge routes it (`POST /api/weave`, heimdall/src/bridge-server.mjs — named /api/weave NOT /api/generate: the bridge's /api/generate is the Ollama-compatible draw door, and a generation request is not an ollama draw; measured: the colliding name returned the ollama `no_model` error).
  - the fold chat's generate lane (fold-chat.js run() → fold-chat-client.js generate()) dispatches prose-artifact asks to the bridge /api/weave and renders the piece + a "generation record" disclosure (units, per-stage counts, verdict). discourse: `generationArtifact()` maps essay|report|piece → "text"; html/app/page keeps the fold's own fenced-HTML build (penelope has no html adapter yet).
  - live through the bridge (noModel): 13 units detected, 3 filled by the HUNT (the box wrote them, zero mouth draws), 10 `model-required`, verdict `folded-with-dissent` — the void detected and the field/hunt before the mouth. A real mouth run drew the cells one prompt each into a grounded essay (mouth log).
- falsifying control: a fold generate turn whose swatch row is a bare `draw:chat` (the lane reverted to a single draw); a prose void that ships as a vacuous pass instead of a hunt-defined void or a named gap; a `readVoid` whose hunt material is binary/PDF garbage that the autofill later ships as "ground"; or a fold generate turn that shows no generation record — any of these supersedes this entry.
