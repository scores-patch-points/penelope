// window.mjs — Organ 4: the upcoming window. Any dated feed — launches,
// council meetings, court dates, evictions — becomes the next-N soonest,
// each with a box-computed countdown. Pure. No model. No DOM.
//
// The launch loom computed its countdown inline (mouth failed 3x, box owns —
// GL-LD-02/06); this organ generalizes that shape so every dated feed gets
// the same window semantics and the same countdown arithmetic, selftested
// once, in one place.
//
// A record with no parseable date is a per-record gap, never a sunk feed
// (the detail-fetch rule, carried up a level — GL-OG-04).
export const WINDOW_SCHEMA = "Window@1";

// "6:30 PM" / "09:05 AM" / "14:00" -> minutes past midnight; unparseable
// -> null. The 12-hour parse is explicit (legistar's own time strings), and
// a bare 24-hour string is accepted so the organ is not English-locked
// (Greenberg: never smuggle a script assumption in as universal).
export function minutesOf(timeStr) {
  const s = String(timeStr ?? "").trim();
  if (!s) return null;
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (m12) {
    let h = Number(m12[1]) % 12;
    if (/^P/i.test(m12[3])) h += 12;
    return h * 60 + Number(m12[2]);
  }
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = Number(m24[1]);
    if (h > 23) return null;
    return h * 60 + Number(m24[2]);
  }
  return null;
}

// date "2026-10-06T00:00:00" (ISO, local-naive) + time "6:30 PM" -> epoch ms.
// A missing or unparseable time means the date at noon (a named default,
// disclosed; the record's gap is never a guess — noon is the neutral point
// of the day). Returns null when the date itself is unparseable.
export function toEpoch(dateStr, timeStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const m = minutesOf(timeStr);
  const ms = m == null ? d.getTime() + 12 * 3600000 : d.getTime() + m * 60000;
  return ms;
}

// Box duration arithmetic (the launch loom's fmtCountdown shape, GL-LD-06):
// "T-0d 01h 30m 59s" before, "T+0d 00h 05m 00s" after, "NOW" within a minute.
// Zero-pad is mechanical, as the launch record disclosed.
export function cdLabel(ms, now, { pad = 2 } = {}) {
  const diff = ms - now;
  const abs = Math.abs(diff);
  const sign = diff < 0 ? "+" : "-";
  const s = Math.floor(abs / 1000) % 60;
  const m = Math.floor(abs / 60000) % 60;
  const h = Math.floor(abs / 3600000) % 24;
  const d = Math.floor(abs / 86400000);
  const p = (n) => String(n).padStart(pad, "0");
  if (abs < 60000) return "NOW";
  return `T${sign}${p(d)}d ${p(h)}h ${p(m)}m ${p(s)}s`;
}

// The window: next-N soonest. dateOf/timeOf name the record's own fields
// (never a hardcoded path); now and n are the caller's budget. Rows keep the
// record whole (the cloth is the app's to cut), each with `at` (epoch ms)
// and `cd` (label vs now). Per-record gaps[] names the indices whose date
// could not be parsed — a named gap, never an invented row.
export function window(records, { dateOf, timeOf = null, now, n = 8 } = {}) {
  const rows = [];
  const gaps = [];
  for (let i = 0; i < records.length; i += 1) {
    const rec = records[i];
    const at = toEpoch(rec?.[dateOf], timeOf ? rec?.[timeOf] : null);
    if (at == null) { gaps.push(i); continue; }
    if (at < now) continue;
    rows.push({ rec, at, cd: cdLabel(at, now) });
  }
  rows.sort((a, b) => a.at - b.at);
  return { rows: rows.slice(0, n), gaps, total: rows.length };
}

export function selftest() {
  const t = (name, cond) => { if (!cond) { console.error("FAIL", name); process.exitCode = 1; } else console.log("ok", name); };
  const NOW = Date.parse("2026-10-01T12:00:00");
  t("minutesOf 12h", minutesOf("6:30 PM") === 18 * 60 + 30);
  t("minutesOf 24h", minutesOf("14:05") === 14 * 60 + 5);
  t("minutesOf garbage is null", minutesOf("soon") === null);
  t("toEpoch with time", toEpoch("2026-10-06T00:00:00", "6:30 PM") === Date.parse("2026-10-06T18:30:00"));
  t("toEpoch missing time is noon default", toEpoch("2026-10-06T00:00:00", null) === Date.parse("2026-10-06T12:00:00"));
  t("toEpoch bad date is null", toEpoch("never", null) === null);
  t("cdLabel before", cdLabel(NOW + 3 * 86400000 + 4 * 3600000 + 12 * 60000 + 30000, NOW) === "T-03d 04h 12m 30s");
  t("cdLabel after", cdLabel(NOW - 60000, NOW) === "T+00d 00h 01m 00s");
  t("cdLabel now", cdLabel(NOW + 30000, NOW) === "NOW");
  const recs = [
    { d: "2026-10-06T00:00:00", tm: "6:30 PM" },
    { d: "2026-10-02T00:00:00", tm: "4:00 PM" },
    { d: "not-a-date" },
    { d: "2025-01-01T00:00:00", tm: "9:00 AM" },
  ];
  const r = window(recs, { dateOf: "d", timeOf: "tm", now: NOW, n: 8 });
  t("past excluded, bad date gapped, soonest first", r.rows.length === 2 && r.rows[0].rec.d === "2026-10-02T00:00:00" && r.gaps.length === 1);
  t("countdown rides on rows", r.rows[0].cd === cdLabel(Date.parse("2026-10-02T16:00:00"), NOW));
  const cut = window(recs, { dateOf: "d", timeOf: "tm", now: NOW, n: 1 });
  t("budget n cuts", cut.rows.length === 1 && cut.total === 2);
}