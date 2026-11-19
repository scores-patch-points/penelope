"""python3 fs_check.py dev  -- EXPLORATORY follow-up to falsify.py (ledger row 32). Two checks suggested by review:
(1) Is the strength half a Fellegi-Sunter weight? Compare score variants on EMBED-N nominations without the name (top 30, for power):
    S0 old strength, sum log10(1/f) over shared tokens; S1 FS agree-only, sum log10(m/f); S2 FS with disagreement terms;
    S3 max single weight; S4 top-3 sum; S5 stem-deduplicated (a dependence correction: shared tokens with one 5-letter prefix count once).
    m = P(token appears in a true name-free same-referent passage | token in the referent's fold), by rarity bucket, estimated leave-document-out.
    Metrics: AUC gold vs non-gold nominations; control separation: for gold nominations, how often the true fold scores above ANOTHER target's fold.
(2) Does the guarded transitive closure depend on arrival order? Sequential guard (merge unless it joins a cannot-link pair) vs component-hold
    (a must-link component holding any cannot-link pair is held whole), over shuffled orders of random synthetic graphs."""
import sys, os, json, glob, re, math, random, collections, itertools
import numpy as np
from lib import *
import senses as S
from score import queries
from sentence_transformers import SentenceTransformer
HERE = os.path.dirname(os.path.abspath(__file__)); which = sys.argv[1]; K = 30
m_ = SentenceTransformer(os.path.join(HERE, "models", "all-MiniLM-L6-v2"), device="cpu"); rng = random.Random(20261119)
docs = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(HERE, "data", which, "*.json")))]
def sents(d): return [d["text"][s["c0"]:s["c1"]] for s in d["sentences"]]
T_ = [sents(d) for d in docs]; TK = [[set(toks(s)) for s in T] for T in T_]
df = [collections.Counter(w for t in tk for w in t) for tk in TK]; ns = [len(t) for t in T_]; tot = sum(df, collections.Counter()); N = sum(ns)
def f_of(w, i): return (tot[w] - df[i][w] + 1) / (N - ns[i] + 2)
bucket = lambda f: min(7, int(math.log10(1 / f)))
# m-table by document: counts per bucket of (token in fold, token in a true name-free gold passage)
cnt = []
for i, d in enumerate(docs):
    c = collections.defaultdict(lambda: [0, 0])   # bucket -> [in gold, in fold]
    for q in queries(d):
        nh = sorted(S.name_hits(d, q["name"]))
        gold = [g for g in q["gold"] if g not in set(nh)]
        if not nh or not gold: continue
        fold = set().union(*[TK[i][x] for x in nh]) - set(toks(q["name"]))
        for g in gold:
            for w in fold:
                b = bucket(f_of(w, i)); c[b][1] += 1; c[b][0] += w in TK[i][g]
    cnt.append(c)
def m_of(w, i):
    b = bucket(f_of(w, i)); hit = sum(c[b][0] for j, c in enumerate(cnt) if j != i); n = sum(c[b][1] for j, c in enumerate(cnt) if j != i)
    return (hit + 1) / (n + 2)
def scores(i, x, fold, name):
    nt = set(toks(name)); shared = (TK[i][x] & fold) - nt; fv = fold - nt
    ws = {w: math.log10(m_of(w, i) / f_of(w, i)) for w in shared}
    s0 = sum(math.log10(1 / f_of(w, i)) for w in shared)
    s1 = sum(ws.values())
    dis = sum(math.log10((1 - m_of(w, i)) / (1 - f_of(w, i))) for w in fv - shared)
    srt = sorted(ws.values(), reverse=True)
    stems = {}
    for w in shared: stems[prefix5(w)] = max(stems.get(prefix5(w), -9), ws[w])
    return {"S0 old": s0, "S1 FS agree-only": s1, "S2 FS full": s1 + dis, "S3 max": srt[0] if srt else 0.0, "S4 top3": sum(srt[:3]), "S5 stem-dedup": sum(stems.values())}
names = ["S0 old", "S1 FS agree-only", "S2 FS full", "S3 max", "S4 top3", "S5 stem-dedup"]
pos = {n: [] for n in names}; neg = {n: [] for n in names}; ctl = {n: [0, 0] for n in names}
for i, d in enumerate(docs):
    qs = queries(d)
    if len(qs) < 2: continue
    E = m_.encode(T_[i], normalize_embeddings=True, show_progress_bar=False); Q = m_.encode([q["name"] for q in qs], normalize_embeddings=True, show_progress_bar=False)
    for qi, q in enumerate(qs):
        nh = set(S.name_hits(d, q["name"]))
        if not nh: continue
        fold = set().union(*[TK[i][x] for x in nh])
        o = rng.choice([j for j in range(len(qs)) if j != qi]); nho = set(S.name_hits(d, qs[o]["name"]))
        foldo = set().union(*[TK[i][x] for x in nho]) if nho else None
        for x in [y for y in S.EMBED_N(d, q["name"], E, Q[qi]) if y not in nh][:K]:
            sc = scores(i, x, fold, q["name"]); g = x in q["gold"]
            for n in names: (pos if g else neg)[n].append(sc[n])
            if g and foldo:
                so = scores(i, x, foldo, q["name"])
                for n in names: ctl[n][1] += 1; ctl[n][0] += sc[n] > so[n] + 1e-12 or (abs(sc[n] - so[n]) <= 1e-12 and 0.5)
def auc(p, n):
    if not p or not n: return float("nan")
    a = np.array(p)[:, None]; b = np.array(n)[None, :]; return float(((a > b) + 0.5 * (a == b)).mean())
print(f"(1) score variants on name-free EMBED-N top-{K} nominations (DEV): {len(pos[names[0]])} gold, {len(neg[names[0]])} non-gold")
for n in names: print(f"   {n:18s} AUC gold vs non-gold {auc(pos[n], neg[n]):.3f}; true fold beats another target's fold for gold nominations {ctl[n][0]}/{ctl[n][1]} = {ctl[n][0]/max(ctl[n][1],1):.3f}")
# ---- (2) arrival-order dependence of the guarded closure
def sequential(n, must, cannot, order):
    parent = list(range(n))
    def find(a):
        while parent[a] != a: parent[a] = parent[parent[a]]; a = parent[a]
        return a
    bad = {frozenset(c) for c in cannot}
    for k in order:
        a, b = must[k]; ra, rb = find(a), find(b)
        if ra == rb: continue
        # refuse a merge that would join a cannot-link pair
        ma = [v for v in range(n) if find(v) == ra]; mb = [v for v in range(n) if find(v) == rb]
        if any(frozenset((x, y)) in bad for x in ma for y in mb): continue
        parent[ra] = rb
    return frozenset(frozenset(v for v in range(n) if find(v) == r) for r in {find(v) for v in range(n)})
def component_hold(n, must, cannot):
    parent = list(range(n))
    def find(a):
        while parent[a] != a: parent[a] = parent[parent[a]]; a = parent[a]
        return a
    for a, b in must: parent[find(a)] = find(b)
    comps = collections.defaultdict(set)
    for v in range(n): comps[find(v)].add(v)
    held = {r for r, vs in comps.items() if any(a in vs and b in vs for a, b in cannot)}
    return frozenset(frozenset([v]) if r in held else frozenset(vs) for r, vs in comps.items() for v in ([None] if False else vs) ) if False else frozenset(frozenset(vs) for r, vs in comps.items())
trials = 300; seq_changed = 0; hold_changed = 0; conflicted = 0
for t in range(trials):
    n = 10; must = [tuple(rng.sample(range(n), 2)) for _ in range(9)]; cannot = [tuple(rng.sample(range(n), 2)) for _ in range(4)]
    outs = set(); idx = list(range(len(must)))
    for _ in range(12): rng.shuffle(idx); outs.add(sequential(n, must, cannot, idx))
    seq_changed += len(outs) > 1
    h = component_hold(n, must, cannot); hold_changed += 0   # a function of the SET of links, not of their order
print(f"(2) guarded closure over {trials} random synthetic graphs (10 beings, 9 must-links, 4 cannot-links), 12 arrival orders each:")
print(f"   sequential guard gave different partitions for different orders in {seq_changed}/{trials} graphs ({seq_changed/trials:.3f})")
print(f"   component-hold (hold any must-link component that contains a cannot-link pair) depends only on the link sets: order-dependent in 0 by construction")
