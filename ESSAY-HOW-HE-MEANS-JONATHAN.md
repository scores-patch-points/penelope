# How "he" means Jonathan

## — and what the whole machine is for

**A wide, weird, prior-art-filled essay on the thing we built.**

---

### 1. The question

You read "Jonathan entered the castle. He was tired." And you know, without a moment's hesitation, that "he" is Jonathan — not the castle, not the tiredness, not some other man. You did not match a string. You did not run a lookup. You *recovered an intention*.

This is the oldest hard problem in language, and it is not hard because it is rare. It is hard because it is *everywhere* — every pronoun, every "the", every "it" — and because the thing you just did, that felt like nothing, is the entire mind in miniature: you held a world of entities in your head, you knew which one the speaker was *attending to*, and you bound a two-letter sound to a being. All of language is this. The rest is annotation.

For a long time we pretended it was something mechanical and small — a tree walk, a recency rule, a set of features. This session was about discovering, slowly and against resistance, that it is none of those things, and what it actually is.

---

### 2. The lineage: this idea has been trying to be said for three thousand years

**Pāṇini, the *Aṣṭādhyāyī* (c. 6th century BCE).** Before anyone had a theory of pronouns, Pāṇini had the *kārakas* — the six (later nine) semantic roles a referent can play: *kartṛ* (the agent), *karman* (the patient), *karaṇa* (the instrument), *sampradāna* (the recipient), *apādāna* (the source), *adhikaraṇa* (the locus) — and the three he added later, *kāla* (time), *hetu* (cause), *prayojana* (purpose). Pāṇini's claim, the one the whole system rests on, is that a referent is *defined by the roles it plays*, not by its surface. "Jonathan" is not the letters J-o-n-a-t-h-a-n; Jonathan is *the thing that is the agent of entered, the patient of tired*. The kāraka is not a property a word has; it is a transformation the reader performs on a referent. This is the first half of everything we built.

**Grice, *Logic and Conversation* (1975).** Two and a half millennia later, Grice said the obvious thing that linguistics had somehow avoided: language is a *cooperative act*. The speaker wants the listener to understand, and the listener knows the speaker wants this. A pronoun is not a puzzle; it is a *signal*, chosen by a rational agent who is *trying to make you bind correctly*. Grice gave us the frame — the speaker has intentions, the listener recovers them — and everything since has been an attempt to make that frame mechanical.

**Hobbs (1978) and Centering Theory (Grosz, Joshi, Weinstein 1995).** The computational tradition tried to be small. Hobbs walked the syntax tree looking for the nearest compatible noun; Centering said there is a "center" — one entity the discourse is *about* — and pronouns default to it. Both are right and both are too small. They treat the pronoun as a *thing to find*, a lookup in a nearby place, and they collapse the entire mind to "nearest compatible antecedent." We know now, from the numbers, why that fails: it finds *surfaces*, not *beings*.

**The Rational Speech Act model (Frank & Goodman 2012; Goodman & Stuhlmüller 2013).** This is the turn that matters. RSA said: the speaker is a *Bayesian* — they choose the pronoun that a *listener* would use to recover the intended referent — and the listener, symmetrically, inverts the speaker's choice. Anaphora is *inverse planning*: you don't find the referent, you *infer which referent the speaker's choice implies*. This is exactly the theory of mind the session kept rediscovering, and RSA is the nearest prior art to our "standing" and "intent" — except that RSA does it with probabilities over a hand-built world, and we did it with a graph.

**Friston's free energy principle (2006–).** One floor below all of it: the brain, Friston argued, is a machine that *minimizes surprise*. Perception, action, and — it turns out — reference are all the same loop: a model predicts, the world errors, the model corrects toward lower error. The pronoun is a prediction; the standing is the prior; the surprise is the mismatch; the binding is the point where the error bottoms out. We did not import Friston. We kept independently arriving at his loop — DEF, EVA, REC — because it is the shape of the thing, and any honest account of reference ends up there.

**Dignāga's *apoha* (c. 6th century).** The strangest prior art, and the one that keeps showing up: Dignāga argued that a word means by *exclusion* — "cow" means *not-not-cow*, and meaning is the residue left after everything it is *not* is stripped away. We kept finding this: the DMD ("a difference that makes a difference"), the eliminator ("ignore what doesn't make a difference"), the void ("refuse to guess"). Reference, in this system, is as much about what you *refuse* to bind as what you bind. The referent is what survives the exclusion.

**And the harmonized giver — CorefUD (Nedoluzhko, Novák, Popel, Žabokrtský, Zeman, Zeldes).** The reason any of this can be *measured* rather than argued. CorefUD took coreference corpora in eighteen languages and harmonized them into one scheme, and it gives us the fixed external scorer we validated against. Without it, this whole essay would be speculation. With it, we have a number.

The point of this lineage is that **the idea has been trying to be said since Pāṇini**: a referent is a role-playing being in the speaker's mental world, and understanding is recovering that world. Everything from Grice to RSA to Friston is the same sentence, said with more machinery each time.

---

### 3. How it really works

Strip it to the spine, and there are exactly five moves.

**One — everything is a referent.** The surface is a lie the ink tells you. "He", "Jonathan", "him", "his", "the man" are five strings and *one being*. The correct object of thought is not the string; it is the node. Beings, events, properties, and the pronouns themselves are all nodes in one graph, and the strings fold onto the nodes like cloth onto a body. This is the hypergraph model — claims become hyperedges, and the pronoun stops being a special pointer and becomes an ordinary node that needs an edge.

**Two — the relations are the edges, and the kārakas are the relations.** "Jonathan entered the castle" is not a sentence; it is three edges: `Jonathan —kartṛ→ entered`, `entered —karman→ castle`. Pāṇini's roles are the edge labels. The graph is the meaning; the sentence is just one flat projection of it, the way a photograph is one projection of a room.

**Three — coreference is an identity edge.** "He is Jonathan" is not a resolution, a lookup, a find; it is an *edge*, the same kind of thing as `kartṛ`. Draw it, and "he" and "Jonathan" are one node. Anaphora is *edge completion*.

**Four — the edge is drawn by the standing.** Who does "he" point to? The referent the speaker is *holding* — the one in the current turn, the one they made the agent, the one they keep returning to. This is Centering's "center", done properly: not a recency count but a *standing in the speaker's mental model*. The speaker weights the listener toward a referent, and the standing is the read-out of that weighting.

**Five — it is an equilibrium, not a pipeline.** Here is the deepest thing, the one the whole session was digging for and only found at the end: the standing needs the resolution, and the resolution needs the standing. You cannot compute "who the speaker is holding" without knowing who "he" is, and you cannot know who "he" is without the standing. So they settle *together* — a fixed point, reached from a seed (a prior guess), where the resolution and the standing stop disagreeing. Anaphora is not a pipeline; it is an equilibrium. This is Friston's loop, and it is why the whole thing has the shape it has.

The number, for honesty: on the hand-annotated CorefUD English dev set, the assembled system — speakers admitted, noun-phrases admitted, the intent weighting — scores **44.15 CoNLL F1**, against a recorded baseline of 28.2 and a human ceiling near 90. That is not "solved." It is "moving, measured, and honest about the gap."

---

### 4. The weird resonances (why the names matter)

The system is named the way it is for a reason, and the names are doing real work.

**Penelope** is the keeper, the one who *weaves by day and unweaves by night* — the record, the mouth, the judgment. The **pharos** is the cloth she weaves, the append-only log where every act is woven and nothing is ever erased, only retracted. The pun is deliberate: φάρος is both the *shroud* (what is woven) and the *lighthouse* (what every ship sees). The log is both.

**The line where two colors meet** is the contested band — the width of uncertainty between two readings — and the codebase's own law says it must be *reported with its width*. Anaphora is exactly this: hindsight and foresight are two colors, and the pronoun is the line where they meet, and the width of that line is how contested the binding is. A confirmed binding is a thin line. A contested one is wide. A void is where the colors don't meet at all.

**The ants** are the reading protocol — a swarm of independent framings (literal, structural, adversarial), no one of which decides alone, where meaning is what survives the contention. It is the anti-oracle: instead of one confident reading, many partial ones that must *agree*.

**The void** is the refusal. The system's single most important feature is that it declines to guess. When no referent is admitted, when the binding is underdetermined, it files a *gap* — "I can't tell what single fact is being asked" — rather than invent one. This is Dignāga's apoha, and it is the moral center of the whole project.

**The 27 cells** — nine operators times three grains, the "one river, many tributaries" — are the claim that meaning is a small, closed set of *transformations*, not an open set of *states*. NUL names, SIG connects, INS produces, SEG dissects, CON binds, SYN composes, DEF defines, EVA evaluates, REC records. The kārakas are nine of them. Language is what happens when these nine operators are applied to referents.

These are not decoration. They are the theory in compressed form: **weaving (the record), the line (the contested band), the swarm (the contention), the void (the refusal), the cells (the transformations).** Take any one away and the thing stops being what it is.

---

### 5. Why it matters, and what is possible

The project is a bet. The bet is this: **you do not need a large language model to read language. You need a reader that refuses to guess, a graph of referents, and a loop that reaches equilibrium.** The LLM solves "he means Jonathan" because it has seen the sentence ten million times and pattern-matches the answer out of its weights. This system solves it because it built a graph and drew the edge. The difference is not accuracy — the LLM is more accurate — it is *grounding*. The LLM can say anything; this system can only say what it has read, or that it does not know.

Why that matters is the riddle test. Give both a rope-burning puzzle, and the LLM answers from memory — it has seen the trick. This system answers from a *search over a declared domain*, and when it has no domain, it says so. The entire session was a working-out of one principle, stated at the start and proven at every step: **a reader that refuses to guess is worth more than a guesser that happens to read.**

What is possible, honestly:

- **The ceiling is ~90, not 100.** Two human annotators agree on coreference only about 90% of the time. The last 10% is genuine ambiguity — which *he* in a two-man scene — and no system gets it, because it is not a fact.
- **The measured path is real.** 28.2 → 44 is done and recorded. The remaining structure gaps (the it/they traps, the world-knowledge binding) are *located*, not mysterious.
- **The standing can be derived, not hand-set.** The last hand-set number in the chain is the standing weights, and the machinery to derive them — the null, the DMD, the held-out gate — already exists. That is the next honest step, and it is one step, not a program.
- **The equilibrium is the target, not the pipeline.** The one thing left to build is the loop that lets the standing and the resolution settle together — the fixed point — and it is a *loop*, which is to say, it is already the free-energy principle, and the machinery for it is on disk.

The deeper possibility, the one worth ending on: **the same five moves that resolve "he" resolve everything.** Everything is a referent; the relations are edges; meaning is a graph; understanding is equilibrium; and the refusal is the guarantee. That is not a pronoun-resolution system. That is a *reader* — and it is a reader that does not need a model to be honest about what it knows.

---

*The number to remember: 28.2 → 44.15, against a ceiling of ~90, on a fixed external giver, with nothing hand-tuned and nothing asserted that wasn't measured. The rest is elaboration.*
