// gym/nomodel-prose.mjs — the PROSE-specific half of the no-model Weave diagnostic.
//
// gym/weave-nomodel.mjs is artifact-neutral: it runs weave({noModel:true}), arms a
// tripwire on every model door, and audits the stage counts and the provenance.
// Everything here is what is medium-specific about prose, and it only READS the
// organs the prose adapter already uses — it never drafts, never calls a model,
// and never substitutes one:
//
//   loadField()        a retained corpus (the "shadow": url -> text), real files
//   startSearchShim()  the hunt's transport when the production endpoint cannot
//                      boot (explore-server needs the legacy eoreader submodule).
//                      It answers the SAME contract the adapter's hunt posts to
//                      ({query} -> {results:[{url,title}]}) from Wikipedia's
//                      real search API. Disclosed as a transport substitute.
//   proseFoldArms()    the fold, run two ways over the SAME folded artifact:
//                        shipped   exactly what adapter.testUnits does
//                        contract  the fold given what its own header says it
//                                  uses: the whole retained ground + the void's
//                                  own cells as beats. No rule is relaxed.
//   evidenceCeiling()  how much DISTINCT, ADMISSIBLE material the retained
//                      ground can supply at all, independent of structure.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";

const ER7 = () => process.env.ER7_HOME ?? "/home/user/eoreader7";
const words = (s) => String(s ?? "").split(/\s+/).filter(Boolean).length;

let organs = null;
export async function loadOrgans() {
  if (organs) return organs;
  const home = ER7();
  const web = await import(`${home}/native/organs/web.js`);
  const ledger = await import(`${home}/native/the-fold/document-ledger.js`);
  const fold = await import(`${home}/native/the-fold/essay-fold.js`);
  organs = { ...web, ...ledger, ...fold };
  return organs;
}

/** Load real files as the retained field. .html goes through the web organ's own
 *  extractReadable (the same organ the fold's reading uses), anything else as-is. */
export async function loadField(files = []) {
  const o = await loadOrgans();
  const shadow = new Map();
  for (const f of files) {
    const raw = fs.readFileSync(f, "utf8");
    const text = /\.html?$/i.test(f) ? String(o.extractReadable(raw).text ?? "") : raw;
    shadow.set(`field:${path.basename(f)}`, text);
  }
  return shadow;
}

/** The hunt's search transport. Same contract the adapter's hunt() posts to. */
export async function startSearchShim({ cacheDir } = {}) {
  const log = [];
  const cache = (q) => (cacheDir ? path.join(cacheDir, `search-${crypto.createHash("sha1").update(q).digest("hex").slice(0, 16)}.json`) : null);
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const c of req) body += c;
    const q = String(JSON.parse(body || "{}").query ?? "");
    const f = cache(q);
    if (f && fs.existsSync(f)) {
      log.push({ q, cached: true });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(fs.readFileSync(f));
      return;
    }
    let out = { results: [], error: null };
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const url = "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=10&srsearch=" + encodeURIComponent(q.slice(0, 300));
      const r = await fetch(url, { headers: { "user-agent": "penelope-nomodel-diagnostic/0.1 (research harness)" } }).catch((e) => ({ ok: false, status: 0, e }));
      if (r.status === 429) { await new Promise((s) => setTimeout(s, 2000 * (attempt + 1))); continue; }
      if (!r.ok) { out.error = "search " + r.status; break; }
      const j = await r.json().catch(() => null);
      out.results = (j?.query?.search ?? []).map((x) => ({ title: x.title, url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(String(x.title).replace(/ /g, "_")) }));
      break;
    }
    log.push({ q, cached: false, n: out.results.length, error: out.error });
    if (f && !out.error) fs.writeFileSync(f, JSON.stringify(out));
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(out));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  return { url: `http://127.0.0.1:${port}/api/web/search`, log, stop: () => new Promise((r) => server.close(r)) };
}

const unitBeats = (units) => units.map((u) => ({ title: u.name, charge: u.spec, referents: [] }));

function describeFold(folded, units) {
  const reasons = {};
  for (const r of folded.refused ?? []) reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
  const placed = Object.values(folded.assignments ?? {}).flat();
  return {
    beats: folded.beats.length,
    gaps: folded.beats.filter((b) => b.gap).map((b) => b.title),
    refused: folded.refused?.length ?? 0,
    refusedByReason: reasons,
    residual: folded.residual?.length ?? 0,
    distinctPlaced: placed.length,
    admittedDistinct: placed.length + (folded.residual?.length ?? 0),
    admittedWords: words(placed.join(" ")) + words((folded.residual ?? []).map((a) => a.sentence).join(" ")),
    unitsWithAClaim: folded.beats.filter((b) => !b.gap).map((b) => b.title),
    ok: folded.beats.every((b) => !b.gap) && !(folded.refused?.length) && !(folded.residual?.length),
  };
}

/** The fold twice over the same artifact. Neither arm relaxes a gate. */
export async function proseFoldArms({ code, units, shadow }) {
  const o = await loadOrgans();
  const ground = [...(shadow?.values?.() ?? [])].join("\n\n");
  // shipped: exactly adapter.testUnits — empty ground, the default (river) beats
  const shippedAtoms = o.wideToAtoms([code], { ground: "" });
  const shipped = describeFold(o.foldWideToShape(shippedAtoms), units);
  // contract: the whole retained ground, and the void's own cells as the beats
  // (essay-fold.js: "the caller should usually pass the VOID'S OWN cells as beats")
  const atoms = o.wideToAtoms([code], { ground });
  const contract = describeFold(o.foldWideToShape(atoms, { beats: unitBeats(units), ground }), units);
  return { shipped, contract, groundChars: ground.length, atoms: atoms.length };
}

/** Per-unit contribution text, recovered from the provenance ranges (this doubles
 *  as the "where did this piece come from" round trip). */
export function contributionsFromRanges(code, events) {
  const buf = Buffer.from(code, "utf8");
  const out = [];
  for (const e of events) {
    if (!e.range || !e.unit) continue;
    out.push({ unit: e.unit, stage: e.stage, transform: e.transform, source_id: e.source_id, range: e.range, text: buf.subarray(e.range.start, e.range.end).toString("utf8") });
  }
  return out;
}

/** How much distinct, admissible material the retained ground can supply AT ALL.
 *  Supply is what the adapter's OWN snip rule (snipsFromSources: 40 < len <= 220,
 *  near-duplicate suppressed) can cut from every retained source; admission is the
 *  fold's own re-admission + dedupe against the whole ground. A ceiling that is
 *  independent of any unit structure. `citationMarked` is a labelled heuristic
 *  count (reported, never subtracted) of snips that read as bibliography. */
export async function evidenceCeiling({ shadow, wantBeats = 12 }) {
  const o = await loadOrgans();
  const parts = [...shadow.values()];
  const ground = parts.join("\n\n");
  if (!ground.trim()) return { sources: 0, groundWords: 0, snips: 0, snipWords: 0, admittedDistinct: 0, admittedWords: 0, refusedByReason: {}, basis: "empty field" };
  const snips = o.snipsFromSources(shadow, { maxSnips: 1e9, maxChars: 220 }).map((x) => x.snip);
  const atoms = o.wideToAtoms(snips, { ground });
  const seams = o.beatsFromGround(ground, { want: wantBeats });
  const folded = o.foldWideToShape(atoms, { beats: seams.beats.length ? seams.beats : null, ground });
  const d = describeFold(folded, []);
  delete d.unitsWithAClaim; delete d.gaps; // 100+ derived seam beats: the count is the finding
  return {
    sources: parts.length,
    groundWords: words(ground),
    snips: snips.length,
    snipWords: words(snips.join(" ")),
    snipChars: snips.join(" ").length,
    citationMarked: snips.filter((x) => /ISBN|Retrieved|Archived from|\bpp\.|doi:|OCLC|Wayback|\(in Russian\)|\bed\.\)?/i.test(x)).length,
    ...d,
    basis: folded.basis,
  };
}

/** For each unit: the best evidence the retained ground holds for ITS question, by the
 *  adapter's own per-unit check (probeUnit coverage). If no sentence in the whole field
 *  clears the check, the unit's question is not evidence-addressable — a unit-design
 *  limit, not an evidence-volume limit. */
export async function unitEvidence({ units, shadow, adapter }) {
  const o = await loadOrgans();
  const snips = o.snipsFromSources(shadow, { maxSnips: 1e9, maxChars: 220 }).map((x) => x.snip);
  const cov = (d) => Number(/coverage (\d+)%/.exec(d ?? "")?.[1] ?? 0);
  return units.map((u) => {
    let best = { coverage: 0, snip: null, ok: false };
    for (const sn of snips) {
      const r = adapter.probeUnit(sn, { name: u.name, spec: u.spec });
      const c = cov(r.detail);
      if (c > best.coverage) best = { coverage: c, snip: sn.slice(0, 90), ok: !!r.ok };
    }
    return { unit: u.name, bestCoverage: best.coverage, clears: best.ok, bestSnip: best.snip };
  });
}

/** Per-run prose diagnosis: is a unit the engine CLAIMED as satisfied actually satisfied?
 *  Uses only the adapter's own per-unit check (probeUnit) and the fold's own organs. */
export async function diagnoseProse({ res, code, units, outcomes, shadow, adapter, fieldKeys, intent }) {
  const essayOf = new Map();
  try { for (const u of await adapter.readUnits(intent ?? res.intent, {})) essayOf.set(u.name, !!u.cell?.essay); } catch { /* units without cells stay unknown */ }
  const normal = (s) => String(s).replace(/\s+/g, " ").toLowerCase();
  const retained = [...shadow.values()].map(normal);
  const seen = new Set();
  const perUnit = [];
  for (const u of units) {
    const o = outcomes.find((x) => x.unit === u.name) ?? {};
    const text = String(o.text ?? "");
    const claimed = o.stage === "field" || o.stage === "hunt";
    const distinct = claimed && !seen.has(normal(text));
    if (claimed) seen.add(normal(text));
    const probe = claimed ? adapter.probeUnit(text, { name: u.name, spec: u.spec }) : null;
    const probe_ok = !!probe?.ok;
    const markup = /<\s*(!doctype|html|head|body|div|meta|script)\b/i.test(text);
    const head = normal(text).slice(0, 60);
    // measurement only: what the hunted PAGE (as readable text) holds for this unit's question
    let huntPageBest = null;
    if (o.stage === "hunt") {
      const src = (res.evidence.provenance.sources ?? []).find((x) => x.source_id === o.source_id);
      const url = typeof src?.locator === "string" ? src.locator : null;
      const page = url ? await fetch(url).then((r) => (r.ok ? r.text() : null)).catch(() => null) : null;
      if (page) {
        const text2 = String((await loadOrgans()).extractReadable(page).text ?? "");
        const m = await unitEvidence({ units: [u], shadow: new Map([[url, text2]]), adapter });
        huntPageBest = { url, pageWords: words(text2), bestCoverage: m[0].bestCoverage, clears: m[0].clears };
      }
    }
    perUnit.push({
      huntPageBest,
      unit: u.name,
      kind: essayOf.get(u.name) === undefined ? "?" : essayOf.get(u.name) ? "content" : "shape",
      stage: o.stage,
      words: words(text),
      distinct,
      probe: probe ? probe.detail : null,
      markup,
      locatableInRetained: claimed && head.length > 10 ? retained.some((r) => r.includes(head)) : null,
      verified: claimed && distinct && probe_ok && !markup,
    });
  }
  const arms = await proseFoldArms({ code, units, shadow });
  const evidence = await unitEvidence({ units, shadow: new Map([...shadow].filter(([k]) => fieldKeys.has(k))), adapter });
  const fromField = outcomes.filter((x) => x.stage === "field").length;
  return {
    perUnit,
    verifiedUnits: perUnit.filter((p) => p.verified).length,
    claimedUnits: perUnit.filter((p) => p.stage === "field" || p.stage === "hunt").length,
    contentUnits: perUnit.filter((p) => p.kind === "content").length,
    verifiedContentUnits: perUnit.filter((p) => p.kind === "content" && p.verified).length,
    unitEvidence: evidence,
    unitsWithAnyClearingEvidence: evidence.filter((e) => e.clears).length,
    foldShipped: arms.shipped,
    foldContract: arms.contract,
    groundChars: arms.groundChars,
    fieldClaimed: fromField,
    huntedPages: [...shadow.keys()].filter((k) => !fieldKeys.has(k)),
  };
}


/** The cap the arrangement itself puts on a unit's contribution, READ OFF the adapter's
 *  source (never hardcoded here): autofill cuts {maxSnips, maxChars}; hunt keeps slice(0, N).
 *  Multiplied by the number of units, that is the most a target-blind structure can hold. */
export function structuralCap({ units, adapterSource, charsPerWord = null }) {
  const f = /snipsFromSources\([^,]+,\s*\{\s*maxSnips:\s*(\d+),\s*maxChars:\s*(\d+)/.exec(adapterSource);
  const h = /replace\(\/\\s\+\/g,\s*" "\)\.slice\(0,\s*(\d+)\)/.exec(adapterSource.slice(adapterSource.indexOf("export async function hunt")));
  const maxSnips = f ? Number(f[1]) : null, maxChars = f ? Number(f[2]) : null, huntChars = h ? Number(h[1]) : null;
  const perUnitChars = maxSnips && maxChars ? maxSnips * maxChars + (maxSnips - 1) : null; // snips are joined by a space
  return {
    autofillMaxSnips: maxSnips, autofillMaxChars: maxChars, huntKeepChars: huntChars,
    perUnitMaxChars: perUnitChars,
    unitCount: units.length,
    fieldMaxChars: perUnitChars ? perUnitChars * units.length : null,
    charsPerWord: charsPerWord ? Number(charsPerWord.toFixed(2)) : null, // MEASURED from the field's own snips (snipChars / snipWords); null when there is no field
    fieldMaxWords: perUnitChars && charsPerWord ? Math.round((perUnitChars * units.length) / charsPerWord) : null,
    huntMaxChars: huntChars ? huntChars * units.length : null,
  };
}

/** Evidence-capacity probe, NOT the shipped hunt: ask the search transport for the TOPIC
 *  (instead of each unit's long meta-question) and measure what the retrieved pages hold.
 *  Per page, against its own ground (a sum is an upper bound: no cross-page dedupe). */
export async function topicHuntCapacity({ topic, searchUrl, intent, pages: nPages = 3 }) {
  const o = await loadOrgans();
  const j = await fetch(searchUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: topic }) }).then((r) => r.json()).catch(() => ({ results: [] }));
  const pages = [];
  for (const r of (j.results ?? []).slice(0, nPages)) {
    const html = await fetch(r.url).then((x) => (x.ok ? x.text() : null)).catch(() => null);
    if (!html) { pages.push({ url: r.url, error: "fetch failed" }); continue; }
    const text = String(o.extractReadable(html).text ?? "");
    const relevant = o.relevantSources(new Map([[r.url, text]]), intent).kept.size > 0;
    pages.push({ url: r.url, title: r.title, relevant, ...(relevant ? await evidenceCeiling({ shadow: new Map([[r.url, text]]) }) : { groundWords: words(text) }) });
  }
  const rel = pages.filter((p) => p.relevant);
  return { query: topic, pages, relevantPages: rel.length, sumAdmittedWordsUpperBound: rel.reduce((a, p) => a + (p.admittedWords ?? 0), 0), sumSnips: rel.reduce((a, p) => a + (p.snips ?? 0), 0) };
}
