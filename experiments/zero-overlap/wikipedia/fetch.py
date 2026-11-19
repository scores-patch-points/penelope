import json, urllib.request, urllib.parse, time, sys
UA="research-fetch/1.0 (Wikipedia API reader)"
def api(lang,**p):
    p.update(format='json',formatversion='2'); u=f"https://{lang}.wikipedia.org/w/api.php?"+urllib.parse.urlencode(p)
    for k in range(7):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=40))
        except Exception as e: time.sleep(3*2**k)
    return {}
cats=["Chemical elements","Nobel laureates in Physics","Impressionist painters","Member states of the United Nations","Roman emperors","Mammals of Europe","Mountains of the Alps","Rivers of France","Cities in Germany","Operas by Giuseppe Verdi","Planets of the Solar System","Languages of Europe","Cheeses","Bridges in Paris"]
titles=[]; grp={}
for c in cats:
    r=api('en',action='query',list='categorymembers',cmtitle='Category:'+c,cmnamespace=0,cmlimit=500); time.sleep(1.5)
    m=[x['title'] for x in r.get('query',{}).get('categorymembers',[])]; print(c,len(m),flush=True); titles+=m
    for t in m: grp.setdefault(t,c)
titles=sorted(set(titles)); print('en titles',len(titles))
# langlinks fr,de
ll={}
for i in range(0,len(titles),50):
    b=titles[i:i+50]; cont={}
    while True:
        r=api('en',action='query',titles='|'.join(b),prop='langlinks',lllimit='max',redirects=1,**cont)
        for pg in r.get('query',{}).get('pages',[]):
            for l in pg.get('langlinks',[]):
                if l['lang'] in ('fr','de'): ll.setdefault(pg['title'],{})[l['lang']]=l['title']
        if 'continue' in r: cont=r['continue']
        else: break
    time.sleep(1.0)
both=[t for t in ll if 'fr' in ll[t] or 'de' in ll[t]]; print('with fr or de',len(both))
def extracts(lang,tt):
    out={}
    for i in range(0,len(tt),20):
        r=api(lang,action='query',titles='|'.join(tt[i:i+20]),prop='extracts',exintro=1,explaintext=1,exlimit=20,redirects=1)
        m={}
        for n in r.get('query',{}).get('normalized',[])+r.get('query',{}).get('redirects',[]): m[n['to']]=n['from']
        for pg in r.get('query',{}).get('pages',[]):
            if 'extract' in pg: out[pg['title']]=pg['extract']
        time.sleep(1.0)
    return out
en=extracts('en',both)
frT=[ll[t]['fr'] for t in both if 'fr' in ll[t]]; deT=[ll[t]['de'] for t in both if 'de' in ll[t]]
fr=extracts('fr',frT); de=extracts('de',deT)
rows=[]
for t in both:
    a=en.get(t); b=fr.get(ll[t].get('fr')); c=de.get(ll[t].get('de'))
    if a and (b or c): rows.append({'group':grp.get(t),'en_title':t,'fr_title':ll[t].get('fr'),'de_title':ll[t].get('de'),'en':a,'fr':b,'de':c})
json.dump(rows,open('articles.json','w'),ensure_ascii=False); print('rows',len(rows),'fr',sum(1 for r in rows if r['fr']),'de',sum(1 for r in rows if r['de']))
