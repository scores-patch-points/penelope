import sys, json, random, math, collections, re, unicodedata
LANGARG=sys.argv[1]; sys.argv=['x','none',LANGARG]
src=open('judge.py').read().split("mode=sys.argv[1]")[0]; exec(src)
def strip(s): return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn')
SPL=re.compile(r'(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-ÞА-Я])')
def ents(text):
    out=[]
    for sent in SPL.split(text):
        seq=[]
        for i,w in enumerate(re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿА-Яа-яЁё]+|\b1\d{3}\b|\b20\d{2}\b",sent)):
            if w.isdigit(): seq.append(w)
            elif i>0 and w[0].isupper(): seq.append(strip(unicodedata.normalize('NFC',w)).lower()[:5])
        out.append(seq)
    return out
tr=[p for p in P if p['act']<=2]; te=[p for p in P if p['act']==3]; M=induce(tr)
for p in P: p['ee']=ents(p['en']); p['fe']=ents(p['fr'])
df=collections.Counter()
for p in tr: df.update({e for s in p['ee'] for e in s}); df.update({e for s in p['fe'] for e in s})
STOP=set(sorted(df,key=lambda w:(-df[w],w))[:50])
def rels(sents,ordered=True):
    R=set()
    for s in sents:
        s=[e for e in s if e not in STOP]
        for i in range(len(s)):
            for j in range(i+1,min(i+3,len(s))): R.add((s[i],s[j]) if ordered else frozenset((s[i],s[j])))
    return R
def ent_set(sents): return {e for s in sents for e in s if e not in STOP}
for p in P: p['R']=rels(p['ee']); p['Rf']=rels(p['fe']); p['E']=ent_set(p['ee']); p['Ef']=ent_set(p['fe'])
F={'overlap':lambda a,b:base_score(a,b,M),'usage':lambda a,b:score(a,b,M,'all'),'numerals':lambda a,b:score(a,b,M,'root'),
   'R':lambda a,b:len(a['R']&b['Rf']),'R_set':lambda a,b:len(a['E']&b['Ef'])}
names=list(F)
rng=random.Random(SEED); by=collections.defaultdict(list)
for p in te: by[p['scene']].append(p)
T=[]  # per claimant: true flags dict, list of suitor flag dicts
for p in te:
    L=len(p['ft']); pool=[q for q in te if q is not p and abs(len(q['ft'])-L)<=max(5,0.3*L)]
    sm=rng.sample(pool,min(50,len(pool))) if pool else []
    thr={n:max([F[n](p,q) for q in sm] or [0]) for n in names}
    fl=lambda q:{n:int(F[n](p,q)>thr[n] and F[n](p,q)>=1) for n in names}
    T.append((fl(p),[fl(q) for q in by[p['scene']] if q is not p]))
def ladder_verdict(flags,rivals,order):  # judgeFrames semantics
    for n in order:
        if flags[n] and not any(r[n] for r in rivals): return True
    return False
def eval_ladder(order):
    tp=fn=fa=tn=0
    for t,sups in T:
        if ladder_verdict(t,sups,order): tp+=1
        else: fn+=1
        for i,s in enumerate(sups):
            others=sups[:i]+sups[i+1:]
            if ladder_verdict(s,others,order): fa+=1
            else: tn+=1
    ba=(tp/max(tp+fn,1)+1-fa/max(fa+tn,1))/2; return dict(tp=tp,fn=fn,fa=fa,tn=tn,ba=ba,tpr=tp/max(tp+fn,1),far=fa/max(fa+tn,1))
n=sum(len(s) for _,s in T)
marg={k:sum(f[k] for _,s in T for f in s)/n for k in names}
def lift(a,b):
    j=sum(f[a]&f[b] for _,s in T for f in s)/n
    return j/(marg[a]*marg[b]) if marg[a]*marg[b]>0 and j>0 else float('nan')
print(f"== {LANGARG} dev: {len(te)} claimants, {n} suitor trials, stopped entities 50")
for k in names:
    tpr=sum(t[k] for t,_ in T)/len(T); print(f"   {k:9s} TP {tpr:.3f}  suitor-pass {marg[k]:.3f}  BA {(tpr+1-marg[k])/2:.3f}")
old=[('overlap','usage'),('overlap','numerals'),('usage','numerals')]
lo=[lift(*p) for p in old]; lr=[lift('R',o) for o in ('overlap','usage','numerals')]
ok=lambda v:[x for x in v if not math.isnan(x)]
mo=sum(ok(lo))/max(len(ok(lo)),1); mr=sum(ok(lr))/max(len(ok(lr)),1)
print(f"   lifts old pairs {[round(x,2) for x in lo]} mean {mo:.2f} | R vs old {[round(x,2) for x in lr]} mean {mr:.2f}")
A=['overlap','usage','numerals']; res={}
for nm,order in (('A',A),('B (R last)',A+['R']),("B' (R first)",['R']+A)):
    res[nm]=eval_ladder(order); r=res[nm]; print(f"   ladder {nm:13s} TP {r['tpr']:.3f}  FA {r['far']:.3f}  BA {r['ba']:.3f}")
for nm in ('B (R last)',"B' (R first)"):
    b,a=res['A'],res[nm]; acc=a['ba']>b['ba'] and a['far']<=b['far'] and mr<mo
    print(f"   admit {nm}: BA up {a['ba']>b['ba']}, FA not up {a['far']<=b['far']}, R more independent {mr<mo} -> {'ADMITTED' if acc else 'REFUSED'}")
