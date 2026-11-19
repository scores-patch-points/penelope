import sys, json, collections, re, unicodedata
sys.argv=['x','none',sys.argv[1]]
src=open('judge.py').read().split("mode=sys.argv[1]")[0]
exec(src)
tr=[p for p in P if p['act']<=2]; dfe=collections.Counter(); dff=collections.Counter()
for p in tr: dfe.update(set(p['et'])); dff.update(set(p['ft']))
se=set(sorted(dfe,key=lambda w:(-dfe[w],w))[:50]); sf=set(sorted(dff,key=lambda w:(-dff[w],w))[:50])
M={'stop_e':se,'stop_f':sf}
dev=[p for p in P if p['act']==3]; sh=sorted(base_score(p,p,M) for p in dev)
q25=sh[len(sh)//4]; print(LANG,'dev shared-token counts: min',sh[0],'q25',q25,'median',sh[len(sh)//2],'zero',sum(1 for x in sh if x==0),'<=q25',sum(1 for x in sh if x<=q25),'of',len(sh))
json.dump({'low_max':q25},open(LANG+'/lowthr.json','w'))
