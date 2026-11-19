import sys, json
sys.path.insert(0,'.')
import referents as R
WT=json.load(open('wt-cache.json'))
for L in ('fr','en','de'):
    ts=[]
    for t,wt in WT[L].items(): ts+=R.extract_links(wt)
    u=list(dict.fromkeys(ts)); todo=[x for x in u if x not in R._c.get(L,{})]
    print(L,'unique link targets',len(u),'to resolve',len(todo),flush=True)
    R.resolve(L,u,0.05,8); print(L,'done',flush=True)
