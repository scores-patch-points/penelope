import json, re, sys, math, random, collections
exec(open('asker_head.py').read())
RATE=0.03; random.seed(20261118)
REL=[0.50,0.25,0.10,0.05,0.02,0.01]; YR=[50,20,5,2,1,0]
def rel(a,b): return abs(a-b)/max(abs(a),abs(b),1e-9)
def dims(text,lang,title):
    d={}
    a=ns['area'](text)
    if a: d['area']=a
    lf=ns['claims'](text)
    for k in ('born_year','died_year'):
        if k in lf: d[k]=lf[k]
    c=ns['claim3'](text,lang,title)
    if c and c['at'] is not None: d['pop']=(c['value'],c['at'])
    return d
def diffs(a,b,mask):
    out={}
    for k in mask:
        if k not in a or k not in b: continue
        if k=='area': out[k]=rel(a[k],b[k])
        elif k in ('born_year','died_year'): out[k]=abs(a[k]-b[k])
        elif k=='pop': out[k]=max(0.0,rel(a[k][0],b[k][0])-RATE*abs(a[k][1]-b[k][1]))
    return out
def equiv(df,L):
    if not df: return None
    return all((v<=YR[L]) if k!='area' and k!='pop' else (v<=REL[L]) for k,v in df.items())
ID=('area','born_year','died_year'); SZ=('pop',)
for lang in LANGS:
    P=data[lang]; by=collections.defaultdict(list)
    for p in P: by[(p['set'],p['scene'])].append(p)
    for p in P: p['dE']=dims(p['en'],'en',p['title']); p['dO']=dims(p['fr'],lang,p['title'])
    res={ (ask,kind):[[0,0] for _ in REL] for ask in ('identity','size') for kind in ('true','impostor')}
    differ=[0,0,0,0]  # pairs with both verdicts: [n, differ loosest, differ tightest, n_both]
    for p in P:
        for kind,others in (('true',[p]),('impostor',random.sample([q for q in by[(p['set'],p['scene'])] if q is not p],min(30,len(by[(p['set'],p['scene'])])-1)))):
            for q in others:
                for ask,mask in (('identity',ID),('size',SZ)):
                    df=diffs(p['dE'],q['dO'],mask)
                    for L in range(len(REL)):
                        v=equiv(df,L)
                        if v is None: continue
                        res[(ask,kind)][L][0]+=1; res[(ask,kind)][L][1]+=v
                if kind=='true':
                    a=diffs(p['dE'],q['dO'],ID); b=diffs(p['dE'],q['dO'],SZ)
                    if a and b:
                        differ[3]+=1; differ[1]+=(equiv(a,0)!=equiv(b,0)); differ[2]+=(equiv(a,5)!=equiv(b,5))
    print(f"== {lang}")
    for ask in ('identity','size'):
        print(f"  asker {ask}:  level  delta_rel/yr   true survive (n)    impostor survive (n)   gap")
        gmax=0
        for L in range(len(REL)):
            t=res[(ask,'true')][L]; i=res[(ask,'impostor')][L]
            st=t[1]/t[0] if t[0] else float('nan'); si=i[1]/i[0] if i[0] else float('nan'); gap=st-si if t[0] and i[0] else float('nan'); gmax=max(gmax,gap) if gap==gap else gmax
            print(f"           {L}      {REL[L]:.2f}/{YR[L]:>2}      {st:.3f} ({t[0]:4d})      {si:.3f} ({i[0]:5d})        {gap:+.3f}")
        print(f"     max persistence gap {gmax:.3f}")
    print(f"  pairs with a verdict from BOTH askers: {differ[3]}; verdicts differ at loosest level {differ[1]}, at tightest {differ[2]}")
