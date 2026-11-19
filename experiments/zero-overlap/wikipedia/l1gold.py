import sys, json, collections
sys.path.insert(0,'.')
sys.argv=['x','fr','fresh-fr.json','fresh2-fr.json','fresh3-fr.json','fresh4-fr.json','fresh5-fr.json']
exec(open('l1.py').read().split("def wil(k,n):")[0])
GOLD=json.load(open('wd-p131.json')); EN=R._c['en']
# English side only: for each member with a gold parent, was the parent among its lead links, and did L1 pick it?
def run(files_tag, P_sub):
    n=have_gold=parent_linked=hit=0; per=collections.defaultdict(lambda:[0,0,0,0])
    for sc,mem in by.items():
        e,_,_=containers('en',mem)
        for p in mem:
            if p not in P_sub: continue
            q=EN.get(p['title']); par=GOLD.get(q) if q else None
            per[sc][0]+=1
            if not par: continue
            per[sc][1]+=1
            L=links('en',p['title']) or []
            lr={R.referent('en',x,{x:EN.get(x) if False else R._c['en'].get(x)}) for x in L if R._c['en'].get(x)}
            linked=any(g in lr for g in par); per[sc][2]+=linked
            c=e.get(p['title']); h=(c in par) if c else False; per[sc][3]+=h
    t=[sum(v[i] for v in per.values()) for i in range(4)]
    return t,per
import re
Pall=P
t,per=run('all',set(map(id,[])) if False else P)
print(f"all F1-F5 (fr files; EN side): members {t[0]}; with a Wikidata P131 parent {t[1]}; parent appears among the (resolved) lead links {t[2]}; L1 container == a gold parent {t[3]}")
print(f"   of members with a gold parent: parent linked {t[2]/max(t[1],1):.3f}; L1 hit {t[3]/max(t[1],1):.3f}; L1 hit given linked {t[3]/max(t[2],1):.3f}")
for sc,v in sorted(per.items(),key=lambda x:-x[1][1])[:10]: print(f"   scene {sc}: members {v[0]}, gold parent {v[1]}, linked {v[2]}, L1 hit {v[3]}")
