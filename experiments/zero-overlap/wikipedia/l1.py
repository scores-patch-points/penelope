import sys, json, math, random, collections
sys.path.insert(0,'.')
import referents as R
LANG=sys.argv[1]; FILES=[f for f in sys.argv[2:] if f.endswith('.json')]; CHAIN='--chain' in sys.argv
WT=json.load(open('wt-cache.json'))
P=[]; off=0
for f in FILES:
    for p in json.load(open(f)): p=dict(p); p['scene']=p['scene']+off; P.append(p)
    off+=1000
by=collections.defaultdict(list)
for p in P: by[p['scene']].append(p)
def links(lang,t):
    wt=WT[lang].get(t) if lang!='en' else WT['en'].get(t)
    return R.extract_links(wt) if wt else None
def containers(lang,mem):
    """per member: container referent (Q-id or string-only) over the scene, language-independent rule of PREREG-L1."""
    L={p['title']:links(lang,p['title']) for p in mem}
    have=[t for t,v in L.items() if v is not None]; n=len(have)
    if n<4: return {}, 0, 0
    sdf=collections.Counter()
    for t in have:
        own=t.lower()
        for x in dict.fromkeys(L[t]): sdf[x]+=1
    cand=[x for x,c in sdf.items() if c>=2]
    res=R.resolve(lang,cand,0.3)
    ref={x:R.referent(lang,x,res) for x in cand}
    rdf=collections.Counter()
    pos={}
    for t in have:
        seen=[]
        for i,x in enumerate(L[t]):
            if x in ref: 
                r=ref[x]
                if r not in seen: seen.append(r)
        pos[t]=seen
        rdf.update(seen)
    out={}
    for t in have:
        c=[r for r in pos[t] if 2<=rdf[r]<=n//2]
        if not c: continue
        best=max(rdf[r] for r in c); out[t]=next(r for r in c if rdf[r]==best)
    nstr=sum(1 for r in ref.values() if r.startswith('str:'))
    return out, len(ref), nstr
def wil(k,n):
    if n==0: return (float('nan'),float('nan'))
    z=1.96; p=k/n; d=1+z*z/n; c=p+z*z/(2*n); h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n)); return ((c-h)/d,(c+h)/d)
CE={}; CO={}; tot_ref=tot_str=0
for sc,mem in by.items():
    e,a1,b1=containers('en',mem); o,a2,b2=containers(LANG,mem); CE.update(e); CO.update(o); tot_ref+=a1+a2; tot_str+=b1+b2
for p in P: p['ce']=CE.get(p['title']); p['co']=CO.get(p['title'])
print(f"== {LANG}: {len(P)} pairs; referent containers: EN {sum(1 for p in P if p['ce'])}, {LANG} {sum(1 for p in P if p['co'])}, both {sum(1 for p in P if p['ce'] and p['co'])}; candidate links resolved {tot_ref-tot_str}/{tot_ref} ({(tot_ref-tot_str)/max(tot_ref,1):.3f}), string-only {tot_str}")
# V3: direct referent agreement of the English and other-language container for the SAME article (true pairs)
bq=[p for p in P if p['ce'] and p['co'] and not p['ce'].startswith('str:') and not p['co'].startswith('str:')]
eq=sum(1 for p in bq if p['ce']==p['co'])
print(f"   direct referent agreement (both containers are Q-ids, same article): {eq}/{len(bq)} = {eq/max(len(bq),1):.3f}")
# partition agreement over scenes with >= 8 members having a container on both sides, vs shuffle null
rng=random.Random(20261118)
def destroy_agree(ce,co):
    ge=collections.defaultdict(set); go=collections.defaultdict(set)
    for i,(x,y) in enumerate(zip(ce,co)): ge[x].add(i); go[y].add(i)
    tot=w=0
    for r,S in ge.items(): tot+=max((len(S&T)/len(S|T) for T in go.values()),default=0)*len(S); w+=len(S)
    return tot/max(w,1)
DO=[]; NU=[]; used=0; scenes=0
for sc,mem in by.items():
    m=[p for p in mem if p['ce'] and p['co']]
    if len(m)<8: continue
    scenes+=1; ce=[p['ce'] for p in m]; co=[p['co'] for p in m]; used+=len(m); DO.append((destroy_agree(ce,co),len(m)))
    nl=[]
    for k in range(300):
        sh=co[:]; rng.shuffle(sh); nl.append(destroy_agree(ce,sh))
    NU.append(nl)
if scenes:
    W=sum(n for _,n in DO); obs=sum(d*n for d,n in DO)/W; nul=sorted(sum(NU[s][k]*DO[s][1] for s in range(scenes))/W for k in range(300))
    print(f"   scenes with >= 8 members having both containers: {scenes} ({used} members); destroy-set agreement {obs:.3f}; shuffle null mean {sum(nul)/300:.3f}, 95th {nul[284]:.3f}")
else: print("   no scene with >= 8 members having both containers")
