import sys, json, math, random, collections
LANG=sys.argv[1]; FILES=sys.argv[2:]
src=open('holarchy.py').read().split("print(f\"== {LANG}")[0].replace("LANG=sys.argv[1]; FILES=sys.argv[2:]","")
exec(src)
cs=open('corrob.py').read()
a=cs.index("U=r'(km2"); b=cs.index("TOL=0.05; RATE",a)
exec(cs[a:b])
for p in P: p['ae']=area(p['en']); p['ao']=area(p['fr'])
def wil(k,n):
    if n==0: return (float('nan'),float('nan'))
    z=1.96; p=k/n; d=1+z*z/n; c=p+z*z/(2*n); h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n)); return ((c-h)/d,(c+h)/d)
C=collections.Counter(); n_claim=0; scenes=0
for sc,mem in by.items():
    m=[p for p in mem if p['ce'] and p['co']]
    if len(m)<8: continue
    scenes+=1; n=len(m); ce=[p['ce'] for p in m]; co=[p['co'] for p in m]
    for i,p in enumerate(m):
        if not (p['ae'] and p['ao']): continue
        RE={x for x in range(n) if ce[x]==ce[i]}; J=[]
        for k in range(n):
            RO={x for x in range(n) if co[x]==co[k]}; J.append(len(RE&RO)/len(RE|RO))
        mx=max(J); M={k for k in range(n) if J[k]==mx}
        n_claim+=1
        for k,q in enumerate(m):
            if not q['ao']: continue
            truth=(k==i); d=abs(p['ae']-q['ao'])/max(p['ae'],q['ao'])
            ar='agree' if d<=0.10 else ('dispute' if d>0.25 else 'unclear')
            chain='other' if (k not in M or ar=='dispute') else ('same' if ar=='agree' else 'gap')
            area_only='same' if ar=='agree' else ('other' if ar=='dispute' else 'gap')
            side='T' if truth else 'S'
            C[(side,'chain',chain)]+=1; C[(side,'area',area_only)]+=1
print(f"== {LANG}: {scenes} scenes; claimants with both areas and both containers {n_claim}")
for v in ('chain','area'):
    t=sum(C[('T',v,x)] for x in ('same','other','gap')); s=sum(C[('S',v,x)] for x in ('same','other','gap'))
    tp=C[('T',v,'same')]; fa=C[('S',v,'same')]
    print(f"   {v:5s} TRUE n={t}: same {tp} ({tp/max(t,1):.3f} [{wil(tp,t)[0]:.3f},{wil(tp,t)[1]:.3f}]) other {C[('T',v,'other')]} gap {C[('T',v,'gap')]} | SUITOR n={s}: same {fa} ({fa/max(s,1):.4f} [{wil(fa,s)[0]:.4f},{wil(fa,s)[1]:.4f}]) other {C[('S',v,'other')]} gap {C[('S',v,'gap')]}")
# ---- ADDENDUM-3 variant: area first, region breaks ties
V=collections.Counter(); sizes_a=[]; sizes_v=[]
for sc,mem in by.items():
    m=[p for p in mem if p['ce'] and p['co']]
    if len(m)<8: continue
    n=len(m); ce=[p['ce'] for p in m]; co=[p['co'] for p in m]
    for i,p in enumerate(m):
        if not (p['ae'] and p['ao']): continue
        RE={x for x in range(n) if ce[x]==ce[i]}; J=[]
        for k in range(n):
            RO={x for x in range(n) if co[x]==co[k]}; J.append(len(RE&RO)/len(RE|RO))
        mx=max(J); M={k for k in range(n) if J[k]==mx}
        A={k for k,q in enumerate(m) if q['ao'] and abs(p['ae']-q['ao'])/max(p['ae'],q['ao'])<=0.10}
        ans=A if len(A)<=1 else ((A&M) or A)
        V['claimants']+=1; V['area_keep']+=(i in A); V['var_keep']+=(i in ans); V['area_unique']+=(A=={i}); V['var_unique']+=(ans=={i}); sizes_a.append(len(A)); sizes_v.append(len(ans))
c=V['claimants']
print(f"   VARIANT (area first, region breaks ties) n={c}: truth kept area-only {V['area_keep']}/{c}, variant {V['var_keep']}/{c}; mean answer-set size area-only {sum(sizes_a)/max(c,1):.2f}, variant {sum(sizes_v)/max(c,1):.2f}; unique-and-correct area-only {V['area_unique']}/{c}, variant {V['var_unique']}/{c}")
