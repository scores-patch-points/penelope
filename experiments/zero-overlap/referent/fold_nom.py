"""fold_nom.py: the MECHANICAL PARAPHRASE FOLD of khora identity/novels PREREG-PARAPHRASE (round 2), no model, no word list, no regex, no threshold set by hand.
Two words fold when the evidence that they occur in the same company is high relative to the word's own spread: PPMI context vectors over a window of +-4 words (word types with >= 5 occurrences in the background), cosine of the query word with every vocabulary word,
the median and 1.4826 x MAD of that word's cosines over ALL vocabulary as the relative unit, fold iff robust z >= sqrt(2 ln V) (the universal threshold for V comparisons, derived from V). A class = the word and the words folded to it.
DEVIATIONS from khora's design, stated: no lemma lexicon (it needs khora's per-book lexicon); the background is the whole set's text (every document of the set, the target included; text only, never links); the vector of a word is over the contexts of the whole background."""
import math, collections

class Fold:
    def __init__(self, docs_tokens, window=4, minocc=5):
        cnt = collections.Counter(t for d in docs_tokens for t in d)
        self.vocab = {w for w, c in cnt.items() if c >= minocc}; self.V = len(self.vocab)
        cooc = collections.defaultdict(collections.Counter)
        for d in docs_tokens:
            seq = [t for t in d if t in self.vocab]
            for i, w in enumerate(seq):
                for j in range(max(0, i - window), min(len(seq), i + window + 1)):
                    if j != i: cooc[w][seq[j]] += 1
        row = {w: sum(c.values()) for w, c in cooc.items()}; col = collections.Counter()
        for w, c in cooc.items():
            for u, n in c.items(): col[u] += n
        N = sum(row.values()) or 1
        self.vec, self.norm, self.index = {}, {}, collections.defaultdict(list)
        for w, c in cooc.items():
            v = {}
            for u, n in c.items():
                p = math.log2(n * N / (row[w] * col[u]))
                if p > 0: v[u] = p
            if v:
                self.vec[w] = v; self.norm[w] = math.sqrt(sum(x * x for x in v.values()))
                for u, p in v.items(): self.index[u].append((w, p))
        self.thr = math.sqrt(2 * math.log(self.V)) if self.V > 1 else float("inf"); self._cache = {}
    def klass(self, w):
        """the class of w: {w} plus every vocabulary word whose cosine with w is a robust z >= sqrt(2 ln V) above w's own spread; {w} alone when w is not in the vocabulary or the spread is degenerate"""
        if w in self._cache: return self._cache[w]
        out = {w}
        if w in self.vec:
            dot = collections.defaultdict(float)
            for u, p in self.vec[w].items():
                for v, q in self.index[u]: dot[v] += p * q
            cos = {v: d / (self.norm[w] * self.norm[v]) for v, d in dot.items() if v != w and self.norm.get(v)}
            allv = sorted(list(cos.values()) + [0.0] * max(0, self.V - 1 - len(cos)))
            if allv:
                med = allv[len(allv) // 2]; dev = sorted(abs(x - med) for x in allv); mad = 1.4826 * dev[len(dev) // 2]
                if mad > 0: out |= {v for v, c in cos.items() if (c - med) / mad >= self.thr}
        self._cache[w] = out; return out

def rank_sentences(fold, name_tokens, sent_tokens, window, exclude=()):
    """M1: a sentence's score is the sum, over the name tokens' fold classes, of the class's surprisal (-log2 share of sentences carrying any member) when the class is carried anywhere in the window around the sentence (each class once per window)"""
    n = len(sent_tokens); sets = [set(t) for t in sent_tokens]; classes = []
    for w in name_tokens:
        c = fold.klass(w); carry = [bool(c & s) for s in sets]; k = sum(carry)
        if k: classes.append((-math.log2(k / n), carry))
    h = (window - 1) // 2; score = []
    for i in range(n):
        lo, hi = max(0, i - h), min(n, i + h + 1); score.append(sum(sv for sv, carry in classes if any(carry[lo:hi])))
    ex = set(exclude)
    return [i for i in sorted(range(n), key=lambda i: (-score[i], i)) if i not in ex]
