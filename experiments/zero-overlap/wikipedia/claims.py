import sys, json, re, collections
LANG=sys.argv[1]; SPLIT=sys.argv[2]   # dev | held
P=json.load(open(LANG+'/pairs.json'))
paren=re.compile(r'\(([^()]{0,400})\)')
YR=re.compile(r'(?<!\d)(1[0-9]{3}|20[0-2][0-9])(?!\d)')
DATE=re.compile(r'\d{1,2}\.?\s*[A-Za-zÀ-ÿ]+\.?\s*(?:\[[^\]]*\]\s*)?(?<!\d)(?:1[0-9]{3}|20[0-2][0-9])(?!\d)|[A-Za-zÀ-ÿ]+\s+\d{1,2},\s*(?:1[0-9]{3}|20[0-2][0-9])|[*\u2020]')
def claims(text):
    for m in paren.finditer(text[:600]):
        s=m.group(1)
        if not (YR.search(s) and DATE.search(s)): continue
        if '*' in s or '\u2020' in s:
            out={}
            for mark,key in (('*','born_year'),('\u2020','died_year')):
                i=s.find(mark)
                if i>=0:
                    y=YR.search(s,i)
                    if y: out[key]=int(y.group(1))
            return out
        ys=[(mm.start(),int(mm.group(1))) for mm in YR.finditer(s)]
        if len(ys)>=2: return {'born_year':ys[0][1],'died_year':ys[1][1]}
        if len(ys)==1 and re.search(r'born|n\u00e9|n\u00e9e|geboren',s[:ys[0][0]],re.I): return {'born_year':ys[0][1]}
        return {}
    return {}
def verdict(a,b):  # both dicts of invariant claims for the same asserted subject
    agree=dispute=0
    for k in set(a)&set(b):
        if a[k]==b[k]: agree+=1
        else: dispute+=1
    return 'falsified' if dispute else ('survives' if agree else 'none')
rows=[p for p in P if (p['act']<=3 if SPLIT=='dev' else p['act']>=4)]
by=collections.defaultdict(list)
for p in rows: by[p['scene']].append(p)
for p in rows: p['ce']=claims(p['en']); p['cf']=claims(p['fr'])
T=collections.Counter(); S=collections.Counter(); bad=[]
for p in rows:
    v=verdict(p['ce'],p['cf']); T[v]+=1
    if v=='falsified': bad.append((p['title'],p['ce'],p['cf'],p['en'][:110],p['fr'][:110]))
    if v!='none':
        for q in by[p['scene']]:
            if q is not p: S[verdict(p['ce'],q['cf'])]+=1
N=len(rows); cov=T['survives']+T['falsified']; sc=sum(S.values())
print(f"== {LANG} {SPLIT}: {N} pairs; coverage (both sides, >=1 shared claim kind) {cov}/{N} = {cov/N:.3f}; none {T['none']}")
print(f"   TRUE pairs among covered: survive {T['survives']}  falsified {T['falsified']}  -> falsified rate {T['falsified']/max(cov,1):.3f}")
print(f"   SUITOR pairs (covered claimants only, n={sc}): falsified {S['falsified']/max(sc,1):.3f}  survive {S['survives']/max(sc,1):.3f}  none {S['none']/max(sc,1):.3f}")
sc2=S['falsified']+S['survives']
print(f"   SUITOR pairs that have claims on both sides (n={sc2}): falsified {S['falsified']/max(sc2,1):.3f}  survive by coincidence {S['survives']/max(sc2,1):.3f}")
for b in bad: print('   DISPUTE',b)
