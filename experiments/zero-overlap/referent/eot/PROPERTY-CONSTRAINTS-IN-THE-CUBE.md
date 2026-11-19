# Property constraints in the cube (draft 1, 2026-11-19)
Built in `property-constraints.eot` (checker: `node check_eot.mjs property-constraints.eot` PASS 10/10; `--negatives negatives.eot` PASS, two new refusals). Exercised by Janus in `janus/native/organs/constraints.js` (6 tests, 4 mutants killed).
**UNVERIFIED against a live Wikidata property page**: the constraint list is from memory; typed gap `constraints_not_fetched`. The fetch needs the owner's yes.

A constraint is the DECLARED nature of a relation, so it is DEF. Its grain says what it is about; its check is an EVA at the same grain, preceded by the act the constraint names; a failed check is a candidate difference.

| Grain / cell | Constraint (Wikidata name, from memory) | Check act | Failed check becomes | Our declare field |
|---|---|---|---|---|
| DEF Ground (Atmosphere, Clearing); EVA Ground | subject type, value type, allowed entity types, property scope | SEG a region of values | Resolution when one type contains the other | `containers` |
| DEF Figure (Lens, Dissecting); EVA Figure (Lens, Binding) | single value | SEG by subject | Conflict (two strong tied values); Resolution if nested | `functional` |
| | format, range, one of, label language, difference within range | SEG | Accidental if inside the codec's invariances, else Conflict | codec invariances |
| | required qualifier, allowed qualifiers, citation required | SEG | Silence (absent) | |
| DEF Pattern (Paradigm, Unraveling); EVA Pattern (Paradigm, Tracing) | symmetric, inverse | CON forward, CON converse, SYN mirrored | Silence (converse absent) | `symmetric` |
| | distinct values (inverse-functional) | SEG by value | Conflict | |
| | multi-value, item requires statement, value requires statement | CON | Silence | |
| | conflicts with, contemporary | CON | Conflict | |
| (no Wikidata constraint) | acyclic | | Conflict (a cycle) | `acyclic` |

What the checker taught (both kept as negatives): a bond (CON) cannot read a rule declared later in the helix, so bonds are read as the facts have them and the rule enters at the EVA; and a DEF cannot read the verdict of its own EVA, so the failed check re-enters through a NUL that returns it (the helix wraps) before it is defined as a difference.

Container order and holons: the nested whole/part order of a holarchy is the `containers` order (Topeka in Kansas in the USA). A relation with no declared nesting has no Resolution kind, only Conflict or Silence. Pasted article (integrallife.com, holons) used only for this reading; nothing was taken from it as a claim.

Not built: extracting these rules from observed material (Janus's `nonsense.js` already induces asymmetric acts from agent/patient overlap; a single-value or symmetric extractor would need a seeded shuffle null and a frequency-band control, as `kind-induction.js` declares); fetching the live constraints.
