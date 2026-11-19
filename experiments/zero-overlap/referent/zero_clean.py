"""python3 zero_clean.py dev   EXPLORATORY, DEV only (no sense is scored, FRESH is not read).
Question (raised by the Janus session about row 30): how many ZERO gold sentences are TRIVIAL lexical variants of the query name that lib.zero_overlap (equal token or shared 5-letter prefix) misses?
The normaliser is DECLARED, not tuned: Unicode NFKD with combining marks dropped, lower case, a plural fold (a trailing es or s on a word of 4+ letters), then equal token, shared 5-letter prefix, or edit distance 1 on words of 4+ letters."""
import sys, os, json, glob, unicodedata, collections
from lib import *
import types
for m in ('numpy',):
    sys.modules.setdefault(m, types.ModuleType(m))        # score.py imports numpy at the top; the queries() function used here does not need it
from score import queries
HERE = os.path.dirname(os.path.abspath(__file__))
def fold(t): return "".join(c for c in unicodedata.normalize("NFKD", t) if not unicodedata.combining(c))
def stem(t):
    if len(t) >= 5 and t.endswith("es"): return t[:-2]
    if len(t) >= 4 and t.endswith("s"): return t[:-1]
    return t
def ntoks(s): return [stem(fold(t)) for t in toks(s)]
def ed1(a, b):
    if abs(len(a) - len(b)) > 1 or min(len(a), len(b)) < 4: return False
    if a == b: return True
    i = 0
    while i < min(len(a), len(b)) and a[i] == b[i]: i += 1
    return a[i + 1:] == b[i + 1:] or a[i + 1:] == b[i:] or a[i:] == b[i + 1:]
def related(name, sent):
    nt, st = ntoks(name), ntoks(sent)
    pre = {prefix5(t) for t in st}
    return any(t in st or prefix5(t) in pre or any(ed1(t, u) for u in st) for t in nt)
def main():
    which = sys.argv[1]
    if which != "dev": raise SystemExit("this script reads DEV only; FRESH is not re-read")
    docs = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(HERE, "data", which, "*.json")))]
    tot = {"gold": 0, "ZERO": 0, "ZERO_trivial": 0, "ZERO_clean": 0}; ex = []
    for doc in docs:
        for q in queries(doc):
            for si, ty in q["gold"].items():
                s = doc["text"][doc["sentences"][si]["c0"]:doc["sentences"][si]["c1"]]; tot["gold"] += 1
                if zero_overlap(q["name"], s):
                    tot["ZERO"] += 1
                    if related(q["name"], s): tot["ZERO_trivial"] += 1; ex.append((q["name"], s[:90]))
                    else: tot["ZERO_clean"] += 1
    print(json.dumps(tot)); print("share of ZERO that is trivial:", round(tot["ZERO_trivial"] / max(1, tot["ZERO"]), 3))
    for e in ex[:12]: print(e)
main()
