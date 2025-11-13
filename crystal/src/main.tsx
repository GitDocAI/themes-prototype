import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import React from 'react';
import { HashRouter } from 'react-router-dom'
// StrictMode is disabled to avoid TipTap flushSync warnings
// TipTap uses flushSync internally for custom node views which conflicts with React 18's StrictMode
// This is a known issue: https://github.com/ueberdosis/tiptap/issues/3764
const root=createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
