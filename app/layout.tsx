import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'소안도의 노래 — AI 작사 코치',description:'역사를 기억하고, 우리의 마음을 노래하다.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
