import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode is disabled to avoid TipTap flushSync warnings
// TipTap uses flushSync internally for custom node views which conflicts with React 18's StrictMode
// This is a known issue: https://github.com/ueberdosis/tiptap/issues/3764
createRoot(document.getElementById('root')!).render(<App />)
