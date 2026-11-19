// Dumps the relation triples khora's constitutional host reader finds in one text file (read-only use of khora's corpus.js).
import fs from "node:fs";
import { createSession, admitChunked, sessionReferents, sessionRelations } from "/Users/mlacy/Documents/khora-cast/khora/native/legacy-ported/packages/host/corpus.js";
const [,, path, language = "en"] = process.argv;
const text = fs.readFileSync(path, "utf8"), sourceId = "file:" + path.split("/").pop();
const session = createSession(); admitChunked(session, { text, sourceId, language });
const cast = sessionReferents(session, { sourceId, priors: [], limit: 300 });
const rel = sessionRelations(session, { sourceId });
const list = rel?.relations ?? rel ?? [];
console.log(JSON.stringify({ n: list.length, keys: list[0] ? Object.keys(list[0]) : [], sample: list.slice(0, 8), referents: (cast.referents ?? []).length, relKeys: Object.keys(rel ?? {}) }, null, 1));
fs.writeFileSync(path.replace(/\.txt$/, ".triples.json"), JSON.stringify(list));
