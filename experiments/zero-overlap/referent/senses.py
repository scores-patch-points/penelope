"""The senses of PREREG-REFERENT-RETRIEVAL.md. Each: (doc, name) -> ranked list of sentence indexes. No sense reads doc['links'] (gold).
doc needs only 'text' and 'sentences'. Embedding/khora senses take precomputed artefacts."""
import re
from lib import toks, prefix5, STOP

PRON = {"he","she","it","they","his","her","its","their","him","them","hers","theirs"}
DEFNP = {"the","this","that","these","those"}

def _sent(doc, i):
    s = doc["sentences"][i]; return doc["text"][s["c0"]:s["c1"]]

def _nz(x): return " ".join(re.findall(r"[^\W_]+", x.lower()))

def name_hits(doc, name):
    nn = _nz(name)
    if not nn: return []
    pat = re.compile(r"(?<![^\W_])" + re.escape(nn) + r"(?![^\W_])")
    return [i for i in range(len(doc["sentences"])) if pat.search(_nz(_sent(doc, i)))]

def NAME(doc, name):
    return name_hits(doc, name)

def STEM(doc, name):
    nt = [t for t in toks(name) if len(t) >= 4] or toks(name)
    keys = {prefix5(t) if len(t) > 5 else t for t in nt}
    out = []
    for i in range(len(doc["sentences"])):
        st = re.findall(r"[^\W_]+", _sent(doc, i).lower())
        n = sum(1 for k in keys if any((w.startswith(k) if len(k) == 5 else w == k) for w in st))
        if n: out.append((-n, i))
    return [i for _, i in sorted(out)]

def _opens_chain(sentence):
    w = re.findall(r"[^\W_]+", sentence.lower())[:2]
    if not w: return False
    if w[0] in PRON: return True
    return w[0] in DEFNP and len(w) > 1 and w[1] not in PRON

def CHAIN(doc, name):
    """name hits first (document order), then chain sentences: following sentences that open with a pronoun or a
    definite noun phrase, chained while the opening holds, at most 3 after a hit. Model-free recency chain."""
    hits = name_hits(doc, name)
    # also a last-token mention (surname-like) as a name hit for chaining
    nt = toks(name)
    if nt:
        last = nt[-1]
        pat = re.compile(r"(?<![^\W_])" + re.escape(last) + r"(?![^\W_])")
        anchors = sorted(set(hits) | {i for i in range(len(doc["sentences"])) if pat.search(_sent(doc, i).lower())})
    else: anchors = hits
    chain, seen, n = [], set(anchors), len(doc["sentences"])
    for a in anchors:
        j = a + 1
        while j < n and j - a <= 3 and _opens_chain(_sent(doc, j)):
            if j not in seen: chain.append(j); seen.add(j)
            j += 1
    return list(hits) + sorted(set(anchors) - set(hits)) + sorted(chain)

def KHORA(doc, name, kread):
    """kread = {'referents':[{face,forms,mentions:[[u16a,u16b,kind]]}]} for this doc, from khora_read.mjs. u16 offsets are converted
    to character offsets with the map in kread['_c0_of_u16'] built by score.py."""
    if not kread or "referents" not in kread: return []
    nt = set(toks(name)); out = set()
    for r in kread["referents"]:
        ft = set(toks(r["face"])) | {t for f in r["forms"] for t in toks(f)}
        if nt and (nt <= ft or (ft and ft <= nt and len(ft) >= 1 and _nz(r["face"]) in _nz(name))):
            for a, b, k in r["mentions"]:
                out.add(kread["_sent_of_u16"](a))
    return sorted(x for x in out if x is not None)

def EMBED_N(doc, name, E, qvec):
    """E: matrix of sentence embeddings (normalised), qvec: embedding of the NAME."""
    import numpy as np
    sc = E @ qvec
    return [int(i) for i in np.argsort(-sc, kind="stable")]

def EMBED_C(doc, name, E):
    """centroid of the NAME-sentence embeddings against all sentences; the NAME sentences themselves are excluded."""
    import numpy as np
    hits = name_hits(doc, name)
    if not hits: return []
    c = E[hits].mean(axis=0); c = c / (np.linalg.norm(c) + 1e-9)
    sc = E @ c
    hs = set(hits)
    return [int(i) for i in np.argsort(-sc, kind="stable") if int(i) not in hs]
