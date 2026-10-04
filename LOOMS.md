# Penelope's looms (APIs)

Three ways to weave. Each takes an ask, each returns the artifact *with
its record* — no cloth without the ledger of its making.

## chat — the shuttle

In: plain words. Out: grounded answer + verdict trail.
The mouth draws, the organs judge, scars ride along. Free talk is
allowed; confident claims are not — anything unverified arrives typed
as such. (Live today: gym `/api/chat`, verdicts in `ladder-live.jsonl`.)

## build — the cloth

In: one prompt (+ optional workspace). Out: artifact + control +
facing page + EOT record.
Library remembers, box derives, hunt gets, mouth last. Null-hit anywhere
→ named gap, never invented cloth. Requires a create-capable door:
patch-only loops need not apply (measured 2026-10-01). (Live today:
ladder R1–R13, apps in `apps/`.)

## notebook — the pattern-book

In: cells (rung, prompt, prior attempt). Out: re-runnable record —
every cell replays to its verdict, history appends, nothing overwrites.
The ladder as a Jupyter notebook: markdown cells carry specs and
model-drawn history (recorded, never replayed), code cells re-run the
organ selftests with outputs stored. (Live: `penelope-notebook.ipynb`
via `gym/to-notebook.mjs`, 4/4 organ cells green.)

## overview — a situated evidence medium

Use the public generation API with `artifact: "overview"`, `noModel: true`,
and `context.overview` containing the declared frame, selected versioned text,
expectations and optional owned arrangements. One unit carries the complete
replayable record through the existing lifecycle. The portable materializer is
also vendored by the Holodeck surface; it requires no server or model. Native
intake runs ethos, logos and pathos; browser replay does not claim that clearance.
The output HTML includes source text, contextual expansion, reverse links,
negative spaces, inquiries and the construction record. Source selection is
literal; inferred impact/representation equity and original-media mappings
remain explicit boundaries. Contract and controls: eoreader7's
`native/docs/OVERVIEW-BLOCKS.md`; `node --test gym/overview.test.mjs`.
