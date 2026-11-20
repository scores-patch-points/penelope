"""python3 context_nom_report.py context-nom-<set>.json   the numbers and falsifiers of PREREG-CONTEXT-NOMINATION.md. Recall = gold passages found in the top 10 / gold passages, pooled over documents; intervals are a bootstrap over DOCUMENTS (2,000 draws, seed 20261119).
Every number carries its split label (the file's set) and the stamp 60432a15020910ad; DEV numbers are never claims. A stratum with fewer than 30 gold passages is UNJUDGEABLE."""
import sys, json, random, math
d = json.load(open(sys.argv[1])); docs = d["docs"]; ARMS, STRATA = d["arms"], d["strata"]; SEED, B = 20261119, 2000
label = "DEV (not a claim)" if d["set"] == "dev" else ("REUSED" if d["reused"] else "FRESH")
def tot(ds, a, st): h = sum(x["acc"][a][st][0] for x in ds); g = sum(x["acc"][a][st][1] for x in ds); return h, g
def rec(ds, a, st): h, g = tot(ds, a, st); return h / g if g else float("nan")
def nullr(ds, st): g = sum(x["gold"][st] for x in ds); return sum(x["null"][st] for x in ds) / g if g else float("nan")
def prec(ds, a): h = sum(x["prec"][a][0] for x in ds); n = sum(x["prec"][a][1] for x in ds); return h / n if n else float("nan")
rng = random.Random(SEED); draws = [[docs[rng.randrange(len(docs))] for _ in docs] for _ in range(B)]
def ci(fn):
    v = sorted(x for x in (fn(ds) for ds in draws) if x == x); return (v[int(.025 * len(v))], v[int(.975 * len(v)) - 1]) if v else (float("nan"), float("nan"))
G = {st: tot(docs, "N0", st)[1] for st in STRATA}
print(f"== CONTEXT NOMINATION, {d['set']} [{label}] stamp 60432a15020910ad | documents {len(docs)} | queries {d['coverage']['queries']} | skipped (no name sentence) {d['coverage']['skipped_no_name_sentence']} | fold mean class size {d['coverage'].get('fold_class_size_sum', 0) / max(1, d['coverage'].get('fold_names', 1)):.1f}")
print("gold passages by stratum:", G, "| UNJUDGEABLE (<30):", [s for s, g in G.items() if g < 30])
print("%-9s" % "recall@10" + "".join("%12s" % s for s in STRATA) + "   precision@10")
for a in ARMS: print("%-9s" % a + "".join("%12.3f" % rec(docs, a, s) for s in STRATA) + "   %.3f" % prec(docs, a))
print("%-9s" % "random-10" + "".join("%12.3f" % nullr(docs, s) for s in STRATA))
S = "ZERO-CLEAN"; ok = G[S] >= 30; best_base = max(("N0", "N0x"), key=lambda a: rec(docs, a, S))
def diff(a, b): return lambda ds: rec(ds, a, S) - rec(ds, b, S)
emb = [a for a in ("N1", "N2", "N3")]; best = max(emb, key=lambda a: rec(docs, a, S)); lo, hi = ci(diff(best, best_base))
print(f"\nFALSIFIERS on {S} ({'judgeable' if ok else 'UNJUDGEABLE: fewer than 30 gold passages'}), baseline = the better of N0 and N0x = {best_base}")
f1 = not (rec(docs, best, S) - rec(docs, best_base, S) >= 0.05 and lo > 0); print(f"F1 context buys nothing: best of N1,N2,N3 = {best} {rec(docs, best, S):.3f} vs {best_base} {rec(docs, best_base, S):.3f}, diff {rec(docs, best, S) - rec(docs, best_base, S):+.3f} [{lo:+.3f}, {hi:+.3f}] -> {'HIT' if f1 else 'not hit'}")
for a, sw in (("N1", "SWAP-N1"), ("N3", "SWAP-N3"), ("M1", "SWAP-M1")):
    r, s_ = rec(docs, a, S), rec(docs, sw, S); print(f"F2 topical not referent-tied ({a}): swap {s_:.3f} vs true {r:.3f} (ratio {s_ / r if r else float('nan'):.2f}) -> {'HIT' if r and s_ >= 0.5 * r else 'not hit'}")
m, nl = rec(docs, "M1", S), nullr(docs, S); print(f"F3 fold finds nothing: M1 {m:.3f} vs random-10 {nl:.3f}, diff {m - nl:+.3f} -> {'HIT' if m - nl < 0.05 else 'not hit'};   swap-M1 {rec(docs, 'SWAP-M1', S):.3f}")
for a in ("U1-N1", "U1-N2", "U1-N3"):
    mem = a.split("-")[1]; bm = max(rec(docs, mem, S), rec(docs, "M1", S)); print(f"F4 union ({a}): {rec(docs, a, S):.3f} vs best member {bm:.3f}, diff {rec(docs, a, S) - bm:+.3f} -> {'HIT' if rec(docs, a, S) - bm < 0.05 else 'not hit'}")
r5, n1 = rec(docs, "SHUF", S), rec(docs, "N1", S); print(f"F5 length not meaning: SHUF {r5:.3f} vs N1 {n1:.3f} (ratio {r5 / n1 if n1 else float('nan'):.2f}) -> {'HIT' if n1 and r5 >= 0.5 * n1 else 'not hit'}")
pb, p0, px = prec(docs, best), prec(docs, "N0"), prec(docs, "N0x")
print(f"F6 cost without gain (LITERAL, against N0 which keeps the name-bearing sentences, themselves gold SAME): precision@10 of {best} {pb:.3f} vs N0 {p0:.3f} -> {'HIT' if pb < 0.5 * p0 else 'not hit'}")
print(f"F6 like-for-like (against N0x, the same removal of name-bearing sentences): precision@10 of {best} {pb:.3f} vs N0x {px:.3f} -> {'HIT' if pb < 0.5 * px else 'not hit'}")
print("NOTE: the ALL stratum and precision@10 are not comparable between N0 (name-bearing sentences kept) and the other arms (removed); the strata ZERO-CLEAN, ZERO, DIFFERENT and NAMEFREE are the ones compared. See ADDENDUM-1.")
