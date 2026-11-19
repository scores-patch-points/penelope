"""python3 compare/make_pairs.py -> compare/smoke-pairs.json : DEV statement pairs for the comparator smoke test (EXPLORATORY).
true pair: A = a gold sentence that holds the NAME, B = a gold sentence of the SAME referent without the NAME. impostor: B = a gold sentence of ANOTHER target of the same document. Offsets are UTF-16 (JS)."""
import json, glob, random, sys
sys.path.insert(0, ".")
from lib import *
import senses as S
from score import queries
rng = random.Random(20261119); out = {"true": [], "imp": []}
u16 = lambda text, i: len(text[:i].encode("utf-16-le")) // 2
for f in sorted(glob.glob("data/dev/*.json")):
    d = json.load(open(f)); qs = queries(d); T = d["text"]
    for q in qs[:6]:
        nh = set(S.name_hits(d, q["name"])); gold = set(q["gold"]); A = sorted(gold & nh); B = sorted(gold - nh)
        if not A or not B: continue
        a, b = rng.choice(A), rng.choice(B)
        sa, sb = d["sentences"][a], d["sentences"][b]
        out["true"].append({"title": d["title"], "name": q["name"], "A": [u16(T, sa["c0"]), u16(T, sa["c1"])], "B": [u16(T, sb["c0"]), u16(T, sb["c1"])], "doc": f.split("/")[-1]})
        others = [x for x in qs if x["name"] != q["name"]]
        cand = [(x, s) for x in others for s in x["gold"] if s not in gold and s not in nh]
        if cand:
            x, s = rng.choice(cand); sx = d["sentences"][s]
            out["imp"].append({"title": d["title"], "name": q["name"], "A": [u16(T, sa["c0"]), u16(T, sa["c1"])], "B": [u16(T, sx["c0"]), u16(T, sx["c1"])], "doc": f.split("/")[-1]})
rng.shuffle(out["true"]); rng.shuffle(out["imp"]); out["true"] = out["true"][:100]; out["imp"] = out["imp"][:100]
json.dump(out, open("compare/smoke-pairs.json", "w")); print({k: len(v) for k, v in out.items()})
