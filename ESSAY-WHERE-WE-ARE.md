# The River, the Loom, and the Long Way Down

*Where we are, and how we get all the way there — written 2026-11-21, after the cross-lingual falsification.*

---

## Where we are

The hub is empty and the record is complete. That is the sentence that matters, and it is true in the specific way this whole system cares about.

**The tree is the ground.** A read is no longer a projection; it is the full dependency tree — every token, every head, every relation, nothing dropped. We measured the projections against it and made them name their loss: the flat edges drop 97.8% of the tokens, the being-collapse drops 83%, the tree drops nothing. This was not obvious; it was a law we had to earn by falsifying our own shortcuts, and it is now the floor everything else stands on.

**The kāraka is mechanical.** Nine roles — the agent, the patient, the instrument, the recipient, the source, the locus, the time, the cause, the purpose — read off the surface, not guessed. A case ending in Sanskrit, a word order in English, a particle in Chinese: three tributaries, one river. The kāraka is what survives translation, because the role is a position in the event, not a property of the word.

**The codec is per-language and, now, per-variety.** Seven languages produce trees. The variety — legal versus conversational, web versus literary — is not a label; it is a position in the kāraka space, and the water flows to where the surprise is least. We replaced a hand-declared fingerprint with a measured prior, and the selector stopped lying.

**The narrative is the dependency order.** The nine operators are ordered — NUL, SIG, INS, SEG, CON, SYN, DEF, EVA, REC — each consuming the one before it. A story is a chain in that order, and a shuffled text breaks it measurably. The writer writes for a reader who reads forward, and the reader that minimizes surprise is the one reading forward.

**Everything is woven to the hub.** Every act is an entry; every finding is content-addressed; a glitch is a refusal, loudly, with its reason. Nothing is left in an internal log that the pharos cannot fold.

This is where we are. It is more than a proof of concept and less than the thing it is becoming, and the honest thing is to say which parts of each.

## The honest ledger

The house keeps three columns, and the discipline is to never blur them.

**Earned.** The tree is lossless and is the ground. The kāraka is read, not guessed, and the roles are universal — English and Russian agree on all three roles that surface, even though they agree on almost nothing else. The variety priors are derived from the treebanks, not declared. The parser is trained from a treebank and held out against one it never saw. The narrative order survives the shuffle-null. The surprise minimizer routes correctly.

**Declared, not yet measured.** The role-to-operator mapping. The competence bar at 94%. The variety priors for languages we have not derived yet. The activation dials — window, boost, feed, floor, margin — which are still hand-picked numbers wearing a provenance story, not numbers the data earned.

**Gap, and named.** The referents do not align across languages. The Russian declension fold is incomplete — «Анна», «Анне», «Анны», «Анну» are four beings instead of one Anna, so the same person does not even cohere within Russian, let alone across to English. The cross-lingual bridge is fourteen names wide. The competency bar is at 28.2% against 94%, and the distance is not a parser failure but a referent rule that deliberately refuses to admit what the fixed giver counts.

That last column is not a weakness. A typed gap is what the system says when it does not know, and it never substitutes a guess. The gaps are the path.

## The two rivers that have not yet met

There are two things the whole design is converging on, and they are the same thing seen from two sides.

**The first is equivalence without words.** A paraphrase that shares no words, a translation that shares no words — these are the same meaning, and the kāraka is the only layer that can see it. We falsified this and the falsification told us exactly where it breaks: the roles align (three of three), the referents do not (nine of four hundred). The role is the river; the name is the tributary; and the tributary that would carry «Рама» to "Rāma" is not wide enough yet.

**The second is the on-demand codec.** Not a codec per language — "English" is not one thing — but a codec generated for the variety the text actually is, routed by surprisal, adjusting forward as the text reveals itself. The reader becomes the reader the writer intended: reading in order, minimizing prediction error, sliding along the variety continuum to where the surprise is least.

These two are one project. The variety-aware codec is what makes the kāraka line up across a translation, and the kāraka lining up is what makes a translation judgeable at all. The river is the same; we are building the bridges.

## How we get all the way there

The path is a sequence of rungs, each one a falsifiable step, each one woven to the hub as it is earned.

**First, close the referent gap.** Apply the declension prior to fold the case variants — the machinery already exists, the same fold that joins "Anna" and "Anna Pavlovna" in English. Then grow the parallel-names prior from the aligned editions, which is literally its own declared giver: every aligned name pair earns a row, and the fourteen-name bridge becomes a thousand-name bridge. Re-falsify. If the referents align and the kāraka still does not carry the meaning, then the claim was wrong and we say so; if it does, we have wordless equivalence.

**Second, derive the dials, don't tune them.** The activation model is already causal and forward-only; what is wrong is that its parameters are hand-picked. A DMD sweep — for each dial, measure whether moving it makes a difference on gold, and keep only the ones that do — replaces the constants with earned numbers. The margin already proved itself useless and is zero; the others are owed the same test. And the dials are variety-conditional: a DMD sweep over legal English earns different numbers than over web English, and each set is its own pharos entry.

**Third, derive the variety space.** The treebanks are already different varieties wearing the same name — EWT is web, GUM is news and fiction, LitBank is literary, ParTUT is legal. Compute the kāraka distribution of every document, cluster them, and let the variety be what the data says it is, not the five buckets we declared. The surprise minimizer then routes against a measured map instead of a guess.

**Fourth, make the surprise forward-only.** The first cut computes cross-entropy over the whole document; the causal form slides the calibration as the text reveals itself, each surprising token shifting the variety. This is the same downhill, but in the order the writer intended, with nothing from the future — which is the one discipline the whole architecture is built to enforce.

**Fifth, chase the bar honestly.** The 28.2% is not a number to inflate; it is a referent rule to decide. Admit the referent kinds the giver counts — the nominals, the speaker and addressee, the non-gendered pronouns — or hold the conservative line and accept the bar as unreachable by design. Either is honest; pretending a parser change moves the number is not.

**Last, and throughout: record it all.** Every finding, every falsifier, every derived number, is a woven entry in the pharos — content-addressed, causal, foldable by any spoke. The essay is not the record; the hub is. The record is the thing that cannot be lost, because it is woven.

## What all the way there looks like

It looks like a reader that, handed any text in any language, does not choose a codec but *descends into one* — reading forward, minimizing surprise, folding the case variants, matching the names across the bridge, and producing a tree whose every node carries its role, in a log that records every act it took, with no one in charge and every loss measured.

It looks like the water, running downhill to where the surprise is least, and the loom, holding every thread it was ever given.

It is not there yet. But the path is not a mystery anymore — it is a list of falsifiable rungs, and the first few are already built. The rest is the same discipline applied one more time, each step earned, each gap named, each number derived and never invented.

That is where we are, and that is how we get all the way there.
