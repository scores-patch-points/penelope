import json, re, sys, random, collections, unicodedata
import statistics
SEED=20261118
LANG=sys.argv[2]
P=json.load(open(LANG+'/pairs.json'))
def toks(s):
    s=unicodedata.normalize('NFC',s.lower()); return [w[:5] for w in re.findall(r"[a-zàâçéèêëîïôûùüœæäößßа-яёђ]{3,}",s)]
for p in P: p['et']=toks(p['en']); p['ft']=toks(p['fr'])
def induce(train):
    dfe=collections.Counter(); dff=collections.Counter()
    for p in train: dfe.update(set(p['et'])); dff.update(set(p['ft']))
    stop_e=set(sorted(dfe,key=lambda w:(-dfe[w],w))[:50]); stop_f=set(sorted(dff,key=lambda w:(-dff[w],w))[:50])
    E=[{w for w in p['et'] if w not in stop_e} for p in train]; F=[{w for w in p['ft'] if w not in stop_f} for p in train]
    def counts(Fp):
        C=collections.Counter()
        for e,f in zip(E,Fp):
            for x in sorted(e):
                for y in sorted(f): C[(x,y)]+=1
        return C
    C=counts(F); rng=random.Random(SEED); scenes=collections.defaultdict(list)
    for i,p in enumerate(train): scenes[p['scene']].append(i)
    mx=collections.Counter(); cand=sorted(k for k,v in C.items() if v>=2)
    for k in range(50):
        perm=list(range(len(train)))
        for idx in scenes.values():
            sh=idx[:]; rng.shuffle(sh)
            for a_,b_ in zip(idx,sh): perm[a_]=b_
        N=counts([F[j] for j in perm])
        for key in cand:
            if N.get(key,0)>mx[key]: mx[key]=N[key]
    lic=collections.defaultdict(set); n=0
    for key in cand:
        if C[key]>mx[key]: lic[key[0]].add(key[1]); n+=1
    return {'lic':lic,'stop_e':stop_e,'stop_f':stop_f,'dfe':dfe,'n':len(train),'npairs':n}
def probes(p,M,tier):
    ts=[w for w in set(p['et']) if w not in M['stop_e']]
    if tier=='all': return ts
    if tier=='mid':
        med=statistics.median([M['dfe'][w] for w in M['lic']]) if M['lic'] else 0
        return [w for w in ts if w in M['lic'] and M['dfe'].get(w,0)<=med]
    med=statistics.median([M['dfe'][w] for w in M['dfe']]) if M['dfe'] else 0
    return [w for w in ts if M['dfe'].get(w,0)<=med and w in M['lic']]
def score(p,q,M,tier):
    if tier=='root': return len(set(re.findall(r'\d{2,}',p['en']))&set(re.findall(r'\d{2,}',q['fr'])))
    F=set(q['ft']); return sum(1 for w in probes(p,M,tier) if M['lic'].get(w,set())&F)

def base_score(p,q,M):
    A={w for w in p['et'] if w not in M['stop_e']}; B={w for w in q['ft'] if w not in M['stop_f']}
    return len(A&B)
def evaluate(test,M,tier,minscore=1):
    LOWMAX=json.load(open(LANG+'/lowthr.json'))['low_max']
    rng=random.Random(SEED); acc=collections.defaultdict(lambda:{'tp':0,'n':0,'sup':0,'sn':0})
    by_scene=collections.defaultdict(list)
    for p in test: by_scene[p['scene']].append(p)
    for p in test:
        L=len(p['ft']); pool=[q for q in test if q is not p and abs(len(q['ft'])-L)<=max(5,0.3*L)]
        sm=rng.sample(pool,min(50,len(pool))) if pool else []
        thr_l=max([score(p,q,M,tier) for q in sm] or [0]); thr_b=max([base_score(p,q,M) for q in sm] or [0])
        bs=base_score(p,p,M); strata=[('ZERO' if bs==0 else 'SOME')]+(['LOW'] if bs<=LOWMAX else [])
        sups=[q for q in by_scene[p['scene']] if q is not p]
        for name,sc,thr,ms in (('loop',lambda a,b:score(a,b,M,tier),thr_l,minscore),('baseline',lambda a,b:base_score(a,b,M),thr_b,1)):
            same=lambda x:x>thr and x>=ms
            for key in strata+['ALL']:
                a=acc[(name,key)]; a['n']+=1; a['tp']+=same(sc(p,p)); a['sn']+=len(sups); a['sup']+=sum(same(sc(p,q)) for q in sups)
    return acc
def report(acc,tag):
    out={}
    for (name,key),a in sorted(acc.items()):
        tpr=a['tp']/a['n'] if a['n'] else 0; fa=a['sup']/a['sn'] if a['sn'] else 0
        print(f"{tag:8s} {name:9s} {key:5s} n={a['n']:3d}  TP {tpr:.3f}  suitor-pass {fa:.3f}  BA {(tpr+1-fa)/2:.3f}"); out[(name,key)]=((tpr+1-fa)/2,fa)
    return out
mode=sys.argv[1]
if mode=='dev':
    tr=[p for p in P if p['act']<=2]; te=[p for p in P if p['act']==3]; M=induce(tr)
    print('induced on',len(tr),'licensed',M['npairs'],'dev n',len(te))
    cur=None
    for name,tier,ms in [('T_root','root',1),('T_all','all',1),('T_mid','mid',1),('T_mid2','mid',2)]:
        r=report(evaluate(te,M,tier,ms),name)[('loop','ALL')]
        if cur is None or (r[0]>cur[0] and r[1]<=cur[1]): cur=(r[0],r[1],name); print('   ADMITTED')
        else: print('   refused')
    print('chosen:',cur[2]); json.dump({'rung':cur[2]},open(LANG+'/chosen.json','w'))
if mode=='held':
    tr=[p for p in P if p['act']<=3]; te=[p for p in P if p['act']>=4]; M=induce(tr); ch=json.load(open(LANG+'/chosen.json'))['rung']
    tier,ms={'T_root':('root',1),'T_all':('all',1),'T_mid':('mid',1),'T_mid2':('mid',2)}[ch]
    print('HELD-OUT',LANG,'rung',ch,'induced on',len(tr),'licensed',M['npairs'],'n',len(te))
    report(evaluate(te,M,tier,ms),'held')
