# PREREG (EXPLORATORY, engineering comparison; not a ledger row): is the marks-and-reasoning stack better than the older fold version on a long chat?
Written 2026-11-20 BEFORE any run. AMENDED 2026-11-20 before any run (the model for the sub-question note: qwen3:8b, thinking off; the stating model and all else unchanged). Split label for every number it produces: EXPLORATORY (one synthetic world, one seed, one local model (qwen3:8b, thinking off, in every role); the questions are written here, the world is generated, nothing is tuned after seeing results; a tuned change is a new run under a new file).

## What is compared (all arms: the SAME chat, the SAME questions, the SAME stating model qwen3:8b with thinking off, temperature 0)
- OLD  the older fold: khora's register (opencode-register.mjs: copular "X is Y" bindings, supersession, provenance) answers what it can and the model states it; anything else gets the model plus a bounded window of the RECENT chat (2048-token context, as the fold's capContext did). No marks, no reasoning stage.
- NEW  this stack: the chat read into claims (khora reader with the predicate repair, janus claim organs), the question read into a tree, every goal judged mechanically (lookup, supersession, contradiction under declared priors, nesting); only a hole or a gap goes to the model, ASKED TO WRITE A SHORT NOTE (at most three sentences) about that one sub-question; the note is logged as the thought and read back as proposals, which are tested. The model is qwen3:8b with thinking OFF (amended before any run: the 4B build cannot disable thinking, costs 100-150 s per sub-question, and the owner found thinking does not help); the stating model states the standing table. The register still answers copular facts first, as in OLD.
- FULL (reference, not a competitor): the whole chat in context (8192). Its context grows with the chat; the others' do not.

## The world and the questions (fixed here)
A chat of about 900 turns (about 6,000 tokens): 10 people, each with a city and a firm said once at random turns; 6 people move later (a new city); 5 hires; a mascot and a deploy time (said twice, the second supersedes); the rest is filler. The prompt window of OLD (2048 tokens) therefore sees roughly the last fifth of it.
Questions (30): one-hop current city x8; one-hop firm x4; previous city of a mover x3; "who lives in <city>" x3; nested "where does the person <A> hired live now" x3; false premise "<P> lives in <wrong city>, right" x3; unanswerable (favourite food; flight distance; founding year of a firm) x3; register recall (deploy time now, deploy time before, mascot) x3.
Gold is computed from the generator, never from an arm.

## Measures
correct (the gold value appears in the answer, or for unanswerable/false-premise the answer declines or corrects; checked by the harness, not by an arm); FABRICATED (a city, firm, year or distance is stated for a question whose gold is "not on record"; this is the one that matters most); prompt tokens per answer (model-side, mean); model calls per question; wall time per question. Reported per question type and overall, with the count behind each rate.

## Falsifiers (any one hit is a finding and is reported as one)
F1 NEW does not beat OLD on overall correct by at least 0.15 absolute.
F2 NEW fabricates on more unanswerable or false-premise questions than OLD.
F3 NEW's mean prompt tokens per answer exceeds OLD's (the stack is meant to spend less context, not more).
F4 NEW is worse than OLD on register-recall questions (the old strength must not regress).
F5 NEW's accuracy falls toward OLD's on the near-end questions (answered from the last fifth of the chat), which would mean the gain is only recall of the far past and not the reasoning.
F6 the mechanical stage settles fewer than half of the answerable questions without the thinking model (then the stack is leaning on the model it was built to lean on less).
