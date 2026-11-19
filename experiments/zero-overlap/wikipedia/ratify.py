# Ratify the frozen frames at the referent level: score extracted numbers against the article's Wikidata item (scorer only).
import json, os, re, sys, time, math, collections, urllib.request, urllib.parse
import referents as R
# --- frozen extractors, loaded from their own files (no edits) ---
ns={'re':re,'json':json,'collections':collections,'math':math,'sys':sys}
f2=open('fluent2.py').read(); head=f2.split("TOL=0.05")[0].split("LANG=sys.argv[1]; DATA=sys.argv[2]")[1]; exec(head,ns)
f3=open('fluent3.py').read(); a=f3.index("MONTHS="); b=f3.index("TOL=0.05",a); exec(f3[a:b],ns)       # tie T2 + claim3
co=open('corrob.py').read(); a=co.index("U=r'"); b=co.index("def acmp"); exec(co[a:b],ns)           # area A
cl=open('claims.py').read(); a=cl.index("paren=re.compile"); b=cl.index("def verdict"); exec(cl[a:b],ns)  # life years
LANGS=('fr','de'); SETS=['fresh','fresh2','fresh3','fresh4']
def load(lang):
    P=[]
    for s in SETS:
        for p in json.load(open(f'{s}-{lang}.json')): P.append(dict(p,set=s))
    for p in json.load(open(f'{lang}/pairs.json')): P.append(dict(p,set='dev-or-held'))
    return P
data={l:load(l) for l in LANGS}
titles=sorted({p['title'] for l in LANGS for p in data[l]})
print('pairs',{l:len(data[l]) for l in LANGS},'unique en titles',len(titles),flush=True)
qid=R.resolve('en',titles)
for _ in range(2):
    miss=[t for t in titles if not qid.get(t) and t not in R._c.get('en',{})]
    if not miss: break
    qid=R.resolve('en',titles)
print('resolved to Wikidata items:',sum(1 for t in titles if qid.get(t)),'of',len(titles),flush=True)
WD='wd-claims.json'; wd=json.load(open(WD)) if os.path.exists(WD) else {}
def api(**p):
    p.update(format='json'); u="https://www.wikidata.org/w/api.php?"+urllib.parse.urlencode(p)
    for k in range(5):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'research-fetch/1.0 (Wikidata API reader)'}),timeout=60))
        except Exception: time.sleep(2*2**k)
UNIT={'Q712226':1.0,'Q25343':1e-6,'Q35852':0.01,'Q232291':2.58999,'Q81292':0.00404686}
def compact(ent):
    cl=ent.get('claims',{}); out={'area':None,'pop':[],'born':None,'died':None}
    for c in cl.get('P2046',[]):
        dv=c.get('mainsnak',{}).get('datavalue',{}).get('value')
        if dv and 'amount' in dv:
            u=(dv.get('unit') or '').rsplit('/',1)[-1]
            if u in UNIT: out['area']=float(dv['amount'])*UNIT[u]; 
            if c.get('rank')=='preferred' and u in UNIT: break
    for c in cl.get('P1082',[]):
        dv=c.get('mainsnak',{}).get('datavalue',{}).get('value')
        if not dv or 'amount' not in dv: continue
        yr=None
        for q in c.get('qualifiers',{}).get('P585',[]):
            t=q.get('datavalue',{}).get('value',{}).get('time'); m=re.match(r'[+-](\d{4})',t or '')
            if m: yr=int(m.group(1))
        out['pop'].append([float(dv['amount']),yr,c.get('rank')])
    for key,pid in (('born','P569'),('died','P570')):
        for c in cl.get(pid,[]):
            t=c.get('mainsnak',{}).get('datavalue',{}).get('value',{}).get('time'); m=re.match(r'[+-](\d{4})',t or '')
            if m: out[key]=int(m.group(1)); break
    return out
need=[q for q in dict.fromkeys(qid[t] for t in titles if qid.get(t)) if q not in wd]
print('fetching claims for',len(need),'items',flush=True)
for i in range(0,len(need),50):
    b=need[i:i+50]; r=api(action='wbgetentities',ids='|'.join(b),props='claims')
    for q in b: wd[q]=compact(r['entities'][q]) if r and q in r.get('entities',{}) and 'claims' in r['entities'][q] else {'area':None,'pop':[],'born':None,'died':None}
    if (i//50)%10==0: json.dump(wd,open(WD,'w')); print(' ',i,'/',len(need),flush=True)
    time.sleep(0.3)
json.dump(wd,open(WD,'w'))
# --- scoring ---
TOL=0.05; RATE=0.03; OBS=2026
def rel(a,b): return abs(a-b)/max(abs(a),abs(b),1e-9)
def pop_match(c,w):
    pops=[p for p in w['pop'] if p[0]>0]
    if not pops: return None
    if c['at'] is not None:
        dated=[p for p in pops if p[1] is not None and abs(p[1]-c['at'])<=5]
        if not dated: return None
        p=min(dated,key=lambda p:abs(p[1]-c['at'])); return rel(c['value'],p[0])<=TOL+RATE*abs(p[1]-c['at'])
    dated=[p for p in pops if p[1] is not None]
    p=max(dated,key=lambda p:p[1]) if dated else pops[-1]
    gap=min(10,OBS-(p[1] or OBS)); return rel(c['value'],p[0])<=TOL+RATE*gap
res=collections.defaultdict(lambda:collections.Counter())
for lang in LANGS:
    for p in data[lang]:
        q=qid.get(p['title']); w=wd.get(q) if q else None
        res[(lang,'items')]['pairs']+=1; res[(lang,'items')]['resolved']+=bool(q)
        if not w: continue
        for side,text,lg in (('en',p['en'],'en'),('other',p['fr'],lang)):
            ar=ns['area'](text)
            if ar and w['area']: k=(lang,'area',side); res[k]['covered']+=1; res[k]['match']+=rel(ar,w['area'])<=0.10
            lf=ns['claims'](text)
            for key,wk in (('born_year','born'),('died_year','died')):
                if key in lf and w[wk] is not None: k=(lang,'life',side); res[k]['covered']+=1; res[k]['match']+=lf[key]==w[wk]
            c=ns['claim3'](text,lg,p['title'])
            if c and w['pop'] and (p['title'] is not None):
                m=pop_match(c,w)
                if m is not None:
                    stated='stated' if c['at'] is not None else 'untimed'; tied='tied' if c['tied'] else 'untied'
                    for k in ((lang,'pop','all',side),(lang,'pop',stated,side),(lang,'pop',tied,side),(lang,'pop',stated+'+'+tied,side)):
                        res[k]['covered']+=1; res[k]['match']+=bool(m)
def wil(k,n):
    if not n: return (float('nan'),float('nan'))
    z=1.96; p=k/n; d=1+z*z/n; c=p+z*z/(2*n); h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n)); return ((c-h)/d,(c+h)/d)
for k in sorted(res,key=str):
    c=res[k]
    if k[1]=='items': print(k[0],'pairs',c['pairs'],'resolved to an item',c['resolved']); continue
    n=c['covered']; err=n-c['match']; lo,hi=wil(err,n); print(f"{str(k):50s} covered {n:5d}  referent-error {err/max(n,1):.3f} [{lo:.3f},{hi:.3f}]")
