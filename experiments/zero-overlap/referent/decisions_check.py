"""python3 decisions_check.py  -- EXPLORATORY local falsifiers for the owner decisions in codecs/codec-invariances.draft.json (ledger row 35).
No network, no downloads. Our own data (the 30 DEV articles) and local tools only (ffmpeg, whisper-cli, macOS say, Pillow if present).
E1 case: does folding case in a NAME match add noise? E2: how many gold links does the wikitext-to-prose reduction drop, and where?
E4 image: is the hash of DECODED pixels stable across decoders, and does a resize or recompression change it?
E5 audio: are gain, resampling, recompression, loudness normalisation, padding and noise really accidental for a transcript, and what does whisper say over non-speech?"""
import sys, os, re, json, glob, hashlib, subprocess, tempfile, shutil, collections, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from lib import *
from lib import _balanced_remove, _remove_files
import senses as S
from score import queries
TMP = os.environ.get("DC_TMP") or tempfile.mkdtemp(prefix="dc_")
def sh(cmd, **k): return subprocess.run(cmd, capture_output=True, text=True, timeout=k.pop("timeout", 120), **k)
H = lambda b: hashlib.sha256(b).hexdigest()[:12]
docs = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(HERE, "data", "dev", "*.json")))]
print(f"== DECISIONS CHECK (exploratory; {len(docs)} DEV articles; tmp {TMP})")

# ---------- E1 case ----------
def hits(d, name, mode):
    T = [d["text"][s["c0"]:s["c1"]] for s in d["sentences"]]
    pat_cased = re.compile(r"(?<![^\W_])" + re.escape(name) + r"(?![^\W_])")
    pat_fold = re.compile(r"(?<![^\W_])" + re.escape(name) + r"(?![^\W_])", re.I)
    out = set()
    for i, s in enumerate(T):
        if mode == "cased" and pat_cased.search(s): out.add(i)
        elif mode == "folded" and pat_fold.search(s): out.add(i)
        elif mode == "first-letter":   # case folded only where the match is the first word of the sentence (the one place case is accidental)
            m = pat_fold.search(s)
            if m and (pat_cased.search(s) or s[:m.start()].strip(" \"'([“‘") == ""): out.add(i)
    return out
agg = {m: [0, 0, 0] for m in ("cased", "folded", "first-letter")}   # hits, gold hits, gold total
extra = [0, 0]
for d in docs:
    for q in queries(d):
        g = set(q["gold"]);
        for m in agg:
            h = hits(d, q["name"], m); agg[m][0] += len(h); agg[m][1] += len(h & g)
        agg["cased"][2] += len(g)
        x = hits(d, q["name"], "folded") - hits(d, q["name"], "cased"); extra[0] += len(x); extra[1] += len(x & g)
print("E1 case: NAME hits against the link gold (DEV)")
for m, (h, gh, gt) in agg.items(): print(f"   {m:13s} hits {h:6d} gold hits {gh:5d} precision {gh/max(h,1):.3f} recall of all gold {gh/max(agg['cased'][2],1):.3f}")
print(f"   hits that folding adds over case-kept: {extra[0]}, of which gold {extra[1]} ({extra[1]/max(extra[0],1):.3f})")

# ---------- E2 link loss ----------
LINK = re.compile(r"\[\[([^\[\]|#]+)(?:#[^\[\]|]*)?(?:\|[^\[\]]*)?\]\]")
def nlinks(s): return sum(1 for m in LINK.finditer(s) if ":" not in m.group(1).split(":")[0][:12] or m.group(1).split(":")[0].strip().lower() not in NS)
stage = collections.Counter(); tot = 0
for f in sorted(glob.glob(os.path.join(HERE, "data", "wikitext", "dev-*.txt"))):
    wt = open(f, encoding="utf-8").read()
    s0 = re.sub(r"<!--.*?-->", "", wt, flags=re.S); a = nlinks(s0)
    s1 = re.sub(r"<ref[^>/]*?/>", "", s0); s1 = re.sub(r"<ref[^>]*>.*?</ref>", "", s1, flags=re.S); b = nlinks(s1)
    s2 = re.sub(r"<(gallery|math|syntaxhighlight|source|timeline|imagemap|score|poem|chem)[^>]*>.*?</\1>", "", s1, flags=re.S | re.I); c = nlinks(s2)
    s3 = _balanced_remove(s2, "{{", "}}"); d_ = nlinks(s3)
    s4 = _balanced_remove(s3, "{|", "|}"); e = nlinks(s4)
    s5 = _remove_files(s4); f_ = nlinks(s5)
    kept = sum(1 for ln in re.sub(r"<[^>]+>", "", s5).split("\n") if ln.strip() and ln.strip()[0] not in "=*#;:|!{}-" and not ln.strip().startswith("__") for _ in LINK.finditer(ln))
    tot += a; stage["in refs"] += a - b; stage["in gallery/math/etc"] += b - c; stage["in templates (infobox, convert, lang...)"] += c - d_; stage["in tables"] += d_ - e; stage["in files and captions"] += e - f_
    stage["on list/heading/indent lines"] += f_ - kept; stage["KEPT in prose lines"] += kept
print(f"E2 wikitext reduction: links in the raw wikitext of the DEV articles {tot}; where they go:")
for k, v in stage.items(): print(f"   {k:42s} {v:6d} ({v/max(tot,1):.3f})")

# ---------- E4 image decode stability ----------
print("E4 image: is the hash of DECODED pixels stable?")
try:
    from PIL import Image; import numpy as np; PIL_OK = True
except Exception as e:
    PIL_OK = False; print("   Pillow/numpy missing:", e)
try:
    jpg = os.path.join(TMP, "a.jpg"); png = os.path.join(TMP, "a.png")
    r = sh(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "mandelbrot=s=320x240:end_pts=6", "-frames:v", "1", "-q:v", "4", jpg]); assert os.path.exists(jpg), r.stderr[:200]
    sh(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "mandelbrot=s=320x240:end_pts=6", "-frames:v", "1", png])
    def ff(path, *extra):
        r = subprocess.run(["ffmpeg", "-loglevel", "error", *extra, "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, timeout=60); return r.stdout
    dec = {"ffmpeg default": ff(jpg), "ffmpeg -idct simple": ff(jpg, "-idct", "simple"), "ffmpeg -idct int": ff(jpg, "-idct", "int"), "ffmpeg -flags +bitexact": ff(jpg, "-flags", "+bitexact")}
    if PIL_OK: dec["Pillow (libjpeg)"] = Image.open(jpg).convert("RGB").tobytes()
    if shutil.which("sips"):
        o = os.path.join(TMP, "sips.png"); sh(["sips", "-s", "format", "png", jpg, "--out", o]);
        if os.path.exists(o): dec["macOS ImageIO (sips)"] = ff(o)
    base = dec["ffmpeg default"]
    for k, b in dec.items():
        diff = ""
        if PIL_OK and len(b) == len(base):
            a1 = np.frombuffer(base, np.uint8).astype(int); a2 = np.frombuffer(b, np.uint8).astype(int); diff = f"max |diff| {int(abs(a1-a2).max())}, pixels differing {float((a1!=a2).mean()):.4f}"
        print(f"   JPEG decoded by {k:26s} hash {H(b)} {len(b)} bytes {diff}")
    print("   distinct decoded-pixel hashes across decoders for ONE jpeg file:", len({H(b) for b in dec.values()}))
    pd = {"ffmpeg": ff(png)};
    if PIL_OK: pd["Pillow"] = Image.open(png).convert("RGB").tobytes()
    print("   PNG (lossless) decoded by", ", ".join(f"{k} {H(b)}" for k, b in pd.items()), "| distinct:", len(set(H(b) for b in pd.values())))
    for nm, extra in (("resize 50% then back", ["-vf", "scale=160:120,scale=320:240"]), ("jpeg re-encode q=2", ["-q:v", "2"]), ("jpeg re-encode q=10", ["-q:v", "10"])):
        o = os.path.join(TMP, "t_" + re.sub(r"\W", "", nm) + ".jpg"); sh(["ffmpeg", "-y", "-loglevel", "error", "-i", jpg, *extra, "-frames:v", "1", o])
        print(f"   accidental change '{nm}': decoded hash {H(ff(o))} vs original {H(base)} -> {'same' if ff(o)==base else 'DIFFERENT'}")
except Exception as e: print("   E4 failed:", repr(e)[:200])

# ---------- E5 audio ----------
print("E5 audio: accidental changes and non-speech, through whisper.cpp (base.en)")
WH = shutil.which("whisper-cli"); MODEL = os.path.expanduser("~/.cache/whisper/ggml-base.en.bin")
def tr(wav):
    r = sh([WH, "-m", MODEL, "-f", wav, "-nt", "-np", "-l", "en"], timeout=180)
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]|\([^)]*\)", " ", r.stdout)).strip()
norm = lambda s: re.findall(r"[a-z0-9']+", s.lower())
def wer(ref, hyp):
    r, h = norm(ref), norm(hyp)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        p, d[0] = d[0], i
        for j in range(1, len(h) + 1): p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (r[i - 1] != h[j - 1]))
    return d[len(h)] / max(len(r), 1)
try:
    assert WH and os.path.exists(MODEL) and shutil.which("say")
    SENT = "The first provisional marine brigade was formed in nineteen twelve for duty in Cuba, and it was disbanded in nineteen fifty after five brief activations."
    aiff = os.path.join(TMP, "s.aiff"); sh(["say", "-o", aiff, SENT]); base = os.path.join(TMP, "s.wav")
    sh(["ffmpeg", "-y", "-loglevel", "error", "-i", aiff, "-ar", "16000", "-ac", "1", base])
    ref = tr(base); print(f"   reference transcript of the spoken sentence: «{ref}»  (WER against the true text {wer(SENT, ref):.3f})")
    V = {"gain -12 dB": ["-af", "volume=-12dB"], "gain +6 dB": ["-af", "volume=6dB,alimiter=limit=0.95"], "loudnorm -23 LUFS (EBU R128 style)": ["-af", "loudnorm=I=-23:TP=-1:LRA=7"],
         "resample 8 kHz and back": ["-af", "aresample=8000,aresample=16000"], "mp3 64 kbit": None, "mp3 128 kbit": None,
         "2 s silence lead and trail": ["-af", "adelay=2000|2000,apad=pad_dur=2"], "white noise at 10 dB SNR": None, "white noise at 0 dB SNR": None}
    res = {}
    for k, af in V.items():
        o = os.path.join(TMP, re.sub(r"\W", "", k) + ".wav")
        if k.startswith("mp3"):
            br = "64k" if "64" in k else "128k"; m = os.path.join(TMP, "t.mp3"); sh(["ffmpeg", "-y", "-loglevel", "error", "-i", base, "-b:a", br, m]); sh(["ffmpeg", "-y", "-loglevel", "error", "-i", m, "-ar", "16000", "-ac", "1", o])
        elif "noise" in k:
            snr = 10 if "10" in k else 0; n = os.path.join(TMP, "n.wav"); sh(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anoisesrc=d=12:c=white:r=16000:a=0.5", "-ar", "16000", n])
            sh(["ffmpeg", "-y", "-loglevel", "error", "-i", base, "-i", n, "-filter_complex", f"[1:a]volume={10**(-snr/20)*0.1:.4f}[n];[0:a][n]amix=inputs=2:duration=first:normalize=0", o])
        else: sh(["ffmpeg", "-y", "-loglevel", "error", "-i", base, *af, "-ar", "16000", "-ac", "1", o])
        t = tr(o); res[k] = (wer(ref, t), t)
        print(f"   {k:38s} WER vs reference {res[k][0]:.3f}  «{t[:90]}»")
    print("   non-speech controls (any words returned are hallucination):")
    ctl = {"10 s digital silence": ["-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono", "-t", "10"], "10 s white noise": ["-f", "lavfi", "-i", "anoisesrc=d=10:c=white:r=16000:a=0.1"], "10 s brown noise": ["-f", "lavfi", "-i", "anoisesrc=d=10:c=brown:r=16000:a=0.3"],
           "10 s 440 Hz tone": ["-f", "lavfi", "-i", "sine=f=440:d=10:r=16000"], "10 s chord (3 sines)": ["-f", "lavfi", "-i", "sine=f=262:d=10:r=16000", "-f", "lavfi", "-i", "sine=f=330:d=10:r=16000", "-filter_complex", "amix=inputs=2:normalize=0"]}
    nwords = 0
    for k, args in ctl.items():
        o = os.path.join(TMP, "c_" + re.sub(r"\W", "", k) + ".wav"); sh(["ffmpeg", "-y", "-loglevel", "error", *args, "-ar", "16000", "-ac", "1", o]); t = tr(o); nwords += len(norm(t))
        print(f"      {k:24s} -> {len(norm(t))} words «{t[:80]}»")
    print("   total words invented over the five non-speech controls:", nwords)
except AssertionError: print("   E5 skipped: whisper-cli, its model or `say` missing")
except Exception as e: print("   E5 failed:", repr(e)[:300])
print("tmp files left in", TMP)
