"""python3 test_context_nom.py : the guarantees of the context-nomination harness's pure parts (no embedder needed): no-regex tokenizing, name-bearing sentences, the paraphrase builder, windows, the union, the fold."""
import ast, sys, collections, random
import numpy as np
import context_nom as C
from fold_nom import Fold, rank_sentences

def test_no_regex_in_the_builder():
    for f in ("context_nom.py", "fold_nom.py"):                          # the module imports no `re`, and the builder's functions use no regex object
        tree = ast.parse(open(f).read())
        mods = [a.name for n in ast.walk(tree) if isinstance(n, ast.Import) for a in n.names] + [n.module for n in ast.walk(tree) if isinstance(n, ast.ImportFrom)]
        assert "re" not in mods, (f, mods)
        assert not [n for n in ast.walk(tree) if isinstance(n, ast.Attribute) and isinstance(n.value, ast.Name) and n.value.id == "re"], f
def test_tokens():
    assert C.toks2("Hüningen, Cap-Ferrat; 3 p.m.!") == ["huningen", "cap", "ferrat", "3", "p", "m"]
    assert C.toks2("") == [] and C.toks2("  ,, ") == []
    assert C.content("The Siege of Calais") == ["siege", "calais"]
def test_name_bearing_is_set_membership_not_substring():
    S = ["Bell defeated Greene.", "The campbell clan.", "Greene fled; Bell wrote.", "Nothing here."]
    assert C.name_bearing(None, "Bell", S) == [0, 2], "campbell contains 'bell' as a substring but is not the token bell"
    assert C.name_bearing(None, "Bell Greene", S) == [0, 2] and C.name_bearing(None, "Black Jack", S) == []
    assert C.name_bearing(None, "of the", S) == [], "a name of stop words has no content token: bears nothing"
def test_paraphrase_is_the_first_k_in_document_order():
    S = [f"s{i} bell." for i in range(9)]; h = C.name_bearing(None, "Bell", S)
    assert C.paraphrase(S, h) == " ".join(S[:5]) and C.paraphrase(S, [7, 2, 5], k=2) == S[2] + " " + S[5]
def test_windows():
    S = ["a", "b", "c", "d"]
    assert C.windows(S, 1) == S and C.windows(S, 3) == ["a b", "a b c", "b c d", "c d"] and C.windows(S, 5)[1] == "a b c d"
def test_interleave_is_size_matched_round_robin_distinct():
    assert C.interleave([1, 2, 3], [9, 2, 8], k=4) == [1, 9, 2, 3] and C.interleave([1], [1], k=3) == [1] and len(C.interleave(list(range(20)), list(range(20, 40)), k=10)) == 10
def test_rank_excludes_and_is_stable():
    E = np.eye(3); assert C.rank(E, np.array([1.0, 1.0, 0.0]), exclude=[1]) == [0, 2] and C.rank(E, np.array([0.0, 0.0, 0.0])) == [0, 1, 2]
def test_shuffled_frequent_uses_the_most_frequent_content_words():
    S = ["alpha beta alpha", "alpha gamma", "the beta"]; out = C.shuffled_frequent(S, 2, random.Random(1)).split()
    assert sorted(out) == ["alpha", "beta"] and C.shuffled_frequent(S, 0, random.Random(1)) == ""
def test_fold_folds_words_of_one_company_and_not_others():
    rng = random.Random(7); docs = []; V = [f"w{i}" for i in range(300)]
    for _ in range(400): docs.append([rng.choice(V) for _ in range(80)])               # a dense random background: most pairs co-occur a little, so the spread of cosines is not degenerate
    for _ in range(300):        # "king" and "monarch" keep the same company (crown, throne, realm, rules); "pencil" keeps another
        a = rng.choice(["king", "monarch"]); docs.append([x for s_ in ([a, "crown", "throne", "realm", "rules"] * 3) for x in (s_, rng.choice(V), rng.choice(V))])
        docs.append([x for s_ in (["pencil", "paper", "desk", "erase", "ink"] * 3) for x in (s_, rng.choice(V), rng.choice(V))])
    f = Fold(docs); k = f.klass("king")
    assert "monarch" in k and "pencil" not in k and "king" in k, k
    assert f.klass("zzzunseen") == {"zzzunseen"}, "a word outside the vocabulary folds to itself only"
    g = Fold([["a", "b", "c", "d", "e"] * 20] * 3); assert g.klass("a") == {"a"}, "a degenerate spread (MAD 0) folds nothing: a typed no-fold, never a guess"
def test_fold_threshold_is_derived_from_the_vocabulary_size():
    import math
    docs = [["a", "b", "c", "d", "e"] * 3] * 4; f = Fold(docs); assert abs(f.thr - math.sqrt(2 * math.log(f.V))) < 1e-12
def test_fold_scoring_excludes_name_sentences_and_counts_a_class_once_per_window():
    docs = [["king", "crown", "throne", "realm"] * 3, ["monarch", "crown", "throne", "realm"] * 3] * 100
    f = Fold(docs); sents = [["king", "crown"], ["monarch", "crown"], ["pencil", "ink"], ["monarch", "monarch", "monarch"]]
    r = C_rank = rank_sentences(f, ["king"], sents, 1, exclude=[0])
    assert 0 not in r and r[0] in (1, 3), r
    r3 = rank_sentences(f, ["king"], sents, 3, exclude=[0]); assert r3.index(1) < r3.index(2), "a sentence beside a class carrier outranks one that is not"
    beside = [["ink"], ["ink"], ["king"], ["ink"]]; rw = rank_sentences(f, ["king"], beside, 3, exclude=[2]); assert rw[:2] == [1, 3] and rw[2] == 0, ("the window carries the class to the sentences beside it", rw)
    assert rank_sentences(f, ["king"], beside, 1, exclude=[2]) == [0, 1, 3], "a window of 1 sees only the sentence itself: all tie, document order"
if __name__ == "__main__":
    for n, f in list(globals().items()):
        if n.startswith("test_"): f(); print("ok", n)
