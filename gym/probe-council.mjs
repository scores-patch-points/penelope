// gym/probe-council.mjs — the council shape-class probe (the bench for this
// class). Fetches the live Legistar feed, windows it (Window@1), fans out the
// first meetings' items (bounded concurrency, DetailFetch@1 discipline),
// shapes the agendas (AgendaShape@1, the organ's own Legistar field map), and
// verifies the weave's claims against real bytes:
//   - soonest-first on the live feed (the sort claim)
//   - agendas ordered by the item's OWN sequence, not fetch order
//   - per-item gaps named, never rows dropped
// Exits 1 when any claim fails — a probe that never fires is a comment.
//
//   node gym/probe-council.mjs
import { window } from "../organs/window.mjs";
import { shapeItems } from "../organs/agenda-shape.mjs";

const API = "https://webapi.legistar.com/v1/nashville/";
const today = () => new Date().toISOString().slice(0, 10);
const FEED = `${API}Events?$filter=EventDate ge datetime'${today()}T00:00:00'&$orderby=EventDate&$top=12`;

const fail = (m) => { console.error("PROBE-FAIL", m); process.exitCode = 1; };
const ok = (m) => console.log("ok", m);

const res = await fetch(FEED, { signal: AbortSignal.timeout(20000) });
if (!res.ok) fail(`feed HTTP ${res.status}`);
const events = await res.json();
if (!Array.isArray(events) || !events.length) fail("feed returned zero results");

const meetings = events.map((x) => ({ id: x.EventId, body: x.EventBodyName, date: x.EventDate, time: x.EventTime, loc: x.EventLocation }));
const { rows, gaps } = window(meetings, { dateOf: "date", timeOf: "time", now: Date.now(), n: 8 });
ok(`window: ${rows.length} upcoming of ${meetings.length} fetched, ${gaps.length} gapped`);
if (gaps.length) fail(`unparseable dates at indices ${gaps.join(",")}`);
if (!rows.length) fail("no upcoming meetings");

const sorted = rows.every((r, i) => i === 0 || rows[i - 1].at <= r.at);
if (!sorted) fail("window not sorted soonest-first");
ok("sort: soonest-first holds on live bytes");

const firstThree = rows.slice(0, 3).map((r) => r.rec);
const agendas = [];
let i = 0;
await Promise.all(Array.from({ length: Math.min(3, firstThree.length) }, async () => {
  while (i < firstThree.length) {
    const idx = i++;
    const m = firstThree[idx];
    try {
      const r = await fetch(`${API}Events/${m.id}/EventItems`, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      agendas[idx] = { m, items: await r.json(), gap: null };
    } catch (e) { agendas[idx] = { m, items: null, gap: String(e.message ?? e).slice(0, 100) }; }
  }
}));

let shapedCount = 0;
for (const a of agendas) {
  if (a.gap) { ok(`agenda gap for meeting ${a.m.id} (${a.gap})`); continue; }
  const { rows: shaped, gaps: itemGaps } = shapeItems(a.items);
  shapedCount += 1;
  const seqs = shaped.map((r) => r.seq).filter((s) => s != null);
  const inOrder = seqs.every((s, k) => k === 0 || seqs[k - 1] <= s);
  if (!inOrder) fail(`meeting ${a.m.id}: agenda not in own sequence`);
  ok(`meeting ${a.m.id}: ${shaped.length} items (${itemGaps.length} gapped), own sequence holds, first seq ${seqs[0] ?? "none"}`);
}
if (shapedCount === 0) fail("no agendas loaded at all");
console.log(`probe done: ${rows.length} meetings windowed, ${shapedCount} agendas shaped and verified`);