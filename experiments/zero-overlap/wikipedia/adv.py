import sys, json, random, math, collections, re
LANGARG=sys.argv[1]; sys.argv=['x','none',LANGARG]
src=open('judge.py').read().split("mode=sys.argv[1]")[0]; exec(src)
tr=[p for p in P if p['act']<=2]; te=[p for p in P if p['act']==3]; M=induce(tr)
FR=[('overlap',lambda a,b:base_score(a,b,M)),('usage',lambda a,b:score(a,b,M,'all')),('numerals',lambda a,b:score(a,b,M,'root'))]
by=collections.defaultdict(list)
for p in te: by[p['scene']].append(p)
nums=lambda s:re.findall(r'\d{2,}',s)
def attack(p,s,strat,k):
    ft=list(s['ft']); fr=s['fr']
    if k==0: return {'ft':ft,'fr':fr}
    names=[w for w in sorted(set(p['et'])) if w not in M['stop_e']]
    def copy(n): return names[:n]
    def usage(n):
        out=[]
        for w in names:
            if len(out)>=n: break
            l=sorted(M['lic'].get(w,()))
            if l: out.append(l[0])
        return out
    def num(n): return nums(p['en'])[:n]
    if strat=='copy': ft+=copy(k)
    elif strat=='usage': ft+=usage(k)
    elif strat=='num': fr=fr+' '+' '.join(num(k))
    else:
        a=k//3; ft+=copy(a)+usage(a); fr=fr+' '+' '.join(num(k-2*a))
    return {'ft':ft,'fr':fr}
rng=random.Random(SEED); rows=[]
for p in te:
    mates=sorted([q for q in by[p['scene']] if q is not p],key=lambda q:q['title'])
    if not mates: continue
    L=len(p['ft']); pool=[q for q in te if q is not p and abs(len(q['ft'])-L)<=max(5,0.3*L)]
    sm=rng.sample(pool,min(50,len(pool))) if pool else []
    thr=[max([f(p,q) for q in sm] or [0]) for _,f in FR]
    flags=lambda q,p=p,thr=thr:[int(f(p,q)>t and f(p,q)>=1) for (_,f),t in zip(FR,thr)]
    rows.append((p,mates,flags,flags(p)))
def ladder(fl,riv):
    return any(fl[i] and not any(r[i] for r in riv) for i in range(3))
print(f"== {LANGARG} dev adversary arm: {len(rows)} claimants")
nat=[]; 
for p,mates,flags,tf in rows:
    fs=[flags(q) for q in mates]; nat.append(ladder(fs[0],fs[1:]))
print(f"   natural suitor FA (ladder A, first scene-mate): {sum(nat)/len(nat):.3f}")
for strat in ('copy','usage','num','mix'):
    line=[]; price=None
    for k in (0,3,10,30):
        fa=tp=0
        for p,mates,flags,tf in rows:
            adv=attack(p,mates[0],strat,k); fa_f=flags(adv); others=[flags(q) for q in mates[1:]]
            fa+=ladder(fa_f,others); tp+=ladder(tf,others+[fa_f])
        n=len(rows); line.append((k,fa/n,tp/n))
        if price is None and fa/n>0.5: price=k
    print(f"   {strat:5s} "+"  ".join(f"k={k}: FA_adv {a:.3f} TP_adv {t:.3f}" for k,a,t in line)+f"   price(FA>0.5): {price if price else '>30'}")
