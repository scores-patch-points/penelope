import sys, json, math, random, collections, re, unicodedata
sys.path.insert(0,'.')
import referents as R
LANG=sys.argv[1]; FILE=f'fresh6-{LANG}.json'
WT=json.load(open('wt-cache.json')); SEED=20261118
cs=open('corrob.py').read(); a=cs.index("U=r'(km2"); b=cs.index("TOL=0.05; RATE",a); exec(cs[a:b])   # frozen area extractor A
def fold(s): return ''.join(c for c in unicodedata.normalize('NFD',(s or '').lower()) if unicodedata.category(c)!='Mn').strip()
def toks(s):
    s=unicodedata.normalize('NFC',s.lower()); return {w[:5] for w in re.findall(r"[a-zàâçéèêëîïôûùüœæäößß]{3,}",s)}
def links(lang,t):
    wt=WT[lang].get(t)
    return None if wt is None else {fold(x) for x in R.extract_links(wt) if fold(x)!=fold(t)}
P=[]
for p in json.load(open(FILE)):
    le=links('en',p['title']); lo=links(LANG,p['title'])
    if le is None or lo is None: continue
    p['LE']=le; p['LO']=lo; p['ae']=area(p['en']); p['ao']=area(p['fr']); p['et']=toks(p['en']); p['ft']=toks(p['fr']); P.append(p)
by=collections.defaultdict(list)
for p in P: by[p['scene']].append(p)
# stop sets from this set itself, without labels
dfe=collections.Counter(); dfo=collections.Counter(); dft=collections.Counter(); dff=collections.Counter()
for p in P: dfe.update(p['LE']); dfo.update(p['LO']); dft.update(p['et']); dff.update(p['ft'])
top=lambda c:set(x for x,_ in sorted(c.items(),key=lambda kv:(-kv[1],kv[0]))[:50])
SE,SO,TE,TF=top(dfe),top(dfo),top(dft),top(dff)
def nm(p,q): return len((p['LE']-SE)&(q['LO']-SO))
def tk(p,q): return len((p['et']-TE)&(q['ft']-TF))
def ar(p,q):
    if not (p['ae'] and q['ao']): return None
    d=abs(p['ae']-q['ao'])/max(p['ae'],q['ao']); return 'agree' if d<=0.10 else ('dispute' if d>0.25 else 'unclear')
def wil(k,n):
    if n==0: return (float('nan'),float('nan'))
    z=1.96; pp=k/n; dd=1+z*z/n; c=pp+z*z/(2*n); h=z*math.sqrt(pp*(1-pp)/n+z*z/(4*n*n)); return ((c-h)/dd,(c+h)/dd)
rng=random.Random(SEED)
def thresholds(p):
    L=len(p['LO']); pool=[q for q in P if q is not p and abs(len(q['LO'])-L)<=max(5,0.3*L)]
    sm=rng.sample(pool,min(50,len(pool))) if pool else []
    return max([nm(p,q) for q in sm] or [0]), max([tk(p,q) for q in sm] or [0])
def passes(p,q,tn,tt):
    a=ar(p,q); return {'area':a=='agree','names':(nm(p,q)>tn and nm(p,q)>=1),'tokens':(tk(p,q)>tt and tk(p,q)>=1)}, a
ORDER=['area','names','tokens']
def persp(pd,a_res):
    # perspective 'reader of the same article' (Lens; frame: same article as another-language lead). Area is the only probe that can vote DIFFERENT (> 0.25 apart); names and tokens are support probes (agree if they pass their null, else silent). Equivalent if no probe differs and an answered probe agrees.
    if a_res=='dispute': return 'DIFFERENT'
    if a_res in ('agree','unclear') or pd['names'] or pd['tokens']: return 'EQUIVALENT'
    return 'GAP'
def verdict(pq_pass, area_res, others_pass):
    if area_res=='dispute': return 'OTHER',None
    for f in ORDER:
        if pq_pass[f] and not any(o[f] for o in others_pass): return 'SAME',f
    return 'GAP',None
R_=collections.defaultdict(collections.Counter)     # (arm, stratum, metric)
ADV=collections.defaultdict(collections.Counter)
for sc,mem in by.items():
    if len(mem)<3: continue
    for p in mem:
        tn,tt=thresholds(p); tp_pass={}
        ps={id(q):passes(p,q,tn,tt) for q in mem}
        bs=tk(p,p); strata=['ALL','ZERO' if bs==0 else 'SOME']+(['LOW'] if bs<=1 else [])
        imp=[q for q in mem if q is not p]
        # true pair
        pv=persp(ps[id(p)][0],ps[id(p)][1])
        for s_ in strata:
            c=R_[('persp',s_)]; c['tn']+=1; c['tp']+=(pv=='EQUIVALENT'); c['tgap']+=(pv=='GAP'); c['tother']+=(pv=='DIFFERENT')
        v,fr=verdict(ps[id(p)][0],ps[id(p)][1],[ps[id(q)][0] for q in imp])
        for s in strata:
            c=R_[('ladder',s)]; c['tn']+=1; c['tp']+=(v=='SAME'); c['tgap']+=(v=='GAP'); c['tother']+=(v=='OTHER')
            if v=='SAME': c['by_'+fr]+=1
            for f in ORDER:
                c2=R_[(f+'-pass',s)]; c2['tn']+=1; c2['tp']+=ps[id(p)][0][f]
                c3=R_[(f+'-sep',s)]; c3['tn']+=1; c3['tp']+=(ps[id(p)][0][f] and not any(ps[id(q)][0][f] for q in imp))
        for q in imp:
            qv=persp(ps[id(q)][0],ps[id(q)][1])
            for s_ in strata:
                c=R_[('persp',s_)]; c['fn']+=1; c['fa']+=(qv=='EQUIVALENT'); c['fgap']+=(qv=='GAP'); c['fother']+=(qv=='DIFFERENT')
            others=[ps[id(r)][0] for r in imp if r is not q]
            v,fr=verdict(ps[id(q)][0],ps[id(q)][1],others)
            for s in strata:
                c=R_[('ladder',s)]; c['fn']+=1; c['fa']+=(v=='SAME'); c['fgap']+=(v=='GAP'); c['fother']+=(v=='OTHER')
                for f in ORDER:
                    c2=R_[(f+'-pass',s)]; c2['fn']+=1; c2['fa']+=ps[id(q)][0][f]
                    c3=R_[(f+'-sep',s)]; c3['fn']+=1; c3['fa']+=(ps[id(q)][0][f] and not any(ps[id(r)][0][f] for r in imp if r is not q))
        # adversary: first scene-mate by sorted title, informed of p and the frames
        qs=sorted(imp,key=lambda x:x['title'])[0]
        for strat in ('names','area','tokens','mix'):
            for k in (3,10):
                q2=dict(qs); q2['LO']=set(qs['LO']); q2['ft']=set(qs['ft']); q2['ao']=qs['ao']
                eng=sorted(p['LE']-SE); ept=sorted(p['et']-TE)
                if strat in('names','mix'): q2['LO']|=set(eng[:(k if strat=='names' else k//3)])
                if strat in('tokens','mix'): q2['ft']|=set(ept[:(k if strat=='tokens' else k//3)])
                if strat in('area','mix') and p['ae']: q2['ao']=p['ae']
                pq,a2=passes(p,q2,tn,tt); others=[ps[id(r)][0] for r in imp if r is not qs]
                v,fr=verdict(pq,a2,others)
                c=ADV[(strat,k)]; c['n']+=1; c['same']+=(v=='SAME'); c['other']+=(v=='OTHER')
                for f in ORDER: c['pass_'+f]+=pq[f]
                c['persp_eq']+=(persp(pq,a2)=='EQUIVALENT')
print(f"== {LANG} F6: {len(P)} pairs in {len(by)} categories")
for s in ('ALL','LOW','ZERO'):
    c=R_[('ladder',s)]
    if not c['tn']: continue
    tp=c['tp']/c['tn']; fa=c['fa']/max(c['fn'],1)
    print(f"   {s:4s} LADDER n={c['tn']:4d}: TP {tp:.3f} [{wil(c['tp'],c['tn'])[0]:.3f},{wil(c['tp'],c['tn'])[1]:.3f}]  gap {c['tgap']/c['tn']:.3f}  other {c['tother']/c['tn']:.3f} | false accept {fa:.4f} [{wil(c['fa'],c['fn'])[0]:.4f},{wil(c['fa'],c['fn'])[1]:.4f}]  (impostor gap {c['fgap']/max(c['fn'],1):.3f} other {c['fother']/max(c['fn'],1):.3f}) | BA {(tp+1-fa)/2:.3f} | decided by { {k[3:]:v for k,v in c.items() if k.startswith('by_')} }")
    cp=R_[('persp',s)]; tpp=cp['tp']/cp['tn']; fap=cp['fa']/max(cp['fn'],1)
    print(f"   {s:4s} PERSPECTIVE n={cp['tn']:4d}: equivalent(TP) {tpp:.3f} [{wil(cp['tp'],cp['tn'])[0]:.3f},{wil(cp['tp'],cp['tn'])[1]:.3f}] gap {cp['tgap']/cp['tn']:.3f} different {cp['tother']/cp['tn']:.3f} | impostor judged equivalent {fap:.4f} [{wil(cp['fa'],cp['fn'])[0]:.4f},{wil(cp['fa'],cp['fn'])[1]:.4f}] (gap {cp['fgap']/max(cp['fn'],1):.3f} different {cp['fother']/max(cp['fn'],1):.3f}) | BA {(tpp+1-fap)/2:.3f}")
    for f in ORDER:
        for kind in ('pass','sep'):
            c2=R_[(f+'-'+kind,s)]; tp=c2['tp']/c2['tn']; fa=c2['fa']/max(c2['fn'],1)
            print(f"        {f:6s}-{kind:4s}: TP {tp:.3f}  false accept {fa:.4f}  BA {(tp+1-fa)/2:.3f}")
print("   ADVERSARY (informed impostor; share judged SAME by the ladder, and each frame's pass share):")
for (strat,k),c in sorted(ADV.items()):
    print(f"      {strat:6s} k={k:2d}: ladder SAME {c['same']/c['n']:.3f}  OTHER {c['other']/c['n']:.3f} | perspective EQUIVALENT {c['persp_eq']/c['n']:.3f} | area {c['pass_area']/c['n']:.3f} names {c['pass_names']/c['n']:.3f} tokens {c['pass_tokens']/c['n']:.3f}  (n={c['n']})")
