declare global { interface Window { SOANDO_API_ORIGIN?:string; SOANDO_PAGES?:boolean } }
export function apiUrl(path:string){return (typeof window==='undefined'?'':window.SOANDO_API_ORIGIN||'')+path}
export function teacherUrl(){return typeof window!=='undefined'&&window.SOANDO_PAGES?'./teacher.html':'/teacher'}
