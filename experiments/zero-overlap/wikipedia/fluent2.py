import sys, json, re, collections
LANG=sys.argv[1]; DATA=sys.argv[2]   # 'dev' or path to a pairs.json (fresh)
KW={'en':r'population|inhabitants|residents','fr':r'habitants|population','de':r'Einwohner|Bevölkerung'}
NUM=re.compile(r'(\d{1,3}(?:[ ,.  ]\d{3})+|\d+(?:[.,]\d+)?)(\s*(?:million|millions|Millionen|Million|milliard|milliards|Milliarde|Milliarden|billion))?',re.I)
YR=re.compile(r'(?<!\d)(19[0-9]{2}|20[0-2][0-9])(?!\d)')
SCALE={'million':1e6,'millions':1e6,'millionen':1e6,'milliard':1e9,'milliards':1e9,'milliarde':1e9,'milliarden':1e9,'billion':1e9}
UNIT=re.compile(r'^\s?(%|/|km|sq|square|mi\b|ha\b|hectare|m²|quadratkilometer|hektar|kilomètre)',re.I)
CUR=re.compile(r'(\$|€|£|usd|eur|gbp)\s*$',re.I)
SUBB=re.compile(r'(dont|of which|including|davon|darunter|inklusive)\W*$',re.I)
CAPA=re.compile(r'^\W*(in der hauptstadt|dans la capitale|in the capital)',re.I)
URB=re.compile(r'aire urbaine|urban area|metropolitan|agglom|gro(ß|ss)raum',re.I)
def parse(n,sc):
    if sc:
        c=re.sub(r'\s','',n); return float(c.replace(',','.'))*SCALE[sc.strip().lower()]
    if re.fullmatch(r'\d{1,3}(?:[ ,.  ]\d{3})+',n): return float(re.sub(r'[ ,.  ]','',n))
    return float(n.replace(',','.'))
def claim(text,lang):
    best=None
    for k in re.finditer(KW[lang],text,re.I):
        lo=max(0,k.start()-50); hi=min(len(text),k.end()+50)
        for m in NUM.finditer(text,lo,hi):
            try: v=parse(m.group(1),m.group(2))
            except Exception: continue
            if v<1000: continue
            if not m.group(2) and re.fullmatch(r'(18|19|20)\d\d',m.group(1)): continue
            if UNIT.match(text[m.end():m.end()+14]): continue
            if CUR.search(text[max(0,m.start()-8):m.start()]): continue
            if SUBB.search(text[max(0,m.start()-30):m.start()]): continue
            if CAPA.match(text[m.end():m.end()+30]) or CAPA.search(text[m.end():m.end()+30]): continue
            if URB.search(text[max(0,m.start()-30):m.end()+30]): continue
            d=min(abs(m.start()-k.end()),abs(k.start()-m.end()))
            if best is None or d<best[0]: best=(d,v,m)
    if not best: return None
    _,v,m=best; yb=None
    for y in YR.finditer(text,max(0,m.start()-80),min(len(text),m.end()+80)):
        if m.start()<=y.start()<m.end(): continue
        d=min(abs(y.start()-m.end()),abs(m.start()-y.end()))
        if yb is None or d<yb[0]: yb=(d,int(y.group(1)))
    return {'value':v,'at':yb[1] if yb else None}
TOL=0.05; RATE=0.03; OBS=2026; W=5
def cmp2(a,b):
    d=abs(a['value']-b['value'])/max(a['value'],b['value'])
    if d<=TOL: return 'agree',False
    if a['at'] is None or b['at'] is None:
        ia=[a['at']]*2 if a['at'] is not None else [OBS-W,OBS]; ib=[b['at']]*2 if b['at'] is not None else [OBS-W,OBS]
        mg=max(abs(ib[1]-ia[0]),abs(ia[1]-ib[0])); return ('compatible' if d<=TOL+RATE*mg else 'would-dispute'),True
    gap=abs(a['at']-b['at'])
    if gap==0: return 'dispute',False
    return ('compatible' if d<=TOL+RATE*gap else 'dispute'),False
if DATA=='dev': P=[p for p in json.load(open(LANG+'/pairs.json')) if p['act']<=3]
else: P=json.load(open(DATA))
by=collections.defaultdict(list)
for p in P: by[p['scene']].append(p)
for p in P: p['ce']=claim(p['en'],'en'); p['cf']=claim(p['fr'],LANG)
T=collections.Counter(); S=collections.Counter(); bad=[]
for p in P:
    if p['ce'] and p['cf']:
        v,inf=cmp2(p['ce'],p['cf']); T[(v,inf)]+=1
        if v in ('dispute','would-dispute'): bad.append((p['title'],p['ce'],p['cf'],inf))
        for q in by[p['scene']]:
            if q is not p and q['cf']: S[cmp2(p['ce'],q['cf'])]+=1
print(f"== {LANG} {DATA}: {len(P)} pairs; coverage {sum(T.values())}/{len(P)} = {sum(T.values())/max(len(P),1):.3f}")
for inf,label in ((False,'stated-both'),(True,'untimed-involved')):
    t={k[0]:v for k,v in T.items() if k[1]==inf}; n=sum(t.values()); s={k[0]:v for k,v in S.items() if k[1]==inf}; m=sum(s.values())
    dk='would-dispute' if inf else 'dispute'
    print(f"   {label:16s} TRUE n={n}: {t}  dispute {t.get(dk,0)/max(n,1):.3f} | SUITOR n={m}: {s}  dispute {s.get(dk,0)/max(m,1):.3f}")
import math
def wil(k,n):
    if n==0: return (float('nan'),float('nan'))
    z=1.96; p=k/n; d=1+z*z/n; c=p+z*z/(2*n); h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n)); return ((c-h)/d,(c+h)/d)
for inf,label in ((False,'stated-both'),(True,'untimed-involved')):
    dk='would-dispute' if inf else 'dispute'
    n=sum(v for k,v in T.items() if k[1]==inf); k=T.get((dk,inf),0); m=sum(v for kk,v in S.items() if kk[1]==inf); kk=S.get((dk,inf),0)
    print(f"   Wilson95 {label}: true dispute {k}/{n} [{wil(k,n)[0]:.3f}, {wil(k,n)[1]:.3f}]  suitor dispute {kk}/{m} [{wil(kk,m)[0]:.3f}, {wil(kk,m)[1]:.3f}]")
for b in bad: print('   TRUE-PAIR',b)
