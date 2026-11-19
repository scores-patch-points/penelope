import json, re, sys, random, collections
SEED=20261118; mode=sys.argv[1]
tok=lambda s:{w[:5] for w in re.findall(r"[a-z]{3,}",s.lower())}
trn=json.load(open('train.json')); tst=json.load(open('test.json'))
cut=int(len(trn)*2/3); trn.sort(key=lambda r:r['idx'])
if mode=='dev': ind,te=trn[:cut],trn[cut:]
else: ind,te=trn,tst
for r in ind+te: r['a']=tok(r['sentence1']); r['b']=tok(r['sentence2']); r['jac']=len(r['a']&r['b'])/max(1,len(r['a']|r['b']))
df=collections.Counter()
for r in ind: df.update(r['a']); df.update(r['b'])
STOP=set(sorted(df,key=lambda w:(-df[w],w))[:50])
pos=[r for r in ind if r['label']==1]
E=[r['a']-STOP for r in pos]; F=[r['b']-STOP for r in pos]
def counts(Fp):
    C=collections.Counter()
    for e,f in zip(E,Fp):
        for x in e:
            for y in f:
                if x!=y: C[(x,y)]+=1
    return C
C=counts(F); rng=random.Random(SEED); cand=sorted(k for k,v in C.items() if v>=2); mx=collections.Counter()
for k in range(50):
    perm=list(range(len(pos))); rng.shuffle(perm); N=counts([F[j] for j in perm])
    for key in cand:
        if N.get(key,0)>mx[key]: mx[key]=N[key]
LIC=collections.defaultdict(set)
for key in cand:
    if C[key]>mx[key]: LIC[key[0]].add(key[1])
print(mode,'induced on',len(pos),'same-pairs; licensed',sum(len(v) for v in LIC.values()),'test',len(te))
def r0(a,b): return len((a-STOP)&(b-STOP))
def r1(a,b): B=b-STOP; return sum(1 for x in a-STOP if LIC.get(x,set())&B)
def r2(a,b): return r0(a,b)+r1(a,b)
RUNGS={'R0':r0,'R1':r1,'R2':r2}
rng=random.Random(SEED); allb=[(r['b'],len(r['b'])) for r in te]
def thr(a,L,f):
    pool=[b for b,l in allb if abs(l-L)<=max(5,0.3*L)]; sm=rng.sample(pool,min(50,len(pool))) if pool else []
    return max([f(a,b) for b in sm] or [0])
res=collections.defaultdict(lambda:collections.Counter())
for r in te:
    strata=['ALL']+(['LOW'] if r['jac']<0.3 else [])
    t={n:thr(r['a'],len(r['b']),f) for n,f in RUNGS.items()}
    ok={n:(f(r['a'],r['b'])>t[n] and f(r['a'],r['b'])>=1) for n,f in RUNGS.items()}
    for n in RUNGS:
        for s in strata:
            if r['label']==1:
                res[(n,s)]['tp']+=ok[n]; res[(n,s)]['np']+=1
                for _ in range(10):
                    o=te[rng.randrange(len(te))]
                    if o is r: continue
                    res[(n,s)]['fr']+=(RUNGS[n](r['a'],o['b'])>t[n] and RUNGS[n](r['a'],o['b'])>=1); res[(n,s)]['nr']+=1
            else: res[(n,s)]['fh']+=ok[n]; res[(n,s)]['nh']+=1
out={}
for (n,s),c in sorted(res.items(),key=lambda x:(x[0][1],x[0][0])):
    tp=c['tp']/max(c['np'],1); fh=c['fh']/max(c['nh'],1); fr=c['fr']/max(c['nr'],1); ba=(tp+1-fh)/2; out[(n,s)]=(ba,fh)
    print(f"  {s:4s} {n} n_same={c['np']:4d} n_notsame={c['nh']:4d}  TP {tp:.3f}  FA_hard {fh:.3f}  FA_rand {fr:.3f}  BA {ba:.3f}")
if mode=='dev':
    b,a=out[('R0','ALL')],out[('R2','ALL')]; adm=a[0]>b[0] and a[1]<=b[1]
    print('ADMIT R2 over R0:',adm,f'(BA {b[0]:.3f}->{a[0]:.3f}, FA_hard {b[1]:.3f}->{a[1]:.3f})'); json.dump({'rung':'R2' if adm else 'R0'},open('chosen.json','w'))
else: print('chosen on dev:',json.load(open('chosen.json')))
