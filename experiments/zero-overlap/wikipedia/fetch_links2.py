import json, os, sys, time, urllib.request, urllib.parse
UA="research-fetch/1.0 (Wikipedia API reader)"
def api(lang,**p):
    p.update(format='json',formatversion='2'); u=f"https://{lang}.wikipedia.org/w/api.php?"+urllib.parse.urlencode(p)
    for k in range(4):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=20))
        except Exception: time.sleep(2*2**k)
    return None
def load(fn):
    d={}
    if os.path.exists(fn):
        for l in open(fn):
            try: k,v=json.loads(l); d[k]=v
            except Exception: pass
    return d
rows=[r for r in json.load(open('articles-ru.json')) if r.get('ru')]
# 1 titles (cached)
ru_title=load('cache-rutitle.jsonl'); f=open('cache-rutitle.jsonl','a')
for i in range(0,len(rows),50):
    b=[r['en_title'] for r in rows[i:i+50]]
    if all(t in ru_title for t in b): continue
    cont={}
    while True:
        r=api('en',action='query',titles='|'.join(b),prop='langlinks',lllimit='max',redirects=1,lllang='ru',**cont)
        if not r: break
        for pg in r.get('query',{}).get('pages',[]):
            for l in pg.get('langlinks',[]): ru_title[pg['title']]=l['title']; f.write(json.dumps([pg['title'],l['title']],ensure_ascii=False)+'\n')
        if 'continue' in r: cont=r['continue']
        else: break
    for t in b: ru_title.setdefault(t,None)
    f.flush(); time.sleep(0.3)
print('ru titles',sum(1 for v in ru_title.values() if v),flush=True)
# 2 leads (cached per article)
leads=load('cache-leads.jsonl'); f=open('cache-leads.jsonl','a')
def lead(lang,title):
    r=api(lang,action='parse',page=title,prop='links',section=0,redirects=1)
    if r is None: return None
    return [l['title'] for l in r.get('parse',{}).get('links',[]) if l.get('ns')==0 and l.get('exists',True)]
for i,r in enumerate(rows):
    t=r['en_title']
    if t in leads or not ru_title.get(t): continue
    a=lead('en',t); b=lead('ru',ru_title[t])
    if a is None or b is None: continue
    leads[t]={'en':a,'ru':b,'ru_title':ru_title[t]}; f.write(json.dumps([t,leads[t]],ensure_ascii=False)+'\n'); f.flush(); time.sleep(0.3)
    if i%50==0: print('leads',i,len(rows),flush=True)
# 3 map (cached)
allru=sorted({x for v in leads.values() for x in v['ru']}); print('ru link targets',len(allru),flush=True)
m=load('cache-map.jsonl'); done=set(load('cache-mapdone.jsonl')); f=open('cache-map.jsonl','a'); g=open('cache-mapdone.jsonl','a')
for i in range(0,len(allru),50):
    b=allru[i:i+50]
    if all(x in done for x in b): continue
    cont={}; ok=True
    while True:
        r=api('ru',action='query',titles='|'.join(b),prop='langlinks',lllimit='max',redirects=1,lllang='en',**cont)
        if not r: ok=False; break
        for pg in r.get('query',{}).get('pages',[]):
            for l in pg.get('langlinks',[]): m[pg['title']]=l['title']; f.write(json.dumps([pg['title'],l['title']],ensure_ascii=False)+'\n')
        if 'continue' in r: cont=r['continue']
        else: break
    if ok:
        for x in b: g.write(json.dumps([x,1])+'\n')
        f.flush(); g.flush()
    time.sleep(0.3)
    if (i//50)%10==0: print('map',i,len(allru),flush=True)
json.dump({'res':leads,'ru2en':m},open('links-ru.json','w'),ensure_ascii=False); print('done',len(leads),len(m),flush=True)
