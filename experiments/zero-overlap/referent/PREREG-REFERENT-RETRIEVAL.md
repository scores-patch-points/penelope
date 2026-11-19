# PREREG-REFERENT-RETRIEVAL (filed 2026-11-19, before any article is fetched)

Question: can a machine find the passages of ONE document that are about a referent, including passages that never say its name, and hand back each passage as exact bytes with a permanent address that re-opens and refuses on drift?

## Gold (never an input at run time)
English Wikipedia wikitext (action=query, prop=revisions, main slot). Prose only: templates, tables, references, files, lists, headings, comments are removed first, so every gold link sits in running text. `[[Target|anchor]]` says the anchor text refers to Target. Targets are normalised (underscores, `#section` dropped = not an entity, redirects resolved by the API). The document is the plain text left after stripping; a PASSAGE is a sentence of it (regex split with guards for initials and common abbreviations; fixed in `lib.py` before scoring).
- Query = a referent = a Target. Its NAME = the title without a trailing parenthesis. The query handed to every sense is the NAME string and the plain text; nothing else.
- Eligible query: Target linked at least 2 times in the document's prose, name at least 3 characters, not a number or year, not a Wikipedia namespace. At most 25 queries per document: most anchors first, then title order.
- Gold passages for a query = sentences holding one of its anchors.
- Anchor type: SAME (the normalised name appears in the normalised anchor), PARTIAL (shares a non-stopword token, not SAME), DIFFERENT (shares none). A gold passage takes its strongest anchor (SAME > PARTIAL > DIFFERENT).
- ZERO stratum (reported separately, apart from anchor type): a gold passage that shares no token and no 5-letter prefix with the NAME anywhere in the sentence.
- Known bias, said now: Wikipedia links mostly the first mention, so gold is incomplete and skewed to first mentions. Recall is measured on linked mentions only; precision against this gold is a LOWER BOUND (an unlinked true mention counts as a miss). Pronoun-only sentences are almost never gold. This is a limit of the gold, not of the senses.

## Sets (chosen by member COUNT only, declared here)
Category:Featured articles, members in API order (sortkey). DEV = positions p with p mod 50 = 7, first 30. FRESH = positions p with p mod 50 = 23, first 60. No other filter. An article with no eligible query is reported (coverage), not replaced. FRESH is fetched only after the sense code is frozen and stamped (addendum below), is read by the scoring script ONCE, and any second scoring is REUSED. Everything built or tuned on DEV is DEV; anything looked at after is EXPLORATORY.

## Senses (each returns a ranked list of passages for (document, NAME); k = 10 unless said)
1. NAME: sentences holding the NAME as whole words, case-insensitive, document order.
2. STEM: sentences holding any non-stopword NAME token of 4+ letters by its 5-letter prefix (or the whole token if shorter); ranked by number of NAME tokens matched, then document order. The stronger mechanical baseline.
3. CHAIN (model-free recency): the NAME sentences, plus each following sentence that opens with a third-person pronoun (he she it they his her its their him them) or `The`/`This`/`That` + noun phrase, chained while the opening holds, at most 3 sentences after a name hit; chain sentences rank after direct hits.
4. KHORA: the document read through `readDocument` (khora native/reading.js, priors from janus, `lexicon:false`, `referents:true`, `castIdentity:true`); the referent whose face/forms match a NAME token is found, and the sentences holding its mentions are returned (utf16 spans converted to sentences). Names only; khora builds no noun-phrase referents, so this is expected to track NAME. Run to test the existing binder against the gold, not to improve it.
5. EMBED-N: all-MiniLM-L6-v2 (local, downloaded with the owner's yes 2026-11-19), cosine of the NAME string against each sentence. A nominator only.
6. EMBED-C: cosine of the CENTROID of the NAME-sentence embeddings (the document's own use of the name) against each sentence; the NAME sentences themselves are excluded from this list so it nominates NEW passages. A nominator only.
7. UNION-MECH = NAME + STEM + CHAIN. UNION-ALL = UNION-MECH + KHORA + the top 10 of EMBED-N and of EMBED-C. A union returns the merged set; its size is reported beside its recall and precision.
No model judges that a passage "says the same". Embedders only nominate; nothing here licenses a passage except the structure of the senses above and the gold at scoring.

## Verbatim and address
Every returned passage is a byte span [b0,b1) of the UTF-8 plain text with sha256 of exactly those bytes and the sha256 of the whole text. `reopen(text, addr)` re-slices and verifies, and refuses on a different text or a flipped byte. Scored: 100% of returned passages re-open; 100% of single-byte drifts (one per document, tried on 200 random passages) are refused. A failure here is a defect, not a score.

## Metrics (every one with coverage beside it)
Per query and pooled by gold passage: recall@10, precision@10, and recall and mean returned count with no cap ("all"). By anchor type (SAME / PARTIAL / DIFFERENT) and ZERO. Coverage: documents, queries, gold passages per stratum, share of queries with a DIFFERENT or ZERO gold passage. Confidence: 95% bootstrap over DOCUMENTS (2,000 draws, seed 20261119). A stratum with fewer than 30 gold passages is UNJUDGEABLE, not negative.

## Falsifiers (pre-written)
- F1 (the point): some sense beats NAME on recall@10 of the DIFFERENT stratum by 0.10 or more, with the bootstrap interval of the difference above 0. Hit if none does. (Per sense, listed.)
- F2: the union (MECH, ALL) beats every single sense on pooled recall@10 by 0.05 or more with the interval above 0, and its precision@all is at least half of the best single sense's. Hit if not.
- F3: STEM beats NAME on DIFFERENT; reported as a finding about the baseline either way (if STEM already reaches DIFFERENT, the "plain string" floor is higher than NAME).
- F4: ZERO stratum: any sense whose recall@10 there exceeds 0.10 (the rate at which a random ten sentences would hold a gold one is reported beside it, as the null: expected recall of k random sentences = min(1, k / n_sentences) averaged over queries).
- F5: verbatim and drift as above: all pass or the build is refused.
- F6: coverage: if fewer than 30 DIFFERENT gold passages exist on FRESH, F1 is "unjudgeable" and the verdict says so.

## Not claimed
No claim about pronoun-only mentions (the gold rarely has them), about languages other than English, or about retrieval across documents. One document at a time.

## Protocol
Stamp = sha256 prefix of this file, entered in LEDGER.md and splits.json at filing. A change after seeing data goes in an erratum below.

## Addenda
### Erratum 1 (2026-11-19, after a 4-article DEV smoke run and a hostile review; BEFORE any scoring of a full DEV or any FRESH fetch)
Original stamp d42d31b404c0097d stays the filing stamp. A DEV smoke run (4 articles) was looked at, and the review found a defect: link offsets were taken before HTML entities were unescaped, so many gold links sat in the wrong sentence. All smoke numbers are void and the DEV data was deleted and re-fetched. Changes, none touching FRESH (not yet fetched):
1. Entities are unescaped before offsets; the build asserts text[c0:c1] == anchor for every link and fails otherwise. Links lost to inline templates, list/indent lines (lines starting with - ! : * # ; |) are COUNTED and reported (links_dropped); the claim "every gold link sits in running text" is replaced by "every gold link kept sits in a prose line; dropped ones are counted".
2. Size match. The pre-registered union keeps its name only as UNION-MECH-M / UNION-ALL-M (merged lists, size reported). UNION-MECH and UNION-ALL are now the round-robin by rank of the same lists cut to 10, so recall@10 and precision@10 compare like for like. F2 is judged on the size-matched unions; the merged unions are reported beside it.
3. F1 and F3 are judged on DEV-style strata but ONLY for the single non-union senses; CHAIN contains the NAME hits by construction and the unions contain NAME, so for them the comparison is reported, not judged. Because DIFFERENT by token still lets prefix matching reach aliases (Cochin-China, Siam), the strata that carry the claim are ZERO and NAMEFREE (gold sentence holds no full NAME). F1 is judged on ZERO and on NAMEFREE as well as DIFFERENT; NAME, STEM and KHORA are structurally near 0 on ZERO and that is stated, not scored as a win for the embedders.
4. EMBED-C can never return a sentence holding the NAME, so it is judged only on NAMEFREE.
5. A per-query macro recall and the share of queries with a hit are reported beside pooled recall (pooled recall over-weights targets with many gold sentences). Ties: NAME and STEM break by document order; STEM ranks by number of NAME tokens matched.
6. KHORA matches a referent whose forms hold ALL NAME tokens, or whose face is wholly inside the NAME; one shared token no longer matches. Reads that return no referents or fail are counted as coverage, not silently scored as misses.
7. NAME matching compares letter/digit tokens (punctuation-insensitive), the same way anchor_type does.
8. The drift test flips a byte INSIDE the span, and is reported twice: refused with the document hash, and refused by the span hash alone (document check off). The stored sentence sha256 must equal the address sha256 of each returned passage.
9. Month abbreviations are added to the sentence splitter's list. "Linked at least 2 times" counts link occurrences (not sentences). Revisions are pinned by the revid saved in every document file; the raw wikitext is saved too. DIFFERENT is mostly aliases and acronyms (Siam for Thailand, UK for United Kingdom); it is reported as DIFFERENT-by-token, never as pronoun or description coreference. F4's 0.10 bar is absolute; the per-query random null is printed beside it.

## Addenda

### Freeze (2026-11-19, after DEV was scored and before the FRESH fetch)
Code frozen for the FRESH run; sha256 prefixes: lib.py bd3fd75a2f4bf4a7; senses.py ce1cd7540d8dbce7; score.py 061cf1e1c03f0d50; fetch_docs.py 97bb7e2123e158c1; khora_read.mjs 105a6cb14588af1b; 
DEV (30 articles, 486 queries, 1,120 gold passages) was scored after Erratum 1 and labelled DEV; nothing in it is claimed. Any further change to these files is an erratum and makes the FRESH run REUSED-class unless the change precedes the fetch.
