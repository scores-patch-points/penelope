# PRE-REGISTRATION — G1-3, the English composer (Fold pipeline, cell G1-3)

Written 2026-10-28 by the session `g1-3-composer` BEFORE any composer, checker or score exists. The sha256 of this file is written beside it
(`PREREG-G1-3-COMPOSER.sha256`) and quoted in the PIPELINE-LOG entry that registers it. Anything that changes after the hash is an
AMENDMENT, appended below the line `## AMENDMENTS` in a later file `AMENDMENT-n.md`, hashed on its own, with its reason. This file is never edited.

## 0. What is being decided

The goal G1 (the user, 2026-10-27, PIPELINE-LOG claude-ring-12): ingest War and Peace in Russian, ask questions that need mechanical reasoning,
get English prose out, with the model neither the last step of generation nor the bulk of the reasoning. The G1-3 acceptance check as the goal
states it: *English prose composed from the derivation by lawful composition, every sentence addressed to Russian spans; any model-written
sentence counts as a failure.*

This registration fixes, before anything is scored: the composer's rules, the arms, the controls, the checker, the bars and the procedure.

**What the prose will be, said first.** The composer writes English FRAMES (from a closed, declared set) around Russian QUOTATIONS and NAMES copied
byte-for-byte from the text, plus English words copied from a giver row (a kin term from the Wiktionary kin lexicon; an English name from
ParallelNames@1). It is annotation of a derivation, not translation: it does not render Russian sentences into English and does not paraphrase.
A sentence is a claim from the derivation with its evidence attached, nothing more.

## 1. Inputs (the derivation record, not the extractor)

- The fold of a window: `fold.json` (schema FoldcodeAnswerFold@1): `referents` (beings with display name and surfaces), `kin.facts` (facts with
  giver, standing, witness byte spans), `kin.statements` and `kin.unbound` (kin words the extractor could not tie to two beings), `derivation.byReferent`
  (janus `deriveKin` for the six most-mentioned beings over the 20-term battery: typed gaps) and `derivation.rules`. The composer takes a RECORD
  built from these fields; the interface is the record, so facts added later (the kin binder's) flow through with no change to the composer.
- The Russian text of the window, pinned by sha256 in the fold (`inputs.text_ru`). Addresses are UTF-8 byte offsets, half-open.
- The kin lexicon `priors/kin-lexicon.json` (janus, sha256 693f2377…, the same the fold pins) for English kin terms and the Russian kin words.
- ParallelNames@1 `priors/parallel-names-rus-eng.json` (janus PR #28, sha256 ba95430b…) for English names (rows without `collidesWith` only; chapters I to III).
- `questions.json` of the window (24 template questions: T-KIN, T-ID, T-SPEECH, C-UNCLE, C-ABSENT) and the plain answerer's replies (`foldcode-nomodel/out-dev|out-heldout/arm-P.reply.txt`).
- janus at 9fe6d918 (PR #31, `kinship.js`), read-only, to build synthetic derivations for the growth test only.

**Disclosure of what was opened before this hash.** DEVELOPMENT window (chapters I to IV): fold, questions, expected answers, plain replies,
the Russian text: opened. HELD-OUT window (chapters V to VIII): opened only its fold's top-level keys (identical to development), the COUNTS of
its kin facts (10 facts: 1 parent_of, 1 sex stated by the text, 8 sex candidates from the name-parts table), of its statements (58) and the
`questions.json` counts (12 answerable, 12 expected-gap, templates per position differ from development). No held-out name, quote, sentence, reply
or expected answer was opened. The held-out plain replies were not opened. The held-out is scored ONCE (section 9).

## 2. The composer (rules in prose)

**R1. Segments.** A sentence is a list of typed segments. Nothing else is in a sentence. Kinds:
- `frame` — words or punctuation from the closed frame set (R3), used only inside a declared skeleton (Appendix A).
- `ru` — a span of the Russian text, copied byte-for-byte (runs of whitespace rendered as one space), address `ru#a-b`. Names, forms of names and witness quotations.
- `row` — a string copied from a giver file: an English kin term, a sex word, a gloss name, copied from the key or value at a JSON path; address `<prior>@<sha8>:<path>`.
- `rec` — a string copied from the derivation record (a giver id, a standing label); address `fold:<path>`.
- `ask` — a span of the question's own text (the asker's words), address `q:<id>#a-b` (characters). Used ONLY by the C-ABSENT sentence, whose
  subject is a name that by definition has no span in the text. This is a declared extension of the three material kinds; it is reported
  separately and it never carries a claim about the text beyond absence.
- `val` — a number recomputed from the record (a count); address `val:<rule>`.
The English words of a sentence are therefore: frame words, or copied rows. Every other string is a Russian span.

**R2. Addresses and extent.** Every `ru` segment carries its byte span. A sentence that states an absence (MISS, NONE, ABS) or a count (UNB) also carries
the EXTENT address `ru#0-N` (the whole pinned text): the claim is about that whole span. Every sentence therefore has at least one Russian-span address.

**R3. The closed frame set.** The frame words are exactly the words occurring in the frame text of Appendix A, lower-cased, with the punctuation set
`. , ; ( )` and the quotation marks `« » “ ”`. The giver of the set is the author (this file). The set's file `organs/kin-telling-frames.json`
is hashed at the held-out addendum (section 9). A word outside it, or a set word outside a skeleton, is a failure.

**R4. Claims.** The composer may state only these claim kinds, each by its skeleton(s): REL (stated relation), REL-D (derived relation), WIT (the
text states a quotation), SEX, SURF (also written), GLOSS (English name), NONE (no derivation), MISS (the one missing fact; the giver that does
not state it is named: the text), MISS-SEX, MISS-OPEN, UNB (count of kin words with an unbound end), ABS (no being of the asked name).
A typed gap is composed as information: it names the missing fact (a relation term and a being) and the giver that does not state it. It never
says "cannot", never refuses, and never says the relation does not exist (the world is open: only that no giver states it).

**R5. The record builder.** For each question the builder produces a derivation record from the fold, without the extractor and without a model:
- `kin_of(X)` (T-KIN): for each lexicon atom (12 rows: relation, end, sex) the stated holders of the atom toward X, from `kin.facts` as janus
  `holders()` does for stated facts (a sex-bearing atom needs a sex fact for the holder, else that holder is a `no_sex_fact` gap); the most
  specific term that the facts license is stated; each atom with no holder is a typed gap with the slot janus `slotFor` gives; plus the count of `kin.unbound`.
  The derived-sibling rule is NOT applied here (it is a candidate, authored reading in janus).
- `term_of(X, uncle)` (C-UNCLE) and the battery: the recorded `derivation.byReferent[X][term]` cell (state, items with steps, gaps); an
  answered cell is composed from its steps, a gap cell from its gaps. `conditional` items (opinion-dependent) are NOT composed (they are not
  mechanical); the number skipped is reported.
- `identity(X)` (T-ID): X's surfaces, its English name row if any, its sex facts, the kin facts naming X, and the typed gaps of `kin_of(X)`.
- `absent(name)` (C-ABSENT): the asked name has no referent in `referents` (no surface of any referent contains it); the record is the absence.
- T-SPEECH: the fold types no speech relation, so no record exists: the composer returns the typed reason `no_record_for_question_kind`. These
  questions are OUT OF SCOPE of this cell and are counted as not composed.
- Question-kind recognition uses the question's `template` field, and the subject's referent id from the question; no list of names is read.

**R6. The names.** A being is named by its display surface (the fold's rule: the most written surface), copied from the first letter-bounded occurrence of
that surface in the text: the `ru` segment's address is that occurrence. The claim is about the SURFACE; that this occurrence is a mention of the same
being is the fold's claim, not the composer's. A being with no addressable display surface is a typed refusal (`name_not_addressable`).

**R7. English names.** A GLOSS sentence is composed only when ParallelNames has a row whose `forms` contain one of the being's surfaces and that
row has no `collidesWith`; it carries the row's standing (`candidate`). A being with no row gets no gloss sentence (a gap in the gloss giver, not a sentence).

**R8. Order and grouping.** Per question, one paragraph: REL and REL-D sentences, then WIT sentences (one per distinct witness span), then SEX,
SURF, GLOSS (identity), then NONE, MISS, MISS-SEX, MISS-OPEN, UNB. Terms inside one NONE or MISS sentence are listed in lexicon order, joined by
commas and `or`. Forms inside one SURF sentence are listed by number of writings, descending.

**R9. Variants and cadence.** Every claim kind has at least two skeletons. The composer takes the FIRST variant whose opening word differs from the
previous sentence's; otherwise the first variant (recorded as a style note, not a failure). A variant never changes the claim (tested: the checker's
parsed claim set is identical across forced variant choices).

**R10. Determinism and no model.** The composer reads only its inputs; it imports only `node:` built-ins; it does not read the clock, the random
source, the network, a child process or the environment. Two runs are byte-identical.

## 3. The checker (independent of the composer)

The checker is a separate module that does NOT import the composer. It receives the composed output (sentences as typed segments) and the RAW
sources (fold.json, text, lexicon, ParallelNames, questions.json) and decides each sentence by itself:
- **C1 typing.** Each segment is `frame` (every word in the closed set, file hash equal to the registered one) or a material kind with an address that
  it resolves itself: `ru` slices the pinned text (sha256 checked) and the whitespace-normalised bytes must equal the segment; `row` and `rec` resolve
  the JSON path in the file and the value must equal the segment; `ask` slices the question; `val` is recomputed. An unaddressed material segment, or a
  segment typed `self:model` (or any kind outside the list), fails the sentence.
- **C2 skeleton.** The joined text must equal the sentence text, and the frame texts between slots must match one skeleton of the checker's OWN table
  (it duplicates Appendix A; if the two tables disagree a sentence fails). This yields the claim and its slot fillers, parsed from the sentence, not read from any composer metadata.
- **C3 re-derivation.** The claim is re-derived from the RAW fold, not from the composer's record:
  REL: the `kin.facts` hold the parent_of (and sex) facts that license the term for exactly those two beings, with the giver and the standing the sentence shows;
  REL-D: the checker applies the lexicon composite rule to the facts itself and the pair must come out (steps shown must be facts of the fold);
  WIT: the quoted span is a witness of a fact of the fold that the same document states;
  SEX: a sex fact with that value and giver exists; standing shown equals the fact's;
  SURF: every form is a surface of that being in `referents`; GLOSS: the row exists in ParallelNames, has no `collidesWith`, and a surface of the being is in its `forms`;
  NONE: the checker evaluates the term over the facts and no pair results; MISS: no fact fills the slot (the checker searches `kin.facts`), and the relation term is the lexicon atom for that slot;
  MISS-SEX: no sex fact for the being; MISS-OPEN: no male sibling fact for the being; UNB: the count equals `len(kin.unbound)`; ABS: no surface of any referent equals the asked name (case-folded, whitespace-normalised) and the whole asked name does not occur as a letter-bounded string in the text (the checker's own search).
- **C4 support of witnesses.** A quoted witness must contain a surface of each end of the claim and a Russian kin word that the lexicon (`russian_forms`, `russian`) maps to an atom of the same relation (or, for a stated `term` fact, to that term); for a name-parts sex candidate, a token ending with one of the prior's patronymic suffixes.
- **C5 relevance.** Every claim about beings involves the question's subject (or is a WIT of a claim in the same paragraph); UNB is allowed only in a paragraph that has a MISS.
- **C6 laws.** First letter capital (or « ); ends with `.`; quotation marks balance; no sentence without a Russian-span address (a `ru` segment or the extent).
The checker also runs the same C1 to C6 on any text it is handed as a list of segments; plain English with no segments is a sentence with no address.

**Checker self-test (mutation kill).** For every composed sentence of the development window, the following mutants are made and each must be
rejected by the checker (mutants whose text equals the original are skipped as equivalent): M1 remove one material segment's address; M2 change one byte of a
`ru` segment; M3 replace a frame word by a word outside the set; M4 replace a kin term by another lexicon term; M5 swap the two `ru` segments of a
two-name sentence; M6 replace a quoted witness by another witness span of the fold; M7 add a sentence stating a fact absent from the fold; M8 retype one
segment as `self:model`; M9 delete the extent from an absence sentence. A checker that does not kill a mutant is a comment, not a check.

## 4. The arms and controls

- **P — the plain baseline.** The plain answerer's replies (fixed rules over the rendered window), one line per question. Scored by the same checker
  (a reply with no address strings has no addressed sentence), and by recall of expected items.
- **C — the composer.** Section 2, run directly, and also through penelope's `weave()` with `noModel: true` as an adapter object (each sentence a unit settled by the `autofill` field stage);
  the two paths must give byte-identical text.
- **S1 — shuffled ends.** The composer run on a record whose referent ids are deranged by a cyclic shift of the sorted id list, the shift being
  `1 + (sha256(window name + ":ends") mod (n-1))`; the derangement is used only if NO shuffled fact is a true fact of the fold (else the next shift).
- **S2 — shuffled witnesses.** The composer run on a record whose witness spans are deranged among the distinct witness spans of the facts (cyclic shift by one in sorted order; at least two distinct spans needed, else the control is reported as not constructible).
- Both controls are judged by the checker against the UNSHUFFLED fold.

## 5. The bars (decided now; each is mechanical; each is reported whichever way it falls)

Per window; the HELD-OUT decides; the development value is reported beside it. Thresholds come from the goal's own zero (no model-written sentence, no
unaddressed sentence) or from the null they name; none is tuned.

- **B0 No model.** Tripwire count of model-door fetches = 0; the node network/child-process entry points (fetch, http/https request, net connect, child_process spawn/exec) armed and fired 0 times; `gym/swatch.jsonl` byte-identical before and after; the composer's source imports only `node:` built-ins. Pass iff all.
- **B1 Every sentence addressed and clean.** Checker failures over all sentences of C = 0; share of sentences with at least one Russian-span address = 1.00; sentences typed `self:model` = 0.
- **B2 Answerable questions composed (in scope).** Of the answerable questions whose template is T-KIN or T-ID (the families with a recorded derivation), the share composed with every sentence passing the checker = 1.00. REPORTED beside it, with no bar: the share of ALL answerable questions of the window (the T-SPEECH questions are out of scope, so this is expected to be below 1.00; the number is the finding).
- **B3 Typed gaps composed as typed-gap sentences.** (a) Of the expected-gap questions (T-KIN with no kin fact, C-UNCLE, C-ABSENT), the share composed with at least one MISS, NONE or ABS sentence and NO REL, REL-D or SEX sentence = 1.00; (b) of the typed gaps recorded in `derivation.byReferent` (battery cells), the share whose slot is stated by a MISS, MISS-SEX or MISS-OPEN sentence that the checker re-derives = 1.00 and whose term is named by a NONE sentence = 1.00.
- **B4 Controls fail.** S1 and S2 each: checker failures ≥ 1, and the share of CHANGED fact-stating sentences (REL, REL-D, SEX, WIT whose text is not among the unshuffled composer's sentences for the same question) that the checker rejects = 1.00. A changed gap sentence (MISS, NONE) may remain a true absence, so it is counted and reported but not barred. A control with no changed fact-stating sentence on a window is reported as not constructible there, and is not a pass. A control that passes is a finding that the checker is not checking.
- **B5 Mutation kill.** Kill rate over all non-equivalent mutants (development window) = 1.00, and = 1.00 for each mutation operator.
- **B6 Determinism.** Two runs: sha256 of the output JSON equal, and of the rendered text equal.
- **B7 Recall beside the plain arm.** Over the answerable in-scope questions, recall of the expected items (kin `who`, identity `facts`, identity `spellings`; the `linked` names are excluded because they are untyped reading links, not a derivation): C ≥ P. The `linked` recall of P is reported separately.
- **B8 Variant invariance.** For every question, the parsed claim multiset is identical across (all-first-variant, all-second-variant, chosen) = 1.00.
- **B9 Weave path (development).** Through `weave({noModel:true})`, every unit settles at the `field` stage (0 `model-required`, 0 `mouth`), the tripwire counts 0, and the text is byte-identical to the direct path.
- **B10 Growth (development, synthetic).** On a synthetic fact base built with janus `deriveKin` over facts that the real fold lacks (a grandparent, an uncle with sex facts, a stated `term` fact), the unchanged composer composes every answered cell and every gap cell, and the checker passes all of it. Labelled synthetic; not part of the held-out score.

## 6. Procedure

1. Write the composer, the checker, the frame file and the runner in a fresh clone of penelope on branch `g1-3-composer` (cut from origin/main), behind an option (new files only; no existing behaviour edited).
2. Develop on the DEVELOPMENT window. Every change to a rule or to this table after this hash, made because of what a development run showed, is an AMENDMENT (hashed, reasoned) before the held-out run.
3. Before the held-out run: an ADDENDUM hashes the final composer, checker, frame file, runner, the two priors and the pinned fold/text hashes of both windows. The held-out is run ONCE from those files. A run that dies before printing a score for a cause outside the code (a missing path) may be repeated; any printed score counts.
4. The report prints, for every one of the 24 questions of each window, the composed English beside the plain baseline's reply, and separately the Russian addresses of each composed sentence.
5. Zero model calls in any step of this session.

## 7. What is not claimed

That the prose is translation or paraphrase (it is neither); that the English is fluent (it is a fixed frame set, deliberately stiff); that a quoted Russian
span is understood by a reader who cannot read Russian (they are told the claim by the frame and the lexicon term, and the address lets someone who can verify it);
that the composed claims are TRUE of the novel (the checker certifies that each claim is licensed by the recorded derivation, which is the fold's reading: a fold
error propagates; "lawful is not correct"); that the SURFACE address is a mention of the same being; that T-SPEECH is answered; that the English name of a being is its translation (a parallel-text candidate).
Two windows, one author, no accuracy against truth is claimed.

## Appendix A — the declared skeletons (the closed set is the words in the frame text below)

Slot kinds: `{ru}` Russian span, rendered «…»; `{quote}` a witness (Russian span), rendered «…»; `{term}` `{sex}` `{name}` row string, rendered bare;
`{giver}` `{standing}` record string, rendered bare; `{ask}` rendered «…»; `{val}` number; `{terms|or}` terms joined by `, ` and ` or `; `{forms|and}` ru spans joined by `, ` and ` and `.
`[ …]` is an optional clause present only when the standing is not `given`.

| claim | variant | skeleton |
|---|---|---|
| REL | 1 | `{ru} is the {term} of {ru}[ ({standing})].` |
| REL | 2 | `The text names {ru} as the {term} of {ru}[ ({standing})].` |
| REL-D | 1 | `{ru} is derived as the {term} of {ru} ({giver}, {standing}).` |
| REL-D | 2 | `The facts make {ru} the {term} of {ru} ({giver}, {standing}).` |
| WIT | 1 | `The text states {quote}.` |
| WIT | 2 | `The text reads {quote}.` |
| SEX | 1 | `{ru} is {sex} ({giver}, {standing}).` |
| SEX | 2 | `{giver} gives {ru} as {sex} ({standing}).` |
| SURF | 1 | `{ru} is also written {forms|and}.` |
| SURF | 2 | `The text also writes {ru} as {forms|and}.` |
| GLOSS | 1 | `{ru} is {name} in the aligned edition ({standing}).` |
| GLOSS | 2 | `The aligned edition gives {name} for {ru} ({standing}).` |
| NONE | 1 | `No {terms|or} of {ru} is derived.` |
| NONE | 2 | `The facts derive no {terms|or} of {ru}.` |
| MISS | 1 | `The text states no {terms|or} of {ru}.` |
| MISS | 2 | `No {terms|or} of {ru} is stated by the text.` |
| MISS-SEX | 1 | `The text states neither {sex} nor {sex} for {ru}.` |
| MISS-SEX | 2 | `Neither {sex} nor {sex} is stated for {ru} by the text.` |
| MISS-OPEN | 1 | `No {term} of {ru} is stated to be {sex}; absence is not asserted.` |
| UNB | 1 | `Kin words in the text with an unbound end: {val}.` |
| ABS | 1 | `The reading of the text has no being written {ask}.` |
| ABS | 2 | `No being written {ask} is in the reading of the text.` |

MISS, NONE, ABS and UNB carry the extent address `ru#0-N`.

Frame words (derived from the table, lower-case): absence, also, aligned, an, and, as, asserted, be, being, by, derive, derived, edition, end, facts, for, gives, has, in, is, kin, make, names, neither, no, nor, not, of, or, reading, reads, states, stated, text, the, to, unbound, with, words, written, writes.
