# PREREG-REL: the relations frame (filed before it was scored)
Status: DEV ONLY. The held-out acts (>=4) were consumed by the earlier fr/de runs, so no held-out is run here; any result is a dev result, not a claim of generalisation. A fresh held-out needs new categories (declared as a gap).

Frame R (relations): an ENTITY is a capitalised token that is not sentence-initial, or a 4-digit year 1000-2100; normalised NFC, accents stripped, lowercased, first 5 characters; the 50 most document-frequent entity types of the induction set (acts<=2) are removed. A RELATION is an ORDERED pair (x, y) of entities in one sentence with y at most 2 entities after x. score(en p, other q) = number of shared ordered relations. Nothing is learned and no word has to match except the named entities; what is new against plain overlap is that two entities must stand in the same order, near each other, in both texts.
Control R_set: shared entity count (no pairing, no order). If R_set does as well as R, the relation adds nothing over entity overlap.

Same null as before: 50 length-matched articles (seed 20261118); pass = score above the null maximum and >= 1. Suitors = other articles of the same category scene.
Ladder verdict (judgeFrames semantics): a claimant is "same" if some frame passes it and no other suitor passes that frame. Ladder A = [overlap, usage(T_all), numerals]; ladder B = A + R last; ladder B' = R first. Suitor trials: a suitor claimant with rivals = the other suitors of that scene.
Admission (stamped): B (or B') is admitted over A only if balanced accuracy rises, false accepts do not, AND R's pairwise lifts with overlap, usage and numerals (suitor pass) are below the old frames' mean pairwise lift (R is more independent than they are to each other). All three needed.
Falsifiers: R TP on dev < 0.15; or R_set matches R; or mean lift of R >= mean lift of old frames. Any one means the relations frame, as built, is not a new frame.
Language data: fr and de dev (act 3) pairs. No Russian (parked).
