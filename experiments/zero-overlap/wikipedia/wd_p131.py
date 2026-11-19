import json, sys, time, urllib.request, urllib.parse
sys.path.insert(0,'.')
UA="research-fetch/1.0 (Wikipedia API reader)"
cl=json.load(open('referents-cache.json'))
qs=sorted({q for t,q in cl['en'].items() if q})
out=json.load(open('wd-p131.json')) if __import__('os').path.exists('wd-p131.json') else {}
todo=[q for q in qs if q not in out]
print('items',len(qs),'todo',len(todo),flush=True)
for i in range(0,len(todo),50):
    b=todo[i:i+50]; u="https://www.wikidata.org/w/api.php?"+urllib.parse.urlencode({'action':'wbgetentities','ids':'|'.join(b),'props':'claims','format':'json'})
    r=None
    for k in range(5):
        try: r=json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=60)); break
        except Exception: time.sleep(2*2**k)
    if not r: continue
    for q,e in r.get('entities',{}).items():
        par=[]
        for c in e.get('claims',{}).get('P131',[]):
            if c.get('rank')=='deprecated': continue
            v=c.get('mainsnak',{}).get('datavalue',{}).get('value',{})
            if isinstance(v,dict) and v.get('id'): par.append(v['id'])
        out[q]=par
    if (i//50)%5==0: json.dump(out,open('wd-p131.json','w'))
    time.sleep(0.3)
json.dump(out,open('wd-p131.json','w')); print('done',len(out),flush=True)
