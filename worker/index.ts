import {POST} from '../app/api/coach/route';
import {GET} from '../app/api/status/route';
import {runtime} from '../lib/runtime';
export default {async fetch(request:Request){
 const path=new URL(request.url).pathname,origin=request.headers.get('Origin'),allowed=runtime().APP_ORIGIN;
 const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'});
 if(allowed&&origin===allowed){headers.set('Access-Control-Allow-Origin',allowed);headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type')}
 if(request.method==='OPTIONS')return new Response(null,{status:origin===allowed?204:403,headers});
 let response:Response;
 if(path==='/api/status'&&request.method==='GET')response=await GET();
 else if(path==='/api/coach'&&request.method==='POST')response=await POST(request);
 else response=Response.json({error:'지원하지 않는 주소입니다.'},{status:404});
 for(const [k,v] of headers)response.headers.set(k,v);
 return response;
}};
