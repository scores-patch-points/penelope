import sys, json, math, random, collections, re, unicodedata
sys.path.insert(0,'.')
import referents as R
LANG=sys.argv[1]; MODE=sys.argv[2]
WT=json.load(open('wt-cache.json')); SEED=20261118
def load(fs):
    P=[]; off=0
    for f in fs:
        for p in json.load(open(f)): p=dict(p); p['scene']=p['scene']+off; P.append(p)
        off+=1000
    return P
IND=load([f'fresh-{LANG}.json',f'fresh2-{LANG}.json']); DEV=load([f'fresh3-{LANG}.json',f'fresh4-{LANG}.json']); HELD=load([f'fresh5-{LANG}.json'])
def links(lang,t,own):
    wt=WT[lang].get(t)
    if wt is None: return None
    return {x for x in R.extract_links(wt) if x.lower()!=own.lower()}
def prep(P):
    out=[]
    for p in P:
        le=links('en',p['title'],p['title']); lo=links(LANG,p['title'],p['title'])
        if le is None or lo is None: continue
        p['LE']=le; p['LO']=lo; out.append(p)
    return out
IND=prep(IND); DEV=prep(DEV); HELD=prep(HELD)
def fold(s): return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn')
def toks(s):
    s=unicodedata.normalize('NFC',s.lower()); return {w[:5] for w in re.findall(r"[a-zàâçéèêëîïôûùüœæäößß]{3,}",s)}
for p in IND+DEV+HELD: p['et']=toks(p['en']); p['ft']=toks(p['fr'])
# --- STOP and bridges from INDUCTION only
dfe=collections.Counter(); dfo=collections.Counter()
for p in IND: dfe.update(p['LE']); dfo.update(p['LO'])
STE=set(x for x,_ in sorted(dfe.items(),key=lambda kv:(-kv[1],kv[0]))[:50]); STO=set(x for x,_ in sorted(dfo.items(),key=lambda kv:(-kv[1],kv[0]))[:50])
dft=collections.Counter(); dff=collections.Counter()
for p in IND: dft.update(p['et']); dff.update(p['ft'])
TE=set(sorted(dft,key=lambda w:(-dft[w],w))[:50]); TF=set(sorted(dff,key=lambda w:(-dff[w],w))[:50])
def counts(OT):
    C=collections.Counter()
    for p,lo in zip(IND,OT):
        for x in p['LE']-STE:
            for y in lo-STO: C[(x,y)]+=1
    return C
C=counts([p['LO'] for p in IND]); cand=sorted(k for k,v in C.items() if v>=2)
rng=random.Random(SEED); scenes=collections.defaultdict(list)
for i,p in enumerate(IND): scenes[p['scene']].append(i)
mx=collections.Counter()
for k in range(50):
    perm=list(range(len(IND)))
    for idx in scenes.values():
        sh=idx[:]; rng.shuffle(sh)
        for a,b in zip(idx,sh): perm[a]=b
    N=counts([IND[j]['LO'] for j in perm])
    for key in cand:
        if N.get(key,0)>mx[key]: mx[key]=N[key]
LIC=collections.defaultdict(set)
for key in cand:
    if C[key]>mx[key]: LIC[key[0]].add(key[1])
nb=sum(len(v) for v in LIC.values())
def b_score(p,q): return sum(1 for x in p['LE']-STE if LIC.get(x,set())&(q['LO']-STO))
def n_score(p,q): return len({fold(x) for x in p['LE']}&{fold(y) for y in q['LO']})
def t_score(p,q): return len((p['et']-TE)&(q['ft']-TF))
def wil(k,n):
    if n==0: return (float('nan'),float('nan'))
    z=1.96; pp=k/n; d=1+z*z/n; c=pp+z*z/(2*n); h=z*math.sqrt(pp*(1-pp)/n+z*z/(4*n*n)); return ((c-h)/d,(c+h)/d)
def evaluate(test):
    rng=random.Random(SEED); by=collections.defaultdict(list)
    for p in test: by[p['scene']].append(p)
    acc=collections.defaultdict(collections.Counter)
    for p in test:
        L=len(p['LO']); pool=[q for q in test if q is not p and abs(len(q['LO'])-L)<=max(5,0.3*L)]
        sm=rng.sample(pool,min(50,len(pool))) if pool else []
        th={n:max([f(p,q) for q in sm] or [0]) for n,f in (('bridge',b_score),('tokens',t_score),('names',n_score))}
        bs=t_score(p,p); strata=['ALL','ZERO' if bs==0 else 'SOME']+(['LOW'] if bs<=1 else [])
        sups=[q for q in by[p['scene']] if q is not p]
        for n,f in (('bridge',b_score),('tokens',t_score),('names',n_score)):
            same=lambda x:x>th[n] and x>=1
            for s in strata:
                a=acc[(n,s)]; a['n']+=1; a['tp']+=same(f(p,p)); a['sn']+=len(sups); a['sup']+=sum(same(f(p,q)) for q in sups)
    return acc
test=DEV if MODE=='dev' else HELD
print(f"== {LANG} {MODE}: induction {len(IND)} pairs; licensed bridges {nb} (candidates {len(cand)}); test {len(test)} pairs")
acc=evaluate(test)
for s in ('ALL','ZERO','LOW','SOME'):
    for n in ('bridge','tokens','names'):
        a=acc.get((n,s))
        if not a or not a['n']: continue
        tp=a['tp']/a['n']; fa=a['sup']/max(a['sn'],1)
        print(f"   {s:4s} {n:6s} n={a['n']:4d} TP {tp:.3f} [{wil(a['tp'],a['n'])[0]:.3f},{wil(a['tp'],a['n'])[1]:.3f}] suitor-pass {fa:.4f} BA {(tp+1-fa)/2:.3f}")
json.dump({x:sorted(v) for x,v in LIC.items()},open(f'bridges-{LANG}.json','w'),ensure_ascii=False)
