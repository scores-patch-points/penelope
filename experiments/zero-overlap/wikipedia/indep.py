import sys, json, random, math, collections, re
LANGARG=sys.argv[1]; sys.argv=['x','none',LANGARG]
src=open('judge.py').read().split("mode=sys.argv[1]")[0]; exec(src)
LOWMAX=None
tr=[p for p in P if p['act']<=2]; te=[p for p in P if p['act']==3]; M=induce(tr)
rng=random.Random(SEED); by_scene=collections.defaultdict(list)
for p in te: by_scene[p['scene']].append(p)
frames=[lambda a,b:base_score(a,b,M), lambda a,b:score(a,b,M,'all'), lambda a,b:score(a,b,M,'root')]
rows=[]   # per claimant: (true flags, [suitor flags])
for p in te:
    L=len(p['ft']); pool=[q for q in te if q is not p and abs(len(q['ft'])-L)<=max(5,0.3*L)]
    sm=rng.sample(pool,min(50,len(pool))) if pool else []
    thr=[max([f(p,q) for q in sm] or [0]) for f in frames]
    flag=lambda q: tuple(int(f(p,q)>t and f(p,q)>=1) for f,t in zip(frames,thr))
    rows.append((flag(p),[flag(q) for q in by_scene[p['scene']] if q is not p]))
def stats(rs,idx):
    n=sum(len(s) for _,s in rs); 
    if n==0: return None
    c=collections.Counter()
    for _,s in rs:
        for f in s:
            for k in range(3): c[(k,)]+=f[k]
            c['AB']+=f[0]&f[1]; c['AC']+=f[0]&f[2]; c['BC']+=f[1]&f[2]; c['ABC']+=f[0]&f[1]&f[2]
    return n,c
def lifts(rs):
    n,c=stats(rs,0); a,b,cc=c[(0,)]/n,c[(1,)]/n,c[(2,)]/n
    def lf(j,x,y): return (c[j]/n)/(x*y) if x*y>0 and c[j]>0 else float('nan')
    kk=float('nan')
    g=(a*b*cc)**(1/3) if a*b*cc>0 else 0
    if g>0 and c['ABC']>0: kk=math.log(c['ABC']/n)/math.log(g)
    return {'AB':lf('AB',a,b),'AC':lf('AC',a,cc),'BC':lf('BC',b,cc),'ABC':(c['ABC']/n)/(a*b*cc) if a*b*cc>0 and c['ABC']>0 else float('nan'),'k_eff':kk,'marg':(a,b,cc),'n':n,'abc':c['ABC']/n}
pt=lifts(rows); boot=[]
br=random.Random(SEED)
for _ in range(500):
    rs=[rows[br.randrange(len(rows))] for _ in rows]
    try: boot.append(lifts(rs))
    except ZeroDivisionError: pass
def ci(key):
    v=sorted(x[key] for x in boot if not math.isnan(x[key])); 
    return (v[int(0.025*len(v))],v[int(0.975*len(v))]) if len(v)>20 else (float('nan'),float('nan'))
print(f"== {LANGARG} dev: {len(te)} claimants, {pt['n']} suitor trials; marginal suitor-pass overlap/usage/numerals = {pt['marg'][0]:.3f}/{pt['marg'][1]:.3f}/{pt['marg'][2]:.3f}; all three = {pt['abc']:.4f}")
for k in ('AB','AC','BC','ABC','k_eff'):
    lo,hi=ci(k); print(f"   {k:5s} {pt[k]:.2f}   95% [{lo:.2f}, {hi:.2f}]" + ("   -> independence REJECTED" if k!='k_eff' and lo>1 else ""))
tf=[r[0] for r in rows]; n=len(tf); pa=sum(f[0] for f in tf)/n; pb=sum(f[1] for f in tf)/n; pc=sum(f[2] for f in tf)/n
print(f"   TRUE pairs: pass overlap/usage/numerals = {pa:.3f}/{pb:.3f}/{pc:.3f}; all three = {sum(f[0]&f[1]&f[2] for f in tf)/n:.3f} (independence would give {pa*pb*pc:.3f})")
