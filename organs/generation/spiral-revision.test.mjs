import test from 'node:test';
import assert from 'node:assert/strict';
import { reviseArtifact } from './spiral-revision.mjs';

test('broken child and parent are rejected while a later legal revision lands', async () => {
  const xs = [{ text: 'invented quote', witnessed: false, coherence: true }, { text: 'broken parent', witnessed: true, coherence: false }, { text: 'verified', witnessed: true, coherence: true }];
  const r = await reviseArtifact({ artifact: { text: 'original' }, budget: 3, propose: (_x, { round }) => xs[round],
    test: (x) => ({ ok: x.witnessed, basis: 'byte trace' }), assessParent: (x) => ({ ok: x.coherence, basis: 'parent consistency' }) });
  assert.equal(r.artifact.text, 'verified');
  assert.deepEqual(r.refusals.map((x) => x.why), ['failed_child_test', 'broke_parent']);
  assert.equal(r.admitted, 1);
});
test('a proposal cannot self-certify by omitting the real tests', async () => {
  await assert.rejects(reviseArtifact({ artifact: 'old', propose: () => 'new' }), /required/);
});
test('no change ends the spiral rather than admitting a phantom revision', async () => {
  const r = await reviseArtifact({ artifact: 'old', propose: () => 'old', test: () => ({ ok: true }), assessParent: () => ({ ok: true }) });
  assert.equal(r.artifact, 'old');
  assert.equal(r.admitted, 0);
  assert.equal(r.log[0].why, 'no_changed_product');
});
