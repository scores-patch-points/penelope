"""python3 resolution_test.py  -- PREREG-RESOLUTION.md (EXPLORATORY, F2 re-fetched; ledger row 37). The frozen extractor R2 (fluent2.py) is loaded unchanged.
Wikidata is the SCORER only. For every population dispute (true pair or same-scene impostor), is the offending number the population of the item's capital (P36),
parent (P131) or country (P17)? i.e. a Resolution difference, not a Conflict."""
import json, os, re, sys, math, time, collections, urllib.request, urllib.parse
import referents as R
ns = {'re': re, 'json': json, 'collections': collections, 'math': math, 'sys': sys}
f2 = open('fluent2.py').read()
exec(f2.split("TOL=0.05")[0].split("LANG=sys.argv[1]; DATA=sys.argv[2]")[1], ns)
a = f2.index("TOL=0.05"); b = f2.index("if DATA=='dev'"); exec(f2[a:b], ns)
claim, cmp2, TOL, RATE, OBS = ns['claim'], ns['cmp2'], ns['TOL'], ns['RATE'], ns['OBS']
LANGS = ('fr', 'de')
data = {L: json.load(open(f'fresh2-{L}.json')) for L in LANGS}
titles = sorted({p['title'] for L in LANGS for p in data[L]})
print('pairs', {L: len(data[L]) for L in LANGS}, 'unique en titles', len(titles), flush=True)
qid = R.resolve('en', titles)
print('items resolved', sum(1 for t in titles if qid.get(t)), 'of', len(titles), flush=True)
WD = 'wd-res.json'; wd = json.load(open(WD)) if os.path.exists(WD) else {}
def api(**p):
    p.update(format='json'); u = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(p)
    for k in range(5):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'research-fetch/1.0 (Wikidata API reader)'}), timeout=60))
        except Exception: time.sleep(2 * 2 ** k)
def year_of(q):
    for x in q.get('P585', []):
        v = x.get('datavalue', {}).get('value', {})
        m = re.match(r'[+-](\d{4})', v.get('time', '')) if isinstance(v, dict) else None
        if m: return int(m.group(1))
    return None
def compact(ent):
    cl = ent.get('claims', {}); pop = []
    for c in cl.get('P1082', []):
        if c.get('rank') == 'deprecated': continue
        v = c.get('mainsnak', {}).get('datavalue', {}).get('value', {})
        try: amt = float(v['amount'])
        except Exception: continue
        pop.append((year_of(c.get('qualifiers', {})), amt))
    def ids(p): return [c['mainsnak']['datavalue']['value']['id'] for c in cl.get(p, []) if c.get('rank') != 'deprecated' and c.get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('id')] if cl.get(p) else []
    return {'pop': pop, 'P36': ids('P36'), 'P131': ids('P131'), 'P17': ids('P17')}
def fetch(ids):
    todo = [i for i in dict.fromkeys(ids) if i and i not in wd]
    for i in range(0, len(todo), 50):
        r = api(action='wbgetentities', ids='|'.join(todo[i:i + 50]), props='claims')
        for q, e in (r or {}).get('entities', {}).items(): wd[q] = compact(e)
        time.sleep(0.3)
    json.dump(wd, open(WD, 'w'))
items = [qid[t] for t in titles if qid.get(t)]
fetch(items)
rel = [x for q in items if q in wd for k in ('P36', 'P131', 'P17') for x in wd[q][k][:1]]
fetch(rel)
print('wikidata entities cached', len(wd), flush=True)
def pop_at(q, year):
    """the item's population matching `year` (nearest dated within 5 years; undated claim: latest dated value) -> (value, gap)"""
    pv = wd.get(q, {}).get('pop', [])
    dated = [(y, v) for y, v in pv if y]
    if year is not None and dated:
        y, v = min(dated, key=lambda t: abs(t[0] - year)); return (v, abs(y - year)) if abs(y - year) <= 5 else (None, None)
    if dated: y, v = max(dated); return v, min(abs(OBS - y), 10)
    if pv: return pv[0][1], 5
    return None, None
def matches(value, year, q):
    v, gap = pop_at(q, year)
    if v is None: return None
    return abs(value - v) / max(value, v) <= TOL + RATE * gap
def classify(claims, item):
    """claims: [(value, year, role)] the numbers of a disputed pair; item: the Wikidata item they should describe."""
    if item not in wd or not wd[item]['pop']: return 'NO-ITEM-DATA', None
    own = [matches(c[0], c[1], item) for c in claims]
    off = [c for c, m in zip(claims, own) if m is False]
    if not off: return ('OWN-EXPLAINED' if any(own) else 'NO-ITEM-DATA'), None
    for c in off:
        for kind in ('P36', 'P131', 'P17'):
            for x in wd[item][kind][:1]:
                if matches(c[0], c[1], x): return 'RESOLUTION-EXPLAINED', kind
    return 'UNEXPLAINED', None
def wil(k, n):
    if n == 0: return (float('nan'), float('nan'))
    z = 1.96; p = k / n; d = 1 + z * z / n; c = p + z * z / (2 * n); h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return ((c - h) / d, (c + h) / d)
for L in LANGS:
    P = data[L]; by = collections.defaultdict(list)
    for p in P: by[p['scene']].append(p)
    for p in P: p['ce'] = claim(p['en'], 'en'); p['cf'] = claim(p['fr'], L)
    T = collections.defaultdict(collections.Counter); S = collections.defaultdict(collections.Counter); ex = []
    for p in P:
        if not (p['ce'] and p['cf']): continue
        v, inf = cmp2(p['ce'], p['cf'])
        if v in ('dispute', 'would-dispute'):
            cls, kind = classify([(p['ce']['value'], p['ce']['at'], 'en'), (p['cf']['value'], p['cf']['at'], L)], qid.get(p['title']))
            T[inf][cls + (':' + kind if kind else '')] += 1; ex.append((p['title'], p['ce'], p['cf'], inf, cls, kind))
        for q in by[p['scene']]:
            if q is p or not q['cf']: continue
            v2, inf2 = cmp2(p['ce'], q['cf'])
            if v2 not in ('dispute', 'would-dispute'): continue
            # an impostor disagreement: each side should describe its OWN item; the offending side is judged against ITS item
            cp, kp = classify([(p['ce']['value'], p['ce']['at'], 'en')], qid.get(p['title']))
            cq, kq = classify([(q['cf']['value'], q['cf']['at'], L)], qid.get(q['title']))
            if 'NO-ITEM-DATA' in (cp, cq): S[inf2]['NO-ITEM-DATA'] += 1
            elif cp == 'OWN-EXPLAINED' and cq == 'OWN-EXPLAINED': S[inf2]['CONFLICT-REAL (both match their own item)'] += 1
            elif 'RESOLUTION-EXPLAINED' in (cp, cq): S[inf2]['RESOLUTION-EXPLAINED'] += 1
            else: S[inf2]['UNEXPLAINED'] += 1
    print(f"== {L}: {len(P)} pairs")
    for inf, label in ((False, 'stated-both'), (True, 'untimed-involved')):
        t = T[inf]; n = sum(t.values()); judged = sum(v for k, v in t.items() if not k.startswith('NO-ITEM'))
        k = sum(v for kk, v in t.items() if kk.startswith('RESOLUTION'))
        print(f"   TRUE-PAIR disputes {label:16s} n={n}: {dict(t)}  RESOLUTION-EXPLAINED {k}/{judged} = {k/max(judged,1):.3f} Wilson95 [{wil(k,judged)[0]:.3f}, {wil(k,judged)[1]:.3f}]")
        s = S[inf]; m = sum(s.values()); jm = sum(v for kk, v in s.items() if kk != 'NO-ITEM-DATA'); ks = s.get('RESOLUTION-EXPLAINED', 0)
        print(f"   IMPOSTOR disputes  {label:16s} n={m}: {dict(s)}  RESOLUTION-EXPLAINED {ks}/{jm} = {ks/max(jm,1):.3f} Wilson95 [{wil(ks,jm)[0]:.3f}, {wil(ks,jm)[1]:.3f}]")
    for e in ex: print('      TRUE-PAIR', e)
