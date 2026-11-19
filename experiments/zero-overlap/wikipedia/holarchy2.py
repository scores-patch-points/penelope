import sys, json, random, collections
LANG=sys.argv[1]; FILES=sys.argv[2:]
src=open('holarchy.py').read().split("print(f\"== {LANG}")[0].replace("LANG=sys.argv[1]; FILES=sys.argv[2:]","")
exec(src)
rng=random.Random(20261118)
def verdicts(ce,co):
    n=len(ce); out=[]
    for p in range(n):
        RE={m for m in range(n) if ce[m]==ce[p]}
        J=[]
        for k in range(n):
            RO={m for m in range(n) if co[m]==co[k]}
            J.append(len(RE&RO)/len(RE|RO))
        mx=max(J); M={k for k in range(n) if J[k]==mx}
        out.append((p in M, len(M)))
    return out
R=[0,0]; Msz=[0,0]; N=0; REJ=0.0; nul=[]; used=0; scenes=0
for sc,mem in by.items():
    m=[p for p in mem if p['ce'] and p['co']]
    if len(m)<8: continue
    scenes+=1; n=len(m); ce=[p['ce'] for p in m]; co=[p['co'] for p in m]; used+=n
    v=verdicts(ce,co)
    R[0]+=sum(1 for a,_ in v if a); R[1]+=n; Msz[0]+=sum(s for _,s in v); Msz[1]+=n*n; REJ+=sum(1-(s-1)/(n-1) for _,s in v)
    rr=[]
    for k in range(200):
        sh=co[:]; rng.shuffle(sh); w=verdicts(ce,sh); rr.append((sum(1 for a,_ in w if a),sum(1-(s-1)/(n-1) for _,s in w)))
    nul.append(rr)
if not scenes: print(LANG,'no scenes'); sys.exit()
rec=R[0]/R[1]; rej=REJ/R[1]; nar=Msz[0]/Msz[1]
nr=[sum(nul[s][k][0] for s in range(scenes))/R[1] for k in range(200)]; nj=[sum(nul[s][k][1] for s in range(scenes))/R[1] for k in range(200)]
print(f"== {LANG}: {scenes} scenes, {used} members with both containers (of {len(P)} pairs)")
print(f"   RECALL (true counterpart in M(p)) {rec:.3f}  |  mean |M|/n {nar:.3f}  |  impostor REJECTION {rej:.3f}")
print(f"   shuffle null: recall mean {sum(nr)/200:.3f} (95th {sorted(nr)[189]:.3f}); rejection mean {sum(nj)/200:.3f} (95th {sorted(nj)[189]:.3f})")

nb=[(nr[k]+nj[k])/2 for k in range(200)]
print(f"   POST-HOC (added after seeing the two numbers above): balanced (recall+rejection)/2 observed {(rec+rej)/2:.3f}; shuffle null mean {sum(nb)/200:.3f}, 95th {sorted(nb)[189]:.3f}")
