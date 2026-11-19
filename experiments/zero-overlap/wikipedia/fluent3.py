import sys, json, re, collections, math
LANG=sys.argv[1]; DATA=sys.argv[2]
src=open('fluent2.py').read().split("TOL=0.05")[0].split("LANG=sys.argv[1]; DATA=sys.argv[2]")[1]
exec(src)
MONTHS=set('january february march april may june july august september october november december janvier février mars avril mai juin juillet août septembre octobre novembre décembre januar februar märz juni juli oktober dezember'.split())
SRC=set('census recensement zensus insee eurostat istat statistik statistics bureau office estimate estimation schätzung un onu'.split())
CAPM=re.compile(r'capital|capitale|chef-lieu|hauptstadt|hauptort|verwaltungssitz|\bseat\b|largest city|plus grande ville|größte stadt',re.I)
CAP=re.compile(r'(?<![.!?]\s)(?<!^)\b([A-ZÀ-Þ][a-zà-ÿ\'’-]{2,})')
ROLE=re.compile(r"capital|capitale|chef-lieu|hauptstadt|hauptort|verwaltungssitz|\bseat\b|siège|\bsitz\b|\bcity\b|\bville\b|\bstadt\b|\btown\b|municipality|commune|gemeinde|largest city|plus grande ville|größte stadt|metropolitan|agglom|urban",re.I)
def tied(text,m_start,m_end,title):
    lo=max(0,m_start-100)
    for mm in re.finditer(r'[.!?;]',text[lo:m_start]): lo=lo+mm.end()
    return not ROLE.search(text[lo:m_start])
def claim3(text,lang,title):
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
    return {'value':v,'at':yb[1] if yb else None,'tied':tied(text,m.start(),m.end(),title)}
TOL=0.05; RATE=0.03
def cmpv(a,b,gate):
    d=abs(a['value']-b['value'])/max(a['value'],b['value'])
    if d<=TOL: return 'agree'
    if a['at'] is None or b['at'] is None: return 'blocked'
    if gate and not (a['tied'] and b['tied']): return 'blocked'
    gap=abs(a['at']-b['at'])
    if gap==0: return 'dispute'
    return 'compatible' if d<=TOL+RATE*gap else 'dispute'
def wil(k,n):
    if n==0: return (float('nan'),float('nan'))
    z=1.96; p=k/n; dd=1+z*z/n; c=p+z*z/(2*n); h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n)); return ((c-h)/dd,(c+h)/dd)
P=json.load(open(DATA)) if DATA!='dev' else [p for p in json.load(open(LANG+'/pairs.json')) if p['act']<=3]
by=collections.defaultdict(list)
for p in P: by[p['scene']].append(p)
for p in P: p['ce']=claim3(p['en'],'en',p['title']); p['cf']=claim3(p['fr'],LANG,p['title'])
print(f"== {LANG} {DATA}: {len(P)} pairs")
for gate,label in ((False,'V0 (time only)'),(True,'V1 (time + tie)')):
    T=collections.Counter(); S=collections.Counter(); bad=[]
    for p in P:
        if p['ce'] and p['cf']:
            v=cmpv(p['ce'],p['cf'],gate); T[v]+=1
            if v=='dispute': bad.append((p['title'],p['ce'],p['cf']))
            for q in by[p['scene']]:
                if q is not p and q['cf']: S[cmpv(p['ce'],q['cf'],gate)]+=1
    n=T['agree']+T['compatible']+T['dispute']; m=S['agree']+S['compatible']+S['dispute']; fk=T['dispute']; sk=S['dispute']
    lo,hi=wil(fk,n); slo,shi=wil(sk,m)
    elig=sum(1 for p in P if p['ce'] and p['cf'] and p['ce']['at'] is not None and p['cf']['at'] is not None and (not gate or (p['ce']['tied'] and p['cf']['tied'])))
    print(f"   {label:16s} TRUE {dict(T)}: dispute {fk}/{n} = {fk/max(n,1):.3f} [{lo:.3f},{hi:.3f}] | SUITOR dispute {sk}/{m} = {sk/max(m,1):.3f} [{slo:.3f},{shi:.3f}] | falsifiable coverage {elig}/{len(P)} = {elig/len(P):.3f}")
    if gate:
        for b in bad: print('   TRUE-PAIR DISPUTE',b)
