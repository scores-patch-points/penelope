import sys, json, re, collections, math
LANG=sys.argv[1]; SPLIT=sys.argv[2]; TOL=0.05; RATE=0.03
if len(sys.argv)>4: TOL=float(sys.argv[3]); RATE=float(sys.argv[4])
P=json.load(open(LANG+'/pairs.json'))
KW={'en':r'population|inhabitants|residents','fr':r'habitants|population','de':r'Einwohner|Bevölkerung'}
NUM=re.compile(r'(\d{1,3}(?:[ ,.  ]\d{3})+|\d+(?:[.,]\d+)?)(\s*(?:million|millions|Millionen|Million|milliard|milliards|Milliarde|Milliarden|billion))?',re.I)
YR=re.compile(r'(?<!\d)(19[0-9]{2}|20[0-2][0-9])(?!\d)')
SCALE={'million':1e6,'millions':1e6,'millionen':1e6,'milliard':1e9,'milliards':1e9,'milliarde':1e9,'milliarden':1e9,'billion':1e9}
def parse(n,sc):
    if sc: v=float(re.sub(r'\s','',n).replace(',','.')) if re.fullmatch(r'\d+[.,]\d+',re.sub(r'\s','',n)) and len(re.sub(r'\s','',n).split(re.search(r'[.,]',n).group())[-1])!=3 or re.fullmatch(r'\d+[.,]\d{1,2}',n) or re.fullmatch(r'\d+[.,]\d{3}',n) else None
    if sc and v is not None: return v*SCALE[sc.strip().lower()]
    if re.search(r'[ ,.  ]\d{3}(?!\d)',n) and re.fullmatch(r'\d{1,3}(?:[ ,.  ]\d{3})+',n): v=float(re.sub(r'[ ,.  ]','',n))
    else: v=float(n.replace(',','.'))
    if sc: v*=SCALE[sc.strip().lower()]
    return v
def claim(text,lang):
    kws=list(re.finditer(KW[lang],text,re.I)); best=None
    for k in kws:
        lo=max(0,k.start()-80); hi=min(len(text),k.end()+80)
        for m in NUM.finditer(text,lo,hi):
            after=text[m.end():m.end()+3]
            if after[:1] in ('%','/') or re.match(r'\s?%',after): continue
            try: v=parse(m.group(1),m.group(2))
            except Exception: continue
            if v<1000: continue
            ctx=text[max(0,m.start()-30):m.end()+30]
            if re.search(r'davon|dont|of which|darunter|aire urbaine|urban area|metropolitan|Hauptstadt|capitale|capital',ctx,re.I): continue
            if not m.group(2) and re.fullmatch(r'(18|19|20)\d\d',m.group(1)): continue
            d=min(abs(m.start()-k.end()),abs(k.start()-m.end()))
            if best is None or d<best[0]: best=(d,v,m)
    if not best: return None
    _,v,m=best; seg_lo=max(0,m.start()-80); seg_hi=min(len(text),m.end()+80); yb=None
    for y in YR.finditer(text,seg_lo,seg_hi):
        if m.start()<=y.start()<m.end(): continue
        d=min(abs(y.start()-m.end()),abs(m.start()-y.end()))
        if yb is None or d<yb[0]: yb=(d,int(y.group(1)))
    return {'value':v,'at':yb[1] if yb else None}
def cmp(a,b):
    d=abs(a['value']-b['value'])/max(a['value'],b['value'])
    if d<=TOL: return 'agree'
    if a['at'] is None or b['at'] is None: return 'blocked'
    gap=abs(a['at']-b['at'])
    if gap==0: return 'dispute'
    return 'compatible' if d<=TOL+RATE*gap else 'dispute'
rows=[p for p in P if (p['act']<=3 if SPLIT=='dev' else p['act']>=4)]
by=collections.defaultdict(list)
for p in rows: by[p['scene']].append(p)
for p in rows: p['ce']=claim(p['en'],'en'); p['cf']=claim(p['fr'],LANG)
T=collections.Counter(); S=collections.Counter(); bad=[]; blk=[]
for p in rows:
    if p['ce'] and p['cf']:
        v=cmp(p['ce'],p['cf']); T[v]+=1
        if v=='dispute': bad.append((p['title'],p['ce'],p['cf']))
        for q in by[p['scene']]:
            if q is not p and q['cf']: S[cmp(p['ce'],q['cf'])]+=1
N=len(rows); cov=sum(T.values()); comp=T['agree']+T['compatible']+T['dispute']
sc=sum(S.values()); sk=S['agree']+S['compatible']+S['dispute']
print(f"== {LANG} {SPLIT} tol={TOL} rate={RATE}: {N} pairs; coverage {cov}/{N} = {cov/N:.3f}")
print(f"   TRUE: {dict(T)}  dispute rate among comparable {T['dispute']/max(comp,1):.3f}")
print(f"   SUITOR trials (both claim, n={sc}): {dict(S)}  dispute rate among time-known {S['dispute']/max(sk,1):.3f}")
if len(sys.argv)<=4:
    for b in bad: print('   DISPUTE',b)
