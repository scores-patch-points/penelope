# The same, for someone
### An essay on one question asked at every level: is this a difference that makes a difference?
Written 2026-11-19. It is an essay, not a result. Numbers carry their ledger row and split label. Where I rely on memory for prior art and have not checked a source in this project, I say so.

## 1. What we are trying to do
Ask "where did a person talk about the captain?" and a search engine finds the passages that contain the word *captain*. It misses the one that says "the old man gripped the rail" and the one that says "he would not turn the ship". A language model is good at exactly this: it reads "the old man" and knows who is meant. But once the text goes into the model, the exact words are gone. It can paraphrase; it cannot point to the bytes, prove they were there, or be checked.

We want the combination. Find the passage by what it refers to, not by which letters it uses, and give back the exact words with a permanent address: a byte span and a hash of exactly those bytes, which re-open to the verbatim text or refuse if anything has drifted. An embedder may help by nominating passages that feel close. It is never the judge.

That is the small goal. The larger one is that it turns out to be one question. Whether two strings are the same file, whether two regions are the same image, whether two sentences contradict, whether two mentions are one being, whether a new reading of a document has changed what we knew, whether our own theory has been broken by a result: each is the question *does this difference make a difference?* And a difference makes a difference only **to someone**, up to **a size**, **looking as far as they need to look**. So the question has three parts we must declare before we answer: who is asking, how small a difference matters to them, and how far the answer depends on things further out. The rest of the project is about answering it honestly, and refusing to answer when we cannot.

## 2. Why the obvious answers fail
We measured this, so I can be plain about it.
- **String search is blind to the unnamed.** Name search finds 0.94 of the passages that say the name and none of the ones that don't (row 30, FRESH).
- **Similarity is blind to what matters.** An embedder does reach passages that share no word with the name: its top 10 holds 0.276 of them where chance gives 0.064, and a control that is handed a different target's name finds 0.038 (row 30, FRESH). So similarity is a real nominator. But it keeps a planted contradiction, with negation flipped, a year changed or two names swapped, as the nearest neighbour of its original in 1,717 of 1,718 cases (row 31, DEV, exploratory). "The council approved it" and "the council did not approve it" sit side by side. Closeness is not sameness.
- **Surface facts are forgeable.** An impostor who writes the asker's facts at the front of its own text is judged equivalent every time for birth and death (row 27, REUSED, 1.000). A test that an impostor can pass is not a test.
- **A model gives up the bytes.** It can say "yes, the same", but it cannot say where, and no one can check.

So the design is a division of labour. Something nominates. Something else, which can fail, licenses. The default is that two things differ ("Other"); sameness is earned; when we cannot tell the answer is "Hold", not a vote. The nominator may be a vector, a string, a recency chain or a person's hunch. Nothing it says counts as evidence.

## 3. Prior art
Nothing here is new in pieces. I list what each piece rests on, and flag memory.

**The question itself.** Bateson put it as "a difference which makes a difference" (1972, from memory; khora's holograph document cites it as the cut: show a line only until one more line changes nothing). Our own organs already apply it: a fold stops at the shallowest depth where dropping everything beyond changes no conclusion.

**Deciding same, different, or unknown.** Fellegi and Sunter (1969, from memory) built record linkage on exactly this shape: weight each agreement by how rare it is, use an upper and a lower threshold, and send the middle band to a human. Our Same, Other and Hold are theirs in different dress. Rough sets and three-way decisions (Pawlak; Yao, from memory) give "noncommitment" a cost and define indiscernibility relative to a chosen set of attributes, which is our difference *at a tolerance*. What they leave open, and we do not, is who declares the attributes and the tolerance: for us it is the asker, named and bylined, before any reading.

**Identity.** Geach argued that "same" is relative to a kind (from memory). Guarino and Welty's OntoClean separates what is rigid about a thing from what changes. The sameAs literature warns that a few percent to a fifth of links in the wild are wrong, and that chains of plausible merges collapse distinct things (from the search summaries; I did not open the sources). We took the warning: our merge closure is order-dependent in a naive form (235 of 300 random synthetic graphs, row 32, exploratory), so the rule is to hold any component that contains a forbidden pair.

**The holograph and the address.** Gabor's holography, Pribram's holonomic memory, Kanerva's sparse distributed memory and Plate's holographic reduced representations all let a fragment stand for a whole by superposition. Khora's document takes the shape and rejects the mechanism: it recovers exactly from an address, not approximately from a blend. Content addressing, Bush's memex and Nelson's transclusion are the other ancestors: inclusion by reference, with the address being the hash of what it names. Koestler's holon is the nesting.

**Claims and contradiction.** A claim is a figure against a ground with a relation between them (Talmy), its roles named and not ordered by the language (Dowty's proto-roles). Tense is anaphora, pointing back at an established reference time (Partee). Two sentences contradict only if they describe the same event, which is why contradiction detection needs event coreference first (de Marneffe, Rafferty and Manning, 2008, from memory). Our own result is the empirical form: a naive year-and-polarity check fired on true same-referent pairs (16 of 24 with years on both sides, row 31, DEV, exploratory), because two sentences about one person are usually about different events. Precedence among conflicting norms is Kelsen's, as khora's reasoning lint has it.

**Many materials.** Chomsky's posture, as khora's Isthmus charter states it, is that deep structure is shared and each language is a projection; so every material crosses at one narrow place, decoded by its own codec into the same meaning layer. We have extended "codec" past language to images and audio.

**Standings, not booleans.** Janus's text finder returns one of seven standings built from "is", "is not" and "cannot be said", the saptabhangi of the Jain tradition, because "the same in this respect, different in that one" is an honest answer.

What I cannot claim is that the combination is new. Standpoint declared first, a birth address that survives change, verbatim re-opening, default Other, and one question at every level: I found no single source that does all of it, but I searched little, and I would not call it novel yet.

## 4. Newton
The first lemma of the *Principia* says, in effect, that quantities that approach each other more closely than any difference you can name become ultimately equal. Newton did not say how to build that rigorously: in a forum thread the owner shared, one commenter quotes the lemma and another notes that he cared more about using calculus for physics than about proving it. That is exactly our situation, and it is not an insult: the asker's concern comes first. If you are computing orbits, two quantities whose difference is below what the orbit can feel are the same quantity.

Our tolerance ladder is Newton's approach made explicit: tighten what counts as mattering step by step, and the impostors fall out first; what is left standing at the finest step is the thing. What Newton gives us is the right attitude to the limit. We never arrive at identity. We approach it, and we say how far we went.

## 5. Leibniz
Leibniz gives us three things, and one refusal.

**Identity of indiscernibles.** Two things with all the same properties are one thing. This is the principle our whole criterion leans on. But Leibniz meant *all* properties. Our observables are finite. So when two things are indiscernible on everything we can observe, the honest answer is not "same". It is "held: indiscernible on every observable". Khora's identity experiments found this directly: in a world too poor to tell things apart, merging is wrong. We keep the refusal Leibniz did not need.

**The law of continuity.** What holds for the finite holds in the limit. Our ladder is monotone by construction, a verdict once reached at a tolerance stays for every looser one, and what is empirical is how pairs spread over the levels. (One commenter in the thread I was shown credited Leibniz with the transfer principle. That is Robinson's, in the 1960s; the near relative in Leibniz is the law of continuity.)

**Monads.** Each monad mirrors the whole universe from its own point of view, with its own clarity, and no two are alike. Their faint perceptions, the *petites perceptions*, fall below the threshold of notice. They are differences that make no difference, and the universe is in the monad only as far as it rises above the asker's tolerance. The drive from one perception to the next is what we call REC: revising the frame when the evaluation breaks it. And monads are windowless, so what we share must be shared through a common order. For us that order is the log, and where Leibniz *assumed* his harmony was pre-established, we have to test ours. An informed impostor who writes the same facts forges every surface channel, so a shared record is not enough to make sameness.

**The refusal.** Leibniz said monads do not interact. Askers do. Two askers may disagree about one pair, and the honest system returns both answers, each stamped with who asked.

## 6. The crisis and the fix
Bishop Berkeley called the vanishing quantities "ghosts of departed quantities", and he was right that "ultimately equal" was not yet a definition. The repair took a century: Cauchy's limits, then Weierstrass's epsilon and delta. The trick was to fix the order of the quantifiers. You do not say "the difference vanishes". You say *for any tolerance you name, here is a bound that guarantees it*. The tolerance comes first, and a certificate answers it.

We took that order. The asker declares the tolerance first. The certificate is the **hunger list**: the facts we would have to fetch to decide the pair at that tolerance. A passage is licensed only with its certificate, and a pair we cannot certify is Hold, with the list of what is missing. Calling something equal "at the finest level of a finite ladder" is not the same as for every tolerance, so every verdict says which tolerance it stands at and why.

## 7. One question at every level
Khora's reference says the nine operators, in helix order, NUL SIG INS SEG CON SYN DEF EVA REC, cover every transformation that can happen to data, in three triads: existence, structure, interpretation. Each acts on three grains: ground, figure, pattern. Penelope's own earlier laws describe a pipeline as a helix whose last stage feeds the first of the next turn. Whatever one makes of the strongest form of that claim (it rests on a closure result over relational algebra, which is an expressiveness result and not a proof that meaning is derivable), it gives a discipline: declare what you hold (DEF), test it (EVA), revise the frame when the test breaks it (REC), at whatever scale you are working.

Read that way, the project is one act repeated at rising abstraction.
| level | the thing compared | "a difference that makes a difference" means | the piece that answers |
|---|---|---|---|
| bytes | two spans | the hashes differ | the address, re-opened or refused |
| a region of a medium | two images, two audio ranges | a change outside the codec's declared invariances | the codec's accidental set |
| a claim | two sentences | a witnessed change of polarity, role or value, inside one ground | the lint over claims, at overlapping grounds |
| a being | two mentions | a discernment, or agreement not explained by chance | the identity warrant: different, same, or unjudged with a hunger list |
| a standpoint | two askers | a difference that lands inside the asker's region of the cube | the contract, as an exact list of cells |
| a reading | a text and its next reading | a revision, with the sentence whose arrival changed it | the reading timeline |
| a theory | a law and a result | a falsifier firing | the ledger, the pre-registration, the checker |
The last row is not decoration. The same discipline is applied to us. The checker runs an EVA over our own primitives, and a hostile review ran one over our theory, and it found real defects (the first scoring of the retrieval test was void because I had taken link offsets before converting entities; I had cited a ledger row wrongly). A system that asks "does this difference make a difference?" of everything, and exempts its own theory, is not asking it.

## 8. What we have actually shown
This is the part to be strict about.
- **Established (our own results):** the embedder nominates and does not decide (rows 30 and 31); verbatim addresses re-open (82,221 of 82,221, row 30, FRESH) and refuse drift; a lint over decoded claims caught planted negation in every catchable case, with only about half of clauses yielding a catchable claim (row 33, DEV, exploratory); a fresh read re-births every id (0 of 850 survived a longer read, row 34, DEV, exploratory), so birth belongs to the log, not the reader; a three-list contract cannot express most standpoints exactly (row 36, geometry only).
- **Failed:** the strength license did not discriminate (the control survived, row 31); a two-sided Fellegi-Sunter weight helped a little and not enough (AUC 0.655, row 32); the naive difference check on words was unsound.
- **Constructed, not measured:** the primitives of the theory built in EOT from the nine operators, a chain of 16 assemblies the checker passes from a named floor, with eleven of our earlier hypotheses corrected by doing it.
- **Open:** the reader. It does not hand us complete claims for most passages, and without them the verdict is Hold. That is where the end-to-end test is aimed, with its go/no-go written first.

## 9. Why this might be the culmination, and how it could fail
The threads we have followed for months turn out to be one thread. The holograph says every part carries a way back to the whole. The Isthmus says everything crosses at one narrow place. Identity by consequence says two things are one if folding on either makes the same difference to the ground. The asker criterion says whose ground. SIG, surf and sniff say what may suggest and what may decide. The cube says what kind of act each is. And Newton and Leibniz, three centuries ago, were working on the same problem in the same words: when is a difference small enough not to matter, and what do you owe when you say it?

If that is right, what we are building is something like a **calculus of sameness**: differences as the small quantities, sameness as what remains when they are below the asker's tolerance, a certificate for every limit we claim, and a revision rule for the day the frame itself breaks. I would not say more than "may be" until the end-to-end test is in. It can fail in at least three ways, and I want them written down:
1. **The reader cannot supply claims.** Then the verdict is Hold almost everywhere, and the honest product is smaller: nominate, return the exact words with proof, veto where a saturated claim exists, and say "cannot tell".
2. **The question is not uniform across levels.** If some level needs machinery that is not "declare, test, revise" with a tolerance and a certificate, the unifying claim is false at that level, and we should say which.
3. **The cube becomes a notation.** If any event can be assigned to some cell, nothing is tested. The missing check is the shelved blind-agreement study on cell assignment. Until it runs, "derivable from the operators" means "typed, with a checker and a named floor", not "explained".

## 10. An ending
In the *Odyssey*, the queen does not need a cleverer stranger. She needs a better test: one that asks what mattered to her and cannot be passed by looking the part. Her cloth is woven by day and unwoven by night, and what makes the weaving honest is that unweaving is allowed only as a recorded act, never an erasure. We have written the test down: equivalence is someone's, bounded by what matters to them, it follows what depends on what, and it says "I cannot tell" when it cannot. We have not yet shown it finds the old man when the text only says *he*. That is a smaller and more exact problem than the one we started with, and it comes with a test that can fail.
