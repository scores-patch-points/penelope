"""python3 falsify.py dev   -- attacks on THEORY-IDENTITY.md, run on DEV (label DEV; no claim). Three attacks, each able to fail:
A1 vector merge of planted contradictions (negation flipped, year changed, two names swapped): does the embedder keep them as the nearest neighbour of the original?
A2 false discernment: apply the naive structural difference check (year conflict, polarity) to TRUE same-referent sentence pairs and to random pairs: does it fire on truths?
A3 license power: among EMBED-N nominations without the name, does coincidence strength (shared rare keys, leave-document-out rarity, knee from a leave-document-out prior) license the gold ones?"""
import sys, os, json, glob, re, math, random, collections
import numpy as np
from lib import *
import senses as S
from score import queries
from sentence_transformers import SentenceTransformer
HERE = os.path.dirname(os.path.abspath(__file__)); which = sys.argv[1]; K = 10
m = SentenceTransformer(os.path.join(HERE, "models", "all-MiniLM-L6-v2"), device="cpu"); rng = random.Random(20261119)
docs = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(HERE, "data", which, "*.json")))]
def sents(d): return [d["text"][s["c0"]:s["c1"]] for s in d["sentences"]]
YEAR = re.compile(r"\b(1[0-9]{3}|20[0-9]{2})\b"); NEG = re.compile(r"\b(not|never|no|neither|nor|without)\b|n't", re.I)
AUX = re.compile(r"\b(was|were|is|are|had|has|have|did|would|could|will|can)\b")
CAP = re.compile(r"\b([A-Z][a-z]+(?: [A-Z][a-z]+)*)\b")
def flip_neg(s):
    if NEG.search(s):
        return re.sub(r"\b(not|never)\s+", "", s, count=1) or None
    mo = AUX.search(s)
    return s[:mo.end()] + " not" + s[mo.end():] if mo else None
def shift_year(s):
    mo = YEAR.search(s)
    return s[:mo.start()] + str(int(mo.group()) + rng.choice([-37, -12, 9, 26])) + s[mo.end():] if mo else None
def swap_names(s):
    names = [x for x in CAP.findall(s) if " " in x or len(x) > 4]
    names = list(dict.fromkeys(names))
    if len(names) < 2: return None
    a, b = names[0], names[1]
    return s.replace(a, "\0").replace(b, a).replace("\0", b)
# ---- A1
A1 = {k: [0, 0, []] for k in ("negation", "year", "swap")}   # nearest-neighbour hits, tried, cosines
for d in docs:
    T = sents(d); E = m.encode(T, normalize_embeddings=True, show_progress_bar=False)
    pick = rng.sample(range(len(T)), min(40, len(T)))
    for i in pick:
        for k, f in (("negation", flip_neg), ("year", shift_year), ("swap", swap_names)):
            c = f(T[i])
            if not c or c == T[i]: continue
            v = m.encode([c], normalize_embeddings=True, show_progress_bar=False)[0]
            sc = E @ v; sc[i] = -9; best_other = sc.max()   # most similar OTHER original sentence
            cos = float(E[i] @ v); A1[k][1] += 1; A1[k][0] += cos > best_other; A1[k][2].append(cos)
print("A1 planted contradictions (the embedder's view; the rule-based catch is by construction):")
for k, (h, n, cs) in A1.items(): print(f"   {k:9s} contradiction is the nearest neighbour of its original {h}/{n} = {h/max(n,1):.3f}; mean cosine {np.mean(cs):.3f}, min {np.min(cs):.3f}")
# ---- A2
def feats(s): return set(YEAR.findall(s)), len(NEG.findall(s)) > 0
tp = collections.Counter(); rp = collections.Counter()
for d in docs:
    T = sents(d)
    for q in queries(d):
        nh = set(S.name_hits(d, q["name"]))
        gold = [g for g in q["gold"] if g not in nh]
        if not nh or not gold: continue
        for g in gold:
            a = rng.choice(sorted(nh)); r = rng.choice([x for x in range(len(T)) if x not in q["gold"] and x not in nh] or [0])
            for lab, (x, y), cnt in (("true", (a, g), tp), ("random", (a, r), rp)):
                ya, pa = feats(T[x]); yb, pb = feats(T[y]); cnt["n"] += 1
                if ya and yb: cnt["both_have_year"] += 1; cnt["year_conflict"] += ya.isdisjoint(yb)
                cnt["polarity_conflict"] += pa != pb
print("A2 naive structural discernment on TRUE same-referent pairs vs random pairs (a theory-faithful check must call these HOLES, not Other):")
for lab, c in (("true same-referent", tp), ("random", rp)):
    print(f"   {lab:19s} n {c['n']}: year conflict {c['year_conflict']}/{c['both_have_year']} = {c['year_conflict']/max(c['both_have_year'],1):.3f} of pairs with years on both sides; polarity differs {c['polarity_conflict']/c['n']:.3f}")
# ---- A3
toks_of = lambda s: set(toks(s))
df = [collections.Counter() for _ in docs]; ns = []
for i, d in enumerate(docs):
    T = sents(d); ns.append(len(T))
    for s in T: df[i].update(toks_of(s))
tot = sum(df, collections.Counter()); N = sum(ns)
def rarity(w, i):   # leave-document-out
    f = (tot[w] - df[i][w] + 1) / (N - ns[i] + 2); return math.log10(1 / f)
prior = []
for i, d in enumerate(docs):
    qs = queries(d); g = sum(len(q["gold"]) for q in qs); prior.append((g / max(len(qs), 1)) / ns[i])
res = {"nom": [0, 0], "lic": [0, 0], "gold_nom": 0, "gold_lic": 0, "zero_gold_nom": 0, "zero_gold_lic": 0, "ctl_lic": 0, "ctl_n": 0}
auc_pairs = [0, 0]
for i, d in enumerate(docs):
    T = sents(d); qs = queries(d)
    if not qs: continue
    E = m.encode(T, normalize_embeddings=True, show_progress_bar=False); Q = m.encode([q["name"] for q in qs], normalize_embeddings=True, show_progress_bar=False)
    p0 = np.mean([p for j, p in enumerate(prior) if j != i]); kappa = math.log10((1 - p0) / p0)   # leave-document-out prior
    def strength(p, fold_idx, name):
        shared = (toks_of(T[p]) & set().union(*[toks_of(T[x]) for x in fold_idx])) - set(toks(name))
        return sum(rarity(w, i) for w in shared)
    for qi, q in enumerate(qs):
        nh = set(S.name_hits(d, q["name"]))
        if not nh: continue
        nom = [x for x in S.EMBED_N(d, q["name"], E, Q[qi]) if x not in nh][:K]
        other = rng.choice([x for x in range(len(qs)) if x != qi]) if len(qs) > 1 else None
        for x in nom:
            s = strength(x, sorted(nh), q["name"]); isg = x in q["gold"]
            res["nom"][1] += 1; res["nom"][0] += isg
            z = zero_overlap(q["name"], T[x]) and isg
            res["gold_nom"] += isg; res["zero_gold_nom"] += z
            if s >= kappa: res["lic"][1] += 1; res["lic"][0] += isg; res["gold_lic"] += isg; res["zero_gold_lic"] += z
            if other is not None:   # control: the same nominations scored against ANOTHER target's fold
                nho = set(S.name_hits(d, qs[other]["name"]))
                if nho: res["ctl_n"] += 1; res["ctl_lic"] += strength(x, sorted(nho), q["name"]) >= kappa
        # AUC of strength between gold and non-gold nominations
        sc = [(strength(x, sorted(nh), q["name"]), x in q["gold"]) for x in nom]
        pos = [s for s, g in sc if g]; neg = [s for s, g in sc if not g]
        for a in pos:
            for b in neg: auc_pairs[1] += 1; auc_pairs[0] += 1.0 if a > b else 0.5 if a == b else 0.0
print("A3 license by coincidence strength on EMBED-N nominations without the name (leave-document-out rarity and prior):")
print(f"   nominations {res['nom'][1]}, gold among them {res['nom'][0]} (precision {res['nom'][0]/res['nom'][1]:.3f})")
print(f"   licensed {res['lic'][1]} ({res['lic'][1]/res['nom'][1]:.3f} of nominations), gold among them {res['lic'][0]} (precision {res['lic'][0]/max(res['lic'][1],1):.3f}); gold kept {res['gold_lic']}/{res['gold_nom']} = {res['gold_lic']/max(res['gold_nom'],1):.3f}")
print(f"   ZERO-stratum gold nominated {res['zero_gold_nom']}, licensed {res['zero_gold_lic']}")
print(f"   control (other target's fold): licensed rate {res['ctl_lic']}/{res['ctl_n']} = {res['ctl_lic']/max(res['ctl_n'],1):.3f}")
print(f"   AUC of strength, gold vs non-gold nominations: {auc_pairs[0]/max(auc_pairs[1],1):.3f} over {int(auc_pairs[1])} pairs")
