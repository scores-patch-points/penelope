# How the linguistic parsing actually works now

*Written 2026-11-21, after the Russian chapter finally parsed. This is the record of the machinery as it stands, stated honestly — what is earned, what is declared, and what is a typed gap.*

---

## 1. There is one door, and the hub is empty

The system has no orchestrator. The center is **pharos** — a log, and nothing else. Its own specification says it plainly: "the hub is nothing (the Void); pharos does not steer anyone." Every component — the khora that reads, penelope that records and judges, janus that measures, the surfaces that display — is a *spoke*. A spoke knows pharos and nothing else: it weaves entries, watches for entries, folds what is there. No spoke names another spoke; `by` is provenance, never dispatch.

Every act is a weft entry: `{cell, kind, addr, body, of, basis, seen}`. The `cell` is one of the twenty-seven (nine operators × three grains). The `of` and `seen` fields are the **causal basis** — the entries this one consumed. Order is causal, not clock: A precedes B if A's id is in B's `seen`. The narrative of the whole system is that causal fold.

This matters because it makes the whole thing *auditable*. A glitch cannot hide: the gate refuses an entry whose cell is not one of the twenty-seven, whose kind is undeclared, or whose `of` points at nothing. There is no blind interweaving, because there is no interweaving at all — only spokes writing to the same empty hub, and the hub refusing what does not fit.

## 2. A read is a tree, not a projection

The one door is `reading-one.mjs#read`. It takes a document and returns a `WeftEntry@4` whose real payload is the **dependency tree** — every token, every head, every relation, nothing dropped.

For each sentence the parse folds into a tree: the predicate is the root; its arguments nest under their heads; their modifiers nest under them. Nothing is lost. In "Genoa and Lucca are family estates of the Buonapartes," the tree says `estates` is the root, `Genoa` and `Lucca` are co-subjects (Lucca conjoined to Genoa, both agents), and `Buonapartes` is the genitive modifier with `of` and `the` tucked under it. That is the structure, and it is the parse that gives it.

This is the law the whole project turned on: **the full dependency tree is the ground; every projection states its measured loss.** We measured it. The reader's own flat `edges` — span-extractions between capitalized nouns — drop 97.8% of the tokens and 98.9% of the dependencies, which is why they could never nest arguments. A being-collapse to "who does what to whom" drops 83%. Only the tree drops nothing. A projection is honest only if it names what it discarded.

## 3. The semantics ride the tree as the kāraka

Every token in that tree carries a **kāraka** — one of nine semantic roles from Pāṇini: the agent, the patient, the instrument, the recipient, the source, the locus, the time, the cause, the purpose. The role is not guessed; it is read mechanically from the surface: case endings in a Pattern language, particles in a Ground language, the dependency relation in a Figure language. The kāraka is what the referent *becomes* when the transformation is applied to it; the nine roles are nine of the twenty-seven cells, the Pattern grain's view of the nine operators.

This is the part that has been done without any embedding, and it is worth saying why. **Structure is mechanical.** A preposition, a case ending, a subject position — these are visible, and a rule reads them. An embedding is a noisy guess at the same thing; the ablation told us the phasepost signal is *distributed* across three thousand dimensions, so no vector isolates it. Where a parse exists, the parse wins. The embedding earns its place only where the parse stops: the ~80 languages with no parser, and the cross-lingual fact that a kāraka is partially the same thing across languages.

## 4. Narrative order is dependency order, not adjacency

The hardest thing to get right, and the thing that kept slipping, was *narrative* — what makes "He spoke... He went up..." a continuation. We falsified the wrong answer three times before finding the right one.

Byte-offset adjacency fails: shuffle the sentences and the coreference count barely moves, because the pronoun resolver binds every pronoun to *some* being in the text, presence-based, indifferent to order. The honest finding is that the reader's raw output *is* ordered — the `cast` carries byte addresses, the `seen` chain carries causality — but none of our *derived* signals used the order.

The order that matters is the **dependency order** of the nine operators: NUL, SIG, INS, SEG, CON, SYN, DEF, EVA, REC. Each consumes the output of the one before it. A narrative is a chain in that order — a sentence introduces a being (NUL), the next elaborates it (SIG), a later one concludes (REC). Shuffle the sentences and the chain breaks, and that *does* show: the dependency inversions rise. Narrative order is the operator dependency order, which janus tracks, which is the same thing as the causal fold of pharos.

## 5. Discourse has two levels, both mechanical

A sentence's functional role in its paragraph is two complementary layers. **Intra-sentence**, the clause relation: the root is the main claim, an adverbial clause is a premise or a time, a complement clause is an elaboration, an open complement is a means, a relative clause is a frame, a coordinate is a parallel. Read directly from the parse's clause relations, not from any regex over the words. **Inter-sentence**, the given/new: does the sentence continue a being from the one before it, or introduce a new one. The explicit discourse marker — "therefore," "for example" — turned out to be nearly absent in real prose; the relations are carried by structure, not by connectives.

And the whole stack is one taxonomy recurring at every level: a word has a kāraka relative to its verb, a sentence a discourse role relative to its paragraph, a paragraph a section role relative to its document. Same nine operators, one level up each time.

## 6. What a language costs to join

English parses because a UD treebank taught the parser. Greek, Sanskrit, and Mandarin already had parsers. Russian did not — and for a while we forgot that Russian reads through the *case-marked* relation reader, its declension and role priors living in the real janus, not the English-only stand-in. The forgetting was the regression; the fix was to remember, and then to actually earn the tree.

So we downloaded UD_Russian-GSD, trained the tokenizer and the parser, and Russian now produces the same tree as English — 163 sentences, every word in place, held out at 83.1 UAS. The same machinery, one more language. The gaps that remain are named, not hidden: no morphology prior (verbs match exactly), no pronoun register (no pronoun is bound), no dotted-word prior. A typed gap is what the system says when it does not know; it never substitutes a guess.

## 7. What is actually true, and what is not

The honest list.

**Earned:** the tree is lossless and is the ground. The kāraka is read, not guessed. The discourse roles are read from clause relations. Narrative order is the dependency chain, falsified and survived. The flat projections are lossy and now say so by number.

**Declared, not yet measured:** the role-to-operator mapping, the variety fingerprints, the cell assignment conventions. These are stated as hypotheses with falsifiers, not as findings.

**Open:** the relation extractor is still conservative — the discourse layer is richer than the relation layer. The declension fold for Russian does not yet join its case variants into one being. The embedding is a fallback and a cross-lingual bridge, not a structure-builder, and should stay in that lane.

What the system is, at bottom: a way to turn a sentence into a tree whose every node carries its role, in a log that records every act it took, with no one in charge and every loss measured. That is not an aspirational design. That is what runs now.
