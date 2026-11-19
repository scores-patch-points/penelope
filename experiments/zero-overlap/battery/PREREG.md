# PREREG-B: Penelope's DEF, EVA and REC on a mutation battery (2026-11-18, before any pair is judged)

Status: DRAFT, unratified; by "claude-draft". Development reading until the held-out run.

**The question.** Does Penelope's loop judge sameness from a declared vantage (DEF), say same or other (EVA), and improve her own declaration from what she got wrong (REC), on pairs whose gold does not come from any judge of mine?

**Gold by construction, no judge.** Base texts are real speeches of the modernized Henry IV Part 1. Each pair is made by an edit whose effect is known from the edit itself, or is a real pair of the same speech from the two editions.
- SAME: identity (copy); case-and-punctuation (lowercased, curly apostrophes made straight, final punctuation stripped); real (a gold-aligned 1623 and modern speech pair, speaker-and-length alignment, 30/30 checked by eye earlier).
- OTHER: name swap (every occurrence of a name replaced by another name from the play's cast); negation insert (a "not" after the first auxiliary); word delete (one noun or verb removed); mismatch (a different speech of the same edition).
Limits stated: "word delete is OTHER" is a rule of this battery (dropping what a text states changes what it states), and a reader could disagree for a redundant word; real pairs include wording changes ("Ile talke" and "I will talk"), which a reader counts as the same speech.

**Split.** Development = acts 1 to 3; held-out = acts 4 and 5, not generated, judged, or tuned on until the single final run. 

**Arms.**
- Baselines (reported, never adopted): T1, same iff the two token sequences are equal after lowercasing and the declared normal form n2; T2, same iff the token sets are equal under n2.
- Penelope: V0 = the declared perspective (five questions: beings, figures, negations, acts, things), judged by `organs/vantage-verdicts.mjs`, no licence, no re-weighing. Revisions REC may nominate: the licence rules n1 and n2 (when they license a residue pair) and the whole-text re-weighing (when a residue element is dominantly another class in its own whole text).

**Measures.** Verdict per pair: same, other, or gap (an abstention, never counted correct). Per gold class: recall of SAME as same, recall of OTHER as other. Balanced accuracy BA = mean of the two recalls. False-accept rate FA = share of OTHER pairs called same. Also per edit type.

**Admission (REC's guard).** A nominated revision is adopted only if development BA rises and FA does not rise; a revision that moves no verdict is refused. At most four rounds. No threshold is set by hand in the judge; the licence rules and the re-weighing are the declared ones.

**Bars on the held-out run, fixed now.** H1: the final arm's BA exceeds the better of T1 and T2 by at least 0.05. H2: the final arm's FA does not exceed V0's. H3 (reported, no bar): per-type results.

**Run once.** The held-out pairs are generated and judged once, for the arm development admitted; an error in that run is disclosed in an erratum before any rerun.
