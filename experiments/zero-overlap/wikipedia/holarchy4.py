import sys, json, math, collections
LANG=sys.argv[1]; FILES=sys.argv[2:]
src=open('holarchy.py').read().split("print(f\"== {LANG}")[0].replace("LANG=sys.argv[1]; FILES=sys.argv[2:]","")
exec(src)
cs=open('corrob.py').read(); a=cs.index("U=r'(km2"); b=cs.index("TOL=0.05; RATE",a); exec(cs[a:b])
for p in P: p['ae']=area(p['en']); p['ao']=area(p['fr'])
def wil(k,n):
    if n==0: return (float('nan'),float('nan'))
    z=1.96; p=k/n; d=1+z*z/n; c=p+z*z/(2*n); h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n)); return ((c-h)/d,(c+h)/d)
V=collections.Counter(); sa=[]; sv=[]; H=collections.Counter(); scenes=0
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
        A={k for k,q in enumerate(m) if q['ao'] and abs(p['ae']-q['ao'])/max(p['ae'],q['ao'])<=0.10}
        ans=A if len(A)<=1 else ((A&M) or A)
        V['n']+=1; V['ak']+=(i in A); V['vk']+=(i in ans); V['au']+=(A=={i}); V['vu']+=(ans=={i}); sa.append(len(A)); sv.append(len(ans))
        for k,q in enumerate(m):
            if not q['ao']: continue
            d=abs(p['ae']-q['ao'])/max(p['ae'],q['ao']); ar='agree' if d<=0.10 else ('dispute' if d>0.25 else 'unclear')
            hard='other' if (k not in M or ar=='dispute') else ('same' if ar=='agree' else 'gap')
            H[('T' if k==i else 'S',hard)]+=1
c=V['n']
print(f"== {LANG}: {len(P)} pairs; {scenes} scenes with >= 8 members having both containers; eligible claimants {c}" + ("  (TOO SMALL: < 30)" if c<30 else ""))
if c:
    print(f"   truth kept: soft chain {V['vk']}/{c} = {V['vk']/c:.3f} | area alone {V['ak']}/{c} = {V['ak']/c:.3f}")
    print(f"   mean answer-set size: soft chain {sum(sv)/c:.2f} | area alone {sum(sa)/c:.2f}")
    print(f"   unique-and-correct: soft chain {V['vu']}/{c} = {V['vu']/c:.3f} [{wil(V['vu'],c)[0]:.3f},{wil(V['vu'],c)[1]:.3f}] | area alone {V['au']}/{c} = {V['au']/c:.3f} [{wil(V['au'],c)[0]:.3f},{wil(V['au'],c)[1]:.3f}]")
    t=sum(H[('T',x)] for x in ('same','other','gap')); s=sum(H[('S',x)] for x in ('same','other','gap'))
    print(f"   hard chain (reference): TP {H[('T','same')]}/{t}; suitor false accept {H[('S','same')]}/{s} = {H[('S','same')]/max(s,1):.4f}")
