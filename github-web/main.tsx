import React from 'react';
import {createRoot} from 'react-dom/client';
import Studio from '../app/page';
import Teacher from '../app/teacher/page';
import '../app/globals.css';
window.SOANDO_PAGES=true;
window.SOANDO_API_ORIGIN=import.meta.env.VITE_COACH_API_ORIGIN?.replace(/\/$/,'')||'';
const teacher=window.location.pathname.endsWith('teacher.html');
createRoot(document.getElementById('root')!).render(<React.StrictMode>{teacher?<Teacher/>:<Studio/>}</React.StrictMode>);
