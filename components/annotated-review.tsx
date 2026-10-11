'use client';
import {useState} from 'react';
import {basicCheck} from '@/lib/basic-check';
import {createDocument,documentText,replaceRow,type LyricDocument} from '@/lib/lyric-document';
type Kind='form'|'content'|'rhythm';
const kinds:Kind[]=['form','content','rhythm'];
const names={form:'줄 나누기',content:'마음 전하기',rhythm:'부르기 좋게'};
type Applied={before:string;after:string;ids:string[]};
export function AnnotatedReview({text,onApply,onBack,onFinish}:{text:string;onApply:(text:string)=>boolean;onBack:()=>void;onFinish:()=>void}){
 const [doc,setDoc]=useState(()=>createDocument(text));
 const [selected,setSelected]=useState<Kind>('form');
 const [history,setHistory]=useState<LyricDocument[]>([]);
 const [applied,setApplied]=useState<Applied|null>(null);
 const [editing,setEditing]=useState<'all'|'line'|null>(null),[draft,setDraft]=useState(''),[error,setError]=useState('');
 const checked=basicCheck(documentText(doc)),tips=checked.tips,t=tips[selected];
 const selectedIds=applied?applied.ids:[doc.rows[t.line-1]?.id];
 function switchKind(kind:Kind){setSelected(kind);setApplied(null);setError('')}
 function commit(next:LyricDocument,change:Applied|null){if(onApply(documentText(next))){setHistory(h=>[...h,doc]);setDoc(next);setApplied(change);setEditing(null);setError('')}}
 function apply(value:string){try{const anchor=doc.rows[t.line-1];const change=replaceRow(doc,anchor.id,t.quote,value);commit(change.document,{before:anchor.text,after:value,ids:change.ids})}catch(e){setError(e instanceof Error?e.message:'수정 내용을 확인해 주세요.')}}
 function undo(){const previous=history.at(-1);if(previous&&onApply(documentText(previous))){setDoc(previous);setHistory(h=>h.slice(0,-1));setApplied(null);setError('')}}
 function save(){if(editing==='line'){apply(draft);return}try{basicCheck(draft);commit(createDocument(draft),null)}catch(e){setError(e instanceof Error?e.message:'가사를 확인해 주세요.')}}
 function edit(scope:'all'|'line'){setDraft(scope==='all'?documentText(doc):t.quote);setEditing(scope);setError('')}
 const splits=(line:string)=>{const words=line.split(/\s+/);return [...new Set([Math.floor(words.length/2),Math.ceil(words.length/3)])].filter(n=>n>0&&n<words.length).map(n=>words.slice(0,n).join(' ')+'\n'+words.slice(n).join(' '))};
 let examples:{text:string;apply:string;label:string}[]=[];
 if(!t.keep&&selected==='form')examples=(t.quote.match(/[가-힣]/g)||[]).length>24?splits(t.quote).map(s=>({text:s,apply:s,label:'숨 쉬는 곳에서 나누기'})):[{text:'\n'+t.quote,apply:'\n'+t.quote,label:'이 행 앞에 빈 줄 넣기'}];
 if(!t.keep&&selected==='rhythm'){
  if(t.rhythmIssue==='long'||t.rhythmIssue==='imbalance'){const shorter=t.quote.replace(/오래오래/g,'오래').replace(/언제나 항상|항상 언제나/g,'언제나').replace(/너무나도/g,'참');if(shorter!==t.quote)examples.push({text:shorter,apply:shorter,label:'긴 표현 줄이기'});examples.push(...splits(t.quote).slice(0,1).map(s=>({text:s,apply:s,label:'숨 쉬는 곳에서 나누기'})))}
  else examples=[{text:t.quote+'\n'+t.quote,apply:t.quote+'\n'+t.quote,label:'이 행을 후렴으로 반복하기'}];
 }
 if(!t.keep&&selected==='content'){const value=t.quote+'\n'+t.example.replace(/^예: /,'');examples=[{text:value,apply:value,label:'원래 행 뒤에 마음 덧붙이기'}]}
 const example=(ex:typeof examples[number],i:number)=><article key={i}><span>{ex.label}</span>{ex.apply.startsWith('\n')&&<small>빈 줄을 하나 넣고, 원래 행은 그대로 남겨요.</small>}<pre>{ex.text}</pre><button className="primary full" onClick={()=>apply(ex.apply)}>이 예시 적용하기</button></article>;
 return <>
 <p className="review-instruction">표시된 가사를 읽고, 마음에 드는 예시를 적용해 보세요. 수정은 모두 내 선택이에요.</p>
 <div className="review-tabs" role="group" aria-label="살펴볼 피드백">{kinds.map(k=><button key={k} disabled={!!editing} aria-pressed={selected===k} onClick={()=>switchKind(k)}>{names[k]}<small>{tips[k].keep?'살릴 표현':'살펴볼 부분'}</small></button>)}</div>
 <div className="annotation-layout">
 <section className="lyric-paper" aria-label="내 가사"><div className="paper-heading"><div>내 가사<small>{editing==='all'?'내용과 줄바꿈을 자유롭게 고치세요.':'현재 선택한 부분에 테두리가 표시돼요.'}</small></div>{!editing&&<button className="quiet" onClick={()=>edit('all')}>전체 가사 수정</button>}</div>
 {editing==='all'?<><label className="field-label" htmlFor="review-draft">전체 가사 수정</label><textarea id="review-draft" value={draft} maxLength={3000} onChange={e=>setDraft(e.target.value)}/><div className="editor-actions"><button onClick={()=>{setEditing(null);setError('')}}>취소</button><button className="primary" onClick={save}>수정 저장</button></div></>:doc.rows.map((entry,i)=>{const active=selectedIds.includes(entry.id);return <div className={'annotated-line '+(active?'selected-line':'')} key={entry.id}><span className="line-number">{i+1}</span><div className="line-body"><p>{entry.text||'\u00a0'}</p>{selected==='rhythm'&&entry.text.trim()&&<small className="syllable-count">{(entry.text.match(/[가-힣]/g)||[]).length}음절</small>}{active&&entry.id===selectedIds[0]&&<span className="row-marker">{applied?'수정한 부분':t.keep?'살릴 표현':'지금 살펴볼 부분'}</span>}</div></div>})}</section>
 <section className="feedback-note" aria-label="선택한 부분 피드백">
 {error&&<p role="alert" className="warning">{error}</p>}
 {editing==='all'?<div className="editor-help"><h4>가사를 수정하고 있어요.</h4><p>왼쪽에서 고친 뒤 ‘수정 저장’을 누르면 새 가사에 맞는 피드백을 볼 수 있어요.</p></div>:editing==='line'?<><span className="note-kicker">{t.line}행 수정</span><label className="field-label" htmlFor="line-draft">내 말로 고치기</label><textarea id="line-draft" value={draft} maxLength={3000} onChange={e=>setDraft(e.target.value)}/><p className="caption">이 부분만 바뀌어요. 줄바꿈도 넣을 수 있어요.</p><div className="editor-actions"><button onClick={()=>{setEditing(null);setError('')}}>취소</button><button className="primary" onClick={save}>이 부분 저장</button></div></>:applied?<div className="applied-note"><span className="note-kicker">선택한 부분만 적용했어요</span><h4>수정한 가사를 읽어 보세요.</h4><span>고치기 전</span><pre>{applied.before}</pre><span>고친 뒤</span><pre>{applied.after}</pre><button className="primary full" onClick={()=>switchKind(kinds[(kinds.indexOf(selected)+1)%kinds.length])}>다음 피드백 보기</button><p className="caption">위에서 다른 피드백을 바로 선택해도 좋아요.</p></div>:<><span className="note-kicker">{t.line}행 · {names[selected]}</span><h4>{t.keep?'이 표현을 살려도 좋아요':'여기를 살펴봐요'}</h4><blockquote>{t.quote}</blockquote><p className="specific-advice">{t.action}</p>{t.keep?<div className="keep-message">바꾸지 않아도 괜찮아요.<br/>내가 전하고 싶은 마음과 맞는지 읽어 보세요.</div>:<><h5 className="example-heading">이렇게 바꿔 볼까요?</h5>{selected==='content'&&<p className="caption">예시가 내 마음과 맞는지 먼저 확인해요.</p>}<div className="example-options">{examples[0]&&example(examples[0],0)}{examples.length>1&&<details><summary>다른 예시 보기</summary>{examples.slice(1).map((ex,i)=>example(ex,i+1))}</details>}</div><button className="text-action" onClick={()=>edit('line')}>예시 대신 내 말로 고치기</button></>}{selected==='rhythm'&&<p className="rhythm-hint">왼쪽 숫자는 한글 음절 수예요. 모두 같게 맞출 필요는 없어요.</p>}</>}
 </section></div>
 <div className="review-bottom"><div><button disabled={!!editing} onClick={onBack}>← 가사 입력으로</button>{history.length>0&&<button disabled={!!editing} onClick={undo}>마지막 수정 되돌리기</button>}</div><button className="primary" disabled={!!editing} onClick={onFinish}>이 가사로 완성하기 →</button></div>
 <p className="review-footnote">마음에 들면 언제든 완성해도 좋아요. 기본 점검은 참고 의견이며, 역사적 사실은 책과 확인해 주세요.</p>
 </>;
}
