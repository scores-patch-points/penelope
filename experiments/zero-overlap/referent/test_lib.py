"""python3 test_lib.py : the builder's guarantees (gold offsets exact, byte addresses re-open, drift refused, anchor typing)."""
import json, glob
from lib import *
def test():
    wt = "The [[Pequod (ship)|ship]] &amp; the [[Ahab|old man]] sailed.&nbsp;He was [[Ahab|Captain Ahab]]. Zoë saw [[Moby Dick]] at 3 p.m. today."
    d = build_doc("T", 1, wt, {})
    for l in d["links"]: assert d["text"][l["c0"]:l["c1"]] == l["anchor"]
    assert [l["target"] for l in d["links"]] == ["Pequod (ship)", "Ahab", "Ahab", "Moby Dick"], d["links"]
    tb = d["text"].encode("utf-8")
    for s in d["sentences"]:
        a = address(tb, s["b0"], s["b1"]); assert reopen(tb, a) == d["text"][s["c0"]:s["c1"]] and a["sha256"] == s["sha256"]
    a = address(tb, d["sentences"][0]["b0"], d["sentences"][0]["b1"])
    bad = bytearray(tb); bad[d["sentences"][0]["b0"]] ^= 1
    for chk in (True, False):
        try: reopen(bytes(bad), a, check_doc=chk); raise SystemExit("drift not refused")
        except Refused: pass
    assert anchor_type("Thailand", "Siam") == "DIFFERENT" and anchor_type("Herman Melville", "Melville") == "PARTIAL" and anchor_type("Ahab", "Captain Ahab") == "SAME"
    assert not zero_overlap("Cochinchina", "the Cochin-China war") and zero_overlap("Tuscany", "the region was green")
    for f in glob.glob("data/dev/*.json"):
        x = json.load(open(f))
        for l in x["links"]: assert x["text"][l["c0"]:l["c1"]] == l["anchor"]
    print("test_lib ok")
test()
