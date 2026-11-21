# The Wheel, the Loom, the River, and the Long Way Down

*Where the machine is, how it reads, and how it gets all the way there — written 2026-11-21, after the EOT falsification finally passed.*

---

## I. The hub is the Void

Start with the thing most people get wrong, because the whole design hangs on it. The center of this system is a log, and the log is *empty of intention*. Its specification says it in the first breath: "the hub is nothing (the Void); pharos does not steer anyone."

The name is a pun with two faces, and both matter. φᾶρος is the cloth Penelope weaves by day and unweaves by night in the *Odyssey* — the record that is woven, and when retracted, never erased, only unravelled by a typed entry. Φάρος is the Alexandrian lighthouse — probably a different word, the specification admits, and so the pun is deliberate — the light every ship sees without any ship knowing another. One name, two roles: the **cloth** is the record; the **light** is the watching. `weave` is the cloth, `watch` is the light.

Every component of the system is a spoke on this wheel, and a spoke knows nothing but the hub. The khora — the perceiver, the ground-producer — reads and weaves. Penelope — the keeper, the mouth, the judgment — records and judges. Janus — the logos, the reasoner, the mark — measures. The surfaces — the fold among them — display. None of them calls another. None of them even *names* another. A spoke writes an entry; a spoke watches for entries of a kind; a spoke folds what is there. `by` — who wrote something — is provenance, never dispatch.

This is not an aesthetic choice. It is what makes the system *auditable*. A glitch cannot hide, because there is no place to hide it: every act is an entry, and the gate refuses an entry whose cell is not one of the twenty-seven, whose kind was never declared, or whose `of` points at a thing that does not exist. The wheel has no blind spokes, because the spokes do not interweave at all. They write to the same hub, and the hub refuses what does not fit.

The entry itself is a weft: `{cell, kind, addr, body, of, basis, seen, by, at, id}`. The `cell` is one of the twenty-seven. The `of` and `seen` are the **causal basis** — the entries this one consumed. Order is causal, not clock: A precedes B if A's id is in B's `seen`. The narrative of the whole system is that causal fold. A glitch is a refusal, loudly, with its reason — `KIND_CELL_MISMATCH`, `UNDECLARED_KIND`, `UNKNOWN_OF`, `UNKNOWN_CELL`. The four refusals we watched fire were not failures of the system; they were the system working, catching a blind interweave before it could corrupt the record.

This matters for one reason above all: the record is the thing that cannot be lost. Every finding, every falsifier, every derived number, is a content-addressed entry in the causal fold, foldable by any spoke, by cell and kind, never by author. The essay you are reading is not the record; the hub is.

## II. The tree is the ground

So: what does a read actually *produce*?

Not a vector. Not a set of keywords. Not even, chiefly, a graph. It produces a **tree** — every token, every head, every relation, nothing dropped.

For each sentence the parse folds into a tree: the predicate is the root; its arguments nest under their heads; their modifiers nest under them. Take the sentence that opens *War and Peace* — in English, "Genoa and Lucca are now just family estates of the Buonapartes." The tree says `estates` is the root; `Genoa` and `Lucca` are co-subjects, Lucca conjoined to Genoa; and `Buonapartes` is the genitive modifier, with `of` and `the` tucked under it. In Russian — the same sentence, «Генуя и Лукка стали не больше как поместья фамилии Буонапарте» — the tree says `стали` is the root, the names conjoin as subjects, and `Буонапарте` nests as an appositive under `фамилии`. Same structure, two scripts, one machinery.

This is where the project turned, and the law it now lives by: **the full dependency tree is the ground; every projection states its measured loss.** We measured it, because a projection you take on faith is a projection that will lie to you. The reader's own flat edges — span-extractions between capitalized nouns — drop 97.8% of the tokens and 98.9% of the dependencies. That is why, for a long while, the relations could not nest their arguments, and we had to take the projection's word for it. A being-collapse to "who does what to whom" drops 83%. Only the tree drops nothing. From now on a projection is honest only if it names, by number, what it discarded.

The tree is not a decoration. It is the floor everything else stands on. The kāraka rides on it, the discourse roles are read off it, the equivalence is judged against it. When a projection misleads, the tree is what corrects it. That is why the single most important thing built this whole session was not a model but a fold: `treeOf`, which turns flat parse rows into the nested structure and is verified lossless by round-tripping every token back out.

## III. The kāraka, actually

Let me stop invoking the kārakas and say what they are, because they are the spine and they deserve to be understood, not referenced.

Every sentence describes an *event* — something happens. The kārakas are the fixed set of roles a noun can play in that event. There are nine, and each is one question you can ask of the event: the **agent** (who did it), the **patient** (what was done to), the **instrument** (with what), the **recipient** (to whom), the **source** (from where), the **locus** (where), the **time** (when), the **cause** (why), the **purpose** (what for). Nine questions, nine roles. Pāṇini named the first six; the last three came later, and they are the ones the data turned up in Sanskrit but not in English.

Run one sentence down the whole list: *Rāma gave the book to Sītā in the courtyard yesterday, because of the festival, in order to read it.* The agent is Rāma; the patient is the book; the recipient is Sītā; the locus is the courtyard; the time is yesterday; the cause is the festival; the purpose is to read it. Nine questions, nine answers, and every sentence in every language is an assignment of these.

The thing that trips people up is that a kāraka is **not a property of the noun, and not the case ending.** It is the role the noun plays *in this particular event*. The same person plays every role in turn: *Rāma* eats (agent), Sītā loves *Rāma* (patient), the gift came *from Rāma* (source). Same person, three roles. The role is a position in the action, not a label on the person. That is why it survives translation: the agent is the agent no matter what language says it.

And the role is carried by the *surface*, differently in each language. Sanskrit marks it with a case ending — `rāmaḥ` (nominative) is the agent, `rāmam` (accusative) is the patient; the ending *is* the role. English marks it with word order — the agent before the verb, the patient after. Chinese marks it with a particle — 把 for the patient, 被 for the passive patient, 用 for the instrument. Same role, three tributaries, one river. The kāraka is the river; the case ending, the preposition, the particle are the tributaries that all carry it to the same mark. This is why the system can claim the kāraka is *read, not guessed*: you look at the surface, and the surface tells you the role.

## IV. Nine ways a thing can change

Every node in that tree carries a kāraka. And the nine kārakas are not a list; they are the Pattern grain's view of the nine *operators*, the closed algebra of transformations that underlies the whole system:

∅ **NUL** — annul, name, the clearing that opens a question.
○ **SIG** — signal, the mark that quotes what was found.
● **INS** — instantiate, bring a thing into being with an anchor.
｜ **SEG** — segment, cut a thing apart from what surrounds it.
⋈ **CON** — connect, bind two anchors by a typed relation.
△ **SYN** — synthesize, merge inputs into a whole.
⊢ **DEF** — define, set a value within the frame.
⊨ **EVA** — evaluate, test the particular against the general.
◉ **REC** — recontextualize, retrace the run inside a new open frame.

These nine are *dependency-ordered*: each consumes the output of the one before it. NUL constructs the ground; SEG splits the material; SIG discovers the signals; CON binds them into structures; EVA gates them against a null; DEF differentiates what survived; INS instantiates the members; SYN synthesizes the vocabulary; REC recognizes the rules the material taught. A pipeline that violates the order has not read.

The kāraka is what a referent *becomes* when one of these is applied to it: the agent is what NUL names, the patient what SIG signals, the instrument what INS instantiates, the recipient what SEG segments, the source what CON binds, the locus what SYN composes, the time what DEF defines, the cause what EVA evaluates, the purpose what REC records. The operator is what the reader *does*; the kāraka is what the word *becomes*. They are the same cell seen from two sides. And the cells are twenty-seven: nine operators crossed with three grains — Ground (the bare unit), Figure (the being), Pattern (the kind). Pāṇini read one grain; the other two are only now being named.

This is the whole taxonomy, and it recurs at every level. A word has a kāraka relative to its verb. A sentence has a discourse role relative to its paragraph. A paragraph has a section role relative to its document. Same nine operators, one level up each time. The recursion is the design.

## V. The reader reads in order

The writer intends for the reader to read in order. This is not a stylistic observation; it is the contract the whole machine is built to honor.

The writer writes "John walked in. Mary smiled. He..." knowing that the reader, moving forward, will have John "hot" from the previous sentence when the pronoun arrives. The reader does not have the future; it has only what has been read so far. So every mechanism that resolves anything must be **causal** — computed left to right, nothing from the future.

This is the discipline `memory/activation.js` states outright: "associative memory that reads left to right, what brings a prior passage to the surface when a new one arrives, computed with nothing from the future." It is the same discipline that closes the leak a whole-document table opens — a table that conditions every score on pages the reader has not reached. For a batch summariser that is merely a bit dishonest; for a reader it is fatal.

The pronoun resolver was built this way and then regressed from it. It binds "by activation, never by nearest name" — one-hop recall over the named referents, with two declared bars: an absolute floor (some real echo, not a rounding artefact) and a margin over the runner-up (a decision, not a coin flip). And the activation is *decayed presence*: window is recency, boost is the mention spike, feed is salience, floor is the minimum, margin is the decision gap. The dials are hand-picked today, and the honest next step is to derive them — but the *mechanism* is causal, forward-only, the reader reading in order, which is the only reader the writer wrote for.

## VI. Narrative is the dependency order

The hardest thing to get right, and the thing that kept slipping, was narrative — what makes "He spoke... He went up..." a *continuation* rather than two sentences that happen to share a pronoun. We falsified the wrong answer three times before finding the right one, and the falsifications are the point.

Byte-offset adjacency fails. Shuffle the sentences of a chapter and the coreference count barely moves, because the pronoun resolver is presence-based: it binds every pronoun to *some* being in the text, indifferent to order. The honest finding was that the reader's raw output *is* ordered — the cast carries byte addresses, the `seen` chain carries causality — but none of the derived signals used that order. We had built a bag of features and called it a reading.

The order that matters is the dependency order of the nine operators. A narrative is a chain in that order: a sentence introduces a being (NUL), the next elaborates it (SIG), a later one concludes (REC). Shuffle the sentences and the chain breaks — and that *does* show: the dependency inversions rise, measurably. Forty-five inversions in the real chapter, fifty-one in the shuffle. Narrative order is the operator dependency order, which janus tracks, which is the same thing as the causal fold of the pharos. The wheel's causal order *is* the story.

## VII. Discourse, two levels deep

A sentence's functional role in its paragraph is two complementary layers, both mechanical.

**Intra-sentence**, the clause relation: the root is the main claim; an adverbial clause is a premise or a time; a complement clause is an elaboration; an open complement is a means; a relative clause is a frame; a coordinate is a parallel. These are read from the parse's own clause relations, not from any regex over the words. The explicit connective — "therefore," "for example" — turned out to be nearly absent in real prose; the relations are carried by structure, not by markers, which is why a marker-based reader scored a hundred percent on hand-written sentences and four percent on Tolstoy.

**Inter-sentence**, the given/new: does the sentence continue a being from the one before it, or introduce a new one. This is coreference, and it is the reader's own cast that supplies it — not a hand-rolled lemma overlap, which is what a hasty first attempt built and a shuffle-null promptly falsified.

The two levels do not need to agree, and that is the finding: clause relation is intra-sentence structure, coreference is inter-sentence structure, and they are complementary. Together they cover seventy percent of the chapter's sentences. And the whole thing is one taxonomy recurring — the same nine operators, one level up each time, from word to sentence to paragraph to document.

## VIII. The river and the tributaries

The kāraka map is a declaration: the same nine roles, carried by different surface forms in different languages. This is the "one river, many tributaries" law, and this session made it *measurable* instead of metaphorical.

The parser is per-language — trained from a treebank, held out against one it never saw. Seven languages now produce full trees: English, Russian, French, German, Spanish, Sanskrit, Ancient Greek. Eighty more parsers sit on disk, findable once the codec path was pointed at the real priors instead of an English-only stand-in. Adding a language is a mechanical act: download its treebank, train the tokenizer and the parser, and the same machinery reads it.

And the forgetting that had to be corrected twice — first the morphology "gap" that was a false alarm (UD languages lemmatize via their model's own lexicon, not a hand-built prior), then the Russian parser that was missing only because the priors lived in a place the codec did not look — is itself the lesson. The priors are the memory of the system, and a prior that exists but is not *worked* is a prior that does not exist. The declension prior folds «Анна», «Анне», «Анны», «Анну» back to one Anna; the parallel-names prior carries «Анна» across to "Anna"; the hyperlexicon folds the aliases. The bridge is fourteen names wide today, and the honest next step is to grow it from the aligned editions, which is literally its own declared giver.

## IX. The variety is a position, not a label

"English" is not one thing. It is a family: Old, Middle, Modern (period) × legal, scientific, literary, conversational (genre) × British, American, Indian (region). The kāraka distribution proved this before we formalized it — legal English is locus-heavy, conversational is agent-heavy, scientific is instrument-heavy. Reading all of them with one frozen parser is the category error this whole thread has been chasing.

So the variety is a **position in the kāraka space**, not a bucket. And the codec should be generated for the variety the text actually is, not selected for the language. The mechanism is **surprise minimization**: the water flows to where the surprise is least. A text's kāraka distribution is read against each variety's prior, and the variety that makes the text *least* surprising — the lowest cross-entropy — is the one it is. A legal text read by legal dials stays predictable; the same text read by conversational dials throws off high surprisal at every "whereas", every "hereby".

This is the free-energy principle applied to the codec, and it is DMD in disguise. "Minimize surprise" is the continuous form of "difference that makes a difference." A dial is kept only if moving it lowers the prediction error; a variety boundary exists only where the kāraka distribution actually changes the surprisal. The priors must be *derived*, not declared: we derived `eng:web` from UD_English-EWT's own gold and `eng:legal` from the UDHR parsed, and the selector stopped misrouting. The hand-declared priors that were wrong were removed — a typed gap, never a guess.

## X. The on-demand codec

Put the last three sections together and the shape of the machine emerges.

The codec is **generated on demand for the variety**, not the language. "English" stops being one codec and becomes a continuum of codecs indexed by kāraka distribution. The reader does not choose a codec; it *descends into one* — reading forward, minimizing surprise, sliding along the variety continuum to where the prediction error is least.

The chicken-and-egg — you need the codec to read to get the kārakas, but you need the kārakas to know the variety — dissolves because you don't detect the variety first. You let the surprise be the signal, forward-only: read, and where the surprise spikes, the water is in the wrong tributary; shift the calibration toward the one that lowers it. The codec settles into the variety that minimizes surprise, which *is* the variety, by definition.

This is the "static codecs, competency only" rule made concrete. The dependency grammar — the parser — stays frozen. What varies with the variety is the *competency*: the priors, the kāraka expectations, the dials. And each variety's calibration card is a woven pharos entry, content-addressed, so the fold holds the whole riverbed and the reading is the water's path through it.

## XI. The equivalence at the EOT layer

And now the thing this whole session was reaching for: equivalence without words.

A paraphrase that shares no words, a translation that shares no words — these are the same meaning, and the kāraka is the only layer that can see it. We falsified this repeatedly, and each falsification moved the layer down until it landed.

The kāraka *distribution* failed — it is coarse and genre-like, and Russian attests five roles where English attests three, so even a translation diverges. The tree *shapes* barely passed — exact match is too fine, and a non-literal translation produces different trees. Then the user said the thing that unlocked it: **flow it all the way down to EOT.**

The EOT meaning layer is the river. Every dependency relation maps to a **cube cell** — one of the twenty-seven, the language-independent address of the relation. Two translations converge on the same cells in the same proportions, with every lemma and name abstracted away. Measured: War and Peace chapter one, English versus Russian, symmetric KL distance **0.0125**; versus an unrelated English business text, **0.1506**. The translation is twelve times closer.

That is the answer, and it is beautiful in its economy. The words are tributaries; the names are tributaries; the kāraka roles are tributaries. The *cells* are the river — the language-independent structure the meaning actually lives in. A translation does not reproduce the words; it reproduces the shape, and the shape is the cells.

And the referents — "Rāma" and «Рама» — merge not by surface match but by *judgment*. We declare they are the same referent, the way the equivalence judge declares a rung of a ladder. The prior carries the name across the bridge; the declension folds the case variants; and once the referents merge, the shapes align. The referent is the river; the name is the tributary; and the bridge is the missing tributary we are still building.

## XII. What penelope can do now

Penelope is the keeper, the mouth, the judgment. And it now has three things it lacked.

**First, a wordless rung in the ladder.** The equivalence ladder — referent, fact, kāraka, phasepost, variety — can now actually judge at the kāraka rung and below it, at the EOT cell rung, because the cells are computed on every token of the lossless tree. "Same up to the cell structure" is a real verdict, not a gap.

**Second, falsifiable equivalence on translations.** Two texts with zero shared words can be compared and the verdict recorded with a falsifier, because the comparison is on cells, not words. The twelve-times-closer number is the kind of thing the record can hold and re-check.

**Third, the anchor the ledger said was unsolved.** The zero-overlap rows that returned "gap" — no number, no name, no area — can now be re-judged against the cell structure instead of a surface anchor. The anchor was missing because it was the wrong layer; it was at EOT all along.

The honest limits remain, and they are named. The KL distance is on cell *distributions*, not the full arc graph — which arcs attach to which — and that is the next, stronger test. The two texts are a translation of the same scene, so the convergence is expected; a paraphrase within one language, and a same-genre unrelated control, are the falsifiers still owed. And the referent bridge is fourteen names wide, not the fifty the chapter holds.

## XIII. The honest ledger

The house keeps three columns, and the discipline is to never blur them.

**Earned.** The tree is lossless and is the ground. The kāraka is read, not guessed, and the roles are universal. The narrative order survives the shuffle-null. The variety priors are derived from the treebanks. The parser is trained and held out. The EOT cell equivalence is measured at twelve times closer than unrelated. Seven languages produce trees.

**Declared, not yet measured.** The role-to-operator mapping. The competence bar at ninety-four percent. The activation dials — window, boost, feed, floor, margin — still hand-picked numbers wearing a provenance story. The variety priors for languages we have not derived yet. The arc-graph comparison, which would be stronger than the cell distribution.

**Gap, and named.** The referents do not yet fully align across languages — the declension fold is partial, the parallel-names prior is fourteen names. The competency bar sits at 28.2 percent against 94. The forward-only surprise routing is built as a whole-document cross-entropy, not the incremental slide it should be. The other two grains' semantic roles are named but not read.

A typed gap is what the system says when it does not know, and it never substitutes a guess. The gaps are the path.

## XIV. How we get all the way there

The path is a sequence of rungs, each falsifiable, each woven to the hub as it is earned.

**Close the referent gap.** Fold the declension fully — the machinery exists, the same fold that joins "Anna" and "Anna Pavlovna" in English — and grow the parallel-names prior from the aligned editions, fourteen names to a thousand. Re-falsify: if the referents align and the cells still do not carry the meaning, the claim was wrong and we say so; if they do, we have wordless equivalence.

**Derive the dials, don't tune them.** The activation model is already causal and forward-only; what is wrong is that its parameters are hand-picked. A DMD sweep — for each dial, measure whether moving it makes a difference on gold, and keep only the ones that do — replaces the constants with earned numbers. The margin already proved itself useless and is zero; the others are owed the same test. And the dials are variety-conditional: a sweep over legal English earns different numbers than over web English, and each set is its own pharos entry.

**Derive the variety space.** The treebanks are already different varieties wearing the same name — EWT is web, GUM is news and fiction, LitBank is literary, ParTUT is legal. Compute the kāraka distribution of every document, cluster them, and let the variety be what the data says it is, not the buckets we declared. The surprise minimizer then routes against a measured map instead of a guess.

**Make the surprise forward-only.** The first cut computes cross-entropy over the whole document; the causal form slides the calibration as the text reveals itself, each surprising token shifting the variety. The same downhill, but in the order the writer intended.

**Chase the bar honestly.** The 28.2 percent is not a number to inflate; it is a referent rule to decide. Admit the referent kinds the giver counts — the nominals, the speaker and addressee, the non-gendered pronouns — or hold the conservative line and accept the bar as unreachable by design. Either is honest; pretending a parser change moves the number is not.

**Strengthen the equivalence.** From the cell distribution to the arc graph — the same cells in the same relations — and from a translation to a same-genre unrelated control, to prove it is meaning and not genre. The twelve-times-closer is the first proof, not the last.

**Last, and throughout: record it all.** Every finding, every falsifier, every derived number, is a woven entry in the pharos — content-addressed, causal, foldable by any spoke. The essay is not the record; the hub is. The record is the thing that cannot be lost, because it is woven.

## XV. What all the way there looks like

It looks like a reader that, handed any text in any language, does not choose a codec but *descends into one* — reading forward, minimizing surprise, folding the case variants, matching the names across the bridge, and producing a tree whose every node carries its role, in a log that records every act it took, with no one in charge and every loss measured.

It looks like the water, running downhill to where the surprise is least, and the loom, holding every thread it was ever given.

It looks like two texts that share not one word, judged the same because their cells are the same, by a judge that names the rung and the falsifier, on a record that cannot be lost.

It is not there yet. But the path is not a mystery anymore. It is a list of falsifiable rungs, and the first few are already built — the tree, the kāraka, the cells, the river. The rest is the same discipline applied one more time: each step earned, each gap named, each number derived and never invented, each finding woven and never only told.

That is where we are, and that is how we get all the way there.
