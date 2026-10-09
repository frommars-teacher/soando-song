export type LyricRow={id:string;text:string};
export type LyricDocument={rows:LyricRow[];nextId:number};
export function createDocument(text:string):LyricDocument {
 return {rows:text.split('\n').map((text,i)=>({id:String(i+1),text})),nextId:text.split('\n').length+1};
}
export function documentText(doc:LyricDocument){return doc.rows.map(r=>r.text).join('\n')}
export function replaceRow(doc:LyricDocument,id:string,expected:string,replacement:string){
 const at=doc.rows.findIndex(r=>r.id===id);
 if(at<0||doc.rows[at].text.trim()!==expected)throw new Error('수정할 행이 달라졌어요. 다시 선택해 주세요.');
 if(!replacement.trim())throw new Error('예시로 원래 행을 지울 수는 없어요.');
 let nextId=doc.nextId;
 const inserted=replacement.split('\n').map((text,i)=>({id:i===0?id:String(nextId++),text}));
 const next={rows:[...doc.rows.slice(0,at),...inserted,...doc.rows.slice(at+1)],nextId};
 if(documentText(next).length>3000)throw new Error('적용하면 3,000자를 넘어요. 직접 짧게 고쳐 주세요.');
 return {document:next,ids:inserted.map(r=>r.id)};
}
