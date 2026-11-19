# referents.py — resolve link targets to REFERENTS (Wikidata items) through each wiki's own API; string-only fallback. A giver: it nominates, never decides a pair.
import json, os, re, time, urllib.request, urllib.parse
UA="research-fetch/1.0 (Wikipedia API reader)"
CACHE='referents-cache.json'
_c=json.load(open(CACHE)) if os.path.exists(CACHE) else {}
def _save(): json.dump(_c,open(CACHE,'w'),ensure_ascii=False)
NS=re.compile(r'^(file|image|category|template|wikipedia|help|portal|special|talk|user|media|draft|module|datei|kategorie|vorlage|fichier|catégorie|modèle|bild|hilfe|portail|spécial|wikt|wiktionary|commons|c|w|d|q|s|m|b|n|v|iw|wikidata|simple|en|fr|de|it|es|ru|ja|zh|nl|sv|pt|pl)?:',re.I)
def norm(t):
    t=t.split('#')[0].replace('_',' ').strip()
    return t[:1].upper()+t[1:] if t else t
def extract_links(wt):
    out=[]
    for m in re.finditer(r'\[\[([^\[\]|]+)(?:\|[^\[\]]*)?\]\]',wt):
        t=m.group(1).strip()
        if not t or t.startswith(':') or NS.match(t) and ':' in t: 
            if not (t.startswith(':') and not NS.match(t[1:])): continue
            t=t[1:]
        t=norm(t)
        if t: out.append(t)
    return out
def _api(lang,**p):
    p.update(format='json',formatversion='2'); u=f"https://{lang}.wikipedia.org/w/api.php?"+urllib.parse.urlencode(p)
    for k in range(5):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=40))
        except Exception: time.sleep(2*2**k)
    return None
import threading
from concurrent.futures import ThreadPoolExecutor
_lock=threading.Lock()
def _one(lang,b,cl):
    r=_api(lang,action='query',titles='|'.join(b),prop='pageprops',ppprop='wikibase_item',redirects='1')
    if not r: return
    q=r.get('query',{}); nm={x['from']:x['to'] for x in q.get('normalized',[])}; rd={x['from']:x['to'] for x in q.get('redirects',[])}
    qid={pg['title']:pg.get('pageprops',{}).get('wikibase_item') for pg in q.get('pages',[]) if not pg.get('missing')}
    with _lock:
        for t in b:
            f=nm.get(t,t); f=rd.get(f,f); cl[t]=qid.get(f)
def resolve(lang,targets,sleep=0.1,workers=4):
    cl=_c.setdefault(lang,{}); todo=[t for t in dict.fromkeys(targets) if t not in cl]
    batches=[todo[i:i+50] for i in range(0,len(todo),50)]
    with ThreadPoolExecutor(workers) as ex:
        for k,_ in enumerate(ex.map(lambda b:(_one(lang,b,cl),time.sleep(sleep)),batches)):
            if k%40==0:
                with _lock: _save()
    with _lock: _save()
    return {t:(cl.get(t)) for t in targets}
def referent(lang,target,res):
    q=res.get(target); return q if q else f"str:{lang}:{target.lower()}"
