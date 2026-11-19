import re, json, math, importlib.util, sys, collections
src=open('align.py').read()
ns={}; exec(src.split("fr=scenes_fr")[0],ns); exec("import math\n"+src[src.index("def dp"):src.index("pairs=[]")],ns)   # reuse scenes_en and dp (definitions only)
t=open('henry-iv-part-1-german-wieland.txt',encoding='utf8').read().split('\n')
ACT=re.compile(r'^(Erster|Zweyter|Dritter|Vierter|Fünfter) Aufzug\.'); SC=re.compile(r'^(Erste|Zweyte|Dritte|Vierte|Fünfte|Sechste) Scene\.')
out=[]; act=0; cur=None
for i,ln in enumerate(t):
    if ACT.match(ln): act+=1; cur=None; continue
    if act and SC.match(ln): cur={'act':act,'speeches':[]}; out.append(cur); continue
    if cur is None: continue
    s=ln.strip()
    if not s or s.startswith('('): continue
    prev=t[i-1].strip() if i else ''
    if (not prev or prev.startswith('(')) and re.match(r'^[A-ZÄÖÜ][^\n]{0,38}\.$',s) and ' ' not in s[-2:] and i+1<len(t) and t[i+1].strip() and len(s.split())<=5:
        cur['speeches'].append(''); continue
    if cur['speeches']: cur['speeches'][-1]+=' '+s
en=ns['scenes_en'](open('henry-iv-part-1-modern.txt',encoding='utf8').read())
print('scenes en/de',len(en),len(out),collections.Counter(s['act'] for s in en),collections.Counter(s['act'] for s in out))
pairs=[]
for act in range(1,6):
    A=[(sc,x) for sc,s_ in enumerate(en) if s_['act']==act for x in s_['speeches']]; B=[y for s_ in out if s_['act']==act for y in s_['speeches']]
    for i,j in ns['dp']([x for _,x in A],B):
        sc,x=A[i]; y=B[j]
        if len(x.split())>=8 and len(y.split())>=8: pairs.append({'scene':sc,'act':act,'i':i,'j':j,'en':x.strip(),'fr':y.strip()})
import statistics as st
rat=[len(p['fr'].split())/len(p['en'].split()) for p in pairs]
print('pairs',len(pairs),collections.Counter(p['act'] for p in pairs),'ratio median',round(st.median(rat),2))
import os; os.makedirs('de',exist_ok=True); json.dump(pairs,open('de/pairs.json','w'),ensure_ascii=False)
import random; random.seed(3)
for x in random.sample(pairs,4): print(x['act'],x['scene'],'|',x['en'][:80],'|',x['fr'][:80])
