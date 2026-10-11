import type {Evaluation} from './coach';
import type {LyricDocument} from './lyric-document';
export type FeedbackItem={rowId:string;quote:string;why:string;examples:{text:string;label:string}[]};
const count=(s:string)=>(s.match(/[가-힣]/g)||[]).length;
// Replace only a whitespace boundary. Every original word stays in the same order.
export function singingSplits(line:string){
 const spaces=[...line.matchAll(/[ \t]+/g)].filter(m=>m.index!>0&&m.index!+m[0].length<line.length);
 const clause=(m:RegExpMatchArray)=>/하며|지만|위해|마음을|기억하고|노래하며|않고|지키고/.test(line.slice(Math.max(0,m.index!-7),m.index));
 const ranked=spaces.sort((a,b)=>{
  const score=(m:RegExpMatchArray)=>Math.abs(count(line.slice(0,m.index))/Math.max(1,count(line))-.5)-(clause(m)?.12:0);
  return score(a)-score(b);
 });
 return ranked.slice(0,2).map(m=>line.slice(0,m.index)+'\n'+line.slice(m.index!+m[0].length));
}
export function feedbackSequence(doc:LyricDocument,ai?:Evaluation):FeedbackItem[]{
 const rows=doc.rows.filter(r=>r.text.trim());
 if(ai){
  const items:FeedbackItem[]=[];const used=new Set<string>();
  for(const change of ai.changes){if(!change.before||change.before.includes('\n'))continue;const row=rows.find(r=>!used.has(r.id)&&r.text.includes(change.before));if(!row)continue;used.add(row.id);items.push({rowId:row.id,quote:row.text,why:change.reason,examples:[{text:row.text.replace(change.before,change.after),label:'내 표현을 살린 수정 예시'}]})}
  return items.sort((a,b)=>doc.rows.findIndex(r=>r.id===a.rowId)-doc.rows.findIndex(r=>r.id===b.rowId));
 }
 const counts=rows.map(r=>count(r.text)).filter(Boolean).sort((a,b)=>a-b),median=counts[Math.floor(counts.length/2)]||0;
 const theme=rows.some(r=>/소안도|항일|독립|자유|나라|희생|기억|감사|고맙|존경/.test(r.text));
 const feeling=rows.some(r=>/마음|생각|느꼈|잊지|기억|감사|고맙|존경|슬프|다짐/.test(r.text));
 const items:FeedbackItem[]=[];
 for(const row of rows){
  const n=count(row.text),examples:FeedbackItem['examples']=[];let why='';
  if(n>24||(n>=median*1.6&&n-median>=6)){
   why=n>24?`이 행은 ${n}음절로 길어요. 뜻이 이어지는 곳에서 숨을 쉬도록 두 줄로 나눠 봐요.`:`이 행은 ${n}음절이고, 다른 행은 보통 ${median}음절이에요. 모두 같게 맞추기보다 숨 쉬는 곳을 나눠 봐요.`;
   examples.push(...singingSplits(row.text).map(text=>({text,label:'말의 뜻을 이어서 두 줄로 나누기'})));
   const shorter=row.text.replace(/오래오래/g,'오래').replace(/언제나 항상|항상 언제나/g,'언제나').replace(/너무나도/g,'참');
   if(shorter!==row.text)examples.push({text:shorter,label:'겹치는 강조 표현 줄이기'});
  }else if(/그 마음|그것|그때/.test(row.text)){
   why=`‘${row.text.match(/그 마음|그것|그때/)![0]}’이 무엇을 가리키는지 앞 행과 함께 읽어 봐요. 잘 드러나지 않으면 책에서 내가 기억한 모습을 내 말로 덧붙여요.`;
  }
  if(why)items.push({rowId:row.id,quote:row.text,why,examples});
 }
 if(rows.length&&(!theme||!feeling)){
  const row=rows[0];const item=items.find(i=>i.rowId===row.id);
  const why=!theme?'첫 부분에 소안도와의 연결이 드러나는지 살펴봐요. 책에서 내가 기억한 모습이나 읽고 느낀 마음을 한 줄로 덧붙여요.':'읽고 느낀 내 마음을 한 줄 더 담아 봐요. 왜 고맙거나 기억하고 싶은지 내 이유를 써요.';
  if(item)item.why+=' '+why;else items.push({rowId:row.id,quote:row.text,why,examples:[]});
 }
 const last=rows.at(-1);
 if(last&&rows.length>=3&&!items.some(i=>i.rowId===last.id)&&!rows.some((r,i)=>rows.findIndex(x=>x.text===r.text)<i))items.push({rowId:last.id,quote:last.text,why:'이 마지막 행을 한 번 더 부르면 중심 마음이 기억에 남을 수 있어요. 반복이 어울리는지 소리 내어 읽고 선택해요.',examples:[{text:last.text+'\n'+last.text,label:'마지막 행을 후렴처럼 반복하기'}]});
 return items.sort((a,b)=>doc.rows.findIndex(r=>r.id===a.rowId)-doc.rows.findIndex(r=>r.id===b.rowId));
}
