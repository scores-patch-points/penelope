"""python3 score.py dev|fresh [--reused]  (PREREG-REFERENT-RETRIEVAL.md). Writes results-<set>.json. FRESH is scored ONCE: a second run needs --reused
and is labelled REUSED. Needs data/<set>/*.json (fetch_docs.py) and data/<set>-khora.json (node khora_read.mjs <set>) and models/all-MiniLM-L6-v2."""
import sys, os, json, glob, random, bisect, collections, hashlib
import numpy as np
from lib import *
import senses as S

HERE = os.path.dirname(os.path.abspath(__file__))
K = 10
SENSES = ["NAME", "STEM", "CHAIN", "KHORA", "EMBED-N", "EMBED-C", "UNION-MECH", "UNION-ALL", "UNION-MECH-M", "UNION-ALL-M"]
STRATA = ["ALL", "SAME", "PARTIAL", "DIFFERENT", "ZERO", "NAMEFREE"]  # NAMEFREE: gold sentence holds no full NAME (erratum 1)

def queries(doc):
    by = collections.defaultdict(list)
    for l in doc["links"]: by[l["target"]].append(l)
    out = []
    for t, ls in by.items():
        nm = name_of(t)
        if len(ls) < 2 or len(nm) < 3 or not re.search(r"[^\W\d_]", nm): continue
        out.append((-len(ls), t, nm, ls))
    out.sort(key=lambda x: (x[0], x[1]))
    res = []
    for _, t, nm, ls in out[:25]:
        gold = {}
        rank = {"SAME": 0, "PARTIAL": 1, "DIFFERENT": 2}
        for l in ls:
            ty = anchor_type(nm, l["anchor"])
            if l["sent"] not in gold or rank[ty] < rank[gold[l["sent"]]]: gold[l["sent"]] = ty
        res.append({"target": t, "name": nm, "gold": gold})
    return res

def khora_for(doc, kr):
    if not kr or "referents" not in kr: return kr
    text = doc["text"]
    u16 = [0]
    for ch in text: u16.append(u16[-1] + (2 if ord(ch) > 0xFFFF else 1))
    starts = [u16[s["c0"]] for s in doc["sentences"]]
    ends = [u16[s["c1"]] for s in doc["sentences"]]
    def sent_of(a):
        i = bisect.bisect_right(starts, a) - 1
        return i if i >= 0 and a < ends[i] else None
    return {**kr, "_sent_of_u16": sent_of}

def main():
    which = sys.argv[1]; reused = "--reused" in sys.argv
    outp = os.path.join(HERE, f"results-{which}{'-REUSED' if reused else ''}.json")
    if which == "fresh" and not reused and glob.glob(os.path.join(HERE, "results-fresh*.json")):
        raise SystemExit("FRESH was already scored; a second scoring must be run with --reused and is labelled REUSED")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(os.path.join(HERE, "models", "all-MiniLM-L6-v2"), device="cpu")
    kall = json.load(open(os.path.join(HERE, "data", f"{which}-khora.json"))) if os.path.exists(os.path.join(HERE, "data", f"{which}-khora.json")) else {}
    docs = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(HERE, "data", which, "*.json")))]
    # per-doc accumulators: acc[doc][sense][stratum] = [hits, gold]; prec[doc][sense] = [hits_in_topk, returned]; sizes
    acc, prec, allr, nulls, cover, macros = [], [], [], [], [], []
    verb = {"returned": 0, "reopen_ok": 0, "drift_tried": 0, "drift_refused": 0}
    rng = random.Random(20261119)
    for doc in docs:
        tb = doc["text"].encode("utf-8")
        n = len(doc["sentences"])
        qs = queries(doc)
        a = {s: {st: [0, 0] for st in STRATA} for s in SENSES}
        p = {s: [0, 0] for s in SENSES}
        al = {s: {st: [0, 0] for st in STRATA} for s in SENSES}
        al_size = {s: [0, 0] for s in SENSES}
        nl = {st: [0.0, 0] for st in STRATA}
        macro = {s: [0.0, 0] for s in SENSES}
        cov = {"queries": len(qs), "gold": 0, "DIFFERENT": 0, "ZERO": 0, "title": doc["title"], "sentences": n, "khora": None, "links_dropped": doc.get("links_dropped"), "links_in_prose": doc.get("links_in_prose")}
        if qs:
            texts = [doc["text"][s["c0"]:s["c1"]] for s in doc["sentences"]]
            E = model.encode(texts, normalize_embeddings=True, batch_size=64, show_progress_bar=False)
            Q = model.encode([q["name"] for q in qs], normalize_embeddings=True, show_progress_bar=False)
        kr = khora_for(doc, kall.get(str(doc["pos"])))
        cov_k = "ok" if (kr and "referents" in kr) else ("none" if kr and kr.get("none") else ("err" if kr and kr.get("err") else "missing"))
        cov["khora"] = cov_k
        for qi, q in enumerate(qs):
            lists = {
                "NAME": S.NAME(doc, q["name"]), "STEM": S.STEM(doc, q["name"]), "CHAIN": S.CHAIN(doc, q["name"]),
                "KHORA": S.KHORA(doc, q["name"], kr), "EMBED-N": S.EMBED_N(doc, q["name"], E, Q[qi]), "EMBED-C": S.EMBED_C(doc, q["name"], E),
            }
            top = {s: lists[s][:K] for s in lists}
            def merge(names):
                seen, o = set(), []
                for s in names:
                    for i in top[s]:
                        if i not in seen: seen.add(i); o.append(i)
                return o
            def interleave(names):  # size-matched union: round robin by rank, first K distinct (erratum 1)
                seen, o = set(), []
                for r in range(K):
                    for s_ in names:
                        if r < len(top[s_]) and top[s_][r] not in seen and len(o) < K: seen.add(top[s_][r]); o.append(top[s_][r])
                return o
            MECH, ALLS = ["NAME", "STEM", "CHAIN"], ["NAME", "STEM", "CHAIN", "KHORA", "EMBED-N", "EMBED-C"]
            top["UNION-MECH-M"] = merge(MECH); top["UNION-ALL-M"] = merge(ALLS)
            top["UNION-MECH"] = interleave(MECH); top["UNION-ALL"] = interleave(ALLS)
            full = {s: lists[s] for s in ("NAME", "STEM", "CHAIN", "KHORA")}
            full["UNION-MECH-M"] = list(dict.fromkeys(lists["NAME"] + lists["STEM"] + lists["CHAIN"]))
            strata_of = {}
            for si, ty in q["gold"].items():
                z = zero_overlap(q["name"], doc["text"][doc["sentences"][si]["c0"]:doc["sentences"][si]["c1"]])
                nf = si not in set(S.name_hits(doc, q["name"]))
                strata_of[si] = ["ALL", ty] + (["ZERO"] if z else []) + (["NAMEFREE"] if nf else [])
                cov["gold"] += 1; cov["DIFFERENT"] += ty == "DIFFERENT"; cov["ZERO"] += z
                for st in strata_of[si]:
                    nl[st][0] += min(1.0, K / n); nl[st][1] += 1
            for s in SENSES:
                macro[s][0] += len(set(q["gold"]) & set(top[s])) / len(q["gold"]); macro[s][1] += 1
                tset = set(top[s])
                for si, sts in strata_of.items():
                    for st in sts:
                        a[s][st][1] += 1; a[s][st][0] += si in tset
                if top[s]:
                    p[s][0] += sum(1 for i in top[s] if i in q["gold"]); p[s][1] += len(top[s])
                if s in full:
                    fset = set(full[s])
                    for si, sts in strata_of.items():
                        for st in sts:
                            al[s][st][1] += 1; al[s][st][0] += si in fset
                    al_size[s][0] += len(full[s]); al_size[s][1] += 1
            for s in SENSES:  # verbatim: every returned passage re-opens
                for i in top[s]:
                    sp = doc["sentences"][i]
                    ad = address(tb, sp["b0"], sp["b1"])
                    verb["returned"] += 1
                    try:
                        txt = reopen(tb, ad)
                        verb["reopen_ok"] += (txt == doc["text"][sp["c0"]:sp["c1"]]) and ad["sha256"] == sp["sha256"]
                    except Refused: pass
        # drift (erratum 1): a byte flipped INSIDE the span. Refused by the document hash, and, with the document check off, by the span hash alone.
        for _ in range(max(1, 200 // max(1, len(docs)))):
            sp = doc["sentences"][rng.randrange(n)]
            if sp["b1"] <= sp["b0"]: continue
            ad = address(tb, sp["b0"], sp["b1"])
            j = rng.randrange(sp["b0"], sp["b1"])
            bad = bytearray(tb); bad[j] ^= 0x01
            verb["drift_tried"] += 1
            try: reopen(bytes(bad), ad)
            except Refused: verb["drift_refused"] += 1
            try: reopen(bytes(bad), ad, check_doc=False)
            except Refused: verb["drift_refused_span_only"] = verb.get("drift_refused_span_only", 0) + 1
        macros.append(macro); acc.append(a); prec.append(p); allr.append((al, al_size)); nulls.append(nl); cover.append(cov)
    json.dump({"set": which, "label": ("REUSED" if reused else ("FRESH" if which == "fresh" else "DEV")), "K": K, "acc": acc, "prec": prec,
               "all": [x[0] for x in allr], "all_size": [x[1] for x in allr], "null": nulls, "cover": cover, "macro": macros, "verbatim": verb}, open(outp, "w"))
    report(outp)

def pooled(acc, s, st, idx):
    h = sum(acc[i][s][st][0] for i in idx); g = sum(acc[i][s][st][1] for i in idx)
    return (h / g if g else float("nan")), g

def report(path):
    R = json.load(open(path)); acc = R["acc"]; nd = len(acc)
    rng = np.random.default_rng(20261119)
    print(f"== {R['label']} set={R['set']} docs={nd} queries={sum(c['queries'] for c in R['cover'])} gold={sum(c['gold'] for c in R['cover'])}")
    for st in STRATA:
        g = sum(acc[i]["NAME"][st][1] for i in range(nd))
        nul = sum(R["null"][i][st][0] for i in range(nd)); ng = sum(R["null"][i][st][1] for i in range(nd))
        print(f"-- stratum {st}: gold passages {g}{'  UNJUDGEABLE (<30)' if g < 30 else ''}; random-{R['K']} null recall {nul/ng if ng else float('nan'):.3f}")
        for s in SENSES:
            r, _ = pooled(acc, s, st, range(nd))
            line = f"   {s:11s} recall@{R['K']} {r:.3f}"
            if s != "NAME" and g:
                diffs = []
                for _ in range(2000):
                    idx = rng.integers(0, nd, nd)
                    a, _ = pooled(acc, s, st, idx); b, _ = pooled(acc, "NAME", st, idx)
                    diffs.append(a - b)
                diffs = [d for d in diffs if d == d]
                if diffs: line += f"  minus NAME {r - pooled(acc,'NAME',st,range(nd))[0]:+.3f} [{np.percentile(diffs,2.5):+.3f},{np.percentile(diffs,97.5):+.3f}]"
            print(line)
    print("-- precision@10 (lower bound; gold is first-mention-biased) and returned set sizes, uncapped recall where the sense is a set")
    for s in SENSES:
        h = sum(p[s][0] for p in R["prec"]); n = sum(p[s][1] for p in R["prec"])
        line = f"   {s:11s} precision@10 {h/n if n else float('nan'):.3f} (returned {n})"
        if s in R["all"][0]:
            r, _ = pooled([{s: x[s]} for x in R["all"]], s, "ALL", range(nd)); rd, _ = pooled([{s: x[s]} for x in R["all"]], s, "DIFFERENT", range(nd))
            sz = sum(x[s][0] for x in R["all_size"]) / max(1, sum(x[s][1] for x in R["all_size"]))
            line += f"; uncapped recall ALL {r:.3f} DIFFERENT {rd:.3f}, mean set size {sz:.1f}"
        print(line)
    print("-- macro recall@10 (mean over queries of per-query recall; gold-size effect removed)")
    for s_ in SENSES:
        h = sum(m[s_][0] for m in R["macro"]); n_ = sum(m[s_][1] for m in R["macro"])
        print(f"   {s_:12s} {h/n_ if n_ else float('nan'):.3f} over {n_} queries")
    kc = collections.Counter(c["khora"] for c in R["cover"])
    print(f"-- khora read coverage (documents): {dict(kc)}; links in prose {sum(c['links_in_prose'] or 0 for c in R['cover'])}, dropped as unplaceable {sum(c['links_dropped'] or 0 for c in R['cover'])}")
    v = R["verbatim"]
    print(f"-- verbatim span-only drift refused: {v.get('drift_refused_span_only',0)}/{v['drift_tried']}")
    print(f"-- verbatim: {v['reopen_ok']}/{v['returned']} returned passages re-open to their exact text; drift refused {v['drift_refused']}/{v['drift_tried']}")

if __name__ == "__main__":
    if sys.argv[1] == "report": report(sys.argv[2])
    else: main()
