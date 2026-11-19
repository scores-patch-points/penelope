import sys, json, random, math, collections, re, statistics
LANGARG=sys.argv[1]; VARIANT=sys.argv[2] if len(sys.argv)>2 else 'D'; sys.argv=['x','none',LANGARG]
src=open('judge.py').read().split("mode=sys.argv[1]")[0]; exec(src)
tr=[p for p in P if p['act']<=2]; te=[p for p in P if p['act']==3]; M=induce(tr)
nums=lambda s:set('#'+x for x in re.findall(r'\d{2,}',s))
dff=collections.Counter()
for p in tr: dff.update(set(p['ft']))
stop_f=M['stop_f']; med_e=statistics.median(M['dfe'].values()); med_f=statistics.median(dff.values())
def mean_e(p): return {w for w in set(p['et']) if w not in M['stop_e'] and M['dfe'].get(w,0)<=med_e}|nums(p['en'])
def mean_f(q): return {w for w in set(q['ft']) if w not in stop_f and dff.get(w,0)<=med_f}|nums(q['fr'])
def D(p,q):
    A=mean_e(p); B=mean_f(q); 
    if not A and not B: return 1.0
    Ft=set(q['ft'])|nums(q['fr']); Et=set(p['et'])|nums(p['en'])
    ua=sum(1 for x in A if not (x in Ft or (M['lic'].get(x,set())&Ft)))
    inv=collections.defaultdict(set)
    for x in set(p['et']): 
        for y in M['lic'].get(x,()): inv[y].add(x)
    ub=sum(1 for y in B if not (y in Et or (inv.get(y,set())&Et)))
    if VARIANT=='D2':
        agree=sum(1 for x in A if (x in Ft or (M['lic'].get(x,set())&Ft)))
        return (ub if (ub<=agree) else 99)
    return (ua+ub)/(len(A)+len(B))
FR=[('overlap',lambda a,b:base_score(a,b,M)),('usage',lambda a,b:score(a,b,M,'all')),('numerals',lambda a,b:score(a,b,M,'root'))]
by=collections.defaultdict(list)
for p in te: by[p['scene']].append(p)
def attack(p,s,strat,k):
    ft=list(s['ft']); fr=s['fr']
    names=[w for w in sorted(set(p['et'])) if w not in M['stop_e']]
    def usage(n):
        out=[]
        for w in names:
            if len(out)>=n: break
            l=sorted(M['lic'].get(w,()))
            if l: out.append(l[0])
        return out
    nm=re.findall(r'\d{2,}',p['en'])
    if k==0: pass
    elif strat=='copy': ft+=names[:k]
    elif strat=='usage': ft+=usage(k)
    elif strat=='num': fr=fr+' '+' '.join(nm[:k])
    else:
        a=k//3; ft+=names[:a]+usage(a); fr=fr+' '+' '.join(nm[:k-2*a])
    return {'ft':ft,'fr':fr,'et':[], 'en':''}
rng=random.Random(SEED); rows=[]
for p in te:
    mates=[q for q in by[p['scene']] if q is not p]
    if not mates: continue
    L=len(p['ft']); pool=[q for q in te if q is not p and abs(len(q['ft'])-L)<=max(5,0.3*L)]
    sm=rng.sample(pool,min(50,len(pool))) if pool else []
    thrD=min([D(p,q) for q in sm] or [1.0 if VARIANT=='D' else 99])
    passD=lambda q,p=p,thrD=thrD:(D(p,q)<thrD and (D(p,q)<1.0 or VARIANT=='D2'))
    thr=[max([f(p,q) for q in sm] or [0]) for _,f in FR]
    flagsA=lambda q,p=p,thr=thr:[int(f(p,q)>t and f(p,q)>=1) for (_,f),t in zip(FR,thr)]
    first=sorted(mates,key=lambda q:q['title'])[0]; short=min(mates,key=lambda q:(len(q['ft']),q['title']))
    rows.append((p,passD,flagsA,first,short))
N=len(rows); print(f"== {LANGARG} dev frame D (difference-finder): {N} claimants")
print(f"   TP (true pair survives) {sum(passD(p) for p,passD,_,_,_ in rows)/N:.3f}   natural suitor-pass {sum(passD(first) for _,passD,_,first,_ in rows)/N:.3f}")
for label,idx in (('first mate',3),('SHORTEST mate',4)):
    for strat in ('copy','usage','num','mix'):
        out=[]
        for k in (10,30):
            fa=0; fa_ladder=0
            for r in rows:
                p,passD,flagsA=r[0],r[1],r[2]; s=r[idx]
                adv=attack(p,s,strat,k); adv['et']=s['et']; adv['en']=s['en']
                fa+=passD(adv)
                # ladder A on same adversary (any frame passes) for comparison
                adv2={'ft':adv['ft'],'fr':adv['fr']}; fl=flagsA(adv2) if False else None
            out.append(f"k={k}: D-pass {fa/N:.3f}")
        print(f"   {label:13s} {strat:5s} "+"   ".join(out))
