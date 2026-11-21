# The Wheel, the Loom, and the Nine Ways a Thing Can Change

*How the linguistic parsing actually works now — the prior art, the machinery, and what it unlocks. Written 2026-11-21, after the Russian chapter parsed.*

---

## The hub is the Void

Start with the thing most people get wrong, because the whole design hangs on it. The center of this system is a log, and the log is *empty of intention*. Its own specification says it in the first breath: "the hub is nothing (the Void); pharos does not steer anyone."

The name is a pun with two faces, and both matter. φᾶρος is the cloth Penelope weaves by day and unweaves by night in the *Odyssey* — the record that is woven and, when retracted, never erased, only unravelled by a typed entry. Φάρος is the Alexandrian lighthouse — probably a different word, the specification admits, and so the pun is deliberate — the light every ship sees without any ship knowing another. One name, two roles: the **cloth** is the record; the **light** is the watching. `weave` is the cloth, `watch` is the light.

Every component of the system is a spoke on this wheel, and a spoke knows nothing but the hub. The khora — the perceiver, the ground-producer — reads and weaves. Penelope — the keeper, the mouth, the judgment — records and judges. Janus — the logos, the reasoner, the mark — measures. The surfaces — the fold among them — display. None of them calls another. None of them even *names* another. A spoke writes an entry; a spoke watches for entries of a kind; a spoke folds what is there. `by` — who wrote something — is provenance, never dispatch.

This is not an aesthetic choice. It is what makes the system *auditable*. A glitch cannot hide, because there is no place to hide it: every act is an entry, and the gate refuses an entry whose cell is not one of the twenty-seven, whose kind was never declared, or whose `of` points at a thing that does not exist. The wheel has no blind spokes because the spokes do not interweave at all. They write to the same hub, and the hub refuses what does not fit.

## The prior art we stand on, and the one we argue with

The oldest prior art is the one we lean on hardest. **Pāṇini**, in the *Aṣṭādhyāyī*, around the fifth century before the common era, worked out that a noun does not carry a single role but one of a small closed set of roles — the *kārakas*: the agent, the patient, the instrument, the recipient, the source, the locus, the time, the cause, the purpose. Six he named; the data gives us three more. That idea — a *semantic role carried by the surface form* — is the spine of everything here. It is older than the parts of speech. **Dionysius Thrax**, centuries later, named eight parts of speech, and those are the ones the West kept; the kāraka map sits deliberately *upstream* of Thrax, because the parts of speech are surface forms and the kārakas are what the surface forms are *for*. A language can name the same role with a case ending, a particle, or a word order, and it is the role that travels.

The parsing stands on the modern dependency tradition: **Universal Dependencies** for the annotation and the framework, the **Zhang & Nivre** transition parser with its **Goldberg & Nivre** dynamic oracle — the averaged perceptron over arc-eager transitions, the Chu-Liu-Edmonds maximum spanning tree for the free-word-order languages that a left-to-right walk cannot reach. We did not invent any of that. We bolted the kārakas onto it.

And there is a prior art we *argue with*, not inherit. The last forty years of NLP ran toward the embedding — the vector that means by proximity. The temptation, every time a role needed reading, was to reach for the model. We did, once, and it taught us the right lesson. We ran an ablation over the twenty-seven cells and found that the phasepost signal is *distributed* across three thousand dimensions: the top ten dimensions explain 2.7% of the variance. No vector isolates a role, because no single dimension carries one. Structure is mechanical, and an embedding is a noisy guess at it. The embedding earns its keep only where the parse stops — the eighty languages with no treebank, and the cross-lingual fact that a kāraka is partially the same thing in Sanskrit and in English. Everywhere a parse exists, the parse wins. The essay's quiet thesis is that the last forty years overpaid for the vector and underpriced the tree.

## The tree is the ground

So: what does a read actually *produce*?

Not a vector. Not a set of keywords. Not even, chiefly, a graph. It produces a **tree** — every token, every head, every relation, nothing dropped.

For each sentence the parse folds into a tree: the predicate is the root; its arguments nest under their heads; their modifiers nest under them. Take the sentence that opens *War and Peace* — in English, "Genoa and Lucca are now just family estates of the Buonapartes." The tree says `estates` is the root; `Genoa` and `Lucca` are co-subjects, Lucca conjoined to Genoa; and `Buonapartes` is the genitive modifier, with `of` and `the` tucked under it. That is the structure, and it is the parse that gives it. In Russian — the same sentence, «Генуя и Лукка стали не больше как поместья фамилии Буонапарте» — the tree says `стали` is the root, the four names conjoin as subjects, and `Буонапарте` nests as an appositive under `фамилии`. Same structure, two scripts, one machinery.

This is where the project turned, and the law it now lives by: **the full dependency tree is the ground; every projection states its measured loss.** We measured it, because a projection you take on faith is a projection that will lie to you. The reader's own flat edges — span-extractions between capitalized nouns — drop 97.8% of the tokens and 98.9% of the dependencies. That is why, for a while, the relations could not nest their arguments, and we had to take the projection's word for it. A being-collapse to "who does what to whom" drops 83%. Only the tree drops nothing. From now on a projection is honest only if it names, by number, what it discarded.

## The kārakas, actually

Let me stop invoking the kārakas and say what they are, because they are the spine and they deserve to be understood, not referenced.

Every sentence describes an *event* — something happens. The kārakas are the fixed set of roles a noun can play in that event. There are nine, and each is one question you can ask of the event:

| role | question | what it is |
|---|---|---|
| **kartṛ** | who did it? | the **agent** |
| **karman** | what was done to? | the **patient** |
| **karaṇa** | with what? | the **instrument** |
| **sampradāna** | to whom? | the **recipient** |
| **apādāna** | from where? | the **source** |
| **adhikaraṇa** | where? | the **locus** |
| **kāla** | when? | the **time** |
| **hetu** | why? | the **cause** |
| **prayojana** | what for? | the **purpose** |

Run one sentence down the whole list: *Rāma gave the book to Sītā in the courtyard yesterday, because of the festival, in order to read it.* The agent is Rāma (kartṛ); the patient is the book (karman); the recipient is Sītā (sampradāna); the locus is the courtyard (adhikaraṇa); the time is yesterday (kāla); the cause is the festival (hetu); the purpose is to read it (prayojana). The instrument and the source are absent here but present in *Rāma opened the door with a key* (karaṇa, the key) and *Rāma came from the village* (apādāna, the village). Nine questions, nine roles. Pāṇini named the first six; the last three — time, cause, purpose — came later, and they are the ones the data turned up in Sanskrit but not in English.

The thing that trips people up is that a kāraka is **not a property of the noun, and not the case ending.** It is the role the noun plays *in this particular event*. The same person plays every role in turn: *Rāma* eats (agent), Sītā loves *Rāma* (patient), the gift came *from Rāma* (source). Same person, three roles. The role is a position in the action, not a label on the person. That is why it survives translation: the agent is the agent no matter what language says it.

And the role is carried by the *surface*, differently in each language. Sanskrit marks it with a case ending — `rāmaḥ` (nominative) is the agent, `rāmam` (accusative) is the patient; the ending *is* the role. English marks it with word order — the agent before the verb, the patient after. Chinese marks it with a particle — 把 for the patient, 被 for the passive patient, 用 for the instrument. Same role, three tributaries, one river. The kāraka is the river; the case ending, the preposition, the particle are the tributaries that all carry it to the same mark. This is why the system can claim the kāraka is *read, not guessed*: you look at the surface, and the surface tells you the role.

Why it is the spine, in two moves. **Equivalence** first: two sentences mean the same thing when the same referents play the same roles. *Rāma gives the book to Sītā* and its Russian, Chinese, and Greek translations have the *same* kārakas — same agent, same patient, same recipient — even though every word differs. "Same meaning" becomes a comparison of kārakas, not of words, and that is the equivalence judge's entire basis. **The operator** second: each kāraka is one of the nine operators seen from the word's side. The operator is what the reader *does*; the kāraka is what the word *becomes*. NUL names the agent into being → kartṛ. SIG signals the patient → karman. INS instantiates the instrument → karaṇa. SEG cuts out the recipient → sampradāna. CON binds the source → apādāna. SYN composes the locus → adhikaraṇa. DEF defines the time → kāla. EVA evaluates the cause → hetu. REC records the purpose → prayojana. Same nine, one level of abstraction apart.

## Nine ways a thing can change

Every node in that tree carries a **kāraka** — one of the nine. And the nine are not a list; they are the Pattern grain's view of the nine *operators*, the closed algebra of transformations that underlies the whole system:

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

## Narrative is the dependency order

The hardest thing to get right, and the thing that kept slipping, was narrative — what makes "He spoke... He went up..." a *continuation* rather than two sentences that happen to share a pronoun. We falsified the wrong answer three times before finding the right one, and the falsifications are the point.

Byte-offset adjacency fails. Shuffle the sentences of a chapter and the coreference count barely moves, because the pronoun resolver is presence-based: it binds every pronoun to *some* being in the text, indifferent to order. The honest finding was that the reader's raw output *is* ordered — the cast carries byte addresses, the `seen` chain carries causality — but none of our derived signals used that order. We had built a bag of features and called it a reading.

The order that matters is the dependency order of the nine operators. A narrative is a chain in that order: a sentence introduces a being (NUL), the next elaborates it (SIG), a later one concludes (REC). Shuffle the sentences and the chain breaks — and that *does* show: the dependency inversions rise, measurably. Narrative order is the operator dependency order, which janus tracks, which is the same thing as the causal fold of the pharos. The wheel's causal order *is* the story.

## Discourse, two levels deep, same nine operators

A sentence's functional role in its paragraph is two complementary layers, both mechanical.

**Intra-sentence**, the clause relation: the root is the main claim; an adverbial clause is a premise or a time; a complement clause is an elaboration; an open complement is a means; a relative clause is a frame; a coordinate is a parallel. These are read from the parse's own clause relations, not from any regex over the words. The explicit connective — "therefore," "for example" — turned out to be nearly absent in real prose; the relations are carried by structure, not by markers, which is why a marker-based reader scored a hundred percent on hand-written sentences and four percent on Tolstoy.

**Inter-sentence**, the given/new: does the sentence continue a being from the one before it, or introduce a new one. This is coreference, and it is the reader's own cast that supplies it — not a hand-rolled lemma overlap, which is what a hasty first attempt built and a shuffle-null promptly falsified.

And the whole thing is one taxonomy recurring at every level. A word has a kāraka relative to its verb. A sentence has a discourse role relative to its paragraph. A paragraph has a section role relative to its document. Same nine operators, one level up each time. The recursion is the design.

## What it costs a language to join

The system reads a language in one of two ways. If a Universal Dependencies treebank exists, the parser is trained and the tree is full. English had one from the start. Greek, Sanskrit, Mandarin already had parsers. Russian did not — and for a while we forgot that Russian reads through the *case-marked* relation reader, its declension and role priors living in the real janus, not the English-only stand-in the workspace pointed at. The forgetting was the regression; the fix was to remember, and then to actually earn the tree.

So we downloaded UD_Russian-GSD, trained the tokenizer and the parser from its 3,850 sentences, and Russian now produces the same tree as English — every word in place, held out at 83.1 UAS. The gaps that remain are named, not hidden: no morphology prior, so verbs match exactly; no pronoun register, so no pronoun is bound; no dotted-word prior. A typed gap is what the system says when it does not know. It never substitutes a guess. That is the difference between a reading and a hallucination, and it is non-negotiable.

## What this unlocks

Strip away the names and ask what a thing like this is *for*.

It unlocks **a meaning graph that does not lie.** From the tree you can fold a graph of beings and their relations — who does what to whom — and every edge is addressable back to the words that earned it, and every node carries its role. The graph is not the primary object; it is a projection of the tree, and because the tree is the ground, the projection's loss is a number you can state.

It unlocks **equivalence that is falsifiable.** Two sentences are the same when the same referents play the same roles. The judge never says "same" bare; it says "same up to this rung," and the ladder of rungs — referent, fact, kāraka, phasepost, variety — is declared and tightened one step at a time. A claim of sameness that cannot name its rung is refused.

It unlocks **genre from the distribution.** Legal prose piles up the locus; conversation piles up the agent; science piles up the instrument. The kāraka distribution *is* the fingerprint, and it identifies a text's variety mechanically — legal at 0.998, conversational at 0.952 — without a model having to be told what it is reading.

It unlocks **self-emergence.** Because no spoke orchestrates another, the system scales the way an ant colony scales — each worker writes to the shared environment, and the behavior is what the environment accumulates. Stigmergy, in the termite sense: the structure is in the marks, not in a foreman.

It unlocks **the audit trail.** Every act is an entry, and the entry is content-addressed. A glitch is a refused entry, loudly, with its reason. Nothing done off the record, nothing silent.

And it unlocks, most quietly, **a science of reading.** Every claim in this essay carries a falsifier. The tree is the ground because we measured the loss of every projection. Narrative is the dependency order because the adjacency theory failed three shuffle-nulls first. The kāraka is mechanical because the embedding ablation showed the vector cannot do the job. What the system is, at bottom, is a way to turn a sentence into a tree whose every node carries its role, in a log that records every act it took, with no one in charge and every loss measured.

That is not an aspirational design. That is what runs now.

---

## The honest ledger

**Earned.** The tree is lossless and is the ground. The kāraka is read, not guessed. Discourse roles are read from clause relations. Narrative order is the dependency chain, falsified and survived. Projections state their loss by number. Russian parses.

**Declared, not yet measured.** The role-to-operator mapping. The variety fingerprints. The cell assignment conventions. Each is stated with a falsifier beside it, not as a finding.

**Open.** The relation extractor is conservative — the discourse layer is richer than the relation layer. The Russian declension fold does not yet join its case variants into one being. The embedding is a fallback and a cross-lingual bridge, and should stay in that lane. The other twenty-four grains' worth of semantic roles — the Ground and Figure faces of the nine operators — are named but not yet read.

**The standing rule, once more.** A finding at an earlier cell is a constraint on every later one. The tree is an earlier cell than the graph, the graph than the judgment, the judgment than the record. What the tree establishes, nothing downstream may contradict. That is what a dependency order means, as against a sequence of steps — and it is the whole discipline, in one sentence.
