# T_ground per PREREG-RU ADDENDUM-2. usage: python3 ground.py dev|held
import json, re, sys, random, collections
SEED=20261118
P=json.load(open('ru/pairs.json')); D=json.load(open('links-ru.json')); R=D['res']; R2E=D['ru2en']
LOWMAX=json.load(open('ru/lowthr.json'))['low_max']
def toks(s): return {w[:5] for w in re.findall(r"[a-zа-яё]{3,}",s.lower())}
def nums(s): return set(re.findall(r'\d{2,}',s))
def norm(t): return t.replace('_',' ').strip()
keep=[]
for p in P:
    r=R.get(p['title'])
    if not r: continue
    selfs={norm(p['title']).lower()}
    p['ge']={norm(x) for x in r['en'] if norm(x).lower() not in selfs}
    p['gr']={norm(R2E[x]) for x in r['ru'] if x in R2E and norm(R2E[x]).lower() not in selfs}
    p['et']=toks(p['en']); p['ft']=toks(p['fr']); keep.append(p)
print('pairs with links',len(keep),'of',len(P))
def stopground(train):
    c=collections.Counter()
    for p in train: c.update(p['ge']|p['gr'])
    return set(sorted(c,key=lambda w:(-c[w],w))[:50])
def mk(tier,SG,stopw):
    if tier=='ground': return lambda p,q:len((p['ge']-SG)&(q['gr']-SG))
    if tier=='base': return lambda p,q:len((p['et']-stopw)&(q['ft']-stopw))
    if tier=='base_num': return lambda p,q:len((p['et']-stopw)&(q['ft']-stopw))+len(nums(p['en'])&nums(q['fr']))
    if tier=='leaf': return lambda p,q:len(nums(p['en'])&nums(q['fr']))
def run(test,sc,tag,sub=None):
    rng=random.Random(SEED); a={'tp':0,'n':0,'sup':0,'sn':0}
    by=collections.defaultdict(list)
    for p in test: by[p['scene']].append(p)
    for p in test:
        if sub and not sub(p): continue
        L=len(p['ft']); pool=[q for q in test if q is not p and abs(len(q['ft'])-L)<=max(5,0.3*L)]
        sm=rng.sample(pool,min(50,len(pool))) if pool else []
        thr=max([sc(p,q) for q in sm] or [0]); same=lambda x:x>thr and x>=1
        sups=[q for q in by[p['scene']] if q is not p]
        a['n']+=1; a['tp']+=same(sc(p,p)); a['sn']+=len(sups); a['sup']+=sum(same(sc(p,q)) for q in sups)
    tpr=a['tp']/max(a['n'],1); fa=a['sup']/max(a['sn'],1)
    print(f"{tag:34s} n={a['n']:3d} TP {tpr:.3f} suitor-pass {fa:.3f} BA {(tpr+1-fa)/2:.3f}"); return (tpr+1-fa)/2,fa
def strata(test,stopw):
    bs=lambda p:len((p['et']-stopw)&(p['ft']-stopw))
    return {'ALL':None,'ZERO':lambda p:bs(p)==0,'LOW':lambda p:bs(p)<=LOWMAX,'SICKLEAF':lambda p:not (nums(p['en'])&nums(p['fr']))}
mode=sys.argv[1]
if mode=='dev': tr=[p for p in keep if p['act']<=2]; te=[p for p in keep if p['act']==3]
else: tr=[p for p in keep if p['act']<=3]; te=[p for p in keep if p['act']>=4]
SG=stopground(tr)
dfe=collections.Counter(); dff=collections.Counter()
for p in tr: dfe.update(p['et']); dff.update(p['ft'])
stopw=set(sorted(dfe,key=lambda w:(-dfe[w],w))[:50])|set(sorted(dff,key=lambda w:(-dff[w],w))[:50])
print(mode,'train',len(tr),'test',len(te),'mean ground sizes',sum(len(p['ge']) for p in te)/max(len(te),1),sum(len(p['gr']) for p in te)/max(len(te),1))
out={}
for sname,sub in strata(te,stopw).items():
    for t in ('ground','base','base_num','leaf'): out[(sname,t)]=run(te,mk(t,SG,stopw),f"{sname}/{t}",sub)
json.dump({f"{k[0]}/{k[1]}":v for k,v in out.items()},open(f'ground-{mode}.json','w'))
