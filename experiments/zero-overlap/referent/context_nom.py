"""python3 context_nom.py dev|fresh4 [--reused]   PREREG-CONTEXT-NOMINATION.md (janus repo, stamp 60432a15020910ad) + PREREG-CONTEXT-NOMINATION-SET.md (stamp in its .sha256short).
Arms (every one a NOMINATOR: a ranking of the document's sentences, nothing else):
  N0  EMBED-N, row 30's (bare name against isolated sentences, name sentences NOT removed)        N0x the same with the name-bearing sentences removed (so a gain is not only the removal)
  N1  EMBED-P: the query is the referent's PARAPHRASE (its first K=5 name-bearing sentences, in order, no model, no regex), candidates isolated, name-bearing sentences removed
  N2  EMBED-X: the query is the bare name, each candidate is its WINDOW of w sentences (w=3 primary, 1 and 5 reported), name-bearing sentences removed
  N3  EMBED-PX: N1's query against N2's candidates
Controls: random-10 null; TARGET-SWAP (another target's paraphrase of the same document, N1 and N3); SHUF (a query of the same token length made of the document's most frequent content words, shuffled, F5).
DEV is for building (no number from it is a claim). fresh4 is read ONCE (a second scoring needs --reused and is labelled REUSED). Writes context-nom-<set>.json."""
import sys, os, json, glob, random, unicodedata, collections, hashlib
import numpy as np
from lib import STOP, zero_overlap
from score import queries, K
from zero_clean import related
from fold_nom import Fold, rank_sentences
HERE = os.path.dirname(os.path.abspath(__file__))
KP, W_PRIMARY, W_ALL, SEED, BOOT = 5, 3, (1, 3, 5), 20261119, 2000
ARMS = ["N0", "N0x", "N1", "N2", "N2w1", "N2w5", "N3", "SWAP-N1", "SWAP-N3", "SHUF", "M1", "SWAP-M1", "U1-N1", "U1-N2", "U1-N3"]
STRATA = ["ZERO-CLEAN", "ZERO", "DIFFERENT", "NAMEFREE", "ALL"]

def fold(t): return "".join(c for c in unicodedata.normalize("NFKD", t) if not unicodedata.combining(c)).lower()
def toks2(s):                                   # NO regex: runs of alphanumeric characters, folded
    out, cur = [], []
    for ch in s:
        if ch.isalnum(): cur.append(ch)
        elif cur: out.append(fold("".join(cur))); cur = []
    if cur: out.append(fold("".join(cur)))
    return out
def content(s): return [t for t in toks2(s) if t not in STOP and len(t) > 1]
def name_bearing(doc, name, sents):            # set membership over tokens: a sentence bears the name when every content token of the name is in it
    nt = set(content(name))
    return [i for i, s in enumerate(sents) if nt and nt <= set(toks2(s))]
def paraphrase(sents, hits, k=KP):             # the first k name-bearing sentences, in document order, joined
    return " ".join(sents[i] for i in sorted(hits)[:k])
def shuffled_frequent(sents, n_tokens, rng):
    c = collections.Counter(t for s in sents for t in content(s)); words = [w for w, _ in c.most_common(max(n_tokens, 1))]
    rng.shuffle(words); return " ".join(words[:n_tokens])
def windows(sents, w):
    h = (w - 1) // 2
    return [" ".join(sents[max(0, i - h): i + h + 1]) for i in range(len(sents))]
def interleave(a, b, k=K):                      # size-matched union: round robin, first k distinct (row 30's rule)
    seen, out = set(), []
    for r in range(k):
        for lst in (a, b):
            if r < len(lst) and lst[r] not in seen and len(out) < k: seen.add(lst[r]); out.append(lst[r])
    return out
def rank(E, q, exclude=()):
    sc = E @ q; ex = set(exclude)
    return [int(i) for i in np.argsort(-sc, kind="stable") if int(i) not in ex]
def strata_of(doc, q, si, ty):
    s = doc["text"][doc["sentences"][si]["c0"]:doc["sentences"][si]["c1"]]
    z = zero_overlap(q["name"], s); nf = not name_in(q["name"], s)
    st = ["ALL", ty] + (["ZERO"] if z else []) + (["ZERO-CLEAN"] if z and not related(q["name"], s) else []) + (["NAMEFREE"] if nf else [])
    return st
def name_in(name, s):
    nt = set(content(name)); return bool(nt) and nt <= set(toks2(s))

def main():
    which = sys.argv[1]; reused = "--reused" in sys.argv
    outp = os.path.join(HERE, f"context-nom-{which}{'-REUSED' if reused else ''}.json")
    if which != "dev" and not reused and glob.glob(os.path.join(HERE, f"context-nom-{which}*.json")):
        raise SystemExit(f"{which} was already scored; a second scoring needs --reused and is labelled REUSED")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(os.path.join(HERE, "models", "all-MiniLM-L6-v2"), device="cpu")
    enc = lambda x: model.encode(x, normalize_embeddings=True, batch_size=64, show_progress_bar=False)
    docs = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(HERE, "data", which, "*.json")))]
    fold = Fold([[t for t in toks2(d["text"])] for d in docs])      # the whole set's text is the background (never the links)
    rng = random.Random(SEED); per_doc = []; cov = {"documents": len(docs), "queries": 0, "gold": collections.Counter(), "skipped_no_name_sentence": 0, "skipped_single_target": 0}
    for doc in docs:
        sents = [doc["text"][s["c0"]:s["c1"]] for s in doc["sentences"]]; n = len(sents); qs = queries(doc)
        if not qs: continue
        stoks = [toks2(x) for x in sents]; E = enc(sents); EW = {1: E, 3: enc(windows(sents, 3)), 5: enc(windows(sents, 5))}
        acc = {a: {st: [0, 0] for st in STRATA} for a in ARMS}; prec = {a: [0, 0] for a in ARMS}; nl = {st: 0.0 for st in STRATA}; gold_n = {st: 0 for st in STRATA}
        hitsets = {q["target"]: name_bearing(doc, q["name"], sents) for q in qs}
        for qi, q in enumerate(qs):
            hits = hitsets[q["target"]]
            if not hits: cov["skipped_no_name_sentence"] += 1; continue
            cov["queries"] += 1; ex = set(hits)
            qn = enc([q["name"]])[0]; para = paraphrase(sents, hits); qp = enc([para])[0]
            others = [o for o in qs if o["target"] != q["target"] and hitsets[o["target"]]]
            if others: o = others[qi % len(others)]; qs_swap = enc([paraphrase(sents, hitsets[o["target"]])])[0]
            else: qs_swap = None; cov["skipped_single_target"] += 1
            qshuf = enc([shuffled_frequent(sents, len(content(para)), rng)])[0]
            R = {"N0": rank(E, qn), "N0x": rank(E, qn, ex), "N1": rank(E, qp, ex), "N2": rank(EW[3], qn, ex), "N2w1": rank(EW[1], qn, ex), "N2w5": rank(EW[5], qn, ex), "N3": rank(EW[3], qp, ex), "SHUF": rank(E, qshuf, ex)}
            R["SWAP-N1"] = rank(E, qs_swap, ex) if qs_swap is not None else []; R["SWAP-N3"] = rank(EW[3], qs_swap, ex) if qs_swap is not None else []
            R["M1"] = rank_sentences(fold, content(q["name"]), stoks, W_PRIMARY, ex); R["SWAP-M1"] = rank_sentences(fold, content(o["name"]), stoks, W_PRIMARY, ex) if qs_swap is not None else []
            for a, b in (("U1-N1", "N1"), ("U1-N2", "N2"), ("U1-N3", "N3")): R[a] = interleave(R[b], R["M1"])
            cov["fold_class_size_sum"] = cov.get("fold_class_size_sum", 0) + sum(len(fold.klass(w)) for w in content(q["name"])); cov["fold_names"] = cov.get("fold_names", 0) + len(content(q["name"]))
            top = {a: R[a][:K] for a in ARMS}
            for si, ty in q["gold"].items():
                sts = strata_of(doc, q, si, ty)
                for st in sts:
                    if st in STRATA:
                        gold_n[st] += 1; nl[st] += min(1.0, K / n)
                        for a in ARMS:
                            if a.startswith("SWAP") and qs_swap is None: continue
                            acc[a][st][1] += 1; acc[a][st][0] += si in set(top[a])
                cov["gold"].update(st for st in sts if st in STRATA)
            for a in ARMS:
                if a.startswith("SWAP") and qs_swap is None: continue
                prec[a][0] += sum(1 for i in top[a] if i in q["gold"]); prec[a][1] += len(top[a])
        per_doc.append({"title": doc["title"], "acc": acc, "prec": prec, "null": nl, "gold": gold_n})
    json.dump({"set": which, "reused": reused, "K": K, "w_primary": W_PRIMARY, "kp": KP, "arms": ARMS, "strata": STRATA, "coverage": {**cov, "gold": dict(cov["gold"])}, "docs": per_doc}, open(outp, "w"), indent=1)
    print("wrote", outp, "| documents", len(per_doc), "| queries", cov["queries"], "| gold by stratum", dict(cov["gold"]))
if __name__ == "__main__": main()
