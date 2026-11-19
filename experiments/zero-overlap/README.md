# experiments/zero-overlap

Pre-registrations, results, scripts and logs for the zero-overlap sameness work (two texts that share no words and are, from a perspective, the same). Start with `LEDGER.md`: one row per claim, with its stamp, split label and a reproducing command. `PLAN-v3.md` is the working plan and the order of the next steps.

Run each script from inside its own folder (they read `fr/pairs.json`, `fresh*-fr.json` and similar files). The data is NOT committed: Wikipedia leads are fetched by `wikipedia/fetch*.py`, the Henry IV texts and French/German translations come from Zenodotus/Gutenberg (`bilingual/`), MRPC from the GLUE parquet files. `khora-run/` needs a khora checkout and is exploratory.

Rules these files follow: stamp the protocol before scoring (a sha of the PREREG file), file an erratum for any change after seeing data, run a held-out once, label every number DEV / FRESH / EXPLORATORY.
