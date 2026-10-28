import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initRenderPulse } from 'react-render-pulse';
import './index.css';
import App from './App.tsx';

// Anonymous render timings from real visitors, shown in the Performance section.
// Only the production site sends them; dev and preview builds log to the console.
const isProduction = ['itzamal.in', 'www.itzamal.in'].includes(
  location.hostname
);
initRenderPulse({
  endpoint: isProduction ? '/api/render-pulse' : undefined,
  // Vercel exposes the commit as VITE_VERCEL_GIT_COMMIT_SHA, so releases can be compared
  appVersion: import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
