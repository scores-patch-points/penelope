import json, re, hashlib, collections, sys
lang=sys.argv[1]; rows=json.load(open('articles.json' if lang in ('fr','de') else f'articles-{lang}.json'))
def clip(t,n=120): return ' '.join(t.split()[:n])
grp={}; pairs=[]
for r in rows:
    if not r.get(lang): continue
    en,xx=clip(r['en']),clip(r[lang])
    if len(en.split())<8 or len(xx.split())<8: continue
    g=grp.setdefault(r['group'],len(grp)); h=int(hashlib.sha256((r['en_title']+'wp-2026-11-18').encode()).hexdigest(),16)%20
    act=1 if h<8 else 2 if h<12 else 3 if h<15 else 4
    pairs.append({'scene':g,'act':act,'title':r['en_title'],'en':en,'fr':xx})
import os; os.makedirs(lang,exist_ok=True); json.dump(pairs,open(f'{lang}/pairs.json','w'),ensure_ascii=False)
print(lang,'pairs',len(pairs),dict(collections.Counter(p['act'] for p in pairs)),'groups',len(grp))
