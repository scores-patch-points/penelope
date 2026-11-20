# PREREG-STAGE2 — emergent classes connected to Thrax by HIS OWN CRITERIA (written 2026-11-20 BEFORE the run)

Stage 1 (PREREG.md, GL-EP-01) found pure but fragmented classes, and in Ancient Greek clusters split by case. Stage 2 asks whether Thrax's own criteria, applied to the EMERGENT clusters ALONE (token contexts and the token's own form; no tagger, no gold in the building), merge the fragments and nominate his closed classes. Gold (UD tags through khora `THRAX_MAP`) only SCORES. Split label: **EXPLORATORY** (English REUSED). Same data, split, seed and clustering method as stage 1, fixed at k = 64 (stage 1's grid cap, declared, not tuned).

The criteria, each from the Techne and each a behaviour of a cluster:
- **Noun and verb are DECLINED / CONJUGATED (case; tense, person, number).** Operational: two clusters belong to one family when their types are inflectional VARIANTS of one another: two forms are variants when they share a prefix of at least 4 characters covering at least 60% of the shorter form (declared before the run, form-level evidence on our own tokens, not a word list or a language pattern); the relation of clusters a, b is s(a,b) = the smaller of (the share of a's types with a variant in b) and (the share of b's types with a variant in a). Families are the union of clusters whose s exceeds the MAXIMUM of s over all cluster pairs in 20 permutations of the forms across types (cluster structure kept, string relation destroyed).
- **The preposition is placed before all the parts of speech.** Among CLOSED clusters, the one with the highest entropy of its RIGHT neighbour's family.
- **The article is placed before or after the noun's inflection.** The closed cluster with the highest chance that its left or right neighbour belongs to the largest family by types (the declined mass).
- **The conjunction binds the discourse.** The closed cluster with the highest chance that its left and right neighbours are in the same family (binds like with like).
- CLOSED is derived, not set: 2-means (one dimension, initialised at the extremes) on log(tokens per type) of the clusters; the high group is closed (few forms, much use). Nominations are made in the order preposition, article, conjunction, each excluding clusters already nominated.

Claims, each with its falsifier, every language separately:
- **S1 declension families.** The best family for gold noun, and for gold verb, has F1 against that class higher than the best single stage-1 cluster for it (recomputed on this clustering) AND higher than the maximum over the 20 permutation runs. Falsified otherwise: the merge by stems does not repair the fragmentation.
- **S2 nominated classes.** Each nominated cluster's purity for the class it was nominated as (the share of its in-scope types whose gold Thrax class equals it) ranks within the top 3 of all closed clusters. Falsified by a rank above 3: Thrax's criterion does not find that class in that language. Reported: the rank, the purity, and what the nominated cluster actually is.
- **S3 reported, not claimed.** What share of all tokens each family and nominated cluster covers.

Nothing here changes after the run except in an ERRATUM section below.
