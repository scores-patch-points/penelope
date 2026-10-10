import test from 'node:test';
import assert from 'node:assert/strict';
import { reviseArtifact } from './spiral-revision.mjs';
test('structurally identical candidate does not consume a verified revision',async()=>{
 const r=await reviseArtifact({artifact:{text:'unchanged',meta:{x:1}},propose:()=>({meta:{x:1},text:'unchanged'}),test:()=>({ok:true}),assessParent:()=>({ok:true})});
 assert.equal(r.admitted,0);assert.equal(r.log[0].why,'no_changed_product');
});
test('malicious callback cannot rewrite the old accepted state in place',async()=>{
 const original={text:'truth',source:{claim:'attested'}};
 const r=await reviseArtifact({artifact:original,propose:(current)=>{current.source.claim='invented';return {text:'different',source:{claim:'invented'}}},test:()=>({ok:false,basis:'no evidence'}),assessParent:()=>({ok:true}),budget:1});
 assert.equal(original.source.claim,'attested');assert.equal(r.artifact.source.claim,'attested');assert.equal(r.admitted,0);
});
