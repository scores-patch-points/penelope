import sys, json, math, random, collections, re, unicodedata
LANG=sys.argv[1]; MODE=sys.argv[2]
K=json.load(open('khora-reads.json')); SEED=20261118
def fold(s): return ''.join(c for c in unicodedata.normalize('NFD',(s or '').lower()) if unicodedata.category(c)!='Mn').strip()
def load(fs):
    P=[]; off=0
    for f in fs:
        for p in json.load(open(f)): p=dict(p); p['scene']=p['scene']+off; P.append(p)
        off+=1000
    return P
DEV=load([f'fresh3-{LANG}.json',f'fresh4-{LANG}.json']); HELD=load([f'fresh5-{LANG}.json']); IND=load([f'fresh-{LANG}.json',f'fresh2-{LANG}.json'])
def faces(r):
    if not r or not r.get('refs'): return None
    subj=max(r['refs'],key=lambda x:(x['m'],-r['refs'].index(x)))['face']
    return {fold(x['face']) for x in r['refs'] if fold(x['face']) and fold(x['face'])!=fold(subj)}
def prep(P):
    out=[]
    for p in P:
        fe=faces(K['en'].get(p['title'])); fo=faces(K[LANG].get(p['title']))
        if fe is None or fo is None: continue
        p['FE']=fe; p['FO']=fo; out.append(p)
    return out
IND=prep(IND); DEV=prep(DEV); HELD=prep(HELD)
def toks(s):
    s=unicodedata.normalize('NFC',s.lower()); return {w[:5] for w in re.findall(r"[a-zàâçéèêëîïôûùüœæäößß]{3,}",s)}
for p in IND+DEV+HELD: p['et']=toks(p['en']); p['ft']=toks(p['fr'])
dfe=collections.Counter(); dfo=collections.Counter(); dft=collections.Counter(); dff=collections.Counter()
for p in IND: dfe.update(p['FE']); dfo.update(p['FO']); dft.update(p['et']); dff.update(p['ft'])
top=lambda c:set(x for x,_ in sorted(c.items(),key=lambda kv:(-kv[1],kv[0]))[:50])
SE,SO,TE,TF=top(dfe),top(dfo),top(dft),top(dff)
def k_score(p,q): return len((p['FE']-SE)&(q['FO']-SO))
def t_score(p,q): return len((p['et']-TE)&(q['ft']-TF))
def wil(k,n):
    if n==0: return (float('nan'),float('nan'))
    z=1.96; pp=k/n; d=1+z*z/n; c=pp+z*z/(2*n); h=z*math.sqrt(pp*(1-pp)/n+z*z/(4*n*n)); return ((c-h)/d,(c+h)/d)
test=DEV if MODE=='dev' else HELD
rng=random.Random(SEED); by=collections.defaultdict(list)
for p in test: by[p['scene']].append(p)
acc=collections.defaultdict(collections.Counter)
for p in test:
    L=len(p['FO']); pool=[q for q in test if q is not p and abs(len(q['FO'])-L)<=max(5,0.3*L)]
    sm=rng.sample(pool,min(50,len(pool))) if pool else []
    th={n:max([f(p,q) for q in sm] or [0]) for n,f in (('khora',k_score),('tokens',t_score))}
    bs=t_score(p,p); strata=['ALL','ZERO' if bs==0 else 'SOME']+(['LOW'] if bs<=1 else [])
    sups=[q for q in by[p['scene']] if q is not p]
    for n,f in (('khora',k_score),('tokens',t_score)):
        same=lambda x:x>th[n] and x>=1
        for s in strata:
            a=acc[(n,s)]; a['n']+=1; a['tp']+=same(f(p,p)); a['sn']+=len(sups); a['sup']+=sum(same(f(p,q)) for q in sups)
print(f"== {LANG} {MODE}: test pairs with a khora reading on both sides {len(test)}")
for s in ('ALL','ZERO','LOW'):
    for n in ('khora','tokens'):
        a=acc.get((n,s))
        if not a or not a['n']: continue
        tp=a['tp']/a['n']; fa=a['sup']/max(a['sn'],1)
        print(f"   {s:4s} {n:6s} n={a['n']:4d} TP {tp:.3f} [{wil(a['tp'],a['n'])[0]:.3f},{wil(a['tp'],a['n'])[1]:.3f}] suitor-pass {fa:.4f} BA {(tp+1-fa)/2:.3f}")
