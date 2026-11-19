"""Shared pieces: wikitext -> plain prose + link gold, sentences with byte addresses, anchor typing, verbatim re-open.
PREREG-REFERENT-RETRIEVAL.md governs. Links are GOLD only; no sense imports this module's link output."""
import re, html, hashlib, itertools

NS = {"file","image","category","wikipedia","help","template","portal","special","talk","user","draft","media","commons","wikt","wiktionary","w","s","mos","wp","module","book","topic","user talk","wikipedia talk","template talk","category talk","file talk"}
STOP = set("the of and a an in on at to for de la le les des du von van der den das di da el al by with from as or is was".split())

def _balanced_remove(s, open_, close):
    out, depth, i, n = [], 0, 0, len(s)
    lo, lc = len(open_), len(close)
    while i < n:
        if s.startswith(open_, i): depth += 1; i += lo
        elif depth and s.startswith(close, i): depth -= 1; i += lc
        elif depth: i += 1
        else: out.append(s[i]); i += 1
    return "".join(out)

def _remove_files(s):
    """drop [[File:..]]/[[Image:..]]/[[Category:..]] including nested links in captions."""
    out, i, n = [], 0, len(s)
    while i < n:
        if s.startswith("[[", i):
            m = re.match(r"\[\[\s*([A-Za-z ]+)\s*:", s[i:i+30])
            if m and m.group(1).strip().lower() in ("file", "image", "category", "media"):
                depth, j = 0, i
                while j < n:
                    if s.startswith("[[", j): depth += 1; j += 2
                    elif s.startswith("]]", j):
                        depth -= 1; j += 2
                        if depth == 0: break
                    else: j += 1
                i = j; continue
        out.append(s[i]); i += 1
    return "".join(out)

def prose_of(wikitext):
    s = re.sub(r"<!--.*?-->", "", wikitext, flags=re.S)
    s = re.sub(r"<ref[^>/]*?/>", "", s)
    s = re.sub(r"<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"<(gallery|math|syntaxhighlight|source|timeline|imagemap|score|poem|chem)[^>]*>.*?</\1>", "", s, flags=re.S | re.I)
    s = _balanced_remove(s, "{{", "}}")
    s = _balanced_remove(s, "{|", "|}")
    s = _remove_files(s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace("\xa0", " ")   # BEFORE link offsets are taken (review finding 1)
    s = s.replace("'''", "").replace("''", "")
    keep = []
    for line in s.split("\n"):
        t = line.strip()
        if not t or t[0] in "=*#;:|!{}-" or t.startswith("__"): continue
        t = re.sub(r"\s+", " ", t)
        keep.append(t)
    return "\n".join(keep)

LINK = re.compile(r"\[\[([^\[\]|]+)(?:\|([^\[\]]*))?\]\]")

def norm_target(t):
    t = t.strip().replace("_", " ")
    if t.startswith(":"): t = t[1:]
    if "#" in t: return None
    if not t: return None
    p = t.split(":", 1)[0].strip().lower() if ":" in t else None
    if p and p in NS: return None
    return t[0].upper() + t[1:]

def links_and_text(prose):
    """-> (plain text, [ {c0,c1,target_raw,anchor} ]) with offsets in the plain text."""
    # external links first
    prose = re.sub(r"\[https?://[^\s\]]+\s+([^\]]*)\]", r"\1", prose)
    prose = re.sub(r"\[https?://[^\s\]]*\]", "", prose)
    out, links, last, pos = [], [], 0, 0
    for m in LINK.finditer(prose):
        out.append(prose[last:m.start()]); pos += m.start() - last
        tgt, anc = m.group(1), m.group(2)
        a = anc if anc else tgt
        if anc == "": a = ""
        out.append(a)
        t = norm_target(tgt)
        if t and a.strip(): links.append({"c0": pos, "c1": pos + len(a), "target_raw": t, "anchor": a})
        pos += len(a); last = m.end()
    out.append(prose[last:])
    text = "".join(out)
    return text, links

ABBR = {"jan","feb","mar","apr","jun","jul","aug","sep","sept","oct","nov","dec","mr","mrs","ms","dr","st","jr","sr","vs","etc","no","vol","inc","ltd","co","prof","gen","col","capt","lt","sgt","rev","hon","mt","ft","fig","approx","ca","c","e.g","i.e","u.s","u.k","p","pp","cf","al","ed","eds","op","cit","sen","rep","gov","pres","dept","est","fl","b","d","r","n.","ca"}
BOUND = re.compile(r"""([.!?]+["”’')\]]*)(\s+)(?=["“‘'(\[]?[A-Z0-9])""")

def split_sentences(text):
    """-> [(c0,c1)] char spans; never crosses a newline."""
    spans, pos = [], 0
    for para in text.split("\n"):
        p0 = pos
        start = 0
        for m in BOUND.finditer(para):
            head = para[start:m.start()]
            last = re.split(r"\s+", head.strip())[-1] if head.strip() else ""
            tok = last.lower().strip("(\"'“‘")
            if m.group(1).startswith(".") and (tok in ABBR or re.fullmatch(r"[a-z]", tok) or re.fullmatch(r"(?:[a-z]\.){1,}[a-z]?", tok)):
                continue
            end = m.start() + len(m.group(1))
            if para[start:end].strip(): spans.append((p0 + start, p0 + end))
            start = m.end()
        if para[start:].strip(): spans.append((p0 + start, p0 + len(para)))
        pos += len(para) + 1
    return spans

def byte_offsets(text):
    return [0] + list(itertools.accumulate(len(ch.encode("utf-8")) for ch in text))

def sha(b): return hashlib.sha256(b).hexdigest()

def build_doc(title, revid, wikitext, redirects):
    prose = prose_of(wikitext)
    text, raw = links_and_text(prose)
    spans = split_sentences(text)
    bo = byte_offsets(text)
    tb = text.encode("utf-8")
    sents = []
    for c0, c1 in spans:
        b0, b1 = bo[c0], bo[c1]
        sents.append({"c0": c0, "c1": c1, "b0": b0, "b1": b1, "sha256": sha(tb[b0:b1])})
    starts = [s["c0"] for s in sents]
    import bisect
    links = []
    for l in raw:
        i = bisect.bisect_right(starts, l["c0"]) - 1
        if i < 0 or l["c0"] >= sents[i]["c1"]: continue
        t = redirects.get(l["target_raw"], l["target_raw"])
        if t is None: continue
        assert text[l["c0"]:l["c1"]] == l["anchor"], (title, l)   # gold offsets must index the text exactly
        links.append({"c0": l["c0"], "c1": l["c1"], "target": t, "anchor": l["anchor"], "sent": i})
    return {"title": title, "revid": revid, "doc_sha256": sha(tb), "text": text, "sentences": sents, "links": links, "links_in_prose": len(raw), "links_dropped": len(raw) - len(links)}

# ---- names and anchor types -------------------------------------------------
def name_of(title):
    return re.sub(r"\s*\([^)]*\)\s*$", "", title).strip()

def toks(s):
    return [t for t in re.findall(r"[^\W_]+", s.lower()) if t not in STOP and len(t) > 1]

def anchor_type(name, anchor):
    nn = " ".join(re.findall(r"[^\W_]+", name.lower()))
    aa = " ".join(re.findall(r"[^\W_]+", anchor.lower()))
    if nn and re.search(r"(?<![^\W_])" + re.escape(nn) + r"(?![^\W_])", aa): return "SAME"
    if set(toks(name)) & set(toks(anchor)): return "PARTIAL"
    return "DIFFERENT"

def prefix5(t): return t[:5]

def zero_overlap(name, sentence):
    nt = toks(name)
    st = toks(sentence)
    pre = {prefix5(t) for t in st}
    return not any((t in st) or (prefix5(t) in pre) for t in nt)

# ---- the holograph: address, re-open, refuse on drift ------------------------
def address(doc_text_bytes, b0, b1):
    return {"doc": sha(doc_text_bytes), "b0": b0, "b1": b1, "sha256": sha(doc_text_bytes[b0:b1])}

class Refused(Exception): pass

def reopen(doc_text_bytes, addr, check_doc=True):
    if check_doc and sha(doc_text_bytes) != addr["doc"]: raise Refused("document drifted")
    piece = doc_text_bytes[addr["b0"]:addr["b1"]]
    if sha(piece) != addr["sha256"]: raise Refused("span drifted")
    return piece.decode("utf-8")
