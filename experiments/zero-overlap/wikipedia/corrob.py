import sys, json, re, collections, math
LANG=sys.argv[1]; FILES=sys.argv[2:]
src=open('fluent2.py').read().split("TOL=0.05")[0].split("LANG=sys.argv[1]; DATA=sys.argv[2]")[1]
exec(src)
U=r'(km2|km²|km 2|sq\.? ?km|square kilomet\w+|kilomètres? carrés?|km carrés|quadratkilometer\w*|qkm)'
UM=r'(sq\.? ?mi(?:les)?\b|square miles?)'
NUMA=r'(\d{1,3}(?:[\s,.]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)\s*(million\s*)?'
AK=re.compile(NUMA+U,re.I); AM=re.compile(NUMA+UM,re.I)
def parse_a(n,mil):
    n=n.strip()
    m1=re.fullmatch(r'(\d{1,3}(?:[\s,.]\d{3})+)([.,])(\d{1,2}|\d{4,})',n)
    if re.fullmatch(r'\d{1,3}(?:[\s,.]\d{3})+',n): v=float(re.sub(r'[\s,.]','',n))
    elif m1: v=float(re.sub(r'[\s,.]','',m1.group(1))+'.'+m1.group(3))
    else: v=float(re.sub(r'\s','',n).replace(',','.'))
    return v*1e6 if mil else v
def area(text):
    for rx,f in ((AK,1.0),(AM,2.58999)):
        m=rx.search(text)
        if m:
            try: return parse_a(m.group(1),m.group(2))*f
            except Exception: return None
    return None
def acmp(a,b):
    d=abs(a-b)/max(a,b)
    return 'agree' if d<=0.10 else ('dispute' if d>0.25 else 'unclear')
TOL=0.05; RATE=0.03
def pcmp(a,b):   # R2 population comparison, stated time only
    d=abs(a['value']-b['value'])/max(a['value'],b['value'])
    if d<=TOL: return 'agree'
    if a['at'] is None or b['at'] is None: return 'blocked'
    gap=abs(a['at']-b['at'])
    if gap==0: return 'dispute'
    return 'compatible' if d<=TOL+RATE*gap else 'dispute'
def wil(k,n):
    if n==0: return (float('nan'),float('nan'))
    z=1.96; p=k/n; dd=1+z*z/n; c=p+z*z/(2*n); h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n)); return ((c-h)/dd,(c+h)/dd)
P=[]; off=0
for f in FILES:
    for p in json.load(open(f)): p=dict(p); p['scene']=p['scene']+off; P.append(p)
    off+=1000
by=collections.defaultdict(list)
for p in P: by[p['scene']].append(p)
for p in P: p['pe']=claim(p['en'],'en'); p['pf']=claim(p['fr'],LANG); p['ae']=area(p['en']); p['af']=area(p['fr'])
both=[p for p in P if p['ae'] and p['af']]
print(f"== {LANG} {FILES}: {len(P)} pairs; both-area coverage {len(both)}/{len(P)} = {len(both)/len(P):.3f}")
T=collections.Counter(); S=collections.Counter(); J=collections.Counter(); bad=[]; resc=0; cf_t=0; cf_s=0; popd_t=0
for p in both:
    v=acmp(p['ae'],p['af']); T[v]+=1
    if v=='dispute': bad.append((p['title'],round(p['ae']),round(p['af']),p['en'][:60]))
    if p['pe'] and p['pf']:
        pv=pcmp(p['pe'],p['pf'])
        if pv=='dispute':
            popd_t+=1
            if v=='agree': resc+=1
            if v=='dispute': cf_t+=1
for p in P:
    if not p['ae']: continue
    for q in by[p['scene']]:
        if q is p or not q['af']: continue
        v=acmp(p['ae'],q['af']); S[v]+=1
        if p['pe'] and q['pf']:
            pv=pcmp(p['pe'],q['pf']); pd=(pv=='dispute'); ad=(v=='dispute'); J[(pd,ad)]+=1
n=len(both); m=sum(S.values())
a=T['agree']; d=T['dispute']; u=T['unclear']
print(f"   TRUE pairs (both areas, n={n}): agree {a} ({a/max(n,1):.3f} [{wil(a,n)[0]:.3f},{wil(a,n)[1]:.3f}]) unclear {u} dispute {d} ({d/max(n,1):.3f} [{wil(d,n)[0]:.3f},{wil(d,n)[1]:.3f}])")
print(f"   SUITOR trials (both areas, n={m}): agree (coincidence) {S['agree']} ({S['agree']/max(m,1):.3f} [{wil(S['agree'],m)[0]:.3f},{wil(S['agree'],m)[1]:.3f}]) unclear {S['unclear']} dispute {S['dispute']} ({S['dispute']/max(m,1):.3f})")
jn=sum(J.values()); pd=sum(v for k,v in J.items() if k[0])/max(jn,1); ad=sum(v for k,v in J.items() if k[1])/max(jn,1); jd=J[(True,True)]/max(jn,1)
print(f"   independence among suitor trials with both claims (n={jn}): P(pop dispute) {pd:.3f}  P(area dispute) {ad:.3f}  joint {jd:.3f}  lift {jd/(pd*ad) if pd*ad else float('nan'):.2f}")
print(f"   TRUE pairs with a population dispute: {popd_t}; rescued by an area AGREE: {resc}; corroborated-falsified (area dispute too): {cf_t}")
sc=J[(True,True)]; print(f"   SUITOR corroborated-falsified (pop AND area dispute): {sc}/{jn} = {sc/max(jn,1):.3f}")
if len(sys.argv)>0:
    for b in bad[:12]: print('   TRUE-PAIR AREA DISPUTE',b)
