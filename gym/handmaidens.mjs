// gym/handmaidens.mjs — THE HOUSE ROUND: dispatch the handmaidens, hold the
// suitors at bay. Penelope's faithful team, each at her post, each holding
// one suitor from the loom:
//
//   eurycleia  the nurse  — keep every generation THREAD NAMED
//                          (forgetfulness of duties)
//   autonoe    the second — keep every DRAW recorded
//                          (forgetfulness of duties)
//   iphthime   the dream  — keep every CLAIM grounded in a real thing
//                          (hallucinations that creep in)
//   telemachus the son    — keep every DRAW inside the sanctioned door
//                          (the draw that forgets its door)
//
// The house is sound when each returns ok. A member who finds a suitor
// reports it named; the round fails with the findings disclosed — the
// record's own falsify-or-die, kept by the women at the loom.
//
// Run: node gym/handmaidens.mjs        (all four, exit 0 when all ok)
//
// FALSIFYING CONTROL: a generation tool that is woven, a draw that is
// recorded, a law that is grounded, or a draw inside its door — reported by
// any member as a breach — concedes that member and fails the round.
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MEMBERS = ["eurycleia", "autonoe", "iphthime", "telemachus"];

export async function houseRound() {
  const reports = [];
  for (const m of MEMBERS) {
    try {
      const { audit } = await import(`./handmaidens/${m}.mjs`);
      const r = audit();
      reports.push(r);
    } catch (e) {
      reports.push({ member: m, ok: false, error: String(e?.message ?? e), duty: "could not stand watch" });
    }
  }
  const ok = reports.every((r) => r.ok);
  return { schema: "HouseRound@1", ok, at: new Date().toISOString(), members: reports };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const r = await houseRound();
  console.log(JSON.stringify(r, null, 1));
  process.exit(r.ok ? 0 : 1);
}