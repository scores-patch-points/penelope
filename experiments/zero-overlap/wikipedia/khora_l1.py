import sys, json, math, random, collections, unicodedata
sys.path.insert(0,'.')
import referents as R
LANG=sys.argv[1]; FILES=[f for f in sys.argv[2:] if f.endswith('.json')]
K=json.load(open('khora-reads.json'))
def fold(s): return ''.join(c for c in unicodedata.normalize('NFD',(s or '').lower()) if unicodedata.category(c)!='Mn').strip()
P=[]; off=0
for f in FILES:
    for p in json.load(open(f)): p=dict(p); p['scene']=p['scene']+off; P.append(p)
    off+=1000
def neighbours(read):
    if not read or 'refs' not in read or not read['refs']: return None
    subj=max(read['refs'],key=lambda r:(r['m'],-read['refs'].index(r)))['face']
    nb=[]
    for a,lab,b in read['edges']:
        if a==subj and b: nb.append(fold(b))
        elif b==subj and a: nb.append(fold(a))
    sf=fold(subj); return [x for x in dict.fromkeys(nb) if x and x!=sf]
print(f"== {LANG}: {len(P)} pairs")
for lang in ('en',LANG):
    reads=[K[lang].get(p['title']) for p in P]
    ok=sum(1 for r in reads if r and r.get('refs')); er=sum(1 for r in reads if r and 'err' in r); no=sum(1 for r in reads if r and r.get('none'))
    mr=sum(len(r['refs']) for r in reads if r and r.get('refs'))/max(ok,1); me=sum(len(r['edges']) for r in reads if r and r.get('refs'))/max(ok,1)
    gp=collections.Counter(g for r in reads if r for g in r.get('gaps',[]))
    nbk=sum(1 for r in reads if neighbours(r))
    print(f"   reader {lang}: with referents {ok}/{len(P)} ({ok/len(P):.3f}), errors {er}, none {no}; mean referents {mr:.1f}, edges {me:.1f}; leads with subject neighbours {nbk}; top gaps {gp.most_common(3)}")
for p in P: p['NE']=neighbours(K['en'].get(p['title'])); p['NO']=neighbours(K[LANG].get(p['title']))
by=collections.defaultdict(list)
for p in P: by[p['scene']].append(p)
def container(mem,key):
    have=[p for p in mem if p[key] is not None]; n=len(have)
    if n<4: return {}
    df=collections.Counter()
    for p in have: df.update(set(p[key]))
    out={}
    for p in have:
        c=[x for x in p[key] if 2<=df[x]<=n//2]
        if c:
            best=max(df[x] for x in c); out[p['title']]=next(x for x in c if df[x]==best)
    return out
CE={}; CO={}
for sc,mem in by.items(): CE.update(container(mem,'NE')); CO.update(container(mem,'NO'))
for p in P: p['ce']=CE.get(p['title']); p['co']=CO.get(p['title'])
print(f"   containers: EN {sum(1 for p in P if p['ce'])}, {LANG} {sum(1 for p in P if p['co'])}, both {sum(1 for p in P if p['ce'] and p['co'])}")
rng=random.Random(20261118)
def destroy_agree(ce,co):
    ge=collections.defaultdict(set); go=collections.defaultdict(set)
    for i,(x,y) in enumerate(zip(ce,co)): ge[x].add(i); go[y].add(i)
    tot=w=0
    for r,S in ge.items(): tot+=max((len(S&T)/len(S|T) for T in go.values()),default=0)*len(S); w+=len(S)
    return tot/max(w,1)
DO=[]; NU=[]; used=0; scenes=0; ss=sn=0
for sc,mem in by.items():
    m=[p for p in mem if p['ce'] and p['co']]
    if len(m)<8: continue
    scenes+=1; ce=[p['ce'] for p in m]; co=[p['co'] for p in m]; used+=len(m); DO.append((destroy_agree(ce,co),len(m)))
    for i in range(len(m)):
        for j in range(i+1,len(m)):
            if ce[i]==ce[j]:
                if co[i]==co[j]: ss+=1
                else: sn+=1
    NU.append([destroy_agree(ce,rng.sample(co,len(co))) for _ in range(300)])
if scenes:
    Wt=sum(n for _,n in DO); obs=sum(d*n for d,n in DO)/Wt; nul=sorted(sum(NU[s][k]*DO[s][1] for s in range(scenes))/Wt for k in range(300))
    print(f"   scenes >= 8 members with both containers: {scenes} ({used} members); destroy-set agreement {obs:.3f}; shuffle null mean {sum(nul)/300:.3f}, 95th {nul[284]:.3f}; P(other shared | English shared) {ss/max(ss+sn,1):.3f} (n={ss+sn})")
else: print("   no scene with >= 8 members having both containers")
# ratification against Wikidata's own parent (English side only)
GOLD=json.load(open('wd-p131.json')); ENQ=R._c['en']
faces=sorted({p['ce'] for p in P if p['ce']}); res=R.resolve('en',[f[:1].upper()+f[1:] for f in faces],0.1)
n=hit=0
for p in P:
    if not p['ce']: continue
    q=ENQ.get(p['title']); par=GOLD.get(q) if q else None
    if not par: continue
    fq=res.get(p['ce'][:1].upper()+p['ce'][1:]); n+=1; hit+=(fq in par)
print(f"   ratification (English side): of {n} members with a container and a Wikidata parent, the container resolves to the parent for {hit} ({hit/max(n,1):.3f}); link-based reader was 0.090")
