import sys, json, re, collections
LANG=sys.argv[1]; OUT=sys.argv[2]; MYFILES=sys.argv[3:]
sys.argv=['x',LANG]
exec(open('corrob.py').read().split("P=[]; off=0")[0].replace("LANG=sys.argv[1]; FILES=sys.argv[2:]","LANG='%s'; FILES=[]"%LANG))
sys.path.insert(0,'.')
# life-span claims from claims.py (frozen rules)
cl=open('claims.py').read(); a=cl.index("paren=re.compile"); b=cl.index("def verdict")
exec(cl[a:b])
rows=[]; off=0
for f in MYFILES:
    for p in json.load(open(f)):
        rows.append({'scene':p['scene']+off,'title':p['title'],
          'en':{'area':area(p['en']),'life':claims(p['en']),'pop':(claim(p['en'],'en') or {}).get('value')},
          'ot':{'area':area(p['fr']),'life':claims(p['fr']),'pop':(claim(p['fr'],LANG) or {}).get('value')}})
    off+=1000
json.dump(rows,open(OUT,'w'))
print(LANG,len(rows))
