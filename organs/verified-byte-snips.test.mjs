import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { snipSentenceUtf8 } from './verified-byte-snips.mjs';
const file = path.join(os.tmpdir(), `penelope-verified-bytes-${process.pid}.txt`);
const source = 'Émile saw 🔬 and smiled. Then Pierre saw Natasha. The book has a final sentence.';
fs.writeFileSync(file, source);
const byte = (i) => Buffer.byteLength(source.slice(0, i));
test('a UTF-8 location with multibyte prefix returns exact enclosing sentence bytes',()=>{
 const at=byte(source.indexOf('Pierre')); const r=snipSentenceUtf8(file,at);
 assert.equal(r.ok,true); assert.equal(r.quote,'Then Pierre saw Natasha.');
 assert.equal(Buffer.from(source).subarray(r.abs,r.abs+r.len).toString(),r.quote);
});
test('inside an emoji codepoint is refused, not rounded to a nearby quote',()=>{
 const at=byte(source.indexOf('🔬')); const r=snipSentenceUtf8(file,at+1);
 assert.equal(r.ok,false);assert.equal(r.gap.kind,'address_not_utf8_boundary');
});
test('the source-authoritative quote has no invented whitespace normalization',()=>{
 const text='🙂  First clause\nwith a line break. Second sentence!';
 const file2=file+'.space';fs.writeFileSync(file2,text);
 try {const r=snipSentenceUtf8(file2,Buffer.byteLength('🙂  First'));assert.equal(r.ok,true);assert.equal(r.quote,'🙂  First clause\nwith a line break.');assert.equal(Buffer.from(text).subarray(r.abs,r.abs+r.len).toString(),r.quote);}
 finally {fs.unlinkSync(file2);}
});
test('a too-narrow window refuses a truncated quote',()=>{
 const r=snipSentenceUtf8(file,byte(source.indexOf('Pierre')),{window:4,maxLen:4});
 assert.equal(r.ok,false);assert.match(r.gap.kind,/sentence_/);
});
test('invalid addresses and missing sources fail closed',()=>{
 assert.equal(snipSentenceUtf8(file,-1).ok,false);
 assert.equal(snipSentenceUtf8(file,Buffer.byteLength(source)+100).ok,false);
 assert.equal(snipSentenceUtf8(file+'.missing',0).ok,false);
});
test.after(()=>fs.rmSync(file,{force:true}));
