'use client';
import {useState} from 'react';
import type {Evaluation} from '@/lib/coach';
import {basicCheck,type QuickTip} from '@/lib/basic-check';
import {createDocument,documentText,replaceRow,type LyricDocument} from '@/lib/lyric-document';
type Kind='form'|'content'|'rhythm';
const kinds:Kind[]=['form','content','rhythm'];
const names={form:'줄 나누기',content:'마음 전하기',rhythm:'부르기 좋게'};
export function AnnotatedReview({text,tips,result,scores,onApply,onRecheck,onEdit}:{text:string;tips:Record<Kind,QuickTip>;result:Evaluation;scores:number[];onApply:(text:string)=>boolean;onRecheck:(text:string)=>boolean;onEdit:()=>void}){
 const [selected,setSelected]=useState<Kind>(tips.form.keep?tips.content.keep?'rhythm':'content':'form');
 const [doc,setDoc]=useState(()=>createDocument(text));
 const [history,setHistory]=useState<LyricDocument[]>([]);
 const [applied,setApplied]=useState<{before:string;after:string;ids:string[];kind:Kind}|null>(null),[error,setError]=useState('');
 const checked=basicCheck(documentText(doc));
 const currentTips=checked.tips;
 const t=currentTips[selected],rows=doc.rows;
 const selectedIds=applied&&applied.kind===selected?applied.ids:[rows[t.line-1]?.id];
 const switchKind=(kind:Kind)=>{setSelected(kind);setApplied(null);setError('')};
 const splits=(line:string)=>{const words=line.split(/\s+/);return [...new Set([Math.floor(words.length/2),Math.ceil(words.length/3)])].filter(n=>n>0&&n<words.length).map(n=>words.slice(0,n).join(' ')+'\n'+words.slice(n).join(' '))};
 let examples:{text:string;apply?:string;label:string}[]=[];
 if(!t.keep&&selected==='form')examples=(t.quote.match(/[가-힣]/g)||[]).length>24?splits(t.quote).map((s,i)=>({text:s,apply:s,label:i===0?'두 줄로 나누기':'다른 곳에서 나누기'})):[{text:'(앞의 가사)\n\n'+t.quote,apply:'\n'+t.quote,label:'빈 줄로 연 나누기'}];
 if(!t.keep&&selected==='rhythm'){
  if(t.rhythmIssue==='long'||t.rhythmIssue==='imbalance'){const shorter=t.quote.replace(/오래오래/g,'오래').replace(/언제나 항상|항상 언제나/g,'언제나').replace(/너무나도/g,'참');if(shorter!==t.quote)examples.push({text:shorter,apply:shorter,label:'긴 표현 덜어내기'});examples.push(...splits(t.quote).slice(0,1).map(s=>({text:s,apply:s,label:'숨 쉬는 곳 나누기'})));}
  else examples=[{text:t.quote+'\n'+t.quote,apply:t.quote+'\n'+t.quote,label:'같은 행 반복하기'},{text:'(다른 가사들)\n\n'+t.quote,label:'마지막 후렴으로 한 번 더'}];
 }
 if(!t.keep&&selected==='content')examples=[{text:t.example.replace(/^예: /,''),label:'표현 예시'},{text:checked.result.content.quote.includes('소안도')?'나는 [내가 느낀 마음]을 노래해요':'소안도의 [기억에 남은 모습]을 노래해요',label:'내 생각으로 채우기'}];
 function apply(value:string){try{
  const anchor=rows[t.line-1];
  const change=replaceRow(doc,anchor.id,t.quote,value);
  if(onApply(documentText(change.document))){setHistory(h=>[...h,doc]);setDoc(change.document);setApplied({before:anchor.text,after:value,ids:change.ids,kind:selected});setError('')}
 }catch(e){setError(e instanceof Error?e.message:'다시 점검해 주세요.')}}
 function undo(){const previous=history.at(-1);if(previous&&onApply(documentText(previous))){setDoc(previous);setHistory(h=>h.slice(0,-1));setApplied(null);setError('')}}
 return <><div className="review-legend"><span><i className="edit-key"/>다듬어 볼 행</span><span><i className="keep-key"/>살릴 행</span><span>표시를 눌러 보세요</span></div><div className="annotation-layout"><section className="lyric-paper" aria-label="내 가사와 첨삭 표시"><div className="paper-heading">내가 쓴 가사 <span>표시와 원문을 함께 살펴봐요</span></div>{rows.map((entry,i)=>{const row=entry.text;const targets=kinds.filter(k=>currentTips[k].line===i+1);return <div className={'annotated-line '+(selectedIds.includes(entry.id)?'selected-line':'')+(targets.some(k=>!currentTips[k].keep)?' needs-edit':'')} key={entry.id}><span className="line-number">{i+1}</span><div className="line-body"><p>{row||'\u00a0'}</p>{selected==='rhythm'&&row.trim()&&<small className="syllable-count">{(row.match(/[가-힣]/g)||[]).length}음절</small>}{targets.length>0&&<div className="line-tags">{targets.map(k=><button key={k} className={currentTips[k].keep?'keep-tag':'edit-tag'} aria-pressed={selected===k} onClick={()=>switchKind(k)}>{kinds.indexOf(k)+1} · {names[k]}{currentTips[k].keep?' ✓':''}</button>)}</div>}</div></div>})}</section><section className="feedback-note" aria-label="선택한 행 피드백"><div className="feedback-switch" role="group" aria-label="피드백 선택">{kinds.map((k,i)=><button key={k} aria-pressed={selected===k} onClick={()=>switchKind(k)}>{i+1} {names[k]}</button>)}</div>{error&&<p role="alert" className="warning">{error}</p>}{applied?<div className="applied-note"><h4>선택한 부분을 반영했어요.</h4><p>다른 피드백도 눌러서 계속 살펴보세요.</p><span>고치기 전</span><pre>{applied.before}</pre><span>고친 뒤</span><pre>{applied.after}</pre><button onClick={undo}>마지막 수정 되돌리기</button><button className="primary full" onClick={()=>{onRecheck(documentText(doc))}}>수정한 가사 다시 점검</button></div>:<><span className="note-kicker">{t.line}행 · {t.keep?'이 표현을 살려요':'여기를 다듬어 봐요'}</span><h4>{t.action}</h4><blockquote>{t.quote}</blockquote>{t.keep?<div className="keep-message">이 부분은 그대로 두어도 좋아요.<br/>마음에 맞는 표현인지 읽어 보세요.</div>:examples.length?<div className="example-options">{examples.map((ex,i)=><article key={i}><span>예시 {i+1} · {ex.label}</span><pre>{ex.text}</pre>{ex.apply!==undefined?<button onClick={()=>apply(ex.apply!)}>이 예시로 고치기</button>:<small>내 마음에 맞게 바꿔 써 보세요.</small>}</article>)}</div>:<p>숨을 쉬는 곳에 줄바꿈을 넣어 보세요.</p>}{selected==='rhythm'&&<p className="rhythm-hint">음절 수는 가사 왼쪽에 표시했어요. 모두 같게 맞출 필요는 없어요.</p>}</>}<button className="primary full" onClick={onEdit}>내가 직접 고치기</button>{!applied&&history.length>0&&<button onClick={undo}>마지막 수정 되돌리기</button>}{!applied&&<details className="check-details"><summary>점검 기준 · 기본 지표 {checked.scores[kinds.indexOf(selected)]}/100</summary><p>{checked.result[selected].explanation}</p></details>}</section></div><p className="review-footnote">표시는 참고 의견이에요. 내 표현을 선택하세요. 역사적 사실은 책과 확인해 주세요.</p></>;
}
