// detail-fetch.mjs — Organ 1: two-hop fan-out.
//
// The list comes from one feed; each row's detail lives behind that
// item's own URL. This organ fans out bounded-concurrency detail fetches,
// traces declared field paths per item, and keeps per-item gaps: a failed
// detail marks THAT item missing-detail, never sinks the list.
// Pure fetching + path tracing. No model. No DOM.
//
// fieldPaths: { outKey: "a.b.0.c" } — first-of-N included (numeric segs).
// fetchImpl injectable so tests run offline.
export const DETAIL_FETCH_SCHEMA = "DetailFetch@1";

export function tracePath(obj, path) {
  let cur = obj;
  for (const seg of String(path).split(".")) {
    if (cur == null) return undefined;
    cur = /^\d+$/.test(seg) ? cur[Number(seg)] : cur[seg];
  }
  return cur;
}

export async function fanout(items, { urlOf, fieldPaths, limit = 4, fetchImpl = fetch } = {}) {
  const out = new Array(items.length);
  let i = 0;
  const gaps = [];
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      const item = items[idx];
      try {
        const r = await fetchImpl(urlOf(item), { signal: AbortSignal.timeout(20000) });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const j = await r.json();
        const detail = {};
        for (const [k, p] of Object.entries(fieldPaths)) detail[k] = tracePath(j, p);
        out[idx] = { item, detail, gap: null };
      } catch (e) {
        gaps.push(idx);
        out[idx] = { item, detail: null, gap: String(e.message ?? e).slice(0, 120) };
      }
    }
  }));
  return { rows: out, gaps };
}

export function selftest() {
  const t = (n, c) => { if (!c) { console.error("FAIL", n); process.exitCode = 1; } else console.log("ok", n); };
  t("trace first-of-N", tracePath({ a: [{ b: 7 }] }, "a.0.b") === 7);
  t("trace missing is undefined", tracePath({}, "x.y") === undefined);
  const items = [{ u: "a" }, { u: "b" }, { u: "c" }];
  const fake = async (u) => {
    if (u === "b") return { ok: false, status: 404 };
    return { ok: true, json: async () => ({ m: { desc: "D-" + u } }) };
  };
  return fanout(items, { urlOf: (x) => x.u, fieldPaths: { desc: "m.desc" }, fetchImpl: fake }).then(({ rows, gaps }) => {
    t("failed item gaps, list survives", rows.length === 3 && rows[1].detail === null && gaps.length === 1);
    t("good items traced", rows[0].detail.desc === "D-a" && rows[2].detail.desc === "D-c");
  });
}
