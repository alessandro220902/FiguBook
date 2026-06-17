import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Ripristina la route salvata dal fallback SPA (public/404.html)
const _p = new URLSearchParams(location.search).get('p')
if (_p !== null) {
  history.replaceState(null, '', '/FiguBook/app/' + _p)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/FiguBook/app">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
