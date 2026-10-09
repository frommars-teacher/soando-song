import assert from 'node:assert/strict';
import {basicCheck,applyTip,revisionRange} from '../lib/basic-check.ts';
const text='소안도\n\n자유를 오래오래 기억하고 우리 마음을 노래하며 그 뜻을 오래 간직해요\n감사해요';
const tip=basicCheck(text).tips.form;
assert.equal(tip.line,3);
const next=applyTip(text,tip,'자유를 오래오래 기억하고\n우리 마음을 노래하며 그 뜻을 오래 간직해요');
assert.equal(next.split('\n')[0],'소안도');assert.equal(next.split('\n').at(-1),'감사해요');
assert.throws(()=>applyTip(next,tip,'다른 예시'),/달라졌/);
assert.throws(()=>applyTip('가'.repeat(2999),{line:1,quote:'가'.repeat(2999),action:'',example:'',keep:false},'가'.repeat(3001)),/3,000/);
assert.throws(()=>basicCheck('가'.repeat(3001)),/3,000/);
const r=basicCheck('자유를 지켜요\n감사를 전해요\n소안도의 마음을 기억하며 우리는 노래해요');
assert.equal(r.tips.rhythm.rhythmIssue,'imbalance');assert.ok(r.tips.rhythm.action.includes('음절'));
assert.equal(basicCheck('자유를 노래해요\n소안도를 기억해요').tips.rhythm.rhythmIssue,'ending');
assert.equal(basicCheck('자유를 지켜요\n자유를 지켜요').tips.rhythm.rhythmIssue,'repeat');
const blank=basicCheck(next).tips.form;assert.ok(applyTip(next,blank,'\n'+blank.quote).includes('감사해요'));
assert.deepEqual(basicCheck(text),basicCheck(text));
console.log('PASS: revision bounds, stale targets, blank lines, preservation, syllable imbalance, repeated endings and refrain');

assert.deepEqual(revisionRange(3),{start:3,end:3});
assert.deepEqual(revisionRange(3,'첫 줄\n다음 줄'),{start:3,end:4});
assert.deepEqual(revisionRange(5,'\n새 연'),{start:5,end:6});
assert.deepEqual(revisionRange(3,'짧게'),{start:3,end:3});
console.log('PASS: selected anchor remains on the edited line and all inserted lines');

const {createDocument,documentText,replaceRow}=await import('../lib/lyric-document.ts');
const source='첫 행\n\n같은 행\n같은 행\n마지막 행';
let doc=createDocument(source);
const target=doc.rows[3].id;
const edit=replaceRow(doc,target,'같은 행','같은\n행');
assert.equal(documentText(edit.document),'첫 행\n\n같은 행\n같은\n행\n마지막 행');
assert.equal(edit.document.rows[2].id,doc.rows[2].id);
assert.equal(edit.document.rows.at(-1).id,doc.rows.at(-1).id);
assert.equal(new Set(edit.document.rows.map(r=>r.id)).size,edit.document.rows.length);
assert.throws(()=>replaceRow(doc,target,'같은 행',''),/지울/);
assert.throws(()=>replaceRow(edit.document,target,'같은 행','바꿈'),/달라/);
for(let i=0;i<200;i++){
 const index=i%doc.rows.length,anchor=doc.rows[index];
 const replacement=(anchor.text||'빈 행')+'\n새 행';
 const before=doc.rows.map(r=>({...r}));
 const change=replaceRow(doc,anchor.id,anchor.text.trim(),replacement);
 assert.deepEqual(change.document.rows.slice(0,index),before.slice(0,index));
 assert.deepEqual(change.document.rows.slice(index+2),before.slice(index+1));
 assert.equal(documentText(change.document),before.slice(0,index).map(r=>r.text).concat(replacement,before.slice(index+1).map(r=>r.text)).join('\n'));
 assert.equal(new Set(change.document.rows.map(r=>r.id)).size,change.document.rows.length);
 doc=change.document;
}
console.log('PASS: stable row identity, repeated rows, blank rows, 200 consecutive edits without losing unrelated rows');
