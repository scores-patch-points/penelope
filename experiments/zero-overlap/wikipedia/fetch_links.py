import json, sys, time, urllib.request, urllib.parse
UA="research-fetch/1.0 (Wikipedia API reader)"
def api(lang,**p):
    p.update(format='json',formatversion='2'); u=f"https://{lang}.wikipedia.org/w/api.php?"+urllib.parse.urlencode(p)
    for k in range(7):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=40))
        except Exception: time.sleep(3*2**k)
    return {}
L='ru'; rows=[r for r in json.load(open('articles-ru.json')) if r.get('ru')]
# 1. Russian titles
ru_title={}
for i in range(0,len(rows),50):
    b=[r['en_title'] for r in rows[i:i+50]]; cont={}
    while True:
        r=api('en',action='query',titles='|'.join(b),prop='langlinks',lllimit='max',redirects=1,lllang='ru',**cont)
        for pg in r.get('query',{}).get('pages',[]):
            for l in pg.get('langlinks',[]): ru_title[pg['title']]=l['title']
        if 'continue' in r: cont=r['continue']
        else: break
    time.sleep(0.6)
print('ru titles',len(ru_title),flush=True)
def lead(lang,title):
    r=api(lang,action='parse',page=title,prop='links',section=0,redirects=1)
    return [l['title'] for l in r.get('parse',{}).get('links',[]) if l.get('ns')==0 and l.get('exists',True)]
res={}
for i,r in enumerate(rows):
    t=r['en_title']
    if t not in ru_title: continue
    res[t]={'en':lead('en',t),'ru':lead('ru',ru_title[t]),'ru_title':ru_title[t]}; time.sleep(0.5)
    if i%50==0: print('leads',i,len(rows),flush=True)
# 2. map every Russian link target to its English title via ru-wiki interlanguage links
allru=sorted({x for v in res.values() for x in v['ru']}); print('ru link targets',len(allru),flush=True)
ru2en={}
for i in range(0,len(allru),50):
    b=allru[i:i+50]; cont={}
    while True:
        r=api('ru',action='query',titles='|'.join(b),prop='langlinks',lllimit='max',redirects=1,lllang='en',**cont)
        for pg in r.get('query',{}).get('pages',[]):
            for l in pg.get('langlinks',[]): ru2en[pg['title']]=l['title']
        if 'continue' in r: cont=r['continue']
        else: break
    time.sleep(0.5)
    if (i//50)%20==0: print('map',i,len(allru),flush=True)
json.dump({'res':res,'ru2en':ru2en},open('links-ru.json','w'),ensure_ascii=False); print('done',len(res),len(ru2en),flush=True)
