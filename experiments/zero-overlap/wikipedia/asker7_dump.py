# F7: frozen extractors -> the organ's node folds, for TRUE pairs, NATURAL impostors and INFORMED impostors (PREREG-ASKER-F7).
import json, re, sys, random, collections
src=open('ratify.py').read().split("LANGS=")[0]            # loads the frozen extractors into ns (fluent2/fluent3/corrob/claims)
exec(src)
LANGS=('fr','de'); rng=random.Random(20261118)
def nodes(text,title):
    out=[]
    m=ns['AK'].search(text) or ns['AM'].search(text)
    a=ns['area'](text)
    if m and a:
        out.append({'id':'area','dim':'area','value':a,'at':None,'strength':'strong','tied':bool(ns['tied'](text,m.start(),m.end(),title)),'dependsOn':[]})
    lf=ns['claims'](text)
    if 'born_year' in lf: out.append({'id':'born','dim':'year','value':lf['born_year'],'at':None,'strength':'strong','tied':True,'dependsOn':[]})
    if 'died_year' in lf: out.append({'id':'died','dim':'year','value':lf['died_year'],'at':None,'strength':'strong','tied':True,'dependsOn':['born']})
    return out
def forge(claimant_en_nodes,target_text):
    d={n['id']:n['value'] for n in claimant_en_nodes}; pre=''
    if 'born' in d or 'died' in d: pre+=f"({int(d.get('born',0)) or ''} – {int(d.get('died',0)) or ''}) " if 'born' in d and 'died' in d else (f"(born {int(d['born'])}) " if 'born' in d else '')
    if 'area' in d: pre+=f"Area: {d['area']:.0f} km2. "
    return pre+target_text if pre else None
def forge2(claimant_en_nodes,target_text):
    d={n['id']:n['value'] for n in claimant_en_nodes}; pre=''
    if 'born' in d and 'died' in d: pre+=f"(1 January {int(d['born'])} \u2013 1 January {int(d['died'])}) "
    elif 'born' in d: pre+=f"(born 1 January {int(d['born'])}) "
    if 'area' in d: pre+=f"Area: {d['area']:.0f} km2. "
    return pre+target_text if pre else None
out=[]
for lang in LANGS:
    P=json.load(open(f'fresh7-{lang}.json')); by=collections.defaultdict(list)
    for p in P: by[p['scene']].append(p)
    for p in P:
        en=nodes(p['en'],p['title']); ot=nodes(p['fr'],p['title'])
        mates=[q for q in by[p['scene']] if q is not p]; picks=rng.sample(mates,min(30,len(mates)))
        nat=[nodes(q['fr'],q['title']) for q in picks]
        inf=None
        if picks:
            ft=forge(en,picks[0]['fr'])
            if ft: inf=nodes(ft,picks[0]['title'])
        inf2=None
        if picks:
            ft=forge2(en,picks[0]['fr'])
            if ft: inf2=nodes(ft,picks[0]['title'])
        out.append({'lang':lang,'scene':p['scene'],'title':p['title'],'en':en,'true':ot,'nat':nat,'inf':inf,'inf2':inf2})
json.dump(out,open('asker7-nodes.json','w'))
print('pairs',len(out),'with an informed arm',sum(1 for o in out if o['inf'] is not None))
