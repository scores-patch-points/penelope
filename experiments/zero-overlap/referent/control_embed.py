"""EXPLORATORY control (run after the single FRESH scoring; no claim, no tuning): does EMBED-N find a referent's gold passages because of
the referent, or because they are generally topical/central? Same document, same sentences, but the query vector is the NAME of ANOTHER
eligible target of the same document (seeded draw). python3 control_embed.py fresh"""
import sys, os, json, glob, random
import numpy as np
from lib import *
import senses as S
from score import queries
from sentence_transformers import SentenceTransformer
HERE = os.path.dirname(os.path.abspath(__file__)); which = sys.argv[1]; K = 10
m = SentenceTransformer(os.path.join(HERE, "models", "all-MiniLM-L6-v2"), device="cpu"); rng = random.Random(20261119)
tot = {st: [0, 0, 0] for st in ("ALL", "DIFFERENT", "ZERO", "NAMEFREE")}   # real hits, control hits, gold
for f in sorted(glob.glob(os.path.join(HERE, "data", which, "*.json"))):
    d = json.load(open(f)); qs = queries(d)
    if len(qs) < 2: continue
    E = m.encode([d["text"][s["c0"]:s["c1"]] for s in d["sentences"]], normalize_embeddings=True, show_progress_bar=False)
    Q = m.encode([q["name"] for q in qs], normalize_embeddings=True, show_progress_bar=False)
    for qi, q in enumerate(qs):
        oj = rng.choice([j for j in range(len(qs)) if j != qi])
        real = set(S.EMBED_N(d, q["name"], E, Q[qi])[:K]); ctl = set(S.EMBED_N(d, qs[oj]["name"], E, Q[oj])[:K])
        nh = set(S.name_hits(d, q["name"]))
        for si, ty in q["gold"].items():
            z = zero_overlap(q["name"], d["text"][d["sentences"][si]["c0"]:d["sentences"][si]["c1"]])
            for st in ["ALL", ty] + (["ZERO"] if z else []) + (["NAMEFREE"] if si not in nh else []):
                if st in tot: tot[st][0] += si in real; tot[st][1] += si in ctl; tot[st][2] += 1
for st, (a, b, g) in tot.items(): print(f"{st:10s} gold {g:5d}  EMBED-N real {a/g:.3f}  other-target-name control {b/g:.3f}")
