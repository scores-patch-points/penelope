# The same-versus-other pipeline, on the pharos (draft 1, 2026-11-19)
How a person does it, and who writes what. No repo imports another; every stage reads entries and writes entries.

| Step a person takes | Writer | Entry it leaves (kind, cell) | Status |
|---|---|---|---|
| Attention: something seems to be about the same thing (a pointer, no judgement) | an embedder (nominates only) | SIG marks / `pair-question` DEF·Figure | retrieval nominates (FRESH results); the SIG-mark writer for pairs is not built |
| Read each into a situation: who did what to whom, where, when, whether it was denied | khora (the reader) | `text-reading` INS·Figure (UD rows with dependency relations) | exists in the contract; khora does not yet write it to the pharos (checked: no pharos use in its tracked code) |
| Make claims with roles, polarity, ground, time (incl. the oblique "against Serbs") | janus | `claim` DEF·Pattern, `bond` CON·Figure, `ground`/`holds_in` (janus `claims-from-rows.mjs` + `claim-links.mjs`) | built, tested on hand-built rows; real khora rows not yet |
| Link and reason: does the record cohere (one value, converse present, no cycle, containment) | janus | EVA findings by cell (`constraint-eoql.mjs`: Conflict / Silence / Resolution) | built over claim-links, 23 mutants killed; findings are returned, not yet woven as entries |
| Answer the asker's probes from each side | janus | `probe-answer` INS·Figure (`probe-answers.mjs`) | built; this was the missing writer |
| Does the difference make a difference to THIS question | penelope | `perspective` DEF·Ground, `equivalence-verdict` EVA·Figure (`organs/perspective-eva.mjs`, `gym/perspective-run.mjs`) | built (GL-PE-01/02) |

SMOKE, run once by hand (EXPLORATORY; hand-built dependency rows for two tiny "documents"; probe power is a labelled STAND-IN, not measured): janus wrote `probe-answer` entries for two pairs into one pharos log and penelope's runner read them by kind and wrote the verdicts.
Pair 1: "Ann is 30" on both sides, a different winner name per side: `equivalent` (the age probe answered and agreed; the winner probe is SILENT because per-document referents have no licensed bridge). Pair 2: 30 against 31: `different`. The silent probe is the honest part: two documents' referents are never called the same by string equality.

THE GAP THAT MATTERS: the licensed bridge between two documents' referents (is "Bell" in one text the "Black Jack" in the other?). Everything above works around it. It is Janus's linking job (identity, the wormhole, the foresight gate is one attempt at it) and it must be licensed against a null, never by strings. Until it exists, a referent-valued probe stays silent and the verdict can only rest on literal probes.
Not done: khora writing readings to the pharos; a pre-registered fresh-set test; measured probe power (a ledger row); embedder-nominated pairs entering the log; findings woven as entries; pronoun coreference (typed gap `unbound_pronoun`).
