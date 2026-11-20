"""python3 fetch_docs.py dev|fresh : fetch the declared set (PREREG-REFERENT-RETRIEVAL.md), one json per article under data/<set>/.
Saves as it goes; re-running skips what is on disk. Set rule (count only): Category:Featured articles in API order;
dev = positions p (0-based) with p % 50 == 7, first 30; fresh = p % 50 == 23, first 60; fresh4 = p % 50 == 11, first 60 (PREREG-CONTEXT-NOMINATION-SET.md)."""
import sys, json, os, time, urllib.request, urllib.parse
from lib import build_doc
API = "https://en.wikipedia.org/w/api.php"
UA = "referent-retrieval-research/0.1 (research script)"
HERE = os.path.dirname(os.path.abspath(__file__))

def get(params, tries=8):
    url = API + "?" + urllib.parse.urlencode(params)
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 503): time.sleep(5 * (k + 1)); continue
            raise
        except Exception:
            time.sleep(3 * (k + 1))
    raise RuntimeError("fetch failed " + url[:120])

def members(limit_pos):
    path = os.path.join(HERE, "data", "featured-members.json")
    have = json.load(open(path)) if os.path.exists(path) else {"titles": [], "cont": None, "done": False}
    while len(have["titles"]) <= limit_pos and not have["done"]:
        p = {"action": "query", "list": "categorymembers", "cmtitle": "Category:Featured articles", "cmnamespace": 0, "cmlimit": 500, "format": "json", "formatversion": 2}
        if have["cont"]: p["cmcontinue"] = have["cont"]
        d = get(p)
        have["titles"] += [m["title"] for m in d["query"]["categorymembers"]]
        have["cont"] = d.get("continue", {}).get("cmcontinue"); have["done"] = have["cont"] is None
        json.dump(have, open(path, "w")); time.sleep(1)
    return have["titles"]

def pick(which):
    if which == "dev": mod, n = 7, 30
    elif which == "fresh": mod, n = 23, 60
    elif which == "fresh4": mod, n = 11, 60
    else: raise SystemExit("dev|fresh")
    titles = members(50 * n + 60)
    return [(p, titles[p]) for p in range(mod, len(titles), 50)][:n]

RC = os.path.join(HERE, "data", "redirects.json")
def resolve(titles):
    cache = json.load(open(RC)) if os.path.exists(RC) else {}
    red = {}
    ts = sorted(t for t in set(titles) if t not in cache)
    for i in range(0, len(ts), 50):
        d = get({"action": "query", "titles": "|".join(ts[i:i+50]), "redirects": 1, "format": "json", "formatversion": 2})
        for r in d.get("query", {}).get("redirects", []): red[r["from"]] = r["to"]
        for r in d.get("query", {}).get("normalized", []): red.setdefault(r["from"], r["to"])
        time.sleep(0.3)
    for t in ts: cache[t] = red.get(t, t)
    json.dump(cache, open(RC, "w"))
    return cache

def main():
    which = sys.argv[1]
    out = os.path.join(HERE, "data", which); os.makedirs(out, exist_ok=True)
    order = pick(which)
    if len(sys.argv) > 2 and sys.argv[2] == "rev": order = order[::-1]
    for pos, title in order:
        path = os.path.join(out, f"{pos:05d}.json")
        if os.path.exists(path) or os.path.exists(path + ".lock"): continue
        open(path + ".lock", "w").close()
        d = get({"action": "query", "prop": "revisions", "rvprop": "ids|content", "rvslots": "main", "titles": title, "format": "json", "formatversion": 2})
        pg = d["query"]["pages"][0]
        rev = pg["revisions"][0]
        wt = rev["slots"]["main"]["content"]
        # first pass to find link targets, then resolve redirects, then rebuild with them
        doc0 = build_doc(title, rev["revid"], wt, {})
        red = resolve([l["target"] for l in doc0["links"]])
        doc = build_doc(title, rev["revid"], wt, red)
        doc["pos"] = pos
        os.makedirs(os.path.join(HERE, "data", "wikitext"), exist_ok=True)
        open(os.path.join(HERE, "data", "wikitext", f"{which}-{pos:05d}.txt"), "w").write(wt)
        json.dump(doc, open(path, "w")); os.remove(path + ".lock")
        print(pos, title, len(doc["sentences"]), "sentences", len(doc["links"]), "links", flush=True)
        time.sleep(1)

if __name__ == "__main__":
    main()
