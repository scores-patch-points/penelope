# Property constraints in the cube (draft 2, 2026-11-19)
Built in `property-constraints.eot` (checker: `node check_eot.mjs property-constraints.eot` PASS 10/10; `--negatives negatives.eot` PASS, two new refusals). Exercised by Janus in `janus/native/organs/constraints.js` (6 tests, 4 mutants killed).
**Checked against live Wikidata property pages** (26 properties, fetched with the owner's yes: `../../wikipedia/property-constraints.json`, EXPLORATORY, a sample of the properties we use, not all of Wikidata). 20 constraint types appeared. Counts over the 26: allowed-entity-types 26, property scope 26, allowed qualifiers 23, subject type 20, value-type 18, contemporary 17, conflicts-with 17, none-of 13, item-requires-statement 11, single-best-value 9, value-requires-statement 9, citation-needed 5, inverse 3, one-of 3, symmetric 3, range 2, required qualifier 2, difference-within-range 1, single-value 1, distinct-values 1. Draft 1 (from memory) missed two kinds that are common in the live data, **none-of** (13) and **single-best-value** (9, e.g. capital); both are now in the cube file. Kinds named here that the sample did not show: format, label language, multi-value (typed gap `constraint_unseen_in_sample`, not a refutation). Note that `single value` itself is rare on the live data (1 of 26) and `single-best-value` is the usual form, so a rigid `functional` is too strong for most real relations.

A constraint is the DECLARED nature of a relation, so it is DEF. Its grain says what it is about; its check is an EVA at the same grain, preceded by the act the constraint names; a failed check is a candidate difference.

| Grain / cell | Constraint (Wikidata name, from memory) | Check act | Failed check becomes | Our declare field |
|---|---|---|---|---|
| DEF Ground (Atmosphere, Clearing); EVA Ground | subject type, value type, allowed entity types, property scope | SEG a region of values | Resolution when one type contains the other | `containers` |
| DEF Figure (Lens, Dissecting); EVA Figure (Lens, Binding) | single value | SEG by subject | Conflict (two strong tied values); Resolution if nested | `functional` |
| | single best value (a ranked best; a second best is the Conflict), none of (a forbidden list) | SEG by subject | Conflict | |
| | format, range, one of, label language, difference within range | SEG | Accidental if inside the codec's invariances, else Conflict | codec invariances |
| | required qualifier, allowed qualifiers, citation required | SEG | Silence (absent) | |
| DEF Pattern (Paradigm, Unraveling); EVA Pattern (Paradigm, Tracing) | symmetric, inverse | CON forward, CON converse, SYN mirrored | Silence (converse absent) | `symmetric` |
| | distinct values (inverse-functional) | SEG by value | Conflict | |
| | multi-value, item requires statement, value requires statement | CON | Silence | |
| | conflicts with, contemporary | CON | Conflict | |
| (no Wikidata constraint) | acyclic | | Conflict (a cycle) | `acyclic` |

What the checker taught (both kept as negatives): a bond (CON) cannot read a rule declared later in the helix, so bonds are read as the facts have them and the rule enters at the EVA; and a DEF cannot read the verdict of its own EVA, so the failed check re-enters through a NUL that returns it (the helix wraps) before it is defined as a difference.

Container order and holons: the nested whole/part order of a holarchy is the `containers` order (Topeka in Kansas in the USA). A relation with no declared nesting has no Resolution kind, only Conflict or Silence. Pasted article (integrallife.com, holons) used only for this reading; nothing was taken from it as a claim.

Not built: extracting these rules from observed material (Janus's `nonsense.js` already induces asymmetric acts from agent/patient overlap; a single-value or symmetric extractor would need a seeded shuffle null and a frequency-band control, as `kind-induction.js` declares); Janus's `constraints.js` does not yet have single-best-value, none-of, contemporary or a temporal-order kind (the Janus session working on `constraints.js` owns that file now).
