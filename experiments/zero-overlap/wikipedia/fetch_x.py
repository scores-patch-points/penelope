import json, sys, time
LANGARG=sys.argv[1]; sys.argv=['x']; src=open('fetch.py').read().split("subs=")[0].split("cats=")[0]
exec(src.split("def api")[0]); exec("def api"+src.split("def api")[1])
rows=json.load(open('articles.json')); titles=[r['en_title'] for r in rows]; lang=LANGARG
ll={}
for i in range(0,len(titles),50):
    b=titles[i:i+50]; cont={}
    while True:
        r=api('en',action='query',titles='|'.join(b),prop='langlinks',lllimit='max',redirects=1,lllang=lang,**cont)
        for pg in r.get('query',{}).get('pages',[]):
            for l in pg.get('langlinks',[]):
                if l['lang']==lang: ll[pg['title']]=l['title']
        if 'continue' in r: cont=r['continue']
        else: break
    time.sleep(1.0)
print(lang,'links',len(ll),flush=True)
def extracts(l,tt):
    out={}
    for i in range(0,len(tt),20):
        r=api(l,action='query',titles='|'.join(tt[i:i+20]),prop='extracts',exintro=1,explaintext=1,exlimit=20,redirects=1)
        for pg in r.get('query',{}).get('pages',[]):
            if 'extract' in pg: out[pg['title']]=pg['extract']
        time.sleep(1.0)
    return out
x=extracts(lang,list(ll.values()))
for r in rows: r[lang]=x.get(ll.get(r['en_title']))
json.dump(rows,open(f'articles-{lang}.json','w'),ensure_ascii=False); print('rows with',lang,sum(1 for r in rows if r.get(lang)))
