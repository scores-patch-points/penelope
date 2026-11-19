import re, json
def scenes_fr(t):
    L=t.split('\n'); out=[]; act=0; cur=None
    for ln in L:
        if re.match(r'\s*ACTE (PREMIER|DEUXI|TROISI|QUATRI|CINQUI)',ln):
            act+=1
        if re.match(r'\s*SC[ÈE]NE [IVX]+\.?\s*$',ln) and act: cur={'act':act,'speeches':[]}; out.append(cur); continue
        if cur is None: continue
        if re.match(r'\s*FIN DU',ln): cur=None; continue
        m=re.match(r"^([A-ZÉÈÊÀÂÎÔÛÇ' \-\.]{2,40})\.--(.*)",ln)
        if m: cur['speeches'].append(m.group(2)); continue
        if ln.strip() and cur['speeches'] and not ln.startswith('_') : cur['speeches'][-1]+=' '+ln.strip()
    return out
def scenes_en(t):
    L=t.split('\n'); out=[]; act=0; cur=None; started=False
    for i,ln in enumerate(L):
        if i<84: continue
        if re.match(r'^ACT [IVX]+$',ln.strip()): act+=1
        if re.match(r'^SCENE [IVX]+\.',ln): cur={'act':act,'speeches':[]}; out.append(cur); continue
        if re.match(r'^(THE END|\*\*\*)',ln): break
        if cur is None: continue
        m=re.match(r"^([A-Z][A-Z' \-\.]{1,40})\.$",ln.strip())
        if m and ln==ln.lstrip(): cur['speeches'].append(''); continue
        if ln.strip() and cur['speeches'] and not re.match(r'^(Enter|Exit|Exeunt|\[)',ln.strip()): cur['speeches'][-1]+=' '+ln.strip()
    return out
fr=scenes_fr(open('henry-iv-part-1-french-guizot.txt',encoding='utf8').read())
en=scenes_en(open('henry-iv-part-1-modern.txt',encoding='utf8').read())
print(len(fr),len(en))
import math
def dp(A,B):
    # length-only alignment, 1-1 matches and skips; no lexicon. cost of 1-1 = squared log length deviation from the global ratio 1.17; skip = 2.0
    n,m=len(A),len(B); la=[max(1,len(x)) for x in A]; lb=[max(1,len(y)) for y in B]
    INF=1e9; D=[[INF]*(m+1) for _ in range(n+1)]; P=[[None]*(m+1) for _ in range(n+1)]; D[0][0]=0
    for i in range(n+1):
        for j in range(m+1):
            if D[i][j]>=INF: continue
            if i<n and D[i][j]+2.0<D[i+1][j]: D[i+1][j]=D[i][j]+2.0; P[i+1][j]=(i,j,0)
            if j<m and D[i][j]+2.0<D[i][j+1]: D[i][j+1]=D[i][j]+2.0; P[i][j+1]=(i,j,0)
            if i<n and j<m:
                c=D[i][j]+(math.log(lb[j]/(1.17*la[i])))**2
                if c<D[i+1][j+1]: D[i+1][j+1]=c; P[i+1][j+1]=(i,j,1)
    out=[]; i,j=n,m
    while (i,j)!=(0,0):
        pi,pj,k=P[i][j]
        if k: out.append((pi,pj))
        i,j=pi,pj
    return out[::-1]
pairs=[]
for s,(a,b) in enumerate(zip(en,fr)):
    ne,nf=len(a['speeches']),len(b['speeches']); ok=ne==nf
    print(s,a['act'],b['act'],ne,nf,'EQ' if ok else '')
    for i,j in dp(a['speeches'],b['speeches']):
        x,y=a['speeches'][i],b['speeches'][j]
        if len(x.split())>=8 and len(y.split())>=8: pairs.append({'scene':s,'act':a['act'],'i':i,'j':j,'en':x.strip(),'fr':y.strip()})
rat=[len(p['fr'].split())/len(p['en'].split()) for p in pairs]
import statistics as st
print('pairs',len(pairs),'len ratio median',round(st.median(rat),2),'p5',round(sorted(rat)[len(rat)//20],2),'p95',round(sorted(rat)[-len(rat)//20],2))
json.dump(pairs,open('pairs.json','w'),ensure_ascii=False)
