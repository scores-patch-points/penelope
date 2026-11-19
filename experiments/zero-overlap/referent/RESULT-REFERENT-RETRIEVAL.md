# RESULT-REFERENT-RETRIEVAL (PREREG stamp d42d31b404c0097d, Erratum 1 and Freeze in the same file)
FRESH: 60 never-read English Featured articles (positions p mod 50 = 23, by count only), 956 queries, 2,094 gold passages, scored ONCE (results-fresh.json, results-fresh.txt). Frozen code: lib bd3fd75a, senses ce1cd754, score 061cf1e1, fetch_docs 97bb7e21, khora_read 105a6cb1. DEV: 30 articles (p mod 50 = 7), used to build and to find a bug (void numbers deleted, Erratum 1); DEV results are in results-dev.json and are not claimed.
Gold passages: SAME 1,380, PARTIAL 450, DIFFERENT (by token) 264, ZERO (no shared word or 5-letter prefix) 105, NAMEFREE (no full name in the sentence) 764. All strata above the 30 bar. Coverage: khora read all 60 documents; 0 links dropped of 9,228; random-10 null recall 0.061 (0.064 on ZERO).

## recall@10 (pooled, FRESH; 95% interval of the difference from NAME, bootstrap over documents)
| sense | ALL | SAME | DIFFERENT | ZERO | NAMEFREE | precision@10 |
|---|---|---|---|---|---|---|
| NAME | 0.629 | 0.939 | 0.042 | 0.000 | 0.000 | 0.545 |
| STEM | 0.889 | 0.975 | 0.511 | 0.000 | 0.734 | 0.268 |
| CHAIN | 0.744 | 0.943 | 0.106 | 0.010 | 0.314 | 0.260 |
| KHORA | 0.667 | 0.829 | 0.080 (+0.038 [-0.004,+0.085]) | 0.010 | 0.325 | 0.303 |
| EMBED-N | 0.765 | 0.824 | 0.530 (+0.489 [+0.406,+0.569]) | 0.276 (+0.276 [+0.189,+0.367]) | 0.656 | 0.168 |
| EMBED-C (name-free only by design) | 0.071 | 0.020 | 0.152 | 0.152 | 0.195 | 0.021 |
| UNION-MECH, size 10 | 0.896 | 0.985 | 0.519 | 0.010 | 0.734 | 0.249 |
| UNION-ALL, size 10 | 0.896 | 0.963 | 0.614 | 0.305 | 0.780 | 0.196 |
| UNION-ALL merged (about 22 returned per query) | 0.950 | 0.992 | 0.712 | 0.390 | 0.877 | 0.101 |
Macro (per query) recall@10 tells the same story: NAME 0.631, STEM 0.896, EMBED-N 0.780, UNION-ALL 0.910, merged 0.953.
## Verbatim (F5): 82,221 of 82,221 returned passages re-open to their exact bytes and match the stored sentence hash; a byte flipped inside a span is refused 180 of 180 times by the document hash and 180 of 180 by the span hash alone.
## Falsifiers
- F1 (some sense beats NAME on DIFFERENT by 0.10, interval above 0): NOT hit for STEM (+0.47), EMBED-N (+0.49), EMBED-C (+0.11). Hit for CHAIN (+0.064) and KHORA (+0.038, interval crosses 0). On ZERO, the only senses that beat NAME are the embedders (EMBED-N 0.276, EMBED-C 0.152); STEM, CHAIN and KHORA do not (0.000-0.010).
- F2 (the size-matched union beats every single sense by 0.05, interval above 0, precision at least half the best's): HIT. UNION-ALL (0.896) is +0.007 over STEM (0.889); UNION-MECH adds nothing over STEM either. The merged union reaches 0.950 only by returning about twice as many passages, at precision 0.101.
- F3 (STEM beats NAME on DIFFERENT): yes, +0.47. The honest string floor is stem search (DIFFERENT 0.51, mostly aliases and variants sharing a 5-letter prefix), not NAME.
- F4 (ZERO recall above 0.10): met by EMBED-N 0.276 and EMBED-C 0.152 only; the random-10 null is 0.064.
- F5: passed. F6: not triggered (264 DIFFERENT and 105 ZERO gold passages).
## EXPLORATORY control (control_embed.py, FRESH read a second time, no tuning): EMBED-N with the name of ANOTHER target of the same document as the query finds the gold passages 0.057 of the time on DIFFERENT, 0.038 on ZERO (against 0.530 and 0.276 with the true name): the embedder's hits are tied to the referent, not to the document's general topic.
## Reading
1. Plain name search finds 0.94 of passages that say the name and 0.04 of the rest. Where the name is absent from the sentence, name search is blind by construction (NAMEFREE 0.000).
2. A model-free stem search already reaches 0.73 of NAMEFREE and 0.51 of DIFFERENT, because most "different" anchors are variants (Siam/Thai, Cochin-China). It is zero on ZERO by construction. Any claim about "meaning beyond string matching" must be made on ZERO, not on DIFFERENT.
3. On ZERO (105 passages with no shared word or prefix) the embedder nominates the right sentence in its top 10 for 0.276 (null 0.064; control 0.038). The recency chain (0.010) and khora's own referents (0.010) do not reach it. Khora's read tracks names (SAME 0.829, below NAME) and, as the coreference session found, builds no noun-phrase referent for "the old man".
4. The union does not beat its best member at equal size. Nothing here supports a "the senses together are more than the parts" claim; the merged union gains recall only by returning more.
5. Holographic part: every passage re-opens to exact bytes and drift is refused; that part works, and it is independent of which sense nominated it.
## Not shown
Pronoun-only mentions (the gold rarely holds them; links mark first mentions), other languages, retrieval across documents, any use of an embedder as a judge. Precision here is a lower bound. Passage = sentence; recall@10 over about 170 sentences is an easy setting (null 0.06): a longer document would lower every number. EMBED-N is one small model (all-MiniLM-L6-v2) with the bare name as query; no other model or query form was tried.

## ERRATUM 2 (2026-11-19): the ZERO stratum includes trivial lexical variants, so ZERO is not "no relation"; EMBED-N 0.276 is an upper bound on meaning beyond string matching
Raised by the Janus session after a second LOOK at the FRESH ZERO list (no scoring, no tuning; a look, not a scoring: nothing here re-scores FRESH): 16 of the 105 FRESH ZERO gold sentences (15%) are plural, case or diacritic variants of the query name that `lib.zero_overlap` (equal token or shared 5-letter prefix) does not catch (Serb/Serbs, cap/caps, run/runs, hit/hits, volt/Volt, Huningue/Hüningen); the other 89 have no lexical relation by that rule. NOT taken from them on trust: the mechanism is in `lib.py` (no plural fold below five letters, no diacritic fold), and `zero_clean.py` (EXPLORATORY, DEV only, a declared normaliser: NFKD with marks dropped, a plural fold on words of 4+ letters, equal token, shared 5-letter prefix or edit distance 1) finds 8 of 66 DEV ZERO gold sentences (12.1%) are trivial variants (Serb/Serbs, Cusp/cusps, Spur/spurs, Pulp/pulp).
Consequences, stated and not yet measured: (1) STEM 0.000 on ZERO is by construction (it uses the same prefix rule that defines ZERO), so it says nothing about a better stem. (2) EMBED-N's 0.276 on FRESH ZERO partly comes from those 15%; its effect on 0.276 is UNKNOWN (no sense was re-scored). (3) The claim "meaning beyond string matching" must be made on a ZERO-CLEAN stratum (no relation after the normaliser), and that stratum needs a NEW fresh set: scoring it on the existing FRESH set would be REUSED, not FRESH. The row 30 numbers stand as measured under their own definition; none is changed.
