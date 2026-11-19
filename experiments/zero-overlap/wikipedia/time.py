import sys, json, re, collections
LANG=sys.argv[1]; W=int(sys.argv[2]) if len(sys.argv)>2 else 5
sys.argv=['x',LANG,'dev']
src=open('fluent.py').read().split("def cmp")[0]; exec(src)
TOL=0.05; RATE=0.03; OBS=2026
def iv(c): return ([c['at'],c['at']],False) if c['at'] is not None else ([OBS-W,OBS],True)
def cmp2(a,b):
    d=abs(a['value']-b['value'])/max(a['value'],b['value'])
    if d<=TOL: return 'agree',False
    (ia,xa),(ib,xb)=iv(a),iv(b); inf=xa or xb
    if inf:
        mg=max(abs(ib[1]-ia[0]),abs(ia[1]-ib[0])); return ('compatible' if d<=TOL+RATE*mg else 'dispute'),True
    gap=abs(a['at']-b['at'])
    if gap==0: return 'dispute',False
    return ('compatible' if d<=TOL+RATE*gap else 'dispute'),False
rows=[p for p in P if p['act']<=3]
by=collections.defaultdict(list)
for p in rows: by[p['scene']].append(p)
for p in rows: p['ce']=claim(p['en'],'en'); p['cf']=claim(p['fr'],LANG)
T=collections.Counter(); S=collections.Counter(); bad=[]
for p in rows:
    if p['ce'] and p['cf']:
        v,inf=cmp2(p['ce'],p['cf']); T[(v,inf)]+=1
        if v=='dispute': bad.append((p['title'],p['ce'],p['cf'],inf))
        for q in by[p['scene']]:
            if q is not p and q['cf']: S[cmp2(p['ce'],q['cf'])]+=1
def split(C,inf): 
    x={k[0]:v for k,v in C.items() if k[1]==inf}; return x
print(f"== {LANG} dev, W={W}: coverage {sum(T.values())}/{len(rows)}")
for inf in (False,True):
    t=split(T,inf); n=sum(t.values()); s=split(S,inf); m=sum(s.values())
    print(f"   {'involves-inferred' if inf else 'stated-both     '}  TRUE n={n}: {dict(t)}  dispute {t.get('dispute',0)/max(n,1):.3f} | SUITOR n={m}: {dict(s)}  dispute {s.get('dispute',0)/max(m,1):.3f}  agree+compatible {(s.get('agree',0)+s.get('compatible',0))/max(m,1):.3f}")
if W==5:
    for b in bad: print('   TRUE-PAIR DISPUTE',b)
