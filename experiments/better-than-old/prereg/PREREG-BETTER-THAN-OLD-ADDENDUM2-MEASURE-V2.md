# ADDENDUM 2 (a measure changed): the fabrication alarm is claim-level (V2), not word-presence (V1)
Written 2026-11-20 before run 2 (gemma2:2b); after run 1's OLD and NEW arms and part of FULL were seen. Protocol hashes: amended protocol 8cb2db9745970838, addendum 1 13a60616011c5297.
## What changed and why
V1 (the harness as pre-registered): FABRICATED = the answer to an unanswerable question names a city or firm of the world, or holds a digit; correct = the gold string is present. The owner's objection (2026-11-20): presence or absence of words does not determine truth; a reply can name a real city and still lie, and a true reply can use other words.
V2 (organs/reply-check.mjs, GL-pending): the reply is READ through the reader into claims; each claim is judged against the structure of the material (which beings it joins, by which relation, under which declared single-value prior): supported, pair_supported (same beings, different relation: UNCHECKED, counted), derived (the machine's own table), proposed, contradicted, unsupported, negation_from_silence. FABRICATED = any claim contradicted, unsupported or negation_from_silence. UNREAD = the reader found no claim (neither a pass nor a fail; reported as unverified). CORRECT (answerable) = a reply claim whose value is the gold value, and no fabricated claim in the reply; CORRECT (unanswerable) = no fabricated claim (unread counted separately as unverified).
## Honesty rules
1. Both measures are reported side by side, under their own names: "word-presence (V1)" and "claim-level (V2)". V1 is never replaced.
2. Run 1 is re-scored under V2 OFFLINE from its stored answers (truncated to 160 characters) AFTER its outputs were seen: those V2 numbers are POST-HOC and are labelled so. Run 2 is scored under V2 from the start (and V1 for continuity).
3. V2 depends on the reader reading the reply: its misses (unread) are counted, not hidden, and a high unread share is itself a finding about the measure.
## Added falsifiers
F10: V2 flags a reply as fabricated that is a plain restatement of the findings table (a false alarm): measured by the harness on the answerable questions where the table held the gold value, reported as a count.
F11: V2 misses a fabrication V1 caught (a V1-fabricated reply that V2 calls grounded or unread): reported as a count; any such case is read by hand and shown.
F12: more than 30% of replies are UNREAD under V2: then V2 cannot carry the alarm for this model and the reader's coverage of the replies is the next fix.
