import { env } from 'cloudflare:workers';
export const runtime=()=>env as unknown as {APP_ORIGIN?:string;OPENAI_API_KEY?:string;OPENAI_MODEL?:string;STUDENT_AI_ENABLED?:string;ZDR_VERIFIED?:string;POLICY_REVIEWED?:string;CLASSROOM_CODE?:string;DAILY_REQUEST_LIMIT?:string;DB?:D1Database};
export const enabled=()=>{const e=runtime();return !!(e.OPENAI_API_KEY&&e.STUDENT_AI_ENABLED==='true'&&e.ZDR_VERIFIED==='true'&&e.POLICY_REVIEWED==='true'&&e.CLASSROOM_CODE&&e.DB)};
export function corsHeaders(){const h:Record<string,string>={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};const origin=runtime().APP_ORIGIN;if(origin){h['Access-Control-Allow-Origin']=origin;h['Access-Control-Allow-Methods']='GET, POST, OPTIONS';h['Access-Control-Allow-Headers']='Content-Type'}return h}
export function reply(body:unknown,status=200){return Response.json(body,{status,headers:corsHeaders()})}
