import sys, json, re, random, collections, unicodedata
LANG=sys.argv[1]; FILES=sys.argv[2:]
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn').lower().strip()
N=r"[A-ZÀ-Þ][\w'’.-]+(?:[ -](?:de |du |des |of |la |le |d[’'])?[A-ZÀ-Þ][\w'’.-]+)*"
EN=[re.compile(r"region of ("+N+")"),re.compile(r"the ("+N+") region"),re.compile(r"(?:in|within) ("+N+") region")]
FR=[re.compile(r"[Rr]égion (?:de la |du |de l[’']|d[’']|des |de |)("+N+")"),re.compile(r"situ[ée]e? (?:en|au|dans le|dans la|dans l[’']|dans) ("+N+")")]
DE=[re.compile(r"Region ("+N+")"),re.compile(r"in der ("+N+")-Region")]
def container(text,lang):
    pats={'en':EN,'fr':FR,'de':DE}[lang]
    for rx in pats:
        m=rx.search(text[:500])
        if m:
            n=norm(m.group(1))
            if n in ('the','of','region'): continue
            return n
    return None
P=[]; off=0
for f in FILES:
    for p in json.load(open(f)): p=dict(p); p['scene']=p['scene']+off; P.append(p)
    off+=1000
by=collections.defaultdict(list)
for p in P: p['ce']=container(p['en'],'en'); p['co']=container(p['fr'],LANG); by[p['scene']].append(p)
print(f"== {LANG}: {len(P)} pairs; EN container {sum(1 for p in P if p['ce'])}; other {sum(1 for p in P if p['co'])}; both {sum(1 for p in P if p['ce'] and p['co'])}")
rng=random.Random(20261118)
def stats(ce,co):
    n=len(ce); a=ss=sn=ns=nn=0
    for i in range(n):
        for j in range(i+1,n):
            e=ce[i]==ce[j]; o=co[i]==co[j]
            a+=(e==o); ss+=(e and o); sn+=(e and not o); ns+=((not e) and o); nn+=((not e) and not o)
    return a,ss,sn,ns,nn
def destroy_agree(ce,co):
    ge=collections.defaultdict(set); go=collections.defaultdict(set)
    for i,(x,y) in enumerate(zip(ce,co)): ge[x].add(i); go[y].add(i)
    tot=0; w=0
    for r,S in ge.items():
        best=max((len(S&T)/len(S|T) for T in go.values()),default=0); tot+=best*len(S); w+=len(S)
    return tot/max(w,1)
OBS=collections.Counter(); NULL=[]; DOBS=[]; DNULL=[]; used=0; scenes=[]
for sc,mem in by.items():
    m=[p for p in mem if p['ce'] and p['co']]
    if len(m)<8: continue
    used+=len(m); ce=[p['ce'] for p in m]; co=[p['co'] for p in m]
    a,ss,sn,ns,nn=stats(ce,co); OBS.update({'a':a,'ss':ss,'sn':sn,'ns':ns,'nn':nn})
    d=destroy_agree(ce,co); DOBS.append((d,len(m)))
    nl=[]; dn=[]
    for k in range(500):
        sh=co[:]; rng.shuffle(sh); nl.append(stats(ce,sh)); dn.append(destroy_agree(ce,sh))
    NULL.append((nl,dn)); scenes.append((sc,len(m),len(set(ce)),len(set(co)),d,sum(dn)/500))
tot=OBS['ss']+OBS['sn']+OBS['ns']+OBS['nn']
if not scenes: print('no scene with >= 8 members having both containers'); sys.exit()
print(f"   scenes used {len(scenes)} ({used} members), member pairs {tot}")
print(f"   agreement (sameEN == sameOT) {OBS['a']/tot:.3f};  P(sameOT | sameEN) {OBS['ss']/max(OBS['ss']+OBS['sn'],1):.3f} (n={OBS['ss']+OBS['sn']});  P(sameOT | not sameEN) {OBS['ns']/max(OBS['ns']+OBS['nn'],1):.3f} (n={OBS['ns']+OBS['nn']})")
# pooled shuffle null across scenes
nA=[sum(NULL[s][0][k][0] for s in range(len(scenes)))/tot for k in range(500)]
nCond=[sum(NULL[s][0][k][1] for s in range(len(scenes)))/max(sum(NULL[s][0][k][1]+NULL[s][0][k][2] for s in range(len(scenes))),1) for k in range(500)]
print(f"   shuffle null: agreement mean {sum(nA)/500:.3f}, 95th pct {sorted(nA)[474]:.3f}; P(sameOT|sameEN) mean {sum(nCond)/500:.3f}, 95th pct {sorted(nCond)[474]:.3f}")
dw=sum(d*n for d,n in DOBS)/sum(n for _,n in DOBS); dn=[sum(NULL[s][1][k]*DOBS[s][1] for s in range(len(scenes)))/sum(n for _,n in DOBS) for k in range(500)]
print(f"   destroy-set agreement {dw:.3f}; shuffle null mean {sum(dn)/500:.3f}, 95th pct {sorted(dn)[474]:.3f}")
for s in scenes: print(f"     scene {s[0]}: {s[1]} members, {s[2]} EN regions, {s[3]} other regions, destroy-set agreement {s[4]:.3f} (null {s[5]:.3f})")
