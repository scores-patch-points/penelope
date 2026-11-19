# RESULT-CLAUSE-REFERENTS: can the lexical-analysis clause corpus be read at the referent level? (feasibility check before any kind induction; clause-referents.mjs; EXPLORATORY.)
Corpus: 3,590 English clauses (run_2026-03-19_144302) with Claude's three-question labels, five registers. Khora's cast (host reader, unprimed) run per register; referents with >= 2 mentions; a clause "has" a referent if it contains one of its alias surfaces.
Clauses with >= 1 named referent / with >= 2 (the minimum for a RELATION between referents):
- quantum physics (1,000): 19.7% / 2.9%   (56 referents: Bell, Schrodinger, Hamiltonian, GHZ, Gaussian, Neumann...)
- wisdom literature (595): 28.1% / 18.2%  (17: Yahweh, God, Satan, Lord, Almighty, Job, Sheol...)
- Greek philosophy (998): 44.2% / 18.7%   (94: Plato, Socrates-group merges such as "Cephalus Polemarchus Thrasymachus Socrates", "I Glaucon", Republic, God...)
- Taoist (498): 13.3% / 0.6%              (3: Tao, Great Tao, Hiding)
- Stoic (499): 23.0% / 8.0%               (29: Marcus Aurelius, Rome, Roman Empire, God...)
About 367 of 3,590 clauses (10%) contain two named referents. Pronoun mentions are detected in four registers (89-162 each) but are not bound to referents in these runs.
Reading: the corpus is about abstract things ("entangled states", "the phase", "the good", "the way"): NOUN-PHRASE referents, which khora's read does not produce (it names beings by their proper names; the coreference session confirms noun-phrase referents are not built and the binder's held-out rounds never passed cleanly). At the referent level the three-question labels cannot be tied to a relation between referents for ~90% of the clauses, so kind induction over referent relations on this corpus is NOT feasible with the current read. Running it on the 10% would give ~360 clauses dominated by names of gods and philosophers, in two registers: a different, small and biased test.
Also visible: name merging errors in the cast (a list of interlocutors fused into one referent; "I Glaucon").
Decision for the user: this blocks the referent-level typology on prose with abstract subjects until noun-phrase referents exist.
