import sys, json, random, math, collections, re, statistics
LANGARG=sys.argv[1]
exec(open('rel.py').read().split("names=list(F)")[0])
nums=lambda s:re.findall(r'\d{2,}',s)
by=collections.defaultdict(list)
for p in te: by[p['scene']].append(p)
CAP=60
def build(s,add_ft,add_num,add_ent):
    ft=list(s['ft'])+add_ft; fr=s['fr']+' '+' '.join(add_num)
    Ef=set(s['Ef'])|{e for e in add_ent if e not in STOP}
    Rf=set(s['Rf'])|rels([add_ent]) if add_ent else set(s['Rf'])
    return {'ft':ft,'fr':fr,'Ef':Ef,'Rf':Rf,'et':s['et']}
def tokens_for(p,frame):
    names=[w for w in sorted(set(p['et'])) if w not in M['stop_e']]
    ent_seq=[e for sent in p['ee'] for e in sent if e not in STOP]
    if frame=='overlap': return dict(ft=names)
    if frame=='usage': return dict(ft=[sorted(M['lic'][w])[0] for w in names if M['lic'].get(w)])
    if frame=='numerals': return dict(num=nums(p['en']))
    if frame=='R_set': return dict(ent=sorted(set(ent_seq)))
    if frame=='R': return dict(ent=ent_seq)
FRAMES=['overlap','usage','numerals','R_set','R']
fn=dict(F)
rng=random.Random(SEED); rows=[]
for p in te:
    mates=sorted([q for q in by[p['scene']] if q is not p],key=lambda q:q['title'])
    if not mates: continue
    L=len(p['ft']); pool=[q for q in te if q is not p and abs(len(q['ft'])-L)<=max(5,0.3*L)]
    sm=rng.sample(pool,min(50,len(pool))) if pool else []
    thr={n:max([fn[n](p,q) for q in sm] or [0]) for n in FRAMES}
    passes=lambda n,c,p=p,thr=thr:(fn[n](p,c)>thr[n] and fn[n](p,c)>=1)
    cost={}
    for n in FRAMES:
        t=tokens_for(p,n); ft,nm,en=t.get('ft',[]),t.get('num',[]),t.get('ent',[]); avail=max(len(ft),len(nm),len(en)); c=None
        for m in range(0,min(CAP,avail)+1):
            cand=build(mates[0],ft[:m],nm[:m],en[:m])
            if passes(n,cand): c=m; break
        cost[n]=c
    tf={n:int(passes(n,p)) for n in FRAMES}; nf={n:int(passes(n,mates[0])) for n in FRAMES}
    rows.append((cost,tf,nf))
N=len(rows); print(f"== {LANGARG} dev forging cost: {N} claimants")
print("   frame      TP   natural-pass  | forged within 3 / 10 / 30 tokens | median cost | unforgeable")
for n in FRAMES:
    cs=[r[0][n] for r in rows]; fin=[c for c in cs if c is not None]
    w=lambda k:sum(1 for c in fin if c<=k)/N
    print(f"   {n:9s} {sum(r[1][n] for r in rows)/N:.3f}  {sum(r[2][n] for r in rows)/N:.3f}         | {w(3):.2f} / {w(10):.2f} / {w(30):.2f}                   | {statistics.median(fin) if fin else float('nan'):>5} | {1-len(fin)/N:.2f}")
OR=[min([c for c in r[0].values() if c is not None] or [None]) if any(c is not None for c in r[0].values()) else None for r in rows]
def AND(r,keys):
    cs=[r[0][k] for k in keys]; return None if any(c is None for c in cs) else sum(cs)
A3=['overlap','usage','numerals']; AND3=[AND(r,A3) for r in rows]
share=lambda L,k:sum(1 for c in L if c is not None and c<=k)/N
print(f"   OR-ladder  (any of overlap/usage/numerals; min cost): within 3/10/30 = {share([min([c for k,c in r[0].items() if k in A3 and c is not None] or [None]) for r in rows],3):.2f}/{share([min([c for k,c in r[0].items() if k in A3 and c is not None] or [None]) for r in rows],10):.2f}/{share([min([c for k,c in r[0].items() if k in A3 and c is not None] or [None]) for r in rows],30):.2f}")
print(f"   AND-ladder (all three; summed cost):                   within 3/10/30 = {share(AND3,3):.2f}/{share(AND3,10):.2f}/{share(AND3,30):.2f}  unforgeable {1-sum(1 for c in AND3 if c is not None)/N:.2f}")
tpa=sum(all(r[1][k] for k in A3) for r in rows)/N; fa=sum(all(r[2][k] for k in A3) for r in rows)/N
tpo=sum(any(r[1][k] for k in A3) for r in rows)/N; fo=sum(any(r[2][k] for k in A3) for r in rows)/N
print(f"   accuracy: OR-ladder TP {tpo:.3f} natural FA {fo:.3f} | AND-ladder TP {tpa:.3f} natural FA {fa:.3f}")
