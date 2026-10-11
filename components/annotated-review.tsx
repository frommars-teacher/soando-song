'use client';
import {useState} from 'react';
import {basicCheck} from '@/lib/basic-check';
import type {Evaluation} from '@/lib/coach';
import {feedbackSequence,type FeedbackItem} from '@/lib/feedback-sequence';
import {createDocument,documentText,replaceRow,type LyricDocument} from '@/lib/lyric-document';
type State={doc:LyricDocument;queue:FeedbackItem[];index:number;aiBased:boolean};
export function AnnotatedReview({text,ai,onApply,onBack,onFinish}:{text:string;ai?:Evaluation;onApply:(text:string)=>boolean;onBack:()=>void;onFinish:()=>void}){
 const [state,setState]=useState<State>(()=>{const doc=createDocument(text);return {doc,queue:feedbackSequence(doc,ai),index:0,aiBased:!!ai}});
 const [history,setHistory]=useState<State[]>([]),[editing,setEditing]=useState<'all'|'line'|null>(null),[draft,setDraft]=useState(''),[error,setError]=useState(''),[last,setLast]=useState('');
 const {doc,queue,index}=state,t=queue[index],anchor=t?doc.rows.find(r=>r.id===t.rowId):undefined,line=anchor?doc.rows.indexOf(anchor)+1:0;
 function transition(next:State,message:string){if(onApply(documentText(next.doc))){setHistory(h=>[...h,state]);setState(next);setLast(message);setEditing(null);setError('')}}
 function apply(value:string){if(!t||!anchor)return;try{const change=replaceRow(doc,anchor.id,anchor.text.trim(),value);transition({...state,doc:change.document,index:index+1},`${line}행을 고쳤어요. 다음 부분을 이어서 살펴봐요.`)}catch(e){setError(e instanceof Error?e.message:'수정 내용을 확인해 주세요.')}}
 function keep(){if(t)transition({...state,index:index+1},`${line}행은 내 표현을 그대로 살렸어요.`)}
 function undo(){const previous=history.at(-1);if(previous&&onApply(documentText(previous.doc))){setState(previous);setHistory(h=>h.slice(0,-1));setEditing(null);setError('');setLast('방금 선택을 되돌렸어요. 이 부분을 다시 살펴봐요.')}}
 function save(){if(editing==='line'){apply(draft);return}try{basicCheck(draft);const next=createDocument(draft);transition({doc:next,queue:feedbackSequence(next),index:0,aiBased:false},'수정한 가사를 처음부터 다시 살펴봐요.')}catch(e){setError(e instanceof Error?e.message:'가사를 확인해 주세요.')}}
 function edit(scope:'all'|'line'){setDraft(scope==='all'?documentText(doc):anchor?.text||'');setEditing(scope);setError('')}
 const example=(ex:FeedbackItem['examples'][number],i:number)=><article key={i}><span>{ex.label}</span><pre>{ex.text}</pre><button className="primary full" onClick={()=>apply(ex.text)}>적용하고 다음 부분 보기 →</button></article>;
 return <>
 <div className="sequence-heading"><div><strong>앞에서부터 한 부분씩</strong><p>예시를 적용하거나 내 표현을 유지하면 바로 다음 부분으로 이어져요.</p></div><span>{Math.min(index,queue.length)} / {queue.length} 부분 살펴봄</span></div>
 {queue.length>0&&<progress className="sequence-progress" aria-label="피드백 진행" value={index} max={queue.length}/>}
 {last&&<p className="sequence-status" role="status">{last}</p>}
 <div className="annotation-layout"><section className="lyric-paper" aria-label="내 가사"><div className="paper-heading"><div>내 가사<small>{editing==='all'?'내용과 줄바꿈을 자유롭게 고치세요.':t?`${line}행을 함께 보고 있어요.`:'내가 선택한 표현이 모두 반영돼 있어요.'}</small></div>{!editing&&<button className="quiet" onClick={()=>edit('all')}>전체 가사 수정</button>}</div>
 {editing==='all'?<><label className="field-label" htmlFor="review-draft">전체 가사 수정</label><textarea autoFocus id="review-draft" value={draft} maxLength={3000} onChange={e=>setDraft(e.target.value)}/><div className="editor-actions"><button onClick={()=>{setEditing(null);setError('')}}>취소</button><button className="primary" onClick={save}>수정 저장</button></div></>:doc.rows.map((entry,i)=><div className={'annotated-line '+(entry.id===t?.rowId?'selected-line':'')} key={entry.id}><span className="line-number">{i+1}</span><div className="line-body"><p>{entry.text||'\u00a0'}</p>{entry.id===t?.rowId&&<><small className="syllable-count">{(entry.text.match(/[가-힣]/g)||[]).length}음절</small><span className="row-marker">지금 살펴볼 부분</span></>}</div></div>)}</section>
 <section className="feedback-note" aria-label="순서대로 가사 피드백">
 {error&&<p role="alert" className="warning">{error}</p>}
 {editing==='all'?<div className="editor-help"><h4>전체 가사를 수정하고 있어요.</h4><p>‘수정 저장’을 누르면 새 가사의 앞부분부터 다시 살펴봐요.</p></div>:editing==='line'?<><span className="note-kicker">{line}행 수정</span><label className="field-label" htmlFor="line-draft">내 말로 고치기</label><textarea autoFocus id="line-draft" value={draft} maxLength={3000} onChange={e=>setDraft(e.target.value)}/><p className="caption">이 부분만 바뀌어요. 저장하면 다음 부분으로 이어져요.</p><div className="editor-actions"><button onClick={()=>{setEditing(null);setError('')}}>취소</button><button className="primary" onClick={save}>저장하고 다음 부분 보기 →</button></div></>:t?<><span className="note-kicker">{index+1}번째 피드백 · 현재 {line}행</span><h4>이 부분을 함께 고쳐 볼까요?</h4><blockquote>{anchor?.text}</blockquote><p className="specific-advice">{t.why}</p>{t.examples.length>0?<><h5 className="example-heading">원래 뜻을 살린 예시</h5><div className="example-options">{example(t.examples[0],0)}{t.examples.length>1&&<details><summary>다른 예시 보기</summary>{t.examples.slice(1).map((ex,i)=>example(ex,i+1))}</details>}</div><button className="text-action" onClick={()=>edit('line')}>예시 대신 내 말로 고치기</button></>:<><p className="caption">내가 읽은 장면과 마음은 내가 가장 잘 알아요. 생각을 직접 써 보세요.</p><button className="primary full" onClick={()=>edit('line')}>이 부분 내 말로 고치기</button></>}<button className="full keep-choice" onClick={keep}>원래 표현 유지하고 다음으로 →</button></>:<div className="sequence-complete"><span className="note-kicker">{queue.length?'준비된 피드백을 모두 살펴봤어요':state.aiBased?'AI가 제안한 행 수정은 없어요':'기본 점검에서 꼭 고칠 부분은 찾지 못했어요'}</span><h4>이제 내 목소리로 읽어 보세요.</h4><p>고친 표현이 내 마음과 맞나요? 원래 표현을 유지한 선택도 좋아요.</p><button className="primary full" onClick={onFinish}>이 가사로 완성하기 →</button><p className="caption">‘모두 살펴봄’은 가사가 완벽하다는 뜻은 아니에요.</p></div>}
 </section></div>
 {ai&&ai.factChecks.length>0&&<details className="warning"><summary>책과 함께 확인할 표현</summary>{ai.factChecks.map((s,i)=><p key={i}>{s}</p>)}</details>}
 <div className="review-bottom"><div><button disabled={!!editing} onClick={onBack}>← 가사 입력으로</button>{history.length>0&&<button disabled={!!editing} onClick={undo}>방금 선택 되돌리기</button>}</div>{t&&<button className="quiet" disabled={!!editing} onClick={onFinish}>여기까지 고치고 완성하기 →</button>}</div>
 <p className="review-footnote">{state.aiBased?'AI 제안':'기본 점검'}은 참고 의견이에요. 모든 부분을 바꿀 필요는 없고, 역사적 사실은 책과 확인해 주세요.</p>
 </>;
}
