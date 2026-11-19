import json, sys, time, urllib.request, urllib.parse, os
UA="research-fetch/1.0 (Wikipedia API reader)"
def api(lang,**p):
    p.update(format='json',formatversion='2'); u=f"https://{lang}.wikipedia.org/w/api.php?"+urllib.parse.urlencode(p)
    for k in range(5):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=40))
        except Exception: time.sleep(2*2**k)
    return None
titles=sorted({p['title'] for f in ('fresh','fresh2','fresh3','fresh4','fresh5') for p in json.load(open(f+'-fr.json'))}|{p['title'] for f in ('fresh','fresh2','fresh3','fresh4','fresh5') for p in json.load(open(f+'-de.json'))})
print('titles',len(titles),flush=True)
cache=json.load(open('wt-cache.json')) if os.path.exists('wt-cache.json') else {'en':{},'fr':{},'de':{},'map':{'fr':{},'de':{}}}
def save(): json.dump(cache,open('wt-cache.json','w'),ensure_ascii=False)
# interlanguage titles
for L in ('fr','de'):
    todo=[t for t in titles if t not in cache['map'][L]]
    for i in range(0,len(todo),50):
        b=todo[i:i+50]; cont={}
        while True:
            r=api('en',action='query',titles='|'.join(b),prop='langlinks',lllimit='max',lllang=L,redirects='1',**cont)
            if not r: break
            red={x['to']:x['from'] for x in r.get('query',{}).get('redirects',[])}
            for pg in r.get('query',{}).get('pages',[]):
                for l in pg.get('langlinks',[]): cache['map'][L][red.get(pg['title'],pg['title'])]=l['title']
            if 'continue' in r: cont=r['continue']
            else: break
        for t in b: cache['map'][L].setdefault(t,None)
        time.sleep(0.4)
    save(); print(L,'langlinks',sum(1 for v in cache['map'][L].values() if v),flush=True)
def lead(lang,tl):
    out={}
    for i in range(0,len(tl),20):
        r=api(lang,action='query',titles='|'.join(tl[i:i+20]),prop='revisions',rvprop='content',rvslots='main',rvsection='0',redirects='1',formatversion='2')
        if r:
            red={x['to']:x['from'] for x in r.get('query',{}).get('redirects',[])}
            for pg in r.get('query',{}).get('pages',[]):
                for rev in pg.get('revisions',[]):
                    out[red.get(pg['title'],pg['title'])]=rev['slots']['main']['content']
        time.sleep(0.4)
    return out
todo=[t for t in titles if t not in cache['en']]; cache['en'].update(lead('en',todo)); save(); print('en',len(cache['en']),flush=True)
for L in ('fr','de'):
    inv={v:k for k,v in cache['map'][L].items() if v}
    todo=[v for v in inv if inv[v] not in cache[L]]
    got=lead(L,todo)
    for tt,c in got.items():
        if tt in inv: cache[L][inv[tt]]=c
    save(); print(L,len(cache[L]),flush=True)
print('done',flush=True)
