import fs from "node:fs";
const KH=process.env.KH, W=process.env.W; const { readWith } = await import(KH+"/native/the-fold/read-core.mjs");
const LANGS={en:"eng",fr:"fra",de:"deu"}; const files=["","2","3","4","5"];
const out={en:{},fr:{},de:{}}; const OUT=`${W}/wikipedia/khora-reads.json`;
if (fs.existsSync(OUT)) Object.assign(out, JSON.parse(fs.readFileSync(OUT,"utf8")));
const cond=(s)=>s;
function one(text, language){
  try {
    const e=readWith(text,{language,referents:true,castIdentity:true}); const r=e.referents;
    if(!r) return {none:true, gaps:(e.gaps||[]).map(g=>g.gap)};
    const f=id=>r.referents.find(x=>x.id===id)?.face;
    return { refs:r.referents.map(x=>({id:x.id,face:x.face,forms:x.forms,m:(x.mentions||[]).length})), edges:r.edges.map(ed=>[f(ed.ends[0]?.ref),ed.label,f(ed.ends[1]?.ref)]), gaps:(e.gaps||[]).map(g=>g.gap) };
  } catch(err){ return {err:String(err?.message||err).slice(0,120)}; }
}
let n=0;
for (const fx of files) for (const L of ["fr","de"]) {
  const P=JSON.parse(fs.readFileSync(`${W}/wikipedia/fresh${fx}-${L}.json`,"utf8"));
  for (const p of P) {
    if (!(p.title in out.en)) out.en[p.title]=one(p.en,"eng");
    if (!(p.title in out[L])) out[L][p.title]=one(p.fr,LANGS[L]);
    if (++n%100===0) { fs.writeFileSync(OUT,JSON.stringify(out)); console.log(n, Object.keys(out.en).length, Object.keys(out.fr).length, Object.keys(out.de).length); }
  }
}
fs.writeFileSync(OUT,JSON.stringify(out)); console.log("done", Object.keys(out.en).length, Object.keys(out.fr).length, Object.keys(out.de).length);
