# Ratify the frozen frames at the referent level: score extracted numbers against the article's Wikidata item (scorer only).
import json, os, re, sys, time, math, collections, urllib.request, urllib.parse
# --- frozen extractors, loaded from their own files (no edits) ---
ns={'re':re,'json':json,'collections':collections,'math':math,'sys':sys}
f2=open('fluent2.py').read(); head=f2.split("TOL=0.05")[0].split("LANG=sys.argv[1]; DATA=sys.argv[2]")[1]; exec(head,ns)
f3=open('fluent3.py').read(); a=f3.index("MONTHS="); b=f3.index("TOL=0.05",a); exec(f3[a:b],ns)       # tie T2 + claim3
co=open('corrob.py').read(); a=co.index("U=r'"); b=co.index("def acmp"); exec(co[a:b],ns)           # area A
cl=open('claims.py').read(); a=cl.index("paren=re.compile"); b=cl.index("def verdict"); exec(cl[a:b],ns)  # life years
LANGS=('fr','de'); SETS=['fresh','fresh2','fresh3','fresh4']
def load(lang):
    P=[]
    for s in SETS:
        for p in json.load(open(f'{s}-{lang}.json')): P.append(dict(p,set=s))
    for p in json.load(open(f'{lang}/pairs.json')): P.append(dict(p,set='dev-or-held'))
    return P
data={l:load(l) for l in LANGS}
