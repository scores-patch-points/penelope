// How many clauses of the lexical-analysis clause corpus contain referents khora's cast can name? (referent level, not strings)
import fs from "node:fs";
const K = "/Users/mlacy/Documents/khora-cast/khora/native";
const { createSession, admitChunked, sessionReferents } = await import(K + "/legacy-ported/packages/host/corpus.js");
const rows = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const regs = [...new Set(rows.map((r) => r.register))]; const out = {};
for (const reg of regs) {
  const cl = rows.filter((r) => r.register === reg); const text = cl.map((r) => r.clause).join("\n\n");
  const session = createSession(); admitChunked(session, { text, sourceId: "file:" + reg, language: "en" });
  const cast = sessionReferents(session, { sourceId: "file:" + reg, priors: [], limit: 3000 });
  const refs = (cast.referents ?? []).filter((r) => (r.mentions ?? 0) >= 2);
  const surf = refs.map((r) => ({ id: r.id, ss: [...new Set([...(r.surfaces ?? []), r.display])].filter((x) => x && x.length > 2) }));
  let c1 = 0, c2 = 0, pron = 0; const nref = [];
  for (const r of cl) { const hit = new Set(surf.filter((x) => x.ss.some((s) => r.clause.includes(s))).map((x) => x.id)); if (hit.size >= 1) c1++; if (hit.size >= 2) c2++; nref.push(hit.size); }
  out[reg] = { clauses: cl.length, referents: refs.length, withAtLeast1: +(c1 / cl.length).toFixed(3), withAtLeast2: +(c2 / cl.length).toFixed(3), pronounMentions: (cast.referents ?? []).reduce((a, r) => a + (r.pronounMentions ?? 0), 0), top: refs.sort((a, b) => b.mentions - a.mentions).slice(0, 8).map((r) => r.display) };
  console.log(reg, JSON.stringify(out[reg]));
}
