import type {Evaluation} from './coach';
export type QuickTip={line:number;quote:string;action:string;example:string;keep:boolean};
export function basicCheck(text:string):{result:Evaluation;scores:number[];tips:Record<'form'|'content'|'rhythm',QuickTip>} {
 const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);
 if(!lines.length)throw new Error('가사를 먼저 써 주세요.');
 const syllables=lines.map(x=>(x.match(/[가-힣]/g)||[]).length);
 const stanzas=text.trim().split(/\n\s*\n/).length;
 const long=lines.find((_,i)=>syllables[i]>24)||'';
 const repeats=lines.filter((x,i)=>lines.indexOf(x)<i);
 const theme=lines.find(x=>/소안도|항일|독립|자유|나라|희생|기억|감사|고맙|존경/.test(x))||'';
 const feeling=lines.find(x=>/마음|느꼈|생각|잊지|기억|감사|고맙|존경|슬프|기쁘|다짐|지킬|노래/.test(x))||'';
 // These are disclosed mechanical indicators, not a measure of artistic quality.
 const form=(lines.length>=2?50:0)+(stanzas>=2?25:0)+(!long?25:0);
 const content=(theme?50:0)+(feeling?50:0);
 const rhythm=Math.round(syllables.filter(x=>x>=4&&x<=24).length/lines.length*75)+(repeats.length?25:0);
 const tip=(quote:string,action:string,example:string,keep=false):QuickTip=>({line:text.split('\n').findIndex(x=>x.trim()===quote)+1,quote,action,example,keep});
 const splitLine=(line:string)=>{const spaces=[...line.matchAll(/\s+/g)];const at=spaces.sort((a,b)=>Math.abs(a.index!-line.length/2)-Math.abs(b.index!-line.length/2))[0];return at?line.slice(0,at.index).trim()+'\n'+line.slice(at.index!+at[0].length).trim():''};
 const formQuote=long||lines[Math.floor(lines.length/2)]||lines[0];
 const formTip=long?tip(long,'이 행이 길어요. 숨 쉬는 곳에서 두 줄로 나눠 봐요.',splitLine(long)||'소리 내어 읽고, 뜻이 나뉘는 곳에 줄바꿈을 넣어 보세요.'):stanzas===1&&lines.length>1?tip(formQuote,'여기서 장면이나 마음이 바뀌나요? 그렇다면 앞에 빈 줄을 넣어 봐요.','(앞의 가사)\n\n'+formQuote):tip(lines[0],'줄 구분은 그대로 두어도 좋아요. 처음부터 끝까지 읽어 봐요.','',true);
 const contentQuote=theme||feeling||lines[0];
 const contentTip=!theme?tip(contentQuote,'이 행에 소안도와 어떤 관련이 있는지 담아 봐요.','예: 소안도의 바람을 기억해요'):!feeling?tip(contentQuote,'이 행 뒤에 내가 느낀 마음을 한 줄 덧붙여 봐요.','예: 그 마음을 오래 기억할게요'):tip(contentQuote,'주제와 마음을 나타내는 낱말이 있어요. 내 생각과 맞다면 살려 주세요.','',true);
 const rhythmQuote=repeats[0]||lines[syllables.indexOf(Math.max(...syllables))];
 const rhythmTip=long?tip(long,'불러 보며 긴 표현 한 군데를 짧게 바꿔 봐요.','예: 오래오래 기억하고 싶어요 → 오래 기억할게요'):repeats.length?tip(rhythmQuote,'반복한 행을 후렴으로 살려 보세요. 두 번 불러 봐요.','',true):tip(rhythmQuote,'기억에 남기고 싶은 행인가요? 마지막에 한 번 더 넣어 봐요.',rhythmQuote+'\n'+rhythmQuote);
 const tips={form:formTip,content:contentTip,rhythm:rhythmTip};
 const grade=(n:number):Evaluation['form']['grade']=>n>=75?'좋아요':n>=50?'조금 다듬어 봐요':'보완이 필요해요';
 return {scores:[form,content,rhythm],tips,result:{
 form:{grade:grade(form),strength:`${lines.length}행, ${stanzas}연으로 적었어요.`,improvement:long?'긴 행을 소리 내어 읽고, 숨을 쉬는 곳에서 나눌지 생각해 봐요.':stanzas===1?'마음이나 장면이 바뀌는 곳에 빈 줄을 넣을지 살펴봐요. 한 연도 괜찮아요.':'시작과 마지막이 자연스럽게 이어지는지 읽어 봐요.',quote:long||lines[0],explanation:'기본 지표: 2행 이상 50점 + 2연 이상 25점 + 한글 24음절을 넘는 행이 없으면 25점. 정해진 형식이나 정답은 아니에요.'},
 content:{grade:grade(content),strength:theme?'주제와 관련된 낱말이 보여요.':'자신의 표현으로 가사를 적었어요.',improvement:feeling?'책의 어떤 장면에서 이 마음이 들었는지 스스로 확인해 봐요.':'책을 읽고 느낀 마음이 드러나는 표현을 살펴봐요.',quote:theme||feeling||lines[0],explanation:'기본 지표: 소안도·항일·독립·자유·나라·희생·기억·감사·고마움·존경 관련 표현 50점 + 마음·감상 관련 표현 50점. 단어만 확인하므로 내용의 깊이, 역사적 정확성, 주제의 일관성은 판단하지 못해요.'},
 rhythm:{grade:grade(rhythm),strength:`행별 한글 음절 수는 ${syllables.length<=20?syllables.join(' · '):syllables.slice(0,20).join(' · ')+' … (앞 20행)'}개예요.`,improvement:repeats.length?'반복한 행이 후렴으로 잘 들리는지 불러 봐요.':'기억에 남기고 싶은 행을 후렴으로 반복할지 생각해 봐요. 반복이 꼭 필요하지는 않아요.',quote:long||repeats[0]||lines[0],explanation:'기본 지표: 한글 4~24음절인 행의 비율 × 75점 + 똑같이 반복한 행이 있으면 25점. 숫자·영어 발음, 멜로디와 실제 부르기 쉬운 정도는 계산하지 못해요.'},
 priority:long?formTip.action:!theme||!feeling?contentTip.action:'가사를 한 번 불러 보고, 바꾸고 싶은 행 하나만 골라 봐요.',
 revisedLyrics:text,changes:[],reasons:['기본 점검은 새 가사를 만들거나 문장을 자동으로 바꾸지 않아요.','원래 표현을 보면서 내가 직접 단어와 줄바꿈을 다듬어요.'],factChecks:['역사적 사실은 자동 확인하지 않았어요. 사건·인물·날짜 등의 표현은 책이나 선생님과 확인해 주세요.']}};
}
