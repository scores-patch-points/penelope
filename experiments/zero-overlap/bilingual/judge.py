import json, re, sys, random, collections, unicodedata
import statistics
SEED=20261118
P=json.load(open('pairs.json'))
def toks(s):
    s=unicodedata.normalize('NFC',s.lower()); return [w[:5] for w in re.findall(r"[a-zàâçéèêëîïôûùüœæ]{3,}",s)]
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
    F=set(q['ft']); return sum(1 for w in probes(p,M,tier) if M['lic'].get(w,set())&F)
def evaluate(test,M,tier,minscore=1):
    rng=random.Random(SEED); res={'tp':0,'n':0,'sup':0,'sn':0,'p1':0,'newframe':0}
    by_scene=collections.defaultdict(list)
    for p in test: by_scene[p['scene']].append(p)
    for p in test:
        L=len(p['ft']); pool=[q for q in test if q is not p and abs(len(q['ft'])-L)<=max(5,0.3*L)]
        nulls=[score(p,q,M,tier) for q in rng.sample(pool,min(50,len(pool)))] if pool else [0]
        thr=max(nulls); s=score(p,p,M,tier)   # p's own French is p['ft'] (score(p,q) uses q's French)
        same=lambda x: x>thr and x>=minscore
        sup=[q for q in by_scene[p['scene']] if q is not p]; sc=[score(p,q,M,tier) for q in sup]
        res['n']+=1; res['tp']+=same(s)
        res['sn']+=len(sup); res['sup']+=sum(same(x) for x in sc)
        res['p1']+= s>max(sc,default=-1) and s>0
        res['newframe']+= same(s) and any(same(x) for x in sc)
    return {k:v for k,v in res.items()}
def summarize(name,r):
    tpr=r['tp']/r['n']; fa=r['sup']/max(1,r['sn']); ba=(tpr+(1-fa))/2
    print(f"{name:26s} n={r['n']} TP {tpr:.3f}  suitor-pass {fa:.3f}  BA {ba:.3f}  P@1 {r['p1']/r['n']:.3f}  new_frame {r['newframe']/r['n']:.3f}")
    return ba,fa
mode=sys.argv[1]
if mode=='dev':
    tr=[p for p in P if p['act']<=2]; te=[p for p in P if p['act']==3]; M=induce(tr)
    print('induced on',len(tr),'pairs; licensed (e,f) pairs:',M['npairs'])
    cur=None
    for name,tier,ms in [('T_all','all',1),('T_rare','rare',1),('T_rare2','rare',2),('T_mid','mid',1),('T_mid2','mid',2)]:
        ba,fa=summarize(name,evaluate(te,M,tier,ms))
        if cur is None or (ba>cur[0] and fa<=cur[1]): cur=(ba,fa,name); print('   ADMITTED')
        else: print('   refused')
    print('chosen:',cur[2]); json.dump({'rung':cur[2]},open('chosen.json','w'))
if mode=='held':
    tr=[p for p in P if p['act']<=3]; te=[p for p in P if p['act']>=4]; M=induce(tr); ch=json.load(open('chosen.json'))['rung']
    print('held-out, rung',ch,'induced on',len(tr),'licensed',M['npairs'])
    tier,ms={'T_all':('all',1),'T_rare':('rare',1),'T_rare2':('rare',2),'T_mid':('mid',1),'T_mid2':('mid',2)}[ch]
    summarize('HELD-OUT '+ch,evaluate(te,M,tier,ms))
    summarize('HELD-OUT T_all (ref)',evaluate(te,M,'all',1))
if mode=='ladder':   # mirrors penelope organs/frame-verdicts.mjs judgeFrames; DEV ONLY (held-out was spent in one run, see RESULT.md)
    tr=[p for p in P if p['act']<=2]; te=[p for p in P if p['act']==3]; M=induce(tr)
    ladders={'T_all':[('all',1)],'T_all>T_mid2':[('all',1),('mid',2)],'T_all>T_mid>T_mid2':[('all',1),('mid',1),('mid',2)]}
    def thr_for(p,tier,pool_te,rng):
        L=len(p['ft']); pool=[q for q in pool_te if q is not p and abs(len(q['ft'])-L)<=max(5,0.3*L)]
        return max([score(p,q,M,tier) for q in rng.sample(pool,min(50,len(pool)))] or [0])
    for name,lad in ladders.items():
        rng=random.Random(SEED); by_scene=collections.defaultdict(list)
        for p in te: by_scene[p['scene']].append(p)
        tp=fn=fa=tn=0; gaps=0; nf=0
        for p in te:
            thr={ (t,m):thr_for(p,t,te,rng) for t,m in lad}
            passes=lambda q,t,m: (lambda s: s>thr[(t,m)] and s>=m)(score(p,q,M,t))
            def decide(cands_rival_scene, claim):
                for t,m in lad:
                    if not passes(claim,t,m): return 'other'
                    if not any(passes(r,t,m) for r in cands_rival_scene): return 'same'
                return 'gap'
            rivals=[q for q in by_scene[p['scene']] if q is not p]
            v=decide(rivals,p); gaps+=v=='gap'; tp+=v=='same'; fn+=v!='same'
            for q in rivals:   # each suitor as claimant, the true pair and the rest as rivals
                v2=decide([r for r in by_scene[p['scene']] if r is not q],q); fa+=v2=='same'; tn+=v2!='same'
        ba=(tp/(tp+fn)+tn/(tn+fa))/2
        print(f"{name:22s} TP {tp/(tp+fn):.3f}  FA {fa/(fa+tn):.3f}  BA {ba:.3f}  gap {gaps/(tp+fn):.3f}")
