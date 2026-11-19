# Per-dimension curves, silent share, base rate and precision for the asker run (answers the hostile review). EXPLORATORY / REUSED.
import json, re, sys, math, random, collections
exec(open('asker_head.py').read())
exec(open('asker.py').read().split("ID=('area'")[0].split("exec(open('asker_head.py').read())")[1])
DIMS=['area','born_year','died_year','pop']
for lang in LANGS:
    P=data[lang]; by=collections.defaultdict(list)
    for p in P: by[(p['set'],p['scene'])].append(p)
    for p in P: p['dE']=dims(p['en'],'en',p['title']); p['dO']=dims(p['fr'],lang,p['title'])
    stat={d:{'true':[[0,0] for _ in REL],'imp':[[0,0] for _ in REL]} for d in DIMS+['any_identity']}
    silent=0; n_true=len(P)
    for p in P:
        has=False
        for kind,others in (('true',[p]),('imp',random.sample([q for q in by[(p['set'],p['scene'])] if q is not p],min(30,len(by[(p['set'],p['scene'])])-1)))):
            for q in others:
                for d in DIMS:
                    df=diffs(p['dE'],q['dO'],(d,))
                    if not df: continue
                    if kind=='true': has=has or d!='pop'
                    for L in range(len(REL)):
                        v=equiv(df,L); stat[d][kind][L][0]+=1; stat[d][kind][L][1]+=v
        if not has: silent+=1
    print(f"== {lang}: true pairs {n_true}; no identity verdict (silent) {silent} = {silent/n_true:.3f}")
    for d in DIMS:
        t=stat[d]['true']; i=stat[d]['imp']
        row=[f"L{L}: T {t[L][1]/t[L][0]:.3f} I {i[L][1]/i[L][0]:.3f}" if t[L][0] and i[L][0] else f"L{L}: n/a" for L in range(len(REL))]
        nt,ni=t[0][0],i[0][0]; tt,ii=t[5][1],i[5][1]
        prec=tt/(tt+ii) if tt+ii else float('nan')
        print(f"  {d:10s} n_true {nt:4d} n_imp {ni:6d} (base rate {nt/(nt+ni):.3f}) | "+" | ".join(row)+f" | precision at tightest {prec:.3f} (TP {tt}, FP {ii})")
