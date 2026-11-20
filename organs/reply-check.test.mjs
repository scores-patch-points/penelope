import test from "node:test"; import assert from "node:assert/strict"; import { checkClaim, checkReply } from "./reply-check.mjs";
const M = (a, rel, b, polarity = "+") => ({ a, rel, b, polarity }), marks = [M("Tom", "live_in", "Leeds"), M("Anna", "work_at", "Dynamo"), M("Maria", "hire", "Victor")], F = { marks, functional: ["live"] };
test("truth is a property of the claim, not of the words: a real city asserted of the wrong person is untrue; the same fact in other words about the same beings is not flagged", () => {
  assert.equal(checkClaim(M("Anna", "live_in", "Leeds"), F).status, "unsupported", "Leeds is a real city in the material, and it is still a lie about Anna");
  assert.equal(checkClaim(M("Tom", "live_in", "Leeds"), F).status, "supported");
  assert.equal(checkClaim(M("Tom", "reside_in", "Leeds"), F).status, "pair_supported", "same two beings, a different relation: counted as unchecked, not trusted silently and not accused");
});
test("a single-valued relation with another value on record is CONTRADICTED; without the declared prior it is merely unsupported", () => {
  assert.equal(checkClaim(M("Tom", "live_in", "Zurich"), F).status, "contradicted");
  assert.equal(checkClaim(M("Tom", "live_in", "Zurich"), { marks }).status, "unsupported");
});
test("a negation asserted from silence is fabricated; a negation a mark rules out is supported", () => {
  assert.equal(checkClaim(M("Anna", "work_at", "Zebra", "-"), F).status, "negation_from_silence");
  assert.equal(checkClaim(M("Tom", "live_in", "Zurich", "-"), F).status, "supported", "Tom's single-valued residence is Leeds");
});
test("derived findings and labelled proposals are allowed only as what they are", () => {
  const d = [M("Victor", "live_in", "Bath")], p = [M("Victor", "work_at", "Acme")];
  assert.equal(checkClaim(M("Victor", "live_in", "Bath"), { ...F, derived: d }).status, "derived");
  assert.equal(checkClaim(M("Victor", "work_at", "Acme"), { ...F, proposals: p }).status, "proposed");
  assert.equal(checkClaim(M("Victor", "work_at", "Acme"), F).status, "unsupported", "without the proposal on the table it is a fabrication");
});
test("verdict: fabricated if ANY claim is untrue, grounded if all are checked, unread when the reader found nothing (neither a pass nor a fail)", () => {
  assert.equal(checkReply({ replyClaims: [M("Tom", "live_in", "Leeds"), M("Anna", "live_in", "Leeds")], ...F }).verdict, "fabricated");
  assert.equal(checkReply({ replyClaims: [M("Tom", "live_in", "Leeds")], ...F }).verdict, "grounded");
  const u = checkReply({ replyClaims: [], ...F }); assert.equal(u.verdict, "unread"); assert.deepEqual(u.fabricated, []);
  assert.equal(checkReply({ replyClaims: [M("Tom", "reside_in", "Leeds")], ...F }).unchecked, 1);
});
