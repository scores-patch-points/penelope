# Retrieval pool: for every article, the true counterpart plus up to 59 same-category candidates, with string scores and organ-ready nodes (PREREG-SURF).
import json, re, random, collections
exec(open("asker7_dump.py").read().split("\nout=[]\nfor lang in LANGS:")[0])      # loads the frozen extractors and nodes()
rng=random.Random(20261118)
TOK=re.compile(r"[a-zàâçéèêëîïôûùüœæäößа-яё]{3,}")
def toks(s): return {w[:5] for w in TOK.findall(s.lower())}
SETS=['fresh','fresh2','fresh3','fresh4','fresh5','fresh6','fresh7']
out=[]
for lang in ('fr','de'):
    P=[]
    for s in SETS:
        try:
            for p in json.load(open(f'{s}-{lang}.json')): P.append(dict(p,set=s))
        except FileNotFoundError: pass
    dfe=collections.Counter(); dfo=collections.Counter()
    for p in P: dfe.update(toks(p['en'])); dfo.update(toks(p['fr']))
    stop_e={w for w,_ in dfe.most_common(50)}; stop_o={w for w,_ in dfo.most_common(50)}
    for p in P: p['_te']=toks(p['en'])-stop_e; p['_to']=toks(p['fr'])-stop_o; p['_n']=None
    by=collections.defaultdict(list)
    for p in P: by[(p['set'],p['scene'])].append(p)
    for p in P:
        mates=[q for q in by[(p['set'],p['scene'])] if q is not p]
        pick=rng.sample(mates,min(59,len(mates)))
        if not pick: continue
        en=nodes(p['en'],p['title']); cands=[]
        for q in [p]+pick:
            if q['_n'] is None: q['_n']=nodes(q['fr'],q['title'])
            cands.append({'true':q is p,'nodes':q['_n'],'str':len(p['_te']&q['_to']),'noise':rng.random()})
        out.append({'lang':lang,'set':p['set'],'title':p['title'],'en':en,'cands':cands})
json.dump(out,open('surf-pool.json','w'))
print('articles',len(out),'mean pool',sum(len(o['cands']) for o in out)/len(out))
