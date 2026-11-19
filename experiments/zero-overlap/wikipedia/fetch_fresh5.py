import json, sys, time, urllib.request, urllib.parse, os
UA="research-fetch/1.0 (Wikipedia API reader)"
def api(lang,**p):
    p.update(format='json',formatversion='2'); u=f"https://{lang}.wikipedia.org/w/api.php?"+urllib.parse.urlencode(p)
    for k in range(5):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=30))
        except Exception: time.sleep(2*2**k)
    return None
CATS=['States of Nigeria','Regions of Tanzania','Provinces of Bulgaria','Provinces of Ecuador','Regions of Madagascar','Provinces of the Democratic Republic of the Congo','Provinces of Papua New Guinea','Counties of Sweden','Provinces of China','Governorates of Iraq','Districts of Portugal','Counties of Estonia','Regions of the Czech Republic','Provinces of Laos','Departments of Honduras','Regions of Namibia']
CUT=int(sys.argv[1])
mem={}
for i,c in enumerate(CATS):
    r=api('en',action='query',list='categorymembers',cmtitle='Category:'+c.replace(' ','_'),cmlimit='500',cmnamespace='0',cmtype='page')
    for m in (r or {}).get('query',{}).get('categorymembers',[]): mem.setdefault(m['title'],i)
    time.sleep(0.5)
import glob
old=set()
for f in ('fresh-fr.json','fresh2-fr.json','fresh3-fr.json','fresh4-fr.json'):
    old|={p['title'] for p in json.load(open(f))}
for t in list(mem):
    if t in old: del mem[t]
print('members',len(mem),flush=True)
titles=sorted(mem)
ll={}   # en title -> {fr:..,de:..}
for i in range(0,len(titles),50):
    b=titles[i:i+50]; cont={}
    while True:
        r=api('en',action='query',titles='|'.join(b),prop='langlinks',lllimit='max',lllang='fr',**cont)
        for pg in (r or {}).get('query',{}).get('pages',[]):
            for l in pg.get('langlinks',[]): ll.setdefault(pg['title'],{})['fr']=l['title']
        if r and 'continue' in r: cont=r['continue']
        else: break
    cont={}
    while True:
        r=api('en',action='query',titles='|'.join(b),prop='langlinks',lllimit='max',lllang='de',**cont)
        for pg in (r or {}).get('query',{}).get('pages',[]):
            for l in pg.get('langlinks',[]): ll.setdefault(pg['title'],{})['de']=l['title']
        if r and 'continue' in r: cont=r['continue']
        else: break
    time.sleep(0.5)
print('with langlinks',len(ll),flush=True)
def extracts(lang,tl):
    out={}
    for i in range(0,len(tl),20):
        cont={}
        while True:
            r=api(lang,action='query',titles='|'.join(tl[i:i+20]),prop='extracts',exintro='1',explaintext='1',exlimit='20',redirects='1',**cont)
            if not r: break
            red={x['to']:x['from'] for x in r.get('query',{}).get('redirects',[])}
            for pg in r.get('query',{}).get('pages',[]):
                if pg.get('extract'): out[red.get(pg['title'],pg['title'])]=pg['extract'][:CUT]
            if 'continue' in r: cont=r['continue']
            else: break
        time.sleep(0.5)
    return out
en=extracts('en',titles); print('en leads',len(en),flush=True)
for L in ('fr','de'):
    tl=sorted({v[L] for v in ll.values() if L in v}); ex=extracts(L,tl); print(L,'leads',len(ex),flush=True)
    pairs=[]
    for t,v in sorted(ll.items()):
        if t in en and L in v and v[L] in ex: pairs.append({'scene':mem[t],'act':9,'title':t,'en':en[t],'fr':ex[v[L]]})
    json.dump(pairs,open(f'fresh5-{L}.json','w'),ensure_ascii=False); print(L,'pairs',len(pairs),flush=True)
